import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';

// ── Auth helper ───────────────────────────────────────────────────────────────
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

// ── GET /api/consignments/by-awb?awb=XXXXXXXXXX ───────────────────────────────
// Looks up a single consignment document by AWB number.
// Returns only the fields needed for the delivery queue UI.
export async function GET(req) {
  try {
    await authenticate(req);

    const { searchParams } = new URL(req.url);
    const awb = searchParams.get('awb')?.trim();

    if (!awb) {
      return NextResponse.json({ error: 'Missing required query parameter: awb' }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection('consignments')
      .where('awbNumber', '==', awb)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: `No consignment found with AWB number: ${awb}` }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const d = doc.data();

    return NextResponse.json({
      id:             doc.id,
      awbNumber:      d.awbNumber,
      consigneeName:  d.consigneeName  || '',
      consigneeCity:  d.consigneeCity  || '',
      consigneePhone: d.consigneePhone || '',
      amount:         d.amount         || 0,
      deliveryStatus: d.deliveryStatus || '',
      courierPartner: d.courierPartner || '',
      sno:            d.sno            || '',
    });

  } catch (err) {
    console.error('[API /consignments/by-awb GET] Error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
