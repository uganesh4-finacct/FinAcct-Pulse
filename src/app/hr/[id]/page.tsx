import { redirect } from 'next/navigation'

export default async function LegacyRequisitionRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/hr/requisitions/${id}`)
}
