'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type RequestRow = {
  id: string;
  role_title: string;
  client_name?: string;
  market: string;
  request_type: string;
  status: string;
  positions_needed: number;
  created_at: string;
};

export default function NewRequisitionPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/hr/requests')
      .then((r) => r.json())
      .then((d) => {
        const list = d?.requests ?? [];
        const approved = list.filter(
          (r: RequestRow) => r.status === 'Approved' || r.status === 'in_hiring'
        );
        setRequests(approved);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateRequisition = async (req: RequestRow) => {
    setCreatingId(req.id);
    setError(null);
    try {
      const res = await fetch('/api/hr/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffing_request_id: req.id,
          title: req.role_title,
          market: req.market,
          vertical: req.client_name || 'other',
          priority: 'Medium',
          status: 'Open',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to create requisition');
        return;
      }
      window.location.href = `/hr/requisitions/${data.id}`;
    } catch {
      setError('Failed to create requisition');
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <Link
        href="/hr/requisitions"
        style={{ fontSize: 12, color: '#71717a', textDecoration: 'none', marginBottom: 16, display: 'inline-block' }}
      >
        ← Requisitions
      </Link>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b', marginBottom: 8 }}>
        Create Requisition from Request
      </h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>
        Select an approved staffing request to create a requisition.
      </p>

      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#991b1b',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#a1a1aa' }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div
          style={{
            background: 'white',
            border: '1px solid #e4e4e7',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <p style={{ color: '#71717a', fontSize: 13, marginBottom: 12 }}>
            No approved requests found. Approve a staffing request first from the{' '}
            <Link href="/hr/requests" style={{ color: '#7c3aed', fontWeight: 600 }}>
              Staffing Requests
            </Link>{' '}
            page.
          </p>
          <Link
            href="/hr/requests"
            style={{
              display: 'inline-flex',
              padding: '8px 16px',
              background: '#7c3aed',
              color: 'white',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Go to Staffing Requests
          </Link>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Client</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Market</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Date</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#09090b' }}>{req.role_title}</td>
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>{req.client_name ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#52525b' }}>{req.market}</td>
                  <td style={{ padding: '12px 16px', color: '#71717a' }}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleCreateRequisition(req)}
                      disabled={!!creatingId}
                      style={{
                        padding: '6px 14px',
                        background: creatingId === req.id ? '#a78bfa' : '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: creatingId ? 'wait' : 'pointer',
                      }}
                    >
                      {creatingId === req.id ? 'Creating...' : 'Create Requisition'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
