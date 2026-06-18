import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { isFirebaseConfigured } from '../lib/firebase';
import { formatSNO } from '../lib/utils';

// ─── Mock data (demo mode only) ───────────────────────────────────────────────
function seedMockConsignments() {
  if (typeof window === 'undefined') return [];
  const existing = localStorage.getItem('fe_consignments');
  if (existing) { try { return JSON.parse(existing); } catch (_) {} }

  const list = [];
  const cities       = ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Vellore', 'Tirunelveli'];
  const statusOpts   = ['Delivered', 'Out of Delivery', 'Transit', 'Returned', 'Holding at HUB'];
  const courierOpts  = ['SmartR', 'Blue Dart', 'DTDC', 'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery'];
  const paymentModes = ['CASH', 'UPI', 'CREDIT', 'To Pay', 'Debit'];
  const today = new Date();

  for (let i = 1; i <= 15; i++) {
    const status = statusOpts[(i - 1) % statusOpts.length];
    const bookingDate = new Date();
    bookingDate.setDate(today.getDate() - (15 - i) % 10);
    const deliveredDate = status === 'Delivered'
      ? new Date(bookingDate.getTime() + 86400000)
      : null;

    list.push({
      id: `mock-id-${i}`, sno: formatSNO(i),
      date: bookingDate.toISOString(), voucherType: 'Normal',
      awbNumber: String(10000000000 + Math.floor(Math.random() * 90000000000)),
      courierPartner: courierOpts[i % courierOpts.length], podNumber: `POD-${1000 + i}`,
      mode: i % 2 === 0 ? 'Air' : 'Surface', nature: i % 3 === 0 ? 'Doc' : 'Non Doc',
      goodsDescription: 'Box of goods', weight: 1.5 + (i * 0.1), volumetricWeight: 2.0 + (i * 0.1),
      paymentMode: paymentModes[i % paymentModes.length], paymentDate: bookingDate.toISOString(),
      amount: 150 + (i * 20), coverCharges: i % 3 === 0 ? 50 : 0, paidStatus: i % 3 === 0 ? 'Not Paid' : 'Paid',
      codProductValue: i % 4 === 0 ? 1500 : 0, chargeableAmount: (150 + (i * 20)) + (i % 3 === 0 ? 50 : 0),
      consignorPhone: '9876543210', consignorName: 'Sender ' + i, consignorAddress1: 'Street A',
      consignorCity: cities[i % cities.length], consignorPincode: '600001',
      consigneePhone: '9988776655', consigneeName: 'Recipient ' + i, consigneeAddress1: 'Street B',
      consigneeCity: cities[(i + 2) % cities.length], consigneePincode: '600002', consigneeState: 'Tamil Nadu',
      deliveryStatus: status, deliveredDate: deliveredDate ? deliveredDate.toISOString() : null,
      createdAt: bookingDate.toISOString(), createdByName: 'Booking Desk Staff',
    });
  }
  localStorage.setItem('fe_consignments', JSON.stringify(list));
  localStorage.setItem('fe_counter', '15');
  return list;
}

// ─── Mock dashboard stats (demo mode) ─────────────────────────────────────────
function buildMockStats(items) {
  const today = new Date();
  const isToday = (v) => {
    if (!v) return false;
    const d = new Date(v);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  let todayBookings = 0, pendingShipments = 0, deliveredToday = 0, todayRevenue = 0;
  const last7 = {}, last14 = {};
  const statusCounts = { Transit: 0, 'Reached Destination': 0, 'Out of Delivery': 0, Returned: 0, 'Holding at HUB': 0, Delivered: 0 };

  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(today.getDate() - i);
    last7[d.toDateString()] = { name: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }), consignments: 0 };
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(today.getDate() - i);
    last14[d.toDateString()] = { date: `${d.getDate()}/${d.getMonth() + 1}`, amount: 0 };
  }

  items.forEach((item) => {
    if (isToday(item.date)) { todayBookings++; todayRevenue += Number(item.amount) || 0; }
    if (['Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB'].includes(item.deliveryStatus)) pendingShipments++;
    if (item.deliveryStatus === 'Delivered' && isToday(item.deliveredDate)) deliveredToday++;
    const ds = new Date(item.date).toDateString();
    if (last7[ds]) last7[ds].consignments++;
    if (last14[ds]) last14[ds].amount += Number(item.amount) || 0;
    if (item.deliveryStatus && statusCounts[item.deliveryStatus] !== undefined) statusCounts[item.deliveryStatus]++;
  });

  return {
    kpis: { todayBookings, pendingShipments, deliveredToday, todayRevenue },
    todayItems: items.filter((i) => isToday(i.date)),
    volumeChart: Object.values(last7),
    revenueChart: Object.values(last14),
    statusChart: Object.entries(statusCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConsignments() {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [hasMore, setHasMore]   = useState(false);
  const hasMoreRef              = useRef(false);
  const cursorRef               = useRef(null); // stores nextCursor between pages

  const getHasMore = useCallback(() => hasMoreRef.current, []);

  const getHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  // ── fetchDashboardStats ──────────────────────────────────────────────────
  // Uses the optimised /stats endpoint:
  //   • 2 count() queries  = 2 reads (KPIs)
  //   • today's docs only  = ~70 reads (today table + revenue)
  //   • last-14-days docs  = ~1000 reads max (charts)
  // vs the old approach that scanned the ENTIRE collection.
  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      await new Promise((r) => setTimeout(r, 300));
      const all = seedMockConsignments();
      setLoading(false);
      return buildMockStats(all);
    }

    try {
      const headers = await getHeaders();
      const res = await fetch('/api/consignments/stats', { headers });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to fetch stats');
      }
      return await res.json();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // ── fetchConsignments ────────────────────────────────────────────────────
  // Returns a plain array (backward-compat with reports + delivery pages).
  // Internally tracks cursor for pagination via loadMoreConsignments().
  const fetchConsignments = useCallback(async (filters = {}, resetCursor = true) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      await new Promise((r) => setTimeout(r, 300));
      const allItems = seedMockConsignments();
      const filtered = allItems.filter((item) => {
        if (filters.fromDate && new Date(item.date) < new Date(filters.fromDate)) return false;
        if (filters.toDate) {
          const end = new Date(filters.toDate); end.setHours(23, 59, 59, 999);
          if (new Date(item.date) > end) return false;
        }
        if (filters.courierPartner && filters.courierPartner !== 'All' && item.courierPartner !== filters.courierPartner) return false;
        if (filters.deliveryStatus  && filters.deliveryStatus  !== 'All' && item.deliveryStatus  !== filters.deliveryStatus)  return false;
        if (filters.paymentMode     && filters.paymentMode     !== 'All' && item.paymentMode     !== filters.paymentMode)     return false;
        return true;
      });
      setLoading(false);
      return filtered;
    }

    try {
      if (resetCursor) cursorRef.current = null;

      const headers = await getHeaders();
      const params = new URLSearchParams({ limit: '50' });

      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate)   params.append('toDate',   filters.toDate);
      if (filters.courierPartner && filters.courierPartner !== 'All') params.append('courierPartner', filters.courierPartner);
      if (filters.deliveryStatus  && filters.deliveryStatus  !== 'All') params.append('deliveryStatus',  filters.deliveryStatus);
      if (filters.paymentMode     && filters.paymentMode     !== 'All') params.append('paymentMode',     filters.paymentMode);
      if (cursorRef.current) params.append('cursor', cursorRef.current);

      const res = await fetch(`/api/consignments?${params}`, { headers });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to fetch consignments'); }

      const json = await res.json();
      // Handle both legacy array response and new paginated response
      if (Array.isArray(json)) { 
        setHasMore(false); 
        hasMoreRef.current = false;
        return json; 
      }

      cursorRef.current = json.nextCursor ?? null;
      const nextHasMore = json.hasMore ?? false;
      setHasMore(nextHasMore);
      hasMoreRef.current = nextHasMore;
      return json.data ?? [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // ── loadMoreConsignments ─────────────────────────────────────────────────
  // Appends next page of results (uses stored cursor).
  const loadMoreConsignments = useCallback(async (filters = {}) => {
    if (!cursorRef.current) return [];
    return fetchConsignments(filters, false); // false = don't reset cursor
  }, [fetchConsignments]);

  // ── getConsignment ───────────────────────────────────────────────────────
  const getConsignment = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      const all = seedMockConsignments();
      const match = all.find((i) => i.id === id);
      setLoading(false);
      if (!match) throw new Error('Consignment not found');
      return match;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/consignments/${id}`, { headers });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to fetch consignment'); }
      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // ── createConsignment ────────────────────────────────────────────────────
  const createConsignment = useCallback(async (consignmentData) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      await new Promise((r) => setTimeout(r, 500));
      const allItems = seedMockConsignments();
      const nextCount = Number(localStorage.getItem('fe_counter') || '15') + 1;
      localStorage.setItem('fe_counter', String(nextCount));
      const newObj = { ...consignmentData, id: `mock-id-${nextCount}`, sno: formatSNO(nextCount), date: consignmentData.date || new Date().toISOString(), paymentDate: consignmentData.paymentDate || new Date().toISOString(), deliveredDate: consignmentData.deliveredDate || null, createdAt: new Date().toISOString(), createdByName: 'Booking Desk Staff' };
      allItems.unshift(newObj);
      localStorage.setItem('fe_consignments', JSON.stringify(allItems));
      setLoading(false);
      return newObj;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch('/api/consignments', { method: 'POST', headers, body: JSON.stringify(consignmentData) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to create consignment'); }
      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // ── updateConsignment ────────────────────────────────────────────────────
  const updateConsignment = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      await new Promise((r) => setTimeout(r, 400));
      const allItems = seedMockConsignments();
      const idx = allItems.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error('Consignment not found');
      const updated = { ...allItems[idx], ...updateData };
      allItems[idx] = updated;
      localStorage.setItem('fe_consignments', JSON.stringify(allItems));
      setLoading(false);
      return updated;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/consignments/${id}`, { method: 'PUT', headers, body: JSON.stringify(updateData) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to update consignment'); }
      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // ── deleteConsignment ────────────────────────────────────────────────────
  const deleteConsignment = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      await new Promise((r) => setTimeout(r, 300));
      const allItems = seedMockConsignments();
      localStorage.setItem('fe_consignments', JSON.stringify(allItems.filter((i) => i.id !== id)));
      setLoading(false);
      return true;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/consignments/${id}`, { method: 'DELETE', headers });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to delete consignment'); }
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return {
    loading, error, hasMore,
    getHasMore,
    fetchDashboardStats,
    fetchConsignments,
    loadMoreConsignments,
    getConsignment,
    createConsignment,
    updateConsignment,
    deleteConsignment,
  };
}
