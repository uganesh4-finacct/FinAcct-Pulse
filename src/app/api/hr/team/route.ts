import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRTeam, canEditHRTeam } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessHRTeam(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data: members, error } = await supabase
    .from('team_members')
    .select('id, name, email, role, role_title, entity, location, active, status, reports_to_id')
    .order('entity')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = members ?? []
  const reportToIds = Array.from(new Set(list.map((m: { reports_to_id?: string }) => m.reports_to_id).filter(Boolean))) as string[]
  const { data: reportToNames } = reportToIds.length
    ? await supabase.from('team_members').select('id, name').in('id', reportToIds)
    : { data: [] }
  const nameById = new Map((reportToNames ?? []).map((r: { id: string; name: string }) => [r.id, r.name]))
  const clientCounts = await Promise.all(
    list.map(async (m: { id: string }) => {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .or(`assigned_owner_id.eq.${m.id},reviewer_id.eq.${m.id},assigned_coordinator_id.eq.${m.id}`)
      return { id: m.id, client_count: count ?? 0 }
    })
  )
  const countByMemberId = new Map(clientCounts.map(c => [c.id, c.client_count]))
  const { data: permsList } = await supabase.from('user_permissions').select('team_member_id, module_access').in('team_member_id', list.map((m: { id: string }) => m.id))
  const moduleAccessById = new Map((permsList ?? []).map((p: { team_member_id: string; module_access: string[] }) => [p.team_member_id, p.module_access ?? []]))
  const enriched = list.map((m: Record<string, unknown> & { id: string; reports_to_id?: string }) => ({
    ...m,
    reports_to_name: m.reports_to_id ? nameById.get(m.reports_to_id) ?? null : null,
    client_count: countByMemberId.get(m.id) ?? 0,
    module_access: moduleAccessById.get(m.id) ?? [],
  }))
  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canEditHRTeam(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const supabase = createServiceSupabase()
  const name = (body.name ?? '').toString().trim()
  const email = (body.email ?? '').toString().trim()
  if (!name || !email) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 })
  }
  if (!email.includes('@finacctsolutions.com')) {
    return NextResponse.json({ error: 'Email must be @finacctsolutions.com' }, { status: 400 })
  }
  const payload: Record<string, unknown> = {
    name,
    email,
    phone: body.phone || null,
    role: body.role || 'support',
    role_title: body.role_title || null,
    entity: body.entity === 'india' ? 'india' : 'us',
    location: body.location === 'India' ? 'India' : 'US',
    reports_to_id: body.reports_to_id || null,
    active: body.active !== false && body.active !== 'false',
    status: body.status || 'active',
  }
  const { data: member, error: insertErr } = await supabase
    .from('team_members')
    .insert(payload)
    .select()
    .single()
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  const module_access = Array.isArray(body.module_access) ? body.module_access : []
  if (module_access.length > 0) {
    await supabase.from('user_permissions').upsert({
      team_member_id: member.id,
      module_access,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'team_member_id' })
  }
  return NextResponse.json(member)
}
