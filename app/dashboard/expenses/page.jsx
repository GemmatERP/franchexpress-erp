'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  IndianRupee, RefreshCw, Filter, Calendar,
  TrendingUp, ListChecks, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { useExpenses } from '../../../hooks/useExpenses';
import { useToast } from '../../../hooks/useToast';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { ExpenseSummaryCards } from '../../../components/expenses/ExpenseSummaryCards';
import { BalanceCard } from '../../../components/expenses/BalanceCard';
import { AddTransactionModal } from '../../../components/expenses/AddTransactionModal';
import { TransactionTimeline } from '../../../components/expenses/TransactionTimeline';
import { ExpenseTable } from '../../../components/expenses/ExpenseTable';
import {
  MonthlyExpenseChart,
  CategoryDonutChart,
  DailyExpenseChart,
  CashBalanceChart,
} from '../../../components/expenses/ExpenseCharts';
import { formatDateForInput } from '../../../lib/utils';

const TABS = [
  { id: 'today', label: 'Today Ledger', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'log', label: 'All Expenses Log', icon: ListChecks },
];

function getMonthRange(offsetMonths = 0) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
  const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { from, to, monthStr };
}

export default function ExpensesPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const {
    loading,
    fetchExpenses,
    addExpense,
    deleteExpense,
    fetchCashRegister,
    addCashEntry,
    deleteCashEntry,
    buildCategoryData,
    buildDailyData,
    buildMonthlyData,
    calculateDayBalance,
  } = useExpenses();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && role && role !== 'admin' && role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  const [tab, setTab] = useState('today');
  const [expenses, setExpenses] = useState([]);
  const [cashRegister, setCashRegister] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Filters
  const today = formatDateForInput(new Date());
  const currentMonth = getMonthRange(0);
  const prevMonth = getMonthRange(-1);
  const [selectedDate, setSelectedDate] = useState(today);
  const [fromDate, setFromDate] = useState(prevMonth.from);
  const [toDate, setToDate] = useState(currentMonth.to);

  // Load all data
  const loadAll = useCallback(async () => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const from6 = formatDateForInput(sixMonthsAgo);
      const to6 = formatDateForInput(new Date());

      const [expData, cashData] = await Promise.all([
        fetchExpenses({ fromDate: from6, toDate: to6 }),
        fetchCashRegister({ fromDate: from6, toDate: to6 }),
      ]);
      setExpenses(expData);
      setCashRegister(cashData);
    } catch (err) {
      toast('Failed to load expense data', 'error');
    } finally {
      setInitialized(true);
    }
  }, [fetchExpenses, fetchCashRegister, toast]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  // Handlers
  const handleAddExpense = async (data) => {
    try {
      await addExpense(data);
      toast('Transaction saved successfully', 'success');
      await loadAll();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      toast('Transaction deleted', 'success');
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleAddCash = async (data) => {
    try {
      await addCashEntry(data);
      toast(`${data.type === 'initial' ? 'Initial cash' : 'Cash addition'} recorded`, 'success');
      await loadAll();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteCash = async (id) => {
    try {
      await deleteCashEntry(id);
      toast('Cash ledger entry deleted', 'success');
      setCashRegister((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Balance & suggestions calculations
  const daySummary = calculateDayBalance(selectedDate, expenses, cashRegister);

  const getYesterdaySuggest = useCallback(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().slice(0, 10);
    const summary = calculateDayBalance(yesterdayStr, expenses, cashRegister);
    return summary.hasInitial ? summary.balance : 0;
  }, [selectedDate, expenses, cashRegister, calculateDayBalance]);

  const suggestedOpening = getYesterdaySuggest();

  // Filtered expenses for full list
  const filteredExpenses = expenses.filter((e) => {
    const d = e.date?.slice(0, 10) || '';
    return d >= fromDate && d <= toDate;
  });

  const categoryData = buildCategoryData(filteredExpenses);
  const dailyData = buildDailyData(filteredExpenses);
  const monthlyData = buildMonthlyData(expenses);
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  if (authLoading || !initialized) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3">Loading expense ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fe-dark font-heading flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-fe-teal" />
            Cash & Expense Ledger
          </h1>
          <p className="text-xs text-fe-gray font-sans mt-0.5">Track petty cash, client credits, and operational debits</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-fe-gray hover:text-fe-dark border border-fe-muted/30 rounded-lg px-3 py-2 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <ExpenseSummaryCards
        expenses={expenses}
        cashRegister={cashRegister}
        selectedMonth={currentMonthKey}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-fe-bg/60 border border-fe-muted/20 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold font-sans transition-all ${
                isActive ? 'bg-white text-fe-teal shadow-sm border border-fe-muted/20' : 'text-fe-gray hover:text-fe-dark'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── TODAY tab ────────────────────────────────────────────────────────── */}
        {tab === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Date picker & Add Transaction trigger */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-fe-gray font-sans">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-sm font-sans border border-fe-muted/30 rounded-lg px-3 py-1.5 text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal/30"
                />
              </div>

              {daySummary.hasInitial && (
                <Button
                  variant="primary"
                  onClick={() => setIsTxModalOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <PlusCircle className="h-4 w-4" /> Add Transaction (DR/CR)
                </Button>
              )}
            </div>

            {/* Balance Card (Initial balance & Adjustments) */}
            <BalanceCard
              daySummary={daySummary}
              suggestedOpening={suggestedOpening}
              onAddCash={handleAddCash}
              loading={loading}
            />

            {/* Daily transaction timeline */}
            <TransactionTimeline
              date={selectedDate}
              expenses={expenses}
              cashRegister={cashRegister}
              onDeleteExpense={handleDeleteExpense}
              onDeleteCash={handleDeleteCash}
              canDelete={true}
            />
          </motion.div>
        )}

        {/* ── ANALYTICS tab ────────────────────────────────────────────────────── */}
        {tab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Date range filter */}
            <div className="flex flex-wrap items-center gap-3 bg-white border border-fe-muted/20 rounded-xl px-4 py-3">
              <Filter className="h-4 w-4 text-fe-gray" />
              <div className="flex items-center gap-2">
                <label className="text-xs text-fe-gray font-sans">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-xs font-sans border border-fe-muted/30 rounded-lg px-3 py-1.5 text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-fe-gray font-sans">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-xs font-sans border border-fe-muted/30 rounded-lg px-3 py-1.5 text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal/30"
                />
              </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <MonthlyExpenseChart data={monthlyData} />
              <CategoryDonutChart data={categoryData} />
              <DailyExpenseChart data={dailyData} />
              <CashBalanceChart cashRegister={cashRegister} />
            </div>
          </motion.div>
        )}

        {/* ── FULL LOG tab ─────────────────────────────────────────────────────── */}
        {tab === 'log' && (
          <motion.div
            key="log"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Date range filter */}
            <div className="flex flex-wrap items-center gap-3 bg-white border border-fe-muted/20 rounded-xl px-4 py-3">
              <Filter className="h-4 w-4 text-fe-gray" />
              <div className="flex items-center gap-2">
                <label className="text-xs text-fe-gray font-sans">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="text-xs font-sans border border-fe-muted/30 rounded-lg px-3 py-1.5 text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-fe-gray font-sans">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="text-xs font-sans border border-fe-muted/30 rounded-lg px-3 py-1.5 text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal/30"
                />
              </div>
            </div>

            <ExpenseTable
              expenses={filteredExpenses.filter((e) => e.entryType !== 'CR')}
              onDelete={handleDeleteExpense}
              canDelete={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Form Modal */}
      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleAddExpense}
        date={selectedDate}
        loading={loading}
      />
    </div>
  );
}
