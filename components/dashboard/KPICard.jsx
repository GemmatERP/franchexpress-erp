'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

export function KPICard({
  title,
  value,
  isCurrency = false,
  icon: Icon,
  description,
  delay = 0,
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) return;

    const duration = 1200; // 1.2 seconds animation
    const incrementTime = Math.max(Math.floor(duration / end), 15);
    const step = Math.max(Math.ceil(end / (duration / incrementTime)), 1);

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  const formattedValue = isCurrency 
    ? formatCurrency(displayValue) 
    : displayValue.toLocaleString('en-IN');

  return (
    <Card animate delay={delay} hoverEffect className="relative overflow-hidden flex flex-col justify-between h-28">
      {/* Decorative colored stripe */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-fe-teal to-fe-green" />
      
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] font-bold text-fe-gray uppercase tracking-wider font-sans">
            {title}
          </p>
          <p className="text-2xl font-bold text-fe-dark font-heading mt-1">
            {formattedValue}
          </p>
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-fe-bg text-fe-teal border border-fe-muted/20">
            <Icon className="h-5 w-5 shrink-0" />
          </div>
        )}
      </div>

      {description && (
        <p className="text-[10px] font-medium text-fe-gray mt-2 font-sans">
          {description}
        </p>
      )}
    </Card>
  );
}
