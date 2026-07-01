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
import { Modal } from '../../../components/ui/Modal';
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
import { formatDateForInput, formatCurrency } from '../../../lib/utils';

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
    calculateBankBalances,
  } = useExpenses();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && role && role !== 'admin' && role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  const [tab, setTab] = useState('today');
  const [ledgerSource, setLedgerSource] = useState('All'); // 'All' | 'Cash' | 'Axis Bank' | 'Federal Bank'
  const [expenses, setExpenses] = useState([]);
  const [cashRegister, setCashRegister] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Custom styled confirmation & warning modals
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, type: null, label: '' });
  const [negativeWarning, setNegativeWarning] = useState({ isOpen: false, data: null, accountName: '', currentBal: 0, newBal: 0 });

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
      const [expData, cashData] = await Promise.all([
        fetchExpenses(),
        fetchCashRegister(),
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
    // Check if it will cause a negative balance
    const amt = Number(data.amount) || 0;
    let willGoNegative = false;
    let currentBal = 0;
    let newBal = 0;
    let accountName = 'Cash';

    if (data.entryType === 'DR') {
      if (data.paymentMode === 'Bank') {
        accountName = data.bankName;
        currentBal = data.bankName === 'Axis Bank' ? axisBalance : fedBalance;
      } else {
        accountName = 'Cash';
        currentBal = daySummary.balance;
      }
      newBal = currentBal - amt;
      if (newBal < 0) {
        willGoNegative = true;
      }
    }

    if (willGoNegative) {
      setNegativeWarning({
        isOpen: true,
        data,
        accountName,
        currentBal,
        newBal
      });
    } else {
      await executeAddExpense(data);
    }
  };

  const executeAddExpense = async (data) => {
    try {
      await addExpense(data);
      toast('Transaction saved successfully', 'success');
      await loadAll();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const triggerDeleteExpense = (id, label) => {
    setConfirmDelete({ isOpen: true, id, type: 'expense', label });
  };

  const triggerDeleteCash = (id, label) => {
    setConfirmDelete({ isOpen: true, id, type: 'cash', label });
  };

  const handleConfirmDelete = async () => {
    const { id, type } = confirmDelete;
    if (!id) return;
    try {
      if (type === 'expense') {
        await deleteExpense(id);
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      } else {
        await deleteCashEntry(id);
        setCashRegister((prev) => prev.filter((e) => e.id !== id));
      }
      toast('Transaction deleted', 'success');
      await loadAll();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setConfirmDelete({ isOpen: false, id: null, type: null, label: '' });
    }
  };

  const handleAddCash = async (data) => {
    try {
      await addCashEntry({ ...data, date: selectedDate });
      toast(`${data.type === 'initial' ? 'Initial cash' : 'Cash addition'} recorded`, 'success');
      await loadAll();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Balance & suggestions calculations
  const daySummary = calculateDayBalance(selectedDate, expenses, cashRegister);
  const { axisBalance, fedBalance } = calculateBankBalances(selectedDate, expenses);

  const getBankDaySummary = useCallback((bankName, dateStr, allExpenses) => {
    const startBalance = allExpenses
      .filter((e) => e.paymentMode === 'Bank' && e.bankName === bankName && (e.dateString || e.date?.slice(0, 10)) < dateStr)
      .reduce((sum, e) => sum + (e.entryType === 'CR' ? Number(e.amount) : -Number(e.amount)), 0);

    const dayEntries = allExpenses.filter((e) => (e.dateString === dateStr || e.date?.slice(0, 10) === dateStr) && e.paymentMode === 'Bank' && e.bankName === bankName);

    const credits = dayEntries
      .filter((e) => e.entryType === 'CR')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const debits = dayEntries
      .filter((e) => e.entryType === 'DR')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const balance = startBalance + credits - debits;

    return {
      initial: startBalance,
      credits,
      debits,
      balance,
      hasInitial: true
    };
  }, []);

  const activeDaySummary = ledgerSource === 'All' || ledgerSource === 'Cash'
    ? daySummary
    : getBankDaySummary(ledgerSource, selectedDate, expenses);

  const getYesterdaySuggest = useCallback(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().slice(0, 10);
    const summary = calculateDayBalance(yesterdayStr, expenses, cashRegister);
    return summary.hasInitial ? summary.balance : 0;
  }, [selectedDate, expenses, cashRegister, calculateDayBalance]);

  const suggestedOpening = getYesterdaySuggest();

  const generateBankBalanceHistory = useCallback((bankName) => {
    const result = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      const balance = expenses
        .filter(e => e.paymentMode === 'Bank' && e.bankName === bankName && (e.dateString || e.date?.slice(0, 10)) <= dateStr)
        .reduce((sum, e) => sum + (e.entryType === 'CR' ? Number(e.amount) : -Number(e.amount)), 0);

      result.push({
        label,
        amount: balance,
        type: 'closing'
      });
    }
    return result;
  }, [expenses]);

  // Filtered expenses for full list
  const filteredExpenses = expenses.filter((e) => {
    const d = e.date?.slice(0, 10) || '';
    const dateMatch = d >= fromDate && d <= toDate;
    if (!dateMatch) return false;

    if (ledgerSource === 'All') return true;
    if (ledgerSource === 'Cash') return e.paymentMode !== 'Bank';
    if (ledgerSource === 'Axis Bank') return e.paymentMode === 'Bank' && e.bankName === 'Axis Bank';
    if (ledgerSource === 'Federal Bank') return e.paymentMode === 'Bank' && e.bankName === 'Federal Bank';
    return true;
  });

  const categoryData = buildCategoryData(filteredExpenses);
  const dailyData = buildDailyData(filteredExpenses);

  const filteredExpensesForMonthly = expenses.filter((e) => {
    if (ledgerSource === 'All') return true;
    if (ledgerSource === 'Cash') return e.paymentMode !== 'Bank';
    if (ledgerSource === 'Axis Bank') return e.paymentMode === 'Bank' && e.bankName === 'Axis Bank';
    if (ledgerSource === 'Federal Bank') return e.paymentMode === 'Bank' && e.bankName === 'Federal Bank';
    return true;
  });
  const monthlyData = buildMonthlyData(filteredExpensesForMonthly);
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
        ledgerSource={ledgerSource}
        axisBalance={axisBalance}
        fedBalance={fedBalance}
      />

      {/* Tab & Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-fe-bg/60 border border-fe-muted/20 p-1 rounded-xl w-fit">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold font-sans transition-all ${isActive ? 'bg-white text-fe-teal shadow-sm border border-fe-muted/20' : 'text-fe-gray hover:text-fe-dark'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Ledger Source Filter (Cash, Axis Bank, Federal Bank, All) */}
        <div className="flex items-center gap-2 bg-fe-bg/60 border border-fe-muted/20 p-1 rounded-xl">
          {['All', 'Cash', 'Axis Bank', 'Federal Bank'].map((source) => {
            const isActive = ledgerSource === source;
            return (
              <button
                key={source}
                onClick={() => setLedgerSource(source)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-sans transition-all ${isActive ? 'bg-white text-fe-teal shadow-sm border border-fe-muted/20' : 'text-fe-gray hover:text-fe-dark'
                  }`}
              >
                {source}
              </button>
            );
          })}
        </div>
      </div>

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

              {activeDaySummary.hasInitial && (
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
              daySummary={activeDaySummary}
              suggestedOpening={suggestedOpening}
              onAddCash={handleAddCash}
              loading={loading}
              axisBalance={axisBalance}
              fedBalance={fedBalance}
              ledgerSource={ledgerSource}
              cashBalance={daySummary.balance}
            />

            {/* Daily transaction timeline */}
            <TransactionTimeline
              date={selectedDate}
              expenses={expenses}
              cashRegister={cashRegister}
              onDeleteExpense={triggerDeleteExpense}
              onDeleteCash={triggerDeleteCash}
              canDelete={true}
              ledgerSource={ledgerSource}
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
              {ledgerSource === 'All' || ledgerSource === 'Cash' ? (
                <CashBalanceChart cashRegister={cashRegister} />
              ) : (
                <CashBalanceChart
                  cashRegister={[]}
                  dataOverride={generateBankBalanceHistory(ledgerSource)}
                  title={`${ledgerSource} Balance History`}
                />
              )}
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
              onDelete={triggerDeleteExpense}
              canDelete={true}
            />
          </motion.div>
        )}
      {/* Popup Form Modal */}
      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleAddExpense}
        date={selectedDate}
        loading={loading}
      />

      {/* Deletion Confirmation Modal */}
      <Modal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, type: null, label: '' })}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-fe-dark font-sans">
            Are you sure want to delete the data?
          </p>
          {confirmDelete.label && (
            <p className="text-xs text-fe-gray font-sans italic bg-fe-bg p-2 rounded-lg">
              "{confirmDelete.label}"
            </p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete({ isOpen: false, id: null, type: null, label: '' })}
              className="text-xs font-sans"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs border-0 font-sans"
              loading={loading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Negative Balance Warning Modal */}
      <Modal
        isOpen={negativeWarning.isOpen}
        onClose={() => setNegativeWarning({ isOpen: false, data: null, accountName: '', currentBal: 0, newBal: 0 })}
        title="Warning: Negative Balance"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-sans space-y-1">
            <p className="font-bold">Caution: Balance will go negative!</p>
            <p>
              This transaction of <strong>{formatCurrency(negativeWarning.data?.amount || 0)}</strong> from{' '}
              <strong>{negativeWarning.accountName}</strong> will reduce the balance below zero.
            </p>
            <p>
              Current: <strong>{formatCurrency(negativeWarning.currentBal)}</strong> &rarr; New:{' '}
              <strong className="text-rose-600 font-bold">{formatCurrency(negativeWarning.newBal)}</strong>
            </p>
          </div>
          <p className="text-xs text-fe-gray font-sans">
            Would you like to proceed with recording this transaction anyway?
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => setNegativeWarning({ isOpen: false, data: null, accountName: '', currentBal: 0, newBal: 0 })}
              className="text-xs font-sans"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                const data = negativeWarning.data;
                setNegativeWarning({ isOpen: false, data: null, accountName: '', currentBal: 0, newBal: 0 });
                await executeAddExpense(data);
              }}
              className="text-xs font-sans"
              loading={loading}
            >
              Proceed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
