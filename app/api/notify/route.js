import { NextResponse } from 'next/server';
import { sendShipmentNotification } from '../../../lib/notifications';

export async function POST(req) {
  try {
    const {
      consigneePhone,
      consigneeName,
      consignorPhone,
      consignorName,
      awbNumber,
      deliveryStatus,
      // Legacy fields
      phone,
      name,
    } = await req.json();

    const rcvrPhone = consigneePhone || phone;
    const rcvrName  = consigneeName  || name;

    if (!rcvrPhone || !awbNumber || !rcvrName || !deliveryStatus) {
      return NextResponse.json(
        { error: 'consigneePhone, consigneeName, awbNumber and deliveryStatus are required' },
        { status: 400 }
      );
    }

    const result = await sendShipmentNotification({
      consigneePhone: rcvrPhone,
      consigneeName:  rcvrName,
      consignorPhone,
      consignorName,
      awb:    awbNumber,
      status: deliveryStatus,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Notification Dispatch Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
