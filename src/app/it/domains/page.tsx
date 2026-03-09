'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/finance-utils'
import { Button } from '@/components/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { FieldRow, FieldInput } from '@/components/FieldRow'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

function statusBadge(status: string, expiryDate: string | null) {
  if (status === 'cancelled') return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600">Cancelled</span>
  if (!expiryDate) return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
  const d = new Date(expiryDate)
  const days = Math.floor((d.getTime() - Date.now()) / 86400000)
  if (days < 0) return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Expired</span>
  if (days <= 30) return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Expiring soon</span>
  return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
}

function daysRemaining(date: string | null) {
  if (!date) return null
  const d = new Date(date)
  const days = Math.floor((d.getTime() - Date.now()) / 86400000)
  return days
}

export default function ITDomainsPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    domain: '', registrar: '', registration_date: '', expiry_date: '', auto_renew: false,
    dns_provider: '', ssl_provider: '', ssl_expiry_date: '', annual_cost: '', currency: 'USD', notes: '',
  })

  useEffect(() => {
    fetch('/api/it/domains').then(r => r.json()).then(setList)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (detailId) fetch(`/api/it/domains/${detailId}`).then(r => r.json()).then(setDetail).catch(() => setDetail(null))
    else setDetail(null)
  }, [detailId])

  const openAdd = () => {
    setForm({
      domain: '', registrar: '', registration_date: '', expiry_date: '', auto_renew: false,
      dns_provider: '', ssl_provider: '', ssl_expiry_date: '', annual_cost: '', currency: 'USD', notes: '',
    })
    setAddOpen(true)
  }

  const openEdit = (row: any) => {
    setEditId(row.id)
    setForm({
      domain: row.domain || '', registrar: row.registrar || '', registration_date: row.registration_date || '', expiry_date: row.expiry_date || '', auto_renew: !!row.auto_renew,
      dns_provider: row.dns_provider || '', ssl_provider: row.ssl_provider || '', ssl_expiry_date: row.ssl_expiry_date || '', annual_cost: row.annual_cost ?? '', currency: row.currency || 'USD', notes: row.notes || '',
    })
  }

  const handleSaveNew = async () => {
    if (!form.domain?.trim()) {
      alert('Domain name is required')
      return
    }
    setSaving(true)
    const r = await fetch('/api/it/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, annual_cost: form.annual_cost ? parseFloat(form.annual_cost) : null }),
    })
    setSaving(false)
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Failed')
      return
    }
    setAddOpen(false)
    fetch('/api/it/domains').then(r => r.json()).then(setList)
  }

  const handleSaveEdit = async () => {
    if (!editId) return
    setSaving(true)
    const r = await fetch(`/api/it/domains/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, annual_cost: form.annual_cost ? parseFloat(form.annual_cost) : null }),
    })
    setSaving(false)
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      alert(e.error || 'Failed')
      return
    }
    setEditId(null)
    setDetailId(null)
    setDetail(null)
    fetch('/api/it/domains').then(r => r.json()).then(setList)
  }

  const activeCount = list.filter(d => d.status === 'active').length
  const expiringSoon = list.filter(d => {
    const days = daysRemaining(d.expiry_date)
    return days != null && days >= 0 && days <= 30 && d.status !== 'cancelled'
  }).length
  const sslExpiringSoon = list.filter(d => {
    const days = d.ssl_expiry_date ? daysRemaining(d.ssl_expiry_date) : null
    return days != null && days >= 0 && days <= 30
  }).length

  if (loading) return <div className="text-zinc-500 py-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-zinc-900">Domain Management</h2>
        <Button onClick={openAdd} size="sm"><Globe className="w-4 h-4 mr-1.5" /> Add Domain</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4"><div className="text-xl font-bold">{activeCount}</div><div className="text-sm text-zinc-500">Active Domains</div></div>
        <div className="bg-white rounded-xl border border-amber-200 p-4"><div className="text-xl font-bold">{expiringSoon}</div><div className="text-sm text-zinc-500">Expiring Soon</div></div>
        <div className="bg-white rounded-xl border border-red-200 p-4"><div className="text-xl font-bold">{sslExpiringSoon}</div><div className="text-sm text-zinc-500">SSL Expiring Soon</div></div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Domain</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Registrar</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Expiry Date</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Auto-Renew</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">DNS Provider</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">SSL Expiry</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-700">Annual Cost</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-500">No domains. Add a domain.</td></tr>}
            {list.map((row) => {
              const expDays = daysRemaining(row.expiry_date)
              const sslDays = row.ssl_expiry_date ? daysRemaining(row.ssl_expiry_date) : null
              return (
                <tr
                  key={row.id}
                  onClick={() => setDetailId(row.id)}
                  className="border-b border-zinc-100 hover:bg-violet-50/50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">{row.domain}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.registrar || '—'}</td>
                  <td className="px-4 py-3">
                    {row.expiry_date ? (
                      <span className={cn(expDays != null && expDays < 30 ? 'text-amber-600 font-medium' : expDays != null && expDays < 0 ? 'text-red-600' : '')}>
                        {new Date(row.expiry_date).toLocaleDateString()}
                        {expDays != null && expDays >= 0 && ` (${expDays}d)`}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">{row.auto_renew ? <span className="inline-flex px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800">Yes</span> : <span className="inline-flex px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-600">No</span>}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.dns_provider || '—'}</td>
                  <td className="px-4 py-3">
                    {row.ssl_expiry_date ? (
                      <span className={cn(sslDays != null && sslDays < 30 ? 'text-red-600' : '')}>
                        {new Date(row.ssl_expiry_date).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(row.status, row.expiry_date)}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.annual_cost != null ? formatCurrency(row.annual_cost, row.currency as 'USD' | 'INR') : '—'}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Edit</Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detailId && detail && (
        <Modal onClose={() => { setDetailId(null); setDetail(null); }} maxWidth="lg">
          <ModalHeader title={detail.domain} onClose={() => { setDetailId(null); setDetail(null); }} />
          <ModalBody>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-zinc-500">Registrar</span><div className="font-medium">{detail.registrar || '—'}</div></div>
              <div><span className="text-zinc-500">Registration Date</span><div className="font-medium">{detail.registration_date ? new Date(detail.registration_date).toLocaleDateString() : '—'}</div></div>
              <div><span className="text-zinc-500">Expiry Date</span><div className="font-medium">{detail.expiry_date ? new Date(detail.expiry_date).toLocaleDateString() : '—'}</div></div>
              <div><span className="text-zinc-500">Auto-Renew</span><div className="font-medium">{detail.auto_renew ? 'Yes' : 'No'}</div></div>
              <div><span className="text-zinc-500">DNS Provider</span><div className="font-medium">{detail.dns_provider || '—'}</div></div>
              <div><span className="text-zinc-500">SSL Provider</span><div className="font-medium">{detail.ssl_provider || '—'}</div></div>
              <div><span className="text-zinc-500">SSL Expiry</span><div className="font-medium">{detail.ssl_expiry_date ? new Date(detail.ssl_expiry_date).toLocaleDateString() : '—'}</div></div>
              <div><span className="text-zinc-500">Annual Cost</span><div className="font-medium">{detail.annual_cost != null ? formatCurrency(detail.annual_cost, detail.currency as 'USD' | 'INR') : '—'}</div></div>
            </div>
            {detail.notes && <div className="mt-4"><span className="text-zinc-500 text-xs uppercase">Notes</span><p className="mt-1 text-sm">{detail.notes}</p></div>}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => { setDetailId(null); setDetail(null); }}>Close</Button>
            <Button onClick={() => { openEdit(detail); setDetailId(null); setDetail(null); }}>Edit</Button>
          </ModalFooter>
        </Modal>
      )}

      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} maxWidth="lg">
          <ModalHeader title="Add Domain" onClose={() => setAddOpen(false)} />
          <ModalBody>
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Domain Info</h3>
                <FieldRow label="Domain Name" required><FieldInput value={form.domain} onChange={v => setForm(f => ({ ...f, domain: v }))} placeholder="finacctsolutions.com" /></FieldRow>
                <FieldRow label="Registrar"><FieldInput value={form.registrar} onChange={v => setForm(f => ({ ...f, registrar: v }))} placeholder="GoDaddy, Namecheap..." /></FieldRow>
                <FieldRow label="Registration Date"><FieldInput type="date" value={form.registration_date} onChange={v => setForm(f => ({ ...f, registration_date: v }))} /></FieldRow>
                <FieldRow label="Expiry Date"><FieldInput type="date" value={form.expiry_date} onChange={v => setForm(f => ({ ...f, expiry_date: v }))} /></FieldRow>
                <label className="flex items-center gap-2 cursor-pointer mt-2"><input type="checkbox" checked={form.auto_renew} onChange={e => setForm(f => ({ ...f, auto_renew: e.target.checked }))} className="rounded border-zinc-300 text-violet-600" /><span className="text-sm">Auto-Renew</span></label>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">DNS & SSL</h3>
                <FieldRow label="DNS Provider"><FieldInput value={form.dns_provider} onChange={v => setForm(f => ({ ...f, dns_provider: v }))} /></FieldRow>
                <FieldRow label="SSL Provider"><FieldInput value={form.ssl_provider} onChange={v => setForm(f => ({ ...f, ssl_provider: v }))} /></FieldRow>
                <FieldRow label="SSL Expiry Date"><FieldInput type="date" value={form.ssl_expiry_date} onChange={v => setForm(f => ({ ...f, ssl_expiry_date: v }))} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Cost</h3>
                <FieldRow label="Annual Cost"><FieldInput type="number" value={form.annual_cost} onChange={v => setForm(f => ({ ...f, annual_cost: v }))} /></FieldRow>
                <FieldRow label="Currency"><select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-full"><option value="USD">USD</option><option value="INR">INR</option></select></FieldRow>
              </section>
              <FieldRow label="Notes"><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></FieldRow>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNew} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}

      {editId && (
        <Modal onClose={() => setEditId(null)} maxWidth="lg">
          <ModalHeader title="Edit Domain" onClose={() => setEditId(null)} />
          <ModalBody>
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Domain Info</h3>
                <FieldRow label="Domain Name" required><FieldInput value={form.domain} onChange={v => setForm(f => ({ ...f, domain: v }))} /></FieldRow>
                <FieldRow label="Registrar"><FieldInput value={form.registrar} onChange={v => setForm(f => ({ ...f, registrar: v }))} /></FieldRow>
                <FieldRow label="Registration Date"><FieldInput type="date" value={form.registration_date} onChange={v => setForm(f => ({ ...f, registration_date: v }))} /></FieldRow>
                <FieldRow label="Expiry Date"><FieldInput type="date" value={form.expiry_date} onChange={v => setForm(f => ({ ...f, expiry_date: v }))} /></FieldRow>
                <label className="flex items-center gap-2 cursor-pointer mt-2"><input type="checkbox" checked={form.auto_renew} onChange={e => setForm(f => ({ ...f, auto_renew: e.target.checked }))} className="rounded border-zinc-300 text-violet-600" /><span className="text-sm">Auto-Renew</span></label>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">DNS & SSL</h3>
                <FieldRow label="DNS Provider"><FieldInput value={form.dns_provider} onChange={v => setForm(f => ({ ...f, dns_provider: v }))} /></FieldRow>
                <FieldRow label="SSL Provider"><FieldInput value={form.ssl_provider} onChange={v => setForm(f => ({ ...f, ssl_provider: v }))} /></FieldRow>
                <FieldRow label="SSL Expiry Date"><FieldInput type="date" value={form.ssl_expiry_date} onChange={v => setForm(f => ({ ...f, ssl_expiry_date: v }))} /></FieldRow>
              </section>
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Cost</h3>
                <FieldRow label="Annual Cost"><FieldInput type="number" value={form.annual_cost} onChange={v => setForm(f => ({ ...f, annual_cost: v }))} /></FieldRow>
                <FieldRow label="Currency"><select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-full"><option value="USD">USD</option><option value="INR">INR</option></select></FieldRow>
              </section>
              <FieldRow label="Notes"><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></FieldRow>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
