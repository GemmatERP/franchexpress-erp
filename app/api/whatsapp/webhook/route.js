import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

/**
 * WhatsApp Cloud API Webhook
 * Handles: message delivery status updates, incoming messages
 */

// ── GET — Webhook Verification (Meta calls this once during setup) ─────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Verified successfully');
    return new Response(challenge, { status: 200 });
  }

  console.warn('[WhatsApp Webhook] Verification failed');
  return new Response('Forbidden', { status: 403 });
}

// ── POST — Receive Messages & Status Updates ──────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();

    // Meta sends events in this structure
    const entry = body?.entry?.[0];
    if (!entry) return NextResponse.json({ status: 'ok' });

    const changes = entry.changes || [];

    for (const change of changes) {
      const value = change.value;
      if (!value) continue;

      // ── Delivery Status Updates ──
      const statuses = value.statuses || [];
      for (const status of statuses) {
        const { id: messageId, status: deliveryStatus, timestamp, recipient_id } = status;

        console.log(`[WhatsApp] Message ${messageId} → ${deliveryStatus} (to: ${recipient_id})`);

        // Save status to Firestore for tracking (optional — remove if not needed)
        if (adminDb && messageId) {
          await adminDb.collection('whatsapp_logs').doc(messageId).set({
            messageId,
            deliveryStatus,   // 'sent', 'delivered', 'read', 'failed'
            recipient: recipient_id,
            timestamp: new Date(Number(timestamp) * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }

      // ── Incoming Messages (customer replies) ──
      const messages = value.messages || [];
      for (const message of messages) {
        const from    = message.from;    // customer phone
        const msgType = message.type;   // 'text', 'location', etc.

        console.log(`[WhatsApp] Incoming ${msgType} from ${from}`);

        // Handle location share (if you add location request button later)
        if (msgType === 'location') {
          const { latitude, longitude, name: locationName, address } = message.location;
          console.log(`[WhatsApp] Location from ${from}: ${latitude}, ${longitude}`);

          // Save location to Firestore (match by phone number)
          if (adminDb) {
            await adminDb.collection('customer_locations').add({
              phone: from,
              latitude,
              longitude,
              locationName: locationName || null,
              address: address || null,
              receivedAt: new Date().toISOString(),
            });
          }
        }

        // Handle text replies
        if (msgType === 'text') {
          const text = message.text?.body;
          console.log(`[WhatsApp] Text from ${from}: "${text}"`);
          // Add auto-reply logic here if needed
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[WhatsApp Webhook] Error:', err.message);
    return NextResponse.json({ status: 'error', error: err.message }, { status: 200 });
    // Always return 200 to Meta — otherwise it retries
  }
}
