import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRDashboard, canEditHiring } from '@/lib/auth/permissions'
import { createServiceSupabase } from '@/lib/supabase-server'
import { notifyByRole } from '@/lib/notifications'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role) || !canEditHiring(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { stage_id: stageId, notes } = body
  if (!stageId) {
    return NextResponse.json({ error: 'stage_id required' }, { status: 400 })
  }

  const supabase = createServiceSupabase()
  const { data: candidate, error: fetchErr } = await supabase
    .from('hiring_candidates')
    .select('id, current_stage_id')
    .eq('id', id)
    .single()
  if (fetchErr || !candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  const { error: updateErr } = await supabase
    .from('hiring_candidates')
    .update({ current_stage_id: stageId })
    .eq('id', id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  await supabase.from('hiring_stage_history').insert({
    candidate_id: id,
    stage_id: stageId,
    moved_by_id: user.team_member_id ?? null,
    notes: notes || null,
  })

  const { data: updated, error: selectErr } = await supabase
    .from('hiring_candidates')
    .select('*, hiring_stages(id, name, slug, color)')
    .eq('id', id)
    .single()
  if (selectErr) return NextResponse.json({ error: selectErr.message }, { status: 500 })
  const c = updated as Record<string, unknown>
  const stageName = (c.hiring_stages as { name?: string } | null)?.name ?? 'New stage'
  const candidateName = (c.name as string) ?? 'Candidate'

  const positionId = c.position_id as string | undefined
  let positionTitle = 'Position'
  if (positionId) {
    const { data: pos } = await supabase.from('hiring_positions').select('title').eq('id', positionId).single()
    positionTitle = (pos as { title?: string } | null)?.title ?? positionTitle
  }

  notifyByRole(['admin', 'reviewer'], {
    typeCode: 'hiring_stage_change',
    title: `Candidate Update: ${candidateName}`,
    message: `${candidateName} moved to ${stageName} for ${positionTitle}`,
    linkUrl: '/hr/hiring?tab=pipeline',
    linkLabel: 'View Pipeline',
    referenceType: 'candidate',
    referenceId: id,
  }).catch(() => {})

  return NextResponse.json({
    ...c,
    stage_name: stageName,
    stage_slug: (c.hiring_stages as { slug?: string } | null)?.slug ?? null,
    stage_color: (c.hiring_stages as { color?: string } | null)?.color ?? null,
    hiring_stages: undefined,
  })
}
