'use client';

/**
 * ConsignmentEditContext
 *
 * Secure, optimized pattern for Next.js App Router:
 * - Only the consignment ID is stored in sessionStorage (session-scoped, not persistent).
 * - Full data is NEVER stored client-side; the edit page always fetches fresh data
 *   from the API using the user's Firebase auth token.
 * - Direct URL access to /dashboard/consignments/edit without context redirects safely
 *   back to the consignments list.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SESSION_KEY = 'fe_edit_consignment_id';

const ConsignmentEditContext = createContext(null);

export function ConsignmentEditProvider({ children }) {
  // In-memory state — fastest, no serialization overhead
  const [editId, setEditId] = useState(null);

  // Hydrate from sessionStorage on mount (handles accidental page refresh)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setEditId(stored);
    } catch (_) {
      // sessionStorage may be unavailable in private mode — fail silently
    }
  }, []);

  /**
   * Called by any "Edit" button across the app before navigating.
   * Stores only the ID (never sensitive data) in sessionStorage as a fallback.
   */
  const setEditConsignment = useCallback((id) => {
    setEditId(id);
    try {
      if (id) {
        sessionStorage.setItem(SESSION_KEY, id);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (_) {
      // Fail silently if sessionStorage is blocked
    }
  }, []);

  /**
   * Called by the edit page after reading editId to clear the session entry,
   * preventing stale state on the next navigation.
   */
  const clearEdit = useCallback(() => {
    setEditId(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }, []);

  return (
    <ConsignmentEditContext.Provider value={{ editId, setEditConsignment, clearEdit }}>
      {children}
    </ConsignmentEditContext.Provider>
  );
}

export function useConsignmentEdit() {
  const ctx = useContext(ConsignmentEditContext);
  if (!ctx) {
    throw new Error('useConsignmentEdit must be used inside a ConsignmentEditProvider');
  }
  return ctx;
}
