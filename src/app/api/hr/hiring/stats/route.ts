import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRDashboard } from '@/lib/auth/permissions'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()

  const [openPosRes, activeRes, stagesRes] = await Promise.all([
    supabase.from('hiring_positions').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('hiring_candidates').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('hiring_stages').select('id, slug, is_terminal'),
  ])
  const openPositions = openPosRes.count ?? 0
  const activeCandidates = activeRes.count ?? 0
  const stages = (stagesRes.data ?? []) as Array<{ id: string; slug: string; is_terminal: boolean }>
  const terminalIds = stages.filter((s) => s.is_terminal).map((s) => s.id)
  const nonTerminalIds = stages.filter((s) => !s.is_terminal).map((s) => s.id)
  const offerStageId = stages.find((s) => s.slug === 'offer')?.id

  let inPipeline = 0
  if (nonTerminalIds.length > 0) {
    const { count } = await supabase
      .from('hiring_candidates')
      .select('id', { count: 'exact', head: true })
      .in('current_stage_id', nonTerminalIds)
    inPipeline = count ?? 0
  }
  const offersRes = offerStageId
    ? await supabase.from('hiring_candidates').select('id', { count: 'exact', head: true }).eq('current_stage_id', offerStageId)
    : { count: 0 }
  const offersPending = offersRes.count ?? 0

  return NextResponse.json({
    openPositions,
    activeCandidates,
    inPipeline,
    offersPending,
  })
}
