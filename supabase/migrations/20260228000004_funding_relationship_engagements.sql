-- Durable relationship records created after conversation outcome follow-up completion.

CREATE TABLE IF NOT EXISTS public.funding_relationship_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_follow_up_task_id uuid UNIQUE REFERENCES public.agent_task_queue(id) ON DELETE SET NULL,
  parent_conversation_task_id uuid REFERENCES public.agent_task_queue(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES public.funding_match_recommendations(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.alma_funding_opportunities(id) ON DELETE SET NULL,
  engagement_kind text NOT NULL,
  relationship_status text NOT NULL DEFAULT 'active',
  current_stage_label text,
  next_action_label text,
  next_action_due_at timestamptz,
  last_engaged_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT funding_relationship_engagements_kind_check CHECK (
    engagement_kind IN ('intro_call', 'info_follow_up', 'reengagement_window')
  ),
  CONSTRAINT funding_relationship_engagements_status_check CHECK (
    relationship_status IN ('active', 'paused', 'completed', 'closed')
  )
);

CREATE INDEX IF NOT EXISTS idx_funding_relationship_engagements_status
  ON public.funding_relationship_engagements(relationship_status);

CREATE INDEX IF NOT EXISTS idx_funding_relationship_engagements_org
  ON public.funding_relationship_engagements(organization_id);

CREATE INDEX IF NOT EXISTS idx_funding_relationship_engagements_next_action_due_at
  ON public.funding_relationship_engagements(next_action_due_at DESC NULLS LAST);

DROP TRIGGER IF EXISTS set_funding_relationship_engagements_updated_at
  ON public.funding_relationship_engagements;

CREATE TRIGGER set_funding_relationship_engagements_updated_at
  BEFORE UPDATE ON public.funding_relationship_engagements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_funding_os_updated_at();

ALTER TABLE public.funding_relationship_engagements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service manage funding_relationship_engagements"
  ON public.funding_relationship_engagements;
DROP POLICY IF EXISTS "Admins read funding_relationship_engagements"
  ON public.funding_relationship_engagements;
DROP POLICY IF EXISTS "Admins insert funding_relationship_engagements"
  ON public.funding_relationship_engagements;
DROP POLICY IF EXISTS "Admins update funding_relationship_engagements"
  ON public.funding_relationship_engagements;
DROP POLICY IF EXISTS "Admins delete funding_relationship_engagements"
  ON public.funding_relationship_engagements;

CREATE POLICY "Service manage funding_relationship_engagements"
  ON public.funding_relationship_engagements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins read funding_relationship_engagements"
  ON public.funding_relationship_engagements
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

CREATE POLICY "Admins insert funding_relationship_engagements"
  ON public.funding_relationship_engagements
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

CREATE POLICY "Admins update funding_relationship_engagements"
  ON public.funding_relationship_engagements
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

CREATE POLICY "Admins delete funding_relationship_engagements"
  ON public.funding_relationship_engagements
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
