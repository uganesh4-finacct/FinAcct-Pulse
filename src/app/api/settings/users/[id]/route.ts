import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleData = await getUserRole()
  if (!roleData || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()

  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .single()

  if (memberError || !member) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data: perms } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('team_member_id', id)
    .single()

  return NextResponse.json({
    ...member,
    permissions: perms ?? {
      module_access: [],
      actions: [],
      sensitive_access: [],
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleData = await getUserRole()
  if (!roleData || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()

  const teamFields = [
    'name', 'email', 'role', 'role_title', 'entity', 'active',
    'status', 'department', 'reports_to_id',
  ] as const
  const teamPayload: Record<string, unknown> = {}
  for (const key of teamFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      teamPayload[key] = body[key]
    }
  }
  if (Object.keys(teamPayload).length > 0) {
    const { error: updateError } = await supabase
      .from('team_members')
      .update(teamPayload)
      .eq('id', id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const permFields = ['module_access', 'actions', 'sensitive_access'] as const
  const permPayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of permFields) {
    if (Object.prototype.hasOwnProperty.call(body, key) && Array.isArray(body[key])) {
      permPayload[key] = body[key]
    }
  }
  if (Object.keys(permPayload).length > 1) {
    const { data: existing } = await supabase
      .from('user_permissions')
      .select('id')
      .eq('team_member_id', id)
      .single()
    if (existing) {
      await supabase.from('user_permissions').update(permPayload).eq('team_member_id', id)
    } else {
      await supabase.from('user_permissions').insert({
        team_member_id: id,
        ...permPayload,
      })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleData = await getUserRole()
  if (!roleData || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  if (id === roleData.team_member_id) {
    return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 })
  }
  const supabase = createServiceSupabase()
  const { error } = await supabase
    .from('team_members')
    .update({ active: false, status: 'inactive' })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
