-- Trial tracking for organizations
-- Allows time-limited access to paid features before requiring subscription

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'none'
  CHECK (billing_status IN ('none', 'trialing', 'active', 'past_due', 'canceled', 'expired'));

COMMENT ON COLUMN organizations.trial_ends_at IS 'When the trial period expires. NULL means no trial.';
COMMENT ON COLUMN organizations.billing_status IS 'Current billing lifecycle state: none, trialing, active, past_due, canceled, expired';
