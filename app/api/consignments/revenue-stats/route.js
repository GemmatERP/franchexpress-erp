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

// Timezone helpers for Asia/Kolkata (IST)
function getISTStartOfDay(dateOrString) {
  const d = new Date(dateOrString);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const formatted = formatter.format(d);
  const [year, month, day] = formatted.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
}

function getISTEndOfDay(dateOrString) {
  const d = new Date(dateOrString);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const formatted = formatter.format(d);
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

function getISTTrendLabel(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'numeric'
  }).formatToParts(date);
  const day = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  return `${day}/${month}`;
}

export async function GET(req) {
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);

    // RESTRICTED TO ADMIN/SUPER_ADMIN ROLE ONLY
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Default to last 7 days in IST if not provided
    let start, end;
    const now = new Date();

    if (fromDate) {
      start = getISTStartOfDay(fromDate);
    } else {
      start = getISTStartOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    }

    if (toDate) {
      end = getISTEndOfDay(toDate);
    } else {
      end = getISTEndOfDay(now);
    }

    // Check cache before hitting Firestore
    const cacheKey = `${getISTDateString(start)}|${getISTDateString(end)}`;
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
      .select('date', 'amount', 'paymentMode', 'courierPartner', 'paidStatus', 'nature', 'awbNumber', 'consigneeName', 'consigneeCity', 'consignorName', 'sno', 'cashAmount', 'upiAmount')
      .get();

    let totalRevenue = 0;
    let totalConsignments = 0;
    let creditRevenue = 0;
    let cashRevenue = 0;
    let upiRevenue = 0;
    let otherRevenue = 0;
    const upiConsignments = [];

    const partnerMap = {};
    const modeMap = {};
    const dailyTrendMap = {};

    // Initialize dailyTrendMap for all dates in the range (in IST)
    const current = new Date(start);
    while (current <= end) {
      const istStr = getISTDateString(current);
      const label = getISTTrendLabel(current);
      dailyTrendMap[istStr] = { date: label, amount: 0, count: 0 };
      // Move current by 24 hours
      current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      totalRevenue += amount;
      totalConsignments += 1;

      // Group by payment mode
      const mode = (data.paymentMode || 'CASH').toUpperCase();
      const cashPart = (data.cashAmount !== undefined && data.cashAmount !== null)
        ? Number(data.cashAmount)
        : (mode === 'CASH' ? amount : 0);
      const upiPart = (data.upiAmount !== undefined && data.upiAmount !== null)
        ? Number(data.upiAmount)
        : ((mode === 'UPI' || mode === 'GPAY' || mode === 'PAYTM') ? amount : 0);
      const creditPart = mode === 'CREDIT' ? amount : 0;

      cashRevenue += cashPart;
      upiRevenue += upiPart;
      creditRevenue += creditPart;

      if (mode === 'CREDIT') {
        // Handled above
      } else if (mode === 'CASH') {
        // Handled above
      } else if (mode === 'UPI' || mode === 'GPAY' || mode === 'PAYTM' || mode === 'CASH + UPI') {
        if (upiPart > 0) {
          upiConsignments.push({
            id: doc.id,
            sno: data.sno || '',
            awbNumber: data.awbNumber || '',
            date: data.date?.toDate?.()?.toISOString() || null,
            consignorName: data.consignorName || '',
            consigneeName: data.consigneeName || '',
            consigneeCity: data.consigneeCity || '',
            courierPartner: data.courierPartner || '',
            paymentMode: data.paymentMode || 'UPI',
            amount: upiPart,
            paidStatus: data.paidStatus || '',
          });
        }
      } else {
        const remaining = amount - cashPart - upiPart - creditPart;
        otherRevenue += remaining > 0 ? remaining : 0;
      }

      modeMap[mode] = (modeMap[mode] || 0) + amount;

      // Group by courier partner
      const partner = data.courierPartner || 'Franch Express';
      partnerMap[partner] = (partnerMap[partner] || 0) + amount;

      // Daily trends
      const docDate = data.date?.toDate?.() || null;
      if (docDate) {
        const istStr = getISTDateString(docDate);
        if (dailyTrendMap[istStr]) {
          dailyTrendMap[istStr].amount += amount;
          dailyTrendMap[istStr].count += 1;
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
      },
      upiConsignments
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
