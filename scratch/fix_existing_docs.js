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

async function fixDocs() {
  try {
    const snap = await adminDb.collection('whatsapp_messages')
      .where('msgType', '==', 'interactive')
      .get();
      
    if (snap.empty) {
      console.log('No interactive messages found.');
      return;
    }
    
    console.log(`Found ${snap.size} interactive documents. Processing...`);
    
    for (const doc of snap.docs) {
      const data = doc.data();
      const responseData = data.flowResponse || {};
      
      let bodyText = `📝 Customer Rating Feedback`;
      const lines = [];

      // Normalize keys to lowercase for case-insensitive matching
      const normalizedData = {};
      Object.entries(responseData).forEach(([key, val]) => {
        normalizedData[key.toLowerCase()] = val;
      });

      if (normalizedData.screen_0_choose_one_0 !== undefined) {
        let val = String(normalizedData.screen_0_choose_one_0);
        val = val.replace(/^\d+_/, ''); // Strip numeric prefix (e.g. "0_Yes" -> "Yes")
        lines.push(`Feedback: ${val}`);
      }

      if (normalizedData.screen_0_leave_a_1 !== undefined) {
        lines.push(`Comments: ${normalizedData.screen_0_leave_a_1}`);
      }

      // Fallback for any other custom keys (excluding flow_token)
      Object.entries(responseData).forEach(([key, val]) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'screen_0_choose_one_0' || lowerKey === 'screen_0_leave_a_1' || lowerKey === 'flow_token') {
          return;
        }
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        lines.push(`${label}: ${val}`);
      });

      if (lines.length > 0) {
        bodyText += '\n' + lines.join('\n');
      }

      if (data.body !== bodyText) {
        console.log(`Updating document ${doc.id}:`);
        console.log(`  Old body:\n${data.body}`);
        console.log(`  New body:\n${bodyText}`);
        
        await doc.ref.update({
          body: bodyText,
          updatedAt: new Date().toISOString()
        });
        console.log(`Document ${doc.id} updated successfully.\n`);
      } else {
        console.log(`Document ${doc.id} already has the correct body format.\n`);
      }
    }
    
    console.log('All documents processed.');
  } catch (err) {
    console.error('Error during migration:', err);
  }
}

fixDocs();
