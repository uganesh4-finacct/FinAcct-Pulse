'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/finance-utils'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { MonthPicker, currentMonth } from '@/components/MonthPicker'
import { Receipt, CreditCard, ArrowRightLeft, AlertTriangle, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function formatMonthShort(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, (m ?? 1) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short' })
}
function toK(n: number) {
  return n / 1000
}

type DashboardData = {
  kpis: {
    total_revenue_mtd: number
    collected_mtd: number
    outstanding_ar: number
    expenses_mtd: number
    india_tp_pending: number
    net_income_mtd: number
  }
  us_entity: { revenue: number; expenses: number; india_tp_out: number; net_income: number }
  india_entity: { revenue: number; expenses: number; net_income: number }
  alerts: {
    overdue_invoices: number
    overdue_list: Array<{ id: string; client_id: string; invoiced_amount: number; due_date: string }>
    pending_expense_confirmations: number
    pending_tp_transfers: number
    budget_overruns: number
  }
  chart_us: Array<{ month: string; revenue: number; expenses: number; india_tp_out: number; net_income: number }>
  chart_india: Array<{ month: string; revenue: number; expenses: number; net_income: number }>
}

export default function FinanceDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generateMonth, setGenerateMonth] = useState(currentMonth())
  const [generating, setGenerating] = useState(false)
  const [confirmMonthOpen, setConfirmMonthOpen] = useState(false)
  const [confirmNotes, setConfirmNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/finance/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const handleGenerateInvoices = async () => {
    setGenerating(true)
    try {
      const r = await fetch('/api/finance/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: `${generateMonth}-01` }),
      })
      const resData = await r.json().catch(() => ({}))
      if (!r.ok) {
        alert(resData.error || 'Failed to generate invoices')
        return
      }
      if (resData.created === 0) {
        alert(resData.message || 'No new invoices to generate')
        return
      }
      alert(`Generated ${resData.created} invoices for ${generateMonth}`)
      const d = await fetch('/api/finance/dashboard').then(r => r.json())
      setData(d)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateRecurring = async () => {
    const r = await fetch('/api/finance/expenses/generate', { method: 'POST' })
    if (r.ok) {
      const d = await fetch('/api/finance/dashboard').then(r => r.json())
      setData(d)
    } else {
      const err = await r.json().catch(() => ({}))
      alert(err.error || 'Failed to generate recurring expenses')
    }
  }

  const handleConfirmMonthEnd = async () => {
    setSaving(true)
    const month = new Date().toISOString().slice(0, 7)
    const r = await fetch('/api/finance/monthly-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, notes: confirmNotes }),
    })
    setSaving(false)
    if (r.ok) {
      setConfirmMonthOpen(false)
      setConfirmNotes('')
    } else {
      const err = await r.json().catch(() => ({}))
      alert(err.error || 'Failed to confirm')
    }
  }

  if (loading || !data) {
    return <div className="text-zinc-500 text-center py-12">Loading...</div>
  }

  const k = data.kpis
  const chartUsData = data.chart_us.map(c => ({
    month: formatMonthShort(c.month),
    revenue: toK(c.revenue),
    expenses: toK(c.expenses),
    indiaTpOut: toK(c.india_tp_out),
  }))
  const chartIndiaData = data.chart_india.map(c => ({
    month: formatMonthShort(c.month),
    tpReceived: toK(c.revenue),
    expenses: toK(c.expenses),
  }))

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Revenue MTD', value: k.total_revenue_mtd, icon: Receipt, color: 'border-violet-500' },
          { label: 'Collected MTD', value: k.collected_mtd, icon: CreditCard, color: 'border-emerald-500' },
          { label: 'Outstanding AR', value: k.outstanding_ar, color: 'border-amber-500' },
          { label: 'Expenses MTD', value: k.expenses_mtd, color: 'border-red-400' },
          { label: 'India TP Pending', value: k.india_tp_pending, icon: ArrowRightLeft, color: 'border-violet-400' },
          { label: 'Net Income MTD', value: k.net_income_mtd, color: k.net_income_mtd >= 0 ? 'border-emerald-600' : 'border-red-500' },
        ].map(card => (
          <div key={card.label} className={cn('bg-white rounded-xl border border-zinc-200 border-t-4 p-4', card.color)}>
            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(card.value)}</div>
            <div className="text-sm text-zinc-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column entity cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">US Entity</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-500">Revenue</span><div className="font-semibold text-zinc-900">{formatCurrency(data.us_entity.revenue)}</div></div>
            <div><span className="text-zinc-500">Expenses</span><div className="font-semibold text-zinc-900">{formatCurrency(data.us_entity.expenses)}</div></div>
            <div><span className="text-zinc-500">India TP Out</span><div className="font-semibold text-zinc-900">{formatCurrency(data.us_entity.india_tp_out)}</div></div>
            <div><span className="text-zinc-500">Net Income</span><div className={cn('font-semibold', data.us_entity.net_income >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(data.us_entity.net_income)}</div></div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-zinc-500 mb-2">Last 6 months</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartUsData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={40} tickFormatter={v => `$${v}K`} />
                <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? `$${v.toFixed(1)}K` : String(v ?? ''), '']} labelFormatter={l => l} />
                <Bar dataKey="revenue" name="Revenue" fill="#7c3aed" stackId="a" />
                <Bar dataKey="expenses" name="Expenses" fill="#94a3b8" stackId="a" />
                <Bar dataKey="indiaTpOut" name="India TP Out" fill="#60a5fa" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-4">India Entity</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-500">Revenue (TP In)</span><div className="font-semibold text-zinc-900">{formatCurrency(data.india_entity.revenue)}</div></div>
            <div><span className="text-zinc-500">Expenses</span><div className="font-semibold text-zinc-900">{formatCurrency(data.india_entity.expenses)}</div></div>
            <div><span className="text-zinc-500">Net Income</span><div className={cn('font-semibold', data.india_entity.net_income >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(data.india_entity.net_income)}</div></div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-zinc-500 mb-2">Last 6 months</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartIndiaData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={40} tickFormatter={v => `$${v}K`} />
                <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? `$${v.toFixed(1)}K` : String(v ?? ''), '']} labelFormatter={l => l} />
                <Bar dataKey="tpReceived" name="TP Received" fill="#7c3aed" />
                <Bar dataKey="expenses" name="Expenses" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-4">Alerts</h2>
        <ul className="space-y-2">
          {data.alerts.overdue_invoices > 0 && (
            <li className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{data.alerts.overdue_invoices} overdue invoice(s) (days &gt; 20)</span>
            </li>
          )}
          {data.alerts.pending_expense_confirmations > 0 && (
            <li className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{data.alerts.pending_expense_confirmations} pending expense confirmation(s)</span>
            </li>
          )}
          {data.alerts.pending_tp_transfers > 0 && (
            <li className="flex items-center gap-2 text-violet-600">
              <ArrowRightLeft className="w-4 h-4" />
              <span>{data.alerts.pending_tp_transfers} pending TP transfer(s)</span>
            </li>
          )}
          {data.alerts.budget_overruns > 0 && (
            <li className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Budget overruns</span>
            </li>
          )}
          {data.alerts.overdue_invoices === 0 && data.alerts.pending_expense_confirmations === 0 && data.alerts.pending_tp_transfers === 0 && data.alerts.budget_overruns === 0 && (
            <li className="text-zinc-500">No alerts</li>
          )}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <MonthPicker value={generateMonth} onChange={setGenerateMonth} />
          <Button onClick={handleGenerateInvoices} variant="primary" disabled={generating}>
            {generating ? 'Generating...' : 'Generate Invoices'}
          </Button>
        </div>
        <Button onClick={handleGenerateRecurring} variant="secondary">Generate Recurring Expenses</Button>
        <Button onClick={() => setConfirmMonthOpen(true)} variant="secondary">
          <FileCheck className="w-4 h-4 mr-1.5" /> Confirm Month-End
        </Button>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 items-center border-t border-zinc-200 pt-6 mt-6">
        <span className="text-sm text-zinc-500">Quick links:</span>
        <Link href="/finance/billing" className="inline-flex items-center justify-center font-medium rounded-lg h-8 px-3 text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">View Billing</Link>
        <Link href="/finance/expenses" className="inline-flex items-center justify-center font-medium rounded-lg h-8 px-3 text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">View Expenses</Link>
        <Link href="/finance/reports" className="inline-flex items-center justify-center font-medium rounded-lg h-8 px-3 text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">View Reports</Link>
      </div>

      {confirmMonthOpen && (
        <Modal onClose={() => setConfirmMonthOpen(false)} maxWidth="sm">
          <ModalHeader title="Confirm Month-End" onClose={() => setConfirmMonthOpen(false)} />
          <ModalBody>
            <p className="text-sm text-zinc-600 mb-4">Confirm financial close for the current month.</p>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Notes (optional)</label>
            <textarea value={confirmNotes} onChange={e => setConfirmNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Any notes..." />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setConfirmMonthOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmMonthEnd} disabled={saving}>{saving ? 'Saving...' : 'Confirm'}</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
