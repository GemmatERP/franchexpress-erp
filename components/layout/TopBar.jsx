'use client';

import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

export function TopBar({ title, onOpenMenu, breadcrumbs = [] }) {
  const { profile, role } = useAuth();
  const todayStr = formatDate(new Date());

  return (
    <header className="h-16 border-b border-fe-muted/20 bg-white flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      {/* Left side: Hamburger (mobile) & Title / Breadcrumbs */}
      <div className="flex items-center gap-4">
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            className="md:hidden p-2 rounded-lg text-fe-dark hover:bg-fe-bg focus:outline-none focus:ring-2 focus:ring-fe-teal"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex flex-col">
          {breadcrumbs.length > 0 ? (
            <nav className="hidden sm:flex items-center gap-1.5 text-[11px] text-fe-gray font-medium font-sans">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  <span>{bc}</span>
                  {idx < breadcrumbs.length - 1 && <span className="opacity-60">/</span>}
                </React.Fragment>
              ))}
            </nav>
          ) : (
            <nav className="hidden sm:block text-[11px] text-fe-gray font-medium font-sans">
              Franchexpress ERP
            </nav>
          )}
          <h1 className="text-base font-bold text-fe-dark font-heading leading-tight">
            {title || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right side: Date + Notification Bell + User Profile */}
      <div className="flex items-center gap-5">
        <div className="hidden lg:flex items-center gap-1 text-xs font-semibold text-fe-gray bg-fe-bg px-3 py-1.5 rounded-lg border border-fe-muted/30 font-mono">
          {todayStr}
        </div>

        {/* Mock Notification Bell */}
        <button
          className="p-2 rounded-lg text-fe-gray hover:text-fe-dark hover:bg-fe-bg transition-colors relative focus:outline-none focus:ring-2 focus:ring-fe-teal"
          aria-label="View notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User Card */}
        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-fe-muted/30">
          <div className="text-right">
            <p className="text-xs font-bold text-fe-dark leading-none">
              {profile?.name || 'User'}
            </p>
            <Badge value={role} className="mt-1 text-[9px] px-1.5 py-0" />
          </div>
        </div>
      </div>
    </header>
  );
}
