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
  const month = new Date().toISOString().slice(0, 7)
  const monthFirst = `${month}-01`
  const { data: clients } = await supabase.from('clients').select('id, name, monthly_fee').eq('active', true)
  if (!clients?.length) return NextResponse.json({ generated: 0, message: 'No active clients' })
  const { data: existing } = await supabase.from('client_invoices').select('client_id').gte('invoice_month', monthFirst).lt('invoice_month', monthFirst.slice(0, 7) + '-32')
  const existingClientIds = new Set((existing ?? []).map((e: { client_id: string }) => e.client_id))
  const toInsert = clients.filter((c: { id: string }) => !existingClientIds.has(c.id)).map((c: { id: string; monthly_fee?: number }) => {
    const fee = Number(c.monthly_fee ?? 0)
    return {
      client_id: c.id,
      invoice_month: monthFirst,
      base_amount: fee,
      invoiced_amount: fee,
      india_tp_amount: Math.round(fee * 0.9 * 100) / 100,
      payment_status: 'pending',
      india_tp_status: 'pending',
    }
  })
  if (toInsert.length === 0) return NextResponse.json({ generated: 0, message: 'All clients already have invoices for this month' })
  const { data: inserted, error } = await supabase.from('client_invoices').insert(toInsert).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ generated: inserted?.length ?? 0, invoices: inserted })
}
