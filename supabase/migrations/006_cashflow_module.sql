-- ============================================================
-- FinAcct Pulse — Cash Flow & Collections Module (Migration 006)
-- Run in Supabase SQL Editor. Creates payment_history + views.
-- ============================================================

-- Payment history (log of received payments; can be synced from invoice paid_date)
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  received_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_date DATE,
  days_late INTEGER DEFAULT 0,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_client ON payment_history(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_month ON payment_history(month_year);
CREATE INDEX IF NOT EXISTS idx_payment_history_updated ON payment_history(updated_at DESC);

-- View: Cash flow summary (single row for KPIs)
CREATE OR REPLACE VIEW v_cashflow_summary AS
SELECT
  (SELECT COALESCE(SUM(c.monthly_fee), 0) FROM clients c WHERE c.active = true)::numeric AS expected_this_month,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoices i WHERE i.payment_status = 'paid')::numeric AS collected_this_month,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoices i WHERE i.payment_status != 'paid')::numeric AS outstanding,
  (SELECT COUNT(DISTINCT i.client_id) FROM invoices i WHERE i.payment_status != 'paid' AND i.outstanding_days > 0)::integer AS clients_overdue,
  (SELECT COUNT(*) FROM clients WHERE active = true)::integer AS client_count,
  (SELECT COUNT(DISTINCT client_id) FROM invoices WHERE payment_status = 'paid')::integer AS clients_paid,
  (SELECT COUNT(DISTINCT client_id) FROM invoices WHERE payment_status != 'paid')::integer AS clients_unpaid,
  CASE
    WHEN (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE payment_status = 'paid') > 0
    THEN ROUND(
      100.0 * (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE payment_status = 'paid') /
      NULLIF((SELECT COALESCE(SUM(c.monthly_fee), 0) FROM clients c WHERE c.active = true), 0),
      1
    )
    ELSE 0
  END::numeric AS collection_rate,
  COALESCE((
    SELECT ROUND(AVG(EXTRACT(DAY FROM i.paid_date - i.due_date))::numeric, 0)
    FROM invoices i
    WHERE i.paid_date IS NOT NULL AND i.due_date IS NOT NULL AND i.paid_date > i.due_date
  ), 0)::numeric AS avg_days_late;

-- View: Per-client collection patterns (payment behavior)
CREATE OR REPLACE VIEW v_collection_patterns AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  c.vertical,
  tm.name AS owner_name,
  c.monthly_fee,
  c.payment_method,
  COUNT(i.id)::integer AS total_invoices,
  COUNT(i.id) FILTER (WHERE i.payment_status = 'paid' AND i.paid_date IS NOT NULL AND i.paid_date <= i.due_date)::integer AS paid_on_time,
  COALESCE(ROUND(AVG((i.paid_date - i.due_date)) FILTER (WHERE i.payment_status = 'paid' AND i.paid_date IS NOT NULL AND i.paid_date > i.due_date))::numeric, 0)::integer AS avg_days_late,
  CASE
    WHEN COUNT(i.id) > 0
    THEN ROUND(100.0 * COUNT(i.id) FILTER (WHERE i.payment_status = 'paid') / COUNT(i.id), 1)
    ELSE 100
  END::numeric AS payment_rate_pct,
  CASE
    WHEN COUNT(i.id) FILTER (WHERE i.payment_status != 'paid' AND i.outstanding_days > 30) >= 2 THEN 'chronic_late'
    WHEN COUNT(i.id) FILTER (WHERE i.payment_status != 'paid' AND i.outstanding_days > 14) >= 1 OR COALESCE(ROUND(AVG((i.paid_date - i.due_date)) FILTER (WHERE i.paid_date IS NOT NULL AND i.paid_date > i.due_date))::numeric, 0) > 14 THEN 'often_late'
    WHEN COUNT(i.id) FILTER (WHERE i.payment_status != 'paid') >= 1 THEN 'has_unpaid'
    ELSE 'good_payer'
  END::text AS payment_behavior
FROM clients c
LEFT JOIN team_members tm ON tm.id = c.assigned_owner_id
LEFT JOIN invoices i ON i.client_id = c.id
WHERE c.active = true
GROUP BY c.id, c.name, c.vertical, c.monthly_fee, c.payment_method, tm.name;

-- View: 6-month cash flow projection (current + next 5 months)
CREATE OR REPLACE VIEW v_cashflow_projection AS
WITH months AS (
  SELECT
    to_char(d, 'YYYY-MM') AS month_year,
    to_char(d, 'Mon YY') AS month_label,
    ROW_NUMBER() OVER (ORDER BY d) - 1 AS month_offset
  FROM generate_series(
    date_trunc('month', CURRENT_DATE)::date,
    date_trunc('month', CURRENT_DATE)::date + interval '5 months',
    '1 month'::interval
  ) AS d
)
SELECT
  m.month_year,
  m.month_label,
  (SELECT COALESCE(SUM(c.monthly_fee), 0) FROM clients c WHERE c.active = true)::numeric AS projected_revenue,
  (SELECT COALESCE(SUM(c.india_tp_transfer), 0) FROM clients c WHERE c.active = true)::numeric AS projected_tp_out,
  (SELECT COALESCE(SUM(c.monthly_fee), 0) - COALESCE(SUM(c.india_tp_transfer), 0) FROM clients c WHERE c.active = true)::numeric AS projected_us_net
FROM months m;

-- RLS for payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all payment_history" ON payment_history FOR ALL USING (true);
