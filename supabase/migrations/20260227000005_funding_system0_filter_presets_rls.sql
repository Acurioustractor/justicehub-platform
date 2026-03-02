-- System 0 Filter Presets RLS
-- Shared presets are visible to admins; private presets are visible/editable only by owner.
-- Service role keeps full access for backend workers/APIs.

ALTER TABLE funding_system0_filter_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service manage funding_system0_filter_presets"
  ON funding_system0_filter_presets;
DROP POLICY IF EXISTS "Admins read funding_system0_filter_presets"
  ON funding_system0_filter_presets;
DROP POLICY IF EXISTS "Admins insert funding_system0_filter_presets"
  ON funding_system0_filter_presets;
DROP POLICY IF EXISTS "Admins update funding_system0_filter_presets"
  ON funding_system0_filter_presets;
DROP POLICY IF EXISTS "Admins delete funding_system0_filter_presets"
  ON funding_system0_filter_presets;

CREATE POLICY "Service manage funding_system0_filter_presets"
  ON funding_system0_filter_presets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins read funding_system0_filter_presets"
  ON funding_system0_filter_presets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    AND (
      is_shared = true
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Admins insert funding_system0_filter_presets"
  ON funding_system0_filter_presets
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

CREATE POLICY "Admins update funding_system0_filter_presets"
  ON funding_system0_filter_presets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    AND (
      is_shared = true
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    AND (
      is_shared = true
      OR created_by = auth.uid()
    )
    AND (updated_by IS NULL OR updated_by = auth.uid())
  );

CREATE POLICY "Admins delete funding_system0_filter_presets"
  ON funding_system0_filter_presets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    AND (
      is_shared = true
      OR created_by = auth.uid()
    )
  );
