'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/finance-utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Pencil, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

type ClientRow = {
  id: string
  name: string
  vertical: string
  monthly_fee?: number | null
  base_monthly_fee?: number | null
  billing_type?: string | null
  billing_start_date?: string | null
  payment_terms?: number | null
  billing_contact_email?: string | null
  billing_notes?: string | null
  billing_status: 'configured' | 'not_configured'
}

const VERTICALS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'property', label: 'Property Management' },
  { value: 'saas_ites', label: 'SaaS/ITES' },
]

const BILLING_TYPES: { value: string; label: string }[] = [
  { value: 'fixed', label: 'Fixed Monthly - Same amount each month' },
  { value: 'variable', label: 'Variable - Amount varies based on work' },
  { value: 'retainer', label: 'Retainer + Overage - Base retainer plus hourly overage' },
]

const PAYMENT_TERMS: { value: number | null; label: string }[] = [
  { value: 7, label: 'Net 7 (Due in 7 days)' },
  { value: 15, label: 'Net 15 (Due in 15 days)' },
  { value: 30, label: 'Net 30 (Due in 30 days)' },
  { value: null, label: 'Due on Receipt' },
]

function paymentTermsLabel(v: number | null | undefined): string {
  if (v == null || v === 0) return '—'
  const t = PAYMENT_TERMS.find((p) => p.value === v)
  return t ? `Net ${v}` : `Net ${v}`
}

export default function FinanceClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [verticalFilter, setVerticalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchName, setSearchName] = useState('')
  const [editClient, setEditClient] = useState<ClientRow | null>(null)
  const [showQuickSetup, setShowQuickSetup] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [quickSetupRows, setQuickSetupRows] = useState<{ id: string; name: string; monthly_fee: number; billing_type: string }[]>([])
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/finance/clients')
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = clients.filter((c) => {
    if (verticalFilter && c.vertical !== verticalFilter) return false
    if (statusFilter === 'configured' && c.billing_status !== 'configured') return false
    if (statusFilter === 'not_configured' && c.billing_status !== 'not_configured') return false
    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase()
      if (!(c.name ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.billing_status !== b.billing_status) return a.billing_status === 'not_configured' ? -1 : 1
    return (a.name || '').localeCompare(b.name || '')
  })

  const configuredCount = clients.filter((c) => c.billing_status === 'configured').length
  const notConfiguredCount = clients.filter((c) => c.billing_status === 'not_configured').length
  const totalMonthly = clients.filter((c) => c.billing_status === 'configured').reduce((s, c) => s + (Number(c.monthly_fee ?? c.base_monthly_fee) || 0), 0)

  const openEdit = (row: ClientRow) => {
    setEditClient(row)
  }

  const openQuickSetup = () => {
    const unconfigured = clients.filter((c) => c.billing_status === 'not_configured')
    setQuickSetupRows(
      unconfigured.map((c) => ({
        id: c.id,
        name: c.name,
        monthly_fee: Number(c.monthly_fee ?? c.base_monthly_fee) || 0,
        billing_type: (c.billing_type as string) || 'fixed',
      }))
    )
    setShowQuickSetup(true)
  }

  const saveEdit = async (form?: Record<string, unknown>) => {
    if (!editClient) return
    setSaving(true)
    const payload = form ?? {
      base_monthly_fee: editClient.monthly_fee ?? editClient.base_monthly_fee,
      billing_type: (editClient as Record<string, unknown>).billing_type,
      billing_start_date: (editClient as Record<string, unknown>).billing_start_date,
      payment_terms: (editClient as Record<string, unknown>).payment_terms,
      billing_contact_email: (editClient as Record<string, unknown>).billing_contact_email,
      billing_notes: (editClient as Record<string, unknown>).billing_notes,
    }
    await fetch(`/api/finance/clients/${editClient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setEditClient(null)
    load()
  }

  const saveQuickSetup = async () => {
    setSaving(true)
    await fetch('/api/finance/clients/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clients: quickSetupRows.map((r) => ({
          id: r.id,
          base_monthly_fee: r.monthly_fee,
          billing_type: r.billing_type,
          billing_start_date: new Date().toISOString().slice(0, 10),
        })),
      }),
    })
    setSaving(false)
    setShowQuickSetup(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Client Billing Setup</h2>
        <Button variant="primary" onClick={() => setShowAddClient(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {notConfiguredCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {notConfiguredCount} client{notConfiguredCount !== 1 ? 's' : ''} need billing setup
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-300">
              Configure billing to enable invoicing and financial reports
            </p>
          </div>
          <Button variant="secondary" onClick={openQuickSetup}>
            Quick Setup
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">{configuredCount}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Configured Clients</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCurrency(totalMonthly)}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Monthly Revenue</div>
        </Card>
        <Card className={cn('p-4', notConfiguredCount > 0 && 'border-amber-200 dark:border-amber-800')}>
          <div className={cn('text-2xl font-bold', notConfiguredCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-900 dark:text-white')}>
            {notConfiguredCount}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Not Configured</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Search by client name..."
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white min-w-[200px]"
        />
        <select
          value={verticalFilter}
          onChange={(e) => setVerticalFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white"
        >
          {VERTICALS.map((v) => (
            <option key={v.value || 'all'} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white"
        >
          <option value="">All</option>
          <option value="configured">Configured</option>
          <option value="not_configured">Not Configured</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-white">Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-white">Vertical</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-white">Billing Type</th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-white">Monthly Fee</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-white">Payment Terms</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-white">Start Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const fee = row.monthly_fee ?? row.base_monthly_fee
                  return (
                    <tr
                      key={row.id}
                      onClick={() => openEdit(row)}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{row.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="slate">{VERTICALS.find((v) => v.value === row.vertical)?.label ?? row.vertical}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {row.billing_type ? (
                          <Badge
                            variant={
                              row.billing_type === 'fixed' ? 'slate' : row.billing_type === 'variable' ? 'blue' : 'violet'
                            }
                          >
                            {row.billing_type === 'fixed' ? 'Fixed' : row.billing_type === 'variable' ? 'Variable' : 'Retainer'}
                          </Badge>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {fee != null && Number(fee) > 0 ? formatCurrency(fee) : <span className="text-zinc-400">Not Set</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {paymentTermsLabel(row.payment_terms)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {row.billing_start_date ? new Date(row.billing_start_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={row.billing_status === 'configured' ? 'green' : 'amber'}>
                          {row.billing_status === 'configured' ? 'Configured' : 'Not Configured'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editClient && (
        <EditBillingModal
          client={editClient}
          onClose={() => setEditClient(null)}
          onSave={saveEdit}
          saving={saving}
        />
      )}

      {showQuickSetup && (
        <QuickSetupModal
          rows={quickSetupRows}
          setRows={setQuickSetupRows}
          onClose={() => setShowQuickSetup(false)}
          onSave={saveQuickSetup}
          saving={saving}
        />
      )}

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSaved={() => {
            setShowAddClient(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function EditBillingModal({
  client,
  onClose,
  onSave,
  saving,
}: {
  client: ClientRow
  onClose: () => void
  onSave: (form: Record<string, unknown>) => void
  saving: boolean
}) {
  const [form, setForm] = useState<{
    monthly_fee: number
    billing_type: string
    payment_terms: number | null
    billing_start_date: string
    billing_contact_email: string
    billing_notes: string
  }>({
    monthly_fee: client.monthly_fee ?? client.base_monthly_fee ?? 0,
    billing_type: (client.billing_type as string) || 'fixed',
    payment_terms: client.payment_terms ?? 7,
    billing_start_date: client.billing_start_date ? client.billing_start_date.slice(0, 10) : '',
    billing_contact_email: client.billing_contact_email ?? '',
    billing_notes: client.billing_notes ?? '',
  })

  useEffect(() => {
    setForm({
      monthly_fee: client.monthly_fee ?? client.base_monthly_fee ?? 0,
      billing_type: (client.billing_type as string) || 'fixed',
      payment_terms: client.payment_terms ?? 7,
      billing_start_date: client.billing_start_date ? client.billing_start_date.slice(0, 10) : '',
      billing_contact_email: client.billing_contact_email ?? '',
      billing_notes: client.billing_notes ?? '',
    })
  }, [client])

  const feeLabel =
    form.billing_type === 'fixed'
      ? 'Monthly Fee'
      : form.billing_type === 'variable'
        ? 'Estimated Monthly'
        : 'Retainer Amount'

  const handleSave = () => {
    onSave({
      base_monthly_fee: form.monthly_fee,
      billing_type: form.billing_type,
      billing_start_date: form.billing_start_date || null,
      payment_terms: form.payment_terms,
      billing_contact_email: form.billing_contact_email || null,
      billing_notes: form.billing_notes || null,
    })
  }

  return (
    <Modal onClose={onClose} maxWidth="md">
      <ModalHeader title={`Edit Billing: ${client.name}`} onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Billing Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Billing Type</label>
                <select
                  value={form.billing_type}
                  onChange={(e) => setForm((f) => ({ ...f, billing_type: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  {BILLING_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{feeLabel}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.monthly_fee || ''}
                    onChange={(e) => setForm((f) => ({ ...f, monthly_fee: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 pl-7 pr-3 py-2 text-sm text-right"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Payment Terms</label>
                <select
                  value={form.payment_terms ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      payment_terms: e.target.value === '' ? null : parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  {PAYMENT_TERMS.map((p) => (
                    <option key={String(p.value)} value={p.value ?? ''}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Billing Start Date</label>
                <input
                  type="date"
                  value={form.billing_start_date}
                  onChange={(e) => setForm((f) => ({ ...f, billing_start_date: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Contact (optional)</h3>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Billing Contact Email</label>
              <input
                type="email"
                value={form.billing_contact_email}
                onChange={(e) => setForm((f) => ({ ...f, billing_contact_email: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                placeholder="For invoice delivery"
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Notes</h3>
            <textarea
              value={form.billing_notes}
              onChange={(e) => setForm((f) => ({ ...f, billing_notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              placeholder="Special billing instructions"
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

function QuickSetupModal({
  rows,
  setRows,
  onClose,
  onSave,
  saving,
}: {
  rows: { id: string; name: string; monthly_fee: number; billing_type: string }[]
  setRows: React.Dispatch<React.SetStateAction<{ id: string; name: string; monthly_fee: number; billing_type: string }[]>>
  onClose: () => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <Modal onClose={onClose} maxWidth="lg">
      <ModalHeader title="Quick Setup" onClose={onClose} />
      <ModalBody>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Set monthly fee and billing type for each client. Start date will be set to today.
        </p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-center gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <div className="flex-1 font-medium text-zinc-900 dark:text-white min-w-0 truncate">{r.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={r.monthly_fee || ''}
                  onChange={(e) =>
                    setRows((prev) => {
                      const next = [...prev]
                      next[i] = { ...next[i], monthly_fee: parseFloat(e.target.value) || 0 }
                      return next
                    })
                  }
                  className="w-28 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <select
                value={r.billing_type}
                onChange={(e) =>
                  setRows((prev) => {
                    const next = [...prev]
                    next[i] = { ...next[i], billing_type: e.target.value }
                    return next
                  })
                }
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm w-36"
              >
                <option value="fixed">Fixed</option>
                <option value="variable">Variable</option>
                <option value="retainer">Retainer</option>
              </select>
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

function AddClientModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<{
    name: string
    vertical: string
    monthly_fee: number
    billing_type: string
    payment_terms: number | null
    billing_start_date: string
    billing_contact_email: string
    billing_notes: string
  }>({
    name: '',
    vertical: 'restaurant',
    monthly_fee: 0,
    billing_type: 'fixed',
    payment_terms: 7,
    billing_start_date: new Date().toISOString().slice(0, 10),
    billing_contact_email: '',
    billing_notes: '',
  })

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Client name is required')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          vertical: form.vertical,
          monthly_fee: form.monthly_fee,
          india_tp_transfer: Math.round(form.monthly_fee * 0.9 * 100) / 100,
          billing_type: form.billing_type,
          payment_terms: form.payment_terms || null,
          billing_start_date: form.billing_start_date || null,
          billing_contact_email: form.billing_contact_email || null,
          billing_notes: form.billing_notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create client')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="md">
      <ModalHeader title="Add Client" onClose={onClose} />
      <ModalBody>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Client Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Vertical *</label>
            <select
              value={form.vertical}
              onChange={(e) => setForm((f) => ({ ...f, vertical: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              {VERTICALS.filter((v) => v.value).map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Monthly Fee *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.monthly_fee || ''}
                onChange={(e) => setForm((f) => ({ ...f, monthly_fee: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 pl-7 pr-3 py-2 text-sm text-right"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Billing Type</label>
            <select
              value={form.billing_type}
              onChange={(e) => setForm((f) => ({ ...f, billing_type: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              {BILLING_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Payment Terms</label>
            <select
              value={form.payment_terms ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  payment_terms: e.target.value === '' ? null : parseInt(e.target.value, 10),
                }))
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              {PAYMENT_TERMS.map((p) => (
                <option key={String(p.value)} value={p.value ?? ''}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Billing Start Date</label>
            <input
              type="date"
              value={form.billing_start_date}
              onChange={(e) => setForm((f) => ({ ...f, billing_start_date: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Billing Contact Email (optional)</label>
            <input
              type="email"
              value={form.billing_contact_email}
              onChange={(e) => setForm((f) => ({ ...f, billing_contact_email: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              placeholder="For invoice delivery"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Billing Notes (optional)</label>
            <textarea
              value={form.billing_notes}
              onChange={(e) => setForm((f) => ({ ...f, billing_notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              placeholder="Special billing instructions"
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Creating...' : 'Create Client'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
