-- User Management: status, department, reports_to on team_members; user_permissions table
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive'));
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS reports_to_id UUID REFERENCES team_members(id);

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  module_access TEXT[] DEFAULT '{}',
  actions TEXT[] DEFAULT '{}',
  sensitive_access TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_team_member ON user_permissions(team_member_id);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages user_permissions" ON user_permissions FOR ALL USING (true);
