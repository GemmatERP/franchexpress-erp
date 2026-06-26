/**
 * Import script: Delete all existing consignments and seed from 2026 Excel tracker
 * Usage: node scratch/import_xls.mjs
 */

import XLSX from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Firebase Admin Init ──────────────────────────────────────────────────────
const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDze+I4RDqm+MOd\n/xARvRrHOpzLluW8yK0i2ySP7oR652l7MCYl3BdQn9aLzyv7JQS4OvXgz83gmAgB\nMLY65ZOX/xh1TtB829QBaEe0pfz11HDBMoZGp6dVQSjDOi2TAmBdG/zlOT+rpWjC\n7+bMs0xMRlgG3YqDAYKPxb+gBu9B5rDSAjLBoZ7IoUBZ0XLKf2K98I9PPiJjRCfE\nTDcVz0wHpWjs4Rv4V6fR2HPeyW8pW5WKt7NeZnTqKNmbMkQbGPUgRfv10tqC/ecM\nSZDX6JMpp3UzCwBeW4ooEl6EO3UeRIJDNUMdIrjBN8fe/kk1Qtyu1jlLaCnJIxdE\nLDCAJ5CVAgMBAAECggEAEiOPhdDnbFr/T7zvDd3q/x6fDGJlzmZGJ7ZFsgdQjUts\nxfBKAetfPUgQbAKiFyf52F5kGjxrl6jGfTg2IIshL2NMsiiN9aShgFKsIjQfdTzq\nAtU9wEkVzo8id0Yqm6zDUGHDubFFzLFvmDOBG+Iw8+8QTb/2uq3DyUGFIL8uLILa\n7LjToANqz1l6XRDjjDutyGAAX9DjmFL/dxWcJgOmaIiZEae0Kf6ji/I1EuCr5OU/\nB9nOQfGpnI5pwjD3JW0iXSQF+DDatPTv0w6fIcUVMmXMwy2JN2loXWZLdgbnu3nG\nQd0kL+1wbImq/cuXbkBCeB1VvXERMcplRSUM8iG2AQKBgQD/SlvZVZluRY5c7YXK\nnKKBhWfhDY9N96zXD0bDuciQVRBJ6ZWgoIbb0lejax3Wk2lYw4rjSgt9+BLpNuUu\nXqyafxOa4jNq7fbKIReVxCHHiUF2p0GvnV7g7vLgLLutk7mqOsYd87JXH25ulIqr\nXmlyU9TeoJvyi4e82I+BIh6FgQKBgQD0KR/bAxwEz9JtWSTXVA7Lyj3e31aG5O1V\n4FPqH+UnP1mPPkKPXwJn7GUpvg1uqUl5URFDByDxjQtQOhJA+TbmXoP17OackBmm\nrjVp/U5bPERpJTo4UodBcvDIPUNReZRiJTwE9rzLThjdA/wblYhm9m4FvGQDfu0T\nuoIhmAcdFQKBgQDN/KG/62GxqE4GjWC260v0VkBLRzWqI35CyQDATNeYHgrWmLMy\nuFQYatBr+7JHwQnvpVgbrVM4gUJBCxpBIAMFZiPbhUkXrorC7ZCqN2dKKWW455wI\np2I2/JbcazvEAr58rI/O+yObSLFCaHi7baKHrTzFpbIvMoaDyfmAqJcYAQKBgQC8\n3Mq9WMxllHQLDXeH8Id5b7koGs4Njitf0CRY588T6tbWDKzjxfRQevVNsqslPGGP\nK/wUQwFil11281SHWb7zt4yPwG4qEPUmj37Vu5DO1fF8+8TrKDtjjwtdeLYH4em7\neV3R4SHsiT6GR7zNgX9/VYOJgE5EvfuY1R4v6i8meQKBgAQfSq3RA0YnlvZ1cd8A\nexUeBJnQOBvS41kxU9dqUPqhd1LBCUH8D20kr6mOjVHrLHjBDC42FMnFIGs+ipmp\nRLOE9h96J8oD/C3OFve6sldcRb1GrenkB0d0y3XTpW0Le5Q1C1GXkECYjq+MGBq3\n5NNlzFKyOsDyF3Od5Smo5ocm\n-----END PRIVATE KEY-----\n`;

initializeApp({
  credential: cert({
    projectId: 'franchexpress-erp',
    clientEmail: 'firebase-adminsdk-fbsvc@franchexpress-erp.iam.gserviceaccount.com',
    privateKey,
  }),
});

const db = getFirestore();

// ── Helpers ──────────────────────────────────────────────────────────────────

function excelSerialToDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const utcMs = (serial - 25569) * 86400 * 1000;
  const d = new Date(utcMs);
  if (d.getFullYear() === 2025) {
    d.setFullYear(2026);
  }
  return d;
}

function parseDeliveredDate(str) {
  if (!str || typeof str !== 'string') return null;
  const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
  const match = str.trim().match(/^([a-z]+)\s+(\d+)/i);
  if (!match) return null;
  const mon = months[match[1].toLowerCase()];
  const day = parseInt(match[2], 10);
  if (mon === undefined || isNaN(day)) return null;
  return new Date(Date.UTC(2026, mon, day)).toISOString().split('T')[0];
}

function parseExcelAmount(amtStr, paymentMode) {
  if (amtStr === null || amtStr === undefined) {
    return { amount: 0, cashAmount: 0, upiAmount: 0, paymentMode };
  }
  if (typeof amtStr === 'number') {
    const val = amtStr;
    const isCash = paymentMode === 'CASH';
    const isUpi = paymentMode === 'UPI';
    return {
      amount: val,
      cashAmount: isCash ? val : 0,
      upiAmount: isUpi ? val : 0,
      paymentMode,
    };
  }

  const str = String(amtStr).trim().toLowerCase();
  if (!str) {
    return { amount: 0, cashAmount: 0, upiAmount: 0, paymentMode };
  }

  if (str.includes('+')) {
    const parts = str.split('+');
    let cashAmount = 0;
    let upiAmount = 0;
    let finalPaymentMode = paymentMode;

    parts.forEach(part => {
      const cleaned = part.trim();
      const numVal = parseFloat(cleaned) || 0;
      if (cleaned.endsWith('upi') || cleaned.endsWith('gpay') || cleaned.endsWith('paytm')) {
        upiAmount += numVal;
      } else if (cleaned.endsWith('cash')) {
        cashAmount += numVal;
      } else {
        if (paymentMode === 'UPI') {
          upiAmount += numVal;
        } else {
          cashAmount += numVal;
        }
      }
    });

    const total = cashAmount + upiAmount;
    if (cashAmount > 0 && upiAmount > 0) {
      finalPaymentMode = 'CASH + UPI';
    }

    return {
      amount: total,
      cashAmount,
      upiAmount,
      paymentMode: finalPaymentMode,
    };
  }

  const numVal = parseFloat(str) || 0;
  if (str.endsWith('upi') || str.endsWith('gpay') || str.endsWith('paytm')) {
    return { amount: numVal, cashAmount: 0, upiAmount: numVal, paymentMode: 'UPI' };
  }
  if (str.endsWith('cash')) {
    return { amount: numVal, cashAmount: numVal, upiAmount: 0, paymentMode: 'CASH' };
  }

  const isCash = paymentMode === 'CASH';
  const isUpi = paymentMode === 'UPI';
  return {
    amount: numVal,
    cashAmount: isCash ? numVal : 0,
    upiAmount: isUpi ? numVal : 0,
    paymentMode,
  };
}

async function deleteCollection(collectionName) {
  console.log(`\n🗑  Deleting all docs in '${collectionName}'...`);
  let total = 0;
  while (true) {
    const snap = await db.collection(collectionName).limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    process.stdout.write(`\r   Deleted ${total} docs...`);
  }
  console.log(`\n   ✅ Deleted ${total} docs from '${collectionName}'`);
}

// ── Column index map (0-based) ────────────────────────────────────────────────
const C = {
  sno: 0, date: 1, voucherType: 2, awbNumber: 3, courierPartner: 4,
  podNumber: 5, paymentMode: 6, paymentDate: 7, amount: 8, coverCharges: 9,
  paidStatus: 10, codProductValue: 11, consignorPhone: 12, consignorName: 13,
  consignorAddr1: 14, consignorAddr2: 15, consignorAddr3: 16, consignorCity: 17,
  consignorPincode: 18, consigneePhone: 19, consigneeName: 20,
  consigneeAddr1: 21, consigneeAddr2: 22, consigneeAddr3: 23,
  consigneeCity: 24, consigneePincode: 25, consigneeState: 26,
  nature: 27, goodsDesc: 28, weight: 29, volWeight: 30, mode: 31,
  deliveredDate: 32, deliveryStatus: 33,
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Delete all existing consignments
  await deleteCollection('consignments');

  // 2. Reset SNO counter
  console.log('\n🔢 Resetting SNO counter...');
  await db.collection('counters').doc('consignments').set({ count: 0 });

  // 3. Read Excel
  const xlsPath = join(__dirname, '..', '2026 New Franch Express Tracker.xls');
  console.log('\n📂 Reading:', xlsPath);
  const wb = XLSX.readFile(xlsPath);
  const sheetName = wb.SheetNames.find(s => s.trim() === 'AWB Tracker');
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const dataRows = rows.slice(1).filter(r => r[C.awbNumber]);
  console.log(`📊 ${dataRows.length} records with AWB numbers`);

  // 4. Import in batches of 400
  let imported = 0;
  let skipped = 0;
  const BATCH_SIZE = 400;

  for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
    const chunk = dataRows.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const row of chunk) {
      const sno = String(row[C.sno] || '').trim();
      if (!sno) { skipped++; continue; }

      const bookingDate = excelSerialToDate(row[C.date]);
      const paymentDate = excelSerialToDate(row[C.paymentDate]);
      const deliveredDateStr = parseDeliveredDate(row[C.deliveredDate]);

      const rawMode = String(row[C.paymentMode] || 'CASH').trim().toUpperCase();
      let initMode = rawMode;
      if (rawMode === 'TO PAY') initMode = 'To Pay';
      else if (rawMode === 'CREDIT') initMode = 'CREDIT';
      else if (rawMode === 'CASH') initMode = 'CASH';
      else if (rawMode === 'UPI') initMode = 'UPI';

      const parsedAmt = parseExcelAmount(row[C.amount], initMode);
      const amount = parsedAmt.amount;
      const cashAmount = parsedAmt.cashAmount;
      const upiAmount = parsedAmt.upiAmount;
      const paymentMode = parsedAmt.paymentMode;

      const coverCharges = Number(row[C.coverCharges]) || 0;
      const codProductValue = Number(row[C.codProductValue]) || 0;

      // Normalize delivery status
      const rawStatus = String(row[C.deliveryStatus] || '').trim();
      let deliveryStatus = rawStatus;
      if (rawStatus.toLowerCase() === 'rto') deliveryStatus = 'Returned';
      if (!deliveryStatus) deliveryStatus = 'Transit';

      // Normalize courier partner
      let courierPartner = String(row[C.courierPartner] || '').trim();
      courierPartner = courierPartner.replace(/FED\s*Ex/i, 'FedEx').replace(/FEDEX/i, 'FedEx');

      const paidStatus = String(row[C.paidStatus] || '').trim() ||
        (paymentMode === 'CREDIT' ? 'Not Paid' : 'Paid');

      const doc = {
        sno,
        date: bookingDate ? Timestamp.fromDate(bookingDate) : null,
        voucherType: String(row[C.voucherType] || 'Normal').trim(),
        awbNumber: String(row[C.awbNumber]).trim(),
        courierPartner,
        podNumber: row[C.podNumber] ? String(row[C.podNumber]).trim() : '',
        paymentMode,
        paymentDate: paymentDate ? Timestamp.fromDate(paymentDate) : null,
        amount,
        cashAmount,
        upiAmount,
        coverCharges,
        chargeableAmount: amount + coverCharges,
        codProductValue,
        paidStatus,
        consignorPhone: row[C.consignorPhone] ? String(row[C.consignorPhone]).trim() : '',
        consignorName: String(row[C.consignorName] || '').trim(),
        consignorAddress1: String(row[C.consignorAddr1] || '').trim(),
        consignorAddress2: String(row[C.consignorAddr2] || '').trim(),
        consignorAddress3: String(row[C.consignorAddr3] || '').trim(),
        consignorCity: String(row[C.consignorCity] || '').trim(),
        consignorPincode: row[C.consignorPincode] ? String(row[C.consignorPincode]).trim() : '',
        consigneePhone: row[C.consigneePhone] ? String(row[C.consigneePhone]).trim() : '',
        consigneeName: String(row[C.consigneeName] || '').trim(),
        consigneeAddress1: String(row[C.consigneeAddr1] || '').trim(),
        consigneeAddress2: String(row[C.consigneeAddr2] || '').trim(),
        consigneeAddress3: String(row[C.consigneeAddr3] || '').trim(),
        consigneeCity: String(row[C.consigneeCity] || '').trim(),
        consigneePincode: row[C.consigneePincode] ? String(row[C.consigneePincode]).trim() : '',
        consigneeState: String(row[C.consigneeState] || '').trim(),
        nature: String(row[C.nature] || '').trim(),
        goodsDescription: String(row[C.goodsDesc] || '').trim(),
        weight: String(row[C.weight] || '').trim(),
        volumetricWeight: String(row[C.volWeight] || '').trim(),
        mode: String(row[C.mode] || '').trim(),
        deliveredDate: deliveredDateStr || null,
        deliveryStatus,
        createdAt: FieldValue.serverTimestamp(),
        createdByName: 'Imported from 2026 Tracker',
      };

      // Remove nulls
      Object.keys(doc).forEach(k => { if (doc[k] === null || doc[k] === undefined) delete doc[k]; });

      batch.set(db.collection('consignments').doc(), doc);
      imported++;
    }

    await batch.commit();
    process.stdout.write(`\r   Imported ${imported}/${dataRows.length}...`);
  }

  // 5. Update counter
  const lastRow = dataRows[dataRows.length - 1];
  const lastNum = parseInt(String(lastRow[C.sno]).replace(/\D/g, ''), 10) || dataRows.length;
  await db.collection('counters').doc('consignments').set({ count: lastNum });

  console.log(`\n\n🎉 Done!`);
  console.log(`   ✅ Imported : ${imported}`);
  console.log(`   ⚠️  Skipped  : ${skipped}`);
  console.log(`   🔢 Counter  : ${lastNum}`);
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
