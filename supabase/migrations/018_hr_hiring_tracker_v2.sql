-- ============================================================
-- HR Hiring Tracker v2: Industries, Stages, Sources, Stage History
-- Expanded positions & candidates schema
-- ============================================================

-- Reference: Industries (for position dropdown)
CREATE TABLE IF NOT EXISTS hiring_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);

-- Reference: Pipeline stages (for Kanban and stage dropdown)
CREATE TABLE IF NOT EXISTS hiring_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6b7280',
  sort_order INT NOT NULL DEFAULT 0,
  is_terminal BOOLEAN NOT NULL DEFAULT false
);

-- Reference: Candidate sources
CREATE TABLE IF NOT EXISTS hiring_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);

-- Seed industries
INSERT INTO hiring_industries (id, name, sort_order) VALUES
  (gen_random_uuid(), 'Accounting', 1),
  (gen_random_uuid(), 'Finance', 2),
  (gen_random_uuid(), 'Technology', 3),
  (gen_random_uuid(), 'Healthcare', 4),
  (gen_random_uuid(), 'Other', 99)
ON CONFLICT (name) DO NOTHING;

-- Seed stages
INSERT INTO hiring_stages (id, name, slug, color, sort_order, is_terminal) VALUES
  (gen_random_uuid(), 'Sourced', 'sourced', '#64748b', 1, false),
  (gen_random_uuid(), 'Screening Call', 'screening', '#3b82f6', 2, false),
  (gen_random_uuid(), 'Technical Interview', 'technical', '#8b5cf6', 3, false),
  (gen_random_uuid(), 'Client Interview', 'client_interview', '#a855f7', 4, false),
  (gen_random_uuid(), 'Offer', 'offer', '#10b981', 5, false),
  (gen_random_uuid(), 'Joined', 'joined', '#22c55e', 6, true),
  (gen_random_uuid(), 'Rejected', 'rejected', '#ef4444', 7, true),
  (gen_random_uuid(), 'Withdrawn', 'withdrawn', '#6b7280', 8, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed sources
INSERT INTO hiring_sources (id, name, sort_order) VALUES
  (gen_random_uuid(), 'Referral', 1),
  (gen_random_uuid(), 'LinkedIn', 2),
  (gen_random_uuid(), 'Naukri', 3),
  (gen_random_uuid(), 'Indeed', 4),
  (gen_random_uuid(), 'Direct', 5),
  (gen_random_uuid(), 'Agency', 6),
  (gen_random_uuid(), 'Other', 99)
ON CONFLICT (name) DO NOTHING;

-- Alter hiring_positions: add new columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'client_project') THEN
    ALTER TABLE hiring_positions ADD COLUMN client_project TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'industry_id') THEN
    ALTER TABLE hiring_positions ADD COLUMN industry_id UUID REFERENCES hiring_industries(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'number_of_positions') THEN
    ALTER TABLE hiring_positions ADD COLUMN number_of_positions INT NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'experience') THEN
    ALTER TABLE hiring_positions ADD COLUMN experience TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'core_skills') THEN
    ALTER TABLE hiring_positions ADD COLUMN core_skills TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'must_have_skills') THEN
    ALTER TABLE hiring_positions ADD COLUMN must_have_skills TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'preferred_skills') THEN
    ALTER TABLE hiring_positions ADD COLUMN preferred_skills TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'reject_if') THEN
    ALTER TABLE hiring_positions ADD COLUMN reject_if TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'reporting_to') THEN
    ALTER TABLE hiring_positions ADD COLUMN reporting_to TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'hiring_owner_id') THEN
    ALTER TABLE hiring_positions ADD COLUMN hiring_owner_id UUID REFERENCES team_members(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'currency') THEN
    ALTER TABLE hiring_positions ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'notes') THEN
    ALTER TABLE hiring_positions ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_positions' AND column_name = 'job_description') THEN
    ALTER TABLE hiring_positions ADD COLUMN job_description TEXT;
  END IF;
END $$;

ALTER TABLE hiring_positions DROP CONSTRAINT IF EXISTS hiring_positions_status_check;
ALTER TABLE hiring_positions ADD CONSTRAINT hiring_positions_status_check
  CHECK (status IN ('draft', 'open', 'on_hold', 'filled', 'cancelled'));

ALTER TABLE hiring_positions DROP CONSTRAINT IF EXISTS hiring_positions_priority_check;
ALTER TABLE hiring_positions ADD CONSTRAINT hiring_positions_priority_check
  CHECK (priority IN ('Critical', 'High', 'Medium', 'Low'));

-- Alter hiring_candidates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'current_stage_id') THEN
    ALTER TABLE hiring_candidates ADD COLUMN current_stage_id UUID REFERENCES hiring_stages(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'source_id') THEN
    ALTER TABLE hiring_candidates ADD COLUMN source_id UUID REFERENCES hiring_sources(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'location') THEN
    ALTER TABLE hiring_candidates ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'referred_by_external') THEN
    ALTER TABLE hiring_candidates ADD COLUMN referred_by_external TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'linkedin_url') THEN
    ALTER TABLE hiring_candidates ADD COLUMN linkedin_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'portfolio_url') THEN
    ALTER TABLE hiring_candidates ADD COLUMN portfolio_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'current_salary') THEN
    ALTER TABLE hiring_candidates ADD COLUMN current_salary NUMERIC(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'applied_date') THEN
    ALTER TABLE hiring_candidates ADD COLUMN applied_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'technical_score') THEN
    ALTER TABLE hiring_candidates ADD COLUMN technical_score INT CHECK (technical_score >= 1 AND technical_score <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'technical_notes') THEN
    ALTER TABLE hiring_candidates ADD COLUMN technical_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'client_interview_notes') THEN
    ALTER TABLE hiring_candidates ADD COLUMN client_interview_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hiring_candidates' AND column_name = 'overall_rating') THEN
    ALTER TABLE hiring_candidates ADD COLUMN overall_rating INT CHECK (overall_rating >= 1 AND overall_rating <= 5);
  END IF;
END $$;

ALTER TABLE hiring_candidates DROP CONSTRAINT IF EXISTS hiring_candidates_status_check;
ALTER TABLE hiring_candidates ADD CONSTRAINT hiring_candidates_status_check
  CHECK (status IN ('active', 'on_hold', 'rejected', 'withdrawn'));

-- Backfill current_stage_id from first stage
DO $$
DECLARE
  first_stage_id UUID;
BEGIN
  SELECT id INTO first_stage_id FROM hiring_stages ORDER BY sort_order ASC LIMIT 1;
  IF first_stage_id IS NOT NULL THEN
    UPDATE hiring_candidates SET current_stage_id = first_stage_id WHERE current_stage_id IS NULL;
  END IF;
END $$;

-- Stage history
CREATE TABLE IF NOT EXISTS hiring_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES hiring_candidates(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES hiring_stages(id) ON DELETE CASCADE,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moved_by_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_hiring_stage_history_candidate ON hiring_stage_history(candidate_id);
ALTER TABLE hiring_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_sources ENABLE ROW LEVEL SECURITY;
