-- ============================================================
-- IT Module: extend it_hardware, it_domains; add v_it_dashboard
-- ============================================================

-- Extend it_hardware (asset inventory)
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS asset_tag TEXT;
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'spare', 'in_repair', 'retired', 'lost'));
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS warranty_expiry DATE;
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS specs TEXT;
ALTER TABLE it_hardware ADD COLUMN IF NOT EXISTS notes TEXT;
UPDATE it_hardware SET status = 'active' WHERE status IS NULL;

-- Extend it_domains
ALTER TABLE it_domains ADD COLUMN IF NOT EXISTS registration_date DATE;
ALTER TABLE it_domains ADD COLUMN IF NOT EXISTS dns_provider TEXT;
ALTER TABLE it_domains ADD COLUMN IF NOT EXISTS ssl_provider TEXT;
ALTER TABLE it_domains ADD COLUMN IF NOT EXISTS ssl_expiry_date DATE;
ALTER TABLE it_domains ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE it_domains ADD COLUMN IF NOT EXISTS notes TEXT;

-- Normalize entity for display: keep us/india/both, view maps to US/India
CREATE OR REPLACE VIEW v_it_dashboard AS
SELECT
  (SELECT COUNT(*) FROM it_hardware WHERE status = 'active')::integer AS active_hardware,
  (SELECT COUNT(*) FROM it_hardware WHERE status = 'spare')::integer AS spare_equipment,
  (SELECT COUNT(*) FROM it_hardware WHERE status = 'in_repair')::integer AS in_repair,
  (SELECT COUNT(*) FROM it_hardware WHERE warranty_expiry IS NOT NULL AND warranty_expiry > CURRENT_DATE AND warranty_expiry <= CURRENT_DATE + 30)::integer AS warranty_expiring_soon,
  (SELECT COUNT(*) FROM it_domains WHERE status = 'active')::integer AS active_domains,
  (SELECT COUNT(*) FROM it_domains WHERE expiry_date IS NOT NULL AND expiry_date > CURRENT_DATE AND expiry_date <= CURRENT_DATE + 30 AND status != 'cancelled')::integer AS domains_expiring_soon,
  (SELECT COUNT(*) FROM it_domains WHERE ssl_expiry_date IS NOT NULL AND ssl_expiry_date > CURRENT_DATE AND ssl_expiry_date <= CURRENT_DATE + 30)::integer AS ssl_expiring_soon,
  (SELECT COUNT(*) FROM it_hardware WHERE entity IN ('us', 'both') AND status = 'active' AND (type = 'laptop' OR LOWER(COALESCE(type, '')) = 'laptop'))::integer AS us_laptops,
  (SELECT COUNT(*) FROM it_hardware WHERE entity IN ('us', 'both') AND status = 'active' AND (type = 'monitor' OR LOWER(COALESCE(type, '')) = 'monitor'))::integer AS us_monitors,
  (SELECT COUNT(*) FROM it_hardware WHERE entity IN ('us', 'both') AND status = 'active' AND COALESCE(LOWER(type), '') NOT IN ('laptop', 'monitor'))::integer AS us_other,
  (SELECT COUNT(*) FROM it_hardware WHERE entity IN ('india', 'both') AND status = 'active' AND (type = 'laptop' OR LOWER(COALESCE(type, '')) = 'laptop'))::integer AS india_laptops,
  (SELECT COUNT(*) FROM it_hardware WHERE entity IN ('india', 'both') AND status = 'active' AND (type = 'monitor' OR LOWER(COALESCE(type, '')) = 'monitor'))::integer AS india_monitors,
  (SELECT COUNT(*) FROM it_hardware WHERE entity IN ('india', 'both') AND status = 'active' AND COALESCE(LOWER(type), '') NOT IN ('laptop', 'monitor'))::integer AS india_other;
