import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('client_invoices').select('*, clients(id, name, vertical, monthly_fee)').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(data)
}

const PATCH_KEYS = [
  'invoice_month', 'base_amount', 'invoiced_amount', 'adjustment_reason', 'invoice_number',
  'invoice_date', 'due_date', 'payment_status', 'paid_amount', 'paid_date', 'payment_method',
  'payment_reference', 'india_tp_status', 'india_tp_date', 'notes',
] as const

export async function PATCH(req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()
  const payload: Record<string, unknown> = {}
  for (const key of PATCH_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key]
  }
  if (payload.invoice_month) payload.invoice_month = `${String(payload.invoice_month).slice(0, 7)}-01`
  if (payload.invoiced_amount != null && payload.india_tp_amount === undefined) {
    payload.india_tp_amount = Math.round(Number(payload.invoiced_amount) * 0.9 * 100) / 100
  }
  payload.updated_at = new Date().toISOString()
  const { data, error } = await supabase.from('client_invoices').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
