const fs = require('fs');
const path = require('path');

// Self-contained .env.local loader to bypass additional package downloads
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      // Remove surrounding quotes if present
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

const admin = require('firebase-admin');

// Validate key variables
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('ERROR: Missing required credentials in .env.local file.');
  console.error('Please configure your .env.local and try again.');
  process.exit(1);
}

if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = admin.firestore();
const auth = admin.auth();

const usersToSeed = [
  {
    email: 'admin@fe.com',
    password: 'Admin@123',
    name: 'Admin Supervisor',
    role: 'admin',
  },
  {
    email: 'employee@fe.com',
    password: 'Emp@123',
    name: 'Booking Desk Staff',
    role: 'employee',
  },
  {
    email: 'delivery@fe.com',
    password: 'Del@123',
    name: 'Delivery Agent Kumar',
    role: 'delivery',
  },
];

const tamilNaduCities = [
  { city: 'Chennai', pincode: '600001', state: 'Tamil Nadu' },
  { city: 'Coimbatore', pincode: '641001', state: 'Tamil Nadu' },
  { city: 'Madurai', pincode: '625001', state: 'Tamil Nadu' },
  { city: 'Salem', pincode: '636001', state: 'Tamil Nadu' },
  { city: 'Trichy', pincode: '620001', state: 'Tamil Nadu' },
  { city: 'Vellore', pincode: '632001', state: 'Tamil Nadu' },
  { city: 'Tirunelveli', pincode: '627001', state: 'Tamil Nadu' },
];

const firstNames = ['Rajesh', 'Priya', 'Senthil', 'Meena', 'Karthik', 'Anitha', 'Vijay', 'Divya', 'Arun', 'Ramesh'];
const lastNames = ['Kumar', 'Sharma', 'Rajan', 'Devi', 'Prabhu', 'Subramanian', 'Balaji', 'Krishnan', 'Sundar'];
const streetNames = ['MG Road', 'Anna Salai', 'Nethaji Street', 'Gandhi Road', 'Avinashi Road', 'Cross Cut Road', 'Mount Road'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone() {
  return String(Math.floor(6000000000 + Math.random() * 3999999999));
}

function generateAWB() {
  return String(Math.floor(10000000000 + Math.random() * 89999999999));
}

async function seed() {
  console.log('Starting FranchExpress database seed...');

  // 1. Seed Auth Users
  const userUIDs = {};
  for (const user of usersToSeed) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(user.email);
      console.log(`User already exists: ${user.email} (UID: ${userRecord.uid})`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.name,
        });
        console.log(`Created user: ${user.email} (UID: ${userRecord.uid})`);
      } else {
        throw err;
      }
    }
    userUIDs[user.role] = userRecord.uid;

    // Overwrite profile doc in /users
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: admin.firestore.Timestamp.now(),
    });
  }

  // 2. Clear previous consignments
  console.log('Clearing old consignments...');
  const consignmentsRef = db.collection('consignments');
  const oldConsignments = await consignmentsRef.get();
  const batch = db.batch();
  oldConsignments.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Cleared ${oldConsignments.size} records.`);

  // 3. Seed 15 realistic consignments
  console.log('Generating 15 realistic consignments...');
  
  // Status breakdown: 5 delivered, 4 out of delivery, 3 transit, 2 returned, 1 holding at HUB
  const statuses = [
    ...Array(5).fill('Delivered'),
    ...Array(4).fill('Out of Delivery'),
    ...Array(3).fill('Transit'),
    ...Array(2).fill('Returned'),
    ...Array(1).fill('Holding at HUB')
  ];

  const courierPartners = ['SmartR', 'Blue Dart', 'DTDC', 'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery'];
  const paymentModes = ['CASH', 'UPI', 'CREDIT', 'To Pay', 'Debit'];
  const voucherTypes = ['Normal', 'COD', 'To Pay', 'Safety Plus'];

  for (let i = 1; i <= 15; i++) {
    const status = statuses[i - 1];
    
    // Choose dates spanning last 10 days
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() - (15 - i) % 10);
    bookingDate.setHours(9 + (i % 8), i * 3 % 60, 0);

    const deliveredDate = status === 'Delivered' ? new Date(bookingDate) : null;
    if (deliveredDate) {
      deliveredDate.setDate(deliveredDate.getDate() + 1 + (i % 2));
      deliveredDate.setHours(11 + (i % 4), i * 7 % 60, 0);
    }

    const consignorLocation = getRandomElement(tamilNaduCities);
    const consigneeLocation = getRandomElement(tamilNaduCities.filter(c => c.city !== consignorLocation.city));

    const amount = 150 + (i * 20);
    const coverCharges = i % 3 === 0 ? 50 : 0;
    const codProductValue = status === 'COD' || i % 4 === 0 ? 1200 + (i * 100) : 0;
    const chargeableAmount = amount + coverCharges;

    const sno = `FE-${String(i).padStart(4, '0')}`;
    const weight = 0.5 + (i * 0.25);
    const volumetricWeight = weight + (i * 0.1);

    const record = {
      sno,
      date: admin.firestore.Timestamp.fromDate(bookingDate),
      voucherType: getRandomElement(voucherTypes),
      awbNumber: generateAWB(),
      courierPartner: getRandomElement(courierPartners),
      podNumber: `POD-${1000 + i}`,
      mode: i % 2 === 0 ? 'Air' : 'Surface',
      nature: i % 3 === 0 ? 'Doc' : 'Non Doc',
      goodsDescription: i % 3 === 0 ? 'Documents Folder' : 'Retail Electronics',
      weight,
      volumetricWeight,

      paymentMode: getRandomElement(paymentModes),
      paymentDate: admin.firestore.Timestamp.fromDate(bookingDate),
      amount,
      coverCharges,
      paidStatus: i % 3 === 0 ? 'Not Paid' : 'Paid',
      codProductValue,
      chargeableAmount,

      consignorPhone: generatePhone(),
      consignorName: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
      consignorAddress1: `${10 + i}, ${getRandomElement(streetNames)}`,
      consignorAddress2: 'Near Junction',
      consignorAddress3: 'Central Post Area',
      consignorCity: consignorLocation.city,
      consignorPincode: consignorLocation.pincode,

      consigneePhone: generatePhone(),
      consigneeName: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
      consigneeAddress1: `${25 + i}, ${getRandomElement(streetNames)}`,
      consigneeAddress2: 'Opposite Park',
      consigneeAddress3: 'Bazaar Street',
      consigneeCity: consigneeLocation.city,
      consigneePincode: consigneeLocation.pincode,
      consigneeState: consigneeLocation.state,

      deliveryStatus: status,
      deliveredDate: deliveredDate ? admin.firestore.Timestamp.fromDate(deliveredDate) : null,
      
      createdAt: admin.firestore.Timestamp.fromDate(bookingDate),
      createdBy: userUIDs['employee'],
      createdByName: 'Booking Desk Staff',
    };

    await db.collection('consignments').add(record);
  }

  // 4. Seed counters document
  console.log('Setting counters to 15...');
  await db.collection('counters').doc('consignments').set({
    count: 15,
  });

  console.log('Database seeding successfully finished!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal Seeding Error:', err.stack);
  process.exit(1);
});
