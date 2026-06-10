'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export function ShipmentSection({ formData, onChange, errors, sno }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSection = () => setIsOpen(!isOpen);

  const courierOptions = ['SmartR', 'Blue Dart', 'DTDC', 'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery'];
  const voucherOptions = ['Normal', 'COD', 'To Pay', 'Safety Plus'];

  return (
    <div className="border border-fe-muted rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Section Header */}
      <button
        type="button"
        onClick={toggleSection}
        className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-fe-bg/30 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-fe-teal/10 text-fe-teal">
            <Package className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-fe-dark font-heading">
              1. Shipment Info
            </h3>
            <p className="text-[10px] text-fe-gray font-sans">
              Booking details, AWB, Courier tracking parameters
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-fe-gray" />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-2 border-t border-fe-muted/20 grid grid-cols-1 md:grid-cols-3 gap-5 bg-white">
              {/* SNO (readonly) */}
              <Input
                label="SNO"
                name="sno"
                value={sno || 'Auto Generated'}
                readOnly
                disabled
              />

              {/* Date */}
              <Input
                label="Booking Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={onChange}
                error={errors.date}
                required
              />

              {/* Voucher Type */}
              <Select
                label="Voucher Type"
                name="voucherType"
                value={formData.voucherType}
                onChange={onChange}
                options={voucherOptions}
                error={errors.voucherType}
                required
              />

              {/* AWB Number */}
              <Input
                label="AWB Number"
                name="awbNumber"
                placeholder="Enter AWB code"
                value={formData.awbNumber}
                onChange={onChange}
                error={errors.awbNumber}
                required
              />

              {/* Courier Partner */}
              <Select
                label="Courier Partner"
                name="courierPartner"
                value={formData.courierPartner}
                onChange={onChange}
                options={courierOptions}
                error={errors.courierPartner}
                required
              />

              {/* POD Number */}
              <Input
                label="POD Number"
                name="podNumber"
                placeholder="Enter POD reference"
                value={formData.podNumber}
                onChange={onChange}
                error={errors.podNumber}
              />

              {/* Mode Toggle (Air / Surface) */}
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-xs font-semibold text-fe-dark font-sans">Mode</span>
                <div className="flex items-center gap-1.5 h-[42px] bg-fe-bg p-1 rounded-lg border border-fe-muted/30">
                  <button
                    type="button"
                    onClick={() => onChange({ target: { name: 'mode', value: 'Air' } })}
                    className={`flex-1 py-1 text-xs font-bold font-sans rounded-md transition-all ${
                      formData.mode === 'Air'
                        ? 'bg-fe-teal text-white shadow-sm'
                        : 'text-fe-gray hover:text-fe-dark'
                    }`}
                  >
                    Air
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ target: { name: 'mode', value: 'Surface' } })}
                    className={`flex-1 py-1 text-xs font-bold font-sans rounded-md transition-all ${
                      formData.mode === 'Surface'
                        ? 'bg-fe-teal text-white shadow-sm'
                        : 'text-fe-gray hover:text-fe-dark'
                    }`}
                  >
                    Surface
                  </button>
                </div>
              </div>

              {/* Nature Toggle (Doc / Non Doc) */}
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-xs font-semibold text-fe-dark font-sans">Nature</span>
                <div className="flex items-center gap-1.5 h-[42px] bg-fe-bg p-1 rounded-lg border border-fe-muted/30">
                  <button
                    type="button"
                    onClick={() => onChange({ target: { name: 'nature', value: 'Doc' } })}
                    className={`flex-1 py-1 text-xs font-bold font-sans rounded-md transition-all ${
                      formData.nature === 'Doc'
                        ? 'bg-fe-teal text-white shadow-sm'
                        : 'text-fe-gray hover:text-fe-dark'
                    }`}
                  >
                    Doc
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ target: { name: 'nature', value: 'Non Doc' } })}
                    className={`flex-1 py-1 text-xs font-bold font-sans rounded-md transition-all ${
                      formData.nature === 'Non Doc'
                        ? 'bg-fe-teal text-white shadow-sm'
                        : 'text-fe-gray hover:text-fe-dark'
                    }`}
                  >
                    Non Doc
                  </button>
                </div>
              </div>

              {/* Goods Description */}
              <Input
                label="Goods Description"
                name="goodsDescription"
                placeholder="Description of package contents"
                value={formData.goodsDescription}
                onChange={onChange}
                error={errors.goodsDescription}
              />

              {/* Weight */}
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

              {/* Volumetric Weight */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
