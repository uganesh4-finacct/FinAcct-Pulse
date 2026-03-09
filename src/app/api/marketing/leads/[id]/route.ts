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
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
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
  const allowed = [
    'contact_name', 'company_name', 'vertical', 'source', 'contact_email', 'contact_phone',
    'lead_owner_id', 'status', 'notes', 'attachment_url', 'priority',
  ]
  const payload: Record<string, unknown> = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key]
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessMarketing(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
