import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRTeam } from '@/lib/auth/permissions'

export default async function TeamDirectoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserRole()
  if (!user || !canAccessHRTeam(user.role)) {
    redirect('/')
  }
  return <>{children}</>
}
