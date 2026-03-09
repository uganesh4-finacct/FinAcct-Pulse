-- ============================================================
-- FinAcct Pulse Sales Module — Deals & Sales Proposals
-- ============================================================

-- DEALS TABLE (pipeline: Discovery → Proposal → Negotiation → Won/Lost)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'Discovery' CHECK (stage IN (
    'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'
  )),
  value NUMERIC(12,2) DEFAULT 0,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  owner_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deals_updated
  BEFORE UPDATE ON deals FOR EACH ROW EXECUTE PROCEDURE update_deals_updated_at();

-- SALES PROPOSALS (linked to deals; distinct from marketing proposals)
CREATE TABLE IF NOT EXISTS sales_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
    'Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected'
  )),
  sent_date DATE,
  valid_until DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_sales_proposals_updated
  BEFORE UPDATE ON sales_proposals FOR EACH ROW EXECUTE PROCEDURE update_deals_updated_at();

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_proposals ENABLE ROW LEVEL SECURITY;

-- Access only via API (createServiceSupabase bypasses RLS). No policies = anon has no access.
