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

export async function GET(req) {
  try {
    await authenticate(req);

    // ── Return cached result if still fresh ───────────────────────────────
    const cached = getCachedStats();
    if (cached) {
      return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
    }

    // ── Build Timestamp boundaries ────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

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
          'Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB',
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

    let todayRevenue = 0;
    let deliveredToday = 0;
    const todayItems = [];
    const todayStr = todayStart.toDateString();

    todayFullSnap.forEach((doc) => {
      const data = doc.data();
      todayRevenue += Number(data.amount) || 0;

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

    // ── Chart data (last 14 days) ─────────────────────────────────────────
    const today = new Date();

    const last7Map  = {};
    const last14Map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(today.getDate() - i);
      last7Map[d.toDateString()] = {
        name: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        consignments: 0,
      };
    }
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(today.getDate() - i);
      last14Map[d.toDateString()] = {
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        amount: 0,
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
      const ds = d.toDateString();
      if (last7Map[ds])  last7Map[ds].consignments++;
      if (last14Map[ds]) last14Map[ds].amount += Number(data.amount) || 0;
      if (data.deliveryStatus && statusCounts[data.deliveryStatus] !== undefined) {
        statusCounts[data.deliveryStatus]++;
      }
    });

    // ── Build response ────────────────────────────────────────────────────
    const result = {
      kpis: { todayBookings, pendingShipments, deliveredToday, todayRevenue },
      todayItems,
      volumeChart:  Object.values(last7Map),
      revenueChart: Object.values(last14Map),
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
