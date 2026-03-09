import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions'
import { notifyByRole } from '@/lib/notifications'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const { paid_amount, paid_date, payment_method, payment_reference } = body
  const supabase = createServiceSupabase()
  const { data: inv } = await supabase
    .from('client_invoices')
    .select('invoiced_amount, paid_amount, invoice_number, client_id')
    .eq('id', id)
    .single()
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  const outstanding = Number(inv.invoiced_amount || 0) - Number(inv.paid_amount || 0)
  const payAmt = paid_amount != null ? parseFloat(paid_amount) : outstanding
  const payDate = paid_date || new Date().toISOString().split('T')[0]
  const status = payAmt >= Number(inv.invoiced_amount) ? 'paid' : payAmt > 0 ? 'partial' : 'pending'
  const { data, error } = await supabase
    .from('client_invoices')
    .update({
      paid_amount: payAmt,
      paid_date: payDate,
      payment_method: payment_method || null,
      payment_reference: payment_reference || null,
      payment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (payAmt > 0 && (data as any)?.client_id) {
    const { data: clientRow } = await supabase
      .from('clients')
      .select('name')
      .eq('id', (data as any).client_id)
      .single()
    const clientName = (clientRow as any)?.name ?? 'Client'
    const invoiceNumber = (inv as any).invoice_number ?? id.slice(0, 8)
    notifyByRole(['admin', 'reviewer'], {
      typeCode: 'payment_received',
      title: `Payment Received: ${clientName}`,
      message: `$${payAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })} payment received for invoice #${invoiceNumber}`,
      linkUrl: '/finance/billing',
      linkLabel: 'View Billing',
      referenceType: 'invoice',
      referenceId: id,
    }).catch(() => {})
  }

  return NextResponse.json(data)
}
