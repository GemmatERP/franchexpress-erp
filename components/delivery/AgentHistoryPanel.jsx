'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Package, MapPin, TrendingUp, IndianRupee, Loader2 } from 'lucide-react';

/**
 * AgentHistoryPanel
 * Renders a date-range filter and a scrollable table of the agent's
 * historical completed deliveries sourced from the deliveryQueue collection.
 *
 * Props:
 *   authHeaders  — async function that returns { Authorization, Content-Type }
 */
export function AgentHistoryPanel({ authHeaders }) {
  const today  = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(sevenDaysAgo);
  const [toDate,   setToDate]   = useState(today);
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await authHeaders();
      // We fetch the queue for each day in the range
      // For efficiency, we fetch all items and filter client-side for the range
      const res = await fetch(`/api/delivery-queue?date=${toDate}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      // Filter to completed items within the from-to range
      const filtered = (data.items || []).filter((item) => {
        if (item.status !== 'completed') return false;
        const completedDate = item.completedAt
          ? item.completedAt.slice(0, 10)
          : item.dayDate;
        return completedDate >= fromDate && completedDate <= toDate;
      });
      // Sort by completedAt desc
      filtered.sort((a, b) => {
        const aTime = a.completedAt || a.dayDate || '';
        const bTime = b.completedAt || b.dayDate || '';
        return bTime.localeCompare(aTime);
      });
      setRecords(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, fromDate, toDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalEarned = records.length * 20;

  return (
    <div className="flex flex-col gap-4">
      {/* Date range filter */}
      <div className="bg-white border border-fe-muted/20 rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-fe-teal" />
          <span className="text-[11px] font-bold text-fe-dark font-heading">History Filter</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-fe-gray font-semibold block mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-[11px] border border-fe-muted/30 rounded-lg px-2 py-1.5 text-fe-dark focus:outline-none focus:ring-1 focus:ring-fe-teal/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-fe-gray font-semibold block mb-1">To</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={today}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-[11px] border border-fe-muted/30 rounded-lg px-2 py-1.5 text-fe-dark focus:outline-none focus:ring-1 focus:ring-fe-teal/40"
            />
          </div>
        </div>

        {/* Summary row */}
        {!loading && records.length > 0 && (
          <div className="flex items-center justify-between bg-fe-teal/5 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-fe-teal" />
              <span className="text-[10px] font-bold text-fe-teal">{records.length} deliveries</span>
            </div>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3 text-fe-teal" />
              <span className="text-[11px] font-bold text-fe-teal">{totalEarned} earned</span>
            </div>
          </div>
        )}
      </div>

      {/* Records list */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 text-fe-teal animate-spin" />
          </div>
        ) : error ? (
          <p className="text-[11px] text-red-500 text-center py-6">{error}</p>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Package className="h-8 w-8 text-fe-gray/30 mb-2" />
            <p className="text-[11px] text-fe-gray">No deliveries in this range</p>
          </div>
        ) : (
          records.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white border border-fe-muted/20 rounded-lg p-2.5 flex items-start gap-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold font-mono text-fe-dark truncate">
                  {item.awbNumber}
                </p>
                {item.consigneeName && (
                  <p className="text-[10px] text-fe-gray flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {item.consigneeName}
                    {item.consigneeCity ? `, ${item.consigneeCity}` : ''}
                  </p>
                )}
                <p className="text-[9px] text-fe-gray/70 mt-0.5">
                  {item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : item.dayDate}
                </p>
              </div>
              <span className="text-[11px] font-bold text-green-600 shrink-0">+₹20</span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
