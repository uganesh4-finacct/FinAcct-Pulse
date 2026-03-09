import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRTeam } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRTeam(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const vertical = searchParams.get('vertical') || undefined
  const supabase = createServiceSupabase()
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, vertical, assigned_owner_id, reviewer_id, assigned_coordinator_id')
    .eq('active', true)
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  let list = clients ?? []
  if (vertical) list = list.filter((c: { vertical: string }) => c.vertical === vertical)
  const allIds = new Set<string>()
  list.forEach((c: { assigned_owner_id?: string; reviewer_id?: string; assigned_coordinator_id?: string }) => {
    if (c.assigned_owner_id) allIds.add(c.assigned_owner_id)
    if (c.reviewer_id) allIds.add(c.reviewer_id)
    if (c.assigned_coordinator_id) allIds.add(c.assigned_coordinator_id)
  })
  const { data: teamList } = allIds.size > 0
    ? await supabase.from('team_members').select('id, name').in('id', Array.from(allIds))
    : { data: [] }
  const nameById = new Map((teamList ?? []).map((t: { id: string; name: string }) => [t.id, t.name]))
  const result = list.map((c: Record<string, unknown> & { assigned_owner_id?: string; reviewer_id?: string; assigned_coordinator_id?: string }) => ({
    id: c.id,
    name: c.name,
    vertical: c.vertical,
    owner_name: c.assigned_owner_id ? nameById.get(c.assigned_owner_id) ?? null : null,
    reviewer_name: c.reviewer_id ? nameById.get(c.reviewer_id) ?? null : null,
    coordinator_name: c.assigned_coordinator_id ? nameById.get(c.assigned_coordinator_id) ?? null : null,
    assigned_owner_id: c.assigned_owner_id,
    reviewer_id: c.reviewer_id,
    assigned_coordinator_id: c.assigned_coordinator_id,
  }))
  return NextResponse.json(result)
}
