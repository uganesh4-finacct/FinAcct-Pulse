import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRTeam, canEditHRTeam, canDeleteOrDeactivateHRTeam } from '@/lib/auth/permissions'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canAccessHRTeam(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data: member, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !member) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 })
  }
  const { data: reportTo } = member.reports_to_id
    ? await supabase.from('team_members').select('id, name').eq('id', member.reports_to_id).single()
    : { data: null }
  const { data: perms } = await supabase
    .from('user_permissions')
    .select('module_access')
    .eq('team_member_id', id)
    .single()
  const clientsAsOwner = await supabase.from('clients').select('id, name, vertical').eq('assigned_owner_id', id)
  const clientsAsReviewer = await supabase.from('clients').select('id, name, vertical').eq('reviewer_id', id)
  const clientsAsCoordinator = await supabase.from('clients').select('id, name, vertical').eq('assigned_coordinator_id', id)
  const assignedClients = [
    ...(clientsAsOwner.data ?? []).map((c: { id: string; name: string; vertical: string }) => ({ ...c, role_on_client: 'Owner' })),
    ...(clientsAsReviewer.data ?? []).map((c: { id: string; name: string; vertical: string }) => ({ ...c, role_on_client: 'Reviewer' })),
    ...(clientsAsCoordinator.data ?? []).map((c: { id: string; name: string; vertical: string }) => ({ ...c, role_on_client: 'Coordinator' })),
  ]
  return NextResponse.json({
    ...member,
    reports_to: reportTo,
    module_access: perms?.module_access ?? [],
    assigned_clients: assignedClients,
  })
}

const PATCH_KEYS = [
  'name', 'email', 'phone', 'role', 'role_title', 'entity', 'location',
  'reports_to_id', 'active', 'status', 'module_access',
] as const

export async function PATCH(req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditHRTeam(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()
  const payload: Record<string, unknown> = {}
  for (const key of PATCH_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (key === 'module_access') continue
      payload[key] = body[key]
    }
  }
  if (payload.email && typeof payload.email === 'string' && !payload.email.includes('@finacctsolutions.com')) {
    return NextResponse.json({ error: 'Email must be @finacctsolutions.com' }, { status: 400 })
  }
  if (payload.entity === 'india') payload.entity = 'india'
  else if (payload.entity) payload.entity = 'us'
  if (payload.location === 'India') payload.location = 'India'
  else if (payload.location) payload.location = 'US'
  if (payload.reports_to_id === '') payload.reports_to_id = null
  if (Object.keys(payload).length > 0) {
    const { error: updateErr } = await supabase.from('team_members').update(payload).eq('id', id)
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }
  if (Array.isArray(body.module_access)) {
    await supabase.from('user_permissions').upsert({
      team_member_id: id,
      module_access: body.module_access,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'team_member_id' })
  }
  const { data: updated } = await supabase.from('team_members').select('*').eq('id', id).single()
  return NextResponse.json(updated ?? {})
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canDeleteOrDeactivateHRTeam(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
