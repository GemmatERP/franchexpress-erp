'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function ReportsTable({ consignments = [], onEdit, onDelete }) {
  const { role } = useAuth();

  return (
    <div className="bg-white rounded-xl border border-fe-muted/30 shadow-sm overflow-hidden flex flex-col mt-6">
      <div className="overflow-x-auto w-full">
        {consignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg className="w-12 h-12 text-fe-gray opacity-30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs font-semibold text-fe-dark font-heading">
              No matching records found
            </p>
            <p className="text-[10px] text-fe-gray mt-0.5">
              Try modifying your date ranges or filters above.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-fe-muted/10 bg-fe-bg/40">
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">SNO</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">Date</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">AWB Number</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">Courier</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">Consignee</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">City</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">State</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">Status</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">Payment</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans text-right">Amount</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">Paid</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans text-center">Weight</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">Mode</th>
                <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans">Created By</th>
                {(onEdit || onDelete) && <th scope="col" className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-fe-gray font-sans text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-fe-muted/10">
              {consignments.map((item) => (
                <tr key={item.id} className="hover:bg-fe-bg/15 transition-colors">
                  <td className="px-6 py-3.5 text-xs font-bold text-fe-teal font-mono">{item.sno}</td>
                  <td className="px-6 py-3.5 text-xs text-fe-dark font-sans whitespace-nowrap">{formatDate(item.date)}</td>
                  <td className="px-6 py-3.5 text-xs text-fe-dark font-mono font-medium">{item.awbNumber}</td>
                  <td className="px-6 py-3.5 text-xs text-fe-dark font-sans">{item.courierPartner}</td>
                  <td className="px-6 py-3.5 text-xs text-fe-dark font-sans font-medium whitespace-nowrap">{item.consigneeName}</td>
                  <td className="px-6 py-3.5 text-xs text-fe-gray font-sans">{item.consigneeCity}</td>
                  <td className="px-6 py-3.5 text-xs text-fe-gray font-sans whitespace-nowrap">{item.consigneeState}</td>
                  <td className="px-6 py-3.5 text-xs font-sans">
                    <Badge value={item.deliveryStatus} />
                  </td>
                  <td className="px-6 py-3.5 text-xs text-fe-dark font-sans whitespace-nowrap">{item.paymentMode}</td>
                  <td className="px-6 py-3.5 text-xs text-fe-dark font-mono text-right font-semibold">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-6 py-3.5 text-xs font-sans">
                    <Badge value={item.paidStatus} />
                  </td>
                  <td className="px-6 py-3.5 text-xs text-fe-dark font-mono text-center">{item.weight || 0} kg</td>
                  <td className="px-6 py-3.5 text-xs text-fe-gray font-sans">{item.mode}</td>
                  <td className="px-6 py-3.5 text-xs text-fe-gray font-sans whitespace-nowrap">{item.createdByName || 'System'}</td>
                  
                  {/* Actions columns */}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 rounded text-fe-gray hover:text-fe-teal hover:bg-fe-bg focus:outline-none"
                            title="Edit"
                            aria-label={`Edit consignment ${item.sno}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDelete && role === 'admin' && (
                          <button
                            onClick={() => onDelete(item.id, item.sno)}
                            className="p-1 rounded text-fe-gray hover:text-red-500 hover:bg-red-50 focus:outline-none"
                            title="Delete"
                            aria-label={`Delete consignment ${item.sno}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
