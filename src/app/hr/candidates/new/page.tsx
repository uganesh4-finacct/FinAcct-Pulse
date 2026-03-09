import Link from 'next/link'

export default function NewCandidatePage() {
  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <Link href="/hr/candidates" style={{ fontSize: 12, color: '#71717a', textDecoration: 'none', marginBottom: 16, display: 'inline-block' }}>
        ← Candidates
      </Link>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b', marginBottom: 8 }}>Add Candidate</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>
        Add a candidate to a requisition. Select requisition and enter details.
      </p>
      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, padding: 24 }}>
        <p style={{ color: '#71717a', fontSize: 13 }}>Use the Candidates list and click &quot;+ Add Candidate&quot; to open the add form, or wire this page to a full form with requisition dropdown, name, email, phone, resume URL, source, etc.</p>
      </div>
    </div>
  )
}
