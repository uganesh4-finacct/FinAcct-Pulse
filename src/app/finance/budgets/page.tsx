'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BudgetSetupModal, type BudgetEntry } from '@/components/finance/BudgetSetupModal';

type ExpenseCategory = { id: string; name: string; code?: string };

export default function BudgetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catRes = await fetch('/api/finance/categories');
      if (!catRes.ok) return;
      const catData = await catRes.json();
      setCategories(Array.isArray(catData) ? catData : []);

      const budgetRes = await fetch(`/api/finance/budgets?year=${selectedYear}`);
      if (!budgetRes.ok) return;
      const budgetData = await budgetRes.json();
      setBudgets(Array.isArray(budgetData) ? budgetData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const handleSaveBudgets = async (budgetEntries: BudgetEntry[]) => {
    try {
      const res = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgets: budgetEntries }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save budgets');
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save budgets');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
          <p className="text-slate-500">Manage annual budgets by entity and category</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Set Budget
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedYear === year
                ? 'bg-violet-100 text-violet-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500 py-8 text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(['us', 'india'] as const).map((entity) => {
            const entityBudgets = budgets.filter(
              (b) => (b.entity || '').toLowerCase() === entity
            );
            const totalBudget = entityBudgets.reduce((sum, b) => {
              return (
                sum +
                (Number(b.jan) || 0) +
                (Number(b.feb) || 0) +
                (Number(b.mar) || 0) +
                (Number(b.apr) || 0) +
                (Number(b.may) || 0) +
                (Number(b.jun) || 0) +
                (Number(b.jul) || 0) +
                (Number(b.aug) || 0) +
                (Number(b.sep) || 0) +
                (Number(b.oct) || 0) +
                (Number(b.nov) || 0) +
                (Number(b.dec) || 0)
              );
            }, 0);

            return (
              <div
                key={entity}
                className={`rounded-2xl border-2 p-6 ${
                  entity === 'us'
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-violet-200 bg-violet-50/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{entity === 'us' ? '🇺🇸' : '🇮🇳'}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {entity === 'us'
                        ? 'FinAcct Solutions US'
                        : 'FinAcct Solutions India'}
                    </h3>
                    <p className="text-sm text-slate-500">FY {selectedYear}</p>
                  </div>
                </div>

                <div className="text-3xl font-bold text-slate-900 mb-4">
                  $
                  {totalBudget.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    annual
                  </span>
                </div>

                {entityBudgets.length > 0 ? (
                  <div className="space-y-2">
                    {entityBudgets.map((b) => {
                      const cat = categories.find((c) => c.id === b.category_id);
                      const total =
                        (Number(b.jan) || 0) +
                        (Number(b.feb) || 0) +
                        (Number(b.mar) || 0) +
                        (Number(b.apr) || 0) +
                        (Number(b.may) || 0) +
                        (Number(b.jun) || 0) +
                        (Number(b.jul) || 0) +
                        (Number(b.aug) || 0) +
                        (Number(b.sep) || 0) +
                        (Number(b.oct) || 0) +
                        (Number(b.nov) || 0) +
                        (Number(b.dec) || 0);
                      return (
                        <div
                          key={b.id || `${b.category_id}-${b.entity}-${b.fiscal_year}`}
                          className="flex justify-between py-1.5 text-sm"
                        >
                          <span className="text-slate-600">
                            {cat?.name ?? 'Unknown'}
                          </span>
                          <span className="font-medium text-slate-900">
                            $
                            {total.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    No budget set for {selectedYear}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BudgetSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBudgets}
        categories={categories}
        existingBudgets={budgets}
        fiscalYear={selectedYear}
      />
    </div>
  );
}
