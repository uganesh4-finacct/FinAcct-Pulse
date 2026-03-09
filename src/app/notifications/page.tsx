'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, ExternalLink, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const router = useRouter()

  const limit = 50

  useEffect(() => {
    setOffset(0)
    fetchNotifications(0, true)
  }, [filter, category])

  async function fetchNotifications(off = 0, replace = false) {
    if (replace) setLoading(true)
    else setLoadingMore(true)
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('read', filter === 'read' ? 'true' : 'false')
    if (category !== 'all') params.set('category', category)
    params.set('limit', String(limit))
    params.set('offset', String(off))
    const res = await fetch(`/api/notifications?${params}`)
    const data = await res.json()
    const list = data.notifications || []
    if (replace) {
      setNotifications(list)
      setOffset(list.length)
    } else {
      setNotifications((prev) => [...prev, ...list])
      setOffset((o) => o + list.length)
    }
    setHasMore(data.hasMore === true)
    setLoading(false)
    setLoadingMore(false)
  }

  function loadMore() {
    fetchNotifications(offset, false)
  }

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    fetchNotifications(0, true)
  }

  async function deleteNotification(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    fetchNotifications(0, true)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Notifications</h1>
        <Button variant="secondary" onClick={() => router.push('/settings/notifications')}>
          Notification Settings
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          <option value="operations">Operations</option>
          <option value="finance">Finance</option>
          <option value="hr">HR</option>
          <option value="it">IT</option>
          <option value="system">System</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-zinc-400">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!n.read) markAsRead(n.id)
                  if (n.link_url) router.push(n.link_url)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!n.read) markAsRead(n.id)
                    if (n.link_url) router.push(n.link_url)
                  }
                }}
                className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${!n.read ? 'bg-violet-50/30 dark:bg-violet-950/20' : ''}`}
              >
                <div
                  className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                    n.read ? 'bg-slate-200 dark:bg-zinc-600' : 'bg-violet-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {n.link_url && (
                        <button
                          type="button"
                          onClick={() => router.push(n.link_url)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg"
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4 text-slate-400" />
                        </button>
                      )}
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(n.id)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4 text-slate-400" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(n.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          {hasMore && !loading && (
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 text-center">
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
      </Card>
    </div>
  )
}
