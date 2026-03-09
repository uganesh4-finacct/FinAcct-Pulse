'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SubNav from '@/components/SubNav';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { FormField, Input, Textarea, Select, DateInput, errorBlockClass } from '@/components/ui/Form';
import { FileText, Clock, BookOpen, ListTodo, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, string> = { draft: 'Draft', submitted: 'Submitted', reviewed: 'Reviewed' };

function getWeekEndingOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const day = now.getDay();
  const toNextFriday = day <= 5 ? 5 - day : 5 - day + 7;
  let friday = new Date(now);
  friday.setDate(now.getDate() + toNextFriday);
  for (let i = 0; i < 4; i++) {
    const d = new Date(friday);
    d.setDate(friday.getDate() - i * 7);
    const value = d.toISOString().slice(0, 10);
    options.push({ value, label: `Week ending ${value}` });
  }
  return options;
}

function getDefaultWeekEnding(): string {
  const now = new Date();
  const day = now.getDay();
  const toMostRecentFriday = day >= 5 ? day - 5 : day + 2;
  const friday = new Date(now);
  friday.setDate(now.getDate() - toMostRecentFriday);
  return friday.toISOString().slice(0, 10);
}

type ReportRow = {
  id: string;
  manager_id: string;
  week_ending: string;
  clients_managed?: number | null;
  books_closed_this_week?: number | null;
  books_pending_close?: number | null;
  backlog_count?: number | null;
  client_issues?: string | null;
  team_issues?: string | null;
  top_priorities_next_week?: string | null;
  help_needed_leadership?: string | null;
  status: string;
  team_members?: { id: string; name: string } | null;
};

type Stats = {
  reportsThisWeek: number;
  pendingReview: number;
  booksClosedSum: number;
  totalBacklog: number;
};

type TeamMember = { id: string; name: string };

export default function WeeklyReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [stats, setStats] = useState<Stats>({ reportsThisWeek: 0, pendingReview: 0, booksClosedSum: 0, totalBacklog: 0 });
  const [managers, setManagers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWeek, setFilterWeek] = useState<string>('');
  const [filterManager, setFilterManager] = useState<string>('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (filterWeek) p.set('week', filterWeek);
    if (filterManager) p.set('managerId', filterManager);
    return p.toString();
  }, [filterWeek, filterManager]);

  const fetchData = async () => {
    try {
      const [reportsRes, teamRes, meRes] = await Promise.all([
        fetch(`/api/operations/weekly-reports${query ? `?${query}` : ''}`),
        fetch('/api/team'),
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
      ]);
      if (reportsRes.ok) {
        const d = await reportsRes.json();
        setReports(d.reports ?? []);
        setStats(d.stats ?? { reportsThisWeek: 0, pendingReview: 0, booksClosedSum: 0, totalBacklog: 0 });
      }
      if (teamRes.ok) {
        const t = await teamRes.json();
        const list = Array.isArray(t) ? t : (t.members ?? []);
        setManagers(list.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name || m.id })));
      }
      if (meRes?.role) setCurrentUserRole(meRes.role);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [query]);

  const weekOptions = useMemo(() => getWeekEndingOptions(), []);
  const openSubmit = () => setSubmitModalOpen(true);
  const openView = (row: ReportRow) => {
    setSelectedReport(row);
    setViewModalOpen(true);
  };
  const closeSubmit = () => setSubmitModalOpen(false);
  const closeView = () => {
    setViewModalOpen(false);
    setSelectedReport(null);
  };
  const managerName = (r: ReportRow) => (r.team_members as { name?: string } | null)?.name ?? '—';
  const isAdminOrReviewer = currentUserRole === 'admin' || currentUserRole === 'default' || currentUserRole === 'reviewer';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Weekly Reports</h1>
        <Button onClick={openSubmit} className="gap-2">
          <Plus className="w-4 h-4" />
          Submit Report
        </Button>
      </div>
      <SubNav />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Reports This Week</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.reportsThisWeek}</p>
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Pending Review</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.pendingReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Books Closed</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.booksClosedSum}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 dark:border-violet-900/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Backlog</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalBacklog}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-4">
            <FormField label="Week" className="w-48">
              <Select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)}>
                <option value="">All weeks</option>
                {weekOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Manager" className="w-48">
              <Select value={filterManager} onChange={(e) => setFilterManager(e.target.value)}>
                <option value="">All managers</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Manager</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Week Ending</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Clients</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Closed</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Pending</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Backlog</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Issues</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => openView(r)}
                      className={cn(
                        'border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors',
                        'hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                      )}
                    >
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">{managerName(r)}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{r.week_ending}</td>
                      <td className="py-3 px-4 tabular-nums">{r.clients_managed ?? 0}</td>
                      <td className="py-3 px-4 tabular-nums">{r.books_closed_this_week ?? 0}</td>
                      <td className="py-3 px-4 tabular-nums">{r.books_pending_close ?? 0}</td>
                      <td className="py-3 px-4 tabular-nums">{r.backlog_count ?? 0}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {[r.client_issues, r.team_issues].filter(Boolean).length ? 'Yes' : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'inline-flex px-2 py-0.5 rounded-md text-xs font-medium',
                          r.status === 'reviewed' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                          r.status === 'submitted' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                          r.status === 'draft' && 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                        )}>
                          {STATUS_MAP[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button type="button" onClick={(e) => { e.stopPropagation(); openView(r); }} className="text-violet-600 dark:text-violet-400 hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length === 0 && (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">No reports yet. Submit one to get started.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {submitModalOpen && (
        <SubmitReportModal
          defaultWeekEnding={getDefaultWeekEnding()}
          onClose={closeSubmit}
          onSuccess={() => { closeSubmit(); fetchData(); }}
        />
      )}
      {viewModalOpen && selectedReport && (
        <ViewReportModal
          report={selectedReport}
          canMarkReviewed={isAdminOrReviewer && selectedReport.status === 'submitted'}
          onClose={closeView}
          onSuccess={() => { closeView(); fetchData(); }}
        />
      )}
    </div>
  );
}

function SubmitReportModal({
  defaultWeekEnding,
  onClose,
  onSuccess,
}: {
  defaultWeekEnding: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [weekEnding, setWeekEnding] = useState(defaultWeekEnding);
  const [clientsManaged, setClientsManaged] = useState('');
  const [booksClosed, setBooksClosed] = useState('');
  const [booksPending, setBooksPending] = useState('');
  const [backlogCount, setBacklogCount] = useState('');
  const [clientIssues, setClientIssues] = useState('');
  const [teamIssues, setTeamIssues] = useState('');
  const [topPriorities, setTopPriorities] = useState('');
  const [helpNeeded, setHelpNeeded] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (status: 'draft' | 'submitted') => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/operations/weekly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_ending: weekEnding,
          clients_managed: clientsManaged === '' ? 0 : Number(clientsManaged),
          books_closed_this_week: booksClosed === '' ? 0 : Number(booksClosed),
          books_pending_close: booksPending === '' ? 0 : Number(booksPending),
          backlog_count: backlogCount === '' ? 0 : Number(backlogCount),
          client_issues: clientIssues.trim() || null,
          team_issues: teamIssues.trim() || null,
          top_priorities_next_week: topPriorities.trim() || null,
          help_needed_leadership: helpNeeded.trim() || null,
          status,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed');
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
      <div className="flex flex-col max-h-[90vh]">
        <ModalHeader title="Submit Report" onClose={onClose} />
        <ModalBody>
          <div className="space-y-4">
            {error && <div className={errorBlockClass}>{error}</div>}
            <FormField label="Week Ending">
              <DateInput value={weekEnding} onChange={(e) => setWeekEnding(e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Clients Managed">
                <Input type="number" min={0} value={clientsManaged} onChange={(e) => setClientsManaged(e.target.value)} />
              </FormField>
              <FormField label="Books Closed This Week">
                <Input type="number" min={0} value={booksClosed} onChange={(e) => setBooksClosed(e.target.value)} />
              </FormField>
              <FormField label="Books Pending Close">
                <Input type="number" min={0} value={booksPending} onChange={(e) => setBooksPending(e.target.value)} />
              </FormField>
              <FormField label="Backlog Count">
                <Input type="number" min={0} value={backlogCount} onChange={(e) => setBacklogCount(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Client Issues">
              <Textarea value={clientIssues} onChange={(e) => setClientIssues(e.target.value)} rows={3} placeholder="Any client issues this week" />
            </FormField>
            <FormField label="Team Issues">
              <Textarea value={teamIssues} onChange={(e) => setTeamIssues(e.target.value)} rows={3} placeholder="Team or process issues" />
            </FormField>
            <FormField label="Top Priorities Next Week">
              <Textarea value={topPriorities} onChange={(e) => setTopPriorities(e.target.value)} rows={3} />
            </FormField>
            <FormField label="Help Needed from Leadership">
              <Textarea value={helpNeeded} onChange={(e) => setHelpNeeded(e.target.value)} rows={3} />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="secondary" onClick={() => submit('draft')} disabled={saving}>{saving ? 'Saving...' : 'Save Draft'}</Button>
          <Button type="button" onClick={() => submit('submitted')} disabled={saving}>{saving ? 'Submitting...' : 'Submit'}</Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function ViewReportModal({
  report,
  canMarkReviewed,
  onClose,
  onSuccess,
}: {
  report: ReportRow;
  canMarkReviewed: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [clientIssues, setClientIssues] = useState(report.client_issues ?? '');
  const [teamIssues, setTeamIssues] = useState(report.team_issues ?? '');
  const [topPriorities, setTopPriorities] = useState(report.top_priorities_next_week ?? '');
  const [helpNeeded, setHelpNeeded] = useState(report.help_needed_leadership ?? '');
  const [clientsManaged, setClientsManaged] = useState(String(report.clients_managed ?? ''));
  const [booksClosed, setBooksClosed] = useState(String(report.books_closed_this_week ?? ''));
  const [booksPending, setBooksPending] = useState(String(report.books_pending_close ?? ''));
  const [backlogCount, setBacklogCount] = useState(String(report.backlog_count ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const managerName = (report.team_members as { name?: string } | null)?.name ?? '—';
  const isSubmitted = report.status === 'submitted';

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/weekly-reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clients_managed: clientsManaged === '' ? 0 : Number(clientsManaged),
          books_closed_this_week: booksClosed === '' ? 0 : Number(booksClosed),
          books_pending_close: booksPending === '' ? 0 : Number(booksPending),
          backlog_count: backlogCount === '' ? 0 : Number(backlogCount),
          client_issues: clientIssues.trim() || null,
          team_issues: teamIssues.trim() || null,
          top_priorities_next_week: topPriorities.trim() || null,
          help_needed_leadership: helpNeeded.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed');
      }
      setEditing(false);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const markReviewed = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/weekly-reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reviewed' }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed');
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
      <div className="flex flex-col max-h-[90vh]">
        <ModalHeader title={`Report — ${report.week_ending}`} onClose={onClose} />
        <ModalBody>
          <div className="space-y-4">
            {error && <div className={errorBlockClass}>{error}</div>}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Manager: <span className="font-medium text-zinc-900 dark:text-white">{managerName}</span></p>
            {!editing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-xs text-zinc-500">Clients Managed</span><p className="font-medium">{report.clients_managed ?? 0}</p></div>
                  <div><span className="text-xs text-zinc-500">Books Closed This Week</span><p className="font-medium">{report.books_closed_this_week ?? 0}</p></div>
                  <div><span className="text-xs text-zinc-500">Books Pending Close</span><p className="font-medium">{report.books_pending_close ?? 0}</p></div>
                  <div><span className="text-xs text-zinc-500">Backlog Count</span><p className="font-medium">{report.backlog_count ?? 0}</p></div>
                </div>
                {report.client_issues && <div><span className="text-xs text-zinc-500">Client Issues</span><p className="mt-1 text-sm whitespace-pre-wrap">{report.client_issues}</p></div>}
                {report.team_issues && <div><span className="text-xs text-zinc-500">Team Issues</span><p className="mt-1 text-sm whitespace-pre-wrap">{report.team_issues}</p></div>}
                {report.top_priorities_next_week && <div><span className="text-xs text-zinc-500">Top Priorities Next Week</span><p className="mt-1 text-sm whitespace-pre-wrap">{report.top_priorities_next_week}</p></div>}
                {report.help_needed_leadership && <div><span className="text-xs text-zinc-500">Help Needed from Leadership</span><p className="mt-1 text-sm whitespace-pre-wrap">{report.help_needed_leadership}</p></div>}
                <p className="text-xs text-zinc-500">Status: <span className="font-medium">{STATUS_MAP[report.status] ?? report.status}</span></p>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Clients Managed"><Input type="number" min={0} value={clientsManaged} onChange={(e) => setClientsManaged(e.target.value)} /></FormField>
                  <FormField label="Books Closed This Week"><Input type="number" min={0} value={booksClosed} onChange={(e) => setBooksClosed(e.target.value)} /></FormField>
                  <FormField label="Books Pending Close"><Input type="number" min={0} value={booksPending} onChange={(e) => setBooksPending(e.target.value)} /></FormField>
                  <FormField label="Backlog Count"><Input type="number" min={0} value={backlogCount} onChange={(e) => setBacklogCount(e.target.value)} /></FormField>
                </div>
                <FormField label="Client Issues"><Textarea value={clientIssues} onChange={(e) => setClientIssues(e.target.value)} rows={3} /></FormField>
                <FormField label="Team Issues"><Textarea value={teamIssues} onChange={(e) => setTeamIssues(e.target.value)} rows={3} /></FormField>
                <FormField label="Top Priorities Next Week"><Textarea value={topPriorities} onChange={(e) => setTopPriorities(e.target.value)} rows={3} /></FormField>
                <FormField label="Help Needed from Leadership"><Textarea value={helpNeeded} onChange={(e) => setHelpNeeded(e.target.value)} rows={3} /></FormField>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {!editing ? (
            <>
              {report.status === 'draft' && <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>}
              {canMarkReviewed && <Button onClick={markReviewed} disabled={saving}>{saving ? 'Updating...' : 'Mark Reviewed'}</Button>}
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </>
          )}
        </ModalFooter>
      </div>
    </Modal>
  );
}
