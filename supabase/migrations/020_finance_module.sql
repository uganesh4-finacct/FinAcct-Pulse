-- ============================================================
-- Finance Module: client_invoices (AR), expenses, recurring, budgets, monthly status, views
-- ============================================================

-- Expense categories (reference)
CREATE TABLE IF NOT EXISTS finance_expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client invoices (AR - client billing)
CREATE TABLE IF NOT EXISTS client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_month DATE NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  invoiced_amount NUMERIC(12,2) NOT NULL,
  adjustment_reason TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue', 'waived')),
  paid_amount NUMERIC(12,2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT CHECK (payment_method IN ('qbo', 'ach', 'auto_ach', 'check', 'wire', 'other')),
  payment_reference TEXT,
  india_tp_status TEXT DEFAULT 'pending' CHECK (india_tp_status IN ('pending', 'transferred', 'na')),
  india_tp_date DATE,
  india_tp_amount NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_client_invoices_client ON client_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_month ON client_invoices(invoice_month);
CREATE INDEX IF NOT EXISTS idx_client_invoices_status ON client_invoices(payment_status);

-- Finance expenses (AP)
CREATE TABLE IF NOT EXISTS finance_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES finance_expense_categories(id) ON DELETE SET NULL,
  entity TEXT NOT NULL CHECK (entity IN ('US', 'India')),
  expense_date DATE NOT NULL,
  expense_month TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'INR')),
  amount_usd NUMERIC(12,2),
  vendor_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_month ON finance_expenses(expense_month);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_entity ON finance_expenses(entity);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_status ON finance_expenses(status);

-- Recurring expense templates
CREATE TABLE IF NOT EXISTS finance_recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES finance_expense_categories(id) ON DELETE SET NULL,
  entity TEXT NOT NULL CHECK (entity IN ('US', 'India')),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'INR')),
  frequency TEXT NOT NULL CHECK (frequency IN ('Monthly', 'Quarterly', 'Annual')),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 28),
  vendor_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets (annual or monthly by category/entity)
CREATE TABLE IF NOT EXISTS finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  entity TEXT NOT NULL CHECK (entity IN ('US', 'India')),
  category_id UUID REFERENCES finance_expense_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  budgeted_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_budgets_unique ON finance_budgets(year, COALESCE(month, 0), entity, COALESCE(category_id::text, ''));

-- Month-end confirmation
CREATE TABLE IF NOT EXISTS finance_monthly_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed expense categories
INSERT INTO finance_expense_categories (name, code) VALUES
  ('Payroll', 'PAY'),
  ('Software & Subscriptions', 'SOFT'),
  ('Office & Admin', 'ADMIN'),
  ('Marketing', 'MKT'),
  ('Travel', 'TRV'),
  ('Professional Services', 'PROF'),
  ('India TP In', 'TP_IN'),
  ('Other', 'OTHER')
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE finance_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_monthly_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all finance_expense_categories" ON finance_expense_categories FOR ALL USING (true);
CREATE POLICY "Allow all client_invoices" ON client_invoices FOR ALL USING (true);
CREATE POLICY "Allow all finance_expenses" ON finance_expenses FOR ALL USING (true);
CREATE POLICY "Allow all finance_recurring_expenses" ON finance_recurring_expenses FOR ALL USING (true);
CREATE POLICY "Allow all finance_budgets" ON finance_budgets FOR ALL USING (true);
CREATE POLICY "Allow all finance_monthly_status" ON finance_monthly_status FOR ALL USING (true);

-- View: US entity P&L (revenue from client_invoices, expenses from finance_expenses)
CREATE OR REPLACE VIEW v_us_entity_pl AS
SELECT
  to_char(ci.invoice_month, 'YYYY-MM') AS month_str,
  COALESCE(SUM(ci.invoiced_amount), 0) AS revenue,
  COALESCE(SUM(ci.paid_amount), 0) AS collected,
  COALESCE(SUM(CASE WHEN ci.payment_status != 'paid' AND ci.payment_status != 'waived' THEN ci.invoiced_amount - COALESCE(ci.paid_amount, 0) ELSE 0 END), 0) AS ar_outstanding,
  COALESCE(SUM(ci.india_tp_amount), 0) AS india_tp_out
FROM client_invoices ci
GROUP BY to_char(ci.invoice_month, 'YYYY-MM');

-- View: India entity P&L (revenue = TP received, expenses)
CREATE OR REPLACE VIEW v_india_entity_pl AS
SELECT
  to_char(ci.india_tp_date, 'YYYY-MM') AS month_str,
  COALESCE(SUM(ci.india_tp_amount), 0) AS revenue_tp_in
FROM client_invoices ci
WHERE ci.india_tp_status = 'transferred' AND ci.india_tp_date IS NOT NULL
GROUP BY to_char(ci.india_tp_date, 'YYYY-MM');

-- View: Budget vs Actual (by year, entity, category)
CREATE OR REPLACE VIEW v_budget_vs_actual AS
SELECT
  b.id,
  b.year,
  b.month,
  b.entity,
  b.category_id,
  b.category_name,
  b.budgeted_amount,
  COALESCE(act.actual_amount, 0) AS actual_amount,
  b.budgeted_amount - COALESCE(act.actual_amount, 0) AS variance
FROM finance_budgets b
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(CASE WHEN e.currency = 'USD' THEN e.amount ELSE e.amount_usd END), 0) AS actual_amount
  FROM finance_expenses e
  WHERE e.entity = b.entity
    AND e.expense_month = b.year::text || '-' || lpad(COALESCE(NULLIF(b.month, 0), 1)::text, 2, '0')
    AND (b.category_id IS NULL OR e.category_id = b.category_id)
    AND e.status != 'cancelled'
) act ON true;

-- View: Billing projections (next 12 months by client) - uses clients.monthly_fee
CREATE OR REPLACE VIEW v_billing_projections AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  m.month_year,
  COALESCE(c.monthly_fee, 0)::numeric AS projected_amount
FROM clients c
CROSS JOIN (
  SELECT to_char((date_trunc('month', CURRENT_DATE) + (n || ' months')::interval), 'YYYY-MM') AS month_year
  FROM generate_series(0, 11) n
) m
WHERE c.active = true;
