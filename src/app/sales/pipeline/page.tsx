'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SubNav from '@/components/SubNav';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, DateInput, errorBlockClass } from '@/components/ui/Form';
import { Briefcase, DollarSign, TrendingUp, Target, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const;
type Stage = (typeof STAGES)[number];
const STAGE_PROBABILITY: Record<Stage, number> = { Discovery: 50, Proposal: 50, Negotiation: 75, Won: 100, Lost: 0 };

type Deal = {
  id: string;
  name: string;
  company_name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  lead_id?: string | null;
  stage: string;
  value?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  owner_id?: string | null;
  notes?: string | null;
};

type Stats = { totalDeals: number; pipelineValue: number; avgDealSize: number; winRate: number };
type TeamMember = { id: string; name: string };
type LeadOption = { id: string; company_name: string; contact_name?: string | null };

export default function SalesPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Stats>({ totalDeals: 0, pipelineValue: 0, avgDealSize: 0, winRate: 0 });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [leadOptions, setLeadOptions] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [filterStage, setFilterStage] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [searchCompany, setSearchCompany] = useState('');

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStage) params.set('stage', filterStage);
      if (filterOwner) params.set('owner_id', filterOwner);
      const [dealsRes, teamRes, leadsRes] = await Promise.all([
        fetch(`/api/sales/deals?${params}`),
        fetch('/api/team'),
        fetch('/api/sales/lead-options'),
      ]);
      if (dealsRes.ok) {
        const d = await dealsRes.json();
        setDeals(d.deals ?? []);
        setStats(d.stats ?? { totalDeals: 0, pipelineValue: 0, avgDealSize: 0, winRate: 0 });
      }
      if (teamRes.ok) {
        const t = await teamRes.json();
        const list = Array.isArray(t) ? t : (t.members ?? []);
        setTeamMembers(list.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name || m.id })));
      }
      if (leadsRes.ok) {
        const l = await leadsRes.json();
        setLeadOptions(Array.isArray(l) ? l : []);
      }
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStage, filterOwner]);

  const ownerMap = useMemo(() => {
    const m: Record<string, string> = {};
    teamMembers.forEach((t) => { m[t.id] = t.name; });
    return m;
  }, [teamMembers]);

  const filteredDeals = useMemo(() => {
    if (!searchCompany.trim()) return deals;
    const q = searchCompany.trim().toLowerCase();
    return deals.filter((d) => (d.company_name ?? '').toLowerCase().includes(q));
  }, [deals, searchCompany]);

  const dealsByStage = useMemo(() => {
    const m: Record<string, Deal[]> = {};
    STAGES.forEach((s) => { m[s] = []; });
    filteredDeals.forEach((d) => {
      const s = STAGES.includes(d.stage as Stage) ? d.stage : 'Discovery';
      if (!m[s]) m[s] = [];
      m[s].push(d);
    });
    return m;
  }, [filteredDeals]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditing(deal);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const moveStage = async (dealId: string, newStage: Stage) => {
    try {
      const res = await fetch(`/api/sales/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) fetchData();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Sales Pipeline</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          New Deal
        </Button>
      </div>
      <SubNav />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={searchCompany}
          onChange={(e) => setSearchCompany(e.target.value)}
          placeholder="Search by company..."
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm min-w-[140px] max-w-[200px] bg-white dark:bg-zinc-900"
        />
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm min-w-[120px] max-w-[160px] bg-white dark:bg-zinc-900"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterOwner}
          onChange={(e) => setFilterOwner(e.target.value)}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm min-w-[120px] max-w-[160px] bg-white dark:bg-zinc-900"
        >
          <option value="">All owners</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Deals</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Pipeline Value</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">${stats.pipelineValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Avg Deal Size</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">${stats.avgDealSize.toLocaleString()}</p>
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Win Rate</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="p-8 text-center text-zinc-500">Loading...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className={cn(
                'flex-shrink-0 w-72 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/30',
                'border-violet-200/80 dark:border-violet-800/50'
              )}
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="font-semibold text-zinc-900 dark:text-white">{stage}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{dealsByStage[stage]?.length ?? 0} deals</p>
              </div>
              <div className="p-2 min-h-[120px] space-y-2">
                {(dealsByStage[stage] ?? []).map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    ownerName={deal.owner_id ? ownerMap[deal.owner_id] : null}
                    onOpen={() => openEdit(deal)}
                    onMoveStage={(newStage) => moveStage(deal.id, newStage)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <DealModal
          deal={editing}
          teamMembers={teamMembers}
          leadOptions={leadOptions}
          onClose={closeModal}
          onSuccess={() => { closeModal(); fetchData(); }}
          onDelete={editing ? () => { closeModal(); fetchData(); } : undefined}
        />
      )}
    </div>
  );
}

function DealCard({
  deal,
  ownerName,
  onOpen,
  onMoveStage,
}: {
  deal: Deal;
  ownerName: string | null;
  onOpen: () => void;
  onMoveStage: (stage: Stage) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const initials = ownerName ? ownerName.split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  const value = Number(deal.value ?? 0);
  const closeDate = deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—';

  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 cursor-pointer',
        'hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all'
      )}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 dark:text-white truncate">{deal.company_name}</p>
          <p className="text-sm text-violet-600 dark:text-violet-400 font-mono">${value.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Close: {closeDate}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-xs font-medium text-violet-700 dark:text-violet-300"
            title={ownerName ?? 'Unassigned'}
          >
            {initials}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowDropdown((v) => !v); }}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
            >
              <span className="text-xs">⋮</span>
            </button>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }} />
                <div className="absolute right-0 top-full mt-1 z-20 py-1 w-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
                  {STAGES.filter((s) => s !== deal.stage).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onMoveStage(s); setShowDropdown(false); }}
                      className="block w-full text-left px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    >
                      Move to {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DealModal({
  deal,
  teamMembers,
  leadOptions,
  onClose,
  onSuccess,
  onDelete,
}: {
  deal: Deal | null;
  teamMembers: TeamMember[];
  leadOptions: LeadOption[];
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(deal?.name ?? '');
  const [companyName, setCompanyName] = useState(deal?.company_name ?? '');
  const [contactName, setContactName] = useState(deal?.contact_name ?? '');
  const [contactEmail, setContactEmail] = useState(deal?.contact_email ?? '');
  const [contactPhone, setContactPhone] = useState(deal?.contact_phone ?? '');
  const [leadId, setLeadId] = useState(deal?.lead_id ?? '');
  const [stage, setStage] = useState<Stage>(deal?.stage as Stage ?? 'Discovery');
  const [value, setValue] = useState(deal?.value != null ? String(deal.value) : '');
  const [probability, setProbability] = useState(deal?.probability != null ? String(deal.probability) : '50');
  const [expectedCloseDate, setExpectedCloseDate] = useState(deal?.expected_close_date ?? '');
  const [ownerId, setOwnerId] = useState(deal?.owner_id ?? '');
  const [notes, setNotes] = useState(deal?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !companyName.trim()) {
      setError('Deal name and company are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        company_name: companyName.trim(),
        contact_name: contactName.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        lead_id: leadId || null,
        stage,
        value: value === '' ? 0 : Number(value),
        probability: probability === '' ? 50 : Math.min(100, Math.max(0, Number(probability))),
        expected_close_date: expectedCloseDate || null,
        owner_id: ownerId || null,
        notes: notes.trim() || null,
      };
      if (deal?.id) {
        const res = await fetch(`/api/sales/deals/${deal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Update failed');
        }
      } else {
        const res = await fetch('/api/sales/deals', {
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

  const handleDelete = async () => {
    if (!deal?.id || !confirm('Delete this deal? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sales/deals/${deal.id}`, { method: 'DELETE' });
      if (res.ok) onDelete?.();
      else setError('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
        <ModalHeader title={deal ? 'Edit Deal' : 'New Deal'} onClose={onClose} />
        <ModalBody>
          <div className="space-y-4">
            {error && <div className={errorBlockClass}>{error}</div>}
            <FormField label="Deal Name">
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
            <FormField label="Company">
              <Input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </FormField>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Contact Name" className="col-span-2">
                <Input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </FormField>
              <FormField label="Lead Source">
                <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                  <option value="">None</option>
                  {leadOptions.map((l) => (
                    <option key={l.id} value={l.id}>{l.company_name}{l.contact_name ? ` (${l.contact_name})` : ''}</option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact Email">
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </FormField>
              <FormField label="Contact Phone">
                <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Stage">
                <Select
                  value={stage}
                  onChange={(e) => {
                    const s = e.target.value as Stage;
                    setStage(s);
                    setProbability(String(STAGE_PROBABILITY[s] ?? 50));
                  }}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Value ($)">
                <Input type="number" min={0} step={0.01} value={value} onChange={(e) => setValue(e.target.value)} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Probability (%)">
                <Input type="number" min={0} max={100} value={probability} onChange={(e) => setProbability(e.target.value)} />
              </FormField>
              <FormField label="Expected Close Date">
                <DateInput value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Owner">
              <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          {deal && onDelete && (
            <Button type="button" variant="ghost" className="text-red-600 mr-auto" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : deal ? 'Save' : 'Create'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
