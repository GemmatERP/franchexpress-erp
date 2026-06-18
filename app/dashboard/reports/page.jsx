'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RotateCcw, Filter, ChevronDown } from 'lucide-react';
import { useConsignments } from '../../../hooks/useConsignments';
import { useConsignmentEdit } from '../../../lib/ConsignmentEditContext';
import { useToast } from '../../../hooks/useToast';
import { ReportsSummary } from '../../../components/reports/ReportsSummary';
import { ReportsTable } from '../../../components/reports/ReportsTable';
import { ExportButtons } from '../../../components/reports/ExportButtons';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { formatDateForInput } from '../../../lib/utils';

const DEFAULT_FILTERS = () => ({
  fromDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  })(),
  toDate: formatDateForInput(new Date()),
  courierPartner: 'All',
  deliveryStatus: 'All',
  paymentMode: 'All',
});

const COURIER_OPTIONS  = ['All', 'Franch Express', 'ST Courier', 'SmartR', 'Blue Dart', 'DTDC', 'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery'];
const STATUS_OPTIONS   = ['All', 'Processing', 'Booked', 'Transit', 'Reached Destination', 'Out of Delivery', 'Returned', 'Holding at HUB', 'Delivered'];
const PAYMENT_OPTIONS  = ['All', 'CASH', 'UPI', 'CREDIT', 'To Pay', 'COD'];

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setEditConsignment } = useConsignmentEdit();
  const { fetchConsignments, loadMoreConsignments, deleteConsignment, loading, hasMore, getHasMore } = useConsignments();

  const [filters, setFilters] = useState(DEFAULT_FILTERS());
  const [consignments, setConsignments] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = useCallback(async (filtersOverride) => {
    const activeFilters = filtersOverride || filters;
    try {
      const data = await fetchConsignments(activeFilters);
      setConsignments(data);
      setHasSearched(true);
    } catch (err) {
      toast('Failed to load reports: ' + err.message, 'error');
    }
  }, [fetchConsignments, filters, toast]);

  const handleReset = () => {
    const defaults = DEFAULT_FILTERS();
    setFilters(defaults);
    handleSearch(defaults);
  };

  // ── Load next page (append) ──────────────────────────────────────────────
  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = await loadMoreConsignments(filters);
      setConsignments((prev) => [...prev, ...nextPage]);
    } catch (err) {
      toast('Failed to load more: ' + err.message, 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Load ALL pages (for export) ──────────────────────────────────────────
  // Iterates through all pages by cursor until hasMore is false.
  // Uses a fresh fetchConsignments with limit=200 to minimise round-trips.
  const handleLoadAll = async () => {
    setLoadingAll(true);
    toast('Fetching all records for export…', 'info');
    try {
      let allData = [...consignments];
      let keepFetching = getHasMore();
      while (keepFetching) {
        const nextPage = await loadMoreConsignments(filters);
        if (!nextPage || nextPage.length === 0) break;
        allData = [...allData, ...nextPage];
        keepFetching = getHasMore();
      }
      setConsignments(allData);
      toast(`Loaded all ${allData.length} records.`, 'success');
    } catch (err) {
      toast('Error fetching all records: ' + err.message, 'error');
    } finally {
      setLoadingAll(false);
    }
  };

  // ── Edit → context-based navigation ────────────────────────────────────
  const handleEdit = (item) => {
    setEditConsignment(item.id);
    router.push('/dashboard/consignments/edit');
  };

  const handleDelete = async (id, sno) => {
    if (window.confirm(`Are you sure you want to delete consignment ${sno}? This action is permanent.`)) {
      try {
        await deleteConsignment(id);
        toast(`Consignment ${sno} deleted successfully`, 'success');
        setConsignments((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        toast('Failed to delete consignment: ' + err.message, 'error');
      }
    }
  };

  return (
    <div className="pb-16">
      {/* Filters Form */}
      <div className="bg-white border border-fe-muted/30 p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 border-b border-fe-muted/15 pb-3 mb-4">
          <Filter className="h-4 w-4 text-fe-teal" />
          <h3 className="text-xs font-bold text-fe-dark uppercase tracking-wider font-sans">
            Search Parameters
          </h3>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <Input label="From Date" name="fromDate" type="date" value={filters.fromDate} onChange={handleFilterChange} />
          <Input label="To Date"   name="toDate"   type="date" value={filters.toDate}   onChange={handleFilterChange} />

          <Select label="Courier Partner" name="courierPartner" value={filters.courierPartner} onChange={handleFilterChange} options={COURIER_OPTIONS} />
          <Select label="Status"          name="deliveryStatus" value={filters.deliveryStatus} onChange={handleFilterChange} options={STATUS_OPTIONS} />
          <Select label="Payment Mode"    name="paymentMode"    value={filters.paymentMode}    onChange={handleFilterChange} options={PAYMENT_OPTIONS} />

          <div className="lg:col-span-5 flex justify-end gap-2.5 pt-2 border-t border-fe-muted/10">
            <Button variant="ghost" type="button" onClick={handleReset} className="flex items-center gap-1.5 text-fe-gray hover:text-fe-dark">
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
            <Button type="submit" loading={loading} className="flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              Filter Records
            </Button>
          </div>
        </form>
      </div>

      {/* Results Area */}
      {hasSearched && (
        <>
          <ReportsSummary consignments={consignments} />

          <div className="mt-8 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-fe-dark font-heading">
                Search Results ({consignments.length}{hasMore ? '+' : ''})
              </h3>
              {hasMore && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  More records available — use Load More or Load All
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Load All for Export */}
              {hasMore && (
                <Button
                  variant="outline"
                  onClick={handleLoadAll}
                  loading={loadingAll}
                  className="flex items-center gap-1.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load All for Export
                </Button>
              )}
              <ExportButtons consignments={consignments} filename="FE-Report" />
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white border border-fe-muted/30 rounded-xl mt-4">
              <Spinner size="md" />
            </div>
          ) : (
            <>
              <ReportsTable
                consignments={consignments}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              {/* Load More Pagination */}
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    loading={loadingMore}
                    className="flex items-center gap-2 px-8 text-xs font-semibold"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Load More ({consignments.length} loaded so far)
                  </Button>
                </div>
              )}

              {!hasMore && consignments.length > 0 && (
                <p className="mt-4 text-center text-[11px] text-fe-gray font-sans">
                  All {consignments.length} records loaded.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
