'use client';

import React, { Suspense } from 'react';
import { ConsignmentForm } from '../../../../components/consignment/ConsignmentForm';
import { Spinner } from '../../../../components/ui/Spinner';

export default function NewConsignmentPage() {
  return (
    <Suspense fallback={
      <div className="h-96 flex flex-col items-center justify-center bg-white border border-fe-muted/30 rounded-xl">
        <Spinner size="lg" />
        <span className="text-xs text-fe-gray mt-2">Loading form modules...</span>
      </div>
    }>
      <ConsignmentForm />
    </Suspense>
  );
}
