import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceSupabase()
  const [{ data: costs }, { data: salaries }] = await Promise.all([
    supabase.from('cost_centers').select('*').order('entity').order('category'),
    supabase.from('salary_records')
      .select('*, team_members(id, name, entity, role_title)')
      .is('effective_to', null),
  ])
  return NextResponse.json({ costs: costs ?? [], salaries: salaries ?? [] })
}

const ALLOWED_TABLES = ['cost_centers', 'salary_records'] as const

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const { table, data } = await req.json()
  if (!table || !ALLOWED_TABLES.includes(table as typeof ALLOWED_TABLES[number])) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }
  const { error } = await supabase.from(table).insert(data)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const { table, id, ...fields } = await req.json()
  const { error } = await supabase.from(table).update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const supabase = createServiceSupabase()
  const { table, id } = await req.json()
  if (!table || !ALLOWED_TABLES.includes(table as typeof ALLOWED_TABLES[number]) || !id) {
    return NextResponse.json({ error: 'table and id required' }, { status: 400 })
  }
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
