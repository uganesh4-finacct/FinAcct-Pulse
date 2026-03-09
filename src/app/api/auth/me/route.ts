import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServiceSupabase()
  const { data: member } = await supabase
    .from('team_members')
    .select('id, name, role, role_title, entity, email')
    .eq('email', session.user.email)
    .limit(1)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
  }

  const { data: permissions } = await supabase
    .from('user_permissions')
    .select('module_access, actions, sensitive_access')
    .eq('team_member_id', member.id)
    .single()

  return NextResponse.json({
    name: member.name,
    role: member.role,
    role_title: member.role_title,
    entity: member.entity,
    team_member_id: member.id,
    email: member.email,
    permissions: permissions ?? { module_access: [], actions: [], sensitive_access: [] },
  })
}
