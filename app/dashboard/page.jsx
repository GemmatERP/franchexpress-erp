'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Clock, 
  CheckSquare, 
  IndianRupee, 
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { useConsignments } from '../../hooks/useConsignments';
import { useToast } from '../../hooks/useToast';
import { KPICard } from '../../components/dashboard/KPICard';
import { DashboardCharts } from '../../components/dashboard/DashboardCharts';
import { TodayTable } from '../../components/dashboard/TodayTable';
import { PendingTable } from '../../components/dashboard/PendingTable';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function DashboardHome() {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchDashboardStats, loading } = useConsignments();
  
  const [consignments, setConsignments] = useState([]);
  const [kpis, setKpis] = useState({
    todayBookings: 0,
    pendingShipments: 0,
    deliveredToday: 0,
    todayRevenue: 0,
  });

  const [volumeChart, setVolumeChart] = useState([]);
  const [statusChart, setStatusChart] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  
  const [selectedConsignment, setSelectedConsignment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // ✅ Uses /api/consignments/stats:
      //    • count() for KPIs  = 2 reads total
      //    • today docs only   = ~70 reads
      //    • last-14-days only = ~1000 reads max
      // vs old approach that scanned the ENTIRE collection.
      const stats = await fetchDashboardStats();
      if (!stats) return;

      setConsignments(stats.todayItems || []);
      setKpis(stats.kpis);
      setVolumeChart(stats.volumeChart || []);
      setStatusChart(stats.statusChart || []);
      setRevenueChart(stats.revenueChart || []);
    } catch (err) {
      toast('Failed to load dashboard metrics: ' + err.message, 'error');
    }
  }, [fetchDashboardStats, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper: check if a date is today
  const isToday = (dateValue) => {
    if (!dateValue) return false;
    let d = dateValue;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      d = dateValue.toDate();
    } else {
      d = new Date(dateValue);
    }
    if (isNaN(d.getTime())) return false;
    
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const calculateMetrics = (items) => {
    const today = new Date();
    
    let todayBookings = 0;
    let pendingShipments = 0;
    let deliveredToday = 0;
    let todayRevenue = 0;

    // Daily volume map for last 7 days
    const last7DaysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      last7DaysMap[d.toDateString()] = { name: label, dateStr: d.toDateString(), consignments: 0 };
    }

    // Daily revenue map for last 14 days
    const last14DaysMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      last14DaysMap[d.toDateString()] = { date: label, dateStr: d.toDateString(), amount: 0 };
    }

    // Status map
    const statusCounts = {
      'Transit': 0,
      'Reached Destination': 0,
      'Out of Delivery': 0,
      'Returned': 0,
      'Holding at HUB': 0,
      'Delivered': 0,
    };

    items.forEach((item) => {
      // Parse item date
      let itemDate = null;
      if (item.date) {
        itemDate = item.date.toDate ? item.date.toDate() : new Date(item.date);
      }

      const itemDateStr = itemDate ? itemDate.toDateString() : '';

      // 1. KPIs
      if (isToday(item.date)) {
        todayBookings += 1;
        todayRevenue += Number(item.amount) || 0;
      }

      if (['Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB'].includes(item.deliveryStatus)) {
        pendingShipments += 1;
      }

      if (item.deliveryStatus === 'Delivered' && isToday(item.deliveredDate)) {
        deliveredToday += 1;
      }

      // 2. Charts - Volume (last 7 days)
      if (itemDateStr && last7DaysMap[itemDateStr]) {
        last7DaysMap[itemDateStr].consignments += 1;
      }

      // 3. Charts - Revenue (last 14 days)
      if (itemDateStr && last14DaysMap[itemDateStr]) {
        last14DaysMap[itemDateStr].amount += Number(item.amount) || 0;
      }

      // 4. Charts - Status Distribution
      if (item.deliveryStatus && statusCounts[item.deliveryStatus] !== undefined) {
        statusCounts[item.deliveryStatus] += 1;
      }
    });

    setKpis({
      todayBookings,
      pendingShipments,
      deliveredToday,
      todayRevenue,
    });

    // Format charts datasets
    setVolumeChart(Object.values(last7DaysMap));
    setRevenueChart(Object.values(last14DaysMap));
    setStatusChart(
      Object.keys(statusCounts)
        .map((key) => ({ name: key, value: statusCounts[key] }))
        .filter((entry) => entry.value > 0)
    );
  };

  const handleOpenDetailModal = (item) => {
    setSelectedConsignment(item);
    setIsDetailModalOpen(true);
  };

  // Today's items come pre-filtered from the stats API
  const todayItems   = consignments;
  // Pending items are shown via KPI count; table uses today's items filtered by status
  const pendingItems = consignments.filter((item) =>
    ['Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB'].includes(item.deliveryStatus)
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
          {/* KPI Card row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Today's Bookings"
              value={kpis.todayBookings}
              icon={Package}
              description="New shipments registered today"
              delay={0}
            />
            <KPICard
              title="Pending Shipments"
              value={kpis.pendingShipments}
              icon={Clock}
              description="Shipments currently in transit network"
              delay={0.1}
            />
            <KPICard
              title="Delivered Today"
              value={kpis.deliveredToday}
              icon={CheckSquare}
              description="Successful handovers today"
              delay={0.2}
            />
            <KPICard
              title="Today's Revenue"
              value={kpis.todayRevenue}
              isCurrency
              icon={IndianRupee}
              description="Voucher bookings income today"
              delay={0.3}
            />
          </div>

          {/* Charts Row */}
          <DashboardCharts
            volumeData={volumeChart}
            statusData={statusChart}
            revenueData={revenueChart}
          />

          {/* Table Sections */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <TodayTable consignments={todayItems} onView={handleOpenDetailModal} />
            <PendingTable consignments={pendingItems} onView={handleOpenDetailModal} />
          </div>
        </>
      )}

      {/* Details View Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Consignment ${selectedConsignment?.sno} Details`}
        size="lg"
      >
        {selectedConsignment && (
          <div className="space-y-6 text-sm">
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Box 1: Shipment Info */}
              <div className="bg-white border border-fe-muted/30 p-4 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold text-fe-gray uppercase tracking-wider">Shipment info</h4>
                <div>
                  <span className="text-fe-gray text-xs">AWB Number:</span>
                  <p className="font-mono font-medium text-fe-dark">{selectedConsignment.awbNumber}</p>
                </div>
                <div>
                  <span className="text-fe-gray text-xs">Courier & Mode:</span>
                  <p className="font-sans font-medium text-fe-dark">
                    {selectedConsignment.courierPartner} · {selectedConsignment.mode}
                  </p>
                </div>
                <div>
                  <span className="text-fe-gray text-xs">Voucher Type:</span>
                  <p className="font-sans font-medium text-fe-dark">{selectedConsignment.voucherType}</p>
                </div>
                <div>
                  <span className="text-fe-gray text-xs">Weight & Nature:</span>
                  <p className="font-sans font-medium text-fe-dark">
                    {selectedConsignment.weight} kg · {selectedConsignment.nature}
                  </p>
                </div>
              </div>

              {/* Box 2: Address Info */}
              <div className="bg-white border border-fe-muted/30 p-4 rounded-xl space-y-3 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-fe-gray uppercase tracking-wider mb-2">Sender (Consignor)</h4>
                  <p className="font-bold text-fe-dark text-xs">{selectedConsignment.consignorName}</p>
                  <p className="text-xs text-fe-dark mt-0.5 leading-relaxed">
                    {selectedConsignment.consignorAddress1}<br />
                    {selectedConsignment.consignorCity} - {selectedConsignment.consignorPincode}
                  </p>
                  <p className="text-xs text-fe-teal font-mono mt-1">📞 {selectedConsignment.consignorPhone}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-fe-gray uppercase tracking-wider mb-2">Recipient (Consignee)</h4>
                  <p className="font-bold text-fe-dark text-xs">{selectedConsignment.consigneeName}</p>
                  <p className="text-xs text-fe-dark mt-0.5 leading-relaxed">
                    {selectedConsignment.consigneeAddress1}<br />
                    {selectedConsignment.consigneeCity} - {selectedConsignment.consigneePincode}, {selectedConsignment.consigneeState}
                  </p>
                  <p className="text-xs text-fe-teal font-mono mt-1">📞 {selectedConsignment.consigneePhone}</p>
                </div>
              </div>

              {/* Box 3: Payment details */}
              <div className="bg-white border border-fe-muted/30 p-4 rounded-xl space-y-2.5 md:col-span-1">
                <h4 className="text-xs font-bold text-fe-gray uppercase tracking-wider">Payment details</h4>
                <div>
                  <span className="text-fe-gray text-xs">Voucher Amount:</span>
                  <p className="font-mono font-bold text-fe-dark">{formatCurrency(selectedConsignment.amount)}</p>
                </div>
                <div>
                  <span className="text-fe-gray text-xs">Cover / Chargeable:</span>
                  <p className="font-mono text-fe-dark">
                    {formatCurrency(selectedConsignment.coverCharges)} / {formatCurrency(selectedConsignment.chargeableAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-fe-gray text-xs">Payment Mode:</span>
                  <p className="font-sans font-medium text-fe-dark">{selectedConsignment.paymentMode} ({selectedConsignment.paidStatus})</p>
                </div>
              </div>

              {/* Box 4: Transit status */}
              <div className="bg-white border border-fe-muted/30 p-4 rounded-xl space-y-2.5 md:col-span-2">
                <h4 className="text-xs font-bold text-fe-gray uppercase tracking-wider">Transit status</h4>
                <div className="flex items-center gap-2">
                  <span className="text-fe-gray text-xs">Current Status:</span>
                  <Badge value={selectedConsignment.deliveryStatus} />
                </div>
                {selectedConsignment.deliveredDate && (
                  <div>
                    <span className="text-fe-gray text-xs">Delivered Date:</span>
                    <p className="font-sans font-medium text-fe-dark">
                      {formatDate(selectedConsignment.deliveredDate)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-fe-gray text-xs">Booked on:</span>
                  <p className="font-sans text-fe-dark">{formatDate(selectedConsignment.date)} by {selectedConsignment.createdByName || 'system'}</p>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-fe-muted/10">
              <Button
                variant="secondary"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  router.push(`/dashboard/consignments/new?edit=${selectedConsignment.id}`);
                }}
              >
                Edit Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
