'use client'
import { useState, useEffect } from 'react'
import ErrorBanner from '@/components/ErrorBanner'

const ENTITY_OPTIONS = [
  { value: 'us', label: '🇺🇸 US Entity' },
  { value: 'india', label: '🇮🇳 India Entity' },
]

const CATEGORY_OPTIONS = [
  { value: 'salary', label: 'Salary' },
  { value: 'software', label: 'Software' },
  { value: 'office', label: 'Office' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'travel', label: 'Travel' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
]

export default function PLPage() {
  const [data, setData] = useState<{ costs: any[], salaries: any[] }>({ costs: [], salaries: [] })
  const [clients, setClients] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCost, setNewCost] = useState({ entity: 'us', category: 'software', description: '', monthly_amount: '' })
  const [newSalary, setNewSalary] = useState({ team_member_id: '', monthly_salary: '', currency: 'USD' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'salaries'>('overview')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingCost, setEditingCost] = useState<any | null>(null)
  const [editingSalary, setEditingSalary] = useState<any | null>(null)
  const [editCostRow, setEditCostRow] = useState<any>({})
  const [editSalaryRow, setEditSalaryRow] = useState<any>({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoadError(null)
    try {
      const [plData, teamData, clientData] = await Promise.all([
        fetch('/api/pl').then(r => r.json().catch(() => ({ costs: [], salaries: [] }))),
        fetch('/api/team').then(r => r.json().catch(() => [])),
        fetch('/api/clients').then(r => r.json().catch(() => [])),
      ])
      const pl = plData && typeof plData === 'object' ? plData : { costs: [], salaries: [] }
      setData({ costs: pl.costs ?? [], salaries: pl.salaries ?? [] })
      setTeamMembers(Array.isArray(teamData) ? teamData : [])
      setClients(Array.isArray(clientData) ? clientData : [])
    } catch (e) {
      setLoadError((e as Error).message ?? 'Failed to load data')
      setData({ costs: [], salaries: [] })
      setTeamMembers([])
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const saveCostEdit = async () => {
    if (!editingCost?.id) return
    setSaving(true)
    await fetch('/api/pl', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'cost_centers', id: editingCost.id, ...editCostRow }) })
    await fetchAll()
    setSaving(false)
    setEditingCost(null)
  }

  const saveSalaryEdit = async () => {
    if (!editingSalary?.id) return
    setSaving(true)
    await fetch('/api/pl', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'salary_records', id: editingSalary.id, ...editSalaryRow }) })
    await fetchAll()
    setSaving(false)
    setEditingSalary(null)
  }

  const addCost = async () => {
    if (!newCost.description || !newCost.monthly_amount) return
    setSaving(true)
    await fetch('/api/pl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'cost_centers', data: { ...newCost, monthly_amount: parseFloat(newCost.monthly_amount), effective_from: new Date().toISOString().split('T')[0] } }),
    })
    setNewCost({ entity: 'us', category: 'software', description: '', monthly_amount: '' })
    await fetchAll()
    setSaving(false)
  }

  const addSalary = async () => {
    if (!newSalary.team_member_id || !newSalary.monthly_salary) return
    setSaving(true)
    await fetch('/api/pl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'salary_records', data: { ...newSalary, monthly_salary: parseFloat(newSalary.monthly_salary), effective_from: new Date().toISOString().split('T')[0] } }),
    })
    setNewSalary({ team_member_id: '', monthly_salary: '', currency: 'USD' })
    await fetchAll()
    setSaving(false)
  }

  const deleteCost = async (id: string) => {
    await fetch('/api/pl', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'cost_centers', id }),
    })
    await fetchAll()
  }

  const deleteSalary = async (id: string) => {
    await fetch('/api/pl', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'salary_records', id }),
    })
    await fetchAll()
  }

  // Compute P&L from client data
  const totalRevenue    = clients.reduce((s, c) => s + (c.monthly_fee ?? 0), 0)
  const totalTP         = clients.reduce((s, c) => s + (c.india_tp_transfer ?? 0), 0)
  const usGrossMargin   = totalRevenue - totalTP
  const usSalaries      = data.salaries.filter(s => s.team_members?.entity === 'us').reduce((sum, s) => sum + s.monthly_salary, 0)
  const indiaSalaries   = data.salaries.filter(s => s.team_members?.entity === 'india').reduce((sum, s) => sum + s.monthly_salary, 0)
  const usCosts         = data.costs.filter(c => c.entity === 'us').reduce((sum, c) => sum + c.monthly_amount, 0)
  const indiaCosts      = data.costs.filter(c => c.entity === 'india').reduce((sum, c) => sum + c.monthly_amount, 0)
  const usNetProfit     = usGrossMargin - usSalaries - usCosts
  const indiaNetProfit  = totalTP - indiaSalaries - indiaCosts
  const hasData         = data.salaries.length > 0 || data.costs.length > 0

  const inputStyle = {
    padding: '7px 10px', border: '1px solid #e4e4e7', borderRadius: '7px',
    fontSize: '13px', fontFamily: 'inherit', color: '#09090b', background: 'white',
  }

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => { setLoading(true); fetchAll(); }} onDismiss={() => setLoadError(null)} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>P&L Overview</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · US vs India entity · Add salaries and costs below
          </p>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#f4f4f5', padding: '4px', borderRadius: '8px' }}>
          {(['overview', 'costs', 'salaries'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? '#09090b' : '#71717a',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              textTransform: 'capitalize',
            }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {!hasData && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: '#d97706', fontWeight: 500 }}>
          ⚠ No salary or cost data yet. Use the Salaries and Costs tabs below to add data and see full profitability.
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Total Revenue',    value: totalRevenue,   color: '#7c3aed' },
              { label: 'US Net Profit',    value: usNetProfit,    color: usNetProfit > 0 ? '#059669' : '#e11d48' },
              { label: 'India Net Profit', value: indiaNetProfit, color: indiaNetProfit > 0 ? '#059669' : '#e11d48' },
              { label: 'TP to India',      value: totalTP,        color: '#2563eb' },
            ].map(k => (
              <div key={k.label} style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', borderTop: `3px solid ${k.color}` }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: k.color, letterSpacing: '-0.03em' }}>${k.value.toLocaleString()}</div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '4px' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* P&L Detail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              {
                title: '🇺🇸 US Entity', color: '#7c3aed', topBg: '#f5f3ff',
                rows: [
                  { label: 'Total Revenue',        value: totalRevenue,     color: '#7c3aed', bold: true },
                  { label: 'India TP Transfer',     value: -totalTP,         color: '#e11d48', sub: '90% paid to India' },
                  { label: 'US Gross Margin',       value: usGrossMargin,    color: '#059669', bold: true },
                  { label: 'US Salaries',           value: -usSalaries,      color: '#e11d48', sub: `${data.salaries.filter(s => s.team_members?.entity === 'us').length} members` },
                  { label: 'US Overhead',           value: -usCosts,         color: '#e11d48', sub: 'Software, office, etc.' },
                ],
                net: usNetProfit, netLabel: 'US Net Profit',
              },
              {
                title: '🇮🇳 India Entity', color: '#059669', topBg: '#f0fdf4',
                rows: [
                  { label: 'TP Received from US',   value: totalTP,          color: '#059669', bold: true },
                  { label: 'India Salaries',         value: -indiaSalaries,   color: '#e11d48', sub: `${data.salaries.filter(s => s.team_members?.entity === 'india').length} members` },
                  { label: 'India Overhead',         value: -indiaCosts,      color: '#e11d48', sub: 'Office, infra, etc.' },
                ],
                net: indiaNetProfit, netLabel: 'India Net Profit',
              },
            ].map(entity => (
              <div key={entity.title} style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 700, color: '#09090b' }}>
                  {entity.title}
                </div>
                {entity.rows.map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #f4f4f5', background: row.bold ? '#fafafa' : 'white' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: row.bold ? 700 : 400, color: '#09090b' }}>{row.label}</div>
                      {(row as any).sub && <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '1px' }}>{(row as any).sub}</div>}
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: row.color }}>
                      ${Math.abs(row.value).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div style={{ background: entity.topBg, borderTop: `2px solid ${entity.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#09090b' }}>{entity.netLabel}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, color: entity.net > 0 ? '#059669' : '#e11d48' }}>
                      ${entity.net.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'costs' && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>
            Overhead Costs ({data.costs.length})
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Category</th>
                <th>Description</th>
                <th>Monthly Amount</th>
                <th>Effective From</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.costs.length === 0 && !newCost.description && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#a1a1aa' }}>No costs yet. Add one below.</td></tr>
              )}
              {data.costs.map(c => (
                <tr key={c.id} style={{ background: editingCost?.id === c.id ? '#f5f3ff' : 'white' }}>
                  <td><span className={`badge ${c.entity === 'us' ? 'badge-violet' : 'badge-green'}`}>{c.entity === 'us' ? '🇺🇸 US' : '🇮🇳 India'}</span></td>
                  <td><span className="badge badge-gray">{c.category}</span></td>
                  <td style={{ color: '#09090b' }}>{c.description}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#09090b' }}>${c.monthly_amount?.toLocaleString()}</td>
                  <td style={{ fontSize: '12px', color: '#a1a1aa' }}>{c.effective_from}</td>
                  <td>
                    <button onClick={() => { setEditingCost(c); setEditCostRow({ entity: c.entity, category: c.category, description: c.description, monthly_amount: c.monthly_amount }); }} style={{ marginRight: '8px', padding: '2px 8px', fontSize: '11px', background: '#f4f4f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteCost(c.id)} style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Remove</button>
                  </td>
                </tr>
              ))}
              {editingCost && (
                <tr style={{ background: '#f5f3ff' }}>
                  <td><select value={editCostRow.entity} onChange={e => setEditCostRow({ ...editCostRow, entity: e.target.value })} style={inputStyle}><option value="us">🇺🇸 US</option><option value="india">🇮🇳 India</option></select></td>
                  <td><select value={editCostRow.category} onChange={e => setEditCostRow({ ...editCostRow, category: e.target.value })} style={inputStyle}>{CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                  <td><input value={editCostRow.description} onChange={e => setEditCostRow({ ...editCostRow, description: e.target.value })} style={{ ...inputStyle, width: '100%' }} /></td>
                  <td><input type="number" value={editCostRow.monthly_amount ?? ''} onChange={e => setEditCostRow({ ...editCostRow, monthly_amount: e.target.value })} style={inputStyle} /></td>
                  <td colSpan={2}><button onClick={saveCostEdit} disabled={saving} style={{ padding: '6px 12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button><button onClick={() => setEditingCost(null)} style={{ marginLeft: '8px', padding: '6px 12px', background: 'white', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button></td>
                </tr>
              )}
              {/* Add row */}
              <tr style={{ background: '#fafafa' }}>
                <td>
                  <select value={newCost.entity} onChange={e => setNewCost({ ...newCost, entity: e.target.value })} style={inputStyle}>
                    <option value="us">🇺🇸 US</option>
                    <option value="india">🇮🇳 India</option>
                  </select>
                </td>
                <td>
                  <select value={newCost.category} onChange={e => setNewCost({ ...newCost, category: e.target.value })} style={inputStyle}>
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td>
                  <input value={newCost.description} onChange={e => setNewCost({ ...newCost, description: e.target.value })} placeholder="e.g. QuickBooks Online" style={{ ...inputStyle, width: '100%' }} />
                </td>
                <td>
                  <input type="number" value={newCost.monthly_amount} onChange={e => setNewCost({ ...newCost, monthly_amount: e.target.value })} placeholder="e.g. 150" style={inputStyle} />
                </td>
                <td colSpan={2}>
                  <button onClick={addCost} disabled={saving} style={{ padding: '7px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                    + Add Cost
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'salaries' && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>
            Salary Records ({data.salaries.length})
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Entity</th>
                <th>Monthly Salary</th>
                <th>Currency</th>
                <th>Effective From</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.salaries.length === 0 && !newSalary.team_member_id && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#a1a1aa' }}>No salary records yet. Add one below.</td></tr>
              )}
              {data.salaries.map(s => (
                <tr key={s.id} style={{ background: editingSalary?.id === s.id ? '#f5f3ff' : 'white' }}>
                  <td style={{ fontWeight: 600, color: '#09090b' }}>{s.team_members?.name ?? '—'}</td>
                  <td style={{ color: '#71717a' }}>{s.team_members?.role_title ?? '—'}</td>
                  <td><span className={`badge ${s.team_members?.entity === 'us' ? 'badge-violet' : 'badge-green'}`}>{s.team_members?.entity === 'us' ? '🇺🇸 US' : '🇮🇳 India'}</span></td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>${s.monthly_salary?.toLocaleString()}</td>
                  <td style={{ color: '#71717a' }}>{s.currency}</td>
                  <td style={{ fontSize: '12px', color: '#a1a1aa' }}>{s.effective_from}</td>
                  <td>
                    <button onClick={() => { setEditingSalary(s); setEditSalaryRow({ monthly_salary: s.monthly_salary, currency: s.currency }); }} style={{ marginRight: '8px', padding: '2px 8px', fontSize: '11px', background: '#f4f4f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteSalary(s.id)} style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Remove</button>
                  </td>
                </tr>
              ))}
              {editingSalary && (
                <tr style={{ background: '#f5f3ff' }}>
                  <td colSpan={3} style={{ color: '#71717a', fontSize: '12px' }}>Edit salary</td>
                  <td><input type="number" value={editSalaryRow.monthly_salary ?? ''} onChange={e => setEditSalaryRow({ ...editSalaryRow, monthly_salary: e.target.value })} style={inputStyle} /></td>
                  <td><select value={editSalaryRow.currency} onChange={e => setEditSalaryRow({ ...editSalaryRow, currency: e.target.value })} style={inputStyle}><option value="USD">USD</option><option value="INR">INR</option></select></td>
                  <td colSpan={2}><button onClick={saveSalaryEdit} disabled={saving} style={{ padding: '6px 12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button><button onClick={() => setEditingSalary(null)} style={{ marginLeft: '8px', padding: '6px 12px', background: 'white', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button></td>
                </tr>
              )}
              {/* Add row */}
              <tr style={{ background: '#fafafa' }}>
                <td colSpan={2}>
                  <select value={newSalary.team_member_id} onChange={e => setNewSalary({ ...newSalary, team_member_id: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                    <option value="">Select team member...</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} — {m.role_title}</option>)}
                  </select>
                </td>
                <td></td>
                <td>
                  <input type="number" value={newSalary.monthly_salary} onChange={e => setNewSalary({ ...newSalary, monthly_salary: e.target.value })} placeholder="Monthly salary" style={inputStyle} />
                </td>
                <td>
                  <select value={newSalary.currency} onChange={e => setNewSalary({ ...newSalary, currency: e.target.value })} style={inputStyle}>
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                  </select>
                </td>
                <td colSpan={2}>
                  <button onClick={addSalary} disabled={saving} style={{ padding: '7px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                    + Add Salary
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
