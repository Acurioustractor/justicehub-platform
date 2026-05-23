-- YJ ranking boost on exhibition_search RPC + community service submissions table.
-- See live function in DB for full body; this file is the canonical source.

-- Submissions intake from /add-service form
CREATE TABLE IF NOT EXISTS exhibition_service_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text,
  state text,
  city text,
  abn text,
  description text NOT NULL,
  proposed_sector text,
  contact_email text,
  submitter_name text,
  acco_certified boolean DEFAULT false,
  cultural_authority boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  matched_organization_id uuid REFERENCES organizations(id),
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  submitted_from_ip inet
);
CREATE INDEX IF NOT EXISTS idx_exhibition_submissions_status ON exhibition_service_submissions(status);
CREATE INDEX IF NOT EXISTS idx_exhibition_submissions_submitted ON exhibition_service_submissions(submitted_at DESC);
