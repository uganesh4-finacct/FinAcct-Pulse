'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SubNav from '@/components/SubNav';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, errorBlockClass } from '@/components/ui/Form';
import { Users, Calendar, Target, CheckCircle, Plus } from 'lucide-react';
import { leadStatusConfig } from '@/lib/types';
import type { LeadSource, LeadStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const SOURCE_OPTIONS: { value: LeadSource | ''; label: string }[] = [
  { value: 'Inbound', label: 'Website' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Cold Outreach', label: 'Cold Outreach' },
  { value: 'Event', label: 'Event' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Other', label: 'Other' },
];

const STATUS_OPTIONS: LeadStatus[] = [
  'New', 'Contacted', 'Qualified', 'Proposal_Sent', 'Negotiating', 'Won', 'Lost', 'On_Hold',
];

type LeadRow = {
  id: string;
  company_name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  vertical?: string | null;
  source?: string | null;
  status: string;
  lead_owner_id?: string | null;
  created_at: string;
  notes?: string | null;
  attachment_url?: string | null;
};

type TeamMember = { id: string; name: string };
type Stats = { total: number; thisWeek: number; qualified: number; converted: number };

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, thisWeek: 0, qualified: 0, converted: 0 });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeadRow | null>(null);
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (filterSource) p.set('source', filterSource);
    if (filterStatus) p.set('status', filterStatus);
    if (filterDateFrom) p.set('dateFrom', filterDateFrom);
    if (filterDateTo) p.set('dateTo', filterDateTo);
    return p.toString();
  }, [filterSource, filterStatus, filterDateFrom, filterDateTo]);

  const fetchData = async () => {
    try {
      const [leadsRes, teamRes] = await Promise.all([
        fetch(`/api/marketing/leads${queryParams ? `?${queryParams}` : ''}`),
        fetch('/api/team'),
      ]);
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads ?? []);
        setStats(data.stats ?? { total: 0, thisWeek: 0, qualified: 0, converted: 0 });
      }
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        const list = Array.isArray(teamData) ? teamData : (teamData.members ?? []);
        setTeamMembers(list.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name || m.id })));
      }
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [queryParams]);

  const ownerMap = useMemo(() => {
    const m: Record<string, string> = {};
    teamMembers.forEach((t) => { m[t.id] = t.name; });
    return m;
  }, [teamMembers]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: LeadRow) => {
    setEditing(row);
    setModalOpen(true);
  };

  const convertToDeal = async (lead: LeadRow) => {
    try {
      const res = await fetch('/api/sales/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.company_name || lead.contact_name || 'Deal',
          company_name: lead.company_name || 'Unknown',
          contact_name: lead.contact_name || null,
          contact_email: lead.contact_email || null,
          contact_phone: lead.contact_phone || null,
          lead_id: lead.id,
          stage: 'Discovery',
          probability: 50,
          notes: lead.notes ? `Converted from marketing lead (source: ${lead.source || '—'}). ${lead.notes}` : `Converted from marketing lead. Source: ${lead.source || '—'}`,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Failed to create deal');
        return;
      }
      await fetch(`/api/marketing/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Won' }),
      });
      fetchData();
      alert('Deal created. Update the deal in Sales Pipeline.');
    } catch {
      alert('Failed to convert');
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const sourceLabel = (source: string | null | undefined) => {
    if (!source) return '—';
    const o = SOURCE_OPTIONS.find((s) => s.value === source);
    return o ? o.label : source;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Leads</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>
      <SubNav />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Leads</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">This Week</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.thisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Qualified</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.qualified}</p>
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Converted</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.converted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Source</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm min-w-[120px] max-w-[160px]"
              >
                <option value="">All</option>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm min-w-[120px] max-w-[160px]"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{leadStatusConfig[s]?.label ?? s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Date From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm min-w-[120px] max-w-[160px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Date To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm min-w-[120px] max-w-[160px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Lead Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Contact Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Owner</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Date Added</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const cfg = leadStatusConfig[lead.status as LeadStatus];
                    const dateAdded = lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—';
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => openEdit(lead)}
                        className={cn(
                          'border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors',
                          'hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                        )}
                      >
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">{lead.contact_name ?? '—'}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{lead.company_name}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{sourceLabel(lead.source)}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{lead.contact_email ?? '—'}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{lead.contact_phone ?? '—'}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', cfg?.color ?? 'bg-zinc-100 text-zinc-600')}>
                            {cfg?.label ?? lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{lead.lead_owner_id ? (ownerMap[lead.lead_owner_id] ?? '—') : '—'}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{dateAdded}</td>
                        <td className="py-3 px-4">
                          <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(lead); }} className="text-violet-600 dark:text-violet-400 hover:underline mr-2">
                            Edit
                          </button>
                          {['Qualified', 'Proposal_Sent', 'Negotiating'].includes(lead.status) && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); convertToDeal(lead); }} className="text-emerald-600 dark:text-emerald-400 hover:underline mr-2">
                              Convert to Deal
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm('Delete this lead?')) return;
                              const res = await fetch(`/api/marketing/leads/${lead.id}`, { method: 'DELETE' });
                              if (res.ok) fetchData();
                            }}
                            className="text-red-600 dark:text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {leads.length === 0 && (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">No leads found. Add one to get started.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <LeadModal
          lead={editing}
          teamMembers={teamMembers}
          onClose={closeModal}
          onSuccess={() => { closeModal(); fetchData(); }}
        />
      )}
    </div>
  );
}

function LeadModal({
  lead,
  teamMembers,
  onClose,
  onSuccess,
}: {
  lead: LeadRow | null;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [contactName, setContactName] = useState(lead?.contact_name ?? '');
  const [companyName, setCompanyName] = useState(lead?.company_name ?? '');
  const [industry, setIndustry] = useState(lead?.vertical ?? '');
  const [source, setSource] = useState<LeadSource | ''>(lead?.source as LeadSource ?? '');
  const [email, setEmail] = useState(lead?.contact_email ?? '');
  const [phone, setPhone] = useState(lead?.contact_phone ?? '');
  const [leadOwnerId, setLeadOwnerId] = useState(lead?.lead_owner_id ?? '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status as LeadStatus ?? 'New');
  const [notes, setNotes] = useState(lead?.notes ?? '');
  const [attachmentUrl, setAttachmentUrl] = useState(lead?.attachment_url ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!email.trim()) {
      setError('Contact email is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        contact_name: contactName.trim() || null,
        company_name: companyName.trim(),
        vertical: industry.trim() || null,
        source: source || null,
        contact_email: email.trim() || null,
        contact_phone: phone.trim() || null,
        lead_owner_id: leadOwnerId || null,
        status,
        notes: notes.trim() || null,
        attachment_url: attachmentUrl.trim() || null,
      };
      if (lead?.id) {
        const res = await fetch(`/api/marketing/leads/${lead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Update failed');
        }
      } else {
        const res = await fetch('/api/marketing/leads', {
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
    <Modal onClose={onClose} maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
        <ModalHeader title={lead ? 'Edit Lead' : 'Add Lead'} onClose={onClose} />
        <ModalBody>
          <div className="space-y-4">
            {error && <div className={errorBlockClass}>{error}</div>}
            <FormField label="Contact Name" required>
              <Input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact person name" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Company">
                <Input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </FormField>
              <FormField label="Industry">
                <Input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, CPA Firm" />
              </FormField>
            </div>
            <FormField label="Source">
              <Select value={source} onChange={(e) => setSource(e.target.value as LeadSource | '')}>
                <option value="">Select source</option>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact Email" required>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FormField>
              <FormField label="Phone">
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Lead Owner">
              <Select value={leadOwnerId} onChange={(e) => setLeadOwnerId(e.target.value)}>
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{leadStatusConfig[s].label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </FormField>
            <FormField label="Attachment URL">
              <Input type="url" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://..." />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : lead ? 'Save' : 'Add Lead'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
