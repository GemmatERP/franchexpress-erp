'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export function CopyButton({ formData, sno }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Format according to instructions
    const textToCopy = `SNO: ${sno || 'Auto Generated'}
Date: ${formData.date || ''}
Voucher Type: ${formData.voucherType || ''}
AWB Number: ${formData.awbNumber || ''}
Courier Partner: ${formData.courierPartner || ''}
POD Number: ${formData.podNumber || ''}
Payment Mode: ${formData.paymentMode || ''}
Payment Date: ${formData.paymentDate || ''}
Amount: ₹${formData.amount || 0}
Cover Charges: ₹${formData.coverCharges || 0}
Paid Status: ${formData.paidStatus || 'Not Paid'}
COD Product Value: ₹${formData.codProductValue || 0}
Chargeable Amount: ₹${formData.chargeableAmount || 0}
--- CONSIGNOR ---
Name: ${formData.consignorName || ''}
Phone: ${formData.consignorPhone || ''}
Address 1: ${formData.consignorAddress1 || ''}
Address 2: ${formData.consignorAddress2 || ''}
Address 3: ${formData.consignorAddress3 || ''}
City: ${formData.consignorCity || ''}
Pincode: ${formData.consignorPincode || ''}
--- CONSIGNEE ---
Name: ${formData.consigneeName || ''}
Phone: ${formData.consigneePhone || ''}
Address 1: ${formData.consigneeAddress1 || ''}
Address 2: ${formData.consigneeAddress2 || ''}
Address 3: ${formData.consigneeAddress3 || ''}
City: ${formData.consigneeCity || ''}
Pincode: ${formData.consigneePincode || ''}
State: ${formData.consigneeState || ''}
--- SHIPMENT ---
Nature: ${formData.nature || 'Non Doc'}
Goods: ${formData.goodsDescription || ''}
Weight: ${formData.weight || 0} kg
Volumetric Weight: ${formData.volumetricWeight || 0} kg
Mode: ${formData.mode || 'Surface'}
Delivery Status: ${formData.deliveryStatus || 'Transit'}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleCopy}
      className="flex items-center gap-1.5"
      aria-label="Copy all form details to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-fe-green" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>Copy All</span>
        </>
      )}
    </Button>
  );
}
