import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessSales } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessSales(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('sales_proposals')
    .select('*, deals(id, name, company_name)')
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessSales(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const allowed = ['deal_id', 'name', 'amount', 'status', 'sent_date', 'valid_until', 'document_url', 'notes']
  const payload: Record<string, unknown> = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (key === 'amount') payload[key] = body[key] != null ? Number(body[key]) : 0
      else payload[key] = body[key]
    }
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('sales_proposals').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
