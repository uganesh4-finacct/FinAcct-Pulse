import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessMarketing } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessMarketing(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessMarketing(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const allowed = ['name', 'platform', 'type', 'status', 'budget', 'spent', 'start_date', 'end_date', 'notes', 'leads_generated']
  const payload: Record<string, unknown> = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      if (['budget', 'spent'].includes(key)) payload[key] = body[key] != null ? Number(body[key]) : null
      else if (['leads_generated'].includes(key)) payload[key] = body[key] != null ? Number(body[key]) : 0
      else payload[key] = body[key]
    }
  }
  if (payload.platform) (payload as Record<string, string>).type = 'Paid_Ad'
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('campaigns').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
