import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessIT, canEditIT, canDeleteIT } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessIT(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const entity = searchParams.get('entity')
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const assignedTo = searchParams.get('assignedTo')
  const supabase = createServiceSupabase()
  let q = supabase.from('it_hardware').select('*, team_members!assigned_to(id, name)').order('asset_tag').order('asset')
  if (entity && entity !== 'all') {
    if (entity === 'US') q = q.or('entity.eq.us,entity.eq.both')
    else if (entity === 'India') q = q.or('entity.eq.india,entity.eq.both')
  }
  if (type) q = q.eq('type', type)
  if (status) q = q.eq('status', status)
  if (assignedTo === 'assigned') q = q.not('assigned_to', 'is', null)
  else if (assignedTo === 'unassigned') q = q.is('assigned_to', null)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canEditIT(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const {
    asset_tag,
    name,
    type,
    brand,
    model,
    serial_no,
    assigned_to,
    entity,
    location,
    status,
    condition,
    purchase_date,
    warranty_expiry,
    value,
    purchase_cost,
    currency,
    specs,
    notes,
  } = body
  if (!name && !asset_tag) {
    return NextResponse.json({ error: 'name or asset_tag required' }, { status: 400 })
  }
  const supabase = createServiceSupabase()
  const payload = {
    asset: asset_tag || name || 'Asset',
    name: name || null,
    asset_tag: asset_tag || null,
    type: type || null,
    brand: brand || null,
    model: model || null,
    serial_no: serial_no || null,
    assigned_to: assigned_to || null,
    entity: entity === 'India' ? 'india' : entity === 'US' ? 'us' : 'us',
    location: location || null,
    status: status || 'active',
    condition: condition || 'good',
    purchase_date: purchase_date || null,
    warranty_expiry: warranty_expiry || null,
    value: value != null ? parseFloat(value) : purchase_cost != null ? parseFloat(purchase_cost) : null,
    currency: currency || 'USD',
    specs: specs || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('it_hardware').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
