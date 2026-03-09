import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceSupabase } from '@/lib/supabase-server'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRRequisitions, canSeeSalaryAndBudget } from '@/lib/auth/permissions'
import { HR_MARKET_BADGE, HR_REQUISITION_STATUS_LABELS, HR_PRIORITY_COLORS } from '@/lib/hr/types'
import { fetchHRCandidates } from '@/lib/hr/queries'

export default async function HRRequisitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUserRole()
  if (!user || !canAccessHRRequisitions(user.role)) redirect('/')
  const { id } = await params
  const supabase = createServiceSupabase()

  let req: any = null
  try {
    const { data } = await supabase.from('hr_requisitions').select('*').eq('id', id).single()
    req = data
  } catch {
    const { data } = await supabase.from('requisitions').select('*').eq('id', id).single()
    if (data) {
      req = {
        ...data,
        title: data.job_title,
        vertical: data.vertical ?? '',
        experience_min_years: null,
        experience_max_years: null,
        budget_monthly_min: null,
        budget_monthly_max: null,
        budget_annual_min: data.budget_amount ?? null,
        budget_annual_max: null,
      }
    }
  }

  if (!req) notFound()

  const candidates = await fetchHRCandidates(supabase, { requisitionId: id })
  const showBudget = canSeeSalaryAndBudget(user.role)

  const expRange =
    req.experience_min_years != null || req.experience_max_years != null
      ? `${req.experience_min_years ?? 0}-${req.experience_max_years ?? '∞'} yrs`
      : '—'

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/hr/requisitions" style={{ fontSize: 12, color: '#71717a', textDecoration: 'none', marginBottom: 8, display: 'inline-block' }}>
          ← Requisitions
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b', marginBottom: 4 }}>{req.title}</h1>
            <p style={{ fontSize: 13, color: '#71717a' }}>
              {req.client_name ?? req.vertical} · {req.market && HR_MARKET_BADGE[req.market as keyof typeof HR_MARKET_BADGE] ? HR_MARKET_BADGE[req.market as keyof typeof HR_MARKET_BADGE].label : req.market} · {expRange}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: '#fef3c7',
                color: '#92400e',
              }}
            >
              {HR_REQUISITION_STATUS_LABELS[req.status as keyof typeof HR_REQUISITION_STATUS_LABELS] ?? req.status}
            </span>
            <span style={{ color: HR_PRIORITY_COLORS[req.priority as keyof typeof HR_PRIORITY_COLORS] ?? '#71717a', fontWeight: 600, fontSize: 13 }}>{req.priority}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
        <div>
          <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Details
            </div>
            <div style={{ fontSize: 13, color: '#52525b' }}>
              {showBudget && (req.budget_monthly_min != null || req.budget_annual_min != null) && (
                <div style={{ marginBottom: 8 }}>
                  Budget: {req.budget_monthly_min != null && `₹${req.budget_monthly_min.toLocaleString()}/mo`}
                  {req.budget_annual_min != null && ` (₹${(req.budget_annual_min / 1_00_000).toFixed(1)}L/yr)`}
                </div>
              )}
              {req.jd_summary && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>JD Summary</div>
                  <p style={{ margin: 0 }}>{req.jd_summary}</p>
                </div>
              )}
              {req.jd_full_url && (
                <a href={req.jd_full_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#7c3aed' }}>
                  Full JD →
                </a>
              )}
            </div>
          </div>
          {req.skills?.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {req.skills.map((s: string) => (
                  <span key={s} style={{ padding: '4px 8px', background: '#f4f4f5', borderRadius: 6, fontSize: 12, color: '#52525b' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#09090b' }}>Candidates ({candidates.length})</span>
            <Link
              href={`/hr/candidates/new${id ? `?requisition_id=${id}` : ''}`}
              style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', textDecoration: 'none' }}
            >
              + Add
            </Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#71717a' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#71717a' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#71717a' }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#a1a1aa' }}>No candidates yet.</td>
                </tr>
              )}
              {candidates.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <Link href={`/hr/candidates/${c.id}`} style={{ fontWeight: 500, color: '#09090b', textDecoration: 'none' }}>
                      {c.full_name}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#52525b' }}>{c.status}</td>
                  <td style={{ padding: '10px 16px', color: '#71717a' }}>{c.source ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
