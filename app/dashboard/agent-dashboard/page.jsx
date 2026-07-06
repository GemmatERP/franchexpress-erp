'use client';

import React, { useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { AgentDashboardView } from '../../../components/delivery/AgentDashboardView';

/**
 * Delivery Agent Standalone Dashboard Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Scopes statistics, identity badge, daily earnings, and date-range history logs.
 * Reuses the shared AgentDashboardView component.
 */
export default function AgentDashboardPage() {
  const { user, profile } = useAuth();

  // ── Auth header helper ───────────────────────────────────────────────────────
  const authHeaders = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [user]);

  return (
    <AgentDashboardView
      agentId={null} // null defaults to current authenticated agent in API
      agentProfile={profile}
      authHeaders={authHeaders}
    />
  );
}
