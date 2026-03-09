import { redirect } from 'next/navigation'
import { getCurrentUserWithPermissions, canAccessSales } from '@/lib/auth-server'

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserWithPermissions()
  if (!canAccessSales(user)) {
    redirect('/')
  }
  return <>{children}</>
}
