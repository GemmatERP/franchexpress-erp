'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Truck, 
  FileBarChart, 
  LogOut,
  X,
  RefreshCw,
  Search,
  Coins,
  Package
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { getInitials } from '../../lib/utils';

export function MobileDrawer({ isOpen, onClose }) {
  const pathname = usePathname();
  const { role, profile, logout } = useAuth();
  const drawerRef = useRef(null);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus trap for drawer
  useEffect(() => {
    if (!isOpen) return;

    const drawerElement = drawerRef.current;
    if (!drawerElement) return;

    const focusableSelector = 'button, [href], input, select, textarea';
    const focusableElements = drawerElement.querySelectorAll(focusableSelector);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement.focus();

    const handleTabTrap = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    drawerElement.addEventListener('keydown', handleTabTrap);
    return () => drawerElement.removeEventListener('keydown', handleTabTrap);
  }, [isOpen]);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'employee'],
    },
    {
      label: 'Consignments',
      href: '/dashboard/consignments',
      icon: Package,
      roles: ['admin', 'employee'],
    },
    {
      label: 'New Consignment',
      href: '/dashboard/consignments/new',
      icon: PackagePlus,
      roles: ['admin', 'employee'],
    },
    {
      label: 'Delivery View',
      href: '/dashboard/delivery',
      icon: Truck,
      roles: ['admin', 'delivery'],
    },
    {
      label: 'Reports & Export',
      href: '/dashboard/reports',
      icon: FileBarChart,
      roles: ['admin', 'employee'],
    },
    {
      label: 'Search Consignments',
      href: '/dashboard/search',
      icon: Search,
      roles: ['admin', 'employee'],
    },
    {
      label: 'Revenue',
      href: '/dashboard/revenue',
      icon: Coins,
      roles: ['admin'],
    },
    {
      label: 'Sync Logs',
      href: '/dashboard/sync',
      icon: RefreshCw,
      roles: ['admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />

          {/* Drawer content */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            role="dialog"
            aria-modal="true"
            className="relative bg-white w-[260px] h-full shadow-2xl flex flex-col z-10 border-r border-fe-muted/30"
          >
            <div className="h-20 flex items-center justify-center px-5 border-b border-fe-muted/20 relative">
              <Link href="/dashboard" onClick={onClose} className="flex items-center justify-center">
                <img 
                  src="/Logo-GM-FE.png" 
                  alt="FranchExpress Logo" 
                  className="h-12 w-auto object-contain shrink-0" 
                />
              </Link>

              <button
                onClick={onClose}
                className="absolute right-5 p-1 rounded-lg text-fe-gray hover:text-fe-dark hover:bg-fe-bg focus:outline-none focus:ring-2 focus:ring-fe-teal"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
              {visibleItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg font-sans transition-all group ${
                      isActive
                        ? 'bg-fe-muted/40 text-fe-teal border-l-[4px] border-fe-teal pl-3 rounded-l-none'
                        : 'text-fe-gray hover:bg-fe-bg hover:text-fe-dark'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-fe-teal' : 'text-fe-gray'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom User info */}
            <div className="p-4 border-t border-fe-muted/20 bg-fe-bg/40">
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-fe-muted/10 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-fe-teal/20 border border-fe-teal/10 flex items-center justify-center text-fe-teal font-heading font-semibold text-xs shrink-0">
                    {getInitials(profile?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-fe-dark truncate leading-tight">
                      {profile?.name || 'User'}
                    </p>
                    <Badge value={role} className="mt-0.5 text-[9px] px-1 py-0" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="p-1.5 rounded-lg text-fe-gray hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
