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
  const asOfParam = searchParams.get('asOf')
  const asOf = asOfParam ? new Date(asOfParam) : new Date()
  const asOfStr = asOf.toISOString().slice(0, 10)
  const supabase = createServiceSupabase()

  const { data: invoices } = await supabase
    .from('client_invoices')
    .select('id, client_id, invoiced_amount, paid_amount, due_date, payment_status')
    .neq('payment_status', 'paid')
  const list = invoices ?? []
  const outstanding = list
    .map((i: { invoiced_amount?: unknown; paid_amount?: unknown }) => Number(i.invoiced_amount || 0) - Number(i.paid_amount || 0))
    .filter((a: number) => a > 0)
  if (outstanding.length === 0) {
    const { data: clients } = await supabase.from('clients').select('id, name')
    return NextResponse.json({
      asOf: asOfStr,
      clients: (clients ?? []).map((c: { id: string; name: string }) => ({
        client: c.name,
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days90plus: 0,
        total: 0,
      })),
      summary: { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 0 },
      avgDaysOutstanding: 0,
    })
  }

  const { data: clientsData } = await supabase.from('clients').select('id, name')
  const clientMap = new Map((clientsData ?? []).map((c: { id: string; name: string }) => [c.id, c.name]))

  const byClient: Record<string, { current: number; days1_30: number; days31_60: number; days61_90: number; days90plus: number }> = {}
  const summary = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 0 }
  let totalDays = 0
  let countWithDays = 0

  list.forEach((inv: { client_id: string; invoiced_amount?: unknown; paid_amount?: unknown; due_date?: string | null }) => {
    const amt = Number(inv.invoiced_amount || 0) - Number(inv.paid_amount || 0)
    if (amt <= 0) return
    const due = inv.due_date ? new Date(inv.due_date) : null
    const daysOverdue = due ? Math.floor((asOf.getTime() - due.getTime()) / 86400000) : 0
    if (due) {
      totalDays += Math.max(0, daysOverdue)
      countWithDays += 1
    }
    let current = 0
    let d1_30 = 0
    let d31_60 = 0
    let d61_90 = 0
    let d90 = 0
    if (daysOverdue <= 0) current = amt
    else if (daysOverdue <= 30) d1_30 = amt
    else if (daysOverdue <= 60) d31_60 = amt
    else if (daysOverdue <= 90) d61_90 = amt
    else d90 = amt

    const key = inv.client_id
    if (!byClient[key]) byClient[key] = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0 }
    byClient[key].current += current
    byClient[key].days1_30 += d1_30
    byClient[key].days31_60 += d31_60
    byClient[key].days61_90 += d61_90
    byClient[key].days90plus += d90
    summary.current += current
    summary.days1_30 += d1_30
    summary.days31_60 += d31_60
    summary.days61_90 += d61_90
    summary.days90plus += d90
  })
  summary.total = summary.current + summary.days1_30 + summary.days31_60 + summary.days61_90 + summary.days90plus
  const avgDaysOutstanding = countWithDays ? totalDays / countWithDays : 0

  const clients = Object.entries(byClient).map(([client_id, v]) => ({
    client: clientMap.get(client_id) || client_id,
    current: v.current,
    days1_30: v.days1_30,
    days31_60: v.days31_60,
    days61_90: v.days61_90,
    days90plus: v.days90plus,
    total: v.current + v.days1_30 + v.days31_60 + v.days61_90 + v.days90plus,
  }))

  return NextResponse.json({
    asOf: asOfStr,
    clients,
    summary,
    avgDaysOutstanding: Math.round(avgDaysOutstanding * 10) / 10,
  })
}
