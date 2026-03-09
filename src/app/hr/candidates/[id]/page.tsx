import HRCandidateDetailPage from './CandidateDetailClient'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <HRCandidateDetailPage id={id} />
}
