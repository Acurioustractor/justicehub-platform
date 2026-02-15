-- Import Justice Reinvestment Sites
-- Source: Paul Ramsay Foundation Portfolio Review 2024
-- 45 organizations, ~60+ services across Australia
-- Run this in Supabase SQL Editor

-- Queensland Sites
INSERT INTO organizations (name, description, website_url) VALUES
('Balkanu Cape York Development Corporation', 'Justice reinvestment site in Mossman focusing on cultural support and court support', 'https://balkanu.com.au')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url
RETURNING id;

INSERT INTO organizations (name, description, website_url) VALUES
('Cape York Institute', 'Justice reinvestment initiative in Hope Vale providing education and cultural support programs', 'https://capeyorkinstitute.org.au')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url;

INSERT INTO organizations (name, description, website_url) VALUES
('Cherbourg Wellbeing Indigenous Corporation', 'Justice reinvestment site providing mental health and cultural support in Cherbourg', NULL)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO organizations (name, description, website_url) VALUES
('Gindaja Treatment and Healing Indigenous Corporation', 'Justice reinvestment site in Yarrabah providing substance abuse treatment and cultural healing', NULL)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO organizations (name, description, website_url) VALUES
('Gunawuna Jungai Limited', 'Justice reinvestment initiative in Doomadgee providing cultural support and court support', NULL)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO organizations (name, description, website_url) VALUES
('Jika Kangka Gununamanda Limited', 'Justice reinvestment site on Mornington Island providing cultural support and education', NULL)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO organizations (name, description, website_url) VALUES
('Minjerribah Moorgumpin Aboriginal Corporation', 'Justice reinvestment initiative on North Stradbroke Island providing cultural support and family support', NULL)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO organizations (name, description, website_url) VALUES
('Napranum Aboriginal Shire Council', 'Justice reinvestment site in Napranum, Cape York providing cultural support and court support', 'https://napranum.qld.gov.au')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url;

INSERT INTO organizations (name, description, website_url) VALUES
('Townsville Community Justice Group Aboriginal & Torres Strait Islander Corporation', 'Justice reinvestment initiative in Townsville providing court support and cultural advocacy', NULL)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- National Organizations (PRF Funded)
INSERT INTO organizations (name, description, website_url) VALUES
('Change the Record', 'National coalition working to end over-representation of Indigenous people in the justice system', 'https://changetherecord.org.au')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url;

INSERT INTO organizations (name, description, website_url) VALUES
('Human Rights Law Centre', 'National legal advocacy organization working on justice reform and human rights', 'https://hrlc.org.au')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url;

INSERT INTO organizations (name, description, website_url) VALUES
('Justice Reform Initiative', 'National organization advocating for criminal justice reform', 'https://justicereforminitiative.org.au')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url;

INSERT INTO organizations (name, description, website_url) VALUES
('Justice Reinvestment Network Australia', 'National network promoting justice reinvestment across Australia', 'https://jrna.org.au')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url;

-- NSW Sites
INSERT INTO organizations (name, description, website_url) VALUES
('Maranguka Justice Reinvestment Project', 'Australia''s flagship justice reinvestment project in Bourke, achieving 46% reduction in domestic violence', 'https://maranguka.org')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url;

INSERT INTO organizations (name, description, website_url) VALUES
('Just Reinvest NSW', 'Justice reinvestment backbone organization supporting multiple NSW communities', 'https://justreinvest.org.au')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, website_url = EXCLUDED.website_url;

-- Create services for Queensland organizations
DO $$
DECLARE
  org_record RECORD;
  new_service_id UUID;
BEGIN
  -- Balkanu Cape York Development Corporation
  SELECT id INTO org_record FROM organizations WHERE name = 'Balkanu Cape York Development Corporation';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Balkanu Cape York Development Corporation - Mossman',
      'balkanu-cape-york-mossman-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment site in Mossman focusing on cultural support and court support',
      'justice_reinvestment',
      ARRAY['cultural_support', 'court_support', 'employment'],
      org_record.id,
      'Mossman',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Cape York Institute
  SELECT id INTO org_record FROM organizations WHERE name = 'Cape York Institute';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Cape York Institute - Hope Vale',
      'cape-york-institute-hope-vale-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment initiative in Hope Vale providing education and cultural support programs',
      'justice_reinvestment',
      ARRAY['education_training', 'cultural_support', 'court_support'],
      org_record.id,
      'Hope Vale',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Cherbourg Wellbeing
  SELECT id INTO org_record FROM organizations WHERE name = 'Cherbourg Wellbeing Indigenous Corporation';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Cherbourg Wellbeing Indigenous Corporation',
      'cherbourg-wellbeing-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment site providing mental health and cultural support in Cherbourg',
      'justice_reinvestment',
      ARRAY['mental_health', 'cultural_support', 'court_support'],
      org_record.id,
      'Cherbourg',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Gindaja Treatment and Healing
  SELECT id INTO org_record FROM organizations WHERE name = 'Gindaja Treatment and Healing Indigenous Corporation';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Gindaja Treatment and Healing Indigenous Corporation',
      'gindaja-treatment-healing-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment site in Yarrabah providing substance abuse treatment and cultural healing',
      'justice_reinvestment',
      ARRAY['substance_abuse', 'mental_health', 'cultural_support'],
      org_record.id,
      'Yarrabah',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Gunawuna Jungai
  SELECT id INTO org_record FROM organizations WHERE name = 'Gunawuna Jungai Limited';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Gunawuna Jungai Limited',
      'gunawuna-jungai-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment initiative in Doomadgee providing cultural support and court support',
      'justice_reinvestment',
      ARRAY['cultural_support', 'court_support', 'family_support'],
      org_record.id,
      'Doomadgee',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Jika Kangka Gununamanda
  SELECT id INTO org_record FROM organizations WHERE name = 'Jika Kangka Gununamanda Limited';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Jika Kangka Gununamanda Limited',
      'jika-kangka-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment site on Mornington Island providing cultural support and education',
      'justice_reinvestment',
      ARRAY['cultural_support', 'court_support', 'education_training'],
      org_record.id,
      'Mornington Island',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Minjerribah Moorgumpin
  SELECT id INTO org_record FROM organizations WHERE name = 'Minjerribah Moorgumpin Aboriginal Corporation';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Minjerribah Moorgumpin Aboriginal Corporation',
      'minjerribah-moorgumpin-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment initiative on North Stradbroke Island providing cultural support and family support',
      'justice_reinvestment',
      ARRAY['cultural_support', 'court_support', 'family_support'],
      org_record.id,
      'North Stradbroke Island',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Napranum Aboriginal Shire Council
  SELECT id INTO org_record FROM organizations WHERE name = 'Napranum Aboriginal Shire Council';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Napranum Aboriginal Shire Council',
      'napranum-shire-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment site in Napranum, Cape York providing cultural support and court support',
      'justice_reinvestment',
      ARRAY['cultural_support', 'court_support', 'advocacy'],
      org_record.id,
      'Napranum',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Townsville Community Justice Group
  SELECT id INTO org_record FROM organizations WHERE name = 'Townsville Community Justice Group Aboriginal & Torres Strait Islander Corporation';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Townsville Community Justice Group',
      'townsville-justice-group-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment initiative in Townsville providing court support and cultural advocacy',
      'justice_reinvestment',
      ARRAY['court_support', 'cultural_support', 'advocacy'],
      org_record.id,
      'Townsville',
      'QLD',
      '{"justice_reinvestment": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- National Organizations
  SELECT id INTO org_record FROM organizations WHERE name = 'Change the Record';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Change the Record',
      'change-the-record-' || substring(gen_random_uuid()::text, 1, 8),
      'National coalition working to end over-representation of Indigenous people in the justice system',
      'justice_reinvestment',
      ARRAY['advocacy', 'cultural_support', 'legal_aid'],
      org_record.id,
      'National',
      'National',
      '{"justice_reinvestment": true, "prf_funded": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO org_record FROM organizations WHERE name = 'Human Rights Law Centre';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Human Rights Law Centre',
      'hrlc-' || substring(gen_random_uuid()::text, 1, 8),
      'National legal advocacy organization working on justice reform and human rights',
      'justice_reinvestment',
      ARRAY['legal_aid', 'advocacy'],
      org_record.id,
      'National',
      'National',
      '{"justice_reinvestment": true, "prf_funded": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO org_record FROM organizations WHERE name = 'Justice Reform Initiative';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Justice Reform Initiative',
      'justice-reform-initiative-' || substring(gen_random_uuid()::text, 1, 8),
      'National organization advocating for criminal justice reform',
      'justice_reinvestment',
      ARRAY['advocacy', 'legal_aid'],
      org_record.id,
      'National',
      'National',
      '{"justice_reinvestment": true, "prf_funded": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO org_record FROM organizations WHERE name = 'Justice Reinvestment Network Australia';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Justice Reinvestment Network Australia',
      'jrna-' || substring(gen_random_uuid()::text, 1, 8),
      'National network promoting justice reinvestment across Australia',
      'justice_reinvestment',
      ARRAY['advocacy', 'education_training'],
      org_record.id,
      'National',
      'National',
      '{"justice_reinvestment": true, "prf_funded": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO org_record FROM organizations WHERE name = 'Maranguka Justice Reinvestment Project';
  IF org_record.id IS NOT NULL THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES (
      'Maranguka Justice Reinvestment Project',
      'maranguka-bourke-' || substring(gen_random_uuid()::text, 1, 8),
      'Australia''s flagship justice reinvestment project in Bourke, achieving 46% reduction in domestic violence',
      'justice_reinvestment',
      ARRAY['court_support', 'cultural_support', 'family_support', 'education_training'],
      org_record.id,
      'Bourke',
      'NSW',
      '{"justice_reinvestment": true, "prf_funded": true, "flagship": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO org_record FROM organizations WHERE name = 'Just Reinvest NSW';
  IF org_record.id IS NOT NULL THEN
    -- Just Reinvest has multiple locations
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES
    (
      'Just Reinvest NSW - Moree',
      'just-reinvest-moree-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment backbone organization supporting Moree community',
      'justice_reinvestment',
      ARRAY['advocacy', 'court_support', 'cultural_support'],
      org_record.id,
      'Moree',
      'NSW',
      '{"justice_reinvestment": true, "prf_funded": true, "source": "PRF Portfolio 2024"}'::jsonb
    ),
    (
      'Just Reinvest NSW - Mount Druitt',
      'just-reinvest-mt-druitt-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment backbone organization supporting Mount Druitt community',
      'justice_reinvestment',
      ARRAY['advocacy', 'court_support', 'cultural_support'],
      org_record.id,
      'Mount Druitt',
      'NSW',
      '{"justice_reinvestment": true, "prf_funded": true, "source": "PRF Portfolio 2024"}'::jsonb
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Justice Reinvestment sites imported successfully';
END $$;

-- Verification query
SELECT 'Organizations' as type, COUNT(*) as total FROM organizations WHERE description LIKE '%justice reinvestment%'
UNION ALL
SELECT 'Services' as type, COUNT(*) as total FROM services WHERE program_type = 'justice_reinvestment';
