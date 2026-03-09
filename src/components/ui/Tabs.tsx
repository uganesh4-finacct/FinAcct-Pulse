'use client';

import { cn } from '@/lib/utils';

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function Tabs({ value, onChange, options, className }: TabsProps) {
  return (
    <div
      className={cn(
        'inline-flex gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800',
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Pill-style tabs (e.g. for Positions | Pipeline | Candidates) */
export function TabsPills({
  value,
  onChange,
  options,
  className,
}: TabsProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-all duration-150',
            value === opt.value
              ? 'bg-violet-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
