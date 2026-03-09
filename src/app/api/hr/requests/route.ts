import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRRequests, isOwnerScopedHR } from '@/lib/auth/permissions'
import { fetchHRRequests } from '@/lib/hr/queries'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequests(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const supabase = createServiceSupabase()
  const raisedById = isOwnerScopedHR(user.role) ? user.team_member_id : undefined
  const requests = await fetchHRRequests(supabase, { raisedById, status })
  return NextResponse.json({ requests })
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequests(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const supabase = createServiceSupabase()
  const payload = {
    request_type: body.request_type,
    client_id: body.client_id,
    role_type_id: body.role_type_id || null,
    role_title: body.role_title,
    positions_needed: body.positions_needed ?? 1,
    market: body.market,
    service_type: body.service_type,
    estimated_monthly_fee: body.estimated_monthly_fee ?? null,
    estimated_start_date: body.estimated_start_date || null,
    urgency: body.urgency,
    justification: body.justification || null,
    status: 'Pending',
    raised_by_id: user.team_member_id,
  }
  const { data, error } = await supabase
    .from('hr_staffing_requests')
    .insert(payload)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
