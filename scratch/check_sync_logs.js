const fs = require('fs');
const path = require('path');

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

async function checkSyncLogs() {
  try {
    console.log('Fetching last 10 sync logs...');
    const syncLogsSnap = await adminDb.collection('sync_logs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    if (syncLogsSnap.empty) {
      console.log('No sync logs found.');
      return;
    }

    syncLogsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`\nSync Log ID: ${doc.id}`);
      console.log(`  Timestamp: ${data.timestamp.toDate().toISOString()}`);
      console.log(`  Trigger: ${data.trigger} (By: ${data.triggeredByName})`);
      console.log(`  Processed: ${data.totalProcessed} | Updated: ${data.updatedCount} | Skipped: ${data.skippedCount} | Failed: ${data.failedCount}`);
      if (data.details && data.details.length > 0) {
        console.log('  Details (first 5):');
        data.details.slice(0, 5).forEach(det => {
          console.log(`    AWB: ${det.awb} | SNO: ${det.sno} | Result: ${det.result} | Old: ${det.oldStatus} | New: ${det.newStatus || 'N/A'} | Reason: ${det.reason || 'N/A'}`);
        });
      }
    });

  } catch (err) {
    console.error('Error fetching sync logs:', err);
  }
}

checkSyncLogs();
