import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';

async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
}

// PUT /api/expenses/[id]
export async function PUT(req, { params }) {
  try {
    await authenticate(req);
    const { particulars, category, amount, notes } = await req.json();
    await adminDb.collection('expenses').doc(params.id).update({
      particulars: particulars?.trim(),
      category,
      amount: Number(amount),
      notes: notes?.trim() || '',
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(req, { params }) {
  try {
    await authenticate(req);
    await adminDb.collection('expenses').doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
