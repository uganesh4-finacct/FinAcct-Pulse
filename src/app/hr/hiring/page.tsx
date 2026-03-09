'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SubNav from '@/components/SubNav';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, DateInput, errorBlockClass } from '@/components/ui/Form';
import { TabsPills } from '@/components/ui/Tabs';
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import {
  Briefcase,
  Users,
  MessageSquare,
  FileCheck,
  Plus,
  Pencil,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { canSeeHiringSalary, canEditHiring, canDeleteHiring } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

const DEPARTMENTS = ['Operations', 'HR', 'IT', 'Finance'] as const;
const LOCATIONS = ['US', 'India'] as const;
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
const POSITION_STATUSES = ['draft', 'open', 'on_hold', 'filled', 'cancelled'] as const;
const CANDIDATE_STATUSES = ['active', 'on_hold', 'rejected', 'withdrawn'] as const;
const CURRENCIES = ['INR', 'USD'] as const;

function priorityBadgeVariant(p: string): 'red' | 'orange' | 'amber' | 'slate' {
  if (p === 'Critical') return 'red';
  if (p === 'High') return 'orange';
  if (p === 'Medium') return 'amber';
  return 'slate';
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    on_hold: 'On Hold',
    filled: 'Filled',
    cancelled: 'Cancelled',
    active: 'Active',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  return map[s] ?? s;
}

type Industry = { id: string; name: string };
type Stage = { id: string; name: string; slug: string; color: string; sort_order: number; is_terminal: boolean };
type Source = { id: string; name: string };
type TeamMember = { id: string; name: string };

type PositionRow = {
  id: string;
  title: string;
  client_project?: string | null;
  industry_id?: string | null;
  industry_name?: string | null;
  department?: string | null;
  location?: string | null;
  entity?: string | null;
  number_of_positions?: number;
  priority: string;
  status: string;
  experience?: string | null;
  target_start_date?: string | null;
  candidates_count?: number;
  created_at?: string;
};

type CandidateRow = {
  id: string;
  position_id: string;
  position_title?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  source_id?: string | null;
  source_name?: string | null;
  current_stage_id?: string | null;
  stage_name?: string | null;
  stage_slug?: string | null;
  stage_color?: string | null;
  applied_date?: string | null;
  status: string;
  overall_rating?: number | null;
  created_at?: string;
  notes?: string | null;
  expected_salary?: number | null;
  notice_period?: string | null;
};

type PositionDetail = PositionRow & {
  hiring_candidates?: Array<{ id: string; name: string; email?: string | null; current_stage_id: string; status: string; created_at: string }>;
  hiring_owner_id?: string | null;
  hiring_owner_name?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  core_skills?: string | null;
  must_have_skills?: string | null;
  preferred_skills?: string | null;
  reject_if?: string | null;
  reporting_to?: string | null;
  notes?: string | null;
  job_description?: string | null;
};

type Stats = { openPositions: number; activeCandidates: number; inPipeline: number; offersPending: number };

function formatDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

function daysInPipeline(createdAt: string | undefined, appliedDate?: string | null) {
  const base = appliedDate || createdAt;
  if (!base) return '—';
  const d = Math.floor((Date.now() - new Date(base).getTime()) / (24 * 60 * 60 * 1000));
  return String(d);
}

export default function HiringTrackerPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as 'positions' | 'pipeline' | 'candidates' | null;
  const [activeTab, setActiveTab] = useState<'positions' | 'pipeline' | 'candidates'>(
    tabParam === 'candidates' || tabParam === 'pipeline' || tabParam === 'positions' ? tabParam : 'positions'
  );
  const [stats, setStats] = useState<Stats>({ openPositions: 0, activeCandidates: 0, inPipeline: 0, offersPending: 0 });
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [filterPosStatus, setFilterPosStatus] = useState<string>('');
  const [filterPosPriority, setFilterPosPriority] = useState<string>('');
  const [filterPosIndustry, setFilterPosIndustry] = useState<string>('');
  const [filterCandPosition, setFilterCandPosition] = useState<string>('');
  const [filterCandStage, setFilterCandStage] = useState<string>('');
  const [filterCandStatus, setFilterCandStatus] = useState<string>('');
  const [filterCandSource, setFilterCandSource] = useState<string>('');
  const [filterPipelinePosition, setFilterPipelinePosition] = useState<string>('');
  const [filterPipelineSource, setFilterPipelineSource] = useState<string>('');
  const [addPositionOpen, setAddPositionOpen] = useState(false);
  const [positionDetailOpen, setPositionDetailOpen] = useState(false);
  const [positionDetail, setPositionDetail] = useState<PositionDetail | null>(null);
  const [editingPosition, setEditingPosition] = useState<PositionDetail | null>(null);
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [addCandidatePositionId, setAddCandidatePositionId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<CandidateRow | null>(null);
  const [candidateDetailOpen, setCandidateDetailOpen] = useState(false);
  const [candidateDetail, setCandidateDetail] = useState<CandidateRow | null>(null);
  const [stageHistory, setStageHistory] = useState<Array<{ stage_name: string; moved_at: string; moved_by_name: string | null }>>([]);

  const canSeeSalary = canSeeHiringSalary(userRole);
  const canEdit = canEditHiring(userRole);
  const canDelete = canDeleteHiring(userRole);

  const positionsQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (filterPosStatus) p.set('status', filterPosStatus);
    if (filterPosPriority) p.set('priority', filterPosPriority);
    if (filterPosIndustry) p.set('industryId', filterPosIndustry);
    return p.toString();
  }, [filterPosStatus, filterPosPriority, filterPosIndustry]);

  const candidatesQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (filterCandPosition) p.set('positionId', filterCandPosition);
    if (filterCandStage) p.set('stageId', filterCandStage);
    if (filterCandStatus) p.set('status', filterCandStatus);
    if (filterCandSource) p.set('sourceId', filterCandSource);
    return p.toString();
  }, [filterCandPosition, filterCandStage, filterCandStatus, filterCandSource]);

  const pipelineStages = useMemo(() => stages.filter((s) => !s.is_terminal).sort((a, b) => a.sort_order - b.sort_order), [stages]);
  const openPositionsForDropdown = useMemo(() => positions.filter((p) => p.status === 'open'), [positions]);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t === 'candidates' || t === 'pipeline' || t === 'positions') setActiveTab(t);
  }, [searchParams]);

  const fetchStats = async () => {
    try {
      const r = await fetch('/api/hr/hiring/stats');
      if (r.ok) {
        const d = await r.json();
        setStats({
          openPositions: d.openPositions ?? 0,
          activeCandidates: d.activeCandidates ?? 0,
          inPipeline: d.inPipeline ?? 0,
          offersPending: d.offersPending ?? 0,
        });
      }
    } catch { /* ignore */ }
  };

  const fetchPositions = async () => {
    try {
      const r = await fetch(`/api/hr/positions${positionsQuery ? `?${positionsQuery}` : ''}`);
      if (r.ok) {
        const d = await r.json();
        setPositions(d.positions ?? []);
      }
    } catch {
      setPositions([]);
    }
  };

  const fetchCandidates = async () => {
    try {
      const p = new URLSearchParams();
      if (filterPipelinePosition) p.set('positionId', filterPipelinePosition);
      if (filterPipelineSource) p.set('sourceId', filterPipelineSource);
      const r = await fetch(`/api/hr/hiring/candidates${p.toString() ? `?${p.toString()}` : ''}`);
      if (r.ok) {
        const d = await r.json();
        setCandidates(d.candidates ?? []);
      }
    } catch {
      setCandidates([]);
    }
  };

  const fetchCandidatesForTab = async () => {
    try {
      const r = await fetch(`/api/hr/hiring/candidates${candidatesQuery ? `?${candidatesQuery}` : ''}`);
      if (r.ok) {
        const d = await r.json();
        setCandidates(d.candidates ?? []);
      }
    } catch {
      setCandidates([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [meRes, teamRes, indRes, stgRes, srcRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/team').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/hr/industries').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/hr/stages').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/hr/sources').then((r) => (r.ok ? r.json() : [])),
      ]);
      if (!cancelled && meRes?.role) setUserRole(meRes.role);
      if (!cancelled && teamRes) {
        const list = Array.isArray(teamRes) ? teamRes : teamRes.members ?? [];
        setTeamMembers(list.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name || m.id })));
      }
      if (!cancelled) setIndustries(Array.isArray(indRes) ? indRes : []);
      if (!cancelled) setStages(Array.isArray(stgRes) ? stgRes : []);
      if (!cancelled) setSources(Array.isArray(srcRes) ? srcRes : []);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchPositions(), activeTab === 'pipeline' ? fetchCandidates() : fetchCandidatesForTab()]).finally(() => setLoading(false));
  }, [positionsQuery, activeTab === 'pipeline' ? `${filterPipelinePosition}-${filterPipelineSource}` : candidatesQuery]);

  const openPositionDetail = async (p: PositionRow) => {
    try {
      const r = await fetch(`/api/hr/positions/${p.id}`);
      if (r.ok) {
        const d = await r.json();
        setPositionDetail(d);
        setPositionDetailOpen(true);
        setEditingPosition(null);
      }
    } catch {
      setPositionDetail(null);
    }
  };

  const openCandidateDetail = async (c: CandidateRow) => {
    try {
      const [cRes, hRes] = await Promise.all([
        fetch(`/api/hr/hiring/candidates/${c.id}`),
        fetch(`/api/hr/hiring/candidates/${c.id}/history`),
      ]);
      if (cRes.ok) {
        const d = await cRes.json();
        setCandidateDetail(d);
        setCandidateDetailOpen(true);
      }
      if (hRes.ok) {
        const hist = await hRes.json();
        setStageHistory(hist.map((h: { stage_name: string; moved_at: string; moved_by_name: string | null }) => ({ stage_name: h.stage_name, moved_at: h.moved_at, moved_by_name: h.moved_by_name })));
      }
    } catch {
      setCandidateDetail(null);
      setStageHistory([]);
    }
  };

  const advanceCandidateStage = async (candidateId: string, stageId: string, notes?: string) => {
    const r = await fetch(`/api/hr/hiring/candidates/${candidateId}/advance-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, notes: notes || null }),
    });
    if (r.ok) {
      fetchCandidates();
      fetchCandidatesForTab();
      fetchStats();
      if (candidateDetail?.id === candidateId) openCandidateDetail({ ...candidateDetail, id: candidateId });
    }
  };

  const handleKanbanDrop = async (candidateId: string, targetStageId: string) => {
    if (!canEdit) return;
    await advanceCandidateStage(candidateId, targetStageId);
  };

  const candidatesByStage = useMemo(() => {
    const map: Record<string, CandidateRow[]> = {};
    pipelineStages.forEach((s) => { map[s.id] = []; });
    candidates.forEach((c) => {
      if (c.current_stage_id && map[c.current_stage_id]) {
        map[c.current_stage_id].push(c);
      }
    });
    return map;
  }, [candidates, pipelineStages]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Hiring Tracker
        </h1>
        {canEdit && (
          <Button onClick={() => setAddPositionOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Position
          </Button>
        )}
      </div>
      <SubNav />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Open Positions
                </p>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stats.openPositions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Active Candidates
                </p>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stats.activeCandidates}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  In Pipeline
                </p>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stats.inPipeline}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Offers Pending
                </p>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stats.offersPending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Positions | Pipeline | All Candidates */}
      <TabsPills
        value={activeTab}
        onChange={(v) => setActiveTab(v as 'positions' | 'pipeline' | 'candidates')}
        options={[
          { value: 'positions', label: 'Positions' },
          { value: 'pipeline', label: 'Pipeline' },
          { value: 'candidates', label: 'All Candidates' },
        ]}
        className="mb-4"
      />

      {/* Tab: Positions */}
      {activeTab === 'positions' && (
        <>
          <Card className="mb-4">
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Status
                  </label>
                  <select
                    value={filterPosStatus}
                    onChange={(e) => setFilterPosStatus(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[160px]"
                  >
                    <option value="">All</option>
                    {POSITION_STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Priority
                  </label>
                  <select
                    value={filterPosPriority}
                    onChange={(e) => setFilterPosPriority(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[160px]"
                  >
                    <option value="">All</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Industry
                  </label>
                  <select
                    value={filterPosIndustry}
                    onChange={(e) => setFilterPosIndustry(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[160px]"
                  >
                    <option value="">All</option>
                    {industries.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Positions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading...</div>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Priority</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Client/Project</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Positions</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Target Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Candidates</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((p) => (
                        <TableRow
                          key={p.id}
                          onClick={() => openPositionDetail(p)}
                          className="cursor-pointer"
                        >
                          <TableCell>
                            <Badge variant={priorityBadgeVariant(p.priority)}>
                              {p.priority}
                            </Badge>
                          </TableCell>
                          <TableCell variant="primary">{p.title}</TableCell>
                          <TableCell variant="secondary">{p.client_project ?? '—'}</TableCell>
                          <TableCell variant="secondary">{p.industry_name ?? '—'}</TableCell>
                          <TableCell variant="secondary">{(p.candidates_count ?? 0)}/{(p.number_of_positions ?? 1)}</TableCell>
                          <TableCell variant="secondary">{p.experience ?? '—'}</TableCell>
                          <TableCell variant="mono">{formatDate(p.target_start_date)}</TableCell>
                          <TableCell>
                            <Badge variant="slate">{statusLabel(p.status)}</Badge>
                          </TableCell>
                          <TableCell>{p.candidates_count ?? 0}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openPositionDetail(p)}>
                                View
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPosition(p as PositionDetail);
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {!loading && positions.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No positions found.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Tab: Pipeline (Kanban) */}
      {activeTab === 'pipeline' && (
        <>
          <Card className="mb-4">
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Position
                  </label>
                  <select
                    value={filterPipelinePosition}
                    onChange={(e) => setFilterPipelinePosition(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[180px]"
                  >
                    <option value="">All</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Source
                  </label>
                  <select
                    value={filterPipelineSource}
                    onChange={(e) => setFilterPipelineSource(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[160px]"
                  >
                    <option value="">All</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="overflow-x-auto pb-4">
            {loading ? (
              <div className="p-8 text-center text-zinc-500">Loading...</div>
            ) : (
              <div className="flex gap-4 min-w-max">
                {pipelineStages.map((stage) => (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    candidates={candidatesByStage[stage.id] ?? []}
                    onDrop={(candidateId) => handleKanbanDrop(candidateId, stage.id)}
                    onCardClick={openCandidateDetail}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab: All Candidates */}
      {activeTab === 'candidates' && (
        <>
          <Card className="mb-4">
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Position
                  </label>
                  <select
                    value={filterCandPosition}
                    onChange={(e) => setFilterCandPosition(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[180px]"
                  >
                    <option value="">All</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Stage
                  </label>
                  <select
                    value={filterCandStage}
                    onChange={(e) => setFilterCandStage(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[160px]"
                  >
                    <option value="">All</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Status
                  </label>
                  <select
                    value={filterCandStatus}
                    onChange={(e) => setFilterCandStatus(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[160px]"
                  >
                    <option value="">All</option>
                    {CANDIDATE_STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Source
                  </label>
                  <select
                    value={filterCandSource}
                    onChange={(e) => setFilterCandSource(e.target.value)}
                    className="h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-w-[120px] max-w-[160px]"
                  >
                    <option value="">All</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {canEdit && (
                  <div className="ml-auto">
                    <Button size="sm" onClick={() => { setEditingCandidate(null); setAddCandidateOpen(true); }} className="gap-1">
                      <Plus className="w-4 h-4" />
                      Add Candidate
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>All Candidates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading...</div>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((c) => (
                        <TableRow
                          key={c.id}
                          onClick={() => openCandidateDetail(c)}
                          className="cursor-pointer"
                        >
                          <TableCell variant="primary">{c.name}</TableCell>
                          <TableCell className="text-violet-600 dark:text-violet-400">{c.position_title ?? '—'}</TableCell>
                          <TableCell>
                            <span
                              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: c.stage_color ?? '#64748b' }}
                            >
                              {c.stage_name ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell variant="secondary">{c.source_name ?? '—'}</TableCell>
                          <TableCell variant="mono">{formatDate(c.applied_date || c.created_at)}</TableCell>
                          <TableCell variant="secondary">{daysInPipeline(c.created_at, c.applied_date)}</TableCell>
                          <TableCell>{c.overall_rating != null ? '★'.repeat(c.overall_rating) : '—'}</TableCell>
                          <TableCell variant="secondary">{statusLabel(c.status)}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => openCandidateDetail(c)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {!loading && candidates.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No candidates found.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modals: rendered by separate components below */}
      {addPositionOpen && (
        <AddEditPositionModal
          industries={industries}
          teamMembers={teamMembers}
          canSeeSalary={canSeeSalary}
          onClose={() => setAddPositionOpen(false)}
          onSaved={() => { setAddPositionOpen(false); fetchPositions(); fetchStats(); }}
        />
      )}
      {editingPosition && (
        <AddEditPositionModal
          position={editingPosition}
          industries={industries}
          teamMembers={teamMembers}
          canSeeSalary={canSeeSalary}
          onClose={() => setEditingPosition(null)}
          onSaved={() => { setEditingPosition(null); fetchPositions(); fetchStats(); if (positionDetail) openPositionDetail(positionDetail); }}
        />
      )}
      {positionDetailOpen && positionDetail && (
        <PositionDetailModal
          position={positionDetail}
          industries={industries}
          teamMembers={teamMembers}
          canSeeSalary={canSeeSalary}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => { setPositionDetailOpen(false); setPositionDetail(null); }}
          onRefresh={() => openPositionDetail(positionDetail)}
          onAddCandidate={() => { setPositionDetailOpen(false); setAddCandidatePositionId(positionDetail.id); setAddCandidateOpen(true); }}
          onOpenCandidate={async (id) => {
            const r = await fetch(`/api/hr/hiring/candidates/${id}`);
            if (r.ok) { const d = await r.json(); setCandidateDetail(d); setPositionDetailOpen(false); setCandidateDetailOpen(true); const h = await fetch(`/api/hr/hiring/candidates/${id}/history`); if (h.ok) setStageHistory((await h.json()).map((x: { stage_name: string; moved_at: string; moved_by_name: string | null }) => ({ stage_name: x.stage_name, moved_at: x.moved_at, moved_by_name: x.moved_by_name }))); }
          }}
          positions={positions}
        />
      )}
      {addCandidateOpen && (
        <AddEditCandidateModal
          positionId={addCandidatePositionId}
          positions={openPositionsForDropdown}
          stages={stages}
          sources={sources}
          teamMembers={teamMembers}
          editing={editingCandidate}
          canSeeSalary={canSeeSalary}
          onClose={() => { setAddCandidateOpen(false); setAddCandidatePositionId(null); setEditingCandidate(null); }}
          onSaved={() => { setAddCandidateOpen(false); setAddCandidatePositionId(null); setEditingCandidate(null); fetchCandidates(); fetchCandidatesForTab(); fetchStats(); if (positionDetail) fetchPositions().then(() => positionDetail && openPositionDetail(positionDetail)); }}
        />
      )}
      {candidateDetailOpen && candidateDetail && (
        <CandidateDetailModal
          candidate={candidateDetail}
          stages={stages}
          canSeeSalary={canSeeSalary}
          canEdit={canEdit}
          history={stageHistory}
          onClose={() => { setCandidateDetailOpen(false); setCandidateDetail(null); setStageHistory([]); }}
          onRefresh={() => openCandidateDetail(candidateDetail)}
          onEdit={() => { setEditingCandidate(candidateDetail); setCandidateDetailOpen(false); setAddCandidateOpen(true); }}
          onReject={async (reason) => {
            const rejectedStage = stages.find((s) => s.slug === 'rejected');
            if (rejectedStage) await advanceCandidateStage(candidateDetail.id, rejectedStage.id, reason);
          }}
        />
      )}
    </div>
  );
}

type AddCandidatePositionId = string | null;

// Collapsible section for long forms
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {title}
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && <div className="p-4 pt-0 space-y-3">{children}</div>}
    </div>
  );
}

// Kanban column with native drag-drop
function KanbanColumn({
  stage,
  candidates,
  onDrop,
  onCardClick,
  canEdit,
}: {
  stage: Stage;
  candidates: CandidateRow[];
  onDrop: (candidateId: string) => void;
  onCardClick: (c: CandidateRow) => void;
  canEdit: boolean;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData('candidateId');
    if (id) onDrop(id);
    setDraggedId(null);
  };
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('candidateId', id);
    setDraggedId(id);
  };
  const handleDragEnd = () => setDraggedId(null);

  return (
    <div
      className={cn(
        'w-72 flex-shrink-0 rounded-xl border-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 transition-colors',
        dragOver ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20' : 'border-zinc-200 dark:border-zinc-700'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="font-medium text-sm mb-2" style={{ color: stage.color }}>
        {stage.name}
      </div>
      <div className="space-y-2 min-h-[80px]">
        {candidates.map((c) => (
          <div
            key={c.id}
            draggable={canEdit}
            onDragStart={(e) => canEdit && handleDragStart(e, c.id)}
            onDragEnd={handleDragEnd}
            onClick={() => onCardClick(c)}
            className={cn(
              'bg-white dark:bg-zinc-800 rounded-lg p-3 shadow border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-start gap-2',
              draggedId === c.id && 'opacity-50'
            )}
          >
            {canEdit && <GripVertical className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />}
            <div className="min-w-0 flex-1">
              <div className="font-medium text-zinc-900 dark:text-white truncate">{c.name}</div>
              <div className="text-xs text-zinc-500 truncate">{c.position_title ?? '—'}</div>
              <div className="text-xs text-zinc-400 mt-1">
                {daysInPipeline(c.created_at, c.applied_date)}d in stage · {c.source_name ?? '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Placeholder modals - will add full implementation next
function AddEditPositionModal({
  position,
  industries,
  teamMembers,
  canSeeSalary,
  onClose,
  onSaved,
}: {
  position?: PositionDetail | null;
  industries: Industry[];
  teamMembers: TeamMember[];
  canSeeSalary: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!position;
  const [title, setTitle] = useState(position?.title ?? '');
  const [client_project, setClientProject] = useState(position?.client_project ?? '');
  const [industry_id, setIndustryId] = useState(position?.industry_id ?? '');
  const [department, setDepartment] = useState(position?.department ?? '');
  const [location, setLocation] = useState(position?.location ?? 'US');
  const [number_of_positions, setNumberPositions] = useState(position?.number_of_positions ?? 1);
  const [priority, setPriority] = useState(position?.priority ?? 'Medium');
  const [status, setStatus] = useState(position?.status ?? 'draft');
  const [experience, setExperience] = useState(position?.experience ?? '');
  const [core_skills, setCoreSkills] = useState(position?.core_skills ?? '');
  const [must_have_skills, setMustHaveSkills] = useState(position?.must_have_skills ?? '');
  const [preferred_skills, setPreferredSkills] = useState(position?.preferred_skills ?? '');
  const [reject_if, setRejectIf] = useState(position?.reject_if ?? '');
  const [reporting_to, setReportingTo] = useState(position?.reporting_to ?? '');
  const [hiring_owner_id, setHiringOwnerId] = useState(position?.hiring_owner_id ?? '');
  const [salary_min, setSalaryMin] = useState(position?.salary_min != null ? String(position.salary_min) : '');
  const [salary_max, setSalaryMax] = useState(position?.salary_max != null ? String(position.salary_max) : '');
  const [currency, setCurrency] = useState(position?.currency ?? 'USD');
  const [target_start_date, setTargetStartDate] = useState(position?.target_start_date ?? '');
  const [notes, setNotes] = useState(position?.notes ?? '');
  const [job_description, setJobDescription] = useState(position?.job_description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const entity = location === 'India' ? 'India' : 'US';
  const [activeFormTab, setActiveFormTab] = useState<'details' | 'requirements' | 'more'>('details');

  const handleSave = async (saveAsOpen: boolean) => {
    if (!title.trim()) { setError('Title is required'); return; }
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        client_project: client_project || null,
        industry_id: industry_id || null,
        department: department || null,
        location,
        entity,
        number_of_positions: Number(number_of_positions) || 1,
        priority,
        status: saveAsOpen ? 'open' : status,
        experience: experience || null,
        core_skills: core_skills || null,
        must_have_skills: must_have_skills || null,
        preferred_skills: preferred_skills || null,
        reject_if: reject_if || null,
        reporting_to: reporting_to || null,
        hiring_owner_id: hiring_owner_id || null,
        currency,
        target_start_date: target_start_date || null,
        notes: notes || null,
        job_description: job_description || null,
      };
      if (canSeeSalary) {
        payload.salary_min = salary_min ? Number(salary_min) : null;
        payload.salary_max = salary_max ? Number(salary_max) : null;
      }
      const url = position ? `/api/hr/positions/${position.id}` : '/api/hr/positions';
      const method = position ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error || 'Failed'); return; }
      onSaved();
    } catch { setError('Failed'); } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} maxWidth="xl">
      <ModalHeader title={isEdit ? 'Edit Position' : 'Add Position'} onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
          <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 mb-4">
            {(['details', 'requirements', 'more'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFormTab(tab)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                  activeFormTab === tab
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {tab === 'details' ? 'Details' : tab === 'requirements' ? 'Requirements' : 'More'}
              </button>
            ))}
          </div>

        {activeFormTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Title *"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" /></FormField>
              <FormField label="Client/Project"><Input value={client_project} onChange={(e) => setClientProject(e.target.value)} placeholder="Optional" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Industry">
                <Select value={industry_id} onChange={(e) => setIndustryId(e.target.value)}>
                  <option value="">Select</option>
                  {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Department">
                <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Location">
                <Select value={location} onChange={(e) => setLocation(e.target.value)}>
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </Select>
              </FormField>
              <FormField label="Entity"><Input value={entity} readOnly disabled className="bg-zinc-100 dark:bg-zinc-800 text-sm" /></FormField>
              <FormField label="Positions"><Input type="number" min={1} value={number_of_positions} onChange={(e) => setNumberPositions(Number(e.target.value) || 1)} /></FormField>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Priority">
                <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {POSITION_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </Select>
              </FormField>
              <FormField label="Target Start"><DateInput value={target_start_date} onChange={(e) => setTargetStartDate(e.target.value)} /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Reporting To"><Input value={reporting_to} onChange={(e) => setReportingTo(e.target.value)} placeholder="Title" /></FormField>
              <FormField label="Hiring Owner">
                <Select value={hiring_owner_id} onChange={(e) => setHiringOwnerId(e.target.value)}>
                  <option value="">Select</option>
                  {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Select>
              </FormField>
            </div>
          </div>
        )}

        {activeFormTab === 'requirements' && (
          <div className="space-y-3">
            <FormField label="Experience"><Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 4-6 years" /></FormField>
            <CollapsibleSection title="Core skills" defaultOpen={!!core_skills}>
              <Textarea value={core_skills} onChange={(e) => setCoreSkills(e.target.value)} rows={2} placeholder="Comma or line separated" className="text-sm" />
            </CollapsibleSection>
            <CollapsibleSection title="Must have" defaultOpen={!!must_have_skills}>
              <Textarea value={must_have_skills} onChange={(e) => setMustHaveSkills(e.target.value)} rows={2} placeholder="Required skills" className="text-sm" />
            </CollapsibleSection>
            <CollapsibleSection title="Preferred" defaultOpen={!!preferred_skills}>
              <Textarea value={preferred_skills} onChange={(e) => setPreferredSkills(e.target.value)} rows={2} placeholder="Nice to have" className="text-sm" />
            </CollapsibleSection>
            <CollapsibleSection title="Reject if" defaultOpen={!!reject_if}>
              <Textarea value={reject_if} onChange={(e) => setRejectIf(e.target.value)} rows={2} placeholder="Deal-breakers" className="text-sm" />
            </CollapsibleSection>
          </div>
        )}

        {activeFormTab === 'more' && (
          <div className="space-y-4">
            {canSeeSalary && (
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Salary Min"><Input type="number" value={salary_min} onChange={(e) => setSalaryMin(e.target.value)} /></FormField>
                <FormField label="Salary Max"><Input type="number" value={salary_max} onChange={(e) => setSalaryMax(e.target.value)} /></FormField>
                <FormField label="Currency"><Select value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></FormField>
              </div>
            )}
            <FormField label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes" /></FormField>
            <FormField label="Job Description"><Textarea value={job_description} onChange={(e) => setJobDescription(e.target.value)} rows={5} placeholder="Full description for candidates" /></FormField>
          </div>
        )}

        {error && <div className={cn(errorBlockClass, 'mt-4')}>{error}</div>}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {!isEdit && <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>Save as Draft</Button>}
        <Button onClick={() => handleSave(isEdit ? false : true)} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save' : 'Save & Open'}</Button>
      </ModalFooter>
    </Modal>
  );
}

function PositionDetailModal({
  position,
  industries,
  teamMembers,
  canSeeSalary,
  canEdit,
  canDelete,
  onClose,
  onRefresh,
  onAddCandidate,
  onOpenCandidate,
  positions,
}: {
  position: PositionDetail;
  industries: Industry[];
  teamMembers: TeamMember[];
  canSeeSalary: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onAddCandidate: () => void;
  onOpenCandidate: (id: string) => void;
  positions: PositionRow[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const candidates = position.hiring_candidates ?? [];
  return (
    <>
      <Modal onClose={onClose} maxWidth="xl">
        <ModalHeader title={position.title} onClose={onClose} />
        <ModalBody>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><span className="text-zinc-500">Client/Project</span><p className="font-medium">{position.client_project ?? '—'}</p></div>
            <div><span className="text-zinc-500">Industry</span><p className="font-medium">{position.industry_name ?? '—'}</p></div>
            <div><span className="text-zinc-500">Department</span><p className="font-medium">{position.department ?? '—'}</p></div>
            <div><span className="text-zinc-500">Location</span><p className="font-medium">{position.location ?? '—'}</p></div>
            <div><span className="text-zinc-500">Priority</span><p className="font-medium">{position.priority}</p></div>
            <div><span className="text-zinc-500">Status</span><p className="font-medium">{statusLabel(position.status)}</p></div>
            <div><span className="text-zinc-500">Target Date</span><p className="font-medium">{formatDate(position.target_start_date)}</p></div>
            <div><span className="text-zinc-500">Hiring Owner</span><p className="font-medium">{position.hiring_owner_name ?? '—'}</p></div>
            {canSeeSalary && (position.salary_min != null || position.salary_max != null) && (
              <div className="col-span-2"><span className="text-zinc-500">Compensation</span><p className="font-medium">{position.salary_min ?? '—'} - {position.salary_max ?? '—'} {position.currency ?? 'USD'}</p></div>
            )}
          </div>
          {position.job_description && <div className="mb-4"><span className="text-zinc-500 text-sm">Job Description</span><p className="mt-1 text-sm whitespace-pre-wrap">{position.job_description}</p></div>}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Candidates for this Position</span>
              {canEdit && <Button size="sm" onClick={onAddCandidate} className="gap-1 bg-violet-600 hover:bg-violet-500"><Plus className="w-4 h-4" />Add Candidate</Button>}
            </div>
            {candidates.length === 0 ? <p className="text-sm text-zinc-500">No candidates yet.</p> : (
              <table className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                <thead><tr className="bg-zinc-50 dark:bg-zinc-800/50"><th className="text-left py-2 px-3">Name</th><th className="text-left py-2 px-3">Email</th><th className="text-left py-2 px-3">Status</th></tr></thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => onOpenCandidate(c.id)}>
                      <td className="py-2 px-3 font-medium">{c.name}</td>
                      <td className="py-2 px-3">{c.email ?? '—'}</td>
                      <td className="py-2 px-3">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {canEdit && <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-1" />Edit Position</Button>}
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </ModalFooter>
      </Modal>
      {editOpen && (
        <AddEditPositionModal
          position={position}
          industries={industries}
          teamMembers={teamMembers}
          canSeeSalary={canSeeSalary}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); onRefresh(); }}
        />
      )}
    </>
  );
}

function AddEditCandidateModal({
  positionId,
  positions,
  stages,
  sources,
  teamMembers,
  editing,
  canSeeSalary,
  onClose,
  onSaved,
}: {
  positionId?: AddCandidatePositionId;
  positions: PositionRow[];
  stages: Stage[];
  sources: Source[];
  teamMembers: TeamMember[];
  editing: CandidateRow | null;
  canSeeSalary: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const posOptions = useMemo(() => {
    const open = positions.filter((p) => p.status === 'open');
    if (editing && editing.position_id && !open.some((p) => p.id === editing.position_id)) {
      const curr = positions.find((p) => p.id === editing.position_id);
      return curr ? [curr, ...open] : open;
    }
    return open;
  }, [positions, editing]);
  const [position_id, setPositionId] = useState(editing?.position_id ?? positionId ?? '');
  const [name, setName] = useState(editing?.name ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [phone, setPhone] = useState((editing as { phone?: string })?.phone ?? '');
  const [location, setLocation] = useState((editing as { location?: string })?.location ?? '');
  const [source_id, setSourceId] = useState((editing as { source_id?: string })?.source_id ?? '');
  const [referral_by_id, setReferralById] = useState((editing as { referral_by_id?: string })?.referral_by_id ?? '');
  const [referred_by_external, setReferredByExternal] = useState((editing as { referred_by_external?: string })?.referred_by_external ?? '');
  const [resume_url, setResumeUrl] = useState((editing as { resume_url?: string })?.resume_url ?? '');
  const [linkedin_url, setLinkedinUrl] = useState((editing as { linkedin_url?: string })?.linkedin_url ?? '');
  const [portfolio_url, setPortfolioUrl] = useState((editing as { portfolio_url?: string })?.portfolio_url ?? '');
  const [current_stage_id, setCurrentStageId] = useState(editing?.current_stage_id ?? stages[0]?.id ?? '');
  const [status, setStatus] = useState(editing?.status ?? 'active');
  const [rejection_reason, setRejectionReason] = useState((editing as { rejection_reason?: string })?.rejection_reason ?? '');
  const [applied_date, setAppliedDate] = useState((editing as { applied_date?: string })?.applied_date ?? '');
  const [current_salary, setCurrentSalary] = useState('');
  const [expected_salary, setExpectedSalary] = useState((editing as { expected_salary?: number })?.expected_salary != null ? String((editing as { expected_salary?: number }).expected_salary) : '');
  const [notice_period, setNoticePeriod] = useState((editing as { notice_period?: string })?.notice_period ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'basics' | 'more'>('basics');

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!position_id) { setError('Position is required'); return; }
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        position_id,
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        location: location || null,
        source_id: source_id || null,
        referral_by_id: source_id ? referral_by_id || null : null,
        referred_by_external: source_id ? referred_by_external || null : null,
        resume_url: resume_url || null,
        linkedin_url: linkedin_url || null,
        portfolio_url: portfolio_url || null,
        current_stage_id: current_stage_id || stages[0]?.id,
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        applied_date: applied_date || null,
        notes: notes || null,
      };
      if (canSeeSalary) { payload.current_salary = current_salary ? Number(current_salary) : null; payload.expected_salary = expected_salary ? Number(expected_salary) : null; payload.notice_period = notice_period || null; }
      const url = editing ? `/api/hr/hiring/candidates/${editing.id}` : '/api/hr/hiring/candidates';
      const method = editing ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error || 'Failed'); return; }
      onSaved();
    } catch { setError('Failed'); } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} maxWidth="xl">
      <ModalHeader title={editing ? 'Edit Candidate' : 'Add Candidate'} onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
          <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 mb-4">
            {(['basics', 'more'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFormTab(tab)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                  activeFormTab === tab
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {tab === 'basics' ? 'Contact & role' : 'Stage & more'}
              </button>
            ))}
          </div>

        {activeFormTab === 'basics' && (
          <div className="space-y-4">
            <FormField label="Name *"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
              <FormField label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></FormField>
            </div>
            <FormField label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bangalore" /></FormField>
            <FormField label="Position *">
              <Select value={position_id} onChange={(e) => setPositionId(e.target.value)} disabled={!!positionId}>
                <option value="">Select position</option>
                {posOptions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </Select>
            </FormField>
            <FormField label="Source">
              <Select value={source_id} onChange={(e) => setSourceId(e.target.value)}>
                <option value="">Select</option>
                {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            {source_id && sources.find((s) => s.id === source_id)?.name === 'Referral' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Referred by (team)">
                  <Select value={referral_by_id} onChange={(e) => setReferralById(e.target.value)}>
                    <option value="">Select</option>
                    {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </Select>
                </FormField>
                <FormField label="Or external name"><Input value={referred_by_external} onChange={(e) => setReferredByExternal(e.target.value)} placeholder="If external" /></FormField>
              </div>
            )}
          </div>
        )}

        {activeFormTab === 'more' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Current Stage">
                <Select value={current_stage_id} onChange={(e) => setCurrentStageId(e.target.value)}>
                  {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </FormField>
              <FormField label="Applied Date"><DateInput value={applied_date} onChange={(e) => setAppliedDate(e.target.value)} /></FormField>
            </div>
            <FormField label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {CANDIDATE_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </Select>
            </FormField>
            {status === 'rejected' && <FormField label="Rejection Reason"><Textarea value={rejection_reason} onChange={(e) => setRejectionReason(e.target.value)} rows={2} /></FormField>}
            <CollapsibleSection title="Links (resume, LinkedIn, portfolio)" defaultOpen={!!(resume_url || linkedin_url || portfolio_url)}>
              <div className="grid grid-cols-1 gap-3">
                <FormField label="Resume URL"><Input value={resume_url} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://..." /></FormField>
                <FormField label="LinkedIn"><Input value={linkedin_url} onChange={(e) => setLinkedinUrl(e.target.value)} /></FormField>
                <FormField label="Portfolio"><Input value={portfolio_url} onChange={(e) => setPortfolioUrl(e.target.value)} /></FormField>
              </div>
            </CollapsibleSection>
            {canSeeSalary && (
              <CollapsibleSection title="Compensation" defaultOpen={!!(current_salary || expected_salary || notice_period)}>
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Current Salary"><Input type="number" value={current_salary} onChange={(e) => setCurrentSalary(e.target.value)} /></FormField>
                  <FormField label="Expected Salary"><Input type="number" value={expected_salary} onChange={(e) => setExpectedSalary(e.target.value)} /></FormField>
                  <FormField label="Notice Period"><Input value={notice_period} onChange={(e) => setNoticePeriod(e.target.value)} placeholder="e.g. 2 weeks" /></FormField>
                </div>
              </CollapsibleSection>
            )}
            <FormField label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="General notes" /></FormField>
          </div>
        )}

        {error && <div className={cn(errorBlockClass, 'mt-4')}>{error}</div>}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </ModalFooter>
    </Modal>
  );
}

function CandidateDetailModal({
  candidate,
  stages,
  canSeeSalary,
  canEdit,
  history,
  onClose,
  onRefresh,
  onEdit,
  onReject,
}: {
  candidate: CandidateRow;
  stages: Stage[];
  canSeeSalary: boolean;
  canEdit: boolean;
  history: Array<{ stage_name: string; moved_at: string; moved_by_name: string | null }>;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: () => void;
  onReject: (reason: string) => Promise<void>;
}) {
  const [stageId, setStageId] = useState(candidate.current_stage_id ?? '');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleAdvance = async (overrideStageId?: string) => {
    const sid = overrideStageId ?? stageId;
    if (!sid) return;
    setUpdating(true);
    try {
      const r = await fetch(`/api/hr/hiring/candidates/${candidate.id}/advance-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: sid }),
      });
      if (r.ok) onRefresh();
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    await onReject(rejectReason);
    setRejectModal(false);
    setRejectReason('');
  };

  const rejectedStage = stages.find((s) => s.slug === 'rejected');
  const offerStage = stages.find((s) => s.slug === 'offer');

  return (
    <>
      <Modal onClose={onClose} maxWidth="xl">
        <ModalHeader title={candidate.name} onClose={onClose} />
        <ModalBody>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-zinc-500">Position</span><p className="font-medium">{candidate.position_title ?? '—'}</p></div>
                <div><span className="text-zinc-500">Email</span><p className="font-medium">{candidate.email ?? '—'}</p></div>
                <div><span className="text-zinc-500">Source</span><p className="font-medium">{(candidate as { source_name?: string }).source_name ?? '—'}</p></div>
                <div><span className="text-zinc-500">Stage</span><p className="font-medium">{candidate.stage_name ?? '—'}</p></div>
                <div><span className="text-zinc-500">Status</span><p className="font-medium">{statusLabel(candidate.status)}</p></div>
                <div><span className="text-zinc-500">Days in pipeline</span><p className="font-medium">{daysInPipeline(candidate.created_at, (candidate as { applied_date?: string }).applied_date)}</p></div>
                {canSeeSalary && (candidate as { expected_salary?: number }).expected_salary != null && (
                  <div><span className="text-zinc-500">Expected Salary</span><p className="font-medium">{(candidate as { expected_salary?: number }).expected_salary}</p></div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Stage History</h4>
              <ul className="space-y-2 text-sm">
                {history.length === 0 ? <li className="text-zinc-500">No history yet.</li> : history.map((h, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{h.stage_name}</span>
                    <span className="text-zinc-500">{formatDate(h.moved_at)} {h.moved_by_name ? `by ${h.moved_by_name}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {canEdit && (
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
              <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-3 items-end">
                <FormField label="Advance to stage">
                  <Select value={stageId} onChange={(e) => setStageId(e.target.value)}>
                    {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </FormField>
                <Button onClick={() => handleAdvance()} disabled={updating}>{updating ? 'Updating...' : 'Update Stage'}</Button>
                {rejectedStage && <Button variant="danger" onClick={() => setRejectModal(true)}>Reject</Button>}
                {offerStage && <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={() => handleAdvance(offerStage.id)}>Make Offer</Button>}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {canEdit && <Button variant="secondary" onClick={onEdit}><Pencil className="w-4 h-4 mr-1" />Edit</Button>}
          <Button variant="secondary" onClick={onClose}>Back</Button>
        </ModalFooter>
      </Modal>
      {rejectModal && (
        <Modal onClose={() => setRejectModal(false)} maxWidth="sm">
          <ModalHeader title="Rejection Reason" onClose={() => setRejectModal(false)} />
          <ModalBody>
            <FormField label="Reason"><Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} /></FormField>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setRejectModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject</Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}
