import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';

async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
}

// PUT /api/cash-register/[id]
export async function PUT(req, { params }) {
  try {
    await authenticate(req);
    const { amount, notes } = await req.json();
    await adminDb.collection('cashRegister').doc(params.id).update({
      amount: Number(amount),
      notes: notes?.trim() || '',
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/cash-register/[id]
export async function DELETE(req, { params }) {
  try {
    await authenticate(req);
    await adminDb.collection('cashRegister').doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
