'use client';

import React, { useState } from 'react';
import { Plus, Trash2, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { EXPENSE_CATEGORIES } from '../../hooks/useExpenses';
import { formatCurrency } from '../../lib/utils';

const EMPTY_ROW = () => ({ particulars: '', category: 'Miscellaneous', amount: '', notes: '' });

const COMMON_PARTICULARS = [
  'Tea', 'Water can', 'Auto Charges', 'Jacob allowance', 'Kishore allowance',
  'Ashok Allowance', 'Vivek allowance', 'Postal charges', 'Office cleaning',
  'Courier', 'A4 paper', 'COD payment',
];

export function ExpenseEntryForm({ date, onSave, loading }) {
  const [rows, setRows] = useState([EMPTY_ROW()]);
  const [saving, setSaving] = useState(false);

  const updateRow = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const addRow = () => setRows((prev) => [...prev, EMPTY_ROW()]);

  const handleQuickAdd = (particulars) => {
    setRows((prev) => {
      // Find or create a row with that particulars
      const existing = prev.findIndex((r) => r.particulars === particulars);
      if (existing >= 0) return prev;
      return [...prev, { ...EMPTY_ROW(), particulars }];
    });
  };

  const totalAmount = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const isValid = rows.some((r) => r.particulars.trim() && r.amount && !isNaN(Number(r.amount)));

  const handleSave = async () => {
    const validRows = rows.filter((r) => r.particulars.trim() && r.amount && !isNaN(Number(r.amount)));
    if (validRows.length === 0) return;
    setSaving(true);
    try {
      for (const row of validRows) {
        await onSave({ date, particulars: row.particulars, category: row.category, amount: Number(row.amount), notes: row.notes });
      }
      setRows([EMPTY_ROW()]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-fe-muted/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-fe-teal/10 text-fe-teal">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-fe-dark font-heading">Add Expenses</h3>
            <p className="text-[11px] text-fe-gray font-sans">Enter daily expense line items</p>
          </div>
        </div>
        {totalAmount > 0 && (
          <span className="text-sm font-bold text-fe-teal font-heading">
            Total: {formatCurrency(totalAmount)}
          </span>
        )}
      </div>

      <div className="px-5 pt-4 pb-5 space-y-4">
        {/* Quick-add chips */}
        <div className="flex flex-wrap gap-2">
          {COMMON_PARTICULARS.map((p) => (
            <button
              key={p}
              onClick={() => handleQuickAdd(p)}
              className="px-3 py-1 rounded-full text-[11px] font-medium bg-fe-bg border border-fe-muted/30 text-fe-gray hover:border-fe-teal hover:text-fe-teal transition-colors"
            >
              + {p}
            </button>
          ))}
        </div>

        {/* Expense rows */}
        <AnimatePresence>
          {rows.map((row, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-12 gap-3 items-end"
            >
              {/* Particulars */}
              <div className="col-span-4">
                <Input
                  label={idx === 0 ? 'Particulars' : undefined}
                  value={row.particulars}
                  onChange={(e) => updateRow(idx, 'particulars', e.target.value)}
                  placeholder="e.g. Tea"
                  list={`particulars-list-${idx}`}
                />
                <datalist id={`particulars-list-${idx}`}>
                  {COMMON_PARTICULARS.map((p) => <option key={p} value={p} />)}
                </datalist>
              </div>

              {/* Category */}
              <div className="col-span-3">
                <Select
                  label={idx === 0 ? 'Category' : undefined}
                  value={row.category}
                  onChange={(e) => updateRow(idx, 'category', e.target.value)}
                  options={EXPENSE_CATEGORIES}
                />
              </div>

              {/* Amount */}
              <div className="col-span-2">
                <Input
                  label={idx === 0 ? 'Amount (₹)' : undefined}
                  type="number"
                  value={row.amount}
                  onChange={(e) => updateRow(idx, 'amount', e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <Input
                  label={idx === 0 ? 'Notes' : undefined}
                  value={row.notes}
                  onChange={(e) => updateRow(idx, 'notes', e.target.value)}
                  placeholder="Optional"
                />
              </div>

              {/* Delete */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => removeRow(idx)}
                  disabled={rows.length === 1}
                  className="p-2 rounded-lg text-fe-gray hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                  title="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add row + Save */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-semibold text-fe-teal hover:underline font-sans"
          >
            <PlusCircle className="h-4 w-4" />
            Add another line
          </button>

          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving || loading}
            disabled={!isValid}
            className="px-6"
          >
            Save {rows.filter((r) => r.particulars.trim() && r.amount).length > 1 ? 'All' : 'Expense'}
          </Button>
        </div>
      </div>
    </div>
  );
}
