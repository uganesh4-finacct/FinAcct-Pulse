'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  code?: string;
}

export interface BudgetEntry {
  id?: string;
  category_id: string;
  entity: 'us' | 'india';
  fiscal_year: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  annual_total?: number;
}

interface BudgetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budgets: BudgetEntry[]) => Promise<void>;
  categories: ExpenseCategory[];
  existingBudgets?: BudgetEntry[];
  fiscalYear?: number;
}

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function normalizeEntity(e: string): 'us' | 'india' {
  const v = (e || '').toLowerCase();
  return v === 'india' ? 'india' : 'us';
}

export function BudgetSetupModal({
  isOpen,
  onClose,
  onSave,
  categories,
  existingBudgets = [],
  fiscalYear = new Date().getFullYear(),
}: BudgetSetupModalProps) {
  const [step, setStep] = useState(1);
  const [entity, setEntity] = useState<'us' | 'india'>('us');
  const [year, setYear] = useState(fiscalYear);
  const [budgets, setBudgets] = useState<Record<string, Record<string, number>>>({});
  const [entryMode, setEntryMode] = useState<'monthly' | 'annual'>('annual');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && categories.length > 0) {
      const initial: Record<string, Record<string, number>> = {};
      categories.forEach((cat) => {
        initial[cat.id] = {};
        const existing = existingBudgets.find(
          (b) => b.category_id === cat.id && normalizeEntity(b.entity) === entity && b.fiscal_year === year
        );
        months.forEach((m) => {
          const val = existing?.[m as keyof BudgetEntry];
          initial[cat.id][m] = typeof val === 'number' ? val : 0;
        });
      });
      setBudgets(initial);
    }
  }, [isOpen, entity, year, categories, existingBudgets]);

  const handleMonthlyChange = (categoryId: string, month: string, value: number) => {
    setBudgets((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [month]: value,
      },
    }));
  };

  const handleAnnualChange = (categoryId: string, annualValue: number) => {
    const monthlyValue = Math.round((annualValue / 12) * 100) / 100;
    setBudgets((prev) => ({
      ...prev,
      [categoryId]: Object.fromEntries(months.map((m) => [m, monthlyValue])),
    }));
  };

  const getCategoryTotal = (categoryId: string) => {
    return months.reduce((sum, m) => sum + (budgets[categoryId]?.[m] || 0), 0);
  };

  const getGrandTotal = () => {
    return categories.reduce((sum, cat) => sum + getCategoryTotal(cat.id), 0);
  };

  const copyFromPreviousYear = async () => {
    try {
      const res = await fetch(`/api/finance/budgets?year=${year - 1}`);
      if (!res.ok) return;
      const prevData: BudgetEntry[] = await res.json();
      const prevForEntity = prevData.filter(
        (b) => normalizeEntity(b.entity) === entity && b.fiscal_year === year - 1
      );
      if (prevForEntity.length === 0) {
        alert(`No budgets found for ${year - 1}.`);
        return;
      }
      const next: Record<string, Record<string, number>> = {};
      categories.forEach((cat) => {
        const entry = prevForEntity.find((b) => b.category_id === cat.id);
        next[cat.id] = entry
          ? Object.fromEntries(months.map((m) => [m, Number(entry[m as keyof BudgetEntry]) || 0]))
          : Object.fromEntries(months.map((m) => [m, 0]));
      });
      setBudgets(next);
    } catch {
      alert('Failed to load previous year budgets.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const budgetEntries: BudgetEntry[] = categories.map((cat) => ({
        category_id: cat.id,
        entity,
        fiscal_year: year,
        jan: budgets[cat.id]?.jan ?? 0,
        feb: budgets[cat.id]?.feb ?? 0,
        mar: budgets[cat.id]?.mar ?? 0,
        apr: budgets[cat.id]?.apr ?? 0,
        may: budgets[cat.id]?.may ?? 0,
        jun: budgets[cat.id]?.jun ?? 0,
        jul: budgets[cat.id]?.jul ?? 0,
        aug: budgets[cat.id]?.aug ?? 0,
        sep: budgets[cat.id]?.sep ?? 0,
        oct: budgets[cat.id]?.oct ?? 0,
        nov: budgets[cat.id]?.nov ?? 0,
        dec: budgets[cat.id]?.dec ?? 0,
      }));
      await onSave(budgetEntries);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Budget Setup</h2>
              <p className="text-sm text-slate-500">Configure annual budget by category</p>
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

        {/* Progress Steps */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {s}
                </div>
                <span className={`ml-2 text-sm ${step >= s ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s === 1 ? 'Select Entity & Year' : s === 2 ? 'Enter Budgets' : 'Review & Save'}
                </span>
                {s < 3 && <div className="w-12 h-0.5 mx-3 bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="max-w-lg mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Select Entity</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'us' as const, label: 'FinAcct Solutions US', icon: '🇺🇸' },
                    { value: 'india' as const, label: 'FinAcct Solutions India', icon: '🇮🇳' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEntity(opt.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        entity === opt.value
                          ? 'border-violet-500 bg-violet-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <p className="mt-2 font-medium text-slate-900">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Fiscal Year</label>
                <div className="flex gap-2">
                  {[fiscalYear - 1, fiscalYear, fiscalYear + 1].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                        year === y
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={copyFromPreviousYear}
                  className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
                >
                  <Copy className="h-4 w-4" />
                  Copy budgets from {year - 1}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setEntryMode('annual')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      entryMode === 'annual' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Annual Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      entryMode === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Monthly Entry
                  </button>
                </div>
                <div className="text-sm text-slate-500">
                  {entity === 'us' ? '🇺🇸 US Entity' : '🇮🇳 India Entity'} • FY {year}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                      {entryMode === 'monthly' ? (
                        monthLabels.map((m) => (
                          <th
                            key={m}
                            className="px-2 py-3 text-center font-medium text-slate-600 text-xs"
                          >
                            {m}
                          </th>
                        ))
                      ) : (
                        <th className="px-4 py-3 text-center font-semibold text-slate-700">
                          Annual Budget
                        </th>
                      )}
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => (
                      <tr
                        key={cat.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">{cat.name}</span>
                          {cat.description && (
                            <p className="text-xs text-slate-400">{cat.description}</p>
                          )}
                        </td>
                        {entryMode === 'monthly' ? (
                          months.map((m) => (
                            <td key={m} className="px-1 py-2">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={budgets[cat.id]?.[m] ?? ''}
                                onChange={(e) =>
                                  handleMonthlyChange(
                                    cat.id,
                                    m,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-16 px-2 py-1.5 text-right text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                placeholder="0"
                              />
                            </td>
                          ))
                        ) : (
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center">
                              <span className="text-slate-400 mr-1">$</span>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={getCategoryTotal(cat.id) || ''}
                                onChange={(e) =>
                                  handleAnnualChange(cat.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-32 px-3 py-2 text-right border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                placeholder="0.00"
                              />
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          $
                          {getCategoryTotal(cat.id).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-violet-50 border-t-2 border-violet-200">
                      <td className="px-4 py-3 font-semibold text-violet-900">Total Budget</td>
                      {entryMode === 'monthly' && <td colSpan={12} />}
                      {entryMode === 'annual' && <td />}
                      <td className="px-4 py-3 text-right font-bold text-violet-900 text-lg">
                        $
                        {getGrandTotal().toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-gradient-to-br from-violet-50 to-slate-50 rounded-2xl p-6 border border-violet-200">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-violet-500" />
                  <h3 className="text-lg font-semibold text-slate-900">Budget Summary</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-sm text-slate-500">Entity</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {entity === 'us'
                        ? '🇺🇸 FinAcct Solutions US'
                        : '🇮🇳 FinAcct Solutions India'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-sm text-slate-500">Fiscal Year</p>
                    <p className="text-lg font-semibold text-slate-900">{year}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
                  <p className="text-sm text-slate-500 mb-1">Total Annual Budget</p>
                  <p className="text-3xl font-bold text-violet-600">
                    $
                    {getGrandTotal().toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    ~$
                    {(getGrandTotal() / 12).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    / month
                  </p>
                </div>

                <div className="space-y-2">
                  {categories
                    .filter((cat) => getCategoryTotal(cat.id) > 0)
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-slate-700">{cat.name}</span>
                        <span className="font-medium text-slate-900">
                          $
                          {getCategoryTotal(cat.id).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
              <Button onClick={() => setStep(step + 1)}>Continue</Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Budget'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
