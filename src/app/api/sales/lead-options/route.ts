import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessSales } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

/** Returns minimal lead list for deal "Lead Source" dropdown. Sales-only. */
export async function GET() {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessSales(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('leads')
    .select('id, company_name, contact_name')
    .order('company_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
