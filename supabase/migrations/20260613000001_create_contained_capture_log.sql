-- ============================================================================
-- contained_capture_log — durable-first capture spine for the CONTAINED funnel
-- ----------------------------------------------------------------------------
-- WHY: On 12 June 2026 a real register-interest submission was lost during a
-- crawl-saturation 504. The capture routes (signup / connect / host) called
-- GoHighLevel as their only durable write, and upsertContact swallows failures
-- to null, so a GHL outage lost the lead with a success response.
--
-- This append-only table is written BEFORE any GHL call, so a GHL failure can
-- never lose the lead. Routes backfill ghl_contact_id / ghl_synced / receipt_sent
-- after the GHL upsert and receipt send succeed. An un-synced row is replayable;
-- it is never lost.
--
-- Writers: /api/ghl/signup, /api/contained/connect, /api/contained/host (service
-- role, bypasses RLS). Readers: admin surfaces (service role). RLS is enabled
-- with an admin-only policy mirroring contact_submissions; inserts come via the
-- service role.
-- ============================================================================

CREATE TABLE IF NOT EXISTS contained_capture_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route          TEXT NOT NULL,                          -- 'signup' | 'connect' | 'host'
  email          TEXT NOT NULL,
  name           TEXT,
  role           TEXT,                                   -- member_type / connect role / 'host'
  payload        JSONB NOT NULL DEFAULT '{}'::jsonb,     -- sanitised form fields
  ghl_contact_id TEXT,                                   -- backfilled after a successful GHL upsert
  ghl_synced     BOOLEAN NOT NULL DEFAULT FALSE,
  receipt_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contained_capture_email    ON contained_capture_log(email);
CREATE INDEX IF NOT EXISTS idx_contained_capture_unsynced ON contained_capture_log(ghl_synced) WHERE ghl_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_contained_capture_created  ON contained_capture_log(created_at DESC);

ALTER TABLE contained_capture_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Admin-only read/manage; inserts and backfills come via the service role,
  -- which bypasses RLS. Mirrors the contact_submissions admin policy.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contained_capture_log'
      AND policyname = 'Admins can manage contained capture log'
  ) THEN
    CREATE POLICY "Admins can manage contained capture log" ON contained_capture_log
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
