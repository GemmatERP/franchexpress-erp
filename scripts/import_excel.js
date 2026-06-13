const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Load .env.local
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

function parseWeight(weightStr) {
  if (typeof weightStr === 'number') return weightStr;
  if (!weightStr || typeof weightStr !== 'string') return 0;
  
  const cleaned = weightStr.toLowerCase().trim();
  const numericPart = parseFloat(cleaned.replace(/[^\d.]/g, ''));
  if (isNaN(numericPart)) return 0;
  
  if (cleaned.includes('gms') || cleaned.includes('gm') || cleaned.includes(' g')) {
    return numericPart / 1000;
  }
  return numericPart;
}

function parseExcelDate(dateValue) {
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'number') {
    return new Date(Date.UTC(1899, 11, 30) + dateValue * 24 * 60 * 60 * 1000);
  }
  if (!dateValue || typeof dateValue !== 'string') return null;
  const parsed = Date.parse(dateValue);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

function parseDeliveredDate(dateValue, baseYear = 2026) {
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'number') {
    return parseExcelDate(dateValue);
  }
  if (!dateValue || typeof dateValue !== 'string') return null;
  
  const cleaned = dateValue.trim().replace(/(st|nd|rd|th)$/i, '');
  const parsed = Date.parse(`${cleaned} ${baseYear}`);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }
  return null;
}

// Helper to delete collection in batches of 500
async function deleteCollection(collectionRef) {
  const snapshot = await collectionRef.limit(500).get();
  if (snapshot.size === 0) {
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Deleted ${snapshot.size} old records...`);
  await deleteCollection(collectionRef);
}

async function importExcel() {
  console.log('--- Starting Database Import ---');
  
  // 1. Clear old consignments
  console.log('Clearing existing consignments from database...');
  const consignmentsRef = db.collection('consignments');
  await deleteCollection(consignmentsRef);
  console.log('All old consignments successfully cleared.');

  // 2. Load and parse Excel file
  const filePath = path.join(__dirname, '..', '2026 Franch Express Tracker(1).xls');
  console.log('Reading Excel file:', filePath);
  
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets['AWB Tracker '];
  if (!sheet) {
    throw new Error('Sheet "AWB Tracker " not found in the Excel file.');
  }

  const data = XLSX.utils.sheet_to_json(sheet);
  const totalRows = data.length;
  console.log(`Found ${totalRows} rows to import.`);

  // 3. Batch insert records
  let batch = db.batch();
  let count = 0;
  let batchCount = 0;
  
  // Use Employee UID as creator for consistency
  const employeeUid = 'TeXBmWbhFtdp6ZqePCoPq7rMTOg1';
  
  for (let i = 0; i < totalRows; i++) {
    const row = data[i];
    
    const awbNumber = row['AWB Number']?.toString().trim();
    if (!awbNumber) {
      continue; // Skip rows without AWB Number
    }

    const dateObj = parseExcelDate(row['Date ']);
    const payDateObj = parseExcelDate(row['Payment Date']);
    const delDateObj = parseDeliveredDate(row['Delivered Date']);

    // Auto-generate SNO sequentially based on current imported count
    const sno = `FE-${String(count + 1).padStart(4, '0')}`;

    const record = {
      sno,
      date: dateObj ? admin.firestore.Timestamp.fromDate(dateObj) : admin.firestore.Timestamp.now(),
      voucherType: row['Franch Express Voucher Type']?.toString().trim() || 'Normal',
      awbNumber,
      courierPartner: row['Partners']?.toString().trim() || 'Franch Express',
      podNumber: '',
      mode: row['Air \n/ Surface']?.toString().trim() || 'Surface',
      nature: row['Nature of\n Consignment ']?.toString().trim() || 'Non Doc',
      goodsDescription: row['Nature\n of Goods ']?.toString().trim() || '',
      weight: parseWeight(row['Weight ']),
      volumetricWeight: parseWeight(row['Weight ']),
      
      paymentMode: row['Payment Mode']?.toString().trim() || 'CASH',
      paymentDate: payDateObj ? admin.firestore.Timestamp.fromDate(payDateObj) : null,
      amount: Number(row['Amount']) || 0,
      coverCharges: 0,
      paidStatus: row['Payment Mode'] ? 'Paid' : 'Not Paid',
      codProductValue: 0,
      chargeableAmount: Number(row['Amount']) || 0,

      consignorPhone: row['Consignor Phone Number']?.toString().trim() || '',
      consignorName: row['Consignor Name']?.toString().trim() || '',
      consignorAddress1: row['Address 1']?.toString().trim() || '',
      consignorAddress2: row['Address 2']?.toString().trim() || '',
      consignorAddress3: row['Address 3']?.toString().trim() || '',
      consignorCity: row['City']?.toString().trim() || '',
      consignorPincode: row['Pincode']?.toString().trim() || '',

      consigneePhone: row['Consignee Phone Number']?.toString().trim() || '',
      consigneeName: row['Consignee Name']?.toString().trim() || '',
      consigneeAddress1: row['Address 1_1']?.toString().trim() || '',
      consigneeAddress2: row['Address 2_1']?.toString().trim() || '',
      consigneeAddress3: row['Address 3_1']?.toString().trim() || '',
      consigneeCity: row['City_1']?.toString().trim() || '',
      consigneePincode: row['Pincode_1']?.toString().trim() || '',
      consigneeState: row['State']?.toString().trim() || 'Tamil Nadu',

      deliveryStatus: row['Delivery Status ']?.toString().trim() || 'Transit',
      deliveredDate: delDateObj ? admin.firestore.Timestamp.fromDate(delDateObj) : null,
      
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: employeeUid,
      createdByName: 'Booking Desk Staff',
    };

    // Reference to a new doc in consignments
    const newDocRef = consignmentsRef.doc();
    batch.set(newDocRef, record);
    
    count++;
    batchCount++;
    
    // Commit batch every 500 documents
    if (batchCount === 500) {
      console.log(`Writing batch: ${count} loaded...`);
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  
  // Commit remaining records
  if (batchCount > 0) {
    console.log(`Writing final batch: ${count} loaded...`);
    await batch.commit();
  }
  
  // 4. Update consignment counter to the total imported count
  console.log(`Setting booking counter to ${count}...`);
  await db.collection('counters').doc('consignments').set({
    count: count,
  });

  console.log(`Database import successfully finished! Total imported: ${count}`);
  process.exit(0);
}

importExcel().catch((err) => {
  console.error('Import Failed:', err.stack);
  process.exit(1);
});
