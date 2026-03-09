import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessMarketing } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessMarketing(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const source = searchParams.get('source')
  const status = searchParams.get('status')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const supabase = createServiceSupabase()
  let q = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (source) q = q.eq('source', source)
  if (status) q = q.eq('status', status)
  if (dateFrom) q = q.gte('created_at', dateFrom)
  if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59.999Z')

  const { data: leads, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (leads ?? []) as Array<Record<string, unknown>>
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const total = list.length
  const thisWeek = list.filter((l) => (l.created_at as string) >= weekAgo).length
  const qualified = list.filter((l) => l.status === 'Qualified' || l.status === 'Proposal_Sent' || l.status === 'Negotiating').length
  const converted = list.filter((l) => l.status === 'Won').length

  return NextResponse.json({
    leads: list,
    stats: { total, thisWeek, qualified, converted },
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessMarketing(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const {
    contact_name,
    company_name,
    vertical,
    source,
    contact_email,
    contact_phone,
    lead_owner_id,
    status,
    notes,
    attachment_url,
  } = body
  if (!company_name) return NextResponse.json({ error: 'Company name required' }, { status: 400 })

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('leads')
    .insert({
      company_name,
      contact_name: contact_name || null,
      vertical: vertical || null,
      source: source || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      lead_owner_id: lead_owner_id || null,
      status: status || 'New',
      notes: notes || null,
      attachment_url: attachment_url || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
