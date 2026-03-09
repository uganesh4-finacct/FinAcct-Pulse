'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SubNav from '@/components/SubNav';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, DateInput, errorBlockClass } from '@/components/ui/Form';
import { Megaphone, DollarSign, Users, TrendingUp, Plus } from 'lucide-react';
import { campaignStatusConfig } from '@/lib/types';
import type { CampaignStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const PLATFORMS = ['Google', 'Meta', 'LinkedIn'] as const;
const STATUSES: CampaignStatus[] = ['Planning', 'Active', 'Paused', 'Completed', 'Cancelled'];

type CampaignRow = {
  id: string;
  name: string;
  platform?: string | null;
  type?: string;
  status: string;
  budget?: number | null;
  spent?: number | null;
  leads_generated?: number;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
};

type Stats = {
  activeCampaigns: number;
  totalSpend: number;
  leadsGenerated: number;
  avgCpl: number;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [stats, setStats] = useState<Stats>({ activeCampaigns: 0, totalSpend: 0, leadsGenerated: 0, avgCpl: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignRow | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterPlatform) params.set('type', filterPlatform);
      const res = await fetch(`/api/marketing/campaigns?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
      setStats(data.stats ?? { activeCampaigns: 0, totalSpend: 0, leadsGenerated: 0, avgCpl: 0 });
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPlatform]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: CampaignRow) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const cpl = (c: CampaignRow) => {
    const leads = c.leads_generated ?? 0;
    const s = Number(c.spent ?? 0);
    return leads > 0 ? (s / leads).toFixed(2) : '—';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Campaigns</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>
      <SubNav />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-900">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{campaignStatusConfig[s].label}</option>
          ))}
        </select>
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-900">
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Active Campaigns</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.activeCampaigns}</p>
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Spend</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">${stats.totalSpend.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Leads Generated</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.leadsGenerated}</p>
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Avg CPL</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">${stats.avgCpl.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Campaign Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Platform</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Budget</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Spent</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Leads</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">CPL</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const cfg = campaignStatusConfig[c.status as CampaignStatus];
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openEdit(c)}
                        className={cn(
                          'border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors',
                          'hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                        )}
                      >
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">{c.name}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c.platform ?? c.type ?? '—'}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium', cfg?.color ?? 'bg-zinc-100 text-zinc-600')}>
                            {cfg?.label ?? c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums">{c.budget != null ? `$${Number(c.budget).toLocaleString()}` : '—'}</td>
                        <td className="py-3 px-4 tabular-nums">{c.spent != null ? `$${Number(c.spent).toLocaleString()}` : '—'}</td>
                        <td className="py-3 px-4 tabular-nums">{c.leads_generated ?? 0}</td>
                        <td className="py-3 px-4 tabular-nums">${cpl(c)}</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c.start_date ?? '—'}</td>
                        <td className="py-3 px-4">
                          <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="text-violet-600 dark:text-violet-400 hover:underline mr-2">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm('Delete this campaign?')) return;
                              const res = await fetch(`/api/marketing/campaigns/${c.id}`, { method: 'DELETE' });
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
              {campaigns.length === 0 && (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">No campaigns yet. Create one to get started.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <CampaignModal
          campaign={editing}
          onClose={closeModal}
          onSuccess={() => { closeModal(); fetchData(); }}
        />
      )}
    </div>
  );
}

function CampaignModal({
  campaign,
  onClose,
  onSuccess,
}: {
  campaign: CampaignRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(campaign?.name ?? '');
  const [platform, setPlatform] = useState(campaign?.platform ?? '');
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status as CampaignStatus ?? 'Planning');
  const [budget, setBudget] = useState(campaign?.budget ?? '');
  const [startDate, setStartDate] = useState(campaign?.start_date ?? '');
  const [endDate, setEndDate] = useState(campaign?.end_date ?? '');
  const [notes, setNotes] = useState(campaign?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (campaign?.id) {
        const res = await fetch(`/api/marketing/campaigns/${campaign.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            platform: platform || null,
            status,
            budget: budget === '' ? null : Number(budget),
            start_date: startDate || null,
            end_date: endDate || null,
            notes: notes || null,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Update failed');
        }
      } else {
        const res = await fetch('/api/marketing/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            platform: platform || null,
            status,
            budget: budget === '' ? null : Number(budget),
            start_date: startDate || null,
            end_date: endDate || null,
            notes: notes || null,
          }),
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
        <ModalHeader title={campaign ? 'Edit Campaign' : 'New Campaign'} onClose={onClose} />
        <ModalBody>
          <div className="space-y-4">
            {error && <div className={errorBlockClass}>{error}</div>}
            <FormField label="Name">
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
            <FormField label="Platform">
              <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option value="">Select platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{campaignStatusConfig[s].label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Budget">
              <Input type="number" min={0} step={0.01} value={budget} onChange={(e) => setBudget(e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date">
                <DateInput value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </FormField>
              <FormField label="End Date">
                <DateInput value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : campaign ? 'Save' : 'Create'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
