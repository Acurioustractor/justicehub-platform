-- Device enrollment system for Contained installation visitors
-- Frictionless QR-code-based enrollment with anonymous Supabase auth

-- 1. Enrollment codes (shared per event/installation)
CREATE TABLE enrollment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  project_slug TEXT DEFAULT 'contained',
  event_name TEXT,
  created_by UUID REFERENCES profiles(id),
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enrollment_codes_code ON enrollment_codes(code);
CREATE INDEX idx_enrollment_codes_active ON enrollment_codes(is_active) WHERE is_active = true;

-- 2. Device sessions (persistent anonymous visitor sessions)
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_code_id UUID REFERENCES enrollment_codes(id),
  display_name TEXT DEFAULT 'Visitor',
  phone TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_text TEXT,
  project_slug TEXT DEFAULT 'contained',
  jh_profile_id UUID,
  el_profile_id UUID,
  el_storyteller_id UUID,
  is_upgraded BOOLEAN DEFAULT false,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_device_sessions_auth_user ON device_sessions(auth_user_id);
CREATE INDEX idx_device_sessions_project ON device_sessions(project_slug);

-- 3. Visitor recommendations ("who else should see this?")
CREATE TABLE visitor_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_session_id UUID NOT NULL REFERENCES device_sessions(id),
  recommended_name TEXT,
  recommended_email TEXT,
  recommended_phone TEXT,
  recommended_role TEXT,
  reason TEXT,
  sent_invite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_visitor_recommendations_session ON visitor_recommendations(device_session_id);

-- 4. Link existing tables to device sessions
ALTER TABLE community_reflections ADD COLUMN IF NOT EXISTS device_session_id UUID REFERENCES device_sessions(id);
ALTER TABLE tour_reactions ADD COLUMN IF NOT EXISTS device_session_id UUID REFERENCES device_sessions(id);

-- 5. RLS policies

-- enrollment_codes: public can validate, admins manage
ALTER TABLE enrollment_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active codes"
  ON enrollment_codes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage codes"
  ON enrollment_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- device_sessions: users see own, admins see all
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own device sessions"
  ON device_sessions FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON device_sessions FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "Service role can insert sessions"
  ON device_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins see all sessions"
  ON device_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- visitor_recommendations: users manage own, admins see all
ALTER TABLE visitor_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recommendations"
  ON visitor_recommendations FOR ALL
  USING (
    device_session_id IN (SELECT id FROM device_sessions WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Admins see all recommendations"
  ON visitor_recommendations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
