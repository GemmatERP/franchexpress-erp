import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

// Default seed items — only written if the document doesn't exist yet
const SEED_ITEMS = [
  { id: 'pod', name: 'POD', description: 'Proof of Delivery envelopes', count: 0 },
  { id: 'covers', name: 'Covers', description: 'Packaging cover sheets', count: 0 },
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

// GET /api/office-utilities
export async function GET(req) {
  try {
    await authenticate(req);

    const colRef = adminDb.collection('officeUtilities');

    // Seed missing items in a batch if they don't exist yet
    const seedBatch = adminDb.batch();
    let seeded = false;
    for (const item of SEED_ITEMS) {
      const docRef = colRef.doc(item.id);
      const snap = await docRef.get();
      if (!snap.exists) {
        seedBatch.set(docRef, {
          name: item.name,
          description: item.description,
          count: item.count,
          createdAt: new Date().toISOString(),
        });
        seeded = true;
      }
    }
    if (seeded) await seedBatch.commit();

    // Fetch all items
    const snapshot = await colRef.orderBy('name').get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(items);
  } catch (err) {
    console.error('GET /api/office-utilities error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : 500 }
    );
  }
}
