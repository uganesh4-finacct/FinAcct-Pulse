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
  const { data, error } = await supabase.from('deals').select('*').eq('id', id).single()
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
  const allowed = [
    'name', 'company_name', 'contact_name', 'contact_email', 'contact_phone',
    'lead_id', 'stage', 'value', 'probability', 'expected_close_date', 'owner_id', 'notes',
  ]
  const payload: Record<string, unknown> = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (key === 'value') payload[key] = body[key] != null ? Number(body[key]) : 0
      else if (key === 'probability') payload[key] = body[key] != null ? Math.min(100, Math.max(0, Number(body[key]))) : 50
      else payload[key] = body[key]
    }
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('deals').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
