'use client';

import React from 'react';
import { Package, IndianRupee, CheckSquare, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function ReportsSummary({ consignments = [] }) {
  const totalRecords = consignments.length;
  
  // Calculate revenue
  const totalRevenue = consignments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  // Count delivered
  const deliveredCount = consignments.filter(item => item.deliveryStatus === 'Delivered').length;
  
  // Count pending (Transit, Out of Delivery, Holding at HUB, Reached Destination)
  const pendingCount = consignments.filter(item => 
    ['Booked', 'Processing', 'Processed', 'Pending', 'Transit', 'Reached Destination', 'Out of Delivery', 'Holding at HUB'].includes(item.deliveryStatus)
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-fe-muted/30 p-4 rounded-xl shadow-sm mt-6">
      {/* 1. Records */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="p-2 rounded-lg bg-fe-teal/10 text-fe-teal">
          <Package className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-sans">
            Records
          </p>
          <p className="text-sm font-bold text-fe-dark font-mono">
            {totalRecords} items
          </p>
        </div>
      </div>

      {/* 2. Total Revenue */}
      <div className="flex items-center gap-3 px-3 py-2 border-l border-fe-muted/15 max-md:border-none">
        <div className="p-2 rounded-lg bg-fe-green/20 text-green-700">
          <IndianRupee className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-sans">
            Total Revenue
          </p>
          <p className="text-sm font-bold text-fe-dark font-mono">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* 3. Delivered */}
      <div className="flex items-center gap-3 px-3 py-2 border-l border-fe-muted/15 max-md:border-none">
        <div className="p-2 rounded-lg bg-green-50 text-green-700 border border-green-200">
          <CheckSquare className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-sans">
            Delivered
          </p>
          <p className="text-sm font-bold text-fe-dark font-mono">
            {deliveredCount} items
          </p>
        </div>
      </div>

      {/* 4. Pending */}
      <div className="flex items-center gap-3 px-3 py-2 border-l border-fe-muted/15 max-md:border-none">
        <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-fe-gray uppercase tracking-wider font-sans">
            Pending
          </p>
          <p className="text-sm font-bold text-fe-dark font-mono">
            {pendingCount} items
          </p>
        </div>
      </div>
    </div>
  );
}
