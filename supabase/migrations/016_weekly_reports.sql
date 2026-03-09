-- ============================================================
-- Operations: Weekly Reports (manager submissions)
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  week_ending DATE NOT NULL,
  clients_managed INTEGER DEFAULT 0,
  books_closed_this_week INTEGER DEFAULT 0,
  books_pending_close INTEGER DEFAULT 0,
  backlog_count INTEGER DEFAULT 0,
  client_issues TEXT,
  team_issues TEXT,
  top_priorities_next_week TEXT,
  help_needed_leadership TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_weekly_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_weekly_reports_updated
  BEFORE UPDATE ON weekly_reports FOR EACH ROW EXECUTE PROCEDURE update_weekly_reports_updated_at();

CREATE INDEX idx_weekly_reports_manager_week ON weekly_reports(manager_id, week_ending);
CREATE INDEX idx_weekly_reports_week_ending ON weekly_reports(week_ending);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
