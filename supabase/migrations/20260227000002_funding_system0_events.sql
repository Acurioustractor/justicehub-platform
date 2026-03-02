-- System 0 Audit Events
-- Stores scheduler ticks, policy changes, and key operational events.

CREATE TABLE IF NOT EXISTS funding_system0_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL, -- e.g. 'admin_policy', 'admin_scheduler', 'cron_scheduler'
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  run_id TEXT,
  message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funding_system0_events_created_at
  ON funding_system0_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_funding_system0_events_event_type
  ON funding_system0_events(event_type);

CREATE INDEX IF NOT EXISTS idx_funding_system0_events_source
  ON funding_system0_events(source);

CREATE INDEX IF NOT EXISTS idx_funding_system0_events_run_id
  ON funding_system0_events(run_id);
