import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessMarketing } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessMarketing(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (campaigns ?? []) as Array<Record<string, unknown>>
  const active = list.filter((c) => c.status === 'Active').length
  const totalSpend = list.reduce((s, c) => s + Number(c.spent ?? 0), 0)
  const totalLeads = list.reduce((s, c) => s + Number(c.leads_generated ?? 0), 0)
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0

  return NextResponse.json({
    campaigns: list,
    stats: {
      activeCampaigns: active,
      totalSpend,
      leadsGenerated: totalLeads,
      avgCpl: Math.round(avgCpl * 100) / 100,
    },
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessMarketing(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const { name, platform, status, budget, start_date, end_date, notes } = body
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name,
      type: platform || 'Paid_Ad',
      platform: platform || null,
      status: status || 'Planning',
      budget: budget != null ? Number(budget) : null,
      spent: 0,
      start_date: start_date || null,
      end_date: end_date || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
