-- Shared Funding Discovery Shortlist
-- Makes the shortlist candidate set durable and shared across admins.

CREATE TABLE IF NOT EXISTS public.funding_discovery_shared_shortlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sort_index integer NOT NULL DEFAULT 0,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT funding_discovery_shared_shortlist_org_unique UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_funding_discovery_shared_shortlist_sort
  ON public.funding_discovery_shared_shortlist(sort_index ASC, updated_at DESC);

DROP TRIGGER IF EXISTS set_funding_discovery_shared_shortlist_updated_at
  ON public.funding_discovery_shared_shortlist;

CREATE TRIGGER set_funding_discovery_shared_shortlist_updated_at
  BEFORE UPDATE ON public.funding_discovery_shared_shortlist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_funding_os_updated_at();

ALTER TABLE public.funding_discovery_shared_shortlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service manage funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist;
DROP POLICY IF EXISTS "Admins read funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist;
DROP POLICY IF EXISTS "Admins insert funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist;
DROP POLICY IF EXISTS "Admins update funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist;
DROP POLICY IF EXISTS "Admins delete funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist;

CREATE POLICY "Service manage funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins read funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist
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

CREATE POLICY "Admins insert funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    AND (added_by IS NULL OR added_by = auth.uid())
    AND (updated_by IS NULL OR updated_by = auth.uid())
  );

CREATE POLICY "Admins update funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist
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

CREATE POLICY "Admins delete funding_discovery_shared_shortlist"
  ON public.funding_discovery_shared_shortlist
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
