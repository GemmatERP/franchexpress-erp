'use client';

import React, { useState } from 'react';
import { Phone, MessageSquare, Check, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';

export function DeliveryCard({ consignment, onStatusUpdate, loading = false }) {
  const [selectedStatus, setSelectedStatus] = useState(consignment.deliveryStatus);

  const {
    id,
    sno,
    awbNumber,
    courierPartner,
    mode,
    nature,
    codProductValue = 0,
    weight = 0,
    chargeableAmount = 0,
    consignorName,
    consignorPhone,
    consignorAddress1,
    consignorAddress2,
    consignorAddress3,
    consignorCity,
    consignorPincode,
    consigneeName,
    consigneePhone,
    consigneeAddress1,
    consigneeAddress2,
    consigneeAddress3,
    consigneeCity,
    consigneePincode,
    consigneeState,
  } = consignment;

  const handleStatusChange = async (e) => {
    const status = e.target.value;
    setSelectedStatus(status);
    if (onStatusUpdate) {
      onStatusUpdate(id, status);
    }
  };

  const whatsappText = encodeURIComponent(
    `Your shipment ${awbNumber} is out for delivery today. FranchExpress Team`
  );

  return (
    <Card hoverEffect className="w-full border border-fe-muted/60 divide-y divide-fe-muted/40 p-0 overflow-hidden shadow-md">
      {/* Top Banner: SNO + Status Dropdown */}
      <div className="px-6 py-4 flex flex-wrap justify-between items-center bg-fe-bg/40 gap-3">
        <div>
          <span className="text-sm font-bold text-fe-teal font-mono">{sno}</span>
          <span className="text-[11px] text-fe-gray font-mono ml-2">
            AWB: {awbNumber} · {courierPartner} · {mode} · {nature}
          </span>
        </div>
        
        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-fe-muted text-xs font-semibold font-sans bg-white focus:outline-none focus:ring-2 focus:ring-fe-teal"
            aria-label="Update delivery status"
          >
            <option value="Transit">Transit</option>
            <option value="Reached Destination">Reached Destination</option>
            <option value="Out of Delivery">Out of Delivery</option>
            <option value="Returned">Returned</option>
            <option value="Holding at HUB">Holding at HUB</option>
            <option value="Delivered">Delivered</option>
          </select>
          <Badge value={selectedStatus} className="text-[10px]" />
        </div>
      </div>

      {/* FROM: Consignor Details */}
      <div className="px-6 py-4">
        <p className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-sans">
          FROM
        </p>
        <div className="mt-1 flex justify-between items-start gap-4">
          <div className="text-xs text-fe-dark font-sans leading-relaxed">
            <p className="font-bold text-fe-dark">{consignorName}</p>
            <p>{consignorAddress1}</p>
            {(consignorAddress2 || consignorAddress3) && (
              <p>{[consignorAddress2, consignorAddress3].filter(Boolean).join(', ')}</p>
            )}
            <p className="font-medium text-fe-gray">
              {consignorCity} - {consignorPincode}
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <a
              href={`tel:+91${consignorPhone}`}
              className="p-2 rounded-lg border border-fe-muted hover:bg-fe-bg text-fe-gray hover:text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal"
              title="Call sender"
              aria-label={`Call sender ${consignorName}`}
            >
              <Phone className="h-4 w-4" />
            </a>
            <a
              href={`https://wa.me/91${consignorPhone}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-fe-muted hover:bg-fe-bg text-fe-gray hover:text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal"
              title="WhatsApp sender"
              aria-label={`WhatsApp sender ${consignorName}`}
            >
              <MessageSquare className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* TO: Consignee Details */}
      <div className="px-6 py-4">
        <p className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-sans">
          TO
        </p>
        <div className="mt-1 flex justify-between items-start gap-4">
          <div className="text-xs text-fe-dark font-sans leading-relaxed">
            <p className="font-bold text-fe-dark">{consigneeName}</p>
            <p>{consigneeAddress1}</p>
            {(consigneeAddress2 || consigneeAddress3) && (
              <p>{[consigneeAddress2, consigneeAddress3].filter(Boolean).join(', ')}</p>
            )}
            <p className="font-medium text-fe-gray">
              {consigneeCity} - {consigneePincode}, {consigneeState}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <a
              href={`tel:+91${consigneePhone}`}
              className="p-2 rounded-lg border border-fe-muted hover:bg-fe-bg text-fe-gray hover:text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal"
              title="Call recipient"
              aria-label={`Call recipient ${consigneeName}`}
            >
              <Phone className="h-4 w-4" />
            </a>
            <a
              href={`https://wa.me/91${consigneePhone}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-fe-muted hover:bg-fe-bg text-fe-gray hover:text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal"
              title="WhatsApp recipient"
              aria-label={`WhatsApp recipient ${consigneeName}`}
            >
              <MessageSquare className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Summary: COD, Weight, Chargeable amount */}
      <div className="px-6 py-4 bg-fe-bg/10 flex justify-between items-center text-xs font-sans text-fe-gray">
        <div>
          COD: <span className="font-bold text-fe-dark">{formatCurrency(codProductValue)}</span>
        </div>
        <div>
          Weight: <span className="font-bold text-fe-dark">{weight} kg</span>
        </div>
        <div>
          Chargeable: <span className="font-bold text-fe-dark">{formatCurrency(chargeableAmount)}</span>
        </div>
      </div>
    </Card>
  );
}
