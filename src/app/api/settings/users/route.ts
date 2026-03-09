import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const roleData = await getUserRole()
  if (!roleData || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const entity = searchParams.get('entity')
  const status = searchParams.get('status')
  const supabase = createServiceSupabase()
  let q = supabase
    .from('team_members')
    .select('id, name, email, role, role_title, entity, active, status, department, reports_to_id, auth_user_id, created_at')
    .order('name')
  if (role?.trim()) q = q.eq('role', role.trim())
  if (entity?.trim()) q = q.eq('entity', entity.trim())
  if (status?.trim()) q = q.eq('status', status.trim())
  const { data: members, error } = await q

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
    current_user_id: roleData.team_member_id,
  })
}
