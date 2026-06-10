'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';

export default function Home() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (role === 'delivery') {
          router.replace('/dashboard/delivery');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fe-bg">
      <Spinner size="lg" />
      <p className="text-xs text-fe-gray font-sans mt-3 animate-pulse">
        Directing to FranchExpress ERP...
      </p>
    </div>
  );
}
