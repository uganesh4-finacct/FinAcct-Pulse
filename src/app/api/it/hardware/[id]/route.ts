import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessIT, canEditIT, canDeleteIT } from '@/lib/auth/permissions'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canAccessIT(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('it_hardware').select('*, team_members!assigned_to(id, name)').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(data)
}

const PATCH_KEYS = ['asset_tag', 'name', 'type', 'brand', 'model', 'serial_no', 'assigned_to', 'entity', 'location', 'status', 'condition', 'purchase_date', 'warranty_expiry', 'value', 'currency', 'specs', 'notes'] as const

export async function PATCH(req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditIT(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceSupabase()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of PATCH_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key]
  }
  if (payload.entity === 'India') payload.entity = 'india'
  else if (payload.entity === 'US') payload.entity = 'us'
  if (payload.assigned_to === '') payload.assigned_to = null
  if (payload.value != null) payload.value = parseFloat(String(payload.value))
  const { data, error } = await supabase.from('it_hardware').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canDeleteIT(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { error } = await supabase.from('it_hardware').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
