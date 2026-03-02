CREATE TABLE IF NOT EXISTS public.funding_application_draft_workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.alma_funding_opportunities(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.alma_funding_applications(id) ON DELETE SET NULL,
  narrative_draft TEXT,
  support_material JSONB NOT NULL DEFAULT '[]'::jsonb,
  community_review_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget_notes TEXT,
  draft_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (draft_status IN ('draft', 'in_review', 'ready_to_submit', 'submitted', 'archived')),
  last_review_requested_at TIMESTAMPTZ,
  last_review_completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT funding_application_draft_workspace_org_opp_unique UNIQUE (organization_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_funding_application_draft_workspace_org
  ON public.funding_application_draft_workspace(organization_id);

CREATE INDEX IF NOT EXISTS idx_funding_application_draft_workspace_opp
  ON public.funding_application_draft_workspace(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_funding_application_draft_workspace_status
  ON public.funding_application_draft_workspace(draft_status);

DROP TRIGGER IF EXISTS set_funding_application_draft_workspace_updated_at
  ON public.funding_application_draft_workspace;

CREATE TRIGGER set_funding_application_draft_workspace_updated_at
  BEFORE UPDATE ON public.funding_application_draft_workspace
  FOR EACH ROW EXECUTE FUNCTION public.set_funding_os_updated_at();

ALTER TABLE public.funding_application_draft_workspace ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service manage funding_application_draft_workspace"
  ON public.funding_application_draft_workspace;
DROP POLICY IF EXISTS "Admins read funding_application_draft_workspace"
  ON public.funding_application_draft_workspace;
DROP POLICY IF EXISTS "Admins insert funding_application_draft_workspace"
  ON public.funding_application_draft_workspace;
DROP POLICY IF EXISTS "Admins update funding_application_draft_workspace"
  ON public.funding_application_draft_workspace;
DROP POLICY IF EXISTS "Admins delete funding_application_draft_workspace"
  ON public.funding_application_draft_workspace;

CREATE POLICY "Service manage funding_application_draft_workspace"
  ON public.funding_application_draft_workspace
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins read funding_application_draft_workspace"
  ON public.funding_application_draft_workspace
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins insert funding_application_draft_workspace"
  ON public.funding_application_draft_workspace
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
    AND (created_by IS NULL OR created_by = auth.uid())
    AND (updated_by IS NULL OR updated_by = auth.uid())
  );

CREATE POLICY "Admins update funding_application_draft_workspace"
  ON public.funding_application_draft_workspace
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
    AND (updated_by IS NULL OR updated_by = auth.uid())
  );

CREATE POLICY "Admins delete funding_application_draft_workspace"
  ON public.funding_application_draft_workspace
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );
