'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Clock, XCircle, IndianRupee, TrendingUp } from 'lucide-react';
import { getInitials } from '../../lib/utils';
import { AgentHistoryPanel } from './AgentHistoryPanel';

/**
 * AgentStatsPanel
 * Left-side panel displaying the agent's identity card, today's KPI stats,
 * and the historical delivery records with date-range filter.
 *
 * Props:
 *   profile      — { name, email, role }
 *   todayStats   — { delivered, pickedUp, notDelivered, toBePaid }
 *   authHeaders  — async function returning auth headers
 */
export function AgentStatsPanel({ profile, todayStats, authHeaders }) {
  const stats = [
    {
      label:    'Delivered Today',
      value:    todayStats.delivered,
      icon:     CheckCircle2,
      color:    'text-green-600',
      bgColor:  'bg-green-50',
      border:   'border-green-200/60',
    },
    {
      label:    'Picked Up Today',
      value:    todayStats.pickedUp,
      icon:     Package,
      color:    'text-fe-teal',
      bgColor:  'bg-fe-teal/5',
      border:   'border-fe-teal/20',
    },
    {
      label:    'Not Delivered',
      value:    todayStats.notDelivered,
      icon:     XCircle,
      color:    'text-amber-600',
      bgColor:  'bg-amber-50',
      border:   'border-amber-200/60',
    },
    {
      label:    'To Be Paid Today',
      value:    `₹${todayStats.toBePaid}`,
      icon:     IndianRupee,
      color:    'text-violet-600',
      bgColor:  'bg-violet-50',
      border:   'border-violet-200/60',
      large:    true,
    },
  ];

  return (
    <aside className="flex flex-col gap-5 h-full overflow-y-auto pr-1">

      {/* Agent Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-fe-teal to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-fe-teal/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-heading font-bold text-base">
            {getInitials(profile?.name)}
          </div>
          <div>
            <p className="text-sm font-bold font-heading leading-tight">{profile?.name || 'Agent'}</p>
            <p className="text-[10px] text-white/70 mt-0.5">{profile?.email || ''}</p>
            <div className="inline-flex items-center gap-1 mt-1 bg-white/20 rounded-full px-2 py-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-semibold text-white/90 uppercase tracking-wider">
                Delivery Agent
              </span>
            </div>
          </div>
        </div>

        {/* Quick Today Earnings */}
        <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/70 font-medium">Today's Earnings</p>
            <p className="text-xl font-bold font-heading">₹{todayStats.toBePaid}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white/80" />
          </div>
        </div>
      </motion.div>

      {/* Today's KPI Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.07 }}
              className={`${stat.bgColor} ${stat.border} border rounded-xl p-3 flex flex-col gap-2`}
            >
              <div className={`h-7 w-7 rounded-lg bg-white/80 flex items-center justify-center ${stat.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className={`text-lg font-bold font-heading ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-fe-gray font-medium leading-tight mt-0.5">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-fe-muted/20" />
        <span className="text-[10px] text-fe-gray font-semibold uppercase tracking-wider">Delivery History</span>
        <div className="flex-1 h-px bg-fe-muted/20" />
      </div>

      {/* History Panel */}
      <AgentHistoryPanel authHeaders={authHeaders} />
    </aside>
  );
}
