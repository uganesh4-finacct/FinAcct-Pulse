import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const transfer_date = body.transfer_date || new Date().toISOString().split('T')[0]
  const notes = body.notes || body.reference || null
  const supabase = createServiceSupabase()
  const { data: inv } = await supabase.from('client_invoices').select('india_tp_amount, invoiced_amount, notes').eq('id', id).single()
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  const invWithNotes = inv as { india_tp_amount: unknown; invoiced_amount: unknown; notes?: string | null }
  const tpAmount = invWithNotes.india_tp_amount ?? Math.round(Number(invWithNotes.invoiced_amount || 0) * 0.9 * 100) / 100
  const { data, error } = await supabase
    .from('client_invoices')
    .update({
      india_tp_status: 'transferred',
      india_tp_date: transfer_date,
      india_tp_amount: tpAmount,
      notes: notes ? `${invWithNotes.notes || ''}\nTP: ${notes}`.trim() : invWithNotes.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
