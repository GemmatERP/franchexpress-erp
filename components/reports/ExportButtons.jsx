'use client';

import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { exportToCSV, exportToExcel } from '../../lib/export';

export function ExportButtons({ consignments = [], filename = 'FE-Report' }) {
  const isDisabled = consignments.length === 0;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        disabled={isDisabled}
        onClick={() => exportToCSV(consignments, filename)}
        className="flex items-center gap-2"
        aria-label="Export filtered data to CSV"
      >
        <FileText className="h-4 w-4" />
        <span>Export CSV</span>
      </Button>

      <Button
        variant="secondary"
        disabled={isDisabled}
        onClick={() => exportToExcel(consignments, filename)}
        className="flex items-center gap-2"
        aria-label="Export filtered data to Excel"
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>Export Excel</span>
      </Button>
    </div>
  );
}
