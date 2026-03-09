// ============================================================
// FinAcct Pulse — Sidebar Navigation (clean, department-based)
// ============================================================
// Icon: Lucide icon name (e.g. LayoutDashboard, Building2)
// Sections are collapsible by default; filter by user_permissions.module_access.
// SETTINGS is admin-only.
// ============================================================

export type NavItem = {
  href: string
  label: string
  icon: string // Lucide icon name
}

export type NavSection = {
  group: string
  items: NavItem[]
  collapsible: boolean
  storageKey: string
  module?: string // for user_permissions.module_access filter
  adminOnly?: boolean
}

// 1. Dashboard (single link)
const DASHBOARD: NavSection = {
  group: 'Dashboard',
  collapsible: false,
  storageKey: 'sidebar_dashboard',
  module: 'Dashboard',
  items: [
    { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  ],
}

// 2. MARKETING
const MARKETING: NavSection = {
  group: 'MARKETING',
  collapsible: true,
  storageKey: 'sidebar_collapsed_MARKETING',
  module: 'Marketing',
  items: [
    { href: '/marketing/campaigns', label: 'Campaigns', icon: 'Megaphone' },
    { href: '/marketing/leads', label: 'Leads', icon: 'Users' },
  ],
}

// 3. SALES
const SALES: NavSection = {
  group: 'SALES',
  collapsible: true,
  storageKey: 'sidebar_collapsed_SALES',
  module: 'Sales',
  items: [
    { href: '/sales/pipeline', label: 'Pipeline', icon: 'Kanban' },
    { href: '/sales/proposals', label: 'Proposals', icon: 'FileText' },
  ],
}

// 4. OPERATIONS
const OPERATIONS: NavSection = {
  group: 'OPERATIONS',
  collapsible: true,
  storageKey: 'sidebar_collapsed_OPERATIONS',
  module: 'Operations',
  items: [
    { href: '/clients', label: 'Clients', icon: 'Building2' },
    { href: '/close-tracker', label: 'Close Tracker', icon: 'ClipboardCheck' },
    { href: '/client-updates', label: 'Client Updates', icon: 'Calendar' },
    { href: '/operations/weekly-reports', label: 'Weekly Reports', icon: 'FileText' },
  ],
}

// 5. HR & HIRING
const HR_HIRING: NavSection = {
  group: 'HR & HIRING',
  collapsible: true,
  storageKey: 'sidebar_collapsed_HR',
  module: 'HR',
  items: [
    { href: '/hr', label: 'HR Dashboard', icon: 'LayoutDashboard' },
    { href: '/hr/hiring', label: 'Hiring Tracker', icon: 'UserPlus' },
    { href: '/hr/team', label: 'Team Directory', icon: 'Users' },
  ],
}

// 6. FINANCE
const FINANCE: NavSection = {
  group: 'FINANCE',
  collapsible: true,
  storageKey: 'sidebar_collapsed_FINANCE',
  module: 'Finance',
  items: [
    { href: '/finance', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/finance/clients', label: 'Client Billing', icon: 'Users' },
    { href: '/finance/billing', label: 'Billing', icon: 'Receipt' },
    { href: '/finance/expenses', label: 'Expenses', icon: 'CreditCard' },
    { href: '/finance/india-tp', label: 'India TP', icon: 'ArrowRightLeft' },
    { href: '/finance/budgets', label: 'Budgets', icon: 'PiggyBank' },
    { href: '/finance/reports', label: 'Reports', icon: 'FileBarChart' },
  ],
}

// 7. IT & ASSETS
const IT_ASSETS: NavSection = {
  group: 'IT & ASSETS',
  collapsible: true,
  storageKey: 'sidebar_collapsed_IT',
  module: 'IT',
  items: [
    { href: '/it', label: 'Dashboard', icon: 'Monitor' },
    { href: '/it/hardware', label: 'Hardware', icon: 'Laptop' },
    { href: '/it/domains', label: 'Domains', icon: 'Globe' },
  ],
}

// 8. SETTINGS (admin only)
const SETTINGS: NavSection = {
  group: 'SETTINGS',
  collapsible: true,
  storageKey: 'sidebar_collapsed_SETTINGS',
  module: 'Settings',
  adminOnly: true,
  items: [
    { href: '/settings/users', label: 'User Management', icon: 'Settings' },
  ],
}

// Single ordered list — filter by module_access and admin in Sidebar
export const SIDEBAR_NAV: NavSection[] = [
  DASHBOARD,
  MARKETING,
  SALES,
  OPERATIONS,
  HR_HIRING,
  FINANCE,
  IT_ASSETS,
  SETTINGS,
]

/** Returns the nav section that contains the given path (for sub-nav pills). Excludes Dashboard and Settings. */
export function getSectionForPath(pathname: string): NavSection | null {
  const normalized = pathname.replace(/\/$/, '') || '/'
  for (const section of SIDEBAR_NAV) {
    if (section.group === 'Dashboard' || section.adminOnly) continue
    const hasMatch = section.items.some(
      (item) => normalized === item.href.replace(/\/$/, '') || normalized.startsWith(item.href.replace(/\/$/, '') + '/')
    )
    if (hasMatch) return section
  }
  return null
}

// Legacy export for any code that still expects ROLE_NAV (e.g. same structure for all roles)
export const ROLE_NAV: Record<string, NavSection[]> = {
  default: SIDEBAR_NAV,
  admin: SIDEBAR_NAV,
  reviewer: SIDEBAR_NAV,
  owner: SIDEBAR_NAV,
  coordinator: SIDEBAR_NAV,
  marketing: SIDEBAR_NAV,
  hr_manager: SIDEBAR_NAV,
  it_person: SIDEBAR_NAV,
  support: SIDEBAR_NAV,
}
