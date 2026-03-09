'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/finance-utils'
import { exportToCSV } from '@/lib/export-utils'
import { Button } from '@/components/ui/Button'
import { MonthPicker, currentMonth } from '@/components/MonthPicker'
import { TrendingUp, PiggyBank, Calendar, Receipt, Users, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

type ReportType = 'pl' | 'budget' | 'projections' | 'ar-aging' | 'client-annual'

const REPORT_CARDS: { id: ReportType; title: string; description: string; icon: React.ElementType }[] = [
  { id: 'pl', title: 'P&L', description: 'Profit & Loss by entity', icon: TrendingUp },
  { id: 'budget', title: 'Budget vs Actual', description: 'Variance analysis', icon: PiggyBank },
  { id: 'projections', title: 'Billing Projections', description: 'Next 12 months', icon: Calendar },
  { id: 'ar-aging', title: 'AR Aging', description: 'Aging buckets by client', icon: Receipt },
  { id: 'client-annual', title: 'Client Annual Summary', description: 'Billed, collected by client', icon: Users },
]

export default function FinanceReportsPage() {
  const [report, setReport] = useState<ReportType>('pl')
  const [plStart, setPlStart] = useState(currentMonth())
  const [plEnd, setPlEnd] = useState(currentMonth())
  const [plEntity, setPlEntity] = useState<'All' | 'US' | 'India'>('US')
  const [budgetYear, setBudgetYear] = useState(new Date().getFullYear())
  const [budgetEntity, setBudgetEntity] = useState<'US' | 'India'>('US')
  const [arAsOf, setArAsOf] = useState(new Date().toISOString().slice(0, 10))
  const [clientYear, setClientYear] = useState(new Date().getFullYear())
  const [clientVertical, setClientVertical] = useState('')
  const [plData, setPlData] = useState<any>(null)
  const [plDataIndia, setPlDataIndia] = useState<any>(null)
  const [budgetData, setBudgetData] = useState<any>(null)
  const [projectionsData, setProjectionsData] = useState<any>(null)
  const [arData, setArData] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (report !== 'pl') return
    setLoading(true)
    const fetchPl = (entity: string) =>
      fetch(`/api/finance/reports/pl?startMonth=${plStart}&endMonth=${plEnd}&entity=${entity}`).then(r => r.json())
    if (plEntity === 'All') {
      Promise.all([fetchPl('US'), fetchPl('India')]).then(([us, india]) => {
        setPlData(us)
        setPlDataIndia(india)
        setLoading(false)
      })
    } else {
      fetchPl(plEntity).then(data => {
        setPlData(data)
        setPlDataIndia(null)
        setLoading(false)
      })
    }
  }, [report, plStart, plEnd, plEntity])

  useEffect(() => {
    if (report !== 'budget') return
    setLoading(true)
    fetch(`/api/finance/reports/budget-vs-actual?year=${budgetYear}&entity=${budgetEntity}`)
      .then(r => r.json())
      .then(data => { setBudgetData(data); setLoading(false) })
  }, [report, budgetYear, budgetEntity])

  useEffect(() => {
    if (report !== 'projections') return
    setLoading(true)
    fetch('/api/finance/reports/projections').then(r => r.json()).then(data => { setProjectionsData(data); setLoading(false) })
  }, [report])

  useEffect(() => {
    if (report !== 'ar-aging') return
    setLoading(true)
    fetch(`/api/finance/reports/ar-aging?asOf=${arAsOf}`).then(r => r.json()).then(data => { setArData(data); setLoading(false) })
  }, [report, arAsOf])

  useEffect(() => {
    if (report !== 'client-annual') return
    setLoading(true)
    const params = new URLSearchParams({ year: String(clientYear) })
    if (clientVertical) params.set('vertical', clientVertical)
    fetch(`/api/finance/reports/client-annual?${params}`).then(r => r.json()).then(data => { setClientData(data); setLoading(false) })
  }, [report, clientYear, clientVertical])

  const handleExportCSV = () => {
    const date = new Date().toISOString().slice(0, 10)
    if (report === 'pl' && plData) {
      const data = plData.monthlyBreakdown || []
      exportToCSV(data, `finance-report-pl-${date}`, [
        { key: 'month', header: 'Month' },
        { key: 'revenue', header: 'Revenue' },
        { key: 'expenses', header: 'Expenses' },
        { key: 'net', header: 'Net' },
      ])
    } else if (report === 'budget' && budgetData) {
      const data = budgetData.categories || []
      exportToCSV(data, `finance-report-budget-${date}`, [
        { key: 'category', header: 'Category' },
        { key: 'budget', header: 'Budget' },
        { key: 'actual', header: 'Actual' },
        { key: 'variance', header: 'Variance' },
        { key: 'pctUsed', header: '% Used' },
      ])
    } else if (report === 'projections' && projectionsData) {
      const data = (projectionsData.clients || []).map((c: Record<string, unknown>) => ({
        client: c.client,
        annualTotal: c.annualTotal,
      }))
      exportToCSV(data, `finance-report-projections-${date}`, [
        { key: 'client', header: 'Client' },
        { key: 'annualTotal', header: 'Annual Total' },
      ])
    } else if (report === 'ar-aging' && arData) {
      exportToCSV(arData.clients || [], `finance-report-ar-aging-${date}`, [
        { key: 'client', header: 'Client' },
        { key: 'current', header: 'Current' },
        { key: 'days1_30', header: '1-30 Days' },
        { key: 'days31_60', header: '31-60 Days' },
        { key: 'days61_90', header: '61-90 Days' },
        { key: 'days90plus', header: '90+ Days' },
        { key: 'total', header: 'Total' },
      ])
    } else if (report === 'client-annual' && clientData) {
      const data = (clientData.clients || []).map((c: Record<string, unknown>) => ({
        client: c.client,
        totalBilled: c.totalBilled,
        totalCollected: c.totalCollected,
        outstanding: c.outstanding,
      }))
      exportToCSV(data, `finance-report-client-annual-${date}`, [
        { key: 'client', header: 'Client' },
        { key: 'totalBilled', header: 'Total Billed' },
        { key: 'totalCollected', header: 'Total Collected' },
        { key: 'outstanding', header: 'Outstanding' },
      ])
    }
  }

  const hasExportData =
    (report === 'pl' && plData) ||
    (report === 'budget' && budgetData) ||
    (report === 'projections' && projectionsData) ||
    (report === 'ar-aging' && arData) ||
    (report === 'client-annual' && clientData)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Financial Reports</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {REPORT_CARDS.map(r => {
          const Icon = r.icon
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setReport(r.id)}
              className={cn(
                'bg-white rounded-xl border p-6 text-left transition-colors',
                report === r.id ? 'border-violet-500 ring-2 ring-violet-200' : 'border-zinc-200 hover:border-violet-300 hover:bg-violet-50/30'
              )}
            >
              <Icon className="w-8 h-8 text-violet-500 mb-3" />
              <div className="font-semibold text-zinc-900">{r.title}</div>
              <div className="text-sm text-zinc-500 mt-1">{r.description}</div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {report === 'pl' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600">Start</span>
                <MonthPicker value={plStart} onChange={setPlStart} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600">End</span>
                <MonthPicker value={plEnd} onChange={setPlEnd} />
              </div>
              <select value={plEntity} onChange={e => setPlEntity(e.target.value as 'All' | 'US' | 'India')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="US">US</option>
                <option value="India">India</option>
                <option value="All">All</option>
              </select>
            </>
          )}
          {report === 'budget' && (
            <>
              <select value={budgetYear} onChange={e => setBudgetYear(parseInt(e.target.value, 10))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={budgetEntity} onChange={e => setBudgetEntity(e.target.value as 'US' | 'India')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="US">US</option>
                <option value="India">India</option>
              </select>
            </>
          )}
          {report === 'ar-aging' && (
            <input type="date" value={arAsOf} onChange={e => setArAsOf(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          )}
          {report === 'client-annual' && (
            <>
              <select value={clientYear} onChange={e => setClientYear(parseInt(e.target.value, 10))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={clientVertical} onChange={e => setClientVertical(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="">All verticals</option>
                <option value="restaurant">Restaurant</option>
                <option value="insurance">Insurance</option>
                <option value="property">Property</option>
                <option value="saas_ites">SaaS/ITeS</option>
              </select>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={!hasExportData}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        {loading && <p className="text-zinc-500 text-sm">Loading...</p>}

        {report === 'pl' && !loading && (
          <div className="space-y-6">
            {plEntity === 'All' ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-blue-600 mb-3">US Entity</h3>
                  {plData && <PLContent data={plData} />}
                </div>
                <div>
                  <h3 className="font-semibold text-violet-600 mb-3">India Entity</h3>
                  {plDataIndia && <PLContent data={plDataIndia} />}
                </div>
              </div>
            ) : (
              plData && <PLContent data={plData} showChart />
            )}
          </div>
        )}

        {report === 'budget' && !loading && budgetData && (
          <BudgetContent data={budgetData} />
        )}

        {report === 'projections' && !loading && projectionsData && (
          <ProjectionsContent data={projectionsData} />
        )}

        {report === 'ar-aging' && !loading && arData && (
          <ARAgingContent data={arData} />
        )}

        {report === 'client-annual' && !loading && clientData && (
          <ClientAnnualContent data={clientData} />
        )}

        {report && !loading && !plData && !budgetData && !projectionsData && !arData && !clientData && report !== 'pl' && (
          <p className="text-zinc-500 text-sm">No data for this report.</p>
        )}
        {report === 'pl' && !loading && !plData && plEntity !== 'All' && <p className="text-zinc-500 text-sm">No data.</p>}
      </div>
    </div>
  )
}

function PLContent({ data, showChart }: { data: any; showChart?: boolean }) {
  const r = data.revenue || {}
  const period = data.period || {}
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-zinc-500">Period</span><div className="font-medium">{period.start} – {period.end}</div></div>
        <div><span className="text-zinc-500">Invoiced</span><div className="font-medium">{formatCurrency(r.invoiced)}</div></div>
        <div><span className="text-zinc-500">Collected</span><div className="font-medium">{formatCurrency(r.collected)}</div></div>
        <div><span className="text-zinc-500">Outstanding</span><div className="font-medium">{formatCurrency(r.outstanding)}</div></div>
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-700 mb-2">Expenses by category</div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-200"><th className="text-left py-2">Category</th><th className="text-right py-2">Amount</th></tr></thead>
          <tbody>
            {(data.expenses || []).map((e: { category: string; amount: number }) => (
              <tr key={e.category} className="border-b border-zinc-100"><td className="py-2">{e.category}</td><td className="text-right py-2">{formatCurrency(e.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pt-2 border-t border-zinc-200 text-sm">
        <div className="flex justify-between"><span className="text-zinc-500">Total expenses</span><span className="font-semibold">{formatCurrency(data.totalExpenses)}</span></div>
        {data.entity === 'US' && <div className="flex justify-between mt-1"><span className="text-zinc-500">India TP Out</span><span className="font-semibold">{formatCurrency(data.indiaTpOut)}</span></div>}
        <div className="flex justify-between mt-1"><span className="text-zinc-500">Net income</span><span className={cn('font-semibold', data.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(data.netIncome)}</span></div>
      </div>
      {showChart && data.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthlyBreakdown.map((m: any) => ({ ...m, monthShort: m.month ? new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }) : '' }))}>
              <XAxis dataKey="monthShort" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={50} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v ?? 0)), '']} />
              <Bar dataKey="revenue" name="Revenue" fill="#7c3aed" />
              <Bar dataKey="expenses" name="Expenses" fill="#94a3b8" />
              <Bar dataKey="net" name="Net" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function BudgetContent({ data }: { data: any }) {
  const categories = data.categories || []
  const totals = data.totals || {}
  const chartData = categories.map((c: any) => ({ name: c.category, budget: c.budget, actual: c.actual }))
  return (
    <div className="space-y-6">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-zinc-200"><th className="text-left py-2">Category</th><th className="text-right py-2">Budget</th><th className="text-right py-2">Actual</th><th className="text-right py-2">Variance</th><th className="text-right py-2">% Used</th><th className="w-32">Progress</th></tr></thead>
        <tbody>
          {categories.map((c: any) => (
            <tr key={c.category} className="border-b border-zinc-100">
              <td className="py-2">{c.category}</td>
              <td className="text-right py-2">{formatCurrency(c.budget)}</td>
              <td className="text-right py-2">{formatCurrency(c.actual)}</td>
              <td className="text-right py-2">{formatCurrency(c.variance)}</td>
              <td className="text-right py-2">{c.pctUsed}%</td>
              <td className="py-2">
                <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', c.pctUsed > 100 ? 'bg-red-500' : c.pctUsed >= 80 ? 'bg-amber-500' : 'bg-emerald-500')}
                    style={{ width: `${Math.min(100, c.pctUsed)}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr className="border-t-2 border-zinc-200 font-semibold"><td className="py-2">Total</td><td className="text-right py-2">{formatCurrency(totals.budget)}</td><td className="text-right py-2">{formatCurrency(totals.actual)}</td><td className="text-right py-2">{formatCurrency(totals.variance)}</td><td className="text-right py-2">{totals.pctUsed}%</td><td /></tr></tfoot>
      </table>
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={50} tickFormatter={v => `$${v / 1000}K`} />
            <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v ?? 0)), '']} />
            <Bar dataKey="budget" name="Budget" fill="#7c3aed" />
            <Bar dataKey="actual" name="Actual" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function ProjectionsContent({ data }: { data: any }) {
  const clients = data.clients || []
  const labels = data.monthLabels || []
  const summary = data.summary || {}
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-violet-50 rounded-lg p-4"><div className="text-xl font-bold text-zinc-900">{formatCurrency(summary.totalAnnualProjected)}</div><div className="text-sm text-zinc-500">Total Annual Projected</div></div>
        <div className="bg-zinc-50 rounded-lg p-4"><div className="text-xl font-bold text-zinc-900">{formatCurrency(summary.averageMonthly)}</div><div className="text-sm text-zinc-500">Average Monthly</div></div>
        <div className="bg-zinc-50 rounded-lg p-4"><div className="text-xl font-bold text-zinc-900">{summary.activeClients ?? 0}</div><div className="text-sm text-zinc-500">Active Clients</div></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-200"><th className="text-left py-2">Client</th>{labels.slice(0, 12).map((m: string, i: number) => <th key={m} className="text-right py-2">{i === 0 ? 'Current' : `+${i}`}</th>)}<th className="text-right py-2">Annual Total</th></tr></thead>
          <tbody>
            {clients.map((c: Record<string, unknown>, idx: number) => (
              <tr key={idx} className="border-b border-zinc-100">
                <td className="py-2 font-medium">{String(c.client)}</td>
                {labels.slice(0, 12).map((_: string, i: number) => <td key={i} className="text-right py-2">{formatCurrency((c as any)[`month_${i}`])}</td>)}
                <td className="text-right py-2 font-medium">{formatCurrency(Number(c.annualTotal ?? 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ARAgingContent({ data }: { data: any }) {
  const clients = data.clients || []
  const summary = data.summary || {}
  const overdue = (summary.days1_30 || 0) + (summary.days31_60 || 0) + (summary.days61_90 || 0) + (summary.days90plus || 0)
  const pieData = [
    { name: 'Current', value: summary.current || 0, color: '#22c55e' },
    { name: '1-30', value: summary.days1_30 || 0, color: '#3b82f6' },
    { name: '31-60', value: summary.days31_60 || 0, color: '#f59e0b' },
    { name: '61-90', value: summary.days61_90 || 0, color: '#f97316' },
    { name: '90+', value: summary.days90plus || 0, color: '#ef4444' },
  ].filter(d => d.value > 0)
  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">As of {data.asOf}</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-50 rounded-lg p-4"><div className="text-xl font-bold text-zinc-900">{formatCurrency(summary.total)}</div><div className="text-sm text-zinc-500">Total Outstanding</div></div>
        <div className="bg-amber-50 rounded-lg p-4"><div className="text-xl font-bold text-amber-800">{formatCurrency(overdue)}</div><div className="text-sm text-zinc-500">Overdue Amount</div></div>
        <div className="bg-zinc-50 rounded-lg p-4"><div className="text-xl font-bold text-zinc-900">{data.avgDaysOutstanding ?? 0}</div><div className="text-sm text-zinc-500">Avg Days Outstanding</div></div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-200"><th className="text-left py-2">Client</th><th className="text-right py-2 text-emerald-600">Current</th><th className="text-right py-2 text-blue-600">1-30</th><th className="text-right py-2 text-amber-600">31-60</th><th className="text-right py-2 text-orange-600">61-90</th><th className="text-right py-2 text-red-600">90+</th><th className="text-right py-2">Total</th></tr></thead>
            <tbody>
              {clients.map((c: any, idx: number) => (
                <tr key={idx} className="border-b border-zinc-100">
                  <td className="py-2 font-medium">{c.client}</td>
                  <td className="text-right py-2 text-emerald-600">{formatCurrency(c.current)}</td>
                  <td className="text-right py-2 text-blue-600">{formatCurrency(c.days1_30)}</td>
                  <td className="text-right py-2 text-amber-600">{formatCurrency(c.days31_60)}</td>
                  <td className="text-right py-2 text-orange-600">{formatCurrency(c.days61_90)}</td>
                  <td className="text-right py-2 text-red-600">{formatCurrency(c.days90plus)}</td>
                  <td className="text-right py-2 font-medium">{formatCurrency(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pieData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => value ? `${name}: ${formatCurrency(value)}` : ''}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v ?? 0))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function ClientAnnualContent({ data }: { data: any }) {
  const clients = data.clients || []
  const summary = data.summary || {}
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-violet-50 rounded-lg p-4"><div className="text-xl font-bold text-zinc-900">{formatCurrency(summary.totalBilled)}</div><div className="text-sm text-zinc-500">Total Billed</div></div>
        <div className="bg-zinc-50 rounded-lg p-4"><div className="text-xl font-bold text-zinc-900">{formatCurrency(summary.totalCollected)}</div><div className="text-sm text-zinc-500">Total Collected</div></div>
        <div className="bg-zinc-50 rounded-lg p-4"><div className="text-xl font-bold text-zinc-900">{summary.collectionRate ?? 0}%</div><div className="text-sm text-zinc-500">Collection Rate</div></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-200"><th className="text-left py-2">Client</th><th className="text-left py-2">Vertical</th>{months.map(m => <th key={m} className="text-right py-2">{m}</th>)}<th className="text-right py-2">Total Billed</th><th className="text-right py-2">Total Collected</th><th className="text-right py-2">Outstanding</th></tr></thead>
          <tbody>
            {clients.map((c: any, idx: number) => (
              <tr key={idx} className="border-b border-zinc-100">
                <td className="py-2 font-medium">{c.client}</td>
                <td className="py-2">{c.vertical || '—'}</td>
                {months.map((_, i) => <td key={i} className="text-right py-2">{formatCurrency((c as any)[`month_${i}`])}</td>)}
                <td className="text-right py-2">{formatCurrency(c.totalBilled)}</td>
                <td className="text-right py-2">{formatCurrency(c.totalCollected)}</td>
                <td className="text-right py-2">{formatCurrency(c.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
