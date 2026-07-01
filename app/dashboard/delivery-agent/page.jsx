'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { BulkScanPage } from '../../../components/delivery/BulkScanPage';
import { Spinner } from '../../../components/ui/Spinner';

/**
 * Delivery Agent Workspace
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone page for the "Delivery" menu item (Scanner & AWB list).
 * Scoped to the logged-in agent.
 */
export default function DeliveryAgentHubPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);

  const [queueItems, setQueueItems] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // ── Auth header helper ───────────────────────────────────────────────────────
  const authHeaders = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [user]);

  // ── Fetch queue from API ─────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    if (!user) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/delivery-queue?date=${today}`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load delivery queue');
      }
      const data = await res.json();
      setQueueItems(data.items || []);
    } catch (err) {
      toast(`Queue load error: ${err.message}`, 'error');
    } finally {
      setLoadingInit(false);
    }
  }, [user, authHeaders, today, toast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  if (loadingInit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-fe-teal/10 flex items-center justify-center">
            <Spinner size="md" />
          </div>
        </div>
        <p className="text-xs text-fe-gray font-sans animate-pulse">Loading your delivery hub...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto pb-16"
    >
      <BulkScanPage
        authHeaders={authHeaders}
        queueItems={queueItems}
        setQueueItems={setQueueItems}
        onRefresh={fetchQueue}
      />
    </motion.div>
  );
}
