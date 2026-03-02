-- Shared Funding Discovery Review Workspace
-- Makes shortlist review state durable across users instead of browser-local only.

CREATE TABLE IF NOT EXISTS public.funding_discovery_review_workspace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  note text,
  decision_tag text,
  activity_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_activity_at timestamptz,
  last_activity_type text,
  last_reviewed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT funding_discovery_review_workspace_org_unique UNIQUE (organization_id),
  CONSTRAINT funding_discovery_review_workspace_decision_tag_check CHECK (
    decision_tag IS NULL
    OR decision_tag IN ('advance', 'hold', 'needs_review')
  )
);

CREATE INDEX IF NOT EXISTS idx_funding_discovery_review_workspace_decision_tag
  ON public.funding_discovery_review_workspace(decision_tag);

CREATE INDEX IF NOT EXISTS idx_funding_discovery_review_workspace_last_activity_at
  ON public.funding_discovery_review_workspace(last_activity_at DESC NULLS LAST);

DROP TRIGGER IF EXISTS set_funding_discovery_review_workspace_updated_at
  ON public.funding_discovery_review_workspace;

CREATE TRIGGER set_funding_discovery_review_workspace_updated_at
  BEFORE UPDATE ON public.funding_discovery_review_workspace
  FOR EACH ROW
  EXECUTE FUNCTION public.set_funding_os_updated_at();

ALTER TABLE public.funding_discovery_review_workspace ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service manage funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace;
DROP POLICY IF EXISTS "Admins read funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace;
DROP POLICY IF EXISTS "Admins insert funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace;
DROP POLICY IF EXISTS "Admins update funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace;
DROP POLICY IF EXISTS "Admins delete funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace;

CREATE POLICY "Service manage funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins read funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins insert funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    AND created_by = auth.uid()
    AND (updated_by IS NULL OR updated_by = auth.uid())
  );

CREATE POLICY "Admins update funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    AND (updated_by IS NULL OR updated_by = auth.uid())
  );

CREATE POLICY "Admins delete funding_discovery_review_workspace"
  ON public.funding_discovery_review_workspace
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
