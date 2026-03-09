import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRDashboard, canEditHiring, canDeleteHiring, canSeeHiringSalary } from '@/lib/auth/permissions'
import { createServiceSupabase } from '@/lib/supabase-server'

const CANDIDATE_FIELDS = [
  'position_id', 'name', 'email', 'phone', 'location', 'source_id',
  'referral_by_id', 'referred_by_external', 'resume_url', 'linkedin_url', 'portfolio_url',
  'current_stage_id', 'status', 'current_salary', 'expected_salary', 'notice_period',
  'applied_date', 'notes', 'rejection_reason',
  'technical_score', 'technical_notes', 'client_interview_notes', 'overall_rating',
]

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
    .from('hiring_candidates')
    .select(`
      *,
      hiring_positions(id, title, department),
      hiring_stages(id, name, slug, color),
      hiring_sources(id, name),
      team_members!referral_by_id(id, name)
    `)
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const c = data as Record<string, unknown>
  return NextResponse.json({
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
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role) || !canEditHiring(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const canSeeSalary = canSeeHiringSalary(user.role)
  const allowed = [...CANDIDATE_FIELDS]
  if (canSeeSalary) {
    allowed.push('current_salary', 'expected_salary')
  }
  const payload: Record<string, unknown> = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (['current_salary', 'expected_salary', 'technical_score', 'overall_rating'].includes(key)) {
        payload[key] = body[key] != null ? Number(body[key]) : null
      } else {
        payload[key] = body[key]
      }
    }
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('hiring_candidates').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role) || !canDeleteHiring(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { error } = await supabase.from('hiring_candidates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
