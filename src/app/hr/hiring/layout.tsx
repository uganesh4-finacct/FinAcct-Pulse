import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth-server'
import { canAccessHRDashboard } from '@/lib/auth/permissions'

export default async function HiringLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserRole()
  if (!user || !canAccessHRDashboard(user.role)) {
    redirect('/')
  }
  return <>{children}</>
}
