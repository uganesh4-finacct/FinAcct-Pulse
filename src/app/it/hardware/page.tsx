'use client'

import { useState, useEffect } from 'react'
import {
  Laptop,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  Camera,
  Phone,
  Printer,
  Router,
  Server,
  Box,
  MonitorCheck,
} from 'lucide-react'
import { formatCurrency } from '@/lib/finance-utils'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { FieldRow, FieldInput, FieldSelect } from '@/components/FieldRow'
import { cn } from '@/lib/utils'

const HARDWARE_TYPES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'headset', label: 'Headset' },
  { value: 'webcam', label: 'Webcam' },
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'printer', label: 'Printer' },
  { value: 'router', label: 'Router' },
  { value: 'server', label: 'Server' },
  { value: 'network', label: 'Network' },
  { value: 'other', label: 'Other' },
]
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'spare', label: 'Spare' },
  { value: 'in_repair', label: 'In Repair' },
  { value: 'retired', label: 'Retired' },
  { value: 'lost', label: 'Lost' },
]
const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  desktop: Monitor,
  monitor: MonitorCheck,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
  webcam: Camera,
  phone: Phone,
  tablet: Box,
  printer: Printer,
  router: Router,
  server: Server,
  network: Router,
  other: Box,
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    spare: 'bg-blue-100 text-blue-800',
    in_repair: 'bg-amber-100 text-amber-800',
    retired: 'bg-zinc-100 text-zinc-700',
    lost: 'bg-red-100 text-red-800',
  }
  return <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', map[s] ?? 'bg-zinc-100')}>{s?.replace('_', ' ') ?? '—'}</span>
}
function conditionBadge(c: string) {
  const map: Record<string, string> = {
    new: 'bg-emerald-100 text-emerald-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-amber-100 text-amber-800',
    poor: 'bg-red-100 text-red-800',
  }
  return <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', map[c] ?? 'bg-zinc-100')}>{c ?? '—'}</span>
}

function warrantyDisplay(date: string | null) {
  if (!date) return <span className="text-zinc-500">—</span>
  const d = new Date(date)
  const now = new Date()
  const days = Math.floor((d.getTime() - now.getTime()) / 86400000)
  if (days < 0) return <span className="text-red-600 font-medium">Expired</span>
  if (days <= 30) return <span className="text-amber-600 font-medium">Expiring ({days}d)</span>
  if (days <= 90) return <span className="text-yellow-600">{d.toLocaleDateString()}</span>
  return <span>{d.toLocaleDateString()}</span>
}

export default function ITHardwarePage() {
  const [list, setList] = useState<any[]>([])
  const [team, setTeam] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    asset_tag: '', name: '', type: '', brand: '', model: '', serial_no: '',
    assigned_to: '', entity: 'US', location: '', status: 'active', condition: 'good',
    purchase_date: '', warranty_expiry: '', value: '', currency: 'USD', specs: '', notes: '',
  })

  const canEdit = true
  const canDelete = true

  const fetchList = () => {
    const params = new URLSearchParams()
    if (entityFilter) params.set('entity', entityFilter)
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (assignedFilter) params.set('assignedTo', assignedFilter)
    fetch(`/api/it/hardware?${params}`).then(r => r.json()).then(setList)
  }

  useEffect(() => {
    fetchList()
    fetch('/api/hr/team').then(r => r.json()).then(d => setTeam(Array.isArray(d) ? d : []))
    setLoading(false)
  }, [entityFilter, typeFilter, statusFilter, assignedFilter])

  useEffect(() => {
    if (detailId) fetch(`/api/it/hardware/${detailId}`).then(r => r.json()).then(setDetail).catch(() => setDetail(null))
    else setDetail(null)
  }, [detailId])

  useEffect(() => {
    if (addOpen && form.entity) {
      fetch(`/api/it/hardware/next-asset-tag?entity=${form.entity}`).then(r => r.json()).then(d => setForm(f => ({ ...f, asset_tag: d.suggested || '' })))
    }
  }, [addOpen, form.entity])

  const openAdd = () => {
    setForm({
      asset_tag: '', name: '', type: '', brand: '', model: '', serial_no: '',
      assigned_to: '', entity: 'US', location: '', status: 'active', condition: 'good',
      purchase_date: '', warranty_expiry: '', value: '', currency: 'USD', specs: '', notes: '',
    })
    setAddOpen(true)
    fetch('/api/it/hardware/next-asset-tag?entity=US').then(r => r.json()).then(d => setForm(f => ({ ...f, asset_tag: d.suggested || '' })))
  }

  const openEdit = (row: any) => {
    setEditId(row.id)
    setForm({
      asset_tag: row.asset_tag || '', name: row.name || row.asset || '', type: row.type || '', brand: row.brand || '', model: row.model || '', serial_no: row.serial_no || '',
      assigned_to: row.assigned_to || '', entity: row.entity === 'india' ? 'India' : 'US', location: row.location || '', status: row.status || 'active', condition: row.condition || 'good',
      purchase_date: row.purchase_date || '', warranty_expiry: row.warranty_expiry || '', value: row.value ?? '', currency: row.currency || 'USD', specs: row.specs || '', notes: row.notes || '',
    })
  }

  const handleSaveNew = async () => {
    if (!form.name?.trim()) {
      alert('Name is required')
      return
    }
    setSaving(true)
    const r = await fetch('/api/it/hardware', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, assigned_to: form.assigned_to || null, value: form.value ? parseFloat(form.value) : null }),
    })
    setSaving(false)
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Failed')
      return
    }
    setAddOpen(false)
    fetchList()
  }

  const handleSaveEdit = async () => {
    if (!editId) return
    setSaving(true)
    const r = await fetch(`/api/it/hardware/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, assigned_to: form.assigned_to || null, value: form.value ? parseFloat(form.value) : null }),
    })
    setSaving(false)
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Failed')
      return
    }
    setEditId(null)
    if (detailId === editId) setDetail(null)
    setDetailId(null)
    fetchList()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    const r = await fetch(`/api/it/hardware/${id}`, { method: 'DELETE' })
    if (!r.ok) return
    setDetailId(null)
    setDetail(null)
    fetchList()
  }

  const total = list.length
  const active = list.filter((x: any) => x.status === 'active').length
  const spare = list.filter((x: any) => x.status === 'spare').length
  const inRepair = list.filter((x: any) => x.status === 'in_repair').length

  const filteredList = searchQuery.trim()
    ? list.filter((row: any) => {
        const q = searchQuery.trim().toLowerCase()
        const name = (row.name || row.asset || '').toLowerCase()
        const tag = (row.asset_tag || row.asset || '').toLowerCase()
        return name.includes(q) || tag.includes(q)
      })
    : list

  const assignedOptions = team.map(t => ({ value: t.id, label: t.name }))

  if (loading) return <div className="text-zinc-500 py-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-zinc-900">Hardware Inventory</h2>
        <Button onClick={openAdd} size="sm">+ Add Hardware</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4"><div className="text-xl font-bold">{total}</div><div className="text-sm text-zinc-500">Total Assets</div></div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4"><div className="text-xl font-bold">{active}</div><div className="text-sm text-zinc-500">Active</div></div>
        <div className="bg-white rounded-xl border border-blue-200 p-4"><div className="text-xl font-bold">{spare}</div><div className="text-sm text-zinc-500">Spare</div></div>
        <div className="bg-white rounded-xl border border-amber-200 p-4"><div className="text-xl font-bold">{inRepair}</div><div className="text-sm text-zinc-500">In Repair</div></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name or asset tag..."
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm min-w-[200px]"
        />
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">All entities</option><option value="US">US</option><option value="India">India</option></select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">All types</option>{HARDWARE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">All statuses</option>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">All</option><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option></select>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Asset Tag</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Brand/Model</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Assigned To</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Entity</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Condition</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Purchase Date</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Warranty</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-zinc-500">No hardware. Add an asset.</td></tr>}
            {filteredList.map((row) => {
              const Icon = TYPE_ICONS[row.type] || Box
              const assignedName = row.team_members?.name ?? (Array.isArray(row.team_members) ? row.team_members[0]?.name : null)
              return (
                <tr
                  key={row.id}
                  onClick={() => setDetailId(row.id)}
                  className="border-b border-zinc-100 hover:bg-violet-50/50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-zinc-900">{row.asset_tag || row.asset || '—'}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{row.name || row.asset || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-zinc-500" />
                      {row.type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{[row.brand, row.model].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{assignedName || 'Unassigned'}</td>
                  <td className="px-4 py-3"><span className={row.entity === 'india' ? 'text-violet-600' : 'text-blue-600'}>{row.entity === 'india' ? 'India' : row.entity === 'both' ? 'Both' : 'US'}</span></td>
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
                  <td className="px-4 py-3">{conditionBadge(row.condition)}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.purchase_date ? new Date(row.purchase_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{warrantyDisplay(row.warranty_expiry)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Edit</Button>
                    {canDelete && <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(row.id)}>Delete</Button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detailId && detail && (
        <Modal onClose={() => { setDetailId(null); setDetail(null); }} maxWidth="lg">
          <ModalHeader title={detail.name || detail.asset_tag || detail.asset || 'Hardware'} onClose={() => { setDetailId(null); setDetail(null); }} />
          <ModalBody>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-zinc-500">Asset Tag</span><div className="font-medium">{detail.asset_tag || detail.asset || '—'}</div></div>
              <div><span className="text-zinc-500">Type</span><div className="font-medium">{detail.type || '—'}</div></div>
              <div><span className="text-zinc-500">Brand / Model</span><div className="font-medium">{(detail.brand || '') + ' ' + (detail.model || '') || '—'}</div></div>
              <div><span className="text-zinc-500">Serial</span><div className="font-medium">{detail.serial_no || '—'}</div></div>
              <div><span className="text-zinc-500">Assigned To</span><div className="font-medium">{detail.team_members?.name ?? (Array.isArray(detail.team_members) ? detail.team_members[0]?.name : null) ?? 'Unassigned'}</div></div>
              <div><span className="text-zinc-500">Entity</span><div className="font-medium">{detail.entity === 'india' ? 'India' : 'US'}</div></div>
              <div><span className="text-zinc-500">Status</span><div>{statusBadge(detail.status)}</div></div>
              <div><span className="text-zinc-500">Condition</span><div>{conditionBadge(detail.condition)}</div></div>
              <div><span className="text-zinc-500">Warranty</span><div>{warrantyDisplay(detail.warranty_expiry)}</div></div>
              <div><span className="text-zinc-500">Purchase / Cost</span><div className="font-medium">{detail.purchase_date ? new Date(detail.purchase_date).toLocaleDateString() : '—'} {detail.value != null ? formatCurrency(detail.value, detail.currency as 'USD' | 'INR') : ''}</div></div>
            </div>
            {detail.specs && <div className="mt-4"><span className="text-zinc-500 text-xs uppercase">Specs</span><pre className="mt-1 text-sm whitespace-pre-wrap">{detail.specs}</pre></div>}
            {detail.notes && <div className="mt-2"><span className="text-zinc-500 text-xs uppercase">Notes</span><p className="mt-1 text-sm">{detail.notes}</p></div>}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => { setDetailId(null); setDetail(null); }}>Close</Button>
            <Button onClick={() => { openEdit(detail); setDetailId(null); setDetail(null); }}>Edit</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Add modal */}
      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} maxWidth="lg">
          <ModalHeader title="Add Hardware" onClose={() => setAddOpen(false)} />
          <ModalBody>
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Asset Info</h3>
                <FieldRow label="Asset Tag"><FieldInput value={form.asset_tag} onChange={v => setForm(f => ({ ...f, asset_tag: v }))} placeholder="FA-US-001" /></FieldRow>
                <FieldRow label="Name" required><FieldInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></FieldRow>
                <FieldRow label="Type"><FieldSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={[{ value: '', label: '—' }, ...HARDWARE_TYPES]} /></FieldRow>
                <FieldRow label="Brand"><FieldInput value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} /></FieldRow>
                <FieldRow label="Model"><FieldInput value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} /></FieldRow>
                <FieldRow label="Serial Number"><FieldInput value={form.serial_no} onChange={v => setForm(f => ({ ...f, serial_no: v }))} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Assignment</h3>
                <FieldRow label="Assigned To"><FieldSelect value={form.assigned_to} onChange={v => setForm(f => ({ ...f, assigned_to: v }))} options={[{ value: '', label: 'Unassigned' }, ...assignedOptions]} /></FieldRow>
                <FieldRow label="Entity"><FieldSelect value={form.entity} onChange={v => setForm(f => ({ ...f, entity: v }))} options={[{ value: 'US', label: 'US' }, { value: 'India', label: 'India' }]} /></FieldRow>
                <FieldRow label="Location"><FieldInput value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Status</h3>
                <FieldRow label="Status"><FieldSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} /></FieldRow>
                <FieldRow label="Condition"><FieldSelect value={form.condition} onChange={v => setForm(f => ({ ...f, condition: v }))} options={CONDITION_OPTIONS} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Purchase & Warranty</h3>
                <FieldRow label="Purchase Date"><FieldInput type="date" value={form.purchase_date} onChange={v => setForm(f => ({ ...f, purchase_date: v }))} /></FieldRow>
                <FieldRow label="Warranty Expiry"><FieldInput type="date" value={form.warranty_expiry} onChange={v => setForm(f => ({ ...f, warranty_expiry: v }))} /></FieldRow>
                <FieldRow label="Purchase Cost"><FieldInput type="number" value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} /></FieldRow>
                <FieldRow label="Currency"><FieldSelect value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} options={[{ value: 'USD', label: 'USD' }, { value: 'INR', label: 'INR' }]} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Details</h3>
                <FieldRow label="Specs"><textarea value={form.specs} onChange={e => setForm(f => ({ ...f, specs: e.target.value }))} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="RAM, storage..." /></FieldRow>
                <FieldRow label="Notes"><FieldInput value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} /></FieldRow>
              </section>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNew} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Edit modal - reuse same form, different submit */}
      {editId && (
        <Modal onClose={() => setEditId(null)} maxWidth="lg">
          <ModalHeader title="Edit Hardware" onClose={() => setEditId(null)} />
          <ModalBody>
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Asset Info</h3>
                <FieldRow label="Asset Tag"><FieldInput value={form.asset_tag} onChange={v => setForm(f => ({ ...f, asset_tag: v }))} /></FieldRow>
                <FieldRow label="Name" required><FieldInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></FieldRow>
                <FieldRow label="Type"><FieldSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={[{ value: '', label: '—' }, ...HARDWARE_TYPES]} /></FieldRow>
                <FieldRow label="Brand"><FieldInput value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} /></FieldRow>
                <FieldRow label="Model"><FieldInput value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} /></FieldRow>
                <FieldRow label="Serial Number"><FieldInput value={form.serial_no} onChange={v => setForm(f => ({ ...f, serial_no: v }))} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Assignment</h3>
                <FieldRow label="Assigned To"><FieldSelect value={form.assigned_to} onChange={v => setForm(f => ({ ...f, assigned_to: v }))} options={[{ value: '', label: 'Unassigned' }, ...assignedOptions]} /></FieldRow>
                <FieldRow label="Entity"><FieldSelect value={form.entity} onChange={v => setForm(f => ({ ...f, entity: v }))} options={[{ value: 'US', label: 'US' }, { value: 'India', label: 'India' }]} /></FieldRow>
                <FieldRow label="Location"><FieldInput value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Status</h3>
                <FieldRow label="Status"><FieldSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} /></FieldRow>
                <FieldRow label="Condition"><FieldSelect value={form.condition} onChange={v => setForm(f => ({ ...f, condition: v }))} options={CONDITION_OPTIONS} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Purchase & Warranty</h3>
                <FieldRow label="Purchase Date"><FieldInput type="date" value={form.purchase_date} onChange={v => setForm(f => ({ ...f, purchase_date: v }))} /></FieldRow>
                <FieldRow label="Warranty Expiry"><FieldInput type="date" value={form.warranty_expiry} onChange={v => setForm(f => ({ ...f, warranty_expiry: v }))} /></FieldRow>
                <FieldRow label="Purchase Cost"><FieldInput type="number" value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} /></FieldRow>
                <FieldRow label="Currency"><FieldSelect value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} options={[{ value: 'USD', label: 'USD' }, { value: 'INR', label: 'INR' }]} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Details</h3>
                <FieldRow label="Specs"><textarea value={form.specs} onChange={e => setForm(f => ({ ...f, specs: e.target.value }))} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></FieldRow>
                <FieldRow label="Notes"><FieldInput value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} /></FieldRow>
              </section>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
