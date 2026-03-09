import { redirect } from 'next/navigation'
import { getCurrentUserWithPermissions, canAccessOperations } from '@/lib/auth-server'

export default async function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessOperations(user)) {
    redirect('/')
  }
  return <>{children}</>
}
