import { cn } from '@/lib/utils';

export function TableContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl overflow-hidden dark:bg-slate-900 dark:border-slate-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Table({
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full text-sm', className)} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-slate-50/80 border-b border-slate-200 dark:bg-slate-800/80 dark:border-slate-700',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props}>{children}</tbody>;
}

export function TableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

type TableCellVariant = 'default' | 'primary' | 'secondary' | 'muted' | 'mono';

export function TableCell({
  className,
  variant = 'default',
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  variant?: TableCellVariant;
}) {
  const variantClasses: Record<TableCellVariant, string> = {
    default: 'text-slate-700 dark:text-slate-300',
    primary: 'font-medium text-slate-900 dark:text-white',
    secondary: 'text-slate-500 dark:text-slate-400',
    muted: 'text-slate-400 dark:text-slate-500',
    mono: 'font-mono text-slate-700 dark:text-slate-300',
  };
  return (
    <td
      className={cn(
        'px-4 py-3.5 text-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}
