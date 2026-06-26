'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Truck, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Select } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { Spinner } from '../../../../components/ui/Spinner';
import { Badge } from '../../../../components/ui/Badge';
import { TrackingTimeline } from '../../../../components/consignment/TrackingTimeline';
import { EditShipmentSection } from '../../../../components/consignment/EditShipmentSection';
import { EditReadOnlySection } from '../../../../components/consignment/EditReadOnlySection';
import { PaymentSection } from '../../../../components/consignment/PaymentSection';
import { useConsignmentEdit } from '../../../../lib/ConsignmentEditContext';
import { useConsignments } from '../../../../hooks/useConsignments';
import { useTracking } from '../../../../hooks/useTracking';
import { useToast } from '../../../../hooks/useToast';
import { formatDateForInput } from '../../../../lib/utils';

const DELIVERY_STATUS_OPTIONS = [
  'Processed',
  'Booked',
  'Processing',
  'Transit',
  'Reached Destination',
  'Out of Delivery',
  'Delivered',
  'Holding at HUB',
  'Returned',
];

export default function EditConsignmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { editId, clearEdit } = useConsignmentEdit();
  const { getConsignment, updateConsignment, loading: saveLoading } = useConsignments();
  const { track, trackingData, loading: trackLoading } = useTracking();

  const [consignment, setConsignment] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [trackingOpen, setTrackingOpen] = useState(false);

  // ── Guard: if no edit context, redirect to consignments list ──────────────
  useEffect(() => {
    let activeId = editId;
    if (!activeId && typeof window !== 'undefined') {
      try {
        activeId = sessionStorage.getItem('fe_edit_consignment_id');
      } catch (_) {}
    }

    if (!activeId) {
      router.replace('/dashboard/consignments');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getConsignment(activeId);
        setConsignment(data);

        // Normalize date fields for HTML inputs
        const formatted = { ...data };
        if (formatted.date) formatted.date = formatDateForInput(formatted.date);
        if (formatted.paymentDate) formatted.paymentDate = formatDateForInput(formatted.paymentDate);
        if (formatted.deliveredDate) formatted.deliveredDate = formatDateForInput(formatted.deliveredDate);
        setFormData(formatted);

        // Pre-fetch tracking for the AWB
        if (data.awbNumber) {
          track(data.awbNumber);
        }

        // Clear the context AFTER reading it (prevent stale state on re-navigation)
        clearEdit();
      } catch (err) {
        toast('Failed to load consignment: ' + err.message, 'error');
        router.replace('/dashboard/consignments');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const tempErrors = {};
    if (!formData.deliveryStatus) tempErrors.deliveryStatus = 'Delivery status is required';
    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) {
      toast('Please fill in all required fields.', 'error');
      return;
    }

    const chargeableAmount = (Number(formData.amount) || 0) + (Number(formData.coverCharges) || 0);

    const updatePayload = {
      courierPartner: formData.courierPartner,
      voucherType: formData.voucherType,
      goodsDescription: formData.goodsDescription,
      weight: formData.weight ? Number(formData.weight) : 0,
      volumetricWeight: formData.volumetricWeight ? Number(formData.volumetricWeight) : 0,

      paymentMode: formData.paymentMode,
      paymentDate: formData.paymentDate,
      amount: formData.amount ? Number(formData.amount) : 0,
      cashAmount: formData.paymentMode === 'CASH + UPI' ? (Number(formData.cashAmount) || 0) : (formData.paymentMode === 'CASH' ? (Number(formData.amount) || 0) : 0),
      upiAmount: formData.paymentMode === 'CASH + UPI' ? (Number(formData.upiAmount) || 0) : ((formData.paymentMode === 'UPI' || formData.paymentMode === 'GPAY' || formData.paymentMode === 'PAYTM') ? (Number(formData.amount) || 0) : 0),
      coverCharges: formData.coverCharges ? Number(formData.coverCharges) : 0,
      codProductValue: formData.codProductValue ? Number(formData.codProductValue) : 0,
      chargeableAmount,
      paidStatus: formData.paidStatus,

      deliveryStatus: formData.deliveryStatus,
      deliveredDate: formData.deliveredDate || null,
    };

    try {
      await updateConsignment(editId || consignment?.id, updatePayload);
      toast(`Consignment ${consignment?.sno} updated successfully`, 'success');

      // Trigger status notification
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consignorPhone: consignment?.consignorPhone,
            consigneePhone: consignment?.consigneePhone,
            awbNumber: consignment?.awbNumber,
            consigneeName: consignment?.consigneeName,
            consignorName: consignment?.consignorName,
            deliveryStatus: formData.deliveryStatus,
          }),
        });
      } catch (_) {
        // Non-blocking
      }

      router.push(`/dashboard/consignments/${consignment?.id}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading || !formData) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-white border border-fe-muted/30 rounded-xl max-w-4xl mx-auto">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3">Loading consignment data...</p>
      </div>
    );
  }

  const showTracking = formData.deliveryStatus === 'Processed';

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Sticky Top Action Bar */}
      <div className="sticky top-16 z-10 bg-fe-bg py-4 border-b border-fe-muted/10 flex flex-wrap justify-between items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/consignments/${consignment?.id}`)}
          className="inline-flex items-center gap-1 text-xs font-bold text-fe-gray hover:text-fe-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </button>

        <div className="flex items-center gap-3">
          {consignment && (
            <div className="flex items-center gap-2 text-xs font-sans">
              <span className="font-mono font-bold text-fe-teal">{consignment.sno}</span>
              <Badge value={formData.deliveryStatus} />
            </div>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saveLoading}
            className="flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 mt-4">
        {/* 1. Shipment Info */}
        <EditShipmentSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
        />

        {/* 2. Payment Info */}
        <PaymentSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
          sectionNumber={2}
        />

        {/* 3. Consignor (Read Only) */}
        <EditReadOnlySection type="consignor" data={formData} sectionNumber={3} />

        {/* 4. Consignee (Read Only) */}
        <EditReadOnlySection type="consignee" data={formData} sectionNumber={4} />

        {/* 5. Delivery Info — fully editable */}
        <div className="border border-fe-muted rounded-xl bg-white overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setDeliveryOpen((o) => !o)}
            className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-fe-bg/30 transition-colors focus:outline-none"
            aria-expanded={deliveryOpen}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-fe-teal/10 text-fe-teal">
                <Truck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-fe-dark font-heading">5. Delivery Info</h3>
                <p className="text-[10px] text-fe-gray font-sans">
                  Update shipment status and delivery timestamps
                </p>
              </div>
            </div>
            <motion.div animate={{ rotate: deliveryOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-5 w-5 text-fe-gray" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {deliveryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="px-6 pb-6 pt-2 border-t border-fe-muted/20 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
                  {/* Delivery Status */}
                  <Select
                    label="Delivery Status"
                    name="deliveryStatus"
                    value={formData.deliveryStatus}
                    onChange={handleInputChange}
                    options={DELIVERY_STATUS_OPTIONS}
                    error={errors.deliveryStatus}
                    required
                  />
                  {/* Delivered Date */}
                  <Input
                    label="Delivered Date"
                    name="deliveredDate"
                    type="date"
                    value={formData.deliveredDate || ''}
                    onChange={handleInputChange}
                    error={errors.deliveredDate}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 6. Tracking Details — only when status is 'Processed' */}
        <div className="border border-fe-muted rounded-xl bg-white overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setTrackingOpen((o) => !o)}
            className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-fe-bg/30 transition-colors focus:outline-none"
            aria-expanded={trackingOpen}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${showTracking ? 'bg-fe-teal/10 text-fe-teal' : 'bg-fe-muted/30 text-fe-gray'}`}>
                <Radio className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-fe-dark font-heading">6. Tracking Details</h3>
                  {!showTracking && (
                    <span className="text-[9px] font-bold bg-fe-muted/40 text-fe-gray px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Available when Processed
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-fe-gray font-sans">
                  {showTracking
                    ? 'Live network tracking data for this AWB'
                    : 'Set status to "Processed" to view live tracking data'}
                </p>
              </div>
            </div>
            <motion.div animate={{ rotate: trackingOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-5 w-5 text-fe-gray" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {trackingOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="border-t border-fe-muted/20">
                  {!showTracking ? (
                    <div className="px-6 py-10 text-center text-fe-gray text-xs font-sans">
                      <Radio className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="font-semibold text-fe-dark text-sm mb-1">Tracking Unavailable</p>
                      <p>Set the delivery status to <span className="font-bold text-fe-teal">Processed</span> to view live tracking data for this shipment.</p>
                    </div>
                  ) : trackLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Spinner size="md" />
                      <p className="text-xs text-fe-gray font-sans mt-3">Fetching tracking data...</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <TrackingTimeline trackingData={trackingData} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
