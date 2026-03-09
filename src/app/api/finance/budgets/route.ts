import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance, canDeleteFinanceBudgets } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const entity = searchParams.get('entity')
  const supabase = createServiceSupabase()
  let q = supabase.from('finance_budgets').select('*, finance_expense_categories(name)').order('year', { ascending: false }).order('month')
  if (year) q = q.eq('year', parseInt(year, 10))
  if (entity) q = q.eq('entity', entity)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const { year, month, entity, category_id, category_name, budgeted_amount, currency, notes } = body
  if (!year || !entity || budgeted_amount == null) {
    return NextResponse.json({ error: 'year, entity, and budgeted_amount required' }, { status: 400 })
  }
  const supabase = createServiceSupabase()
  const payload = {
    year: parseInt(year, 10),
    month: month ? parseInt(month, 10) : null,
    entity: entity === 'India' ? 'India' : 'US',
    category_id: category_id || null,
    category_name: category_name || null,
    budgeted_amount: parseFloat(budgeted_amount),
    currency: currency || 'USD',
    notes: notes || null,
  }
  const { data, error } = await supabase.from('finance_budgets').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
