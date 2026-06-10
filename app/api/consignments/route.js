import { NextResponse } from 'next/server';
import { adminDb, adminAuth, admin } from '../../../lib/firebase-admin';
import { formatSNO } from '../../../lib/utils';

// Helper to verify Firebase ID token
async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid authorization token');
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Unauthorized: Token verification failed');
  }
}

// Helper to check role permissions
async function getUserRole(uid) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data().role || 'employee';
    }
    return 'employee'; // default fallback
  } catch (err) {
    return 'employee';
  }
}

export async function GET(req) {
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const courierPartner = searchParams.get('courierPartner');
    const deliveryStatus = searchParams.get('deliveryStatus');
    const paymentMode = searchParams.get('paymentMode');

    let queryRef = adminDb.collection('consignments');

    // Filter by dates if provided
    if (fromDate) {
      const startOfDay = new Date(fromDate);
      startOfDay.setHours(0, 0, 0, 0);
      queryRef = queryRef.where('date', '>=', admin.firestore.Timestamp.fromDate(startOfDay));
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      queryRef = queryRef.where('date', '<=', admin.firestore.Timestamp.fromDate(endOfDay));
    }

    // Filter by single values
    if (courierPartner && courierPartner !== 'All') {
      queryRef = queryRef.where('courierPartner', '==', courierPartner);
    }
    if (deliveryStatus && deliveryStatus !== 'All') {
      queryRef = queryRef.where('deliveryStatus', '==', deliveryStatus);
    }
    if (paymentMode && paymentMode !== 'All') {
      queryRef = queryRef.where('paymentMode', '==', paymentMode);
    }

    // Sort by booking date descending
    const snapshot = await queryRef.orderBy('date', 'desc').get();
    
    const list = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert timestamps to string/iso for json output compatibility
      if (data.date) data.date = data.date.toDate().toISOString();
      if (data.paymentDate) data.paymentDate = data.paymentDate.toDate().toISOString();
      if (data.deliveredDate) data.deliveredDate = data.deliveredDate.toDate().toISOString();
      if (data.createdAt) data.createdAt = data.createdAt.toDate().toISOString();

      list.push({
        id: doc.id,
        ...data,
      });
    });

    return NextResponse.json(list);
  } catch (err) {
    console.error('API GET Consignments Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}

export async function POST(req) {
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);

    // Only employees and admins are allowed to register consignments
    if (role !== 'admin' && role !== 'employee') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await req.json();

    // Generate SNO with Firestore transactions to prevent races
    const counterRef = adminDb.collection('counters').doc('consignments');
    let nextCount = 1;

    await adminDb.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists) {
        transaction.set(counterRef, { count: 1 });
      } else {
        nextCount = counterDoc.data().count + 1;
        transaction.update(counterRef, { count: nextCount });
      }
    });

    const generatedSNO = formatSNO(nextCount);

    // Format timestamps from strings
    const docData = {
      ...body,
      sno: generatedSNO,
      date: body.date ? admin.firestore.Timestamp.fromDate(new Date(body.date)) : admin.firestore.Timestamp.now(),
      paymentDate: body.paymentDate ? admin.firestore.Timestamp.fromDate(new Date(body.paymentDate)) : null,
      deliveredDate: body.deliveredDate ? admin.firestore.Timestamp.fromDate(new Date(body.deliveredDate)) : null,
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: decodedToken.uid,
      createdByName: decodedToken.name || decodedToken.email,
    };

    // Save consignment
    const docRef = await adminDb.collection('consignments').add(docData);
    
    // Format dates back for response
    if (docData.date) docData.date = docData.date.toDate().toISOString();
    if (docData.paymentDate) docData.paymentDate = docData.paymentDate.toDate().toISOString();
    if (docData.deliveredDate) docData.deliveredDate = docData.deliveredDate.toDate().toISOString();
    if (docData.createdAt) docData.createdAt = docData.createdAt.toDate().toISOString();

    return NextResponse.json({
      id: docRef.id,
      ...docData,
    });
  } catch (err) {
    console.error('API POST Consignment Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: err.message.startsWith('Unauthorized') ? 401 : 500 });
  }
}
