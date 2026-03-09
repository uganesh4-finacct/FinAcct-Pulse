import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const {
    base_monthly_fee,
    monthly_fee,
    billing_type,
    billing_start_date,
    payment_terms,
    billing_contact_email,
    billing_notes,
  } = body

  const fee = base_monthly_fee ?? monthly_fee
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (fee !== undefined) payload.monthly_fee = fee != null ? parseFloat(fee) : 0
  if (billing_type !== undefined) payload.billing_type = billing_type || null
  if (billing_start_date !== undefined) payload.billing_start_date = billing_start_date || null
  if (payment_terms !== undefined) payload.payment_terms = payment_terms != null ? parseInt(payment_terms, 10) : null
  if (billing_contact_email !== undefined) payload.billing_contact_email = billing_contact_email || null
  if (billing_notes !== undefined) payload.billing_notes = billing_notes || null

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
