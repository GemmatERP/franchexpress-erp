'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Truck, 
  FileBarChart, 
  LogOut,
  RefreshCw,
  Search,
  Coins,
  Package,
  MessageSquare,
  Users
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { getInitials } from '../../lib/utils';

export function Sidebar({ className = '' }) {
  const pathname = usePathname();
  const { role, profile, logout } = useAuth();

  // Define nav links with required roles
  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'super_admin', 'employee'],
    },
    {
      label: 'New Consignment',
      href: '/dashboard/consignments/new',
      icon: PackagePlus,
      roles: ['admin', 'super_admin', 'employee'],
    },
    {
      label: 'Revenue',
      href: '/dashboard/revenue',
      icon: Coins,
      roles: ['admin', 'super_admin'],
    },
    {
      label: 'Search Consignments',
      href: '/dashboard/search',
      icon: Search,
      roles: ['admin', 'super_admin', 'employee'],
    },
    {
      label: 'Consignments View',
      href: '/dashboard/consignments',
      icon: Package,
      roles: ['admin', 'super_admin', 'employee'],
    },
    {
      label: 'Delivery View',
      href: '/dashboard/delivery',
      icon: Truck,
      roles: ['admin', 'super_admin', 'delivery'],
    },
    {
      label: 'Reports & Export',
      href: '/dashboard/reports',
      icon: FileBarChart,
      roles: ['admin', 'super_admin', 'employee'],
    },
    {
      label: 'WhatsApp Logs',
      href: '/dashboard/whatsapp',
      icon: MessageSquare,
      roles: ['admin', 'super_admin'],
    },
    {
      label: 'Sync Logs',
      href: '/dashboard/sync',
      icon: RefreshCw,
      roles: ['admin', 'super_admin'],
    },
    {
      label: 'User Management',
      href: '/dashboard/users',
      icon: Users,
      roles: ['super_admin'],
    },
  ];


  // Filter items by current user's role
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  // For super_admin — also show admin-level items by treating them as admin
  // (super_admin inherits all admin routes since roles array includes 'super_admin' or 'admin')

  return (
    <aside className={`w-[260px] bg-white border-r border-fe-muted/30 flex flex-col h-screen fixed left-0 top-0 z-30 ${className}`}>
      <div className="h-20 flex items-center justify-center px-4 border-b border-fe-muted/20">
        <Link href="/dashboard" className="flex items-center justify-center w-full">
          <img 
            src="/Logo-GM-FE.png" 
            alt="FranchExpress Logo" 
            className="h-12 w-auto object-contain shrink-0" 
          />
        </Link>
      </div>



      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg font-sans transition-all group ${
                isActive
                  ? 'bg-fe-muted/40 text-fe-teal border-l-[4px] border-fe-teal pl-3 rounded-l-none'
                  : 'text-fe-gray hover:bg-fe-bg hover:text-fe-dark'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-fe-teal' : 'text-fe-gray group-hover:text-fe-dark'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Bar */}
      <div className="p-4 border-t border-fe-muted/20 bg-fe-bg/30">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-fe-muted/10 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-full bg-fe-teal/20 border border-fe-teal/10 flex items-center justify-center text-fe-teal font-heading font-semibold text-xs shrink-0">
              {getInitials(profile?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-fe-dark truncate leading-tight">
                {profile?.name || 'User'}
              </p>
              <Badge value={role} className="mt-0.5 text-[9px] px-1.5 py-0" />
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-fe-gray hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
