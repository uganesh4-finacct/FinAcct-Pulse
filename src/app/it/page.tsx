'use client'

import { useState, useEffect } from 'react'
import { Laptop, Monitor, AlertTriangle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

type DashboardData = {
  stats: {
    active_hardware: number
    spare_equipment: number
    in_repair: number
    warranty_expiring_soon: number
    active_domains: number
    domains_expiring_soon: number
    ssl_expiring_soon: number
    us_laptops: number
    us_monitors: number
    us_other: number
    india_laptops: number
    india_monitors: number
    india_other: number
  }
  alerts: {
    warranty_expiring: Array<{ id: string; name?: string; asset_tag?: string; warranty_expiry: string }>
    domains_expiring: Array<{ id: string; domain: string; expiry_date: string }>
    ssl_expiring: Array<{ id: string; domain: string; ssl_expiry_date: string }>
  }
}

export default function ITDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/it/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="text-zinc-500 py-12 text-center">Loading...</div>
  }

  const s = data.stats

  return (
    <div className="space-y-8">
      {/* Row 1: 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 border-t-4 border-t-violet-500 p-4">
          <div className="text-2xl font-bold text-zinc-900">{s.active_hardware ?? 0}</div>
          <div className="text-sm text-zinc-500">Active Hardware</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 border-t-4 border-t-blue-500 p-4">
          <div className="text-2xl font-bold text-zinc-900">{s.spare_equipment ?? 0}</div>
          <div className="text-sm text-zinc-500">Spare Equipment</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 border-t-4 border-t-amber-500 p-4">
          <div className="text-2xl font-bold text-zinc-900">{s.in_repair ?? 0}</div>
          <div className="text-sm text-zinc-500">In Repair</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 border-t-4 border-t-amber-400 p-4">
          <div className="text-2xl font-bold text-zinc-900">{s.warranty_expiring_soon ?? 0}</div>
          <div className="text-sm text-zinc-500">Warranty Expiring Soon</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 border-t-4 border-t-emerald-500 p-4">
          <div className="text-2xl font-bold text-zinc-900">{s.active_domains ?? 0}</div>
          <div className="text-sm text-zinc-500">Active Domains</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 border-t-4 border-t-orange-500 p-4">
          <div className="text-2xl font-bold text-zinc-900">{s.domains_expiring_soon ?? 0}</div>
          <div className="text-sm text-zinc-500">Domains Expiring Soon</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 border-t-4 border-t-red-500 p-4">
          <div className="text-2xl font-bold text-zinc-900">{s.ssl_expiring_soon ?? 0}</div>
          <div className="text-sm text-zinc-500">SSL Expiring Soon</div>
        </div>
      </div>

      {/* Quick Stats by Entity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">US Entity</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Laptop className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-xl font-bold text-zinc-900">{s.us_laptops ?? 0}</div>
                <div className="text-xs text-zinc-500">Laptops</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-xl font-bold text-zinc-900">{s.us_monitors ?? 0}</div>
                <div className="text-xs text-zinc-500">Monitors</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-xl font-bold text-zinc-900">{s.us_other ?? 0}</div>
                <div className="text-xs text-zinc-500">Other</div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-4">India Entity</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Laptop className="w-8 h-8 text-violet-500" />
              <div>
                <div className="text-xl font-bold text-zinc-900">{s.india_laptops ?? 0}</div>
                <div className="text-xs text-zinc-500">Laptops</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-violet-500" />
              <div>
                <div className="text-xl font-bold text-zinc-900">{s.india_monitors ?? 0}</div>
                <div className="text-xs text-zinc-500">Monitors</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-violet-500" />
              <div>
                <div className="text-xl font-bold text-zinc-900">{s.india_other ?? 0}</div>
                <div className="text-xs text-zinc-500">Other</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide mb-4">Alerts</h2>
        <div className="space-y-4">
          {data.alerts.warranty_expiring?.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-amber-700 mb-2">Hardware warranty expiring (within 30 days)</h3>
              <ul className="space-y-1">
                {data.alerts.warranty_expiring.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {item.name || item.asset_tag || item.id} — Warranty: {item.warranty_expiry}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.alerts.domains_expiring?.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-orange-700 mb-2">Domains expiring soon</h3>
              <ul className="space-y-1">
                {data.alerts.domains_expiring.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm text-orange-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {item.domain} — Expiry: {item.expiry_date}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.alerts.ssl_expiring?.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-red-700 mb-2">SSL certificates expiring</h3>
              <ul className="space-y-1">
                {data.alerts.ssl_expiring.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm text-red-800">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {item.domain} — SSL expiry: {item.ssl_expiry_date}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(!data.alerts.warranty_expiring?.length && !data.alerts.domains_expiring?.length && !data.alerts.ssl_expiring?.length) && (
            <p className="text-zinc-500 text-sm">No alerts.</p>
          )}
        </div>
      </div>
    </div>
  )
}
