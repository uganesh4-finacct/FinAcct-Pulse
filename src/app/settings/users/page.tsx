'use client';

import { useState, useEffect } from 'react';
import {
  USER_MANAGEMENT_ROLE_LABELS,
  MODULES,
  ACTIONS,
  SENSITIVE_ACCESS,
  mapPulseRoleToUserRole,
  mapUserRoleToPulseRole,
} from '@/lib/types';
import type { UserManagementRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { FormField, Input, Select, labelClass, errorBlockClass } from '@/components/ui/Form';
import { UserPlus, Users, UserCheck, Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEPARTMENT_OPTIONS = [
  'Operations',
  'Finance',
  'HR',
  'Sales',
  'IT',
  'Marketing',
  'Leadership',
  'Client Services',
];

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  role_title?: string;
  entity?: string;
  department?: string | null;
  status?: string;
  active?: boolean;
  reports_to_id?: string | null;
};

type Stats = { total: number; active: number; pendingInvites: number };

const ENTITY_OPTIONS = [{ value: '', label: 'All entities' }, { value: 'us', label: 'US' }, { value: 'india', label: 'India' }];
const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'owner', label: 'Owner' },
  { value: 'support', label: 'Support' },
];
const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
];

export default function SettingsUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pendingInvites: 0 });
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [membersForReportsTo, setMembersForReportsTo] = useState<UserRow[]>([]);
  const [filterRole, setFilterRole] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filterRole) params.set('role', filterRole);
      if (filterEntity) params.set('entity', filterEntity);
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/settings/users?${params}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setUsers([]);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users ?? []);
      setStats(data.stats ?? { total: 0, active: 0, pendingInvites: 0 });
      setMembersForReportsTo(data.users ?? []);
      setCurrentUserId(data.current_user_id ?? null);
      setAccessDenied(false);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterEntity, filterStatus]);

  const handleRowClick = (user: UserRow) => {
    setEditUser(user);
  };

  const handleCloseEdit = () => {
    setEditUser(null);
  };

  const handleInviteSuccess = () => {
    setInviteOpen(false);
    fetchUsers();
  };

  const handleEditSuccess = () => {
    setEditUser(null);
    fetchUsers();
  };

  const statusLabel = (u: UserRow) => {
    if (u.status === 'invited') return 'Pending';
    if (u.status === 'inactive' || u.active === false) return 'Inactive';
    return 'Active';
  };

  const statusClass = (u: UserRow) => {
    if (u.status === 'invited') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    if (u.status === 'inactive' || u.active === false) return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400';
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  const roleLabel = (role: string) => {
    const r = mapPulseRoleToUserRole(role as 'admin' | 'reviewer' | 'coordinator' | 'owner' | 'support');
    return USER_MANAGEMENT_ROLE_LABELS[r] ?? role;
  };

  const handleDeactivate = async (user: UserRow) => {
    if (!confirm(`Deactivate ${user.name}? They will no longer be able to sign in.`)) return;
    const res = await fetch(`/api/settings/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false, status: 'inactive' }),
    });
    if (res.ok) fetchUsers();
    else alert('Failed to deactivate');
  };

  const handleReactivate = async (user: UserRow) => {
    const res = await fetch(`/api/settings/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true, status: 'active' }),
    });
    if (res.ok) fetchUsers();
    else alert('Failed to reactivate');
  };

  const handleResendInvite = async (user: UserRow) => {
    const res = await fetch(`/api/settings/users/${user.id}/resend-invite`, { method: 'POST' });
    if (res.ok) alert('Invite email sent.');
    else {
      const d = await res.json();
      alert(d.error || 'Failed to resend invite');
    }
  };

  if (accessDenied) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-6 text-center">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">Access denied</h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Only admins can access User Management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">User Management</h1>
        <Button
          onClick={() => setInviteOpen(true)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-900">
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value || 'any'} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-900">
          {ENTITY_OPTIONS.map((o) => (
            <option key={o.value || 'any'} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-900">
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value || 'any'} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Users</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Active</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Pending Invites</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.pendingInvites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Entity</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => handleRowClick(user)}
                      className={cn(
                        'border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors',
                        'hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                      )}
                    >
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">{user.name}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                      <td className="py-3 px-4">{roleLabel(user.role)}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{(user.entity ?? '').toUpperCase() || '—'}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{user.department ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium', statusClass(user))}>
                          {statusLabel(user)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRowClick(user); }} className="text-violet-600 dark:text-violet-400 hover:underline text-sm mr-2">
                          Edit
                        </button>
                        {user.status === 'invited' && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleResendInvite(user); }} className="text-amber-600 dark:text-amber-400 hover:underline text-sm mr-2">
                            Resend invite
                          </button>
                        )}
                        {user.id !== currentUserId && (user.status === 'inactive' || user.active === false) && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleReactivate(user); }} className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm mr-2">
                            Reactivate
                          </button>
                        )}
                        {user.id !== currentUserId && user.status !== 'inactive' && user.active !== false && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDeactivate(user); }} className="text-red-600 dark:text-red-400 hover:underline text-sm">
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">No users yet. Invite someone to get started.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {inviteOpen && (
        <UserModal
          mode="invite"
          membersForReportsTo={membersForReportsTo}
          currentUserId={null}
          onClose={() => setInviteOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
      {editUser && (
        <UserModal
          mode="edit"
          initialUser={editUser}
          membersForReportsTo={membersForReportsTo}
          currentUserId={currentUserId}
          onClose={handleCloseEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

// ─── User Modal (Invite / Edit) with 3 tabs ─────────────────────
type TabId = 'basic' | 'modules' | 'permissions';

type UserModalProps = {
  mode: 'invite' | 'edit';
  initialUser?: UserRow | null;
  membersForReportsTo: UserRow[];
  currentUserId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

function UserModal({ mode, initialUser, membersForReportsTo, currentUserId, onClose, onSuccess }: UserModalProps) {
  const [tab, setTab] = useState<TabId>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadedUser, setLoadedUser] = useState<typeof initialUser & { permissions?: { module_access?: string[]; actions?: string[]; sensitive_access?: string[] } } | null>(null);

  const [name, setName] = useState(initialUser?.name ?? '');
  const [emailLocal, setEmailLocal] = useState(
    initialUser?.email?.replace(/@finacctsolutions\.com$/i, '') ?? ''
  );
  const [department, setDepartment] = useState(initialUser?.department ?? '');
  const [reportsToId, setReportsToId] = useState(initialUser?.reports_to_id ?? '');
  const [entity, setEntity] = useState(initialUser?.entity ?? 'us');
  const [globalRole, setGlobalRole] = useState<UserManagementRole>(
    initialUser ? mapPulseRoleToUserRole(initialUser.role as 'admin' | 'reviewer' | 'coordinator' | 'owner' | 'support') : 'contributor'
  );
  const isEditingSelf = Boolean(mode === 'edit' && initialUser?.id && currentUserId === initialUser.id);

  const [moduleAccess, setModuleAccess] = useState<string[]>(
    (initialUser as { permissions?: { module_access?: string[] } })?.permissions?.module_access ?? []
  );
  const [actions, setActions] = useState<string[]>(
    (initialUser as { permissions?: { actions?: string[] } })?.permissions?.actions ?? []
  );
  const [sensitiveAccess, setSensitiveAccess] = useState<string[]>(
    (initialUser as { permissions?: { sensitive_access?: string[] } })?.permissions?.sensitive_access ?? []
  );

  // Load full user + permissions when editing
  useEffect(() => {
    if (mode === 'edit' && initialUser?.id) {
      fetch(`/api/settings/users/${initialUser.id}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            setLoadedUser(data);
            setName(data.name ?? '');
            setEmailLocal(data.email?.replace(/@finacctsolutions\.com$/i, '') ?? '');
            setDepartment(data.department ?? '');
            setReportsToId(data.reports_to_id ?? '');
            setEntity(data.entity ?? 'us');
            setGlobalRole(mapPulseRoleToUserRole(data.role ?? 'coordinator'));
            setModuleAccess(data.permissions?.module_access ?? []);
            setActions(data.permissions?.actions ?? []);
            setSensitiveAccess(data.permissions?.sensitive_access ?? []);
          }
        })
        .catch(() => {});
    }
  }, [mode, initialUser?.id]);

  const fullEmail = emailLocal.includes('@') ? emailLocal : `${emailLocal}@finacctsolutions.com`;

  const toggleModule = (m: string) => {
    setModuleAccess((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };
  const toggleAction = (a: string) => {
    setActions((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };
  const toggleSensitive = (s: string) => {
    setSensitiveAccess((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      if (mode === 'invite') {
        const res = await fetch('/api/settings/users/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email: fullEmail,
            department: department || undefined,
            reportsToId: reportsToId || undefined,
            entity: entity || 'us',
            globalRole,
            moduleAccess,
            actions,
            sensitiveAccess,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invite failed');
        onSuccess();
      } else if (initialUser) {
        const role = mapUserRoleToPulseRole(globalRole);
        const res = await fetch(`/api/settings/users/${initialUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email: fullEmail,
            department: department || null,
            reports_to_id: reportsToId || null,
            entity: entity || 'us',
            role,
            role_title: USER_MANAGEMENT_ROLE_LABELS[globalRole],
            module_access: moduleAccess,
            actions,
            sensitive_access: sensitiveAccess,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update failed');
        onSuccess();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'modules', label: 'Module Access' },
    { id: 'permissions', label: 'Permissions' },
  ];

  return (
    <Modal onClose={onClose} maxWidth="lg">
      <div className="flex flex-col max-h-[90vh]">
        <div className="px-6 pb-4 mb-6 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {mode === 'invite' ? 'Invite User' : 'Edit User'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-1 mt-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-medium transition-colors',
                  tab === t.id
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <ModalBody>
          {error && <div className={cn(errorBlockClass, 'mb-4')}>{error}</div>}

          {tab === 'basic' && (
            <div className="space-y-4">
              <FormField label="Name">
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </FormField>
              <FormField label="Email">
                <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent">
                  <input
                    type="text"
                    value={emailLocal}
                    onChange={(e) => setEmailLocal(e.target.value)}
                    className="flex-1 px-4 py-3 text-zinc-900 dark:text-white bg-transparent min-w-0 outline-none"
                    placeholder="username"
                  />
                  <span className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-sm">@finacctsolutions.com</span>
                </div>
              </FormField>
              <FormField label="Entity">
                <Select value={entity} onChange={(e) => setEntity(e.target.value)} disabled={isEditingSelf}>
                  <option value="us">US</option>
                  <option value="india">India</option>
                </Select>
              </FormField>
              <FormField label="Department">
                <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Select department</option>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Reports To">
                <Select value={reportsToId} onChange={(e) => setReportsToId(e.target.value)}>
                  <option value="">No manager</option>
                  {membersForReportsTo.filter((m) => m.id !== initialUser?.id).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </FormField>
              <div>
                <span className={labelClass}>Global Role {isEditingSelf && '(you cannot change your own role)'}</span>
                <div className="flex gap-4 pt-1">
                  {(['admin', 'manager', 'contributor'] as const).map((r) => (
                    <label key={r} className={cn('flex items-center gap-2', isEditingSelf && 'opacity-60')}>
                      <input
                        type="radio"
                        name="globalRole"
                        checked={globalRole === r}
                        onChange={() => setGlobalRole(r)}
                        disabled={isEditingSelf}
                        className="text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{USER_MANAGEMENT_ROLE_LABELS[r]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'modules' && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Select modules this user can access.</p>
              {MODULES.map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg px-2 -mx-2">
                  <input
                    type="checkbox"
                    checked={moduleAccess.includes(m)}
                    onChange={() => toggleModule(m)}
                    className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{m}</span>
                </label>
              ))}
            </div>
          )}

          {tab === 'permissions' && (
            <div className="space-y-6">
              <div>
                <p className={labelClass}>Actions</p>
                <div className="flex flex-wrap gap-3">
                  {ACTIONS.map((a) => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg px-2 -mx-2">
                      <input
                        type="checkbox"
                        checked={actions.includes(a)}
                        onChange={() => toggleAction(a)}
                        className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{a}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className={labelClass}>Sensitive Access</p>
                <div className="flex flex-wrap gap-3">
                  {SENSITIVE_ACCESS.map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg px-2 -mx-2">
                      <input
                        type="checkbox"
                        checked={sensitiveAccess.includes(s)}
                        onChange={() => toggleSensitive(s)}
                        className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : mode === 'invite' ? 'Send Invite' : 'Save'}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
