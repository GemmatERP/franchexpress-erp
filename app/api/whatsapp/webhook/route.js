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

          // Update unified whatsapp_messages
          await adminDb.collection('whatsapp_messages').doc(messageId).set({
            status: deliveryStatus,
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

        let associatedAwb = null;
        if (adminDb) {
          try {
            const rawPhone = from;
            const tenDigitPhone = from.startsWith('91') ? from.slice(2) : from;

            // Check consigneePhone first
            let snap = await adminDb.collection('consignments')
              .where('consigneePhone', 'in', [rawPhone, tenDigitPhone])
              .orderBy('date', 'desc')
              .limit(1)
              .get();

            if (!snap.empty) {
              associatedAwb = snap.docs[0].data().awbNumber;
            } else {
              // Check consignorPhone
              let snap2 = await adminDb.collection('consignments')
                .where('consignorPhone', 'in', [rawPhone, tenDigitPhone])
                .orderBy('date', 'desc')
                .limit(1)
                .get();
              if (!snap2.empty) {
                associatedAwb = snap2.docs[0].data().awbNumber;
              }
            }
          } catch (err) {
            console.warn('[Webhook AWB lookup error]:', err.message);
          }
        }

        // Handle location share (if customer sends their location)
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

            // If associated AWB exists, update consignment gpsLocation directly
            if (associatedAwb) {
              try {
                const consignSnap = await adminDb.collection('consignments')
                  .where('awbNumber', '==', associatedAwb)
                  .limit(1)
                  .get();

                if (!consignSnap.empty) {
                  await consignSnap.docs[0].ref.update({
                    gpsLocation: {
                      latitude,
                      longitude,
                      googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
                      receivedAt: new Date().toISOString()
                    },
                    notes: adminDb.FieldValue ? adminDb.FieldValue.arrayUnion(`Customer sent GPS coordinates via WhatsApp: Lat ${latitude}, Lng ${longitude}`) : [`Customer sent GPS coordinates via WhatsApp: Lat ${latitude}, Lng ${longitude}`]
                  });
                }
              } catch (err) {
                console.error('[Webhook Consignment GPS update error]:', err.message);
              }
            }

            // Save location to unified messages
            await adminDb.collection('whatsapp_messages').add({
              direction: 'inbound',
              senderPhone: from,
              msgType: 'location',
              latitude,
              longitude,
              body: `Shared location: ${locationName || ''} ${address || ''}`.trim() || 'GPS Coordinates Shared',
              status: 'received',
              timestamp: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              awb: associatedAwb || null,
            });
          }
        }

        // Handle text replies
        if (msgType === 'text') {
          const text = message.text?.body;
          console.log(`[WhatsApp] Text from ${from}: "${text}"`);
          
          if (adminDb) {
            // Save text reply to unified messages
            await adminDb.collection('whatsapp_messages').add({
              direction: 'inbound',
              senderPhone: from,
              msgType: 'text',
              body: text || '',
              status: 'received',
              timestamp: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              awb: associatedAwb || null,
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[WhatsApp Webhook] Error:', err.message);
    return NextResponse.json({ status: 'error', error: err.message }, { status: 200 });
  }
}
