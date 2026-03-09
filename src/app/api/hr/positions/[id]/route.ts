import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRDashboard, canEditHiring, canDeleteHiring, canSeeHiringSalary } from '@/lib/auth/permissions'
import { createServiceSupabase } from '@/lib/supabase-server'

const POSITION_FIELDS = [
  'title', 'client_project', 'industry_id', 'department', 'location', 'entity',
  'number_of_positions', 'priority', 'status', 'experience', 'core_skills',
  'must_have_skills', 'preferred_skills', 'reject_if', 'reporting_to', 'hiring_owner_id',
  'currency', 'target_start_date', 'notes', 'job_description',
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
    .from('hiring_positions')
    .select(`
      *,
      hiring_industries(id, name),
      team_members!hiring_owner_id(id, name),
      hiring_candidates(id, name, email, current_stage_id, status, created_at)
    `)
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const p = data as Record<string, unknown>
  return NextResponse.json({
    ...p,
    industry_name: (p.hiring_industries as { name?: string } | null)?.name ?? null,
    hiring_industries: undefined,
    hiring_owner_name: (p.team_members as { name?: string } | null)?.name ?? null,
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
  const allowed = [...POSITION_FIELDS]
  if (canSeeSalary) allowed.push('salary_min', 'salary_max')
  const payload: Record<string, unknown> = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (['salary_min', 'salary_max', 'number_of_positions'].includes(key)) {
        payload[key] = body[key] != null ? Number(body[key]) : null
      } else {
        payload[key] = body[key]
      }
    }
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('hiring_positions').update(payload).eq('id', id).select().single()
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
  const { error } = await supabase.from('hiring_positions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
