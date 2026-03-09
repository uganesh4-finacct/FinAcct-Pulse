'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MonthPicker, currentMonth } from '@/components/MonthPicker'
import { formatCurrency } from '@/lib/finance-utils'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { FieldRow, FieldInput, FieldSelect } from '@/components/FieldRow'
import { Receipt, Pencil, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'waived', label: 'Waived' },
]
const PAYMENT_METHOD_OPTIONS = [
  { value: 'qbo', label: 'QBO' },
  { value: 'ach', label: 'ACH' },
  { value: 'auto_ach', label: 'Auto ACH' },
  { value: 'check', label: 'Check' },
  { value: 'wire', label: 'Wire' },
  { value: 'other', label: 'Other' },
]

type InvoiceFormState = {
  client_id: string
  invoice_month: string
  base_amount: string
  invoiced_amount: string
  adjustment_reason: string
  invoice_number: string
  invoice_date: string
  due_date: string
  payment_status: string
  paid_amount: string
  paid_date: string
  payment_method: string
  payment_reference: string
  india_tp_status: string
  india_tp_date: string
  notes: string
}

type InvoiceRow = {
  id: string
  clients?: { name?: string; vertical?: string } | null
  invoice_number?: string | null
  invoice_date?: string | null
  due_date?: string | null
  invoiced_amount?: number
  paid_amount?: number
  outstanding_amount?: number
  days_outstanding?: number | null
  payment_status?: string
  india_tp_status?: string
}

const initialFormState: InvoiceFormState = {
  client_id: '',
  invoice_month: currentMonth() + '-01',
  base_amount: '',
  invoiced_amount: '',
  adjustment_reason: '',
  invoice_number: '',
  invoice_date: '',
  due_date: '',
  payment_status: 'pending',
  paid_amount: '',
  paid_date: '',
  payment_method: '',
  payment_reference: '',
  india_tp_status: 'pending',
  india_tp_date: '',
  notes: '',
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
    partial: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-100 text-red-800',
    waived: 'bg-zinc-100 text-zinc-700',
  }
  return <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', map[status] ?? 'bg-zinc-100')}>{status}</span>
}
function tpBadge(status: string) {
  if (status === 'transferred') return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Transferred</span>
  if (status === 'pending') return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800">Pending</span>
  return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600">N/A</span>
}

export default function FinanceBillingPage() {
  const [month, setMonth] = useState(currentMonth())
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [clients, setClients] = useState<Array<{ id: string; name: string; vertical: string; monthly_fee?: number }>>([])
  const [loading, setLoading] = useState(true)
  const [filterClient, setFilterClient] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterVertical, setFilterVertical] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [markPaidId, setMarkPaidId] = useState<string | null>(null)
  const [markPaidForm, setMarkPaidForm] = useState({ paid_amount: '', paid_date: new Date().toISOString().split('T')[0], payment_method: 'ach', payment_reference: '' })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<InvoiceFormState>(initialFormState)

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('month', month)
    if (filterClient) params.set('clientId', filterClient)
    if (filterStatus) params.set('status', filterStatus)
    if (filterVertical) params.set('vertical', filterVertical)
    fetch(`/api/finance/invoices?${params}`)
      .then(r => r.json())
      .then((data: unknown) => setInvoices(Array.isArray(data) ? (data as InvoiceRow[]) : []))
      .finally(() => setLoading(false))
  }, [month, filterClient, filterStatus, filterVertical])
  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then((d: Array<{ id: string; name: string; vertical: string; monthly_fee?: number }> | { clients?: Array<{ id: string; name: string; vertical: string; monthly_fee?: number }> }) => setClients(Array.isArray(d) ? d : d.clients ?? []))
  }, [])

  const filtered = invoices
  const totalBilled = filtered.reduce((s: number, i: InvoiceRow) => s + Number(i.invoiced_amount || 0), 0)
  const totalCollected = filtered.reduce((s: number, i: InvoiceRow) => s + Number(i.paid_amount || 0), 0)
  const totalOutstanding = filtered
    .filter((i: InvoiceRow) => i.payment_status !== 'paid' && i.payment_status !== 'waived')
    .reduce((s: number, i: InvoiceRow) => s + Number(i.outstanding_amount ?? (Number(i.invoiced_amount) - Number(i.paid_amount || 0))), 0)
  const overdueCount = filtered.filter((i: InvoiceRow) => (i.days_outstanding ?? 0) > 20).length

  const openAdd = () => {
    setForm({ ...initialFormState, invoice_month: month + '-01' })
    setAddOpen(true)
  }

  const handleCreate = async () => {
    if (!form.client_id || !form.invoiced_amount) {
      alert('Client and invoiced amount required')
      return
    }
    setSaving(true)
    const r = await fetch('/api/finance/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, base_amount: form.base_amount || form.invoiced_amount }),
    })
    setSaving(false)
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Failed')
      return
    }
    setAddOpen(false)
    setMonth(month)
    fetch(`/api/finance/invoices?month=${month}`).then(r => r.json()).then((data: unknown) => setInvoices(Array.isArray(data) ? (data as InvoiceRow[]) : []))
  }

  const handleMarkPaid = async () => {
    if (!markPaidId) return
    setSaving(true)
    const r = await fetch(`/api/finance/invoices/${markPaidId}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markPaidForm),
    })
    setSaving(false)
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Failed')
      return
    }
    setMarkPaidId(null)
    fetch(`/api/finance/invoices?month=${month}`).then(r => r.json()).then((data: unknown) => setInvoices(Array.isArray(data) ? (data as InvoiceRow[]) : []))
  }

  const verticals = Array.from(new Set(clients.map(c => c.vertical)))

  if (loading) return <div className="text-zinc-500 py-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-zinc-900">Client Billing</h2>
        <Button onClick={openAdd} size="sm"><Receipt className="w-4 h-4 mr-1.5" /> Add Invoice</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Billed', value: formatCurrency(totalBilled) },
          { label: 'Collected', value: formatCurrency(totalCollected) },
          { label: 'Outstanding', value: formatCurrency(totalOutstanding) },
          { label: 'Overdue (>20d)', value: overdueCount },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="text-xl font-bold text-zinc-900">{c.value}</div>
            <div className="text-sm text-zinc-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <MonthPicker value={month} onChange={setMonth} />
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="">All clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          {PAYMENT_STATUS_OPTIONS.map(o => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterVertical} onChange={e => setFilterVertical(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="">All verticals</option>
          {verticals.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Client</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Vertical</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Invoice #</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Invoice Date</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Due Date</th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-700">Amount</th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-700">Paid</th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-700">Outstanding</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-700">Days</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">TP Status</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-zinc-500">No invoices. Add an invoice or generate monthly invoices from Dashboard.</td></tr>
            )}
            {filtered.map(inv => (
              <tr
                key={inv.id}
                onClick={() => setDetailId(inv.id)}
                className={cn(
                  'border-b border-zinc-100 cursor-pointer hover:bg-violet-50/50',
                  inv.payment_status === 'pending' && 'bg-amber-50/50'
                )}
              >
                <td className="px-4 py-3 font-medium text-zinc-900">{inv.clients?.name ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-600">{inv.clients?.vertical ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-600">{inv.invoice_number ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-600">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-zinc-600">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(inv.invoiced_amount)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(inv.paid_amount)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(inv.outstanding_amount ?? (Number(inv.invoiced_amount) - Number(inv.paid_amount || 0)))}</td>
                <td className="px-4 py-3 text-center">{inv.days_outstanding != null ? inv.days_outstanding : '—'}</td>
                <td className="px-4 py-3">{statusBadge(inv.payment_status ?? '')}</td>
                <td className="px-4 py-3">{tpBadge(inv.india_tp_status ?? '')}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {inv.payment_status !== 'paid' && (
                    <Button variant="ghost" size="sm" onClick={() => { setMarkPaidId(inv.id); setMarkPaidForm({ paid_amount: String(inv.outstanding_amount ?? (Number(inv.invoiced_amount) - Number(inv.paid_amount || 0))), paid_date: new Date().toISOString().split('T')[0], payment_method: 'ach', payment_reference: '' }); }}>Mark Paid</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} maxWidth="lg">
          <ModalHeader title="Add Invoice" onClose={() => setAddOpen(false)} />
          <ModalBody>
            <FieldRow label="Client" required>
              <FieldSelect
                value={form.client_id}
                onChange={v => {
                  const c = clients.find(x => x.id === v)
                  setForm((f: InvoiceFormState) => ({
                    ...f,
                    client_id: v,
                    base_amount: c?.monthly_fee != null ? String(c.monthly_fee) : f.base_amount,
                    invoiced_amount: c?.monthly_fee != null ? String(c.monthly_fee) : f.invoiced_amount,
                  }))
                }}
                options={[{ value: '', label: '—' }, ...clients.map(c => ({ value: c.id, label: c.name }))]}
              />
            </FieldRow>
            <FieldRow label="Invoice Month"><FieldInput type="month" value={form.invoice_month?.slice(0, 7)} onChange={v => setForm((f: InvoiceFormState) => ({ ...f, invoice_month: v + '-01' }))} /></FieldRow>
            <FieldRow label="Base Amount"><FieldInput type="number" value={form.base_amount} onChange={v => setForm((f: InvoiceFormState) => ({ ...f, base_amount: v, invoiced_amount: v || f.invoiced_amount }))} /></FieldRow>
            <FieldRow label="Invoiced Amount" required><FieldInput type="number" value={form.invoiced_amount} onChange={v => setForm((f: InvoiceFormState) => ({ ...f, invoiced_amount: v }))} /></FieldRow>
            <FieldRow label="Due Date"><FieldInput type="date" value={form.due_date} onChange={v => setForm((f: InvoiceFormState) => ({ ...f, due_date: v }))} /></FieldRow>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}

      {markPaidId && (
        <Modal onClose={() => setMarkPaidId(null)} maxWidth="sm">
          <ModalHeader title="Mark Paid" onClose={() => setMarkPaidId(null)} />
          <ModalBody>
            <FieldRow label="Paid Amount"><FieldInput type="number" value={markPaidForm.paid_amount} onChange={v => setMarkPaidForm((f: { paid_amount: string; paid_date: string; payment_method: string; payment_reference: string }) => ({ ...f, paid_amount: v }))} /></FieldRow>
            <FieldRow label="Paid Date"><FieldInput type="date" value={markPaidForm.paid_date} onChange={v => setMarkPaidForm((f: { paid_amount: string; paid_date: string; payment_method: string; payment_reference: string }) => ({ ...f, paid_date: v }))} /></FieldRow>
            <FieldRow label="Payment Method"><FieldSelect value={markPaidForm.payment_method} onChange={v => setMarkPaidForm((f: { paid_amount: string; paid_date: string; payment_method: string; payment_reference: string }) => ({ ...f, payment_method: v }))} options={PAYMENT_METHOD_OPTIONS} /></FieldRow>
            <FieldRow label="Reference"><FieldInput value={markPaidForm.payment_reference} onChange={v => setMarkPaidForm((f: { paid_amount: string; paid_date: string; payment_method: string; payment_reference: string }) => ({ ...f, payment_reference: v }))} /></FieldRow>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setMarkPaidId(null)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={saving}>{saving ? 'Saving...' : 'Confirm Payment'}</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
