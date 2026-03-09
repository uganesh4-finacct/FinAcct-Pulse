import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { mapUserRoleToPulseRole } from '@/lib/types'

export async function POST(req: Request) {
  const roleData = await getUserRole()
  if (!roleData || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const {
    name,
    email: rawEmail,
    department,
    reportsToId,
    globalRole,
    moduleAccess = [],
    actions = [],
    sensitiveAccess = [],
  } = body

  if (!name || !rawEmail) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
  }

  const email = String(rawEmail).trim().toLowerCase()
  const fullEmail = email.includes('@') ? email : `${email}@finacctsolutions.com`

  const supabase = createServiceSupabase()
  const pulseRole = mapUserRoleToPulseRole(globalRole || 'contributor')

  // 1. Create team_members record with status='invited'
  const { data: member, error: insertError } = await supabase
    .from('team_members')
    .insert({
      name,
      email: fullEmail,
      role: pulseRole,
      role_title: globalRole === 'admin' ? 'Admin' : globalRole === 'manager' ? 'Manager' : 'Contributor',
      entity: 'us',
      active: false,
      status: 'invited',
      department: department || null,
      reports_to_id: reportsToId || null,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // 2. Create user_permissions record
  const { error: permError } = await supabase.from('user_permissions').insert({
    team_member_id: member.id,
    module_access: Array.isArray(moduleAccess) ? moduleAccess : [],
    actions: Array.isArray(actions) ? actions : [],
    sensitive_access: Array.isArray(sensitiveAccess) ? sensitiveAccess : [],
  })

  if (permError) {
    await supabase.from('team_members').delete().eq('id', member.id)
    return NextResponse.json({ error: permError.message }, { status: 500 })
  }

  // 3. Invite via Supabase Auth (requires service role)
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    fullEmail,
    { data: { name, team_member_id: member.id } }
  )

  if (inviteError) {
    await supabase.from('user_permissions').delete().eq('team_member_id', member.id)
    await supabase.from('team_members').delete().eq('id', member.id)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  if (inviteData?.user?.id) {
    await supabase
      .from('team_members')
      .update({ auth_user_id: inviteData.user.id })
      .eq('id', member.id)
  }

  return NextResponse.json({ success: true, user: { ...member, auth_user_id: inviteData?.user?.id } })
}
