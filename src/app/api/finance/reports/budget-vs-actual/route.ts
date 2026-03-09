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
  const year = searchParams.get('year')
  const entity = searchParams.get('entity') || 'US'
  const supabase = createServiceSupabase()
  const yearNum = year ? parseInt(year, 10) : new Date().getFullYear()
  const { data: rows, error } = await supabase
    .from('v_budget_vs_actual')
    .select('*')
    .eq('year', yearNum)
    .eq('entity', entity)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byCategory: Record<string, { budget: number; actual: number }> = {}
  ;(rows ?? []).forEach((r: { category_name?: string | null; budgeted_amount?: unknown; actual_amount?: unknown }) => {
    const name = r.category_name || 'Uncategorized'
    if (!byCategory[name]) byCategory[name] = { budget: 0, actual: 0 }
    byCategory[name].budget += Number(r.budgeted_amount || 0)
    byCategory[name].actual += Number(r.actual_amount || 0)
  })
  const categories = Object.entries(byCategory).map(([category, v]) => {
    const variance = v.budget - v.actual
    const pctUsed = v.budget ? Math.round((v.actual / v.budget) * 1000) / 10 : 0
    return { category, budget: v.budget, actual: v.actual, variance, pctUsed }
  })
  const totalBudget = categories.reduce((s, c) => s + c.budget, 0)
  const totalActual = categories.reduce((s, c) => s + c.actual, 0)
  const totals = {
    budget: totalBudget,
    actual: totalActual,
    variance: totalBudget - totalActual,
    pctUsed: totalBudget ? Math.round((totalActual / totalBudget) * 1000) / 10 : 0,
  }
  return NextResponse.json({ year: yearNum, entity, categories, totals })
}
