import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const entity = searchParams.get('entity')
  const categoryId = searchParams.get('categoryId')
  const status = searchParams.get('status')
  const supabase = createServiceSupabase()
  let q = supabase
    .from('finance_expenses')
    .select('*, finance_expense_categories(id, name)')
    .order('expense_date', { ascending: false })
  if (month) q = q.eq('expense_month', month)
  if (entity) q = q.eq('entity', entity)
  if (categoryId) q = q.eq('category_id', categoryId)
  if (status) q = q.eq('status', status)
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
  const {
    name,
    description,
    category_id,
    entity,
    expense_date,
    amount,
    currency,
    amount_usd,
    vendor_name,
    status,
    payment_method,
    payment_reference,
    notes,
  } = body
  if (!name || amount == null) {
    return NextResponse.json({ error: 'name and amount required' }, { status: 400 })
  }
  const d = expense_date ? new Date(expense_date) : new Date()
  const expense_month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const supabase = createServiceSupabase()
  const payload = {
    name,
    description: description || null,
    category_id: category_id || null,
    entity: entity === 'India' ? 'India' : 'US',
    expense_date: d.toISOString().split('T')[0],
    expense_month,
    amount: parseFloat(amount),
    currency: currency || 'USD',
    amount_usd: amount_usd != null ? parseFloat(amount_usd) : (currency === 'INR' ? parseFloat(amount_usd) : parseFloat(amount)),
    vendor_name: vendor_name || null,
    status: status || 'pending',
    payment_method: payment_method || null,
    payment_reference: payment_reference || null,
    notes: notes || null,
  }
  const { data, error } = await supabase.from('finance_expenses').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
