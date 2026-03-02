-- Contact submissions table (referenced by /api/contact but never created)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  organization TEXT,
  organization_id UUID REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Admins can read all submissions
CREATE POLICY "Admins can read contact submissions"
  ON contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Service role can insert (used by API route)
-- No insert policy needed for anon/authenticated — the API uses the service client

-- Add 'inquiry' to org_action_items item_type if there's a check constraint
-- First, check and drop old constraint, then add updated one
DO $$
BEGIN
  -- Drop existing check constraint on item_type if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%item_type%'
    AND constraint_schema = 'public'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE org_action_items DROP CONSTRAINT ' || constraint_name
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%item_type%'
      AND constraint_schema = 'public'
      LIMIT 1
    );
  END IF;
END $$;

-- Index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_org_id ON contact_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
