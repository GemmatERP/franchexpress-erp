'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Package, Eye } from 'lucide-react';

export function TodayTable({ consignments = [], onView }) {
  return (
    <div className="bg-white rounded-xl border border-fe-muted/30 shadow-sm overflow-hidden flex flex-col mt-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-fe-muted/20 flex justify-between items-center bg-white">
        <h3 className="text-sm font-bold text-fe-dark font-heading">
          Today's Consignments
        </h3>
        <span className="text-[11px] font-bold text-fe-teal bg-fe-teal/10 px-2 py-0.5 rounded-full font-mono">
          {consignments.length} booked
        </span>
      </div>

      {/* Card List Feed */}
      <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
        {consignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 bg-fe-bg text-fe-gray rounded-full mb-3 border border-fe-muted/30">
              <Package className="h-6 w-6 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-fe-dark font-heading">
              No consignments booked today
            </p>
            <p className="text-[10px] text-fe-gray mt-0.5">
              Go to the New Consignment page to book shipments.
            </p>
          </div>
        ) : (
          consignments.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-xl border border-fe-muted/20 hover:border-fe-teal/30 hover:shadow-sm transition-all bg-fe-bg/10 gap-4"
            >
              {/* Left Side: Icon & Courier details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-fe-teal/10 text-fe-teal flex items-center justify-center shrink-0">
                  <Package className="h-4.5 w-4.5" />
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
                    {item.courierPartner} · {item.mode}
                  </p>
                </div>
              </div>

              {/* Right Side: Status Badge, Amount & View Button */}
              <div className="flex flex-col items-end shrink-0 gap-1.5">
                <Badge value={item.deliveryStatus} className="text-[9px]" />
                <span className="text-xs font-bold text-fe-dark font-mono">
                  {formatCurrency(item.amount)}
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
          ))
        )}
      </div>
    </div>
  );
}
