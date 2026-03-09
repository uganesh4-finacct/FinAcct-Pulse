import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const supabase = createServiceSupabase()
  if (!month) return NextResponse.json({ month: null, confirmed_at: null, confirmed_by: null, notes: null })
  const { data, error } = await supabase.from('finance_monthly_status').select('*').eq('month', month).single()
  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? { month, confirmed_at: null, confirmed_by: null, notes: null })
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const month = body.month || new Date().toISOString().slice(0, 7)
  const supabase = createServiceSupabase()
  const { error } = await supabase.from('finance_monthly_status').upsert({
    month,
    confirmed_at: new Date().toISOString(),
    confirmed_by: user.team_member_id || null,
    notes: body.notes || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'month' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
