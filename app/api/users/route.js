import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

// ── Auth helper: verify token and return role ─────────────────────────────────
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

// ── POST /api/users — Create a new user ───────────────────────────────────────
export async function POST(req) {
  try {
    const auth = await authenticate(req);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    // Validate inputs
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields: name, email, password, role' }, { status: 400 });
    }
    const allowedRoles = ['admin', 'employee', 'delivery'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create Firestore users document
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: auth.uid,
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      name,
      role,
    }, { status: 201 });

  } catch (error) {
    // Handle Firebase Auth specific errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }
    console.error('[API /users POST] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
