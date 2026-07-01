import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../../lib/firebase-admin';

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

// ── PATCH /api/delivery-queue/[id] ────────────────────────────────────────────
// action: 'complete' → marks the AWB as delivered, credits ₹20 to agent's ledger
// action: 'delete'   → removes the item (only if still pending)
export async function PATCH(req, { params }) {
  try {
    const decoded = await authenticate(req);
    const agentUid = decoded.uid;

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    if (!action || !['complete', 'delete', 'undo'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "complete", "delete", or "undo".' }, { status: 400 });
    }

    // Fetch the queue document
    const queueRef = adminDb.collection('deliveryQueue').doc(id);
    const queueDoc = await queueRef.get();

    if (!queueDoc.exists) {
      return NextResponse.json({ error: 'Queue item not found.' }, { status: 404 });
    }

    const queueData = queueDoc.data();

    // Strict ownership check — agent can only mutate their own items
    if (queueData.agentUid !== agentUid) {
      return NextResponse.json({ error: 'Forbidden: This queue item belongs to another agent.' }, { status: 403 });
    }

    if (action === 'delete') {
      if (queueData.status === 'completed') {
        return NextResponse.json({ error: 'Cannot delete a completed delivery.' }, { status: 400 });
      }
      await queueRef.delete();
      return NextResponse.json({ success: true, action: 'deleted', id });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const DELIVERY_FEE = 20; // ₹20 per delivery

    if (action === 'undo') {
      if (queueData.status !== 'completed') {
        return NextResponse.json({ error: 'This item is not completed.' }, { status: 400 });
      }

      // Run as a Firestore transaction for atomicity
      await adminDb.runTransaction(async (tx) => {
        // 1. Revert the queue item to pending
        tx.update(queueRef, {
          status:      'pending',
          completedAt: null,
        });

        // 2. Revert the linked consignment's deliveryStatus to 'Out of Delivery'
        if (queueData.consignmentId) {
          const consRef = adminDb.collection('consignments').doc(queueData.consignmentId);
          tx.update(consRef, {
            deliveryStatus: 'Out of Delivery',
            deliveredDate:  null,
          });
        }

        // 3. Decrement the agentPayments ledger entry for today
        const payRef = adminDb
          .collection('agentPayments')
          .doc(`${agentUid}_${todayStr}`);

        tx.set(payRef, {
          agentUid,
          date:           todayStr,
          totalAmount:    admin.firestore.FieldValue.increment(-DELIVERY_FEE),
          deliveredCount: admin.firestore.FieldValue.increment(-1),
          updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      return NextResponse.json({
        success:       true,
        action:        'undo',
        id,
        feeSubtracted: DELIVERY_FEE,
      });
    }

    if (action === 'complete') {
      if (queueData.status === 'completed') {
        return NextResponse.json({ error: 'This item is already marked as completed.' }, { status: 409 });
      }

      // Run as a Firestore transaction for atomicity
      await adminDb.runTransaction(async (tx) => {
        // 1. Mark the queue item as completed
        tx.update(queueRef, {
          status:      'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Also update the linked consignment's deliveryStatus if consignmentId exists
        if (queueData.consignmentId) {
          const consRef = adminDb.collection('consignments').doc(queueData.consignmentId);
          tx.update(consRef, {
            deliveryStatus: 'Delivered',
            deliveredDate:  admin.firestore.Timestamp.fromDate(new Date()),
          });
        }

        // 3. Upsert the agentPayments ledger entry for today
        const payRef = adminDb
          .collection('agentPayments')
          .doc(`${agentUid}_${todayStr}`);

        tx.set(payRef, {
          agentUid,
          date:           todayStr,
          totalAmount:    admin.firestore.FieldValue.increment(DELIVERY_FEE),
          deliveredCount: admin.firestore.FieldValue.increment(1),
          updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      return NextResponse.json({
        success:     true,
        action:      'completed',
        id,
        feeAdded:    DELIVERY_FEE,
      });
    }

  } catch (err) {
    console.error('[API /delivery-queue/[id] PATCH] Error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}

// ── GET /api/delivery-queue/[id] ──────────────────────────────────────────────
// Returns a single queue item (for polling/refresh use if needed).
export async function GET(req, { params }) {
  try {
    const decoded = await authenticate(req);
    const agentUid = decoded.uid;
    const { id } = params;

    const queueDoc = await adminDb.collection('deliveryQueue').doc(id).get();
    if (!queueDoc.exists) {
      return NextResponse.json({ error: 'Queue item not found.' }, { status: 404 });
    }
    const d = queueDoc.data();
    if (d.agentUid !== agentUid) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    return NextResponse.json({ id: queueDoc.id, ...d });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
