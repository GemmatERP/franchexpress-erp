import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../../lib/firebase-admin';
import { invalidateStatsCache } from '../../../../lib/stats-cache';

function safeToISO(val) {
  if (!val) return null;
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  } catch (e) {
    return val;
  }
}

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
    // Convert timestamps safely
    if (data.date) data.date = safeToISO(data.date);
    if (data.paymentDate) data.paymentDate = safeToISO(data.paymentDate);
    if (data.deliveredDate) data.deliveredDate = safeToISO(data.deliveredDate);
    if (data.createdAt) data.createdAt = safeToISO(data.createdAt);

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
    } else if (role === 'employee' || role === 'admin' || role === 'super_admin') {
      const isMasterEdit = Boolean(body.masterEdit);
      if (isMasterEdit && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden: Only Admins can perform Master Edit' }, { status: 403 });
      }

      // Admins and Employees have full editing access
      payload = { ...body };
      delete payload.masterEdit;

      // Remove metadata parameters to prevent override
      delete payload.id;
      delete payload.sno;
      delete payload.createdAt;
      delete payload.createdBy;
      delete payload.createdByName;

      // Keep uppercase search index fields in sync when names/city/state are edited
      if (payload.consigneeName !== undefined) payload._consigneeNameUpper = String(payload.consigneeName || '').toUpperCase();
      if (payload.consignorName !== undefined) payload._consignorNameUpper = String(payload.consignorName || '').toUpperCase();
      if (payload.consigneeCity !== undefined) payload._consigneeCityUpper = String(payload.consigneeCity || '').toUpperCase();
      if (payload.consigneeState !== undefined) payload._consigneeStateUpper = String(payload.consigneeState || '').toUpperCase();

      // Cast dates to Timestamps (or null if cleared)
      const castDateField = (fieldName) => {
        if (!(fieldName in body)) return;
        if (body[fieldName]) {
          const parsed = new Date(body[fieldName]);
          if (!isNaN(parsed.getTime())) {
            payload[fieldName] = admin.firestore.Timestamp.fromDate(parsed);
          }
        } else {
          payload[fieldName] = null;
        }
      };

      castDateField('date');
      castDateField('paymentDate');
      castDateField('deliveredDate');

      if (isMasterEdit) {
        payload.updatedAt = new Date().toISOString();
        payload.lastMasterEditedBy = decodedToken.email || decodedToken.uid;
      }
    } else {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await docRef.update(payload);
    invalidateStatsCache(); // Bust dashboard stats cache

    // Fetch updated doc to return
    const updatedSnap = await docRef.get();
    const data = updatedSnap.data();
    if (data.date) data.date = safeToISO(data.date);
    if (data.paymentDate) data.paymentDate = safeToISO(data.paymentDate);
    if (data.deliveredDate) data.deliveredDate = safeToISO(data.deliveredDate);
    if (data.createdAt) data.createdAt = safeToISO(data.createdAt);

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

    // DELETE is strictly restricted to Admin/Super Admin role
    if (role !== 'admin' && role !== 'super_admin') {
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
