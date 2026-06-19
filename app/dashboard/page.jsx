'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Clock, 
  CheckSquare, 
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { useConsignments } from '../../hooks/useConsignments';
import { useToast } from '../../hooks/useToast';
import { KPICard } from '../../components/dashboard/KPICard';
import { DashboardCharts } from '../../components/dashboard/DashboardCharts';
import { TodayTable } from '../../components/dashboard/TodayTable';
import { PendingTable } from '../../components/dashboard/PendingTable';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';

export default function DashboardHome() {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchDashboardStats, loading } = useConsignments();
  
  const [consignments, setConsignments] = useState([]);
  const [kpis, setKpis] = useState({
    todayBookings: 0,
    todayPending: 0,
    deliveredToday: 0,
    pendingShipments: 0,
    last7Delivered: 0,
    last7Pending: 0,
  });

  const [volumeChart, setVolumeChart] = useState([]);
  const [statusChart, setStatusChart] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const stats = await fetchDashboardStats();
      if (!stats) return;

      setConsignments(stats.todayItems || []);
      setKpis(stats.kpis);
      setVolumeChart(stats.volumeChart || []);
      setStatusChart(stats.statusChart || []);
    } catch (err) {
      toast('Failed to load dashboard metrics: ' + err.message, 'error');
    }
  }, [fetchDashboardStats, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDetail = (item) => {
    router.push(`/dashboard/consignments/${item.id}`);
  };

  // Today's items
  const todayItems   = consignments;
  // Pending items are shown via KPI count; table uses today's items filtered by status
  const pendingItems = consignments.filter((item) =>
    ['Booked', 'Processing', 'Processed', 'Pending', 'Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB'].includes(item.deliveryStatus)
  );

  return (
    <div>
      {/* Top Header Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-sm font-medium text-fe-gray font-sans">
            Welcome to your logistics workspace
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5"
            aria-label="Refresh dashboard metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard/consignments/new')}
            className="flex items-center gap-1.5"
            aria-label="Book new shipment"
          >
            <PlusCircle className="h-4 w-4" />
            Book Shipment
          </Button>
        </div>
      </div>

      {loading && consignments.length === 0 ? (
        <div className="h-96 flex items-center justify-center bg-white border border-fe-muted/30 rounded-xl">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* KPI Card grid (6 items in responsive layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <KPICard
              title="Today's Bookings"
              value={kpis.todayBookings}
              icon={Package}
              description="Bookings registered today"
              delay={0}
            />
            <KPICard
              title="Today's Pending"
              value={kpis.todayPending}
              icon={AlertTriangle}
              description="Today's bookings still in transit"
              delay={0.05}
            />
            <KPICard
              title="Delivered Today"
              value={kpis.deliveredToday}
              icon={CheckSquare}
              description="Delivered handovers today"
              delay={0.1}
            />
            <KPICard
              title="Pending Shipments"
              value={kpis.pendingShipments}
              icon={Clock}
              description="Total active network shipments"
              delay={0.15}
            />
            <KPICard
              title="7 Days Delivered"
              value={kpis.last7Delivered}
              icon={CheckCircle2}
              description="Handovers from last 7 days"
              delay={0.2}
            />
            <KPICard
              title="7 Days Pending"
              value={kpis.last7Pending}
              icon={TrendingUp}
              description="Active bookings from last 7 days"
              delay={0.25}
            />
          </div>

          {/* Charts Row */}
          <DashboardCharts
            volumeData={volumeChart}
            statusData={statusChart}
          />

          {/* Table Sections */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TodayTable consignments={todayItems} onView={handleOpenDetail} />
            <PendingTable consignments={pendingItems} onView={handleOpenDetail} />
          </div>
        </>
      )}
    </div>
  );
}
