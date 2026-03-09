'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Pencil,
  UserPlus,
  Building2,
  MapPin,
  Users,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

interface PositionSlideoverProps {
  isOpen: boolean;
  onClose: () => void;
  position: {
    id?: string;
    requisition_id?: string;
    title?: string;
    position_title?: string;
    client_name?: string;
    location?: string;
    priority?: string;
    status?: string;
    days_open?: number;
    headcount?: number;
    department?: string;
    salary_range_min?: number;
    salary_range_max?: number;
    created_at?: string;
    target_start_date?: string;
    justification?: string;
    sourced?: number;
    screening?: number;
    screen?: number;
    technical?: number;
    tech?: number;
    offer?: number;
    hired?: number;
  } | null;
  onEdit?: (position: unknown) => void;
  onAddCandidate?: (position: unknown) => void;
}

const stageLabels: Record<string, string> = {
  sourced: 'Sourced',
  screen: 'Screening',
  screening: 'Screening',
  tech: 'Technical',
  technical: 'Technical',
  offer: 'Offer',
  hired: 'Hired',
  joined: 'Joined',
};

export function PositionSlideover({
  isOpen,
  onClose,
  position,
  onEdit,
  onAddCandidate,
}: PositionSlideoverProps) {
  const [candidates, setCandidates] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  const positionId = position?.id ?? position?.requisition_id;

  useEffect(() => {
    if (isOpen && positionId) {
      setLoading(true);
      fetch(`/api/hr/hiring/candidates?positionId=${positionId}`)
        .then((res) => res.json())
        .then((data) => setCandidates(Array.isArray(data) ? data : data?.candidates ?? []))
        .catch(() => setCandidates([]))
        .finally(() => setLoading(false));
    } else {
      setCandidates([]);
    }
  }, [isOpen, positionId]);

  if (!isOpen || !position) return null;

  const title = position.title ?? position.position_title ?? 'Position';
  const stages = ['sourced', 'screen', 'tech', 'offer', 'hired'];
  const getStageSlug = (s: string) => (s === 'screen' ? 'screening' : s === 'tech' ? 'technical' : s);

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-start justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-slate-50">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {(position.priority || position.status) && (
                <>
                  {position.priority && (
                    <Badge
                      variant={
                        position.priority === 'Critical' || position.priority === 'critical'
                          ? 'red'
                          : position.priority === 'High' || position.priority === 'high'
                            ? 'orange'
                            : position.priority === 'Medium' || position.priority === 'medium'
                              ? 'yellow'
                              : 'slate'
                      }
                    >
                      {position.priority}
                    </Badge>
                  )}
                  {position.status && (
                    <Badge variant={position.status === 'open' ? 'green' : 'slate'}>
                      {position.status}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 truncate">{title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
              {position.client_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 shrink-0" />
                  {position.client_name}
                </span>
              )}
              {position.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {String(position.location).toLowerCase() === 'india' ? '🇮🇳 India' : '🇺🇸 US'}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-2 flex-wrap">
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(position)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit Position
              </Button>
            )}
            {onAddCandidate && (
              <Button size="sm" onClick={() => onAddCandidate(position)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Add Candidate
              </Button>
            )}
          </div>

          <div className="p-4 grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-violet-600">{candidates.length}</div>
              <div className="text-xs text-slate-500">Total Candidates</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">
                {position.days_open ?? 0}
              </div>
              <div className="text-xs text-slate-500">Days Open</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {position.headcount ?? 1}
              </div>
              <div className="text-xs text-slate-500">Openings</div>
            </div>
          </div>

          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Pipeline</h3>
            <div className="space-y-2">
              {stages.map((stage) => {
                const slug = getStageSlug(stage);
                const count =
                  slug === 'sourced'
                    ? position.sourced ?? 0
                    : slug === 'screening'
                      ? position.screening ?? position.screen ?? 0
                      : slug === 'technical'
                        ? position.technical ?? position.tech ?? 0
                        : slug === 'offer'
                          ? position.offer ?? 0
                          : position.hired ?? 0;
                const stageCandidates = candidates.filter(
                  (c) =>
                    (c.current_stage as string)?.toLowerCase() === slug ||
                    (c.hiring_stages as { slug?: string })?.slug === slug
                );
                const displayCount = typeof count === 'number' ? count : stageCandidates.length;
                const maxCount = Math.max(
                  ...stages.map((s) => {
                    const sl = getStageSlug(s);
                    if (sl === 'sourced') return position.sourced ?? 0;
                    if (sl === 'screening') return position.screening ?? position.screen ?? 0;
                    if (sl === 'technical') return position.technical ?? position.tech ?? 0;
                    if (sl === 'offer') return position.offer ?? 0;
                    return position.hired ?? 0;
                  }),
                  1
                );
                const width = (displayCount / maxCount) * 100;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-slate-600">
                      {stageLabels[stage] ?? stage}
                    </div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stage === 'sourced'
                            ? 'bg-slate-400'
                            : stage === 'screen'
                              ? 'bg-blue-400'
                              : stage === 'tech'
                                ? 'bg-purple-400'
                                : stage === 'offer'
                                  ? 'bg-orange-400'
                                  : 'bg-emerald-500'
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="w-8 text-sm font-medium text-slate-700 text-right">
                      {displayCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Candidates</h3>
              {positionId && (
                <Link
                  href={`/hr/hiring?position=${positionId}`}
                  className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  View all <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading candidates...</div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No candidates yet</p>
                {onAddCandidate && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => onAddCandidate(position)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add First Candidate
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.slice(0, 5).map((candidate) => {
                  const name = (candidate.name ?? candidate.full_name ?? '') as string;
                  const stage = (candidate.stage_name ?? candidate.current_stage ?? '') as string;
                  const source = (candidate.source_name ?? (candidate.hiring_sources as { name?: string })?.name ?? (candidate.source as string) ?? '') as string;
                  const id = candidate.id as string;
                  return (
                    <Link
                      key={id}
                      href={`/hr/hiring?candidate=${id}`}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
                          {name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-violet-600">
                            {name || 'Unnamed'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {source} • {stage}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {position.department && (
                <div>
                  <span className="text-slate-500">Department</span>
                  <p className="font-medium text-slate-900">{position.department}</p>
                </div>
              )}
              {(position.salary_range_min != null || position.salary_range_max != null) && (
                <div>
                  <span className="text-slate-500">Salary Range</span>
                  <p className="font-medium text-slate-900">
                    {position.salary_range_min != null && position.salary_range_max != null
                      ? `${position.salary_range_min?.toLocaleString()} - ${position.salary_range_max?.toLocaleString()}`
                      : position.salary_range_min != null
                        ? position.salary_range_min?.toLocaleString()
                        : position.salary_range_max?.toLocaleString()}
                  </p>
                </div>
              )}
              {position.created_at && (
                <div>
                  <span className="text-slate-500">Created</span>
                  <p className="font-medium text-slate-900">
                    {new Date(position.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {position.target_start_date && (
                <div>
                  <span className="text-slate-500">Target Start</span>
                  <p className="font-medium text-slate-900">
                    {new Date(position.target_start_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            {position.justification && (
              <div className="mt-4">
                <span className="text-sm text-slate-500">Justification</span>
                <p className="mt-1 text-sm text-slate-700">{position.justification}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
