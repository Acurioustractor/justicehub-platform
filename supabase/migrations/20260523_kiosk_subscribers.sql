-- Subscriber list for the weekly What Changed digest.
--
-- Email captures from the kiosk email-capture footer + future web signups land
-- here. Idempotent on lower(email) via partial unique index. Re-subscribing
-- after an unsubscribe re-activates the row instead of erroring.

CREATE TABLE IF NOT EXISTS whats_new_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'kiosk',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  last_sent_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_whats_new_subscribers_email_lower
  ON whats_new_subscribers (lower(email));

CREATE INDEX IF NOT EXISTS idx_whats_new_subscribers_active
  ON whats_new_subscribers (subscribed_at DESC)
  WHERE unsubscribed_at IS NULL;

COMMENT ON TABLE whats_new_subscribers IS
  'Email captures for the weekly /intelligence/civic/whats-new digest. Kiosk + web signups land here.';
