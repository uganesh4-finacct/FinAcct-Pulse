import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canApproveStaffingRequests } from '@/lib/auth/permissions'

type Decision = 'approve' | 'reject' | 'hold'
type ResolutionType = 'hire_new' | 'assign_existing' | 'on_hold' | 'rejected'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserRole()
  if (!user || !canApproveStaffingRequests(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const decision = body.decision as Decision | undefined
  const resolution_type = body.resolution_type as ResolutionType | undefined
  const assigned_team_member_id = body.assigned_team_member_id ?? null
  const approval_notes = body.approval_notes ?? null

  if (!decision || !['approve', 'reject', 'hold'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }

  const supabase = createServiceSupabase()
  const now = new Date().toISOString()

  let newStatus: string
  let linkedRequisitionId: string | null = null

  if (decision === 'reject') {
    newStatus = 'cancelled'
  } else if (decision === 'hold') {
    newStatus = 'on_hold'
  } else {
    if (!resolution_type || !['hire_new', 'assign_existing', 'on_hold', 'rejected'].includes(resolution_type)) {
      return NextResponse.json({ error: 'Invalid resolution_type' }, { status: 400 })
    }
    if (resolution_type === 'assign_existing') {
      if (!assigned_team_member_id) {
        return NextResponse.json({ error: 'assigned_team_member_id required for assign_existing' }, { status: 400 })
      }
      newStatus = 'filled'
    } else if (resolution_type === 'hire_new') {
      newStatus = 'approved'
    } else if (resolution_type === 'on_hold') {
      newStatus = 'on_hold'
    } else {
      newStatus = 'cancelled'
    }
  }

  const payload: Record<string, unknown> = {
    status: newStatus,
    resolution_type: decision === 'reject' ? 'rejected' : decision === 'hold' ? 'on_hold' : resolution_type,
    approval_notes,
    approved_by_id: user.team_member_id,
    approved_date: now,
  }
  if (newStatus === 'filled') {
    payload.assigned_team_member_id = assigned_team_member_id
    payload.resolution = 'Assign Existing'
  } else if (resolution_type === 'hire_new') {
    payload.resolution = 'Hire New'
  }

  if (resolution_type === 'hire_new' && decision === 'approve') {
    const { data: requestRow } = await supabase
      .from('hr_staffing_requests')
      .select('*, clients(id, name, vertical)')
      .eq('id', id)
      .single()
    if (requestRow) {
      const clientsRow = (requestRow as any).clients
      const vertical = clientsRow?.vertical ?? 'general'
      const { data: newRequisition } = await supabase
        .from('hr_requisitions')
        .insert({
          staffing_request_id: id,
          title: requestRow.role_title,
          role_type_id: requestRow.role_type_id,
          market: requestRow.market,
          vertical: typeof vertical === 'string' ? vertical : 'general',
          priority: requestRow.urgency,
          target_start_date: requestRow.estimated_start_date,
          status: 'Open',
        })
        .select('id')
        .single()
      if (newRequisition?.id) {
        linkedRequisitionId = newRequisition.id
        payload.linked_requisition_id = linkedRequisitionId
        payload.status = 'in_hiring'
      }
    }
  }

  const { data, error } = await supabase
    .from('hr_staffing_requests')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
