'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export type MonthPickerValue = string // 'YYYY-MM'

interface MonthPickerProps {
  value: MonthPickerValue
  onChange: (value: MonthPickerValue) => void
  min?: MonthPickerValue
  max?: MonthPickerValue
  className?: string
}

export function MonthPicker({ value, onChange, min, max, className }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [year, month] = value ? value.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
  const currentYear = new Date().getFullYear()

  const setMonth = (y: number, m: number) => {
    const str = `${y}-${String(m).padStart(2, '0')}`
    if (min && str < min) return
    if (max && str > max) return
    onChange(str)
    setOpen(false)
  }

  const prev = () => {
    if (month === 1) setMonth(year - 1, 12)
    else setMonth(year, month - 1)
  }
  const next = () => {
    if (month === 12) setMonth(year + 1, 1)
    else setMonth(year, month + 1)
  }

  const displayLabel = value ? `${MONTHS[month - 1]} ${year}` : 'Select month'

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white">
        <button
          type="button"
          onClick={prev}
          className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-l-lg"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-3 py-2 text-sm font-medium text-zinc-900 min-w-[120px]"
        >
          {displayLabel}
        </button>
        <button
          type="button"
          onClick={next}
          className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-r-lg"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-zinc-200 shadow-lg p-3 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => setMonth(year - 1, month)} className="text-zinc-500 hover:text-zinc-800 p-1">−</button>
              <span className="font-semibold text-zinc-900">{year}</span>
              <button type="button" onClick={() => setMonth(year + 1, month)} className="text-zinc-500 hover:text-zinc-800 p-1">+</button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((name, i) => {
                const m = i + 1
                const str = `${year}-${String(m).padStart(2, '0')}`
                const disabled = (min && str < min) || (max && str > max)
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => !disabled && setMonth(year, m)}
                    disabled={!!disabled}
                    className={cn(
                      'py-1.5 px-2 text-xs font-medium rounded',
                      month === m ? 'bg-violet-600 text-white' : 'text-zinc-700 hover:bg-zinc-100',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** Returns first day of month as YYYY-MM-DD */
export function monthToDate(ym: string): string {
  return `${ym}-01`
}

/** Current month YYYY-MM */
export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
