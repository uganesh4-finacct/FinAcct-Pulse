import { cn } from '@/lib/utils'
import type { RiskLevel, CloseStatus, AgingFlag, LoadStatus, StepStatus } from '@/lib/types'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('badge', className)}>
      {children}
    </span>
  )
}

export function RiskBadge({ level }: { level: RiskLevel | null | undefined }) {
  const config = {
    red:    { label: 'Delayed',  cls: 'bg-red-950 text-red-400 border border-red-900' },
    yellow: { label: 'At Risk',  cls: 'bg-yellow-950 text-yellow-400 border border-yellow-900' },
    green:  { label: 'On Track', cls: 'bg-green-950 text-green-400 border border-green-900' },
  }
  const c = config[level ?? 'green']
  return <span className={cn('badge', c.cls)}>{c.label}</span>
}

export function StatusBadge({ status }: { status: CloseStatus | null | undefined }) {
  const config: Record<string, { label: string; cls: string }> = {
    on_track: { label: 'On Track', cls: 'bg-green-950 text-green-400 border border-green-900' },
    at_risk:  { label: 'At Risk',  cls: 'bg-yellow-950 text-yellow-400 border border-yellow-900' },
    delayed:  { label: 'Delayed',  cls: 'bg-red-950 text-red-400 border border-red-900' },
    complete: { label: 'Complete', cls: 'bg-blue-950 text-blue-400 border border-blue-900' },
  }
  const c = config[status ?? 'on_track'] ?? config['on_track']
  return <span className={cn('badge', c.cls)}>{c.label}</span>
}

export function AgingBadge({ flag, days }: { flag: AgingFlag | null | undefined; days?: number | null }) {
  const config = {
    red:    { cls: 'bg-red-950 text-red-400 border border-red-900' },
    yellow: { cls: 'bg-yellow-950 text-yellow-400 border border-yellow-900' },
    green:  { cls: 'bg-green-950 text-green-400 border border-green-900' },
  }
  const c = config[flag ?? 'green']
  const label = days != null ? `${days}d` : flag === 'red' ? 'Overdue' : flag === 'yellow' ? 'Follow Up' : 'Current'
  return <span className={cn('badge', c.cls)}>{label}</span>
}

export function LoadBadge({ status }: { status: LoadStatus }) {
  const config: Record<LoadStatus, { label: string; cls: string }> = {
    overloaded:  { label: 'Overloaded',   cls: 'bg-red-950 text-red-400 border border-red-900' },
    at_capacity: { label: 'At Capacity',  cls: 'bg-yellow-950 text-yellow-400 border border-yellow-900' },
    normal:      { label: 'Normal',       cls: 'bg-green-950 text-green-400 border border-green-900' },
  }
  const c = config[status]
  return <span className={cn('badge', c.cls)}>{c.label}</span>
}

export function StepDot({ status }: { status: StepStatus }) {
  const colors: Record<StepStatus, string> = {
    complete:    'bg-green-500',
    in_progress: 'bg-blue-500',
    blocked:     'bg-orange-500',
    returned:    'bg-red-500',
    not_started: 'bg-gray-700',
  }
  return (
    <div className={cn('w-5 h-5 rounded-sm flex-shrink-0', colors[status])} title={status.replace('_', ' ')} />
  )
}

export function VerticalDot({ vertical }: { vertical: string }) {
  const colors: Record<string, string> = {
    restaurant: 'bg-orange-500',
    insurance:  'bg-blue-500',
    property:   'bg-purple-500',
    saas_ites:  'bg-teal-500',
  }
  return <span className={cn('inline-block w-2 h-2 rounded-full mr-1.5', colors[vertical] ?? 'bg-gray-500')} />
}
