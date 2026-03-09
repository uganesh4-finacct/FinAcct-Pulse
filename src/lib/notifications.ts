import { createServiceSupabase } from '@/lib/supabase-server'
import { sendEmail } from './email'

export interface CreateNotificationParams {
  userId: string
  typeCode: string
  title: string
  message: string
  linkUrl?: string
  linkLabel?: string
  referenceType?: string
  referenceId?: string
}

export async function createNotification(params: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceSupabase()

  const { data: notifType } = await supabase
    .from('notification_types')
    .select('id, default_email, default_in_app')
    .eq('code', params.typeCode)
    .single()

  if (!notifType) return { success: false, error: 'Invalid notification type' }

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_enabled, in_app_enabled')
    .eq('user_id', params.userId)
    .eq('type_id', notifType.id)
    .single()

  const emailEnabled = prefs?.email_enabled ?? notifType.default_email
  const inAppEnabled = prefs?.in_app_enabled ?? notifType.default_in_app

  let insertedId: string | null = null

  if (inAppEnabled) {
    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type_id: notifType.id,
        type_code: params.typeCode,
        title: params.title,
        message: params.message,
        link_url: params.linkUrl ?? null,
        link_label: params.linkLabel ?? null,
        reference_type: params.referenceType ?? null,
        reference_id: params.referenceId ?? null,
      })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    insertedId = inserted?.id ?? null
  }

  if (emailEnabled) {
    const { data: user } = await supabase
      .from('team_members')
      .select('email, name')
      .eq('id', params.userId)
      .single()

    if (user?.email) {
      const isAlert =
        params.typeCode.includes('overdue') || params.typeCode.includes('error') || params.typeCode.includes('delay')
      await sendEmail({
        to: user.email,
        toName: user.name ?? undefined,
        subject: params.title,
        template: isAlert ? 'alert' : 'notification',
        data: {
          title: params.title,
          message: params.message,
          linkUrl: params.linkUrl
            ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${params.linkUrl.startsWith('/') ? '' : '/'}${params.linkUrl}`
            : undefined,
          linkLabel: params.linkLabel,
        },
      })

      if (insertedId) {
        await supabase
          .from('notifications')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', insertedId)
      }
    }
  }

  return { success: true }
}

export async function notifyByRole(
  roles: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  const supabase = createServiceSupabase()
  const { data: users } = await supabase
    .from('team_members')
    .select('id')
    .in('role', roles)
    .eq('active', true)

  if (!users?.length) return

  for (const user of users) {
    await createNotification({ ...params, userId: user.id })
  }
}
