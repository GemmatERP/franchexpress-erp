'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RefreshCw, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  History
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';

export default function SyncLogsPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const getHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Authorization check - only Admin/Super Admin allowed
  useEffect(() => {
    if (!authLoading && role && role !== 'admin' && role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/sync-logs', { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch sync logs');
      }
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, toast]);

  useEffect(() => {
    if (role === 'admin' || role === 'super_admin') {
      fetchLogs();
    }
  }, [role, fetchLogs]);

  const handleRunSync = async () => {
    setSyncing(true);
    toast('Sync in progress, please wait...', 'info');
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/consignments/sync', { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Sync process failed');
      }
      const result = await res.json();
      
      toast(
        `Sync completed: ${result.updated} updated, ${result.failed} failed.`, 
        result.failed > 0 ? 'warning' : 'success'
      );
      
      await fetchLogs();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const toggleExpandLog = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (authLoading || (role !== 'admin' && role !== 'super_admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3">Verifying admin access...</p>
      </div>
    );
  }

  const lastSync = logs[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-fe-muted/10 shadow-sm">
        <div>
          <h1 className="text-xl font-heading font-bold text-fe-dark">Scheduled Auto-Sync Logs</h1>
          <p className="text-xs text-fe-gray font-sans mt-1">
            Configure external schedules (like <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-fe-teal hover:underline font-semibold">cron-job.org</a>) to automatically trigger consignment tracking status updates.
          </p>
        </div>
        <Button 
          onClick={handleRunSync} 
          disabled={syncing}
          variant="primary"
          className="flex items-center gap-2 text-xs font-semibold shrink-0"
        >
          {syncing ? (
            <Spinner size="xs" color="white" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {syncing ? 'Syncing...' : 'Run Sync Now'}
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-fe-teal/10 rounded-xl text-fe-teal shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Last Sync Run</p>
            <p className="text-xs font-bold text-fe-dark mt-0.5 truncate max-w-[170px]">
              {lastSync ? formatDate(lastSync.timestamp) : 'No logs recorded'}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-xl text-green-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Last Updated</p>
            <p className="text-lg font-heading font-bold text-fe-dark mt-0.5">
              {lastSync ? lastSync.updatedCount : 0} <span className="text-xs font-normal text-fe-gray">records</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Last Skipped</p>
            <p className="text-lg font-heading font-bold text-fe-dark mt-0.5">
              {lastSync ? lastSync.skippedCount : 0} <span className="text-xs font-normal text-fe-gray">records</span>
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-xl text-red-600 shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Last Failed</p>
            <p className="text-lg font-heading font-bold text-fe-dark mt-0.5">
              {lastSync ? lastSync.failedCount : 0} <span className="text-xs font-normal text-fe-gray">records</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Main logs table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-fe-muted/20">
          <h2 className="text-sm font-heading font-bold text-fe-dark">Execution History (Recent 30 Runs)</h2>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="md" />
            <p className="text-xs text-fe-gray font-sans mt-3">Loading logs history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-fe-gray text-xs font-sans">
            No sync logs have been recorded yet. Set up cron-job.org or click "Run Sync Now" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-fe-bg text-fe-gray font-semibold border-b border-fe-muted/20">
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Triggered By</th>
                  <th className="px-6 py-3.5 text-center">Processed</th>
                  <th className="px-6 py-3.5 text-center">Updated</th>
                  <th className="px-6 py-3.5 text-center">Skipped</th>
                  <th className="px-6 py-3.5 text-center">Failed</th>
                  <th className="px-6 py-3.5 text-center">Duration</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fe-muted/10">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const hasDetails = log.details && log.details.length > 0;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-fe-bg/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-fe-dark whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-fe-gray shrink-0" />
                            {formatDate(log.timestamp)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-fe-gray whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-fe-gray shrink-0" />
                            {log.triggeredByName || 'System'}
                            <Badge 
                              value={log.trigger === 'admin_manual' ? 'manual' : 'auto'} 
                              className={`text-[8px] px-1 py-0 ${
                                log.trigger === 'admin_manual' ? 'bg-fe-teal/10 text-fe-teal' : 'bg-blue-50 text-blue-600'
                              }`}
                            />
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-fe-dark">
                          {log.totalProcessed || 0}
                        </td>
                        <td className="px-6 py-4 text-center text-green-600 font-bold">
                          {log.updatedCount || 0}
                        </td>
                        <td className="px-6 py-4 text-center text-amber-600 font-bold">
                          {log.skippedCount || 0}
                        </td>
                        <td className="px-6 py-4 text-center text-red-600 font-bold">
                          {log.failedCount || 0}
                        </td>
                        <td className="px-6 py-4 text-center text-fe-gray whitespace-nowrap">
                          <span className="flex items-center justify-center gap-1 font-mono">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {log.durationMs ? `${(log.durationMs / 1000).toFixed(2)}s` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {hasDetails ? (
                            <button
                              onClick={() => toggleExpandLog(log.id)}
                              className="text-fe-teal hover:text-fe-dark font-semibold inline-flex items-center gap-1 focus:outline-none"
                            >
                              <span>{isExpanded ? 'Hide' : 'View'}</span>
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          ) : (
                            <span className="text-fe-gray">None</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && hasDetails && (
                        <tr className="bg-fe-bg/20">
                          <td colSpan="8" className="px-6 py-4">
                            <div className="border border-fe-muted/20 rounded-xl bg-white p-4 space-y-3 max-h-[300px] overflow-y-auto">
                              <h3 className="font-heading font-semibold text-fe-dark text-xs flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5 text-fe-teal" /> Updated/Error Details ({log.details.length} records logged)
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-sans">
                                {log.details.map((detail, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`flex items-center justify-between p-2 rounded-lg border ${
                                      detail.result === 'updated' 
                                        ? 'bg-green-50/30 border-green-100 text-green-800' 
                                        : detail.result === 'failed'
                                          ? 'bg-red-50/30 border-red-100 text-red-800'
                                          : 'bg-fe-bg border-fe-muted/10 text-fe-gray'
                                    }`}
                                  >
                                    <div>
                                      <span className="font-semibold">{detail.sno}</span> ({detail.awb})
                                    </div>
                                    <div className="font-medium">
                                      {detail.result === 'updated' && (
                                        <span>{detail.oldStatus} ➔ {detail.newStatus}</span>
                                      )}
                                      {detail.result === 'failed' && (
                                        <span className="text-red-500 font-mono">Error: {detail.reason}</span>
                                      )}
                                      {detail.result === 'skipped' && (
                                        <span>Unchanged</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
