# Direct Meta WhatsApp Cloud API Connectivity Guide

Integrating directly with the **Meta WhatsApp Cloud API** bypasses third-party markup costs and subscription fees. This document details the step-by-step setup required to connect your FranchExpress ERP to the official Meta Cloud API, register message templates, and configure webhooks to receive GPS location pins from customers.

---

## 1. Meta Developer Portal Setup

Follow these steps to set up your app in the Meta developer portal:

1. **Create a Developer Account:**
   - Go to [developers.facebook.com](https://developers.facebook.com) and register/login with your Facebook account.
2. **Create a Meta App:**
   - Click **My Apps** → **Create App**.
   - Select **Other** as the use case, then choose **Business** as the app type.
   - Enter an App name (e.g., `FranchExpress ERP`) and select your Business Portfolio (Business Manager) if you have one (optional for testing, required for production).
3. **Add WhatsApp to your App:**
   - Scroll down to find the **WhatsApp** product on the dashboard and click **Set up**.
   - Agree to the WhatsApp Business Terms.

---

## 2. Obtain Credentials

Once WhatsApp is added, you will be directed to the WhatsApp **Getting Started** screen.

### Testing/Development Credentials
Meta provides a sandbox environment to test before adding a real phone number:
* **Temporary Access Token:** Valid for 24 hours. (For production, you need a Permanent System User Token).
* **Test Phone Number ID:** Used in API request URLs to send messages.
* **WhatsApp Business Account ID (WABA ID):** Identifies your WhatsApp Business Profile.
* **Test Phone Number:** Meta registers a test sender number (e.g., `+1 555-xxx-xxxx`). You must authorize a real recipient number (your personal WhatsApp) under the **To** dropdown to send test messages.

### Production Credentials (Permanent Token)
To get a permanent token that does not expire after 24 hours:
1. Go to your **Meta Business Suite** → **Settings** → **Business settings**.
2. Under **Users**, click **System Users**.
3. Click **Add** to create a new System User (choose Admin role).
4. Select the system user and click **Assign Assets**. Go to **Apps** and select your FranchExpress app, then toggle **Full control (Manage App)**.
5. Click **Generate New Token**. Select your FranchExpress App, and check the following scopes:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
6. Copy the generated **Permanent Access Token** immediately.

---

## 3. Creating & Submitting Message Templates

Meta requires all business-initiated conversations (such as shipment status updates) to use pre-approved templates.

### Template Specifications
Go to **WhatsApp Manager** → **Message Templates** inside the Meta App settings, and submit these four templates:

#### Template 1: `shipment_processed` (Category: Utility)
* **Body Text:**
  ```text
  Hello! Your FranchExpress shipment with AWB Number {{1}} has been processed. We will notify you when it is shipped.
  ```
* **Variables:** `{{1}}` represents the AWB Number.

#### Template 2: `shipment_shipped` (Category: Utility)
* **Body Text:**
  ```text
  Hi! Your consignment (AWB: {{1}}) is shipped and in transit to {{2}}. Track live in your dashboard.
  ```
* **Variables:** `{{1}}` AWB Number, `{{2}}` Destination City.

#### Template 3: `shipment_out_for_delivery` (Category: Utility)
* **Body Text:**
  ```text
  Good news! Your shipment {{1}} is out for delivery today. Our delivery partner will contact you shortly. To help us find your address hassle-free, please reply to this message with your location pin! 📍
  ```
* **Variables:** `{{1}}` AWB Number.

#### Template 4: `shipment_delivered` (Category: Utility)
* **Body Text:**
  ```text
  Success! Your consignment (AWB: {{1}}) has been delivered. Thank you for choosing FranchExpress!
  ```
* **Variables:** `{{1}}` AWB Number.

---

## 4. Integration Code (Next.js & Firebase)

Add the following files to your Next.js application to handle sending templates and receiving webhooks.

### A. Environment Configuration (`.env.local`)
Add the credentials obtained above to your environment variables:

```bash
# Meta WhatsApp Cloud API credentials
WHATSAPP_ACCESS_TOKEN="your_permanent_system_user_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_WABA_ID="your_whatsapp_business_account_id"
WHATSAPP_VERIFY_TOKEN="create_a_random_string_for_webhook_verification"
```

### B. API Client Utility (`lib/whatsapp.js`)
Create a utility function to dispatch template messages:

```javascript
// file:///Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp/lib/whatsapp.js
export async function sendWhatsAppTemplate(toPhone, templateName, parameters) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error("WhatsApp API credentials missing in environment variables.");
    return { success: false, error: "Credentials missing" };
  }

  // Format phone number to E.164 (e.g. 919876543210 for India)
  const formattedPhone = toPhone.replace(/\D/g, '');

  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
  
  const payload = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "en_US"
      },
      components: [
        {
          type: "body",
          parameters: parameters.map(val => ({
            type: "text",
            text: String(val)
          }))
        }
      ]
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "WhatsApp sending failed");
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error(`Error sending WhatsApp template ${templateName}:`, error);
    return { success: false, error: error.message };
  }
}
```

---

## 5. Webhook Setup (Receiving GPS Locations)

Webhooks let you receive real-time notifications when a customer replies with their location.

### A. Webhook Endpoint Route (`app/api/whatsapp/webhook/route.js`)
Create a Next.js route handler to verify the webhook connection and process incoming locations:

```javascript
// file:///Users/mk-mac/.gemini/antigravity-ide/scratch/franchexpress-erp/app/api/whatsapp/webhook/route.js
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// 1. GET Request: Verification Challenge from Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully.');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// 2. POST Request: Handle Incoming Message/Location Payloads
export async function POST(request) {
  try {
    const body = await request.json();

    // Check if the update contains a message
    const messageObj = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (messageObj) {
      const fromPhone = messageObj.from; // Sender's phone number
      const messageType = messageObj.type;

      // Handle Location replies
      if (messageType === 'location') {
        const latitude = messageObj.location.latitude;
        const longitude = messageObj.location.longitude;
        const addressName = messageObj.location.name || '';
        const addressUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        console.log(`Received location from ${fromPhone}: Lat ${latitude}, Lng ${longitude}`);

        // Update the database: Find active consignment for this customer phone
        // Search by consigneePhone or consignerPhone
        const consignmentsRef = db.collection('consignments');
        
        // Find consignments out for delivery for this phone
        const snapshot = await consignmentsRef
          .where('receiverPhone', '==', fromPhone)
          .where('status', '==', 'out_for_delivery')
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const consignmentDoc = snapshot.docs[0];
          await consignmentDoc.ref.update({
            gpsLocation: {
              latitude,
              longitude,
              googleMapsUrl: addressUrl,
              receivedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            notes: admin.firestore.FieldValue.arrayUnion(`Customer sent delivery coordinates: Lat ${latitude}, Lng ${longitude}`)
          });
          console.log(`Updated GPS Coordinates for AWB: ${consignmentDoc.data().awbNumber}`);
        } else {
          console.log(`No active out_for_delivery consignment found for phone ${fromPhone}`);
        }
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('Webhook endpoint error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

### B. Hooking up Webhooks in Meta Dashboard
To activate your webhook:
1. Deploy your Next.js application to a public domain (Vercel, Railway, etc.) or use a tunnel like `ngrok` for local development testing:
   ```bash
   ngrok http 3000
   ```
2. In the Meta Developer Portal, go to **WhatsApp** → **Configuration**.
3. Under **Webhook**, click **Edit**.
4. Set **Callback URL** to `https://<your-domain>/api/whatsapp/webhook`.
5. Set **Verify Token** to the exact value of your `WHATSAPP_VERIFY_TOKEN` env variable.
6. Click **Verify and Save**.
7. Under **Webhook Fields**, click **Manage** and subscribe to **`messages`**.

---

## 6. Testing the Integration

To test sending a notification trigger when a consignment changes state:

1. **Triggering updates:** Update a consignment's status (e.g. to "Out for Delivery") in the application.
2. **Dispatch event:** In the status-handling controller, invoke your helper:
   ```javascript
   import { sendWhatsAppTemplate } from '@/lib/whatsapp';

   // On consignment update to 'out_for_delivery':
   await sendWhatsAppTemplate(
     consignment.receiverPhone, 
     'shipment_out_for_delivery', 
     [consignment.awbNumber]
   );
   ```
3. **Receive reply:** Reply to the received WhatsApp message using a phone. Tap the **Attach/Share** button -> **Location** -> **Send current location**.
4. **Result:** The Next.js API Webhook receives the coordinate payload, matches it to the recipient's phone number, and attaches the Google Maps pin directly to the consignment in Firestore for the delivery rider's dashboard.
