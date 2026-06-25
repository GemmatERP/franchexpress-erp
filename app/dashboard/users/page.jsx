'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Truck,
  UserCog,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User,
  ChevronRight,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Full dashboard access', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { value: 'employee', label: 'Employee', description: 'Booking & consignment views', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'delivery', label: 'Delivery Agent', description: 'Delivery view only', color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

const ROLE_BADGE = {
  super_admin: 'bg-rose-50 text-rose-700 border border-rose-200',
  admin: 'bg-violet-50 text-violet-700 border border-violet-200',
  employee: 'bg-blue-50 text-blue-700 border border-blue-200',
  delivery: 'bg-amber-50 text-amber-700 border border-amber-200',
};

function RoleBadge({ role }) {
  const labels = { super_admin: 'Super Admin', admin: 'Admin', employee: 'Employee', delivery: 'Delivery' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[role] || 'bg-gray-100 text-gray-600'}`}>
      {labels[role] || role}
    </span>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formResult, setFormResult] = useState(null); // { type: 'success'|'error', message }

  // Guard: only super_admin
  useEffect(() => {
    if (!loading && (!user || role !== 'super_admin')) {
      router.replace('/dashboard');
    }
  }, [user, role, loading, router]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    try {
      setUsersLoading(true);
      const token = await user.getIdToken();
      const res = await fetch('/api/users/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && role === 'super_admin') fetchUsers();
  }, [user, role, fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setFormResult({ type: 'success', message: `User "${form.name}" created successfully with role "${form.role}".` });
        setForm({ name: '', email: '', password: '', role: 'employee' });
        fetchUsers(); // Refresh the table
      } else {
        setFormResult({ type: 'error', message: data.error || 'Failed to create user' });
      }
    } catch (err) {
      setFormResult({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    employees: users.filter(u => u.role === 'employee').length,
    delivery: users.filter(u => u.role === 'delivery').length,
  };

  if (loading || role !== 'super_admin') return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-fe-dark flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-fe-teal" />
            User Management
          </h1>
          <p className="text-xs text-fe-gray mt-1 font-sans">
            Create and manage system users. Only you (Super Admin) can access this page.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          Super Admin Zone
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-fe-teal', bg: 'bg-fe-teal/10' },
          { label: 'Admins', value: stats.admins, icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Employees', value: stats.employees, icon: UserCog, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Delivery Agents', value: stats.delivery, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-fe-muted/30 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${stat.bg} shrink-0`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-fe-dark">{stat.value}</p>
              <p className="text-[11px] font-sans text-fe-gray">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* Create User Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-fe-muted/30 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-fe-muted/20 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-fe-teal/10">
                <UserPlus className="h-4 w-4 text-fe-teal" />
              </div>
              <div>
                <h2 className="text-sm font-heading font-bold text-fe-dark">Create New User</h2>
                <p className="text-[10px] text-fe-gray font-sans">Add a user to the system</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fe-gray/60" />
                  <input
                    id="user-name"
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="e.g. Ravi Kumar"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-sans border border-fe-muted/40 rounded-lg bg-fe-bg/30 focus:outline-none focus:ring-2 focus:ring-fe-teal/30 focus:border-fe-teal transition-all text-fe-dark placeholder:text-fe-gray/50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fe-gray/60" />
                  <input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    placeholder="user@fe.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-sans border border-fe-muted/40 rounded-lg bg-fe-bg/30 focus:outline-none focus:ring-2 focus:ring-fe-teal/30 focus:border-fe-teal transition-all text-fe-dark placeholder:text-fe-gray/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fe-gray/60" />
                  <input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-sm font-sans border border-fe-muted/40 rounded-lg bg-fe-bg/30 focus:outline-none focus:ring-2 focus:ring-fe-teal/30 focus:border-fe-teal transition-all text-fe-dark placeholder:text-fe-gray/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fe-gray/60 hover:text-fe-gray transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">Assign Role</label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        form.role === opt.value
                          ? `${opt.color} border-current`
                          : 'border-fe-muted/30 bg-white hover:bg-fe-bg/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={opt.value}
                        checked={form.role === opt.value}
                        onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                        className="accent-fe-teal"
                      />
                      <div>
                        <p className="text-xs font-bold font-sans">{opt.label}</p>
                        <p className="text-[10px] opacity-70 font-sans">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Result Banner */}
              {formResult && (
                <div className={`flex items-start gap-2.5 p-3 rounded-lg text-xs font-sans ${
                  formResult.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {formResult.type === 'success'
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  {formResult.message}
                </div>
              )}

              {/* Submit */}
              <button
                id="create-user-btn"
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-fe-teal text-white text-sm font-bold font-sans rounded-lg hover:bg-fe-teal/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating User...</>
                ) : (
                  <><UserPlus className="h-4 w-4" /> Create User</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Users Table */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-fe-muted/30 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-fe-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-fe-teal/10">
                  <Users className="h-4 w-4 text-fe-teal" />
                </div>
                <div>
                  <h2 className="text-sm font-heading font-bold text-fe-dark">System Users</h2>
                  <p className="text-[10px] text-fe-gray font-sans">{users.length} registered accounts</p>
                </div>
              </div>
              <button
                onClick={fetchUsers}
                disabled={usersLoading}
                className="text-[11px] font-bold text-fe-teal hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {usersLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-fe-gray">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-sans">Loading users...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-fe-gray">
                  <Users className="h-10 w-10 opacity-20 mb-3" />
                  <p className="text-sm font-sans">No users found</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-fe-muted/20 bg-fe-bg/30">
                      <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-bold text-fe-gray">User</th>
                      <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-bold text-fe-gray">Role</th>
                      <th className="px-5 py-3 text-[10px] uppercase tracking-wider font-bold text-fe-gray hidden md:table-cell">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fe-muted/15">
                    {users.map((u) => (
                      <tr key={u.uid} className="hover:bg-fe-bg/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-fe-teal/10 border border-fe-teal/20 flex items-center justify-center text-fe-teal text-xs font-bold font-heading shrink-0">
                              {(u.name || u.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-fe-dark font-sans truncate">{u.name || '—'}</p>
                              <p className="text-[10px] text-fe-gray font-mono truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-[10px] text-fe-gray font-sans">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
