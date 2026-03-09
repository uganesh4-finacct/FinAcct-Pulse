import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRRequisitions } from '@/lib/auth/permissions'
import { fetchHRRequisitions } from '@/lib/hr/queries'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequisitions(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const market = searchParams.get('market') || undefined
  const supabase = createServiceSupabase()
  const requisitions = await fetchHRRequisitions(supabase, { status, market })
  return NextResponse.json({ requisitions })
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequisitions(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const supabase = createServiceSupabase()
  const payload = {
    staffing_request_id: body.staffing_request_id || null,
    role_type_id: body.role_type_id || null,
    title: body.title,
    market: body.market,
    vertical: body.vertical,
    priority: body.priority,
    experience_min_years: body.experience_min_years ?? null,
    experience_max_years: body.experience_max_years ?? null,
    target_start_date: body.target_start_date || null,
    status: 'Open',
    budget_monthly_min: body.budget_monthly_min ?? null,
    budget_monthly_max: body.budget_monthly_max ?? null,
    budget_annual_min: body.budget_annual_min ?? null,
    budget_annual_max: body.budget_annual_max ?? null,
    jd_summary: body.jd_summary || null,
    jd_full_url: body.jd_full_url || null,
    skills: body.skills ?? [],
  }
  const { data, error } = await supabase
    .from('hr_requisitions')
    .insert(payload)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
