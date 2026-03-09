import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance, canEditFinance } from '@/lib/auth/permissions'

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canEditFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const clients = Array.isArray(body.clients) ? body.clients : []
  const supabase = createServiceSupabase()

  for (const client of clients) {
    const { id, base_monthly_fee, monthly_fee, billing_type, billing_start_date } = client
    if (!id) continue
    const fee = base_monthly_fee ?? monthly_fee
    await supabase
      .from('clients')
      .update({
        monthly_fee: fee != null ? parseFloat(fee) : 0,
        billing_type: billing_type || 'fixed',
        billing_start_date: billing_start_date || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
  }

  return NextResponse.json({ success: true })
}
