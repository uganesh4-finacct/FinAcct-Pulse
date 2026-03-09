'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';

export interface TeamMember {
  id: string;
  name: string;
  role_title: string | null;
  role: string;
  email?: string | null;
  location?: string | null;
  entity: string;
  reports_to?: string | null;
  active?: boolean;
  children?: TeamMember[];
}

export interface OrgChartProps {
  data: TeamMember[];
  onMemberClick?: (member: TeamMember) => void;
}

const roleBadgeVariants: Record<string, string> = {
  admin: 'bg-slate-800 text-white',
  reviewer: 'bg-purple-100 text-purple-700',
  hr_manager: 'bg-teal-100 text-teal-700',
  it_person: 'bg-emerald-100 text-emerald-700',
  owner: 'bg-sky-100 text-sky-700',
  coordinator: 'bg-cyan-100 text-cyan-700',
  support: 'bg-slate-100 text-slate-700',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function MemberCard({
  member,
  isRoot = false,
  onMemberClick,
}: {
  member: TeamMember;
  isRoot?: boolean;
  onMemberClick?: (member: TeamMember) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = member.children && member.children.length > 0;

  return (
    <div className="relative org-chart-card">
      {/* Card */}
      <div
        onClick={() => onMemberClick?.(member)}
        className={`
          org-chart-card-inner relative bg-white border-2 rounded-xl p-4 cursor-pointer
          transition-all duration-200 hover:shadow-lg hover:border-violet-300 hover:-translate-y-0.5
          ${isRoot ? 'border-violet-400 shadow-md' : 'border-slate-200'}
        `}
        style={{ width: '280px' }}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`
            w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0
            ${getAvatarColor(member.name)}
          `}
          >
            {getInitials(member.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{member.name}</h3>
            </div>
            <p className="text-sm text-slate-500 truncate">{member.role_title ?? '—'}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${roleBadgeVariants[member.role] ?? 'bg-slate-100 text-slate-700'}
              `}
              >
                {member.role.replace(/_/g, ' ')}
              </span>
              {member.location && (
                <span className="flex items-center text-xs text-slate-400">
                  <MapPin className="h-3 w-3 mr-0.5 shrink-0" />
                  <span className="truncate">{member.location}</span>
                </span>
              )}
            </div>
          </div>

          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Direct reports count */}
        {hasChildren && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {member.children!.length} direct report{member.children!.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-4 ml-8 pl-8 border-l-2 border-slate-200 space-y-4 org-chart-children">
          {member.children!.map((child) => (
            <div key={child.id} className="relative">
              {/* Horizontal connector */}
              <div className="absolute -left-8 top-6 w-8 h-0.5 bg-slate-200" />
              {/* Dot connector */}
              <div className="absolute -left-[9px] top-[22px] w-2 h-2 rounded-full bg-slate-300" />
              <MemberCard member={child} onMemberClick={onMemberClick} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgChart({ data, onMemberClick }: OrgChartProps) {
  return (
    <div className="space-y-4">
      {data.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isRoot
          onMemberClick={onMemberClick}
        />
      ))}
    </div>
  );
}
