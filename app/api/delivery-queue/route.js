import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../lib/firebase-admin';

// ── Auth helper ───────────────────────────────────────────────────────────────
async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid authorization token');
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    throw new Error('Unauthorized: Token verification failed');
  }
}

// ── GET /api/delivery-queue?date=YYYY-MM-DD ───────────────────────────────────
// Returns the authenticated agent's queue for the given date, PLUS all pending
// items from any prior date (carry-forward logic).
// Also supports ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD for historical views.
export async function GET(req) {
  try {
    const decoded = await authenticate(req);
    const agentUid = decoded.uid;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Fetch all items for this agent
    const snapshot = await adminDb
      .collection('deliveryQueue')
      .where('agentUid', '==', agentUid)
      .get();

    const items = [];
    snapshot.docs.forEach((doc) => {
      const d = doc.data();
      const compDate = d.completedAt?.toDate ? d.completedAt.toDate() : (d.completedAt ? new Date(d.completedAt) : null);
      const compDateStr = compDate ? compDate.toISOString().slice(0, 10) : '';
      const isPending = d.status === 'pending';

      if (fromDate && toDate) {
        // Range query mode
        const isCompletedInRange = d.status === 'completed' && compDateStr >= fromDate && compDateStr <= toDate;
        if (isCompletedInRange || isPending) {
          items.push({
            id:              doc.id,
            agentUid:        d.agentUid,
            awbNumber:       d.awbNumber        || '',
            consignmentId:   d.consignmentId    || null,
            particulars:     d.particulars      || '',
            consigneeName:   d.consigneeName    || '',
            consigneeCity:   d.consigneeCity    || '',
            deliveryStatus:  d.deliveryStatus   || '',
            status:          d.status           || 'pending',
            dayDate:         d.dayDate          || '',
            addedAt:         d.addedAt?.toDate?.()?.toISOString() ?? d.addedAt ?? null,
            completedAt:     d.completedAt?.toDate?.()?.toISOString() ?? d.completedAt ?? null,
          });
        }
      } else {
        // Daily queue mode
        const targetDate = dateParam || new Date().toISOString().slice(0, 10);
        const isToday = d.dayDate === targetDate;
        const isCompletedToday = d.status === 'completed' && compDateStr === targetDate;

        if (isToday || isPending || isCompletedToday) {
          items.push({
            id:              doc.id,
            agentUid:        d.agentUid,
            awbNumber:       d.awbNumber        || '',
            consignmentId:   d.consignmentId    || null,
            particulars:     d.particulars      || '',
            consigneeName:   d.consigneeName    || '',
            consigneeCity:   d.consigneeCity    || '',
            deliveryStatus:  d.deliveryStatus   || '',
            status:          d.status           || 'pending',
            dayDate:         d.dayDate          || '',
            addedAt:         d.addedAt?.toDate?.()?.toISOString() ?? d.addedAt ?? null,
            completedAt:     d.completedAt?.toDate?.()?.toISOString() ?? d.completedAt ?? null,
          });
        }
      }
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    items.sort((a, b) => {
      const aIsCarry = a.dayDate !== todayStr;
      const bIsCarry = b.dayDate !== todayStr;

      // Priority 1: Carry-forward at the top
      if (aIsCarry && !bIsCarry) return -1;
      if (!aIsCarry && bIsCarry) return 1;

      if (aIsCarry && bIsCarry) {
        // Oldest carry-forward first
        const aTime = a.addedAt || a.dayDate || '';
        const bTime = b.addedAt || b.dayDate || '';
        return aTime.localeCompare(bTime);
      }

      // Priority 2: New consignments (oldest first - i.e. in order received/assigned)
      const aTime = a.addedAt || '';
      const bTime = b.addedAt || '';
      return aTime.localeCompare(bTime);
    });

    return NextResponse.json({ items, date: dateParam || new Date().toISOString().slice(0, 10) });

  } catch (err) {
    console.error('[API /delivery-queue GET] Error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}

// ── POST /api/delivery-queue ──────────────────────────────────────────────────
// Adds a new AWB to the agent's delivery queue.
// agentUid is sourced from the verified token — never from the request body.
export async function POST(req) {
  try {
    const decoded = await authenticate(req);
    const agentUid = decoded.uid;

    const body = await req.json();
    const { awbNumber, consignmentId, particulars, consigneeName, consigneeCity, deliveryStatus } = body;

    if (!awbNumber) {
      return NextResponse.json({ error: 'Missing required field: awbNumber' }, { status: 400 });
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // Prevent duplicate AWBs in the queue (pending or completed today)
    const existingSnap = await adminDb
      .collection('deliveryQueue')
      .where('agentUid', '==', agentUid)
      .where('awbNumber', '==', awbNumber)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: `AWB ${awbNumber} is already in your active queue.`, duplicate: true },
        { status: 409 }
      );
    }

    const docRef = await adminDb.collection('deliveryQueue').add({
      agentUid,
      awbNumber,
      consignmentId:  consignmentId  || null,
      particulars:    particulars    || awbNumber,
      consigneeName:  consigneeName  || '',
      consigneeCity:  consigneeCity  || '',
      deliveryStatus: deliveryStatus || '',
      status:         'pending',
      dayDate:        todayStr,
      addedAt:        admin.firestore.FieldValue.serverTimestamp(),
      completedAt:    null,
    });

    return NextResponse.json({
      id:          docRef.id,
      agentUid,
      awbNumber,
      consignmentId,
      particulars,
      consigneeName,
      consigneeCity,
      deliveryStatus,
      status:      'pending',
      dayDate:     todayStr,
    }, { status: 201 });

  } catch (err) {
    console.error('[API /delivery-queue POST] Error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
