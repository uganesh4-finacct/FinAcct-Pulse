import Link from 'next/link'

export default function NewRequisitionPage() {
  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <Link href="/hr/requisitions" style={{ fontSize: 12, color: '#71717a', textDecoration: 'none', marginBottom: 16, display: 'inline-block' }}>
        ← Requisitions
      </Link>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b', marginBottom: 8 }}>Create Requisition from Request</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>
        Select an approved staffing request to create a requisition, or create a standalone requisition.
      </p>
      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, padding: 24 }}>
        <p style={{ color: '#71717a', fontSize: 13 }}>Approved requests will appear here. Use the Staffing Requests page to approve requests first, then create a requisition from the request detail or from this page once the flow is wired.</p>
      </div>
    </div>
  )
}
