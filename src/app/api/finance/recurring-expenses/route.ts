import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('finance_recurring_expenses')
    .select('*, finance_expense_categories(id, name)')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const {
    name,
    description,
    category_id,
    entity,
    amount,
    currency,
    frequency,
    day_of_month,
    vendor_name,
    start_date,
    end_date,
    active,
  } = body
  if (!name?.trim() || amount == null) {
    return NextResponse.json({ error: 'name and amount required' }, { status: 400 })
  }
  const supabase = createServiceSupabase()
  const payload = {
    name: String(name).trim(),
    description: description || null,
    category_id: category_id || null,
    entity: entity === 'India' ? 'India' : 'US',
    amount: parseFloat(amount),
    currency: currency || 'USD',
    frequency: frequency || 'Monthly',
    day_of_month: day_of_month != null ? Math.min(28, Math.max(1, parseInt(day_of_month, 10))) : null,
    vendor_name: vendor_name || null,
    start_date: start_date || new Date().toISOString().split('T')[0],
    end_date: end_date || null,
    active: active !== false,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('finance_recurring_expenses').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
