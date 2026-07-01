'use client';

import React from 'react';
import { Trash2, ArrowDownLeft, ArrowUpRight, Plus, Wallet, FileText } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getCategoryColor } from '../../hooks/useExpenses';

export function TransactionTimeline({ date, expenses, cashRegister, onDeleteExpense, onDeleteCash, canDelete = true, ledgerSource = 'All' }) {
  // Filter for chosen date
  const dayCash = cashRegister.filter((r) => r.dateString === date || r.date?.slice(0, 10) === date);
  const dayExpenses = expenses.filter((e) => e.dateString === date || e.date?.slice(0, 10) === date);

  const filteredDayCash = ledgerSource === 'Cash' || ledgerSource === 'All' ? dayCash : [];
  const filteredDayExpenses = dayExpenses.filter((e) => {
    if (ledgerSource === 'All') return true;
    if (ledgerSource === 'Cash') return e.paymentMode !== 'Bank';
    if (ledgerSource === 'Axis Bank') return e.paymentMode === 'Bank' && e.bankName === 'Axis Bank';
    if (ledgerSource === 'Federal Bank') return e.paymentMode === 'Bank' && e.bankName === 'Federal Bank';
    return true;
  });

  // Compile all transactions for timeline
  const timelineItems = [];

  // 1. Initial cash
  filteredDayCash
    .filter((r) => r.type === 'initial' || r.type === 'opening')
    .forEach((r) => {
      timelineItems.push({
        id: r.id,
        type: 'initial',
        label: 'Initial Petty Cash Set',
        amount: r.amount,
        notes: r.notes || 'Day opening balance',
        createdAt: r.createdAt || r.date || '',
        paymentMode: 'Cash',
        raw: r,
      });
    });

  // 2. Added cash
  filteredDayCash
    .filter((r) => r.type === 'add')
    .forEach((r) => {
      timelineItems.push({
        id: r.id,
        type: 'add',
        label: 'Cash Added (Mid-day)',
        amount: r.amount,
        notes: r.notes || 'Cash inflow adjustment',
        createdAt: r.createdAt || r.date || '',
        paymentMode: 'Cash',
        raw: r,
      });
    });

  // 3. Debits & Credits
  filteredDayExpenses.forEach((e) => {
    timelineItems.push({
      id: e.id,
      type: e.entryType || 'DR', // 'DR' or 'CR'
      label: e.particulars,
      category: e.category,
      amount: e.amount,
      notes: e.notes,
      createdAt: e.createdAt || e.date || '',
      paymentMode: e.paymentMode || 'Cash',
      bankName: e.bankName || null,
      raw: e,
    });
  });

  // Sort: 'initial' entries always first, then other items by createdAt or fallback
  timelineItems.sort((a, b) => {
    if (a.type === 'initial' && b.type !== 'initial') return -1;
    if (b.type === 'initial' && a.type !== 'initial') return 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  // Calculate starting balance for bank accounts
  let startBalance = 0;
  if (ledgerSource === 'Axis Bank') {
    startBalance = expenses
      .filter((e) => e.paymentMode === 'Bank' && e.bankName === 'Axis Bank' && (e.dateString || e.date?.slice(0, 10)) < date)
      .reduce((sum, e) => sum + (e.entryType === 'CR' ? Number(e.amount) : -Number(e.amount)), 0);
  } else if (ledgerSource === 'Federal Bank') {
    startBalance = expenses
      .filter((e) => e.paymentMode === 'Bank' && e.bankName === 'Federal Bank' && (e.dateString || e.date?.slice(0, 10)) < date)
      .reduce((sum, e) => sum + (e.entryType === 'CR' ? Number(e.amount) : -Number(e.amount)), 0);
  }

  // Calculate cumulative running balances
  let running = startBalance;
  const itemsWithBalance = timelineItems.map((item) => {
    const isBank = item.paymentMode === 'Bank';

    if (ledgerSource === 'All') {
      if (!isBank) {
        if (item.type === 'initial' || item.type === 'add' || item.type === 'CR') {
          running += item.amount;
        } else if (item.type === 'DR') {
          running -= item.amount;
        }
        return { ...item, runningBalance: running };
      } else {
        return { ...item, runningBalance: null };
      }
    } else {
      if (item.type === 'initial' || item.type === 'add' || item.type === 'CR') {
        running += item.amount;
      } else if (item.type === 'DR') {
        running -= item.amount;
      }
      return { ...item, runningBalance: running };
    }
  });

  const handleDelete = (item) => {
    if (item.type === 'initial' || item.type === 'add') {
      onDeleteCash(item.id, item.label);
    } else {
      onDeleteExpense(item.id, item.label);
    }
  };

  if (itemsWithBalance.length === 0) {
    return (
      <div className="bg-white border border-fe-muted/20 rounded-2xl p-12 text-center shadow-sm">
        <p className="text-fe-gray text-sm font-sans">No ledger entries matching filters for this date.</p>
        <p className="text-fe-gray text-xs font-sans mt-1">Set initial cash or add a transaction to begin.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-fe-muted/10 flex items-center justify-between">
        <h3 className="text-sm font-bold text-fe-dark font-heading">Daily Transaction Ledger</h3>
        <span className="text-[11px] text-fe-gray font-sans">
          {itemsWithBalance.length} entries today
        </span>
      </div>

      <div className="p-6">
        <div className="relative border-l border-fe-muted/30 ml-4 space-y-6">
          {itemsWithBalance.map((item, idx) => {
            const isInitial = item.type === 'initial';
            const isAdd = item.type === 'add';
            const isCR = item.type === 'CR';
            const isDR = item.type === 'DR';

            let iconBg = 'bg-fe-muted/30 text-fe-gray';
            let Icon = FileText;
            let amountText = '';
            let amountColor = 'text-fe-dark';

            if (isInitial) {
               iconBg = 'bg-blue-100 text-blue-600';
               Icon = Wallet;
               amountText = `+${formatCurrency(item.amount)}`;
               amountColor = 'text-blue-600';
            } else if (isAdd) {
               iconBg = 'bg-indigo-100 text-indigo-600';
               Icon = Plus;
               amountText = `+${formatCurrency(item.amount)}`;
               amountColor = 'text-indigo-600';
            } else if (isCR) {
               iconBg = 'bg-green-100 text-green-600';
               Icon = ArrowUpRight;
               amountText = `+${formatCurrency(item.amount)}`;
               amountColor = 'text-green-600';
            } else if (isDR) {
               iconBg = 'bg-rose-100 text-rose-600';
               Icon = ArrowDownLeft;
               amountText = `-${formatCurrency(item.amount)}`;
               amountColor = 'text-rose-600';
            }

            return (
              <div key={item.id || idx} className="relative pl-8 group">
                {/* Timeline node icon */}
                <span className={`absolute left-0 -translate-x-1/2 top-1.5 p-1.5 rounded-full shrink-0 border-4 border-white shadow-sm ${iconBg}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>

                {/* Entry Content */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-fe-dark font-sans">{item.label}</span>
                      {/* Payment Mode Badge */}
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shrink-0 font-sans ${
                        item.paymentMode === 'Bank'
                          ? item.bankName === 'Axis Bank'
                            ? 'bg-fe-teal/15 text-fe-teal border border-fe-teal/20'
                            : 'bg-violet-100 text-violet-700 border border-violet-200'
                          : 'bg-gray-100 text-fe-gray border border-fe-muted/20'
                      }`}>
                        {item.paymentMode === 'Bank' ? item.bankName : 'Cash'}
                      </span>
                      {isDR && item.category && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold text-white uppercase tracking-wider shrink-0"
                          style={{ background: getCategoryColor(item.category) }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-fe-gray font-sans mt-0.5">{item.notes}</p>
                    )}
                  </div>

                  {/* Financial amounts */}
                  <div className="flex items-center gap-4 shrink-0 sm:text-right">
                    <div>
                      <span className={`text-sm font-bold font-heading block ${amountColor}`}>
                        {amountText}
                      </span>
                      {item.runningBalance !== null && item.runningBalance !== undefined && (
                        <span className="text-[10px] text-fe-gray font-sans block">
                          Bal: {formatCurrency(item.runningBalance)}
                        </span>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-fe-gray hover:text-red-500 hover:bg-red-50 transition-all focus:opacity-100 focus:outline-none"
                        title="Remove entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
