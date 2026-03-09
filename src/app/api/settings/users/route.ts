import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const roleData = await getUserRole()
  if (!roleData || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data: members, error } = await supabase
    .from('team_members')
    .select('id, name, email, role, role_title, entity, active, status, department, reports_to_id, auth_user_id, created_at')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = members ?? []
  const total = list.length
  const active = list.filter((m: { status?: string; active?: boolean }) =>
    (m.status === 'active' || !m.status) && m.active !== false
  ).length
  const pendingInvites = list.filter((m: { status?: string }) => m.status === 'invited').length

  return NextResponse.json({
    users: list,
    stats: { total, active, pendingInvites },
  })
}
