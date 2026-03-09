import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth-server'
import { canAccessFinance } from '@/lib/auth/permissions'
import { FinanceShell } from '@/components/FinanceShell'

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserRole()
  if (!user || !canAccessFinance(user.role)) {
    redirect('/')
  }
  return <FinanceShell>{children}</FinanceShell>
}
