import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';
import { getCachedRole, setCachedRole } from '../../../../lib/stats-cache';

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

// Check user authorization with role cache
async function getUserRole(uid) {
  const cached = getCachedRole(uid);
  if (cached) return cached;
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const role = userDoc.exists ? (userDoc.data().role || 'employee') : 'employee';
    setCachedRole(uid, role);
    return role;
  } catch (err) {
    return 'employee';
  }
}

// Convert string to Title Case
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  );
}

export async function GET(req) {
  try {
    const decodedToken = await authenticate(req);
    const role = await getUserRole(decodedToken.uid);

    // Restrict to admins and employees
    if (role !== 'admin' && role !== 'employee') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json([]);
    }

    const matchedDocsMap = new Map();
    const queryPromises = [];

    // 1. Numeric Query Routing (AWB / Phones)
    if (/^\d+$/.test(query)) {
      // Exact matches (very efficient — uses equality index)
      queryPromises.push(
        adminDb.collection('consignments').where('awbNumber', '==', query).get()
      );
      queryPromises.push(
        adminDb.collection('consignments').where('consigneePhone', '==', query).get()
      );
      queryPromises.push(
        adminDb.collection('consignments').where('consignorPhone', '==', query).get()
      );
    } 
    // 2. SNO Query (FE-XXXX format)
    else if (/^fe-?\d+$/i.test(query)) {
      queryPromises.push(
        adminDb.collection('consignments').where('sno', '==', query.toUpperCase()).get()
      );
    }
    // 3. Text Query — uses pre-normalized UPPERCASE fields stored on write.
    // Only 4 queries (one per field) instead of 16 (4 fields × 4 case variants).
    // Fields written by POST: _consigneeNameUpper, _consignorNameUpper,
    //                         _consigneeCityUpper, _consigneeStateUpper
    else {
      const term = query.toUpperCase();
      const fields = [
        '_consigneeNameUpper',
        '_consignorNameUpper',
        '_consigneeCityUpper',
        '_consigneeStateUpper',
      ];

      for (const field of fields) {
        queryPromises.push(
          adminDb.collection('consignments')
            .where(field, '>=', term)
            .where(field, '<=', term + '\uf8ff')
            .limit(20)
            .get()
        );
      }
    }

    // Resolve all queries in parallel
    const snapshots = await Promise.all(queryPromises);

    // Merge & deduplicate results
    snapshots.forEach((snap) => {
      snap.forEach((doc) => {
        if (!matchedDocsMap.has(doc.id)) {
          matchedDocsMap.set(doc.id, doc.data());
        }
      });
    });

    // Convert map to array
    const results = Array.from(matchedDocsMap.entries()).map(([id, data]) => {
      // Format Timestamps to ISO strings
      const formatted = { id, ...data };
      if (formatted.date) formatted.date = formatted.date.toDate().toISOString();
      if (formatted.paymentDate) formatted.paymentDate = formatted.paymentDate.toDate().toISOString();
      if (formatted.deliveredDate) formatted.deliveredDate = formatted.deliveredDate.toDate().toISOString();
      if (formatted.createdAt) formatted.createdAt = formatted.createdAt.toDate().toISOString();
      return formatted;
    });

    // Sort results by booking date (newest first)
    results.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB - dateA;
    });

    // Bound final results count to top 50
    return NextResponse.json(results.slice(0, 50));

  } catch (err) {
    console.error('API GET Search Error:', err.message);
    return NextResponse.json(
      { error: err.message }, 
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
