import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (privateKey) {
  // Replace escaped newlines with actual newline characters
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  try {
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      console.warn('Firebase Admin credentials missing, skipping initialization during build/compile.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.stack);
  }
}

let adminDb = null;
let adminAuth = null;

try {
  if (admin.apps.length > 0) {
    adminDb = admin.firestore();
    adminAuth = admin.auth();
  }
} catch (error) {
  console.error('Firebase Admin services initialization error:', error.stack);
}

export { adminDb, adminAuth, admin };
