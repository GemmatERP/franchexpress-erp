'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Check, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';

function CashEntry({ entry, onDelete }) {
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-sans ${
      entry.type === 'opening'
        ? 'bg-blue-50 border-blue-200 text-blue-800'
        : 'bg-green-50 border-green-200 text-green-800'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          entry.type === 'opening' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
        }`}>
          {entry.type}
        </span>
        <span className="font-bold">{formatCurrency(entry.amount)}</span>
        {entry.notes && <span className="text-[11px] opacity-70">· {entry.notes}</span>}
      </div>
      <button
        onClick={() => onDelete(entry.id)}
        className="p-1 rounded-md hover:bg-black/10 transition-colors"
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CashRegisterPanel({ date, cashEntries, onAdd, onDelete, loading }) {
  const [type, setType] = useState('opening');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const todayEntries = cashEntries.filter((e) => e.date?.slice(0, 10) === date);
  const openingEntry = todayEntries.find((e) => e.type === 'opening');
  const closingEntry = todayEntries.find((e) => e.type === 'closing');

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      await onAdd({ date, type, amount: Number(amount), notes });
      setAmount('');
      setNotes('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-fe-bg/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-fe-dark font-heading">Cash Register</h3>
            <p className="text-[11px] text-fe-gray font-sans">
              {openingEntry ? `Opening: ${formatCurrency(openingEntry.amount)}` : 'No opening entry'}
              {closingEntry ? ` · Closing: ${formatCurrency(closingEntry.amount)}` : ''}
            </p>
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg className="h-4 w-4 text-fe-gray" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 border-t border-fe-muted/10 space-y-3">
              {/* Existing entries */}
              {todayEntries.length > 0 && (
                <div className="mt-3 space-y-2">
                  {todayEntries.map((entry) => (
                    <CashEntry key={entry.id} entry={entry} onDelete={onDelete} />
                  ))}
                </div>
              )}

              {/* Add new entry */}
              <div className="pt-3 space-y-3">
                <div className="flex gap-2">
                  {['opening', 'closing'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                        type === t
                          ? t === 'opening'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-fe-gray border-fe-muted/40 hover:border-fe-muted'
                      }`}
                    >
                      {t} Balance
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Amount (₹)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1200"
                  />
                  <Input
                    label="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Rs.30 excess"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  loading={saving || loading}
                  disabled={!amount}
                  className="w-full flex items-center justify-center gap-2"
                  variant="primary"
                >
                  <Check className="h-4 w-4" />
                  Record {type === 'opening' ? 'Opening' : 'Closing'} Balance
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
