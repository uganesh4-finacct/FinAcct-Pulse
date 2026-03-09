import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden',
        'hover:shadow-md transition-shadow duration-200',
        'dark:bg-slate-900 dark:border-slate-800',
        variant === 'elevated' && 'shadow-md dark:shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-5 py-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-sm font-semibold text-slate-900 dark:text-white',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function StatCard({
  className,
  accent = 'violet',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  accent?: 'violet' | 'red' | 'amber' | 'emerald' | 'blue' | 'none';
}) {
  const accentColors: Record<string, string> = {
    violet: 'bg-violet-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    none: '',
  };
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden',
        'dark:bg-slate-900 dark:border-slate-800',
        className
      )}
      {...props}
    >
      {accent !== 'none' && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
            accentColors[accent]
          )}
        />
      )}
      {children}
    </div>
  );
}
