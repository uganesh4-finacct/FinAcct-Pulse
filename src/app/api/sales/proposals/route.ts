import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessSales } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessSales(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const supabase = createServiceSupabase()
  let q = supabase.from('sales_proposals').select('*, deals(id, name, company_name)').order('created_at', { ascending: false })
  if (status && status.trim()) q = q.eq('status', status.trim())
  const { data: proposals, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (proposals ?? []) as Array<Record<string, unknown>>
  const total = list.length
  const pending = list.filter((p) => ['Draft', 'Sent', 'Viewed'].includes(String(p.status))).length
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const sentThisMonth = list.filter((p) => {
    const sent = p.sent_date as string | null
    return sent && sent >= monthStart
  }).length
  const accepted = list.filter((p) => p.status === 'Accepted').length

  return NextResponse.json({
    proposals: list,
    stats: { total, pending, sentThisMonth, accepted },
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessSales(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const { deal_id, name, amount, status, sent_date, valid_until, document_url, notes } = body
  if (!deal_id || !name) return NextResponse.json({ error: 'Deal and proposal name required' }, { status: 400 })

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('sales_proposals')
    .insert({
      deal_id,
      name,
      amount: amount != null ? Number(amount) : 0,
      status: status || 'Draft',
      sent_date: sent_date || null,
      valid_until: valid_until || null,
      document_url: document_url || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
