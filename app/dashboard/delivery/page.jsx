'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConsignments } from '../../../hooks/useConsignments';
import { useToast } from '../../../hooks/useToast';
import { DeliveryCard } from '../../../components/delivery/DeliveryCard';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { useAuth } from '../../../hooks/useAuth';
import { Clock, Truck, CheckCircle } from 'lucide-react';

export default function DeliveryViewPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { fetchConsignments, updateConsignment, loading: updateLoading } = useConsignments();
  const { toast } = useToast();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('Out of Delivery'); // 'Out of Delivery' | 'All Today'

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Pass today's date filter: only reads ~70 docs instead of the entire collection
      const todayStr = new Date().toISOString().split('T')[0];
      const data = await fetchConsignments({ fromDate: todayStr, toDate: todayStr });
      setDeliveries(data);
    } catch (err) {
      toast('Failed to load today deliveries: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchConsignments, toast]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      // Create update payload
      const payload = {
        deliveryStatus: newStatus,
      };
      
      // If setting to Delivered, stamp deliveredDate as today
      if (newStatus === 'Delivered') {
        payload.deliveredDate = new Date().toISOString().split('T')[0];
      }

      await updateConsignment(id, payload);
      toast(`Shipment status updated to ${newStatus}`, 'success');
      
      // Refresh the list
      loadDeliveries();
    } catch (err) {
      toast('Failed to update status: ' + err.message, 'error');
    }
  };

  // Filter based on delivery Status
  const displayedDeliveries = deliveries.filter((item) => {
    if (filterMode === 'Out of Delivery') {
      return item.deliveryStatus === 'Out of Delivery';
    }
    return true; // 'All Today'
  });

  const outOfDeliveryCount = deliveries.filter(
    (item) => item.deliveryStatus === 'Out of Delivery'
  ).length;

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Top Banner Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-fe-muted/20 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-fe-gray font-sans">
            Manage your daily handovers
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-bold text-fe-dark font-heading">
              Deliveries Scheduled:
            </span>
            <Badge value="Out of Delivery" className="text-[10px]">
              {outOfDeliveryCount} Pending Route
            </Badge>
            <Badge value="Delivered" className="text-[10px] bg-fe-green/20 text-green-700">
              {deliveries.filter(item => item.deliveryStatus === 'Delivered').length} Completed
            </Badge>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-fe-bg p-1 rounded-lg border border-fe-muted/30 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setFilterMode('Out of Delivery')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold font-sans rounded-md transition-all ${
              filterMode === 'Out of Delivery'
                ? 'bg-fe-teal text-white shadow-sm'
                : 'text-fe-gray hover:text-fe-dark'
            }`}
          >
            Pending Route
          </button>
          <button
            onClick={() => setFilterMode('All Today')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold font-sans rounded-md transition-all ${
              filterMode === 'All Today'
                ? 'bg-fe-teal text-white shadow-sm'
                : 'text-fe-gray hover:text-fe-dark'
            }`}
          >
            All Today
          </button>
        </div>
      </div>

      {/* List Body */}
      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white border border-fe-muted/30 rounded-xl">
          <Spinner size="md" />
        </div>
      ) : displayedDeliveries.length === 0 ? (
        <div className="bg-white border border-fe-muted/30 rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="p-3 bg-fe-bg text-fe-gray rounded-full mb-3">
            <Truck className="h-7 w-7 stroke-[1.5]" />
          </div>
          <p className="text-sm font-bold text-fe-dark font-heading">
            No shipments found
          </p>
          <p className="text-xs text-fe-gray mt-1 max-w-sm">
            {filterMode === 'Out of Delivery'
              ? 'You have cleared your queue. All assigned shipments have been processed.'
              : 'No packages registered in the system for booking date today.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedDeliveries.map((item, index) => (
            <div key={item.id} className="transition-all duration-300">
              <DeliveryCard
                consignment={item}
                onStatusUpdate={handleStatusUpdate}
                loading={updateLoading}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
