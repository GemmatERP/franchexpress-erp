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

// ── GET /api/users/list — List all users ─────────────────────────────────────
export async function GET(req) {
  try {
    const auth = await authenticate(req);
    if (!auth || auth.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'employee',
        createdAt: data.createdAt || null,
      };
    });

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error('[API /users/list GET] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
