'use client';

import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryColor } from '../../hooks/useExpenses';
import { formatCurrency } from '../../lib/utils';

function CategoryBadge({ category }) {
  const color = getCategoryColor(category);
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
      style={{ background: color }}
    >
      {category}
    </span>
  );
}

export function ExpenseTable({ expenses, onDelete, canDelete = true }) {
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const sorted = [...expenses].sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (sortField === 'amount') { av = Number(av); bv = Number(bv); }
    else { av = av?.toString() ?? ''; bv = bv?.toString() ?? ''; }
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  // Group by date
  const grouped = {};
  for (const e of sorted) {
    const d = e.date?.slice(0, 10) || 'Unknown';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  }
  const dates = Object.keys(grouped).sort((a, b) => sortDir === 'desc' ? b.localeCompare(a) : a.localeCompare(b));

  if (!expenses.length) {
    return (
      <div className="bg-white border border-fe-muted/20 rounded-2xl shadow-sm p-12 text-center">
        <p className="text-fe-gray text-sm font-sans">No expenses recorded for this period.</p>
        <p className="text-fe-gray text-xs font-sans mt-1">Use the form above to add expenses.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-fe-muted/10 flex items-center justify-between">
        <h3 className="text-sm font-bold text-fe-dark font-heading">Expense Log</h3>
        <span className="text-[11px] text-fe-gray font-sans">{expenses.length} entries · {formatCurrency(expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0))}</span>
      </div>
      <div className="divide-y divide-fe-muted/10">
        {dates.map((date) => {
          const dayItems = grouped[date];
          const dayTotal = dayItems.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const dateLabel = new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

          return (
            <div key={date}>
              {/* Day header */}
              <div className="flex items-center justify-between px-5 py-2 bg-fe-bg/40">
                <span className="text-[11px] font-bold text-fe-dark font-sans uppercase tracking-wide">{dateLabel}</span>
                <span className="text-[11px] font-bold text-fe-teal">{formatCurrency(dayTotal)}</span>
              </div>

              {/* Day rows */}
              {dayItems.map((expense) => (
                <motion.div
                  key={expense.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between px-5 py-3 hover:bg-fe-bg/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: getCategoryColor(expense.category) }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-fe-dark truncate">{expense.particulars}</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider shrink-0 font-sans ${
                          expense.paymentMode === 'Bank'
                            ? expense.bankName === 'Axis Bank'
                              ? 'bg-fe-teal/10 text-fe-teal border border-fe-teal/20'
                              : 'bg-violet-50 text-violet-600 border border-violet-100'
                            : 'bg-gray-100 text-fe-gray border border-fe-muted/20'
                        }`}>
                          {expense.paymentMode === 'Bank' ? expense.bankName : 'Cash'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CategoryBadge category={expense.category} />
                        {expense.notes && (
                          <span className="text-[10px] text-fe-gray font-sans">{expense.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-fe-dark">{formatCurrency(expense.amount)}</span>
                    {canDelete && (
                      <button
                        onClick={() => onDelete(expense.id, expense.particulars)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-fe-gray hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
