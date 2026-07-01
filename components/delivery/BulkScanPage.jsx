'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, CheckCircle2, XCircle, Package, RefreshCw, Search, X } from 'lucide-react';
import { BulkBarcodeScanner } from './BulkBarcodeScanner';
import { AgentScannedList } from './AgentScannedList';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

/**
 * BulkScanPage
 * The main content area for the Bulk AWB Scan & Deliver workflow.
 * Manages the scanner state, the AWB queue list, and CRUD actions.
 *
 * Props:
 *   authHeaders   — async function returning { Authorization, Content-Type }
 *   queueItems    — current array of queue items
 *   setQueueItems — state setter
 *   onRefresh     — callback to reload queue from API
 */
export function BulkScanPage({ authHeaders, queueItems, setQueueItems, onRefresh }) {
  const { toast } = useToast();

  const [scannerOpen,   setScannerOpen]   = useState(false);
  const [manualAwbOpen, setManualAwbOpen] = useState(false);
  const [manualAwbVal,  setManualAwbVal]  = useState('');
  const [actionLoading, setActionLoading] = useState(null); // item id being actioned
  const [awbPopup,      setAwbPopup]      = useState({ open: false, awb: '', status: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [searchQuery,   setSearchQuery]   = useState('');

  // ── Handle a new scan ────────────────────────────────────────────────────────
  const handleScan = useCallback(async (awbNumber) => {
    try {
      const headers = await authHeaders();

      // 1. Look up the consignment by AWB
      const lookupRes = await fetch(`/api/consignments/by-awb?awb=${encodeURIComponent(awbNumber)}`, { headers });
      const lookupData = await lookupRes.json();

      if (!lookupRes.ok) {
        // AWB not found in consignments — still allow adding to queue as an unlinked scan
        if (lookupRes.status === 404) {
          // Add anyway with no consignmentId
          const postRes = await fetch('/api/delivery-queue', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              awbNumber,
              consignmentId:  null,
              particulars:    awbNumber,
              consigneeName:  '',
              consigneeCity:  '',
              deliveryStatus: '',
            }),
          });
          const postData = await postRes.json();
          if (postRes.status === 409) {
            // Duplicate — already in queue
            setAwbPopup({ open: true, awb: awbNumber, status: 'duplicate' });
            return;
          }
          if (!postRes.ok) throw new Error(postData.error || 'Failed to add to queue');
          setQueueItems((prev) => [postData, ...prev]);
          setAwbPopup({ open: true, awb: awbNumber, status: 'added' });
          return;
        }
        throw new Error(lookupData.error || 'Lookup failed');
      }

      const consignment = lookupData;

      // 2. Add to delivery queue
      const postRes = await fetch('/api/delivery-queue', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          awbNumber,
          consignmentId:  consignment.id,
          particulars:    `${awbNumber} — ${consignment.consigneeName || ''}`,
          consigneeName:  consignment.consigneeName,
          consigneeCity:  consignment.consigneeCity,
          deliveryStatus: consignment.deliveryStatus,
        }),
      });
      const postData = await postRes.json();

      if (postRes.status === 409) {
        setAwbPopup({ open: true, awb: awbNumber, status: 'duplicate' });
        return;
      }
      if (!postRes.ok) throw new Error(postData.error || 'Failed to add to queue');

      setQueueItems((prev) => [postData, ...prev]);
      setAwbPopup({ open: true, awb: awbNumber, status: 'added' });

    } catch (err) {
      console.error('handleScan error:', err);
      toast(`Scan error: ${err.message}`, 'error');
    }
  }, [authHeaders, setQueueItems, toast]);

  // ── Mark as Completed ────────────────────────────────────────────────────────
  const handleComplete = useCallback(async (item) => {
    setActionLoading(item.id);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/delivery-queue/${item.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'complete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as complete');

      // Update item in local state
      setQueueItems((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'completed', completedAt: new Date().toISOString() }
            : q
        )
      );
      toast(`AWB ${item.awbNumber} marked as delivered. +₹20 added!`, 'success');
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [authHeaders, setQueueItems, toast]);

  // ── Undo completed delivery ──────────────────────────────────────────────────
  const handleUndo = useCallback(async (item) => {
    setActionLoading(item.id);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/delivery-queue/${item.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'undo' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to undo delivery');

      // Update local state to pending
      setQueueItems((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'pending', completedAt: null }
            : q
        )
      );
      toast(`AWB ${item.awbNumber} reverted to pending.`, 'info');
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [authHeaders, setQueueItems, toast]);

  // ── Delete from queue ────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    const item = deleteConfirm.item;
    if (!item) return;
    setDeleteConfirm({ open: false, item: null });
    setActionLoading(item.id);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/delivery-queue/${item.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'delete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');

      setQueueItems((prev) => prev.filter((q) => q.id !== item.id));
      toast(`AWB ${item.awbNumber} removed from queue.`, 'info');
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [authHeaders, deleteConfirm.item, setQueueItems, toast]);

  // Derived counts
  const pendingCount   = queueItems.filter((q) => q.status === 'pending').length;
  const completedCount = queueItems.filter((q) => q.status === 'completed').length;

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-fe-dark font-heading flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-fe-teal" />
            Bulk AWB Scan & Deliver
          </h2>
          <p className="text-xs text-fe-gray mt-0.5 font-sans">
            Scan AWB barcodes continuously — mark each as delivered when handed over.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-full md:w-auto">
          {/* Top Row: Stats & Refresh */}
          <div className="flex items-center justify-between md:justify-end gap-2 text-[11px] font-semibold w-full">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full">
                <Package className="h-3 w-3" /> {pendingCount} Pending
              </span>
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200/60 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> {completedCount} Done
              </span>
            </div>
            <button
              onClick={onRefresh}
              title="Refresh queue"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-fe-gray hover:text-fe-teal hover:bg-fe-teal/5 transition-colors md:hidden"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Bottom Row: Scanner & Keyboard Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={onRefresh}
              title="Refresh queue"
              className="h-8 w-8 hidden md:flex items-center justify-center rounded-lg text-fe-gray hover:text-fe-teal hover:bg-fe-teal/5 transition-colors shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Open Scanner */}
            <button
              onClick={() => setScannerOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-fe-teal text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-fe-teal/90 active:scale-95 transition-all shadow-sm shadow-fe-teal/20"
            >
              <ScanLine className="h-4 w-4" />
              <span>Open Scanner</span>
            </button>

            {/* Enter AWB */}
            <button
              onClick={() => setManualAwbOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white border border-fe-muted/30 hover:border-fe-teal/40 text-fe-dark hover:text-fe-teal text-xs sm:text-sm font-bold rounded-xl active:scale-95 transition-all"
            >
              <span>Enter AWB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-fe-muted/20" />

      {/* Search Filter Bar */}
      <div className="px-4 py-3 bg-white border-b border-fe-muted/15 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={4}
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setSearchQuery(val);
              }
            }}
            placeholder="Search by last 4 digits..."
            className="w-full text-xs font-sans border border-fe-muted/30 rounded-xl px-3 py-2 text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal/30 pl-8 transition-all"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-fe-gray" />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-2 hover:bg-fe-bg rounded-lg text-fe-gray hover:text-fe-dark transition-colors flex items-center justify-center shrink-0"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Scanned List */}
      <div className="flex-1 overflow-y-auto">
        <AgentScannedList
          items={queueItems.filter(item => {
            if (!searchQuery) return true;
            return (item.awbNumber || '').endsWith(searchQuery);
          })}
          onComplete={handleComplete}
          onDelete={(item) => setDeleteConfirm({ open: true, item })}
          onUndo={handleUndo}
          actionLoading={actionLoading}
          isFiltered={!!searchQuery}
        />
      </div>

      {/* Bulk Scanner Overlay */}
      <BulkBarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        isPaused={awbPopup.open}
      />

      {/* AWB Added / Duplicate Popup */}
      <AnimatePresence>
        {awbPopup.open && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAwbPopup({ open: false, awb: '', status: '' })}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative z-10 bg-white rounded-2xl shadow-2xl p-7 flex flex-col items-center gap-4 max-w-xs w-full border border-fe-muted/20"
            >
              {awbPopup.status === 'added' ? (
                <>
                  <div className="h-14 w-14 rounded-full bg-fe-teal/10 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-fe-teal" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-fe-dark font-heading">AWB Added!</p>
                    <p className="text-xs text-fe-gray mt-1">
                      AWB number{' '}
                      <span className="font-bold font-mono text-fe-dark">{awbPopup.awb}</span>{' '}
                      has been added to your queue.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
                    <XCircle className="h-7 w-7 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-fe-dark font-heading">Already in Queue</p>
                    <p className="text-xs text-fe-gray mt-1">
                      AWB <span className="font-bold font-mono text-fe-dark">{awbPopup.awb}</span> is already in your active queue.
                    </p>
                  </div>
                </>
              )}
              <Button
                onClick={() => setAwbPopup({ open: false, awb: '', status: '' })}
                className="w-full"
              >
                OK
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, item: null })}
        title="Remove AWB"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-fe-gray font-sans">
            Are you sure you want to remove AWB{' '}
            <span className="font-bold font-mono text-fe-dark">
              {deleteConfirm.item?.awbNumber}
            </span>{' '}
            from your delivery queue?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm({ open: false, item: null })}
            >
              Cancel
            </Button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual AWB Entry Modal */}
      <Modal
        isOpen={manualAwbOpen}
        onClose={() => {
          setManualAwbOpen(false);
          setManualAwbVal('');
        }}
        title="Enter AWB Number"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!manualAwbVal.trim()) return;
            handleScan(manualAwbVal.trim());
            setManualAwbOpen(false);
            setManualAwbVal('');
          }}
          className="space-y-4 font-sans"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-fe-gray">
              AWB Number (digits only)
            </label>
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="e.g. 48070112226"
              value={manualAwbVal}
              onChange={(e) => setManualAwbVal(e.target.value.replace(/\D/g, ''))}
              className="w-full text-sm border border-fe-muted/30 rounded-lg px-3 py-2 text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal/30 font-mono tracking-wider"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setManualAwbOpen(false);
                setManualAwbVal('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!manualAwbVal.trim()}
            >
              OK
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
