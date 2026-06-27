'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { EXPENSE_CATEGORIES } from '../../hooks/useExpenses';

const DR_SUGGESTIONS = [
  'Tea', 'Water can', 'Auto Charges', 'Jacob allowance', 'Kishore allowance',
  'Ashok Allowance', 'Vivek allowance', 'Postal charges', 'Office cleaning',
  'Courier', 'A4 paper', 'Office maintenance', 'Electricity bill'
];

const CR_SUGGESTIONS = [
  'Customer paid in cash', 'Voucher cash collection', 'Received from bank',
  'AWB cash booking', 'Consignment charge collection', 'Opening float adjustment'
];

export function AddTransactionModal({ isOpen, onClose, onSave, date, loading }) {
  const [entryType, setEntryType] = useState('DR'); // 'DR' or 'CR'
  const [particulars, setParticulars] = useState('');
  const [category, setCategory] = useState('Miscellaneous');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset state on open
      setEntryType('DR');
      setParticulars('');
      setCategory('Miscellaneous');
      setAmount('');
      setNotes('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!particulars || !amount || isNaN(Number(amount))) return;
    try {
      await onSave({
        date,
        entryType,
        particulars: particulars.trim(),
        category: entryType === 'DR' ? category : 'Revenue / Cash Inflow',
        amount: Number(amount),
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {}
  };

  const suggestions = entryType === 'DR' ? DR_SUGGESTIONS : CR_SUGGESTIONS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white border border-fe-muted/20 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fe-muted/10 shrink-0">
          <div>
            <h3 className="text-base font-bold text-fe-dark font-heading">Add Transaction</h3>
            <p className="text-[11px] text-fe-gray font-sans mt-0.5">Record a cash debit or credit</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-fe-gray hover:text-fe-dark hover:bg-fe-bg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* DR / CR Toggle Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-fe-gray font-sans uppercase tracking-wider block">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEntryType('DR')}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  entryType === 'DR'
                    ? 'bg-rose-50 border-rose-200 text-rose-800 ring-2 ring-rose-500/20'
                    : 'bg-white border-fe-muted/30 text-fe-gray hover:border-fe-muted'
                }`}
              >
                <ArrowDownLeft className={`h-4 w-4 ${entryType === 'DR' ? 'text-rose-600' : 'text-fe-gray'}`} />
                Debit (Expense)
              </button>
              <button
                type="button"
                onClick={() => setEntryType('CR')}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  entryType === 'CR'
                    ? 'bg-green-50 border-green-200 text-green-800 ring-2 ring-green-500/20'
                    : 'bg-white border-fe-muted/30 text-fe-gray hover:border-fe-muted'
                }`}
              >
                <ArrowUpRight className={`h-4 w-4 ${entryType === 'CR' ? 'text-green-600' : 'text-fe-gray'}`} />
                Credit (Cash Inflow)
              </button>
            </div>
          </div>

          {/* Quick-add chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-fe-gray font-sans block uppercase">Quick Select Particulars</span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-fe-bg/40 rounded-lg">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setParticulars(s)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white border border-fe-muted/20 text-fe-gray hover:border-fe-teal hover:text-fe-teal transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Particulars */}
          <Input
            label="Particulars / Description"
            required
            value={particulars}
            onChange={(e) => setParticulars(e.target.value)}
            placeholder={entryType === 'DR' ? 'e.g. Tea' : 'e.g. Customer paid in cash'}
            list="suggestions-list"
          />
          <datalist id="suggestions-list">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          {/* Category (Debit Only) */}
          {entryType === 'DR' && (
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={EXPENSE_CATEGORIES}
            />
          )}

          {/* Amount & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              required
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={loading}
              disabled={!particulars || !amount}
            >
              Record Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
