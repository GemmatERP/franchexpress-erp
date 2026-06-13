const XLSX = require('xlsx');
const path = require('path');

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

const filePath = path.join(__dirname, '..', '2026 Franch Express Tracker(1).xls');
console.log('Loading workbook...');
try {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets['AWB Tracker '];
  if (!sheet) {
    throw new Error('Sheet "AWB Tracker " not found in the Excel file.');
  }

  const data = XLSX.utils.sheet_to_json(sheet);
  console.log('Total Rows in Excel:', data.length);
  
  console.log('\n--- Dry Run: Mapping First 5 Rows ---');
  for (let i = 0; i < Math.min(data.length, 5); i++) {
    const row = data[i];
    
    // Map raw headers to database document fields
    const record = {
      sno: row['SNO: ']?.toString().trim() || '',
      date: parseExcelDate(row['Date ']),
      voucherType: row['Franch Express Voucher Type']?.toString().trim() || 'Normal',
      awbNumber: row['AWB Number']?.toString().trim() || '',
      courierPartner: row['Partners'] || 'Franch Express', // fallback
      podNumber: '', // no pod number in spreadsheet, leave empty or map if found
      mode: row['Air \n/ Surface']?.toString().trim() || 'Surface',
      nature: row['Nature of\n Consignment ']?.toString().trim() || 'Non Doc',
      goodsDescription: row['Nature\n of Goods ']?.toString().trim() || '',
      weight: parseWeight(row['Weight ']),
      volumetricWeight: parseWeight(row['Weight ']), // fallback to same weight if not specified
      
      paymentMode: row['Payment Mode']?.toString().trim() || 'CASH',
      paymentDate: parseExcelDate(row['Payment Date']),
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
      deliveredDate: parseDeliveredDate(row['Delivered Date']),
    };
    
    console.log(`\nRow ${i + 1}:`);
    console.log(JSON.stringify(record, null, 2));
  }
} catch (err) {
  console.error('Error in dry run:', err.stack);
}
