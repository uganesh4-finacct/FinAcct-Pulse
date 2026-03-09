-- ============================================================
-- HR Hiring Tracker: Positions and Candidates
-- ============================================================

CREATE OR REPLACE FUNCTION update_hr_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- POSITIONS (open roles to fill)
CREATE TABLE IF NOT EXISTS hiring_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('Operations', 'HR', 'IT', 'Finance')),
  location TEXT NOT NULL CHECK (location IN ('US', 'India')),
  entity TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'on_hold', 'filled')),
  target_start_date DATE,
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  description TEXT,
  requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_hiring_positions_updated
  BEFORE UPDATE ON hiring_positions FOR EACH ROW EXECUTE PROCEDURE update_hr_updated_at();

-- CANDIDATES (applicants per position)
CREATE TABLE IF NOT EXISTS hiring_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES hiring_positions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT CHECK (source IN ('Referral', 'LinkedIn', 'Naukri', 'Indeed', 'Direct', 'Agency', 'Other')),
  referral_by_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  resume_url TEXT,
  current_stage TEXT NOT NULL DEFAULT 'applied' CHECK (current_stage IN (
    'applied', 'screening', 'interview_1', 'interview_2', 'assessment', 'final', 'offer', 'hired', 'rejected', 'withdrawn'
  )),
  expected_salary NUMERIC(12,2),
  notice_period TEXT,
  notes TEXT,
  rejection_reason TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_hiring_candidates_updated
  BEFORE UPDATE ON hiring_candidates FOR EACH ROW EXECUTE PROCEDURE update_hr_updated_at();

CREATE INDEX idx_hiring_candidates_position ON hiring_candidates(position_id);
CREATE INDEX idx_hiring_candidates_stage ON hiring_candidates(current_stage);
CREATE INDEX idx_hiring_candidates_status ON hiring_candidates(status);

ALTER TABLE hiring_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_candidates ENABLE ROW LEVEL SECURITY;
