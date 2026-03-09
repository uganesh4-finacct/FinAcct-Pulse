-- ============================================================
-- FinAcct Pulse — Offer Approval (Dynamic Approvers)
-- Add columns to hr_candidates for approver 1/2 and approval state.
-- If using legacy "candidates" table, run the same ALTER on candidates.
-- ============================================================

-- hr_candidates (spec table)
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS offer_approver_1_id uuid REFERENCES team_members(id);
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS offer_approver_2_id uuid REFERENCES team_members(id);
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS offer_approver_1_approved boolean DEFAULT false;
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS offer_approver_2_approved boolean DEFAULT false;
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS offer_approver_1_date timestamptz;
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS offer_approver_2_date timestamptz;
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS offer_sent_date date;
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS rejection_notes text;
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS rejected_by_id uuid REFERENCES team_members(id);
ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS rejected_date timestamptz;

-- Optional: drop old fixed-approver columns if they exist
-- ALTER TABLE hr_candidates DROP COLUMN IF EXISTS offer_approved_by_ganesh;
-- ALTER TABLE hr_candidates DROP COLUMN IF EXISTS offer_approved_by_rajiv;

-- Legacy candidates table (for projects still using it)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_approver_1_id uuid REFERENCES team_members(id);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_approver_2_id uuid REFERENCES team_members(id);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_approver_1_approved boolean DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_approver_2_approved boolean DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_approver_1_date timestamptz;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_approver_2_date timestamptz;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_sent_date date;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS rejection_notes text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS rejected_by_id uuid REFERENCES team_members(id);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS rejected_date timestamptz;
