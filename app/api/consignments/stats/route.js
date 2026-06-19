import { NextResponse } from 'next/server';

// Force dynamic so Next.js doesn't attempt static pre-rendering of this API route
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../../lib/firebase-admin';
import { getCachedStats, setCachedStats, invalidateStatsCache } from '../../../../lib/stats-cache';

async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
}

// Timezone helpers for Asia/Kolkata (IST)
function getISTStartOfDay(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const formatted = formatter.format(date);
  const [year, month, day] = formatted.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
}

function getISTEndOfDay(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const formatted = formatter.format(date);
  const [year, month, day] = formatted.split('-').map(Number);
  const startOfISTDay = Date.UTC(year, month - 1, day, 0, 0, 0) - 5.5 * 60 * 60 * 1000;
  return new Date(startOfISTDay + 24 * 60 * 60 * 1000 - 1);
}

function getISTDateString(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function getISTDisplayName(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric'
  }).formatToParts(date);
  const weekday = parts.find(p => p.type === 'weekday').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${weekday} ${day}`;
}

export async function GET(req) {
  try {
    await authenticate(req);

    // ── Return cached result if still fresh ───────────────────────────────
    const cached = getCachedStats();
    if (cached) {
      return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
    }

    // ── Build Timestamp boundaries in Asia/Kolkata ─────────────────────────
    const now = new Date();
    const todayStart = getISTStartOfDay(now);
    const todayEnd = getISTEndOfDay(now);
    const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 24 * 60 * 60 * 1000);

    const tsStart = admin.firestore.Timestamp.fromDate(todayStart);
    const tsEnd   = admin.firestore.Timestamp.fromDate(todayEnd);
    const ts14    = admin.firestore.Timestamp.fromDate(fourteenDaysAgo);


    // ── Run all queries in parallel ───────────────────────────────────────
    // count() queries cost exactly 1 read each, regardless of matched docs.
    const [
      todayCountSnap,
      pendingCountSnap,
      todayFullSnap,
      chartSnap,
    ] = await Promise.all([

      // 1 read: Count today's bookings
      adminDb.collection('consignments')
        .where('date', '>=', tsStart)
        .where('date', '<=', tsEnd)
        .count()
        .get(),

      // 1 read: Count all pending shipments
      adminDb.collection('consignments')
        .where('deliveryStatus', 'in', [
          'Booked', 'Processing', 'Processed', 'Pending', 'Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB',
        ])
        .count()
        .get(),

      // ~70 reads: Today's full docs for revenue + today table
      adminDb.collection('consignments')
        .where('date', '>=', tsStart)
        .where('date', '<=', tsEnd)
        .orderBy('date', 'desc')
        .get(),

      // ~14 × avg_daily docs: last 14 days, minimal fields for charts
      adminDb.collection('consignments')
        .where('date', '>=', ts14)
        .orderBy('date', 'desc')
        .select('date', 'deliveryStatus', 'deliveredDate', 'amount')
        .get(),
    ]);

    // ── KPIs ──────────────────────────────────────────────────────────────
    const todayBookings   = todayCountSnap.data().count;
    const pendingShipments = pendingCountSnap.data().count;

    let todayPending = 0;
    let deliveredToday = 0;
    const todayItems = [];
    const todayStr = todayStart.toDateString();

    todayFullSnap.forEach((doc) => {
      const data = doc.data();
      
      if (['Booked', 'Processing', 'Processed', 'Pending', 'Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB'].includes(data.deliveryStatus)) {
        todayPending++;
      }

      if (data.deliveryStatus === 'Delivered' && data.deliveredDate) {
        const dd = data.deliveredDate.toDate
          ? data.deliveredDate.toDate()
          : new Date(data.deliveredDate);
        if (dd.toDateString() === todayStr) deliveredToday++;
      }

      // Serialize Timestamps
      if (data.date)          data.date          = data.date.toDate().toISOString();
      if (data.paymentDate)   data.paymentDate   = data.paymentDate?.toDate?.()?.toISOString()   ?? data.paymentDate;
      if (data.deliveredDate) data.deliveredDate = data.deliveredDate?.toDate?.()?.toISOString() ?? data.deliveredDate;
      if (data.createdAt)     data.createdAt     = data.createdAt?.toDate?.()?.toISOString()     ?? data.createdAt;

      todayItems.push({ id: doc.id, ...data });
    });

    // ── Chart data (last 7 days and status counts) ─────────────────────────
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const ts7 = sevenDaysAgo.getTime();

    let last7Delivered = 0;
    let last7Pending = 0;

    const last7Map  = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const istStr = getISTDateString(d);
      last7Map[istStr] = {
        name: getISTDisplayName(d),
        consignments: 0,
      };
    }

    const statusCounts = {
      Transit: 0, 'Reached Destination': 0, 'Out of Delivery': 0,
      Returned: 0, 'Holding at HUB': 0, Delivered: 0,
    };

    chartSnap.forEach((doc) => {
      const data = doc.data();
      const d = data.date?.toDate?.() ?? null;
      if (!d) return;
      
      const istStr = getISTDateString(d);
      const timeMs = d.getTime();

      if (timeMs >= ts7) {
        if (last7Map[istStr] !== undefined) {
          last7Map[istStr].consignments++;
        }
        if (data.deliveryStatus === 'Delivered') {
          last7Delivered++;
        } else if (['Booked', 'Processing', 'Processed', 'Pending', 'Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB'].includes(data.deliveryStatus)) {
          last7Pending++;
        }
      }

      if (data.deliveryStatus && statusCounts[data.deliveryStatus] !== undefined) {
        statusCounts[data.deliveryStatus]++;
      }
    });

    // ── Build response ────────────────────────────────────────────────────
    const result = {
      kpis: { 
        todayBookings, 
        todayPending, 
        deliveredToday, 
        pendingShipments,
        last7Delivered,
        last7Pending
      },
      todayItems,
      volumeChart:  Object.values(last7Map),
      statusChart:  Object.entries(statusCounts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value })),
    };

    // Cache and return
    setCachedStats(result);

    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } });
  } catch (err) {
    console.error('Stats API Error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
