import { NextResponse } from 'next/server';
import { sendShipmentNotification } from '../../../lib/notifications';

export async function POST(req) {
  try {
    const { consignorPhone, consigneePhone, awbNumber, consigneeName, deliveryStatus } = await req.json();

    if (!consigneePhone || !awbNumber || !consigneeName || !deliveryStatus) {
      return NextResponse.json(
        { error: 'Recipient phone, name, status and AWB are required for notification' },
        { status: 400 }
      );
    }

    // Trigger notification to the consignee (recipient)
    const result = await sendShipmentNotification({
      phone: consigneePhone,
      name: consigneeName,
      awb: awbNumber,
      status: deliveryStatus,
      type: 'consignee',
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('API Notification Dispatch Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
