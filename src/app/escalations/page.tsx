'use client'
import { useState, useEffect } from 'react'
import SidePanel from '@/components/SidePanel'
import ErrorBanner from '@/components/ErrorBanner'
import { FieldRow, FieldInput, FieldTextarea, FieldSelect } from '@/components/FieldRow'

const VERTICAL_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  insurance: 'Insurance',
  property: 'Property Mgmt',
  saas_ites: 'SaaS / ITES',
  cpa_firm: 'CPA Firm',
}

const VERTICAL_COLORS: Record<string, string> = {
  restaurant: '#7c3aed',
  insurance: '#2563eb',
  property: '#059669',
  saas_ites: '#d97706',
  cpa_firm: '#0891b2',
}

const STEP_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '1', label: 'Step 1 - Documents' },
  { value: '2', label: 'Step 2 - Bookkeeping' },
  { value: '3', label: 'Step 3 - Bank Recon' },
  { value: '4', label: 'Step 4 - Payroll' },
  { value: '5', label: 'Step 5 - AR/AP' },
  { value: '6', label: 'Step 6 - Draft Financials' },
  { value: '7', label: 'Step 7 - Review' },
  { value: '8', label: 'Step 8 - Delivered' },
]

const emptyCreateForm = () => ({
  client_id: '',
  title: '',
  description: '',
  priority: 'medium' as string,
  raised_by_id: '',
  step_related: 'none',
})

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [createMode, setCreateMode] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm())
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [successBanner, setSuccessBanner] = useState(false)

  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoadError(null)
    try {
      const [escRes, clientsRes, teamRes] = await Promise.all([
        fetch('/api/escalations').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load'))),
        fetch('/api/clients').then(r => r.json().catch(() => [])),
        fetch('/api/team').then(r => r.json().catch(() => [])),
      ])
      setEscalations(Array.isArray(escRes) ? escRes : [])
      setClients(Array.isArray(clientsRes) ? clientsRes : [])
      setTeamMembers(Array.isArray(teamRes) ? teamRes : [])
    } catch (e) {
      setLoadError((e as Error).message ?? 'Failed to load data')
      setEscalations([])
      setClients([])
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (createMode && teamMembers.length > 0 && !createForm.raised_by_id) {
      const ganesh = teamMembers.find((m: any) => m.name?.toLowerCase().includes('ganesh'))
      const first = teamMembers[0]
      setCreateForm(f => ({ ...f, raised_by_id: ganesh?.id ?? first?.id ?? '' }))
    }
  }, [createMode, teamMembers])

  const refetchEscalations = async () => {
    const data = await fetch('/api/escalations').then(r => r.json().catch(() => []))
    setEscalations(Array.isArray(data) ? data : [])
  }

  const openPanel = (e: any) => {
    setCreateMode(false)
    setSelected(e)
    setForm({
      status: e.status,
      resolution_notes: e.resolution_notes ?? '',
      priority: e.priority,
    })
  }

  const openCreate = () => {
    setSelected(null)
    setCreateMode(true)
    setCreateForm(emptyCreateForm())
    setCreateErrors({})
    if (teamMembers.length > 0) {
      const ganesh = teamMembers.find((m: any) => m.name?.toLowerCase().includes('ganesh'))
      const first = teamMembers[0]
      setCreateForm(f => ({ ...f, raised_by_id: ganesh?.id ?? first?.id ?? '' }))
    }
  }

  const closeCreate = () => {
    setCreateMode(false)
    setCreateForm(emptyCreateForm())
    setCreateErrors({})
  }

  const save = async () => {
    if (!selected?.id) return
    setSaving(true)
    const res = await fetch('/api/escalations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, ...form }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || data.error) return
    await refetchEscalations()
    setSelected(null)
  }

  const validateCreate = () => {
    const e: Record<string, string> = {}
    if (!createForm.client_id) e.client_id = 'Client is required'
    if (!createForm.title?.trim()) e.title = 'Issue title is required'
    if (!createForm.description?.trim()) e.description = 'Description is required'
    setCreateErrors(e)
    return Object.keys(e).length === 0
  }

  const submitCreate = async () => {
    if (!validateCreate()) return
    setSaving(true)
    setCreateErrors({})
    const res = await fetch('/api/escalations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: createForm.client_id,
        title: createForm.title.trim().slice(0, 100),
        description: createForm.description.trim(),
        priority: createForm.priority,
        raised_by_id: createForm.raised_by_id || null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || data.error) {
      setCreateErrors({ submit: data.error || 'Failed to raise escalation' })
      return
    }
    closeCreate()
    await refetchEscalations()
    setSuccessBanner(true)
    setTimeout(() => setSuccessBanner(false), 3000)
  }

  const open = escalations.filter(e => e.status === 'open')
  const acked = escalations.filter(e => e.status === 'acknowledged')
  const resolved = escalations.filter(e => e.status === 'resolved' || e.status === 'closed')

  const priorityBadge = (p: string) => {
    if (p === 'critical' || p === 'high') return <span className="badge badge-red">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
    if (p === 'medium') return <span className="badge badge-yellow">Medium</span>
    return <span className="badge badge-gray">Low</span>
  }

  const statusBadge = (s: string) => {
    if (s === 'open')         return <span className="badge badge-red">Open</span>
    if (s === 'acknowledged') return <span className="badge badge-yellow">Acknowledged</span>
    if (s === 'resolved')     return <span className="badge badge-green">Resolved</span>
    return <span className="badge badge-gray">Closed</span>
  }

  const activeClients = (clients ?? []).filter((c: any) => c.active !== false)
  const clientsByVertical = activeClients.reduce((acc: Record<string, any[]>, c: any) => {
    const v = c.vertical || 'other'
    if (!acc[v]) acc[v] = []
    acc[v].push(c)
    return acc
  }, {})
  const verticalOrder = ['restaurant', 'insurance', 'property', 'saas_ites', 'cpa_firm']

  const priorityStyles: Record<string, { bg: string; border: string; text: string }> = {
    low:      { bg: '#f4f4f5', border: '#e4e4e7', text: '#71717a' },
    medium:   { bg: '#fef9c3', border: '#fde68a', text: '#d97706' },
    high:     { bg: '#fff4ed', border: '#fed7aa', text: '#ea580c' },
    critical: { bg: '#fff1f2', border: '#fecdd3', text: '#e11d48' },
  }

  const EscTable = ({ items, emptyMsg }: { items: any[], emptyMsg: string }) => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Client</th>
          <th>Issue</th>
          <th>Raised By</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Date</th>
          <th>Resolution</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#a1a1aa' }}>{emptyMsg}</td></tr>
        )}
        {items.map(e => (
          <tr key={e.id} onClick={() => openPanel(e)} style={{ cursor: 'pointer', background: e.priority === 'critical' ? '#fff8f8' : 'white' }}>
            <td style={{ fontWeight: 600, color: '#09090b' }}>{e.clients?.name ?? '—'}</td>
            <td style={{ color: '#09090b' }}>{e.title}</td>
            <td style={{ color: '#71717a' }}>{e.team_members?.name ?? '—'}</td>
            <td>{priorityBadge(e.priority)}</td>
            <td>{statusBadge(e.status)}</td>
            <td style={{ fontSize: '12px', color: '#a1a1aa' }}>
              {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </td>
            <td style={{ fontSize: '12px', color: '#71717a', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.resolution_notes ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => { setLoading(true); fetchData(); }} onDismiss={() => setLoadError(null)} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>Escalations</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>Click any row to acknowledge or resolve · Teams notified on creation</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '8px 16px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + New Escalation
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Open',         value: open.length,     color: '#e11d48' },
          { label: 'Acknowledged', value: acked.length,    color: '#d97706' },
          { label: 'Resolved',     value: resolved.length, color: '#059669' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#09090b' }}>{k.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {open.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #fecdd3', borderRadius: '12px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #fecdd3', fontSize: '13px', fontWeight: 600, color: '#e11d48', background: '#fff8f8' }}>
            ⚑ Open — Requires Your Action ({open.length})
          </div>
          <EscTable items={open} emptyMsg="No open escalations" />
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>
          Acknowledged ({acked.length})
        </div>
        <EscTable items={acked} emptyMsg="None" />
      </div>

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>
          Resolved ({resolved.length})
        </div>
        <EscTable items={resolved} emptyMsg="No resolved escalations yet" />
      </div>

      {/* Edit Side Panel */}
      <SidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? 'Escalation'}
        subtitle={`${selected?.clients?.name ?? ''} · Raised by ${selected?.team_members?.name ?? ''}`}
      >
        <div style={{ background: '#fafafa', border: '1px solid #f4f4f5', borderRadius: '8px', padding: '14px', marginBottom: '20px', fontSize: '13px', color: '#09090b', lineHeight: 1.6 }}>
          {selected?.description}
        </div>
        <FieldRow label="Priority">
          <FieldSelect
            value={form.priority ?? 'medium'}
            onChange={v => setForm({ ...form, priority: v })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
          />
        </FieldRow>
        <FieldRow label="Update Status">
          <FieldSelect
            value={form.status ?? 'open'}
            onChange={v => setForm({ ...form, status: v })}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'acknowledged', label: 'Acknowledged' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </FieldRow>
        <FieldRow label="Resolution Notes">
          <FieldTextarea
            value={form.resolution_notes ?? ''}
            onChange={v => setForm({ ...form, resolution_notes: v })}
            placeholder="Describe how this was resolved or what action was taken..."
            rows={4}
          />
        </FieldRow>
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              width: '100%', padding: '10px', background: saving ? '#a78bfa' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Update Escalation'}
          </button>
        </div>
      </SidePanel>

      {/* Create Side Panel */}
      <SidePanel
        open={createMode}
        onClose={closeCreate}
        title="Raise Escalation"
        subtitle="Notify Ganesh and Rajiv via Teams immediately"
      >
        <FieldRow label="Client" required>
          <select
            value={createForm.client_id}
            onChange={e => setCreateForm({ ...createForm, client_id: e.target.value })}
            style={{
              width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '13px', background: 'white', color: '#09090b',
            }}
          >
            <option value="">Select client...</option>
            {verticalOrder.map(v => {
              const list = clientsByVertical[v]
              if (!list?.length) return null
              return (
                <optgroup key={v} label={VERTICAL_LABELS[v] ?? v}>
                  {list.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {VERTICAL_LABELS[c.vertical] ?? c.vertical}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
          {createErrors.client_id && <div style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px' }}>{createErrors.client_id}</div>}
        </FieldRow>

        <FieldRow label="Issue Title" required>
          <FieldInput
            value={createForm.title}
            onChange={v => setCreateForm({ ...createForm, title: v.slice(0, 100) })}
            placeholder="Brief description of the issue"
          />
          {createErrors.title && <div style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px' }}>{createErrors.title}</div>}
        </FieldRow>

        <FieldRow label="Priority" required>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['low', 'medium', 'high', 'critical'] as const).map(p => {
              const style = priorityStyles[p]
              const selected = createForm.priority === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCreateForm({ ...createForm, priority: p })}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: `1px solid ${selected ? style.border : '#e4e4e7'}`,
                    background: selected ? style.bg : 'white',
                    color: selected ? style.text : '#71717a',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </FieldRow>

        <FieldRow label="Description" required>
          <FieldTextarea
            value={createForm.description}
            onChange={v => setCreateForm({ ...createForm, description: v })}
            placeholder="Describe the issue in detail... What happened? What is the impact? What has been tried?"
            rows={5}
          />
          {createErrors.description && <div style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px' }}>{createErrors.description}</div>}
        </FieldRow>

        <FieldRow label="Raised By">
          <FieldSelect
            value={createForm.raised_by_id}
            onChange={v => setCreateForm({ ...createForm, raised_by_id: v })}
            options={[
              { value: '', label: '— Select —' },
              ...teamMembers.map((m: any) => ({ value: m.id, label: `${m.name} · ${m.role_title ?? m.role ?? '—'}` })),
            ]}
          />
        </FieldRow>

        <FieldRow label="Step Related (optional)">
          <FieldSelect
            value={createForm.step_related}
            onChange={v => setCreateForm({ ...createForm, step_related: v })}
            options={STEP_OPTIONS}
          />
        </FieldRow>

        {createErrors.submit && <div style={{ fontSize: '13px', color: '#e11d48', marginBottom: '12px' }}>{createErrors.submit}</div>}

        <button
          type="button"
          onClick={submitCreate}
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px',
            background: saving ? '#f87171' : '#e11d48',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
            marginTop: '8px',
          }}
        >
          {saving ? 'Raising escalation...' : '⚑ Raise Escalation'}
        </button>
      </SidePanel>

      {/* Success banner */}
      {successBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: '#059669',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            animation: 'slideUp 0.3s ease',
          }}
        >
          Escalation raised · Teams notified
        </div>
      )}
    </div>
  )
}
