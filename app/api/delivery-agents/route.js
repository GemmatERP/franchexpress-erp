import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

// ── Auth helper ───────────────────────────────────────────────────────────────
async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userDoc.exists ? (userDoc.data().role || 'employee') : 'employee';
    return { uid: decoded.uid, role };
  } catch {
    return null;
  }
}

// ── GET /api/delivery-agents — List all delivery agents and aggregate stats ───
export async function GET(req) {
  try {
    const auth = await authenticate(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'super_admin' && auth.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Employee access required' }, { status: 403 });
    }

    // 1. Fetch all users with role 'delivery'
    const usersSnapshot = await adminDb.collection('users')
      .where('role', '==', 'delivery')
      .get();

    const agents = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'delivery',
      };
    });

    // 2. Fetch all queue items to aggregate metrics
    const queueSnapshot = await adminDb.collection('deliveryQueue').get();
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const DELIVERY_FEE = 20;

    // Map to hold aggregated metrics for each agent
    const metricsMap = {};
    agents.forEach(agent => {
      metricsMap[agent.uid] = {
        uid: agent.uid,
        name: agent.name,
        email: agent.email,
        deliveredCount: 0,
        notDeliveredCount: 0,
        earnedToday: 0,
        toBePaidToday: 0,
        pendingPrevious: 0,
      };
    });

    queueSnapshot.docs.forEach(doc => {
      const d = doc.data();
      const agentId = d.agentUid;
      if (!agentId || !metricsMap[agentId]) return;

      const isPending = d.status === 'pending';
      
      let compDate = null;
      if (d.completedAt) {
        try {
          compDate = d.completedAt.toDate ? d.completedAt.toDate() : new Date(d.completedAt);
        } catch (e) {
          // ignore invalid date
        }
      }
      const compDateStr = compDate ? compDate.toISOString().slice(0, 10) : '';

      if (isPending) {
        metricsMap[agentId].notDeliveredCount += 1;
      } else if (d.status === 'completed') {
        if (compDateStr === todayStr) {
          metricsMap[agentId].deliveredCount += 1;
          metricsMap[agentId].earnedToday += DELIVERY_FEE;
          if (d.isPaid !== true) {
            metricsMap[agentId].toBePaidToday += DELIVERY_FEE;
          }
        } else if (compDateStr && compDateStr < todayStr) {
          if (d.isPaid !== true) {
            metricsMap[agentId].pendingPrevious += DELIVERY_FEE;
          }
        }
      }
    });

    const result = Object.values(metricsMap);
    return NextResponse.json({ agents: result, total: result.length });

  } catch (error) {
    console.error('[API /delivery-agents GET] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
