import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET() {
  const user = await getUserRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceSupabase()
  const [typesRes, prefsRes] = await Promise.all([
    supabase.from('notification_types').select('id, code, name, category, default_email, default_in_app').order('category').order('name'),
    supabase.from('notification_preferences').select('type_id, email_enabled, in_app_enabled').eq('user_id', user.team_member_id),
  ])
  const types = typesRes.data ?? []
  const prefsList = prefsRes.data ?? []
  const prefsByType = Object.fromEntries(prefsList.map((p: { type_id: string; email_enabled: boolean; in_app_enabled: boolean }) => [p.type_id, { email_enabled: p.email_enabled, in_app_enabled: p.in_app_enabled }]))

  return NextResponse.json({
    types,
    preferences: prefsByType,
  })
}

export async function PUT(req: Request) {
  const user = await getUserRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const items = Array.isArray(body.preferences) ? body.preferences : []
  const supabase = createServiceSupabase()

  for (const item of items) {
    const { type_id, email_enabled, in_app_enabled } = item
    if (!type_id) continue
    await supabase.from('notification_preferences').upsert(
      {
        user_id: user.team_member_id,
        type_id,
        email_enabled: !!email_enabled,
        in_app_enabled: !!in_app_enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,type_id' }
    )
  }

  return NextResponse.json({ success: true })
}
