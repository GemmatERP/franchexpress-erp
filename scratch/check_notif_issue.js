const fs = require('fs');
const path = require('path');

// Read and parse .env.local
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.replace(/\\n/g, '\n');
    }
  });
} catch (e) {
  console.warn('Could not load .env.local:', e.message);
}

const admin = require('firebase-admin');
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const adminDb = admin.firestore();

async function checkNotifIssue() {
  const awbs = ['48070112193', '48070112226'];
  try {
    for (const awb of awbs) {
      console.log(`=== AWB: ${awb} ===`);
      const consignSnap = await adminDb.collection('consignments')
        .where('awbNumber', '==', awb)
        .get();
        
      if (consignSnap.empty) {
        console.log('No consignment found in DB.');
      } else {
        consignSnap.forEach(doc => {
          const d = doc.data();
          console.log('Consignment Details:');
          console.log(`  SNO: ${d.sno}`);
          console.log(`  Status: ${d.deliveryStatus}`);
          console.log(`  Consignee Name: ${d.consigneeName}`);
          console.log(`  Consignee Phone: ${d.consigneePhone}`);
          console.log(`  Consignor Name: ${d.consignorName}`);
          console.log(`  Consignor Phone: ${d.consignorPhone}`);
          console.log(`  Date: ${d.date ? (d.date.toDate ? d.date.toDate().toISOString() : d.date) : 'N/A'}`);
        });
      }
      
      const msgSnap = await adminDb.collection('whatsapp_messages')
        .where('awb', '==', awb)
        .get();
        
      if (msgSnap.empty) {
        console.log('No WhatsApp messages found in whatsapp_messages collection for this AWB.');
      } else {
        console.log(`Found ${msgSnap.size} WhatsApp messages:`);
        msgSnap.forEach(doc => {
          const m = doc.data();
          console.log(`  ID: ${doc.id}`);
          console.log(`    Direction: ${m.direction}`);
          console.log(`    Recipient: ${m.recipientName} (${m.recipientPhone})`);
          console.log(`    Recipient Type: ${m.recipientType}`);
          console.log(`    Template: ${m.templateName}`);
          console.log(`    Status: ${m.status}`);
          console.log(`    ErrorMessage: ${m.errorMessage || 'None'}`);
          console.log(`    Timestamp: ${m.timestamp}`);
        });
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkNotifIssue();
