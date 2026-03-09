'use client'

import { useState, useEffect } from 'react'
import SidePanel from '@/components/SidePanel'
import { FieldRow, FieldInput, FieldSelect, FieldTextarea, SaveButton } from '@/components/FieldRow'
import { HR_MARKET_BADGE } from '@/lib/hr/types'
import type { HRJDTemplate } from '@/lib/hr/types'

const MARKET_OPTIONS = [{ value: 'India', label: 'India' }, { value: 'US', label: 'US' }]

export default function HRTemplatesPage() {
  const [templates, setTemplates] = useState<HRJDTemplate[]>([])
  const [roleTypes, setRoleTypes] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm] = useState({
    role_type_id: '',
    title: '',
    market: 'India' as 'India' | 'US',
    vertical: '',
    experience_min_years: '',
    experience_max_years: '',
    core_skills: '',
    jd_summary: '',
    jd_full_url: '',
    jd_full_text: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/hr/templates').then(r => r.json()).then(d => setTemplates(d.templates ?? [])),
      fetch('/api/hr/role-types').then(r => r.json()).then(d => setRoleTypes(d.roleTypes ?? [])),
    ]).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const res = await fetch('/api/hr/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        experience_min_years: form.experience_min_years ? parseInt(form.experience_min_years, 10) : null,
        experience_max_years: form.experience_max_years ? parseInt(form.experience_max_years, 10) : null,
        core_skills: form.core_skills ? form.core_skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      alert(data.error || 'Failed to create template')
      return
    }
    setNewOpen(false)
    setForm({ ...form, title: '', jd_summary: '', jd_full_url: '', jd_full_text: '', core_skills: '' })
    fetch('/api/hr/templates').then(r => r.json()).then(d => setTemplates(d.templates ?? []))
  }

  return (
    <div style={{ padding: '24px 28px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#09090b' }}>JD Templates</h1>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          style={{
            padding: '8px 16px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + New Template
        </button>
      </div>

      <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Role Type</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Market</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Vertical</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#71717a' }}>Skills</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#a1a1aa' }}>Loading...</td>
              </tr>
            )}
            {!loading && templates.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#71717a' }}>No templates yet.</td>
              </tr>
            )}
            {!loading && templates.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#09090b' }}>{t.title}</td>
                <td style={{ padding: '12px 16px', color: '#52525b' }}>{t.role_type_name ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: HR_MARKET_BADGE[t.market].bg, color: 'white' }}>
                    {HR_MARKET_BADGE[t.market].label}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#52525b' }}>{t.vertical}</td>
                <td style={{ padding: '12px 16px', color: '#71717a', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {Array.isArray(t.core_skills) ? t.core_skills.slice(0, 3).join(', ') : (t.core_skills as string) ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SidePanel open={newOpen} onClose={() => setNewOpen(false)} title="New JD Template" subtitle="Role type, title, market, skills">
        <FieldRow label="Role Type">
          <FieldSelect
            value={form.role_type_id}
            onChange={v => setForm({ ...form, role_type_id: v })}
            options={[{ value: '', label: 'Select' }, ...roleTypes.map(r => ({ value: r.id, label: r.name }))]}
          />
        </FieldRow>
        <FieldRow label="Title" required>
          <FieldInput value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="e.g. Tax Accountant" />
        </FieldRow>
        <FieldRow label="Market">
          <FieldSelect value={form.market} onChange={v => setForm({ ...form, market: v as 'India' | 'US' })} options={MARKET_OPTIONS} />
        </FieldRow>
        <FieldRow label="Vertical">
          <FieldInput value={form.vertical} onChange={v => setForm({ ...form, vertical: v })} placeholder="e.g. CPA Firm" />
        </FieldRow>
        <FieldRow label="Experience (min–max years)">
          <div style={{ display: 'flex', gap: 8 }}>
            <FieldInput type="number" value={form.experience_min_years} onChange={v => setForm({ ...form, experience_min_years: v })} placeholder="Min" />
            <FieldInput type="number" value={form.experience_max_years} onChange={v => setForm({ ...form, experience_max_years: v })} placeholder="Max" />
          </div>
        </FieldRow>
        <FieldRow label="Core skills (comma separated)">
          <FieldInput value={form.core_skills} onChange={v => setForm({ ...form, core_skills: v })} placeholder="1040, QBO, ..." />
        </FieldRow>
        <FieldRow label="JD Summary">
          <FieldTextarea value={form.jd_summary} onChange={v => setForm({ ...form, jd_summary: v })} placeholder="Short summary" />
        </FieldRow>
        <FieldRow label="Full JD URL">
          <FieldInput value={form.jd_full_url} onChange={v => setForm({ ...form, jd_full_url: v })} placeholder="https://..." />
        </FieldRow>
        <div style={{ marginTop: 16 }}>
          <SaveButton onClick={handleCreate} saving={saving} label="Create Template" />
        </div>
      </SidePanel>
    </div>
  )
}
