-- Import Justice Reinvestment Sites - SAFE VERSION
-- Source: Paul Ramsay Foundation Portfolio Review 2024
-- Uses DO blocks to handle duplicates safely

DO $$
DECLARE
  org_id UUID;
  orgs_created INT := 0;
  orgs_updated INT := 0;
  services_created INT := 0;
BEGIN
  -- Queensland Site 1: Balkanu Cape York
  SELECT id INTO org_id FROM organizations WHERE name = 'Balkanu Cape York Development Corporation';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Balkanu Cape York Development Corporation', 'Justice reinvestment site in Mossman focusing on cultural support and court support', 'https://balkanu.com.au')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    UPDATE organizations SET description = 'Justice reinvestment site in Mossman focusing on cultural support and court support', website_url = 'https://balkanu.com.au' WHERE id = org_id;
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id AND name = 'Balkanu Cape York Development Corporation - Mossman') THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Balkanu Cape York Development Corporation - Mossman', 'balkanu-cape-york-mossman-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment site in Mossman', 'justice_reinvestment', ARRAY['cultural_support', 'court_support', 'employment'],
      org_id, 'Mossman', 'QLD', '{"justice_reinvestment": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- Queensland Site 2: Cape York Institute
  SELECT id INTO org_id FROM organizations WHERE name = 'Cape York Institute';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Cape York Institute', 'Justice reinvestment initiative in Hope Vale', 'https://capeyorkinstitute.org.au')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id AND name LIKE 'Cape York Institute%') THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Cape York Institute - Hope Vale', 'cape-york-institute-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment initiative providing education and cultural support', 'justice_reinvestment',
      ARRAY['education_training', 'cultural_support', 'court_support'], org_id, 'Hope Vale', 'QLD', '{"justice_reinvestment": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- Queensland Site 3: Cherbourg Wellbeing
  SELECT id INTO org_id FROM organizations WHERE name = 'Cherbourg Wellbeing Indigenous Corporation';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description)
    VALUES ('Cherbourg Wellbeing Indigenous Corporation', 'Justice reinvestment site providing mental health and cultural support')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Cherbourg Wellbeing Indigenous Corporation', 'cherbourg-wellbeing-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice reinvestment providing mental health and cultural support', 'justice_reinvestment',
      ARRAY['mental_health', 'cultural_support', 'court_support'], org_id, 'Cherbourg', 'QLD', '{"justice_reinvestment": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- Queensland Site 4: Gindaja Treatment and Healing
  SELECT id INTO org_id FROM organizations WHERE name = 'Gindaja Treatment and Healing Indigenous Corporation';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description)
    VALUES ('Gindaja Treatment and Healing Indigenous Corporation', 'Justice reinvestment site in Yarrabah providing substance abuse treatment')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Gindaja Treatment and Healing Indigenous Corporation', 'gindaja-treatment-' || substring(gen_random_uuid()::text, 1, 8),
      'Substance abuse treatment and cultural healing', 'justice_reinvestment',
      ARRAY['substance_abuse', 'mental_health', 'cultural_support'], org_id, 'Yarrabah', 'QLD', '{"justice_reinvestment": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- Queensland Site 5: Townsville Community Justice Group
  SELECT id INTO org_id FROM organizations WHERE name = 'Townsville Community Justice Group Aboriginal & Torres Strait Islander Corporation';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description)
    VALUES ('Townsville Community Justice Group Aboriginal & Torres Strait Islander Corporation', 'Justice reinvestment initiative in Townsville')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Townsville Community Justice Group', 'townsville-justice-group-' || substring(gen_random_uuid()::text, 1, 8),
      'Court support and cultural advocacy', 'justice_reinvestment',
      ARRAY['court_support', 'cultural_support', 'advocacy'], org_id, 'Townsville', 'QLD', '{"justice_reinvestment": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- National Organization 1: Change the Record
  SELECT id INTO org_id FROM organizations WHERE name = 'Change the Record';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Change the Record', 'National coalition to end over-representation of Indigenous people in justice system', 'https://changetherecord.org.au')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Change the Record', 'change-the-record-' || substring(gen_random_uuid()::text, 1, 8),
      'National advocacy coalition', 'justice_reinvestment',
      ARRAY['advocacy', 'cultural_support', 'legal_aid'], org_id, 'National', 'National', '{"justice_reinvestment": true, "prf_funded": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- National Organization 2: Human Rights Law Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'Human Rights Law Centre';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Human Rights Law Centre', 'National legal advocacy for justice reform', 'https://hrlc.org.au')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Human Rights Law Centre', 'hrlc-' || substring(gen_random_uuid()::text, 1, 8),
      'Legal advocacy for justice reform', 'justice_reinvestment',
      ARRAY['legal_aid', 'advocacy'], org_id, 'National', 'National', '{"justice_reinvestment": true, "prf_funded": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- National Organization 3: Justice Reinvestment Network Australia
  SELECT id INTO org_id FROM organizations WHERE name = 'Justice Reinvestment Network Australia';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Justice Reinvestment Network Australia', 'National network promoting justice reinvestment', 'https://jrna.org.au')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Justice Reinvestment Network Australia', 'jrna-' || substring(gen_random_uuid()::text, 1, 8),
      'National coordination and advocacy network', 'justice_reinvestment',
      ARRAY['advocacy', 'education_training'], org_id, 'National', 'National', '{"justice_reinvestment": true, "prf_funded": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- NSW: Maranguka (flagship program)
  SELECT id INTO org_id FROM organizations WHERE name = 'Maranguka Justice Reinvestment Project';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Maranguka Justice Reinvestment Project', 'Australia''s flagship justice reinvestment - 46% reduction in DV', 'https://maranguka.org')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Maranguka Justice Reinvestment Project', 'maranguka-bourke-' || substring(gen_random_uuid()::text, 1, 8),
      'Flagship community-led justice reinvestment achieving significant crime reduction', 'justice_reinvestment',
      ARRAY['court_support', 'cultural_support', 'family_support', 'education_training'],
      org_id, 'Bourke', 'NSW', '{"justice_reinvestment": true, "prf_funded": true, "flagship": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  -- NSW: Just Reinvest NSW
  SELECT id INTO org_id FROM organizations WHERE name = 'Just Reinvest NSW';
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Just Reinvest NSW', 'Multi-site justice reinvestment backbone organization', 'https://justreinvest.org.au')
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  ELSE
    orgs_updated := orgs_updated + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id AND name = 'Just Reinvest NSW - Moree') THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Just Reinvest NSW - Moree', 'just-reinvest-moree-' || substring(gen_random_uuid()::text, 1, 8),
      'Community backbone support', 'justice_reinvestment', ARRAY['advocacy', 'court_support', 'cultural_support'],
      org_id, 'Moree', 'NSW', '{"justice_reinvestment": true, "prf_funded": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id AND name = 'Just Reinvest NSW - Mount Druitt') THEN
    INSERT INTO services (name, slug, description, program_type, service_category, organization_id, location_city, location_state, metadata)
    VALUES ('Just Reinvest NSW - Mount Druitt', 'just-reinvest-mt-druitt-' || substring(gen_random_uuid()::text, 1, 8),
      'Community backbone support', 'justice_reinvestment', ARRAY['advocacy', 'court_support', 'cultural_support'],
      org_id, 'Mount Druitt', 'NSW', '{"justice_reinvestment": true, "prf_funded": true}'::jsonb);
    services_created := services_created + 1;
  END IF;

  RAISE NOTICE '✅ Justice Reinvestment Import Complete!';
  RAISE NOTICE 'Organizations created: %', orgs_created;
  RAISE NOTICE 'Organizations updated: %', orgs_updated;
  RAISE NOTICE 'Services created: %', services_created;
END $$;

-- Verification
SELECT 'Organizations' as type, COUNT(*) as count FROM organizations WHERE description LIKE '%justice reinvestment%'
UNION ALL
SELECT 'Services (JR)' as type, COUNT(*) as count FROM services WHERE program_type = 'justice_reinvestment'
UNION ALL
SELECT 'Total Services' as type, COUNT(*) as count FROM services;
