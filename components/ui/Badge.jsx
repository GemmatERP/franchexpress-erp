'use client';

import React from 'react';

const statusMap = {
  // Consignment statuses
  'Transit': 'bg-amber-100 text-amber-700',
  'Reached Destination': 'bg-blue-100 text-blue-700',
  'Out of Delivery': 'bg-fe-teal/10 text-fe-teal border border-fe-teal/20',
  'Returned': 'bg-red-100 text-red-700',
  'Holding at HUB': 'bg-purple-100 text-purple-700',
  'Delivered': 'bg-fe-green/20 text-green-700',
  
  // Paid statuses
  'Paid': 'bg-green-100 text-green-800',
  'Not Paid': 'bg-red-100 text-red-800',

  // Role badges
  'admin': 'bg-red-100 text-red-800 border border-red-200',
  'employee': 'bg-blue-100 text-blue-800 border border-blue-200',
  'delivery': 'bg-fe-teal/20 text-[#2c7763] border border-[#a1ebd5]',
};

export function Badge({ value, className = '', children }) {
  const normalizedValue = value ? String(value).trim() : '';
  const styleClass = statusMap[normalizedValue] || 'bg-gray-100 text-gray-700';

  return (
    <span
      role="status"
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-sans ${styleClass} ${className}`}
    >
      {children || value}
    </span>
  );
}
