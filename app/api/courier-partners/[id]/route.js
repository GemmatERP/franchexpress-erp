import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';

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

// DELETE /api/courier-partners/[id]
export async function DELETE(req, { params }) {
  try {
    await authenticate(req);
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    await adminDb.collection('courier_partners').doc(id).delete();
    return NextResponse.json({ deleted: true, id });
  } catch (err) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

