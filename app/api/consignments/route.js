import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../lib/firebase-admin';
import { formatSNO } from '../../../lib/utils';
import { invalidateStatsCache } from '../../../lib/stats-cache';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

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

async function getUserRole(uid) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    return userDoc.exists ? (userDoc.data().role || 'employee') : 'employee';
  } catch {
    return 'employee';
  }
}

// ─── GET /api/consignments ────────────────────────────────────────────────────
// Supports cursor-based pagination. Always defaults to last 30 days if no
// date filter provided, preventing unbounded collection scans.

export async function GET(req) {
  try {
    await authenticate(req);

    const { searchParams } = new URL(req.url);
    const fromDate        = searchParams.get('fromDate');
    const toDate          = searchParams.get('toDate');
    const courierPartner  = searchParams.get('courierPartner');
    const deliveryStatus  = searchParams.get('deliveryStatus');
    const paymentMode     = searchParams.get('paymentMode');
    const cursor          = searchParams.get('cursor');      // last doc ID from previous page
    const limitRaw        = parseInt(searchParams.get('limit') || '50', 10);
    const pageLimit       = Math.min(Math.max(limitRaw, 1), 200); // clamp 1–200

    let queryRef = adminDb.collection('consignments');

    // ── Date filters (REQUIRED for efficiency) ───────────────────────────
    // If the caller provides no date range we default to the last 30 days.
    // This prevents loading the entire collection on unfiltered queries.
    if (!fromDate && !toDate) {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      defaultStart.setHours(0, 0, 0, 0);
      queryRef = queryRef.where('date', '>=', admin.firestore.Timestamp.fromDate(defaultStart));
    } else {
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        queryRef = queryRef.where('date', '>=', admin.firestore.Timestamp.fromDate(start));
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        queryRef = queryRef.where('date', '<=', admin.firestore.Timestamp.fromDate(end));
      }
    }

    // ── Additional filters ────────────────────────────────────────────────
    if (courierPartner && courierPartner !== 'All') {
      queryRef = queryRef.where('courierPartner', '==', courierPartner);
    }
    if (deliveryStatus && deliveryStatus !== 'All') {
      queryRef = queryRef.where('deliveryStatus', '==', deliveryStatus);
    }
    if (paymentMode && paymentMode !== 'All') {
      queryRef = queryRef.where('paymentMode', '==', paymentMode);
    }

    // ── Sort + page limit (fetch one extra to detect hasMore) ────────────
    queryRef = queryRef.orderBy('date', 'desc').limit(pageLimit + 1);

    // ── Cursor-based pagination ───────────────────────────────────────────
    if (cursor) {
      const cursorDoc = await adminDb.collection('consignments').doc(cursor).get();
      if (cursorDoc.exists) {
        queryRef = queryRef.startAfter(cursorDoc);
      }
    }

    const snapshot  = await queryRef.get();
    const allDocs   = snapshot.docs;
    const hasMore   = allDocs.length > pageLimit;
    const pageDocs  = hasMore ? allDocs.slice(0, pageLimit) : allDocs;
    const nextCursor = hasMore ? pageDocs[pageDocs.length - 1].id : null;

    const data = pageDocs.map((doc) => {
      const d = doc.data();
      if (d.date)          d.date          = d.date.toDate().toISOString();
      if (d.paymentDate)   d.paymentDate   = d.paymentDate?.toDate?.()?.toISOString()   ?? d.paymentDate;
      if (d.deliveredDate) d.deliveredDate = d.deliveredDate?.toDate?.()?.toISOString() ?? d.deliveredDate;
      if (d.createdAt)     d.createdAt     = d.createdAt?.toDate?.()?.toISOString()     ?? d.createdAt;
      return { id: doc.id, ...d };
    });

    return NextResponse.json(
      { data, nextCursor, hasMore, total: data.length },
      { headers: { 'Cache-Control': 'private, max-age=60' } }
    );
  } catch (err) {
    console.error('API GET Consignments Error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}

// ─── POST /api/consignments ───────────────────────────────────────────────────

export async function POST(req) {
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);

    if (role !== 'admin' && role !== 'employee') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await req.json();

    // Generate SNO atomically
    const counterRef = adminDb.collection('counters').doc('consignments');
    let nextCount = 1;

    await adminDb.runTransaction(async (tx) => {
      const counterDoc = await tx.get(counterRef);
      if (!counterDoc.exists) {
        tx.set(counterRef, { count: 1 });
      } else {
        nextCount = counterDoc.data().count + 1;
        tx.update(counterRef, { count: nextCount });
      }
    });

    const docData = {
      ...body,
      sno:           formatSNO(nextCount),
      date:          body.date          ? admin.firestore.Timestamp.fromDate(new Date(body.date))          : admin.firestore.Timestamp.now(),
      paymentDate:   body.paymentDate   ? admin.firestore.Timestamp.fromDate(new Date(body.paymentDate))   : null,
      deliveredDate: body.deliveredDate ? admin.firestore.Timestamp.fromDate(new Date(body.deliveredDate)) : null,
      createdAt:     admin.firestore.Timestamp.now(),
      createdBy:     decodedToken.uid,
      createdByName: decodedToken.name || decodedToken.email,
    };

    const docRef = await adminDb.collection('consignments').add(docData);

    // Invalidate dashboard stats cache so next load reflects new data
    invalidateStatsCache();

    // Serialize for response
    if (docData.date)          docData.date          = docData.date.toDate().toISOString();
    if (docData.paymentDate)   docData.paymentDate   = docData.paymentDate?.toDate?.()?.toISOString()   ?? null;
    if (docData.deliveredDate) docData.deliveredDate = docData.deliveredDate?.toDate?.()?.toISOString() ?? null;
    if (docData.createdAt)     docData.createdAt     = docData.createdAt.toDate().toISOString();

    return NextResponse.json({ id: docRef.id, ...docData });
  } catch (err) {
    console.error('API POST Consignment Error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
