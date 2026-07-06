'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { AgentStatsPanel } from './AgentStatsPanel';
import { Spinner } from '../ui/Spinner';

/**
 * AgentDashboardView
 * Reusable component to render a delivery agent's stats dashboard.
 * Can be used by the agent themselves (agentId = null/undefined)
 * or by Admin/Employee (agentId provided).
 */
export function AgentDashboardView({ agentId, agentProfile, authHeaders, pendingPrevious = 0, onPay }) {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [loadingInit, setLoadingInit] = useState(true);
  const [todayStats, setTodayStats] = useState({
    delivered:    0,
    pickedUp:     0,
    notDelivered: 0,
    toBePaid:     0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const headers = await authHeaders();
      let url = `/api/delivery-queue?date=${today}`;
      if (agentId) {
        url += `&agentUid=${agentId}`;
      }
      
      const res = await fetch(url, { headers });
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
      const toBePaid     = items.filter((i) => i.status === 'completed' && i.isPaid !== true).length * 20;

      setTodayStats({ delivered, pickedUp, notDelivered, toBePaid });
    } catch (err) {
      toast(`Stats load error: ${err.message}`, 'error');
    } finally {
      setLoadingInit(false);
    }
  }, [agentId, authHeaders, today, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loadingInit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
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
          Performance & Handovers
        </h2>
        <AgentStatsPanel
          profile={agentProfile}
          todayStats={todayStats}
          authHeaders={authHeaders}
          agentUid={agentId}
          pendingPrevious={pendingPrevious}
          onPay={onPay}
        />
      </div>
    </motion.div>
  );
}
