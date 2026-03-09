import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const full = searchParams.get('full') === '1'
  if (full) {
    const [membersRes, workloadRes] = await Promise.all([
      supabase.from('team_members').select('*').order('entity').order('name'),
      (async () => {
        const r = await supabase.from('v_workload_by_owner').select('*')
        return r.data ?? []
      })(),
    ])
    return NextResponse.json({ members: membersRes.data ?? [], workload: workloadRes })
  }
  const { data } = await supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .order('entity').order('name')
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const { id, ...fields } = await req.json()
  const { error } = await supabase.from('team_members').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

const TEAM_MEMBER_KEYS = ['name', 'email', 'role', 'role_title', 'entity', 'active'] as const

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const payload: Record<string, unknown> = {}
  for (const key of TEAM_MEMBER_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key]
  }
  if (!payload.name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  payload.active = payload.active !== false && payload.active !== 'false'
  const { data, error } = await supabase.from('team_members').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
