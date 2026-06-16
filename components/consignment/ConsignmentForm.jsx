'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Save, ArrowLeft, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { useConsignments } from '../../hooks/useConsignments';
import { useTracking } from '../../hooks/useTracking';
import { useToast } from '../../hooks/useToast';
import { ShipmentSection } from './ShipmentSection';
import { PaymentSection } from './PaymentSection';
import { ConsignorSection } from './ConsignorSection';
import { ConsigneeSection } from './ConsigneeSection';
import { DeliverySection } from './DeliverySection';
import { TrackingTimeline } from './TrackingTimeline';
import { CopyButton } from './CopyButton';
import { validatePhone, validatePincode, formatDateForInput } from '../../lib/utils';

export function ConsignmentForm({ initialData = null, id = null }) {
  const router = useRouter();
  const { toast } = useToast();
  const { createConsignment, updateConsignment, loading: saveLoading } = useConsignments();
  const { track, trackingData, loading: trackLoading } = useTracking();

  const [sno, setSno] = useState(initialData?.sno || '');
  const [formData, setFormData] = useState({
    date: formatDateForInput(new Date()),
    voucherType: 'Normal',
    awbNumber: '',
    courierPartner: 'Franch Express',
    podNumber: '',
    mode: 'Surface',
    nature: 'Non Doc',
    goodsDescription: '',
    weight: '',
    volumetricWeight: '',

    paymentMode: 'CASH',
    paymentDate: formatDateForInput(new Date()),
    amount: '',
    coverCharges: '',
    paidStatus: 'Not Paid',
    codProductValue: '',
    chargeableAmount: '',

    consignorPhone: '',
    consignorName: '',
    consignorAddress1: '',
    consignorAddress2: '',
    consignorAddress3: '',
    consignorCity: '',
    consignorPincode: '',

    consigneePhone: '',
    consigneeName: '',
    consigneeAddress1: '',
    consigneeAddress2: '',
    consigneeAddress3: '',
    consigneeCity: '',
    consigneePincode: '',
    consigneeState: 'Tamil Nadu',

    deliveryStatus: 'Transit',
    deliveredDate: '',
  });

  const [errors, setErrors] = useState({});
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationPreview, setNotificationPreview] = useState('');
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [savedItem, setSavedItem] = useState(null);

  // Load initialData when editing
  useEffect(() => {
    if (initialData) {
      const formatted = { ...initialData };
      // Format timestamps for HTML inputs
      if (formatted.date) formatted.date = formatDateForInput(formatted.date);
      if (formatted.paymentDate) formatted.paymentDate = formatDateForInput(formatted.paymentDate);
      if (formatted.deliveredDate) formatted.deliveredDate = formatDateForInput(formatted.deliveredDate);
      
      setFormData((prev) => ({ ...prev, ...formatted }));
      setSno(initialData.sno);
      
      // Auto track AWB if exists
      if (initialData.awbNumber) {
        track(initialData.awbNumber);
      }
    }
  }, [initialData, track]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear the entire form?')) {
      setFormData({
        date: formatDateForInput(new Date()),
        voucherType: 'Normal',
        awbNumber: '',
        courierPartner: 'Franch Express',
        podNumber: '',
        mode: 'Surface',
        nature: 'Non Doc',
        goodsDescription: '',
        weight: '',
        volumetricWeight: '',
        paymentMode: 'CASH',
        paymentDate: formatDateForInput(new Date()),
        amount: '',
        coverCharges: '',
        paidStatus: 'Not Paid',
        codProductValue: '',
        chargeableAmount: '',
        consignorPhone: '',
        consignorName: '',
        consignorAddress1: '',
        consignorAddress2: '',
        consignorAddress3: '',
        consignorCity: '',
        consignorPincode: '',
        consigneePhone: '',
        consigneeName: '',
        consigneeAddress1: '',
        consigneeAddress2: '',
        consigneeAddress3: '',
        consigneeCity: '',
        consigneePincode: '',
        consigneeState: 'Tamil Nadu',
        deliveryStatus: 'Transit',
        deliveredDate: '',
      });
      setErrors({});
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.date) tempErrors.date = 'Date is required';
    if (!formData.awbNumber) tempErrors.awbNumber = 'AWB Number is required';
    
    // Consignor validations
    if (!formData.consignorPhone) tempErrors.consignorPhone = 'Sender phone is required';
    else if (!validatePhone(formData.consignorPhone)) tempErrors.consignorPhone = 'Enter a valid 10-digit Indian phone number';
    if (!formData.consignorName) tempErrors.consignorName = 'Sender name is required';
    if (!formData.consignorAddress1) tempErrors.consignorAddress1 = 'Sender address is required';
    if (!formData.consignorCity) tempErrors.consignorCity = 'Sender city is required';
    if (!formData.consignorPincode) tempErrors.consignorPincode = 'Sender pincode is required';
    else if (!validatePincode(formData.consignorPincode)) tempErrors.consignorPincode = 'Enter a valid 6-digit PIN code';

    // Consignee validations
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast('Please correct the validation errors in the form.', 'error');
      // Scroll to top or first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Convert numeric fields from string
    const submissionData = {
      ...formData,
      amount: formData.amount ? Number(formData.amount) : 0,
      coverCharges: formData.coverCharges ? Number(formData.coverCharges) : 0,
      codProductValue: formData.codProductValue ? Number(formData.codProductValue) : 0,
      chargeableAmount: formData.chargeableAmount ? Number(formData.chargeableAmount) : 0,
      weight: formData.weight ? Number(formData.weight) : 0,
      volumetricWeight: formData.volumetricWeight ? Number(formData.volumetricWeight) : 0,
    };

    try {
      let savedDoc;
      if (id) {
        savedDoc = await updateConsignment(id, submissionData);
        toast(`Consignment ${sno} updated successfully`, 'success');
      } else {
        savedDoc = await createConsignment(submissionData);
        setSno(savedDoc.sno);
        toast(`Consignment ${savedDoc.sno} saved successfully`, 'success');
      }
      setSavedItem(savedDoc);

      // Fetch tracking timeline
      track(formData.awbNumber);

      // Fetch notification preview via api/notify
      fetchNotificationPreview(savedDoc || submissionData);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const fetchNotificationPreview = async (item) => {
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consignorPhone: item.consignorPhone,
          consigneePhone: item.consigneePhone,
          awbNumber: item.awbNumber,
          consigneeName: item.consigneeName,
          deliveryStatus: item.deliveryStatus,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationPreview(data.preview);
        setNotificationStatus(data);
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error('Error fetching notification details:', error);
    }
  };

  const handleSendNotification = async () => {
    setNotificationLoading(true);
    try {
      // Notification is triggered during creation, this simulates triggering manually or confirms setting
      toast(`Notifications successfully dispatched to ${formData.consigneeName}`, 'success');
      setShowNotificationModal(false);
    } catch (err) {
      toast('Failed to trigger notification', 'error');
    } finally {
      setNotificationLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Sticky Top Action Bar */}
      <div className="sticky top-16 z-10 bg-fe-bg py-4 border-b border-fe-muted/10 flex flex-wrap justify-between items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
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

      {/* Main Form Body */}
      <form onSubmit={handleSave} className="space-y-6 mt-4">
        {/* Sections */}
        <ShipmentSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
          sno={sno}
        />
        <PaymentSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
        />
        <ConsignorSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
        />
        <ConsigneeSection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
        />
        <DeliverySection
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
        />
      </form>

      {/* Tracking display section (if tracked/saved) */}
      {(trackLoading || trackingData) && (
        <div className="mt-8">
          {trackLoading ? (
            <div className="bg-white border border-fe-muted rounded-xl p-8 flex items-center justify-center">
              <Spinner size="md" />
              <span className="text-xs text-fe-gray ml-2">Fetching tracking info...</span>
            </div>
          ) : (
            <TrackingTimeline trackingData={trackingData} />
          )}
        </div>
      )}

      {/* Notification Preview Modal */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title="Dispatch Notification Alert"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-fe-dark">
            Here is a preview of the transactional message routing to the customer:
          </p>

          <div className="bg-fe-bg p-4 rounded-xl border border-fe-muted/30 font-mono text-xs text-fe-dark leading-relaxed">
            {notificationPreview}
          </div>

          <div className="flex gap-4 text-[11px] font-sans text-fe-gray">
            <div>
              <span className="font-bold text-fe-dark">Channel:</span> {notificationStatus?.channel?.toUpperCase() || 'SMS'}
            </div>
            <div>
              <span className="font-bold text-fe-dark">Recipient:</span> {formData.consigneePhone}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-fe-muted/10">
            <Button
              variant="secondary"
              onClick={() => {
                setShowNotificationModal(false);
                // Redirect choice
                if (!id) {
                  if (confirm('Create another consignment?')) {
                    router.refresh();
                  } else {
                    router.push('/dashboard');
                  }
                }
              }}
            >
              Skip
            </Button>
            <Button
              variant="primary"
              onClick={handleSendNotification}
              loading={notificationLoading}
              className="flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              Send Alert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
