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
