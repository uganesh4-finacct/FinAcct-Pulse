import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleData = await getUserRole()
  if (!roleData || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const supabase = createServiceSupabase()
  const { data: member, error: fetchError } = await supabase
    .from('team_members')
    .select('id, email, status')
    .eq('id', id)
    .single()
  if (fetchError || !member) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (member.status !== 'invited') {
    return NextResponse.json({ error: 'User is not pending invite' }, { status: 400 })
  }
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(member.email, {
    data: { team_member_id: member.id },
  })
  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
