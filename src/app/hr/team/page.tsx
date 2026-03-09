'use client'

import { useState, useEffect } from 'react'
import SubNav from '@/components/SubNav'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldRow, FieldInput, FieldSelect } from '@/components/FieldRow'
import { Users, Building2, Network, Pencil, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODULES = ['Operations', 'HR', 'Finance', 'IT', 'Sales', 'Marketing'] as const
const ENTITY_OPTIONS = [
  { value: 'us', label: 'FinAcct Solutions US' },
  { value: 'india', label: 'FinAcct Solutions India' },
]
const LOCATION_OPTIONS = [
  { value: 'US', label: 'US' },
  { value: 'India', label: 'India' },
]
const SYSTEM_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'it_person', label: 'IT Person' },
  { value: 'owner', label: 'Owner' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'support', label: 'Support' },
]
const VERTICAL_OPTIONS = [
  { value: '', label: 'All verticals' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'property', label: 'Property Mgmt' },
  { value: 'saas_ites', label: 'SaaS/ITES' },
]

function entityBadgeClass(entity: string) {
  return entity === 'us' ? 'bg-blue-500 text-white' : 'bg-violet-500 text-white'
}
function roleBadgeClass(role: string) {
  const map: Record<string, string> = {
    admin: 'bg-slate-700 text-white',
    reviewer: 'bg-purple-600 text-white',
    hr_manager: 'bg-teal-600 text-white',
    owner: 'bg-sky-600 text-white',
    coordinator: 'bg-cyan-600 text-white',
    support: 'bg-slate-500 text-white',
    it_person: 'bg-emerald-600 text-white',
  }
  return map[role] ?? 'bg-zinc-500 text-white'
}
function verticalLabel(v: string) {
  const map: Record<string, string> = {
    restaurant: 'Restaurant',
    insurance: 'Insurance',
    property: 'Property Mgmt',
    saas_ites: 'SaaS/ITES',
  }
  return map[v] ?? v
}

type Member = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  role: string
  role_title?: string | null
  entity: string
  location?: string | null
  reports_to_id?: string | null
  reports_to_name?: string | null
  active: boolean
  status?: string | null
  client_count?: number
  module_access?: string[]
}
type HierarchyNode = { id: string; name: string; role: string; role_title: string | null; entity: string; reports_to_id: string | null; active: boolean; children: HierarchyNode[] }
type ClientRow = { id: string; name: string; vertical: string; owner_name: string | null; reviewer_name: string | null; coordinator_name: string | null }

export default function TeamDirectoryPage() {
  const [tab, setTab] = useState<'hierarchy' | 'by-client' | 'all'>('hierarchy')
  const [members, setMembers] = useState<Member[]>([])
  const [hierarchy, setHierarchy] = useState<{ by_entity: Record<string, HierarchyNode[]> }>({ by_entity: {} })
  const [byClient, setByClient] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [verticalFilter, setVerticalFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailMember, setDetailMember] = useState<Member | null>(null)
  const [detailData, setDetailData] = useState<Member & { assigned_clients?: Array<{ name: string; vertical: string; role_on_client: string }>; reports_to?: { name: string } } | null>(null)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [clientTeamFor, setClientTeamFor] = useState<ClientRow | null>(null)
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'support', role_title: '',
    entity: 'us', location: 'US', reports_to_id: '', active: true, module_access: [] as string[],
  })

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'hr_manager'
  const canDelete = currentUser?.role === 'admin'

  const fetchMembers = async () => {
    const r = await fetch('/api/hr/team')
    if (!r.ok) return
    const data = await r.json()
    setMembers(Array.isArray(data) ? data : [])
  }
  const fetchHierarchy = async () => {
    const r = await fetch('/api/hr/team/hierarchy')
    if (!r.ok) return
    const data = await r.json()
    setHierarchy(data)
  }
  const fetchByClient = async () => {
    const url = verticalFilter ? `/api/hr/team/by-client?vertical=${encodeURIComponent(verticalFilter)}` : '/api/hr/team/by-client'
    const r = await fetch(url)
    if (!r.ok) return
    const data = await r.json()
    setByClient(Array.isArray(data) ? data : [])
  }
  const fetchDetail = async (id: string) => {
    const r = await fetch(`/api/hr/team/${id}`)
    if (!r.ok) return
    const data = await r.json()
    setDetailData(data)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/auth/me').then(res => res.ok ? res.json() : null).then(d => { if (!cancelled) setCurrentUser(d) }),
      fetchMembers(),
      fetchHierarchy(),
      fetchByClient(),
    ]).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (tab === 'by-client') fetchByClient()
  }, [tab, verticalFilter])

  useEffect(() => {
    if (detailMember) fetchDetail(detailMember.id)
  }, [detailMember?.id])

  const filteredMembers = members.filter(m => {
    if (entityFilter && m.entity !== entityFilter) return false
    if (roleFilter && m.role !== roleFilter) return false
    if (statusFilter === 'Active' && (!m.active || m.status === 'inactive')) return false
    if (statusFilter === 'Inactive' && m.active && m.status !== 'inactive') return false
    return true
  })

  const openEdit = (m: Member) => {
    setEditMember(m)
    setForm({
      name: m.name ?? '',
      email: m.email ?? '',
      phone: m.phone ?? '',
      role: m.role ?? 'support',
      role_title: m.role_title ?? '',
      entity: m.entity ?? 'us',
      location: (m.location as string) || (m.entity === 'india' ? 'India' : 'US'),
      reports_to_id: m.reports_to_id ?? '',
      active: m.active !== false,
      module_access: Array.isArray(m.module_access) ? m.module_access : [],
    })
  }
  const openDetail = (m: Member) => {
    setDetailMember(m)
    setDetailData(null)
  }
  const handleSave = async () => {
    if (!editMember?.id) return
    if (!form.name?.trim() || !form.email?.trim()) {
      alert('Name and email are required.')
      return
    }
    if (!form.email.includes('@finacctsolutions.com')) {
      alert('Email must be @finacctsolutions.com')
      return
    }
    setSaving(true)
    const r = await fetch(`/api/hr/team/${editMember.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
        role: form.role,
        role_title: form.role_title || null,
        entity: form.entity,
        location: form.location,
        reports_to_id: form.reports_to_id || null,
        active: form.active,
        module_access: form.module_access,
      }),
    })
    setSaving(false)
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      alert(d.error || 'Failed to update')
      return
    }
    setEditMember(null)
    fetchMembers()
    fetchHierarchy()
    fetchByClient()
  }
  const handleCreate = async () => {
    if (!form.name?.trim() || !form.email?.trim()) {
      alert('Name and email are required.')
      return
    }
    if (!form.email.includes('@finacctsolutions.com')) {
      alert('Email must be @finacctsolutions.com')
      return
    }
    setSaving(true)
    const r = await fetch('/api/hr/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
        role: form.role,
        role_title: form.role_title || null,
        entity: form.entity,
        location: form.location,
        reports_to_id: form.reports_to_id || null,
        active: form.active,
        module_access: form.module_access,
      }),
    })
    setSaving(false)
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      alert(d.error || 'Failed to create')
      return
    }
    setAddOpen(false)
    setForm({ name: '', email: '', phone: '', role: 'support', role_title: '', entity: 'us', location: 'US', reports_to_id: '', active: true, module_access: [] })
    fetchMembers()
    fetchHierarchy()
    fetchByClient()
  }
  const handleDeactivate = async () => {
    if (!detailMember?.id || !canDelete) return
    if (!confirm('Deactivate this team member? They will no longer appear as active.')) return
    setSaving(true)
    const r = await fetch(`/api/hr/team/${detailMember.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false, status: 'inactive' }),
    })
    setSaving(false)
    if (!r.ok) return
    setDetailMember(null)
    setDetailData(null)
    fetchMembers()
    fetchHierarchy()
    fetchByClient()
  }

  const reportToOptions = members
    .filter(m => m.id !== editMember?.id && m.entity === form.entity)
    .map(m => ({ value: m.id, label: m.name }))

  if (loading) {
    return (
      <div className="p-6 text-zinc-500 text-center">Loading...</div>
    )
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-xl font-bold text-zinc-900">Team Directory</h1>
        {canEdit && (
          <Button onClick={() => { setAddOpen(true); setForm({ name: '', email: '', phone: '', role: 'support', role_title: '', entity: 'us', location: 'US', reports_to_id: '', active: true, module_access: [] }); }} size="sm">
            <UserPlus className="w-4 h-4 mr-1.5" /> Add Team Member
          </Button>
        )}
      </div>
      <SubNav />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200">
        {[
          { id: 'hierarchy', label: 'Hierarchy', icon: Network },
          { id: 'by-client', label: 'By Client', icon: Building2 },
          { id: 'all', label: 'All Members', icon: Users },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as 'hierarchy' | 'by-client' | 'all')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Hierarchy */}
      {tab === 'hierarchy' && (
        <div className="space-y-8">
          {(['us', 'india'] as const).map(entity => {
            const roots = hierarchy.by_entity?.[entity] ?? []
            return (
              <div key={entity}>
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
                  {entity === 'us' ? 'FinAcct Solutions US' : 'FinAcct Solutions India'}
                </h2>
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                  {roots.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No team members</p>
                  ) : (
                    <HierarchyTree
                      nodes={roots}
                      onSelect={openDetail}
                      roleBadgeClass={roleBadgeClass}
                      membersById={new Map(members.map(m => [m.id, m]))}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: By Client */}
      {tab === 'by-client' && (
        <div>
          <div className="flex gap-3 mb-4">
            <select
              value={verticalFilter}
              onChange={e => setVerticalFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              {VERTICAL_OPTIONS.map(o => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 font-semibold text-zinc-700">Client</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Vertical</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Owner</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Reviewer</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Coordinator</th>
                </tr>
              </thead>
              <tbody>
                {byClient.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setClientTeamFor(c)}
                    className="border-b border-zinc-100 hover:bg-violet-50/50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700">
                        {verticalLabel(c.vertical)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{c.owner_name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.reviewer_name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.coordinator_name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clientTeamFor && (
            <ClientTeamModal
              client={clientTeamFor}
              onClose={() => setClientTeamFor(null)}
            />
          )}
        </div>
      )}

      {/* Tab: All Members */}
      {tab === 'all' && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="">All entities</option>
              {ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="">All roles</option>
              {SYSTEM_ROLES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Role Title</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Entity</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Location</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">System Role</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Clients</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
                  {canEdit && <th className="px-4 py-3 font-semibold text-zinc-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => openDetail(m)}
                    className="border-b border-zinc-100 hover:bg-violet-50/50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{m.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{m.role_title ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', entityBadgeClass(m.entity))}>
                        {m.entity === 'us' ? 'US' : 'India'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{m.location ?? (m.entity === 'us' ? 'US' : 'India')}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', roleBadgeClass(m.role))}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-700">{m.client_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={m.active ? 'text-emerald-600 font-medium' : 'text-zinc-500'}>
                        {m.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailMember && (
        <Modal onClose={() => { setDetailMember(null); setDetailData(null); }} maxWidth="lg">
          <ModalHeader title={detailMember.name} onClose={() => { setDetailMember(null); setDetailData(null); }} />
          <ModalBody>
            {detailData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Personal</h3>
                  <p className="text-zinc-700">{detailData.email}</p>
                  {detailData.phone && <p className="text-zinc-700">{detailData.phone}</p>}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Role</h3>
                  <p><span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', roleBadgeClass(detailData.role))}>{detailData.role}</span></p>
                  {detailData.role_title && <p className="text-zinc-600 mt-1">{detailData.role_title}</p>}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Organization</h3>
                  <p>Entity: <span className={cn('inline-flex px-2 py-0.5 rounded text-xs', entityBadgeClass(detailData.entity))}>{detailData.entity === 'us' ? 'US' : 'India'}</span></p>
                  <p className="text-zinc-600">Location: {detailData.location ?? (detailData.entity === 'us' ? 'US' : 'India')}</p>
                  {detailData.reports_to?.name && <p className="text-zinc-600">Reports to: {detailData.reports_to.name}</p>}
                </div>
                {detailData.assigned_clients && detailData.assigned_clients.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Assigned Clients</h3>
                    <ul className="space-y-1.5">
                      {detailData.assigned_clients.map((ac: { name: string; vertical: string; role_on_client: string }, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-zinc-900">{ac.name}</span>
                          <span className="text-zinc-500">· {verticalLabel(ac.vertical)}</span>
                          <span className={cn('inline-flex px-1.5 py-0.5 rounded text-xs', roleBadgeClass(ac.role_on_client.toLowerCase()))}>{ac.role_on_client}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-500">Loading...</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => { setDetailMember(null); setDetailData(null); }}>Close</Button>
            {canEdit && <Button onClick={() => { setEditMember(detailMember); setDetailMember(null); setDetailData(null); openEdit(detailMember); }}>Edit</Button>}
            {canDelete && detailData?.active !== false && (
              <Button variant="danger" onClick={handleDeactivate} disabled={saving}>Deactivate</Button>
            )}
          </ModalFooter>
        </Modal>
      )}

      {/* Edit modal */}
      {editMember && (
        <Modal onClose={() => setEditMember(null)} maxWidth="lg">
          <ModalHeader title={`Edit ${editMember.name}`} onClose={() => setEditMember(null)} />
          <ModalBody>
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Personal Info</h3>
                <FieldRow label="Name" required><FieldInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></FieldRow>
                <FieldRow label="Email" required><FieldInput type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="@finacctsolutions.com" /></FieldRow>
                <FieldRow label="Phone"><FieldInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Role</h3>
                <FieldRow label="System Role"><FieldSelect value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={SYSTEM_ROLES} /></FieldRow>
                <FieldRow label="Role Title"><FieldInput value={form.role_title} onChange={v => setForm(f => ({ ...f, role_title: v }))} placeholder="e.g. Bookkeeper - Insurance" /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Organization</h3>
                <FieldRow label="Entity"><FieldSelect value={form.entity} onChange={v => setForm(f => ({ ...f, entity: v, location: v === 'india' ? 'India' : 'US' }))} options={ENTITY_OPTIONS} /></FieldRow>
                <FieldRow label="Location"><FieldSelect value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} options={LOCATION_OPTIONS} /></FieldRow>
                <FieldRow label="Reports To"><FieldSelect value={form.reports_to_id} onChange={v => setForm(f => ({ ...f, reports_to_id: v }))} options={[{ value: '', label: '—' }, ...reportToOptions]} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Module Access</h3>
                <div className="flex flex-wrap gap-3">
                  {MODULES.map(mod => (
                    <label key={mod} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.module_access.includes(mod)} onChange={e => setForm(f => ({ ...f, module_access: e.target.checked ? [...f.module_access, mod] : f.module_access.filter(m => m !== mod) }))} className="rounded border-zinc-300 text-violet-600" />
                      <span className="text-sm text-zinc-700">{mod}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Status</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded border-zinc-300 text-violet-600" />
                  <span className="text-sm text-zinc-700">Active</span>
                </label>
              </section>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setEditMember(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Add modal */}
      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} maxWidth="lg">
          <ModalHeader title="Add Team Member" onClose={() => setAddOpen(false)} />
          <ModalBody>
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Personal Info</h3>
                <FieldRow label="Name" required><FieldInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></FieldRow>
                <FieldRow label="Email" required><FieldInput type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="@finacctsolutions.com" /></FieldRow>
                <FieldRow label="Phone"><FieldInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Role</h3>
                <FieldRow label="System Role"><FieldSelect value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={SYSTEM_ROLES} /></FieldRow>
                <FieldRow label="Role Title"><FieldInput value={form.role_title} onChange={v => setForm(f => ({ ...f, role_title: v }))} placeholder="e.g. Bookkeeper - Insurance" /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Organization</h3>
                <FieldRow label="Entity"><FieldSelect value={form.entity} onChange={v => setForm(f => ({ ...f, entity: v, location: v === 'india' ? 'India' : 'US' }))} options={ENTITY_OPTIONS} /></FieldRow>
                <FieldRow label="Location"><FieldSelect value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} options={LOCATION_OPTIONS} /></FieldRow>
                <FieldRow label="Reports To"><FieldSelect value={form.reports_to_id} onChange={v => setForm(f => ({ ...f, reports_to_id: v }))} options={[{ value: '', label: '—' }, ...members.filter(m => m.entity === form.entity).map(m => ({ value: m.id, label: m.name }))]} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Module Access</h3>
                <div className="flex flex-wrap gap-3">
                  {MODULES.map(mod => (
                    <label key={mod} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.module_access.includes(mod)} onChange={e => setForm(f => ({ ...f, module_access: e.target.checked ? [...f.module_access, mod] : f.module_access.filter(m => m !== mod) }))} className="rounded border-zinc-300 text-violet-600" />
                      <span className="text-sm text-zinc-700">{mod}</span>
                    </label>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Status</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded border-zinc-300 text-violet-600" />
                  <span className="text-sm text-zinc-700">Active</span>
                </label>
              </section>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}

function HierarchyTree({
  nodes,
  onSelect,
  roleBadgeClass,
  membersById,
  depth = 0,
}: {
  nodes: HierarchyNode[]
  onSelect: (m: Member) => void
  roleBadgeClass: (r: string) => string
  membersById: Map<string, Member>
  depth?: number
}) {
  return (
    <ul className={cn(depth > 0 && 'ml-8 border-l-2 border-zinc-200 pl-4')}>
      {nodes.map((node, i) => {
        const fullMember = membersById.get(node.id)
        return (
          <li key={node.id} className={cn('py-2', depth > 0 && 'relative')}>
            {depth > 0 && (
              <span className="absolute left-0 top-5 w-4 h-px bg-zinc-200" style={{ marginLeft: '-1rem' }} />
            )}
            <button
              type="button"
              onClick={() => onSelect(fullMember ?? { ...node, email: null, reports_to_name: null, client_count: 0 })}
              className="text-left w-full rounded-lg p-2 hover:bg-violet-50 flex items-center gap-3 group"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-zinc-900 truncate">{node.name}</span>
                <span className="text-sm text-zinc-500 truncate">{node.role_title || '—'}</span>
              </div>
              <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium shrink-0', roleBadgeClass(node.role))}>
                {node.role}
              </span>
            </button>
            {node.children.length > 0 && (
              <HierarchyTree nodes={node.children} onSelect={onSelect} roleBadgeClass={roleBadgeClass} membersById={membersById} depth={depth + 1} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function ClientTeamModal({ client, onClose }: { client: ClientRow; onClose: () => void }) {
  const team: { role: string; name: string | null }[] = [
    { role: 'Owner', name: client.owner_name },
    { role: 'Reviewer', name: client.reviewer_name },
    { role: 'Coordinator', name: client.coordinator_name },
  ].filter(t => t.name)
  return (
    <Modal onClose={onClose} maxWidth="sm">
      <ModalHeader title={`Team: ${client.name}`} onClose={onClose} />
      <ModalBody>
        <p className="text-sm text-zinc-500 mb-3">{verticalLabel(client.vertical)}</p>
        <ul className="space-y-2">
          {team.map((t, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-zinc-500">{t.role}</span>
              <span className="font-medium text-zinc-900">{t.name}</span>
            </li>
          ))}
        </ul>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  )
}
