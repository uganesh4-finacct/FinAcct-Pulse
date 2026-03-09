import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRRequests, canApproveStaffingRequests, isOwnerScopedHR } from '@/lib/auth/permissions'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequests(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('hr_staffing_requests')
    .select(`
      *,
      clients(id, name, vertical)
    `)
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const clientsRow = (data as any).clients
  const row = {
    ...data,
    client_name: clientsRow?.name,
    client_vertical: clientsRow?.vertical ?? null,
    clients: undefined,
  }
  if (isOwnerScopedHR(user.role) && row.raised_by_id !== user.team_member_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json(row)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequests(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()
  const allowed = ['status', 'resolution', 'assigned_team_member_id', 'resolution_notes']
  const payload: Record<string, unknown> = {}
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) payload[k] = body[k]
  }
  if (payload.status && !['Approved', 'Rejected', 'Hold'].includes(payload.status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('hr_staffing_requests')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(data)
}
