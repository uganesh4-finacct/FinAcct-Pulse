'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, UserPlus } from 'lucide-react';
import type { HRPipelineByRequisition } from '@/lib/hr/types';
import { PositionSlideover } from './PositionSlideover';

interface PipelineTableInteractiveProps {
  rows: HRPipelineByRequisition[];
  maxBar?: number;
}

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    sourced: 'bg-slate-400',
    screen: 'bg-blue-400',
    screening: 'bg-blue-400',
    tech: 'bg-purple-400',
    technical: 'bg-purple-400',
    offer: 'bg-orange-400',
    hired: 'bg-emerald-500',
  };
  return colors[stage] ?? 'bg-slate-300';
}

function barWidth(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((count / max) * 100));
}

export default function PipelineTableInteractive({ rows, maxBar = 10 }: PipelineTableInteractiveProps) {
  const [selectedPosition, setSelectedPosition] = useState<HRPipelineByRequisition | null>(null);
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);

  const positionFromRow = (row: HRPipelineByRequisition) => {
    const r = row as unknown as Record<string, unknown>;
    return {
      id: row.requisition_id,
      requisition_id: row.requisition_id,
      title: row.position_title,
      position_title: row.position_title,
      client_name: r.client_name as string | undefined,
      location: r.location as string | undefined,
      priority: r.priority as string | undefined,
      status: r.status as string | undefined,
      days_open: row.days_open,
      headcount: r.headcount as number | undefined,
      sourced: row.sourced,
      screening: row.screening,
      screen: row.screening,
      technical: row.technical,
      tech: row.technical,
      offer: row.offer,
      hired: row.hired,
    };
  };

  const handleEditPosition = (position: unknown) => {
    const p = position as { requisition_id?: string; id?: string };
    const id = p?.requisition_id ?? p?.id;
    if (id) window.location.href = `/hr/requisitions/${id}`;
    setIsSlideoverOpen(false);
  };

  const handleAddCandidate = (position: unknown) => {
    const p = position as { requisition_id?: string; id?: string };
    const id = p?.requisition_id ?? p?.id;
    if (id) window.location.href = `/hr/hiring?position=${id}`;
    setIsSlideoverOpen(false);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 text-left font-semibold">Position</th>
              <th className="px-3 py-3 text-center font-semibold">Sourced</th>
              <th className="px-3 py-3 text-center font-semibold">Screen</th>
              <th className="px-3 py-3 text-center font-semibold">Tech</th>
              <th className="px-3 py-3 text-center font-semibold">Offer</th>
              <th className="px-3 py-3 text-center font-semibold">Hired</th>
              <th className="px-3 py-3 text-center font-semibold">Days</th>
              <th className="px-3 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No pipeline data
                </td>
              </tr>
            )}
            {rows.map((row, idx) => {
              const max = Math.max(
                row.sourced,
                row.screening,
                row.technical,
                row.offer,
                row.hired,
                1
              );
              const position = positionFromRow(row);
              return (
                <tr
                  key={row.requisition_id ?? idx}
                  onClick={() => {
                    setSelectedPosition(row);
                    setIsSlideoverOpen(true);
                  }}
                  className={`
                    border-b border-slate-100 last:border-0 cursor-pointer transition-all duration-150
                    hover:bg-violet-50 hover:shadow-sm
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                  `}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900 hover:text-violet-600 transition-colors">
                          {row.position_title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {position.client_name ?? 'No client'} • {position.location ?? '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-1.5 w-12 rounded-full overflow-hidden bg-slate-100">
                        <div
                          className={`h-full rounded-full ${getStageColor('sourced')}`}
                          style={{ width: `${barWidth(row.sourced, max)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 min-w-[1.25rem]">
                        {row.sourced}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${getStageColor('screening')}`}
                          style={{ width: `${barWidth(row.screening, max)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 min-w-[1.25rem]">
                        {row.screening}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${getStageColor('tech')}`}
                          style={{ width: `${barWidth(row.technical, max)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 min-w-[1.25rem]">
                        {row.technical}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${getStageColor('offer')}`}
                          style={{ width: `${barWidth(row.offer, max)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 min-w-[1.25rem]">
                        {row.offer}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${getStageColor('hired')}`}
                          style={{ width: `${barWidth(row.hired, max)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700 min-w-[1.25rem]">
                        {row.hired}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className="text-sm text-slate-500 tabular-nums">
                      {row.days_open}
                    </span>
                  </td>
                  <td
                    className="px-3 py-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {row.requisition_id && (
                        <>
                          <Link
                            href={`/hr/requisitions/${row.requisition_id}`}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/hr/hiring?position=${row.requisition_id}`}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Add Candidate"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PositionSlideover
        isOpen={isSlideoverOpen}
        onClose={() => {
          setIsSlideoverOpen(false);
          setSelectedPosition(null);
        }}
        position={selectedPosition ? positionFromRow(selectedPosition) : null}
        onEdit={handleEditPosition}
        onAddCandidate={handleAddCandidate}
      />
    </>
  );
}
