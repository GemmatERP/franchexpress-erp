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

async function checkDates() {
  try {
    const snap = await adminDb.collection('consignments').get();
    
    const countByDateStr = {};
    const countByToDateString = {};
    
    snap.forEach(doc => {
      const data = doc.data();
      const dateVal = data.date;
      if (!dateVal) return;
      
      const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      const toDateStr = d.toDateString(); // e.g. "Tue Jun 16 2026"
      const dateOnly = d.toISOString().split('T')[0]; // e.g. "2026-06-16"
      
      countByDateStr[dateOnly] = (countByDateStr[dateOnly] || 0) + 1;
      countByToDateString[toDateStr] = (countByToDateString[toDateStr] || 0) + 1;
    });
    
    console.log('--- Count by ISO Date ---');
    Object.keys(countByDateStr).sort().forEach(date => {
      console.log(`${date}: ${countByDateStr[date]}`);
    });
    
    console.log('--- Count by toDateString ---');
    Object.keys(countByToDateString).forEach(date => {
      console.log(`${date}: ${countByToDateString[date]}`);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDates();
