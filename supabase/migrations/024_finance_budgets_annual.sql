-- ============================================================
-- Budgets: add fiscal_year + monthly columns and unique constraint
-- for annual budget setup (one row per category/entity/fiscal_year)
-- ============================================================

-- Add fiscal_year and month columns (jan..dec) for new budget format
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'finance_budgets' AND column_name = 'fiscal_year') THEN
    ALTER TABLE finance_budgets ADD COLUMN fiscal_year INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'finance_budgets' AND column_name = 'jan') THEN
    ALTER TABLE finance_budgets ADD COLUMN jan NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN feb NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN mar NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN apr NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN may NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN jun NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN jul NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN aug NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN sep NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN oct NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN nov NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE finance_budgets ADD COLUMN dec NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

-- Unique index for upsert (partial: only rows with fiscal_year set)
-- Allows legacy rows (year/month/budgeted_amount) to coexist
DROP INDEX IF EXISTS idx_finance_budgets_annual_unique;
CREATE UNIQUE INDEX idx_finance_budgets_annual_unique
  ON finance_budgets (category_id, entity, fiscal_year)
  WHERE fiscal_year IS NOT NULL;
