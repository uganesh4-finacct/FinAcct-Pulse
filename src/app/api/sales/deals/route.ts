import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessSales } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessSales(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data: deals, error } = await supabase
    .from('deals')
    .select('*')
    .order('expected_close_date', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (deals ?? []) as Array<Record<string, unknown>>
  const totalDeals = list.length
  const pipelineDeals = list.filter((d) => d.stage !== 'Lost')
  const pipelineValue = pipelineDeals.reduce((s, d) => s + Number(d.value ?? 0), 0)
  const avgDealSize = totalDeals > 0 ? pipelineDeals.reduce((s, d) => s + Number(d.value ?? 0), 0) / totalDeals : 0
  const won = list.filter((d) => d.stage === 'Won').length
  const lost = list.filter((d) => d.stage === 'Lost').length
  const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0

  return NextResponse.json({
    deals: list,
    stats: {
      totalDeals,
      pipelineValue,
      avgDealSize: Math.round(avgDealSize * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
    },
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessSales(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const {
    name,
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    lead_id,
    stage,
    value,
    probability,
    expected_close_date,
    owner_id,
    notes,
  } = body
  if (!name || !company_name) return NextResponse.json({ error: 'Deal name and company required' }, { status: 400 })

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('deals')
    .insert({
      name,
      company_name,
      contact_name: contact_name || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      lead_id: lead_id || null,
      stage: stage || 'Discovery',
      value: value != null ? Number(value) : 0,
      probability: probability != null ? Math.min(100, Math.max(0, Number(probability))) : 50,
      expected_close_date: expected_close_date || null,
      owner_id: owner_id || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
