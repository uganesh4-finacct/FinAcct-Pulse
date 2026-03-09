'use client'
import { useState, useEffect } from 'react'
import { FieldRow, FieldInput, FieldSelect, FieldTextarea } from '@/components/FieldRow'

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

export default function MyTasksPage() {
  const [pending, setPending] = useState<any[]>([])
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [updatesRes, periodsRes] = await Promise.all([
        fetch('/api/client-updates?status=pending').then(r => r.json().catch(() => [])),
        fetch('/api/review-periods').then(r => r.json().catch(() => [])),
      ])
      setPending(Array.isArray(updatesRes) ? updatesRes : [])
      setPeriods(Array.isArray(periodsRes) ? periodsRes : [])
    } catch {
      setPending([])
      setPeriods([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (u: any) => {
    if (expandedId === u.id) {
      setExpandedId(null)
    } else {
      setExpandedId(u.id)
      setForm({
        close_status: u.close_status ?? 'on_track',
        client_call_held: u.client_call_held ?? false,
        call_date: u.call_date ?? '',
        call_notes: u.call_notes ?? '',
        team_performance_notes: u.team_performance_notes ?? '',
        escalation_raised: u.escalation_raised ?? false,
      })
    }
  }

  const submitUpdate = async (id: string) => {
    setSaving(true)
    await fetch('/api/client-updates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...form, status: 'submitted' }),
    })
    await fetchAll()
    setExpandedId(null)
    setSaving(false)
  }

  const daysLeft = (endDate: string) => {
    if (!endDate) return 999
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const dueDateColor = (d: number) => {
    if (d < 0) return '#e11d48'
    if (d <= 2) return '#d97706'
    return '#059669'
  }

  const statusBadge = (s: string) => {
    if (s === 'on_track') return <span className="badge badge-green">On track</span>
    if (s === 'at_risk') return <span className="badge badge-yellow">At risk</span>
    if (s === 'delayed') return <span className="badge badge-red">Delayed</span>
    if (s === 'complete') return <span className="badge badge-violet">Complete</span>
    return <span className="badge badge-gray">{s}</span>
  }

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa' }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          My Tasks
          {pending.length > 0 && (
            <span style={{ background: '#7c3aed', color: 'white', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px' }}>
              {pending.length} pending
            </span>
          )}
        </h1>
        <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>Pending client updates · Submit when complete</p>
      </div>

      {/* SECTION 1 — Pending Client Updates */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#09090b', marginBottom: '14px' }}>Pending Client Updates</h2>
        {pending.length === 0 ? (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#059669', fontSize: '15px', fontWeight: 600 }}>
            All caught up!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {pending.map((u: any) => {
              const endDate = u.review_periods?.end_date
              const d = daysLeft(endDate ?? '')
              const isExpanded = expandedId === u.id
              return (
                <div key={u.id}>
                  <div
                    onClick={() => toggleExpand(u)}
                    style={{
                      background: 'white',
                      border: '1px solid #e4e4e7',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${VERTICAL_CONFIG[u.clients?.vertical]?.color ?? '#7c3aed'}`,
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#09090b', marginBottom: '6px' }}>{u.clients?.name ?? '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{
                        display: 'inline-flex', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600,
                        background: VERTICAL_CONFIG[u.clients?.vertical]?.bg ?? '#f4f4f5',
                        color: VERTICAL_CONFIG[u.clients?.vertical]?.color ?? '#71717a',
                        border: `1px solid ${VERTICAL_CONFIG[u.clients?.vertical]?.border ?? '#e4e4e7'}`,
                      }}>
                        {VERTICAL_CONFIG[u.clients?.vertical]?.label ?? u.clients?.vertical ?? '—'}
                      </span>
                      {statusBadge(u.close_status)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>{u.review_periods?.title ?? '—'}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: dueDateColor(d) }}>
                      Due {endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      {d !== 999 && (
                        <span style={{ marginLeft: '6px' }}>
                          {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Today' : `${d}d left`}
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '8px', padding: '20px', background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px' }}>
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
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '8px' }}>Action items: {Array.isArray(u.action_items) ? u.action_items.length : 0} item(s)</p>
                      </div>
                      <button
                        onClick={() => submitUpdate(u.id)}
                        disabled={saving}
                        style={{
                          width: '100%', padding: '10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px',
                          fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', marginTop: '8px',
                        }}
                      >
                        {saving ? 'Submitting...' : 'Submit Update'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION 2 — Pending Cost Forms */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#09090b', marginBottom: '14px' }}>Pending Cost Forms</h2>
        <div style={{
          background: '#fafafa',
          border: '2px dashed #e4e4e7',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          color: '#a1a1aa',
          fontSize: '13px',
          fontWeight: 500,
        }}>
          Cost forms coming in Sprint 2B
        </div>
      </div>
    </div>
  )
}
