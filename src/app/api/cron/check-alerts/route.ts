import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { notifyByRole } from '@/lib/notifications'

/**
 * Runs on a schedule (e.g. daily via Vercel Cron) to check:
 * - Invoices overdue (and not paid/waived)
 * - Close steps overdue (due_date in the past, status not complete)
 * Sends in-app + email notifications per user preferences.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const results = { invoicesNotified: 0, closeStepsNotified: 0 }

  // Overdue invoices (payment_status not paid/waived, due_date < today)
  const { data: overdueInvoices } = await supabase
    .from('client_invoices')
    .select('id, client_id, invoice_number, invoiced_amount, paid_amount, due_date, payment_status')
    .lt('due_date', today)
    .neq('payment_status', 'paid')
    .neq('payment_status', 'waived')

  const invoices = overdueInvoices ?? []
  for (const inv of invoices) {
    const outstanding = Number(inv.invoiced_amount || 0) - Number(inv.paid_amount || 0)
    if (outstanding <= 0) continue
    const due = inv.due_date ? new Date(inv.due_date) : null
    const daysOverdue = due ? Math.floor((Date.now() - due.getTime()) / 86400000) : 0
    const { data: client } = await supabase.from('clients').select('name').eq('id', inv.client_id).single()
    const clientName = (client as { name?: string } | null)?.name ?? 'Client'
    const typeCode = daysOverdue >= 30 ? 'invoice_overdue_critical' : 'invoice_overdue'
    await notifyByRole(['admin', 'reviewer'], {
      typeCode,
      title: `Invoice Overdue: ${clientName}`,
      message: `Invoice #${(inv as any).invoice_number ?? inv.id.slice(0, 8)} is ${daysOverdue} days overdue ($${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
      linkUrl: `/finance/billing?client=${inv.client_id}`,
      linkLabel: 'View Billing',
      referenceType: 'invoice',
      referenceId: inv.id,
    })
    results.invoicesNotified += 1
  }

  // Overdue close steps (due_date < today, status not 'complete')
  const { data: overdueSteps } = await supabase
    .from('close_steps')
    .select('id, client_id, step_name, due_date, month_year')
    .lt('due_date', today)
    .neq('status', 'complete')

  const steps = overdueSteps ?? []
  const notifiedClients = new Set<string>()
  for (const step of steps) {
    const clientId = (step as any).client_id
    if (notifiedClients.has(clientId)) notifiedClients.add(clientId)
    else continue
    const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()
    const clientName = (client as { name?: string } | null)?.name ?? 'Client'
    const due = (step as any).due_date ? new Date((step as any).due_date) : null
    const daysOverdue = due ? Math.floor((Date.now() - due.getTime()) / 86400000) : 0
    await notifyByRole(['admin', 'reviewer', 'owner'], {
      typeCode: 'close_delay',
      title: `Close Delayed: ${clientName}`,
      message: `${(step as any).step_name ?? 'Step'} is ${daysOverdue} days overdue for ${clientName}`,
      linkUrl: `/close-tracker?client=${clientId}`,
      linkLabel: 'View Close Tracker',
      referenceType: 'client',
      referenceId: clientId,
    })
    results.closeStepsNotified += 1
  }

  return NextResponse.json({ success: true, ...results })
}
