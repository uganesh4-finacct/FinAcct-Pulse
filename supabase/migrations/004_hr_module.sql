-- ============================================================
-- FinAcct Pulse HR Module — Migration 004
-- ============================================================

-- MARKET RATES REFERENCE TABLE
CREATE TABLE IF NOT EXISTS market_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  city TEXT NOT NULL,
  market_rate_min NUMERIC(10,2) NOT NULL,
  market_rate_max NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  last_updated DATE DEFAULT CURRENT_DATE,
  UNIQUE(job_title, city)
);

-- REQUISITIONS TABLE
CREATE TABLE IF NOT EXISTS requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  skill_requirements TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT NOT NULL CHECK (experience_level IN ('Entry', 'Mid', 'Senior', 'Lead')),
  city TEXT NOT NULL,
  budget_amount NUMERIC(10,2) NOT NULL,
  client_billing_rate NUMERIC(10,2),
  urgency TEXT NOT NULL DEFAULT 'Medium' CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Sourcing', 'Interviews_Scheduled', 'Offers_Out', 'Closed_Hired', 'On_Hold', 'Cancelled')),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  experience_years NUMERIC(4,1),
  current_salary NUMERIC(10,2),
  expected_salary NUMERIC(10,2),
  cv_file_url TEXT,
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  match_notes TEXT,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewed', 'Interview_Scheduled', 'Interview_Completed', 'Offered', 'Rejected', 'On_Hold')),
  interview_feedback TEXT,
  offer_amount NUMERIC(10,2),
  offer_date DATE,
  recruiter_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS requisition_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('Created', 'Status_Changed', 'Budget_Updated', 'Candidate_Added', 'Interview_Scheduled', 'Offer_Released', 'Note_Added', 'Candidate_Rejected')),
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_hr_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_requisitions_updated
  BEFORE UPDATE ON requisitions
  FOR EACH ROW EXECUTE PROCEDURE update_hr_updated_at();

CREATE TRIGGER trg_candidates_updated
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE PROCEDURE update_hr_updated_at();

-- RLS
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_rates ENABLE ROW LEVEL SECURITY;

-- Admin (Ganesh) — full access to all
CREATE POLICY "Admin full access requisitions" ON requisitions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access candidates" ON candidates FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access activity" ON requisition_activity_log FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access market_rates" ON market_rates FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- HR and Recruiter — can read/update requisitions and candidates but NOT client_billing_rate (enforce in app layer)
CREATE POLICY "HR read requisitions" ON requisitions FOR SELECT USING (auth.jwt() ->> 'role' IN ('hr', 'recruiter', 'reviewer'));
CREATE POLICY "HR update requisitions" ON requisitions FOR UPDATE USING (auth.jwt() ->> 'role' IN ('hr', 'recruiter'));
CREATE POLICY "HR manage candidates" ON candidates FOR ALL USING (auth.jwt() ->> 'role' IN ('hr', 'recruiter', 'reviewer'));
CREATE POLICY "HR read activity" ON requisition_activity_log FOR SELECT USING (auth.jwt() ->> 'role' IN ('hr', 'recruiter', 'reviewer'));
CREATE POLICY "HR insert activity" ON requisition_activity_log FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('hr', 'recruiter'));
CREATE POLICY "All read market_rates" ON market_rates FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'hr', 'recruiter', 'reviewer'));

-- VIEW: HR Dashboard Summary
CREATE OR REPLACE VIEW v_hr_dashboard AS
SELECT
  COUNT(*) FILTER (WHERE status = 'Open') AS open_reqs,
  COUNT(*) FILTER (WHERE status = 'Sourcing') AS sourcing,
  COUNT(*) FILTER (WHERE status = 'Interviews_Scheduled') AS in_interviews,
  COUNT(*) FILTER (WHERE status = 'Offers_Out') AS offers_out,
  COUNT(*) FILTER (WHERE status = 'Closed_Hired') AS closed_this_month,
  COUNT(*) FILTER (WHERE status IN ('Open','Sourcing','Interviews_Scheduled','Offers_Out')) AS total_active,
  COUNT(*) FILTER (WHERE urgency = 'Critical' AND status NOT IN ('Closed_Hired','Cancelled')) AS critical_open,
  COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '2 days' AND status NOT IN ('Closed_Hired','Cancelled')) AS stale_reqs
FROM requisitions;

-- SEED MARKET RATES (US cities, accounting roles)
INSERT INTO market_rates (job_title, city, market_rate_min, market_rate_max) VALUES
('Bookkeeper', 'Miami', 42000, 58000),
('Bookkeeper', 'New York', 52000, 70000),
('Bookkeeper', 'Los Angeles', 48000, 65000),
('Bookkeeper', 'Chicago', 44000, 60000),
('Bookkeeper', 'Houston', 40000, 55000),
('Staff Accountant', 'Miami', 52000, 72000),
('Staff Accountant', 'New York', 65000, 90000),
('Staff Accountant', 'Los Angeles', 60000, 82000),
('Staff Accountant', 'Chicago', 55000, 75000),
('Staff Accountant', 'Houston', 50000, 68000),
('Senior Accountant', 'Miami', 72000, 95000),
('Senior Accountant', 'New York', 90000, 125000),
('Senior Accountant', 'Los Angeles', 85000, 115000),
('Senior Accountant', 'Chicago', 75000, 100000),
('Senior Accountant', 'Houston', 68000, 92000),
('Accounting Manager', 'Miami', 90000, 120000),
('Accounting Manager', 'New York', 115000, 155000),
('Accounting Manager', 'Los Angeles', 105000, 145000),
('Accounting Manager', 'Chicago', 95000, 130000),
('Accounting Manager', 'Houston', 88000, 118000),
('Controller', 'Miami', 110000, 150000),
('Controller', 'New York', 140000, 190000),
('Controller', 'Los Angeles', 130000, 175000),
('Controller', 'Chicago', 120000, 160000),
('Controller', 'Houston', 108000, 145000),
('Payroll Specialist', 'Miami', 45000, 62000),
('Payroll Specialist', 'New York', 58000, 80000),
('Payroll Specialist', 'Los Angeles', 52000, 72000),
('Payroll Specialist', 'Chicago', 48000, 65000),
('Payroll Specialist', 'Houston', 44000, 60000),
('Tax Accountant', 'Miami', 58000, 85000),
('Tax Accountant', 'New York', 75000, 110000),
('Tax Accountant', 'Los Angeles', 70000, 100000),
('Tax Accountant', 'Chicago', 63000, 90000),
('Tax Accountant', 'Houston', 58000, 82000)
ON CONFLICT (job_title, city) DO NOTHING;
