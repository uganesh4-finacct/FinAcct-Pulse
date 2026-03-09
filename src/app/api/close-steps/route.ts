import { createServiceSupabase } from '@/lib/supabase-server'
import { type NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { id, status, completion_date, notes } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const fields: Record<string, unknown> = {}
  if (status != null && ['not_started', 'in_progress', 'complete', 'blocked', 'returned'].includes(status)) {
    fields.status = status
  }
  if (status === 'complete') {
    fields.completion_date = completion_date ?? new Date().toISOString().split('T')[0]
  }
  if (notes !== undefined) fields.notes = notes
  if (Object.keys(fields).length === 0) return NextResponse.json({ error: 'status or notes required' }, { status: 400 })
  const { error } = await supabase.from('close_steps').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { client_id, month_year, step_name, assigned_to, due_date } = body
  if (!client_id || !month_year || !step_name) {
    return NextResponse.json({ error: 'client_id, month_year, step_name required' }, { status: 400 })
  }

  let { data: closes } = await supabase.from('monthly_closes').select('id').eq('client_id', client_id).eq('month_year', month_year).limit(1)
  let monthly_close_id: string
  if (closes?.length) {
    monthly_close_id = closes[0].id
  } else {
    const deadline = new Date(month_year + '-01')
    deadline.setMonth(deadline.getMonth() + 1)
    deadline.setDate(25)
    const { data: inserted } = await supabase.from('monthly_closes').insert({
      client_id,
      month_year,
      deadline_date: deadline.toISOString().split('T')[0],
    }).select('id').single()
    if (!inserted?.id) return NextResponse.json({ error: 'Failed to create monthly close' }, { status: 500 })
    monthly_close_id = inserted.id
  }

  const { data: existing } = await supabase.from('close_steps').select('step_number').eq('client_id', client_id).eq('month_year', month_year).order('step_number', { ascending: false }).limit(1)
  const nextNum = existing?.length ? (existing[0].step_number ?? 0) + 1 : 1

  const { data: row, error } = await supabase.from('close_steps').insert({
    monthly_close_id,
    client_id,
    month_year,
    step_number: nextNum,
    step_name: String(step_name).slice(0, 100),
    assigned_owner_id: assigned_to || null,
    due_date: due_date || null,
    status: 'not_started',
    is_custom: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, row })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: step } = await supabase.from('close_steps').select('is_custom').eq('id', id).single()
  if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })
  if (!step.is_custom) return NextResponse.json({ error: 'Only custom steps can be deleted' }, { status: 400 })

  const { error } = await supabase.from('close_steps').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
