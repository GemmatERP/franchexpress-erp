'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { isFirebaseConfigured } from '../lib/firebase';

export const DEFAULT_COURIER_PARTNERS = [
  'Franch Express',
  'India Post',
  'ST Courier',
  'SmartR',
  'Blue Dart',
  'DTDC',
  'DHL',
  'FedEx',
  'Aramex',
  'UPS',
  'Delhivery',
];

const LOCAL_STORAGE_KEY = 'fe_courier_partners';

export function useCourierPartners() {
  const { user } = useAuth();
  const [partners, setPartners] = useState(
    DEFAULT_COURIER_PARTNERS.map((name, idx) => ({ id: `default-${idx}`, name }))
  );
  const [loading, setLoading] = useState(false);

  const getHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  const fetchPartners = useCallback(async () => {
    if (!isFirebaseConfigured) {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          try {
            setPartners(JSON.parse(raw));
            return;
          } catch (_) {}
        }
        const seeded = DEFAULT_COURIER_PARTNERS.map((name, idx) => ({ id: `local-${idx}`, name }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
        setPartners(seeded);
      }
      return;
    }

    if (!user) return;
    setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/courier-partners', { headers });
      if (!res.ok) throw new Error('Failed to load courier partners');
      const json = await res.json();
      if (Array.isArray(json.partners) && json.partners.length > 0) {
        setPartners(json.partners);
      }
    } catch (err) {
      console.error('useCourierPartners fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, getHeaders]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const addPartner = useCallback(async (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Partner name is required');

    if (!isFirebaseConfigured) {
      const duplicate = partners.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
      if (duplicate) throw new Error(`"${trimmed}" already exists`);
      const created = { id: `local-${Date.now()}`, name: trimmed };
      const updated = [...partners, created];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setPartners(updated);
      return created;
    }

    const headers = await getHeaders();
    const res = await fetch('/api/courier-partners', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: trimmed }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add courier partner');
    setPartners((prev) => [...prev, json]);
    return json;
  }, [partners, getHeaders]);

  const deletePartner = useCallback(async (id) => {
    if (!isFirebaseConfigured) {
      const updated = partners.filter((p) => p.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setPartners(updated);
      return;
    }

    const headers = await getHeaders();
    const res = await fetch(`/api/courier-partners/${id}`, {
      method: 'DELETE',
      headers,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete courier partner');
    setPartners((prev) => prev.filter((p) => p.id !== id));
  }, [partners, getHeaders]);

  const partnerNames = partners.map((p) => p.name);

  return {
    partners,
    partnerNames,
    loading,
    addPartner,
    deletePartner,
    refreshPartners: fetchPartners,
  };
}

