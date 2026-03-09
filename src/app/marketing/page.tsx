import { createServiceSupabase } from '@/lib/supabase-server'
import { MarketingDashboardSummary, leadStatusConfig } from '@/lib/types'
import Link from 'next/link'

export default async function MarketingPage() {
  const supabase = createServiceSupabase()
  let s: MarketingDashboardSummary | null = null
  let allLeads: any[] = []

  try {
    const [{ data: summary }, { data: leads }] = await Promise.all([
      supabase.from('v_marketing_dashboard').select('*').single(),
      supabase
        .from('leads')
        .select('*, proposals(id, status, proposed_monthly_value)')
        .not('status', 'in', '("Lost","On_Hold")')
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false })
    ])
    s = summary as MarketingDashboardSummary | null
    allLeads = (leads as any[]) || []
  } catch {
    // Views/tables may not exist; show page with empty data
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Marketing Pipeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">Leads · Proposals · Campaigns · Referrals</p>
        </div>
        <div className="flex gap-2">
          <Link href="/marketing/campaigns" className="px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded hover:bg-slate-50 transition">
            Campaigns
          </Link>
          <Link href="/marketing/leads" className="px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded hover:bg-slate-50 transition">
            Leads
          </Link>
          <Link href="/marketing/referrals" className="px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded hover:bg-slate-50 transition">
            Referrals
          </Link>
          <Link href="/marketing/leads" className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded hover:bg-slate-700 transition">
            + Add Lead
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      {s && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Leads',      value: s.active_leads,        color: 'border-l-blue-500' },
            { label: 'Proposals Out',     value: s.proposals_pending,   color: 'border-l-amber-500' },
            { label: 'Pipeline Value',    value: `$${(s.pipeline_value || 0).toLocaleString()}/mo`, color: 'border-l-violet-500' },
            { label: 'Won Value',         value: `$${(s.won_value || 0).toLocaleString()}/mo`,      color: 'border-l-emerald-500' },
          ].map(kpi => (
            <div key={kpi.label} className={`bg-white rounded border border-slate-200 border-l-4 ${kpi.color} p-4`}>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-xs text-slate-500 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Ops Handoff Banner */}
      {s && s.pending_ops_handoff > 0 && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800 font-medium">
          ⚡ {s.pending_ops_handoff} won lead{s.pending_ops_handoff > 1 ? 's' : ''} pending activation in Ops — review and activate when ready
        </div>
      )}

      {/* Pipeline Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vertical</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Est. Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proposals</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Update</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {allLeads.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No active leads. Add one to get started.
                </td>
              </tr>
            )}
            {allLeads.map((lead: any) => {
              const statusCfg = leadStatusConfig[lead.status as keyof typeof leadStatusConfig]
              const daysSince = Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / 86400000)
              const priorityColor = lead.priority === 'High' ? 'text-red-600 font-bold' : lead.priority === 'Medium' ? 'text-amber-600' : 'text-slate-400'
              const isWonPending = lead.status === 'Won' && !lead.ops_activated
              return (
                <tr key={lead.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isWonPending ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {lead.company_name}
                    {isWonPending && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Activate</span>}
                  </td>
                  <td className="px-4 py-3">
                    {lead.vertical === 'cpa_firm' ? (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', border: '1px solid #a5f3fc', background: '#ecfeff', color: '#0891b2' }}>CPA Firm</span>
                    ) : (
                      <span className="text-slate-500">{lead.vertical || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{lead.source || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {lead.estimated_monthly_value ? `$${lead.estimated_monthly_value.toLocaleString()}/mo` : '—'}
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold ${priorityColor}`}>{lead.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${statusCfg?.color}`}>
                      {statusCfg?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{lead.proposals?.length ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/marketing/${lead.id}`} className="text-xs text-blue-600 hover:underline">View →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
