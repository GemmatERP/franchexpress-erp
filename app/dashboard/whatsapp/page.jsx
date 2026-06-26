'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  XCircle,
  MapPin,
  Search,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';

export default function WhatsAppLogsPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Authorization check - only Admin/Super Admin allowed
  useEffect(() => {
    if (!authLoading && role && role !== 'admin' && role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  const getHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      // Fetch more logs to have a good view
      const res = await fetch('/api/whatsapp/messages?limit=150', { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch WhatsApp logs');
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

  // Format date to Indian Localized format
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Compute stats on loaded logs
  const stats = useMemo(() => {
    const outbound = logs.filter(l => l.direction === 'outbound');
    const inbound = logs.filter(l => l.direction === 'inbound');
    
    const sentCount = outbound.length;
    const deliveredCount = outbound.filter(l => l.status === 'delivered' || l.status === 'read').length;
    const readCount = outbound.filter(l => l.status === 'read').length;
    const failedCount = outbound.filter(l => l.status === 'failed').length;

    const deliveredRate = sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100) : 0;
    const readRate = sentCount > 0 ? Math.round((readCount / sentCount) * 100) : 0;

    return {
      sentCount,
      inboundCount: inbound.length,
      deliveredRate,
      readRate,
      failedCount
    };
  }, [logs]);

  // Apply filters client-side on loaded logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (directionFilter) {
      result = result.filter(log => log.direction === directionFilter);
    }

    if (statusFilter) {
      result = result.filter(log => log.status === statusFilter);
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase().trim();
      result = result.filter(log => {
        const phone = log.recipientPhone || log.senderPhone || '';
        const name = log.recipientName || '';
        const awb = log.awb || '';
        const body = log.body || '';
        return phone.includes(s) || 
               name.toLowerCase().includes(s) || 
               awb.toLowerCase().includes(s) ||
               body.toLowerCase().includes(s);
      });
    }

    return result;
  }, [logs, searchTerm, directionFilter, statusFilter]);

  if (authLoading || (role !== 'admin' && role !== 'super_admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3">Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-fe-muted/10 shadow-sm animate-fade-in">
        <div>
          <h1 className="text-xl font-heading font-bold text-fe-dark">WhatsApp Messaging Hub</h1>
          <p className="text-xs text-fe-gray font-sans mt-1">
            Audit outbound templates sent by the system and view replies or location updates received from customers.
          </p>
        </div>
        <Button 
          onClick={fetchLogs} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2 text-xs font-semibold shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </Button>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border border-fe-muted/10 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Outbound Messages</p>
          <p className="text-2xl font-heading font-bold text-fe-dark mt-2">{stats.sentCount}</p>
        </Card>

        <Card className="p-4 bg-white border border-fe-muted/10 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Delivered Rate</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-2xl font-heading font-bold text-fe-teal">{stats.deliveredRate}%</p>
            <span className="text-[10px] text-fe-gray">of sent</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-fe-muted/10 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Read Rate</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-2xl font-heading font-bold text-blue-500">{stats.readRate}%</p>
            <span className="text-[10px] text-fe-gray">of sent</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-fe-muted/10 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Inbound Replies</p>
          <p className="text-2xl font-heading font-bold text-purple-600 mt-2">{stats.inboundCount}</p>
        </Card>

        <Card className="p-4 bg-white border border-fe-muted/10 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-fe-gray">Failed Dispatches</p>
          <p className={`text-2xl font-heading font-bold mt-2 ${stats.failedCount > 0 ? 'text-red-500' : 'text-fe-dark'}`}>
            {stats.failedCount}
          </p>
        </Card>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4 bg-white border border-fe-muted/10 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-fe-gray" />
            <input
              type="text"
              placeholder="Search by AWB, phone, name, or message text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-fe-muted/20 rounded-lg text-xs font-sans focus:outline-none focus:border-fe-teal focus:ring-1 focus:ring-fe-teal"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-fe-muted/20 rounded-lg text-xs font-sans bg-white focus:outline-none focus:border-fe-teal focus:ring-1 focus:ring-fe-teal"
            >
              <option value="">All Directions</option>
              <option value="outbound">Outbound (Sent)</option>
              <option value="inbound">Inbound (Replies)</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-fe-muted/20 rounded-lg text-xs font-sans bg-white focus:outline-none focus:border-fe-teal focus:ring-1 focus:ring-fe-teal"
            >
              <option value="">All Statuses</option>
              <option value="read">Read (Blue double-check)</option>
              <option value="delivered">Delivered (Double-check)</option>
              <option value="sent">Sent (Single check)</option>
              <option value="failed">Failed</option>
              <option value="received">Received Reply</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main feed list */}
      <Card className="overflow-hidden bg-white border border-fe-muted/10 shadow-sm">
        <div className="px-6 py-4 border-b border-fe-muted/20 flex justify-between items-center bg-fe-bg/10">
          <h2 className="text-sm font-heading font-bold text-fe-dark">Communication Logs</h2>
          <span className="text-[10px] text-fe-gray font-sans">
            Showing {filteredLogs.length} matching messages
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="md" />
            <p className="text-xs text-fe-gray font-sans mt-3">Loading message history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-fe-gray text-xs font-sans">
            No messages or replies match your filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-fe-muted/10">
            {filteredLogs.map((log) => {
              const isInbound = log.direction === 'inbound';
              const isFailed = log.status === 'failed';
              const isRead = log.status === 'read';
              const isDelivered = log.status === 'delivered';
              const isSent = log.status === 'sent';

              return (
                <div 
                  key={log.id} 
                  className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors hover:bg-fe-bg/10 ${
                    isInbound ? 'bg-purple-50/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Direction icon badge */}
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isInbound 
                        ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                        : isFailed 
                          ? 'bg-red-50 text-red-500 border border-red-100'
                          : 'bg-fe-teal/10 text-fe-teal border border-fe-teal/5'
                    }`}>
                      {isInbound ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : isFailed ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1.5 flex-1">
                      {/* Name / Phone and timestamp header */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-fe-dark flex items-center gap-1.5 font-sans">
                          <User className="h-3 w-3 text-fe-gray" />
                          {isInbound 
                            ? `Customer Reply (+${log.senderPhone})` 
                            : `${log.recipientName || 'Recipient'} (+${log.recipientPhone})`
                          }
                        </span>
                        
                        {/* Recipient Type Badge (Outbound) */}
                        {log.recipientType && (
                          <Badge 
                            value={log.recipientType} 
                            className={`text-[9px] uppercase px-1.5 py-0 ${
                              log.recipientType === 'consignee' ? 'bg-fe-teal/10 text-fe-teal' : 'bg-orange-50 text-orange-600'
                            }`}
                          />
                        )}

                        <span className="text-[10px] text-fe-gray font-sans flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(log.timestamp)}
                        </span>
                      </div>

                      {/* Content block */}
                      <div className="text-xs text-fe-dark font-sans leading-relaxed break-words">
                        {isInbound ? (
                          log.msgType === 'location' ? (
                            <div className="flex items-center gap-2 bg-purple-50/50 border border-purple-100 p-2 rounded-lg text-purple-900 max-w-md">
                              <MapPin className="h-4 w-4 text-purple-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-[11px] truncate">Shared GPS Coordinates</p>
                                <p className="text-[10px] text-purple-700 truncate">{log.body}</p>
                              </div>
                              <a
                                href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-[10px] text-purple-600 hover:text-purple-900 font-bold flex items-center gap-0.5 shrink-0 bg-white px-2 py-1 rounded border border-purple-200 shadow-sm"
                              >
                                View Maps
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          ) : (
                            <p className="italic bg-purple-50/20 border border-purple-100/50 p-2 rounded-lg max-w-xl text-fe-dark">
                              "{log.body}"
                            </p>
                          )
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold">
                              Template: <code className="bg-fe-bg px-1.5 py-0.5 rounded font-mono text-xs">{log.templateName}</code>
                            </p>
                            {log.parameters && log.parameters.length > 0 && (
                              <p className="text-[11px] text-fe-gray">
                                Parameters: {log.parameters.map((p, idx) => (
                                  <span key={idx} className="inline-block bg-fe-bg px-1 py-0.2 rounded border border-fe-muted/10 mx-0.5 text-fe-dark font-medium">
                                    {String(p)}
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right hand details: AWB & Status Checkmarks */}
                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto shrink-0 gap-3 border-t md:border-t-0 border-fe-muted/10 pt-2.5 md:pt-0">
                    {log.awb && (
                      <Badge 
                        value={`AWB: ${log.awb}`}
                        onClick={() => router.push(`/dashboard/search?q=${log.awb}`)}
                        className="cursor-pointer hover:bg-fe-teal/20 text-[10px] px-2 py-0.5 bg-fe-bg border border-fe-muted/20 text-fe-dark font-mono font-bold"
                        title="Click to search consignment"
                      />
                    )}

                    {/* Status checkmarks */}
                    <div className="flex items-center gap-1.5 text-xs select-none">
                      {isRead && (
                        <span className="flex items-center gap-1 font-semibold text-blue-500 font-sans" title="Read by customer">
                          Read
                          <CheckCheck className="h-4.5 w-4.5 text-blue-500" />
                        </span>
                      )}
                      {isDelivered && (
                        <span className="flex items-center gap-1 text-fe-gray font-medium font-sans" title="Delivered to device">
                          Delivered
                          <CheckCheck className="h-4.5 w-4.5 text-fe-gray" />
                        </span>
                      )}
                      {isSent && (
                        <span className="flex items-center gap-1 text-fe-gray font-sans" title="Sent from Meta servers">
                          Sent
                          <Check className="h-4.5 w-4.5 text-fe-gray" />
                        </span>
                      )}
                      {isInbound && (
                        <span className="flex items-center gap-1 font-semibold text-purple-600 font-sans">
                          Received
                          <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                        </span>
                      )}
                      {isFailed && (
                        <div className="flex flex-col items-end">
                          <span className="flex items-center gap-1 font-semibold text-red-500 font-sans">
                            Failed
                            <XCircle className="h-4.5 w-4.5 text-red-500" />
                          </span>
                          {log.errorMessage && (
                            <span className="text-[9px] text-red-400 font-sans text-right max-w-[150px] truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
