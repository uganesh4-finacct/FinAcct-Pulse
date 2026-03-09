import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { sendTeamsAlert } from '@/lib/teams-webhook'

export async function GET() {
  const supabase = createServiceSupabase()
  const { data } = await supabase
    .from('escalations')
    .select('*, clients(name, vertical), team_members!raised_by_id(name)')
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { client_id, title, description, priority, raised_by_id } = body
  if (!client_id || !title || !description || !priority) {
    return NextResponse.json({ error: 'client_id, title, description, priority required' }, { status: 400 })
  }
  const insertPayload = {
    client_id,
    title: String(title).slice(0, 200),
    description: String(description),
    priority: priority || 'medium',
    raised_by_id: raised_by_id || null,
    status: 'open',
  }
  const { data: row, error } = await supabase.from('escalations').insert(insertPayload).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const [clientRes, memberRes] = await Promise.all([
    supabase.from('clients').select('name').eq('id', client_id).single(),
    raised_by_id ? supabase.from('team_members').select('name').eq('id', raised_by_id).single() : { data: null },
  ])
  const clientName = (clientRes.data as { name?: string } | null)?.name ?? ''
  const raisedByName = (memberRes.data as { name?: string } | null)?.name

  await sendTeamsAlert({
    title: `New Escalation: ${title}`,
    message: description,
    clientName: clientName || undefined,
    raisedBy: raisedByName,
    urgency: (priority === 'critical' || priority === 'high' || priority === 'medium' || priority === 'low') ? priority : 'medium',
  })

  return NextResponse.json({ success: true, id: row?.id })
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const { id, ...fields } = await req.json()
  if (fields.status === 'resolved' && !fields.resolved_at) {
    fields.resolved_at = new Date().toISOString()
  }
  if (fields.status === 'acknowledged' && !fields.acknowledged_at) {
    fields.acknowledged_at = new Date().toISOString()
  }
  const { error } = await supabase.from('escalations').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
