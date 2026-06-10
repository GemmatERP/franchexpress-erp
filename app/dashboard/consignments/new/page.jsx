'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConsignmentForm } from '../../../../components/consignment/ConsignmentForm';
import { useConsignments } from '../../../../hooks/useConsignments';
import { Spinner } from '../../../../components/ui/Spinner';
import { useToast } from '../../../../hooks/useToast';

function NewConsignmentFormWrapper() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { getConsignment } = useConsignments();
  const { toast } = useToast();
  
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      getConsignment(editId)
        .then((data) => {
          setInitialData(data);
        })
        .catch((err) => {
          toast('Failed to load consignment for editing: ' + err.message, 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setInitialData(null);
    }
  }, [editId, getConsignment, toast]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-white border border-fe-muted/30 rounded-xl">
        <Spinner size="lg" />
        <span className="text-xs text-fe-gray mt-2">Loading consignment data...</span>
      </div>
    );
  }

  return <ConsignmentForm initialData={initialData} id={editId} />;
}

export default function NewConsignmentPage() {
  return (
    <Suspense fallback={
      <div className="h-96 flex flex-col items-center justify-center bg-white border border-fe-muted/30 rounded-xl">
        <Spinner size="lg" />
        <span className="text-xs text-fe-gray mt-2">Loading form modules...</span>
      </div>
    }>
      <NewConsignmentFormWrapper />
    </Suspense>
  );
}
