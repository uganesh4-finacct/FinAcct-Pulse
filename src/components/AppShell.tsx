'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { NotificationBell } from '@/components/NotificationBell'
import { UserMenu } from '@/components/UserMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PanelLeft, PanelLeftClose } from 'lucide-react'

const SIDEBAR_STORAGE_KEY = 'sidebar_collapsed'

function getStored(key: string, defaultVal: boolean): boolean {
  if (typeof window === 'undefined') return defaultVal
  try {
    const v = localStorage.getItem(key)
    return v !== null ? v === 'true' : defaultVal
  } catch {
    return defaultVal
  }
}

function setStored(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value))
  } catch {}
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSidebarCollapsed(getStored(SIDEBAR_STORAGE_KEY, false))
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    setStored(SIDEBAR_STORAGE_KEY, sidebarCollapsed)
  }, [sidebarCollapsed, mounted])

  const toggleSidebar = () => setSidebarCollapsed((c) => !c)

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-3 pl-3 pr-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-start">
            <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>
              <ThemeToggle />
            </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main
          className="main-content flex-1 overflow-y-auto min-h-0"
          style={{ background: 'var(--bg-subtle)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
