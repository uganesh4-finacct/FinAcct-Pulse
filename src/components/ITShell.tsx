'use client'

import { createContext, useContext, useState } from 'react'
import SubNav from '@/components/SubNav'
import { getSectionForPath } from '@/lib/nav-config'
import { cn } from '@/lib/utils'

export type ITEntityFilter = 'all' | 'US' | 'India'

const ITEntityContext = createContext<{ entity: ITEntityFilter; setEntity: (e: ITEntityFilter) => void } | null>(null)

export function useITEntity() {
  const ctx = useContext(ITEntityContext)
  return ctx ?? { entity: 'all' as ITEntityFilter, setEntity: () => {} }
}

export function ITShell({ children }: { children: React.ReactNode }) {
  const [entity, setEntity] = useState<ITEntityFilter>('all')

  return (
    <ITEntityContext.Provider value={{ entity, setEntity }}>
      <div className="min-h-screen bg-zinc-50">
        <div className="p-6 max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h1 className="text-xl font-bold text-zinc-900">IT Assets</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Entity:</span>
              {(['all', 'US', 'India'] as const).map(e => (
                <button
                  key={e}
                  onClick={() => setEntity(e)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    entity === e
                      ? e === 'US'
                        ? 'bg-blue-500 text-white'
                        : e === 'India'
                          ? 'bg-violet-500 text-white'
                          : 'bg-zinc-800 text-white'
                      : 'bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-50'
                  )}
                >
                  {e === 'all' ? 'All' : e}
                </button>
              ))}
            </div>
          </div>
          <SubNav />
          {children}
        </div>
      </div>
    </ITEntityContext.Provider>
  )
}
