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
  const year = searchParams.get('year')
  const vertical = searchParams.get('vertical')
  const yearNum = year ? parseInt(year, 10) : new Date().getFullYear()
  const supabase = createServiceSupabase()

  const start = `${yearNum}-01-01`
  const end = `${yearNum}-12-31`
  const { data: invoices } = await supabase
    .from('client_invoices')
    .select('id, client_id, invoice_month, invoiced_amount, paid_amount, payment_status')
    .gte('invoice_month', start)
    .lte('invoice_month', end)
  const { data: clientsData } = await supabase.from('clients').select('id, name, vertical')
  const clientMap = new Map<string, { id: string; name: string; vertical?: string }>((clientsData ?? []).map((c: { id: string; name: string; vertical?: string }) => [c.id, c]))
  let list = invoices ?? []
  if (vertical) {
    const clientIds = Array.from(clientMap.entries()).filter(([, c]) => c.vertical === vertical).map(([id]) => id)
    list = list.filter((i: { client_id: string }) => clientIds.includes(i.client_id))
  }

  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  const byClient: Record<string, { vertical: string; billed: Record<string, number>; collected: Record<string, number>; totalBilled: number; totalCollected: number }> = {}
  list.forEach((inv: { client_id: string; invoice_month: string; invoiced_amount?: unknown; paid_amount?: unknown }) => {
    const cid = inv.client_id
    const client = clientMap.get(cid) as { name: string; vertical?: string } | undefined
    if (!byClient[cid]) {
      const v = client?.vertical ?? ''
      byClient[cid] = { vertical: v, billed: {}, collected: {}, totalBilled: 0, totalCollected: 0 }
      months.forEach(m => { byClient[cid].billed[`${yearNum}-${m}`] = 0; byClient[cid].collected[`${yearNum}-${m}`] = 0 })
    }
    const monthStr = inv.invoice_month?.slice(0, 7)
    const billed = Number(inv.invoiced_amount || 0)
    const collected = Number(inv.paid_amount || 0)
    if (monthStr) {
      byClient[cid].billed[monthStr] = (byClient[cid].billed[monthStr] || 0) + billed
      byClient[cid].collected[monthStr] = (byClient[cid].collected[monthStr] || 0) + collected
    }
    byClient[cid].totalBilled += billed
    byClient[cid].totalCollected += collected
  })

  const clients = Object.entries(byClient).map(([client_id, v]) => {
    const client = clientMap.get(client_id) as { name: string } | undefined
    const row: Record<string, unknown> = {
      client: client?.name ?? client_id,
      vertical: v.vertical,
      totalBilled: v.totalBilled,
      totalCollected: v.totalCollected,
      outstanding: v.totalBilled - v.totalCollected,
    }
    months.forEach((m, i) => {
      const key = `${yearNum}-${m}`
      row[`month_${i}`] = v.billed[key] ?? 0
    })
    return row
  })

  const totalBilled = clients.reduce((s, c) => s + Number(c.totalBilled || 0), 0)
  const totalCollected = clients.reduce((s, c) => s + Number(c.totalCollected || 0), 0)
  const collectionRate = totalBilled ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 0

  return NextResponse.json({
    year: yearNum,
    clients,
    summary: { totalBilled, totalCollected, collectionRate },
  })
}
