// ============================================================
// FinAcct Pulse — HR & Hiring Module Types
// Per HR & HIRING MODULE SPECIFICATION
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type HRRequestType = 'New Client' | 'Expansion' | 'Backfill' | 'Proactive'
export type HRRequestStatus =
  | 'Pending'
  | 'pending_approval'
  | 'Approved'
  | 'Rejected'
  | 'Hold'
  | 'filled'
  | 'on_hold'
  | 'cancelled'
  | 'in_hiring'
export type HRMarket = 'India' | 'US'
export type HRServiceType = 'Accounting' | 'Non-Accounting' | 'Tax' | 'Advisory'
export type HRUrgency = 'Critical' | 'High' | 'Medium' | 'Low'

export type HRRequisitionStatus =
  | 'Open'
  | 'Sourcing'
  | 'Screening'
  | 'Technical'
  | 'Offer'
  | 'Closed_Hired'
  | 'Cancelled'

export type HRCandidateStatus =
  | 'sourced'
  | 'screening'
  | 'technical'
  | 'offer_pending_approval'
  | 'offer_sent'
  | 'accepted'
  | 'joined'
  | 'rejected'

export type HRCandidateSource = 'LinkedIn' | 'Naukri' | 'Referral' | 'Other'

// ── Staffing Request ───────────────────────────────────────────

export interface HRStaffingRequest {
  id: string
  request_type: HRRequestType
  client_id: string
  role_type_id: string | null
  role_title: string
  positions_needed: number
  market: HRMarket
  service_type: HRServiceType
  estimated_monthly_fee: number | null
  estimated_start_date: string | null
  urgency: HRUrgency
  justification: string | null
  status: HRRequestStatus
  raised_by_id: string
  resolution: 'Hire New' | 'Assign Existing' | null
  assigned_team_member_id: string | null
  resolution_notes: string | null
  approved_by_id?: string | null
  approved_date?: string | null
  linked_requisition_id?: string | null
  resolution_type?: string | null
  created_at: string
  updated_at: string
  // Joined
  client_name?: string
  client_vertical?: string
  raised_by_name?: string
}

// ── Requisition ────────────────────────────────────────────────

export interface HRRequisition {
  id: string
  staffing_request_id: string | null
  role_type_id: string | null
  title: string
  market: HRMarket
  vertical: string
  priority: HRUrgency
  experience_min_years: number | null
  experience_max_years: number | null
  target_start_date: string | null
  status: HRRequisitionStatus
  budget_monthly_min: number | null
  budget_monthly_max: number | null
  budget_annual_min: number | null
  budget_annual_max: number | null
  jd_summary: string | null
  jd_full_url: string | null
  skills: string[]
  created_at: string
  updated_at: string
  // Joined
  client_name?: string
  role_type_name?: string
  sourced_count?: number
  screening_count?: number
  technical_count?: number
  offer_count?: number
  hired_count?: number
}

// ── Candidate ───────────────────────────────────────────────────

export interface HRCandidate {
  id: string
  requisition_id: string
  full_name: string
  email: string | null
  phone: string | null
  resume_url: string | null
  current_company: string | null
  experience_summary: string | null
  tools_skills: string | null
  current_salary_monthly: number | null
  current_salary_annual: number | null
  expected_salary_monthly: number | null
  expected_salary_annual: number | null
  offer_salary_monthly: number | null
  offer_salary_annual: number | null
  notice_period_days: number | null
  source: HRCandidateSource | null
  status: HRCandidateStatus
  sourced_by_id: string | null
  stage_date: string | null
  // Offer approval (dynamic approvers)
  offer_approver_1_id?: string | null
  offer_approver_2_id?: string | null
  offer_approver_1_approved?: boolean
  offer_approver_2_approved?: boolean
  offer_approver_1_date?: string | null
  offer_approver_2_date?: string | null
  created_at: string
  updated_at: string
  // Joined
  requisition_title?: string
  offer_approver_1_name?: string
  offer_approver_2_name?: string
  sourced_by_name?: string
}

// ── JD Template ──────────────────────────────────────────────────

export interface HRJDTemplate {
  id: string
  role_type_id: string | null
  title: string
  market: HRMarket
  vertical: string
  experience_min_years: number | null
  experience_max_years: number | null
  core_skills: string[]
  jd_summary: string | null
  jd_full_url: string | null
  jd_full_text: string | null
  created_at: string
  updated_at: string
  role_type_name?: string
}

// ── Budget Range ────────────────────────────────────────────────

export type HRBudgetLevel = 'entry' | 'mid' | 'senior'

export interface HRBudgetRange {
  id: string
  role_type_id: string
  market: HRMarket
  level: HRBudgetLevel
  monthly_min: number
  monthly_max: number
  annual_min: number
  annual_max: number
  created_at: string
  updated_at: string
  role_type_name?: string
}

// ── Role Type ───────────────────────────────────────────────────

export interface HRRoleType {
  id: string
  name: string
  created_at?: string
}

// ── Dashboard & Views ───────────────────────────────────────────

export interface HRDashboardSummary {
  requests_pending: number
  open_requisitions: number
  sourced: number
  in_interview: number
  offers_pending: number
  joined_this_month: number
}

export interface HRPipelineByRequisition {
  requisition_id: string
  position_title: string
  sourced: number
  screening: number
  technical: number
  offer: number
  hired: number
  days_open: number
}

export interface HRAlert {
  id: string
  type: 'open_no_candidates' | 'offer_pending_long'
  message: string
  requisition_id: string | null
  candidate_id: string | null
  created_at: string
}

// ── Activity ────────────────────────────────────────────────────

export interface HRCandidateActivity {
  id: string
  candidate_id: string
  action: string
  details: Record<string, unknown> | null
  performed_by_id: string | null
  created_at: string
  performed_by_name?: string
}

// ── UI Config (Design System) ──────────────────────────────────

export const HR_PRIORITY_COLORS: Record<HRUrgency, string> = {
  Critical: '#ef4444',
  High: '#ef4444',
  Medium: '#d97706',
  Low: '#94a3b8',
}

export const HR_CANDIDATE_STATUS_COLORS: Record<HRCandidateStatus, string> = {
  sourced: '#64748b',
  screening: '#3b82f6',
  technical: '#8b5cf6',
  offer_pending_approval: '#f59e0b',
  offer_sent: '#06b6d4',
  accepted: '#10b981',
  joined: '#10b981',
  rejected: '#ef4444',
}

export const HR_MARKET_BADGE: Record<HRMarket, { bg: string; label: string }> = {
  India: { bg: '#f97316', label: '🇮🇳 India' },
  US: { bg: '#3b82f6', label: '🇺🇸 US' },
}

export const HR_REQUEST_STATUS_LABELS: Record<string, string> = {
  Pending: 'Pending',
  pending_approval: 'Pending Approval',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Hold: 'Hold',
  filled: 'Filled',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
  in_hiring: 'In Hiring',
}

export const HR_REQUISITION_STATUS_LABELS: Record<HRRequisitionStatus, string> = {
  Open: 'Open',
  Sourcing: 'Sourcing',
  Screening: 'Screening',
  Technical: 'Technical',
  Offer: 'Offer',
  Closed_Hired: 'Closed',
  Cancelled: 'Cancelled',
}

export const HR_CANDIDATE_STATUS_LABELS: Record<HRCandidateStatus, string> = {
  sourced: 'Sourced',
  screening: 'Screening',
  technical: 'Technical',
  offer_pending_approval: 'Offer Pending Approval',
  offer_sent: 'Offer Sent',
  accepted: 'Accepted',
  joined: 'Joined',
  rejected: 'Rejected',
}
