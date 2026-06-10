export async function sendShipmentNotification({ phone, name, awb, status, type }) {
  // Read config from env
  const provider = process.env.NOTIFICATION_PROVIDER || 'none';
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '9XXXXXXXXX';
  
  // Format message template
  const statusVerb = status === 'Delivered' ? 'delivered' : 'updated';
  const msg = `Dear ${name}, your shipment AWB ${awb} has been ${statusVerb}. Status: ${status}. Track at franchexpress.com. For support call: ${supportPhone}. - FranchExpress Team`;
  
  const results = {
    sent: false,
    channel: 'none',
    preview: msg,
    details: null,
  };

  // Determine provider to use if set to 'auto'
  let activeProvider = provider;
  if (provider === 'auto') {
    if (process.env.WATI_API_KEY && process.env.WATI_BASE_URL) {
      activeProvider = 'wati';
    } else if (process.env.FAST2SMS_API_KEY) {
      activeProvider = 'fast2sms';
    } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
      activeProvider = 'twilio';
    } else {
      activeProvider = 'none';
    }
  }

  // Execute based on provider
  try {
    if (activeProvider === 'none') {
      console.log(`[Notification Muted] To: ${phone}, Msg: "${msg}"`);
      results.sent = true;
      results.channel = 'none';
      return results;
    }

    if (activeProvider === 'fast2sms') {
      const apiKey = process.env.FAST2SMS_API_KEY;
      if (!apiKey) throw new Error('Missing FAST2SMS_API_KEY');

      // Call Fast2SMS API
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: msg,
          language: 'english',
          numbers: phone,
        }),
      });

      const data = await response.json();
      results.sent = response.ok && data.return === true;
      results.channel = 'sms';
      results.details = data;
      return results;
    }

    if (activeProvider === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Missing Twilio credentials (SID, Token or From Number)');
      }

      // Convert Twilio authentication credentials to base64
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone.startsWith('+') ? phone : `+91${phone}`,
            From: fromNumber,
            Body: msg,
          }).toString(),
        }
      );

      const data = await response.json();
      results.sent = response.ok;
      results.channel = 'sms';
      results.details = data;
      return results;
    }

    if (activeProvider === 'wati') {
      const apiKey = process.env.WATI_API_KEY;
      const baseUrl = process.env.WATI_BASE_URL;

      if (!apiKey || !baseUrl) {
        throw new Error('Missing WATI credentials (API Key or Base URL)');
      }

      // Call Wati.io Send Template Message endpoint
      const response = await fetch(`${baseUrl}/api/v1/sendTemplateMessage`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsappNumber: phone.startsWith('91') ? phone : `91${phone}`,
          templateName: 'shipment_update',
          broadcastName: 'shipment_update',
          parameters: [
            { name: 'name', value: name },
            { name: 'awb', value: awb },
            { name: 'status', value: status },
            { name: 'support', value: supportPhone }
          ],
        }),
      });

      const data = await response.json();
      results.sent = response.ok && data.result === 'success';
      results.channel = 'whatsapp';
      results.details = data;
      return results;
    }
  } catch (error) {
    console.error(`Error sending notification via ${activeProvider}:`, error.message);
    results.sent = false;
    results.details = { error: error.message };
  }

  return results;
}
