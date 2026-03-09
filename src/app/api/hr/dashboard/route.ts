import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRDashboard } from '@/lib/auth/permissions'
import { fetchHRDashboardSummary, fetchHRPipelineByRequisition } from '@/lib/hr/queries'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const [summary, pipeline] = await Promise.all([
    fetchHRDashboardSummary(supabase),
    fetchHRPipelineByRequisition(supabase),
  ])
  return NextResponse.json({ summary, pipeline })
}
