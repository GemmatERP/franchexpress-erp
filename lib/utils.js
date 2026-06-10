/**
 * Indian Number Formatting System (e.g. ₹1,00,000 instead of ₹100,000)
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  
  // Custom Indian format logic
  const parts = Number(amount).toFixed(0).split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherBits = parts[0].substring(0, parts[0].length - 3);
  if (otherBits !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherBits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return '₹' + formatted + (parts[1] ? '.' + parts[1] : '');
}

/**
 * Format dates to DD-MM-YYYY format
 */
export function formatDate(dateValue) {
  if (!dateValue) return '';
  let d = dateValue;
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    d = dateValue.toDate();
  } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    d = new Date(dateValue);
  }
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Input Date Value for <input type="date"> (YYYY-MM-DD)
 */
export function formatDateForInput(dateValue) {
  if (!dateValue) return '';
  let d = dateValue;
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    d = dateValue.toDate();
  } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    d = new Date(dateValue);
  }
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Format Serial Number (e.g. 15 -> FE-0015)
 */
export function formatSNO(counterValue) {
  return `FE-${String(counterValue).padStart(4, '0')}`;
}

/**
 * Validate Phone: 10 digit Indian mobile format (starting with 6-9)
 */
export function validatePhone(phone) {
  if (!phone) return false;
  return /^[6-9]\d{9}$/.test(phone);
}

/**
 * Validate Pincode: 6 digits numeric
 */
export function validatePincode(pincode) {
  if (!pincode) return false;
  return /^\d{6}$/.test(pincode);
}

/**
 * Get initials for avatar display
 */
export function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
