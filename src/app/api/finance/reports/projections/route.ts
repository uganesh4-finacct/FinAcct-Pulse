import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data: rows, error } = await supabase.from('v_billing_projections').select('*').order('client_name').order('month_year')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = rows ?? []
  const byClient = new Map<string, { client_name: string; months: Record<string, number> }>()
  list.forEach((r: { client_id: string; client_name: string; month_year: string; projected_amount?: unknown }) => {
    const name = r.client_name || r.client_id
    if (!byClient.has(r.client_id)) byClient.set(r.client_id, { client_name: name, months: {} })
    const rec = byClient.get(r.client_id)!
    rec.months[r.month_year] = Number(r.projected_amount || 0)
  })
  const monthOrder = Array.from(new Set(list.map((r: { month_year: string }) => r.month_year))).sort() as string[]
  const clients = Array.from(byClient.entries()).map(([client_id, rec]) => {
    const row: Record<string, unknown> = { client_id, client: rec.client_name }
    monthOrder.forEach((m, i) => { row[`month_${i}`] = rec.months[m] ?? 0 })
    const annual = monthOrder.reduce((s: number, m) => s + (rec.months[m] ?? 0), 0)
    row.annualTotal = annual
    return row
  })
  const totalAnnual = clients.reduce((s: number, c: Record<string, unknown>) => s + Number(c.annualTotal || 0), 0)
  const activeClients = clients.length
  const avgMonthly = activeClients ? totalAnnual / 12 : 0
  return NextResponse.json({
    monthLabels: monthOrder,
    clients,
    summary: { totalAnnualProjected: totalAnnual, averageMonthly: avgMonthly, activeClients },
  })
}
