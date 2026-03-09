import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServiceSupabase()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: summary },
    { count: clientsCount },
    { count: teamCount },
    { count: openReqsCount },
    { count: candidatesCount },
    { data: overdueSteps },
    { data: openEscalations },
    { data: riskClients },
    { data: overdueInvoices },
    { data: openRequisitions },
    { data: candidateCounts },
    { data: monthlyClosesComplete },
    { data: cashflowSummary },
    { data: itPending },
    { data: escalationsForActivity },
    { data: recentRequisitions },
  ] = await Promise.all([
    supabase.from('v_dashboard_summary').select('*').single(),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('team_members').select('*', { count: 'exact', head: true }),
    supabase.from('requisitions').select('*', { count: 'exact', head: true }).in('status', ['Open', 'Sourcing', 'Interviews_Scheduled', 'Offers_Out']),
    supabase.from('candidates').select('*', { count: 'exact', head: true }),
    supabase.from('close_steps').select('id').neq('status', 'complete').lt('due_date', today),
    supabase.from('escalations').select('id, title, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(10),
    supabase.from('v_client_risk').select('client_id, client_name, risk_level, days_to_deadline').in('risk_level', ['red', 'yellow']).limit(20),
    supabase.from('invoices').select('id, client_id, amount, outstanding_days').neq('payment_status', 'paid').gt('outstanding_days', 20).order('outstanding_days', { ascending: false }).limit(10),
    supabase.from('requisitions').select('id, prospect_name, job_title').in('status', ['Open', 'Sourcing']),
    supabase.from('candidates').select('requisition_id'),
    supabase.from('monthly_closes').select('id').eq('status', 'complete').gte('delivered_date', startOfMonth),
    (async () => {
      const r = await supabase.from('v_cashflow_summary').select('*').single()
      return { data: r.data ?? null }
    })(),
    (async () => {
      try {
        const r = await supabase.from('it_software').select('id').eq('status', 'pending_renewal')
        return r
      } catch {
        return { data: [] }
      }
    })(),
    supabase.from('escalations').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('requisitions').select('id, job_title, updated_at').order('updated_at', { ascending: false }).limit(5),
  ])

  const s = summary as Record<string, unknown> | null
  const totalClients = clientsCount ?? (s?.total_active_clients as number) ?? 0
  const monthlyRevenue = Number(s?.total_monthly_billing ?? 0)
  const openHiringRoles = openReqsCount ?? 0
  const overdueStepsCount = Array.isArray(overdueSteps) ? overdueSteps.length : 0
  const teamMembers = teamCount ?? 0
  const pendingApprovals = Array.isArray(openEscalations) ? openEscalations.length : 0

  const kpis = {
    totalClients,
    monthlyRevenue,
    openHiringRoles,
    overdueSteps: overdueStepsCount,
    teamMembers,
    pendingApprovals,
  }

  const riskList = (riskClients as Record<string, unknown>[]) ?? []
  const invoiceList = (overdueInvoices as Record<string, unknown>[]) ?? []
  const reqList = (openRequisitions as { id: string; prospect_name?: string; job_title?: string }[]) ?? []
  const candList = (candidateCounts as { requisition_id: string }[]) ?? []
  const reqIdsWithCandidates = new Set(candList.map((c) => c.requisition_id))

  const attentionItems: Array<{
    id: string
    title: string
    description: string
    daysOverdue?: number
    href: string
    type: 'invoice' | 'hiring' | 'client' | 'approval'
  }> = []

  invoiceList.slice(0, 5).forEach((inv: Record<string, unknown>) => {
    attentionItems.push({
      id: `inv-${inv.id}`,
      title: 'Overdue invoice',
      description: `Outstanding ${inv.amount != null ? `$${Number(inv.amount).toLocaleString()}` : 'amount'} · ${inv.outstanding_days ?? 0} days overdue`,
      daysOverdue: Number(inv.outstanding_days ?? 0),
      href: '/billing',
      type: 'invoice',
    })
  })

  reqList.forEach((r) => {
    if (reqIdsWithCandidates.has(r.id)) return
    attentionItems.push({
      id: `req-${r.id}`,
      title: 'Stuck hiring: 0 candidates',
      description: `${r.job_title ?? 'Role'} at ${r.prospect_name ?? 'Client'}`,
      href: '/hr/requisitions',
      type: 'hiring',
    })
  })

  riskList.slice(0, 5).forEach((c: Record<string, unknown>) => {
    const days = c.days_to_deadline as number | undefined
    attentionItems.push({
      id: `risk-${c.client_id}`,
      title: `At-risk client: ${c.client_name ?? 'Unknown'}`,
      description: (c.risk_level === 'red' ? 'Delayed' : 'At risk') + (days != null ? ` · ${days < 0 ? Math.abs(days) : days} days` : ''),
      daysOverdue: days != null && days < 0 ? Math.abs(days) : undefined,
      href: '/close-tracker',
      type: 'client',
    })
  })

  ;(openEscalations as Record<string, unknown>[] ?? []).slice(0, 5).forEach((e: Record<string, unknown>) => {
    attentionItems.push({
      id: `esc-${e.id}`,
      title: (e.title as string) ?? 'Pending approval',
      description: 'Requires immediate action',
      href: '/escalations',
      type: 'approval',
    })
  })

  attentionItems.sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0))

  const booksClosedThisMonth = Array.isArray(monthlyClosesComplete) ? monthlyClosesComplete.length : 0
  const cashSummary = cashflowSummary as Record<string, unknown> | null
  const arOutstanding = Number(s?.ar_outstanding ?? 0)
  const candidatesInPipeline = candidatesCount ?? 0

  const departmentSummary = {
    operations: {
      clientsAtRisk: riskList.filter((c: Record<string, unknown>) => c.risk_level === 'yellow' || c.risk_level === 'red').length,
      booksClosedThisMonth,
    },
    hr: {
      openRoles: openHiringRoles,
      candidatesInPipeline,
    },
    finance: {
      arOutstanding,
      cashPositionIndicator: cashSummary?.collected_this_month != null ? 'positive' : 'neutral',
    },
    it: {
      pendingRequests: Array.isArray(itPending) ? itPending.length : 0,
    },
  }

  const activityFeed: Array<{ id: string; user: string; action: string; timestamp: string }> = []
  const escForActivity = (escalationsForActivity as Record<string, unknown>[]) ?? []
  escForActivity.forEach((e: Record<string, unknown>, i: number) => {
    activityFeed.push({
      id: `esc-${i}-${e.id}`,
      user: 'System',
      action: (e.title as string) ?? 'Escalation updated',
      timestamp: (e.created_at as string) ?? now.toISOString(),
    })
  })
  const recentReqs = (recentRequisitions as Record<string, unknown>[]) ?? []
  recentReqs.forEach((r: Record<string, unknown>, i: number) => {
    activityFeed.push({
      id: `req-${i}-${r.id}`,
      user: 'HR',
      action: `Requisition: ${r.job_title ?? 'Open role'}`,
      timestamp: (r.updated_at as string) ?? now.toISOString(),
    })
  })
  activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const recentActivity = activityFeed.slice(0, 10)

  return NextResponse.json({
    kpis,
    attentionItems: attentionItems.slice(0, 12),
    departmentSummary,
    recentActivity,
  })
}
