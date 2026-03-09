'use client'

import { useState, useEffect } from 'react'
import type { HRBudgetRange } from '@/lib/hr/types'

const LEVELS = ['entry', 'mid', 'senior'] as const

export default function HRBudgetPage() {
  const [tab, setTab] = useState<'India' | 'US'>('India')
  const [ranges, setRanges] = useState<HRBudgetRange[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/hr/budget-ranges?market=${tab}`)
      .then(r => r.json())
      .then(d => setRanges(d.ranges ?? []))
      .catch(() => setRanges([]))
      .finally(() => setLoading(false))
  }, [tab])

  const byRole = ranges.reduce((acc, r) => {
    const key = r.role_type_name ?? r.role_type_id
    if (!acc[key]) acc[key] = {} as Record<string, HRBudgetRange>
    acc[key][r.level] = r
    return acc
  }, {} as Record<string, Record<string, HRBudgetRange>>)

  const roleIds = Object.keys(byRole)

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b' }}>Budget Ranges</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setTab('India')}
            style={{
              padding: '8px 16px',
              background: tab === 'India' ? '#f97316' : 'white',
              color: tab === 'India' ? 'white' : '#52525b',
              border: '1px solid #e4e4e7',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            India
          </button>
          <button
            type="button"
            onClick={() => setTab('US')}
            style={{
              padding: '8px 16px',
              background: tab === 'US' ? '#3b82f6' : 'white',
              color: tab === 'US' ? 'white' : '#52525b',
              border: '1px solid #e4e4e7',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            US
            </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#71717a', marginBottom: 16 }}>Click any cell to edit (inline edit modal can be wired to PATCH /api/hr/budget-ranges).</p>

      {loading && <div style={{ padding: 48, textAlign: 'center', color: '#a1a1aa' }}>Loading...</div>}

      {!loading && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Role Type</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Entry Level</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Mid Level</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Senior</th>
              </tr>
            </thead>
            <tbody>
              {roleIds.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#71717a' }}>No budget ranges. Add via migration or seed.</td>
                </tr>
              )}
              {roleIds.map(roleKey => {
                const row = byRole[roleKey]
                const entry = row?.entry
                const mid = row?.mid
                const senior = row?.senior
                const fmt = (r: HRBudgetRange | undefined) => {
                  if (!r) return '—'
                  return (
                    <>
                      <div>₹{r.monthly_min?.toLocaleString()}–{r.monthly_max?.toLocaleString()}/mo</div>
                      <div style={{ fontSize: 11, color: '#a1a1aa' }}>₹{r.annual_min != null ? (r.annual_min / 1_00_000).toFixed(1) : '—'}L–{r.annual_max != null ? (r.annual_max / 1_00_000).toFixed(1) : '—'}L/yr</div>
                    </>
                  )
                }
                return (
                  <tr key={roleKey} style={{ borderBottom: '1px solid #f4f4f5' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#09090b' }}>{roleKey}</td>
                    <td style={{ padding: '12px 16px', color: '#52525b' }}>{fmt(entry)}</td>
                    <td style={{ padding: '12px 16px', color: '#52525b' }}>{fmt(mid)}</td>
                    <td style={{ padding: '12px 16px', color: '#52525b' }}>{fmt(senior)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
