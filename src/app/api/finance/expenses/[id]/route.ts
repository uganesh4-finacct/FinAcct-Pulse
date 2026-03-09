import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance, canDeleteFinanceBudgets } from '@/lib/auth/permissions'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()
  const allowed = ['name', 'description', 'category_id', 'entity', 'expense_date', 'amount', 'currency', 'amount_usd', 'vendor_name', 'status', 'payment_method', 'payment_reference', 'notes']
  const payload: Record<string, unknown> = {}
  allowed.forEach(k => { if (body[k] !== undefined) payload[k] = body[k] })
  if (payload.expense_date) {
    const d = new Date(payload.expense_date as string)
    payload.expense_month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  payload.updated_at = new Date().toISOString()
  const { data, error } = await supabase.from('finance_expenses').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { error } = await supabase.from('finance_expenses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
