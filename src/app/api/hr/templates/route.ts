import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessHRTemplates } from '@/lib/auth/permissions'
import { fetchHRTemplates } from '@/lib/hr/queries'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessHRTemplates(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const templates = await fetchHRTemplates(supabase)
  return NextResponse.json({ templates })
}

export async function POST(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessHRTemplates(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const supabase = createServiceSupabase()
  const payload = {
    role_type_id: body.role_type_id ?? null,
    title: body.title,
    market: body.market,
    vertical: body.vertical,
    experience_min_years: body.experience_min_years ?? null,
    experience_max_years: body.experience_max_years ?? null,
    core_skills: body.core_skills ?? [],
    jd_summary: body.jd_summary ?? null,
    jd_full_url: body.jd_full_url ?? null,
    jd_full_text: body.jd_full_text ?? null,
  }
  const { data, error } = await supabase.from('hr_templates').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
