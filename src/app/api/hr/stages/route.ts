import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRDashboard } from '@/lib/auth/permissions'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('hiring_stages')
    .select('*')
    .order('sort_order')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
