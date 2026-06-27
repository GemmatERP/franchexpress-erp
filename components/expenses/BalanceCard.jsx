'use client';

import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function BalanceCard({ daySummary, suggestedOpening, onAddCash, loading }) {
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState('initial'); // 'initial' or 'add'
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    try {
      await onAddCash({
        type: inputType,
        amount: Number(amount),
        notes: notes.trim()
      });
      setAmount('');
      setNotes('');
      setShowInput(false);
    } catch (err) {
      // toast handled in parent
    }
  };

  const handleSetQuickOpening = async () => {
    if (suggestedOpening === undefined || suggestedOpening === null) return;
    try {
      await onAddCash({
        type: 'initial',
        amount: Number(suggestedOpening),
        notes: 'Carried forward from yesterday'
      });
    } catch (err) {}
  };

  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Running Balance */}
          <div className="md:col-span-1 space-y-1">
            <span className="text-[11px] text-fe-gray font-sans uppercase tracking-wide">Running Cash Balance</span>
            <div className="text-3xl font-bold font-heading text-fe-dark">
              {formatCurrency(daySummary.balance)}
            </div>
            <span className="text-[10px] text-fe-gray font-sans block">
              Auto-calculated daily closing balance
            </span>
          </div>

          {/* Breakdown Stats */}
          <div className="md:col-span-2 grid grid-cols-3 gap-4 border-y md:border-y-0 md:border-x border-fe-muted/10 py-4 md:py-0 md:px-6">
            <div>
              <span className="text-[10px] text-fe-gray font-sans block uppercase">Initial Cash</span>
              <span className="text-sm font-bold text-fe-dark font-heading block mt-0.5">
                {formatCurrency(daySummary.initial)}
              </span>
              {daySummary.added > 0 && (
                <span className="text-[9px] text-blue-600 font-sans block">
                  + {formatCurrency(daySummary.added)} added
                </span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-fe-gray font-sans block uppercase flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3 text-green-500 shrink-0" /> Credits
              </span>
              <span className="text-sm font-bold text-green-600 font-heading block mt-0.5">
                +{formatCurrency(daySummary.credits)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-fe-gray font-sans block uppercase flex items-center gap-0.5">
                <ArrowDownLeft className="h-3 w-3 text-red-500 shrink-0" /> Debits
              </span>
              <span className="text-sm font-bold text-red-500 font-heading block mt-0.5">
                -{formatCurrency(daySummary.debits)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-1 flex flex-col gap-2 justify-center">
            {!daySummary.hasInitial ? (
              <Button
                variant="primary"
                onClick={() => {
                  setInputType('initial');
                  setShowInput(true);
                }}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <Wallet className="h-4 w-4" /> Set Initial Cash
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setInputType('add');
                  setShowInput(true);
                }}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Cash (Mid-day)
              </Button>
            )}
          </div>
        </div>

        {/* Suggested Opening Cash Banner */}
        {!daySummary.hasInitial && suggestedOpening !== undefined && suggestedOpening !== null && suggestedOpening > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              Suggested Opening Cash: <strong className="font-bold">{formatCurrency(suggestedOpening)}</strong> (carried forward from yesterday)
            </span>
            <button
              onClick={handleSetQuickOpening}
              disabled={loading}
              className="text-amber-900 font-bold hover:underline shrink-0 flex items-center gap-1 transition-all"
            >
              <RefreshCw className="h-3 w-3 animate-pulse" /> Confirm Balance
            </button>
          </div>
        )}

        {/* Input Drawer Form */}
        {showInput && (
          <form onSubmit={handleSave} className="mt-5 pt-5 border-t border-fe-muted/10 space-y-4">
            <h4 className="text-xs font-bold text-fe-dark font-heading uppercase tracking-wide">
              {inputType === 'initial' ? 'Set Initial Petty Cash' : 'Add Cash Amount'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <Input
                label="Amount (₹)"
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1400"
              />
              <Input
                label="Source / Description"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Drawn from bank"
              />
              <div className="flex gap-2">
                <Button type="submit" variant="primary" className="flex-1" loading={loading}>
                  Confirm
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
