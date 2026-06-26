'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CreditCard } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatDateForInput } from '../../lib/utils';

/**
 * PaymentSection — Conditional Logic:
 *
 * - CASH / UPI:
 *     paidStatus locked to "Paid" (toggle disabled)
 *     paymentDate auto-set to today, disabled (non-editable)
 *     COD Product Value hidden
 *
 * - COD:
 *     COD Product Value field shown
 *     paidStatus toggle enabled
 *     If "Not Paid": paymentDate hidden
 *     If "Paid":     paymentDate shown, editable
 *
 * - CREDIT / To Pay:
 *     COD Product Value hidden
 *     paidStatus toggle enabled
 *     If "Not Paid": paymentDate hidden
 *     If "Paid":     paymentDate shown, editable
 *
 * - Chargeable Amount: read-only auto-calc = amount + coverCharges
 */
export function PaymentSection({ formData, onChange, errors, sectionNumber = 4 }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => setIsOpen(!isOpen);

  const paymentModeOptions = ['CASH', 'UPI', 'CASH + UPI', 'To Pay', 'CREDIT', 'COD'];

  const isCashOrUpi = formData.paymentMode === 'CASH' || formData.paymentMode === 'UPI' || formData.paymentMode === 'CASH + UPI';
  const isCOD = formData.paymentMode === 'COD';
  const isSplit = formData.paymentMode === 'CASH + UPI';
  const showPaymentDate = isCashOrUpi || formData.paidStatus === 'Paid';
  const paymentDateEditable = !isCashOrUpi;

  // Whenever mode switches to CASH/UPI/CASH + UPI, auto-lock paid status and set today's date
  useEffect(() => {
    if (isCashOrUpi) {
      if (formData.paidStatus !== 'Paid') {
        onChange({ target: { name: 'paidStatus', value: 'Paid' } });
      }
      const today = formatDateForInput(new Date());
      if (!formData.paymentDate || formData.paymentDate !== today) {
        onChange({ target: { name: 'paymentDate', value: today } });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.paymentMode]);

  // Automatically sum cashAmount and upiAmount if CASH + UPI is selected
  useEffect(() => {
    if (isSplit) {
      const cash = Number(formData.cashAmount) || 0;
      const upi = Number(formData.upiAmount) || 0;
      const total = cash + upi;
      if (Number(formData.amount) !== total) {
        onChange({ target: { name: 'amount', value: total.toString() } });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cashAmount, formData.upiAmount, isSplit]);

  // Clear cashAmount and upiAmount when switching away from CASH + UPI
  useEffect(() => {
    if (formData.paymentMode !== 'CASH + UPI') {
      if (formData.cashAmount !== undefined && formData.cashAmount !== '') {
        onChange({ target: { name: 'cashAmount', value: '' } });
      }
      if (formData.upiAmount !== undefined && formData.upiAmount !== '') {
        onChange({ target: { name: 'upiAmount', value: '' } });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.paymentMode]);

  // Chargeable amount = amount + coverCharges (auto-computed)
  const chargeableAmount = (Number(formData.amount) || 0) + (Number(formData.coverCharges) || 0);

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
              {sectionNumber}. Payment Info
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
            <div className="px-6 pb-6 pt-2 border-t border-fe-muted/20 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

                {/* Paid Status Toggle */}
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-semibold text-fe-dark font-sans">Paid Status</span>
                  <div className={`flex items-center gap-1.5 h-[42px] bg-fe-bg p-1 rounded-lg border border-fe-muted/30 ${isCashOrUpi ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <button
                      type="button"
                      disabled={isCashOrUpi}
                      onClick={() => !isCashOrUpi && onChange({ target: { name: 'paidStatus', value: 'Paid' } })}
                      className={`flex-1 py-1 text-xs font-bold font-sans rounded-md transition-all ${
                        formData.paidStatus === 'Paid'
                          ? 'bg-fe-teal text-white shadow-sm'
                          : 'text-fe-gray hover:text-fe-dark'
                      } ${isCashOrUpi ? 'pointer-events-none' : ''}`}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      disabled={isCashOrUpi}
                      onClick={() => !isCashOrUpi && onChange({ target: { name: 'paidStatus', value: 'Not Paid' } })}
                      className={`flex-1 py-1 text-xs font-bold font-sans rounded-md transition-all ${
                        formData.paidStatus === 'Not Paid'
                          ? 'bg-fe-teal text-white shadow-sm'
                          : 'text-fe-gray hover:text-fe-dark'
                      } ${isCashOrUpi ? 'pointer-events-none' : ''}`}
                    >
                      Not Paid
                    </button>
                  </div>
                  {isCashOrUpi && (
                    <p className="text-[10px] text-fe-gray font-sans">Auto-set for {formData.paymentMode}</p>
                  )}
                </div>

                {/* Payment Date — conditional visibility */}
                {showPaymentDate && (
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-semibold text-fe-dark font-sans">Payment Date</label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={paymentDateEditable ? onChange : undefined}
                      readOnly={!paymentDateEditable}
                      disabled={!paymentDateEditable}
                      className={`h-[42px] px-3 py-2 rounded-lg border text-xs font-sans transition-all focus:outline-none focus:ring-1 ${
                        !paymentDateEditable
                          ? 'border-fe-muted bg-fe-bg text-fe-gray cursor-not-allowed opacity-70'
                          : 'border-fe-muted bg-white focus:border-fe-teal focus:ring-fe-teal'
                      }`}
                    />
                    {!paymentDateEditable && (
                      <p className="text-[10px] text-fe-gray font-sans">Auto-set to today</p>
                    )}
                  </div>
                )}

                {/* Amount or Split Cash/UPI Inputs */}
                {isSplit ? (
                  <>
                    <Input
                      label="Cash Part (₹)"
                      name="cashAmount"
                      type="number"
                      placeholder="0"
                      value={formData.cashAmount || ''}
                      onChange={onChange}
                      error={errors.cashAmount}
                      required
                    />
                    <Input
                      label="UPI Part (₹)"
                      name="upiAmount"
                      type="number"
                      placeholder="0"
                      value={formData.upiAmount || ''}
                      onChange={onChange}
                      error={errors.upiAmount}
                      required
                    />
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-semibold text-fe-dark font-sans">
                        Total Amount (₹)
                      </label>
                      <input
                        type="text"
                        value={formData.amount || '0'}
                        readOnly
                        disabled
                        className="h-[42px] px-3 py-2 rounded-lg border border-fe-muted bg-fe-bg text-fe-dark font-mono font-bold text-xs cursor-not-allowed"
                      />
                      <p className="text-[10px] text-fe-gray font-sans">Cash + UPI parts</p>
                    </div>
                  </>
                ) : (
                  <Input
                    label="Amount (₹)"
                    name="amount"
                    type="number"
                    placeholder="0"
                    value={formData.amount}
                    onChange={onChange}
                    error={errors.amount}
                  />
                )}

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

                {/* COD Product Value — only shown when mode is COD */}
                {isCOD && (
                  <Input
                    label="COD Product Value (₹)"
                    name="codProductValue"
                    type="number"
                    placeholder="0"
                    value={formData.codProductValue}
                    onChange={onChange}
                    error={errors.codProductValue}
                  />
                )}

                {/* Chargeable Amount — auto-computed, read-only */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold text-fe-dark font-sans">
                    Chargeable Amount (₹)
                  </label>
                  <input
                    type="text"
                    value={chargeableAmount.toFixed(2)}
                    readOnly
                    disabled
                    className="h-[42px] px-3 py-2 rounded-lg border border-fe-muted bg-fe-bg text-fe-dark font-mono font-bold text-xs cursor-not-allowed"
                  />
                  <p className="text-[10px] text-fe-gray font-sans">Amount + Cover Charges</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
