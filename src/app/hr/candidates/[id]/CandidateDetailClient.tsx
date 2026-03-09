'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SidePanel from '@/components/SidePanel'
import { FieldRow, FieldInput } from '@/components/FieldRow'
import { HR_CANDIDATE_STATUS_LABELS } from '@/lib/hr/types'
import type { HRCandidate } from '@/lib/hr/types'

const REFUSAL_REASONS = [
  { value: 'salary_mismatch', label: 'Salary / budget mismatch' },
  { value: 'profile_fit', label: 'Profile fit' },
  { value: 'timing', label: 'Timing / availability' },
  { value: 'withdrawn', label: 'Candidate withdrawn' },
  { value: 'other', label: 'Other' },
]

export default function HRCandidateDetailPage({ id }: { id: string }) {
  const [candidate, setCandidate] = useState<HRCandidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [canSeeSalary, setCanSeeSalary] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ team_member_id: string } | null>(null)
  const [approvers, setApprovers] = useState<{ id: string; name: string; role_title: string }[]>([])
  const [moveToOfferOpen, setMoveToOfferOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [moveOfferForm, setMoveOfferForm] = useState({
    offer_salary_monthly: '',
    offer_salary_annual: '',
    offer_approver_1_id: '',
    offer_approver_2_id: '',
  })
  const [rejectForm, setRejectForm] = useState({ rejection_reason: 'other', rejection_notes: '' })
  const [saving, setSaving] = useState(false)

  const refetch = () => fetch(`/api/hr/candidates/${id}`).then(r => r.json()).then(d => setCandidate(d))

  useEffect(() => {
    fetch(`/api/hr/candidates/${id}`)
      .then(r => r.json())
      .then(d => {
        setCandidate(d)
        setCanSeeSalary(
          d.current_salary_monthly != null ||
          d.current_salary_annual != null ||
          d.expected_salary_monthly != null ||
          d.offer_salary_monthly != null
        )
      })
      .catch(() => setCandidate(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d && setCurrentUser({ team_member_id: d.team_member_id }))
  }, [])

  useEffect(() => {
    if (moveToOfferOpen) fetch('/api/hr/approvers').then(r => r.json()).then(d => setApprovers(d.approvers ?? []))
  }, [moveToOfferOpen])

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#a1a1aa' }}>Loading...</div>
  if (!candidate) return <div style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>Candidate not found.</div>

  const formatCurrency = (val: number | null | undefined, annual = false) => {
    if (val == null) return '—'
    return annual ? `₹${(val / 1_00_000).toFixed(1)}L/yr` : `₹${val.toLocaleString()}/mo`
  }

  const isApprover1 = currentUser && candidate.offer_approver_1_id === currentUser.team_member_id
  const isApprover2 = currentUser && candidate.offer_approver_2_id === currentUser.team_member_id
  const canApproveOffer = isApprover1 || isApprover2
  const allApproved =
    candidate.offer_approver_1_approved &&
    (!candidate.offer_approver_2_id || candidate.offer_approver_2_approved)
  const waitingCount =
    (candidate.offer_approver_1_approved ? 1 : 0) +
    (candidate.offer_approver_2_id && candidate.offer_approver_2_approved ? 1 : 0)
  const requiredCount = candidate.offer_approver_2_id ? 2 : 1
  const pendingCount = requiredCount - waitingCount

  const handleMoveToOffer = async () => {
    if (!moveOfferForm.offer_approver_1_id) {
      alert('Please select Approver 1')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/hr/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'move_to_offer',
        offer_salary_monthly: moveOfferForm.offer_salary_monthly ? parseInt(moveOfferForm.offer_salary_monthly, 10) : null,
        offer_salary_annual: moveOfferForm.offer_salary_annual ? parseInt(moveOfferForm.offer_salary_annual, 10) : null,
        offer_approver_1_id: moveOfferForm.offer_approver_1_id,
        offer_approver_2_id: moveOfferForm.offer_approver_2_id || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Failed')
      return
    }
    setMoveToOfferOpen(false)
    setMoveOfferForm({ offer_salary_monthly: '', offer_salary_annual: '', offer_approver_1_id: '', offer_approver_2_id: '' })
    refetch()
  }

  const handleApproveOffer = async () => {
    setSaving(true)
    const res = await fetch(`/api/hr/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_offer' }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Failed')
      return
    }
    refetch()
  }

  const handleSendOffer = async () => {
    setSaving(true)
    const res = await fetch(`/api/hr/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_offer' }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Failed')
      return
    }
    refetch()
  }

  const handleRejectOffer = async () => {
    setSaving(true)
    const res = await fetch(`/api/hr/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        rejection_reason: rejectForm.rejection_reason,
        rejection_notes: rejectForm.rejection_notes,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Failed')
      return
    }
    setRejectOpen(false)
    setRejectForm({ rejection_reason: 'other', rejection_notes: '' })
    refetch()
  }

  const showMoveToOfferButton =
    (candidate.status === 'technical' || candidate.status === 'screening') &&
    (candidate as any).id

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/hr/candidates" style={{ fontSize: 12, color: '#71717a', textDecoration: 'none', marginBottom: 8, display: 'inline-block' }}>
          ← Candidates
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b', marginBottom: 4 }}>{candidate.full_name}</h1>
            <p style={{ fontSize: 13, color: '#71717a' }}>{candidate.requisition_title ?? '—'} · {HR_CANDIDATE_STATUS_LABELS[candidate.status]}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showMoveToOfferButton && (
              <button
                type="button"
                onClick={() => setMoveToOfferOpen(true)}
                style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Move to Offer Stage
              </button>
            )}
            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#f4f4f5', color: '#52525b' }}>
              {HR_CANDIDATE_STATUS_LABELS[candidate.status]}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Contact &amp; Info</div>
          <div style={{ fontSize: 13, color: '#52525b' }}>
            <p style={{ margin: '0 0 8px' }}><strong>Email:</strong> {candidate.email ?? '—'}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Phone:</strong> {candidate.phone ?? '—'}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Current company:</strong> {candidate.current_company ?? '—'}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Source:</strong> {candidate.source ?? '—'}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Notice period:</strong> {candidate.notice_period_days != null ? `${candidate.notice_period_days} days` : '—'}</p>
            {candidate.resume_url && (
              <p style={{ margin: '8px 0 0' }}>
                <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>Resume →</a>
              </p>
            )}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Experience &amp; Skills</div>
          <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>{candidate.experience_summary ?? '—'}</p>
          {candidate.tools_skills && (
            <p style={{ fontSize: 13, color: '#52525b', marginTop: 8 }}><strong>Tools/Skills:</strong> {candidate.tools_skills}</p>
          )}
        </div>
      </div>

      {/* Offer Approval Section */}
      {candidate.status === 'offer_pending_approval' && (
        <div style={{ marginTop: 24, background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Offer approval</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#71717a', marginBottom: 4 }}>Proposed offer</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              Monthly: {formatCurrency(candidate.offer_salary_monthly)} · Annual: {formatCurrency(candidate.offer_salary_annual, true)}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#71717a', marginBottom: 8 }}>Approvals required</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', borderRadius: 8 }}>
                <span>
                  {candidate.offer_approver_1_approved ? (
                    <span style={{ color: '#10b981' }}>☑</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>☐</span>
                  )}{' '}
                  {(candidate as any).offer_approver_1_name ?? 'Approver 1'}
                </span>
                {isApprover1 && !candidate.offer_approver_1_approved && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setRejectOpen(true)} style={{ padding: '6px 12px', fontSize: 12, background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Reject</button>
                    <button type="button" onClick={handleApproveOffer} disabled={saving} style={{ padding: '6px 12px', fontSize: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Approve</button>
                  </div>
                )}
              </div>
              {candidate.offer_approver_2_id && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', borderRadius: 8 }}>
                  <span>
                    {candidate.offer_approver_2_approved ? (
                      <span style={{ color: '#10b981' }}>☑</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>☐</span>
                    )}{' '}
                    {(candidate as any).offer_approver_2_name ?? 'Approver 2'}
                  </span>
                  {isApprover2 && !candidate.offer_approver_2_approved && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setRejectOpen(true)} style={{ padding: '6px 12px', fontSize: 12, background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Reject</button>
                      <button type="button" onClick={handleApproveOffer} disabled={saving} style={{ padding: '6px 12px', fontSize: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Approve</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 16, fontSize: 13, color: '#64748b' }}>
            Status: {allApproved ? 'All approved' : `Waiting for ${pendingCount} approval(s)`}
          </div>
          <button
            type="button"
            onClick={handleSendOffer}
            disabled={!allApproved || saving}
            style={{
              padding: '8px 16px',
              background: allApproved ? '#10b981' : '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: allApproved ? 'pointer' : 'not-allowed',
            }}
          >
            Send Offer
          </button>
        </div>
      )}

      {(canSeeSalary || candidate.offer_salary_monthly != null) && candidate.status !== 'offer_pending_approval' && (
        <div style={{ marginTop: 24, background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Salary (admin/HR only)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ color: '#71717a', marginBottom: 4 }}>Current</div>
              <div style={{ fontWeight: 600, color: '#09090b' }}>{formatCurrency(candidate.current_salary_monthly)} {candidate.current_salary_annual != null && `(${formatCurrency(candidate.current_salary_annual, true)})`}</div>
            </div>
            <div>
              <div style={{ color: '#71717a', marginBottom: 4 }}>Expected</div>
              <div style={{ fontWeight: 600, color: '#09090b' }}>{formatCurrency(candidate.expected_salary_monthly)}</div>
            </div>
            <div>
              <div style={{ color: '#71717a', marginBottom: 4 }}>Offer</div>
              <div style={{ fontWeight: 600, color: '#09090b' }}>{formatCurrency(candidate.offer_salary_monthly)}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 11, color: '#a1a1aa' }}>
        Stage date: {candidate.stage_date ? new Date(candidate.stage_date).toLocaleString() : '—'} · Updated: {new Date(candidate.updated_at).toLocaleString()}
      </div>

      {/* Move to Offer Modal */}
      <SidePanel open={moveToOfferOpen} onClose={() => setMoveToOfferOpen(false)} title="Move to Offer Stage" subtitle="Proposed offer and approvers">
        <FieldRow label="Proposed offer – Monthly (₹)">
          <FieldInput type="number" value={moveOfferForm.offer_salary_monthly} onChange={v => setMoveOfferForm({ ...moveOfferForm, offer_salary_monthly: v })} placeholder="e.g. 75000" />
        </FieldRow>
        <FieldRow label="Proposed offer – Annual (₹)">
          <FieldInput type="number" value={moveOfferForm.offer_salary_annual} onChange={v => setMoveOfferForm({ ...moveOfferForm, offer_salary_annual: v })} placeholder="e.g. 900000" />
        </FieldRow>
        <FieldRow label="Approver 1 (required)">
          <select
            value={moveOfferForm.offer_approver_1_id}
            onChange={e => setMoveOfferForm({ ...moveOfferForm, offer_approver_1_id: e.target.value })}
            style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }}
          >
            <option value="">Select approver</option>
            {approvers.map(a => (
              <option key={a.id} value={a.id}>{a.name}{a.role_title ? ` (${a.role_title})` : ''}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Approver 2 (optional)">
          <select
            value={moveOfferForm.offer_approver_2_id}
            onChange={e => setMoveOfferForm({ ...moveOfferForm, offer_approver_2_id: e.target.value })}
            style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }}
          >
            <option value="">None</option>
            {approvers.map(a => (
              <option key={a.id} value={a.id}>{a.name}{a.role_title ? ` (${a.role_title})` : ''}</option>
            ))}
          </select>
        </FieldRow>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={() => setMoveToOfferOpen(false)} style={{ padding: '8px 16px', border: '1px solid #e4e4e7', borderRadius: 8, background: 'white', cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleMoveToOffer} disabled={saving} style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Submit for Approval</button>
        </div>
      </SidePanel>

      {/* Reject Offer Modal */}
      <SidePanel open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Offer" subtitle="Reason and notes">
        <FieldRow label="Reason">
          <select
            value={rejectForm.rejection_reason}
            onChange={e => setRejectForm({ ...rejectForm, rejection_reason: e.target.value })}
            style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }}
          >
            {REFUSAL_REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Notes">
          <textarea
            value={rejectForm.rejection_notes}
            onChange={e => setRejectForm({ ...rejectForm, rejection_notes: e.target.value })}
            rows={3}
            style={{ width: '100%', padding: '8px 11px', border: '1px solid #e4e4e7', borderRadius: 7, fontSize: 13 }}
            placeholder="Optional notes"
          />
        </FieldRow>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={() => setRejectOpen(false)} style={{ padding: '8px 16px', border: '1px solid #e4e4e7', borderRadius: 8, background: 'white', cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleRejectOffer} disabled={saving} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
        </div>
      </SidePanel>
    </div>
  )
}
