import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../lib/firebase-admin';

async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
}

// GET /api/cash-register?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
export async function GET(req) {
  try {
    await authenticate(req);
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    let ref = adminDb.collection('cashRegister');

    if (fromDate) {
      const start = new Date(fromDate); start.setHours(0, 0, 0, 0);
      ref = ref.where('date', '>=', admin.firestore.Timestamp.fromDate(start));
    }
    if (toDate) {
      const end = new Date(toDate); end.setHours(23, 59, 59, 999);
      ref = ref.where('date', '<=', admin.firestore.Timestamp.fromDate(end));
    }

    ref = ref.orderBy('date', 'asc');
    const snap = await ref.get();
    const items = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id, ...d,
        date: d.date?.toDate ? d.date.toDate().toISOString() : d.date,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
      };
    });
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}

// POST /api/cash-register
export async function POST(req) {
  try {
    const decoded = await authenticate(req);
    const { date, type, amount, notes } = await req.json();
    if (!date || !type || amount === undefined)
      return NextResponse.json({ error: 'Missing required fields: date, type, amount' }, { status: 400 });

    const dateObj = new Date(date); dateObj.setHours(type === 'opening' ? 8 : 20, 0, 0, 0);
    const docRef = await adminDb.collection('cashRegister').add({
      date: admin.firestore.Timestamp.fromDate(dateObj),
      dateString: date.slice(0, 10),
      type, // 'opening' | 'closing'
      amount: Number(amount),
      notes: notes?.trim() || '',
      createdBy: decoded.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: docRef.id, success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}
