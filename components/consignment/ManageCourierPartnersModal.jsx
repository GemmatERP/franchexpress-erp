'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Truck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../hooks/useToast';

export function ManageCourierPartnersModal({
  isOpen,
  onClose,
  partners = [],
  onAddPartner,
  onDeletePartner,
  onSelectPartner,
  currentValue,
}) {
  const { toast } = useToast();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleAdd = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast('Please enter a courier partner name', 'error');
      return;
    }

    setAdding(true);
    try {
      const created = await onAddPartner(trimmed);
      toast(`Added courier partner "${created.name}"`, 'success');
      setNewName('');
      if (onSelectPartner) {
        onSelectPartner(created.name);
      }
    } catch (err) {
      toast(err.message || 'Failed to add partner', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (partner) => {
    if (partners.length <= 1) {
      toast('At least one courier partner must remain', 'warning');
      return;
    }
    if (!window.confirm(`Delete courier partner "${partner.name}"?`)) return;

    setDeletingId(partner.id);
    try {
      await onDeletePartner(partner.id);
      toast(`Deleted "${partner.name}"`, 'success');
      if (currentValue === partner.name && onSelectPartner) {
        const remaining = partners.find((p) => p.id !== partner.id);
        if (remaining) onSelectPartner(remaining.name);
      }
    } catch (err) {
      toast(err.message || 'Failed to delete partner', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Courier Partners"
      size="md"
    >
      <div className="space-y-5">
        {/* Add New Partner */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-fe-dark uppercase tracking-wider font-sans">
            Add New Courier Partner
          </label>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g., Trackon, Maruti Courier, Shadowfax..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                disabled={adding}
              />
            </div>
            <Button
              type="button"
              onClick={handleAdd}
              loading={adding}
              className="h-[42px] px-4 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Existing Partners List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-fe-dark uppercase tracking-wider font-sans">
              Saved Courier Partners ({partners.length})
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto border border-fe-muted/30 rounded-lg divide-y divide-fe-muted/15 bg-white">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-fe-bg/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Truck className="h-4 w-4 text-fe-teal shrink-0" />
                  <span className="text-sm font-medium text-fe-dark truncate">
                    {partner.name}
                  </span>
                  {currentValue === partner.name && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fe-teal/10 text-fe-teal">
                      Selected
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(partner)}
                  disabled={deletingId === partner.id || partners.length <= 1}
                  title={`Delete ${partner.name}`}
                  aria-label={`Delete ${partner.name}`}
                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-fe-muted/20">
          <Button type="button" variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

