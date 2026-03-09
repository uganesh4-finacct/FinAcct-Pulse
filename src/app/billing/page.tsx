'use client'
import React, { useState, useEffect } from 'react'
import ErrorBanner from '@/components/ErrorBanner'
import SidePanel from '@/components/SidePanel'
import SubNav from '@/components/SubNav'
import { FieldRow, FieldInput, FieldSelect } from '@/components/FieldRow'

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [newInvoice, setNewInvoice] = useState({ client_id: '', amount: '', month_year: new Date().toISOString().slice(0, 7), due_date: '' })

  useEffect(() => { fetchInvoices(); fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => []) }, [])

  const fetchInvoices = async () => {
    setLoadError(null)
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error('Failed to load invoices')
      setInvoices(Array.isArray(data) ? data : [])
    } catch (e) {
      setLoadError((e as Error).message ?? 'Failed to load data')
    }
    setLoading(false)
  }

  const toggleExpand = (inv: any) => {
    if (expandedId === inv.id) {
      setExpandedId(null)
    } else {
      setExpandedId(inv.id)
      setEditForm({
        amount: inv.amount,
        due_date: inv.due_date,
        payment_status: inv.payment_status,
        paid_date: inv.paid_date ?? '',
        notes: inv.notes ?? '',
      })
    }
  }

  const save = async (id: string) => {
    setSaving(true)
    const res = await fetch('/api/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'update_fields', amount: editForm.amount, ...editForm }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || data.error) return
    await fetchInvoices()
    setExpandedId(null)
  }

  const markPaid = async (id: string) => {
    setSaving(true)
    await fetch('/api/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'mark_paid' }),
    })
    await fetchInvoices()
    setSaving(false)
  }

  const exportCSV = () => {
    const rows = [
      ['Client', 'Vertical', 'Month', 'Amount', 'Due Date', 'Status', 'Paid Date', 'TP Amount', 'TP Status'],
      ...invoices.map(i => [
        i.clients?.name, i.clients?.vertical, i.month_year,
        i.amount, i.due_date, i.payment_status,
        i.paid_date ?? '', i.tp_transfer_amount, i.tp_transfer_status,
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `billing-${new Date().toISOString().slice(0, 7)}.csv`
    a.click()
  }

  const filtered = invoices.filter(i =>
    filter === 'all' ? true : filter === 'unpaid' ? i.payment_status !== 'paid' : i.payment_status === 'paid'
  )

  const totalAR   = invoices.filter(i => i.payment_status !== 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPaid = invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.amount, 0)
  const over20    = invoices.filter(i => i.payment_status !== 'paid' && i.outstanding_days > 20).length
  const over10    = invoices.filter(i => i.payment_status !== 'paid' && i.outstanding_days > 10 && i.outstanding_days <= 20).length

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa', textAlign: 'center' }}>Loading...</div>

  const createInvoice = async () => {
    if (!newInvoice.client_id || !newInvoice.amount) return
    setSaving(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: newInvoice.client_id,
        amount: parseFloat(newInvoice.amount),
        month_year: newInvoice.month_year || new Date().toISOString().slice(0, 7),
        due_date: newInvoice.due_date || null,
        payment_status: 'unpaid',
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (data.error) return
    setShowNewInvoice(false)
    setNewInvoice({ client_id: '', amount: '', month_year: new Date().toISOString().slice(0, 7), due_date: '' })
    await fetchInvoices()
  }

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => { setLoading(true); fetchInvoices(); }} onDismiss={() => setLoadError(null)} />}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>Billing & AR</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>Click any invoice row to edit · Mark paid · Export</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowNewInvoice(true)} style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            + Add New Invoice
          </button>
          <button onClick={exportCSV} style={{ fontSize: '12px', padding: '7px 14px', border: '1px solid #e4e4e7', borderRadius: '7px', background: 'white', cursor: 'pointer' }}>
            ↓ Export CSV
          </button>
        </div>
      </div>
      <SubNav />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'AR Outstanding', value: `$${totalAR.toLocaleString()}`,  sub: `${invoices.filter(i => i.payment_status !== 'paid').length} unpaid`, color: '#7c3aed' },
          { label: 'Collected',      value: `$${totalPaid.toLocaleString()}`, sub: `${invoices.filter(i => i.payment_status === 'paid').length} paid`,  color: '#059669' },
          { label: '10-20d Overdue', value: over10,  sub: 'Follow up needed',       color: '#d97706' },
          { label: '20d+ Overdue',   value: over20,  sub: 'Escalate immediately',    color: '#e11d48' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.03em' }}>{k.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {over20 > 0 && (
        <div style={{ background: '#fff8f8', border: '1px solid #fecdd3', borderRadius: '8px', padding: '11px 16px', marginBottom: '16px', fontSize: '13px', color: '#e11d48', fontWeight: 500 }}>
          ⚠ {over20} invoice{over20 > 1 ? 's' : ''} unpaid over 20 days — immediate follow-up required
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {(['all', 'unpaid', 'paid'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            background: filter === f ? '#09090b' : 'white',
            color: filter === f ? 'white' : '#71717a',
            border: `1px solid ${filter === f ? '#09090b' : '#e4e4e7'}`,
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoice Table with expandable rows */}
      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Days Out</th>
              <th>Status</th>
              <th>TP Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#a1a1aa' }}>
                  <div>No invoices found. Add your first invoice.</div>
                  <button onClick={() => setShowNewInvoice(true)} style={{ marginTop: '12px', padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add Invoice</button>
                </td>
              </tr>
            )}
            {filtered.map(inv => {
              const isPaid = inv.payment_status === 'paid'
              const isExpanded = expandedId === inv.id
              return (
                <React.Fragment key={inv.id}>
                  <tr
                    onClick={() => toggleExpand(inv)}
                    style={{
                      cursor: 'pointer',
                      background: isExpanded ? '#fafafa' : (!isPaid && inv.aging_flag === 'red') ? '#fff8f8' : (!isPaid && inv.aging_flag === 'yellow') ? '#fffdf5' : 'white',
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: '#a1a1aa', transition: 'transform 0.15s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
                        <span style={{ fontWeight: 600, color: '#09090b' }}>{inv.clients?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#71717a' }}>{inv.month_year}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#09090b' }}>${inv.amount?.toLocaleString()}</td>
                    <td style={{ fontSize: '12px', color: '#71717a' }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: !isPaid && inv.outstanding_days > 20 ? '#e11d48' : !isPaid && inv.outstanding_days > 10 ? '#d97706' : '#a1a1aa' }}>
                      {isPaid ? '—' : `${inv.outstanding_days}d`}
                    </td>
                    <td>
                      {isPaid ? <span className="badge badge-green">Paid</span>
                        : inv.aging_flag === 'red' ? <span className="badge badge-red">Escalated</span>
                        : inv.aging_flag === 'yellow' ? <span className="badge badge-yellow">Overdue</span>
                        : <span className="badge badge-blue">Unpaid</span>}
                    </td>
                    <td>
                      {inv.tp_transfer_status === 'transferred'
                        ? <span className="badge badge-green">Transferred</span>
                        : <span className="badge badge-yellow">Pending</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {!isPaid && (
                          <button onClick={() => markPaid(inv.id)} disabled={saving} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
                            Mark Paid
                          </button>
                        )}
                        <a href="https://app.qbo.intuit.com/app/invoice" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11.5px', color: '#7c3aed', fontWeight: 500, textDecoration: 'none' }}>
                          QBO ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded edit row */}
                  {isExpanded && (
                    <tr key={`${inv.id}-expand`}>
                      <td colSpan={8} style={{ padding: '0', background: '#fafafa', borderBottom: '2px solid #e4e4e7' }}>
                        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '12px', alignItems: 'flex-end' }}>
                          {[
                            { label: 'Amount ($)', key: 'amount', type: 'number' },
                            { label: 'Due Date', key: 'due_date', type: 'date' },
                            { label: 'Paid Date', key: 'paid_date', type: 'date' },
                          ].map(field => (
                            <div key={field.key}>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.label}</label>
                              <input
                                type={field.type}
                                value={editForm[field.key] ?? ''}
                                onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }}
                              />
                            </div>
                          ))}
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</label>
                            <select
                              value={editForm.payment_status ?? ''}
                              onChange={e => setEditForm({ ...editForm, payment_status: e.target.value })}
                              style={{ width: '100%', padding: '7px 10px', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }}
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="paid">Paid</option>
                              <option value="partial">Partial</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</label>
                            <input
                              type="text"
                              placeholder="Payment reference..."
                              value={editForm.notes ?? ''}
                              onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                              style={{ width: '100%', padding: '7px 10px', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => save(inv.id)} disabled={saving} style={{ padding: '7px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setExpandedId(null)} style={{ padding: '7px 12px', background: 'white', color: '#71717a', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '12.5px', cursor: 'pointer' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <SidePanel open={showNewInvoice} onClose={() => setShowNewInvoice(false)} title="Add New Invoice" subtitle="Client, amount, month/year, due date">
        <FieldRow label="Client" required>
          <FieldSelect
            value={newInvoice.client_id}
            onChange={v => setNewInvoice({ ...newInvoice, client_id: v })}
            options={[{ value: '', label: '— Select client —' }, ...clients.map((c: any) => ({ value: c.id, label: c.name }))]}
          />
        </FieldRow>
        <FieldRow label="Amount ($)" required>
          <FieldInput type="number" value={newInvoice.amount} onChange={v => setNewInvoice({ ...newInvoice, amount: v })} placeholder="0" />
        </FieldRow>
        <FieldRow label="Month / Year">
          <FieldInput type="month" value={newInvoice.month_year} onChange={v => setNewInvoice({ ...newInvoice, month_year: v })} />
        </FieldRow>
        <FieldRow label="Due date">
          <FieldInput type="date" value={newInvoice.due_date} onChange={v => setNewInvoice({ ...newInvoice, due_date: v })} />
        </FieldRow>
        <div style={{ marginTop: '20px' }}>
          <button onClick={createInvoice} disabled={saving || !newInvoice.client_id || !newInvoice.amount} style={{ width: '100%', padding: '10px', background: saving ? '#a78bfa' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Saving...' : 'Create Invoice'}
          </button>
        </div>
      </SidePanel>
    </div>
  )
}
