import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions'

export async function POST() {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const day = now.getDate()
  const { data: recurring } = await supabase.from('finance_recurring_expenses').select('*').eq('active', true).lte('start_date', `${monthStr}-28`)
  if (!recurring?.length) return NextResponse.json({ generated: 0, message: 'No active recurring expenses' })
  const toInsert: Array<Record<string, unknown>> = []
  for (const r of recurring) {
    const start = new Date(r.start_date)
    const end = r.end_date ? new Date(r.end_date) : null
    if (end && now > end) continue
    const freq = r.frequency
    const dayOfMonth = r.day_of_month ?? 1
    let shouldGenerate = false
    if (freq === 'Monthly') shouldGenerate = day >= dayOfMonth
    else if (freq === 'Quarterly') {
      const quarterMonth = (Math.floor(now.getMonth() / 3) + 1) * 3
      shouldGenerate = now.getMonth() + 1 === quarterMonth && day >= dayOfMonth
    } else if (freq === 'Annual') shouldGenerate = now.getMonth() === 0 && day >= dayOfMonth
    if (!shouldGenerate) continue
    toInsert.push({
      name: r.name,
      description: r.description,
      category_id: r.category_id,
      entity: r.entity,
      expense_date: `${monthStr}-${String(dayOfMonth).padStart(2, '0')}`,
      expense_month: monthStr,
      amount: r.amount,
      currency: r.currency,
      amount_usd: r.currency === 'USD' ? r.amount : r.amount_usd,
      vendor_name: r.vendor_name,
      status: 'pending',
    })
  }
  if (toInsert.length === 0) return NextResponse.json({ generated: 0, message: 'No recurring expenses due this month' })
  const { data: inserted, error } = await supabase.from('finance_expenses').insert(toInsert).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ generated: inserted?.length ?? 0, expenses: inserted })
}
