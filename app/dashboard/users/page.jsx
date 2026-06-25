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
  Pencil,
  Trash2,
  X,
  Save,
  KeyRound,
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

// ── Password Strength Indicator ───────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const textColors = ['text-red-500', 'text-amber-500', 'text-blue-500', 'text-green-600'];
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score-1] : 'bg-fe-muted/30'}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[10px] font-semibold font-sans ${textColors[score-1]}`}>{labels[score-1]} password</p>
      )}
    </div>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ user: resetUser, getToken, onClose }) {
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (newPw !== confirmPw) {
      setResult({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/${resetUser.uid}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', message: `Password for ${resetUser.name || resetUser.email} has been reset successfully.` });
        setNewPw(''); setConfirmPw('');
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to reset password.' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const mismatch = confirmPw && confirmPw !== newPw;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-fe-muted/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fe-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
              <KeyRound className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-fe-dark">Reset Password</h3>
              <p className="text-[10px] text-fe-gray font-sans truncate max-w-[220px]">
                {resetUser.name || resetUser.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-fe-gray hover:bg-fe-bg hover:text-fe-dark transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
          <KeyRound className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-xs font-sans">
            As Super Admin you can set a new password directly — the user's current password is not required.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fe-gray/60" />
              <input
                id="reset-new-password"
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setResult(null); }}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="w-full pl-9 pr-10 py-2.5 text-sm font-sans border border-fe-muted/40 rounded-lg bg-fe-bg/30 text-fe-dark placeholder:text-fe-gray/50 focus:outline-none focus:ring-2 focus:ring-fe-teal/30 focus:border-fe-teal transition-all"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fe-gray/60 hover:text-fe-gray transition-colors">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={newPw} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fe-gray/60" />
              <input
                id="reset-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setResult(null); }}
                required
                placeholder="Re-enter new password"
                className={`w-full pl-9 pr-10 py-2.5 text-sm font-sans border rounded-lg bg-fe-bg/30 text-fe-dark placeholder:text-fe-gray/50 focus:outline-none focus:ring-2 transition-all ${
                  mismatch
                    ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                    : 'border-fe-muted/40 focus:ring-fe-teal/30 focus:border-fe-teal'
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fe-gray/60 hover:text-fe-gray transition-colors">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mismatch && <p className="text-[10px] text-red-500 font-sans">Passwords do not match</p>}
          </div>

          {/* Result */}
          {result && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-xs font-sans ${
              result.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {result.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              {result.message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold font-sans rounded-lg border border-fe-muted/40 text-fe-gray hover:bg-fe-bg transition-all">
              {result?.type === 'success' ? 'Close' : 'Cancel'}
            </button>
            {result?.type !== 'success' && (
              <button
                id="reset-password-btn"
                type="submit"
                disabled={saving || mismatch}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white text-sm font-bold font-sans rounded-lg hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Resetting...</>
                  : <><KeyRound className="h-4 w-4" />Reset Password</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ user: editUser, currentUid, onClose, onSaved, getToken }) {
  const [name, setName] = useState(editUser.name || '');
  const [role, setRole] = useState(editUser.role || 'employee');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isSelf = editUser.uid === currentUid;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/${editUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, role }),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-fe-muted/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fe-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-50">
              <Pencil className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-fe-dark">Edit User</h3>
              <p className="text-[10px] text-fe-gray font-sans truncate max-w-[200px]">{editUser.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-fe-gray hover:bg-fe-bg hover:text-fe-dark transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fe-gray/60" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-9 pr-3 py-2.5 text-sm font-sans border border-fe-muted/40 rounded-lg bg-fe-bg/30 focus:outline-none focus:ring-2 focus:ring-fe-teal/30 focus:border-fe-teal transition-all text-fe-dark placeholder:text-fe-gray/50"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-fe-gray">
              Role {isSelf && <span className="text-rose-500">(cannot change own role)</span>}
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelf ? 'opacity-40 cursor-not-allowed' : ''
                  } ${
                    role === opt.value
                      ? `${opt.color} border-current`
                      : 'border-fe-muted/30 bg-white hover:bg-fe-bg/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit-role"
                    value={opt.value}
                    checked={role === opt.value}
                    disabled={isSelf}
                    onChange={e => setRole(e.target.value)}
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

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-sans">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-fe-muted/20 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-sm font-bold font-sans rounded-lg border border-fe-muted/40 text-fe-gray hover:bg-fe-bg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-fe-teal text-white text-sm font-bold font-sans rounded-lg hover:bg-fe-teal/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ user: delUser, onClose, onDeleted, getToken }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/${delUser.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        onDeleted();
      } else {
        setError(data.error || 'Failed to delete user');
        setDeleting(false);
      }
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-fe-muted/30 overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-fe-dark">Delete User?</h3>
            <p className="text-xs text-fe-gray font-sans mt-1">
              This will permanently delete <span className="font-bold text-fe-dark">{delUser.name || delUser.email}</span> from Firebase Auth and Firestore. This action cannot be undone.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-sans text-left">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold font-sans rounded-lg border border-fe-muted/40 text-fe-gray hover:bg-fe-bg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white text-sm font-bold font-sans rounded-lg hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formResult, setFormResult] = useState(null);

  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [resetUser, setResetUser] = useState(null); // user whose password is being reset

  // Guard
  useEffect(() => {
    if (!loading && (!user || role !== 'super_admin')) router.replace('/dashboard');
  }, [user, role, loading, router]);

  const getToken = useCallback(async () => {
    return await user.getIdToken();
  }, [user]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    try {
      setUsersLoading(true);
      const token = await user.getIdToken();
      const res = await fetch('/api/users/list', { headers: { Authorization: `Bearer ${token}` } });
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setFormResult({ type: 'success', message: `User "${form.name}" created successfully with role "${form.role}".` });
        setForm({ name: '', email: '', password: '', role: 'employee' });
        fetchUsers();
      } else {
        setFormResult({ type: 'error', message: data.error || 'Failed to create user' });
      }
    } catch (err) {
      setFormResult({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    employees: users.filter(u => u.role === 'employee').length,
    delivery: users.filter(u => u.role === 'delivery').length,
  };

  if (loading || role !== 'super_admin') return null;

  return (
    <>
      {/* Edit Modal */}
      {editUser && (
        <EditModal
          user={editUser}
          currentUid={user.uid}
          getToken={getToken}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); fetchUsers(); }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteUser && (
        <DeleteModal
          user={deleteUser}
          getToken={getToken}
          onClose={() => setDeleteUser(null)}
          onDeleted={() => { setDeleteUser(null); fetchUsers(); }}
        />
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          getToken={getToken}
          onClose={() => setResetUser(null)}
        />
      )}

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

                {/* Role */}
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

                {/* Result */}
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
                  {usersLoading && <Loader2 className="h-3 w-3 animate-spin" />}
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
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-fe-gray">User</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-fe-gray">Role</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-fe-gray hidden md:table-cell">Created</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-fe-gray text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fe-muted/15">
                      {users.map((u) => {
                        const isSelf = u.uid === user.uid;
                        return (
                          <tr key={u.uid} className="hover:bg-fe-bg/20 transition-colors group">
                            {/* User info */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-fe-teal/10 border border-fe-teal/20 flex items-center justify-center text-fe-teal text-xs font-bold font-heading shrink-0">
                                  {(u.name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-fe-dark font-sans truncate flex items-center gap-1">
                                    {u.name || '—'}
                                    {isSelf && <span className="text-[9px] font-normal text-fe-teal">(you)</span>}
                                  </p>
                                  <p className="text-[10px] text-fe-gray font-mono truncate max-w-[140px]">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-4 py-3.5">
                              <RoleBadge role={u.role} />
                            </td>

                            {/* Created */}
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              <span className="text-[10px] text-fe-gray font-sans">
                                {u.createdAt
                                  ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : '—'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Edit */}
                                <button
                                  onClick={() => setEditUser(u)}
                                  title="Edit user"
                                  className="p-1.5 rounded-lg text-fe-gray hover:text-violet-600 hover:bg-violet-50 transition-all"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>

                                {/* Reset Password */}
                                <button
                                  onClick={() => setResetUser(u)}
                                  title="Reset password"
                                  className="p-1.5 rounded-lg text-fe-gray hover:text-amber-600 hover:bg-amber-50 transition-all"
                                >
                                  <KeyRound className="h-3.5 w-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => !isSelf && setDeleteUser(u)}
                                  disabled={isSelf}
                                  title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    isSelf
                                      ? 'text-fe-muted/40 cursor-not-allowed'
                                      : 'text-fe-gray hover:text-red-600 hover:bg-red-50'
                                  }`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
