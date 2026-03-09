// ============================================================
// FinAcct Pulse — HR Module Permissions
// Role-based access for HR & Hiring section
// ============================================================

export type HRAllowedRole = 'admin' | 'reviewer' | 'hr_manager' | 'owner'

const ROLES_FULL_HR: HRAllowedRole[] = ['admin', 'reviewer', 'hr_manager']
const ROLES_CAN_SEE_SALARY: HRAllowedRole[] = ['admin', 'reviewer', 'hr_manager']
const ROLES_CAN_APPROVE_REQUESTS: HRAllowedRole[] = ['admin']
const ROLES_CAN_ACCESS_TEMPLATES: HRAllowedRole[] = ['admin', 'hr_manager']

export function canAccessHRDashboard(role: string): boolean {
  return ROLES_FULL_HR.includes(role as HRAllowedRole)
}

export function canAccessHRRequests(role: string): boolean {
  return ROLES_FULL_HR.includes(role as HRAllowedRole) || role === 'owner'
}

export function canAccessHRRequisitions(role: string): boolean {
  return ROLES_FULL_HR.includes(role as HRAllowedRole)
}

export function canAccessHRCandidates(role: string): boolean {
  return ROLES_FULL_HR.includes(role as HRAllowedRole) || role === 'owner'
}

export function canAccessHRTemplates(role: string): boolean {
  return ROLES_CAN_ACCESS_TEMPLATES.includes(role as HRAllowedRole)
}

export function canAccessHRBudget(role: string): boolean {
  return ROLES_FULL_HR.includes(role as HRAllowedRole)
}

/** Owner sees only own requests/candidates; others see all (within RLS). */
export function isOwnerScopedHR(role: string): boolean {
  return role === 'owner'
}

export function canSeeSalaryAndBudget(role: string): boolean {
  return ROLES_CAN_SEE_SALARY.includes(role as HRAllowedRole)
}

/** Hiring Tracker: salary fields only for admin and hr_manager (not reviewer). */
export function canSeeHiringSalary(role: string): boolean {
  return role === 'admin' || role === 'hr_manager'
}

/** Hiring Tracker: create/edit positions and candidates (reviewer is read-only). */
export function canEditHiring(role: string): boolean {
  return role === 'admin' || role === 'hr_manager'
}

/** Hiring Tracker: delete positions/candidates (admin only). */
export function canDeleteHiring(role: string): boolean {
  return role === 'admin'
}

export function canApproveStaffingRequests(role: string): boolean {
  return ROLES_CAN_APPROVE_REQUESTS.includes(role as HRAllowedRole)
}

/** Team Directory: view hierarchy, by-client, all members */
export function canAccessHRTeam(role: string): boolean {
  return ['admin', 'reviewer', 'hr_manager'].includes(role)
}

/** Team Directory: add/edit team members */
export function canEditHRTeam(role: string): boolean {
  return role === 'admin' || role === 'hr_manager'
}

/** Team Directory: delete or deactivate (admin only) */
export function canDeleteOrDeactivateHRTeam(role: string): boolean {
  return role === 'admin'
}

export function showHRSection(role: string): boolean {
  return (
    ROLES_FULL_HR.includes(role as HRAllowedRole) ||
    role === 'owner'
  )
}

// ============================================================
// Finance Module Permissions
// ============================================================
export function canAccessFinance(role: string): boolean {
  return role === 'admin' || role === 'reviewer'
}

export function canEditFinance(role: string): boolean {
  return role === 'admin' || role === 'reviewer'
}

export function canDeleteFinanceBudgets(role: string): boolean {
  return role === 'admin'
}

// ============================================================
// IT Module Permissions
// ============================================================
export function canAccessIT(role: string): boolean {
  return role === 'admin' || role === 'reviewer' || role === 'it_person'
}

export function canEditIT(role: string): boolean {
  return role === 'admin' || role === 'it_person'
}

export function canDeleteIT(role: string): boolean {
  return role === 'admin'
}
