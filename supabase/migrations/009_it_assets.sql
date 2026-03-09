-- ============================================================
-- FinAcct Pulse — IT Assets & Inventory (Migration 009)
-- Sprint IT: it_domains, it_software, it_hardware, it_licenses
-- ============================================================

-- IT DOMAINS
CREATE TABLE IF NOT EXISTS it_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL CHECK (entity IN ('us', 'india', 'both')),
  domain TEXT NOT NULL,
  registrar TEXT,
  expiry_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  annual_cost NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending_renewal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IT SOFTWARE / SAAS
CREATE TABLE IF NOT EXISTS it_software (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL CHECK (entity IN ('us', 'india', 'both')),
  name TEXT NOT NULL,
  vendor TEXT,
  category TEXT,
  seats INTEGER,
  monthly_cost NUMERIC(10,2),
  renewal_date DATE,
  assigned_to TEXT,
  stored_in TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending_renewal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IT HARDWARE (assigned_to FK to team_members)
CREATE TABLE IF NOT EXISTS it_hardware (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL CHECK (entity IN ('us', 'india', 'both')),
  asset TEXT NOT NULL,
  type TEXT,
  assigned_to UUID REFERENCES team_members(id),
  serial_no TEXT,
  purchase_date DATE,
  value NUMERIC(10,2),
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IT LICENSES
CREATE TABLE IF NOT EXISTS it_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL CHECK (entity IN ('us', 'india', 'both')),
  software TEXT NOT NULL,
  license_type TEXT,
  seats INTEGER,
  expiry_date DATE,
  annual_cost NUMERIC(10,2),
  stored_in TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending_renewal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIEW: items expiring within 30 days (for alert banner)
CREATE OR REPLACE VIEW v_it_expiry_alerts AS
SELECT 'domain' AS item_type, id, entity, domain AS name, expiry_date,
  (expiry_date - CURRENT_DATE)::integer AS days_left
FROM it_domains
WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + 30 AND status != 'cancelled'
UNION ALL
SELECT 'software' AS item_type, id, entity, name, renewal_date AS expiry_date,
  (renewal_date - CURRENT_DATE)::integer AS days_left
FROM it_software
WHERE renewal_date IS NOT NULL AND renewal_date <= CURRENT_DATE + 30 AND status != 'cancelled'
UNION ALL
SELECT 'license' AS item_type, id, entity, software AS name, expiry_date,
  (expiry_date - CURRENT_DATE)::integer AS days_left
FROM it_licenses
WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + 30 AND status != 'cancelled';

-- RLS
ALTER TABLE it_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all it_domains" ON it_domains FOR ALL USING (true);
CREATE POLICY "Allow all it_software" ON it_software FOR ALL USING (true);
CREATE POLICY "Allow all it_hardware" ON it_hardware FOR ALL USING (true);
CREATE POLICY "Allow all it_licenses" ON it_licenses FOR ALL USING (true);
