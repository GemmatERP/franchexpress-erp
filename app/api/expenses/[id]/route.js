import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';

async function authenticate(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
}

// PUT /api/expenses/[id]
export async function PUT(req, { params }) {
  try {
    await authenticate(req);
    const { particulars, category, amount, notes, paymentMode, bankName } = await req.json();
    await adminDb.collection('expenses').doc(params.id).update({
      particulars: particulars?.trim(),
      category,
      amount: Number(amount),
      notes: notes?.trim() || '',
      paymentMode: paymentMode || 'Cash',
      bankName: paymentMode === 'Bank' ? (bankName || 'Axis Bank') : null,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(req, { params }) {
  try {
    await authenticate(req);
    
    const expenseRef = adminDb.collection('expenses').doc(params.id);
    const expenseDoc = await expenseRef.get();
    
    if (expenseDoc.exists) {
      const data = expenseDoc.data();
      if (data.isDeliveryPayment === true) {
        // Find all deliveryQueue documents associated with this expense
        const queueSnap = await adminDb.collection('deliveryQueue')
          .where('expenseId', '==', params.id)
          .get();
        
        if (!queueSnap.empty) {
          const batch = adminDb.batch();
          queueSnap.docs.forEach(doc => {
            batch.update(doc.ref, {
              isPaid: false,
              expenseId: null,
              paidAt: null
            });
          });
          await batch.commit();
        }
      }
    }
    
    await expenseRef.delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
