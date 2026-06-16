import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../../lib/firebase-admin';
import { getCachedRevenue, setCachedRevenue, getCachedRole, setCachedRole } from '../../../../lib/stats-cache';

// Auth helper
async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token');
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    throw new Error('Unauthorized: Token verification failed');
  }
}

async function getUserRole(uid) {
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

export async function GET(req) {
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);

    // RESTRICTED TO ADMIN ROLE ONLY
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Default to last 7 days if not provided
    let start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (fromDate) {
      start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
    }
    if (toDate) {
      end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
    }

    // Check cache before hitting Firestore
    const cacheKey = `${start.toDateString()}|${end.toDateString()}`;
    const cachedResult = getCachedRevenue(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult, {
        headers: { 'Cache-Control': 'private, max-age=600', 'X-Cache': 'HIT' }
      });
    }

    const tsStart = admin.firestore.Timestamp.fromDate(start);
    const tsEnd = admin.firestore.Timestamp.fromDate(end);

    // Fetch minimal document properties needed for calculations
    const snapshot = await adminDb.collection('consignments')
      .where('date', '>=', tsStart)
      .where('date', '<=', tsEnd)
      .orderBy('date', 'asc')
      .select('date', 'amount', 'paymentMode', 'courierPartner', 'paidStatus', 'nature')
      .get();

    let totalRevenue = 0;
    let totalConsignments = 0;
    let creditRevenue = 0;
    let cashRevenue = 0;
    let upiRevenue = 0;
    let otherRevenue = 0;

    const partnerMap = {};
    const modeMap = {};
    const dailyTrendMap = {};

    // Initialize dailyTrendMap for all dates in the range
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toDateString();
      const label = `${current.getDate()}/${current.getMonth() + 1}`;
      dailyTrendMap[dateStr] = { date: label, amount: 0, count: 0 };
      current.setDate(current.getDate() + 1);
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      totalRevenue += amount;
      totalConsignments += 1;

      // Group by payment mode
      const mode = (data.paymentMode || 'CASH').toUpperCase();
      if (mode === 'CREDIT') {
        creditRevenue += amount;
      } else if (mode === 'CASH') {
        cashRevenue += amount;
      } else if (mode === 'UPI' || mode === 'GPAY' || mode === 'PAYTM') {
        upiRevenue += amount;
      } else {
        otherRevenue += amount;
      }

      modeMap[mode] = (modeMap[mode] || 0) + amount;

      // Group by courier partner
      const partner = data.courierPartner || 'Franch Express';
      partnerMap[partner] = (partnerMap[partner] || 0) + amount;

      // Daily trends
      const docDate = data.date?.toDate?.() || null;
      if (docDate) {
        const dStr = docDate.toDateString();
        if (dailyTrendMap[dStr]) {
          dailyTrendMap[dStr].amount += amount;
          dailyTrendMap[dStr].count += 1;
        }
      }
    });

    const avgRevenue = totalConsignments > 0 ? Number((totalRevenue / totalConsignments).toFixed(2)) : 0;

    // Formatting charts
    const paymentModeChart = Object.entries(modeMap).map(([name, value]) => ({
      name,
      value
    }));

    const partnerChart = Object.entries(partnerMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);

    const dailyTrendChart = Object.values(dailyTrendMap);

    const responseData = {
      metrics: {
        totalRevenue,
        totalConsignments,
        avgRevenue,
        cashRevenue,
        creditRevenue,
        upiRevenue,
        otherRevenue
      },
      charts: {
        dailyTrend: dailyTrendChart,
        paymentMode: paymentModeChart,
        partner: partnerChart
      }
    };

    // Cache result for 10 minutes
    setCachedRevenue(cacheKey, responseData);

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'private, max-age=600', 'X-Cache': 'MISS' }
    });

  } catch (err) {
    console.error('API GET Revenue Stats Error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
