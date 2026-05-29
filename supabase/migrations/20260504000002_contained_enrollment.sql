-- Contained enrollment: codes minted per tour stop, device sessions tracked per visitor.
-- Tables back the API routes at /api/enrollment/{validate,enroll,session,recommend,upgrade}.

BEGIN;

CREATE TABLE IF NOT EXISTS enrollment_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  project_slug    text NOT NULL DEFAULT 'contained',
  event_name      text,
  tour_stop_slug  text,                  -- links to tour_stops.event_slug
  max_uses        integer,               -- NULL means unlimited
  current_uses    integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  expires_at      timestamptz,
  notes           text,
  created_by      uuid,                  -- admin profiles.id
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_codes_code ON enrollment_codes (code);
CREATE INDEX IF NOT EXISTS idx_enrollment_codes_active ON enrollment_codes (is_active) WHERE is_active;

CREATE TABLE IF NOT EXISTS device_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id        uuid NOT NULL,                              -- supabase auth.users id (anonymous)
  enrollment_code_id  uuid REFERENCES enrollment_codes(id) ON DELETE SET NULL,
  display_name        text,
  phone               text,
  location_lat        numeric,
  location_lng        numeric,
  location_text       text,
  project_slug        text NOT NULL DEFAULT 'contained',
  el_profile_id       text,                                       -- empathy ledger profile
  el_storyteller_id   text,
  is_upgraded         boolean NOT NULL DEFAULT false,             -- consent escalated to public storyteller
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  enrolled_at         timestamptz NOT NULL DEFAULT now(),
  last_active_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_auth_user ON device_sessions (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_code ON device_sessions (enrollment_code_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_enrolled ON device_sessions (enrolled_at DESC);

-- RLS: codes are readable by service role only (validate API uses service client).
-- device_sessions same: written by service role through enroll API.
ALTER TABLE enrollment_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions  ENABLE ROW LEVEL SECURITY;

-- Admins can manage codes via the admin UI.
CREATE POLICY enrollment_codes_admin_all ON enrollment_codes
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY device_sessions_admin_read ON device_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- A visitor can read their own session.
CREATE POLICY device_sessions_self_read ON device_sessions FOR SELECT
  USING (auth_user_id = auth.uid());

-- Seed: one code per tour stop + a master demo code for testing.
-- Codes are uppercase. Format: CONT-<5 char stop tag>.
INSERT INTO enrollment_codes (code, project_slug, event_name, tour_stop_slug, max_uses, notes) VALUES
  ('CONT-DEMO',  'contained', 'Demo / Internal Testing',           NULL,                          NULL,  'Internal demo code, never expires, unlimited uses.'),
  ('CONT-ADEL',  'contained', 'Adelaide · Tandanya',                'contained-adelaide-tandanya',  500,   'Reintegration Puzzle Conference + 2 month public weeks.'),
  ('CONT-PERTH', 'contained', 'Perth + surrounds',                  'contained-perth-uwa',          500,   'UWA + Reconciliation WA + DOJ WA delegated authority pilot.'),
  ('CONT-MPAR',  'contained', 'Mparntwe + Tennant Creek',           'contained-mparntwe',           300,   'Oonchiumpa community-controlled. 6 weeks.'),
  ('CONT-BRIS',  'contained', 'Brisbane',                           'contained-brisbane',           400,   'YAC + EPIC Pathways. 1 month.'),
  ('CONT-NRIV',  'contained', 'Northern Rivers',                    'contained-northern-rivers',    300,   'The Buttery partnership. 1 month.'),
  ('CONT-SYD',   'contained', 'Sydney',                             'contained-sydney',             400,   'Uniting + USyd. 1 month.'),
  ('CONT-CBR',   'contained', 'Canberra',                           'contained-canberra',           300,   'Lawns of Parliament House. 3 weeks.'),
  ('CONT-MELB',  'contained', 'Melbourne',                          'contained-melbourne',          400,   'St Martins Youth Arts + RMIT. 1 month.'),
  ('CONT-HOB',   'contained', 'Hobart',                             'contained-hobart',             300,   'DarkLab + Prevention Not Detention Tasmania. 1 month.')
ON CONFLICT (code) DO NOTHING;

COMMIT;
