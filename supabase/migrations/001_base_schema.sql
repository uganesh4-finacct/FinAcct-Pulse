-- ============================================================
-- FinAcct Pulse — Base Schema (Migration 001)
-- Run this in Supabase SQL Editor before 004 and 005 if needed.
-- ============================================================

-- TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'coordinator', 'owner', 'support')),
  role_title TEXT,
  entity TEXT NOT NULL CHECK (entity IN ('us', 'india')),
  vertical_focus TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vertical TEXT NOT NULL CHECK (vertical IN ('restaurant', 'insurance', 'property', 'saas_ites')),
  assigned_owner_id UUID REFERENCES team_members(id),
  assigned_coordinator_id UUID REFERENCES team_members(id),
  reviewer_id UUID REFERENCES team_members(id),
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  india_tp_transfer NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('qbo', 'invoice_ach', 'auto_ach', 'other')),
  contract_start_date DATE,
  deadline_day INTEGER NOT NULL DEFAULT 25,
  risk_level TEXT DEFAULT 'green' CHECK (risk_level IN ('green', 'yellow', 'red')),
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MONTHLY CLOSES
CREATE TABLE IF NOT EXISTS monthly_closes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  docs_received BOOLEAN DEFAULT false,
  bookkeeping_complete BOOLEAN DEFAULT false,
  bank_reconciled BOOLEAN DEFAULT false,
  payroll_posted BOOLEAN DEFAULT false,
  ar_ap_updated BOOLEAN DEFAULT false,
  draft_ready BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  delivered BOOLEAN DEFAULT false,
  deadline_date DATE NOT NULL,
  delivered_date DATE,
  invoice_sent BOOLEAN DEFAULT false,
  invoice_sent_date DATE,
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'delayed', 'complete')),
  risk_level TEXT NOT NULL DEFAULT 'green' CHECK (risk_level IN ('green', 'yellow', 'red')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLOSE STEPS
CREATE TABLE IF NOT EXISTS close_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_close_id UUID NOT NULL REFERENCES monthly_closes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  assigned_owner_id UUID REFERENCES team_members(id),
  due_date DATE,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete', 'blocked', 'returned')),
  return_count INTEGER DEFAULT 0,
  returned_by_id UUID REFERENCES team_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  outstanding_days INTEGER DEFAULT 0,
  aging_flag TEXT DEFAULT 'green' CHECK (aging_flag IN ('green', 'yellow', 'red')),
  tp_transfer_amount NUMERIC(10,2),
  tp_transfer_status TEXT DEFAULT 'pending' CHECK (tp_transfer_status IN ('pending', 'transferred', 'confirmed')),
  tp_transfer_date DATE,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIEW: Dashboard summary (single row)
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM clients WHERE active = true)::integer AS total_active_clients,
  (SELECT COALESCE(SUM(monthly_fee), 0) FROM clients WHERE active = true)::numeric AS total_monthly_billing,
  (SELECT COALESCE(SUM(india_tp_transfer), 0) FROM clients WHERE active = true)::numeric AS total_monthly_tp,
  (SELECT COUNT(*) FROM monthly_closes WHERE status = 'delayed')::integer AS clients_delayed,
  (SELECT COUNT(*) FROM monthly_closes WHERE status = 'at_risk')::integer AS clients_at_risk,
  (SELECT COUNT(*) FROM monthly_closes WHERE status = 'complete')::integer AS clients_complete,
  (SELECT COUNT(*) FROM invoices WHERE payment_status != 'paid')::integer AS invoices_unpaid,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE paid_date IS NULL)::numeric AS ar_outstanding,
  (SELECT COUNT(*) FROM invoices WHERE paid_date IS NULL AND outstanding_days > 20)::integer AS invoices_overdue_red,
  (SELECT COUNT(*) FROM invoices WHERE tp_transfer_status = 'pending')::integer AS tp_transfers_pending;

-- VIEW: Client risk (for dashboard and clients list)
CREATE OR REPLACE VIEW v_client_risk AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  c.vertical,
  c.monthly_fee,
  c.india_tp_transfer,
  c.deadline_day,
  tm.name AS owner_name,
  mc.id AS close_id,
  mc.month_year,
  mc.status AS close_status,
  mc.risk_level,
  mc.deadline_date,
  (mc.deadline_date - CURRENT_DATE)::integer AS days_to_deadline,
  (SELECT COUNT(*) FROM close_steps cs WHERE cs.monthly_close_id = mc.id AND cs.status = 'complete')::integer AS steps_complete,
  inv.payment_status AS invoice_status,
  inv.outstanding_days AS invoice_outstanding_days,
  inv.aging_flag AS invoice_aging,
  inv.amount AS invoice_amount,
  inv.tp_transfer_status
FROM clients c
LEFT JOIN team_members tm ON c.assigned_owner_id = tm.id
LEFT JOIN LATERAL (
  SELECT * FROM monthly_closes m
  WHERE m.client_id = c.id
  ORDER BY m.month_year DESC
  LIMIT 1
) mc ON true
LEFT JOIN LATERAL (
  SELECT * FROM invoices i
  WHERE i.client_id = c.id
  ORDER BY i.month_year DESC
  LIMIT 1
) inv ON true
WHERE c.active = true;

-- VIEW: Workload by owner
CREATE OR REPLACE VIEW v_workload_by_owner AS
SELECT
  tm.id AS team_member_id,
  tm.name,
  tm.role,
  tm.role_title,
  tm.entity,
  (SELECT COUNT(*) FROM client_assignments ca WHERE ca.team_member_id = tm.id)::integer AS client_count,
  (SELECT COALESCE(SUM(c.monthly_fee), 0) FROM client_assignments ca JOIN clients c ON c.id = ca.client_id WHERE ca.team_member_id = tm.id AND c.active = true)::numeric AS total_billing,
  (SELECT COALESCE(SUM(c.india_tp_transfer), 0) FROM client_assignments ca JOIN clients c ON c.id = ca.client_id WHERE ca.team_member_id = tm.id AND c.active = true)::numeric AS total_tp,
  (SELECT COUNT(*) FROM close_steps cs WHERE cs.assigned_owner_id = tm.id AND cs.status != 'complete')::integer AS open_steps,
  (SELECT COUNT(*) FROM close_steps cs WHERE cs.assigned_owner_id = tm.id AND cs.status != 'complete' AND cs.due_date < CURRENT_DATE)::integer AS overdue_steps,
  0::integer AS returned_steps,
  CASE
    WHEN (SELECT COUNT(*) FROM close_steps cs WHERE cs.assigned_owner_id = tm.id AND cs.status != 'complete' AND cs.due_date < CURRENT_DATE) > 5 THEN 'overloaded'
    WHEN (SELECT COUNT(*) FROM close_steps cs WHERE cs.assigned_owner_id = tm.id AND cs.status != 'complete') > 10 THEN 'at_capacity'
    ELSE 'normal'
  END::text AS load_status
FROM team_members tm
WHERE tm.active = true;

-- RLS (allow all for now so service role works; tighten later with auth)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_closes ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all monthly_closes" ON monthly_closes FOR ALL USING (true);
CREATE POLICY "Allow all close_steps" ON close_steps FOR ALL USING (true);
CREATE POLICY "Allow all invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all client_assignments" ON client_assignments FOR ALL USING (true);
