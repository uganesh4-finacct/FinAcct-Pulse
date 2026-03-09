'use client'
import React, { useState, useEffect } from 'react'
import SubNav from '@/components/SubNav'

const ENTITY_OPTIONS = [
  { value: 'us', label: '🇺🇸 US' },
  { value: 'india', label: '🇮🇳 India' },
  { value: 'both', label: '🌐 Both' },
]
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'pending_renewal', label: 'Pending Renewal' },
]
const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

function EntityBadge({ entity }: { entity: string }) {
  const c = entity === 'us' ? 'badge-violet' : entity === 'india' ? 'badge-green' : 'badge-blue'
  const l = entity === 'us' ? '🇺🇸 US' : entity === 'india' ? '🇮🇳 India' : '🌐 Both'
  return <span className={`badge ${c}`}>{l}</span>
}

function StatusBadge({ status }: { status: string }) {
  const c = status === 'active' ? 'badge-green' : status === 'expired' ? 'badge-red' : status === 'cancelled' ? 'badge-gray' : 'badge-yellow'
  return <span className={`badge ${c}`}>{status?.replace('_', ' ') ?? '—'}</span>
}

function ConditionBadge({ condition }: { condition: string }) {
  const c = condition === 'new' ? 'badge-violet' : condition === 'good' ? 'badge-green' : condition === 'fair' ? 'badge-yellow' : 'badge-red'
  return <span className={`badge ${c}`}>{condition ?? '—'}</span>
}

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24))
}

function DaysLeftCell({ dateStr }: { dateStr: string | null }) {
  const d = daysLeft(dateStr)
  if (d === null) return <td>—</td>
  const color = d <= 30 ? '#e11d48' : d <= 60 ? '#d97706' : '#71717a'
  return <td style={{ color, fontWeight: d <= 30 ? 600 : 400 }}>{d}</td>
}

const inputStyle: React.CSSProperties = {
  width: '100%', minWidth: '60px', padding: '4px 8px', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '12px',
}

export default function ItAssetsPage() {
  const [data, setData] = useState<{ domains: any[]; software: any[]; hardware: any[]; licenses: any[]; alerts: any[] }>({ domains: [], software: [], hardware: [], licenses: [], alerts: [] })
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'domains' | 'software' | 'hardware' | 'licenses'>('domains')
  const [editing, setEditing] = useState<{ table: string; id: string } | null>(null)
  const [editRow, setEditRow] = useState<any>({})
  const [newDomains, setNewDomains] = useState<Record<string, any>>({})
  const [newSoftware, setNewSoftware] = useState<Record<string, any>>({})
  const [newHardware, setNewHardware] = useState<Record<string, any>>({})
  const [newLicenses, setNewLicenses] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)

  const emptyData = { alerts: [], domains: [], software: [], hardware: [], licenses: [] }
  const fetchData = async () => {
    try {
      const [res, teamRes] = await Promise.all([
        fetch('/api/it-assets').then(r => r.json().catch(() => emptyData)),
        fetch('/api/team').then(r => r.json().catch(() => [])),
      ])
      setData({ ...emptyData, ...(res && typeof res === 'object' ? res : {}) })
      setTeam(Array.isArray(teamRes) ? teamRes : [])
    } catch {
      setData(emptyData)
      setTeam([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const alerts = data.alerts ?? []
  const domains = data.domains ?? []
  const software = data.software ?? []
  const hardware = data.hardware ?? []
  const licenses = data.licenses ?? []
  const expiringCount = alerts.length

  const kpis = [
    { label: 'Total Domains', value: domains.length, color: '#2563eb' },
    { label: 'Total Software/SaaS', value: software.length, color: '#7c3aed' },
    { label: 'Total Hardware', value: hardware.length, color: '#059669' },
    { label: 'Expiring Soon (≤30 days)', value: expiringCount, color: '#e11d48' },
  ]

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    await fetch('/api/it-assets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: editing.table, id: editing.id, ...editRow }),
    })
    await fetchData()
    setSaving(false)
    setEditing(null)
  }

  const handleCancel = () => { setEditing(null); setEditRow({}) }

  const handleRemove = async (table: string, id: string) => {
    if (!confirm('Remove this record?')) return
    await fetch('/api/it-assets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table, id }) })
    await fetchData()
    setEditing(null)
  }

  const addRecord = async (table: string, payload: Record<string, any>) => {
    setAdding(true)
    await fetch('/api/it-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, data: payload }),
    })
    await fetchData()
    setAdding(false)
    if (table === 'it_domains') setNewDomains({})
    if (table === 'it_software') setNewSoftware({})
    if (table === 'it_hardware') setNewHardware({})
    if (table === 'it_licenses') setNewLicenses({})
  }

  if (loading) return <div style={{ padding: '40px', color: '#71717a' }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>IT Assets & Inventory</h1>
        <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>
          Domains · Software · Hardware · Licenses · Both entities
        </p>
      </div>
      <SubNav />

      {expiringCount > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#b91c1c', fontSize: '13px',
        }}>
          <strong>{expiringCount} items expiring within 30 days</strong>
          {' — '}
          {alerts.slice(0, 10).map((a: any, i: number) => (
            <span key={a.id ?? i}>
              {a.name} · {a.item_type} · {a.days_left} days left
              {i < Math.min(10, alerts.length) - 1 ? '; ' : ''}
            </span>
          ))}
          {alerts.length > 10 && ` ... and ${alerts.length - 10} more`}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', borderTop: `3px solid ${k.color}`,
          }}>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#09090b' }}>{k.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ borderBottom: '1px solid #e4e4e7', marginBottom: '16px', display: 'flex', gap: '24px' }}>
        {(['domains', 'software', 'hardware', 'licenses'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 0', fontSize: '13px', fontWeight: 600, color: tab === t ? '#7c3aed' : '#71717a',
              background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
              cursor: 'pointer', marginBottom: '-1px',
            }}
          >
            {t === 'domains' ? 'Domains' : t === 'software' ? 'Software' : t === 'hardware' ? 'Hardware' : 'Licenses'}
          </button>
        ))}
      </div>

      {tab === 'domains' && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                <th>Entity</th><th>Domain</th><th>Registrar</th><th>Expiry Date</th><th>Days Left</th><th>Auto Renew</th><th>Annual Cost</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((r: any) => {
                const isEdit = editing?.table === 'it_domains' && editing?.id === r.id
                return (
                  <tr key={r.id}>
                    {isEdit ? (
                      <>
                        <td><select value={editRow.entity ?? r.entity} onChange={e => setEditRow({ ...editRow, entity: e.target.value })} style={inputStyle}>{ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                        <td><input value={editRow.domain ?? r.domain} onChange={e => setEditRow({ ...editRow, domain: e.target.value })} style={inputStyle} /></td>
                        <td><input value={editRow.registrar ?? r.registrar ?? ''} onChange={e => setEditRow({ ...editRow, registrar: e.target.value })} style={inputStyle} /></td>
                        <td><input type="date" value={editRow.expiry_date ?? r.expiry_date ?? ''} onChange={e => setEditRow({ ...editRow, expiry_date: e.target.value })} style={inputStyle} /></td>
                        <td>{daysLeft(editRow.expiry_date ?? r.expiry_date) ?? '—'}</td>
                        <td><input type="checkbox" checked={!!(editRow.auto_renew ?? r.auto_renew)} onChange={e => setEditRow({ ...editRow, auto_renew: e.target.checked })} /></td>
                        <td><input type="number" value={editRow.annual_cost ?? r.annual_cost ?? ''} onChange={e => setEditRow({ ...editRow, annual_cost: e.target.value })} style={inputStyle} /></td>
                        <td><select value={editRow.status ?? r.status} onChange={e => setEditRow({ ...editRow, status: e.target.value })} style={inputStyle}>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                        <td><button onClick={handleSave} disabled={saving} style={{ marginRight: '6px', padding: '4px 10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Save</button><button onClick={handleCancel} style={{ padding: '4px 10px', border: '1px solid #e4e4e7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button></td>
                      </>
                    ) : (
                      <>
                        <td><EntityBadge entity={r.entity} /></td>
                        <td>{r.domain}</td>
                        <td>{r.registrar ?? '—'}</td>
                        <td>{r.expiry_date ?? '—'}</td>
                        <DaysLeftCell dateStr={r.expiry_date} />
                        <td>{r.auto_renew ? 'Yes' : 'No'}</td>
                        <td>{r.annual_cost != null ? r.annual_cost : '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          <button onClick={() => { setEditing({ table: 'it_domains', id: r.id }); setEditRow({ ...r }) }} style={{ marginRight: '6px', padding: '4px 8px', fontSize: '11px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleRemove('it_domains', r.id)} style={{ padding: '4px 8px', fontSize: '11px', color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
              <tr style={{ background: '#fafafa' }}>
                <td><select value={newDomains.entity ?? 'us'} onChange={e => setNewDomains({ ...newDomains, entity: e.target.value })} style={inputStyle}>{ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                <td><input value={newDomains.domain ?? ''} onChange={e => setNewDomains({ ...newDomains, domain: e.target.value })} placeholder="Domain" style={inputStyle} /></td>
                <td><input value={newDomains.registrar ?? ''} onChange={e => setNewDomains({ ...newDomains, registrar: e.target.value })} placeholder="Registrar" style={inputStyle} /></td>
                <td><input type="date" value={newDomains.expiry_date ?? ''} onChange={e => setNewDomains({ ...newDomains, expiry_date: e.target.value })} style={inputStyle} /></td>
                <td>—</td>
                <td><input type="checkbox" checked={!!newDomains.auto_renew} onChange={e => setNewDomains({ ...newDomains, auto_renew: e.target.checked })} /></td>
                <td><input type="number" value={newDomains.annual_cost ?? ''} onChange={e => setNewDomains({ ...newDomains, annual_cost: e.target.value })} placeholder="Cost" style={inputStyle} /></td>
                <td><select value={newDomains.status ?? 'active'} onChange={e => setNewDomains({ ...newDomains, status: e.target.value })} style={inputStyle}>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                <td><button onClick={() => addRecord('it_domains', { ...newDomains, entity: newDomains.entity ?? 'us', domain: newDomains.domain || 'domain.com', status: newDomains.status ?? 'active' })} disabled={adding} style={{ padding: '6px 12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Add</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'software' && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                <th>Entity</th><th>Name</th><th>Vendor</th><th>Category</th><th>Seats</th><th>Monthly Cost</th><th>Renewal Date</th><th>Assigned To</th><th>Stored In</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {['us', 'india', 'both'].map(entity => {
                const rows = software.filter((r: any) => r.entity === entity)
                if (rows.length === 0) return null
                return (
                  <React.Fragment key={entity}>
                    <tr><td colSpan={11} style={{ background: '#fafafa', padding: '8px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#71717a' }}>{entity === 'us' ? 'US' : entity === 'india' ? 'India' : 'Both'} · {rows.length}</td></tr>
                    {rows.map((r: any) => {
                      const isEdit = editing?.table === 'it_software' && editing?.id === r.id
                      return (
                        <tr key={r.id}>
                          {isEdit ? (
                            <>
                              <td><select value={editRow.entity ?? r.entity} onChange={e => setEditRow({ ...editRow, entity: e.target.value })} style={inputStyle}>{ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                              <td><input value={editRow.name ?? r.name} onChange={e => setEditRow({ ...editRow, name: e.target.value })} style={inputStyle} /></td>
                              <td><input value={editRow.vendor ?? r.vendor ?? ''} onChange={e => setEditRow({ ...editRow, vendor: e.target.value })} style={inputStyle} /></td>
                              <td><input value={editRow.category ?? r.category ?? ''} onChange={e => setEditRow({ ...editRow, category: e.target.value })} style={inputStyle} /></td>
                              <td><input type="number" value={editRow.seats ?? r.seats ?? ''} onChange={e => setEditRow({ ...editRow, seats: e.target.value })} style={inputStyle} /></td>
                              <td><input type="number" value={editRow.monthly_cost ?? r.monthly_cost ?? ''} onChange={e => setEditRow({ ...editRow, monthly_cost: e.target.value })} style={inputStyle} /></td>
                              <td><input type="date" value={editRow.renewal_date ?? r.renewal_date ?? ''} onChange={e => setEditRow({ ...editRow, renewal_date: e.target.value })} style={inputStyle} /></td>
                              <td><input value={editRow.assigned_to ?? r.assigned_to ?? ''} onChange={e => setEditRow({ ...editRow, assigned_to: e.target.value })} style={inputStyle} /></td>
                              <td><input value={editRow.stored_in ?? r.stored_in ?? ''} onChange={e => setEditRow({ ...editRow, stored_in: e.target.value })} style={inputStyle} /></td>
                              <td><select value={editRow.status ?? r.status} onChange={e => setEditRow({ ...editRow, status: e.target.value })} style={inputStyle}>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                              <td><button onClick={handleSave} disabled={saving} style={{ marginRight: '6px', padding: '4px 10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Save</button><button onClick={handleCancel} style={{ padding: '4px 10px', border: '1px solid #e4e4e7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button></td>
                            </>
                          ) : (
                            <>
                              <td><EntityBadge entity={r.entity} /></td>
                              <td>{r.name}</td>
                              <td>{r.vendor ?? '—'}</td>
                              <td>{r.category ?? '—'}</td>
                              <td>{r.seats ?? '—'}</td>
                              <td>{r.monthly_cost != null ? r.monthly_cost : '—'}</td>
                              <td>{r.renewal_date ?? '—'}</td>
                              <td>{r.assigned_to ?? '—'}</td>
                              <td>{r.stored_in ?? '—'}</td>
                              <td><StatusBadge status={r.status} /></td>
                              <td>
                                <button onClick={() => { setEditing({ table: 'it_software', id: r.id }); setEditRow({ ...r }) }} style={{ marginRight: '6px', fontSize: '11px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                                <button onClick={() => handleRemove('it_software', r.id)} style={{ fontSize: '11px', color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })}
              <tr style={{ background: '#fafafa' }}>
                <td><select value={newSoftware.entity ?? 'us'} onChange={e => setNewSoftware({ ...newSoftware, entity: e.target.value })} style={inputStyle}>{ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                <td><input value={newSoftware.name ?? ''} onChange={e => setNewSoftware({ ...newSoftware, name: e.target.value })} placeholder="Name" style={inputStyle} /></td>
                <td><input value={newSoftware.vendor ?? ''} onChange={e => setNewSoftware({ ...newSoftware, vendor: e.target.value })} placeholder="Vendor" style={inputStyle} /></td>
                <td><input value={newSoftware.category ?? ''} onChange={e => setNewSoftware({ ...newSoftware, category: e.target.value })} placeholder="Category" style={inputStyle} /></td>
                <td><input type="number" value={newSoftware.seats ?? ''} onChange={e => setNewSoftware({ ...newSoftware, seats: e.target.value })} style={inputStyle} /></td>
                <td><input type="number" value={newSoftware.monthly_cost ?? ''} onChange={e => setNewSoftware({ ...newSoftware, monthly_cost: e.target.value })} style={inputStyle} /></td>
                <td><input type="date" value={newSoftware.renewal_date ?? ''} onChange={e => setNewSoftware({ ...newSoftware, renewal_date: e.target.value })} style={inputStyle} /></td>
                <td><input value={newSoftware.assigned_to ?? ''} onChange={e => setNewSoftware({ ...newSoftware, assigned_to: e.target.value })} placeholder="Assigned" style={inputStyle} /></td>
                <td><input value={newSoftware.stored_in ?? ''} onChange={e => setNewSoftware({ ...newSoftware, stored_in: e.target.value })} style={inputStyle} /></td>
                <td><select value={newSoftware.status ?? 'active'} onChange={e => setNewSoftware({ ...newSoftware, status: e.target.value })} style={inputStyle}>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                <td><button onClick={() => addRecord('it_software', { ...newSoftware, entity: newSoftware.entity ?? 'us', name: newSoftware.name || 'Software', status: newSoftware.status ?? 'active' })} disabled={adding} style={{ padding: '6px 12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Add</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'hardware' && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                <th>Entity</th><th>Asset</th><th>Type</th><th>Assigned To</th><th>Serial No</th><th>Purchase Date</th><th>Value</th><th>Condition</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {['us', 'india'].map(entity => {
                const rows = hardware.filter((r: any) => r.entity === entity)
                if (rows.length === 0) return null
                return (
                  <React.Fragment key={entity}>
                    <tr><td colSpan={9} style={{ background: '#fafafa', padding: '8px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#71717a' }}>{entity === 'us' ? 'US' : 'India'} · {rows.length}</td></tr>
                    {rows.map((r: any) => {
                      const isEdit = editing?.table === 'it_hardware' && editing?.id === r.id
                      const assigneeName = (r.team_members as any)?.name ?? '—'
                      return (
                        <tr key={r.id}>
                          {isEdit ? (
                            <>
                              <td><select value={editRow.entity ?? r.entity} onChange={e => setEditRow({ ...editRow, entity: e.target.value })} style={inputStyle}>{ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                              <td><input value={editRow.asset ?? r.asset} onChange={e => setEditRow({ ...editRow, asset: e.target.value })} style={inputStyle} /></td>
                              <td><input value={editRow.type ?? r.type ?? ''} onChange={e => setEditRow({ ...editRow, type: e.target.value })} style={inputStyle} /></td>
                              <td><select value={editRow.assigned_to ?? r.assigned_to ?? ''} onChange={e => setEditRow({ ...editRow, assigned_to: e.target.value })} style={inputStyle}><option value="">—</option>{team.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></td>
                              <td><input value={editRow.serial_no ?? r.serial_no ?? ''} onChange={e => setEditRow({ ...editRow, serial_no: e.target.value })} style={inputStyle} /></td>
                              <td><input type="date" value={editRow.purchase_date ?? r.purchase_date ?? ''} onChange={e => setEditRow({ ...editRow, purchase_date: e.target.value })} style={inputStyle} /></td>
                              <td><input type="number" value={editRow.value ?? r.value ?? ''} onChange={e => setEditRow({ ...editRow, value: e.target.value })} style={inputStyle} /></td>
                              <td><select value={editRow.condition ?? r.condition} onChange={e => setEditRow({ ...editRow, condition: e.target.value })} style={inputStyle}>{CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                              <td><button onClick={handleSave} disabled={saving} style={{ marginRight: '6px', padding: '4px 10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Save</button><button onClick={handleCancel} style={{ padding: '4px 10px', border: '1px solid #e4e4e7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button></td>
                            </>
                          ) : (
                            <>
                              <td><EntityBadge entity={r.entity} /></td>
                              <td>{r.asset}</td>
                              <td>{r.type ?? '—'}</td>
                              <td>{assigneeName}</td>
                              <td>{r.serial_no ?? '—'}</td>
                              <td>{r.purchase_date ?? '—'}</td>
                              <td>{r.value != null ? r.value : '—'}</td>
                              <td><ConditionBadge condition={r.condition} /></td>
                              <td>
                                <button onClick={() => { setEditing({ table: 'it_hardware', id: r.id }); setEditRow({ ...r }) }} style={{ marginRight: '6px', fontSize: '11px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                                <button onClick={() => handleRemove('it_hardware', r.id)} style={{ fontSize: '11px', color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })}
              <tr style={{ background: '#fafafa' }}>
                <td><select value={newHardware.entity ?? 'us'} onChange={e => setNewHardware({ ...newHardware, entity: e.target.value })} style={inputStyle}>{ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                <td><input value={newHardware.asset ?? ''} onChange={e => setNewHardware({ ...newHardware, asset: e.target.value })} placeholder="Asset" style={inputStyle} /></td>
                <td><input value={newHardware.type ?? ''} onChange={e => setNewHardware({ ...newHardware, type: e.target.value })} placeholder="Type" style={inputStyle} /></td>
                <td><select value={newHardware.assigned_to ?? ''} onChange={e => setNewHardware({ ...newHardware, assigned_to: e.target.value })} style={inputStyle}><option value="">—</option>{team.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></td>
                <td><input value={newHardware.serial_no ?? ''} onChange={e => setNewHardware({ ...newHardware, serial_no: e.target.value })} placeholder="Serial" style={inputStyle} /></td>
                <td><input type="date" value={newHardware.purchase_date ?? ''} onChange={e => setNewHardware({ ...newHardware, purchase_date: e.target.value })} style={inputStyle} /></td>
                <td><input type="number" value={newHardware.value ?? ''} onChange={e => setNewHardware({ ...newHardware, value: e.target.value })} placeholder="Value" style={inputStyle} /></td>
                <td><select value={newHardware.condition ?? 'good'} onChange={e => setNewHardware({ ...newHardware, condition: e.target.value })} style={inputStyle}>{CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                <td><button onClick={() => addRecord('it_hardware', { ...newHardware, entity: newHardware.entity ?? 'us', asset: newHardware.asset || 'Asset', condition: newHardware.condition ?? 'good' })} disabled={adding} style={{ padding: '6px 12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Add</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'licenses' && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'auto' }}>
          <table className="data-table" style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                <th>Entity</th><th>Software</th><th>License Type</th><th>Seats</th><th>Expiry Date</th><th>Days Left</th><th>Annual Cost</th><th>Stored In</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((r: any) => {
                const isEdit = editing?.table === 'it_licenses' && editing?.id === r.id
                return (
                  <tr key={r.id}>
                    {isEdit ? (
                      <>
                        <td><select value={editRow.entity ?? r.entity} onChange={e => setEditRow({ ...editRow, entity: e.target.value })} style={inputStyle}>{ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                        <td><input value={editRow.software ?? r.software} onChange={e => setEditRow({ ...editRow, software: e.target.value })} style={inputStyle} /></td>
                        <td><input value={editRow.license_type ?? r.license_type ?? ''} onChange={e => setEditRow({ ...editRow, license_type: e.target.value })} style={inputStyle} /></td>
                        <td><input type="number" value={editRow.seats ?? r.seats ?? ''} onChange={e => setEditRow({ ...editRow, seats: e.target.value })} style={inputStyle} /></td>
                        <td><input type="date" value={editRow.expiry_date ?? r.expiry_date ?? ''} onChange={e => setEditRow({ ...editRow, expiry_date: e.target.value })} style={inputStyle} /></td>
                        <td>{daysLeft(editRow.expiry_date ?? r.expiry_date) ?? '—'}</td>
                        <td><input type="number" value={editRow.annual_cost ?? r.annual_cost ?? ''} onChange={e => setEditRow({ ...editRow, annual_cost: e.target.value })} style={inputStyle} /></td>
                        <td><input value={editRow.stored_in ?? r.stored_in ?? ''} onChange={e => setEditRow({ ...editRow, stored_in: e.target.value })} style={inputStyle} /></td>
                        <td><select value={editRow.status ?? r.status} onChange={e => setEditRow({ ...editRow, status: e.target.value })} style={inputStyle}>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                        <td><button onClick={handleSave} disabled={saving} style={{ marginRight: '6px', padding: '4px 10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Save</button><button onClick={handleCancel} style={{ padding: '4px 10px', border: '1px solid #e4e4e7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button></td>
                      </>
                    ) : (
                      <>
                        <td><EntityBadge entity={r.entity} /></td>
                        <td>{r.software}</td>
                        <td>{r.license_type ?? '—'}</td>
                        <td>{r.seats ?? '—'}</td>
                        <td>{r.expiry_date ?? '—'}</td>
                        <DaysLeftCell dateStr={r.expiry_date} />
                        <td>{r.annual_cost != null ? r.annual_cost : '—'}</td>
                        <td>{r.stored_in ?? '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          <button onClick={() => { setEditing({ table: 'it_licenses', id: r.id }); setEditRow({ ...r }) }} style={{ marginRight: '6px', fontSize: '11px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleRemove('it_licenses', r.id)} style={{ fontSize: '11px', color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
              <tr style={{ background: '#fafafa' }}>
                <td><select value={newLicenses.entity ?? 'us'} onChange={e => setNewLicenses({ ...newLicenses, entity: e.target.value })} style={inputStyle}>{ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                <td><input value={newLicenses.software ?? ''} onChange={e => setNewLicenses({ ...newLicenses, software: e.target.value })} placeholder="Software" style={inputStyle} /></td>
                <td><input value={newLicenses.license_type ?? ''} onChange={e => setNewLicenses({ ...newLicenses, license_type: e.target.value })} style={inputStyle} /></td>
                <td><input type="number" value={newLicenses.seats ?? ''} onChange={e => setNewLicenses({ ...newLicenses, seats: e.target.value })} style={inputStyle} /></td>
                <td><input type="date" value={newLicenses.expiry_date ?? ''} onChange={e => setNewLicenses({ ...newLicenses, expiry_date: e.target.value })} style={inputStyle} /></td>
                <td>—</td>
                <td><input type="number" value={newLicenses.annual_cost ?? ''} onChange={e => setNewLicenses({ ...newLicenses, annual_cost: e.target.value })} style={inputStyle} /></td>
                <td><input value={newLicenses.stored_in ?? ''} onChange={e => setNewLicenses({ ...newLicenses, stored_in: e.target.value })} style={inputStyle} /></td>
                <td><select value={newLicenses.status ?? 'active'} onChange={e => setNewLicenses({ ...newLicenses, status: e.target.value })} style={inputStyle}>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                <td><button onClick={() => addRecord('it_licenses', { ...newLicenses, entity: newLicenses.entity ?? 'us', software: newLicenses.software || 'License', status: newLicenses.status ?? 'active' })} disabled={adding} style={{ padding: '6px 12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Add</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
