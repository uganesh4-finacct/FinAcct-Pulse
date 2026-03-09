'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SubNav from '@/components/SubNav';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, DateInput, errorBlockClass } from '@/components/ui/Form';
import { FileText, Clock, Send, CheckCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUSES = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected'] as const;
const STATUS_CONFIG: Record<string, string> = {
  Draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
  Sent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Viewed: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Rejected: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400',
};

type ProposalRow = {
  id: string;
  deal_id: string;
  name: string;
  amount?: number | null;
  status: string;
  sent_date?: string | null;
  valid_until?: string | null;
  document_url?: string | null;
  notes?: string | null;
  deals?: { id: string; name: string; company_name: string } | null;
};

type DealOption = { id: string; name: string; company_name: string };
type Stats = { total: number; pending: number; sentThisMonth: number; accepted: number };

export default function SalesProposalsPage() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, sentThisMonth: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProposalRow | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    try {
      const propUrl = filterStatus ? `/api/sales/proposals?status=${encodeURIComponent(filterStatus)}` : '/api/sales/proposals';
      const [propRes, dealsRes] = await Promise.all([
        fetch(propUrl),
        fetch('/api/sales/deals'),
      ]);
      if (propRes.ok) {
        const d = await propRes.json();
        setProposals(d.proposals ?? []);
        setStats(d.stats ?? { total: 0, pending: 0, sentThisMonth: 0, accepted: 0 });
      }
      if (dealsRes.ok) {
        const d = await dealsRes.json();
        const list = (d.deals ?? []) as Array<{ id: string; name: string; company_name: string }>;
        setDeals(list.map((x) => ({ id: x.id, name: x.name, company_name: x.company_name })));
      }
    } catch {
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: ProposalRow) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const dealLabel = (p: ProposalRow) => {
    const d = p.deals;
    if (!d) return '—';
    return `${d.company_name}${d.name ? ` · ${d.name}` : ''}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Proposals</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          New Proposal
        </Button>
      </div>
      <SubNav />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-900"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Proposals</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Pending</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Send className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Sent This Month</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.sentThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Accepted</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Proposals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Proposal Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Deal / Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Sent Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Valid Until</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => openEdit(p)}
                      className={cn(
                        'border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors',
                        'hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                      )}
                    >
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">{p.name}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{dealLabel(p)}</td>
                      <td className="py-3 px-4 tabular-nums">${Number(p.amount ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium', STATUS_CONFIG[p.status] ?? 'bg-zinc-100 text-zinc-600')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{p.sent_date ?? '—'}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{p.valid_until ?? '—'}</td>
                      <td className="py-3 px-4">
                        <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="text-violet-600 dark:text-violet-400 hover:underline mr-2">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Delete this proposal?')) return;
                            const res = await fetch(`/api/sales/proposals/${p.id}`, { method: 'DELETE' });
                            if (res.ok) fetchData();
                          }}
                          className="text-red-600 dark:text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {proposals.length === 0 && (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">No proposals yet. Create one to get started.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <ProposalModal
          proposal={editing}
          deals={deals}
          onClose={closeModal}
          onSuccess={() => { closeModal(); fetchData(); }}
        />
      )}
    </div>
  );
}

function ProposalModal({
  proposal,
  deals,
  onClose,
  onSuccess,
}: {
  proposal: ProposalRow | null;
  deals: DealOption[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [dealId, setDealId] = useState(proposal?.deal_id ?? '');
  const [name, setName] = useState(proposal?.name ?? '');
  const [amount, setAmount] = useState(proposal?.amount != null ? String(proposal.amount) : '');
  const [status, setStatus] = useState(proposal?.status ?? 'Draft');
  const [sentDate, setSentDate] = useState(proposal?.sent_date ?? '');
  const [validUntil, setValidUntil] = useState(proposal?.valid_until ?? '');
  const [documentUrl, setDocumentUrl] = useState(proposal?.document_url ?? '');
  const [notes, setNotes] = useState(proposal?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!dealId || !name.trim()) {
      setError('Deal and proposal name are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        deal_id: dealId,
        name: name.trim(),
        amount: amount === '' ? 0 : Number(amount),
        status: status || 'Draft',
        sent_date: sentDate || null,
        valid_until: validUntil || null,
        document_url: documentUrl.trim() || null,
        notes: notes.trim() || null,
      };
      if (proposal?.id) {
        const res = await fetch(`/api/sales/proposals/${proposal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Update failed');
        }
      } else {
        const res = await fetch('/api/sales/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Create failed');
        }
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
        <ModalHeader title={proposal ? 'Edit Proposal' : 'New Proposal'} onClose={onClose} />
        <ModalBody>
          <div className="space-y-4">
            {error && <div className={errorBlockClass}>{error}</div>}
            <FormField label="Deal">
              <Select value={dealId} onChange={(e) => setDealId(e.target.value)} required>
                <option value="">Select deal</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>{d.company_name} · {d.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Proposal Name">
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
            <FormField label="Amount ($)">
              <Input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </FormField>
            <FormField label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Sent Date">
                <DateInput value={sentDate} onChange={(e) => setSentDate(e.target.value)} />
              </FormField>
              <FormField label="Valid Until">
                <DateInput value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Document URL">
              <Input type="url" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://..." />
            </FormField>
            <FormField label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : proposal ? 'Save' : 'Create'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
