import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRDashboard } from '@/lib/auth/permissions'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('hiring_stage_history')
    .select(`
      id,
      stage_id,
      moved_at,
      moved_by_id,
      notes,
      hiring_stages(id, name, slug, color),
      team_members!moved_by_id(id, name)
    `)
    .eq('candidate_id', id)
    .order('moved_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    stage_id: row.stage_id,
    moved_at: row.moved_at,
    moved_by_id: row.moved_by_id,
    notes: row.notes,
    stage_name: (row.hiring_stages as { name?: string } | null)?.name ?? null,
    stage_slug: (row.hiring_stages as { slug?: string } | null)?.slug ?? null,
    moved_by_name: (row.team_members as { name?: string } | null)?.name ?? null,
  }))
  return NextResponse.json(list)
}
