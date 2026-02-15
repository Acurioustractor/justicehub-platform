-- Standardize Role Fields Across Junction Tables
-- Created: January 20, 2026
-- Purpose: Rename inconsistent role field names to 'role'
--
-- Tables affected:
-- - coe_key_people: role_title -> role
-- - partner_storytellers: role_at_org -> role

-- ============================================
-- 1. coe_key_people: role_title -> role
-- ============================================

-- Add new role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coe_key_people' AND column_name = 'role'
  ) THEN
    ALTER TABLE coe_key_people ADD COLUMN role TEXT;
  END IF;
END $$;

-- Copy data from role_title to role
UPDATE coe_key_people
SET role = role_title
WHERE role IS NULL AND role_title IS NOT NULL;

-- Make role NOT NULL (same constraint as role_title)
ALTER TABLE coe_key_people
  ALTER COLUMN role SET NOT NULL;

-- Create backward compatibility view for role_title
-- (in case any code still references it)
CREATE OR REPLACE VIEW coe_key_people_v AS
SELECT
  id,
  profile_id,
  role,
  role AS role_title, -- Backward compatibility alias
  expertise_area,
  bio_override,
  display_order,
  is_active,
  created_at
FROM coe_key_people;

-- Drop the old column (after frontend is updated)
-- This is the breaking change - commented out for now
-- ALTER TABLE coe_key_people DROP COLUMN role_title;

-- ============================================
-- 2. partner_storytellers: role_at_org -> role
-- ============================================

-- Add new role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_storytellers' AND column_name = 'role'
  ) THEN
    ALTER TABLE partner_storytellers ADD COLUMN role TEXT;
  END IF;
END $$;

-- Copy data from role_at_org to role
UPDATE partner_storytellers
SET role = role_at_org
WHERE role IS NULL AND role_at_org IS NOT NULL;

-- Create backward compatibility view for role_at_org
CREATE OR REPLACE VIEW partner_storytellers_v AS
SELECT
  id,
  organization_id,
  node_id,
  empathy_ledger_profile_id,
  display_name,
  role,
  role AS role_at_org, -- Backward compatibility alias
  bio_excerpt,
  avatar_url,
  quote,
  is_featured,
  is_public,
  consent_level,
  display_order,
  linked_at
FROM partner_storytellers;

-- Drop the old column (after frontend is updated)
-- This is the breaking change - commented out for now
-- ALTER TABLE partner_storytellers DROP COLUMN role_at_org;

-- ============================================
-- 3. Add role_description column where missing
-- ============================================
-- This allows context for any role assignment
-- e.g., role="staff", role_description="Youth Engagement Coordinator 2023-2025"

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coe_key_people' AND column_name = 'role_description'
  ) THEN
    ALTER TABLE coe_key_people ADD COLUMN role_description TEXT;
  END IF;
END $$;

-- partner_storytellers already has bio_excerpt which serves similar purpose

-- ============================================
-- 4. Add comments for documentation
-- ============================================
COMMENT ON COLUMN coe_key_people.role IS 'Standardized role from role_taxonomy (e.g., director, researcher). Use role_description for context.';
COMMENT ON COLUMN coe_key_people.role_description IS 'Free-text description of the role, e.g., "Research Director 2024-present"';
COMMENT ON COLUMN partner_storytellers.role IS 'Standardized role from role_taxonomy (e.g., elder, participant, storyteller)';
