'use client'
import { useState, useEffect } from 'react'
import ErrorBanner from '@/components/ErrorBanner'

export default function IndiaTpPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [markAllSaving, setMarkAllSaving] = useState(false)
  const [editDates, setEditDates] = useState<Record<string, string>>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoadError(null)
    try {
      const res = await fetch('/api/india-tp')
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error('Failed to load India TP data')
      setInvoices(Array.isArray(data) ? data : [])
    } catch (e) {
      setLoadError((e as Error).message ?? 'Failed to load data')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const markAllTransferred = async () => {
    const pending = invoices.filter(i => i.tp_transfer_status === 'pending')
    if (pending.length === 0) return
    setMarkAllSaving(true)
    const today = new Date().toISOString().split('T')[0]
    await Promise.all(pending.map((i: any) =>
      fetch('/api/india-tp', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i.id, tp_transfer_status: 'transferred', tp_transfer_date: today }) })
    ))
    await fetchData()
    setMarkAllSaving(false)
  }

  const updateStatus = async (id: string, status: string, date?: string) => {
    setSaving(id)
    const res = await fetch('/api/india-tp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, tp_transfer_status: status, tp_transfer_date: date ?? null }),
    })
    await fetchData()
    setSaving(null)
    if (res.ok) setEditDates(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const pending      = invoices.filter(i => i.tp_transfer_status === 'pending')
  const transferred  = invoices.filter(i => i.tp_transfer_status === 'transferred')
  const totalPending = pending.reduce((s, i) => s + (i.tp_transfer_amount ?? 0), 0)
  const totalDone    = transferred.reduce((s, i) => s + (i.tp_transfer_amount ?? 0), 0)
  const totalBilling = invoices.reduce((s, i) => s + (i.amount ?? 0), 0)

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => { setLoading(true); fetchData(); }} onDismiss={() => setLoadError(null)} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>India TP Transfer</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>Update transfer status inline · Set transfer date · 90% of client billing</p>
        </div>
        {pending.length > 0 && (
          <button onClick={markAllTransferred} disabled={markAllSaving} style={{ padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: markAllSaving ? 'wait' : 'pointer' }}>
            {markAllSaving ? 'Updating...' : 'Mark All Transferred'}
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total Client Billing',  value: `$${totalBilling.toLocaleString()}`,  color: '#7c3aed' },
          { label: 'Total TP (90%)',         value: `$${(totalBilling * 0.9).toLocaleString()}`, color: '#2563eb' },
          { label: 'Pending Transfer',       value: `$${totalPending.toLocaleString()}`,  color: '#e11d48' },
          { label: 'Transferred',            value: `$${totalDone.toLocaleString()}`,     color: '#059669' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#09090b' }}>{k.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div style={{ background: '#fff8f8', border: '1px solid #fecdd3', borderRadius: '8px', padding: '11px 16px', marginBottom: '16px', fontSize: '13px', color: '#e11d48', fontWeight: 500 }}>
          ⚠ {pending.length} transfer{pending.length > 1 ? 's' : ''} totalling ${totalPending.toLocaleString()} pending
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>
          Transfer Records — Update status inline
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Vertical</th>
              <th>Month</th>
              <th>Client Billing</th>
              <th>TP Amount (90%)</th>
              <th>US Retained</th>
              <th>TP Status</th>
              <th>Transfer Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#a1a1aa' }}>No transfer records. Invoices with TP amount will appear here.</td></tr>
            )}
            {invoices.map(i => {
              const retained = (i.amount ?? 0) - (i.tp_transfer_amount ?? 0)
              const isSaving = saving === i.id
              return (
                <tr key={i.id} style={{ background: i.tp_transfer_status === 'pending' ? '#fffdf5' : 'white' }}>
                  <td style={{ fontWeight: 600, color: '#09090b' }}>{i.clients?.name ?? '—'}</td>
                  <td><span className="badge badge-gray">{i.clients?.vertical}</span></td>
                  <td style={{ fontFamily: 'monospace', color: '#71717a' }}>{i.month_year}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>${i.amount?.toLocaleString()}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>${i.tp_transfer_amount?.toLocaleString()}</td>
                  <td style={{ fontFamily: 'monospace', color: '#059669' }}>${retained.toLocaleString()}</td>
                  <td>
                    <select
                      value={i.tp_transfer_status ?? 'pending'}
                      onChange={e => updateStatus(i.id, e.target.value, editDates[i.id])}
                      disabled={isSaving}
                      style={{
                        padding: '4px 8px', borderRadius: '5px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
                        border: '1px solid',
                        background: i.tp_transfer_status === 'transferred' ? '#ecfdf5' : '#fffbeb',
                        color: i.tp_transfer_status === 'transferred' ? '#059669' : '#d97706',
                        borderColor: i.tp_transfer_status === 'transferred' ? '#a7f3d0' : '#fde68a',
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="transferred">Transferred</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      value={editDates[i.id] ?? i.tp_transfer_date ?? ''}
                      onChange={e => setEditDates({ ...editDates, [i.id]: e.target.value })}
                      style={{ padding: '4px 8px', border: '1px solid #e4e4e7', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit' }}
                    />
                  </td>
                  <td>
                    {editDates[i.id] && editDates[i.id] !== i.tp_transfer_date && (
                      <button
                        onClick={() => updateStatus(i.id, i.tp_transfer_status, editDates[i.id])}
                        disabled={isSaving}
                        style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {isSaving ? '...' : 'Save'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
