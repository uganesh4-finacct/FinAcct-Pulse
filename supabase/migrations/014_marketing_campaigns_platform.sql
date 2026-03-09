-- Marketing: campaigns platform + spent; leads attachment_url
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('Google', 'Meta', 'LinkedIn'));
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS spent NUMERIC(10,2) DEFAULT 0;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;
-- Lead owner by team_member (optional; keep assigned_to for auth.user)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_owner_id UUID REFERENCES team_members(id);
