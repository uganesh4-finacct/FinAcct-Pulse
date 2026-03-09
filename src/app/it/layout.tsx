import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth-server'
import { canAccessIT } from '@/lib/auth/permissions'
import { ITShell } from '@/components/ITShell'

export default async function ITLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserRole()
  if (!user || !canAccessIT(user.role)) {
    redirect('/')
  }
  return <ITShell>{children}</ITShell>
}
