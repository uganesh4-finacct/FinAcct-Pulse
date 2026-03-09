import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRTeam } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessHRTeam(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data: members, error } = await supabase
    .from('team_members')
    .select('id, name, role, role_title, entity, reports_to_id, active')
    .order('entity')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = members ?? []
  type Node = { id: string; name: string; role: string; role_title: string | null; entity: string; reports_to_id: string | null; active: boolean; children: Node[] }
  const byId = new Map<string, Node>()
  list.forEach((m: { id: string; name: string; role: string; role_title: string | null; entity: string; reports_to_id: string | null; active: boolean }) => {
    byId.set(m.id, { ...m, children: [] })
  })
  const roots: Node[] = []
  byId.forEach((node) => {
    if (!node.reports_to_id || !byId.has(node.reports_to_id)) {
      roots.push(node)
    } else {
      const parent = byId.get(node.reports_to_id)!
      parent.children.push(node)
    }
  })
  const byEntity: Record<string, Node[]> = { us: [], india: [] }
  roots.forEach((r) => {
    const entity = r.entity === 'india' ? 'india' : 'us'
    if (!byEntity[entity]) byEntity[entity] = []
    byEntity[entity].push(r)
  })
  return NextResponse.json({ by_entity: byEntity })
}
