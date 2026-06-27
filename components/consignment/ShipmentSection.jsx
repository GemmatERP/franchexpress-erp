'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package, AlertCircle, Scan } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import dynamic from 'next/dynamic';

const BarcodeScannerModal = dynamic(
  () => import('./BarcodeScannerModal').then((mod) => mod.BarcodeScannerModal),
  { ssr: false }
);

export function ShipmentSection({ formData, onChange, errors, sno, onAwbBlur, awbDuplicateChecking, sectionNumber = 1 }) {
  const [isOpen, setIsOpen] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);

  const toggleSection = () => setIsOpen(!isOpen);

  const courierOptions = [
    'Franch Express', 'ST Courier', 'SmartR', 'Blue Dart', 'DTDC',
    'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery'
  ];
  const voucherOptions = ['Normal', 'COD', 'To Pay', 'Safety Plus'];

  // Prevent Enter key from submitting the form, trigger blur (duplicate check) instead
  const handleAwbKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  };

  // Today's date as YYYY-MM-DD for the disabled booking date field
  const todayStr = new Date().toISOString().split('T')[0];

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
              {sectionNumber}. Shipment Info
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

              {/* Date — auto-filled, disabled. User cannot change booking date. */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-fe-dark font-sans">
                  Booking Date
                </label>
                <input
                  type="date"
                  name="date"
                  max={todayStr}
                  value={formData.date || todayStr}
                  onChange={onChange}
                  className="h-[42px] px-3 py-2 rounded-lg border border-fe-muted bg-white text-fe-dark text-xs font-sans focus:outline-none focus:ring-2 focus:ring-fe-teal/30"
                />
                <p className="text-[10px] text-fe-gray font-sans">Today or past booking dates only</p>
              </div>

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

              {/* AWB Number — numeric only */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-fe-dark font-sans">
                  AWB Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="awbNumber"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter numeric AWB code"
                    value={formData.awbNumber}
                    onChange={onChange}
                    onKeyDown={handleAwbKeyDown}
                    onBlur={onAwbBlur}
                    className={`h-[42px] w-full pl-3 pr-10 py-2 rounded-lg border text-xs font-sans font-mono transition-all focus:outline-none focus:ring-1 ${
                      errors.awbNumber
                        ? 'border-red-400 bg-red-50 focus:ring-red-300'
                        : 'border-fe-muted bg-white focus:border-fe-teal focus:ring-fe-teal'
                    } ${awbDuplicateChecking ? 'opacity-70' : ''}`}
                    aria-invalid={!!errors.awbNumber}
                    aria-describedby={errors.awbNumber ? 'awb-error' : undefined}
                  />
                  {awbDuplicateChecking ? (
                    <span className="absolute inset-y-0 right-3 flex items-center">
                      <span className="h-3.5 w-3.5 border-2 border-fe-teal border-t-transparent rounded-full animate-spin" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-fe-gray hover:text-fe-teal transition-colors focus:outline-none"
                      title="Scan AWB Barcode"
                    >
                      <Scan className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
                {errors.awbNumber && (
                  <p id="awb-error" className="flex items-center gap-1 text-[11px] text-red-500 font-sans">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.awbNumber}
                  </p>
                )}
                <BarcodeScannerModal
                  isOpen={scannerOpen}
                  onClose={() => setScannerOpen(false)}
                  onScan={(text) => {
                    const clean = text.replace(/\D/g, '');
                    onChange({ target: { name: 'awbNumber', value: clean } });
                    setTimeout(() => {
                      onAwbBlur();
                    }, 100);
                  }}
                />
              </div>

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
