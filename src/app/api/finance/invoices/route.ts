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
  const clientId = searchParams.get('clientId')
  const status = searchParams.get('status')
  const vertical = searchParams.get('vertical')
  const supabase = createServiceSupabase()
  let q = supabase
    .from('client_invoices')
    .select('*, clients(id, name, vertical, monthly_fee)')
    .order('invoice_month', { ascending: false })
  if (month) {
    const start = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
    q = q.gte('invoice_month', start).lt('invoice_month', next)
  }
  if (clientId) q = q.eq('client_id', clientId)
  if (status) q = q.eq('payment_status', status)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  let list = data ?? []
  if (vertical) list = list.filter((i: { clients?: { vertical?: string } }) => i.clients?.vertical === vertical)
  const withDays = list.map((inv: Record<string, unknown> & { due_date?: string; paid_amount?: number; invoiced_amount?: number; payment_status?: string }) => {
    const outstanding = inv.payment_status === 'paid' || inv.payment_status === 'waived'
      ? 0
      : Number(inv.invoiced_amount || 0) - Number(inv.paid_amount || 0)
    const due = inv.due_date ? new Date(inv.due_date as string).getTime() : null
    const days = due && (inv.payment_status !== 'paid' && inv.payment_status !== 'waived')
      ? Math.floor((Date.now() - due) / 86400000)
      : null
    return { ...inv, outstanding_amount: outstanding, days_outstanding: days }
  })
  return NextResponse.json(withDays)
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const {
    client_id,
    invoice_month,
    base_amount,
    invoiced_amount,
    adjustment_reason,
    invoice_number,
    invoice_date,
    due_date,
    payment_status,
    paid_amount,
    paid_date,
    payment_method,
    payment_reference,
    india_tp_status,
    india_tp_date,
    notes,
  } = body
  if (!client_id || invoiced_amount == null) {
    return NextResponse.json({ error: 'client_id and invoiced_amount required' }, { status: 400 })
  }
  const monthFirst = invoice_month ? `${String(invoice_month).slice(0, 7)}-01` : new Date().toISOString().slice(0, 10)
  const amt = parseFloat(invoiced_amount)
  const supabase = createServiceSupabase()
  const payload = {
    client_id,
    invoice_month: monthFirst,
    base_amount: base_amount != null ? parseFloat(base_amount) : amt,
    invoiced_amount: amt,
    adjustment_reason: adjustment_reason || null,
    invoice_number: invoice_number || null,
    invoice_date: invoice_date || null,
    due_date: due_date || null,
    payment_status: payment_status || 'pending',
    paid_amount: paid_amount != null ? parseFloat(paid_amount) : 0,
    paid_date: paid_date || null,
    payment_method: payment_method || null,
    payment_reference: payment_reference || null,
    india_tp_status: india_tp_status || 'pending',
    india_tp_date: india_tp_date || null,
    notes: notes || null,
  }
  const { data, error } = await supabase.from('client_invoices').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
