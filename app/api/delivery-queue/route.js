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
export async function GET(req) {
  try {
    const decoded = await authenticate(req);
    const agentUid = decoded.uid;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    // Fetch all pending items (carry-forward) + all items for today
    // We query where agentUid matches, then filter client-side:
    // - items with status 'pending' (regardless of dayDate) ← carry-forward
    // - items with dayDate == dateParam (includes completed ones for today's view)
    // Fetch all items for this agent — sort in-process (avoids composite index requirement)
    const snapshot = await adminDb
      .collection('deliveryQueue')
      .where('agentUid', '==', agentUid)
      .get();

    const items = [];
    snapshot.docs.forEach((doc) => {
      const d = doc.data();
      const isPending   = d.status === 'pending';
      const isToday     = d.dayDate === dateParam;
      // Include if: belongs to today OR is a pending carry-forward from any past day
      if (isToday || isPending) {
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
    });

    // Sort in-process by addedAt descending (newest first)
    items.sort((a, b) => {
      const aTime = a.addedAt || '';
      const bTime = b.addedAt || '';
      return bTime.localeCompare(aTime);
    });

    return NextResponse.json({ items, date: dateParam });

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
