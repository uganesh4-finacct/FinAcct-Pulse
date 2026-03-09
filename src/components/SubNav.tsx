'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSectionForPath } from '@/lib/nav-config';
import { cn } from '@/lib/utils';

export default function SubNav() {
  const pathname = usePathname()
  const section = getSectionForPath(pathname ?? '')
  if (!section || section.items.length === 0) return null

  const normalizedPath = (pathname ?? '').replace(/\/$/, '') || '/'

  // Only the most specific (longest) matching href should be active
  const activeHref = section.items
    .filter((item) => {
      const h = item.href.replace(/\/$/, '') || '/'
      return normalizedPath === h || normalizedPath.startsWith(h + '/')
    })
    .sort((a, b) => (b.href.length - a.href.length))[0]?.href

  return (
    <nav className="flex flex-wrap items-center gap-2 mb-6" aria-label="Section sub-navigation">
      {section.items.map((item) => {
        const isActive = activeHref === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
