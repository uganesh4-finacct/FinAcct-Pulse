'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Wallet,
  GraduationCap,
  Cpu,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

type KPIs = {
  totalClients: number;
  monthlyRevenue: number;
  openHiringRoles: number;
  overdueSteps: number;
  teamMembers: number;
  pendingApprovals: number;
};

type AttentionItem = {
  id: string;
  title: string;
  description: string;
  daysOverdue?: number;
  href: string;
  type: 'invoice' | 'hiring' | 'client' | 'approval';
};

type DeptSummary = {
  operations: { clientsAtRisk: number; booksClosedThisMonth: number };
  hr: { openRoles: number; candidatesInPipeline: number };
  finance: { arOutstanding: number; cashPositionIndicator: string };
  it: { pendingRequests: number };
};

type ActivityItem = {
  id: string;
  user: string;
  action: string;
  timestamp: string;
};

type DashboardData = {
  kpis: KPIs;
  attentionItems: AttentionItem[];
  departmentSummary: DeptSummary;
  recentActivity: ActivityItem[];
};

const KPI_CARDS: Array<{ key: keyof KPIs; label: string; icon: React.ComponentType<{ className?: string }>; href: string; format?: (v: number) => string }> = [
  { key: 'totalClients', label: 'Total Clients', icon: Building2, href: '/clients' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: DollarSign, href: '/billing', format: (v) => `$${Number(v).toLocaleString()}` },
  { key: 'openHiringRoles', label: 'Open Hiring Roles', icon: Briefcase, href: '/hr' },
  { key: 'overdueSteps', label: 'Overdue Steps', icon: AlertTriangle, href: '/close-tracker' },
  { key: 'teamMembers', label: 'Team Members', icon: Users, href: '/team' },
  { key: 'pendingApprovals', label: 'Pending Approvals', icon: ClipboardCheck, href: '/escalations' },
];

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/executive-dashboard')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 dark:text-zinc-400">Loading dashboard...</div>
      </div>
    );
  }

  const kpis = data?.kpis ?? {
    totalClients: 0,
    monthlyRevenue: 0,
    openHiringRoles: 0,
    overdueSteps: 0,
    teamMembers: 0,
    pendingApprovals: 0,
  };
  const attentionItems = data?.attentionItems ?? [];
  const departmentSummary = data?.departmentSummary ?? {
    operations: { clientsAtRisk: 0, booksClosedThisMonth: 0 },
    hr: { openRoles: 0, candidatesInPipeline: 0 },
    finance: { arOutstanding: 0, cashPositionIndicator: 'neutral' },
    it: { pendingRequests: 0 },
  };
  const recentActivity = data?.recentActivity ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{dateStr}</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Top KPI row — 6 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {KPI_CARDS.map(({ key, label, icon: Icon, href, format }) => (
            <Link key={key} href={href} className="group">
              <Card className="h-full border-zinc-200 dark:border-zinc-800 group-hover:border-violet-300 dark:group-hover:border-violet-700 transition-colors">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                        {format ? format(kpis[key]) : kpis[key]}
                      </p>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{label}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CEO Attention Board + Department Summary + Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: CEO Attention Board + Department Summary */}
          <div className="xl:col-span-2 space-y-6">
            {/* CEO Attention Board */}
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  CEO Attention Board
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attentionItems.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
                    No items needing immediate attention.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {attentionItems.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
                              {item.title}
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.daysOverdue != null && (
                              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                {item.daysOverdue}d overdue
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                              Action
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Department Summary — 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-violet-500" />
                    Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Clients at risk</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {departmentSummary.operations.clientsAtRisk}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Books closed this month</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {departmentSummary.operations.booksClosedThisMonth}
                    </span>
                  </div>
                  <Link
                    href="/close-tracker"
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 mt-2"
                  >
                    View close tracker
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-violet-500" />
                    HR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Open roles</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {departmentSummary.hr.openRoles}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Candidates in pipeline</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {departmentSummary.hr.candidatesInPipeline}
                    </span>
                  </div>
                  <Link
                    href="/hr"
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 mt-2"
                  >
                    View HR dashboard
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-violet-500" />
                    Finance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">AR outstanding</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      ${Number(departmentSummary.finance.arOutstanding).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Cash position</span>
                    <span
                      className={cn(
                        'font-semibold',
                        departmentSummary.finance.cashPositionIndicator === 'positive'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-600 dark:text-zinc-400'
                      )}
                    >
                      {departmentSummary.finance.cashPositionIndicator === 'positive' ? 'Positive' : 'Neutral'}
                    </span>
                  </div>
                  <Link
                    href="/billing"
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 mt-2"
                  >
                    View billing
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-violet-500" />
                    IT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Pending requests</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {departmentSummary.it.pendingRequests}
                    </span>
                  </div>
                  <Link
                    href="/it-assets"
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 mt-2"
                  >
                    View IT assets
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Recent Activity */}
          <div className="xl:col-span-1">
            <Card className="border-zinc-200 dark:border-zinc-800 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
                    No recent activity.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recentActivity.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-col gap-0.5 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                      >
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {item.action}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.user} · {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
