-- Team Directory: location on team_members; extend role to include hr_manager, it_person
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS location TEXT CHECK (location IN ('US', 'India'));
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Default location from entity for existing rows
UPDATE team_members SET location = INITCAP(entity) WHERE location IS NULL AND entity IN ('us', 'india');

-- Extend role check: drop existing and add new (Postgres names it team_members_role_check)
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('admin', 'reviewer', 'hr_manager', 'it_person', 'owner', 'coordinator', 'support'));
