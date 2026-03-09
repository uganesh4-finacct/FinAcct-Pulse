'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type NotifType = { id: string; code: string; name: string; category: string; default_email: boolean; default_in_app: boolean }
type Prefs = Record<string, { email_enabled: boolean; in_app_enabled: boolean }>

const CATEGORY_LABELS: Record<string, string> = {
  operations: 'Operations',
  finance: 'Finance',
  hr: 'HR',
  it: 'IT',
  system: 'System',
}

export default function NotificationSettingsPage() {
  const [types, setTypes] = useState<NotifType[]>([])
  const [preferences, setPreferences] = useState<Prefs>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    fetch('/api/settings/notification-preferences')
      .then((r) => r.json())
      .then((data) => {
        setTypes(data.types ?? [])
        setPreferences(data.preferences ?? {})
      })
      .finally(() => setLoading(false))
  }, [])

  const getPref = (typeId: string, key: 'email_enabled' | 'in_app_enabled', defaultVal: boolean) => {
    const p = preferences[typeId]
    if (!p) return defaultVal
    return p[key]
  }

  const setPref = (typeId: string, key: 'email_enabled' | 'in_app_enabled', value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        [key]: value,
      },
    }))
  }

  const save = async () => {
    setSaving(true)
    setSavedMessage(false)
    const prefsPayload = types.map((t) => ({
      type_id: t.id,
      email_enabled: getPref(t.id, 'email_enabled', t.default_email),
      in_app_enabled: getPref(t.id, 'in_app_enabled', t.default_in_app),
    }))
    const res = await fetch('/api/settings/notification-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: prefsPayload }),
    })
    setSaving(false)
    if (res.ok) {
      setSavedMessage(true)
      setTimeout(() => setSavedMessage(false), 3000)
    }
  }

  const byCategory = types.reduce<Record<string, NotifType[]>>((acc, t) => {
    const cat = t.category || 'system'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})
  const categoryOrder = ['operations', 'finance', 'hr', 'it', 'system']

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-violet-500" />
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Notification Settings
        </h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
        Choose how you receive each type of notification: in-app and/or by email.
      </p>

      <Card className="p-6">
        <div className="space-y-8">
          {categoryOrder.map(
            (cat) =>
              byCategory[cat]?.length > 0 && (
                <div key={cat}>
                  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h2>
                  <div className="space-y-4">
                    {byCategory[cat].map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-zinc-800 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{t.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.code}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={getPref(t.id, 'in_app_enabled', t.default_in_app)}
                              onChange={(e) => setPref(t.id, 'in_app_enabled', e.target.checked)}
                              className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">In-app</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={getPref(t.id, 'email_enabled', t.default_email)}
                              onChange={(e) => setPref(t.id, 'email_enabled', e.target.checked)}
                              className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Email</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-700 flex items-center gap-4">
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save preferences'}
          </Button>
          {savedMessage && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Preferences saved.</span>
          )}
        </div>
      </Card>
    </div>
  )
}
