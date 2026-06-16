import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

// Auth helper
async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token');
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Unauthorized: Token verification failed');
  }
}

// Check role
async function getUserRole(uid) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data().role || 'employee';
    }
    return 'employee';
  } catch (err) {
    return 'employee';
  }
}

export async function GET(req) {
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const logsSnap = await adminDb.collection('sync_logs')
      .orderBy('timestamp', 'desc')
      .limit(30)
      .get();

    const logs = [];
    logsSnap.forEach(doc => {
      const data = doc.data();
      // Format timestamps
      if (data.timestamp) data.timestamp = data.timestamp.toDate().toISOString();
      logs.push({
        id: doc.id,
        ...data
      });
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error('API GET Sync Logs Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}
