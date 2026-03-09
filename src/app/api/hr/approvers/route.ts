import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const user = await getUserRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('team_members')
    .select('id, name, role_title')
    .in('role', ['admin', 'reviewer', 'hr_manager'])
    .eq('active', true)
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ approvers: data ?? [] })
}
