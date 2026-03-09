import { createServiceSupabase } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('update_action_items')
    .select('*')
    .eq('client_update_id', params.id)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceSupabase()
  const body = await request.json()
  const { data, error } = await supabase
    .from('update_action_items')
    .insert({
      client_update_id: params.id,
      description: body.description ?? '',
      owner: body.owner ?? null,
      due_date: body.due_date || null,
      priority: body.priority ?? 'medium',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: cu } = await supabase
    .from('client_updates')
    .select('action_items_count')
    .eq('id', params.id)
    .single()
  const count = (cu?.action_items_count ?? 0) + 1
  await supabase
    .from('client_updates')
    .update({ action_items_count: count, updated_at: new Date().toISOString() })
    .eq('id', params.id)
  return NextResponse.json(data)
}
