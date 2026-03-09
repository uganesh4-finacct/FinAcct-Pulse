'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function FinanceBudgetsPage() {
  const [year, setYear] = useState(new Date().getFullYear())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-zinc-900">Budgets</h2>
        <Button size="sm">+ Set Budget</Button>
      </div>
      <div className="flex gap-3">
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-sm text-zinc-500 self-center">Entity: US | India | Both</span>
        <span className="text-sm text-zinc-500 self-center">View: Monthly | Annual</span>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center text-zinc-500">
        Budget table: Category × Jan…Dec × Annual. Use API /api/finance/budgets to load and edit.
      </div>
    </div>
  )
}
