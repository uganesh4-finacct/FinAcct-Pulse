-- ============================================================
-- FinAcct Pulse Marketing Module — Migration 005
-- ============================================================

-- LEADS / PROSPECTS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  vertical TEXT CHECK (vertical IN ('Restaurant', 'Insurance', 'Property Management', 'SaaS/ITES', 'Other')),
  source TEXT CHECK (source IN ('Referral', 'LinkedIn', 'Cold Outreach', 'Inbound', 'Event', 'Partner', 'Other')),
  referral_source_name TEXT,
  city TEXT,
  estimated_monthly_value NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN (
    'New', 'Contacted', 'Qualified', 'Proposal_Sent', 'Negotiating', 'Won', 'Lost', 'On_Hold'
  )),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  lost_reason TEXT,
  won_date DATE,
  ops_activated BOOLEAN DEFAULT FALSE,
  ops_activated_date DATE,
  ops_client_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPOSALS TABLE
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  proposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  proposed_monthly_value NUMERIC(10,2),
  scope_summary TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
    'Draft', 'Sent', 'Under_Review', 'Accepted', 'Rejected', 'Revised'
  )),
  sent_date DATE,
  follow_up_date DATE,
  decision_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'Email', 'LinkedIn', 'Referral_Drive', 'Event', 'Content', 'Paid_Ad', 'Other'
  )),
  status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN (
    'Planning', 'Active', 'Paused', 'Completed', 'Cancelled'
  )),
  target_vertical TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(10,2),
  leads_generated INTEGER DEFAULT 0,
  notes TEXT,
  owned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFERRAL SOURCES TABLE
CREATE TABLE IF NOT EXISTS referral_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Individual', 'Company', 'Partner', 'Association', 'Other')),
  email TEXT,
  phone TEXT,
  total_referrals INTEGER DEFAULT 0,
  total_won INTEGER DEFAULT 0,
  total_value_won NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_marketing_updated_at();

CREATE TRIGGER trg_proposals_updated
  BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE PROCEDURE update_marketing_updated_at();

CREATE TRIGGER trg_campaigns_updated
  BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE PROCEDURE update_marketing_updated_at();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_sources ENABLE ROW LEVEL SECURITY;

-- Admin — full access
CREATE POLICY "Admin full access leads" ON leads FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access proposals" ON proposals FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access campaigns" ON campaigns FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access referrals" ON referral_sources FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Marketing/Sales/Consultant — can read and update marketing data only
CREATE POLICY "Marketing manage leads" ON leads FOR ALL USING (auth.jwt() ->> 'role' IN ('marketing', 'sales', 'consultant'));
CREATE POLICY "Marketing manage proposals" ON proposals FOR ALL USING (auth.jwt() ->> 'role' IN ('marketing', 'sales', 'consultant'));
CREATE POLICY "Marketing manage campaigns" ON campaigns FOR ALL USING (auth.jwt() ->> 'role' IN ('marketing', 'sales', 'consultant'));
CREATE POLICY "Marketing read referrals" ON referral_sources FOR SELECT USING (auth.jwt() ->> 'role' IN ('marketing', 'sales', 'consultant'));
CREATE POLICY "Marketing update referrals" ON referral_sources FOR UPDATE USING (auth.jwt() ->> 'role' IN ('marketing', 'sales', 'consultant'));

-- VIEW: Marketing Dashboard Summary
CREATE OR REPLACE VIEW v_marketing_dashboard AS
SELECT
  COUNT(*) FILTER (WHERE status NOT IN ('Won','Lost','On_Hold')) AS active_leads,
  COUNT(*) FILTER (WHERE status = 'Won') AS total_won,
  COUNT(*) FILTER (WHERE status = 'Lost') AS total_lost,
  COUNT(*) FILTER (WHERE status = 'Proposal_Sent') AS proposals_pending,
  COUNT(*) FILTER (WHERE status = 'Won' AND ops_activated = FALSE) AS pending_ops_handoff,
  COALESCE(SUM(estimated_monthly_value) FILTER (WHERE status NOT IN ('Lost','On_Hold')), 0) AS pipeline_value,
  COALESCE(SUM(estimated_monthly_value) FILTER (WHERE status = 'Won'), 0) AS won_value,
  COUNT(*) FILTER (WHERE priority = 'High' AND status NOT IN ('Won','Lost')) AS high_priority_open
FROM leads;
