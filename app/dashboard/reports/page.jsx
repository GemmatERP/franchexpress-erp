'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { useConsignments } from '../../../hooks/useConsignments';
import { useToast } from '../../../hooks/useToast';
import { ReportsSummary } from '../../../components/reports/ReportsSummary';
import { ReportsTable } from '../../../components/reports/ReportsTable';
import { ExportButtons } from '../../../components/reports/ExportButtons';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { formatDateForInput } from '../../../lib/utils';

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { fetchConsignments, deleteConsignment, loading } = useConsignments();

  // Set default filter values: from date (30 days ago), to date (today)
  const defaultFromDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  };

  const [filters, setFilters] = useState({
    fromDate: defaultFromDate(),
    toDate: formatDateForInput(new Date()),
    courierPartner: 'All',
    deliveryStatus: 'All',
    paymentMode: 'All',
  });

  const [consignments, setConsignments] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = useCallback(async () => {
    try {
      const data = await fetchConsignments(filters);
      setConsignments(data);
      setHasSearched(true);
    } catch (err) {
      toast('Failed to load reports: ' + err.message, 'error');
    }
  }, [fetchConsignments, filters, toast]);

  // Initial load
  useEffect(() => {
    handleSearch();
  }, []);

  const handleReset = () => {
    setFilters({
      fromDate: defaultFromDate(),
      toDate: formatDateForInput(new Date()),
      courierPartner: 'All',
      deliveryStatus: 'All',
      paymentMode: 'All',
    });
    // Trigger search with defaults
    setTimeout(() => {
      handleSearch();
    }, 50);
  };

  const handleEdit = (item) => {
    router.push(`/dashboard/consignments/new?edit=${item.id}`);
  };

  const handleDelete = async (id, sno) => {
    if (window.confirm(`Are you sure you want to delete consignment ${sno}? This action is permanent.`)) {
      try {
        await deleteConsignment(id);
        toast(`Consignment ${sno} deleted successfully`, 'success');
        // Refresh dataset
        handleSearch();
      } catch (err) {
        toast('Failed to delete consignment: ' + err.message, 'error');
      }
    }
  };

  const courierOptions = ['All', 'SmartR', 'Blue Dart', 'DTDC', 'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery'];
  const statusOptions = ['All', 'Transit', 'Reached Destination', 'Out of Delivery', 'Returned', 'Holding at HUB', 'Delivered'];
  const paymentModeOptions = ['All', 'CASH', 'UPI', 'CREDIT', 'To Pay', 'Debit'];

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
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <Input
            label="From Date"
            name="fromDate"
            type="date"
            value={filters.fromDate}
            onChange={handleFilterChange}
          />

          <Input
            label="To Date"
            name="toDate"
            type="date"
            value={filters.toDate}
            onChange={handleFilterChange}
          />

          <Select
            label="Courier Partner"
            name="courierPartner"
            value={filters.courierPartner}
            onChange={handleFilterChange}
            options={courierOptions}
          />

          <Select
            label="Status"
            name="deliveryStatus"
            value={filters.deliveryStatus}
            onChange={handleFilterChange}
            options={statusOptions}
          />

          <Select
            label="Payment Mode"
            name="paymentMode"
            value={filters.paymentMode}
            onChange={handleFilterChange}
            options={paymentModeOptions}
          />

          <div className="lg:col-span-5 flex justify-end gap-2.5 pt-2 border-t border-fe-muted/10">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-fe-gray hover:text-fe-dark"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex items-center gap-1.5"
            >
              <Search className="h-4 w-4" />
              Filter Records
            </Button>
          </div>
        </form>
      </div>

      {/* Export & Summary Bar (Visible only when search yielded results) */}
      {hasSearched && (
        <>
          <ReportsSummary consignments={consignments} />

          <div className="mt-8 flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-sm font-bold text-fe-dark font-heading">
              Search Results ({consignments.length})
            </h3>
            <ExportButtons consignments={consignments} filename="FE-Report" />
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white border border-fe-muted/30 rounded-xl mt-4">
              <Spinner size="md" />
            </div>
          ) : (
            <ReportsTable
              consignments={consignments}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </div>
  );
}
