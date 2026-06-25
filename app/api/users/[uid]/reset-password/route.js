import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../../lib/firebase-admin';

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

// ── POST /api/users/[uid]/reset-password ─────────────────────────────────────
// Super Admin sets a new password for any user without needing the old one.
export async function POST(req, { params }) {
  try {
    const auth = await authenticate(req);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { uid } = params;
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Firebase Admin can update any user's password without their current one
    await adminAuth.updateUser(uid, { password: newPassword });

    return NextResponse.json({ success: true, uid });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('[API /users/[uid]/reset-password POST] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
