'use client'
import { useState, useEffect } from 'react'
import SidePanel from '@/components/SidePanel'
import SubNav from '@/components/SubNav'
import ErrorBanner from '@/components/ErrorBanner'
import { FieldRow, FieldInput, FieldSelect, FieldTextarea, SaveButton } from '@/components/FieldRow'

// After Auth: const SHOW_FINANCIAL_DATA = role === 'admin' || role === 'reviewer'
const SHOW_FINANCIAL_DATA = true

const VERTICAL_OPTIONS = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'property', label: 'Property Mgmt' },
  { value: 'saas_ites', label: 'SaaS / ITES' },
  { value: 'cpa_firm', label: 'CPA Firm' },
]

const PAYMENT_OPTIONS = [
  { value: 'qbo', label: 'QBO' },
  { value: 'invoice_ach', label: 'Invoice / ACH' },
  { value: 'auto_ach', label: 'Auto ACH' },
  { value: 'other', label: 'Other' },
]

const SERVICE_TRACK_OPTIONS = [
  { value: 'accounting', label: 'Accounting Close (8-step)' },
  { value: 'non_accounting', label: 'Non-Accounting / Back Office' },
]

const VERTICAL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  restaurant: { label: 'Restaurant',    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  insurance:  { label: 'Insurance',     color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  property:   { label: 'Property Mgmt', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  saas_ites:  { label: 'SaaS / ITES',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  cpa_firm:   { label: 'CPA Firm',      color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
}

const CLIENT_TYPE_OPTIONS = [
  { value: 'direct', label: 'Direct Client' },
  { value: 'cpa_partner', label: 'CPA / Accounting Partner' },
  { value: 'back_office', label: 'Back Office Support' },
]

const SectionHeader = ({ label, first }: { label: string; first?: boolean }) => (
  <div style={{
    fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a1a1aa',
    borderBottom: '1px solid #f4f4f5', paddingBottom: '6px', marginBottom: '12px', marginTop: first ? 0 : 20,
  }}>
    {label}
  </div>
)

const emptyCreateForm = () => ({
  name: '', vertical: '', client_type: 'direct', active: true,
  service_track: 'accounting', service_description: '',
  assigned_owner_id: '', deadline_day: 25,
  monthly_fee: '', india_tp_transfer: '', payment_method: '',
  contract_start_date: '', contract_end_date: '', auto_renewal: 'false', zoho_sign_url: '',
  notes: '',
})

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [owners, setOwners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterVertical, setFilterVertical] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [createMode, setCreateMode] = useState(false)
  const [form, setForm] = useState<any>(emptyCreateForm())
  const [saving, setSaving] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async (): Promise<any[]> => {
    setLoadError(null)
    try {
      const [cr, tr] = await Promise.all([
        fetch('/api/clients').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load clients'))),
        fetch('/api/team').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load team'))),
      ])
      setClients(Array.isArray(cr) ? cr : [])
      setOwners(Array.isArray(tr) ? tr.filter((t: any) => ['owner', 'admin', 'reviewer', 'coordinator'].includes(t.role)) : [])
      setLoading(false)
      return Array.isArray(cr) ? cr : []
    } catch (e) {
      setLoadError((e as Error).message ?? 'Failed to load data')
      setLoading(false)
      return []
    }
  }

  const openPanel = (c: any) => {
    console.log('Opening panel for client:', c, 'id:', c?.id)
    setCreateMode(false)
    setSelected(c)
    setErrors({})
    setForm({
      name: c.name ?? '',
      vertical: c.vertical ?? '',
      client_type: c.client_type ?? 'direct',
      monthly_fee: c.monthly_fee ?? '',
      india_tp_transfer: c.india_tp_transfer ?? '',
      payment_method: c.payment_method ?? '',
      service_track: c.service_track ?? 'accounting',
      service_description: c.service_description ?? '',
      assigned_owner_id: c.assigned_owner_id ?? '',
      deadline_day: c.deadline_day ?? '',
      active: c.active,
      contract_start_date: c.contract_start_date ?? '',
      contract_end_date: c.contract_end_date ?? '',
      auto_renewal: c.auto_renewal ?? false,
      zoho_sign_url: c.zoho_sign_url ?? '',
      notes: c.notes ?? '',
    })
  }

  const openCreate = () => {
    setSelected(null)
    setCreateMode(true)
    setForm(emptyCreateForm())
    setErrors({})
    setCreateSuccess(false)
  }

  const closePanel = () => {
    setSelected(null)
    setCreateMode(false)
    setCreateSuccess(false)
    setErrors({})
  }

  const save = async () => {
    if (!selected?.id) return
    setSaving(true)
    const { india_tp_transfer, ...saveData } = form
    const payload: any = {
      id: selected.id,
      ...saveData,
      monthly_fee: form.monthly_fee === '' ? null : (typeof form.monthly_fee === 'number' ? form.monthly_fee : parseFloat(form.monthly_fee)),
      assigned_owner_id: form.assigned_owner_id === '' || form.assigned_owner_id == null ? null : form.assigned_owner_id,
      deadline_day: form.deadline_day === '' || form.deadline_day == null ? 25 : (typeof form.deadline_day === 'number' ? form.deadline_day : parseInt(String(form.deadline_day), 10)),
      contract_start_date: form.contract_start_date || null,
      contract_end_date: form.contract_end_date || null,
      zoho_sign_url: form.zoho_sign_url || null,
      notes: form.notes || null,
    }
    const res = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || data.error) {
      setErrors({ submit: data.error || 'Failed to save' })
      return
    }
    const refreshed = await fetchAll()
    const updated = refreshed.find((c: any) => c.id === selected.id)
    if (updated) {
      setSelected(updated)
      setForm({
        name: updated.name ?? '',
        vertical: updated.vertical ?? '',
        client_type: updated.client_type ?? 'direct',
        monthly_fee: updated.monthly_fee ?? '',
        india_tp_transfer: updated.india_tp_transfer ?? '',
        payment_method: updated.payment_method ?? '',
        service_track: updated.service_track ?? 'accounting',
        service_description: updated.service_description ?? '',
        assigned_owner_id: updated.assigned_owner_id ?? '',
        deadline_day: updated.deadline_day ?? '',
        active: updated.active,
        contract_start_date: updated.contract_start_date ?? '',
        contract_end_date: updated.contract_end_date ?? '',
        auto_renewal: updated.auto_renewal ?? false,
        zoho_sign_url: updated.zoho_sign_url ?? '',
        notes: updated.notes ?? '',
      })
    }
  }

  const validateCreate = () => {
    const e: Record<string, string> = {}
    if (!form.name?.trim()) e.name = 'Client name is required'
    if (!form.vertical) e.vertical = 'Vertical is required'
    const fee = typeof form.monthly_fee === 'number' ? form.monthly_fee : parseFloat(form.monthly_fee)
    if (fee == null || isNaN(fee) || fee <= 0) e.monthly_fee = 'Monthly fee must be greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const createClient = async () => {
    if (!validateCreate()) return
    setSaving(true)
    setErrors({})
    const fee = typeof form.monthly_fee === 'number' ? form.monthly_fee : parseFloat(form.monthly_fee) || 0
    const tp = typeof form.india_tp_transfer === 'number' ? form.india_tp_transfer : parseFloat(form.india_tp_transfer) || Math.round(fee * 0.9 * 100) / 100
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name?.trim(),
        vertical: form.vertical,
        client_type: form.client_type,
        active: form.active,
        service_track: form.service_track,
        service_description: form.service_description || null,
        assigned_owner_id: form.assigned_owner_id || null,
        deadline_day: form.deadline_day ? parseInt(form.deadline_day, 10) : 25,
        monthly_fee: fee,
        india_tp_transfer: tp,
        payment_method: form.payment_method || null,
        contract_start_date: form.contract_start_date || null,
        contract_end_date: form.contract_end_date || null,
        auto_renewal: form.auto_renewal,
        zoho_sign_url: form.zoho_sign_url || null,
        notes: form.notes || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) {
      setErrors({ submit: data.error })
      return
    }
    setCreateSuccess(true)
    await fetchAll()
    setTimeout(() => { closePanel() }, 800)
  }

  const filtered = filterVertical
    ? clients.filter(c => c.vertical === filterVertical)
    : clients

  const totals = Object.keys(VERTICAL_CONFIG).reduce((acc, v) => {
    const vClients = clients.filter(c => c.vertical === v)
    acc[v] = { count: vClients.length, mrr: vClients.reduce((s, c) => s + (c.monthly_fee ?? 0), 0) }
    return acc
  }, {} as Record<string, { count: number; mrr: number }>)

  const totalMRR = clients.reduce((s, c) => s + (c.monthly_fee ?? 0), 0)

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => { setLoading(true); fetchAll(); }} onDismiss={() => setLoadError(null)} />}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>Clients</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>
            {clients.length} active clients
            {SHOW_FINANCIAL_DATA && ` · $${totalMRR.toLocaleString()}/mo`}
            {' · Click any client to edit'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={openCreate}
            style={{
              padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none',
              borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + New Client
          </button>
          {filterVertical && (
            <button onClick={() => setFilterVertical(null)} style={{
              fontSize: '12px', padding: '6px 14px', border: '1px solid #e4e4e7',
              borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#71717a',
            }}>
              ✕ Clear filter
            </button>
          )}
        </div>
      </div>
      <SubNav />

      {/* Vertical Filter Cards — clickable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {Object.entries(VERTICAL_CONFIG).map(([v, cfg]) => {
          const t = totals[v] ?? { count: 0, mrr: 0 }
          const active = filterVertical === v
          return (
            <div
              key={v}
              onClick={() => setFilterVertical(active ? null : v)}
              style={{
                background: active ? cfg.bg : 'white',
                border: `1px solid ${active ? cfg.border : '#e4e4e7'}`,
                borderRadius: '10px', padding: '14px 16px',
                borderTop: `3px solid ${cfg.color}`,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: active ? `0 0 0 2px ${cfg.border}` : 'none',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#09090b' }}>{t.count}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: cfg.color, marginTop: '3px' }}>{cfg.label}</div>
              {SHOW_FINANCIAL_DATA && (
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>${t.mrr.toLocaleString()}/mo</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b', display: 'flex', justifyContent: 'space-between' }}>
          <span>{filterVertical ? `${VERTICAL_CONFIG[filterVertical]?.label} Clients` : 'All Clients'} ({filtered.length})</span>
          <span style={{ fontSize: '11.5px', color: '#a1a1aa', fontWeight: 400 }}>Click any row to edit</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Vertical</th>
              <th>Client Type</th>
              <th>Owner</th>
              {SHOW_FINANCIAL_DATA && <th>Monthly Fee</th>}
              {SHOW_FINANCIAL_DATA && <th>India TP (90%)</th>}
              {SHOW_FINANCIAL_DATA && <th>Payment</th>}
              <th>Close Day</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={SHOW_FINANCIAL_DATA ? 9 : 6} style={{ textAlign: 'center', padding: '32px', color: '#a1a1aa' }}>
                  <div>No clients found. Add your first client.</div>
                  <button onClick={openCreate} style={{ marginTop: '12px', padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add Client</button>
                </td>
              </tr>
            )}
            {filtered.map(c => {
              const cfg = VERTICAL_CONFIG[c.vertical]
              return (
                <tr
                  key={c.id}
                  onClick={() => openPanel(c)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '7px',
                        background: cfg?.bg ?? '#f4f4f5',
                        color: cfg?.color ?? '#71717a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, flexShrink: 0,
                      }}>
                        {c.name?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#09090b' }}>{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', padding: '2px 8px', borderRadius: '5px',
                      fontSize: '11px', fontWeight: 600,
                      background: cfg?.bg ?? '#f4f4f5',
                      color: cfg?.color ?? '#71717a',
                      border: `1px solid ${cfg?.border ?? '#e4e4e7'}`,
                    }}>
                      {cfg?.label ?? c.vertical}
                    </span>
                  </td>
                  <td>
                    {c.client_type === 'cpa_partner' && <span className="badge badge-blue">CPA Partner</span>}
                    {c.client_type === 'back_office' && <span className="badge badge-violet">Back Office</span>}
                    {(c.client_type === 'direct' || !c.client_type) && <span className="badge badge-gray">Direct</span>}
                  </td>
                  <td style={{ color: '#71717a' }}>{c.team_members?.name ?? '—'}</td>
                  {SHOW_FINANCIAL_DATA && <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>${c.monthly_fee?.toLocaleString()}</td>}
                  {SHOW_FINANCIAL_DATA && <td style={{ fontFamily: 'monospace', color: '#71717a' }}>${c.india_tp_transfer?.toLocaleString()}</td>}
                  {SHOW_FINANCIAL_DATA && <td><span className="badge badge-gray">{c.payment_method?.toUpperCase() ?? '—'}</span></td>}
                  <td style={{ color: '#71717a' }}>{c.deadline_day ? `Day ${c.deadline_day}` : '—'}</td>
                  <td><span className={`badge ${c.active ? 'badge-green' : 'badge-gray'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Side Panel */}
      <SidePanel
        open={!!selected || createMode}
        onClose={closePanel}
        title={createMode ? 'New Client' : (selected?.name ?? 'Edit Client')}
        subtitle={createMode ? 'Fill all details to activate client' : 'Edit client details · Changes save immediately'}
      >
        {createMode ? (
          <>
            {createSuccess && (
              <div style={{ padding: '12px', background: '#ecfdf5', color: '#059669', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>
                Client created successfully.
              </div>
            )}
            {errors.submit && (
              <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {errors.submit}
              </div>
            )}

            <SectionHeader label="Client Info" first />
            <FieldRow label="Client Name" required>
              <FieldInput value={form.name ?? ''} onChange={v => setForm({ ...form, name: v })} placeholder="Client name" />
              {errors.name && <div style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px' }}>{errors.name}</div>}
            </FieldRow>
            <FieldRow label="Vertical" required>
              <FieldSelect value={form.vertical ?? ''} onChange={v => setForm({ ...form, vertical: v })} options={VERTICAL_OPTIONS} />
              {errors.vertical && <div style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px' }}>{errors.vertical}</div>}
            </FieldRow>
            <FieldRow label="Client Type">
              <FieldSelect value={form.client_type ?? 'direct'} onChange={v => setForm({ ...form, client_type: v })} options={CLIENT_TYPE_OPTIONS} />
            </FieldRow>
            <FieldRow label="Active">
              <FieldSelect value={form.active ? 'true' : 'false'} onChange={v => setForm({ ...form, active: v === 'true' })} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
            </FieldRow>

            <SectionHeader label="Service & Delivery" />
            <FieldRow label="Service Track">
              <FieldSelect value={form.service_track ?? 'accounting'} onChange={v => setForm({ ...form, service_track: v })} options={SERVICE_TRACK_OPTIONS} />
            </FieldRow>
            {form.service_track === 'non_accounting' && (
              <FieldRow label="Service Description">
                <FieldTextarea value={form.service_description ?? ''} onChange={v => setForm({ ...form, service_description: v })} placeholder="e.g. Monthly commission calculation, vendor filing..." rows={4} />
              </FieldRow>
            )}
            <FieldRow label="Assigned Owner">
              <FieldSelect value={form.assigned_owner_id ?? ''} onChange={v => setForm({ ...form, assigned_owner_id: v })} options={[{ value: '', label: '— Unassigned —' }, ...owners.map((o: any) => ({ value: o.id, label: o.name }))]} />
            </FieldRow>
            <FieldRow label="Close Deadline Day">
              <FieldInput type="number" value={form.deadline_day ?? ''} onChange={v => setForm({ ...form, deadline_day: v })} placeholder="e.g. 15" />
            </FieldRow>

            {SHOW_FINANCIAL_DATA && (
              <>
                <SectionHeader label="Billing" />
                <FieldRow label="Monthly Fee ($)" required>
                  <FieldInput type="number" value={form.monthly_fee ?? ''} onChange={v => setForm({ ...form, monthly_fee: v, india_tp_transfer: Math.round(parseFloat(v || '0') * 0.9 * 100) / 100 })} placeholder="0" />
                  {errors.monthly_fee && <div style={{ fontSize: '12px', color: '#e11d48', marginTop: '4px' }}>{errors.monthly_fee}</div>}
                </FieldRow>
                <FieldRow label="India TP Transfer (90%)">
                  <FieldInput type="number" value={form.india_tp_transfer ?? ''} onChange={v => setForm({ ...form, india_tp_transfer: v })} placeholder="Auto-calculated" />
                </FieldRow>
                <FieldRow label="Payment Method">
                  <FieldSelect value={form.payment_method ?? ''} onChange={v => setForm({ ...form, payment_method: v })} options={[{ value: '', label: '—' }, ...PAYMENT_OPTIONS]} />
                </FieldRow>
              </>
            )}

            <SectionHeader label="Contract" />
            <FieldRow label="Contract Start Date">
              <FieldInput type="date" value={form.contract_start_date ?? ''} onChange={v => setForm({ ...form, contract_start_date: v })} />
            </FieldRow>
            <FieldRow label="Contract End Date">
              <FieldInput type="date" value={form.contract_end_date ?? ''} onChange={v => setForm({ ...form, contract_end_date: v })} />
            </FieldRow>
            <FieldRow label="Auto Renewal">
              <FieldSelect value={form.auto_renewal ?? 'false'} onChange={v => setForm({ ...form, auto_renewal: v })} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
            </FieldRow>
            <FieldRow label="Zoho Sign URL">
              <FieldInput value={form.zoho_sign_url ?? ''} onChange={v => setForm({ ...form, zoho_sign_url: v })} placeholder="https://..." />
            </FieldRow>

            <SectionHeader label="Notes" />
            <FieldRow label="Notes">
              <FieldTextarea value={form.notes ?? ''} onChange={v => setForm({ ...form, notes: v })} placeholder="Optional notes" rows={3} />
            </FieldRow>

            <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
              <button type="button" onClick={closePanel} style={{ flex: 1, padding: '10px', border: '1px solid #e4e4e7', background: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#71717a' }}>
                Cancel
              </button>
              <button type="button" onClick={createClient} disabled={saving} style={{ flex: 1, padding: '10px', background: saving ? '#a78bfa' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </>
        ) : (
          <>
            <FieldRow label="Client Name" required>
              <FieldInput value={form.name ?? ''} onChange={v => setForm({ ...form, name: v })} />
            </FieldRow>
            <FieldRow label="Vertical">
              <FieldSelect value={form.vertical ?? ''} onChange={v => setForm({ ...form, vertical: v })} options={VERTICAL_OPTIONS} />
            </FieldRow>
            <FieldRow label="Client Type">
              <FieldSelect value={form.client_type ?? 'direct'} onChange={v => setForm({ ...form, client_type: v })} options={CLIENT_TYPE_OPTIONS} />
            </FieldRow>
            {SHOW_FINANCIAL_DATA && (
              <>
                <FieldRow label="Monthly Fee ($)">
                  <FieldInput type="number" value={form.monthly_fee ?? ''} onChange={v => setForm({ ...form, monthly_fee: parseFloat(v), india_tp_transfer: Math.round(parseFloat(v) * 0.9 * 100) / 100 })} />
                </FieldRow>
                <FieldRow label="India TP Transfer (auto 90%)">
                  <FieldInput type="number" value={form.india_tp_transfer ?? ''} onChange={v => setForm({ ...form, india_tp_transfer: parseFloat(v) })} />
                </FieldRow>
                <FieldRow label="Payment Method">
                  <FieldSelect value={form.payment_method ?? ''} onChange={v => setForm({ ...form, payment_method: v })} options={PAYMENT_OPTIONS} />
                </FieldRow>
              </>
            )}
            <FieldRow label="Assigned Owner">
              <FieldSelect value={form.assigned_owner_id ?? ''} onChange={v => setForm({ ...form, assigned_owner_id: v })} options={[{ value: '', label: '— Unassigned —' }, ...owners.map((o: any) => ({ value: o.id, label: o.name }))]} />
            </FieldRow>
            <FieldRow label="Service Track">
              <FieldSelect value={form.service_track ?? 'accounting'} onChange={v => setForm({ ...form, service_track: v })} options={SERVICE_TRACK_OPTIONS} />
            </FieldRow>
            {form.service_track === 'non_accounting' && (
              <FieldRow label="What do you do for this client?">
                <FieldTextarea value={form.service_description ?? ''} onChange={v => setForm({ ...form, service_description: v })} placeholder="e.g. Monthly commission calculation, vendor filing, expense reports, compliance docs..." rows={4} />
              </FieldRow>
            )}
            <FieldRow label="Close Deadline Day of Month">
              <FieldInput type="number" value={form.deadline_day ?? ''} onChange={v => setForm({ ...form, deadline_day: parseInt(v) })} placeholder="e.g. 15" />
            </FieldRow>
            <FieldRow label="Status">
              <FieldSelect value={form.active ? 'true' : 'false'} onChange={v => setForm({ ...form, active: v === 'true' })} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
            </FieldRow>
            <SectionHeader label="Contract" />
            <FieldRow label="Contract Start Date">
              <FieldInput type="date" value={form.contract_start_date ?? ''} onChange={v => setForm({ ...form, contract_start_date: v })} />
            </FieldRow>
            <FieldRow label="Contract End Date">
              <FieldInput type="date" value={form.contract_end_date ?? ''} onChange={v => setForm({ ...form, contract_end_date: v })} />
            </FieldRow>
            <FieldRow label="Zoho Sign URL">
              <FieldInput value={form.zoho_sign_url ?? ''} onChange={v => setForm({ ...form, zoho_sign_url: v })} placeholder="https://..." />
            </FieldRow>
            <SectionHeader label="Notes" />
            <FieldRow label="Notes">
              <FieldTextarea value={form.notes ?? ''} onChange={v => setForm({ ...form, notes: v })} placeholder="Optional notes" rows={3} />
            </FieldRow>
            {errors.submit && (
              <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginTop: '12px', fontSize: '13px' }}>{errors.submit}</div>
            )}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SaveButton onClick={save} saving={saving} />
              <button
                type="button"
                onClick={async () => {
                  if (!selected?.id || !confirm('Deactivate this client? (Sets active = false; you can reactivate by editing.)')) return
                  setSaving(true)
                  const res = await fetch('/api/clients', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id, active: false }) })
                  setSaving(false)
                  if (res.ok) { await fetchAll(); closePanel() }
                }}
                disabled={saving}
                style={{ padding: '10px', border: '1px solid #e4e4e7', background: 'white', color: '#71717a', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: saving ? 'wait' : 'pointer' }}
              >
                Deactivate client (set inactive)
              </button>
            </div>
          </>
        )}
      </SidePanel>
    </div>
  )
}
