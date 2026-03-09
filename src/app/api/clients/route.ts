import { createServiceSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceSupabase()
  const { data } = await supabase
    .from('clients')
    .select('*, team_members!assigned_owner_id(id, name)')
    .order('name')
  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'no-store' },
  })
}

const PATCH_ALLOWED_KEYS = [
  'name', 'vertical', 'monthly_fee', 'payment_method',
  'assigned_owner_id', 'deadline_day', 'service_track', 'service_description',
  'active', 'contract_start_date', 'contract_end_date', 'auto_renewal', 'zoho_sign_url', 'client_type', 'notes',
] as const

export async function PATCH(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const { id, ...raw } = body
  console.log('PATCH clients — id being sent:', id, 'type:', typeof id)
  if (id == null) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const fields: Record<string, unknown> = {}
  for (const key of PATCH_ALLOWED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) fields[key] = raw[key]
  }
  if (fields.assigned_owner_id === '' || fields.assigned_owner_id == null) fields.assigned_owner_id = null
  if (fields.deadline_day == null || fields.deadline_day === '') fields.deadline_day = 25
  // india_tp_transfer is generated column — never include in update
  const { data, error } = await supabase.from('clients').update(fields).eq('id', id).select()
  console.log('PATCH clients result:', { rows: data?.length ?? 0, error: error?.message })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data && data.length === 0) return NextResponse.json({ error: 'No rows updated — client id may be invalid' }, { status: 404 })
  return NextResponse.json({ success: true })
}

const STANDARD_STEP_NAMES = ['Docs', 'Bookkeeping', 'Bank Recon', 'Payroll', 'AR/AP', 'Draft', 'Review', 'Delivered']

export async function POST(req: Request) {
  const supabase = createServiceSupabase()
  const body = await req.json()
  const {
    name,
    vertical,
    client_type,
    active,
    service_track,
    service_description,
    assigned_owner_id,
    deadline_day,
    monthly_fee,
    india_tp_transfer,
    payment_method,
    contract_start_date,
    contract_end_date,
    auto_renewal,
    zoho_sign_url,
    notes,
    billing_type,
    billing_start_date,
    payment_terms,
    billing_contact_email,
    billing_notes,
  } = body

  if (!name || !vertical) {
    return NextResponse.json({ error: 'name and vertical required' }, { status: 400 })
  }

  const fee = typeof monthly_fee === 'number' ? monthly_fee : parseFloat(monthly_fee) || 0
  const tp = typeof india_tp_transfer === 'number' ? india_tp_transfer : parseFloat(india_tp_transfer) || Math.round(fee * 0.9 * 100) / 100
  const day = typeof deadline_day === 'number' ? deadline_day : parseInt(deadline_day, 10) || 25

  const clientPayload: Record<string, unknown> = {
    name: String(name).trim(),
    vertical,
    active: active !== false && active !== 'false',
    service_track: service_track || 'accounting',
    service_description: service_description || null,
    assigned_owner_id: assigned_owner_id || null,
    deadline_day: day,
    monthly_fee: fee,
    india_tp_transfer: tp,
    payment_method: payment_method || null,
    contract_start_date: contract_start_date || null,
    notes: notes || null,
  }
  if (client_type != null) clientPayload.client_type = client_type
  if (contract_end_date != null) clientPayload.contract_end_date = contract_end_date
  if (auto_renewal != null) clientPayload.auto_renewal = auto_renewal
  if (zoho_sign_url != null) clientPayload.zoho_sign_url = zoho_sign_url
  if (billing_type != null) clientPayload.billing_type = billing_type || null
  if (billing_start_date != null) clientPayload.billing_start_date = billing_start_date || null
  if (payment_terms != null) clientPayload.payment_terms = payment_terms === '' ? null : (typeof payment_terms === 'number' ? payment_terms : parseInt(String(payment_terms), 10))
  if (billing_contact_email != null) clientPayload.billing_contact_email = billing_contact_email || null
  if (billing_notes != null) clientPayload.billing_notes = billing_notes || null

  const { data: client, error: clientErr } = await supabase.from('clients').insert(clientPayload).select('id').single()
  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })
  if (!client?.id) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })

  const monthYear = new Date().toISOString().slice(0, 7)
  const deadlineDate = new Date(new Date().getFullYear(), new Date().getMonth(), Math.min(day, 28))
  const deadlineStr = deadlineDate.toISOString().split('T')[0]

  const { data: close, error: closeErr } = await supabase.from('monthly_closes').insert({
    client_id: client.id,
    month_year: monthYear,
    deadline_date: deadlineStr,
  }).select('id').single()
  if (closeErr) return NextResponse.json({ error: closeErr.message, id: client.id }, { status: 500 })

  if (service_track === 'accounting' && close?.id) {
    const stepRows = STANDARD_STEP_NAMES.map((step_name, i) => ({
      monthly_close_id: close.id,
      client_id: client.id,
      month_year: monthYear,
      step_number: i + 1,
      step_name,
      assigned_owner_id: assigned_owner_id || null,
      status: 'not_started',
      is_custom: false,
    }))
    await supabase.from('close_steps').insert(stepRows)
  }

  return NextResponse.json({ success: true, id: client.id })
}
