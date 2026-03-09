import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const IT_TABLES = ['it_domains', 'it_software', 'it_hardware', 'it_licenses'] as const
type ItTable = (typeof IT_TABLES)[number]

export async function GET() {
  const supabase = createServiceSupabase()

  const [domainsRes, softwareRes, hardwareRes, licensesRes, alertsRes] = await Promise.all([
    supabase.from('it_domains').select('*').order('entity').order('domain'),
    supabase.from('it_software').select('*').order('entity').order('name'),
    supabase.from('it_hardware').select('*, team_members!assigned_to(id, name)').order('entity').order('asset'),
    supabase.from('it_licenses').select('*').order('entity').order('software'),
    supabase.from('v_it_expiry_alerts').select('*'),
  ])

  const domains = domainsRes.data ?? []
  const software = softwareRes.data ?? []
  const hardware = hardwareRes.data ?? []
  const licenses = licensesRes.data ?? []
  const alerts = alertsRes.data ?? []

  return NextResponse.json({
    domains,
    software,
    hardware,
    licenses,
    alerts,
  })
}

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { table, data } = body
  if (!table || !IT_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table. Must be one of: it_domains, it_software, it_hardware, it_licenses' }, { status: 400 })
  }
  const { data: row, error } = await supabase.from(table).insert(data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, row })
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { table, id, ...fields } = body
  if (!table || !id || !IT_TABLES.includes(table)) {
    return NextResponse.json({ error: 'table and id required; table must be one of: it_domains, it_software, it_hardware, it_licenses' }, { status: 400 })
  }
  const updates = { ...fields, updated_at: new Date().toISOString() }
  const { error } = await supabase.from(table).update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { table, id } = body
  if (!table || !id || !IT_TABLES.includes(table)) {
    return NextResponse.json({ error: 'table and id required' }, { status: 400 })
  }
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
