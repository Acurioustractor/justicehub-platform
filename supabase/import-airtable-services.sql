-- Import 336 organizations from Airtable CSV
-- Run this in Supabase SQL Editor to bypass RLS

-- First, create organizations from CSV data
-- This is a sample - you'll need to replace with actual data from CSV

-- Sample organizations (first 20 as example):
INSERT INTO organizations (name, description, website_url) VALUES
  ('5-Partners Project', 'Cultural Program - Indigenous Youth Empowerment', NULL),
  ('ABCN', 'Workplace Mentoring - Education Support', NULL),
  ('Aboriginal and Torres Strait Islander Community Health Service', 'Health Service - Indigenous Youth Health', NULL),
  ('Aboriginal and Torres Strait Islander Wellbeing Services', 'Indigenous Service - Cultural Wellbeing', NULL),
  ('Act for Kids', 'Non-Government Organization - Child Protection', NULL),
  ('Adam Wenitong Youth Response Program', 'Community Initiative - Youth Reoffending Prevention', NULL),
  ('AFL Cape York', 'Community Organization - Youth Development', NULL),
  ('After Care Service', 'Support Service - Post-Care Support', NULL),
  ('Aggression Replacement Training', 'Behavioral Program - Violence Reduction', NULL),
  ('Anglicare Central Queensland', 'Non-Government Organization - Youth Support', NULL),
  ('Anglicare Southern Queensland', 'Non-Government Organization - Youth Justice Support', NULL),
  ('Anglicare Youth Support Program', 'Non-Government Organization - Youth Support', NULL),
  ('ASPIRE Townsville', 'Non-Government Organization - Youth Support', NULL),
  ('Aurukun Youth Support Service', 'Non-Government Organization - Youth Support', NULL),
  ('Australian Training Works Group', 'Indigenous Training Organization - Youth Employment', NULL),
  ('Australian Youth Mentoring Network', 'Peak Body - Youth Mentoring', NULL),
  ('BABI Youth Drop-In', 'Community Service - Youth Support', NULL),
  ('Back to Community (54 Reasons)', 'Non-Government Organization - Youth Reintegration', NULL),
  ('Balance Project', 'Wellbeing Program - Youth Balance', NULL),
  ('Banana Shire Youth Service', 'Local Government Service - Youth Support', NULL)
ON CONFLICT (name) DO NOTHING;

-- Note: To import all 336 organizations, you have two options:

-- OPTION 1: Use Supabase CSV Import Feature
-- 1. Go to Supabase Dashboard → Table Editor → organizations table
-- 2. Click "Insert" → "Import data from CSV"
-- 3. Upload your "Grid view.csv" file
-- 4. Map columns: Organisation Name → name, Organisation Type + Primary Focus → description

-- OPTION 2: Generate full SQL from CSV
-- Run this locally to generate complete SQL:
-- node -e "
--   const fs = require('fs');
--   const lines = fs.readFileSync('Grid view.csv', 'utf-8').split('\n');
--   lines.slice(1).forEach(line => {
--     const cols = line.split(',');
--     if (cols[0]) {
--       console.log(\`  ('\${cols[0].replace(/'/g, \"''\").trim()}', '\${cols[1]} - \${cols[2]}', NULL),\`);
--     }
--   });
-- " > generated-orgs.sql

-- After organizations are created, create corresponding services
-- (This is automated - run after organizations exist)
DO $$
DECLARE
  org_record RECORD;
  service_categories TEXT[];
BEGIN
  FOR org_record IN
    SELECT id, name, description FROM organizations
    WHERE NOT EXISTS (
      SELECT 1 FROM services WHERE organization_id = organizations.id
    )
  LOOP
    -- Determine categories based on description
    service_categories := ARRAY['support']; -- Default

    IF org_record.description ILIKE '%legal%' OR org_record.description ILIKE '%court%' THEN
      service_categories := array_append(service_categories, 'legal_aid');
    END IF;

    IF org_record.description ILIKE '%housing%' OR org_record.description ILIKE '%homeless%' THEN
      service_categories := array_append(service_categories, 'housing');
    END IF;

    IF org_record.description ILIKE '%mental health%' OR org_record.description ILIKE '%counseling%' THEN
      service_categories := array_append(service_categories, 'mental_health');
    END IF;

    IF org_record.description ILIKE '%indigenous%' OR org_record.description ILIKE '%aboriginal%' THEN
      service_categories := array_append(service_categories, 'cultural_support');
    END IF;

    IF org_record.description ILIKE '%family%' THEN
      service_categories := array_append(service_categories, 'family_support');
    END IF;

    IF org_record.description ILIKE '%education%' OR org_record.description ILIKE '%training%' THEN
      service_categories := array_append(service_categories, 'education_training');
    END IF;

    -- Create service for this organization
    INSERT INTO services (
      name,
      description,
      categories,
      organization_id,
      location,
      data_source,
      data_source_url,
      verification_status
    ) VALUES (
      org_record.name,
      org_record.description,
      service_categories,
      org_record.id,
      jsonb_build_object(
        'region', 'Queensland',
        'state', 'QLD'
      ),
      'Airtable Manual Mapping',
      'https://airtable.com/appUVadubEmOCLCRx/shr8LMd6uAwnzIQVD',
      'pending'
    );
  END LOOP;
END $$;

-- Check results
SELECT
  'Organizations' as table_name,
  COUNT(*) as count
FROM organizations
UNION ALL
SELECT
  'Services' as table_name,
  COUNT(*) as count
FROM services;
