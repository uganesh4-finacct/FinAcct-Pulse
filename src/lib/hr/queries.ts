// ============================================================
// FinAcct Pulse — HR Module Supabase Queries
// Uses views/tables from spec; falls back when not present
// ============================================================

import type {
  HRDashboardSummary,
  HRPipelineByRequisition,
  HRAlert,
  HRStaffingRequest,
  HRRequisition,
  HRCandidate,
  HRJDTemplate,
  HRBudgetRange,
  HRRoleType,
  HRCandidateActivity,
} from './types'

type SupabaseClient = ReturnType<typeof import('@/lib/supabase-server').createServiceSupabase>

// ── Dashboard ─────────────────────────────────────────────────

export async function fetchHRDashboardSummary(supabase: SupabaseClient): Promise<HRDashboardSummary | null> {
  try {
    const { data } = await supabase
      .from('v_hr_dashboard_summary')
      .select('*')
      .single()
    return data as HRDashboardSummary | null
  } catch {
    try {
      const { data } = await supabase.from('v_hr_dashboard').select('*').single()
      if (data) {
        return {
          requests_pending: 0,
          open_requisitions: (data as any).total_active ?? 0,
          sourced: 0,
          in_interview: (data as any).in_interviews ?? 0,
          offers_pending: (data as any).offers_out ?? 0,
          joined_this_month: (data as any).closed_this_month ?? 0,
        }
      }
    } catch {}
    return null
  }
}

export async function fetchHRPipelineByRequisition(supabase: SupabaseClient): Promise<HRPipelineByRequisition[]> {
  try {
    const { data } = await supabase.from('v_hr_pipeline_by_requisition').select('*')
    return (data ?? []) as HRPipelineByRequisition[]
  } catch {
    return []
  }
}

export async function fetchHRAlerts(supabase: SupabaseClient): Promise<HRAlert[]> {
  try {
    const { data } = await supabase.from('v_hr_alerts').select('*').order('created_at', { ascending: false }).limit(10)
    return (data ?? []) as HRAlert[]
  } catch {
    return []
  }
}

// ── Staffing Requests ─────────────────────────────────────────

export async function fetchHRRequests(
  supabase: SupabaseClient,
  options?: { raisedById?: string; status?: string }
): Promise<HRStaffingRequest[]> {
  try {
    let q = supabase
      .from('hr_staffing_requests')
      .select('*, clients(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
    if (options?.raisedById) q = q.eq('raised_by_id', options.raisedById)
    if (options?.status) q = q.eq('status', options.status)
    const { data } = await q
    return (data ?? []).map((r: any) => ({
      ...r,
      client_name: r.clients?.name,
      clients: undefined,
    })) as HRStaffingRequest[]
  } catch {
    return []
  }
}

// ── Requisitions ───────────────────────────────────────────────

export async function fetchHRRequisitions(
  supabase: SupabaseClient,
  options?: { status?: string; market?: string }
): Promise<HRRequisition[]> {
  try {
    let q = supabase
      .from('hr_requisitions')
      .select('*')
      .not('status', 'in', '("Closed_Hired","Cancelled")')
      .order('created_at', { ascending: false })
    if (options?.status) q = q.eq('status', options.status)
    if (options?.market) q = q.eq('market', options.market)
    const { data } = await q
    return (data ?? []) as HRRequisition[]
  } catch {
    try {
      let q = supabase
        .from('requisitions')
        .select('*')
        .not('status', 'in', '("Closed_Hired","Cancelled")')
        .order('created_at', { ascending: false })
      if (options?.status) q = q.eq('status', options.status)
      const { data } = await q
      return (data ?? []).map((r: any) => ({
        ...r,
        title: r.job_title,
        vertical: r.vertical ?? '',
        experience_min_years: null,
        experience_max_years: null,
        budget_monthly_min: null,
        budget_monthly_max: null,
        budget_annual_min: r.budget_amount ? Math.round(r.budget_amount / 12) : null,
        budget_annual_max: null,
      })) as HRRequisition[]
    } catch {}
    return []
  }
}

// ── Candidates ─────────────────────────────────────────────────

export async function fetchHRCandidates(
  supabase: SupabaseClient,
  options?: { requisitionId?: string; status?: string; source?: string }
): Promise<HRCandidate[]> {
  try {
    let q = supabase
      .from('hr_candidates')
      .select('*, hr_requisitions(title)', { count: 'exact' })
      .order('stage_date', { ascending: false, nullsFirst: false })
    if (options?.requisitionId) q = q.eq('requisition_id', options.requisitionId)
    if (options?.status) q = q.eq('status', options.status)
    if (options?.source) q = q.eq('source', options.source)
    const { data } = await q
    return (data ?? []).map((c: any) => ({
      ...c,
      requisition_title: c.hr_requisitions?.title,
      hr_requisitions: undefined,
    })) as HRCandidate[]
  } catch {
    try {
      let q = supabase.from('candidates').select('*, requisitions(job_title)').order('created_at', { ascending: false })
      if (options?.requisitionId) q = q.eq('requisition_id', options.requisitionId)
      if (options?.status) q = q.eq('status', options.status)
      const { data } = await q
      return (data ?? []).map((c: any) => ({
        id: c.id,
        requisition_id: c.requisition_id,
        full_name: c.full_name,
        email: c.email,
        phone: c.phone,
        resume_url: c.cv_file_url,
        current_company: null,
        experience_summary: null,
        tools_skills: null,
        current_salary_monthly: null,
        current_salary_annual: c.current_salary ?? null,
        expected_salary_monthly: null,
        expected_salary_annual: c.expected_salary ?? null,
        offer_salary_monthly: null,
        offer_salary_annual: c.offer_amount ?? null,
        notice_period_days: null,
        source: null,
        status: mapLegacyCandidateStatus(c.status),
        sourced_by_id: c.recruiter_id,
        stage_date: c.updated_at,
        created_at: c.created_at,
        updated_at: c.updated_at,
        requisition_title: c.requisitions?.job_title,
      })) as HRCandidate[]
    } catch {}
    return []
  }
}

function mapLegacyCandidateStatus(s: string): import('./types').HRCandidateStatus {
  const map: Record<string, import('./types').HRCandidateStatus> = {
    New: 'sourced',
    Reviewed: 'screening',
    Interview_Scheduled: 'technical',
    Interview_Completed: 'technical',
    Offered: 'offer_sent',
    Rejected: 'rejected',
    On_Hold: 'sourced',
  }
  return map[s] ?? 'sourced'
}

// ── Templates & Budget ────────────────────────────────────────

export async function fetchHRTemplates(supabase: SupabaseClient): Promise<HRJDTemplate[]> {
  try {
    const { data } = await supabase.from('hr_templates').select('*').order('title')
    return (data ?? []) as HRJDTemplate[]
  } catch {
    return []
  }
}

export async function fetchHRBudgetRanges(
  supabase: SupabaseClient,
  market: 'India' | 'US'
): Promise<HRBudgetRange[]> {
  try {
    const { data } = await supabase
      .from('hr_budget_ranges')
      .select('*')
      .eq('market', market)
      .order('role_type_id')
    return (data ?? []) as HRBudgetRange[]
  } catch {
    return []
  }
}

export async function fetchHRRoleTypes(supabase: SupabaseClient): Promise<HRRoleType[]> {
  try {
    const { data } = await supabase.from('hr_role_types').select('*').order('name')
    return (data ?? []) as HRRoleType[]
  } catch {
    return []
  }
}

// ── Activity ────────────────────────────────────────────────────

export async function fetchHRCandidateActivity(
  supabase: SupabaseClient,
  candidateId: string
): Promise<HRCandidateActivity[]> {
  try {
    const { data } = await supabase
      .from('hr_candidate_activity')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(50)
    return (data ?? []) as HRCandidateActivity[]
  } catch {
    return []
  }
}
