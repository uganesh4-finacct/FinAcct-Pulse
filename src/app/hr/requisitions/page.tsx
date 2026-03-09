'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HR_REQUISITION_STATUS_LABELS, HR_MARKET_BADGE, HR_PRIORITY_COLORS } from '@/lib/hr/types'
import type { HRRequisition } from '@/lib/hr/types'

export default function HRRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<HRRequisition[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMarket, setFilterMarket] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterMarket) params.set('market', filterMarket)
    fetch(`/api/hr/requisitions?${params}`)
      .then(r => r.json())
      .then(d => setRequisitions(d.requisitions ?? []))
      .catch(() => setRequisitions([]))
      .finally(() => setLoading(false))
  }, [filterStatus, filterMarket])

  const expRange = (r: HRRequisition) => {
    const min = r.experience_min_years ?? 0
    const max = r.experience_max_years
    return max != null ? `${min}-${max} yrs` : min ? `${min}+ yrs` : '—'
  }

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b' }}>Requisitions</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'cards' ? '#18181b' : 'white',
              color: viewMode === 'cards' ? 'white' : '#52525b',
              border: '1px solid #e4e4e7',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'table' ? '#18181b' : 'white',
              color: viewMode === 'table' ? 'white' : '#52525b',
              border: '1px solid #e4e4e7',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Table
          </button>
          <Link
            href="/hr/requisitions/new"
            style={{
              padding: '8px 16px',
              background: '#7c3aed',
              color: 'white',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            + From Request
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7', fontSize: 13 }}
        >
          <option value="">All statuses</option>
          {Object.entries(HR_REQUISITION_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filterMarket}
          onChange={e => setFilterMarket(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7', fontSize: 13 }}
        >
          <option value="">All markets</option>
          <option value="India">India</option>
          <option value="US">US</option>
        </select>
      </div>

      {loading && (
        <div style={{ padding: 48, textAlign: 'center', color: '#a1a1aa' }}>Loading...</div>
      )}

      {!loading && viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {requisitions.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 32, textAlign: 'center', color: '#71717a' }}>
              No requisitions. Create one from an approved request.
            </div>
          )}
          {requisitions.map(req => (
            <div
              key={req.id}
              style={{
                background: 'white',
                border: '1px solid #e4e4e7',
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 15, color: '#09090b', marginBottom: 4 }}>{req.title}</div>
              <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>
                {req.client_name ?? req.vertical} · {HR_MARKET_BADGE[req.market].label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: HR_PRIORITY_COLORS[req.priority],
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#52525b' }}>{req.priority}</span>
              </div>
              <div style={{ fontSize: 12, color: '#71717a', marginBottom: 12 }}>{expRange(req)} exp</div>
              <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 12 }}>
                Target: {req.target_start_date ? new Date(req.target_start_date).toLocaleDateString() : '—'}
              </div>
              <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 12, fontSize: 12, color: '#71717a', marginBottom: 12 }}>
                Sourced: {req.sourced_count ?? 0} · Screening: {req.screening_count ?? 0} · Technical: {req.technical_count ?? 0}
              </div>
              <Link
                href={`/hr/requisitions/${req.id}`}
                style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', textDecoration: 'none' }}
              >
                View Pipeline →
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && viewMode === 'table' && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Position</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Market</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Priority</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/hr/requisitions/${req.id}`} style={{ fontWeight: 500, color: '#09090b', textDecoration: 'none' }}>
                      {req.title}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>{HR_MARKET_BADGE[req.market].label}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: HR_PRIORITY_COLORS[req.priority], fontWeight: 600 }}>{req.priority}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>{HR_REQUISITION_STATUS_LABELS[req.status]}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#71717a' }}>
                    S: {req.sourced_count ?? 0} · Sc: {req.screening_count ?? 0} · T: {req.technical_count ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
