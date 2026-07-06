import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * useOfficeUtilities
 * Follows the same pattern as useExpenses.js:
 * - authHeaders() for authenticated fetch
 * - fetchItems() to load all items
 * - adjustItem(itemId, delta) to add or remove from a count
 */
export function useOfficeUtilities() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Auth header helper ──────────────────────────────────────────────────────
  const authHeaders = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [user]);

  // ── Fetch all utility items ─────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/office-utilities', { headers });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch office utilities');
      const data = await res.json();
      setItems(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  /**
   * adjustItem — add or remove from a utility item count.
   * @param {string} itemId - Firestore document ID (e.g. 'pod', 'covers')
   * @param {number} delta - Positive integer to add, negative to remove
   * @returns {object} Updated item { id, count }
   * @throws {Error} If removal would make count negative (server returns 400)
   */
  const adjustItem = useCallback(async (itemId, delta) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/office-utilities/adjust', {
        method: 'POST',
        headers,
        body: JSON.stringify({ itemId, delta }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to adjust count');
      }
      const updated = await res.json();
      // Optimistically update local items state
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, count: updated.count } : item))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  return { items, loading, error, fetchItems, adjustItem };
}
