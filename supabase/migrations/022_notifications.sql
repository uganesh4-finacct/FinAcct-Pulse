-- ============================================================
-- Notifications: types, preferences, in-app notifications
-- ============================================================

-- Notification types (code used in createNotification)
CREATE TABLE IF NOT EXISTS notification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('operations', 'finance', 'hr', 'it', 'system')),
  default_email BOOLEAN DEFAULT true,
  default_in_app BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences per type (overrides defaults)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  type_id UUID NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type_id)
);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  type_id UUID REFERENCES notification_types(id) ON DELETE SET NULL,
  type_code TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link_url TEXT,
  link_label TEXT,
  reference_type TEXT,
  reference_id TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all notification_types" ON notification_types FOR ALL USING (true);
CREATE POLICY "Users own notification_preferences" ON notification_preferences FOR ALL USING (true);
CREATE POLICY "Users own notifications" ON notifications FOR ALL USING (true);

-- Seed notification types
INSERT INTO notification_types (code, name, category, default_email, default_in_app) VALUES
  ('close_delay', 'Close Delayed', 'operations', true, true),
  ('invoice_overdue', 'Invoice Overdue', 'finance', true, true),
  ('invoice_overdue_critical', 'Invoice Overdue (30+ days)', 'finance', true, true),
  ('payment_received', 'Payment Received', 'finance', true, true),
  ('hiring_stage_change', 'Hiring Stage Change', 'hr', true, true)
ON CONFLICT (code) DO NOTHING;
