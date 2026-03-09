'use client'

import { useState, useEffect } from 'react'
import { MonthPicker, currentMonth } from '@/components/MonthPicker'
import { formatCurrency } from '@/lib/finance-utils'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'

export default function FinanceIndiaTPPage() {
  const [month, setMonth] = useState(currentMonth())
  const [invoices, setInvoices] = useState<any[]>([])
  const [transferInvoice, setTransferInvoice] = useState<any | null>(null)
  const [transferForm, setTransferForm] = useState({ transfer_date: new Date().toISOString().split('T')[0], reference: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/finance/invoices?month=${month}`).then(r => r.json()).then(data => {
      setInvoices(data ?? [])
    })
  }, [month])

  const handleMarkTransferred = async () => {
    if (!transferInvoice?.id) return
    setSaving(true)
    try {
      const r = await fetch(`/api/finance/invoices/${transferInvoice.id}/mark-tp-transferred`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transfer_date: transferForm.transfer_date,
          reference: transferForm.reference || undefined,
          notes: transferForm.notes || transferForm.reference || undefined,
        }),
      })
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        alert(e.error || 'Failed')
        return
      }
      setTransferInvoice(null)
      setTransferForm({ transfer_date: new Date().toISOString().split('T')[0], reference: '', notes: '' })
      fetch(`/api/finance/invoices?month=${month}`).then(res => res.json()).then(data => setInvoices(data ?? []))
    } finally {
      setSaving(false)
    }
  }

  const pending = invoices.filter((i: any) => i.india_tp_status === 'pending')
  const transferred = invoices.filter((i: any) => i.india_tp_status === 'transferred')
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.invoiced_amount || 0), 0)
  const totalTP = pending.reduce((s, i) => s + Number(i.india_tp_amount ?? (i.invoiced_amount * 0.9)), 0) + transferred.reduce((s, i) => s + Number(i.india_tp_amount || 0), 0)
  const totalTransferred = transferred.reduce((s, i) => s + Number(i.india_tp_amount || 0), 0)
  const totalPending = pending.reduce((s, i) => s + Number(i.india_tp_amount ?? (i.invoiced_amount * 0.9)), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">India TP Transfers</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4"><div className="text-xl font-bold">{formatCurrency(totalTP)}</div><div className="text-sm text-zinc-500">Total TP This Month</div></div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4"><div className="text-xl font-bold">{formatCurrency(totalTransferred)}</div><div className="text-sm text-zinc-500">Transferred</div></div>
        <div className="bg-white rounded-xl border border-violet-200 p-4"><div className="text-xl font-bold">{formatCurrency(totalPending)}</div><div className="text-sm text-zinc-500">Pending</div></div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4"><div className="text-xl font-bold">90%</div><div className="text-sm text-zinc-500">Transfer Rate</div></div>
      </div>
      <MonthPicker value={month} onChange={setMonth} />
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-200 bg-zinc-50"><th className="px-4 py-3 text-left font-semibold">Client</th><th className="px-4 py-3 text-left font-semibold">Invoice Month</th><th className="px-4 py-3 text-right font-semibold">Invoice Amount</th><th className="px-4 py-3 text-right font-semibold">TP Amount (90%)</th><th className="px-4 py-3 text-left font-semibold">Status</th><th className="px-4 py-3 text-left font-semibold">Actions</th></tr></thead>
          <tbody>
            {invoices.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No invoices this month.</td></tr>}
            {invoices.map(i => (
              <tr key={i.id} className="border-b border-zinc-100">
                <td className="px-4 py-3 font-medium">{i.clients?.name ?? '—'}</td>
                <td className="px-4 py-3">{i.invoice_month?.slice(0, 7)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(i.invoiced_amount)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(i.india_tp_amount ?? Number(i.invoiced_amount) * 0.9)}</td>
                <td className="px-4 py-3"><span className={i.india_tp_status === 'transferred' ? 'text-emerald-600' : i.india_tp_status === 'pending' ? 'text-violet-600' : 'text-zinc-500'}>{i.india_tp_status === 'na' ? 'N/A' : i.india_tp_status}</span></td>
                <td className="px-4 py-3">{i.india_tp_status === 'pending' ? <Button size="sm" variant="ghost" onClick={() => { setTransferInvoice(i); setTransferForm({ transfer_date: new Date().toISOString().split('T')[0], reference: '', notes: '' }); }}>Mark Transferred</Button> : i.india_tp_date ? new Date(i.india_tp_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transferInvoice && (
        <Modal onClose={() => setTransferInvoice(null)} maxWidth="sm">
          <ModalHeader title="Mark TP Transferred" onClose={() => setTransferInvoice(null)} />
          <ModalBody>
            <p className="text-sm text-zinc-600 mb-4">
              {transferInvoice.clients?.name} — {formatCurrency(transferInvoice.india_tp_amount ?? Number(transferInvoice.invoiced_amount) * 0.9)} (90% of invoiced)
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Transfer Date</label>
                <input type="date" value={transferForm.transfer_date} onChange={e => setTransferForm(f => ({ ...f, transfer_date: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Reference number</label>
                <input type="text" value={transferForm.reference} onChange={e => setTransferForm(f => ({ ...f, reference: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                <textarea value={transferForm.notes} onChange={e => setTransferForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Optional" />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setTransferInvoice(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleMarkTransferred} disabled={saving}>{saving ? 'Saving...' : 'Confirm'}</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
