'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { ExportReportModal } from './ExportReportModal';

export function ExportButtons({ fromDate, toDate, label = 'Export', variant = 'secondary' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
        aria-label="Open report export popup"
      >
        <Download className="h-4 w-4" />
        <span>{label}</span>
      </Button>

      <ExportReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultFromDate={fromDate}
        defaultToDate={toDate}
      />
    </>
  );
}
