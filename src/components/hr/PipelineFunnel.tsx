'use client'

import Link from 'next/link'
import type { HRPipelineByRequisition } from '@/lib/hr/types'

interface PipelineFunnelProps {
  rows: HRPipelineByRequisition[]
  maxBar?: number
}

function barWidth(count: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(100, Math.round((count / max) * 100))
}

export default function PipelineFunnel({ rows, maxBar = 10 }: PipelineFunnelProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e4e4e7' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600, color: '#71717a' }}>Position</th>
            <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#71717a' }}>Sourced</th>
            <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#71717a' }}>Screen</th>
            <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#71717a' }}>Tech</th>
            <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#71717a' }}>Offer</th>
            <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: '#71717a' }}>Hired</th>
            <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600, color: '#71717a' }}>Days</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>
                No pipeline data
              </td>
            </tr>
          )}
          {rows.map((row, i) => {
            const max = Math.max(row.sourced, row.screening, row.technical, row.offer, row.hired, 1)
            return (
              <tr key={row.requisition_id ?? i} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: '#09090b' }}>
                  {row.requisition_id ? (
                    <Link href={`/hr/requisitions/${row.requisition_id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:underline hover:text-violet-600">
                      {row.position_title}
                    </Link>
                  ) : (
                    row.position_title
                  )}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 48,
                        height: 8,
                        background: '#e4e4e7',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${barWidth(row.sourced, max)}%`,
                          height: '100%',
                          background: '#64748b',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', color: '#71717a', minWidth: 16 }}>{row.sourced}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div style={{ width: 48, height: 8, background: '#e4e4e7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${barWidth(row.screening, max)}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#71717a', minWidth: 16 }}>{row.screening}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div style={{ width: 48, height: 8, background: '#e4e4e7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${barWidth(row.technical, max)}%`, height: '100%', background: '#8b5cf6', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#71717a', minWidth: 16 }}>{row.technical}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div style={{ width: 48, height: 8, background: '#e4e4e7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${barWidth(row.offer, max)}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#71717a', minWidth: 16 }}>{row.offer}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <div style={{ width: 48, height: 8, background: '#e4e4e7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${barWidth(row.hired, max)}%`, height: '100%', background: '#10b981', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#71717a', minWidth: 16 }}>{row.hired}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#71717a' }}>
                  {row.days_open}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
