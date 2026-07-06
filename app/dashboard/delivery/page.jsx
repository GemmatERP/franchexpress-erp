'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  User, 
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  IndianRupee
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Spinner } from '../../../components/ui/Spinner';
import { AgentDashboardView } from '../../../components/delivery/AgentDashboardView';
import { AddTransactionModal } from '../../../components/expenses/AddTransactionModal';
import { useExpenses } from '../../../hooks/useExpenses';

export default function DeliveryViewPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null); // { uid, name, email }
  const { addExpense } = useExpenses();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [payoutCount, setPayoutCount] = useState(0);

  const handleOpenPayModal = (agent) => {
    setPayTarget(agent);
    setIsPayModalOpen(true);
  };

  const handleSavePayment = async (expenseData) => {
    setSavingPayment(true);
    try {
      await addExpense(expenseData);
      toast('Payment saved successfully and ledger updated.', 'success');
      setIsPayModalOpen(false);
      setPayTarget(null);
      setPayoutCount(prev => prev + 1);
      if (selectedAgent && selectedAgent.uid === expenseData.agentUid) {
        setSelectedAgent(prev => ({
          ...prev,
          toBePaidToday: 0,
          pendingPrevious: 0
        }));
      }
      await fetchAgents();
    } catch (err) {
      toast(err.message || 'Failed to process payment', 'error');
      throw err;
    } finally {
      setSavingPayment(false);
    }
  };
  // ── Access Control ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && role && role !== 'admin' && role !== 'super_admin' && role !== 'employee') {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  // ── Auth header helper ───────────────────────────────────────────────────────
  const authHeaders = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [user]);

  // ── Fetch all agents & metrics ───────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/delivery-agents', { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load delivery agents');
      }
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast]);

  useEffect(() => {
    if (role === 'admin' || role === 'super_admin' || role === 'employee') {
      fetchAgents();
    }
  }, [role, fetchAgents]);

  // ── Filtered agents list ─────────────────────────────────────────────────────
  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) return agents;
    return agents.filter(agent => 
      (agent.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agents, searchTerm]);

  // ── Show Loading state for authentication or first load ──────────────────────
  if (authLoading || (loading && agents.length === 0 && !error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans">Loading delivery dashboard...</p>
      </div>
    );
  }

  // ── Render Page ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {selectedAgent ? (
        /* Drill-down View */
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedAgent(null)}
              className="p-2 hover:bg-fe-muted/20 border border-fe-muted/30 rounded-xl transition-all text-fe-gray hover:text-fe-dark flex items-center justify-center"
              title="Back to Agent List"
              id="back-to-list-btn"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-fe-dark font-heading">
                Agent Dashboard: {selectedAgent.name}
              </h1>
              <p className="text-xs text-fe-gray font-sans mt-0.5">
                Viewing performance metrics for {selectedAgent.email}
              </p>
            </div>
          </div>

          <AgentDashboardView
            key={`${selectedAgent.uid}-${payoutCount}`}
            agentId={selectedAgent.uid}
            agentProfile={selectedAgent}
            authHeaders={authHeaders}
            pendingPrevious={selectedAgent.pendingPrevious || 0}
            onPay={handleOpenPayModal}
          />
        </div>
      ) : (
        /* Main Page View */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fe-muted/20 pb-5">
            <div>
              <h1 className="text-base font-bold text-fe-dark font-heading">
                Delivery View
              </h1>
              <p className="text-xs text-fe-gray mt-0.5 font-sans">
                Monitor delivery agent performance, metrics, and daily earnings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by agent name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 text-xs font-sans border border-fe-muted/30 rounded-xl px-3 py-2 text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal/30 pl-8 transition-all"
                  id="agent-search-input"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-fe-gray" />
              </div>

              <button
                onClick={fetchAgents}
                disabled={loading}
                className="p-2 border border-fe-muted/30 hover:bg-fe-muted/10 rounded-xl transition-all text-fe-gray hover:text-fe-dark flex items-center justify-center disabled:opacity-50"
                title="Refresh list"
                id="refresh-agents-btn"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* List Content */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center max-w-md mx-auto space-y-3 shadow-sm">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
              <h3 className="text-sm font-bold text-red-700 font-heading">Failed to load Agents</h3>
              <p className="text-xs text-red-600 font-sans leading-relaxed">{error}</p>
              <button
                onClick={fetchAgents}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="bg-white border border-fe-muted/30 rounded-2xl p-16 text-center max-w-md mx-auto space-y-4 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-fe-teal/5 flex items-center justify-center mx-auto">
                <User className="h-6 w-6 text-fe-teal" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-fe-dark font-heading">No agents found</h3>
                <p className="text-xs text-fe-gray font-sans">
                  {searchTerm ? `No agents matched "${searchTerm}"` : 'There are currently no delivery agents registered in the system.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block bg-white border border-fe-muted/20 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-fe-bg/40 border-b border-fe-muted/20 text-fe-gray font-semibold uppercase tracking-wider">
                        <th className="py-4.5 px-6 font-bold">Agent Name</th>
                        <th className="py-4.5 px-4 font-bold text-center">Delivered</th>
                        <th className="py-4.5 px-4 font-bold text-center">Not Delivered</th>
                        <th className="py-4.5 px-4 font-bold text-right">Earned Today</th>
                        <th className="py-4.5 px-4 font-bold text-right">To Be Paid</th>
                        <th className="py-4.5 px-4 font-bold text-right">Pending Previous</th>
                        <th className="py-4.5 px-6 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fe-muted/10 text-fe-dark">
                      {filteredAgents.map((agent) => (
                        <tr 
                          key={agent.uid}
                          className="hover:bg-fe-bg/10 transition-colors group cursor-pointer"
                          onClick={() => setSelectedAgent(agent)}
                          data-agent-row={agent.uid}
                        >
                          <td className="py-4 px-6 font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-fe-teal/5 border border-fe-teal/10 flex items-center justify-center text-fe-teal font-heading font-semibold text-xs shrink-0">
                                {agent.name ? agent.name.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <p className="font-bold text-fe-dark group-hover:text-fe-teal transition-colors font-sans">{agent.name || 'Agent'}</p>
                                <p className="text-[10px] text-fe-gray">{agent.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200/40 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              <CheckCircle className="h-3 w-3" /> {agent.deliveredCount}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/40 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              <Clock className="h-3 w-3" /> {agent.notDeliveredCount}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-fe-dark">
                            ₹{agent.earnedToday}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="font-bold text-fe-teal">₹{agent.toBePaidToday}</span>
                              {(agent.toBePaidToday > 0 || agent.pendingPrevious > 0) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPayModal(agent);
                                  }}
                                  className="px-3.5 py-1.5 bg-fe-teal text-white text-xs font-bold rounded-lg hover:bg-fe-teal/90 transition-colors shadow-sm animate-fade-in"
                                  data-pay-btn={agent.uid}
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-violet-600">
                            ₹{agent.pendingPrevious}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAgent(agent);
                              }}
                              className="p-1.5 hover:bg-fe-teal/10 rounded-lg text-fe-gray hover:text-fe-teal transition-all inline-flex items-center justify-center border border-transparent hover:border-fe-teal/20"
                              title="View Dashboard"
                              data-drill-in-btn={agent.uid}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Grid View */}
              <div className="block sm:hidden space-y-4">
                {filteredAgents.map((agent) => (
                  <div 
                    key={agent.uid}
                    className="bg-white border border-fe-muted/20 rounded-2xl p-5 space-y-4 shadow-sm hover:border-fe-teal/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgent(agent)}
                    data-agent-row={agent.uid}
                  >
                    {/* Top: Profile Info & Drilldown */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-fe-teal/5 border border-fe-teal/10 flex items-center justify-center text-fe-teal font-heading font-semibold text-sm shrink-0">
                          {agent.name ? agent.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-fe-dark text-sm font-sans">{agent.name || 'Agent'}</p>
                          <p className="text-[10px] text-fe-gray">{agent.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(agent);
                        }}
                        className="p-1.5 hover:bg-fe-teal/10 border border-fe-muted/10 rounded-lg text-fe-gray hover:text-fe-teal transition-all"
                        data-drill-in-btn={agent.uid}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Middle: Performance summary */}
                    <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-fe-muted/10 text-center">
                      <div className="bg-green-50 border border-green-200/30 rounded-xl p-2.5">
                        <span className="text-xs font-bold text-green-700 font-sans block">{agent.deliveredCount}</span>
                        <span className="text-[8px] text-fe-gray uppercase font-semibold block mt-0.5">Delivered</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200/30 rounded-xl p-2.5">
                        <span className="text-xs font-bold text-amber-700 font-sans block">{agent.notDeliveredCount}</span>
                        <span className="text-[8px] text-fe-gray uppercase font-semibold block mt-0.5">Pending</span>
                      </div>
                      <div className="bg-fe-bg/40 border border-fe-muted/20 rounded-xl p-2.5">
                        <span className="text-xs font-bold text-fe-dark font-sans block">₹{agent.earnedToday}</span>
                        <span className="text-[8px] text-fe-gray uppercase font-semibold block mt-0.5">Earned</span>
                      </div>
                    </div>

                    {/* Bottom: Payments and Pay Action */}
                    <div className="flex justify-between items-center pt-3 border-t border-fe-muted/10">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-[9px] text-fe-gray uppercase block">To Be Paid</span>
                          <span className="text-xs font-bold text-fe-teal font-sans block">₹{agent.toBePaidToday}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-fe-gray uppercase block">Prev Pending</span>
                          <span className="text-xs font-bold text-violet-600 font-sans block">₹{agent.pendingPrevious}</span>
                        </div>
                      </div>

                      {(agent.toBePaidToday > 0 || agent.pendingPrevious > 0) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPayModal(agent);
                          }}
                          className="px-4 py-2 bg-fe-teal text-white text-xs font-bold rounded-lg hover:bg-fe-teal/90 transition-colors shadow-sm animate-fade-in"
                          data-pay-btn={agent.uid}
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Popup modal remains rendered at parent level for absolute DOM presence in both views */}
      <AddTransactionModal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setPayTarget(null);
        }}
        onSave={handleSavePayment}
        date={new Date().toISOString().slice(0, 10)}
        loading={savingPayment}
        initialAmount={payTarget ? (payTarget.toBePaidToday + payTarget.pendingPrevious) : 0}
        initialParticulars={payTarget ? `Delivery payment - ${payTarget.name} - ${new Date().toISOString().slice(0, 10)}` : ''}
        initialCategory="Staff & Wages"
        agentUid={payTarget?.uid}
        isDeliveryPayment={true}
      />
    </div>
  );
}
