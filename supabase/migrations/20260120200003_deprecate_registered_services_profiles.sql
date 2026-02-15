-- Deprecate Misleading Table Name: registered_services_profiles
-- Created: January 20, 2026
-- Purpose: Document and alias the confusingly-named junction table
--
-- HISTORY:
-- - The table `registered_services_profiles` links profiles to community programs
-- - It references `registered_services` table (which stores community programs, NOT services)
-- - The foreign key is named `community_programs_profiles_*_fkey` (correct naming)
-- - The table itself is misleadingly named
--
-- SOLUTION:
-- - Keep the existing table (too many references in codebase)
-- - Create a correctly-named view for new code to use
-- - Add documentation comments
-- - Future work: migrate all code to use the view, then rename the table

-- ============================================
-- 1. Add Documentation Comments
-- ============================================
COMMENT ON TABLE registered_services_profiles IS
  'Junction table linking public_profiles to community programs (registered_services). '
  'NAMING NOTE: This table is misleadingly named. It links to community programs, not services. '
  'Prefer using the community_programs_profiles_v view for clarity.';

COMMENT ON COLUMN registered_services_profiles.program_id IS
  'References registered_services.id (which stores COMMUNITY PROGRAMS, not services)';

-- ============================================
-- 2. Create Correctly-Named View
-- ============================================
-- This view provides a clearer name for new code to reference
CREATE OR REPLACE VIEW community_programs_profiles_v AS
SELECT
  id,
  program_id AS community_program_id,  -- More descriptive name
  program_id,                          -- Keep original for compatibility
  public_profile_id AS profile_id,     -- Consistent naming
  public_profile_id,                   -- Keep original for compatibility
  role,
  role_description,
  display_order,
  is_featured,
  created_at
FROM registered_services_profiles;

-- ============================================
-- 3. Create Trigger for View Insertions
-- ============================================
-- Allow inserting via the view (for new code)
CREATE OR REPLACE FUNCTION insert_community_programs_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO registered_services_profiles (
    program_id,
    public_profile_id,
    role,
    role_description,
    display_order,
    is_featured
  ) VALUES (
    COALESCE(NEW.community_program_id, NEW.program_id),
    COALESCE(NEW.profile_id, NEW.public_profile_id),
    NEW.role,
    NEW.role_description,
    NEW.display_order,
    NEW.is_featured
  )
  RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_programs_profiles_v_insert
  INSTEAD OF INSERT ON community_programs_profiles_v
  FOR EACH ROW
  EXECUTE FUNCTION insert_community_programs_profile();

-- ============================================
-- 4. Grant Permissions on View
-- ============================================
GRANT SELECT ON community_programs_profiles_v TO anon;
GRANT SELECT ON community_programs_profiles_v TO authenticated;
GRANT ALL ON community_programs_profiles_v TO service_role;

-- ============================================
-- 5. Add Missing Index
-- ============================================
-- Ensure we have efficient lookups
CREATE INDEX IF NOT EXISTS idx_registered_services_profiles_profile
  ON registered_services_profiles(public_profile_id);
CREATE INDEX IF NOT EXISTS idx_registered_services_profiles_program
  ON registered_services_profiles(program_id);
CREATE INDEX IF NOT EXISTS idx_registered_services_profiles_role
  ON registered_services_profiles(role);
