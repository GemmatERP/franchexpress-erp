'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Minus, X, AlertCircle, CheckCircle, Boxes } from 'lucide-react';
import { useOfficeUtilities } from '../../../hooks/useOfficeUtilities';
import { useToast } from '../../../hooks/useToast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

// Low-stock threshold
const LOW_STOCK_THRESHOLD = 50;

function AdjustModal({ isOpen, onClose, item, mode, onConfirm, loading }) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const inputRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setInputError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    // Strip any non-digit characters (matches AWB field pattern in ConsignmentForm)
    const cleaned = e.target.value.replace(/\D/g, '');
    setInputValue(cleaned);
    if (inputError) setInputError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation: must not be empty
    if (!inputValue || inputValue === '') {
      setInputError('Please enter a number.');
      return;
    }
    const qty = parseInt(inputValue, 10);
    // Validation: must be a positive integer
    if (!Number.isFinite(qty) || qty <= 0) {
      setInputError('Enter a valid whole number greater than 0.');
      return;
    }
    // Validation: Remove cannot exceed current count
    if (mode === 'remove' && qty > (item?.count ?? 0)) {
      setInputError(`Cannot remove ${qty} — current count is only ${item?.count ?? 0}.`);
      return;
    }
    onConfirm(qty);
  };

  if (!item) return null;

  const isAdd = mode === 'add';
  const title = isAdd ? `Add to ${item.name}` : `Remove from ${item.name}`;
  const actionLabel = isAdd ? 'Add' : 'Remove';
  const actionVariant = isAdd ? 'primary' : 'danger';
  const ActionIcon = isAdd ? Plus : Minus;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item info */}
        <div className="bg-fe-bg rounded-lg p-3 border border-fe-muted/20">
          <p className="text-xs text-fe-gray font-sans">{item.description}</p>
          <p className="text-sm font-bold text-fe-dark font-heading mt-1">
            Current Count: <span className={item.count <= LOW_STOCK_THRESHOLD ? 'text-red-500' : 'text-fe-teal'}>
              {item.count}
            </span>
          </p>
        </div>

        {/* Quantity input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-fe-dark font-sans">
            Quantity to {actionLabel} <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter whole number (e.g. 100)"
            value={inputValue}
            onChange={handleChange}
            disabled={loading}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm font-sans font-mono transition-all bg-white text-fe-dark placeholder-fe-gray focus:outline-none focus:ring-2 focus:ring-fe-teal focus:ring-offset-1 ${
              inputError ? 'border-red-300 ring-2 ring-red-200' : 'border-fe-muted focus:border-fe-teal'
            }`}
            aria-invalid={!!inputError}
          />
          {inputError && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-red-600 animate-pulse" role="alert">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {inputError}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            variant={actionVariant}
            loading={loading}
            className="flex items-center gap-1.5 text-xs"
          >
            <ActionIcon className="h-3.5 w-3.5" />
            {actionLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function UtilityCard({ item, onAdd, onRemove }) {
  const isLowStock = item.count <= LOW_STOCK_THRESHOLD;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="bg-white border border-fe-muted/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4"
    >
      {/* Icon + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2.5 rounded-xl bg-fe-teal/10 text-fe-teal shrink-0">
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-fe-dark font-heading">{item.name}</p>
          <p className="text-[11px] text-fe-gray font-sans mt-0.5 truncate">{item.description}</p>
        </div>
      </div>

      {/* Count badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`px-4 py-2 rounded-xl font-bold text-lg font-heading border ${
          isLowStock
            ? 'bg-red-50 text-red-600 border-red-200'
            : 'bg-fe-teal/10 text-fe-teal border-fe-teal/20'
        }`}>
          {item.count}
          {isLowStock && (
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-red-500">
              LOW
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onAdd(item)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-fe-teal/10 text-fe-teal hover:bg-fe-teal hover:text-white text-xs font-bold font-sans transition-all border border-fe-teal/20 hover:border-fe-teal"
            title={`Add to ${item.name}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            onClick={() => onRemove(item)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold font-sans transition-all border border-red-200 hover:border-red-500"
            title={`Remove from ${item.name}`}
          >
            <Minus className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OfficeUtilitiesPage() {
  const { items, loading, error, fetchItems, adjustItem } = useOfficeUtilities();
  const { toast } = useToast();

  const [modal, setModal] = useState({ isOpen: false, item: null, mode: 'add' });
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openModal = (item, mode) => {
    setModal({ isOpen: true, item, mode });
  };

  const closeModal = () => {
    setModal({ isOpen: false, item: null, mode: 'add' });
  };

  const handleConfirm = async (qty) => {
    const { item, mode } = modal;
    if (!item) return;

    const delta = mode === 'add' ? qty : -qty;
    setAdjusting(true);
    try {
      const updated = await adjustItem(item.id, delta);
      toast(
        `${item.name} count ${mode === 'add' ? 'increased' : 'decreased'} to ${updated.count}`,
        'success'
      );
      closeModal();
    } catch (err) {
      // Error is shown inline in the modal already via the hook's error state
      // Also show a toast for clarity
      toast(err.message, 'error');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-fe-teal/10 text-fe-teal">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-fe-dark font-heading">Office Utilities</h1>
            <p className="text-xs text-fe-gray font-sans mt-0.5">
              Track and manage POD envelopes, covers, and other office consumables.
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchItems()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold font-sans text-fe-gray hover:text-fe-dark border border-fe-muted/30 hover:border-fe-muted/60 transition-all"
        >
          {loading ? (
            <span className="h-3.5 w-3.5 border-2 border-fe-teal border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-sm">↻</span>
          )}
          Refresh
        </button>
      </div>

      {/* Low-stock banner */}
      {items.some((i) => i.count <= LOW_STOCK_THRESHOLD) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-sans"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>
            <strong>Low stock alert:</strong>{' '}
            {items.filter((i) => i.count <= LOW_STOCK_THRESHOLD).map((i) => i.name).join(', ')}{' '}
            {items.filter((i) => i.count <= LOW_STOCK_THRESHOLD).length === 1 ? 'is' : 'are'} running low.
          </span>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && items.length === 0 && (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white border border-fe-muted/20 rounded-2xl p-5 shadow-sm animate-pulse h-20" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-sans flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Items list */}
      {!loading && !error && items.length > 0 && (
        <AnimatePresence>
          <div className="space-y-3">
            {items.map((item) => (
              <UtilityCard
                key={item.id}
                item={item}
                onAdd={(i) => openModal(i, 'add')}
                onRemove={(i) => openModal(i, 'remove')}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-fe-muted/30 mb-4">
            <Package className="h-8 w-8 text-fe-gray" />
          </div>
          <p className="text-sm font-semibold text-fe-dark font-heading">No items found</p>
          <p className="text-xs text-fe-gray font-sans mt-1">Reload the page to seed default items.</p>
        </div>
      )}

      {/* Adjust Modal */}
      <AdjustModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        item={modal.item}
        mode={modal.mode}
        onConfirm={handleConfirm}
        loading={adjusting}
      />
    </div>
  );
}
