const fs = require('fs');
const path = require('path');

// Load environment variables from .env
try {
  const envPath = "s:\\AMS Ventures\\Website Projects\\Franch Gemmat\\.env";
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
  console.warn('Could not load .env:', e.message);
}

// Fallback to load .env.local
try {
  const envPath = "s:\\AMS Ventures\\Website Projects\\Franch Gemmat\\.env.local";
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
  // Ignore
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

const adminAuth = admin.auth();

async function updatePasswords() {
  const updates = [
    { email: 'admin@fe.com', password: 'Admin@123' },
    { email: 'support@gemmat.net', password: 'Emp@123' },
    { email: 'deliverytest@fe.com', password: 'Delivery@123' }
  ];

  for (const update of updates) {
    try {
      const user = await adminAuth.getUserByEmail(update.email);
      await adminAuth.updateUser(user.uid, {
        password: update.password
      });
      console.log(`Updated password for ${update.email} to ${update.password}`);
    } catch (e) {
      console.error(`Failed to update password for ${update.email}:`, e.message);
    }
  }
}

updatePasswords();
