// ============================================================
// FinAcct Pulse — TypeScript Types
// Mirrors the Supabase PostgreSQL schema exactly.
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type Role = 'admin' | 'reviewer' | 'coordinator' | 'owner' | 'support'
export type Entity = 'us' | 'india'
export type Vertical = 'restaurant' | 'insurance' | 'property' | 'saas_ites'
export type PaymentMethod = 'qbo' | 'invoice_ach' | 'auto_ach' | 'other'
export type CloseStatus = 'on_track' | 'at_risk' | 'delayed' | 'complete'
export type RiskLevel = 'green' | 'yellow' | 'red'
export type StepStatus = 'not_started' | 'in_progress' | 'complete' | 'blocked' | 'returned'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
export type AgingFlag = 'green' | 'yellow' | 'red'
export type TpTransferStatus = 'pending' | 'transferred' | 'confirmed'
export type LoadStatus = 'normal' | 'at_capacity' | 'overloaded'

// ── Table Row Types ──────────────────────────────────────────

export interface TeamMember {
  id: string
  auth_user_id: string | null
  name: string
  email: string
  role: Role
  role_title: string
  entity: Entity
  vertical_focus: Vertical[] | null
  active: boolean
  created_at: string
  /** User management: status for invite flow */
  status?: 'active' | 'invited' | 'inactive'
  department?: string | null
  reports_to_id?: string | null
}

export interface Client {
  id: string
  name: string
  vertical: Vertical
  assigned_owner_id: string | null
  assigned_coordinator_id: string | null
  reviewer_id: string | null
  monthly_fee: number
  india_tp_transfer: number   // generated: monthly_fee * 0.9
  payment_method: PaymentMethod | null
  contract_start_date: string | null
  deadline_day: number
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MonthlyClose {
  id: string
  client_id: string
  month_year: string
  docs_received: boolean
  bookkeeping_complete: boolean
  bank_reconciled: boolean
  payroll_posted: boolean
  ar_ap_updated: boolean
  draft_ready: boolean
  reviewed: boolean
  delivered: boolean
  deadline_date: string
  delivered_date: string | null
  invoice_sent: boolean
  invoice_sent_date: string | null
  status: CloseStatus
  risk_level: RiskLevel
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CloseStep {
  id: string
  monthly_close_id: string
  client_id: string
  month_year: string
  step_number: number
  step_name: string
  assigned_owner_id: string | null
  due_date: string | null
  completion_date: string | null
  status: StepStatus
  return_count: number
  returned_by_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  client_id: string
  month_year: string
  invoice_date: string
  amount: number
  due_date: string
  paid_date: string | null
  payment_status: PaymentStatus
  outstanding_days: number
  aging_flag: AgingFlag
  tp_transfer_amount: number | null
  tp_transfer_status: TpTransferStatus
  tp_transfer_date: string | null
  payment_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientAssignment {
  id: string
  client_id: string
  team_member_id: string
  assigned_at: string
}

// ── View Types ────────────────────────────────────────────────

export interface ClientRiskRow {
  client_id: string
  client_name: string
  vertical: Vertical
  monthly_fee: number
  india_tp_transfer: number
  deadline_day: number
  owner_name: string | null
  close_id: string | null
  month_year: string | null
  close_status: CloseStatus | null
  risk_level: RiskLevel | null
  deadline_date: string | null
  days_to_deadline: number | null
  steps_complete: number | null
  invoice_status: PaymentStatus | null
  invoice_outstanding_days: number | null
  invoice_aging: AgingFlag | null
  invoice_amount: number | null
  tp_transfer_status: TpTransferStatus | null
}

export interface WorkloadRow {
  team_member_id: string
  name: string
  role: Role
  role_title: string
  entity: Entity
  client_count: number
  total_billing: number
  total_tp: number
  open_steps: number
  overdue_steps: number
  returned_steps: number
  load_status: LoadStatus
}

export interface DashboardSummary {
  total_active_clients: number
  total_monthly_billing: number
  total_monthly_tp: number
  clients_delayed: number
  clients_at_risk: number
  clients_complete: number
  invoices_unpaid: number
  ar_outstanding: number
  invoices_overdue_red: number
  tp_transfers_pending: number
}

export interface InvoiceAgingRow {
  client_id: string
  client_name: string
  vertical: Vertical
  payment_method: PaymentMethod | null
  monthly_fee: number
  india_tp_transfer: number
  owner_name: string | null
  invoice_id: string | null
  month_year: string | null
  invoice_date: string | null
  amount: number | null
  due_date: string | null
  paid_date: string | null
  payment_status: PaymentStatus | null
  outstanding_days: number | null
  aging_flag: AgingFlag | null
  tp_transfer_amount: number | null
  tp_transfer_status: TpTransferStatus | null
  tp_transfer_date: string | null
  payment_reference: string | null
}

// ── User Management / Settings ───────────────────────────────
export type UserManagementRole = 'admin' | 'manager' | 'contributor'
export type UserStatus = 'active' | 'invited' | 'inactive'

export const USER_MANAGEMENT_ROLES: UserManagementRole[] = ['admin', 'manager', 'contributor']
export const USER_MANAGEMENT_ROLE_LABELS: Record<UserManagementRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  contributor: 'Contributor',
}

export const MODULES = [
  'Dashboard', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance', 'IT', 'Settings',
] as const
export type ModuleKey = typeof MODULES[number]

export const ACTIONS = ['View', 'Add', 'Edit', 'Delete', 'Approve', 'Export'] as const
export type ActionKey = typeof ACTIONS[number]

export const SENSITIVE_ACCESS = ['Salary', 'Budget', 'Revenue', 'Pricing', 'Profitability'] as const
export type SensitiveKey = typeof SENSITIVE_ACCESS[number]

export interface UserPermissionsRow {
  id: string
  team_member_id: string
  module_access: string[]
  actions: string[]
  sensitive_access: string[]
  created_at: string
  updated_at: string
}

export function mapUserRoleToPulseRole(role: UserManagementRole): Role {
  switch (role) {
    case 'admin': return 'admin'
    case 'manager': return 'reviewer'
    case 'contributor': return 'coordinator'
    default: return 'coordinator'
  }
}

export function mapPulseRoleToUserRole(role: Role): UserManagementRole {
  switch (role) {
    case 'admin': return 'admin'
    case 'reviewer': return 'manager'
    case 'coordinator': return 'contributor'
    case 'owner': return 'manager'
    case 'support': return 'contributor'
    default: return 'contributor'
  }
}

// ── Supabase Database Type Map ────────────────────────────────

export type Database = {
  public: {
    Tables: {
      team_members:       { Row: TeamMember;       Insert: Partial<TeamMember>;       Update: Partial<TeamMember> }
      user_permissions:   { Row: UserPermissionsRow; Insert: Partial<UserPermissionsRow>; Update: Partial<UserPermissionsRow> }
      clients:            { Row: Client;            Insert: Partial<Client>;            Update: Partial<Client> }
      monthly_closes:     { Row: MonthlyClose;      Insert: Partial<MonthlyClose>;      Update: Partial<MonthlyClose> }
      close_steps:        { Row: CloseStep;         Insert: Partial<CloseStep>;         Update: Partial<CloseStep> }
      invoices:           { Row: Invoice;           Insert: Partial<Invoice>;           Update: Partial<Invoice> }
      client_assignments: { Row: ClientAssignment;  Insert: Partial<ClientAssignment>;  Update: Partial<ClientAssignment> }
    }
    Views: {
      v_client_risk:       { Row: ClientRiskRow }
      v_workload_by_owner: { Row: WorkloadRow }
      v_dashboard_summary: { Row: DashboardSummary }
      v_invoice_aging:     { Row: InvoiceAgingRow }
    }
    Functions: {}
    Enums: {}
  }
}

// ── UI / Utility Types ────────────────────────────────────────

export const VERTICAL_LABELS: Record<Vertical, string> = {
  restaurant: 'Restaurant',
  insurance:  'Insurance',
  property:   'Property Mgmt',
  saas_ites:  'SaaS / ITES',
}

export const STEP_NAMES: Record<number, string> = {
  1: 'Docs Received',
  2: 'Bookkeeping',
  3: 'Bank Recon',
  4: 'Payroll Posted',
  5: 'AR/AP Updated',
  6: 'Draft Ready',
  7: 'Review & Approval',
  8: 'Delivered',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  qbo:         'QBO',
  invoice_ach: 'Invoice / ACH',
  auto_ach:    'Auto ACH',
  other:       'Other',
}

// ============================================================
// HR MODULE TYPES
// ============================================================

export type RequisitionStatus =
  | 'Open'
  | 'Sourcing'
  | 'Interviews_Scheduled'
  | 'Offers_Out'
  | 'Closed_Hired'
  | 'On_Hold'
  | 'Cancelled'

export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead'
export type Urgency = 'Low' | 'Medium' | 'High' | 'Critical'
export type CandidateStatus =
  | 'New'
  | 'Reviewed'
  | 'Interview_Scheduled'
  | 'Interview_Completed'
  | 'Offered'
  | 'Rejected'
  | 'On_Hold'

export type ActivityAction =
  | 'Created'
  | 'Status_Changed'
  | 'Budget_Updated'
  | 'Candidate_Added'
  | 'Interview_Scheduled'
  | 'Offer_Released'
  | 'Note_Added'
  | 'Candidate_Rejected'

export interface Requisition {
  id: string
  prospect_name: string
  job_title: string
  skill_requirements: string[]
  experience_level: ExperienceLevel
  city: string
  budget_amount: number
  client_billing_rate?: number // Admin only
  urgency: Urgency
  status: RequisitionStatus
  created_by?: string
  notes?: string
  created_at: string
  updated_at: string
  candidates?: Candidate[]
  market_rate?: MarketRate
}

export interface Candidate {
  id: string
  requisition_id: string
  full_name: string
  email?: string
  phone?: string
  experience_years?: number
  current_salary?: number
  expected_salary?: number
  cv_file_url?: string
  match_score?: number
  match_notes?: string
  status: CandidateStatus
  interview_feedback?: string
  offer_amount?: number
  offer_date?: string
  recruiter_id?: string
  created_at: string
  updated_at: string
}

export interface MarketRate {
  id: string
  job_title: string
  city: string
  market_rate_min: number
  market_rate_max: number
  currency: string
  last_updated: string
}

export interface RequisitionActivityLog {
  id: string
  requisition_id: string
  action: ActivityAction
  performed_by?: string
  details?: Record<string, unknown>
  created_at: string
}

export interface HRDashboardSummary {
  open_reqs: number
  sourcing: number
  in_interviews: number
  offers_out: number
  closed_this_month: number
  total_active: number
  critical_open: number
  stale_reqs: number
}

export const requisitionStatusConfig: Record<RequisitionStatus, { label: string; color: string }> = {
  Open:                 { label: 'Open',              color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Sourcing:             { label: 'Sourcing',           color: 'bg-violet-50 text-violet-700 border-violet-200' },
  Interviews_Scheduled: { label: 'Interviews',         color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Offers_Out:           { label: 'Offer Out',          color: 'bg-orange-50 text-orange-700 border-orange-200' },
  Closed_Hired:         { label: 'Hired ✓',            color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  On_Hold:              { label: 'On Hold',            color: 'bg-slate-100 text-slate-500 border-slate-200' },
  Cancelled:            { label: 'Cancelled',          color: 'bg-red-50 text-red-600 border-red-200' },
}

export const urgencyConfig: Record<Urgency, { label: string; color: string }> = {
  Low:      { label: 'Low',      color: 'text-slate-400' },
  Medium:   { label: 'Medium',   color: 'text-amber-500' },
  High:     { label: 'High',     color: 'text-orange-600' },
  Critical: { label: 'Critical', color: 'text-red-600 font-bold' },
}

export const candidateStatusConfig: Record<CandidateStatus, { label: string; color: string }> = {
  New:                  { label: 'New',              color: 'bg-slate-100 text-slate-600' },
  Reviewed:             { label: 'Reviewed',         color: 'bg-blue-50 text-blue-700' },
  Interview_Scheduled:  { label: 'Interview Set',    color: 'bg-amber-50 text-amber-700' },
  Interview_Completed:  { label: 'Interviewed',      color: 'bg-violet-50 text-violet-700' },
  Offered:              { label: 'Offered',          color: 'bg-orange-50 text-orange-700' },
  Rejected:             { label: 'Rejected',         color: 'bg-red-50 text-red-600' },
  On_Hold:              { label: 'On Hold',            color: 'bg-slate-100 text-slate-500' },
}

// ============================================================
// MARKETING MODULE TYPES
// ============================================================

export type LeadStatus =
  | 'New' | 'Contacted' | 'Qualified' | 'Proposal_Sent'
  | 'Negotiating' | 'Won' | 'Lost' | 'On_Hold'

export type ProposalStatus =
  | 'Draft' | 'Sent' | 'Under_Review' | 'Accepted' | 'Rejected' | 'Revised'

export type CampaignStatus =
  | 'Planning' | 'Active' | 'Paused' | 'Completed' | 'Cancelled'

export type LeadPriority = 'Low' | 'Medium' | 'High'

export type LeadSource =
  | 'Referral' | 'LinkedIn' | 'Cold Outreach' | 'Inbound'
  | 'Event' | 'Partner' | 'Other'

export interface Lead {
  id: string
  company_name: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  vertical?: string
  source?: LeadSource
  referral_source_name?: string
  city?: string
  estimated_monthly_value?: number
  status: LeadStatus
  priority: LeadPriority
  assigned_to?: string
  notes?: string
  lost_reason?: string
  won_date?: string
  ops_activated: boolean
  ops_activated_date?: string
  ops_client_id?: string
  created_at: string
  updated_at: string
  proposals?: Proposal[]
}

export interface Proposal {
  id: string
  lead_id: string
  proposal_date: string
  proposed_monthly_value?: number
  scope_summary?: string
  status: ProposalStatus
  sent_date?: string
  follow_up_date?: string
  decision_date?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  type: string
  status: CampaignStatus
  target_vertical?: string
  start_date?: string
  end_date?: string
  budget?: number
  leads_generated: number
  notes?: string
  owned_by?: string
  created_at: string
  updated_at: string
}

export interface ReferralSource {
  id: string
  name: string
  type?: string
  email?: string
  phone?: string
  total_referrals: number
  total_won: number
  total_value_won: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface MarketingDashboardSummary {
  active_leads: number
  total_won: number
  total_lost: number
  proposals_pending: number
  pending_ops_handoff: number
  pipeline_value: number
  won_value: number
  high_priority_open: number
}

export const leadStatusConfig: Record<LeadStatus, { label: string; color: string }> = {
  New:           { label: 'New',           color: 'bg-slate-100 text-slate-600 border-slate-200' },
  Contacted:     { label: 'Contacted',     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Qualified:     { label: 'Qualified',     color: 'bg-violet-50 text-violet-700 border-violet-200' },
  Proposal_Sent: { label: 'Proposal Sent', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Negotiating:   { label: 'Negotiating',   color: 'bg-orange-50 text-orange-700 border-orange-200' },
  Won:           { label: 'Won ✓',         color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Lost:          { label: 'Lost',          color: 'bg-red-50 text-red-600 border-red-200' },
  On_Hold:       { label: 'On Hold',       color: 'bg-slate-100 text-slate-400 border-slate-200' },
}

export const proposalStatusConfig: Record<ProposalStatus, { label: string; color: string }> = {
  Draft:        { label: 'Draft',        color: 'bg-slate-100 text-slate-500' },
  Sent:         { label: 'Sent',         color: 'bg-blue-50 text-blue-700' },
  Under_Review: { label: 'Under Review', color: 'bg-amber-50 text-amber-700' },
  Accepted:     { label: 'Accepted ✓',   color: 'bg-emerald-50 text-emerald-700' },
  Rejected:     { label: 'Rejected',     color: 'bg-red-50 text-red-600' },
  Revised:      { label: 'Revised',      color: 'bg-violet-50 text-violet-700' },
}

export const campaignStatusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  Planning:   { label: 'Planning',   color: 'bg-slate-100 text-slate-500' },
  Active:     { label: 'Active',     color: 'bg-emerald-50 text-emerald-700' },
  Paused:     { label: 'Paused',     color: 'bg-amber-50 text-amber-700' },
  Completed:  { label: 'Completed',  color: 'bg-blue-50 text-blue-700' },
  Cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-600' },
}
