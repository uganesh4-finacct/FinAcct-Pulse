-- ============================================================
-- FinAcct Pulse — Service Tracks & Custom Close Steps (010)
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS service_track TEXT DEFAULT 'accounting' CHECK (service_track IN ('accounting', 'non_accounting')),
  ADD COLUMN IF NOT EXISTS service_description TEXT;

ALTER TABLE close_steps
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
