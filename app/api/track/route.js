import { NextResponse } from 'next/server';
import { trackAWB } from '../../../lib/tracking';

export async function POST(req) {
  try {
    const { awb } = await req.json();

    if (!awb) {
      return NextResponse.json({ error: 'AWB number is required' }, { status: 400 });
    }

    const trackingData = await trackAWB(awb);
    return NextResponse.json(trackingData);
  } catch (err) {
    console.error('API Track Proxy Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
