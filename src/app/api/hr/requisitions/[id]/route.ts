import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRRequisitions } from '@/lib/auth/permissions'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequisitions(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  let q = supabase.from('hr_requisitions').select('*').eq('id', id).single()
  const { data, error } = await q
  if (error) {
    const { data: legacy } = await supabase.from('requisitions').select('*').eq('id', id).single()
    if (legacy) {
      return NextResponse.json({
        ...legacy,
        title: legacy.job_title,
        vertical: legacy.vertical ?? '',
        experience_min_years: null,
        experience_max_years: null,
        budget_monthly_min: null,
        budget_monthly_max: null,
        budget_annual_min: legacy.budget_amount ?? null,
        budget_annual_max: null,
      })
    }
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  }
  return NextResponse.json(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequisitions(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()
  const allowed = ['status', 'title', 'priority', 'target_start_date', 'jd_summary', 'jd_full_url', 'skills']
  const payload: Record<string, unknown> = {}
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) payload[k] = body[k]
  }
  const { data, error } = await supabase
    .from('hr_requisitions')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
