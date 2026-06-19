/**
 * FranchExpress ERP — Notification Dispatcher
 * Meta WhatsApp Cloud API — Status-based template routing
 *
 * Sends to both consignee (receiver) and consignor (sender) automatically.
 *
 * NOTIFICATION_PROVIDER options:
 *   'whatsapp'  → Meta WhatsApp Cloud API (recommended)
 *   'none'      → Mute all (dev/testing)
 */

import { adminDb } from './firebase-admin';

// ── Template Map ─────────────────────────────────────────────────────────────
// Maps delivery status → WhatsApp template name
// Consignee templates have 3 params: name, awb, support_phone
// Consignor templates have 4 params: name, awb, consignee_name, support_phone

const CONSIGNEE_TEMPLATES = {
  'Booked':            'fe_rcvr_processing',
  'Processing':        'fe_rcvr_processing',
  'Pending':           'fe_rcvr_processing',
  'Shipped':           'fe_rcvr_in_transit',
  'Transit':           'fe_rcvr_in_transit',
  'In Transit':        'fe_rcvr_in_transit',
  'In-Transit':        'fe_rcvr_in_transit',
  'Returned':          'fe_rcvr_returned',
  'Out of Delivery':   'fe_rcvr_out_delivery',
  'Out for Delivery':  'fe_rcvr_out_delivery',
  'Delivered':         'fe_rcvr_delivered',
};

const CONSIGNOR_TEMPLATES = {
  'Booked':            'fe_sndr_processing',
  'Processing':        'fe_sndr_processing',
  'Pending':           'fe_sndr_processing',
  'Shipped':           'fe_sndr_in_transit',
  'Transit':           'fe_sndr_in_transit',
  'In Transit':        'fe_sndr_in_transit',
  'In-Transit':        'fe_sndr_in_transit',
  'Returned':          'fe_sndr_returned',
  'Out of Delivery':   'fe_sndr_out_delivery',
  'Out for Delivery':  'fe_sndr_out_delivery',
  'Delivered':         'fe_sndr_delivered',
};

// Fallback template (works for any status — uses {{3}} as the status string)
const FALLBACK_TEMPLATE = 'shipment_update';

// ── Helper — normalize phone to international format ─────────────────────────
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;
  return digits.startsWith('91') ? digits : `91${digits}`;
}

// ── Core API Call ─────────────────────────────────────────────────────────────
async function callWhatsAppAPI({ phone, templateName, params, buttonParams, awb, recipientType, recipientName }) {
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new Error('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
  }

  const intlPhone = normalizePhone(phone);
  if (!intlPhone) throw new Error(`Invalid phone number: ${phone}`);

  const components = [
    {
      type: 'body',
      parameters: params.map(text => ({ type: 'text', text: String(text) })),
    },
  ];

  if (buttonParams && buttonParams.length > 0) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: buttonParams.map(text => ({ type: 'text', text: String(text) })),
    });
  }

  // Automatic Flow button parameter injection for fe_sndr_delivered
  if (templateName === 'fe_sndr_delivered') {
    const flowToken = `flow_${awb || Date.now()}`;
    components.push({
      type: 'button',
      sub_type: 'flow',
      index: '1',
      parameters: [
        {
          type: 'action',
          action: {
            flow_token: flowToken,
          },
        },
      ],
    });
  }

  const body = {
    messaging_product: 'whatsapp',
    to: intlPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components,
    },
  };

  let response;
  let data;
  try {
    response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    data = await response.json();
  } catch (err) {
    try {
      if (adminDb) {
        await adminDb.collection('whatsapp_messages').add({
          awb: awb || null,
          recipientPhone: intlPhone,
          recipientName: recipientName || null,
          recipientType: recipientType || null,
          templateName: templateName,
          parameters: params,
          status: 'failed',
          direction: 'outbound',
          errorMessage: err.message,
          timestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (logErr) {
      console.error('[WhatsApp Network Logging Error]:', logErr.message);
    }
    throw err;
  }

  if (!response.ok) {
    const errMsg = data?.error?.message || `HTTP ${response.status}`;
    try {
      if (adminDb) {
        await adminDb.collection('whatsapp_messages').add({
          awb: awb || null,
          recipientPhone: intlPhone,
          recipientName: recipientName || null,
          recipientType: recipientType || null,
          templateName: templateName,
          parameters: params,
          status: 'failed',
          direction: 'outbound',
          errorMessage: errMsg,
          timestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (logErr) {
      console.error('[WhatsApp API Logging Error]:', logErr.message);
    }
    throw new Error(`WhatsApp API error (${templateName}): ${errMsg}`);
  }

  const messageId = data?.messages?.[0]?.id || null;

  try {
    if (adminDb && messageId) {
      await adminDb.collection('whatsapp_messages').doc(messageId).set({
        messageId,
        awb: awb || null,
        recipientPhone: intlPhone,
        recipientName: recipientName || null,
        recipientType: recipientType || null,
        templateName: templateName,
        parameters: params,
        status: 'sent',
        direction: 'outbound',
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (logErr) {
    console.error('[WhatsApp Logging Error]:', logErr.message);
  }

  return {
    sent: true,
    channel: 'whatsapp',
    template: templateName,
    to: intlPhone,
    messageId,
  };
}

// ── Send to Consignee (receiver) ──────────────────────────────────────────────
async function sendConsigneeNotification({ phone, name, awb, status }) {
  const templateName = CONSIGNEE_TEMPLATES[status];
  
  if (!templateName) {
    // Silently ignore statuses with no templates mapped (e.g. Reached Destination, Holding at HUB)
    return { sent: false, channel: 'whatsapp', reason: 'no_template_mapped', status };
  }

  // Approved receiver templates expect exactly 2 parameters: [name, awb]
  const params = [name, awb];

  return await callWhatsAppAPI({
    phone,
    templateName,
    params,
    awb,
    recipientType: 'consignee',
    recipientName: name
  });
}

// ── Send to Consignor (sender) ────────────────────────────────────────────────
async function sendConsignorNotification({ phone, name, awb, status, consigneeName }) {
  if (!phone) return { sent: false, channel: 'whatsapp', reason: 'no_consignor_phone' };

  const templateName = CONSIGNOR_TEMPLATES[status];
  
  if (!templateName) {
    // Silently ignore statuses with no templates mapped (e.g. Reached Destination, Holding at HUB)
    return { sent: false, channel: 'whatsapp', reason: 'no_template_mapped', status };
  }

  // Approved sender templates expect exactly 3 parameters: [name, awb, consigneeName]
  const params = [name, awb, consigneeName || 'the recipient'];

  return await callWhatsAppAPI({
    phone,
    templateName,
    params,
    awb,
    recipientType: 'consignor',
    recipientName: name
  });
}

// ── Main Dispatcher ───────────────────────────────────────────────────────────
/**
 * sendShipmentNotification
 *
 * @param {object} opts
 * @param {string} opts.consigneePhone   - Receiver's phone number
 * @param {string} opts.consigneeName    - Receiver's name
 * @param {string} opts.consignorPhone   - Sender's phone number (optional)
 * @param {string} opts.consignorName    - Sender's name (optional)
 * @param {string} opts.awb              - AWB / tracking number
 * @param {string} opts.status           - Delivery status string
 */
export async function sendShipmentNotification({
  consigneePhone,
  consigneeName,
  consignorPhone,
  consignorName,
  awb,
  status,
  // Legacy single-phone support
  phone,
  name,
}) {
  // Support legacy call signature (phone + name)
  const rcvrPhone = consigneePhone || phone;
  const rcvrName  = consigneeName  || name;

  const provider = (process.env.NOTIFICATION_PROVIDER || 'none').toLowerCase();

  const result = {
    provider,
    consignee: { sent: false },
    consignor: { sent: false },
  };

  if (provider === 'none') {
    console.log(`[Notification Muted] AWB: ${awb} | Status: ${status} | To: ${rcvrPhone}`);
    result.consignee.sent = true;
    return result;
  }

  if (provider !== 'whatsapp') {
    console.warn(`[Notification] Unknown provider: "${provider}"`);
    return result;
  }

  // Send to receiver
  if (rcvrPhone && rcvrName) {
    try {
      result.consignee = await sendConsigneeNotification({
        phone: rcvrPhone,
        name: rcvrName,
        awb,
        status,
      });
    } catch (err) {
      console.error(`[Notification] Consignee error: ${err.message}`);
      result.consignee = { sent: false, error: err.message };
    }
  }

  // Send to sender (only if phone provided)
  if (consignorPhone && consignorName) {
    try {
      result.consignor = await sendConsignorNotification({
        phone: consignorPhone,
        name: consignorName,
        awb,
        status,
        consigneeName: rcvrName,
      });
    } catch (err) {
      console.error(`[Notification] Consignor error: ${err.message}`);
      result.consignor = { sent: false, error: err.message };
    }
  }

  return result;
}
