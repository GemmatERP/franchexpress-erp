'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet, IndianRupee, Calendar, BarChart2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

function SummaryCard({ icon: Icon, label, value, sub, color = 'teal', trend }) {
  const colorMap = {
    teal: 'bg-fe-teal/10 text-fe-teal',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    gray: 'bg-gray-100 text-gray-500',
  };
  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl p-3.5 sm:p-5 flex items-start gap-2.5 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${colorMap[color] || colorMap.gray}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] text-fe-gray font-sans uppercase tracking-wide">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-fe-dark font-heading mt-0.5">{value}</p>
        {sub && <p className="text-[10px] sm:text-[11px] text-fe-gray font-sans mt-1 break-words">{sub}</p>}
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold mt-1 ${trend >= 0 ? 'text-red-500' : 'text-green-600'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}% vs last month
          </span>
        )}
      </div>
    </div>
  );
}

export function ExpenseSummaryCards({ expenses, cashRegister, selectedMonth }) {
  // Only look at DR (debit/expense) entries for expense metrics
  const currentMonthExpenses = expenses.filter((e) => {
    const d = e.date ? e.date.slice(0, 7) : '';
    return d === selectedMonth;
  });

  const currentMonthDRs = currentMonthExpenses.filter((e) => e.entryType !== 'CR');
  const totalThisMonth = currentMonthDRs.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Last month
  const [yr, mo] = selectedMonth.split('-').map(Number);
  const prevDate = new Date(yr, mo - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthExpenses = expenses.filter((e) => e.date?.slice(0, 7) === prevMonth && e.entryType !== 'CR');
  const totalPrevMonth = prevMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const trend = totalPrevMonth > 0 ? ((totalThisMonth - totalPrevMonth) / totalPrevMonth) * 100 : undefined;

  // Avg daily for current month (DR only)
  const activeDays = [...new Set(currentMonthDRs.map((e) => e.date?.slice(0, 10)).filter(Boolean))].length;
  const avgDaily = activeDays > 0 ? totalThisMonth / activeDays : 0;

  // Top category (DR only)
  const catMap = {};
  for (const e of currentMonthDRs) {
    catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
  }
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  // Today's cash balance
  const today = new Date().toISOString().slice(0, 10);
  const todayExpenses = expenses.filter((e) => e.date?.slice(0, 10) === today || e.dateString === today);
  const todayCash = cashRegister.filter((r) => r.date?.slice(0, 10) === today || r.dateString === today);

  const initial = todayCash.filter((r) => r.type === 'initial' || r.type === 'opening').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const added = todayCash.filter((r) => r.type === 'add').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const DR = todayExpenses.filter((e) => e.entryType !== 'CR').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const CR = todayExpenses.filter((e) => e.entryType === 'CR').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const runningToday = initial + added + CR - DR;
  const hasInitial = todayCash.some((r) => r.type === 'initial' || r.type === 'opening');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        icon={IndianRupee}
        label="This Month's Expenses"
        value={formatCurrency(totalThisMonth)}
        sub={`${currentMonthDRs.length} entries`}
        color="rose"
        trend={trend}
      />
      <SummaryCard
        icon={Calendar}
        label="Avg Daily Expense"
        value={formatCurrency(avgDaily)}
        sub={`Over ${activeDays} active days`}
        color="amber"
      />
      <SummaryCard
        icon={BarChart2}
        label="Top Category"
        value={topCat ? formatCurrency(topCat[1]) : '—'}
        sub={topCat ? topCat[0] : 'No data'}
        color="teal"
      />
      <SummaryCard
        icon={Wallet}
        label="Today's Cash Balance"
        value={hasInitial ? formatCurrency(runningToday) : '—'}
        sub={hasInitial ? `Petty cash: ${formatCurrency(initial)}` : 'Opening cash not set'}
        color="blue"
      />
    </div>
  );
}
