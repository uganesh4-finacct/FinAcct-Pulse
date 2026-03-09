import { NextResponse } from 'next/server'
import { getCurrentUserWithPermissions, canAccessOperations } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessOperations(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const week = searchParams.get('week')
  const managerId = searchParams.get('managerId')

  const supabase = createServiceSupabase()
  let q = supabase
    .from('weekly_reports')
    .select('*, team_members!manager_id(id, name)')
    .order('week_ending', { ascending: false })

  const isAdmin = user?.role === 'admin' || user?.role === 'default' || user?.role === 'reviewer'
  if (!isAdmin && user?.team_member_id) {
    q = q.eq('manager_id', user.team_member_id)
  }
  if (week) q = q.eq('week_ending', week)
  if (managerId) q = q.eq('manager_id', managerId)

  const { data: reports, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (reports ?? []) as Array<Record<string, unknown>>
  const now = new Date()
  const day = now.getDay()
  const fridayOffset = day <= 5 ? 5 - day : 7 - day + 5
  const thisFriday = new Date(now)
  thisFriday.setDate(now.getDate() + fridayOffset)
  const thisWeekEnd = thisFriday.toISOString().slice(0, 10)
  const reportsThisWeek = list.filter((r) => r.week_ending === thisWeekEnd).length
  const pendingReview = list.filter((r) => r.status === 'submitted').length
  const booksClosedSum = list.reduce((s, r) => s + Number(r.books_closed_this_week ?? 0), 0)
  const totalBacklog = list.reduce((s, r) => s + Number(r.backlog_count ?? 0), 0)

  return NextResponse.json({
    reports: list,
    stats: {
      reportsThisWeek,
      pendingReview,
      booksClosedSum,
      totalBacklog,
    },
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessOperations(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const {
    week_ending,
    clients_managed,
    books_closed_this_week,
    books_pending_close,
    backlog_count,
    client_issues,
    team_issues,
    top_priorities_next_week,
    help_needed_leadership,
    status,
  } = body
  if (!week_ending) return NextResponse.json({ error: 'week_ending required' }, { status: 400 })

  const managerId = user?.team_member_id ?? null
  if (!managerId) return NextResponse.json({ error: 'User not linked to team member' }, { status: 400 })

  const supabase = createServiceSupabase()
  const { data, error } = await supabase
    .from('weekly_reports')
    .insert({
      manager_id: managerId,
      week_ending: week_ending,
      clients_managed: clients_managed != null ? Number(clients_managed) : 0,
      books_closed_this_week: books_closed_this_week != null ? Number(books_closed_this_week) : 0,
      books_pending_close: books_pending_close != null ? Number(books_pending_close) : 0,
      backlog_count: backlog_count != null ? Number(backlog_count) : 0,
      client_issues: client_issues ?? null,
      team_issues: team_issues ?? null,
      top_priorities_next_week: top_priorities_next_week ?? null,
      help_needed_leadership: help_needed_leadership ?? null,
      status: status === 'submitted' ? 'submitted' : 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
