import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'violet' | 'red' | 'yellow' | 'green' | 'blue' | 'default';
  className?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  accent = 'default',
  className,
}: KpiCardProps) {
  const accentBar =
    accent !== 'default'
      ? 'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl'
      : '';
  const accentColors = {
    violet: 'bg-violet-500',
    red: 'bg-red-500',
    yellow: 'bg-amber-500',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    default: '',
  };

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        'dark:bg-slate-900 dark:border-slate-800',
        className
      )}
    >
      {accent !== 'default' && (
        <div
          className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', accentColors[accent])}
        />
      )}
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight font-[family-name:var(--font-sans)]">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
          {sub}
        </div>
      )}
    </div>
  );
}
