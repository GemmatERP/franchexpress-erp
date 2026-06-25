import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';

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

// ── PATCH /api/users/[uid] — Update user name and/or role ────────────────────
export async function PATCH(req, { params }) {
  try {
    const auth = await authenticate(req);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { uid } = params;
    const body = await req.json();
    const { name, role } = body;

    // Prevent editing own account to a lower role
    if (uid === auth.uid && role && role !== 'super_admin') {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    const allowedRoles = ['admin', 'employee', 'delivery', 'super_admin'];
    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` }, { status: 400 });
    }

    // Update Firebase Auth display name if name provided
    const authUpdate = {};
    if (name) authUpdate.displayName = name;
    if (Object.keys(authUpdate).length > 0) {
      await adminAuth.updateUser(uid, authUpdate);
    }

    // Update Firestore document
    const firestoreUpdate = { updatedAt: new Date().toISOString() };
    if (name) firestoreUpdate.name = name;
    if (role) firestoreUpdate.role = role;

    await adminDb.collection('users').doc(uid).update(firestoreUpdate);

    return NextResponse.json({ success: true, uid, name, role });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found in Firebase Auth' }, { status: 404 });
    }
    console.error('[API /users/[uid] PATCH] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE /api/users/[uid] — Delete user entirely ───────────────────────────
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticate(req);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { uid } = params;

    // Prevent self-deletion
    if (uid === auth.uid) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    // Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authErr) {
      if (authErr.code !== 'auth/user-not-found') throw authErr;
    }

    // Delete from Firestore
    await adminDb.collection('users').doc(uid).delete();

    return NextResponse.json({ success: true, uid });
  } catch (error) {
    console.error('[API /users/[uid] DELETE] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
