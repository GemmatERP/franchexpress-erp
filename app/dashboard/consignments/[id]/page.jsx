'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer, 
  Edit3, 
  Package, 
  MapPin, 
  Phone, 
  Calendar, 
  FileText,
  User,
  CreditCard,
  CheckCircle,
  Truck
} from 'lucide-react';
import { useConsignments } from '../../../../hooks/useConsignments';
import { useTracking } from '../../../../hooks/useTracking';
import { useToast } from '../../../../hooks/useToast';
import { useConsignmentEdit } from '../../../../lib/ConsignmentEditContext';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Spinner } from '../../../../components/ui/Spinner';
import { Badge } from '../../../../components/ui/Badge';
import { TrackingTimeline } from '../../../../components/consignment/TrackingTimeline';
import { formatCurrency, formatDate } from '../../../../lib/utils';

export default function ConsignmentDetailPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();
  const { getConsignment, loading: consignmentLoading } = useConsignments();
  const { track, trackingData, loading: trackLoading } = useTracking();
  const { setEditConsignment } = useConsignmentEdit();

  const [consignment, setConsignment] = useState(null);

  const loadDetails = useCallback(async () => {
    try {
      const data = await getConsignment(id);
      setConsignment(data);
      if (data && data.awbNumber) {
        await track(data.awbNumber);
      }
    } catch (err) {
      toast('Failed to load consignment details: ' + err.message, 'error');
    }
  }, [id, getConsignment, track, toast]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handlePrint = () => {
    window.print();
  };

  if (consignmentLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-white border border-fe-muted/30 rounded-xl max-w-4xl mx-auto">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3">Loading details...</p>
      </div>
    );
  }

  if (!consignment) {
    return (
      <div className="p-8 text-center bg-white border border-fe-muted/30 rounded-xl max-w-4xl mx-auto font-sans">
        <p className="text-sm font-semibold text-fe-dark">Consignment not found</p>
        <Button 
          variant="primary" 
          onClick={() => router.push('/dashboard')} 
          className="mt-4 text-xs"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:p-0 print:space-y-4">
      {/* Top Navigation Bar / Print Actions */}
      <div className="flex justify-between items-center print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-fe-gray hover:text-fe-dark font-sans font-semibold focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Printer className="h-4 w-4" />
            Print Voucher
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditConsignment(consignment.id);
              router.push('/dashboard/consignments/edit');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Edit3 className="h-4 w-4" />
            Edit Details
          </Button>
        </div>
      </div>

      {/* Main Print Voucher Section */}
      <div className="bg-white border border-fe-muted/30 rounded-xl p-6 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-fe-muted/20 pb-4 gap-4 print:flex-row print:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-fe-teal font-mono tracking-wider uppercase">
                Consignment Voucher
              </span>
              <Badge value={consignment.deliveryStatus} />
            </div>
            <h2 className="text-xl font-bold font-heading text-fe-dark leading-tight">
              {consignment.sno}
            </h2>
            <p className="text-[11px] font-mono text-fe-gray">
              AWB: <span className="text-fe-dark font-semibold">{consignment.awbNumber}</span>
            </p>
          </div>

          <div className="text-left sm:text-right print:text-right text-xs text-fe-gray space-y-1 font-sans">
            <p>Booked Date: <span className="font-semibold text-fe-dark">{formatDate(consignment.date)}</span></p>
            <p>Desk Operator: <span className="font-semibold text-fe-dark">{consignment.createdByName || 'Desk Staff'}</span></p>
          </div>
        </div>

        {/* Address Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
          {/* Sender */}
          <div className="bg-fe-bg/25 border border-fe-muted/15 rounded-xl p-4 space-y-3 print:bg-transparent print:border">
            <h4 className="text-[10px] font-bold text-fe-gray uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-fe-teal shrink-0" />
              Consignor (Sender)
            </h4>
            <div className="space-y-1 font-sans text-xs">
              <p className="font-bold text-fe-dark">{consignment.consignorName}</p>
              <p className="text-fe-dark leading-relaxed">
                {consignment.consignorAddress1}<br />
                {consignment.consignorAddress2 && <>{consignment.consignorAddress2}<br /></>}
                {consignment.consignorAddress3 && <>{consignment.consignorAddress3}<br /></>}
                {consignment.consignorCity} - {consignment.consignorPincode}
              </p>
              <p className="font-mono text-fe-teal pt-1 flex items-center gap-1 font-semibold">
                <Phone className="h-3 w-3 shrink-0" />
                {consignment.consignorPhone || 'N/A'}
              </p>
            </div>
          </div>

          {/* Receiver */}
          <div className="bg-fe-bg/25 border border-fe-muted/15 rounded-xl p-4 space-y-3 print:bg-transparent print:border">
            <h4 className="text-[10px] font-bold text-fe-gray uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-fe-teal shrink-0" />
              Consignee (Receiver)
            </h4>
            <div className="space-y-1 font-sans text-xs">
              <p className="font-bold text-fe-dark">{consignment.consigneeName}</p>
              <p className="text-fe-dark leading-relaxed">
                {consignment.consigneeAddress1}<br />
                {consignment.consigneeAddress2 && <>{consignment.consigneeAddress2}<br /></>}
                {consignment.consigneeAddress3 && <>{consignment.consigneeAddress3}<br /></>}
                {consignment.consigneeCity} - {consignment.consigneePincode}, {consignment.consigneeState || 'Tamil Nadu'}
              </p>
              <p className="font-mono text-fe-teal pt-1 flex items-center gap-1 font-semibold">
                <Phone className="h-3 w-3 shrink-0" />
                {consignment.consigneePhone || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Transit & Package specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-b border-fe-muted/20 py-6 print:grid-cols-3 print:py-4">
          <div className="space-y-1 font-sans text-xs">
            <p className="text-[10px] uppercase font-bold text-fe-gray tracking-wider">Logistics Routing</p>
            <p className="font-semibold text-fe-dark mt-1">Partner: {consignment.courierPartner}</p>
            <p className="text-fe-gray">Mode: {consignment.mode}</p>
          </div>
          <div className="space-y-1 font-sans text-xs">
            <p className="text-[10px] uppercase font-bold text-fe-gray tracking-wider">Consignment Specs</p>
            <p className="font-semibold text-fe-dark mt-1">Nature: {consignment.nature} ({consignment.voucherType})</p>
            <p className="text-fe-gray">Weight: {consignment.weight} kg (Volumetric: {consignment.volumetricWeight} kg)</p>
          </div>
          <div className="space-y-1 font-sans text-xs">
            <p className="text-[10px] uppercase font-bold text-fe-gray tracking-wider">Goods Description</p>
            <p className="text-fe-dark font-medium mt-1 italic">
              {consignment.goodsDescription || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Billing & Financial Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 print:grid-cols-3">
          <div className="space-y-1 font-sans text-xs">
            <p className="text-[10px] uppercase font-bold text-fe-gray tracking-wider">Payment Details</p>
            <p className="font-semibold text-fe-dark mt-1 flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-fe-gray" />
              Mode: {consignment.paymentMode}
            </p>
            {consignment.paymentMode === 'CASH + UPI' && (
              <p className="text-[10px] text-fe-gray font-mono">
                (Cash: {formatCurrency(consignment.cashAmount || 0)} / UPI: {formatCurrency(consignment.upiAmount || 0)})
              </p>
            )}
            <p className="text-fe-gray">Status: {consignment.paidStatus}</p>
          </div>
          <div className="space-y-1 font-sans text-xs">
            <p className="text-[10px] uppercase font-bold text-fe-gray tracking-wider">Amount Vouchers</p>
            <p className="font-bold text-fe-dark text-sm mt-1">{formatCurrency(consignment.amount)}</p>
            <p className="text-fe-gray">Cover charges: {formatCurrency(consignment.coverCharges)}</p>
          </div>
          <div className="space-y-1 font-sans text-xs">
            <p className="text-[10px] uppercase font-bold text-fe-gray tracking-wider">Total Chargeable</p>
            <p className="font-bold text-fe-teal text-base mt-1">{formatCurrency(consignment.chargeableAmount)}</p>
            {consignment.paymentDate && (
              <p className="text-fe-gray text-[10px]">Settled: {formatDate(consignment.paymentDate)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Tracking Timeline (Only visible in screen UI, hidden in print layouts) */}
      <div className="print:hidden">
        {trackLoading ? (
          <div className="h-48 flex flex-col items-center justify-center bg-white border border-fe-muted/30 rounded-xl">
            <Spinner size="md" />
            <p className="text-xs text-fe-gray font-sans mt-3">Fetching live network updates...</p>
          </div>
        ) : (
          <TrackingTimeline trackingData={trackingData} />
        )}
      </div>

      {/* Global Print Styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border {
            border: 1px solid #d1d5db !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:py-4 {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
          .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .print\\:flex-row {
            flex-direction: row !important;
          }
          .print\\:justify-between {
            justify-content: space-between !important;
          }
          .print\\:text-right {
            text-align: right !important;
          }
          /* Target our printable container */
          main, div.max-w-5xl, div.max-w-5xl * {
            visibility: visible;
          }
          /* Absolute position print block to fit page top */
          div.max-w-5xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
