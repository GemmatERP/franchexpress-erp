import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Helper to format date if it is a Firestore Timestamp or string
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

// All exportable consignment columns with metadata & value extractor
export const EXPORT_COLUMNS = [
  { key: 'sno', label: 'SNO', group: 'Shipment', getValue: (item) => item.sno || '' },
  { key: 'date', label: 'Date', group: 'Shipment', getValue: (item) => formatDate(item.date) },
  { key: 'awbNumber', label: 'AWB Number', group: 'Shipment', getValue: (item) => item.awbNumber || '' },
  { key: 'courierPartner', label: 'Courier Partner', group: 'Shipment', getValue: (item) => item.courierPartner || '' },
  { key: 'podNumber', label: 'POD Number', group: 'Shipment', getValue: (item) => item.podNumber || '' },
  { key: 'voucherType', label: 'Voucher Type', group: 'Shipment', getValue: (item) => item.voucherType || '' },
  { key: 'mode', label: 'Mode', group: 'Shipment', getValue: (item) => item.mode || '' },
  { key: 'nature', label: 'Nature', group: 'Shipment', getValue: (item) => item.nature || '' },
  { key: 'goodsDescription', label: 'Goods Description', group: 'Shipment', getValue: (item) => item.goodsDescription || '' },
  { key: 'weight', label: 'Weight (kg)', group: 'Shipment', getValue: (item) => item.weight || 0 },
  { key: 'volumetricWeight', label: 'Volumetric Weight (kg)', group: 'Shipment', getValue: (item) => item.volumetricWeight || 0 },

  { key: 'paymentMode', label: 'Payment Mode', group: 'Payment & Billing', getValue: (item) => item.paymentMode || '' },
  { key: 'paymentDate', label: 'Payment Date', group: 'Payment & Billing', getValue: (item) => formatDate(item.paymentDate) },
  { key: 'amount', label: 'Amount', group: 'Payment & Billing', getValue: (item) => item.amount || 0 },
  { key: 'cashAmount', label: 'Cash Amount', group: 'Payment & Billing', getValue: (item) => item.cashAmount || 0 },
  { key: 'upiAmount', label: 'UPI Amount', group: 'Payment & Billing', getValue: (item) => item.upiAmount || 0 },
  { key: 'coverCharges', label: 'Cover Charges', group: 'Payment & Billing', getValue: (item) => item.coverCharges || 0 },
  { key: 'paidStatus', label: 'Paid Status', group: 'Payment & Billing', getValue: (item) => item.paidStatus || '' },
  { key: 'codProductValue', label: 'COD Product Value', group: 'Payment & Billing', getValue: (item) => item.codProductValue || 0 },
  { key: 'chargeableAmount', label: 'Chargeable Amount', group: 'Payment & Billing', getValue: (item) => item.chargeableAmount || 0 },

  { key: 'consignorName', label: 'Consignor Name', group: 'Consignor', getValue: (item) => item.consignorName || '' },
  { key: 'consignorPhone', label: 'Consignor Phone', group: 'Consignor', getValue: (item) => item.consignorPhone || '' },
  { key: 'consignorCity', label: 'Consignor City', group: 'Consignor', getValue: (item) => item.consignorCity || '' },
  { key: 'consignorState', label: 'Consignor State', group: 'Consignor', getValue: (item) => item.consignorState || '' },
  { key: 'consignorPincode', label: 'Consignor Pincode', group: 'Consignor', getValue: (item) => item.consignorPincode || '' },

  { key: 'consigneeName', label: 'Consignee Name', group: 'Consignee', getValue: (item) => item.consigneeName || '' },
  { key: 'consigneePhone', label: 'Consignee Phone', group: 'Consignee', getValue: (item) => item.consigneePhone || '' },
  { key: 'consigneeCity', label: 'Consignee City', group: 'Consignee', getValue: (item) => item.consigneeCity || '' },
  { key: 'consigneeState', label: 'Consignee State', group: 'Consignee', getValue: (item) => item.consigneeState || '' },
  { key: 'consigneePincode', label: 'Consignee Pincode', group: 'Consignee', getValue: (item) => item.consigneePincode || '' },

  { key: 'deliveryStatus', label: 'Delivery Status', group: 'Delivery', getValue: (item) => item.deliveryStatus || '' },
  { key: 'deliveredDate', label: 'Delivered Date', group: 'Delivery', getValue: (item) => formatDate(item.deliveredDate) },
  { key: 'createdByName', label: 'Created By', group: 'Delivery', getValue: (item) => item.createdByName || '' },
];

const COLUMN_MAP = Object.fromEntries(EXPORT_COLUMNS.map((col) => [col.key, col]));

// Built-in default report presets
export const BUILT_IN_REPORTS = [
  {
    id: 'overall',
    name: 'Overall Report',
    isBuiltIn: true,
    columns: EXPORT_COLUMNS.map((c) => c.key),
    filters: { courierPartner: 'All', deliveryStatus: 'All', paymentMode: 'All', paidStatus: 'All' },
  },
  {
    id: 'consignee',
    name: 'Consignee Report',
    isBuiltIn: true,
    columns: [
      'sno', 'date', 'awbNumber', 'consigneeName', 'consigneePhone',
      'consigneeCity', 'consigneeState', 'consigneePincode', 'courierPartner', 'deliveryStatus', 'deliveredDate',
    ],
    filters: { courierPartner: 'All', deliveryStatus: 'All', paymentMode: 'All', paidStatus: 'All' },
  },
  {
    id: 'consignor',
    name: 'Consignor Report',
    isBuiltIn: true,
    columns: [
      'sno', 'date', 'awbNumber', 'consignorName', 'consignorPhone',
      'consignorCity', 'consignorState', 'consignorPincode', 'paymentMode', 'amount', 'paidStatus',
    ],
    filters: { courierPartner: 'All', deliveryStatus: 'All', paymentMode: 'All', paidStatus: 'All' },
  },
  {
    id: 'delivery_partner',
    name: 'Delivery Partner Report',
    isBuiltIn: true,
    columns: [
      'sno', 'date', 'awbNumber', 'courierPartner', 'mode',
      'weight', 'volumetricWeight', 'consigneeCity', 'consigneeState', 'deliveryStatus', 'deliveredDate',
    ],
    filters: { courierPartner: 'All', deliveryStatus: 'All', paymentMode: 'All', paidStatus: 'All' },
  },
];

// Helper to format dataset for exports using selected columns (defaults to all)
export const prepareExportData = (consignments, selectedColumnKeys = null) => {
  const activeCols = (selectedColumnKeys && selectedColumnKeys.length > 0)
    ? selectedColumnKeys.map((key) => COLUMN_MAP[key]).filter(Boolean)
    : EXPORT_COLUMNS;

  return consignments.map((item) => {
    const row = {};
    for (const col of activeCols) {
      row[col.label] = col.getValue(item);
    }
    return row;
  });
};

export function exportToCSV(consignments, filename = 'FE-Report', selectedColumnKeys = null) {
  const formattedData = prepareExportData(consignments, selectedColumnKeys);
  const csv = Papa.unparse(formattedData);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(consignments, filename = 'FE-Report', selectedColumnKeys = null, sheetName = 'Report') {
  const formattedData = prepareExportData(consignments, selectedColumnKeys);

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  const maxProps = Object.keys(formattedData[0] || {}).map((key) => ({
    wch: Math.max(key.length + 3, ...formattedData.map((row) => String(row[key] ?? '').length + 2)),
  }));
  worksheet['!cols'] = maxProps;

  const workbook = XLSX.utils.book_new();
  // Excel sheet names must be <= 31 chars and free of : \ / ? * [ ]
  const safeSheetName = String(sheetName || 'Report').replace(/[:\\/?*[\]]/g, '').slice(0, 31) || 'Report';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
