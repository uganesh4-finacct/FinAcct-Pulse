'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ErrorBanner from '@/components/ErrorBanner'
import SidePanel from '@/components/SidePanel'
import SubNav from '@/components/SubNav'
import { FieldRow, FieldInput, FieldSelect, FieldTextarea } from '@/components/FieldRow'

const behaviorConfig: Record<string, { label: string; badge: string }> = {
  good_payer:    { label: 'Good Payer',    badge: 'badge-green' },
  has_unpaid:    { label: 'Has Unpaid',    badge: 'badge-yellow' },
  often_late:    { label: 'Often Late',    badge: 'badge-yellow' },
  chronic_late:  { label: 'Chronic Late',  badge: 'badge-red' },
}

export default function CashFlowPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [patterns, setPatterns] = useState<any[]>([])
  const [projection, setProjection] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<any>({})
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({ client_id: '', received_amount: '', received_date: new Date().toISOString().split('T')[0], notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoadError(null)
    try {
      const [cashRes, clientsRes] = await Promise.all([
        fetch('/api/cashflow').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load'))),
        fetch('/api/clients').then(r => r.json().catch(() => [])),
      ])
      setPayments(cashRes.payments ?? [])
      setSummary(cashRes.summary ?? null)
      setPatterns(cashRes.patterns ?? [])
      setProjection(cashRes.projection ?? [])
      setClients(Array.isArray(clientsRes) ? clientsRes : [])
    } catch (e) {
      setLoadError((e as Error).message ?? 'Failed to load data')
      setPayments([])
      setSummary(null)
      setPatterns([])
      setProjection([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const collectionRate = summary?.collection_rate ?? 0
  const maxProjected = Math.max(...(projection || []).map((p: any) => p?.projected_revenue ?? 0), 1)

  const savePaymentEdit = async () => {
    if (!editingId) return
    setSaving(true)
    await fetch('/api/cashflow', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, ...editRow }),
    })
    await fetchAll()
    setSaving(false)
    setEditingId(null)
  }

  const addPayment = async () => {
    if (!newPayment.client_id || !newPayment.received_amount) return
    setSaving(true)
    const res = await fetch('/api/cashflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: newPayment.client_id,
        received_amount: parseFloat(newPayment.received_amount),
        received_date: newPayment.received_date || new Date().toISOString().split('T')[0],
        notes: newPayment.notes || null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (data.error) return
    setShowAddPayment(false)
    setNewPayment({ client_id: '', received_amount: '', received_date: new Date().toISOString().split('T')[0], notes: '' })
    await fetchAll()
  }

  if (loading) return <div style={{ padding: '40px', color: '#a1a1aa', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => { setLoading(true); fetchAll(); }} onDismiss={() => setLoadError(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>Cash Flow & Collections</h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Real-time collection tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAddPayment(true)} style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            + Add Payment
          </button>
          <Link href="/billing" style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 500, textDecoration: 'none', padding: '6px 14px', border: '1px solid #ddd6fe', borderRadius: '7px', background: '#f5f3ff' }}>
            → Billing & AR
          </Link>
        </div>
      </div>
      <SubNav />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Expected This Month', value: `$${((summary?.expected_this_month ?? 0)).toLocaleString()}`, sub: `${summary?.client_count ?? 0} active clients`, color: '#7c3aed' },
          { label: 'Collected', value: `$${((summary?.collected_this_month ?? 0)).toLocaleString()}`, sub: `${summary?.clients_paid ?? 0} clients paid`, color: '#059669' },
          { label: 'Outstanding', value: `$${((summary?.outstanding ?? 0)).toLocaleString()}`, sub: `${summary?.clients_unpaid ?? 0} unpaid`, color: '#d97706' },
          { label: 'Overdue Now', value: summary?.clients_overdue ?? 0, sub: 'Past due date', color: '#e11d48' },
          { label: 'Collection Rate', value: `${collectionRate}%`, sub: `Avg ${summary?.avg_days_late ?? 0}d late`, color: collectionRate >= 90 ? '#059669' : collectionRate >= 70 ? '#d97706' : '#e11d48' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '18px 20px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.03em' }}>{k.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginTop: '5px' }}>{k.label}</div>
            <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', whiteSpace: 'nowrap' }}>Collection Rate</span>
        <div style={{ flex: 1, height: '8px', background: '#f4f4f5', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', width: `${collectionRate}%`, background: collectionRate >= 90 ? '#059669' : collectionRate >= 70 ? '#d97706' : '#e11d48', transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: collectionRate >= 90 ? '#059669' : collectionRate >= 70 ? '#d97706' : '#e11d48', whiteSpace: 'nowrap' }}>{collectionRate}%</span>
        <span style={{ fontSize: '11px', color: '#a1a1aa', whiteSpace: 'nowrap' }}>{collectionRate >= 90 ? '✓ Excellent' : collectionRate >= 70 ? '⚠ Needs attention' : '⚠ Critical'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>6-Month Revenue Projection</div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
              {(projection.length ? projection : [{ projected_revenue: 0, month_year: '', month_label: '—' }]).slice(0, 6).map((p: any, i: number) => {
                const heightPct = maxProjected ? (p.projected_revenue / maxProjected) * 100 : 8
                return (
                  <div key={p.month_year || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: i === 0 ? '#7c3aed' : '#71717a' }}>${((p.projected_revenue ?? 0) / 1000).toFixed(1)}k</span>
                    <div style={{ width: '100%', borderRadius: '5px 5px 0 0', height: `${Math.max(heightPct, 8)}%`, background: i === 0 ? '#7c3aed' : '#ede9fe', transition: 'height 0.3s' }} />
                    <span style={{ fontSize: '10px', color: '#a1a1aa' }}>{p.month_label || '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b', display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment History</span>
            <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 400 }}>Click row to edit</span>
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {payments.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>No payment records yet. Add a payment above.</div>
            )}
            {payments.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '12.5px', background: editingId === p.id ? '#fafafa' : 'white' }}>
                <div>
                  <div style={{ fontWeight: 500, color: '#09090b' }}>{(p.clients as any)?.name ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '1px' }}>{p.month_year ?? p.received_date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace', color: '#09090b' }}>${p.received_amount?.toLocaleString() ?? '0'}</div>
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '1px' }}>{p.received_date ? new Date(p.received_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
                </div>
                <button onClick={() => { setEditingId(p.id); setEditRow({ received_amount: p.received_amount, received_date: p.received_date ?? '', notes: p.notes ?? '' }); }} style={{ padding: '4px 10px', fontSize: '11px', background: '#f4f4f5', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingId && (
        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px' }}>Amount</label>
            <input type="number" value={editRow.received_amount ?? ''} onChange={e => setEditRow({ ...editRow, received_amount: e.target.value })} style={{ padding: '6px 10px', border: '1px solid #e4e4e7', borderRadius: '6px', width: '100px' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px' }}>Date</label>
            <input type="date" value={editRow.received_date ?? ''} onChange={e => setEditRow({ ...editRow, received_date: e.target.value })} style={{ padding: '6px 10px', border: '1px solid #e4e4e7', borderRadius: '6px' }} />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px' }}>Notes</label>
            <input type="text" value={editRow.notes ?? ''} onChange={e => setEditRow({ ...editRow, notes: e.target.value })} placeholder="Notes" style={{ padding: '6px 10px', border: '1px solid #e4e4e7', borderRadius: '6px', width: '100%' }} />
          </div>
          <button onClick={savePaymentEdit} disabled={saving} style={{ padding: '6px 14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', background: 'white', color: '#71717a', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>Client Payment Behavior</div>
        <table className="data-table" style={{ fontSize: '12.5px' }}>
          <thead>
            <tr>
              <th>Client</th><th>Vertical</th><th>Owner</th><th>Monthly Fee</th><th>Payment Method</th><th>Invoices</th><th>Paid On Time</th><th>Avg Days Late</th><th>Pay Rate</th><th>Behavior</th>
            </tr>
          </thead>
          <tbody>
            {patterns.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#a1a1aa' }}>No pattern data yet. Views v_collection_patterns may be required.</td></tr>
            )}
            {patterns.map((p: any) => {
              const cfg = behaviorConfig[p.payment_behavior] ?? behaviorConfig.good_payer
              return (
                <tr key={p.client_id} style={{ background: p.payment_behavior === 'chronic_late' ? '#fff8f8' : p.payment_behavior === 'often_late' ? '#fffdf5' : 'white' }}>
                  <td style={{ fontWeight: 500, color: '#09090b' }}>{p.client_name}</td>
                  <td style={{ color: '#71717a' }}>{p.vertical}</td>
                  <td style={{ color: '#71717a' }}>{p.owner_name ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>${p.monthly_fee?.toLocaleString()}</td>
                  <td><span className="badge badge-gray">{p.payment_method?.toUpperCase() ?? '—'}</span></td>
                  <td style={{ fontFamily: 'monospace', color: '#71717a' }}>{p.total_invoices}</td>
                  <td style={{ fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>{p.paid_on_time ?? 0}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: (p.avg_days_late ?? 0) > 15 ? '#e11d48' : (p.avg_days_late ?? 0) > 7 ? '#d97706' : '#059669' }}>{p.avg_days_late ?? 0}d</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '40px', height: '4px', background: '#f4f4f5', borderRadius: '99px' }}><div style={{ height: '100%', borderRadius: '99px', width: `${p.payment_rate_pct ?? 0}%`, background: (p.payment_rate_pct ?? 0) >= 90 ? '#059669' : '#d97706' }} /></div><span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>{p.payment_rate_pct ?? 0}%</span></div></td>
                  <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <SidePanel open={showAddPayment} onClose={() => setShowAddPayment(false)} title="Add Payment" subtitle="Record payment received">
        <FieldRow label="Client" required>
          <FieldSelect value={newPayment.client_id} onChange={v => setNewPayment({ ...newPayment, client_id: v })} options={[{ value: '', label: '— Select —' }, ...clients.map((c: any) => ({ value: c.id, label: c.name }))]} />
        </FieldRow>
        <FieldRow label="Amount received ($)" required>
          <FieldInput type="number" value={newPayment.received_amount} onChange={v => setNewPayment({ ...newPayment, received_amount: v })} placeholder="0" />
        </FieldRow>
        <FieldRow label="Payment date">
          <FieldInput type="date" value={newPayment.received_date} onChange={v => setNewPayment({ ...newPayment, received_date: v })} />
        </FieldRow>
        <FieldRow label="Notes">
          <FieldTextarea value={newPayment.notes} onChange={v => setNewPayment({ ...newPayment, notes: v })} placeholder="Optional" rows={3} />
        </FieldRow>
        <div style={{ marginTop: '20px' }}>
          <button onClick={addPayment} disabled={saving || !newPayment.client_id || !newPayment.received_amount} style={{ width: '100%', padding: '10px', background: saving ? '#a78bfa' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Add Payment'}</button>
        </div>
      </SidePanel>
    </div>
  )
}
