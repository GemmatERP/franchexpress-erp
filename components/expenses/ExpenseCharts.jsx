'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { formatCurrency } from '../../lib/utils';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#ccfbf1';

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function RsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-fe-muted/20 rounded-xl shadow-xl px-4 py-3 text-xs font-sans">
      <p className="text-fe-gray mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold text-fe-dark">{formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

// ── Monthly Bar Chart ──────────────────────────────────────────────────────────
export function MonthlyExpenseChart({ data }) {
  if (!data?.length) return <EmptyChart message="No monthly data yet" />;
  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">Monthly Expense Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<RsTooltip />} />
          <Bar dataKey="amount" fill={TEAL} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Category Donut Chart ───────────────────────────────────────────────────────
function CustomPieLegend({ payload }) {
  return (
    <ul className="flex flex-col gap-1.5 mt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center justify-between gap-3 text-[11px] font-sans">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-fe-gray truncate max-w-[120px]">{entry.value}</span>
          </span>
          <span className="font-semibold text-fe-dark">{formatCurrency(entry.payload.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function CategoryDonutChart({ data }) {
  if (!data?.length) return <EmptyChart message="No category data yet" />;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-fe-dark font-heading mb-2">Expense by Category</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<RsTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-fe-gray font-sans mb-1">Total</p>
          <p className="text-lg font-bold text-fe-dark font-heading">{formatCurrency(total)}</p>
          <CustomPieLegend payload={data.map((d) => ({ value: d.name, color: d.color, payload: d }))} />
        </div>
      </div>
    </div>
  );
}

// ── Daily Line Chart ───────────────────────────────────────────────────────────
export function DailyExpenseChart({ data }) {
  if (!data?.length) return <EmptyChart message="No daily data yet" />;
  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">Daily Expense Trend</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} width={48} />
          <Tooltip content={<RsTooltip />} />
          <Line type="monotone" dataKey="amount" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3, fill: TEAL }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Cash Balance Timeline ──────────────────────────────────────────────────────
export function CashBalanceChart({ cashRegister }) {
  const data = cashRegister
    .filter((r) => r.amount > 0)
    .map((r) => ({
      label: new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      amount: r.amount,
      type: r.type,
    }))
    .slice(-30);

  if (!data.length) return <EmptyChart message="No cash register data yet" />;

  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">Cash Balance History</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} width={44} />
          <Tooltip content={<RsTooltip />} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={32}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.type === 'opening' ? '#3b82f6' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 text-[10px] font-sans text-fe-gray">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Opening</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Closing</span>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="bg-white border border-fe-muted/20 rounded-2xl p-5 shadow-sm flex items-center justify-center h-48">
      <p className="text-xs text-fe-gray font-sans">{message}</p>
    </div>
  );
}
