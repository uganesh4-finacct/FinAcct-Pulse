'use client'
import React, { useState, useEffect } from 'react'
import SidePanel from '@/components/SidePanel'
import SubNav from '@/components/SubNav'
import ErrorBanner from '@/components/ErrorBanner'
import { FieldRow, FieldSelect, FieldTextarea } from '@/components/FieldRow'

const STEPS_ACCOUNTING = ['Docs', 'Bookkeeping', 'Bank Recon', 'Payroll', 'AR/AP', 'Draft', 'Review', 'Delivered']
const STATUS_CYCLE = ['not_started', 'in_progress', 'complete'] as const
const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'returned', label: 'Returned' },
]

function nextStatus(s: string): string {
  const i = STATUS_CYCLE.indexOf(s as any)
  if (i < 0) return 'not_started'
  return STATUS_CYCLE[(i + 1) % 3]
}

export default function CloseTrackerPage() {
  const [data, setData] = useState<{ clients: any[]; steps: Record<string, any[]>; month_year: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [addingClientId, setAddingClientId] = useState<string | null>(null)
  const [newStepName, setNewStepName] = useState('')
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [panelSteps, setPanelSteps] = useState<Record<string, { status: string; notes: string }>>({})
  const [savingAll, setSavingAll] = useState(false)

  const monthYear = typeof window !== 'undefined' ? new Date().toISOString().slice(0, 7) : ''

  const fetchData = async () => {
    setLoadError(null)
    try {
      const res = await fetch(`/api/close-tracker?month_year=${monthYear}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error('Failed to load close tracker')
      setData(json?.clients != null ? json : { clients: [], steps: {}, month_year: monthYear })
    } catch (e) {
      setLoadError((e as Error).message ?? 'Failed to load data')
      setData({ clients: [], steps: {}, month_year: monthYear })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [monthYear])

  const clients = data?.clients ?? []
  const stepsByClient = data?.steps ?? {}

  const getStep = (clientId: string, stepNum: number) =>
    (stepsByClient[clientId] ?? []).find((s: any) => s.step_number === stepNum)
  const getCustomSteps = (clientId: string) =>
    (stepsByClient[clientId] ?? []).filter((s: any) => s.is_custom === true)
  const getClose = (clientId: string) => {
    const steps = stepsByClient[clientId] ?? []
    const standard = steps.filter((s: any) => !s.is_custom)
    const complete = standard.filter((s: any) => s.status === 'complete').length
    return { steps: standard, complete, total: 8 }
  }

  const cycleStep = async (stepId: string, currentStatus: string) => {
    const next = nextStatus(currentStatus)
    const completionDate = next === 'complete' ? new Date().toISOString().split('T')[0] : undefined
    setData(prev => {
      if (!prev) return prev
      const nextSteps = { ...prev.steps }
      for (const [cid, steps] of Object.entries(nextSteps)) {
        const idx = (steps as any[]).findIndex((s: any) => s.id === stepId)
        if (idx >= 0) {
          nextSteps[cid] = (steps as any[]).map((s: any, i) =>
            i === idx ? { ...s, status: next, completion_date: completionDate ?? s.completion_date } : s
          )
          break
        }
      }
      return { ...prev, steps: nextSteps }
    })
    const payload: any = { id: stepId, status: next }
    if (completionDate) payload.completion_date = completionDate
    const res = await fetch('/api/close-steps', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      await fetchData()
      return
    }
    await fetchData()
  }

  const addCustomStep = async (clientId: string) => {
    if (!newStepName.trim()) return
    await fetch('/api/close-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, month_year: monthYear, step_name: newStepName.trim().slice(0, 20) }),
    })
    setNewStepName('')
    setAddingClientId(null)
    await fetchData()
  }

  const deleteCustomStep = async (stepId: string) => {
    await fetch('/api/close-steps', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: stepId }) })
    await fetchData()
  }

  const openRowPanel = (c: any) => {
    setSelectedClient(c)
    const steps = stepsByClient[c.id] ?? []
    const initial: Record<string, { status: string; notes: string }> = {}
    for (let i = 1; i <= 8; i++) {
      const step = steps.find((s: any) => s.step_number === i)
      if (step) initial[step.id] = { status: step.status ?? 'not_started', notes: step.notes ?? '' }
    }
    setPanelSteps(initial)
  }

  const saveAllSteps = async () => {
    if (!selectedClient) return
    setSavingAll(true)
    for (const [stepId, { status, notes }] of Object.entries(panelSteps)) {
      await fetch('/api/close-steps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: stepId, status, notes: notes || undefined, ...(status === 'complete' ? { completion_date: new Date().toISOString().split('T')[0] } : {}) }),
      })
    }
    await fetchData()
    setSavingAll(false)
    setSelectedClient(null)
  }

  const stepDot = (status: string, onClick?: () => void) => {
    const cfg: Record<string, { bg: string; title: string }> = {
      complete:    { bg: '#059669', title: 'Complete' },
      in_progress: { bg: '#7c3aed', title: 'In Progress' },
      blocked:     { bg: '#e11d48', title: 'Blocked' },
      returned:    { bg: '#d97706', title: 'Returned' },
      not_started: { bg: '#e4e4e7', title: 'Not Started' },
    }
    const c = cfg[status] ?? cfg.not_started
    return (
      <div
        title={c.title}
        onClick={onClick ? (e: React.MouseEvent) => { e.stopPropagation(); onClick(); } : undefined}
        style={{
          width: '14px', height: '14px', borderRadius: '99px',
          background: c.bg, margin: '0 auto', flexShrink: 0,
          cursor: 'pointer',
        }}
      />
    )
  }

  const verticalOrder = ['restaurant', 'insurance', 'property', 'saas_ites', 'cpa_firm']
  const verticalLabels: Record<string, string> = {
    restaurant: 'Restaurant', insurance: 'Insurance',
    property: 'Property Mgmt', saas_ites: 'SaaS / ITES', cpa_firm: 'CPA Firm',
  }
  const verticalColors: Record<string, string> = {
    restaurant: '#7c3aed', insurance: '#2563eb',
    property: '#059669', saas_ites: '#d97706', cpa_firm: '#0891b2',
  }

  const sortedByVerticalThenTrack = (list: any[]) => {
    const byVertical: Record<string, any[]> = {}
    list.forEach((c: any) => {
      const v = c.vertical ?? 'restaurant'
      if (!byVertical[v]) byVertical[v] = []
      byVertical[v].push(c)
    })
    verticalOrder.forEach(v => {
      if (byVertical[v]) {
        byVertical[v].sort((a: any, b: any) => {
          const at = (a.service_track === 'non_accounting' ? 1 : 0)
          const bt = (b.service_track === 'non_accounting' ? 1 : 0)
          return at - bt || (a.name || '').localeCompare(b.name || '')
        })
      }
    })
    return byVertical
  }

  const grouped = sortedByVerticalThenTrack(clients)
  const complete = clients.filter((c: any) => {
    if (c.service_track === 'non_accounting') {
      const custom = getCustomSteps(c.id)
      return custom.length > 0 && custom.every((s: any) => s.status === 'complete')
    }
    const close = getClose(c.id)
    return close.total === 8 && close.complete === 8
  }).length
  const atRisk = clients.filter((c: any) => {
    const steps = stepsByClient[c.id] ?? []
    return steps.some((s: any) => s.status !== 'complete' && s.due_date && new Date(s.due_date) < new Date())
  }).length
  const delayed = 0
  const overdueSteps = (data?.steps ? Object.values(data.steps).flat().filter((s: any) => s.status !== 'complete' && s.due_date && new Date(s.due_date) < new Date()).length : 0) ?? 0

  if (loading) {
    return <div style={{ padding: '40px', color: '#71717a', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => { setLoading(true); fetchData(); }} onDismiss={() => setLoadError(null)} />}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>Close Tracker</h1>
        <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>
          8-step monthly close · {monthYear} · All clients
        </p>
      </div>
      <SubNav />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Complete',      value: complete,     color: '#059669' },
          { label: 'At Risk',       value: atRisk,       color: '#d97706' },
          { label: 'Delayed',       value: delayed,      color: '#e11d48' },
          { label: 'Overdue Steps', value: overdueSteps, color: overdueSteps > 0 ? '#e11d48' : '#059669' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'white', border: '1px solid #e4e4e7',
            borderRadius: '12px', padding: '16px 20px',
            borderTop: `3px solid ${k.color}`,
          }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.03em' }}>{k.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { color: '#059669', label: 'Complete' },
          { color: '#7c3aed', label: 'In Progress' },
          { color: '#e11d48', label: 'Blocked' },
          { color: '#d97706', label: 'Returned' },
          { color: '#e4e4e7', label: 'Not Started' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#71717a' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '99px', background: l.color }} />
            {l.label}
          </div>
        ))}
        <span style={{ fontSize: '11.5px', color: '#a1a1aa', marginLeft: '8px' }}>·</span>
        <span className="badge badge-blue" style={{ fontSize: '10px' }}>Accounting</span>
        <span className="badge badge-violet" style={{ fontSize: '10px' }}>Back Office</span>
      </div>

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '160px', position: 'sticky', left: 0, background: '#f4f4f5', zIndex: 1 }}>Client</th>
                <th>Track</th>
                <th>Owner</th>
                <th>Status</th>
                <th style={{ minWidth: '320px' }}>Steps (1-8) / Custom Steps</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {verticalOrder.map(v => {
                const group = grouped[v]
                if (!group?.length) return null
                return (
                  <React.Fragment key={v}>
                    <tr>
                      <td colSpan={6} style={{ background: '#fafafa', padding: '7px 16px', borderTop: '1px solid #f4f4f5' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: verticalColors[v] }}>
                          {verticalLabels[v]} · {group.length} clients
                        </span>
                      </td>
                    </tr>
                    {group.map((c: any) => {
                      const isAccounting = c.service_track !== 'non_accounting'
                      const customSteps = getCustomSteps(c.id)
                      const close = getClose(c.id)
                      const stepsComplete = isAccounting
                        ? Array.from({ length: 8 }, (_, i) => getStep(c.id, i + 1)?.status === 'complete').filter(Boolean).length
                        : customSteps.filter((s: any) => s.status === 'complete').length
                      const totalSteps = isAccounting ? 8 : customSteps.length
                      const showAddForm = addingClientId === c.id

                      return (
                        <tr key={c.id} onClick={() => openRowPanel(c)} style={{ cursor: 'pointer' }}>
                          <td style={{ position: 'sticky', left: 0, background: 'white', zIndex: 1, verticalAlign: 'top', paddingTop: '10px' }}>
                            <div style={{ fontWeight: 600, color: '#09090b' }}>{c.name}</div>
                            {!isAccounting && c.service_description && (
                              <div style={{ fontSize: '12px', color: '#a1a1aa', fontStyle: 'italic', marginTop: '4px', maxWidth: '200px' }}>
                                {c.service_description}
                              </div>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'top', paddingTop: '10px' }}>
                            {isAccounting ? <span className="badge badge-blue" style={{ fontSize: '10px' }}>Accounting</span> : <span className="badge badge-violet" style={{ fontSize: '10px' }}>Back Office</span>}
                          </td>
                          <td style={{ color: '#71717a', fontSize: '12px', verticalAlign: 'top', paddingTop: '10px' }}>
                            {(c.team_members as any)?.name ?? '—'}
                          </td>
                          <td style={{ verticalAlign: 'top', paddingTop: '10px' }}>
                            {close.complete === 8 && isAccounting && <span className="badge badge-green">Complete</span>}
                            {totalSteps > 0 && stepsComplete === totalSteps && !isAccounting && <span className="badge badge-green">Complete</span>}
                            {(!close || (close.complete < 8 && isAccounting)) && (totalSteps === 0 || stepsComplete < totalSteps) && <span className="badge badge-blue">On Track</span>}
                          </td>
                          <td style={{ verticalAlign: 'top', paddingTop: '8px', paddingBottom: '8px' }}>
                            {isAccounting ? (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {Array.from({ length: 8 }, (_, i) => {
                                  const step = getStep(c.id, i + 1)
                                  const status = step?.status ?? 'not_started'
                                  const stepId = step?.id
                                  return (
                                    <div key={stepId ?? `no-step-${c.id}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px' }} onClick={e => e.stopPropagation()}>
                                      <div style={{ fontSize: '9px', color: '#71717a', marginBottom: '2px' }}>{STEPS_ACCOUNTING[i]}</div>
                                      {stepDot(status, stepId ? () => cycleStep(stepId, status) : undefined)}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                {customSteps.map((s: any) => (
                                  <span
                                    key={s.id}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '4px 8px',
                                      borderRadius: '999px',
                                      fontSize: '11px',
                                      background: s.status === 'complete' ? '#059669' : s.status === 'in_progress' ? '#7c3aed' : '#e4e4e7',
                                      color: s.status === 'not_started' ? '#71717a' : 'white',
                                    }}
                                  >
                                    <span>{s.step_name}</span>
                                    {stepDot(s.status, () => cycleStep(s.id, s.status))}
                                    <button
                                      type="button"
                                      onClick={e => { e.stopPropagation(); deleteCustomStep(s.id) }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '2px', color: 'inherit', opacity: 0.8, fontSize: '12px' }}
                                      aria-label="Remove"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                {showAddForm ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                    <input
                                      value={newStepName}
                                      onChange={e => setNewStepName(e.target.value.slice(0, 20))}
                                      placeholder="Step name"
                                      style={{ width: '100px', padding: '4px 8px', fontSize: '11px', border: '1px solid #e4e4e7', borderRadius: '6px' }}
                                      maxLength={20}
                                    />
                                    <button type="button" onClick={() => addCustomStep(c.id)} style={{ padding: '4px 8px', fontSize: '11px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
                                    <button type="button" onClick={() => { setAddingClientId(null); setNewStepName('') }} style={{ padding: '4px 6px', fontSize: '11px', color: '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                  </span>
                                ) : (
                                  <button type="button" onClick={e => { e.stopPropagation(); setAddingClientId(c.id); }} style={{ padding: '4px 10px', fontSize: '11px', border: '1px dashed #a1a1aa', color: '#71717a', background: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Add Step</button>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ minWidth: '80px', verticalAlign: 'top', paddingTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '4px', background: '#f4f4f5', borderRadius: '99px' }}>
                                <div style={{
                                  height: '100%', borderRadius: '99px',
                                  width: `${totalSteps ? (stepsComplete / totalSteps) * 100 : 0}%`,
                                  background: stepsComplete === totalSteps && totalSteps > 0 ? '#059669' : '#7c3aed',
                                }} />
                              </div>
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a' }}>
                                {stepsComplete}/{totalSteps || 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SidePanel open={!!selectedClient} onClose={() => setSelectedClient(null)} title={selectedClient?.name || 'Close steps'} subtitle={monthYear + ' — Edit status and notes'} width={520}>
        {selectedClient ? (
          <>
            {(stepsByClient[selectedClient.id] ?? []).filter((s: any) => !s.is_custom).map((step: any) => (
              <div key={step.id} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f4f4f5' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#09090b', marginBottom: '8px' }}>Step {step.step_number}: {STEPS_ACCOUNTING[(step.step_number ?? 1) - 1]}</div>
                <FieldRow label="Status">
                  <FieldSelect
                    value={panelSteps[step.id]?.status ?? step.status ?? 'not_started'}
                    onChange={(v: string) => setPanelSteps(prev => ({ ...prev, [step.id]: { ...(prev[step.id] ?? { status: step.status, notes: step.notes ?? '' }), status: v } }))}
                    options={STATUS_OPTIONS}
                  />
                </FieldRow>
                <FieldRow label="Notes">
                  <FieldTextarea
                    value={panelSteps[step.id]?.notes ?? step.notes ?? ''}
                    onChange={(v: string) => setPanelSteps(prev => ({ ...prev, [step.id]: { ...(prev[step.id] ?? { status: step.status, notes: '' }), notes: v } }))}
                    placeholder="Optional notes"
                    rows={2}
                  />
                </FieldRow>
              </div>
            ))}
            <div style={{ marginTop: '24px' }}>
              <button onClick={saveAllSteps} disabled={savingAll || Object.keys(panelSteps).length === 0} style={{ width: '100%', padding: '12px', background: savingAll ? '#a78bfa' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: savingAll ? 'wait' : 'pointer' }}>
                {savingAll ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </>
        ) : null}
      </SidePanel>
    </div>
  )
}
