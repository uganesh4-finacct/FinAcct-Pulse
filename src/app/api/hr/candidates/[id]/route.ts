import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRCandidates, canSeeSalaryAndBudget } from '@/lib/auth/permissions'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRCandidates(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('hr_candidates').select('*, hr_requisitions(title)').eq('id', id).single()
  if (error) {
    const { data: legacy } = await supabase.from('candidates').select('*, requisitions(job_title)').eq('id', id).single()
    if (legacy) {
      const out = {
        ...legacy,
        full_name: legacy.full_name,
        resume_url: legacy.cv_file_url,
        current_salary_monthly: null,
        current_salary_annual: legacy.current_salary ?? null,
        expected_salary_monthly: null,
        expected_salary_annual: legacy.expected_salary ?? null,
        offer_salary_monthly: null,
        offer_salary_annual: legacy.offer_amount ?? null,
        requisition_title: (legacy as any).requisitions?.job_title,
      }
      if (!canSeeSalaryAndBudget(user.role)) {
        delete (out as any).current_salary_monthly
        delete (out as any).current_salary_annual
        delete (out as any).expected_salary_monthly
        delete (out as any).expected_salary_annual
        delete (out as any).offer_salary_monthly
        delete (out as any).offer_salary_annual
      }
      return NextResponse.json(out)
    }
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  }
  const out: Record<string, unknown> = { ...data, requisition_title: (data as any).hr_requisitions?.title }
  if (!canSeeSalaryAndBudget(user.role)) {
    delete out.current_salary_monthly
    delete out.current_salary_annual
    delete out.expected_salary_monthly
    delete out.expected_salary_annual
    delete out.offer_salary_monthly
    delete out.offer_salary_annual
  }
  const a1Id = (data as any).offer_approver_1_id
  const a2Id = (data as any).offer_approver_2_id
  if (a1Id || a2Id) {
    const ids = [a1Id, a2Id].filter(Boolean)
    const { data: approvers } = await supabase.from('team_members').select('id, name, role_title').in('id', ids)
    const map = new Map((approvers ?? []).map((a: any) => [a.id, `${a.name}${a.role_title ? ` (${a.role_title})` : ''}`]))
    if (a1Id) out.offer_approver_1_name = map.get(a1Id) ?? null
    if (a2Id) out.offer_approver_2_name = map.get(a2Id) ?? null
  }
  return NextResponse.json(out)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canAccessHRCandidates(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const action = body.action as string | undefined
  const supabase = createServiceSupabase()
  const now = new Date().toISOString()

  if (action === 'move_to_offer') {
    const payload = {
      status: 'offer_pending_approval',
      offer_salary_monthly: body.offer_salary_monthly ?? null,
      offer_salary_annual: body.offer_salary_annual ?? null,
      offer_approver_1_id: body.offer_approver_1_id || null,
      offer_approver_2_id: body.offer_approver_2_id || null,
      offer_approver_1_approved: false,
      offer_approver_2_approved: false,
      stage_date: now,
    }
    const { data, error } = await supabase.from('hr_candidates').update(payload).eq('id', id).select().single()
    if (error) {
      const { data: leg, error: legErr } = await supabase.from('candidates').update({
        status: 'Offered',
        offer_amount: body.offer_salary_annual ?? body.offer_salary_monthly,
        updated_at: now,
      }).eq('id', id).select().single()
      if (legErr) return NextResponse.json({ error: legErr.message }, { status: 500 })
      return NextResponse.json(leg)
    }
    return NextResponse.json(data)
  }

  if (action === 'approve_offer') {
    const { data: cand } = await supabase.from('hr_candidates').select('offer_approver_1_id, offer_approver_2_id, offer_approver_1_approved, offer_approver_2_approved').eq('id', id).single()
    if (!cand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    const tid = user.team_member_id
    let payload: Record<string, unknown> = {}
    if (cand.offer_approver_1_id === tid) {
      payload = { offer_approver_1_approved: true, offer_approver_1_date: now }
    } else if (cand.offer_approver_2_id === tid) {
      payload = { offer_approver_2_approved: true, offer_approver_2_date: now }
    } else {
      return NextResponse.json({ error: 'You are not an assigned approver for this offer' }, { status: 403 })
    }
    const { data, error } = await supabase.from('hr_candidates').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === 'send_offer') {
    const { data: cand } = await supabase.from('hr_candidates').select('offer_approver_1_approved, offer_approver_2_approved, offer_approver_2_id').eq('id', id).single()
    if (!cand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    const allApproved = cand.offer_approver_1_approved && (!cand.offer_approver_2_id || cand.offer_approver_2_approved)
    if (!allApproved) return NextResponse.json({ error: 'All approvers must approve before sending offer' }, { status: 400 })
    const { data, error } = await supabase.from('hr_candidates').update({
      status: 'offer_sent',
      offer_sent_date: now.slice(0, 10),
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === 'reject') {
    const payload = {
      status: 'rejected',
      rejection_reason: body.rejection_reason ?? null,
      rejection_notes: body.rejection_notes ?? null,
      rejected_by_id: user.team_member_id,
      rejected_date: now,
    }
    const { data, error } = await supabase.from('hr_candidates').update(payload).eq('id', id).select().single()
    if (error) {
      const { data: leg, error: legErr } = await supabase.from('candidates').update({
        status: 'Rejected',
        updated_at: now,
      }).eq('id', id).select().single()
      if (legErr) return NextResponse.json({ error: legErr.message }, { status: 500 })
      return NextResponse.json(leg)
    }
    return NextResponse.json(data)
  }

  const allowed = [
    'status', 'full_name', 'email', 'phone', 'resume_url', 'current_company', 'experience_summary', 'tools_skills',
    'current_salary_monthly', 'current_salary_annual', 'expected_salary_monthly', 'expected_salary_annual',
    'offer_salary_monthly', 'offer_salary_annual', 'notice_period_days', 'source', 'stage_date',
    'offer_approver_1_id', 'offer_approver_2_id', 'offer_approver_1_approved', 'offer_approver_2_approved',
    'offer_approver_1_date', 'offer_approver_2_date',
  ]
  const payload: Record<string, unknown> = {}
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) payload[k] = body[k]
  }
  if (payload.status) payload.stage_date = now
  const { data, error } = await supabase.from('hr_candidates').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
