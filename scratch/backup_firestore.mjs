import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Load .env.local manually without requiring dotenv
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) {
    process.env[key] = val;
  }
}

const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();

function serializeValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val.toDate === 'function') {
    return { __type: 'Timestamp', value: val.toDate().toISOString() };
  }
  if (Array.isArray(val)) return val.map(serializeValue);
  if (typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  return val;
}

async function runBackup() {
  const collections = await db.listCollections();
  const backup = {
    exportedAt: new Date().toISOString(),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    collections: {},
  };

  let totalDocs = 0;
  for (const col of collections) {
    const snap = await col.get();
    backup.collections[col.id] = snap.docs.map((doc) => ({
      id: doc.id,
      data: serializeValue(doc.data()),
    }));
    totalDocs += snap.size;
    console.log(`  - ${col.id}: ${snap.size} docs`);
  }

  const backupDir = path.resolve(process.cwd(), 'scratch', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(backupDir, `firestore-backup-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2));

  console.log(`\nBackup complete: ${totalDocs} total documents across ${collections.length} collections`);
  console.log(`Saved to: ${outFile}`);
}

runBackup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
