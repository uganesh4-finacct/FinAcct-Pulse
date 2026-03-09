'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Kanban,
  FileText,
  Building2,
  ClipboardCheck,
  Calendar,
  UserPlus,
  CreditCard,
  TrendingUp,
  Laptop,
  Inbox,
  Settings,
  Receipt,
  PiggyBank,
  FileBarChart,
  ArrowRightLeft,
  Monitor,
  Globe,
  ChevronDown,
  ChevronRight,
  PanelLeft,
} from 'lucide-react';
import { SIDEBAR_NAV } from '@/lib/nav-config';
import { FinAcctPulseLogo } from '@/components/FinAcctPulseLogo';

const MOBILE_BREAKPOINT = 768;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number | string }>> = {
  LayoutDashboard,
  Megaphone,
  Users,
  Kanban,
  FileText,
  Building2,
  ClipboardCheck,
  Calendar,
  UserPlus,
  CreditCard,
  TrendingUp,
  Laptop,
  Inbox,
  Settings,
  Receipt,
  PiggyBank,
  FileBarChart,
  ArrowRightLeft,
  Monitor,
  Globe,
};

function getStored(key: string, defaultVal: boolean): boolean {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v === 'true' : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const path = usePathname();
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null);
  const [userTooltip, setUserTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [role, setRole] = useState('');
  const [moduleAccess, setModuleAccess] = useState<string[] | null>(null);
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({});

  const isAdmin = role === 'admin' || role === 'default';
  const filteredSections = SIDEBAR_NAV.filter((s) => {
    if (s.adminOnly && !isAdmin) return false;
    if (moduleAccess && moduleAccess.length > 0 && s.module && !moduleAccess.includes(s.module)) return false;
    return true;
  });

  const userInitial = userName ? userName.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    SIDEBAR_NAV.forEach((s) => {
      if (s.collapsible) initial[s.storageKey] = getStored(s.storageKey, true);
    });
    setSectionOpen(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role) setRole(data.role);
        if (data?.name) setUserName(data.name);
        if (data?.role_title) setRoleTitle(data.role_title);
        else if (data?.role) setRoleTitle(data.role.charAt(0).toUpperCase() + data.role.slice(1));
        if (data?.permissions?.module_access) setModuleAccess(data.permissions.module_access);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted) return;
    Object.entries(sectionOpen).forEach(([key, val]) => setStored(key, val));
  }, [sectionOpen, mounted]);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleSection = (storageKey: string) => {
    setSectionOpen((prev) => ({ ...prev, [storageKey]: !prev[storageKey] }));
  };

  const isActive = (href: string) => path === href || (href !== '/' && path != null && path.startsWith(href));

  const width = collapsed ? 48 : 187;

  const asideStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '221px',
        maxWidth: '85vw',
        minHeight: '100vh',
        height: '100vh',
        zIndex: 1000,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s ease',
        background: '#09090b',
        borderRight: '1px solid #18181b',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: mobileOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none',
      }
    : {
        width: `${width}px`,
        minWidth: `${width}px`,
        background: '#09090b',
        borderRight: '1px solid #18181b',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease, min-width 0.2s ease',
      };

  return (
    <>
      {isMobile && !mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="fixed top-3 left-3 z-[999] w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 text-white flex items-center justify-center shadow-lg"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}
      {isMobile && mobileOpen && (
        <div
          role="presentation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-[999]"
        />
      )}
      <aside
        style={asideStyle}
        className="sidebar h-screen bg-zinc-950 border-r border-slate-800 flex flex-col"
      >
        {/* Mobile: top bar with close + logo. Desktop: logo (when not collapsed) */}
        {isMobile ? (
          <div className="border-b border-zinc-800 flex items-center justify-between px-3 py-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-2 text-zinc-400 hover:text-white rounded-lg"
            >
              ×
            </button>
            <FinAcctPulseLogo size="md" variant="light" />
            <div className="w-9" />
          </div>
        ) : (
          <div className="border-b border-zinc-800 flex items-center justify-start px-3 py-3 flex-shrink-0 min-h-[52px]">
            <FinAcctPulseLogo
              iconOnly={collapsed}
              size="md"
              variant="light"
            />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-2">
          {filteredSections.map((section, sectionIndex) => {
            const isCollapsible = section.collapsible && !collapsed;
            const isOpen = isCollapsible ? !sectionOpen[section.storageKey] : true;
            const showItems = !isCollapsible || isOpen;

            return (
              <div key={section.storageKey} className={collapsed ? 'py-1' : 'py-1.5'}>
                {collapsed && sectionIndex > 0 && (
                  <div className="h-px bg-zinc-800 mx-2 my-1" />
                )}
                {!collapsed && (
                  <>
                    {isCollapsible ? (
                      <button
                        type="button"
                        onClick={() => toggleSection(section.storageKey)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-colors"
                      >
                        {section.group}
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        {section.group}
                      </div>
                    )}
                  </>
                )}
                <div className="flex flex-col gap-0.5">
                  {(showItems ? section.items : []).map((item) => {
                    const active = isActive(item.href);
                    const IconComponent = ICON_MAP[item.icon] ?? LayoutDashboard;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => isMobile && setMobileOpen(false)}
                        className={`
                          flex items-center gap-3 rounded-lg transition-colors
                          ${collapsed ? 'justify-center p-2 min-h-9 w-9 mx-auto' : 'px-3 py-2 text-sm'}
                          ${active
                            ? 'bg-violet-600/20 text-white border-l-2 border-violet-500'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border-l-2 border-transparent'}
                        `}
                        onMouseEnter={(e) => {
                          if (collapsed) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({ label: item.label, top: rect.top + rect.height / 2 - 12 });
                          }
                        }}
                        onMouseLeave={() => collapsed && setTooltip(null)}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" size={16} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer: User initial + role only */}
        <div className="border-t border-zinc-800 flex-shrink-0">
          {collapsed ? (
            <div className="px-2 py-3 flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                title={roleTitle || 'Account'}
                onMouseEnter={() => setUserTooltip(true)}
                onMouseLeave={() => setUserTooltip(false)}
              >
                {userInitial}
              </div>
            </div>
          ) : (
            <div className="px-3 py-3 flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userInitial}
              </div>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-600/30 text-violet-300 border border-violet-500/30 truncate">
                {roleTitle || 'Member'}
              </span>
            </div>
          )}
        </div>

        {/* Tooltip when collapsed */}
        {collapsed && tooltip && (
          <div
            className="fixed left-14 z-[100] py-1.5 px-2.5 bg-zinc-900 text-white text-xs font-medium rounded-md shadow-xl border border-zinc-700 pointer-events-none"
            style={{ top: tooltip.top, transform: 'translateY(-50%)' }}
          >
            {tooltip.label}
          </div>
        )}
        {collapsed && userTooltip && (
          <div
            className="fixed left-14 bottom-20 z-[100] py-1.5 px-2.5 bg-zinc-900 text-white text-xs font-medium rounded-md shadow-xl border border-zinc-700 pointer-events-none"
          >
            {roleTitle || 'Member'}
          </div>
        )}
      </aside>
    </>
  );
}
