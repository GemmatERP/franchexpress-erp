'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { AgentStatsPanel } from '../../../components/delivery/AgentStatsPanel';
import { Spinner } from '../../../components/ui/Spinner';

/**
 * Delivery Agent Standalone Dashboard Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Scopes statistics, identity badge, daily earnings, and date-range history logs.
 */
export default function AgentDashboardPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);

  const [loadingInit, setLoadingInit] = useState(true);
  const [todayStats, setTodayStats] = useState({
    delivered:    0,
    pickedUp:     0,
    notDelivered: 0,
    toBePaid:     0,
  });

  // ── Auth header helper ───────────────────────────────────────────────────────
  const authHeaders = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [user]);

  // ── Fetch and derive stats from deliveryQueue ────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/delivery-queue?date=${today}`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load delivery queue');
      }
      const data = await res.json();
      const items = data.items || [];

      // Calculate totals
      const delivered    = items.filter((i) => i.status === 'completed').length;
      const pickedUp     = items.length;
      const notDelivered = items.filter((i) => i.status === 'pending').length;
      const toBePaid     = delivered * 20;

      setTodayStats({ delivered, pickedUp, notDelivered, toBePaid });
    } catch (err) {
      toast(`Stats load error: ${err.message}`, 'error');
    } finally {
      setLoadingInit(false);
    }
  }, [user, authHeaders, today, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loadingInit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-fe-teal/10 flex items-center justify-center">
            <Spinner size="md" />
          </div>
        </div>
        <p className="text-xs text-fe-gray font-sans animate-pulse">Loading dashboard stats...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto pb-16"
    >
      <div className="bg-white border border-fe-muted/30 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-sm font-bold text-fe-gray font-sans mb-5">
          Personal Performance & Handovers
        </h2>
        <AgentStatsPanel
          profile={profile}
          todayStats={todayStats}
          authHeaders={authHeaders}
        />
      </div>
    </motion.div>
  );
}
