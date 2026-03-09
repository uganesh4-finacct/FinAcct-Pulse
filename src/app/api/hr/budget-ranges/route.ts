import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRBudget } from '@/lib/auth/permissions'
import { fetchHRBudgetRanges } from '@/lib/hr/queries'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRBudget(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const market = (searchParams.get('market') || 'India') as 'India' | 'US'
  const supabase = createServiceSupabase()
  const ranges = await fetchHRBudgetRanges(supabase, market)
  return NextResponse.json({ ranges })
}

export async function PATCH(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRBudget(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const supabase = createServiceSupabase()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const allowed = ['monthly_min', 'monthly_max', 'annual_min', 'annual_max']
  const payload: Record<string, unknown> = {}
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, k)) payload[k] = updates[k]
  }
  const { data, error } = await supabase.from('hr_budget_ranges').update(payload).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
