import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceSupabase()
  const { data } = await supabase
    .from('contracts')
    .select('*, clients(name, vertical, monthly_fee, team_members!assigned_owner_id(name))')
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { id, client_id, ...fields } = body
  fields.updated_at = new Date().toISOString()
  let q = supabase.from('contracts').update(fields)
  if (client_id != null) {
    q = q.eq('client_id', client_id)
  } else if (id != null) {
    q = q.eq('id', id)
  } else {
    return NextResponse.json({ error: 'id or client_id required' }, { status: 400 })
  }
  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { error } = await supabase.from('contracts').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
