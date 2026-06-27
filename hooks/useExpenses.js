import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

export const EXPENSE_CATEGORIES = [
  'Staff & Wages',
  'Office Supplies',
  'Transport & Courier',
  'Utilities & Maintenance',
  'Miscellaneous',
];

const CATEGORY_COLORS = {
  'Staff & Wages': '#0d9488',
  'Office Supplies': '#3b82f6',
  'Transport & Courier': '#f59e0b',
  'Utilities & Maintenance': '#8b5cf6',
  'Miscellaneous': '#6b7280',
};

export function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#6b7280';
}

export function useExpenses() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Auth header helper ───────────────────────────────────────────────────────
  const authHeaders = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [user]);

  // ── Fetch expenses ───────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async ({ fromDate, toDate, category } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (category && category !== 'All') params.set('category', category);
      const res = await fetch(`/api/expenses?${params}`, { headers });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch expenses');
      return await res.json();
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // ── Add expense ──────────────────────────────────────────────────────────────
  const addExpense = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/expenses', { method: 'POST', headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add expense');
      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // ── Update expense ───────────────────────────────────────────────────────────
  const updateExpense = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/expenses/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update expense');
      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // ── Delete expense ───────────────────────────────────────────────────────────
  const deleteExpense = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete expense');
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // ── Fetch cash register ──────────────────────────────────────────────────────
  const fetchCashRegister = useCallback(async ({ fromDate, toDate } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      const res = await fetch(`/api/cash-register?${params}`, { headers });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch cash register');
      return await res.json();
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // ── Add cash register entry ──────────────────────────────────────────────────
  const addCashEntry = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/cash-register', { method: 'POST', headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add entry');
      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // ── Delete cash register entry ───────────────────────────────────────────────
  const deleteCashEntry = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/cash-register/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete entry');
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // ── Aggregate helpers ────────────────────────────────────────────────────────
  function buildCategoryData(expenses) {
    const map = {};
    for (const e of expenses) {
      if (e.entryType === 'CR') continue; // only show DR (debits/expenses) in category analysis
      if (!map[e.category]) map[e.category] = 0;
      map[e.category] += Number(e.amount) || 0;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: getCategoryColor(name) }))
      .sort((a, b) => b.value - a.value);
  }

  function buildDailyData(expenses) {
    const map = {};
    for (const e of expenses) {
      if (e.entryType === 'CR') continue;
      const d = e.date ? e.date.slice(0, 10) : '';
      if (!d) continue;
      if (!map[d]) map[d] = 0;
      map[d] += Number(e.amount) || 0;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        amount,
      }));
  }

  function buildMonthlyData(expenses) {
    const map = {};
    for (const e of expenses) {
      if (e.entryType === 'CR') continue;
      const m = e.date ? e.date.slice(0, 7) : '';
      if (!m) continue;
      if (!map[m]) map[m] = 0;
      map[m] += Number(e.amount) || 0;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month,
        label: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        amount,
      }));
  }

  // ── Calculate Day Balance ──────────────────────────────────────────────────
  function calculateDayBalance(dateStr, allExpenses, allCashRegister) {
    const dayCash = allCashRegister.filter((r) => r.dateString === dateStr || r.date?.slice(0, 10) === dateStr);
    const dayExpenses = allExpenses.filter((e) => e.dateString === dateStr || e.date?.slice(0, 10) === dateStr);

    const initial = dayCash
      .filter((r) => r.type === 'initial' || r.type === 'opening')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const added = dayCash
      .filter((r) => r.type === 'add')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const debits = dayExpenses
      .filter((e) => e.entryType === 'DR')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const credits = dayExpenses
      .filter((e) => e.entryType === 'CR')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const balance = initial + added + credits - debits;

    return {
      initial,
      added,
      debits,
      credits,
      balance,
      hasInitial: dayCash.some((r) => r.type === 'initial' || r.type === 'opening')
    };
  }

  return {
    loading,
    error,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    fetchCashRegister,
    addCashEntry,
    deleteCashEntry,
    buildCategoryData,
    buildDailyData,
    buildMonthlyData,
    calculateDayBalance,
  };
}
