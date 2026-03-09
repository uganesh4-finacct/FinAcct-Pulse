'use client';

import { forwardRef } from 'react';
import { ChevronDown, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const labelClass =
  'block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5';

export const inputClass = cn(
  'h-10 px-3 text-sm w-full rounded-lg',
  'bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700',
  'placeholder:text-slate-300 dark:placeholder:text-slate-500',
  'focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500',
  'transition-all duration-150',
  'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-500'
);

export const selectClass = cn(
  'h-10 px-3 text-sm w-full rounded-lg appearance-none cursor-pointer',
  'bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700',
  'focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500',
  'transition-all duration-150',
  'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed'
);

export const textareaClass = cn(
  'min-h-[100px] px-3 py-2.5 text-sm w-full rounded-lg resize-none',
  'bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700',
  'placeholder:text-slate-300 dark:placeholder:text-slate-500',
  'focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500',
  'transition-all duration-150'
);

export const errorClass =
  'text-xs text-red-500 mt-1.5 flex items-center gap-1';

export const errorBlockClass =
  'p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400';

interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  helperText,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{helperText}</p>
      )}
      {error && (
        <p className={errorClass}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(textareaClass, className)} {...props} />
));
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select className={cn(selectClass, 'pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
        strokeWidth={2}
      />
    </div>
  );
}

export function DateInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input
        type="date"
        className={cn(inputClass, 'pr-9', className)}
        {...props}
      />
      <Calendar
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
        strokeWidth={2}
      />
    </div>
  );
}
