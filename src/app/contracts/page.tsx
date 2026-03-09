'use client'
import { useState, useEffect } from 'react'
import SidePanel from '@/components/SidePanel'
import SubNav from '@/components/SubNav'
import { FieldRow, FieldInput, FieldSelect, FieldTextarea, SaveButton } from '@/components/FieldRow'

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [createMode, setCreateMode] = useState(false)
  const [createForm, setCreateForm] = useState<any>({ client_id: '', contract_start_date: '', contract_end_date: '', monthly_fee: '', notice_period_days: 30, auto_renewal: true, discount_pct: 0, discount_reason: '', zoho_sign_url: '', notes: '', status: 'active' })

  useEffect(() => {
    fetchContracts()
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => [])
  }, [])

  const fetchContracts = async () => {
    try {
      const res = await fetch('/api/contracts')
      const data = await res.json().catch(() => [])
      setContracts(Array.isArray(data) ? data : [])
    } catch {
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  const openPanel = (c: any) => {
    setCreateMode(false)
    setSelected(c)
    setForm({
      contract_start_date: c.contract_start_date ?? '',
      contract_end_date: c.contract_end_date ?? '',
      monthly_fee: c.monthly_fee ?? '',
      notice_period_days: c.notice_period_days ?? 30,
      auto_renewal: c.auto_renewal ?? true,
      discount_pct: c.discount_pct ?? 0,
      discount_reason: c.discount_reason ?? '',
      zoho_sign_url: c.zoho_sign_url ?? '',
      notes: c.notes ?? '',
      status: c.status ?? 'active',
    })
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    const body = selected.id != null
      ? { id: selected.id, ...form }
      : { client_id: selected.client_id, ...form }
    const res = await fetch('/api/contracts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || data.error) {
      setSelected(null)
      await fetchContracts()
      return
    }
    await fetchContracts()
    setSelected(null)
  }

  const saveNewContract = async () => {
    if (!createForm.client_id) return
    setSaving(true)
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: createForm.client_id,
        contract_start_date: createForm.contract_start_date || null,
        contract_end_date: createForm.contract_end_date || null,
        monthly_fee: createForm.monthly_fee ? parseFloat(createForm.monthly_fee) : null,
        notice_period_days: createForm.notice_period_days ?? 30,
        auto_renewal: createForm.auto_renewal !== false,
        discount_pct: createForm.discount_pct ?? 0,
        discount_reason: createForm.discount_reason || null,
        zoho_sign_url: createForm.zoho_sign_url || null,
        notes: createForm.notes || null,
        status: createForm.status || 'active',
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (data.error) return
    setCreateMode(false)
    setCreateForm({ client_id: '', contract_start_date: '', contract_end_date: '', monthly_fee: '', notice_period_days: 30, auto_renewal: true, discount_pct: 0, discount_reason: '', zoho_sign_url: '', notes: '', status: 'active' })
    await fetchContracts()
  }

  const active   = contracts.filter(c => c.status === 'active')
  const expiring = contracts.filter(c => c.status === 'expiring_soon')
  const none     = contracts.filter(c => !c.contract_id)

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa' }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>Contracts & Renewals</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>Click any row to edit · Zoho Sign links · Renewal tracking</p>
        </div>
        <button onClick={() => { setCreateMode(true); setSelected(null); }} style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add New Contract</button>
      </div>
      <SubNav />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Active',       value: active.length,   color: '#059669' },
          { label: 'Expiring Soon', value: expiring.length, color: '#e11d48' },
          { label: 'No Contract',  value: none.length,     color: '#d97706' },
          { label: 'Total MRR',    value: `$${contracts.reduce((s, c) => s + (c.monthly_fee ?? 0), 0).toLocaleString()}`, color: '#7c3aed' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#09090b' }}>{k.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b', display: 'flex', justifyContent: 'space-between' }}>
          <span>All Contracts ({contracts.length})</span>
          <span style={{ fontSize: '11.5px', color: '#a1a1aa', fontWeight: 400 }}>Click any row to edit</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Vertical</th>
              <th>Fee</th>
              <th>Start</th>
              <th>End</th>
              <th>Days Left</th>
              <th>Auto Renew</th>
              <th>Discount</th>
              <th>Status</th>
              <th>Zoho Sign</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.client_id ?? c.id} onClick={() => openPanel(c)} style={{ cursor: 'pointer', background: c.status === 'expiring_soon' ? '#fff8f8' : 'white' }}>
                <td style={{ fontWeight: 600, color: '#09090b' }}>{c.client_name ?? c.clients?.name}</td>
                <td><span className="badge badge-gray">{c.vertical ?? c.clients?.vertical}</span></td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>${(c.monthly_fee ?? c.clients?.monthly_fee ?? 0).toLocaleString()}</td>
                <td style={{ fontSize: '12px', color: '#71717a' }}>{c.contract_start_date ? new Date(c.contract_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                <td style={{ fontSize: '12px', color: '#71717a' }}>{c.contract_end_date ? new Date(c.contract_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No end date'}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 700, color: (c.days_to_expiry ?? 999) <= 30 ? '#e11d48' : (c.days_to_expiry ?? 999) <= 60 ? '#d97706' : '#71717a' }}>
                  {c.days_to_expiry != null ? `${c.days_to_expiry}d` : '—'}
                </td>
                <td>{c.auto_renewal ? <span className="badge badge-green">Auto</span> : <span className="badge badge-gray">Manual</span>}</td>
                <td style={{ fontFamily: 'monospace', color: c.discount_pct > 0 ? '#d97706' : '#a1a1aa' }}>
                  {c.discount_pct > 0 ? `${c.discount_pct}%` : '—'}
                </td>
                <td>
                  {c.status === 'active' && <span className="badge badge-green">Active</span>}
                  {c.status === 'expiring_soon' && <span className="badge badge-red">Expiring</span>}
                  {c.status === 'expired' && <span className="badge badge-red">Expired</span>}
                  {!c.status && <span className="badge badge-gray">No Contract</span>}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  {c.zoho_sign_url
                    ? <a href={c.zoho_sign_url} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', fontSize: '12px', fontWeight: 500, textDecoration: 'none' }} title="Open in new tab">View ↗</a>
                    : <span style={{ color: '#a1a1aa', fontSize: '12px' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side Panel — Edit */}
      <SidePanel
        open={!!selected && !createMode}
        onClose={() => setSelected(null)}
        title={selected?.client_name ?? selected?.clients?.name ?? 'Edit Contract'}
        subtitle="Contract details · Renewal dates · Zoho Sign"
      >
        <FieldRow label="Contract Start Date">
          <FieldInput type="date" value={form.contract_start_date ?? ''} onChange={v => setForm({ ...form, contract_start_date: v })} />
        </FieldRow>
        <FieldRow label="Contract End Date">
          <FieldInput type="date" value={form.contract_end_date ?? ''} onChange={v => setForm({ ...form, contract_end_date: v })} />
        </FieldRow>
        <FieldRow label="Monthly Fee ($)">
          <FieldInput type="number" value={form.monthly_fee ?? ''} onChange={v => setForm({ ...form, monthly_fee: parseFloat(v) })} />
        </FieldRow>
        <FieldRow label="Notice Period (days)">
          <FieldInput type="number" value={form.notice_period_days ?? 30} onChange={v => setForm({ ...form, notice_period_days: parseInt(v) })} />
        </FieldRow>
        <FieldRow label="Auto Renewal">
          <FieldSelect
            value={form.auto_renewal ? 'true' : 'false'}
            onChange={v => setForm({ ...form, auto_renewal: v === 'true' })}
            options={[{ value: 'true', label: 'Yes — Auto Renew' }, { value: 'false', label: 'No — Manual Renewal' }]}
          />
        </FieldRow>
        <FieldRow label="Discount (%)">
          <FieldInput type="number" value={form.discount_pct ?? 0} onChange={v => setForm({ ...form, discount_pct: parseFloat(v) })} placeholder="0" />
        </FieldRow>
        <FieldRow label="Discount Reason">
          <FieldInput value={form.discount_reason ?? ''} onChange={v => setForm({ ...form, discount_reason: v })} placeholder="e.g. Long-term client, referral" />
        </FieldRow>
        <FieldRow label="Zoho Sign URL">
          <FieldInput value={form.zoho_sign_url ?? ''} onChange={v => setForm({ ...form, zoho_sign_url: v })} placeholder="Paste Zoho Sign link" />
        </FieldRow>
        <FieldRow label="Contract Status">
          <FieldSelect
            value={form.status ?? 'active'}
            onChange={v => setForm({ ...form, status: v })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'expiring_soon', label: 'Expiring Soon' },
              { value: 'renewed', label: 'Renewed' },
              { value: 'terminated', label: 'Terminated' },
            ]}
          />
        </FieldRow>
        <FieldRow label="Notes">
          <FieldTextarea value={form.notes ?? ''} onChange={v => setForm({ ...form, notes: v })} placeholder="Internal notes about this contract..." />
        </FieldRow>
        <div style={{ marginTop: '8px' }}>
          <SaveButton onClick={save} saving={saving} />
        </div>
      </SidePanel>

      {/* Side Panel — Create */}
      <SidePanel open={createMode} onClose={() => setCreateMode(false)} title="Add New Contract" subtitle="Select client and enter contract details">
        <FieldRow label="Client" required>
          <FieldSelect value={createForm.client_id} onChange={v => setCreateForm({ ...createForm, client_id: v })} options={[{ value: '', label: '— Select client —' }, ...clients.map((c: any) => ({ value: c.id, label: c.name }))]} />
        </FieldRow>
        <FieldRow label="Contract Start Date"><FieldInput type="date" value={createForm.contract_start_date ?? ''} onChange={v => setCreateForm({ ...createForm, contract_start_date: v })} /></FieldRow>
        <FieldRow label="Contract End Date"><FieldInput type="date" value={createForm.contract_end_date ?? ''} onChange={v => setCreateForm({ ...createForm, contract_end_date: v })} /></FieldRow>
        <FieldRow label="Monthly Fee ($)"><FieldInput type="number" value={createForm.monthly_fee ?? ''} onChange={v => setCreateForm({ ...createForm, monthly_fee: v })} /></FieldRow>
        <FieldRow label="Notice Period (days)"><FieldInput type="number" value={createForm.notice_period_days ?? 30} onChange={v => setCreateForm({ ...createForm, notice_period_days: v })} /></FieldRow>
        <FieldRow label="Auto Renewal"><FieldSelect value={createForm.auto_renewal ? 'true' : 'false'} onChange={v => setCreateForm({ ...createForm, auto_renewal: v === 'true' })} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} /></FieldRow>
        <FieldRow label="Discount (%)"><FieldInput type="number" value={createForm.discount_pct ?? 0} onChange={v => setCreateForm({ ...createForm, discount_pct: v })} /></FieldRow>
        <FieldRow label="Discount Reason"><FieldInput value={createForm.discount_reason ?? ''} onChange={v => setCreateForm({ ...createForm, discount_reason: v })} /></FieldRow>
        <FieldRow label="Zoho Sign URL"><FieldInput value={createForm.zoho_sign_url ?? ''} onChange={v => setCreateForm({ ...createForm, zoho_sign_url: v })} placeholder="https://..." /></FieldRow>
        <FieldRow label="Notes"><FieldTextarea value={createForm.notes ?? ''} onChange={v => setCreateForm({ ...createForm, notes: v })} placeholder="Optional" rows={3} /></FieldRow>
        <FieldRow label="Status"><FieldSelect value={createForm.status ?? 'active'} onChange={v => setCreateForm({ ...createForm, status: v })} options={[{ value: 'active', label: 'Active' }, { value: 'expiring_soon', label: 'Expiring Soon' }, { value: 'renewed', label: 'Renewed' }, { value: 'terminated', label: 'Terminated' }]} /></FieldRow>
        <div style={{ marginTop: '16px' }}><SaveButton onClick={saveNewContract} saving={saving} label="Create Contract" /></div>
      </SidePanel>
    </div>
  )
}
