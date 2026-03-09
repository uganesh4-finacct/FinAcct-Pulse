-- ============================================================
-- Client Billing: add columns to clients for billing config
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'billing_type') THEN
    ALTER TABLE clients ADD COLUMN billing_type TEXT CHECK (billing_type IN ('fixed', 'variable', 'retainer'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'billing_start_date') THEN
    ALTER TABLE clients ADD COLUMN billing_start_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'payment_terms') THEN
    ALTER TABLE clients ADD COLUMN payment_terms INT DEFAULT 7;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'billing_contact_email') THEN
    ALTER TABLE clients ADD COLUMN billing_contact_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'billing_notes') THEN
    ALTER TABLE clients ADD COLUMN billing_notes TEXT;
  END IF;
END $$;
