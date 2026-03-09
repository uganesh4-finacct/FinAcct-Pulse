import { createServiceSupabase } from '@/lib/supabase-server'
import { type NextRequest, NextResponse } from 'next/server'
import { sendTeamsAlert } from '@/lib/teams-webhook'

export async function GET(req: NextRequest) {
  const supabase = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const period_id = searchParams.get('period_id')
  const assigned_to = searchParams.get('assigned_to')
  const status = searchParams.get('status')

  let q = supabase
    .from('client_updates')
    .select(`
      *,
      clients(id, name, vertical),
      team_members!assigned_to(id, name),
      review_periods(id, title, start_date, end_date, status)
    `)
    .order('created_at', { ascending: false })

  if (period_id) q = q.eq('review_period_id', period_id)
  if (assigned_to) q = q.eq('assigned_to', assigned_to)
  if (status) q = q.eq('status', status)

  const { data: updates, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (updates ?? []).map((u: any) => u.id)
  const { data: items } = await supabase
    .from('update_action_items')
    .select('client_update_id')
    .in('client_update_id', ids)

  const countByUpdate = (items ?? []).reduce((acc: Record<string, number>, r: any) => {
    acc[r.client_update_id] = (acc[r.client_update_id] ?? 0) + 1
    return acc
  }, {})

  const { data: allItems } = await supabase
    .from('update_action_items')
    .select('*')
    .in('client_update_id', ids)

  const itemsByUpdate = (allItems ?? []).reduce((acc: Record<string, any[]>, r: any) => {
    if (!acc[r.client_update_id]) acc[r.client_update_id] = []
    acc[r.client_update_id].push(r)
    return acc
  }, {})

  const withCount = (updates ?? []).map((u: any) => ({
    ...u,
    action_items_count: countByUpdate[u.id] ?? u.action_items_count ?? 0,
    action_items: itemsByUpdate[u.id] ?? [],
  }))

  return NextResponse.json(withCount)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { id, ...fields } = body

  if (fields.status === 'submitted') {
    fields.submitted_at = new Date().toISOString()
  }

  const { data: existing } = await supabase.from('client_updates').select('*, clients(name), team_members!assigned_to(name)').eq('id', id).single()

  const { error } = await supabase.from('client_updates').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (fields.status === 'submitted' && existing) {
    const assigneeName = (existing as any).team_members?.name ?? 'Someone'
    const clientName = (existing as any).clients?.name ?? 'Client'
    await sendTeamsAlert({
      title: `${assigneeName} submitted: ${clientName}`,
      message: `Close status: ${fields.close_status ?? existing.close_status ?? '—'}`,
      urgency: 'low',
    })
  }

  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { client_update_id, description, owner, due_date, priority } = body

  const { error } = await supabase.from('update_action_items').insert({
    client_update_id,
    description,
    owner: owner ?? null,
    due_date: due_date || null,
    priority: priority ?? 'medium',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: cu } = await supabase.from('client_updates').select('action_items_count').eq('id', client_update_id).single()
  const count = (cu?.action_items_count ?? 0) + 1
  await supabase.from('client_updates').update({ action_items_count: count, updated_at: new Date().toISOString() }).eq('id', client_update_id)

  return NextResponse.json({ success: true })
}
