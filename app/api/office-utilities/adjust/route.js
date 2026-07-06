import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth, admin } from '../../../../lib/firebase-admin';

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

/**
 * POST /api/office-utilities/adjust
 * Body: { itemId: string, delta: number }
 *   delta > 0 = Add
 *   delta < 0 = Remove (will floor at 0 — never goes negative)
 * Returns: { id, count } — the updated item with its new count
 */
export async function POST(req) {
  try {
    await authenticate(req);

    const body = await req.json();
    const { itemId, delta } = body;

    // Validate inputs
    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }
    if (delta === undefined || delta === null || !Number.isInteger(delta) || delta === 0) {
      return NextResponse.json({ error: 'delta must be a non-zero integer' }, { status: 400 });
    }

    const docRef = adminDb.collection('officeUtilities').doc(itemId);

    let newCount;
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) {
        throw new Error(`Item "${itemId}" not found`);
      }
      const currentCount = Number(snap.data().count) || 0;
      const proposed = currentCount + delta;

      // Floor at 0 — never go negative
      if (proposed < 0) {
        throw new Error(
          `Cannot remove ${Math.abs(delta)} — current count is only ${currentCount}. Count cannot go below 0.`
        );
      }

      newCount = proposed;
      tx.update(docRef, {
        count: newCount,
        updatedAt: new Date().toISOString(),
      });
    });

    return NextResponse.json({ id: itemId, count: newCount });
  } catch (err) {
    console.error('POST /api/office-utilities/adjust error:', err.message);
    const isNotFound = err.message.includes('not found');
    const isNegative = err.message.includes('Cannot remove');
    return NextResponse.json(
      { error: err.message },
      { status: err.message.startsWith('Unauthorized') ? 401 : (isNotFound || isNegative) ? 400 : 500 }
    );
  }
}
