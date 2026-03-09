'use client'

import { useState, useEffect } from 'react'
import { MonthPicker, currentMonth } from '@/components/MonthPicker'
import { formatCurrency } from '@/lib/finance-utils'
import { Button } from '@/components/ui/Button'

export default function FinanceIndiaTPPage() {
  const [month, setMonth] = useState(currentMonth())
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/finance/invoices?month=${month}`).then(r => r.json()).then(data => {
      setInvoices(data ?? [])
    })
  }, [month])

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
                <td className="px-4 py-3">{i.india_tp_status === 'pending' ? <Button size="sm" variant="ghost">Mark Transferred</Button> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
