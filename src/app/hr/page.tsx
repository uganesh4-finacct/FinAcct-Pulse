import { redirect } from 'next/navigation'
import Link from 'next/link'
import SubNav from '@/components/SubNav'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRDashboard } from '@/lib/auth/permissions'
import {
  fetchHRDashboardSummary,
  fetchHRPipelineByRequisition,
  fetchHRAlerts,
} from '@/lib/hr/queries'
import PipelineTableInteractive from '@/components/hr/PipelineTableInteractive'

export default async function HRDashboardPage() {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role)) {
    redirect('/')
  }

  const supabase = createServiceSupabase()
  const [summary, pipeline, alerts] = await Promise.all([
    fetchHRDashboardSummary(supabase),
    fetchHRPipelineByRequisition(supabase),
    fetchHRAlerts(supabase),
  ])
  const s = summary ?? {
    requests_pending: 0,
    open_requisitions: 0,
    sourced: 0,
    in_interview: 0,
    offers_pending: 0,
    joined_this_month: 0,
  }

  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>
            Human Resource Dashboard
          </h1>
          <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: 4 }}>{monthLabel}</p>
        </div>
      </div>
      <SubNav />

      {/* KPI Cards — 6 across */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Requests Pending', value: s.requests_pending, color: '#f59e0b' },
          { label: 'Open Reqs', value: s.open_requisitions, color: '#3b82f6' },
          { label: 'Sourced', value: s.sourced, color: '#64748b' },
          { label: 'In Interview', value: s.in_interview, color: '#8b5cf6' },
          { label: 'Offers Pending', value: s.offers_pending, color: '#f59e0b' },
          { label: 'Joined (Month)', value: s.joined_this_month, color: '#10b981' },
        ].map(k => (
          <div
            key={k.label}
            style={{
              background: 'white',
              border: '1px solid #e4e4e7',
              borderRadius: 12,
              padding: '18px 20px',
              borderTop: `3px solid ${k.color}`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: '#09090b', letterSpacing: '-0.03em' }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#71717a', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {alerts.map((a) => (
            <div
              key={a.id ?? a.message}
              style={{
                padding: '12px 16px',
                background: a.type === 'offer_pending_long' ? '#fef3c7' : '#fee2e2',
                border: `1px solid ${a.type === 'offer_pending_long' ? '#fcd34d' : '#fecaca'}`,
                borderRadius: 8,
                fontSize: 13,
                color: '#92400e',
                marginBottom: 8,
              }}
            >
              ⚠ {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Pipeline by requisition */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e4e4e7',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #f4f4f5',
            fontSize: 13,
            fontWeight: 600,
            color: '#09090b',
          }}
        >
          Pipeline by Requisition
        </div>
        <PipelineTableInteractive rows={pipeline} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Source effectiveness placeholder */}
        <div
          style={{
            background: 'white',
            border: '1px solid #e4e4e7',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Source Effectiveness
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13, color: '#52525b' }}>
            <li style={{ padding: '6px 0' }}>LinkedIn: —% hire rate</li>
            <li style={{ padding: '6px 0' }}>Naukri: —%</li>
            <li style={{ padding: '6px 0' }}>Referral: —%</li>
          </ul>
          <p style={{ fontSize: 11, color: '#a1a1aa', marginTop: 12 }}>Configure via analytics when data available.</p>
        </div>

        {/* Quick actions */}
        <div
          style={{
            background: 'white',
            border: '1px solid #e4e4e7',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              href="/hr/requests?new=1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#7c3aed',
                color: 'white',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                width: 'fit-content',
              }}
            >
              + New Request
            </Link>
            <Link
              href="/hr/candidates/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#18181b',
                color: 'white',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                width: 'fit-content',
              }}
            >
              + Add Candidate
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
