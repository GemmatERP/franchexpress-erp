'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { MobileDrawer } from '../../components/layout/MobileDrawer';
import { Spinner } from '../../components/ui/Spinner';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [breadcrumbs, setBreadcrumbs] = useState(['FranchExpress', 'Dashboard']);

  // Compute page title and breadcrumbs based on pathname
  useEffect(() => {
    const paths = pathname.split('/').filter(Boolean); // e.g., ['dashboard', 'consignments', 'new']
    
    // Build breadcrumbs
    const crumbs = ['FranchExpress', ...paths.map(p => p.charAt(0).toUpperCase() + p.slice(1))];
    setBreadcrumbs(crumbs);

    // Build titles
    if (pathname === '/dashboard') {
      setPageTitle('Overview Dashboard');
    } else if (pathname === '/dashboard/consignments') {
      setPageTitle('Consignments Hub');
    } else if (pathname === '/dashboard/consignments/new') {
      setPageTitle('New Consignment Booking');
    } else if (pathname === '/dashboard/consignments/edit') {
      setPageTitle('Edit Consignment');
    } else if (pathname.startsWith('/dashboard/consignments/')) {
      setPageTitle('Consignment Details');
    } else if (pathname === '/dashboard/revenue') {
      setPageTitle('Revenue Analytics');
    } else if (pathname === '/dashboard/delivery') {
      setPageTitle('Delivery Agent Hub');
    } else if (pathname === '/dashboard/reports') {
      setPageTitle('Reports & Business Intelligence');
    } else if (pathname === '/dashboard/sync') {
      setPageTitle('Scheduled Auto-Sync Logs');
    } else if (pathname === '/dashboard/whatsapp') {
      setPageTitle('WhatsApp Messaging Hub');
    } else if (pathname === '/dashboard/search') {
      setPageTitle('Find Consignments');
    } else {
      setPageTitle('FranchExpress ERP');
    }

  }, [pathname]);

  // Auth Guard check
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-fe-bg">
        <Spinner size="lg" />
        <p className="text-xs text-fe-gray font-sans mt-3 animate-pulse">
          Verifying security clearance...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-fe-bg">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar className="hidden md:flex shrink-0" />

      {/* Mobile Sidebar Drawer */}
      <MobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[260px] min-w-0">
        {/* Top Header Bar */}
        <TopBar
          title={pageTitle}
          breadcrumbs={breadcrumbs}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main id="main-content" className="flex-1 p-6 md:p-8 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
