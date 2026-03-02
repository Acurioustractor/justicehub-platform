-- System 0 Autopilot Policy
-- Single-row policy table used by scheduler, worker endpoint, and admin console.

CREATE TABLE IF NOT EXISTS funding_system0_policy (
  policy_key TEXT PRIMARY KEY DEFAULT 'default',
  scheduler_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_start BOOLEAN NOT NULL DEFAULT TRUE,
  run_mode TEXT NOT NULL DEFAULT 'incremental' CHECK (run_mode IN ('incremental', 'full')),
  worker_batch_size INTEGER NOT NULL DEFAULT 4 CHECK (worker_batch_size >= 1 AND worker_batch_size <= 20),
  stale_after_minutes INTEGER NOT NULL DEFAULT 45 CHECK (stale_after_minutes >= 5 AND stale_after_minutes <= 1440),
  drain_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  drain_batch_size INTEGER NOT NULL DEFAULT 5 CHECK (drain_batch_size >= 1 AND drain_batch_size <= 20),
  drain_max_batches INTEGER NOT NULL DEFAULT 20 CHECK (drain_max_batches >= 1 AND drain_max_batches <= 50),
  auto_process_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_process_interval_sec INTEGER NOT NULL DEFAULT 30 CHECK (auto_process_interval_sec >= 10 AND auto_process_interval_sec <= 300),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_funding_system0_policy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_funding_system0_policy_updated_at ON funding_system0_policy;
CREATE TRIGGER trigger_funding_system0_policy_updated_at
  BEFORE UPDATE ON funding_system0_policy
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_system0_policy_updated_at();

INSERT INTO funding_system0_policy (
  policy_key,
  scheduler_enabled,
  auto_start,
  run_mode,
  worker_batch_size,
  stale_after_minutes,
  drain_enabled,
  drain_batch_size,
  drain_max_batches,
  auto_process_enabled,
  auto_process_interval_sec
)
VALUES (
  'default',
  TRUE,
  TRUE,
  'incremental',
  4,
  45,
  FALSE,
  5,
  20,
  FALSE,
  30
)
ON CONFLICT (policy_key) DO NOTHING;
