import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

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

// GET /api/report-templates
export async function GET(req) {
  try {
    await authenticate(req);
    const snapshot = await adminDb
      .collection('report_templates')
      .orderBy('createdAt', 'asc')
      .get();

    const templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      isBuiltIn: false,
    }));

    return NextResponse.json({ templates });
  } catch (err) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// POST /api/report-templates
export async function POST(req) {
  try {
    const user = await authenticate(req);
    const body = await req.json();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const columns = Array.isArray(body.columns) ? body.columns.filter(Boolean) : [];
    const filters = body.filters && typeof body.filters === 'object' ? body.filters : {};

    if (!name) {
      return NextResponse.json({ error: 'Report name is required' }, { status: 400 });
    }
    if (columns.length === 0) {
      return NextResponse.json({ error: 'Select at least one column' }, { status: 400 });
    }

    const docData = {
      name,
      columns,
      filters: {
        courierPartner: filters.courierPartner || 'All',
        deliveryStatus: filters.deliveryStatus || 'All',
        paymentMode: filters.paymentMode || 'All',
        paidStatus: filters.paidStatus || 'All',
      },
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('report_templates').add(docData);
    return NextResponse.json(
      { id: docRef.id, ...docData, isBuiltIn: false },
      { status: 201 }
    );
  } catch (err) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

