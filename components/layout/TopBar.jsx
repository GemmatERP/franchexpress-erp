'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, X, User, Mail, Phone, Save, Camera } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { formatDate, getInitials } from '../../lib/utils';

function ProfileModal({ isOpen, onClose }) {
  const { profile, role } = useAuth();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    designation: profile?.designation || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const modalRef = useRef(null);

  // Sync form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
        designation: profile.designation || '',
      });
    }
  }, [profile]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save with 600ms delay
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-fe-muted/30 overflow-hidden animate-in"
        style={{ animation: 'modalSlideIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-fe-teal/10 to-fe-teal/5 px-6 py-5 border-b border-fe-muted/20">
          <div className="flex items-center justify-between">
            <h2 id="profile-modal-title" className="text-base font-bold text-fe-dark font-heading">
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-fe-gray hover:text-fe-dark hover:bg-fe-bg transition-colors focus:outline-none focus:ring-2 focus:ring-fe-teal"
              aria-label="Close profile editor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Avatar Section */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-fe-teal/20 border-2 border-fe-teal/30 flex items-center justify-center text-fe-teal font-heading font-bold text-xl shadow-sm">
                {getInitials(formData.name) || <User className="h-7 w-7" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-fe-dark font-heading">{formData.name || 'Your Name'}</p>
              <Badge value={role} className="mt-1 text-[9px] px-1.5 py-0" />
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-fe-gray mb-1.5 font-sans">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fe-gray" />
              <input
                id="profile-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-fe-muted/40 rounded-lg bg-fe-bg/40 text-fe-dark placeholder-fe-gray/60 focus:outline-none focus:ring-2 focus:ring-fe-teal/40 focus:border-fe-teal transition-colors font-sans"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="profile-email" className="block text-xs font-semibold text-fe-gray mb-1.5 font-sans">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fe-gray" />
              <input
                id="profile-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-fe-muted/40 rounded-lg bg-fe-bg/40 text-fe-dark placeholder-fe-gray/60 focus:outline-none focus:ring-2 focus:ring-fe-teal/40 focus:border-fe-teal transition-colors font-sans"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="profile-phone" className="block text-xs font-semibold text-fe-gray mb-1.5 font-sans">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fe-gray" />
              <input
                id="profile-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-fe-muted/40 rounded-lg bg-fe-bg/40 text-fe-dark placeholder-fe-gray/60 focus:outline-none focus:ring-2 focus:ring-fe-teal/40 focus:border-fe-teal transition-colors font-sans"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="profile-department" className="block text-xs font-semibold text-fe-gray mb-1.5 font-sans">
              Department
            </label>
            <input
              id="profile-department"
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. Operations, Accounts"
              className="w-full px-3 py-2.5 text-sm border border-fe-muted/40 rounded-lg bg-fe-bg/40 text-fe-dark placeholder-fe-gray/60 focus:outline-none focus:ring-2 focus:ring-fe-teal/40 focus:border-fe-teal transition-colors font-sans"
            />
          </div>

          {/* Designation */}
          <div>
            <label htmlFor="profile-designation" className="block text-xs font-semibold text-fe-gray mb-1.5 font-sans">
              Designation
            </label>
            <input
              id="profile-designation"
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Branch Manager, Senior Executive"
              className="w-full px-3 py-2.5 text-sm border border-fe-muted/40 rounded-lg bg-fe-bg/40 text-fe-dark placeholder-fe-gray/60 focus:outline-none focus:ring-2 focus:ring-fe-teal/40 focus:border-fe-teal transition-colors font-sans"
            />
          </div>

          {/* Save Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold font-sans transition-all focus:outline-none focus:ring-2 focus:ring-fe-teal/50 ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-fe-teal text-white hover:bg-fe-teal/90 active:scale-[0.98]'
              } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving…
                </>
              ) : saved ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function TopBar({ title, onOpenMenu, breadcrumbs = [] }) {
  const { profile, role } = useAuth();
  const todayStr = formatDate(new Date());
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
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

        {/* Right side: Date + Notification Bell + Profile Avatar */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1 text-xs font-semibold text-fe-gray bg-fe-bg px-3 py-1.5 rounded-lg border border-fe-muted/30 font-mono">
            {todayStr}
          </div>

          {/* Notification Bell */}
          <button
            className="p-2 rounded-lg text-fe-gray hover:text-fe-dark hover:bg-fe-bg transition-colors relative focus:outline-none focus:ring-2 focus:ring-fe-teal"
            aria-label="View notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* Profile Avatar Button */}
          <button
            id="profile-avatar-btn"
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 pl-4 border-l border-fe-muted/30 focus:outline-none group"
            aria-label="Edit profile"
            title="Edit Profile"
          >
            {/* Hidden name on small screens, visible on sm+ */}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-fe-dark leading-none group-hover:text-fe-teal transition-colors">
                {profile?.name || 'User'}
              </p>
              <Badge value={role} className="mt-1 text-[9px] px-1.5 py-0" />
            </div>
            {/* Avatar circle */}
            <div className="h-8 w-8 rounded-full bg-fe-teal/20 border-2 border-fe-teal/30 flex items-center justify-center text-fe-teal font-heading font-bold text-xs shrink-0 group-hover:border-fe-teal group-hover:bg-fe-teal/30 transition-all">
              {getInitials(profile?.name) || <User className="h-4 w-4" />}
            </div>
          </button>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
