import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessOperations } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessOperations(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*, team_members!manager_id(id, name)')
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = user?.role === 'admin' || user?.role === 'default' || user?.role === 'reviewer'
  if (!isAdmin && data.manager_id !== user?.team_member_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessOperations(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()

  const { data: existing, error: fetchErr } = await supabase
    .from('weekly_reports')
    .select('manager_id, status')
    .eq('id', id)
    .single()
  if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = user?.role === 'admin' || user?.role === 'default' || user?.role === 'reviewer'
  const isOwner = existing.manager_id === user?.team_member_id
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowed = [
    'week_ending', 'clients_managed', 'books_closed_this_week', 'books_pending_close',
    'backlog_count', 'client_issues', 'team_issues', 'top_priorities_next_week', 'help_needed_leadership', 'status',
  ]
  const payload: Record<string, unknown> = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (['clients_managed', 'books_closed_this_week', 'books_pending_close', 'backlog_count'].includes(key)) {
        payload[key] = body[key] != null ? Number(body[key]) : 0
      } else if (key === 'status') {
        if (body[key] === 'reviewed' && !isAdmin) continue
        payload[key] = body[key]
      } else {
        payload[key] = body[key]
      }
    }
  }

  const { data, error } = await supabase
    .from('weekly_reports')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
