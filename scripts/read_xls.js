const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '2026 Franch Express Tracker(1).xls');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`\n--- Sheet: "${sheetName}" ---`);
    console.log('Total Rows:', data.length);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('First Row Sample:', data[0]);
    }
  });
} catch (err) {
  console.error('Error reading workbook:', err);
}
