import { NextRequest, NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const user = await getUserRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceSupabase()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const readFilter = searchParams.get('read')
  const category = searchParams.get('category')

  let q = supabase
    .from('notifications')
    .select('id, type_id, type_code, title, message, link_url, read, created_at')
    .eq('user_id', user.team_member_id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (readFilter === 'true') q = q.eq('read', true)
  else if (readFilter === 'false') q = q.eq('read', false)

  const { data: notifications, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let list = notifications ?? []
  if (category && category !== 'all') {
    const { data: types } = await supabase.from('notification_types').select('id, category').eq('category', category)
    const typeIds = new Set((types ?? []).map((t: { id: string }) => t.id))
    list = list.filter((n: { type_id?: string | null }) => n.type_id && typeIds.has(n.type_id))
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.team_member_id)
    .eq('read', false)

  return NextResponse.json({
    notifications: list,
    unreadCount: unreadCount ?? 0,
  })
}
