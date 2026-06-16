'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Clock, 
  Truck, 
  CornerUpLeft, 
  CheckCircle, 
  Calendar,
  MapPin,
  ChevronRight,
  Filter,
  RefreshCw,
  Search
} from 'lucide-react';
import { useConsignments } from '../../../hooks/useConsignments';
import { useToast } from '../../../hooks/useToast';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { formatDate, formatDateForInput } from '../../../lib/utils';

export default function ConsignmentsDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchConsignments, loading } = useConsignments();

  // Date range filters (default: last 30 days)
  const defaultFromDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  };

  const [filters, setFilters] = useState({
    fromDate: defaultFromDate(),
    toDate: formatDateForInput(new Date()),
  });

  const [allItems, setAllItems] = useState([]);
  const [activeTab, setActiveTab] = useState('transit'); // transit, out, holding, delivered, returned
  const [searchQuery, setSearchQuery] = useState('');

  const loadConsignments = useCallback(async () => {
    try {
      const data = await fetchConsignments({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        courierPartner: 'All',
        deliveryStatus: 'All',
        paymentMode: 'All',
      });
      setAllItems(data || []);
    } catch (err) {
      toast('Failed to load consignments: ' + err.message, 'error');
    }
  }, [fetchConsignments, filters, toast]);

  useEffect(() => {
    loadConsignments();
  }, [loadConsignments]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    loadConsignments();
  };

  // Group items by status
  const groups = {
    transit: allItems.filter(item => ['Transit', 'Reached Destination'].includes(item.deliveryStatus)),
    out: allItems.filter(item => item.deliveryStatus === 'Out of Delivery'),
    holding: allItems.filter(item => item.deliveryStatus === 'Holding at HUB'),
    delivered: allItems.filter(item => item.deliveryStatus === 'Delivered'),
    returned: allItems.filter(item => ['Returned', 'Cancelled'].includes(item.deliveryStatus)),
  };

  // Filter items in active tab by search query
  const filteredList = (groups[activeTab] || []).filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.awbNumber?.toLowerCase().includes(query) ||
      item.sno?.toLowerCase().includes(query) ||
      item.consigneeName?.toLowerCase().includes(query) ||
      item.consignorName?.toLowerCase().includes(query) ||
      item.consigneeCity?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Date Filters Header Card */}
      <Card className="p-5 border border-fe-muted/15 shadow-sm">
        <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="w-48">
              <Input
                label="From Date"
                name="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={handleFilterChange}
                className="py-1.5 text-xs"
              />
            </div>
            <div className="w-48">
              <Input
                label="To Date"
                name="toDate"
                type="date"
                value={filters.toDate}
                onChange={handleFilterChange}
                className="py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={loadConsignments}
              disabled={loading}
              className="flex items-center gap-1.5 py-2 px-4 text-xs font-semibold"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex items-center gap-1.5 py-2 px-5 text-xs font-semibold"
            >
              <Filter className="h-4 w-4" />
              Apply Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* High-Level Stats & Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Transit & Pending */}
        <button
          onClick={() => setActiveTab('transit')}
          className={`text-left p-4 rounded-xl border transition-all ${
            activeTab === 'transit'
              ? 'bg-white border-amber-400 ring-1 ring-amber-400 shadow-md scale-[1.02]'
              : 'bg-white border-fe-muted/30 hover:border-amber-300 hover:shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-fe-gray font-mono uppercase tracking-wider">Transit</span>
          </div>
          <p className="text-2xl font-bold text-fe-dark mt-4 font-heading">{groups.transit.length}</p>
          <p className="text-[10px] text-fe-gray font-sans mt-0.5">In Network Transit</p>
        </button>

        {/* Out for Delivery */}
        <button
          onClick={() => setActiveTab('out')}
          className={`text-left p-4 rounded-xl border transition-all ${
            activeTab === 'out'
              ? 'bg-white border-fe-teal ring-1 ring-fe-teal shadow-md scale-[1.02]'
              : 'bg-white border-fe-muted/30 hover:border-fe-teal/40 hover:shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-teal-50 text-fe-teal">
              <Truck className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-fe-gray font-mono uppercase tracking-wider">Out for Del.</span>
          </div>
          <p className="text-2xl font-bold text-fe-dark mt-4 font-heading">{groups.out.length}</p>
          <p className="text-[10px] text-fe-gray font-sans mt-0.5">With Delivery Agent</p>
        </button>

        {/* Holding at HUB */}
        <button
          onClick={() => setActiveTab('holding')}
          className={`text-left p-4 rounded-xl border transition-all ${
            activeTab === 'holding'
              ? 'bg-white border-purple-500 ring-1 ring-purple-500 shadow-md scale-[1.02]'
              : 'bg-white border-fe-muted/30 hover:border-purple-300 hover:shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-500">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-fe-gray font-mono uppercase tracking-wider">At Hub</span>
          </div>
          <p className="text-2xl font-bold text-fe-dark mt-4 font-heading">{groups.holding.length}</p>
          <p className="text-[10px] text-fe-gray font-sans mt-0.5">Held at Local Hub</p>
        </button>

        {/* Delivered */}
        <button
          onClick={() => setActiveTab('delivered')}
          className={`text-left p-4 rounded-xl border transition-all ${
            activeTab === 'delivered'
              ? 'bg-white border-fe-green ring-1 ring-fe-green shadow-md scale-[1.02]'
              : 'bg-white border-fe-muted/30 hover:border-fe-green/40 hover:shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-green-50 text-fe-green">
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-fe-gray font-mono uppercase tracking-wider">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-fe-dark mt-4 font-heading">{groups.delivered.length}</p>
          <p className="text-[10px] text-fe-gray font-sans mt-0.5">Successful Handover</p>
        </button>

        {/* Returned & Cancelled */}
        <button
          onClick={() => setActiveTab('returned')}
          className={`text-left p-4 rounded-xl border transition-all ${
            activeTab === 'returned'
              ? 'bg-white border-red-500 ring-1 ring-red-500 shadow-md scale-[1.02]'
              : 'bg-white border-fe-muted/30 hover:border-red-300 hover:shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-red-50 text-red-500">
              <CornerUpLeft className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-fe-gray font-mono uppercase tracking-wider">Returned</span>
          </div>
          <p className="text-2xl font-bold text-fe-dark mt-4 font-heading">{groups.returned.length}</p>
          <p className="text-[10px] text-fe-gray font-sans mt-0.5">RTO & Cancellations</p>
        </button>
      </div>

      {/* Main List Table Area */}
      <Card className="overflow-hidden">
        {/* Table Search & Title Header */}
        <div className="px-6 py-4 border-b border-fe-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
          <h3 className="text-sm font-bold text-fe-dark font-heading capitalize">
            {activeTab === 'transit' && 'Transit & Pending'}
            {activeTab === 'out' && 'Out for Delivery'}
            {activeTab === 'holding' && 'Holding at HUB'}
            {activeTab === 'delivered' && 'Delivered'}
            {activeTab === 'returned' && 'Returned & Cancelled'}{' '}
            consignments ({filteredList.length})
          </h3>
          
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fe-gray">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search current list..."
              className="block w-full pl-9 pr-4 py-1.5 bg-fe-bg border border-fe-muted focus:border-fe-teal focus:ring-1 focus:ring-fe-teal rounded-lg text-xs font-sans text-fe-dark placeholder-fe-gray focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="text-xs text-fe-gray font-sans mt-3">Loading consignments list...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-fe-gray text-xs font-sans">
            No consignments found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-fe-bg text-fe-gray font-semibold border-b border-fe-muted/20">
                  <th className="px-6 py-3.5">SNO</th>
                  <th className="px-6 py-3.5">AWB Number</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Consignor</th>
                  <th className="px-6 py-3.5">Consignee</th>
                  <th className="px-6 py-3.5">Partner / Mode</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fe-muted/10">
                {filteredList.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => router.push(`/dashboard/consignments/${item.id}`)}
                    className="hover:bg-fe-bg/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-fe-teal font-mono">
                      {item.sno}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-fe-dark">
                      {item.awbNumber}
                    </td>
                    <td className="px-6 py-4 text-fe-dark">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-fe-gray shrink-0" />
                        {formatDate(item.date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-fe-dark">
                      <div className="font-semibold">{item.consignorName}</div>
                      <div className="text-[10px] text-fe-gray mt-0.5">{item.consignorCity}</div>
                    </td>
                    <td className="px-6 py-4 text-fe-dark">
                      <div className="font-semibold">{item.consigneeName}</div>
                      <div className="text-[10px] text-fe-gray mt-0.5">{item.consigneeCity}, {item.consigneeState}</div>
                    </td>
                    <td className="px-6 py-4 text-fe-gray">
                      <div className="text-fe-dark font-medium">{item.courierPartner}</div>
                      <div className="text-[10px] mt-0.5">{item.mode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge value={item.deliveryStatus} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/consignments/${item.id}`);
                        }}
                        className="p-1 rounded-full hover:bg-fe-bg text-fe-gray hover:text-fe-teal transition-colors focus:outline-none"
                        title="View Full Details"
                        aria-label={`View consignment ${item.sno} details`}
                      >
                        <ChevronRight className="h-5 w-5 transform group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
