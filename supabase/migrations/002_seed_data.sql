-- ============================================================
-- FinAcct Pulse — Seed Data (Migration 002)
-- Run after 001_base_schema.sql. Inserts sample data so you see something.
-- ============================================================

-- Team members
INSERT INTO team_members (id, name, email, role, role_title, entity, active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Ganesh', 'ganesh@finacct.com', 'admin', 'MD', 'us', true),
  ('11111111-1111-1111-1111-111111111102', 'Alex', 'alex@finacct.com', 'owner', 'Owner', 'us', true),
  ('11111111-1111-1111-1111-111111111103', 'Priya', 'priya@finacct.com', 'reviewer', 'Reviewer', 'india', true)
ON CONFLICT (id) DO NOTHING;

-- Clients (reference owner above; fixed IDs so re-run doesn't duplicate)
INSERT INTO clients (id, name, vertical, assigned_owner_id, monthly_fee, india_tp_transfer, payment_method, deadline_day, risk_level, active) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Acme Restaurant Group', 'restaurant', '11111111-1111-1111-1111-111111111102', 3500, 3150, 'qbo', 25, 'green', true),
  ('22222222-2222-2222-2222-222222222202', 'Metro Insurance Co', 'insurance', '11111111-1111-1111-1111-111111111102', 5200, 4680, 'invoice_ach', 20, 'yellow', true),
  ('22222222-2222-2222-2222-222222222203', 'Sunrise Property Mgmt', 'property', '11111111-1111-1111-1111-111111111102', 2800, 2520, 'qbo', 28, 'green', true)
ON CONFLICT (id) DO NOTHING;

-- Client assignments (link clients to owner)
INSERT INTO client_assignments (client_id, team_member_id) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102');

-- Invoices (sample) — only if no invoices yet
INSERT INTO invoices (client_id, month_year, invoice_date, amount, due_date, paid_date, payment_status, outstanding_days, aging_flag, tp_transfer_amount, tp_transfer_status)
SELECT c.id, to_char(CURRENT_DATE - interval '1 month', 'YYYY-MM'), (date_trunc('month', CURRENT_DATE) - interval '1 month')::date + 5, c.monthly_fee, (date_trunc('month', CURRENT_DATE) - interval '1 month')::date + 25, NULL, 'unpaid', 15, 'yellow', c.india_tp_transfer, 'pending'
FROM clients c
WHERE NOT EXISTS (SELECT 1 FROM invoices LIMIT 1)
LIMIT 2;
