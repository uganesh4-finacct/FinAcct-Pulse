import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { sendTeamsAlert } from '@/lib/teams-webhook'

export async function GET() {
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('v_review_summary')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { title, period_type, start_date, end_date } = body

  const { data: period, error: periodError } = await supabase
    .from('review_periods')
    .insert({ title, period_type, start_date, end_date, status: 'active' })
    .select('id, title, end_date')
    .single()

  if (periodError || !period) return NextResponse.json({ error: periodError?.message ?? 'Failed to create period' }, { status: 500 })

  const { data: activeClients } = await supabase
    .from('clients')
    .select('id, assigned_owner_id')
    .eq('active', true)

  if (activeClients?.length) {
    const rows = activeClients
      .filter((c: any) => c.assigned_owner_id)
      .map((c: any) => ({
        review_period_id: period.id,
        client_id: c.id,
        assigned_to: c.assigned_owner_id,
      }))
    await supabase.from('client_updates').insert(rows)
  }

  const count = activeClients?.filter((c: any) => c.assigned_owner_id).length ?? 0
  await sendTeamsAlert({
    title: `New Review Period: ${title}`,
    message: `${count} client updates assigned. Due by ${end_date}`,
    urgency: 'medium',
  })

  return NextResponse.json({ success: true, id: period.id })
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { id, ...fields } = body
  const { error } = await supabase.from('review_periods').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
