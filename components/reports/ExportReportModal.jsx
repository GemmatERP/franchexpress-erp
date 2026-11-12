'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Plus,
  ArrowLeft,
  Trash2,
  FileSpreadsheet,
  FileText,
  Check,
  Filter,
  Columns3,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useCourierPartners } from '../../hooks/useCourierPartners';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  EXPORT_COLUMNS,
  BUILT_IN_REPORTS,
  exportToCSV,
  exportToExcel,
} from '../../lib/export';

const COURIER_OPTIONS = [
  'All', 'Franch Express', 'India Post', 'ST Courier', 'SmartR',
  'Blue Dart', 'DTDC', 'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery',
];
const STATUS_OPTIONS = [
  'All', 'Processing', 'Booked', 'Transit', 'Reached Destination',
  'Out of Delivery', 'Returned', 'Holding at HUB', 'Delivered',
];
const PAYMENT_OPTIONS = ['All', 'CASH', 'UPI', 'CASH + UPI', 'CREDIT', 'To Pay', 'COD'];
const PAID_STATUS_OPTIONS = ['All', 'Paid', 'Not Paid', 'Pending'];

const COLUMN_GROUPS = ['Shipment', 'Consignor', 'Consignee', 'Payment & Billing', 'Delivery'];
const LOCAL_STORAGE_KEY = 'fe_custom_report_templates';

const DEFAULT_CREATE_FORM = {
  name: '',
  columns: ['sno', 'date', 'awbNumber', 'courierPartner', 'consigneeName', 'deliveryStatus', 'amount'],
  filters: {
    courierPartner: 'All',
    deliveryStatus: 'All',
    paymentMode: 'All',
    paidStatus: 'All',
  },
};

export function ExportReportModal({ isOpen, onClose, defaultFromDate, defaultToDate }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { partnerNames } = useCourierPartners();

  const [mode, setMode] = useState('download'); // 'download' | 'create'
  const [customReports, setCustomReports] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Download state
  const [selectedReportId, setSelectedReportId] = useState('overall');
  const [fromDate, setFromDate] = useState(defaultFromDate || '');
  const [toDate, setToDate] = useState(defaultToDate || '');
  const [format, setFormat] = useState('excel'); // 'excel' | 'csv'
  const [downloading, setDownloading] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);

  // Create state
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const getHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  // Sync default dates and reset view mode whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('download');
      if (defaultFromDate) setFromDate(defaultFromDate);
      if (defaultToDate) setToDate(defaultToDate);
    }
  }, [isOpen, defaultFromDate, defaultToDate]);

  // Load saved custom report templates
  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      if (!isFirebaseConfigured) {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        setCustomReports(raw ? JSON.parse(raw) : []);
        return;
      }
      if (!user) return;
      const headers = await getHeaders();
      const res = await fetch('/api/report-templates', { headers });
      if (!res.ok) throw new Error('Failed to load custom reports');
      const json = await res.json();
      setCustomReports(json.templates || []);
    } catch (err) {
      console.error('Load report templates error:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, [user, getHeaders]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  const allReports = [...BUILT_IN_REPORTS, ...customReports];
  const selectedReport = allReports.find((r) => r.id === selectedReportId) || BUILT_IN_REPORTS[0];

  // ── Create Report Handlers ──────────────────────────────────────────────────
  const toggleColumn = (key) => {
    setCreateForm((prev) => {
      const exists = prev.columns.includes(key);
      return {
        ...prev,
        columns: exists
          ? prev.columns.filter((c) => c !== key)
          : [...prev.columns, key],
      };
    });
  };

  const toggleGroupColumns = (group) => {
    const groupKeys = EXPORT_COLUMNS.filter((c) => c.group === group).map((c) => c.key);
    const allSelected = groupKeys.every((k) => createForm.columns.includes(k));
    setCreateForm((prev) => {
      if (allSelected) {
        return { ...prev, columns: prev.columns.filter((k) => !groupKeys.includes(k)) };
      }
      const merged = new Set([...prev.columns, ...groupKeys]);
      return { ...prev, columns: Array.from(merged) };
    });
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    const trimmedName = createForm.name.trim();
    if (!trimmedName) {
      toast('Please enter a report name', 'error');
      return;
    }
    if (createForm.columns.length === 0) {
      toast('Please select at least one column', 'error');
      return;
    }

    // Preserve canonical EXPORT_COLUMNS order
    const orderedColumns = EXPORT_COLUMNS
      .map((c) => c.key)
      .filter((k) => createForm.columns.includes(k));

    setSavingTemplate(true);
    try {
      let saved;
      if (!isFirebaseConfigured) {
        saved = {
          id: `custom-${Date.now()}`,
          name: trimmedName,
          columns: orderedColumns,
          filters: createForm.filters,
          isBuiltIn: false,
          createdAt: new Date().toISOString(),
        };
        const updated = [...customReports, saved];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        setCustomReports(updated);
      } else {
        const headers = await getHeaders();
        const res = await fetch('/api/report-templates', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: trimmedName,
            columns: orderedColumns,
            filters: createForm.filters,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to save report');
        saved = json;
        setCustomReports((prev) => [...prev, saved]);
      }

      toast(`Report "${saved.name}" saved`, 'success');
      setSelectedReportId(saved.id);
      setCreateForm(DEFAULT_CREATE_FORM);
      setMode('download');
    } catch (err) {
      toast(err.message || 'Failed to save report', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    if (!window.confirm(`Delete custom report "${name}"?`)) return;
    try {
      if (!isFirebaseConfigured) {
        const updated = customReports.filter((r) => r.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        setCustomReports(updated);
      } else {
        const headers = await getHeaders();
        const res = await fetch(`/api/report-templates/${id}`, {
          method: 'DELETE',
          headers,
        });
        if (!res.ok) throw new Error('Failed to delete report');
        setCustomReports((prev) => prev.filter((r) => r.id !== id));
      }
      setSelectedReportId('overall');
      toast(`Deleted "${name}"`, 'success');
    } catch (err) {
      toast(err.message || 'Failed to delete report', 'error');
    }
  };

  // ── Download Report Handler ─────────────────────────────────────────────────
  const handleDownload = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      toast('Please select both From Date and To Date', 'error');
      return;
    }
    if (fromDate > toDate) {
      toast('From Date cannot be after To Date', 'error');
      return;
    }

    setDownloading(true);
    setFetchProgress(0);

    try {
      const reportFilters = selectedReport.filters || {};
      let allRecords = [];

      if (!isFirebaseConfigured) {
        const raw = localStorage.getItem('fe_consignments');
        const list = raw ? JSON.parse(raw) : [];
        allRecords = list.filter((item) => {
          const itemDate = new Date(item.date);
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate < start || itemDate > end) return false;
          if (reportFilters.courierPartner && reportFilters.courierPartner !== 'All' && item.courierPartner !== reportFilters.courierPartner) return false;
          if (reportFilters.deliveryStatus && reportFilters.deliveryStatus !== 'All' && item.deliveryStatus !== reportFilters.deliveryStatus) return false;
          if (reportFilters.paymentMode && reportFilters.paymentMode !== 'All' && item.paymentMode !== reportFilters.paymentMode) return false;
          return true;
        });
        setFetchProgress(allRecords.length);
      } else {
        const headers = await getHeaders();
        let cursor = null;
        let hasMore = true;

        while (hasMore) {
          const params = new URLSearchParams({
            limit: '200',
            fromDate,
            toDate,
          });
          if (reportFilters.courierPartner && reportFilters.courierPartner !== 'All') {
            params.append('courierPartner', reportFilters.courierPartner);
          }
          if (reportFilters.deliveryStatus && reportFilters.deliveryStatus !== 'All') {
            params.append('deliveryStatus', reportFilters.deliveryStatus);
          }
          if (reportFilters.paymentMode && reportFilters.paymentMode !== 'All') {
            params.append('paymentMode', reportFilters.paymentMode);
          }
          if (cursor) {
            params.append('cursor', cursor);
          }

          const res = await fetch(`/api/consignments?${params}`, { headers });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || 'Failed to fetch records for export');
          }
          const json = await res.json();
          const pageData = Array.isArray(json) ? json : (json.data || []);
          allRecords = [...allRecords, ...pageData];
          setFetchProgress(allRecords.length);

          if (Array.isArray(json) || !json.hasMore || !json.nextCursor || pageData.length === 0) {
            hasMore = false;
          } else {
            cursor = json.nextCursor;
          }
        }
      }

      // Apply any additional in-memory filters (e.g., paidStatus)
      if (reportFilters.paidStatus && reportFilters.paidStatus !== 'All') {
        allRecords = allRecords.filter((item) => item.paidStatus === reportFilters.paidStatus);
      }

      if (allRecords.length === 0) {
        toast('No consignments found for this report and date range.', 'info');
        return;
      }

      const safeReportName = selectedReport.name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
      const filename = `${safeReportName}_${fromDate}_to_${toDate}`;

      if (format === 'csv') {
        exportToCSV(allRecords, filename, selectedReport.columns);
      } else {
        exportToExcel(allRecords, filename, selectedReport.columns, selectedReport.name);
      }

      toast(`Downloaded ${allRecords.length} records (${selectedReport.name})`, 'success');
      onClose();
    } catch (err) {
      toast('Export failed: ' + err.message, 'error');
    } finally {
      setDownloading(false);
      setFetchProgress(0);
    }
  };

  // Active filter summary pills for the selected report
  const activeFilterEntries = Object.entries(selectedReport.filters || {}).filter(
    ([, val]) => val && val !== 'All'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !downloading && !savingTemplate && onClose()}
      title={mode === 'download' ? 'Download Report' : 'Create New Report'}
      size="lg"
    >
      {mode === 'download' ? (
        <form onSubmit={handleDownload} className="space-y-5">
          {/* Select Report + Create (+) button */}
          <div>
            <label className="block text-xs font-semibold text-fe-dark uppercase tracking-wider mb-1.5 font-sans">
              Select Report
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  disabled={loadingTemplates || downloading}
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg border border-fe-muted/40 bg-white text-sm text-fe-dark font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-fe-teal/30 focus:border-fe-teal"
                >
                  <optgroup label="Standard Reports">
                    {BUILT_IN_REPORTS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                  {customReports.length > 0 && (
                    <optgroup label="Custom Saved Reports">
                      {customReports.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-fe-gray">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMode('create')}
                disabled={downloading}
                title="Create new custom report"
                aria-label="Create new custom report"
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-fe-teal bg-fe-teal/10 text-fe-teal hover:bg-fe-teal hover:text-white transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>

              {!selectedReport.isBuiltIn && (
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(selectedReport.id, selectedReport.name)}
                  disabled={downloading}
                  title="Delete this custom report"
                  aria-label="Delete custom report"
                  className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Selected Report Details Preview */}
          <div className="bg-fe-bg/60 border border-fe-muted/25 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-fe-dark flex items-center gap-1.5">
                <Columns3 className="h-3.5 w-3.5 text-fe-teal" />
                Included Columns ({selectedReport.columns.length})
              </span>
              {!selectedReport.isBuiltIn && (
                <span className="px-2 py-0.5 rounded-full bg-fe-teal/10 text-fe-teal text-[10px] font-bold">
                  Custom Report
                </span>
              )}
            </div>
            <p className="text-xs text-fe-gray leading-relaxed">
              {selectedReport.columns
                .map((key) => EXPORT_COLUMNS.find((c) => c.key === key)?.label || key)
                .join(', ')}
            </p>
            <div className="pt-1 border-t border-fe-muted/15 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-fe-gray flex items-center gap-1 mr-1">
                <Filter className="h-3 w-3" /> Filters:
              </span>
              {activeFilterEntries.length === 0 ? (
                <span className="text-[11px] text-fe-gray">None (All records in date range)</span>
              ) : (
                activeFilterEntries.map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded bg-white border border-fe-muted/30 text-[11px] font-medium text-fe-dark"
                  >
                    {k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}: <strong>{v}</strong>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
            <Input
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </div>

          {/* Format Toggle */}
          <div>
            <label className="block text-xs font-semibold text-fe-dark uppercase tracking-wider mb-1.5 font-sans">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                  format === 'excel'
                    ? 'border-fe-teal bg-fe-teal/10 text-fe-teal font-semibold'
                    : 'border-fe-muted/30 bg-white text-fe-gray hover:text-fe-dark'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                  format === 'csv'
                    ? 'border-fe-teal bg-fe-teal/10 text-fe-teal font-semibold'
                    : 'border-fe-muted/30 bg-white text-fe-gray hover:text-fe-dark'
                }`}
              >
                <FileText className="h-4 w-4" />
                CSV (.csv)
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-fe-muted/20">
            <Button type="button" variant="ghost" onClick={onClose} disabled={downloading}>
              Cancel
            </Button>
            <Button type="submit" loading={downloading} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {downloading
                ? `Downloading (${fetchProgress} fetched)...`
                : 'Download Report'}
            </Button>
          </div>
        </form>
      ) : (
        /* ── Create New Report View ────────────────────────────────────────── */
        <form onSubmit={handleSaveTemplate} className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-fe-muted/20">
            <button
              type="button"
              onClick={() => setMode('download')}
              className="flex items-center gap-1.5 text-xs font-semibold text-fe-gray hover:text-fe-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Export
            </button>
            <span className="text-xs font-semibold text-fe-teal">
              {createForm.columns.length} columns selected
            </span>
          </div>

          {/* Report Name */}
          <Input
            label="Report Name"
            placeholder="e.g., Pending COD - Franch Express"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          {/* Preset Filters */}
          <div>
            <label className="block text-xs font-semibold text-fe-dark uppercase tracking-wider mb-2 font-sans">
              Preset Filters (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-fe-bg/50 p-3 rounded-lg border border-fe-muted/20">
              <Select
                label="Courier Partner"
                value={createForm.filters.courierPartner}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, courierPartner: e.target.value },
                  }))
                }
                options={['All', ...partnerNames]}
              />
              <Select
                label="Delivery Status"
                value={createForm.filters.deliveryStatus}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, deliveryStatus: e.target.value },
                  }))
                }
                options={STATUS_OPTIONS}
              />
              <Select
                label="Payment Mode"
                value={createForm.filters.paymentMode}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, paymentMode: e.target.value },
                  }))
                }
                options={PAYMENT_OPTIONS}
              />
              <Select
                label="Paid Status"
                value={createForm.filters.paidStatus}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, paidStatus: e.target.value },
                  }))
                }
                options={PAID_STATUS_OPTIONS}
              />
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-fe-dark uppercase tracking-wider font-sans">
                Select Columns
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setCreateForm((prev) => ({
                      ...prev,
                      columns: EXPORT_COLUMNS.map((c) => c.key),
                    }))
                  }
                  className="text-fe-teal font-semibold hover:underline"
                >
                  Select All
                </button>
                <span className="text-fe-muted">|</span>
                <button
                  type="button"
                  onClick={() => setCreateForm((prev) => ({ ...prev, columns: [] }))}
                  className="text-fe-gray hover:text-fe-dark font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 border border-fe-muted/25 rounded-lg p-3 bg-white">
              {COLUMN_GROUPS.map((group) => {
                const cols = EXPORT_COLUMNS.filter((c) => c.group === group);
                const allGroupSelected = cols.every((c) => createForm.columns.includes(c.key));
                return (
                  <div key={group} className="space-y-1.5">
                    <div className="flex items-center justify-between border-b border-fe-muted/15 pb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">
                        {group}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGroupColumns(group)}
                        className="text-[11px] font-semibold text-fe-teal hover:underline"
                      >
                        {allGroupSelected ? 'Deselect group' : 'Select group'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {cols.map((col) => {
                        const checked = createForm.columns.includes(col.key);
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => toggleColumn(col.key)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left text-xs transition-all ${
                              checked
                                ? 'border-fe-teal bg-fe-teal/10 text-fe-dark font-medium'
                                : 'border-fe-muted/25 bg-fe-bg/30 text-fe-gray hover:border-fe-muted/50'
                            }`}
                          >
                            <span
                              className={`h-3.5 w-3.5 rounded flex items-center justify-center shrink-0 border ${
                                checked
                                  ? 'bg-fe-teal border-fe-teal text-white'
                                  : 'bg-white border-fe-muted/50'
                              }`}
                            >
                              {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </span>
                            <span className="truncate">{col.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-fe-muted/20">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode('download')}
              disabled={savingTemplate}
            >
              Cancel
            </Button>
            <Button type="submit" loading={savingTemplate} className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Save Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

