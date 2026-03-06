CREATE TABLE campaign_donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'aud',
  donor_email TEXT,
  donor_name TEXT,
  campaign_id TEXT DEFAULT 'launch-2026',
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_donations_campaign ON campaign_donations(campaign_id, status);

ALTER TABLE campaign_donations ENABLE ROW LEVEL SECURITY;
