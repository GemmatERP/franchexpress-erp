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
    <div className="bg-white border border-fe-muted/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl shrink-0 ${colorMap[color] || colorMap.gray}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-fe-gray font-sans uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-fe-dark font-heading mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-fe-gray font-sans mt-1">{sub}</p>}
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-1 ${trend >= 0 ? 'text-red-500' : 'text-green-600'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}% vs last month
          </span>
        )}
      </div>
    </div>
  );
}

export function ExpenseSummaryCards({ expenses, cashRegister, selectedMonth }) {
  const currentMonthExpenses = expenses.filter((e) => {
    const d = e.date ? e.date.slice(0, 7) : '';
    return d === selectedMonth;
  });

  const totalThisMonth = currentMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Last month
  const [yr, mo] = selectedMonth.split('-').map(Number);
  const prevDate = new Date(yr, mo - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthExpenses = expenses.filter((e) => e.date?.slice(0, 7) === prevMonth);
  const totalPrevMonth = prevMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const trend = totalPrevMonth > 0 ? ((totalThisMonth - totalPrevMonth) / totalPrevMonth) * 100 : undefined;

  // Avg daily for current month
  const activeDays = [...new Set(currentMonthExpenses.map((e) => e.date?.slice(0, 10)).filter(Boolean))].length;
  const avgDaily = activeDays > 0 ? totalThisMonth / activeDays : 0;

  // Top category
  const catMap = {};
  for (const e of currentMonthExpenses) {
    catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
  }
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  // Today's cash balance
  const today = new Date().toISOString().slice(0, 10);
  const todayCash = cashRegister
    .filter((r) => r.date?.slice(0, 10) === today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastBalance = todayCash[0];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        icon={IndianRupee}
        label="This Month's Expenses"
        value={formatCurrency(totalThisMonth)}
        sub={`${currentMonthExpenses.length} entries`}
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
        value={topCat ? topCat[0].split(' ')[0] : '—'}
        sub={topCat ? formatCurrency(topCat[1]) : 'No data'}
        color="teal"
      />
      <SummaryCard
        icon={Wallet}
        label="Today's Cash Balance"
        value={lastBalance ? formatCurrency(lastBalance.amount) : '—'}
        sub={lastBalance ? `${lastBalance.type === 'opening' ? 'Opening' : 'Closing'} balance` : 'No entry today'}
        color="blue"
      />
    </div>
  );
}
