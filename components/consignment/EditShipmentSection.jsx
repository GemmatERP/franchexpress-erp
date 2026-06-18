'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

/**
 * EditShipmentSection
 *
 * Displays shipment info with visual distinction:
 * - Static (read-only) fields: SNO, Booking Date, AWB Number, Mode, Nature
 * - Editable fields: Courier Partner, Voucher Type, Goods Description, Weight, Volumetric Weight
 */
export function EditShipmentSection({ formData, onChange, errors }) {
  const [isOpen, setIsOpen] = useState(true);

  const courierOptions = [
    'Franch Express', 'ST Courier', 'SmartR', 'Blue Dart', 'DTDC',
    'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery'
  ];
  const voucherOptions = ['Normal', 'COD', 'To Pay', 'Safety Plus'];

  return (
    <div className="border border-fe-muted rounded-xl bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-fe-bg/30 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-fe-teal/10 text-fe-teal">
            <Package className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-fe-dark font-heading">1. Shipment Info</h3>
            <p className="text-[10px] text-fe-gray font-sans">
              AWB &amp; Booking details — some fields are locked after booking
            </p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-fe-gray" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-4 border-t border-fe-muted/20 bg-white">
              {/* Static fields label */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider">
                  Locked Fields
                </span>
                <div className="flex-1 h-px bg-fe-muted/30" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {/* SNO — static */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider">SNO</span>
                  <p className="text-sm font-bold text-fe-teal font-mono">{formData.sno || '—'}</p>
                </div>
                {/* AWB — static */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider">AWB Number</span>
                  <p className="text-sm font-semibold text-fe-dark font-mono">{formData.awbNumber || '—'}</p>
                </div>
                {/* Booking Date — static */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider">Booking Date</span>
                  <p className="text-sm font-medium text-fe-dark">{formData.date || '—'}</p>
                </div>
                {/* Mode — static */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider">Mode</span>
                  <p className="text-sm font-medium text-fe-dark">{formData.mode || '—'}</p>
                </div>
                {/* Nature — static */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider">Nature</span>
                  <p className="text-sm font-medium text-fe-dark">{formData.nature || '—'}</p>
                </div>
              </div>

              {/* Editable fields label */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider">
                  Editable Fields
                </span>
                <div className="flex-1 h-px bg-fe-muted/30" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Select
                  label="Courier Partner"
                  name="courierPartner"
                  value={formData.courierPartner}
                  onChange={onChange}
                  options={courierOptions}
                  error={errors.courierPartner}
                />
                <Select
                  label="Voucher Type"
                  name="voucherType"
                  value={formData.voucherType}
                  onChange={onChange}
                  options={voucherOptions}
                  error={errors.voucherType}
                />
                <Input
                  label="Goods Description"
                  name="goodsDescription"
                  placeholder="Description of package contents"
                  value={formData.goodsDescription}
                  onChange={onChange}
                  error={errors.goodsDescription}
                />
                <Input
                  label="Weight (kg)"
                  name="weight"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.weight}
                  onChange={onChange}
                  error={errors.weight}
                />
                <Input
                  label="Volumetric Weight (kg)"
                  name="volumetricWeight"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.volumetricWeight}
                  onChange={onChange}
                  error={errors.volumetricWeight}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
