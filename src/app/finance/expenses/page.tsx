'use client'

import { useState, useEffect } from 'react'
import { MonthPicker, currentMonth } from '@/components/MonthPicker'
import { formatCurrency } from '@/lib/finance-utils'
import { Button } from '@/components/ui/Button'
import { SortableTable } from '@/components/ui/SortableTable'
import { X, Pencil, Pause, Play, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type RecurringItem = {
  id: string
  name: string
  description?: string | null
  category_id?: string | null
  entity: string
  amount: number
  currency: string
  frequency: string
  day_of_month?: number | null
  vendor_name?: string | null
  start_date: string
  end_date?: string | null
  active: boolean
  finance_expense_categories?: { id: string; name: string } | null
}

const defaultRecurringForm = (): {
  name: string
  description: string
  category_id: string | undefined
  entity: 'US' | 'India'
  amount: number
  currency: 'USD' | 'INR'
  frequency: 'Monthly' | 'Quarterly' | 'Annual'
  day_of_month: number
  vendor_name: string
  start_date: string
  end_date: string | undefined
  active: boolean
} => ({
  name: '',
  description: '',
  category_id: '' as string | undefined,
  entity: 'US',
  amount: 0,
  currency: 'USD',
  frequency: 'Monthly',
  day_of_month: 1,
  vendor_name: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '' as string | undefined,
  active: true,
})

export default function FinanceExpensesPage() {
  const [month, setMonth] = useState(currentMonth())
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [recurringPanelOpen, setRecurringPanelOpen] = useState(false)
  const [recurringList, setRecurringList] = useState<RecurringItem[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [recurringModalOpen, setRecurringModalOpen] = useState(false)
  const [editRecurring, setEditRecurring] = useState<RecurringItem | null>(null)
  const [recurringForm, setRecurringForm] = useState<ReturnType<typeof defaultRecurringForm>>(defaultRecurringForm())
  const [recurringSaving, setRecurringSaving] = useState(false)
  const [recurringLoading, setRecurringLoading] = useState(false)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [addExpenseForm, setAddExpenseForm] = useState({
    name: '',
    description: '',
    category_id: '',
    entity: 'US' as 'US' | 'India',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    notes: '',
  })
  const [addExpenseSaving, setAddExpenseSaving] = useState(false)
  const [generateExpensesLoading, setGenerateExpensesLoading] = useState(false)

  const loadRecurring = () => {
    setRecurringLoading(true)
    fetch('/api/finance/recurring-expenses')
      .then(r => r.json())
      .then(data => setRecurringList(Array.isArray(data) ? data : []))
      .finally(() => setRecurringLoading(false))
  }

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('month', month)
    if (entityFilter) params.set('entity', entityFilter)
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/finance/expenses?${params}`)
      .then(r => r.json())
      .then(data => setExpenses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [month, entityFilter, statusFilter])

  useEffect(() => {
    fetch('/api/finance/categories').then(r => r.json()).then(data => setCategories(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    if (recurringPanelOpen) loadRecurring()
  }, [recurringPanelOpen])

  const openAddRecurring = () => {
    setEditRecurring(null)
    setRecurringForm(defaultRecurringForm())
    setRecurringModalOpen(true)
  }

  const openEditRecurring = (r: RecurringItem) => {
    setEditRecurring(r)
    setRecurringForm({
      name: r.name,
      description: r.description ?? '',
      category_id: r.category_id ?? '',
      entity: r.entity as 'US' | 'India',
      amount: r.amount,
      currency: r.currency as 'USD' | 'INR',
      frequency: r.frequency as 'Monthly' | 'Quarterly' | 'Annual',
      day_of_month: r.day_of_month ?? 1,
      vendor_name: r.vendor_name ?? '',
      start_date: r.start_date ? r.start_date.slice(0, 10) : new Date().toISOString().split('T')[0],
      end_date: r.end_date ? r.end_date.slice(0, 10) : '',
      active: r.active,
    })
    setRecurringModalOpen(true)
  }

  const saveRecurring = async () => {
    if (!recurringForm.name?.trim() || recurringForm.amount == null) return
    setRecurringSaving(true)
    try {
      const payload = {
        ...recurringForm,
        category_id: recurringForm.category_id || null,
        day_of_month: recurringForm.day_of_month != null ? Math.min(28, Math.max(1, recurringForm.day_of_month)) : null,
        end_date: recurringForm.end_date || null,
      }
      if (editRecurring) {
        const res = await fetch(`/api/finance/recurring-expenses/${editRecurring.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error)
        setEditRecurring(null)
      } else {
        const res = await fetch('/api/finance/recurring-expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error((await res.json()).error)
      }
      setRecurringForm(defaultRecurringForm())
      setRecurringModalOpen(false)
      loadRecurring()
    } catch (e) {
      alert(String(e))
    } finally {
      setRecurringSaving(false)
    }
  }

  const toggleRecurring = async (id: string) => {
    const res = await fetch(`/api/finance/recurring-expenses/${id}/toggle`, { method: 'POST' })
    if (res.ok) loadRecurring()
  }

  const deleteRecurring = async (id: string) => {
    if (!confirm('Delete this recurring expense?')) return
    const res = await fetch(`/api/finance/recurring-expenses/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEditRecurring(null)
      setRecurringModalOpen(false)
      loadRecurring()
    }
  }

  const handleGenerateThisMonth = async () => {
    setGenerateExpensesLoading(true)
    try {
      const r = await fetch('/api/finance/expenses/generate', { method: 'POST' })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        alert(data.error || 'Failed to generate')
        return
      }
      alert(`Generated ${data.generated ?? 0} expense(s) for this month.`)
      fetch(`/api/finance/expenses?month=${month}`).then(r => r.json()).then(data => setExpenses(Array.isArray(data) ? data : []))
    } finally {
      setGenerateExpensesLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!addExpenseForm.name?.trim() || addExpenseForm.amount == null) {
      alert('Name and amount are required')
      return
    }
    setAddExpenseSaving(true)
    try {
      const r = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addExpenseForm.name.trim(),
          description: addExpenseForm.description || null,
          category_id: addExpenseForm.category_id || null,
          entity: addExpenseForm.entity,
          amount: addExpenseForm.amount,
          expense_date: addExpenseForm.expense_date,
          vendor_name: addExpenseForm.vendor_name || null,
          notes: addExpenseForm.notes || null,
        }),
      })
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        alert(e.error || 'Failed to add expense')
        return
      }
      setAddExpenseOpen(false)
      setAddExpenseForm({ name: '', description: '', category_id: '', entity: 'US', amount: 0, expense_date: new Date().toISOString().split('T')[0], vendor_name: '', notes: '' })
      fetch(`/api/finance/expenses?month=${month}`).then(r => r.json()).then(data => setExpenses(Array.isArray(data) ? data : []))
    } finally {
      setAddExpenseSaving(false)
    }
  }

  const expenseList = Array.isArray(expenses) ? expenses : []
  const pendingCount = expenseList.filter(e => e.status === 'pending').length
  const usTotal = expenseList.filter(e => e.entity === 'US').reduce((s, e) => s + (e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)), 0)
  const indiaTotal = expenseList.filter(e => e.entity === 'India').reduce((s, e) => s + (e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)), 0)
  const mtd = expenseList.reduce((s, e) => s + (e.currency === 'USD' ? Number(e.amount) : Number(e.amount_usd || 0)), 0)

  if (loading) return <div className="text-zinc-500 py-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-zinc-900">Expenses</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={() => setAddExpenseOpen(true)}>+ Add Expense</Button>
          <Button size="sm" variant="secondary" onClick={() => setRecurringPanelOpen(true)}>Manage Recurring</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4"><div className="text-xl font-bold text-zinc-900">{formatCurrency(mtd)}</div><div className="text-sm text-zinc-500">Expenses MTD</div></div>
        <div className="bg-white rounded-xl border border-amber-200 p-4"><div className="text-xl font-bold text-amber-700">{pendingCount}</div><div className="text-sm text-zinc-500">Pending Confirmation</div></div>
        <div className="bg-white rounded-xl border border-blue-200 p-4"><div className="text-xl font-bold text-zinc-900">{formatCurrency(usTotal)}</div><div className="text-sm text-zinc-500">US Entity</div></div>
        <div className="bg-white rounded-xl border border-violet-200 p-4"><div className="text-xl font-bold text-zinc-900">{formatCurrency(indiaTotal)}</div><div className="text-sm text-zinc-500">India Entity</div></div>
      </div>
      <div className="flex flex-wrap gap-3">
        <MonthPicker value={month} onChange={setMonth} />
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm min-w-[120px] max-w-[160px]"><option value="">All entities</option><option value="US">US</option><option value="India">India</option></select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm min-w-[120px] max-w-[160px]"><option value="">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="paid">Paid</option></select>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <SortableTable
          tableId="finance-expenses"
          data={expenseList.map((e: any) => ({ ...e, category_name: e.finance_expense_categories?.name ?? '' }))}
          columns={[
            { key: 'expense_date', header: 'Date', sortable: true, render: (e: any) => e.expense_date ? new Date(e.expense_date).toLocaleDateString() : '—' },
            { key: 'name', header: 'Name', sortable: true, render: (e: any) => <span className="font-medium">{e.name}</span> },
            { key: 'category_name', header: 'Category', sortable: true, groupable: true, render: (e: any) => e.category_name || '—' },
            { key: 'entity', header: 'Entity', sortable: true, groupable: true, render: (e: any) => <span className={e.entity === 'US' ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400'}>{e.entity}</span> },
            { key: 'amount', header: 'Amount', sortable: true, className: 'text-right', render: (e: any) => <span className="font-mono">{e.currency === 'INR' ? `₹${Number(e.amount).toLocaleString()}` : formatCurrency(e.amount)}</span> },
            { key: 'status', header: 'Status', sortable: true, groupable: true, render: (e: any) => <span className={e.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-600 dark:text-zinc-400'}>{e.status}</span> },
          ]}
          defaultSort={{ key: 'expense_date', direction: 'desc' }}
          emptyMessage="No expenses this month."
          getRowId={(e: any) => e.id}
        />
      </div>

      {/* Recurring slide-over */}
      {recurringPanelOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setRecurringPanelOpen(false)} aria-hidden />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white border-l border-zinc-200 shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900">Recurring Expenses</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleGenerateThisMonth} disabled={generateExpensesLoading}>
                  {generateExpensesLoading ? 'Generating...' : 'Generate This Month'}
                </Button>
                <Button size="sm" variant="primary" onClick={openAddRecurring}>
                  <Plus className="h-4 w-4 mr-1" /> Add Recurring
                </Button>
                <button type="button" onClick={() => setRecurringPanelOpen(false)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {recurringLoading ? (
                <p className="text-zinc-500 text-sm">Loading...</p>
              ) : recurringList.length === 0 ? (
                <p className="text-zinc-500 text-sm">No recurring expenses. Click &quot;Add Recurring&quot; to create one.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left">
                      <th className="pb-2 font-semibold">Name</th>
                      <th className="pb-2 font-semibold">Category</th>
                      <th className="pb-2 font-semibold">Vendor</th>
                      <th className="pb-2 font-semibold">Entity</th>
                      <th className="pb-2 font-semibold text-right">Amount</th>
                      <th className="pb-2 font-semibold">Freq</th>
                      <th className="pb-2 font-semibold">Day</th>
                      <th className="pb-2 font-semibold">Status</th>
                      <th className="pb-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringList.map(r => (
                      <tr key={r.id} className="border-b border-zinc-100">
                        <td className="py-2 font-medium">{r.name}</td>
                        <td className="py-2">{r.finance_expense_categories?.name ?? '—'}</td>
                        <td className="py-2">{r.vendor_name ?? '—'}</td>
                        <td className="py-2"><span className={r.entity === 'US' ? 'text-blue-600' : 'text-violet-600'}>{r.entity}</span></td>
                        <td className="py-2 text-right">{r.currency === 'INR' ? `₹${Number(r.amount).toLocaleString()}` : formatCurrency(r.amount)}</td>
                        <td className="py-2">{r.frequency}</td>
                        <td className="py-2">{r.day_of_month ?? '—'}</td>
                        <td className="py-2">
                          <span className={r.active ? 'text-emerald-600' : 'text-amber-600'}>{r.active ? 'Active' : 'Paused'}</span>
                        </td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <button type="button" onClick={() => openEditRecurring(r)} className="p-1 rounded hover:bg-zinc-100 text-zinc-600" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => toggleRecurring(r.id)} className="p-1 rounded hover:bg-zinc-100 text-zinc-600" title={r.active ? 'Pause' : 'Resume'}>{r.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
                            <button type="button" onClick={() => deleteRecurring(r.id)} className="p-1 rounded hover:bg-red-50 text-red-600" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Recurring modal */}
      {recurringModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => { setRecurringModalOpen(false); setEditRecurring(null) }} aria-hidden />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h3 className="text-lg font-semibold text-zinc-900">{editRecurring ? 'Edit Recurring Expense' : 'Add Recurring Expense'}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
                  <input type="text" value={recurringForm.name} onChange={e => setRecurringForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g. AWS Monthly" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                  <input type="text" value={recurringForm.description} onChange={e => setRecurringForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                  <select value={recurringForm.category_id} onChange={e => setRecurringForm(f => ({ ...f, category_id: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                    <option value="">— Select —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Entity</label>
                  <select value={recurringForm.entity} onChange={e => setRecurringForm(f => ({ ...f, entity: e.target.value as 'US' | 'India' }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                    <option value="US">US</option>
                    <option value="India">India</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Amount *</label>
                    <input type="number" step="0.01" min={0} value={recurringForm.amount || ''} onChange={e => setRecurringForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Currency</label>
                    <select value={recurringForm.currency} onChange={e => setRecurringForm(f => ({ ...f, currency: e.target.value as 'USD' | 'INR' }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Frequency</label>
                    <select value={recurringForm.frequency} onChange={e => setRecurringForm(f => ({ ...f, frequency: e.target.value as 'Monthly' | 'Quarterly' | 'Annual' }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Day of month (1–28)</label>
                    <input type="number" min={1} max={28} value={recurringForm.day_of_month ?? ''} onChange={e => setRecurringForm(f => ({ ...f, day_of_month: parseInt(e.target.value, 10) || 1 }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Vendor name</label>
                  <input type="text" value={recurringForm.vendor_name} onChange={e => setRecurringForm(f => ({ ...f, vendor_name: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Optional" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Start date</label>
                    <input type="date" value={recurringForm.start_date} onChange={e => setRecurringForm(f => ({ ...f, start_date: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">End date (optional)</label>
                    <input type="date" value={recurringForm.end_date || ''} onChange={e => setRecurringForm(f => ({ ...f, end_date: e.target.value || undefined }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="recurring-active" checked={recurringForm.active} onChange={e => setRecurringForm(f => ({ ...f, active: e.target.checked }))} className="rounded border-zinc-300 text-violet-600" />
                  <label htmlFor="recurring-active" className="text-sm font-medium text-zinc-700">Active</label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setRecurringModalOpen(false); setEditRecurring(null) }}>Cancel</Button>
                <Button variant="primary" onClick={saveRecurring} disabled={recurringSaving || !recurringForm.name?.trim()}>Save</Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Expense modal */}
      {addExpenseOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => setAddExpenseOpen(false)} aria-hidden />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h3 className="text-lg font-semibold text-zinc-900">Add Expense</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Description *</label>
                  <input type="text" value={addExpenseForm.name} onChange={e => setAddExpenseForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="e.g. Office supplies" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                  <select value={addExpenseForm.category_id} onChange={e => setAddExpenseForm(f => ({ ...f, category_id: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                    <option value="">— Select —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Entity</label>
                  <select value={addExpenseForm.entity} onChange={e => setAddExpenseForm(f => ({ ...f, entity: e.target.value as 'US' | 'India' }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                    <option value="US">US</option>
                    <option value="India">India</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Amount *</label>
                    <input type="number" step="0.01" min={0} value={addExpenseForm.amount || ''} onChange={e => setAddExpenseForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                    <input type="date" value={addExpenseForm.expense_date} onChange={e => setAddExpenseForm(f => ({ ...f, expense_date: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Vendor</label>
                  <input type="text" value={addExpenseForm.vendor_name} onChange={e => setAddExpenseForm(f => ({ ...f, vendor_name: e.target.value }))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                  <textarea value={addExpenseForm.notes} onChange={e => setAddExpenseForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Optional" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleAddExpense} disabled={addExpenseSaving || !addExpenseForm.name?.trim()}>{addExpenseSaving ? 'Saving...' : 'Add Expense'}</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
