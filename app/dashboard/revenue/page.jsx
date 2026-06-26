'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IndianRupee, 
  TrendingUp, 
  CreditCard, 
  Coins, 
  Calendar,
  Filter,
  RefreshCw,
  Package,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  BarChart, 
  Bar,
  Label
} from 'recharts';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Input } from '../../../components/ui/Input';
import { formatCurrency, formatDateForInput } from '../../../lib/utils';

export default function RevenueDashboard() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect non-admins (super_admin has same access as admin)
  useEffect(() => {
    if (!authLoading && role && role !== 'admin' && role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  // Date filters
  const [filterType, setFilterType] = useState('7'); // 7, 30, 60, custom
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState(null);

  // Set default custom dates
  useEffect(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 6);
    setFromDate(formatDateForInput(start));
    setToDate(formatDateForInput(today));
  }, []);

  const fetchRevenueStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let startStr = '';
    let endStr = '';

    if (filterType === 'custom') {
      startStr = fromDate;
      endStr = toDate;
    } else {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - (parseInt(filterType, 10) - 1));
      startStr = formatDateForInput(start);
      endStr = formatDateForInput(today);
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/consignments/revenue-stats?fromDate=${startStr}&toDate=${endStr}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch revenue stats');
      }

      const data = await res.json();
      setRevenueData(data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, filterType, fromDate, toDate, toast]);

  useEffect(() => {
    if (!authLoading && (role === 'admin' || role === 'super_admin')) {
      fetchRevenueStats();
    }
  }, [authLoading, role, filterType, fetchRevenueStats]);

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    fetchRevenueStats();
  };

  if (authLoading || (role && role !== 'admin' && role !== 'super_admin')) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3">Verifying admin credentials...</p>
      </div>
    );
  }

  // Predefined chart color palettes
  const PIE_COLORS = ['#60CAAD', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#A7C7AF'];

  const metrics = revenueData?.metrics || {
    totalRevenue: 0,
    totalConsignments: 0,
    avgRevenue: 0,
    cashRevenue: 0,
    creditRevenue: 0,
    upiRevenue: 0,
    otherRevenue: 0
  };

  const charts = revenueData?.charts || {
    dailyTrend: [],
    paymentMode: [],
    partner: []
  };


  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      
      {/* Filters Bar */}
      <Card className="p-5 border border-fe-muted/15 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-fe-dark uppercase tracking-wider mr-2 flex items-center gap-1">
              <Calendar className="h-4 w-4 text-fe-teal" />
              Interval:
            </span>
            <button
              onClick={() => setFilterType('7')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterType === '7'
                  ? 'bg-fe-teal/10 text-fe-teal border-fe-teal/20'
                  : 'bg-white text-fe-gray border-fe-muted/30 hover:border-fe-teal/30 hover:text-fe-dark'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setFilterType('30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterType === '30'
                  ? 'bg-fe-teal/10 text-fe-teal border-fe-teal/20'
                  : 'bg-white text-fe-gray border-fe-muted/30 hover:border-fe-teal/30 hover:text-fe-dark'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setFilterType('60')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterType === '60'
                  ? 'bg-fe-teal/10 text-fe-teal border-fe-teal/20'
                  : 'bg-white text-fe-gray border-fe-muted/30 hover:border-fe-teal/30 hover:text-fe-dark'
              }`}
            >
              Last 60 Days
            </button>
            <button
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterType === 'custom'
                  ? 'bg-fe-teal/10 text-fe-teal border-fe-teal/20'
                  : 'bg-white text-fe-gray border-fe-muted/30 hover:border-fe-teal/30 hover:text-fe-dark'
              }`}
            >
              Custom Range
            </button>
          </div>

          {filterType === 'custom' && (
            <form onSubmit={handleCustomFilterSubmit} className="flex flex-wrap items-end gap-3 border-t md:border-t-0 pt-3 md:pt-0">
              <div className="w-36">
                <Input
                  label="From Date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="py-1 text-xs"
                />
              </div>
              <div className="w-36">
                <Input
                  label="To Date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="py-1 text-xs"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="py-2 px-4 text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Filter className="h-3.5 w-3.5" />
                Go
              </Button>
            </form>
          )}

          {filterType !== 'custom' && (
            <Button
              variant="outline"
              onClick={fetchRevenueStats}
              disabled={loading}
              className="py-2 px-4 text-xs font-semibold flex items-center gap-1.5 self-end md:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Total Revenue */}
        <Card className="p-5 border border-fe-muted/20 shadow-sm relative overflow-hidden bg-gradient-to-tr from-teal-500/5 to-transparent">
          <div className="absolute right-3 top-3 p-2 rounded-lg bg-fe-teal/10 text-fe-teal">
            <IndianRupee className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-mono">Total Income</span>
          <h3 className="text-xl font-bold text-fe-dark mt-4 font-heading">
            {loading ? <div className="h-6 w-24 bg-fe-bg animate-pulse rounded" /> : formatCurrency(metrics.totalRevenue)}
          </h3>
          <p className="text-[10px] text-fe-gray mt-1 leading-none">Net booking revenue in range</p>
        </Card>

        {/* Avg Revenue */}
        <Card className="p-5 border border-fe-muted/20 shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 p-2 rounded-lg bg-blue-50 text-blue-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-mono">Avg Booking Value</span>
          <h3 className="text-xl font-bold text-fe-dark mt-4 font-heading">
            {loading ? <div className="h-6 w-20 bg-fe-bg animate-pulse rounded" /> : formatCurrency(metrics.avgRevenue)}
          </h3>
          <p className="text-[10px] text-fe-gray mt-1 leading-none">Average per consignment</p>
        </Card>

        {/* Cash Revenue */}
        <Card className="p-5 border border-fe-muted/20 shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 p-2 rounded-lg bg-green-50 text-green-500">
            <Coins className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-mono">Cash Income</span>
          <h3 className="text-xl font-bold text-fe-dark mt-4 font-heading">
            {loading ? <div className="h-6 w-20 bg-fe-bg animate-pulse rounded" /> : formatCurrency(metrics.cashRevenue)}
          </h3>
          <p className="text-[10px] text-fe-gray mt-1 leading-none">Bookings paid by cash/counter</p>
        </Card>

        {/* UPI Revenue */}
        <Card className="p-5 border border-fe-muted/20 shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 p-2 rounded-lg bg-violet-50 text-violet-500">
            <Smartphone className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-mono">UPI Income</span>
          <h3 className="text-xl font-bold text-fe-dark mt-4 font-heading">
            {loading ? <div className="h-6 w-20 bg-fe-bg animate-pulse rounded" /> : formatCurrency(metrics.upiRevenue)}
          </h3>
          <p className="text-[10px] text-fe-gray mt-1 leading-none">GPay / Paytm / UPI payments</p>
        </Card>

        {/* Credit Revenue */}
        <Card className="p-5 border border-fe-muted/20 shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 p-2 rounded-lg bg-purple-50 text-purple-500">
            <CreditCard className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-mono">Credit Sales</span>
          <h3 className="text-xl font-bold text-fe-dark mt-4 font-heading">
            {loading ? <div className="h-6 w-20 bg-fe-bg animate-pulse rounded" /> : formatCurrency(metrics.creditRevenue)}
          </h3>
          <p className="text-[10px] text-fe-gray mt-1 leading-none">Invoiced corporate client bills</p>
        </Card>

        {/* Consignment Count */}
        <Card className="p-5 border border-fe-muted/20 shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 p-2 rounded-lg bg-amber-50 text-amber-500">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-mono">Bookings Count</span>
          <h3 className="text-xl font-bold text-fe-dark mt-4 font-heading">
            {loading ? <div className="h-6 w-12 bg-fe-bg animate-pulse rounded" /> : metrics.totalConsignments}
          </h3>
          <p className="text-[10px] text-fe-gray mt-1 leading-none">Total bookings registered</p>
        </Card>
      </div>

      {loading && !revenueData ? (
        <Card className="h-96 flex items-center justify-center border border-fe-muted/30">
          <Spinner size="md" />
        </Card>
      ) : (
        <>
          {/* Daily Revenue Trend Chart */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">
              Daily Revenue Trend
            </h3>
            <div className="h-72">
              {charts.dailyTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-fe-gray italic">
                  No billing data recorded for the selected range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.dailyTrend} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f2ee" />
                    <XAxis dataKey="date" tick={{ fill: '#9DA5A2', fontSize: 10 }} axisLine={false} tickLine={false} height={40}>
                      <Label value="Date" position="insideBottom" offset={0} fill="#9DA5A2" fontSize={11} fontWeight={500} />
                    </XAxis>
                    <YAxis tick={{ fill: '#9DA5A2', fontSize: 10 }} axisLine={false} tickLine={false} width={50}>
                      <Label value="Revenue (₹)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#9DA5A2', fontSize: 11, fontWeight: 500 }} />
                    </YAxis>
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E0E4D6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#60CAAD"
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }}
                      dot={{ r: 3, fill: '#60CAAD', strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Pie and Bar Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pie Chart: Payment Mode Distribution */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">
                Revenue Share by Payment Mode
              </h3>
              <div className="h-64 flex flex-col justify-center">
                {charts.paymentMode.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-fe-gray italic">
                    No payment mode records.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.paymentMode}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {charts.paymentMode.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', marginTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Bar Chart: Courier Partner Revenue */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-fe-dark font-heading mb-4">
                Revenue Share by Courier Partner
              </h3>
              <div className="h-64">
                {charts.partner.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-fe-gray italic">
                    No partner records.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.partner} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fill: '#9DA5A2', fontSize: 10 }} axisLine={false} tickLine={false} height={40}>
                        <Label value="Courier Partner" position="insideBottom" offset={0} fill="#9DA5A2" fontSize={11} fontWeight={500} />
                      </XAxis>
                      <YAxis tick={{ fill: '#9DA5A2', fontSize: 10 }} axisLine={false} tickLine={false} width={50}>
                        <Label value="Revenue (₹)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#9DA5A2', fontSize: 11, fontWeight: 500 }} />
                      </YAxis>
                      <Tooltip
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E0E4D6' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
