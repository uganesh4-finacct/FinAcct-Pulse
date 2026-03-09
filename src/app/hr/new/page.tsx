'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ExperienceLevel, Urgency, MarketRate } from '@/lib/types'

const CITIES = ['Miami', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Atlanta', 'Phoenix', 'Seattle', 'Boston', 'Denver', 'Remote']
const JOB_TITLES = ['Bookkeeper', 'Staff Accountant', 'Senior Accountant', 'Accounting Manager', 'Controller', 'Payroll Specialist', 'Tax Accountant', 'CFO', 'Finance Director', 'Other']
const SKILLS = ['QuickBooks', 'Xero', 'Sage', 'NetSuite', 'Excel', 'Payroll', 'Tax Prep', 'Reconciliation', 'AR/AP', 'Financial Reporting', 'GAAP', 'Restaurant Accounting', 'Property Management', 'Insurance Accounting']

export default function NewRequisitionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [marketRate, setMarketRate] = useState<MarketRate | null>(null)
  const [form, setForm] = useState({
    prospect_name: '',
    job_title: '',
    experience_level: 'Mid' as ExperienceLevel,
    city: '',
    budget_amount: '',
    client_billing_rate: '',
    urgency: 'Medium' as Urgency,
    skill_requirements: [] as string[],
    notes: '',
  })

  useEffect(() => {
    if (form.job_title && form.city) {
      supabase
        .from('market_rates')
        .select('*')
        .eq('job_title', form.job_title)
        .eq('city', form.city)
        .single()
        .then(({ data }) => setMarketRate(data))
    }
  }, [form.job_title, form.city])

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skill_requirements: prev.skill_requirements.includes(skill)
        ? prev.skill_requirements.filter(s => s !== skill)
        : [...prev.skill_requirements, skill]
    }))
  }

  const handleSubmit = async () => {
    if (!form.prospect_name || !form.job_title || !form.city || !form.budget_amount) {
      alert('Please fill in all required fields.')
      return
    }
    setLoading(true)
    const data = {
      ...form,
      budget_amount: parseFloat(form.budget_amount),
      client_billing_rate: form.client_billing_rate ? parseFloat(form.client_billing_rate) : null,
    }
    const { error } = await supabase.from('requisitions').insert(data as any)
    if (error) { alert(error.message); setLoading(false); return }
    router.push('/hr')
  }

  const budget = parseFloat(form.budget_amount)
  const marketPosition = marketRate && budget
    ? budget < marketRate.market_rate_min
      ? { label: 'Below Market', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
      : budget > marketRate.market_rate_max
      ? { label: 'Above Market', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
      : { label: 'Market Rate ✓', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
    : null

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">New Requisition</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create a hiring request — visible to HR team after submission</p>
      </div>

      <div className="space-y-5">
        {/* Prospect & Role */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Prospect / Client Name *</label>
            <input
              type="text"
              value={form.prospect_name}
              onChange={e => setForm(p => ({ ...p, prospect_name: e.target.value }))}
              placeholder="e.g. Miami Restaurant Group"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title *</label>
            <select
              value={form.job_title}
              onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="">Select role...</option>
              {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* City & Experience */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">City *</label>
            <select
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="">Select city...</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Experience Level *</label>
            <select
              value={form.experience_level}
              onChange={e => setForm(p => ({ ...p, experience_level: e.target.value as ExperienceLevel }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
            >
              {(['Entry', 'Mid', 'Senior', 'Lead'] as ExperienceLevel[]).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget + Market Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hiring Budget (Annual $) *</label>
            <input
              type="number"
              value={form.budget_amount}
              onChange={e => setForm(p => ({ ...p, budget_amount: e.target.value }))}
              placeholder="e.g. 65000"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Client Billing Rate (Admin only)</label>
            <input
              type="number"
              value={form.client_billing_rate}
              onChange={e => setForm(p => ({ ...p, client_billing_rate: e.target.value }))}
              placeholder="Not visible to HR"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm font-mono bg-slate-50 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Market Rate Indicator */}
        {marketRate && (
          <div className={`px-4 py-3 rounded border text-sm ${marketPosition?.bg}`}>
            <span className="text-slate-600">Market rate for <strong>{form.job_title}</strong> in <strong>{form.city}</strong>: </span>
            <span className="font-mono font-semibold text-slate-800">
              ${marketRate.market_rate_min.toLocaleString()} – ${marketRate.market_rate_max.toLocaleString()}
            </span>
            {marketPosition && (
              <span className={`ml-3 font-bold ${marketPosition.color}`}>← {marketPosition.label}</span>
            )}
          </div>
        )}

        {/* Urgency */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Urgency *</label>
          <div className="flex gap-2">
            {(['Low', 'Medium', 'High', 'Critical'] as Urgency[]).map(u => (
              <button
                key={u}
                onClick={() => setForm(p => ({ ...p, urgency: u }))}
                className={`px-3 py-1.5 rounded text-xs font-semibold border transition ${
                  form.urgency === u
                    ? u === 'Critical' ? 'bg-red-600 text-white border-red-600'
                    : u === 'High' ? 'bg-orange-500 text-white border-orange-500'
                    : u === 'Medium' ? 'bg-amber-400 text-white border-amber-400'
                    : 'bg-slate-600 text-white border-slate-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Required Skills</label>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                  form.skill_requirements.includes(skill)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (internal)</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3}
            placeholder="Any context HR should know..."
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded hover:bg-slate-700 disabled:opacity-50 transition"
          >
            {loading ? 'Creating...' : 'Create Requisition'}
          </button>
          <button
            onClick={() => router.push('/hr')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
