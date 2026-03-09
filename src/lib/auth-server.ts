import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function getSession() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUserRole(): Promise<{
  role: string
  name: string
  team_member_id: string
  entity: string
} | null> {
  const session = await getSession()
  if (!session?.user?.email) return null
  const supabase = createServiceSupabase()
  const { data: member } = await supabase
    .from('team_members')
    .select('id, role, name, entity')
    .eq('email', session.user.email)
    .limit(1)
    .single()
  if (!member) return null
  return {
    role: member.role,
    name: member.name,
    team_member_id: member.id,
    entity: member.entity ?? '',
  }
}

/** Returns current user with permissions. Use for module access checks (e.g. Marketing). */
export async function getCurrentUserWithPermissions(): Promise<{
  role: string
  team_member_id: string
  module_access: string[]
} | null> {
  const session = await getSession()
  if (!session?.user?.email) return null
  const supabase = createServiceSupabase()
  const { data: member } = await supabase
    .from('team_members')
    .select('id, role')
    .eq('email', session.user.email)
    .limit(1)
    .single()
  if (!member) return null
  const { data: perms } = await supabase
    .from('user_permissions')
    .select('module_access')
    .eq('team_member_id', member.id)
    .single()
  const module_access = (perms?.module_access as string[] | null) ?? []
  return {
    role: member.role,
    team_member_id: member.id,
    module_access: Array.isArray(module_access) ? module_access : [],
  }
}

export function canAccessMarketing(user: { role: string; module_access: string[] } | null): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'default') return true
  return user.module_access.includes('Marketing')
}

export function canAccessSales(user: { role: string; module_access: string[] } | null): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'default') return true
  return user.module_access.includes('Sales')
}

export function canAccessOperations(user: { role: string; module_access: string[] } | null): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'default') return true
  return user.module_access.includes('Operations')
}
