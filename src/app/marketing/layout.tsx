import { redirect } from 'next/navigation'
import { getCurrentUserWithPermissions, canAccessMarketing } from '@/lib/auth-server'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessMarketing(user)) {
    redirect('/')
  }
  return <>{children}</>
}
