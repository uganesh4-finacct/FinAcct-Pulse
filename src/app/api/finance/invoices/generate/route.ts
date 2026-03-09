import { NextRequest, NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canEditFinance } from '@/lib/auth/permissions'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`
  if (!isCron) {
    const user = await getUserRole()
    if (!user || !canEditFinance(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let body: { month?: string } = {}
  try {
    body = await request.json()
  } catch {
    // no body
  }
  const monthInput = body.month // Format: '2026-03' or '2026-03-01'

  const targetMonth = monthInput ? new Date(monthInput) : new Date()
  const invoiceMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1)
  const y = invoiceMonth.getFullYear()
  const m = String(invoiceMonth.getMonth() + 1).padStart(2, '0')
  const invoiceMonthStr = `${y}-${m}-01`

  // Previous month for carry-forward
  const prevMonth = new Date(invoiceMonth.getFullYear(), invoiceMonth.getMonth() - 1, 1)
  const py = prevMonth.getFullYear()
  const pm = String(prevMonth.getMonth() + 1).padStart(2, '0')
  const prevMonthStr = `${py}-${pm}-01`

  const supabase = createServiceSupabase()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, monthly_fee, base_monthly_fee, payment_terms')
    .eq('active', true)

  const withBilling = (clients ?? []).filter(
    (c: { monthly_fee?: number | null; base_monthly_fee?: number | null }) =>
      Number(c.monthly_fee ?? c.base_monthly_fee ?? 0) > 0
  )

  if (withBilling.length === 0) {
    return NextResponse.json({ message: 'No clients with billing configured', created: 0 })
  }

  const { data: prevInvoices } = await supabase
    .from('client_invoices')
    .select('client_id, invoiced_amount, base_amount')
    .eq('invoice_month', prevMonthStr)

  const prevInvoiceMap = new Map(
    (prevInvoices ?? []).map((inv: { client_id: string; invoiced_amount?: number; base_amount?: number }) => [
      inv.client_id,
      inv,
    ])
  )

  const { data: existingInvoices } = await supabase
    .from('client_invoices')
    .select('client_id')
    .eq('invoice_month', invoiceMonthStr)

  const existingClientIds = new Set((existingInvoices ?? []).map((inv: { client_id: string }) => inv.client_id))

  const invoicesToCreate: Array<{
    client_id: string
    invoice_month: string
    base_amount: number
    invoiced_amount: number
    invoice_date: string
    due_date: string
    payment_status: string
    india_tp_status: string
  }> = []

  for (const client of withBilling) {
    const c = client as {
      id: string
      monthly_fee?: number | null
      base_monthly_fee?: number | null
      payment_terms?: number | null
    }
    if (existingClientIds.has(c.id)) continue

    const prevInvoice = prevInvoiceMap.get(c.id)
    const baseAmount =
      prevInvoice?.invoiced_amount ??
      prevInvoice?.base_amount ??
      Number(c.monthly_fee ?? c.base_monthly_fee ?? 0)

    const paymentTerms = c.payment_terms != null ? Number(c.payment_terms) : 7
    const dueDate = new Date(invoiceMonth)
    dueDate.setDate(dueDate.getDate() + paymentTerms)

    invoicesToCreate.push({
      client_id: c.id,
      invoice_month: invoiceMonthStr,
      base_amount: baseAmount,
      invoiced_amount: baseAmount,
      invoice_date: invoiceMonthStr,
      due_date: dueDate.toISOString().slice(0, 10),
      payment_status: 'pending',
      india_tp_status: 'pending',
    })
  }

  if (invoicesToCreate.length === 0) {
    return NextResponse.json({
      message: 'All clients already have invoices for this month',
      created: 0,
    })
  }

  const { data: inserted, error } = await supabase
    .from('client_invoices')
    .insert(invoicesToCreate)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    message: `Generated ${inserted?.length ?? 0} invoices for ${invoiceMonthStr}`,
    created: inserted?.length ?? 0,
    invoices: inserted ?? [],
  })
}
