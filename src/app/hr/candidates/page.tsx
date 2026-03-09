'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HR_CANDIDATE_STATUS_LABELS } from '@/lib/hr/types'
import type { HRCandidate } from '@/lib/hr/types'

const STAGES: import('@/lib/hr/types').HRCandidateStatus[] = [
  'sourced',
  'screening',
  'technical',
  'offer_pending_approval',
  'offer_sent',
  'accepted',
  'joined',
  'rejected',
]

export default function HRCandidatesPage() {
  const [candidates, setCandidates] = useState<HRCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [filterRequisition, setFilterRequisition] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [requisitions, setRequisitions] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    fetch(`/api/hr/requisitions`)
      .then(r => r.json())
      .then(d => setRequisitions(d.requisitions ?? []))
      .catch(() => setRequisitions([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterRequisition) params.set('requisition_id', filterRequisition)
    if (filterStatus) params.set('status', filterStatus)
    if (filterSource) params.set('source', filterSource)
    fetch(`/api/hr/candidates?${params}`)
      .then(r => r.json())
      .then(d => setCandidates(d.candidates ?? []))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false))
  }, [filterRequisition, filterStatus, filterSource])

  const byStage = STAGES.reduce((acc, stage) => ({ ...acc, [stage]: candidates.filter(c => c.status === stage) }), {} as Record<string, HRCandidate[]>)

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b' }}>Candidates</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'kanban' ? '#18181b' : 'white',
              color: viewMode === 'kanban' ? 'white' : '#52525b',
              border: '1px solid #e4e4e7',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Kanban
          </button>
          <Link
            href="/hr/candidates/new"
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
            + Add Candidate
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterRequisition}
          onChange={e => setFilterRequisition(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7', fontSize: 13 }}
        >
          <option value="">All requisitions</option>
          {requisitions.map(r => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7', fontSize: 13 }}
        >
          <option value="">All statuses</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{HR_CANDIDATE_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e4e4e7', fontSize: 13 }}
        >
          <option value="">All sources</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Naukri">Naukri</option>
          <option value="Referral">Referral</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {loading && <div style={{ padding: 48, textAlign: 'center', color: '#a1a1aa' }}>Loading...</div>}

      {!loading && viewMode === 'table' && (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Stage Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#71717a' }}>No candidates.</td>
                </tr>
              )}
              {candidates.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/hr/candidates/${c.id}`} style={{ fontWeight: 500, color: '#09090b', textDecoration: 'none' }}>
                      {c.full_name}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>{c.requisition_title ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>{HR_CANDIDATE_STATUS_LABELS[c.status]}</td>
                  <td style={{ padding: '12px 16px', color: '#71717a' }}>
                    {c.stage_date ? new Date(c.stage_date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#71717a' }}>{c.source ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && viewMode === 'kanban' && (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {STAGES.filter(s => s !== 'rejected').map(stage => (
            <div
              key={stage}
              style={{
                minWidth: 200,
                width: 200,
                background: '#f4f4f5',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                {HR_CANDIDATE_STATUS_LABELS[stage]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(byStage[stage] ?? []).map(c => (
                  <Link
                    key={c.id}
                    href={`/hr/candidates/${c.id}`}
                    style={{
                      display: 'block',
                      padding: 12,
                      background: 'white',
                      borderRadius: 8,
                      border: '1px solid #e4e4e7',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#09090b' }}>{c.full_name}</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{c.requisition_title ?? '—'}</div>
                    <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 4 }}>{c.source ?? ''} · {c.stage_date ? new Date(c.stage_date).toLocaleDateString() : ''}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
