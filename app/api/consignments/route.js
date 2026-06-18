import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../lib/firebase-admin';
import { formatSNO } from '../../../lib/utils';
import { invalidateStatsCache, getCachedRole, setCachedRole } from '../../../lib/stats-cache';

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
  // Check in-memory role cache first (60s TTL) — avoids 1 extra read per request
  const cached = getCachedRole(uid);
  if (cached) return cached;

  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const role = userDoc.exists ? (userDoc.data().role || 'employee') : 'employee';
    setCachedRole(uid, role);
    return role;
  } catch {
    return 'employee';
  }
}

// ─── GET /api/consignments ────────────────────────────────────────────────────
// Uses real Firestore cursor-based pagination (.startAfter) so only the
// requested page is read from the database — not the entire date-window.
// Composite index required: (date ASC/DESC, deliveryStatus, courierPartner, paymentMode)

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

    // ── Date filters ─────────────────────────────────────────────────────────
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

    // ── Firestore equality filter strategy ───────────────────────────────────
    // Firestore requires a composite index for every unique combination of
    // equality + range (date) + orderBy fields. Rather than maintaining all
    // permutations, we push only ONE equality filter to Firestore (whichever
    // is most selective), and do the remaining filters in-process.
    // This keeps index requirements minimal (3 single-field indexes) and
    // never throws "index required" errors for combined filters.

    const activeFilters = [];
    if (deliveryStatus && deliveryStatus !== 'All') activeFilters.push({ field: 'deliveryStatus', value: deliveryStatus });
    if (courierPartner  && courierPartner  !== 'All') activeFilters.push({ field: 'courierPartner',  value: courierPartner });
    if (paymentMode     && paymentMode     !== 'All') activeFilters.push({ field: 'paymentMode',     value: paymentMode });

    // Push only the first active equality filter into Firestore
    if (activeFilters.length > 0) {
      const { field, value } = activeFilters[0];
      queryRef = queryRef.where(field, '==', value);
    }

    // Sort by date descending
    queryRef = queryRef.orderBy('date', 'desc');

    // ── Cursor-based pagination ──────────────────────────────────────────────
    if (cursor) {
      const cursorDoc = await adminDb.collection('consignments').doc(cursor).get();
      if (cursorDoc.exists) {
        queryRef = queryRef.startAfter(cursorDoc);
      }
    }

    // When multiple filters are active we need a larger raw fetch so that
    // in-process filtering still returns a full page. Fetch up to 5× the page
    // limit to compensate (capped at 1000 for safety).
    const rawFetchLimit = activeFilters.length > 1
      ? Math.min(pageLimit * 10, 1000)
      : pageLimit + 1;

    let snapshot;
    let fallbackMode = false;
    try {
      snapshot = await queryRef.limit(rawFetchLimit).get();
    } catch (err) {
      if (err.message.includes('index') || err.message.includes('FAILED_PRECONDITION')) {
        console.warn('Firestore index not ready. Falling back to in-memory filtering. Error:', err.message);
        fallbackMode = true;

        let fallbackQueryRef = adminDb.collection('consignments');
        if (!fromDate && !toDate) {
          const defaultStart = new Date();
          defaultStart.setDate(defaultStart.getDate() - 30);
          defaultStart.setHours(0, 0, 0, 0);
          fallbackQueryRef = fallbackQueryRef.where('date', '>=', admin.firestore.Timestamp.fromDate(defaultStart));
        } else {
          if (fromDate) {
            const start = new Date(fromDate);
            start.setHours(0, 0, 0, 0);
            fallbackQueryRef = fallbackQueryRef.where('date', '>=', admin.firestore.Timestamp.fromDate(start));
          }
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            fallbackQueryRef = fallbackQueryRef.where('date', '<=', admin.firestore.Timestamp.fromDate(end));
          }
        }
        fallbackQueryRef = fallbackQueryRef.orderBy('date', 'desc');
        snapshot = await fallbackQueryRef.limit(3000).get();
      } else {
        throw err;
      }
    }

    // ── In-process filtering for remaining equality conditions ────────────────
    let allDocs = snapshot.docs;

    if (fallbackMode) {
      if (activeFilters.length > 0) {
        allDocs = allDocs.filter((doc) => {
          const d = doc.data();
          return activeFilters.every(({ field, value }) => d[field] === value);
        });
      }
      if (cursor) {
        const cursorIndex = allDocs.findIndex((doc) => doc.id === cursor);
        if (cursorIndex !== -1) {
          allDocs = allDocs.slice(cursorIndex + 1);
        }
      }
    } else {
      const remainingFilters = activeFilters.slice(1); // skip the one already in Firestore
      if (remainingFilters.length > 0) {
        allDocs = allDocs.filter((doc) => {
          const d = doc.data();
          return remainingFilters.every(({ field, value }) => d[field] === value);
        });
      }
    }

    const hasMore = allDocs.length > pageLimit;
    const pageDocs = hasMore ? allDocs.slice(0, pageLimit) : allDocs;
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
      { data, nextCursor, hasMore },
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

    // Normalize text search fields to uppercase for efficient prefix queries
    const docData = {
      ...body,
      sno:                  formatSNO(nextCount),
      date:                 body.date          ? admin.firestore.Timestamp.fromDate(new Date(body.date))          : admin.firestore.Timestamp.now(),
      paymentDate:          body.paymentDate   ? admin.firestore.Timestamp.fromDate(new Date(body.paymentDate))   : null,
      deliveredDate:        body.deliveredDate ? admin.firestore.Timestamp.fromDate(new Date(body.deliveredDate)) : null,
      createdAt:            admin.firestore.Timestamp.now(),
      createdBy:            decodedToken.uid,
      createdByName:        decodedToken.name || decodedToken.email,
      // Normalized fields for efficient case-insensitive prefix search
      _consigneeNameUpper:  (body.consigneeName  || '').toUpperCase(),
      _consignorNameUpper:  (body.consignorName  || '').toUpperCase(),
      _consigneeCityUpper:  (body.consigneeCity  || '').toUpperCase(),
      _consigneeStateUpper: (body.consigneeState || '').toUpperCase(),
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
