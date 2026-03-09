import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRCandidates } from '@/lib/auth/permissions'
import { fetchHRCandidates } from '@/lib/hr/queries'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRCandidates(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const requisition_id = searchParams.get('requisition_id') || undefined
  const status = searchParams.get('status') || undefined
  const source = searchParams.get('source') || undefined
  const supabase = createServiceSupabase()
  const candidates = await fetchHRCandidates(supabase, { requisitionId: requisition_id, status, source })
  return NextResponse.json({ candidates })
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRCandidates(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const supabase = createServiceSupabase()
  const payload = {
    requisition_id: body.requisition_id,
    full_name: body.full_name,
    email: body.email || null,
    phone: body.phone || null,
    resume_url: body.resume_url || null,
    current_company: body.current_company || null,
    experience_summary: body.experience_summary || null,
    tools_skills: body.tools_skills || null,
    current_salary_monthly: body.current_salary_monthly ?? null,
    current_salary_annual: body.current_salary_annual ?? null,
    expected_salary_monthly: body.expected_salary_monthly ?? null,
    expected_salary_annual: body.expected_salary_annual ?? null,
    notice_period_days: body.notice_period_days ?? null,
    source: body.source || null,
    status: 'sourced',
    sourced_by_id: user.team_member_id,
    stage_date: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('hr_candidates')
    .insert(payload)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
