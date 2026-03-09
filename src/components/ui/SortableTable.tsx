'use client'

import { useState, useMemo, useEffect, useCallback, Fragment } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Group } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  groupable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface SortableTableProps<T> {
  data: T[]
  columns: Column<T>[]
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
  defaultGroupBy?: string
  onRowClick?: (item: T) => void
  rowClassName?: (item: T) => string
  emptyMessage?: string
  tableId?: string
  getRowId?: (item: T) => string
}

const STORAGE_PREFIX = 'table-prefs-'

export function SortableTable<T extends Record<string, unknown>>({
  data,
  columns,
  defaultSort,
  defaultGroupBy,
  onRowClick,
  rowClassName,
  emptyMessage = 'No data found',
  tableId,
  getRowId,
}: SortableTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(defaultSort ?? null)
  const [groupBy, setGroupBy] = useState<string | null>(defaultGroupBy ?? null)

  const storageKey = tableId ? `${STORAGE_PREFIX}${tableId}` : null

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as { sort?: { key: string; direction: 'asc' | 'desc' }; group?: string }
        if (parsed.sort) setSortConfig(parsed.sort)
        if (parsed.group !== undefined) setGroupBy(parsed.group)
      }
    } catch {
      // ignore
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ sort: sortConfig, group: groupBy })
      )
    } catch {
      // ignore
    }
  }, [storageKey, sortConfig, groupBy])

  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      let comparison = 0
      if (typeof aVal === 'string') {
        comparison = (aVal as string).localeCompare(String(bVal))
      } else if (typeof aVal === 'number') {
        comparison = (aVal as number) - Number(bVal)
      } else if (aVal instanceof Date) {
        comparison = (aVal as Date).getTime() - (bVal as Date).getTime()
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const groupedData = useMemo(() => {
    if (!groupBy) return { ungrouped: sortedData }
    return sortedData.reduce(
      (acc, item) => {
        const groupKey = String(item[groupBy] ?? 'Other')
        if (!acc[groupKey]) acc[groupKey] = []
        acc[groupKey].push(item)
        return acc
      },
      {} as Record<string, T[]>
    )
  }, [sortedData, groupBy])

  const handleSort = useCallback(
    (key: string) => {
      setSortConfig((prev) => {
        if (prev?.key === key) {
          if (prev.direction === 'asc') return { key, direction: 'desc' }
          if (prev.direction === 'desc') return null
        }
        return { key, direction: 'asc' }
      })
    },
    []
  )

  const handleHeaderKeyDown = useCallback(
    (e: React.KeyboardEvent, key: string, sortable: boolean) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (sortable) handleSort(key)
      }
    },
    [handleSort]
  )

  const groupableColumns = columns.filter((c) => c.groupable)

  const entries = Object.entries(groupedData)
  const totalRows = data.length

  return (
    <div className="space-y-3">
      {groupableColumns.length > 0 && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Group className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0" />
          <span className="text-slate-500 dark:text-zinc-400">Group by:</span>
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setGroupBy(null)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                !groupBy
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              None
            </button>
            {groupableColumns.map((col) => (
              <button
                type="button"
                key={String(col.key)}
                onClick={() => setGroupBy(String(col.key))}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  groupBy === col.key
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {col.header}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  role={col.sortable ? 'button' : undefined}
                  tabIndex={col.sortable ? 0 : undefined}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 ${
                    col.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 select-none' : ''
                  } ${sortConfig?.key === col.key ? 'text-violet-600 dark:text-violet-400' : ''} ${col.className ?? ''}`}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  onKeyDown={(e) => col.sortable && handleHeaderKeyDown(e, String(col.key), col.sortable)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-slate-400 dark:text-zinc-500 inline-flex">
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([group, items]) => (
              <Fragment key={group}>
                {groupBy && group !== 'ungrouped' && (
                  <tr className="bg-slate-50 dark:bg-zinc-800/50">
                    <td colSpan={columns.length} className="px-4 py-2">
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{group}</span>
                      <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">({items.length})</span>
                    </td>
                  </tr>
                )}
                {items.map((item, idx) => (
                  <tr
                    key={getRowId ? getRowId(item) : (item.id as string) || idx}
                    onClick={() => onRowClick?.(item)}
                    className={`border-b border-slate-100 dark:border-zinc-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${rowClassName?.(item) ?? ''}`}
                  >
                    {columns.map((col) => (
                      <td key={String(col.key)} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                        {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
            {totalRows === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 dark:text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-400 dark:text-zinc-500">
        {totalRows} {totalRows === 1 ? 'result' : 'results'}
        {sortConfig && ` • Sorted by ${columns.find((c) => c.key === sortConfig.key)?.header} (${sortConfig.direction})`}
        {groupBy && ` • Grouped by ${columns.find((c) => c.key === groupBy)?.header}`}
      </div>
    </div>
  )
}
