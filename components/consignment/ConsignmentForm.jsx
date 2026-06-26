'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useConsignments } from '../../hooks/useConsignments';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useConsignmentEdit } from '../../lib/ConsignmentEditContext';
import { ShipmentSection } from './ShipmentSection';
import { PaymentSection } from './PaymentSection';
import { ConsignorSection } from './ConsignorSection';
import { ConsigneeSection } from './ConsigneeSection';
import { DuplicateAwbModal } from './DuplicateAwbModal';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { CopyButton } from './CopyButton';
import { validatePhone, validatePincode, formatDateForInput } from '../../lib/utils';

const INITIAL_FORM = () => ({
  date: formatDateForInput(new Date()),
  voucherType: 'Normal',
  awbNumber: '',
  courierPartner: 'Franch Express',
  mode: 'Surface',
  nature: 'Non Doc',
  goodsDescription: '',
  weight: '',
  volumetricWeight: '',

  paymentMode: 'CASH',
  paymentDate: formatDateForInput(new Date()),
  amount: '',
  cashAmount: '',
  upiAmount: '',
  coverCharges: '',
  paidStatus: 'Paid',
  codProductValue: '',
  chargeableAmount: '',

  consignorPhone: '',
  consignorName: '',
  consignorAddress1: '',
  consignorAddress2: '',
  consignorAddress3: '',
  consignorCity: '',
  consignorPincode: '',
  consignorState: 'Tamil Nadu',
  consignorCountry: 'India',

  consigneePhone: '',
  consigneeName: '',
  consigneeAddress1: '',
  consigneeAddress2: '',
  consigneeAddress3: '',
  consigneeCity: '',
  consigneePincode: '',
  consigneeState: 'Tamil Nadu',
  consigneeCountry: 'India',

  // Delivery status defaults to Processing (triggers booking WhatsApp notification)
  deliveryStatus: 'Processing',
  deliveredDate: '',
});

export function ConsignmentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setEditConsignment } = useConsignmentEdit();
  const { createConsignment, loading: saveLoading } = useConsignments();

  const [sno, setSno] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM());
  const [errors, setErrors] = useState({});

  // ── Dirty tracking ──────────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const pendingNavRef = useRef(null); // stores the href to navigate to after discard

  // ── Duplicate AWB guard ─────────────────────────────────────────────────────
  const [awbDuplicateChecking, setAwbDuplicateChecking] = useState(false);
  const [isDuplicateAwb, setIsDuplicateAwb] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateId, setDuplicateId] = useState(null);

  // ── Unsaved changes guard: intercept beforeunload ───────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let cleanValue = value;
    if (name === 'awbNumber') {
      cleanValue = value.replace(/\D/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    setIsDirty(true);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    // If AWB changed, clear duplicate flag
    if (name === 'awbNumber') {
      setIsDuplicateAwb(false);
      setDuplicateId(null);
    }
  };

  // ── Duplicate AWB check (fires on AWB field blur) ───────────────────────────
  const handleAwbBlur = useCallback(async () => {
    const awb = formData.awbNumber?.trim();
    if (!awb || !/^\d+$/.test(awb)) return;

    setAwbDuplicateChecking(true);
    try {
      let headers = { 'Content-Type': 'application/json' };
      if (user) {
        const token = await user.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`/api/consignments/search?q=${encodeURIComponent(awb)}`, { headers });
      if (!res.ok) return;
      const results = await res.json();
      // Find exact AWB match (search may return partial matches)
      const exactMatch = Array.isArray(results)
        ? results.find((r) => r.awbNumber === awb)
        : null;
      if (exactMatch) {
        setIsDuplicateAwb(true);
        setDuplicateId(exactMatch.id);
        setShowDuplicateModal(true);
      } else {
        setIsDuplicateAwb(false);
        setDuplicateId(null);
      }
    } catch (_) {
      // Fail silently — don't block the user for a network hiccup
    } finally {
      setAwbDuplicateChecking(false);
    }
  }, [formData.awbNumber, user]);

  // ── Navigate to existing consignment via edit context ───────────────────────
  const handleViewExisting = () => {
    setShowDuplicateModal(false);
    setEditConsignment(duplicateId);
    setIsDirty(false);
    router.push('/dashboard/consignments/edit');
  };

  // ── Clear form ──────────────────────────────────────────────────────────────
  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear the entire form?')) {
      setFormData(INITIAL_FORM());
      setErrors({});
      setIsDirty(false);
      setSno('');
    }
  };

  // ── Unsaved changes navigation guard ────────────────────────────────────────
  const handleNavigateAway = (href) => {
    if (isDirty) {
      pendingNavRef.current = href;
      setShowUnsaved(true);
    } else {
      router.push(href);
    }
  };

  const handleCopyAndStay = () => {
    try {
      const text = JSON.stringify({ sno, ...formData }, null, 2);
      navigator.clipboard.writeText(text);
      toast('Form data copied to clipboard', 'success');
    } catch (_) {
      toast('Could not access clipboard', 'error');
    }
    setShowUnsaved(false);
  };

  const handleDiscardAndLeave = () => {
    setIsDirty(false);
    setShowUnsaved(false);
    const href = pendingNavRef.current || '/dashboard';
    pendingNavRef.current = null;
    router.push(href);
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const tempErrors = {};
    if (!formData.date) tempErrors.date = 'Date is required';
    if (!formData.awbNumber) tempErrors.awbNumber = 'AWB Number is required';
    else if (!/^\d+$/.test(formData.awbNumber)) tempErrors.awbNumber = 'AWB must be numeric only';

    if (!formData.consignorPhone) tempErrors.consignorPhone = 'Sender phone is required';
    else if (!validatePhone(formData.consignorPhone)) tempErrors.consignorPhone = 'Enter a valid 10-digit Indian phone number';
    if (!formData.consignorName) tempErrors.consignorName = 'Sender name is required';
    if (!formData.consignorAddress1) tempErrors.consignorAddress1 = 'Sender address is required';
    if (!formData.consignorCity) tempErrors.consignorCity = 'Sender city is required';
    if (!formData.consignorPincode) tempErrors.consignorPincode = 'Sender pincode is required';
    else if (!validatePincode(formData.consignorPincode)) tempErrors.consignorPincode = 'Enter a valid 6-digit PIN code';

    if (!formData.consigneePhone) tempErrors.consigneePhone = 'Recipient phone is required';
    else if (!validatePhone(formData.consigneePhone)) tempErrors.consigneePhone = 'Enter a valid 10-digit Indian phone number';
    if (!formData.consigneeName) tempErrors.consigneeName = 'Recipient name is required';
    if (!formData.consigneeAddress1) tempErrors.consigneeAddress1 = 'Recipient address is required';
    if (!formData.consigneeCity) tempErrors.consigneeCity = 'Recipient city is required';
    if (!formData.consigneePincode) tempErrors.consigneePincode = 'Recipient pincode is required';
    else if (!validatePincode(formData.consigneePincode)) tempErrors.consigneePincode = 'Enter a valid 6-digit PIN code';
    if (!formData.consigneeState) tempErrors.consigneeState = 'Recipient state is required';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    if (isDuplicateAwb) {
      setShowDuplicateModal(true);
      return;
    }

    if (!validate()) {
      toast('Please correct the validation errors in the form.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const chargeableAmount = (Number(formData.amount) || 0) + (Number(formData.coverCharges) || 0);

    const submissionData = {
      ...formData,
      amount: formData.amount ? Number(formData.amount) : 0,
      cashAmount: formData.paymentMode === 'CASH + UPI' ? (Number(formData.cashAmount) || 0) : (formData.paymentMode === 'CASH' ? (Number(formData.amount) || 0) : 0),
      upiAmount: formData.paymentMode === 'CASH + UPI' ? (Number(formData.upiAmount) || 0) : ((formData.paymentMode === 'UPI' || formData.paymentMode === 'GPAY' || formData.paymentMode === 'PAYTM') ? (Number(formData.amount) || 0) : 0),
      coverCharges: formData.coverCharges ? Number(formData.coverCharges) : 0,
      codProductValue: formData.codProductValue ? Number(formData.codProductValue) : 0,
      chargeableAmount,
      weight: formData.weight ? Number(formData.weight) : 0,
      volumetricWeight: formData.volumetricWeight ? Number(formData.volumetricWeight) : 0,
      deliveryStatus: 'Processing',
    };

    try {
      const savedDoc = await createConsignment(submissionData);
      setSno(savedDoc.sno);
      setIsDirty(false);
      toast(`Consignment ${savedDoc.sno} saved successfully`, 'success');

      // Trigger WhatsApp booking notification via /api/notify
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consignorPhone: savedDoc.consignorPhone,
            consigneePhone: savedDoc.consigneePhone,
            awbNumber: savedDoc.awbNumber,
            consigneeName: savedDoc.consigneeName,
            consignorName: savedDoc.consignorName,
            deliveryStatus: 'Processing',
          }),
        });
      } catch (_) {
        // Notification failure is non-blocking
      }

      // Ask user: create another or go to dashboard
      setTimeout(() => {
        if (window.confirm(`Consignment ${savedDoc.sno} saved!\n\nCreate another consignment?`)) {
          setFormData(INITIAL_FORM());
          setSno('');
        } else {
          router.push('/dashboard');
        }
      }, 300);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Sticky Top Action Bar */}
      <div className="sticky top-16 z-10 bg-fe-bg py-4 border-b border-fe-muted/10 flex flex-wrap justify-between items-center gap-3">
        <button
          type="button"
          onClick={() => handleNavigateAway('/dashboard')}
          className="inline-flex items-center gap-1 text-xs font-bold text-fe-gray hover:text-fe-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleClearForm}
            className="flex items-center gap-1.5 text-fe-gray hover:text-red-500 hover:bg-red-50"
            aria-label="Clear all form fields"
          >
            <Trash2 className="h-4 w-4" />
            Clear Form
          </Button>

          <CopyButton formData={formData} sno={sno} />

          <Button
            variant="primary"
            onClick={handleSave}
            loading={saveLoading}
            className="flex items-center gap-1.5"
            aria-label="Save consignment details"
          >
            <Save className="h-4 w-4" />
            Save Consignment
          </Button>
        </div>
      </div>

      {/* Main Form Body — Section order: Shipment → Consignor → Consignee → Payment */}
      <form onSubmit={handleSave} className="space-y-6 mt-4">
        <ShipmentSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
          sno={sno}
          onAwbBlur={handleAwbBlur}
          awbDuplicateChecking={awbDuplicateChecking}
          sectionNumber={1}
        />
        <ConsignorSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
          sectionNumber={2}
        />
        <ConsigneeSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
          sectionNumber={3}
        />
        <PaymentSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
          sectionNumber={4}
        />
      </form>

      {/* Duplicate AWB Modal */}
      <DuplicateAwbModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          // Clear the AWB field so user can enter a different one
          setFormData((prev) => ({ ...prev, awbNumber: '' }));
          setIsDuplicateAwb(false);
          setDuplicateId(null);
        }}
        awbNumber={formData.awbNumber}
        existingId={duplicateId}
        onViewExisting={handleViewExisting}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsaved}
        onClose={() => setShowUnsaved(false)}
        onCopyAndStay={handleCopyAndStay}
        onDiscard={handleDiscardAndLeave}
      />
    </div>
  );
}
