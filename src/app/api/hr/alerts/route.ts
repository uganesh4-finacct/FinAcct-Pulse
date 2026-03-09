import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRDashboard } from '@/lib/auth/permissions'
import { fetchHRAlerts } from '@/lib/hr/queries'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const alerts = await fetchHRAlerts(supabase)
  return NextResponse.json({ alerts })
}
