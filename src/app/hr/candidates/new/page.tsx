'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Briefcase, Mail, Phone, Link as LinkIcon, DollarSign, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function AddCandidateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requisitionIdParam = searchParams?.get('requisition_id') ?? '';

  const [positions, setPositions] = useState<{ id: string; title: string; client_project?: string | null }[]>([]);
  const [requisitions, setRequisitions] = useState<{ id: string; title: string }[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const useRequisitionMode = Boolean(requisitionIdParam);

  const [formData, setFormData] = useState({
    position_id: '',
    requisition_id: '',
    name: '',
    email: '',
    phone: '',
    resume_url: '',
    source_id: '',
    notes: '',
    expected_salary: '',
    current_company: '',
    years_experience: '',
  });

  useEffect(() => {
    fetchData();
  }, [requisitionIdParam]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (useRequisitionMode) {
        const [reqRes, sourceRes] = await Promise.all([
          fetch('/api/hr/requisitions'),
          fetch('/api/hr/sources'),
        ]);
        const reqData = await reqRes.json();
        const sourceData = await sourceRes.json();
        const list = reqData?.requisitions ?? [];
        setRequisitions(Array.isArray(list) ? list : []);
        setSources(Array.isArray(sourceData) ? sourceData : []);
        setFormData((prev) => ({ ...prev, requisition_id: requisitionIdParam || prev.requisition_id }));
      } else {
        const [posRes, sourceRes] = await Promise.all([
          fetch('/api/hr/positions?status=open'),
          fetch('/api/hr/sources'),
        ]);
        const posData = await posRes.json();
        const sourceData = await sourceRes.json();
        setPositions(Array.isArray(posData?.positions) ? posData.positions : []);
        setSources(Array.isArray(sourceData) ? sourceData : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useRequisitionMode) {
      if (!formData.requisition_id || !formData.name.trim()) {
        alert('Please fill required fields (Requisition and Candidate Name).');
        return;
      }
    } else {
      if (!formData.position_id || !formData.name.trim()) {
        alert('Please fill required fields (Position and Candidate Name).');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (useRequisitionMode) {
        const sourceName = formData.source_id ? sources.find((s) => s.id === formData.source_id)?.name ?? null : null;
        const res = await fetch('/api/hr/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requisition_id: formData.requisition_id,
            full_name: formData.name.trim(),
            email: formData.email || null,
            phone: formData.phone || null,
            resume_url: formData.resume_url || null,
            source: sourceName,
            current_company: formData.current_company || null,
            experience_summary: [
              formData.notes,
              formData.years_experience && `Years of experience: ${formData.years_experience}`,
            ]
              .filter(Boolean)
              .join('\n') || null,
            expected_salary_monthly: formData.expected_salary ? Number(formData.expected_salary) : null,
          }),
        });
        if (res.ok) router.push(`/hr/requisitions/${formData.requisition_id}`);
        else {
          const err = await res.json().catch(() => ({}));
          alert(err?.error || err?.message || 'Failed to add candidate');
        }
      } else {
        const res = await fetch('/api/hr/hiring/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position_id: formData.position_id,
            name: formData.name.trim(),
            email: formData.email || null,
            phone: formData.phone || null,
            resume_url: formData.resume_url || null,
            source_id: formData.source_id || null,
            notes: [
              formData.notes,
              formData.current_company && `Current company: ${formData.current_company}`,
              formData.years_experience && `Years of experience: ${formData.years_experience}`,
            ]
              .filter(Boolean)
              .join('\n') || null,
            expected_salary: formData.expected_salary ? Number(formData.expected_salary) : null,
          }),
        });
        if (res.ok) router.push(`/hr/hiring?tab=candidates`);
        else {
          const err = await res.json().catch(() => ({}));
          alert(err?.error || err?.message || 'Failed to add candidate');
        }
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Failed to add candidate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href={useRequisitionMode ? `/hr/requisitions/${formData.requisition_id || requisitionIdParam}` : '/hr/hiring'}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-violet-600 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {useRequisitionMode ? 'Back to Requisition' : 'Back to Hiring'}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Candidate</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {useRequisitionMode ? 'Add a new candidate to this requisition' : 'Add a new candidate to a position'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
          {/* Position or Requisition (Required) */}
          {useRequisitionMode ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Requisition <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={formData.requisition_id}
                  onChange={(e) => handleChange('requisition_id', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                  disabled={loading}
                >
                  <option value="">Select requisition...</option>
                  {requisitions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={formData.position_id}
                  onChange={(e) => handleChange('position_id', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                  disabled={loading}
                >
                  <option value="">Select position...</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                      {pos.client_project ? ` (${pos.client_project})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Name (Required) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Candidate Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Full name"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Resume URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Resume URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="url"
                value={formData.resume_url}
                onChange={(e) => handleChange('resume_url', e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Source</label>
            <select
              value={formData.source_id}
              onChange={(e) => handleChange('source_id', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Select source...</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          {/* Current Company & Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Company</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.current_company}
                  onChange={(e) => handleChange('current_company', e.target.value)}
                  placeholder="Company name"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Years of Experience</label>
              <input
                type="number"
                min={0}
                max={50}
                value={formData.years_experience}
                onChange={(e) => handleChange('years_experience', e.target.value)}
                placeholder="5"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Expected Salary */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Expected Salary (₹/month)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="number"
                value={formData.expected_salary}
                onChange={(e) => handleChange('expected_salary', e.target.value)}
                placeholder="50000"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about the candidate..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(useRequisitionMode ? `/hr/requisitions/${formData.requisition_id || requisitionIdParam}` : '/hr/hiring')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? 'Adding...' : 'Add Candidate'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AddCandidatePage() {
  return (
    <Suspense fallback={<div className="p-6 max-w-2xl mx-auto text-slate-500">Loading...</div>}>
      <AddCandidateForm />
    </Suspense>
  );
}
