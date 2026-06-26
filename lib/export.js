import Papa from 'papaparse';
import * as XLSX from 'xlsx';


// Helper to format date if it is a Firestore Timestamp
const formatDate = (dateValue) => {
  if (!dateValue) return '';
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    const d = dateValue.toDate();
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  }
  if (dateValue instanceof Date) {
    return `${dateValue.getDate().toString().padStart(2, '0')}-${(dateValue.getMonth() + 1).toString().padStart(2, '0')}-${dateValue.getFullYear()}`;
  }
  if (typeof dateValue === 'string') {
    try {
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) {
        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
      }
    } catch (_) {}
  }
  return dateValue;
};

// Helper to format dataset for exports
const prepareExportData = (consignments) => {
  return consignments.map(item => ({
    'SNO': item.sno || '',
    'Date': formatDate(item.date),
    'AWB Number': item.awbNumber || '',
    'Courier Partner': item.courierPartner || '',
    'POD Number': item.podNumber || '',
    'Voucher Type': item.voucherType || '',
    'Mode': item.mode || '',
    'Nature': item.nature || '',
    'Goods Description': item.goodsDescription || '',
    'Weight (kg)': item.weight || 0,
    'Volumetric Weight (kg)': item.volumetricWeight || 0,
    'Payment Mode': item.paymentMode || '',
    'Payment Date': formatDate(item.paymentDate),
    'Amount': item.amount || 0,
    'Cash Amount': item.cashAmount || 0,
    'UPI Amount': item.upiAmount || 0,
    'Cover Charges': item.coverCharges || 0,
    'Paid Status': item.paidStatus || '',
    'COD Product Value': item.codProductValue || 0,
    'Chargeable Amount': item.chargeableAmount || 0,
    'Consignor Name': item.consignorName || '',
    'Consignor Phone': item.consignorPhone || '',
    'Consignor City': item.consignorCity || '',
    'Consignee Name': item.consigneeName || '',
    'Consignee Phone': item.consigneePhone || '',
    'Consignee City': item.consigneeCity || '',
    'Consignee State': item.consigneeState || '',
    'Delivery Status': item.deliveryStatus || '',
    'Delivered Date': formatDate(item.deliveredDate),
    'Created By': item.createdByName || '',
  }));
};

export function exportToCSV(consignments, filename = 'FE-Report') {
  const formattedData = prepareExportData(consignments);
  const csv = Papa.unparse(formattedData);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(consignments, filename = 'FE-Report') {
  const formattedData = prepareExportData(consignments);
  
  // Create worksheets
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  // Set sheet columns widths to look neat
  const maxProps = Object.keys(formattedData[0] || {}).map(key => ({
    wch: Math.max(key.length + 3, ...formattedData.map(row => String(row[key] || '').length + 2))
  }));
  worksheet['!cols'] = maxProps;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consignments');
  
  // Write and trigger download
  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
}
