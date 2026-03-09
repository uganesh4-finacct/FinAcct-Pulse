import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessIT, canEditIT } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessIT(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase.from('it_domains').select('*').order('domain')
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
    domain,
    registrar,
    registration_date,
    expiry_date,
    auto_renew,
    dns_provider,
    ssl_provider,
    ssl_expiry_date,
    annual_cost,
    currency,
    notes,
  } = body
  if (!domain?.trim()) {
    return NextResponse.json({ error: 'domain required' }, { status: 400 })
  }
  const supabase = createServiceSupabase()
  const payload = {
    domain: String(domain).trim(),
    entity: 'us',
    registrar: registrar || null,
    registration_date: registration_date || null,
    expiry_date: expiry_date || null,
    auto_renew: !!auto_renew,
    dns_provider: dns_provider || null,
    ssl_provider: ssl_provider || null,
    ssl_expiry_date: ssl_expiry_date || null,
    annual_cost: annual_cost != null ? parseFloat(annual_cost) : null,
    currency: currency || 'USD',
    notes: notes || null,
    status: 'active',
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('it_domains').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
