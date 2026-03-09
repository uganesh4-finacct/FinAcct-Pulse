import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthStart = `${monthStr}-01`
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`

  const { data: invoices } = await supabase
    .from('client_invoices')
    .select('id, client_id, invoice_month, invoiced_amount, paid_amount, payment_status, india_tp_status, india_tp_amount')
    .gte('invoice_month', monthStart)
    .lt('invoice_month', nextMonthStr)
  const list = invoices ?? []
  type InvoiceRow = { invoiced_amount?: unknown; paid_amount?: unknown; payment_status?: string; india_tp_status?: string; india_tp_amount?: unknown }
  const totalRevenueMtd = (list as InvoiceRow[]).reduce((s: number, i) => s + Number(i.invoiced_amount || 0), 0)
  const collectedMtd = (list as InvoiceRow[]).reduce((s: number, i) => s + Number(i.paid_amount || 0), 0)
  const outstandingAr = (list as InvoiceRow[])
    .filter(i => i.payment_status !== 'paid' && i.payment_status !== 'waived')
    .reduce((s: number, i) => s + (Number(i.invoiced_amount || 0) - Number(i.paid_amount || 0)), 0)
  const indiaTpPending = (list as InvoiceRow[])
    .filter(i => i.india_tp_status === 'pending')
    .reduce((s: number, i) => s + Number(i.india_tp_amount ?? (Number(i.invoiced_amount || 0) * 0.9)), 0)

  const { data: expenses } = await supabase
    .from('finance_expenses')
    .select('amount, amount_usd, currency, entity')
    .eq('expense_month', monthStr)
    .neq('status', 'cancelled')
  type ExpenseRow = { amount?: unknown; amount_usd?: unknown; currency?: string; entity?: string }
  const expensesMtd = ((expenses ?? []) as ExpenseRow[]).reduce((s: number, e) => s + (e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)), 0)

  const usRevenue = (list as InvoiceRow[]).reduce((s: number, i) => s + Number(i.invoiced_amount || 0), 0)
  const usTpOut = (list as InvoiceRow[]).reduce((s: number, i) => s + Number(i.india_tp_amount || 0), 0)
  const usExpenses = ((expenses ?? []) as ExpenseRow[]).filter(e => e.entity === 'US').reduce((s: number, e) => s + (e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)), 0)
  const indiaRevenue = (list as InvoiceRow[]).filter(i => i.india_tp_status === 'transferred').reduce((s: number, i) => s + Number(i.india_tp_amount || 0), 0)
  const indiaExpenses = ((expenses ?? []) as ExpenseRow[]).filter(e => e.entity === 'India').reduce((s: number, e) => s + (e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)), 0)

  const netIncomeMtd = totalRevenueMtd - expensesMtd - usTpOut

  const { data: overdueInvoices } = await supabase
    .from('client_invoices')
    .select('id, client_id, invoiced_amount, paid_amount, due_date, payment_status')
    .neq('payment_status', 'paid')
  const overdue = ((overdueInvoices ?? []) as Array<{ due_date?: string | null }>).filter(i => {
    if (!i.due_date) return false
    const days = Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000)
    return days > 20
  })
  const { count: pendingExpenses } = await supabase.from('finance_expenses').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('expense_month', monthStr)
  const pendingTp = (list as InvoiceRow[]).filter(i => i.india_tp_status === 'pending').length

  const last6Months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const { data: usPlHistory } = await supabase.from('v_us_entity_pl').select('month_str, revenue, india_tp_out').in('month_str', last6Months).order('month_str')
  const { data: indiaPlHistory } = await supabase.from('v_india_entity_pl').select('month_str, revenue_tp_in').in('month_str', last6Months).order('month_str')
  const { data: expensesByMonth } = await supabase.from('finance_expenses').select('expense_month, amount, amount_usd, currency, entity').in('expense_month', last6Months).neq('status', 'cancelled')
  const usExpByMonth: Record<string, number> = {}
  const indiaExpByMonth: Record<string, number> = {}
  last6Months.forEach(m => { usExpByMonth[m] = 0; indiaExpByMonth[m] = 0 })
  type ExpenseMonthRow = { expense_month?: string; amount?: unknown; amount_usd?: unknown; currency?: string; entity?: string }
  ;((expensesByMonth ?? []) as ExpenseMonthRow[]).forEach(e => {
    const amt = e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)
    const month = e.expense_month
    if (!month) return
    if (e.entity === 'US') usExpByMonth[month] = (usExpByMonth[month] ?? 0) + amt
    else indiaExpByMonth[month] = (indiaExpByMonth[month] ?? 0) + amt
  })
  const indiaRevByMonth: Record<string, number> = {}
  last6Months.forEach(m => { indiaRevByMonth[m] = 0 })
  ;(indiaPlHistory ?? []).forEach((r: { month_str: string; revenue_tp_in?: unknown }) => {
    if (r.month_str) indiaRevByMonth[r.month_str] = Number(r.revenue_tp_in || 0)
  })

  return NextResponse.json({
    kpis: {
      total_revenue_mtd: totalRevenueMtd,
      collected_mtd: collectedMtd,
      outstanding_ar: outstandingAr,
      expenses_mtd: expensesMtd,
      india_tp_pending: indiaTpPending,
      net_income_mtd: netIncomeMtd,
    },
    us_entity: {
      revenue: usRevenue,
      expenses: usExpenses,
      india_tp_out: usTpOut,
      net_income: usRevenue - usExpenses - usTpOut,
    },
    india_entity: {
      revenue: indiaRevenue,
      expenses: indiaExpenses,
      net_income: indiaRevenue - indiaExpenses,
    },
    alerts: {
      overdue_invoices: overdue.length,
      overdue_list: overdue.slice(0, 10),
      pending_expense_confirmations: pendingExpenses ?? 0,
      pending_tp_transfers: pendingTp,
      budget_overruns: 0,
    },
    chart_us: last6Months.map(m => {
      const row = (usPlHistory ?? []).find((r: { month_str: string }) => r.month_str === m)
      const rev = row ? Number(row.revenue) : 0
      const tp = row ? Number(row.india_tp_out || 0) : 0
      const exp = usExpByMonth[m] ?? 0
      return { month: m, revenue: rev, expenses: exp, india_tp_out: tp, net_income: rev - exp - tp }
    }),
    chart_india: last6Months.map(m => {
      const rev = indiaRevByMonth[m] ?? 0
      const exp = indiaExpByMonth[m] ?? 0
      return { month: m, revenue: rev, expenses: exp, net_income: rev - exp }
    }),
  })
}
