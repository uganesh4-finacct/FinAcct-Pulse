import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'violet'
  | 'green'
  | 'yellow'
  | 'red'
  | 'blue'
  | 'amber'
  | 'emerald'
  | 'slate'
  | 'orange';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

/** Status-style badges */
export const statusBadgeVariants = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
  error: 'bg-red-50 text-red-700',
} as const;

/** Priority-style badges */
export const priorityBadgeVariants = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  high: 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
} as const;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
