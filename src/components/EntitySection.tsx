'use client';

import { Building2 } from 'lucide-react';
import { OrgChart, type TeamMember } from './OrgChart';

export interface EntitySectionProps {
  title: string;
  subtitle?: string;
  accentColor: 'blue' | 'violet';
  data: TeamMember[];
  onMemberClick?: (member: TeamMember) => void;
}

function countNodes(nodes: TeamMember[]): number {
  return nodes.reduce(
    (acc, m) => acc + 1 + countNodes(m.children ?? []),
    0
  );
}

const colors = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-700',
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'text-violet-500',
    title: 'text-violet-900',
    badge: 'bg-violet-100 text-violet-700',
  },
} as const;

export function EntitySection({
  title,
  subtitle,
  accentColor,
  data,
  onMemberClick,
}: EntitySectionProps) {
  const c = colors[accentColor];
  const memberCount = countNodes(data);

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-6`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="p-2 rounded-xl bg-white shadow-sm">
          <Building2 className={`h-6 w-6 ${c.icon}`} />
        </div>
        <div className="min-w-0">
          <h2 className={`text-lg font-semibold ${c.title}`}>{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        <span
          className={`ml-auto px-3 py-1 rounded-full text-sm font-medium shrink-0 ${c.badge}`}
        >
          {memberCount} member{memberCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Org Chart */}
      <div className="bg-white/50 rounded-xl p-6">
        <OrgChart data={data} onMemberClick={onMemberClick} />
      </div>
    </div>
  );
}
