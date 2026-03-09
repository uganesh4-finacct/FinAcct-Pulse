import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRDashboard, canEditHiring } from '@/lib/auth/permissions'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const positionId = searchParams.get('positionId')
  const stageId = searchParams.get('stageId')
  const status = searchParams.get('status')
  const sourceId = searchParams.get('sourceId')

  const supabase = createServiceSupabase()
  let q = supabase
    .from('hiring_candidates')
    .select(`
      *,
      hiring_positions(id, title),
      hiring_stages(id, name, slug, color),
      hiring_sources(id, name),
      team_members!referral_by_id(id, name)
    `)
    .order('created_at', { ascending: false })
  if (positionId) q = q.eq('position_id', positionId)
  if (stageId) q = q.eq('current_stage_id', stageId)
  if (status) q = q.eq('status', status)
  if (sourceId) q = q.eq('source_id', sourceId)

  const { data: candidates, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (candidates ?? []) as Array<Record<string, unknown>>
  const activeCount = list.filter((c) => c.status === 'active').length
  const offerStageSlug = 'offer'
  let offersPending = 0
  let inPipelineCount = 0
  const { data: stages } = await supabase.from('hiring_stages').select('id, slug, is_terminal')
  const terminalIds = new Set((stages ?? []).filter((s: { is_terminal: boolean }) => s.is_terminal).map((s: { id: string }) => s.id))
  const offerId = (stages ?? []).find((s: { slug: string }) => s.slug === offerStageSlug)?.id
  list.forEach((c: Record<string, unknown>) => {
    const sid = c.current_stage_id as string | null
    if (sid && !terminalIds.has(sid)) inPipelineCount++
    if (sid === offerId) offersPending++
  })

  const withPayload = list.map((c: Record<string, unknown>) => ({
    ...c,
    position_title: (c.hiring_positions as { title?: string } | null)?.title ?? null,
    hiring_positions: undefined,
    stage_name: (c.hiring_stages as { name?: string } | null)?.name ?? null,
    stage_slug: (c.hiring_stages as { slug?: string } | null)?.slug ?? null,
    stage_color: (c.hiring_stages as { color?: string } | null)?.color ?? null,
    hiring_stages: undefined,
    source_name: (c.hiring_sources as { name?: string } | null)?.name ?? null,
    hiring_sources: undefined,
    referral_by_name: (c.team_members as { name?: string } | null)?.name ?? null,
    team_members: undefined,
  }))

  return NextResponse.json({
    candidates: withPayload,
    stats: {
      activeCandidates: activeCount,
      inPipeline: inPipelineCount,
      offersPending,
    },
  })
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role) || !canEditHiring(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const {
    position_id,
    name,
    email,
    phone,
    location,
    source_id,
    referral_by_id,
    referred_by_external,
    resume_url,
    linkedin_url,
    portfolio_url,
    current_stage_id,
    status,
    current_salary,
    expected_salary,
    notice_period,
    applied_date,
    notes,
    rejection_reason,
  } = body
  if (!position_id || !name) {
    return NextResponse.json({ error: 'Position and name required' }, { status: 400 })
  }

  const supabase = createServiceSupabase()
  let stageId = current_stage_id
  if (!stageId) {
    const { data: firstStage } = await supabase.from('hiring_stages').select('id').order('sort_order').limit(1).single()
    stageId = firstStage?.id ?? null
  }

  const { data, error } = await supabase
    .from('hiring_candidates')
    .insert({
      position_id,
      name,
      email: email || null,
      phone: phone || null,
      location: location || null,
      source_id: source_id || null,
      referral_by_id: referral_by_id || null,
      referred_by_external: referred_by_external || null,
      resume_url: resume_url || null,
      linkedin_url: linkedin_url || null,
      portfolio_url: portfolio_url || null,
      current_stage_id: stageId,
      status: status ?? 'active',
      current_salary: current_salary != null ? Number(current_salary) : null,
      expected_salary: expected_salary != null ? Number(expected_salary) : null,
      notice_period: notice_period || null,
      applied_date: applied_date || null,
      notes: notes || null,
      rejection_reason: rejection_reason || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
