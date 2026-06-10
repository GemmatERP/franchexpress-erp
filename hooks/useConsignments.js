import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { isFirebaseConfigured } from '../lib/firebase';
import { formatSNO } from '../lib/utils';

// Helper to seed 15 realistic consignments in localStorage for demo mode
function seedMockConsignments() {
  if (typeof window === 'undefined') return [];
  
  const existing = localStorage.getItem('fe_consignments');
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (_) {}
  }

  const list = [];
  const cities = ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Vellore', 'Tirunelveli'];
  const statusOptions = ['Delivered', 'Out of Delivery', 'Transit', 'Returned', 'Holding at HUB'];
  const courierOptions = ['SmartR', 'Blue Dart', 'DTDC', 'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery'];
  const paymentModes = ['CASH', 'UPI', 'CREDIT', 'To Pay', 'Debit'];
  
  const today = new Date();
  
  for (let i = 1; i <= 15; i++) {
    const status = statusOptions[(i - 1) % statusOptions.length];
    const bookingDate = new Date();
    bookingDate.setDate(today.getDate() - (15 - i) % 10);
    
    let deliveredDate = null;
    if (status === 'Delivered') {
      deliveredDate = new Date(bookingDate);
      deliveredDate.setDate(deliveredDate.getDate() + 1);
    }

    const consignorCity = cities[i % cities.length];
    const consigneeCity = cities[(i + 2) % cities.length];

    const amount = 150 + (i * 20);
    const coverCharges = i % 3 === 0 ? 50 : 0;

    list.push({
      id: `mock-id-${i}`,
      sno: formatSNO(i),
      date: bookingDate.toISOString(),
      voucherType: 'Normal',
      awbNumber: String(10000000000 + Math.floor(Math.random() * 90000000000)),
      courierPartner: courierOptions[i % courierOptions.length],
      podNumber: `POD-${1000 + i}`,
      mode: i % 2 === 0 ? 'Air' : 'Surface',
      nature: i % 3 === 0 ? 'Doc' : 'Non Doc',
      goodsDescription: 'Box of goods',
      weight: 1.5 + (i * 0.1),
      volumetricWeight: 2.0 + (i * 0.1),

      paymentMode: paymentModes[i % paymentModes.length],
      paymentDate: bookingDate.toISOString(),
      amount,
      coverCharges,
      paidStatus: i % 3 === 0 ? 'Not Paid' : 'Paid',
      codProductValue: i % 4 === 0 ? 1500 : 0,
      chargeableAmount: amount + coverCharges,

      consignorPhone: '9876543210',
      consignorName: 'Sender ' + i,
      consignorAddress1: 'Street A',
      consignorCity,
      consignorPincode: '600001',

      consigneePhone: '9988776655',
      consigneeName: 'Recipient ' + i,
      consigneeAddress1: 'Street B',
      consigneeCity,
      consigneePincode: '600002',
      consigneeState: 'Tamil Nadu',

      deliveryStatus: status,
      deliveredDate: deliveredDate ? deliveredDate.toISOString() : null,
      createdAt: bookingDate.toISOString(),
      createdByName: 'Booking Desk Staff',
    });
  }

  localStorage.setItem('fe_consignments', JSON.stringify(list));
  localStorage.setItem('fe_counter', '15');
  return list;
}

export function useConsignments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [user]);

  const fetchConsignments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    if (!isFirebaseConfigured) {
      // Mock LocalStorage Fetch
      await new Promise((resolve) => setTimeout(resolve, 300));
      const allItems = seedMockConsignments();
      
      const filtered = allItems.filter((item) => {
        // Date range checks
        if (filters.fromDate) {
          const start = new Date(filters.fromDate);
          start.setHours(0,0,0,0);
          if (new Date(item.date) < start) return false;
        }
        if (filters.toDate) {
          const end = new Date(filters.toDate);
          end.setHours(23,59,59,999);
          if (new Date(item.date) > end) return false;
        }

        // Dropdowns
        if (filters.courierPartner && filters.courierPartner !== 'All' && item.courierPartner !== filters.courierPartner) return false;
        if (filters.deliveryStatus && filters.deliveryStatus !== 'All' && item.deliveryStatus !== filters.deliveryStatus) return false;
        if (filters.paymentMode && filters.paymentMode !== 'All' && item.paymentMode !== filters.paymentMode) return false;
        
        return true;
      });

      setLoading(false);
      return filtered;
    }

    try {
      const headers = await getHeaders();
      const queryParams = new URLSearchParams();
      
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.courierPartner && filters.courierPartner !== 'All') {
        queryParams.append('courierPartner', filters.courierPartner);
      }
      if (filters.deliveryStatus && filters.deliveryStatus !== 'All') {
        queryParams.append('deliveryStatus', filters.deliveryStatus);
      }
      if (filters.paymentMode && filters.paymentMode !== 'All') {
        queryParams.append('paymentMode', filters.paymentMode);
      }

      const res = await fetch(`/api/consignments?${queryParams.toString()}`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch consignments');
      }

      const data = await res.json();
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const getConsignment = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      const allItems = seedMockConsignments();
      const match = allItems.find((i) => i.id === id);
      setLoading(false);
      if (!match) throw new Error('Consignment not found');
      return match;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/consignments/${id}`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch consignment');
      }

      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const createConsignment = useCallback(async (consignmentData) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const allItems = seedMockConsignments();
      
      const nextCount = Number(localStorage.getItem('fe_counter') || '15') + 1;
      localStorage.setItem('fe_counter', String(nextCount));
      
      const newSNO = formatSNO(nextCount);
      const newObj = {
        ...consignmentData,
        id: `mock-id-${nextCount}`,
        sno: newSNO,
        date: consignmentData.date || new Date().toISOString(),
        paymentDate: consignmentData.paymentDate || new Date().toISOString(),
        deliveredDate: consignmentData.deliveredDate || null,
        createdAt: new Date().toISOString(),
        createdByName: 'Booking Desk Staff',
      };
      
      allItems.unshift(newObj);
      localStorage.setItem('fe_consignments', JSON.stringify(allItems));
      setLoading(false);
      return newObj;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch('/api/consignments', {
        method: 'POST',
        headers,
        body: JSON.stringify(consignmentData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create consignment');
      }

      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const updateConsignment = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const allItems = seedMockConsignments();
      const index = allItems.findIndex((i) => i.id === id);
      if (index === -1) throw new Error('Consignment not found');
      
      const updated = {
        ...allItems[index],
        ...updateData,
      };
      
      allItems[index] = updated;
      localStorage.setItem('fe_consignments', JSON.stringify(allItems));
      setLoading(false);
      return updated;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/consignments/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update consignment');
      }

      return await res.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const deleteConsignment = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const allItems = seedMockConsignments();
      const filtered = allItems.filter((i) => i.id !== id);
      localStorage.setItem('fe_consignments', JSON.stringify(filtered));
      setLoading(false);
      return true;
    }

    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/consignments/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete consignment');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return {
    loading,
    error,
    fetchConsignments,
    getConsignment,
    createConsignment,
    updateConsignment,
    deleteConsignment,
  };
}
