import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../lib/firebase-admin';

async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = authHeader.split('Bearer ')[1];
  return await adminAuth.verifyIdToken(token);
}

// GET /api/expenses?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&category=...
export async function GET(req) {
  try {
    await authenticate(req);
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const category = searchParams.get('category');

    let ref = adminDb.collection('expenses');

    if (fromDate) {
      const start = new Date(fromDate); start.setHours(0, 0, 0, 0);
      ref = ref.where('date', '>=', admin.firestore.Timestamp.fromDate(start));
    }
    if (toDate) {
      const end = new Date(toDate); end.setHours(23, 59, 59, 999);
      ref = ref.where('date', '<=', admin.firestore.Timestamp.fromDate(end));
    }
    if (category && category !== 'All') ref = ref.where('category', '==', category);

    ref = ref.orderBy('date', 'asc');
    const snap = await ref.get();
    const items = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id, ...d,
        entryType: d.entryType || 'DR',
        paymentMode: d.paymentMode || 'Cash',
        bankName: d.bankName || null,
        date: d.date?.toDate ? d.date.toDate().toISOString() : d.date,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
      };
    });
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}

// POST /api/expenses
export async function POST(req) {
  try {
    const decoded = await authenticate(req);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userDoc.exists ? (userDoc.data().role || 'delivery') : 'delivery';
    if (role !== 'admin' && role !== 'super_admin' && role !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized: Admin or Employee role required' }, { status: 403 });
    }

    const { date, particulars, category, amount, notes, entryType, paymentMode, bankName, agentUid, isDeliveryPayment } = await req.json();
    if (!date || !particulars || amount === undefined)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const dateObj = new Date(date); dateObj.setHours(12, 0, 0, 0);

    if (isDeliveryPayment === true && agentUid) {
      // Find all completed unpaid deliveryQueue items for this agent
      const queueQuery = adminDb.collection('deliveryQueue')
        .where('agentUid', '==', agentUid)
        .where('status', '==', 'completed');
      
      const queueSnap = await queueQuery.get();
      const unpaidDocs = queueSnap.docs.filter(doc => doc.data().isPaid !== true);

      // Perform all-or-nothing batch commit
      const batch = adminDb.batch();
      const expenseRef = adminDb.collection('expenses').doc();
      
      batch.set(expenseRef, {
        date: admin.firestore.Timestamp.fromDate(dateObj),
        dateString: date.slice(0, 10),
        particulars: particulars.trim(),
        category: category || 'Miscellaneous',
        amount: Number(amount),
        entryType: entryType || 'DR',
        paymentMode: paymentMode || 'Cash',
        bankName: paymentMode === 'Bank' ? (bankName || 'Axis Bank') : null,
        notes: notes?.trim() || '',
        createdBy: decoded.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        agentUid,
        isDeliveryPayment: true
      });

      unpaidDocs.forEach(doc => {
        batch.update(doc.ref, {
          isPaid: true,
          expenseId: expenseRef.id,
          paidAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
      return NextResponse.json({ id: expenseRef.id, success: true }, { status: 201 });
    }

    const docRef = await adminDb.collection('expenses').add({
      date: admin.firestore.Timestamp.fromDate(dateObj),
      dateString: date.slice(0, 10),
      particulars: particulars.trim(),
      category: category || 'Miscellaneous',
      amount: Number(amount),
      entryType: entryType || 'DR', // 'DR' or 'CR'
      paymentMode: paymentMode || 'Cash',
      bankName: paymentMode === 'Bank' ? (bankName || 'Axis Bank') : null,
      notes: notes?.trim() || '',
      createdBy: decoded.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: docRef.id, success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}
