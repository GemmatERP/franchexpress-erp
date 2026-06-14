import { NextResponse } from 'next/server';
import { adminDb, adminAuth, admin } from '../../../../lib/firebase-admin';
import { invalidateStatsCache } from '../stats/route';

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

export async function GET(req, { params }) {
  const { id } = params;
  try {
    await authenticate(req);
    
    const doc = await adminDb.collection('consignments').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Consignment not found' }, { status: 404 });
    }

    const data = doc.data();
    // Convert timestamps
    if (data.date) data.date = data.date.toDate().toISOString();
    if (data.paymentDate) data.paymentDate = data.paymentDate.toDate().toISOString();
    if (data.deliveredDate) data.deliveredDate = data.deliveredDate.toDate().toISOString();
    if (data.createdAt) data.createdAt = data.createdAt.toDate().toISOString();

    return NextResponse.json({ id: doc.id, ...data });
  } catch (err) {
    console.error('API GET Consignment [id] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}

export async function PUT(req, { params }) {
  const { id } = params;
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);
    const body = await req.json();

    const docRef = adminDb.collection('consignments').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Consignment not found' }, { status: 404 });
    }

    let payload = {};

    // Role Matrix Restriction:
    if (role === 'delivery') {
      // Delivery agent can ONLY update deliveryStatus and deliveredDate
      if (body.deliveryStatus) payload.deliveryStatus = body.deliveryStatus;
      if (body.deliveredDate) {
        payload.deliveredDate = admin.firestore.Timestamp.fromDate(new Date(body.deliveredDate));
      } else if (body.deliveryStatus === 'Delivered') {
        payload.deliveredDate = admin.firestore.Timestamp.now();
      }
    } else if (role === 'employee' || role === 'admin') {
      // Admins and Employees have full editing access
      payload = { ...body };
      
      // Remove metadata parameters to prevent override
      delete payload.id;
      delete payload.sno;
      delete payload.createdAt;
      delete payload.createdBy;
      delete payload.createdByName;

      // Cast dates to Timestamps
      if (body.date) payload.date = admin.firestore.Timestamp.fromDate(new Date(body.date));
      if (body.paymentDate) payload.paymentDate = admin.firestore.Timestamp.fromDate(new Date(body.paymentDate));
      if (body.deliveredDate) payload.deliveredDate = admin.firestore.Timestamp.fromDate(new Date(body.deliveredDate));
    } else {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await docRef.update(payload);
    invalidateStatsCache(); // Bust dashboard stats cache

    // Fetch updated doc to return
    const updatedSnap = await docRef.get();
    const data = updatedSnap.data();
    if (data.date) data.date = data.date.toDate().toISOString();
    if (data.paymentDate) data.paymentDate = data.paymentDate.toDate().toISOString();
    if (data.deliveredDate) data.deliveredDate = data.deliveredDate.toDate().toISOString();
    if (data.createdAt) data.createdAt = data.createdAt.toDate().toISOString();

    return NextResponse.json({ id: updatedSnap.id, ...data });
  } catch (err) {
    console.error('API PUT Consignment [id] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);

    // DELETE is strictly restricted to Admin role
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only Admins can delete consignments' }, { status: 403 });
    }

    const docRef = adminDb.collection('consignments').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Consignment not found' }, { status: 404 });
    }

    await docRef.delete();
    invalidateStatsCache(); // Bust dashboard stats cache
    return NextResponse.json({ success: true, message: `Consignment ${id} deleted successfully` });
  } catch (err) {
    console.error('API DELETE Consignment [id] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}
