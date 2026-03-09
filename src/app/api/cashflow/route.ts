import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceSupabase()
  const [paymentsRes, summaryRes, patternsRes, projectionRes] = await Promise.all([
    supabase.from('payment_history').select('*, clients(name, vertical)').order('received_date', { ascending: false }).order('updated_at', { ascending: false }),
    (async () => {
      const r = await supabase.from('v_cashflow_summary').select('*').single()
      return r.data ?? null
    })(),
    (async () => {
      const r = await supabase.from('v_collection_patterns').select('*')
      return r.data ?? []
    })(),
    (async () => {
      const r = await supabase.from('v_cashflow_projection').select('*')
      return r.data ?? []
    })(),
  ])
  if (paymentsRes.error) return NextResponse.json({ error: paymentsRes.error.message }, { status: 500 })
  return NextResponse.json({
    payments: paymentsRes.data ?? [],
    summary: summaryRes,
    patterns: patternsRes,
    projection: projectionRes,
  })
}

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { client_id, received_amount, received_date, notes, month_year } = body
  if (!client_id || received_amount == null) {
    return NextResponse.json({ error: 'client_id and received_amount (or amount) required' }, { status: 400 })
  }
  const amount = typeof received_amount === 'number' ? received_amount : parseFloat(received_amount)
  const payload: Record<string, unknown> = {
    client_id,
    received_amount: amount,
    received_date: received_date || new Date().toISOString().split('T')[0],
    notes: notes || null,
  }
  if (month_year) payload.month_year = month_year
  const { data, error } = await supabase.from('payment_history').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const allowed = ['received_amount', 'received_date', 'notes', 'month_year']
  const updates: Record<string, unknown> = {}
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, k)) updates[k] = fields[k]
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ success: true })
  const { error } = await supabase.from('payment_history').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
