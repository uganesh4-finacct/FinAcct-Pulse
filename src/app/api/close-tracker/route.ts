import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = createServiceSupabase()
  const { searchParams } = new URL(req.url)
  const monthYear = searchParams.get('month_year') ?? new Date().toISOString().slice(0, 7)

  const [clientsRes, stepsRes] = await Promise.all([
    supabase.from('clients').select('id, name, vertical, assigned_owner_id, service_track, service_description, team_members!assigned_owner_id(name)').eq('active', true).order('vertical').order('name'),
    supabase.from('close_steps').select('*').eq('month_year', monthYear).order('client_id').order('step_number'),
  ])

  const clients = clientsRes.data ?? []
  const stepsList = stepsRes.data ?? []

  const stepsByClient: Record<string, typeof stepsList> = {}
  stepsList.forEach((s: any) => {
    const cid = s.client_id
    if (!stepsByClient[cid]) stepsByClient[cid] = []
    stepsByClient[cid].push(s)
  })

  return NextResponse.json({ clients, steps: stepsByClient, month_year: monthYear })
}

const STANDARD_STEP_NAMES = ['Docs', 'Bookkeeping', 'Bank Recon', 'Payroll', 'AR/AP', 'Draft', 'Review', 'Delivered']

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json().catch(() => ({}))
  const monthYear = body.month_year ?? new Date().toISOString().slice(0, 7)

  const { data: clients } = await supabase
    .from('clients')
    .select('id, assigned_owner_id, service_track')
    .eq('active', true)

  if (!clients?.length) return NextResponse.json({ created: 0, message: 'No active clients' })

  const { data: existingCloses } = await supabase
    .from('monthly_closes')
    .select('client_id')
    .eq('month_year', monthYear)
  const existingClientIds = new Set((existingCloses ?? []).map((c: any) => c.client_id))

  let created = 0
  for (const client of clients) {
    if (existingClientIds.has(client.id)) continue
    const deadline = new Date(monthYear + '-01')
    deadline.setMonth(deadline.getMonth() + 1)
    deadline.setDate(25)
    const { data: mc } = await supabase
      .from('monthly_closes')
      .insert({ client_id: client.id, month_year: monthYear, deadline_date: deadline.toISOString().split('T')[0] })
      .select('id')
      .single()
    if (!mc?.id) continue
    created++
    if (client.service_track === 'accounting' || !client.service_track) {
      const stepRows = STANDARD_STEP_NAMES.map((step_name, i) => ({
        monthly_close_id: mc.id,
        client_id: client.id,
        month_year: monthYear,
        step_number: i + 1,
        step_name,
        assigned_owner_id: client.assigned_owner_id || null,
        status: 'not_started',
        is_custom: false,
      }))
      await supabase.from('close_steps').insert(stepRows)
    }
    existingClientIds.add(client.id)
  }
  return NextResponse.json({ created, month_year: monthYear })
}
