'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Edit2,
  ShieldAlert,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Package,
  User,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { useCourierPartners } from '../../../hooks/useCourierPartners';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { formatDate, formatDateForInput, formatCurrency } from '../../../lib/utils';

const COURIER_OPTIONS = [
  'Franch Express', 'India Post', 'ST Courier', 'SmartR',
  'Blue Dart', 'DTDC', 'DHL', 'FedEx', 'Aramex', 'UPS', 'Delhivery',
];
const VOUCHER_TYPE_OPTIONS = ['Normal', 'COD', 'To Pay', 'Safety Plus'];
const MODE_OPTIONS = ['Air', 'Surface', 'Express', 'Cargo'];
const NATURE_OPTIONS = ['Doc', 'Non Doc'];
const PAYMENT_MODE_OPTIONS = ['CASH', 'UPI', 'CASH + UPI', 'To Pay', 'CREDIT', 'COD'];
const PAID_STATUS_OPTIONS = ['Paid', 'Not Paid'];

const FIELD_LABELS = {
  date: 'Booking Date',
  voucherType: 'Voucher Type',
  awbNumber: 'AWB Number',
  courierPartner: 'Courier Partner',
  mode: 'Mode',
  nature: 'Nature',
  goodsDescription: 'Goods Description',
  weight: 'Weight (kg)',
  volumetricWeight: 'Volumetric Weight (kg)',

  consignorPhone: 'Sender Phone',
  consignorName: 'Sender Name',
  consignorAddress1: 'Sender Address Line 1',
  consignorAddress2: 'Sender Address Line 2',
  consignorAddress3: 'Sender Address Line 3',
  consignorCity: 'Sender City',
  consignorPincode: 'Sender Pincode',
  consignorState: 'Sender State',
  consignorCountry: 'Sender Country',

  consigneePhone: 'Recipient Phone',
  consigneeName: 'Recipient Name',
  consigneeAddress1: 'Recipient Address Line 1',
  consigneeAddress2: 'Recipient Address Line 2',
  consigneeAddress3: 'Recipient Address Line 3',
  consigneeCity: 'Recipient City',
  consigneePincode: 'Recipient Pincode',
  consigneeState: 'Recipient State',
  consigneeCountry: 'Recipient Country',

  paymentMode: 'Payment Mode',
  paymentDate: 'Payment Date',
  amount: 'Amount (₹)',
  cashAmount: 'Cash Amount (₹)',
  upiAmount: 'UPI Amount (₹)',
  coverCharges: 'Cover Charges (₹)',
  paidStatus: 'Paid Status',
  codProductValue: 'COD Product Value (₹)',
  chargeableAmount: 'Chargeable Amount (₹)',
};

const NUMERIC_FIELDS = new Set([
  'weight',
  'volumetricWeight',
  'amount',
  'cashAmount',
  'upiAmount',
  'coverCharges',
  'codProductValue',
  'chargeableAmount',
]);

function normalizeForForm(doc) {
  return {
    date: doc.date ? formatDateForInput(doc.date) : '',
    voucherType: doc.voucherType || 'Normal',
    awbNumber: doc.awbNumber || '',
    courierPartner: doc.courierPartner || 'Franch Express',
    mode: doc.mode || 'Surface',
    nature: doc.nature || 'Non Doc',
    goodsDescription: doc.goodsDescription || '',
    weight: doc.weight ?? 0,
    volumetricWeight: doc.volumetricWeight ?? 0,

    consignorPhone: doc.consignorPhone || '',
    consignorName: doc.consignorName || '',
    consignorAddress1: doc.consignorAddress1 || '',
    consignorAddress2: doc.consignorAddress2 || '',
    consignorAddress3: doc.consignorAddress3 || '',
    consignorCity: doc.consignorCity || '',
    consignorPincode: doc.consignorPincode || '',
    consignorState: doc.consignorState || 'Tamil Nadu',
    consignorCountry: doc.consignorCountry || 'India',

    consigneePhone: doc.consigneePhone || '',
    consigneeName: doc.consigneeName || '',
    consigneeAddress1: doc.consigneeAddress1 || '',
    consigneeAddress2: doc.consigneeAddress2 || '',
    consigneeAddress3: doc.consigneeAddress3 || '',
    consigneeCity: doc.consigneeCity || '',
    consigneePincode: doc.consigneePincode || '',
    consigneeState: doc.consigneeState || 'Tamil Nadu',
    consigneeCountry: doc.consigneeCountry || 'India',

    paymentMode: doc.paymentMode || 'CASH',
    paymentDate: doc.paymentDate ? formatDateForInput(doc.paymentDate) : '',
    amount: doc.amount ?? 0,
    cashAmount: doc.cashAmount ?? 0,
    upiAmount: doc.upiAmount ?? 0,
    coverCharges: doc.coverCharges ?? 0,
    paidStatus: doc.paidStatus || 'Paid',
    codProductValue: doc.codProductValue ?? 0,
    chargeableAmount: doc.chargeableAmount ?? 0,
  };
}

export default function MasterEditPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { partnerNames } = useCourierPartners();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingMeta, setEditingMeta] = useState({ sno: '', deliveryStatus: '' });
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [originalForm, setOriginalForm] = useState(null);
  const [formData, setFormData] = useState(null);

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Strictly Admin / Super Admin only
  useEffect(() => {
    if (!authLoading && role && role !== 'admin' && role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  const getHeaders = useCallback(async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      toast('Please enter a search query', 'warning');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/consignments/search?q=${encodeURIComponent(trimmed)}`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to search consignments');
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleOpenMasterEdit = async (id) => {
    setLoadingRecord(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/consignments/${id}`, { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load consignment details');
      }
      const doc = await res.json();
      const normalized = normalizeForForm(doc);
      setEditingId(id);
      setEditingMeta({ sno: doc.sno || '', deliveryStatus: doc.deliveryStatus || '' });
      setOriginalForm(normalized);
      setFormData(normalized);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const nextVal = NUMERIC_FIELDS.has(name) ? (value === '' ? '' : Number(value)) : value;
      const next = { ...prev, [name]: nextVal };

      // Keep split cash + upi synced with amount
      if (name === 'cashAmount' || name === 'upiAmount') {
        if (next.paymentMode === 'CASH + UPI') {
          const cash = Number(name === 'cashAmount' ? nextVal : next.cashAmount) || 0;
          const upi = Number(name === 'upiAmount' ? nextVal : next.upiAmount) || 0;
          next.amount = cash + upi;
        }
      }

      // Keep chargeableAmount synced = amount + coverCharges
      if (name === 'amount' || name === 'coverCharges' || name === 'cashAmount' || name === 'upiAmount') {
        const amt = Number(next.amount) || 0;
        const cov = Number(next.coverCharges) || 0;
        next.chargeableAmount = amt + cov;
      }

      return next;
    });
  };

  // Compute field-level diff for confirmation modal
  const changedFields = React.useMemo(() => {
    if (!originalForm || !formData) return [];
    const diffs = [];
    for (const key of Object.keys(FIELD_LABELS)) {
      const oldVal = originalForm[key] ?? '';
      const newVal = formData[key] ?? '';
      if (String(oldVal) !== String(newVal)) {
        diffs.push({
          key,
          label: FIELD_LABELS[key],
          oldVal: oldVal === '' ? '(empty)' : String(oldVal),
          newVal: newVal === '' ? '(empty)' : String(newVal),
        });
      }
    }
    return diffs;
  }, [originalForm, formData]);

  const handleRequestSave = (e) => {
    e.preventDefault();
    if (changedFields.length === 0) {
      toast('No changes detected on this record.', 'info');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!editingId || !formData) return;
    setSaving(true);
    try {
      const headers = await getHeaders();
      const payload = { ...formData, masterEdit: true };
      for (const numKey of NUMERIC_FIELDS) {
        payload[numKey] = payload[numKey] === '' ? 0 : Number(payload[numKey]);
      }

      const res = await fetch(`/api/consignments/${editingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.error || 'Failed to save master changes');
      }

      // Update search results row in place
      setResults((prev) =>
        prev.map((item) => (item.id === editingId ? { ...item, ...updated } : item))
      );

      toast(`Master changes saved for ${updated.sno || updated.awbNumber}`, 'success');
      setIsConfirmOpen(false);
      setEditingId(null);
      setOriginalForm(null);
      setFormData(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (role !== 'admin' && role !== 'super_admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3">Verifying admin privileges...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Master Edit Editor View */}
      {editingId && formData ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setOriginalForm(null);
                  setFormData(null);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-fe-gray hover:text-fe-dark px-2.5 py-1.5 rounded-lg border border-fe-muted/30 bg-fe-bg/40"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-fe-dark font-heading">
                    Master Edit: {editingMeta.sno || 'Record'}
                  </h2>
                  {editingMeta.deliveryStatus && <Badge status={editingMeta.deliveryStatus} />}
                </div>
                <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Booking Fields Correction — all New Consignment fields are editable.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-fe-gray">
                {changedFields.length} field{changedFields.length === 1 ? '' : 's'} modified
              </span>
              <Button
                type="button"
                onClick={handleRequestSave}
                className="flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>

          <form onSubmit={handleRequestSave} className="space-y-5">
            {/* 1. Shipment Info */}
            <Card className="p-5 border border-fe-muted/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-fe-muted/15 pb-2.5">
                <Package className="h-4 w-4 text-fe-teal" />
                <h3 className="text-xs font-bold text-fe-dark uppercase tracking-wider">
                  1. Shipment Info
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Booking Date" name="date" type="date" value={formData.date} onChange={handleFieldChange} />
                <Select label="Voucher Type" name="voucherType" value={formData.voucherType} onChange={handleFieldChange} options={VOUCHER_TYPE_OPTIONS} />
                <Input label="AWB Number" name="awbNumber" value={formData.awbNumber} onChange={handleFieldChange} />
                <Select
                  label="Courier Partner"
                  name="courierPartner"
                  value={formData.courierPartner}
                  onChange={handleFieldChange}
                  options={
                    formData.courierPartner && !partnerNames.includes(formData.courierPartner)
                      ? [formData.courierPartner, ...partnerNames]
                      : partnerNames
                  }
                />
                <Select label="Mode" name="mode" value={formData.mode} onChange={handleFieldChange} options={MODE_OPTIONS} />
                <Select label="Nature" name="nature" value={formData.nature} onChange={handleFieldChange} options={NATURE_OPTIONS} />
                <Input label="Weight (kg)" name="weight" type="number" step="0.01" value={formData.weight} onChange={handleFieldChange} />
                <Input label="Volumetric Weight (kg)" name="volumetricWeight" type="number" step="0.01" value={formData.volumetricWeight} onChange={handleFieldChange} />
                <Input label="Goods Description" name="goodsDescription" value={formData.goodsDescription} onChange={handleFieldChange} />
              </div>
            </Card>

            {/* 2. Consignor Details (Sender) */}
            <Card className="p-5 border border-fe-muted/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-fe-muted/15 pb-2.5">
                <User className="h-4 w-4 text-fe-teal" />
                <h3 className="text-xs font-bold text-fe-dark uppercase tracking-wider">
                  2. Consignor Details (Sender)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Sender Phone" name="consignorPhone" value={formData.consignorPhone} onChange={handleFieldChange} />
                <Input label="Sender Name" name="consignorName" value={formData.consignorName} onChange={handleFieldChange} />
                <Input label="City" name="consignorCity" value={formData.consignorCity} onChange={handleFieldChange} />
                <Input label="Address Line 1" name="consignorAddress1" value={formData.consignorAddress1} onChange={handleFieldChange} />
                <Input label="Address Line 2" name="consignorAddress2" value={formData.consignorAddress2} onChange={handleFieldChange} />
                <Input label="Address Line 3" name="consignorAddress3" value={formData.consignorAddress3} onChange={handleFieldChange} />
                <Input label="Pincode" name="consignorPincode" value={formData.consignorPincode} onChange={handleFieldChange} />
                <Input label="State" name="consignorState" value={formData.consignorState} onChange={handleFieldChange} />
                <Input label="Country" name="consignorCountry" value={formData.consignorCountry} onChange={handleFieldChange} />
              </div>
            </Card>

            {/* 3. Consignee Details (Recipient) */}
            <Card className="p-5 border border-fe-muted/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-fe-muted/15 pb-2.5">
                <MapPin className="h-4 w-4 text-fe-teal" />
                <h3 className="text-xs font-bold text-fe-dark uppercase tracking-wider">
                  3. Consignee Details (Recipient)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Recipient Phone" name="consigneePhone" value={formData.consigneePhone} onChange={handleFieldChange} />
                <Input label="Recipient Name" name="consigneeName" value={formData.consigneeName} onChange={handleFieldChange} />
                <Input label="City" name="consigneeCity" value={formData.consigneeCity} onChange={handleFieldChange} />
                <Input label="Address Line 1" name="consigneeAddress1" value={formData.consigneeAddress1} onChange={handleFieldChange} />
                <Input label="Address Line 2" name="consigneeAddress2" value={formData.consigneeAddress2} onChange={handleFieldChange} />
                <Input label="Address Line 3" name="consigneeAddress3" value={formData.consigneeAddress3} onChange={handleFieldChange} />
                <Input label="Pincode" name="consigneePincode" value={formData.consigneePincode} onChange={handleFieldChange} />
                <Input label="State" name="consigneeState" value={formData.consigneeState} onChange={handleFieldChange} />
                <Input label="Country" name="consigneeCountry" value={formData.consigneeCountry} onChange={handleFieldChange} />
              </div>
            </Card>

            {/* 4. Payment & Billing */}
            <Card className="p-5 border border-fe-muted/20 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-fe-muted/15 pb-2.5">
                <CreditCard className="h-4 w-4 text-fe-teal" />
                <h3 className="text-xs font-bold text-fe-dark uppercase tracking-wider">
                  4. Payment & Billing
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="Payment Mode" name="paymentMode" value={formData.paymentMode} onChange={handleFieldChange} options={PAYMENT_MODE_OPTIONS} />
                <Select label="Paid Status" name="paidStatus" value={formData.paidStatus} onChange={handleFieldChange} options={PAID_STATUS_OPTIONS} />
                <Input label="Payment Date" name="paymentDate" type="date" value={formData.paymentDate} onChange={handleFieldChange} />
                <Input label="Amount (₹)" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleFieldChange} />
                {formData.paymentMode === 'CASH + UPI' && (
                  <>
                    <Input label="Cash Amount (₹)" name="cashAmount" type="number" step="0.01" value={formData.cashAmount} onChange={handleFieldChange} />
                    <Input label="UPI Amount (₹)" name="upiAmount" type="number" step="0.01" value={formData.upiAmount} onChange={handleFieldChange} />
                  </>
                )}
                <Input label="Cover Charges (₹)" name="coverCharges" type="number" step="0.01" value={formData.coverCharges} onChange={handleFieldChange} />
                {formData.paymentMode === 'COD' && (
                  <Input label="COD Product Value (₹)" name="codProductValue" type="number" step="0.01" value={formData.codProductValue} onChange={handleFieldChange} />
                )}
                <Input label="Chargeable Amount (₹)" name="chargeableAmount" type="number" step="0.01" value={formData.chargeableAmount} onChange={handleFieldChange} />
              </div>
            </Card>

            {/* Bottom Action Bar */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setOriginalForm(null);
                  setFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Master Changes
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* ── Search Consignment View ─────────────────────────────────────────── */
        <>
          <Card className="p-6 border border-fe-muted/10 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-fe-dark font-heading flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  Master Edit — Consignment Correction
                </h2>
                <p className="text-xs text-fe-gray font-sans mt-0.5">
                  Search any consignment by AWB number, SNO, Phone, Name, City, or State to correct booking fields.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-fe-gray" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., 48071025984, FE-0012, Ramesh, 9876543210, Avadi..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm font-sans bg-fe-bg/30 border border-fe-muted/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-fe-teal/30 focus:border-fe-teal transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-fe-gray hover:text-fe-dark"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={searching}
                  className="px-6 flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </Button>
              </div>
            </form>
          </Card>

          {(searching || loadingRecord) ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-fe-muted/10">
              <Spinner size="lg" />
              <p className="text-sm text-fe-gray font-sans mt-4">
                {loadingRecord ? 'Loading consignment record...' : 'Searching consignments...'}
              </p>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <Card className="p-12 text-center border border-fe-muted/10">
              <div className="h-12 w-12 bg-fe-bg rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-fe-gray" />
              </div>
              <h3 className="text-sm font-semibold text-fe-dark font-heading">No matching consignments found</h3>
              <p className="text-xs text-fe-gray font-sans mt-1 max-w-sm mx-auto">
                No records matched &ldquo;{searchQuery}&rdquo;. Try searching by exact AWB, SNO, phone number, or name.
              </p>
            </Card>
          ) : results.length > 0 ? (
            <Card className="border border-fe-muted/10 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-fe-muted/10 flex items-center justify-between bg-fe-bg/30">
                <span className="text-xs font-semibold text-fe-dark font-sans">
                  Found {results.length} matching {results.length === 1 ? 'consignment' : 'consignments'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-fe-muted/10 bg-fe-bg/50 text-[10px] font-bold text-fe-gray uppercase tracking-wider font-sans">
                      <th className="py-3 px-4">AWB / SNO</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Consignor</th>
                      <th className="py-3 px-4">Consignee</th>
                      <th className="py-3 px-4">Partner</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Master Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fe-muted/10 text-xs font-sans">
                    {results.map((item) => (
                      <tr key={item.id} className="hover:bg-fe-bg/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-fe-dark">{item.awbNumber || '—'}</div>
                          <div className="text-[11px] font-semibold text-fe-teal">{item.sno || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-fe-gray whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-fe-dark">{item.consignorName || '—'}</div>
                          <div className="text-[11px] text-fe-gray">{item.consignorPhone || ''}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-fe-dark">{item.consigneeName || '—'}</div>
                          <div className="text-[11px] text-fe-gray">
                            {[item.consigneeCity, item.consigneeState].filter(Boolean).join(', ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-fe-dark">{item.courierPartner || '—'}</td>
                        <td className="py-3 px-4 font-semibold text-fe-dark">
                          {formatCurrency(item.chargeableAmount ?? item.amount ?? 0)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={item.deliveryStatus} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenMasterEdit(item.id)}
                            className="inline-flex items-center gap-1.5 text-xs border-fe-teal text-fe-teal hover:bg-fe-teal hover:text-white"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </>
      )}

      {/* Confirmation Modal Before Saving Master Changes */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => !saving && setIsConfirmOpen(false)}
        title="Confirm Master Edit"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">You are about to update this consignment record.</p>
              <p className="mt-0.5 text-amber-700">
                Please review the {changedFields.length} modified field{changedFields.length === 1 ? '' : 's'} below before saving to the database.
              </p>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border border-fe-muted/25 rounded-lg divide-y divide-fe-muted/15">
            {changedFields.map((diff) => (
              <div key={diff.key} className="px-3.5 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-fe-dark">{diff.label}</span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 line-through max-w-[180px] truncate">
                    {diff.oldVal}
                  </span>
                  <span className="text-fe-gray">→</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold max-w-[180px] truncate">
                    {diff.newVal}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-fe-muted/20">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirmOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSave}
              loading={saving}
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm & Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
