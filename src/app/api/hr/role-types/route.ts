import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { fetchHRRoleTypes } from '@/lib/hr/queries'

export async function GET() {
  const user = await getUserRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceSupabase()
  const roleTypes = await fetchHRRoleTypes(supabase)
  return NextResponse.json({ roleTypes })
}
