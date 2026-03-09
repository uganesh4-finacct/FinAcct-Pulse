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
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const industryId = searchParams.get('industryId')

  const supabase = createServiceSupabase()
  let q = supabase
    .from('hiring_positions')
    .select(`
      *,
      hiring_industries(id, name),
      hiring_candidates(id)
    `)
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  if (priority) q = q.eq('priority', priority)
  if (industryId) q = q.eq('industry_id', industryId)

  const { data: positions, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (positions ?? []) as Array<Record<string, unknown>>
  const openCount = list.filter((p) => p.status === 'open').length
  const withPayload = list.map((p: Record<string, unknown>) => ({
    ...p,
    industry_name: (p.hiring_industries as { name?: string } | null)?.name ?? null,
    hiring_industries: undefined,
    candidates_count: Array.isArray(p.hiring_candidates) ? p.hiring_candidates.length : 0,
    hiring_candidates: undefined,
  }))

  return NextResponse.json({
    positions: withPayload,
    stats: { openPositions: openCount },
  })
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role) || !canEditHiring(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const {
    title,
    client_project,
    industry_id,
    department,
    location,
    entity,
    number_of_positions,
    priority,
    status,
    experience,
    core_skills,
    must_have_skills,
    preferred_skills,
    reject_if,
    reporting_to,
    hiring_owner_id,
    salary_min,
    salary_max,
    currency,
    target_start_date,
    notes,
    job_description,
  } = body
  if (!title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  const supabase = createServiceSupabase()
  const canSeeSalary = user.role === 'admin' || user.role === 'hr_manager'
  const payload: Record<string, unknown> = {
    title,
    client_project: client_project || null,
    industry_id: industry_id || null,
    department: department || null,
    location: location || null,
    entity: entity ?? location ?? null,
    number_of_positions: number_of_positions != null ? Number(number_of_positions) : 1,
    priority: priority ?? 'Medium',
    status: status ?? 'draft',
    experience: experience || null,
    core_skills: core_skills || null,
    must_have_skills: must_have_skills || null,
    preferred_skills: preferred_skills || null,
    reject_if: reject_if || null,
    reporting_to: reporting_to || null,
    hiring_owner_id: hiring_owner_id || null,
    currency: currency || 'USD',
    target_start_date: target_start_date || null,
    notes: notes || null,
    job_description: job_description || null,
  }
  if (canSeeSalary) {
    payload.salary_min = salary_min != null ? Number(salary_min) : null
    payload.salary_max = salary_max != null ? Number(salary_max) : null
  }

  const { data, error } = await supabase.from('hiring_positions').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
