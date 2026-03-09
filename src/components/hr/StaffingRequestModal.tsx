'use client';

import { useState } from 'react';
import { X, Briefcase, Building2 } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

interface StaffingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffingRequestPayload) => void;
  clients: { id: string; name: string }[];
}

export interface StaffingRequestPayload {
  request_type: string;
  client_id: string;
  client_name?: string;
  new_client_name?: string;
  role_title: string;
  position_title: string;
  positions_needed: number;
  headcount: number;
  market: string;
  location: string;
  urgency: string;
  priority: string;
  estimated_start_date: string;
  justification: string;
  salary_range_min: string;
  salary_range_max: string;
  department: string;
  service_type?: string;
  estimated_monthly_fee?: number | null;
}

const REQUEST_TYPES = [
  { value: 'New Client', label: 'New Client', description: 'Hiring for a new client onboarding', icon: '🆕' },
  { value: 'Expansion', label: 'Expansion', description: 'Growing team for existing client', icon: '📈' },
  { value: 'Backfill', label: 'Backfill', description: 'Replacing a departing team member', icon: '🔄' },
  { value: 'Proactive', label: 'Proactive', description: 'Building talent pipeline', icon: '🎯' },
];

const PRIORITY_OPTIONS = [
  { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-700', description: 'Immediate need' },
  { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-700', description: 'Within 2 weeks' },
  { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700', description: 'Within 1 month' },
  { value: 'Low', label: 'Low', color: 'bg-green-100 text-green-700', description: 'No rush' },
];

export function StaffingRequestModal({ isOpen, onClose, onSubmit, clients }: StaffingRequestModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    request_type: '',
    client_id: '',
    new_client_name: '',
    position_title: '',
    department: '',
    priority: 'Medium',
    headcount: 1,
    estimated_start_date: '',
    justification: '',
    salary_range_min: '',
    salary_range_max: '',
    location: 'India',
    remote_allowed: true,
  });

  const isNewClient = formData.request_type === 'New Client';
  const needsExistingClient = ['Expansion', 'Backfill', 'Proactive'].includes(formData.request_type);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 =
    formData.request_type &&
    ((isNewClient && formData.new_client_name.trim()) || (needsExistingClient && formData.client_id));

  const canProceedStep2 = formData.position_title.trim() && formData.priority;

  const handleSubmit = () => {
    const clientName = isNewClient
      ? formData.new_client_name
      : clients.find((c) => c.id === formData.client_id)?.name;
    onSubmit({
      request_type: formData.request_type,
      client_id: formData.client_id,
      client_name: clientName,
      new_client_name: isNewClient ? formData.new_client_name : undefined,
      role_title: formData.position_title,
      position_title: formData.position_title,
      positions_needed: formData.headcount,
      headcount: formData.headcount,
      market: formData.location,
      location: formData.location.toLowerCase(),
      urgency: formData.priority,
      priority: formData.priority,
      estimated_start_date: formData.estimated_start_date,
      justification: formData.justification,
      salary_range_min: formData.salary_range_min,
      salary_range_max: formData.salary_range_max,
      department: formData.department,
      service_type: 'Accounting',
      estimated_monthly_fee:
        formData.salary_range_min || formData.salary_range_max
          ? parseFloat(formData.salary_range_min || formData.salary_range_max) || null
          : null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Briefcase className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">New Staffing Request</h2>
              <p className="text-sm text-slate-500">Step {step} of 3</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-violet-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Request Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {REQUEST_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange('request_type', type.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.request_type === type.value
                          ? 'border-violet-500 bg-violet-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <p className="mt-2 font-medium text-slate-900">{type.label}</p>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {formData.request_type && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {isNewClient ? 'New Client Name' : 'Select Client'} <span className="text-red-500">*</span>
                  </label>
                  {isNewClient ? (
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.new_client_name}
                        onChange={(e) => handleChange('new_client_name', e.target.value)}
                        placeholder="Enter new client name..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        autoFocus
                      />
                      <p className="mt-2 text-xs text-slate-400">
                        This will create a new client record when the request is approved.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                      <select
                        value={formData.client_id}
                        onChange={(e) => handleChange('client_id', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none bg-white"
                      >
                        <option value="">Select existing client...</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Position Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position_title}
                    onChange={(e) => handleChange('position_title', e.target.value)}
                    placeholder="e.g., Senior Accountant, Staff Accountant..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select department...</option>
                    <option value="accounting">Accounting</option>
                    <option value="operations">Operations</option>
                    <option value="hr">HR</option>
                    <option value="it">IT</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Headcount</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.headcount}
                    onChange={(e) => handleChange('headcount', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleChange('priority', p.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.priority === p.value
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.color}`}>
                        {p.label}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                  >
                    <option value="India">🇮🇳 India</option>
                    <option value="US">🇺🇸 United States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Start Date</label>
                  <input
                    type="date"
                    value={formData.estimated_start_date}
                    onChange={(e) => handleChange('estimated_start_date', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.remote_allowed}
                    onChange={(e) => handleChange('remote_allowed', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-700">Remote work allowed</span>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Justification / Business Need
                </label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => handleChange('justification', e.target.value)}
                  rows={4}
                  placeholder="Explain why this position is needed..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Salary Range (INR/month for India, USD/year for US)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {formData.location === 'India' ? '₹' : '$'}
                    </span>
                    <input
                      type="number"
                      value={formData.salary_range_min}
                      onChange={(e) => handleChange('salary_range_min', e.target.value)}
                      placeholder="Min"
                      className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {formData.location === 'India' ? '₹' : '$'}
                    </span>
                    <input
                      type="number"
                      value={formData.salary_range_max}
                      onChange={(e) => handleChange('salary_range_max', e.target.value)}
                      placeholder="Max"
                      className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-medium text-slate-900 mb-3">Request Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-500">Type:</div>
                  <div className="font-medium">{REQUEST_TYPES.find((t) => t.value === formData.request_type)?.label}</div>
                  <div className="text-slate-500">Client:</div>
                  <div className="font-medium">
                    {isNewClient ? formData.new_client_name : clients.find((c) => c.id === formData.client_id)?.name}
                  </div>
                  <div className="text-slate-500">Position:</div>
                  <div className="font-medium">{formData.position_title}</div>
                  <div className="text-slate-500">Headcount:</div>
                  <div className="font-medium">{formData.headcount}</div>
                  <div className="text-slate-500">Priority:</div>
                  <div>
                    <Badge
                      variant={
                        formData.priority === 'Critical'
                          ? 'red'
                          : formData.priority === 'High'
                            ? 'orange'
                            : 'slate'
                      }
                    >
                      {formData.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Submit Request</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
