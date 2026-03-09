import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceSupabase()
  const { data } = await supabase
    .from('invoices')
    .select('*, clients(name, vertical, team_members!assigned_owner_id(name))')
    .order('month_year', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const { id, tp_transfer_status, tp_transfer_date } = await req.json()
  const { error } = await supabase
    .from('invoices')
    .update({ tp_transfer_status, tp_transfer_date })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
