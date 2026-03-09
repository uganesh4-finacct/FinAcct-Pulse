import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessFinance } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, vertical, monthly_fee, billing_type, billing_start_date, payment_terms, billing_contact_email, billing_notes, active')
    .eq('active', true)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clientsWithStatus = (clients ?? []).map((c: Record<string, unknown>) => ({
    ...c,
    base_monthly_fee: c.monthly_fee,
    billing_status:
      c.monthly_fee != null && Number(c.monthly_fee) > 0 ? 'configured' : 'not_configured',
  }))

  return NextResponse.json(clientsWithStatus)
}
