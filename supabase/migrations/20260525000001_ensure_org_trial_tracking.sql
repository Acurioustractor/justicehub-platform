-- Ensure organization trial tracking exists in environments that missed the original migration.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_billing_status_check'
      AND conrelid = 'organizations'::regclass
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_billing_status_check
      CHECK (billing_status IN ('none', 'trialing', 'active', 'past_due', 'canceled', 'expired'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at
  ON organizations(trial_ends_at);

COMMENT ON COLUMN organizations.trial_ends_at IS 'When the trial period expires. NULL means no trial.';
COMMENT ON COLUMN organizations.billing_status IS 'Current billing lifecycle state: none, trialing, active, past_due, canceled, expired';
