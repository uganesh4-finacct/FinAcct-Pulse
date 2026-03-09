import { clsx, type ClassValue } from 'clsx'
import type { RiskLevel, CloseStatus, StepStatus, AgingFlag, LoadStatus, Vertical, PaymentMethod } from './types'

// ── Class merging ────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ── Currency formatting ───────────────────────────────────────
export function formatCurrency(value: number | null | undefined, compact = false): string {
  if (value == null) return '—'
  if (compact && value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'k'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// ── Date formatting ───────────────────────────────────────────
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function currentMonthYear(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ── Risk / Status color maps ──────────────────────────────────

export function riskBadgeClass(level: RiskLevel | null | undefined): string {
  switch (level) {
    case 'red':    return 'bg-red-950 text-red-400 border border-red-900'
    case 'yellow': return 'bg-yellow-950 text-yellow-400 border border-yellow-900'
    case 'green':  return 'bg-green-950 text-green-400 border border-green-900'
    default:       return 'bg-gray-900 text-gray-400 border border-gray-800'
  }
}

export function riskRowClass(level: RiskLevel | null | undefined): string {
  switch (level) {
    case 'red':    return 'bg-red-950/30 border-l-2 border-l-red-500'
    case 'yellow': return 'bg-yellow-950/20 border-l-2 border-l-yellow-500'
    default:       return ''
  }
}

export function riskDotClass(level: RiskLevel | null | undefined): string {
  switch (level) {
    case 'red':    return 'bg-red-500'
    case 'yellow': return 'bg-yellow-500'
    case 'green':  return 'bg-green-500'
    default:       return 'bg-gray-500'
  }
}

export function closeStatusLabel(status: CloseStatus | null | undefined): string {
  switch (status) {
    case 'on_track': return 'On Track'
    case 'at_risk':  return 'At Risk'
    case 'delayed':  return 'Delayed'
    case 'complete': return 'Complete'
    default:         return 'No Close'
  }
}

export function stepStatusClass(status: StepStatus): string {
  switch (status) {
    case 'complete':    return 'bg-green-500'
    case 'in_progress': return 'bg-blue-500'
    case 'blocked':     return 'bg-orange-500'
    case 'returned':    return 'bg-red-500'
    default:            return 'bg-gray-700'
  }
}

export function agingBadgeClass(flag: AgingFlag | null | undefined): string {
  switch (flag) {
    case 'red':    return 'bg-red-950 text-red-400 border border-red-900'
    case 'yellow': return 'bg-yellow-950 text-yellow-400 border border-yellow-900'
    default:       return 'bg-green-950 text-green-400 border border-green-900'
  }
}

export function loadStatusClass(status: LoadStatus): string {
  switch (status) {
    case 'overloaded':   return 'text-red-400'
    case 'at_capacity':  return 'text-yellow-400'
    default:             return 'text-green-400'
  }
}

export function loadStatusLabel(status: LoadStatus): string {
  switch (status) {
    case 'overloaded':  return 'Overloaded'
    case 'at_capacity': return 'At Capacity'
    default:            return 'Normal'
  }
}

// ── Vertical color dots ──────────────────────────────────────

export function verticalColor(vertical: Vertical): string {
  switch (vertical) {
    case 'restaurant': return 'bg-orange-500'
    case 'insurance':  return 'bg-blue-500'
    case 'property':   return 'bg-purple-500'
    case 'saas_ites':  return 'bg-teal-500'
  }
}

// ── Steps progress ────────────────────────────────────────────

export function stepsProgress(complete: number | null): string {
  const n = complete ?? 0
  return `${n} / 8`
}

export function stepsPercent(complete: number | null): number {
  return Math.round(((complete ?? 0) / 8) * 100)
}
