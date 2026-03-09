'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SidePanel from '@/components/SidePanel'
import { FieldRow, FieldSelect, FieldTextarea } from '@/components/FieldRow'
import { StaffingRequestModal, type StaffingRequestPayload } from '@/components/hr/StaffingRequestModal'
import { HR_REQUEST_STATUS_LABELS, HR_MARKET_BADGE } from '@/lib/hr/types'
import type { HRStaffingRequest, HRRequestType, HRMarket, HRServiceType, HRUrgency } from '@/lib/hr/types'

const REQUEST_TYPES: { value: HRRequestType; label: string }[] = [
  { value: 'New Client', label: 'New Client' },
  { value: 'Expansion', label: 'Expansion' },
  { value: 'Backfill', label: 'Backfill' },
  { value: 'Proactive', label: 'Proactive' },
]
const MARKET_OPTIONS: { value: HRMarket; label: string }[] = [
  { value: 'India', label: 'India' },
  { value: 'US', label: 'US' },
]
const SERVICE_TYPES: { value: HRServiceType; label: string }[] = [
  { value: 'Accounting', label: 'Accounting' },
  { value: 'Non-Accounting', label: 'Non-Accounting' },
  { value: 'Tax', label: 'Tax' },
  { value: 'Advisory', label: 'Advisory' },
]
const URGENCY_OPTIONS: { value: HRUrgency; label: string }[] = [
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
]

const RESOLUTION_OPTIONS = [
  { value: 'hire_new', label: 'Hire New Person' },
  { value: 'assign_existing', label: 'Assign Existing Team Member' },
  { value: 'on_hold', label: 'Put On Hold' },
  { value: 'rejected', label: 'Reject' },
]

function statusBadgeColor(status: string) {
  if (status === 'Approved' || status === 'in_hiring' || status === 'filled') return { bg: '#dcfce7', color: '#166534' }
  if (status === 'Rejected' || status === 'cancelled') return { bg: '#fee2e2', color: '#991b1b' }
  if (status === 'Hold' || status === 'on_hold') return { bg: '#fef3c7', color: '#92400e' }
  return { bg: '#fef3c7', color: '#92400e' }
}

function HRRequestsContent() {
  const searchParams = useSearchParams()
  const [requests, setRequests] = useState<HRStaffingRequest[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [roleTypes, setRoleTypes] = useState<{ id: string; name: string }[]>([])
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([])
  const [currentUser, setCurrentUser] = useState<{ role: string; team_member_id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterMarket, setFilterMarket] = useState<string>('')
  const [selected, setSelected] = useState<HRStaffingRequest | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<HRStaffingRequest | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm] = useState({
    request_type: 'New Client' as HRRequestType,
    client_id: '',
    client_name_new: '',
    role_type_id: '',
    role_title: '',
    positions_needed: 1,
    market: 'India' as HRMarket,
    service_type: 'Accounting' as HRServiceType,
    estimated_monthly_fee: '',
    estimated_start_date: '',
    urgency: 'Medium' as HRUrgency,
    justification: '',
  })
  const [saving, setSaving] = useState(false)
  const [approvalForm, setApprovalForm] = useState({
    resolution_type: 'hire_new' as 'hire_new' | 'assign_existing' | 'on_hold' | 'rejected',
    assigned_team_member_id: '',
    approval_notes: '',
  })

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      const r = await fetch(`/api/hr/requests?${params}`)
      const data = await r.json()
      if (r.ok) setRequests(data.requests ?? [])
    } catch {
      setRequests([])
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchRequests(),
      fetch('/api/hr/role-types').then(r => r.json()).then(d => setRoleTypes(d.roleTypes ?? [])),
      fetch('/api/clients').then(r => r.json()).then(d => {
        const list = Array.isArray(d) ? d : (d.clients ?? d.data ?? [])
        setClients(list.map((c: any) => ({ id: c.id, name: c.name || c.id })))
      }),
      fetch('/api/team').then(r => r.json()).then(d => setTeamMembers(Array.isArray(d) ? d : (d.members ?? []).map((m: any) => ({ id: m.id, name: m.name })))),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setCurrentUser({ role: d.role, team_member_id: d.team_member_id })),
    ]).finally(() => setLoading(false))
  }, [filterStatus])

  useEffect(() => {
    if (searchParams?.get('new') === '1') setNewOpen(true)
  }, [searchParams])

  useEffect(() => {
    if (!selected) {
      setSelectedDetail(null)
      return
    }
    fetch(`/api/hr/requests/${selected.id}`)
      .then(r => r.json())
      .then(d => setSelectedDetail(d))
      .catch(() => setSelectedDetail(null))
  }, [selected?.id])

  const filtered = requests.filter(r => {
    if (filterType && r.request_type !== filterType) return false
    if (filterMarket && r.market !== filterMarket) return false
    return true
  })

  const handleCreate = async () => {
    const isNewClient = form.request_type === 'New Client'
    if (isNewClient) {
      if (!form.client_name_new?.trim()) {
        alert('Please enter the new client name.')
        return
      }
      if (!form.role_title?.trim()) {
        alert('Please enter role title.')
        return
      }
    } else {
      if (!form.client_id || !form.role_title?.trim()) {
        alert('Please select client and enter role title.')
        return
      }
    }
    setSaving(true)
    let clientId = form.client_id
    if (isNewClient && form.client_name_new?.trim()) {
      try {
        const createRes = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.client_name_new.trim(),
            vertical: 'other',
            active: true,
          }),
        })
        const createData = await createRes.json()
        if (!createRes.ok) {
          alert(createData?.error || 'Failed to create client')
          setSaving(false)
          return
        }
        clientId = createData.id
      } catch {
        alert('Failed to create client')
        setSaving(false)
        return
      }
    }
    const res = await fetch('/api/hr/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        client_id: clientId,
        estimated_monthly_fee: form.estimated_monthly_fee ? parseFloat(form.estimated_monthly_fee) : null,
        estimated_start_date: form.estimated_start_date || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      alert(data.error || 'Failed to create request')
      return
    }
    setNewOpen(false)
    setForm({ ...form, client_id: '', client_name_new: '', role_title: '', justification: '' })
    fetchRequests()
  }

  const handleWizardSubmit = async (payload: StaffingRequestPayload) => {
    setSaving(true)
    let clientId = payload.client_id
    if (payload.request_type === 'New Client' && payload.new_client_name?.trim()) {
      try {
        const createRes = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.new_client_name.trim(),
            vertical: 'other',
            active: true,
          }),
        })
        const createData = await createRes.json()
        if (!createRes.ok) {
          alert(createData?.error || 'Failed to create client')
          setSaving(false)
          return
        }
        clientId = createData.id
      } catch {
        alert('Failed to create client')
        setSaving(false)
        return
      }
    }
    const res = await fetch('/api/hr/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_type: payload.request_type,
        client_id: clientId,
        role_type_id: null,
        role_title: payload.role_title,
        positions_needed: payload.positions_needed,
        market: payload.market,
        service_type: payload.service_type ?? 'Accounting',
        estimated_monthly_fee: payload.estimated_monthly_fee ?? null,
        estimated_start_date: payload.estimated_start_date || null,
        urgency: payload.urgency,
        justification: payload.justification || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      alert(data.error || 'Failed to create request')
      return
    }
    setNewOpen(false)
    fetchRequests()
  }

  const handleApproval = async (decision: 'approve' | 'reject' | 'hold') => {
    if (!selectedDetail?.id) return
    if (decision === 'approve' && approvalForm.resolution_type === 'assign_existing' && !approvalForm.assigned_team_member_id) {
      alert('Please select a team member for Assign Existing.')
      return
    }
    setSaving(true)
    const body: Record<string, unknown> = {
      decision,
      approval_notes: approvalForm.approval_notes || null,
    }
    if (decision === 'approve') {
      body.resolution_type = approvalForm.resolution_type
      if (approvalForm.resolution_type === 'assign_existing') body.assigned_team_member_id = approvalForm.assigned_team_member_id
    }
    const res = await fetch(`/api/hr/requests/${selectedDetail.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      alert(data.error || 'Failed to submit')
      return
    }
    setSelected(null)
    setSelectedDetail(null)
    setApprovalForm({ resolution_type: 'hire_new', assigned_team_member_id: '', approval_notes: '' })
    fetchRequests()
  }

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }))
  const statusOptions = Object.entries(HR_REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label }))
  const showApprovalSection = selectedDetail && (selectedDetail.status === 'Pending' || selectedDetail.status === 'pending_approval') && (currentUser?.role === 'admin' || currentUser?.role === 'hr_manager')

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b' }}>Staffing Requests</h1>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          style={{
            padding: '8px 16px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + New Request
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7', fontSize: 13 }}
        >
          <option value="">All statuses</option>
          {statusOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7', fontSize: 13 }}
        >
          <option value="">All types</option>
          {REQUEST_TYPES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterMarket}
          onChange={e => setFilterMarket(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7', fontSize: 13 }}
        >
          <option value="">All markets</option>
          {MARKET_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Client</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>By</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#a1a1aa' }}>Loading...</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#71717a' }}>No staffing requests yet.</td>
              </tr>
            )}
            {!loading && filtered.map(req => {
              const sc = statusBadgeColor(req.status)
              return (
                <tr
                  key={req.id}
                  onClick={() => setSelected(req)}
                  style={{ borderBottom: '1px solid #f4f4f5', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>
                    {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#09090b' }}>{req.client_name ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>{req.role_title}</td>
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>{req.request_type}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                      {HR_REQUEST_STATUS_LABELS[req.status] ?? req.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#71717a' }}>{req.raised_by_name ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <StaffingRequestModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onSubmit={handleWizardSubmit}
        clients={clients}
      />

      <SidePanel open={newOpen} onClose={() => setNewOpen(false)} title="New Staffing Request (Quick)" subtitle="Fill required fields">
        <FieldRow label="Request Type" required>
          <FieldSelect value={form.request_type} onChange={v => setForm({ ...form, request_type: v as HRRequestType })} options={REQUEST_TYPES} />
        </FieldRow>
        {form.request_type === 'New Client' ? (
          <FieldRow label="New Client Name" required>
            <input
              value={form.client_name_new}
              onChange={e => setForm({ ...form, client_name_new: e.target.value })}
              placeholder="Enter new client name"
              style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }}
            />
          </FieldRow>
        ) : (
          <FieldRow label="Client" required>
            <FieldSelect value={form.client_id} onChange={v => setForm({ ...form, client_id: v })} options={[{ value: '', label: 'Select client' }, ...clientOptions]} />
          </FieldRow>
        )}
        <FieldRow label="Role Type">
          <FieldSelect value={form.role_type_id} onChange={v => setForm({ ...form, role_type_id: v })} options={[{ value: '', label: 'Select' }, ...roleTypes.map(rt => ({ value: rt.id, label: rt.name }))]} />
        </FieldRow>
        <FieldRow label="Role Title" required>
          <input value={form.role_title} onChange={e => setForm({ ...form, role_title: e.target.value })} placeholder="e.g. Tax Accountant" style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }} />
        </FieldRow>
        <FieldRow label="Positions Needed">
          <input type="number" value={form.positions_needed} onChange={e => setForm({ ...form, positions_needed: parseInt(e.target.value, 10) || 1 })} style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }} />
        </FieldRow>
        <FieldRow label="Market">
          <FieldSelect value={form.market} onChange={v => setForm({ ...form, market: v as HRMarket })} options={MARKET_OPTIONS} />
        </FieldRow>
        <FieldRow label="Service Type">
          <FieldSelect value={form.service_type} onChange={v => setForm({ ...form, service_type: v as HRServiceType })} options={SERVICE_TYPES} />
        </FieldRow>
        <FieldRow label="Estimated Monthly Fee">
          <input type="number" value={form.estimated_monthly_fee} onChange={e => setForm({ ...form, estimated_monthly_fee: e.target.value })} placeholder="Currency" style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }} />
        </FieldRow>
        <FieldRow label="Estimated Start Date">
          <input type="date" value={form.estimated_start_date} onChange={e => setForm({ ...form, estimated_start_date: e.target.value })} style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }} />
        </FieldRow>
        <FieldRow label="Urgency">
          <FieldSelect value={form.urgency} onChange={v => setForm({ ...form, urgency: v as HRUrgency })} options={URGENCY_OPTIONS} />
        </FieldRow>
        <FieldRow label="Justification">
          <FieldTextarea value={form.justification} onChange={v => setForm({ ...form, justification: v })} placeholder="Business justification..." />
        </FieldRow>
        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={handleCreate} disabled={saving} style={{ width: '100%', padding: 10, background: saving ? '#a78bfa' : '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </SidePanel>

      <SidePanel
        open={!!selected}
        onClose={() => { setSelected(null); setSelectedDetail(null); setApprovalForm({ resolution_type: 'hire_new', assigned_team_member_id: '', approval_notes: '' }) }}
        title={selectedDetail?.role_title ?? selected?.role_title ?? 'Request'}
        subtitle={selectedDetail ? `${selectedDetail.client_name ?? ''} · ${HR_REQUEST_STATUS_LABELS[selectedDetail.status] ?? selectedDetail.status}` : ''}
      >
        {selectedDetail && (
          <div style={{ fontSize: 13 }}>
            {/* Section A: Request details (read-only) */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Request details</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div><span style={{ color: '#71717a' }}>Type:</span> {selectedDetail.request_type}</div>
                <div><span style={{ color: '#71717a' }}>Client:</span> {selectedDetail.client_name ?? '—'}</div>
                <div><span style={{ color: '#71717a' }}>Role:</span> {selectedDetail.role_title}</div>
                <div><span style={{ color: '#71717a' }}>Positions needed:</span> {selectedDetail.positions_needed}</div>
                <div><span style={{ color: '#71717a' }}>Market:</span> {HR_MARKET_BADGE[selectedDetail.market]?.label ?? selectedDetail.market}</div>
                <div><span style={{ color: '#71717a' }}>Urgency:</span> {selectedDetail.urgency}</div>
                <div><span style={{ color: '#71717a' }}>Raised by:</span> {selectedDetail.raised_by_name ?? '—'}</div>
                <div><span style={{ color: '#71717a' }}>Raised date:</span> {new Date(selectedDetail.created_at).toLocaleDateString()}</div>
                <div>
                  <span style={{ color: '#71717a' }}>Status:</span>{' '}
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, ...statusBadgeColor(selectedDetail.status) }}>
                    {HR_REQUEST_STATUS_LABELS[selectedDetail.status] ?? selectedDetail.status}
                  </span>
                </div>
              </div>
              {selectedDetail.justification && (
                <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Justification</div>
                  <p style={{ margin: 0, color: '#52525b' }}>{selectedDetail.justification}</p>
                </div>
              )}
            </div>

            {/* Section B: Approval actions (admin only, when pending) */}
            {showApprovalSection && (
              <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Approval decision</div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>Resolution:</div>
                  {RESOLUTION_OPTIONS.map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="resolution_type"
                        checked={approvalForm.resolution_type === opt.value}
                        onChange={() => setApprovalForm({ ...approvalForm, resolution_type: opt.value as any })}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {approvalForm.resolution_type === 'assign_existing' && (
                  <FieldRow label="Team member">
                    <FieldSelect
                      value={approvalForm.assigned_team_member_id}
                      onChange={v => setApprovalForm({ ...approvalForm, assigned_team_member_id: v })}
                      options={[{ value: '', label: 'Select team member' }, ...teamMembers.map(m => ({ value: m.id, label: m.name }))]}
                    />
                  </FieldRow>
                )}
                <FieldRow label="Notes">
                  <FieldTextarea value={approvalForm.approval_notes} onChange={v => setApprovalForm({ ...approvalForm, approval_notes: v })} placeholder="Approval notes..." rows={3} />
                </FieldRow>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setSelected(null)} style={{ padding: '8px 16px', border: '1px solid #e4e4e7', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                  <button type="button" onClick={() => handleApproval('hold')} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: '#d97706', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Hold</button>
                  <button type="button" onClick={() => handleApproval('reject')} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Reject</button>
                  <button type="button" onClick={() => handleApproval('approve')} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Approve</button>
                </div>
              </div>
            )}
          </div>
        )}
      </SidePanel>
    </div>
  )
}

export default function HRRequestsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, background: '#fafafa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <HRRequestsContent />
    </Suspense>
  )
}
