'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { Clock, Eye } from 'lucide-react';

export function PendingTable({ consignments = [], onView }) {
  // Helper to calculate days pending
  const getDaysPending = (dateValue) => {
    if (!dateValue) return 0;
    let d = dateValue;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      d = dateValue.toDate();
    } else {
      d = new Date(dateValue);
    }
    if (isNaN(d.getTime())) return 0;
    
    const diffTime = Math.abs(new Date() - d);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white rounded-xl border border-fe-muted/30 shadow-sm overflow-hidden flex flex-col mt-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-fe-muted/20 flex justify-between items-center bg-white">
        <h3 className="text-sm font-bold text-fe-dark font-heading">
          Pending Consignments
        </h3>
        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-mono">
          {consignments.length} pending
        </span>
      </div>

      {/* Card List Feed */}
      <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
        {consignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 bg-fe-bg text-fe-gray rounded-full mb-3 border border-fe-muted/30">
              <Clock className="h-6 w-6 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-fe-dark font-heading">
              No pending consignments
            </p>
            <p className="text-[10px] text-fe-gray mt-0.5">
              All consignments have been successfully delivered or returned.
            </p>
          </div>
        ) : (
          consignments.map((item) => {
            const days = getDaysPending(item.date);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-fe-muted/20 hover:border-fe-teal/30 hover:shadow-sm transition-all bg-fe-bg/10 gap-4"
              >
                {/* Left Side: Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-xs font-bold text-fe-teal font-mono">{item.sno}</span>
                      <span className="text-[10px] text-fe-gray font-mono truncate max-w-[120px]" title="AWB Number">
                        ({item.awbNumber})
                      </span>
                    </div>

                    <p className="text-xs text-fe-dark font-sans font-semibold mt-1 truncate">
                      {item.consigneeName} <span className="text-fe-gray font-normal">({item.consigneeCity})</span>
                    </p>

                    <p className="text-[10px] text-fe-gray font-sans mt-0.5">
                      Carrier: {item.courierPartner}
                    </p>
                  </div>
                </div>

                {/* Right Side: Status Badge, Pending Age & View Button */}
                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  <Badge value={item.deliveryStatus} className="text-[9px]" />
                  
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                    days > 5 ? 'bg-red-50 text-red-700' : days > 2 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {days} day{days !== 1 && 's'} pending
                  </span>

                  {onView && (
                    <button
                      onClick={() => onView(item)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-fe-teal hover:underline focus:outline-none"
                      aria-label={`View details of consignment ${item.sno}`}
                    >
                      <Eye className="h-3 w-3" />
                      View Details
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
