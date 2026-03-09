import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance, canDeleteFinanceBudgets } from '@/lib/auth/permissions'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('finance_recurring_expenses').select('*, finance_expense_categories(id, name)').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(data)
}

const PATCH_KEYS = ['name', 'description', 'category_id', 'entity', 'amount', 'currency', 'frequency', 'day_of_month', 'vendor_name', 'start_date', 'end_date', 'active'] as const

export async function PATCH(req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of PATCH_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key]
  }
  if (payload.entity === 'India') payload.entity = 'India'
  else if (payload.entity === 'US') payload.entity = 'US'
  if (payload.day_of_month != null) payload.day_of_month = Math.min(28, Math.max(1, parseInt(String(payload.day_of_month), 10)))
  const { data, error } = await supabase.from('finance_recurring_expenses').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canDeleteFinanceBudgets(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { error } = await supabase.from('finance_recurring_expenses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
