/**
 * One-time script to promote admin@fe.com to super_admin role.
 * Run: node scripts/set-super-admin.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
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
const adminAuth = admin.auth();

async function promoteToSuperAdmin() {
  const email = 'admin@fe.com';
  console.log(`Looking up Firebase Auth user for: ${email}`);

  try {
    // Find user by email
    const userRecord = await adminAuth.getUserByEmail(email);
    const uid = userRecord.uid;
    console.log(`Found user UID: ${uid}`);

    // Update or create the Firestore users document
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const existing = userDoc.data();
      console.log(`Existing Firestore role: ${existing.role}`);
      await userRef.update({
        role: 'super_admin',
        updatedAt: new Date().toISOString(),
      });
    } else {
      await userRef.set({
        name: 'Admin Supervisor',
        email,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ Successfully promoted ${email} to super_admin`);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

promoteToSuperAdmin();
