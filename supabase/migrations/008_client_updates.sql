-- ============================================================
-- FinAcct Pulse — Client Updates & Review Periods (Migration 008)
-- Sprint 2A: review_periods, client_updates, update_action_items
-- ============================================================

-- Escalations table (if not exists) for FK from client_updates
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  raised_by_id UUID REFERENCES team_members(id),
  title TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEW PERIODS
CREATE TABLE IF NOT EXISTS review_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'biweekly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENT UPDATES
CREATE TABLE IF NOT EXISTS client_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_period_id UUID NOT NULL REFERENCES review_periods(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES team_members(id),
  close_status TEXT NOT NULL DEFAULT 'on_track' CHECK (close_status IN ('on_track', 'at_risk', 'delayed', 'complete')),
  client_call_held BOOLEAN DEFAULT false,
  call_date DATE,
  call_notes TEXT,
  action_items_count INTEGER NOT NULL DEFAULT 0,
  team_performance_notes TEXT,
  escalation_raised BOOLEAN DEFAULT false,
  escalation_id UUID REFERENCES escalations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewed')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_period_id, client_id)
);

-- UPDATE ACTION ITEMS
CREATE TABLE IF NOT EXISTS update_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_update_id UUID NOT NULL REFERENCES client_updates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  owner TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIEW: v_review_summary — per review period stats
CREATE OR REPLACE VIEW v_review_summary AS
SELECT
  rp.id AS review_period_id,
  rp.title,
  rp.period_type,
  rp.start_date,
  rp.end_date,
  rp.status,
  COUNT(cu.id)::integer AS total_clients,
  COUNT(cu.id) FILTER (WHERE cu.status = 'submitted')::integer AS submitted_count,
  COUNT(cu.id) FILTER (WHERE cu.status = 'pending')::integer AS pending_count,
  COUNT(cu.id) FILTER (WHERE cu.close_status = 'at_risk')::integer AS at_risk_count,
  COUNT(cu.id) FILTER (WHERE cu.escalation_raised = true)::integer AS escalations_count,
  CASE
    WHEN COUNT(cu.id) = 0 THEN 0
    ELSE ROUND(100.0 * COUNT(cu.id) FILTER (WHERE cu.status IN ('submitted', 'reviewed')) / NULLIF(COUNT(cu.id), 0), 1)
  END::numeric AS completion_percentage
FROM review_periods rp
LEFT JOIN client_updates cu ON cu.review_period_id = rp.id
GROUP BY rp.id, rp.title, rp.period_type, rp.start_date, rp.end_date, rp.status;

-- VIEW: v_my_pending_updates
CREATE OR REPLACE VIEW v_my_pending_updates AS
SELECT
  cu.id AS client_update_id,
  cu.assigned_to,
  cu.status AS update_status,
  c.id AS client_id,
  c.name AS client_name,
  c.vertical,
  rp.id AS review_period_id,
  rp.title AS period_title,
  rp.end_date AS period_end_date,
  (rp.end_date - CURRENT_DATE)::integer AS days_until_due
FROM client_updates cu
JOIN clients c ON c.id = cu.client_id
JOIN review_periods rp ON rp.id = cu.review_period_id
WHERE cu.status IN ('pending', 'submitted');

-- RLS
ALTER TABLE review_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all review_periods" ON review_periods FOR ALL USING (true);
CREATE POLICY "Allow all client_updates" ON client_updates FOR ALL USING (true);
CREATE POLICY "Allow all update_action_items" ON update_action_items FOR ALL USING (true);
