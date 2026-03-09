'use client'
import React, { useState, useEffect } from 'react'
import SidePanel from '@/components/SidePanel'
import SubNav from '@/components/SubNav'
import { FieldRow, FieldInput, FieldSelect, FieldTextarea, SaveButton } from '@/components/FieldRow'

const VERTICAL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  restaurant: { label: 'Restaurant',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  insurance:  { label: 'Insurance',     color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  property:   { label: 'Property Mgmt', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  saas_ites:  { label: 'SaaS / ITES',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  cpa_firm:   { label: 'CPA Firm',      color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
}

const CLOSE_STATUS_OPTIONS = [
  { value: 'on_track', label: 'On track' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'complete', label: 'Complete' },
]

const PERIOD_TYPE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
]

export default function ClientUpdatesPage() {
  const [periods, setPeriods] = useState<any[]>([])
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false)
  const [newPeriod, setNewPeriod] = useState({ title: '', period_type: 'weekly', start_date: '', end_date: '' })
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})
  const [actionItems, setActionItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState({ description: '', owner: '', due_date: '', priority: 'medium' })
  const [saving, setSaving] = useState(false)
  const [addingItem, setAddingItem] = useState(false)

  useEffect(() => { fetchPeriods() }, [])

  useEffect(() => {
    if (selectedPeriodId) fetchUpdates()
    else setUpdates([])
  }, [selectedPeriodId])

  const fetchPeriods = async () => {
    try {
      const res = await fetch('/api/review-periods')
      const data = await res.json().catch(() => [])
      setPeriods(Array.isArray(data) ? data : [])
    } catch {
      setPeriods([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUpdates = async () => {
    if (!selectedPeriodId) return
    const data = await fetch(`/api/client-updates?period_id=${selectedPeriodId}`).then(r => r.json())
    setUpdates(Array.isArray(data) ? data : [])
  }

  const createPeriod = async () => {
    setCreating(true)
    const res = await fetch('/api/review-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPeriod),
    })
    const json = await res.json().catch(() => ({}))
    setNewPeriod({ title: '', period_type: 'weekly', start_date: '', end_date: '' })
    setShowNewPeriodForm(false)
    await fetchPeriods()
    if (json.id) setSelectedPeriodId(json.id)
    setCreating(false)
  }

  const openPanel = (u: any) => {
    setSelected(u)
    setForm({
      close_status: u.close_status ?? 'on_track',
      client_call_held: u.client_call_held ?? false,
      call_date: u.call_date ?? '',
      call_notes: u.call_notes ?? '',
      team_performance_notes: u.team_performance_notes ?? '',
      escalation_raised: u.escalation_raised ?? false,
      status: u.status ?? 'pending',
      marked_reviewed: u.status === 'reviewed',
    })
    setActionItems(Array.isArray(u.action_items) ? u.action_items : [])
  }

  const saveUpdate = async () => {
    if (!selected) return
    setSaving(true)
    const res = await fetch('/api/client-updates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, ...form }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || data.error) return
    await fetchUpdates()
    setSelected(null)
  }

  const addActionItem = async () => {
    if (!selected || !newItem.description.trim()) return
    setAddingItem(true)
    await fetch('/api/client-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_update_id: selected.id,
        description: newItem.description,
        owner: newItem.owner || undefined,
        due_date: newItem.due_date || undefined,
        priority: newItem.priority,
      }),
    })
    setNewItem({ description: '', owner: '', due_date: '', priority: 'medium' })
    await fetchUpdates()
    const list = await fetch(`/api/client-updates?period_id=${selectedPeriodId}`).then(r => r.json())
    const u = Array.isArray(list) ? list.find((x: any) => x.id === selected.id) : null
    setActionItems(Array.isArray(u?.action_items) ? u.action_items : [])
    setAddingItem(false)
  }

  const currentPeriod = periods.find((p: any) => (p.review_period_id || p.id) === selectedPeriodId) || periods.find((p: any) => p.id === selectedPeriodId)
  const totalClients = currentPeriod?.total_clients ?? updates.length
  const submitted = currentPeriod?.submitted_count ?? updates.filter((u: any) => u.status === 'submitted').length
  const pending = currentPeriod?.pending_count ?? updates.filter((u: any) => u.status === 'pending').length
  const atRisk = currentPeriod?.at_risk_count ?? updates.filter((u: any) => u.close_status === 'at_risk').length
  const periodEnd = currentPeriod?.end_date ?? null
  const pendingPastDue = periodEnd ? updates.filter((u: any) => u.status === 'pending' && new Date(periodEnd) < new Date()).length : 0

  const grouped = (updates as any[]).reduce((acc, u) => {
    const v = u.clients?.vertical ?? 'other'
    if (!acc[v]) acc[v] = []
    acc[v].push(u)
    return acc
  }, {} as Record<string, any[]>)
  const verticalOrder = ['restaurant', 'insurance', 'property', 'saas_ites', 'cpa_firm'].filter(v => grouped[v]?.length)

  const statusBadge = (s: string) => {
    if (s === 'on_track') return <span className="badge badge-green">On track</span>
    if (s === 'at_risk') return <span className="badge badge-yellow">At risk</span>
    if (s === 'delayed') return <span className="badge badge-red">Delayed</span>
    if (s === 'complete') return <span className="badge badge-violet">Complete</span>
    return <span className="badge badge-gray">{s}</span>
  }

  const updateStatusBadge = (s: string) => {
    if (s === 'pending') return <span className="badge badge-yellow">Pending</span>
    if (s === 'submitted') return <span className="badge badge-blue">Submitted</span>
    if (s === 'reviewed') return <span className="badge badge-green">Reviewed</span>
    return <span className="badge badge-gray">{s}</span>
  }

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa' }}>Loading...</div>

  if (!selectedPeriodId) {
    return (
      <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>Client Updates</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>Select or create a review period to manage client updates</p>
        </div>
        <SubNav />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#71717a', fontSize: '15px' }}>
          <p style={{ fontWeight: 600, color: '#09090b', marginBottom: '16px' }}>Select or create a review period</p>
          <button
            onClick={() => setShowNewPeriodForm(!showNewPeriodForm)}
            style={{ padding: '10px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            New Review Period
          </button>

          {showNewPeriodForm && (
            <div style={{ marginTop: '24px', width: '100%', maxWidth: '400px', background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '20px' }}>
              <FieldRow label="Title">
                <FieldInput value={newPeriod.title} onChange={v => setNewPeriod({ ...newPeriod, title: v })} placeholder="e.g. March 2025 Week 1" />
              </FieldRow>
              <FieldRow label="Period type">
                <FieldSelect value={newPeriod.period_type} onChange={v => setNewPeriod({ ...newPeriod, period_type: v })} options={PERIOD_TYPE_OPTIONS} />
              </FieldRow>
              <FieldRow label="Start date">
                <FieldInput type="date" value={newPeriod.start_date} onChange={v => setNewPeriod({ ...newPeriod, start_date: v })} />
              </FieldRow>
              <FieldRow label="End date">
                <FieldInput type="date" value={newPeriod.end_date} onChange={v => setNewPeriod({ ...newPeriod, end_date: v })} />
              </FieldRow>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={createPeriod} disabled={creating} style={{ flex: 1, padding: '10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => setShowNewPeriodForm(false)} style={{ padding: '10px 16px', background: 'white', color: '#71717a', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {periods.length > 0 && (
            <div style={{ marginTop: '24px', width: '100%', maxWidth: '400px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', marginBottom: '8px' }}>Or select existing period</p>
              <select
                value={selectedPeriodId ?? ''}
                onChange={e => setSelectedPeriodId(e.target.value || null)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '13px', background: 'white' }}
              >
                <option value="">— Select period —</option>
                {periods.map((p: any) => (
                  <option key={p.review_period_id || p.id} value={p.review_period_id || p.id}>
                    {p.title} ({p.start_date} – {p.end_date})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>{currentPeriod?.title ?? 'Client Updates'}</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>
            {currentPeriod?.start_date} – {currentPeriod?.end_date} · {totalClients} clients
          </p>
        </div>
        <SubNav />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentPeriod?.status && (
            <span className={`badge ${currentPeriod.status === 'active' ? 'badge-green' : currentPeriod.status === 'closed' ? 'badge-gray' : 'badge-yellow'}`}>
              {currentPeriod.status}
            </span>
          )}
          <select
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '13px', background: 'white', minWidth: '220px' }}
          >
            {periods.map((p: any) => (
              <option key={p.review_period_id || p.id} value={p.review_period_id || p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total Clients', value: totalClients, color: '#7c3aed' },
          { label: 'Submitted', value: submitted, color: '#2563eb' },
          { label: 'Pending', value: pending, color: '#d97706' },
          { label: 'At Risk', value: atRisk, color: '#e11d48' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#09090b' }}>{k.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {pendingPastDue > 0 && (
        <div style={{ background: '#fff8f8', border: '1px solid #fecdd3', borderRadius: '8px', padding: '11px 16px', marginBottom: '16px', fontSize: '13px', color: '#e11d48', fontWeight: 500 }}>
          ⚠ {pendingPastDue} pending update{pendingPastDue > 1 ? 's' : ''} past end date
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>
          Updates by vertical · Click row to edit
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Owner</th>
              <th>Close Status</th>
              <th>Call Held</th>
              <th>Action Items</th>
              <th>Escalation</th>
              <th>Update Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {verticalOrder.map(v => (
              <React.Fragment key={v}>
                <tr style={{ background: VERTICAL_CONFIG[v]?.bg ?? '#fafafa' }}>
                  <td colSpan={8} style={{ fontSize: '11px', fontWeight: 700, color: VERTICAL_CONFIG[v]?.color ?? '#71717a', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 20px' }}>
                    {VERTICAL_CONFIG[v]?.label ?? v}
                  </td>
                </tr>
                {(grouped[v] ?? []).map((u: any) => (
                  <tr key={u.id} onClick={() => openPanel(u)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: '#09090b' }}>{u.clients?.name ?? '—'}</td>
                    <td style={{ color: '#71717a' }}>{u.team_members?.name ?? '—'}</td>
                    <td>{statusBadge(u.close_status)}</td>
                    <td>{u.client_call_held ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.action_items_count ?? 0}</td>
                    <td>{u.escalation_raised ? <span className="badge badge-red">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                    <td>{updateStatusBadge(u.status)}</td>
                    <td style={{ fontSize: '12px', color: '#a1a1aa' }}>{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <SidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.clients?.name ?? 'Client update'}
        subtitle={selected?.clients?.vertical ? VERTICAL_CONFIG[selected.clients.vertical]?.label ?? selected.clients.vertical : undefined}
      >
        <FieldRow label="Close status">
          <FieldSelect value={form.close_status} onChange={v => setForm({ ...form, close_status: v })} options={CLOSE_STATUS_OPTIONS} />
        </FieldRow>
        <FieldRow label="Client call held">
          <FieldSelect
            value={form.client_call_held ? 'true' : 'false'}
            onChange={v => setForm({ ...form, client_call_held: v === 'true' })}
            options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]}
          />
        </FieldRow>
        {form.client_call_held && (
          <>
            <FieldRow label="Call date">
              <FieldInput type="date" value={form.call_date} onChange={v => setForm({ ...form, call_date: v })} />
            </FieldRow>
            <FieldRow label="Call notes">
              <FieldTextarea value={form.call_notes} onChange={v => setForm({ ...form, call_notes: v })} placeholder="Notes from client call..." />
            </FieldRow>
          </>
        )}
        <FieldRow label="Team performance notes">
          <FieldTextarea value={form.team_performance_notes} onChange={v => setForm({ ...form, team_performance_notes: v })} placeholder="Internal notes..." />
        </FieldRow>
        <FieldRow label="Escalation raised">
          <FieldSelect
            value={form.escalation_raised ? 'true' : 'false'}
            onChange={v => setForm({ ...form, escalation_raised: v === 'true' })}
            options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]}
          />
        </FieldRow>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f4f4f5' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#71717a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Action items</div>
          {Array.isArray(actionItems) && actionItems.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#09090b', marginBottom: '12px' }}>
              {actionItems.map((item: any) => (
                <li key={item.id}>{item.description}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '12px' }}>No action items yet.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <FieldInput value={newItem.description} onChange={v => setNewItem({ ...newItem, description: v })} placeholder="New action item..." />
            <div style={{ display: 'flex', gap: '8px' }}>
              <FieldInput value={newItem.owner} onChange={v => setNewItem({ ...newItem, owner: v })} placeholder="Owner" />
              <FieldInput type="date" value={newItem.due_date} onChange={v => setNewItem({ ...newItem, due_date: v })} placeholder="Due date" />
              <select value={newItem.priority} onChange={e => setNewItem({ ...newItem, priority: e.target.value })} style={{ padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '13px' }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button onClick={addActionItem} disabled={addingItem} style={{ padding: '8px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              + Add Item
            </button>
          </div>
        </div>
        <FieldRow label="Update status">
          <FieldSelect
            value={form.status}
            onChange={v => setForm({ ...form, status: v })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'reviewed', label: 'Reviewed' },
            ]}
          />
        </FieldRow>
        <div style={{ marginTop: '16px' }}>
          <SaveButton onClick={saveUpdate} saving={saving} />
        </div>
      </SidePanel>
    </div>
  )
}
