'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CreditCard } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export function PaymentSection({ formData, onChange, errors }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => setIsOpen(!isOpen);

  const paymentModeOptions = ['CASH', 'UPI', 'CREDIT', 'To Pay', 'Debit'];

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
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-fe-dark font-heading">
              2. Payment Info
            </h3>
            <p className="text-[10px] text-fe-gray font-sans">
              Billing mode, service tariffs, paid status toggle
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
              {/* Payment Mode */}
              <Select
                label="Payment Mode"
                name="paymentMode"
                value={formData.paymentMode}
                onChange={onChange}
                options={paymentModeOptions}
                error={errors.paymentMode}
                required
              />

              {/* Payment Date */}
              <Input
                label="Payment Date"
                name="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={onChange}
                error={errors.paymentDate}
              />

              {/* Paid Status Toggle (Paid / Not Paid) */}
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-xs font-semibold text-fe-dark font-sans">Paid Status</span>
                <div className="flex items-center gap-1.5 h-[42px] bg-fe-bg p-1 rounded-lg border border-fe-muted/30">
                  <button
                    type="button"
                    onClick={() => onChange({ target: { name: 'paidStatus', value: 'Paid' } })}
                    className={`flex-1 py-1 text-xs font-bold font-sans rounded-md transition-all ${
                      formData.paidStatus === 'Paid'
                        ? 'bg-fe-teal text-white shadow-sm'
                        : 'text-fe-gray hover:text-fe-dark'
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ target: { name: 'paidStatus', value: 'Not Paid' } })}
                    className={`flex-1 py-1 text-xs font-bold font-sans rounded-md transition-all ${
                      formData.paidStatus === 'Not Paid'
                        ? 'bg-fe-teal text-white shadow-sm'
                        : 'text-fe-gray hover:text-fe-dark'
                    }`}
                  >
                    Not Paid
                  </button>
                </div>
              </div>

              {/* Amount */}
              <Input
                label="Amount (₹)"
                name="amount"
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={onChange}
                error={errors.amount}
              />

              {/* Cover Charges */}
              <Input
                label="Cover Charges (₹)"
                name="coverCharges"
                type="number"
                placeholder="0"
                value={formData.coverCharges}
                onChange={onChange}
                error={errors.coverCharges}
              />

              {/* COD Product Value */}
              <Input
                label="COD Product Value (₹)"
                name="codProductValue"
                type="number"
                placeholder="0"
                value={formData.codProductValue}
                onChange={onChange}
                error={errors.codProductValue}
              />

              {/* Chargeable Amount */}
              <Input
                label="Chargeable Amount (₹)"
                name="chargeableAmount"
                type="number"
                placeholder="0"
                value={formData.chargeableAmount}
                onChange={onChange}
                error={errors.chargeableAmount}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
