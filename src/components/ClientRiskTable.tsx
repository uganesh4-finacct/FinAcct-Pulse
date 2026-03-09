'use client'

import React, { useState } from 'react'

const VERTICAL_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  restaurant:  { label: 'Restaurant',    color: 'badge-violet', dot: '#7c3aed' },
  insurance:   { label: 'Insurance',     color: 'badge-blue',   dot: '#2563eb' },
  property:    { label: 'Property Mgmt', color: 'badge-green',  dot: '#059669' },
  saas_ites:   { label: 'SaaS / ITES',   color: 'badge-yellow', dot: '#ca8a04' },
  cpa_firm:    { label: 'CPA Firm',      color: 'badge-cyan',   dot: '#0891b2' },
}

const WARNING_COLOR = '#ea580c'
const WARNING_BG = '#fff7ed'
const WARNING_BORDER = '#fed7aa'

function riskDot(risk: string) {
  const colors: Record<string, string> = { red: '#dc2626', yellow: WARNING_COLOR, green: '#059669' }
  return (
    <span style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '9999px',
      background: colors[risk] ?? '#a1a1aa',
      flexShrink: 0,
    }} />
  )
}

function agingBadge(aging: string) {
  if (aging === 'red')    return <span className="badge badge-red">Escalated</span>
  if (aging === 'yellow') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: WARNING_BG, color: WARNING_COLOR, border: `1px solid ${WARNING_BORDER}` }}>Overdue</span>
  return <span className="badge badge-green">Current</span>
}

export interface ClientRiskTableProps {
  grouped: Record<string, any[]>
  verticalOrder: string[]
  clients: any[]
}

export function ClientRiskTable({ grouped, verticalOrder, clients }: ClientRiskTableProps) {
  const [hiddenSegments, setHiddenSegments] = useState<Set<string>>(new Set())

  const toggleSegment = (v: string) => {
    setHiddenSegments(prev => {
      const next = new Set(prev)
      if (next.has(v)) next.delete(v)
      else next.add(v)
      return next
    })
  }

  return (
    <div className="card" style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}>
        <span>Client Risk Status</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-red">{clients.filter((c: any) => c.risk_level === 'red').length} At Risk</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: WARNING_BG, color: WARNING_COLOR, border: `1px solid ${WARNING_BORDER}` }}>{clients.filter((c: any) => c.risk_level === 'yellow').length} Warning</span>
          <span className="badge badge-green">{clients.filter((c: any) => c.close_status === 'complete').length} Complete</span>
        </div>
      </div>

      <table className="data-table" style={{ fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ width: '12px', paddingLeft: '20px' }}></th>
            <th>Client</th>
            <th>Owner</th>
            <th>Steps</th>
            <th>Deadline</th>
            <th>Monthly Fee</th>
            <th>Status</th>
            <th style={{ paddingRight: '20px' }}>Invoice</th>
          </tr>
        </thead>
        <tbody>
          {verticalOrder.map(v => {
            const group = grouped[v]
            if (!group || group.length === 0) return null
            const cfg = VERTICAL_CONFIG[v]
            const isHidden = hiddenSegments.has(v)
            return (
              <React.Fragment key={v}>
                <tr>
                  <td colSpan={8} style={{
                    background: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderTop: '1px solid var(--border-subtle)',
                    padding: '8px 20px',
                    verticalAlign: 'middle',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSegment(v) }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          flexShrink: 0,
                          border: 'none',
                          background: 'transparent',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--bg-muted)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                        title={isHidden ? 'Show segment' : 'Hide segment'}
                        aria-label={isHidden ? 'Show segment' : 'Hide segment'}
                      >
                        <span style={{
                          display: 'inline-block',
                          transform: isHidden ? 'rotate(-90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          fontSize: '10px',
                        }}>
                          ▼
                        </span>
                      </button>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '9999px',
                        background: cfg.dot,
                        display: 'inline-block',
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        · {group.length} clients · ${group.reduce((sum: number, c: any) => sum + (c.monthly_fee ?? 0), 0).toLocaleString()}/mo
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px' }}>
                        {isHidden ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleSegment(v) }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent)',
                              cursor: 'pointer',
                              fontWeight: 500,
                              textDecoration: 'underline',
                            }}
                          >
                            Show
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleSegment(v) }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontWeight: 500,
                              textDecoration: 'underline',
                            }}
                          >
                            Hide
                          </button>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
                {!isHidden && group.map((c: any) => (
                  <tr
                    key={c.client_id}
                    className={c.risk_level === 'red' ? 'row-critical' : ''}
                    style={{
                      background: c.risk_level === 'red' ? 'var(--red-bg)' : c.risk_level === 'yellow' ? WARNING_BG : 'var(--bg)',
                    }}
                  >
                    <td style={{ padding: '12px 8px 12px 20px', verticalAlign: 'middle' }}>
                      {riskDot(c.risk_level)}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)', verticalAlign: 'middle' }}>
                      {c.client_name}
                    </td>
                    <td style={{ color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                      {c.owner_name ?? '—'}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'ui-monospace, monospace',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}>
                          {c.steps_complete ?? 0}/8
                        </span>
                        <div style={{
                          width: '52px',
                          height: '4px',
                          background: 'var(--bg-muted)',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            borderRadius: '9999px',
                            width: `${((c.steps_complete ?? 0) / 8) * 100}%`,
                            background: c.risk_level === 'red' ? 'var(--red)' : c.risk_level === 'yellow' ? WARNING_COLOR : 'var(--green)',
                            transition: 'width 0.2s ease',
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                      {c.deadline_date
                        ? new Date(c.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                      {c.days_to_deadline != null && (
                        <span style={{
                          marginLeft: '6px',
                          fontWeight: 600,
                          fontSize: '11px',
                          color: c.days_to_deadline < 0 ? 'var(--red)' : c.days_to_deadline <= 2 ? WARNING_COLOR : 'var(--text-tertiary)',
                        }}>
                          {c.days_to_deadline < 0
                            ? `${Math.abs(c.days_to_deadline)}d over`
                            : `${c.days_to_deadline}d left`}
                        </span>
                      )}
                    </td>
                    <td style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      verticalAlign: 'middle',
                    }}>
                      ${(c.monthly_fee ?? 0).toLocaleString()}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {c.risk_level === 'red'    && <span className="badge badge-red">At Risk</span>}
                      {c.risk_level === 'yellow' && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: WARNING_BG, color: WARNING_COLOR, border: `1px solid ${WARNING_BORDER}` }}>Warning</span>}
                      {c.risk_level === 'green'  && <span className="badge badge-green">On Track</span>}
                    </td>
                    <td style={{ paddingRight: '20px', verticalAlign: 'middle' }}>
                      {agingBadge(c.invoice_aging ?? 'green')}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
