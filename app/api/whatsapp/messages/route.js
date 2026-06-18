import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';

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

    const { searchParams } = new URL(req.url);
    const direction = searchParams.get('direction'); // 'inbound' | 'outbound' | null
    const status = searchParams.get('status');       // status string
    const search = searchParams.get('search');       // search term (awb, phone, name)
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let queryRef = adminDb.collection('whatsapp_messages');

    // To prevent composite index requirements, we fetch a list and filter in-memory if multiple filters are present.
    // If only one filter (or none) is present, we can query Firestore directly.
    let messages = [];

    // Simple fetch of recent messages ordered by timestamp
    const snap = await queryRef.orderBy('timestamp', 'desc').limit(200).get();
    snap.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply filters in-memory to remain extremely fast and avoid index building blockers
    if (direction) {
      messages = messages.filter(m => m.direction === direction);
    }

    if (status) {
      messages = messages.filter(m => m.status === status);
    }

    if (search) {
      const s = search.toLowerCase().trim();
      messages = messages.filter(m => {
        const awbMatch = m.awb && String(m.awb).toLowerCase().includes(s);
        const phoneMatch = (m.recipientPhone && String(m.recipientPhone).includes(s)) || 
                           (m.senderPhone && String(m.senderPhone).includes(s));
        const nameMatch = m.recipientName && String(m.recipientName).toLowerCase().includes(s);
        const bodyMatch = m.body && String(m.body).toLowerCase().includes(s);
        return awbMatch || phoneMatch || nameMatch || bodyMatch;
      });
    }

    // Slice to the requested limit
    const result = messages.slice(0, limit);

    return NextResponse.json(result);
  } catch (err) {
    console.error('API GET WhatsApp Messages Error:', err.message);
    return NextResponse.json(
      { error: err.message }, 
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
