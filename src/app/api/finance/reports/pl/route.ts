import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const entity = searchParams.get('entity') || 'US'
  const startMonth = searchParams.get('startMonth')
  const endMonth = searchParams.get('endMonth')
  const supabase = createServiceSupabase()

  const viewName = entity === 'India' ? 'v_india_entity_pl' : 'v_us_entity_pl'
  let q = supabase.from(viewName).select('*').order('month_str')
  if (startMonth) q = q.gte('month_str', startMonth)
  if (endMonth) q = q.lte('month_str', endMonth)
  const { data: plRows, error: plError } = await q
  if (plError) return NextResponse.json({ error: plError.message }, { status: 500 })

  const months = (plRows ?? []).map((r: { month_str: string }) => r.month_str)
  const start = startMonth || months[0] || ''
  const end = endMonth || months[months.length - 1] || ''

  if (entity === 'India') {
    const indiaRows = plRows ?? []
    const revenue = indiaRows.reduce((s: number, r: { revenue_tp_in?: unknown }) => s + Number(r.revenue_tp_in || 0), 0)
    const { data: expRows } = await supabase.from('finance_expenses').select('amount, amount_usd, currency, category_id, expense_month').in('expense_month', months.length ? months : [start]).eq('entity', 'India').neq('status', 'cancelled')
    const { data: categories } = await supabase.from('finance_expense_categories').select('id, name')
    const catMap = new Map<string, string>((categories ?? []).map((c: { id: string; name: string }) => [c.id, c.name]))
    const byCat: Record<string, number> = {}
    ;(expRows ?? []).forEach((e: { category_id?: string | null; amount?: unknown; amount_usd?: unknown; currency?: string }) => {
      const amt = e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)
      const name = (e.category_id ? catMap.get(e.category_id) : undefined) ?? 'Other'
      byCat[name] = (byCat[name] || 0) + amt
    })
    const totalExpenses = Object.values(byCat).reduce((a, b) => a + b, 0)
    const expenses = Object.entries(byCat).map(([category, amount]) => ({ category, amount }))
    const monthlyBreakdown = indiaRows.map((r: { month_str: string; revenue_tp_in?: unknown }) => ({
      month: r.month_str,
      revenue: Number(r.revenue_tp_in || 0),
      expenses: 0,
      net: Number(r.revenue_tp_in || 0),
    }))
    return NextResponse.json({
      entity: 'India',
      period: { start, end },
      revenue: { invoiced: revenue, collected: revenue, outstanding: 0 },
      expenses,
      totalExpenses,
      indiaTpOut: 0,
      netIncome: revenue - totalExpenses,
      monthlyBreakdown,
    })
  }

  const usRows = plRows ?? []
  const invoiced = usRows.reduce((s: number, r: { revenue?: unknown }) => s + Number(r.revenue || 0), 0)
  const collected = usRows.reduce((s: number, r: { collected?: unknown }) => s + Number(r.collected || 0), 0)
  const outstanding = usRows.reduce((s: number, r: { ar_outstanding?: unknown }) => s + Number(r.ar_outstanding || 0), 0)
  const indiaTpOut = usRows.reduce((s: number, r: { india_tp_out?: unknown }) => s + Number(r.india_tp_out || 0), 0)

  const { data: expRows } = await supabase.from('finance_expenses').select('amount, amount_usd, currency, category_id, expense_month').in('expense_month', months.length ? months : [start]).eq('entity', 'US').neq('status', 'cancelled')
  const { data: categories } = await supabase.from('finance_expense_categories').select('id, name')
  const catMap = new Map<string, string>((categories ?? []).map((c: { id: string; name: string }) => [c.id, c.name]))
  const byCat: Record<string, number> = {}
  const usExpByMonth: Record<string, number> = {}
  ;(expRows ?? []).forEach((e: { category_id?: string | null; amount?: unknown; amount_usd?: unknown; currency?: string; expense_month?: string }) => {
    const amt = e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)
    const name = (e.category_id ? catMap.get(e.category_id) : undefined) ?? 'Other'
    byCat[name] = (byCat[name] || 0) + amt
    const m = e.expense_month
    if (m) usExpByMonth[m] = (usExpByMonth[m] || 0) + amt
  })
  const totalExpenses = Object.values(byCat).reduce((a, b) => a + b, 0)
  const expenses = Object.entries(byCat).map(([category, amount]) => ({ category, amount }))

  const monthlyBreakdown = usRows.map((r: { month_str: string; revenue?: unknown; india_tp_out?: unknown }) => {
    const rev = Number(r.revenue || 0)
    const tp = Number(r.india_tp_out || 0)
    const exp = usExpByMonth[r.month_str] ?? 0
    return { month: r.month_str, revenue: rev, expenses: exp, net: rev - exp - tp }
  })

  return NextResponse.json({
    entity: 'US',
    period: { start, end },
    revenue: { invoiced, collected, outstanding },
    expenses,
    totalExpenses,
    indiaTpOut,
    netIncome: invoiced - totalExpenses - indiaTpOut,
    monthlyBreakdown,
  })
}
