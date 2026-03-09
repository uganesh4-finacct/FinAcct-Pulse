import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(name, vertical, payment_method)')
    .order('month_year', { ascending: false })
  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { id, action, amount } = body
  if (id == null) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (action === 'mark_paid') {
    const { error } = await supabase
      .from('invoices')
      .update({
        payment_status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        outstanding_days: 0,
        aging_flag: 'green'
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (action === 'update_amount') {
    const { error } = await supabase
      .from('invoices')
      .update({
        amount: amount,
        tp_transfer_amount: Math.round(amount * 0.9 * 100) / 100
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (action === 'update_fields') {
    const updates: any = {}
    if (amount !== undefined) {
      updates.amount = parseFloat(amount)
      updates.tp_transfer_amount = Math.round(parseFloat(amount) * 0.9 * 100) / 100
    }
    if (body.due_date)        updates.due_date = body.due_date
    if (body.paid_date)       updates.paid_date = body.paid_date
    if (body.payment_status)  updates.payment_status = body.payment_status
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.payment_status === 'paid') {
      updates.outstanding_days = 0
      updates.aging_flag = 'green'
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ success: true })
    const { error } = await supabase.from('invoices').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (action && !['mark_paid', 'update_amount', 'update_fields'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { client_id, amount, month_year, due_date, payment_status } = body
  if (!client_id || amount == null) {
    return NextResponse.json({ error: 'client_id and amount required' }, { status: 400 })
  }
  const amt = typeof amount === 'number' ? amount : parseFloat(amount)
  const tp_transfer_amount = Math.round(amt * 0.9 * 100) / 100
  const payload: Record<string, unknown> = {
    client_id,
    amount: amt,
    tp_transfer_amount,
    month_year: month_year || new Date().toISOString().slice(0, 7),
    due_date: due_date || null,
    payment_status: payment_status || 'unpaid',
  }
  const { data, error } = await supabase.from('invoices').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
