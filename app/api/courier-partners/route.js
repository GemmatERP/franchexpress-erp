import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

const DEFAULT_PARTNERS = [
  'Franch Express',
  'India Post',
  'ST Courier',
  'SmartR',
  'Blue Dart',
  'DTDC',
  'DHL',
  'FedEx',
  'Aramex',
  'UPS',
  'Delhivery',
];

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

// GET /api/courier-partners
export async function GET(req) {
  try {
    await authenticate(req);

    const colRef = adminDb.collection('courier_partners');
    let snapshot = await colRef.orderBy('order', 'asc').get();

    // Seed default partners on first run if collection is empty
    if (snapshot.empty) {
      const batch = adminDb.batch();
      DEFAULT_PARTNERS.forEach((name, idx) => {
        const docRef = colRef.doc();
        batch.set(docRef, {
          name,
          order: idx,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      snapshot = await colRef.orderBy('order', 'asc').get();
    }

    const partners = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ partners });
  } catch (err) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// POST /api/courier-partners
export async function POST(req) {
  try {
    const user = await authenticate(req);
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Partner name is required' }, { status: 400 });
    }

    const colRef = adminDb.collection('courier_partners');
    const existingSnap = await colRef.get();

    // Case-insensitive duplicate check
    const duplicate = existingSnap.docs.find(
      (d) => (d.data().name || '').toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json({ error: `"${name}" already exists` }, { status: 409 });
    }

    const maxOrder = existingSnap.docs.reduce(
      (max, d) => Math.max(max, Number(d.data().order) || 0),
      0
    );

    const docData = {
      name,
      order: maxOrder + 1,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    };

    const docRef = await colRef.add(docData);
    return NextResponse.json({ id: docRef.id, ...docData }, { status: 201 });
  } catch (err) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

