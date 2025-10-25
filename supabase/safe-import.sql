-- Import organizations from Airtable CSV
-- Safe import using DO block
-- Generated: 2025-10-10T01:51:04.796Z
-- Total unique organizations: 325

DO $$
DECLARE
  org_id UUID;
  service_categories TEXT[];
  orgs_created INT := 0;
  services_created INT := 0;
BEGIN

  -- Organization 1: 5-Partners Project
  SELECT id INTO org_id FROM organizations WHERE name = '5-Partners Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('5-Partners Project', 'Cultural Program - Indigenous Youth Empowerment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      '5-Partners Project',
      lower(regexp_replace('5-Partners Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Cultural Program - Indigenous Youth Empowerment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 2: ABCN
  SELECT id INTO org_id FROM organizations WHERE name = 'ABCN';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('ABCN', 'Workplace Mentoring - Education Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'ABCN',
      lower(regexp_replace('ABCN', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Workplace Mentoring - Education Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 3: Aboriginal and Torres Strait Islander Community He
  SELECT id INTO org_id FROM organizations WHERE name = 'Aboriginal and Torres Strait Islander Community Health Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Aboriginal and Torres Strait Islander Community Health Service', 'Health Service - Indigenous Youth Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Aboriginal and Torres Strait Islander Community Health Service',
      lower(regexp_replace('Aboriginal and Torres Strait Islander Community Health Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Health Service - Indigenous Youth Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 4: Aboriginal and Torres Strait Islander Wellbeing Se
  SELECT id INTO org_id FROM organizations WHERE name = 'Aboriginal and Torres Strait Islander Wellbeing Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Aboriginal and Torres Strait Islander Wellbeing Services', 'Indigenous Service - Cultural Wellbeing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Aboriginal and Torres Strait Islander Wellbeing Services',
      lower(regexp_replace('Aboriginal and Torres Strait Islander Wellbeing Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Indigenous Service - Cultural Wellbeing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 5: Act for Kids
  SELECT id INTO org_id FROM organizations WHERE name = 'Act for Kids';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Act for Kids', 'Non-Government Organization - Child Protection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Act for Kids',
      lower(regexp_replace('Act for Kids', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Child Protection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 6: Adam Wenitong Youth Response Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Adam Wenitong Youth Response Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Adam Wenitong Youth Response Program', 'Community Initiative - Youth Reoffending Prevention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Adam Wenitong Youth Response Program',
      lower(regexp_replace('Adam Wenitong Youth Response Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Initiative - Youth Reoffending Prevention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 7: AFL Cape York
  SELECT id INTO org_id FROM organizations WHERE name = 'AFL Cape York';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('AFL Cape York', 'Community Organization - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'AFL Cape York',
      lower(regexp_replace('AFL Cape York', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Organization - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 8: After Care Service
  SELECT id INTO org_id FROM organizations WHERE name = 'After Care Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('After Care Service', 'Support Service - Post-Care Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'After Care Service',
      lower(regexp_replace('After Care Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Service - Post-Care Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 9: Aggression Replacement Training
  SELECT id INTO org_id FROM organizations WHERE name = 'Aggression Replacement Training';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Aggression Replacement Training', 'Behavioral Program - Violence Reduction', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Aggression Replacement Training',
      lower(regexp_replace('Aggression Replacement Training', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Behavioral Program - Violence Reduction',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 10: Anglicare Central Queensland
  SELECT id INTO org_id FROM organizations WHERE name = 'Anglicare Central Queensland';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Anglicare Central Queensland', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Anglicare Central Queensland',
      lower(regexp_replace('Anglicare Central Queensland', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 11: Anglicare Southern Queensland
  SELECT id INTO org_id FROM organizations WHERE name = 'Anglicare Southern Queensland';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Anglicare Southern Queensland', 'Non-Government Organization - Youth Justice Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Anglicare Southern Queensland',
      lower(regexp_replace('Anglicare Southern Queensland', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Justice Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 12: Anglicare Youth Support Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Anglicare Youth Support Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Anglicare Youth Support Program', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Anglicare Youth Support Program',
      lower(regexp_replace('Anglicare Youth Support Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 13: ASPIRE Townsville
  SELECT id INTO org_id FROM organizations WHERE name = 'ASPIRE Townsville';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('ASPIRE Townsville', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'ASPIRE Townsville',
      lower(regexp_replace('ASPIRE Townsville', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 14: Aurukun Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Aurukun Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Aurukun Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Aurukun Youth Support Service',
      lower(regexp_replace('Aurukun Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 15: Australian Training Works Group
  SELECT id INTO org_id FROM organizations WHERE name = 'Australian Training Works Group';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Australian Training Works Group', 'Indigenous Training Organization - Youth Employment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Australian Training Works Group',
      lower(regexp_replace('Australian Training Works Group', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Indigenous Training Organization - Youth Employment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 16: Australian Youth Mentoring Network
  SELECT id INTO org_id FROM organizations WHERE name = 'Australian Youth Mentoring Network';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Australian Youth Mentoring Network', 'Peak Body - Youth Mentoring', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Australian Youth Mentoring Network',
      lower(regexp_replace('Australian Youth Mentoring Network', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Peak Body - Youth Mentoring',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 17: BABI Youth Drop-In
  SELECT id INTO org_id FROM organizations WHERE name = 'BABI Youth Drop-In';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('BABI Youth Drop-In', 'Community Service - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'BABI Youth Drop-In',
      lower(regexp_replace('BABI Youth Drop-In', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Service - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 18: Back to Community (54 Reasons)
  SELECT id INTO org_id FROM organizations WHERE name = 'Back to Community (54 Reasons)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Back to Community (54 Reasons)', 'Non-Government Organization - Youth Reintegration', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Back to Community (54 Reasons)',
      lower(regexp_replace('Back to Community (54 Reasons)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Reintegration',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 19: Balance Project
  SELECT id INTO org_id FROM organizations WHERE name = 'Balance Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Balance Project', 'Wellbeing Program - Youth Balance', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Balance Project',
      lower(regexp_replace('Balance Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Wellbeing Program - Youth Balance',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 20: Banana Shire Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Banana Shire Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Banana Shire Youth Service', 'Local Government Service - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Banana Shire Youth Service',
      lower(regexp_replace('Banana Shire Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Local Government Service - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 21: BEATS Program
  SELECT id INTO org_id FROM organizations WHERE name = 'BEATS Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('BEATS Program', 'Skills Program - Youth Employment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'BEATS Program',
      lower(regexp_replace('BEATS Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Skills Program - Youth Employment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 22: Beaucare Community Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Beaucare Community Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Beaucare Community Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Beaucare Community Youth Service',
      lower(regexp_replace('Beaucare Community Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 23: Beyond DV Youth Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Beyond DV Youth Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Beyond DV Youth Program', 'Non-Government Organization - Domestic Violence Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Beyond DV Youth Program',
      lower(regexp_replace('Beyond DV Youth Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Domestic Violence Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 24: Big Bounce
  SELECT id INTO org_id FROM organizations WHERE name = 'Big Bounce';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Big Bounce', 'Diversion Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'court_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Big Bounce',
      lower(regexp_replace('Big Bounce', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Diversion Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 25: Black Chicks Talking and Young Black and Proud
  SELECT id INTO org_id FROM organizations WHERE name = 'Black Chicks Talking and Young Black and Proud';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Black Chicks Talking and Young Black and Proud', 'Cultural Program - Indigenous Identity', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Black Chicks Talking and Young Black and Proud',
      lower(regexp_replace('Black Chicks Talking and Young Black and Proud', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Cultural Program - Indigenous Identity',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 26: Blue EDGE – Darling Downs
  SELECT id INTO org_id FROM organizations WHERE name = 'Blue EDGE – Darling Downs';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Blue EDGE – Darling Downs', 'Police Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Blue EDGE – Darling Downs',
      lower(regexp_replace('Blue EDGE – Darling Downs', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Police Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 27: Blue EDGE – Lowood
  SELECT id INTO org_id FROM organizations WHERE name = 'Blue EDGE – Lowood';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Blue EDGE – Lowood', 'Police Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Blue EDGE – Lowood',
      lower(regexp_replace('Blue EDGE – Lowood', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Police Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 28: Blue EDGE – Redland Bay
  SELECT id INTO org_id FROM organizations WHERE name = 'Blue EDGE – Redland Bay';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Blue EDGE – Redland Bay', 'Police Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Blue EDGE – Redland Bay',
      lower(regexp_replace('Blue EDGE – Redland Bay', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Police Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 29: Blue EDGE – YMCA Acacia Ridge
  SELECT id INTO org_id FROM organizations WHERE name = 'Blue EDGE – YMCA Acacia Ridge';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Blue EDGE – YMCA Acacia Ridge', 'Police Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Blue EDGE – YMCA Acacia Ridge',
      lower(regexp_replace('Blue EDGE – YMCA Acacia Ridge', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Police Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 30: Blue Lures
  SELECT id INTO org_id FROM organizations WHERE name = 'Blue Lures';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Blue Lures', 'Youth Program - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Blue Lures',
      lower(regexp_replace('Blue Lures', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 31: Braking the Cycle
  SELECT id INTO org_id FROM organizations WHERE name = 'Braking the Cycle';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Braking the Cycle', 'Youth Program - Driver Education', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Braking the Cycle',
      lower(regexp_replace('Braking the Cycle', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Driver Education',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 32: Brisbane Youth Detention Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'Brisbane Youth Detention Centre';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Brisbane Youth Detention Centre', 'Government Facility - Youth Detention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'court_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Brisbane Youth Detention Centre',
      lower(regexp_replace('Brisbane Youth Detention Centre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Facility - Youth Detention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 33: Brisbane Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Brisbane Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Brisbane Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Brisbane Youth Service',
      lower(regexp_replace('Brisbane Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 34: Caboolture YARN Brokerage
  SELECT id INTO org_id FROM organizations WHERE name = 'Caboolture YARN Brokerage';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Caboolture YARN Brokerage', 'Support Service - Youth Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Caboolture YARN Brokerage',
      lower(regexp_replace('Caboolture YARN Brokerage', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Service - Youth Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 35: Cairns Youth Foyer
  SELECT id INTO org_id FROM organizations WHERE name = 'Cairns Youth Foyer';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Cairns Youth Foyer', 'Housing Program - Youth Housing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Cairns Youth Foyer',
      lower(regexp_replace('Cairns Youth Foyer', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Housing Program - Youth Housing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 36: CALD Youth Soccer Program for a Safer Townsville
  SELECT id INTO org_id FROM organizations WHERE name = 'CALD Youth Soccer Program for a Safer Townsville';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('CALD Youth Soccer Program for a Safer Townsville', 'Sports Program - Multicultural Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'CALD Youth Soccer Program for a Safer Townsville',
      lower(regexp_replace('CALD Youth Soccer Program for a Safer Townsville', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Sports Program - Multicultural Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 37: Care Coordination
  SELECT id INTO org_id FROM organizations WHERE name = 'Care Coordination';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Care Coordination', 'Support Program - Youth Case Management', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Care Coordination',
      lower(regexp_replace('Care Coordination', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Program - Youth Case Management',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 38: CentacareCQ Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'CentacareCQ Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('CentacareCQ Youth Support Service', 'Faith-Based Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'CentacareCQ Youth Support Service',
      lower(regexp_replace('CentacareCQ Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Faith-Based Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 39: CentacareNQ Normanton Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'CentacareNQ Normanton Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('CentacareNQ Normanton Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'CentacareNQ Normanton Youth Service',
      lower(regexp_replace('CentacareNQ Normanton Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 40: Central Burnett Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Central Burnett Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Central Burnett Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Central Burnett Youth Service',
      lower(regexp_replace('Central Burnett Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 41: Changing Habits and Reaching Targets (CHART)
  SELECT id INTO org_id FROM organizations WHERE name = 'Changing Habits and Reaching Targets (CHART)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Changing Habits and Reaching Targets (CHART)', 'Justice Program - Behavioral Change', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Changing Habits and Reaching Targets (CHART)',
      lower(regexp_replace('Changing Habits and Reaching Targets (CHART)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice Program - Behavioral Change',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 42: Changing the Narrative
  SELECT id INTO org_id FROM organizations WHERE name = 'Changing the Narrative';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Changing the Narrative', 'Youth Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Changing the Narrative',
      lower(regexp_replace('Changing the Narrative', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 43: Charleville Dirt Bike Rally
  SELECT id INTO org_id FROM organizations WHERE name = 'Charleville Dirt Bike Rally';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Charleville Dirt Bike Rally', 'Recreational Event - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Charleville Dirt Bike Rally',
      lower(regexp_replace('Charleville Dirt Bike Rally', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Recreational Event - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 44: Charleville Youth Support Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Charleville Youth Support Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Charleville Youth Support Program', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Charleville Youth Support Program',
      lower(regexp_replace('Charleville Youth Support Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 45: Chinchilla Youth Connect Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Chinchilla Youth Connect Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Chinchilla Youth Connect Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Chinchilla Youth Connect Service',
      lower(regexp_replace('Chinchilla Youth Connect Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 46: Choices Applied Theatre Project
  SELECT id INTO org_id FROM organizations WHERE name = 'Choices Applied Theatre Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Choices Applied Theatre Project', 'Arts Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Choices Applied Theatre Project',
      lower(regexp_replace('Choices Applied Theatre Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Arts Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 47: Circles of Support - Youth Service (Gympie)
  SELECT id INTO org_id FROM organizations WHERE name = 'Circles of Support - Youth Service (Gympie)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Circles of Support - Youth Service (Gympie)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Circles of Support - Youth Service (Gympie)',
      lower(regexp_replace('Circles of Support - Youth Service (Gympie)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 48: Circles of Support - Youth Service (Sunshine Coast
  SELECT id INTO org_id FROM organizations WHERE name = 'Circles of Support - Youth Service (Sunshine Coast)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Circles of Support - Youth Service (Sunshine Coast)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Circles of Support - Youth Service (Sunshine Coast)',
      lower(regexp_replace('Circles of Support - Youth Service (Sunshine Coast)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 49: CISERR Initiative
  SELECT id INTO org_id FROM organizations WHERE name = 'CISERR Initiative';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('CISERR Initiative', 'Social Enterprise - Youth Employment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'CISERR Initiative',
      lower(regexp_replace('CISERR Initiative', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Social Enterprise - Youth Employment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 50: Cleveland Youth Detention Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'Cleveland Youth Detention Centre';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Cleveland Youth Detention Centre', 'Government Facility - Youth Detention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'court_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Cleveland Youth Detention Centre',
      lower(regexp_replace('Cleveland Youth Detention Centre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Facility - Youth Detention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 51: Cloncurry PCYC Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Cloncurry PCYC Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Cloncurry PCYC Youth Support Service', 'PCYC Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Cloncurry PCYC Youth Support Service',
      lower(regexp_replace('Cloncurry PCYC Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'PCYC Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 52: Coastal Connector
  SELECT id INTO org_id FROM organizations WHERE name = 'Coastal Connector';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Coastal Connector', 'Youth Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Coastal Connector',
      lower(regexp_replace('Coastal Connector', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 53: Community Action for a Multicultural Society (CAMS
  SELECT id INTO org_id FROM organizations WHERE name = 'Community Action for a Multicultural Society (CAMS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Community Action for a Multicultural Society (CAMS)', 'Government Program - Multicultural Youth', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Community Action for a Multicultural Society (CAMS)',
      lower(regexp_replace('Community Action for a Multicultural Society (CAMS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Multicultural Youth',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 54: Community Justice Groups (CJGs)
  SELECT id INTO org_id FROM organizations WHERE name = 'Community Justice Groups (CJGs)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Community Justice Groups (CJGs)', 'Non-Government Organizations - Indigenous Justice Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Community Justice Groups (CJGs)',
      lower(regexp_replace('Community Justice Groups (CJGs)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organizations - Indigenous Justice Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 55: Connect Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Connect Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Connect Program', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Connect Program',
      lower(regexp_replace('Connect Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 56: Connected Youth Strong Communities
  SELECT id INTO org_id FROM organizations WHERE name = 'Connected Youth Strong Communities';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Connected Youth Strong Communities', 'Community Program - Youth Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Connected Youth Strong Communities',
      lower(regexp_replace('Connected Youth Strong Communities', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Program - Youth Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 57: Cooktown District Community Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'Cooktown District Community Centre';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Cooktown District Community Centre', 'Community Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Cooktown District Community Centre',
      lower(regexp_replace('Cooktown District Community Centre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 58: Court Up – Play Ball Basketball Project
  SELECT id INTO org_id FROM organizations WHERE name = 'Court Up – Play Ball Basketball Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Court Up – Play Ball Basketball Project', 'Sports Program - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Court Up – Play Ball Basketball Project',
      lower(regexp_replace('Court Up – Play Ball Basketball Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Sports Program - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 59: CREATE Foundation
  SELECT id INTO org_id FROM organizations WHERE name = 'CREATE Foundation';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('CREATE Foundation', 'Advocacy Organization - Out-of-Home Care', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'CREATE Foundation',
      lower(regexp_replace('CREATE Foundation', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Advocacy Organization - Out-of-Home Care',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 60: Creating Safe Children – DV Early Prevention Progr
  SELECT id INTO org_id FROM organizations WHERE name = 'Creating Safe Children – DV Early Prevention Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Creating Safe Children – DV Early Prevention Program', 'Prevention Program - Domestic Violence Prevention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Creating Safe Children – DV Early Prevention Program',
      lower(regexp_replace('Creating Safe Children – DV Early Prevention Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Prevention Program - Domestic Violence Prevention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 61: Crime Action Through Community Empowerment Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Crime Action Through Community Empowerment Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Crime Action Through Community Empowerment Program', 'Community Program - Crime Prevention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Crime Action Through Community Empowerment Program',
      lower(regexp_replace('Crime Action Through Community Empowerment Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Program - Crime Prevention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 62: Crisafulli Government Housing Initiatives
  SELECT id INTO org_id FROM organizations WHERE name = 'Crisafulli Government Housing Initiatives';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Crisafulli Government Housing Initiatives', 'Government Program - Youth Housing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Crisafulli Government Housing Initiatives',
      lower(regexp_replace('Crisafulli Government Housing Initiatives', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Youth Housing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 63: Cultural Connection and Healing Camps
  SELECT id INTO org_id FROM organizations WHERE name = 'Cultural Connection and Healing Camps';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Cultural Connection and Healing Camps', 'Cultural Program - Indigenous Healing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Cultural Connection and Healing Camps',
      lower(regexp_replace('Cultural Connection and Healing Camps', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Cultural Program - Indigenous Healing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 64: Cultural Mentoring
  SELECT id INTO org_id FROM organizations WHERE name = 'Cultural Mentoring';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Cultural Mentoring', 'Mentoring Program - Cultural Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Cultural Mentoring',
      lower(regexp_replace('Cultural Mentoring', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Mentoring Program - Cultural Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 65: Culturally Informed Therapy
  SELECT id INTO org_id FROM organizations WHERE name = 'Culturally Informed Therapy';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Culturally Informed Therapy', 'Therapy Program - Cultural Mental Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Culturally Informed Therapy',
      lower(regexp_replace('Culturally Informed Therapy', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Therapy Program - Cultural Mental Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 66: Dalby Youth Access Program (YAP)
  SELECT id INTO org_id FROM organizations WHERE name = 'Dalby Youth Access Program (YAP)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Dalby Youth Access Program (YAP)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Dalby Youth Access Program (YAP)',
      lower(regexp_replace('Dalby Youth Access Program (YAP)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 67: DBCYP - Youth Access Moreton Bay Initiative (YAMBI
  SELECT id INTO org_id FROM organizations WHERE name = 'DBCYP - Youth Access Moreton Bay Initiative (YAMBI)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('DBCYP - Youth Access Moreton Bay Initiative (YAMBI)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'DBCYP - Youth Access Moreton Bay Initiative (YAMBI)',
      lower(regexp_replace('DBCYP - Youth Access Moreton Bay Initiative (YAMBI)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 68: Department of Child Safety Seniors and Disability 
  SELECT id INTO org_id FROM organizations WHERE name = 'Department of Child Safety Seniors and Disability Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Department of Child Safety Seniors and Disability Services', 'Government Department - Child Protection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Department of Child Safety Seniors and Disability Services',
      lower(regexp_replace('Department of Child Safety Seniors and Disability Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Department - Child Protection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 69: Department of Education
  SELECT id INTO org_id FROM organizations WHERE name = 'Department of Education';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Department of Education', 'Government Department - Education', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Department of Education',
      lower(regexp_replace('Department of Education', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Department - Education',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 70: Department of Housing
  SELECT id INTO org_id FROM organizations WHERE name = 'Department of Housing';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Department of Housing', 'Government Department - Housing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Department of Housing',
      lower(regexp_replace('Department of Housing', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Department - Housing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 71: Department of Youth Justice
  SELECT id INTO org_id FROM organizations WHERE name = 'Department of Youth Justice';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Department of Youth Justice', 'Government Agency - Youth Justice', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Department of Youth Justice',
      lower(regexp_replace('Department of Youth Justice', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Agency - Youth Justice',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 72: Department of Youth Justice (Youth and Family Supp
  SELECT id INTO org_id FROM organizations WHERE name = 'Department of Youth Justice (Youth and Family Support Service)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Department of Youth Justice (Youth and Family Support Service)', 'Government Agency - Youth Justice Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Department of Youth Justice (Youth and Family Support Service)',
      lower(regexp_replace('Department of Youth Justice (Youth and Family Support Service)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Agency - Youth Justice Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 73: Dis Yu-on-ner
  SELECT id INTO org_id FROM organizations WHERE name = 'Dis Yu-on-ner';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Dis Yu-on-ner', 'Cultural Program - Indigenous Youth Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Dis Yu-on-ner',
      lower(regexp_replace('Dis Yu-on-ner', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Cultural Program - Indigenous Youth Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 74: Discovery Coast Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Discovery Coast Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Discovery Coast Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Discovery Coast Youth Service',
      lower(regexp_replace('Discovery Coast Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 75: Doomadgee Aboriginal Community Performing Arts Cam
  SELECT id INTO org_id FROM organizations WHERE name = 'Doomadgee Aboriginal Community Performing Arts Camp';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Doomadgee Aboriginal Community Performing Arts Camp', 'Arts Program - Indigenous Performance Arts', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Doomadgee Aboriginal Community Performing Arts Camp',
      lower(regexp_replace('Doomadgee Aboriginal Community Performing Arts Camp', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Arts Program - Indigenous Performance Arts',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 76: Doomadgee Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Doomadgee Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Doomadgee Youth Support Service', 'Non-Government Organization - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Doomadgee Youth Support Service',
      lower(regexp_replace('Doomadgee Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 77: Early Intervention for Disengaged Youth Project
  SELECT id INTO org_id FROM organizations WHERE name = 'Early Intervention for Disengaged Youth Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Early Intervention for Disengaged Youth Project', 'Intervention Program - Youth Re-engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Early Intervention for Disengaged Youth Project',
      lower(regexp_replace('Early Intervention for Disengaged Youth Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Intervention Program - Youth Re-engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 78: ELAM Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'ELAM Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('ELAM Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'ELAM Youth Support Service',
      lower(regexp_replace('ELAM Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 79: Emotional Regulation and Impulse Control
  SELECT id INTO org_id FROM organizations WHERE name = 'Emotional Regulation and Impulse Control';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Emotional Regulation and Impulse Control', 'Therapeutic Program - Behavioral Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Emotional Regulation and Impulse Control',
      lower(regexp_replace('Emotional Regulation and Impulse Control', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Therapeutic Program - Behavioral Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 80: Empowering Youth Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Empowering Youth Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Empowering Youth Program', 'Empowerment Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Empowering Youth Program',
      lower(regexp_replace('Empowering Youth Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Empowerment Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 81: Engaging Technology for Crime Prevention
  SELECT id INTO org_id FROM organizations WHERE name = 'Engaging Technology for Crime Prevention';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Engaging Technology for Crime Prevention', 'Technology Program - Crime Prevention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Engaging Technology for Crime Prevention',
      lower(regexp_replace('Engaging Technology for Crime Prevention', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Technology Program - Crime Prevention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 82: Equine Experience
  SELECT id INTO org_id FROM organizations WHERE name = 'Equine Experience';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Equine Experience', 'Therapy Program - Youth Mental Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Equine Experience',
      lower(regexp_replace('Equine Experience', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Therapy Program - Youth Mental Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 83: eSafety Youth Advisory Council
  SELECT id INTO org_id FROM organizations WHERE name = 'eSafety Youth Advisory Council';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('eSafety Youth Advisory Council', 'Advisory Group - Online Safety', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'eSafety Youth Advisory Council',
      lower(regexp_replace('eSafety Youth Advisory Council', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Advisory Group - Online Safety',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 84: Family and Child Connect and Intensive Family Supp
  SELECT id INTO org_id FROM organizations WHERE name = 'Family and Child Connect and Intensive Family Support';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Family and Child Connect and Intensive Family Support', 'Family Service - Family Intervention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Family and Child Connect and Intensive Family Support',
      lower(regexp_replace('Family and Child Connect and Intensive Family Support', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Family Service - Family Intervention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 85: Fast-track Sentencing Pilot program
  SELECT id INTO org_id FROM organizations WHERE name = 'Fast-track Sentencing Pilot program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Fast-track Sentencing Pilot program', 'Justice Program - Court Efficiency', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Fast-track Sentencing Pilot program',
      lower(regexp_replace('Fast-track Sentencing Pilot program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice Program - Court Efficiency',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 86: Fight 4 Youth''s Inside Out Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Fight 4 Youth''s Inside Out Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Fight 4 Youth''s Inside Out Program', 'Development Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Fight 4 Youth''s Inside Out Program',
      lower(regexp_replace('Fight 4 Youth''s Inside Out Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Development Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 87: First Nations Action Board
  SELECT id INTO org_id FROM organizations WHERE name = 'First Nations Action Board';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('First Nations Action Board', 'Advisory Board - Indigenous Youth Justice', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'First Nations Action Board',
      lower(regexp_replace('First Nations Action Board', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Advisory Board - Indigenous Youth Justice',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 88: First Nations Justice Office (FNJO)
  SELECT id INTO org_id FROM organizations WHERE name = 'First Nations Justice Office (FNJO)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('First Nations Justice Office (FNJO)', 'Government Agency - Justice Reinvestment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'First Nations Justice Office (FNJO)',
      lower(regexp_replace('First Nations Justice Office (FNJO)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Agency - Justice Reinvestment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 89: First Nations Parents Program
  SELECT id INTO org_id FROM organizations WHERE name = 'First Nations Parents Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('First Nations Parents Program', 'Support Program - Family Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'First Nations Parents Program',
      lower(regexp_replace('First Nations Parents Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Program - Family Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 90: Flame Project
  SELECT id INTO org_id FROM organizations WHERE name = 'Flame Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Flame Project', 'Youth Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Flame Project',
      lower(regexp_replace('Flame Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 91: Forge AHEAD Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Forge AHEAD Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Forge AHEAD Program', 'Development Program - Youth Advancement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Forge AHEAD Program',
      lower(regexp_replace('Forge AHEAD Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Development Program - Youth Advancement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 92: FoyerInvest
  SELECT id INTO org_id FROM organizations WHERE name = 'FoyerInvest';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('FoyerInvest', 'Consortium - Youth Housing Advocacy', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'FoyerInvest',
      lower(regexp_replace('FoyerInvest', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Consortium - Youth Housing Advocacy',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 93: Fraser Coast Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Fraser Coast Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Fraser Coast Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Fraser Coast Youth Support Service',
      lower(regexp_replace('Fraser Coast Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 94: Free Kindy Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Free Kindy Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Free Kindy Program', 'Education Program - Early Childhood', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Free Kindy Program',
      lower(regexp_replace('Free Kindy Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Education Program - Early Childhood',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 95: Garbutt Youth Hub
  SELECT id INTO org_id FROM organizations WHERE name = 'Garbutt Youth Hub';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Garbutt Youth Hub', 'Community Center - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Garbutt Youth Hub',
      lower(regexp_replace('Garbutt Youth Hub', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Center - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 96: Gold Coast Project for Homeless Youth
  SELECT id INTO org_id FROM organizations WHERE name = 'Gold Coast Project for Homeless Youth';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Gold Coast Project for Homeless Youth', 'Non-Government Organization - Youth Homelessness', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Gold Coast Project for Homeless Youth',
      lower(regexp_replace('Gold Coast Project for Homeless Youth', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Homelessness',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 97: Gold Coast Youth Foyer
  SELECT id INTO org_id FROM organizations WHERE name = 'Gold Coast Youth Foyer';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Gold Coast Youth Foyer', 'Housing Program - Youth Housing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Gold Coast Youth Foyer',
      lower(regexp_replace('Gold Coast Youth Foyer', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Housing Program - Youth Housing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 98: Gold Coast Youth Service (YASS)
  SELECT id INTO org_id FROM organizations WHERE name = 'Gold Coast Youth Service (YASS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Gold Coast Youth Service (YASS)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Gold Coast Youth Service (YASS)',
      lower(regexp_replace('Gold Coast Youth Service (YASS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 99: Goondiwindi Youth Access Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Goondiwindi Youth Access Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Goondiwindi Youth Access Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Goondiwindi Youth Access Service',
      lower(regexp_replace('Goondiwindi Youth Access Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 100: Granite Belt Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Granite Belt Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Granite Belt Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Granite Belt Youth Support Service',
      lower(regexp_replace('Granite Belt Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 101: Happy Mindful Souls
  SELECT id INTO org_id FROM organizations WHERE name = 'Happy Mindful Souls';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Happy Mindful Souls', 'Wellbeing Program - Youth Mental Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Happy Mindful Souls',
      lower(regexp_replace('Happy Mindful Souls', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Wellbeing Program - Youth Mental Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 102: Headspace
  SELECT id INTO org_id FROM organizations WHERE name = 'Headspace';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Headspace', 'Mental Health Service - Youth Mental Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Headspace',
      lower(regexp_replace('Headspace', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Mental Health Service - Youth Mental Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 103: Healing Our Families Wellbeing Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Healing Our Families Wellbeing Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Healing Our Families Wellbeing Program', 'Family Program - Family Wellbeing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Healing Our Families Wellbeing Program',
      lower(regexp_replace('Healing Our Families Wellbeing Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Family Program - Family Wellbeing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 104: Health Home Visiting Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Health Home Visiting Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Health Home Visiting Program', 'Health Program - Family Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Health Home Visiting Program',
      lower(regexp_replace('Health Home Visiting Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Health Program - Family Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 105: Hinchinbrook Community Support Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'Hinchinbrook Community Support Centre';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Hinchinbrook Community Support Centre', 'Community Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Hinchinbrook Community Support Centre',
      lower(regexp_replace('Hinchinbrook Community Support Centre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 106: Home Time Campaign
  SELECT id INTO org_id FROM organizations WHERE name = 'Home Time Campaign';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Home Time Campaign', 'Advocacy Campaign - Youth Homelessness', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Home Time Campaign',
      lower(regexp_replace('Home Time Campaign', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Advocacy Campaign - Youth Homelessness',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 107: Horse Helping Humans Youth Mentoring Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Horse Helping Humans Youth Mentoring Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Horse Helping Humans Youth Mentoring Program', 'Mentoring Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Horse Helping Humans Youth Mentoring Program',
      lower(regexp_replace('Horse Helping Humans Youth Mentoring Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Mentoring Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 108: Horse Whispering
  SELECT id INTO org_id FROM organizations WHERE name = 'Horse Whispering';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Horse Whispering', 'Therapy Program - Youth Intervention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Horse Whispering',
      lower(regexp_replace('Horse Whispering', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Therapy Program - Youth Intervention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 109: ICYS - Regional Youth Support Service (Lockyer Val
  SELECT id INTO org_id FROM organizations WHERE name = 'ICYS - Regional Youth Support Service (Lockyer Valley and Somerset)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('ICYS - Regional Youth Support Service (Lockyer Valley and Somerset)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'ICYS - Regional Youth Support Service (Lockyer Valley and Somerset)',
      lower(regexp_replace('ICYS - Regional Youth Support Service (Lockyer Valley and Somerset)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 110: ICYS Ipswich Community Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'ICYS Ipswich Community Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('ICYS Ipswich Community Youth Service', 'Youth Service - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'ICYS Ipswich Community Youth Service',
      lower(regexp_replace('ICYS Ipswich Community Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Service - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 111: ICYS Youth Access and Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'ICYS Youth Access and Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('ICYS Youth Access and Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'ICYS Youth Access and Support Service',
      lower(regexp_replace('ICYS Youth Access and Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 112: IFYS Limited
  SELECT id INTO org_id FROM organizations WHERE name = 'IFYS Limited';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('IFYS Limited', 'Non-Government Organization - Youth & Family Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'IFYS Limited',
      lower(regexp_replace('IFYS Limited', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth & Family Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 113: In-Tent for Change Resilience Program
  SELECT id INTO org_id FROM organizations WHERE name = 'In-Tent for Change Resilience Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('In-Tent for Change Resilience Program', 'Resilience Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'In-Tent for Change Resilience Program',
      lower(regexp_replace('In-Tent for Change Resilience Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Resilience Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 114: Inala Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Inala Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Inala Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Inala Youth Service',
      lower(regexp_replace('Inala Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 115: Indigenous Resilience Advancement Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Indigenous Resilience Advancement Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Indigenous Resilience Advancement Program', 'Resilience Program - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Indigenous Resilience Advancement Program',
      lower(regexp_replace('Indigenous Resilience Advancement Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Resilience Program - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 116: Indigenous Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Indigenous Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Indigenous Youth Service', 'Non-Government Organization - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Indigenous Youth Service',
      lower(regexp_replace('Indigenous Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 117: Injilinji Youth Health and Life Skills Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Injilinji Youth Health and Life Skills Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Injilinji Youth Health and Life Skills Services', 'Non-Government Organization - Youth Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Injilinji Youth Health and Life Skills Services',
      lower(regexp_replace('Injilinji Youth Health and Life Skills Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 118: Innisfail Boiler Room Recreational Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'Innisfail Boiler Room Recreational Centre';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Innisfail Boiler Room Recreational Centre', 'Community Organization - Youth Recreation', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Innisfail Boiler Room Recreational Centre',
      lower(regexp_replace('Innisfail Boiler Room Recreational Centre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Organization - Youth Recreation',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 119: Innisfail Youth and Family Care Inc
  SELECT id INTO org_id FROM organizations WHERE name = 'Innisfail Youth and Family Care Inc';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Innisfail Youth and Family Care Inc', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Innisfail Youth and Family Care Inc',
      lower(regexp_replace('Innisfail Youth and Family Care Inc', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 120: Inside Out Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Inside Out Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Inside Out Program', 'Development Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Inside Out Program',
      lower(regexp_replace('Inside Out Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Development Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 121: Intensive Case Management
  SELECT id INTO org_id FROM organizations WHERE name = 'Intensive Case Management';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Intensive Case Management', 'Support Program - Youth Offender Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Intensive Case Management',
      lower(regexp_replace('Intensive Case Management', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Program - Youth Offender Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 122: It Takes a Community
  SELECT id INTO org_id FROM organizations WHERE name = 'It Takes a Community';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('It Takes a Community', 'Community Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'It Takes a Community',
      lower(regexp_replace('It Takes a Community', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 123: IYS - Community-based Youth Support
  SELECT id INTO org_id FROM organizations WHERE name = 'IYS - Community-based Youth Support';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('IYS - Community-based Youth Support', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'IYS - Community-based Youth Support',
      lower(regexp_replace('IYS - Community-based Youth Support', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 124: Jabalbina On-Country Extension Youth Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Jabalbina On-Country Extension Youth Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Jabalbina On-Country Extension Youth Services', 'Indigenous Program - On-Country Learning', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Jabalbina On-Country Extension Youth Services',
      lower(regexp_replace('Jabalbina On-Country Extension Youth Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Indigenous Program - On-Country Learning',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 125: Jabiru Community Youth and Children''s Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Jabiru Community Youth and Children''s Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Jabiru Community Youth and Children''s Services', 'Non-Government Organization - Community Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Jabiru Community Youth and Children''s Services',
      lower(regexp_replace('Jabiru Community Youth and Children''s Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Community Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 126: Jabiru Youth Support Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Jabiru Youth Support Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Jabiru Youth Support Services', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Jabiru Youth Support Services',
      lower(regexp_replace('Jabiru Youth Support Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 127: Justice Reform Office (JRO)
  SELECT id INTO org_id FROM organizations WHERE name = 'Justice Reform Office (JRO)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Justice Reform Office (JRO)', 'Government Agency - Justice System Reform', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Justice Reform Office (JRO)',
      lower(regexp_replace('Justice Reform Office (JRO)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Agency - Justice System Reform',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 128: KENG''s Youth Wellness Program
  SELECT id INTO org_id FROM organizations WHERE name = 'KENG''s Youth Wellness Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('KENG''s Youth Wellness Program', 'Wellbeing Program - Youth Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'KENG''s Youth Wellness Program',
      lower(regexp_replace('KENG''s Youth Wellness Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Wellbeing Program - Youth Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 129: Kindness Works COACH Youth Mentoring
  SELECT id INTO org_id FROM organizations WHERE name = 'Kindness Works COACH Youth Mentoring';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Kindness Works COACH Youth Mentoring', 'Mentoring Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Kindness Works COACH Youth Mentoring',
      lower(regexp_replace('Kindness Works COACH Youth Mentoring', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Mentoring Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 130: KOKO Transition to Community Program
  SELECT id INTO org_id FROM organizations WHERE name = 'KOKO Transition to Community Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('KOKO Transition to Community Program', 'Transition Program - Youth Reintegration', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'KOKO Transition to Community Program',
      lower(regexp_replace('KOKO Transition to Community Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Transition Program - Youth Reintegration',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 131: KYC - Youth Access Moreton Bay Initiative (YAMBI)
  SELECT id INTO org_id FROM organizations WHERE name = 'KYC - Youth Access Moreton Bay Initiative (YAMBI)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('KYC - Youth Access Moreton Bay Initiative (YAMBI)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'KYC - Youth Access Moreton Bay Initiative (YAMBI)',
      lower(regexp_replace('KYC - Youth Access Moreton Bay Initiative (YAMBI)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 132: Launchpad
  SELECT id INTO org_id FROM organizations WHERE name = 'Launchpad';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Launchpad', 'Support Service - Autism Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Launchpad',
      lower(regexp_replace('Launchpad', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Service - Autism Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 133: Legal Aid Queensland
  SELECT id INTO org_id FROM organizations WHERE name = 'Legal Aid Queensland';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Legal Aid Queensland', 'Legal Service - Youth Legal Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Legal Aid Queensland',
      lower(regexp_replace('Legal Aid Queensland', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Legal Service - Youth Legal Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 134: Life Without Barriers
  SELECT id INTO org_id FROM organizations WHERE name = 'Life Without Barriers';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Life Without Barriers', 'Non-Government Organization - Youth Justice Services', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Life Without Barriers',
      lower(regexp_replace('Life Without Barriers', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Justice Services',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 135: Live Long Live Strong
  SELECT id INTO org_id FROM organizations WHERE name = 'Live Long Live Strong';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Live Long Live Strong', 'Non-Government Organization - Youth Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Live Long Live Strong',
      lower(regexp_replace('Live Long Live Strong', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 136: Livingstone Shire Council''s Youth Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Livingstone Shire Council''s Youth Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Livingstone Shire Council''s Youth Services', 'Local Government Service - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Livingstone Shire Council''s Youth Services',
      lower(regexp_replace('Livingstone Shire Council''s Youth Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Local Government Service - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 137: Local Government Safety Fund
  SELECT id INTO org_id FROM organizations WHERE name = 'Local Government Safety Fund';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Local Government Safety Fund', 'Government Program - Community Safety', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Local Government Safety Fund',
      lower(regexp_replace('Local Government Safety Fund', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Community Safety',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 138: Lockhart River Aboriginal Shire Council Youth Supp
  SELECT id INTO org_id FROM organizations WHERE name = 'Lockhart River Aboriginal Shire Council Youth Support';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Lockhart River Aboriginal Shire Council Youth Support', 'Local Government Service - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Lockhart River Aboriginal Shire Council Youth Support',
      lower(regexp_replace('Lockhart River Aboriginal Shire Council Youth Support', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Local Government Service - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 139: Logan Youth Empowerment and Recidivism Reduction P
  SELECT id INTO org_id FROM organizations WHERE name = 'Logan Youth Empowerment and Recidivism Reduction Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Logan Youth Empowerment and Recidivism Reduction Program', 'Justice Program - Youth Justice', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Logan Youth Empowerment and Recidivism Reduction Program',
      lower(regexp_replace('Logan Youth Empowerment and Recidivism Reduction Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice Program - Youth Justice',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 140: Logan Youth Foyer
  SELECT id INTO org_id FROM organizations WHERE name = 'Logan Youth Foyer';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Logan Youth Foyer', 'Housing Program - Youth Housing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Logan Youth Foyer',
      lower(regexp_replace('Logan Youth Foyer', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Housing Program - Youth Housing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 141: LOVE BITES
  SELECT id INTO org_id FROM organizations WHERE name = 'LOVE BITES';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('LOVE BITES', 'Education Program - Respectful Relationships', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'LOVE BITES',
      lower(regexp_replace('LOVE BITES', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Education Program - Respectful Relationships',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 142: Lutheran Church Youth Justice Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Lutheran Church Youth Justice Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Lutheran Church Youth Justice Program', 'Faith-Based Organization - Youth Justice Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Lutheran Church Youth Justice Program',
      lower(regexp_replace('Lutheran Church Youth Justice Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Faith-Based Organization - Youth Justice Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 143: Made by Mob
  SELECT id INTO org_id FROM organizations WHERE name = 'Made by Mob';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Made by Mob', 'Cultural Program - Indigenous Arts', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Made by Mob',
      lower(regexp_replace('Made by Mob', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Cultural Program - Indigenous Arts',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 144: Marigurim Yalaam Indigenous Corporation
  SELECT id INTO org_id FROM organizations WHERE name = 'Marigurim Yalaam Indigenous Corporation';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Marigurim Yalaam Indigenous Corporation', 'Indigenous Organization - Cultural Justice', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Marigurim Yalaam Indigenous Corporation',
      lower(regexp_replace('Marigurim Yalaam Indigenous Corporation', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Indigenous Organization - Cultural Justice',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 145: MEEKA Intensive Transition Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'MEEKA Intensive Transition Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('MEEKA Intensive Transition Support Service', 'Support Service - Youth Transition', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'MEEKA Intensive Transition Support Service',
      lower(regexp_replace('MEEKA Intensive Transition Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Service - Youth Transition',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 146: Mission Australia
  SELECT id INTO org_id FROM organizations WHERE name = 'Mission Australia';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Mission Australia', 'Non-Government Organization - Youth Services', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Mission Australia',
      lower(regexp_replace('Mission Australia', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Services',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 147: Mission Australia (Townsville Youth Foyer)
  SELECT id INTO org_id FROM organizations WHERE name = 'Mission Australia (Townsville Youth Foyer)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Mission Australia (Townsville Youth Foyer)', 'Non-Government Organization - Youth Housing Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Mission Australia (Townsville Youth Foyer)',
      lower(regexp_replace('Mission Australia (Townsville Youth Foyer)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Housing Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 148: Mithangkaya Nguli''s Performing Arts Camp
  SELECT id INTO org_id FROM organizations WHERE name = 'Mithangkaya Nguli''s Performing Arts Camp';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Mithangkaya Nguli''s Performing Arts Camp', 'Arts Program - Indigenous Performance Arts', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Mithangkaya Nguli''s Performing Arts Camp',
      lower(regexp_replace('Mithangkaya Nguli''s Performing Arts Camp', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Arts Program - Indigenous Performance Arts',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 149: Monto Rural Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Monto Rural Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Monto Rural Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Monto Rural Youth Service',
      lower(regexp_replace('Monto Rural Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 150: Mornington Island Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Mornington Island Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Mornington Island Youth Service', 'Non-Government Organization - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Mornington Island Youth Service',
      lower(regexp_replace('Mornington Island Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 151: Mossman Youth Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Mossman Youth Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Mossman Youth Services', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Mossman Youth Services',
      lower(regexp_replace('Mossman Youth Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 152: Mount Isa Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Mount Isa Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Mount Isa Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Mount Isa Youth Support Service',
      lower(regexp_replace('Mount Isa Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 153: Mt Gravatt Police Citizens Youth Club
  SELECT id INTO org_id FROM organizations WHERE name = 'Mt Gravatt Police Citizens Youth Club';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Mt Gravatt Police Citizens Youth Club', 'PCYC Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Mt Gravatt Police Citizens Youth Club',
      lower(regexp_replace('Mt Gravatt Police Citizens Youth Club', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'PCYC Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 154: Multicultural Australia
  SELECT id INTO org_id FROM organizations WHERE name = 'Multicultural Australia';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Multicultural Australia', 'Non-Government Organization - Multicultural Youth', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Multicultural Australia',
      lower(regexp_replace('Multicultural Australia', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Multicultural Youth',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 155: Mungalla SLS Community Youth Officer
  SELECT id INTO org_id FROM organizations WHERE name = 'Mungalla SLS Community Youth Officer';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Mungalla SLS Community Youth Officer', 'Support Role - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Mungalla SLS Community Youth Officer',
      lower(regexp_replace('Mungalla SLS Community Youth Officer', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Role - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 156: Murma Thalgarie
  SELECT id INTO org_id FROM organizations WHERE name = 'Murma Thalgarie';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Murma Thalgarie', 'Cultural Program - Indigenous Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Murma Thalgarie',
      lower(regexp_replace('Murma Thalgarie', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Cultural Program - Indigenous Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 157: Murra Pathways
  SELECT id INTO org_id FROM organizations WHERE name = 'Murra Pathways';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Murra Pathways', 'Career Program - Indigenous Employment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Murra Pathways',
      lower(regexp_replace('Murra Pathways', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Career Program - Indigenous Employment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 158: My Connect
  SELECT id INTO org_id FROM organizations WHERE name = 'My Connect';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('My Connect', 'Support Program - Youth Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'My Connect',
      lower(regexp_replace('My Connect', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Program - Youth Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 159: Napranum Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Napranum Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Napranum Youth Support Service', 'Non-Government Organization - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Napranum Youth Support Service',
      lower(regexp_replace('Napranum Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 160: National Housing Infrastructure Facility Crisis an
  SELECT id INTO org_id FROM organizations WHERE name = 'National Housing Infrastructure Facility Crisis and Transitional (NHIF CT)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('National Housing Infrastructure Facility Crisis and Transitional (NHIF CT)', 'Government Program - Homelessness Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'National Housing Infrastructure Facility Crisis and Transitional (NHIF CT)',
      lower(regexp_replace('National Housing Infrastructure Facility Crisis and Transitional (NHIF CT)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Homelessness Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 161: National Office for Youth - Promotion of STEM Yout
  SELECT id INTO org_id FROM organizations WHERE name = 'National Office for Youth - Promotion of STEM Youth Advisory Group';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('National Office for Youth - Promotion of STEM Youth Advisory Group', 'Advisory Group - STEM Education', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'National Office for Youth - Promotion of STEM Youth Advisory Group',
      lower(regexp_replace('National Office for Youth - Promotion of STEM Youth Advisory Group', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Advisory Group - STEM Education',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 162: National Office for Youth - Safe and Supported You
  SELECT id INTO org_id FROM organizations WHERE name = 'National Office for Youth - Safe and Supported Youth Advisory Group';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('National Office for Youth - Safe and Supported Youth Advisory Group', 'Advisory Group - Child Protection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'National Office for Youth - Safe and Supported Youth Advisory Group',
      lower(regexp_replace('National Office for Youth - Safe and Supported Youth Advisory Group', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Advisory Group - Child Protection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 163: Navigate Your Health
  SELECT id INTO org_id FROM organizations WHERE name = 'Navigate Your Health';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Navigate Your Health', 'Health Program - Youth Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Navigate Your Health',
      lower(regexp_replace('Navigate Your Health', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Health Program - Youth Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 164: Nerang Neighbourhood Centre Youth Support Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Nerang Neighbourhood Centre Youth Support Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Nerang Neighbourhood Centre Youth Support Program', 'Community Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Nerang Neighbourhood Centre Youth Support Program',
      lower(regexp_replace('Nerang Neighbourhood Centre Youth Support Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 165: NextGen Leadership
  SELECT id INTO org_id FROM organizations WHERE name = 'NextGen Leadership';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('NextGen Leadership', 'Leadership Program - Youth Leadership', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'NextGen Leadership',
      lower(regexp_replace('NextGen Leadership', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Leadership Program - Youth Leadership',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 166: Noosa Youth Connect Space
  SELECT id INTO org_id FROM organizations WHERE name = 'Noosa Youth Connect Space';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Noosa Youth Connect Space', 'Community Space - Youth Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Noosa Youth Connect Space',
      lower(regexp_replace('Noosa Youth Connect Space', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Space - Youth Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 167: NPA Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'NPA Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('NPA Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'NPA Youth Support Service',
      lower(regexp_replace('NPA Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 168: One Under the Sun
  SELECT id INTO org_id FROM organizations WHERE name = 'One Under the Sun';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('One Under the Sun', 'Unity Program - Youth Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'One Under the Sun',
      lower(regexp_replace('One Under the Sun', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Unity Program - Youth Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 169: Onwards & Upwards wellbeing mentoring program
  SELECT id INTO org_id FROM organizations WHERE name = 'Onwards & Upwards wellbeing mentoring program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Onwards & Upwards wellbeing mentoring program', 'Mentoring Program - Youth Wellbeing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Onwards & Upwards wellbeing mentoring program',
      lower(regexp_replace('Onwards & Upwards wellbeing mentoring program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Mentoring Program - Youth Wellbeing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 170: Open Doors Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Open Doors Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Open Doors Youth Service', 'Non-Government Organization - LGBTIQ+ Youth', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Open Doors Youth Service',
      lower(regexp_replace('Open Doors Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - LGBTIQ+ Youth',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 171: Our Learning Our Way
  SELECT id INTO org_id FROM organizations WHERE name = 'Our Learning Our Way';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Our Learning Our Way', 'Educational Program - Indigenous Education', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Our Learning Our Way',
      lower(regexp_replace('Our Learning Our Way', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Educational Program - Indigenous Education',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 172: Our Space Team Development
  SELECT id INTO org_id FROM organizations WHERE name = 'Our Space Team Development';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Our Space Team Development', 'Team Building Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Our Space Team Development',
      lower(regexp_replace('Our Space Team Development', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Team Building Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 173: Paroo Youth Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Paroo Youth Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Paroo Youth Program', 'Government Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Paroo Youth Program',
      lower(regexp_replace('Paroo Youth Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 174: Pathway to Purpose Project
  SELECT id INTO org_id FROM organizations WHERE name = 'Pathway to Purpose Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Pathway to Purpose Project', 'Development Program - Youth Purpose', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Pathway to Purpose Project',
      lower(regexp_replace('Pathway to Purpose Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Development Program - Youth Purpose',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 175: PCYC Braking the Cycle
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Braking the Cycle';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Braking the Cycle', 'Mentoring Program - Driver Education', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Braking the Cycle',
      lower(regexp_replace('PCYC Braking the Cycle', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Mentoring Program - Driver Education',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 176: PCYC Deep Blue Line
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Deep Blue Line';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Deep Blue Line', 'Youth Program - Police Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Deep Blue Line',
      lower(regexp_replace('PCYC Deep Blue Line', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Police Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 177: PCYC Emergency Services Cadets
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Emergency Services Cadets';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Emergency Services Cadets', 'Youth Program - Emergency Services Training', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Emergency Services Cadets',
      lower(regexp_replace('PCYC Emergency Services Cadets', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Emergency Services Training',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 178: PCYC Hervey Bay Service
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Hervey Bay Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Hervey Bay Service', 'PCYC Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Hervey Bay Service',
      lower(regexp_replace('PCYC Hervey Bay Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'PCYC Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 179: PCYC Mackay Community Culture Youth Program
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Mackay Community Culture Youth Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Mackay Community Culture Youth Program', 'Community Program - Youth Culture', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Mackay Community Culture Youth Program',
      lower(regexp_replace('PCYC Mackay Community Culture Youth Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Program - Youth Culture',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 180: PCYC Mareeba POST program
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Mareeba POST program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Mareeba POST program', 'PCYC Program - Youth Training', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Mareeba POST program',
      lower(regexp_replace('PCYC Mareeba POST program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'PCYC Program - Youth Training',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 181: PCYC Mornington Island After Dark Drop-in Program
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Mornington Island After Dark Drop-in Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Mornington Island After Dark Drop-in Program', 'Community Program - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Mornington Island After Dark Drop-in Program',
      lower(regexp_replace('PCYC Mornington Island After Dark Drop-in Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Program - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 182: PCYC Queensland
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Queensland';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Queensland', 'Non-Government Organization - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Queensland',
      lower(regexp_replace('PCYC Queensland', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 183: PCYC Safer Communities Program
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Safer Communities Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Safer Communities Program', 'Non-Government Program - Crime Prevention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Safer Communities Program',
      lower(regexp_replace('PCYC Safer Communities Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Program - Crime Prevention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 184: PCYC Yarrabah After School Programming
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Yarrabah After School Programming';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Yarrabah After School Programming', 'After-School Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Yarrabah After School Programming',
      lower(regexp_replace('PCYC Yarrabah After School Programming', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'After-School Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 185: PCYC Zillmere Basketball After Dark Program
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Zillmere Basketball After Dark Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Zillmere Basketball After Dark Program', 'Sports Program - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Zillmere Basketball After Dark Program',
      lower(regexp_replace('PCYC Zillmere Basketball After Dark Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Sports Program - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 186: PCYC Zillmere Learner Licence Road Safety Program
  SELECT id INTO org_id FROM organizations WHERE name = 'PCYC Zillmere Learner Licence Road Safety Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('PCYC Zillmere Learner Licence Road Safety Program', 'Education Program - Driver Education', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'PCYC Zillmere Learner Licence Road Safety Program',
      lower(regexp_replace('PCYC Zillmere Learner Licence Road Safety Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Education Program - Driver Education',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 187: Peirson Services Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Peirson Services Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Peirson Services Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Peirson Services Youth Support Service',
      lower(regexp_replace('Peirson Services Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 188: Picabeen Bright Futures Project
  SELECT id INTO org_id FROM organizations WHERE name = 'Picabeen Bright Futures Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Picabeen Bright Futures Project', 'Non-Government Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Picabeen Bright Futures Project',
      lower(regexp_replace('Picabeen Bright Futures Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 189: Picabeen Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Picabeen Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Picabeen Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Picabeen Youth Support Service',
      lower(regexp_replace('Picabeen Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 190: Preventing Violence Affecting Young Lives
  SELECT id INTO org_id FROM organizations WHERE name = 'Preventing Violence Affecting Young Lives';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Preventing Violence Affecting Young Lives', 'Prevention Program - Violence Prevention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Preventing Violence Affecting Young Lives',
      lower(regexp_replace('Preventing Violence Affecting Young Lives', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Prevention Program - Violence Prevention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 191: Project Booyah
  SELECT id INTO org_id FROM organizations WHERE name = 'Project Booyah';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Project Booyah', 'Police-led Program - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Project Booyah',
      lower(regexp_replace('Project Booyah', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Police-led Program - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 192: Project Valkyrie
  SELECT id INTO org_id FROM organizations WHERE name = 'Project Valkyrie';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Project Valkyrie', 'Youth Program - Youth Empowerment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Project Valkyrie',
      lower(regexp_replace('Project Valkyrie', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Youth Empowerment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 193: Proserpine Youth Space - Youth Development Facilit
  SELECT id INTO org_id FROM organizations WHERE name = 'Proserpine Youth Space - Youth Development Facility';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Proserpine Youth Space - Youth Development Facility', 'Youth Facility - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Proserpine Youth Space - Youth Development Facility',
      lower(regexp_replace('Proserpine Youth Space - Youth Development Facility', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Facility - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 194: Prospect Community Services Youth Support Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Prospect Community Services Youth Support Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Prospect Community Services Youth Support Program', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Prospect Community Services Youth Support Program',
      lower(regexp_replace('Prospect Community Services Youth Support Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 195: Proud Warrior (Queensland Youth Services)
  SELECT id INTO org_id FROM organizations WHERE name = 'Proud Warrior (Queensland Youth Services)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Proud Warrior (Queensland Youth Services)', 'Non-Government Organization - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Proud Warrior (Queensland Youth Services)',
      lower(regexp_replace('Proud Warrior (Queensland Youth Services)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 196: QATSICPP (Youth Justice Peak)
  SELECT id INTO org_id FROM organizations WHERE name = 'QATSICPP (Youth Justice Peak)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('QATSICPP (Youth Justice Peak)', 'Peak Body - Youth Justice Coordination', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'QATSICPP (Youth Justice Peak)',
      lower(regexp_replace('QATSICPP (Youth Justice Peak)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Peak Body - Youth Justice Coordination',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 197: QPCYWA Palm Island Youth Support
  SELECT id INTO org_id FROM organizations WHERE name = 'QPCYWA Palm Island Youth Support';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('QPCYWA Palm Island Youth Support', 'PCYC Program - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'QPCYWA Palm Island Youth Support',
      lower(regexp_replace('QPCYWA Palm Island Youth Support', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'PCYC Program - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 198: Queensland Aboriginal and Torres Strait Island Chi
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Aboriginal and Torres Strait Island Child Protection Peak (QATSICPP)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Aboriginal and Torres Strait Island Child Protection Peak (QATSICPP)', 'Peak Body - Youth Justice Coordination', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Aboriginal and Torres Strait Island Child Protection Peak (QATSICPP)',
      lower(regexp_replace('Queensland Aboriginal and Torres Strait Island Child Protection Peak (QATSICPP)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Peak Body - Youth Justice Coordination',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 199: Queensland Council of Social Services (QCOSS)
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Council of Social Services (QCOSS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Council of Social Services (QCOSS)', 'Peak Body - Social Services', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Council of Social Services (QCOSS)',
      lower(regexp_replace('Queensland Council of Social Services (QCOSS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Peak Body - Social Services',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 200: Queensland Family and Child Commission (QFCC) Yout
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Family and Child Commission (QFCC) Youth Advocates';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Family and Child Commission (QFCC) Youth Advocates', 'Government Agency - Youth Advocacy', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Family and Child Commission (QFCC) Youth Advocates',
      lower(regexp_replace('Queensland Family and Child Commission (QFCC) Youth Advocates', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Agency - Youth Advocacy',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 201: Queensland Health
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Health';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Health', 'Government Department - Health Services', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Health',
      lower(regexp_replace('Queensland Health', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Department - Health Services',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 202: Queensland Health Youth Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Health Youth Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Health Youth Services', 'Health Service - Youth Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Health Youth Services',
      lower(regexp_replace('Queensland Health Youth Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Health Service - Youth Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 203: Queensland Indigenous Youth Leadership Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Indigenous Youth Leadership Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Indigenous Youth Leadership Program', 'Government Program - Indigenous Leadership', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Indigenous Youth Leadership Program',
      lower(regexp_replace('Queensland Indigenous Youth Leadership Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Indigenous Leadership',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 204: Queensland Pathways College
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Pathways College';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Pathways College', 'Educational Institution - Detention Education', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    service_categories := array_append(service_categories, 'court_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Pathways College',
      lower(regexp_replace('Queensland Pathways College', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Educational Institution - Detention Education',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 205: Queensland Police Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Police Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Police Service', 'Government Department - Law Enforcement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Police Service',
      lower(regexp_replace('Queensland Police Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Department - Law Enforcement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 206: Queensland Youth and Families Support Services (QY
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Youth and Families Support Services (QYFSS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Youth and Families Support Services (QYFSS)', 'Non-Government Organization - Family Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Youth and Families Support Services (QYFSS)',
      lower(regexp_replace('Queensland Youth and Families Support Services (QYFSS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Family Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 207: Queensland Youth eHub
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Youth eHub';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Youth eHub', 'Online Platform - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Youth eHub',
      lower(regexp_replace('Queensland Youth eHub', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Online Platform - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 208: Queensland Youth Housing Coalition
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Youth Housing Coalition';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Youth Housing Coalition', 'Advocacy Organization - Housing Advocacy', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Youth Housing Coalition',
      lower(regexp_replace('Queensland Youth Housing Coalition', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Advocacy Organization - Housing Advocacy',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 209: Queensland Youth Parliament (QYP)
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Youth Parliament (QYP)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Youth Parliament (QYP)', 'Youth Program - Youth Governance', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Youth Parliament (QYP)',
      lower(regexp_replace('Queensland Youth Parliament (QYP)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Youth Governance',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 210: Queensland Youth Services (QYS)
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Youth Services (QYS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Youth Services (QYS)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Youth Services (QYS)',
      lower(regexp_replace('Queensland Youth Services (QYS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 211: Queensland Youth Week
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Youth Week';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Youth Week', 'Government Event - Youth Celebration', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Youth Week',
      lower(regexp_replace('Queensland Youth Week', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Event - Youth Celebration',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 212: Queensland Youth Week (QYW)
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland Youth Week (QYW)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland Youth Week (QYW)', 'Government Initiative - Youth Celebration', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland Youth Week (QYW)',
      lower(regexp_replace('Queensland Youth Week (QYW)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Initiative - Youth Celebration',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 213: Queensland''s Department of Youth
  SELECT id INTO org_id FROM organizations WHERE name = 'Queensland''s Department of Youth';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Queensland''s Department of Youth', 'Government Department - Youth Services', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Queensland''s Department of Youth',
      lower(regexp_replace('Queensland''s Department of Youth', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Department - Youth Services',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 214: QYS Early Intervention Program
  SELECT id INTO org_id FROM organizations WHERE name = 'QYS Early Intervention Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('QYS Early Intervention Program', 'Non-Government Program - Family Stability', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'QYS Early Intervention Program',
      lower(regexp_replace('QYS Early Intervention Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Program - Family Stability',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 215: QYS Housing Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'QYS Housing Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('QYS Housing Support Service', 'Non-Government Program - Youth Housing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'QYS Housing Support Service',
      lower(regexp_replace('QYS Housing Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Program - Youth Housing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 216: QYS Learner Driver Mentor Program
  SELECT id INTO org_id FROM organizations WHERE name = 'QYS Learner Driver Mentor Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('QYS Learner Driver Mentor Program', 'Non-Government Program - Driver Education', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'QYS Learner Driver Mentor Program',
      lower(regexp_replace('QYS Learner Driver Mentor Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Program - Driver Education',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 217: QYS Mental Health Initiative
  SELECT id INTO org_id FROM organizations WHERE name = 'QYS Mental Health Initiative';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('QYS Mental Health Initiative', 'Non-Government Program - Youth Mental Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'QYS Mental Health Initiative',
      lower(regexp_replace('QYS Mental Health Initiative', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Program - Youth Mental Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 218: QYS Young Parent Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'QYS Young Parent Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('QYS Young Parent Support Service', 'Non-Government Program - Young Parent Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'QYS Young Parent Support Service',
      lower(regexp_replace('QYS Young Parent Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Program - Young Parent Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 219: Ravenshoe Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Ravenshoe Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Ravenshoe Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Ravenshoe Youth Support Service',
      lower(regexp_replace('Ravenshoe Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 220: Raw Impact Cultural Connection
  SELECT id INTO org_id FROM organizations WHERE name = 'Raw Impact Cultural Connection';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Raw Impact Cultural Connection', 'Non-Government Organization - Cultural Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Raw Impact Cultural Connection',
      lower(regexp_replace('Raw Impact Cultural Connection', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Cultural Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 221: RAYS - Youth Access Moreton Bay Initiative (YAMBI)
  SELECT id INTO org_id FROM organizations WHERE name = 'RAYS - Youth Access Moreton Bay Initiative (YAMBI)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('RAYS - Youth Access Moreton Bay Initiative (YAMBI)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'RAYS - Youth Access Moreton Bay Initiative (YAMBI)',
      lower(regexp_replace('RAYS - Youth Access Moreton Bay Initiative (YAMBI)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 222: Re-thinking Our Attitude to Driving (ROAD)
  SELECT id INTO org_id FROM organizations WHERE name = 'Re-thinking Our Attitude to Driving (ROAD)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Re-thinking Our Attitude to Driving (ROAD)', 'Justice Program - Motor Vehicle Offending', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Re-thinking Our Attitude to Driving (ROAD)',
      lower(regexp_replace('Re-thinking Our Attitude to Driving (ROAD)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice Program - Motor Vehicle Offending',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 223: Recognise Reflect Respect
  SELECT id INTO org_id FROM organizations WHERE name = 'Recognise Reflect Respect';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Recognise Reflect Respect', 'Education Program - Male Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Recognise Reflect Respect',
      lower(regexp_replace('Recognise Reflect Respect', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Education Program - Male Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 224: Redcliffe Area Youth Space
  SELECT id INTO org_id FROM organizations WHERE name = 'Redcliffe Area Youth Space';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Redcliffe Area Youth Space', 'Youth Service - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Redcliffe Area Youth Space',
      lower(regexp_replace('Redcliffe Area Youth Space', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Service - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 225: Regional Youth Support Coordinator
  SELECT id INTO org_id FROM organizations WHERE name = 'Regional Youth Support Coordinator';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Regional Youth Support Coordinator', 'Government Role - Youth Support Coordination', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Regional Youth Support Coordinator',
      lower(regexp_replace('Regional Youth Support Coordinator', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Role - Youth Support Coordination',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 226: Regional Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Regional Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Regional Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Regional Youth Support Service',
      lower(regexp_replace('Regional Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 227: Restorative Justice Conferencing
  SELECT id INTO org_id FROM organizations WHERE name = 'Restorative Justice Conferencing';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Restorative Justice Conferencing', 'Justice Program - Youth Justice', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Restorative Justice Conferencing',
      lower(regexp_replace('Restorative Justice Conferencing', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice Program - Youth Justice',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 228: Restorative Justice Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Restorative Justice Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Restorative Justice Program', 'Justice Program - Youth Rehabilitation', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Restorative Justice Program',
      lower(regexp_replace('Restorative Justice Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Justice Program - Youth Rehabilitation',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 229: Revamp and Ride Youth Bike Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Revamp and Ride Youth Bike Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Revamp and Ride Youth Bike Program', 'Skill Development Program - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Revamp and Ride Youth Bike Program',
      lower(regexp_replace('Revamp and Ride Youth Bike Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Skill Development Program - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 230: Rockhampton PCYC Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Rockhampton PCYC Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Rockhampton PCYC Youth Service', 'PCYC Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Rockhampton PCYC Youth Service',
      lower(regexp_replace('Rockhampton PCYC Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'PCYC Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 231: Roma and Maranoa Youth Support
  SELECT id INTO org_id FROM organizations WHERE name = 'Roma and Maranoa Youth Support';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Roma and Maranoa Youth Support', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Roma and Maranoa Youth Support',
      lower(regexp_replace('Roma and Maranoa Youth Support', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 232: Roseberry Community Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Roseberry Community Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Roseberry Community Services', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Roseberry Community Services',
      lower(regexp_replace('Roseberry Community Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 233: Sakura ''You Can Do It!'' Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Sakura ''You Can Do It!'' Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Sakura ''You Can Do It!'' Program', 'Empowerment Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Sakura ''You Can Do It!'' Program',
      lower(regexp_replace('Sakura ''You Can Do It!'' Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Empowerment Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 234: Salvation Army Forest Lake Youth Work Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Salvation Army Forest Lake Youth Work Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Salvation Army Forest Lake Youth Work Services', 'Faith-Based Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Salvation Army Forest Lake Youth Work Services',
      lower(regexp_replace('Salvation Army Forest Lake Youth Work Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Faith-Based Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 235: Sarina District Youth Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Sarina District Youth Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Sarina District Youth Services', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Sarina District Youth Services',
      lower(regexp_replace('Sarina District Youth Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 236: Save the Children Australia
  SELECT id INTO org_id FROM organizations WHERE name = 'Save the Children Australia';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Save the Children Australia', 'Non-Government Organization - Child Welfare', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Save the Children Australia',
      lower(regexp_replace('Save the Children Australia', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Child Welfare',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 237: School-based Policing Program
  SELECT id INTO org_id FROM organizations WHERE name = 'School-based Policing Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('School-based Policing Program', 'Police Program - School Safety', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'School-based Policing Program',
      lower(regexp_replace('School-based Policing Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Police Program - School Safety',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 238: Selectability Limited After-Hours Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Selectability Limited After-Hours Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Selectability Limited After-Hours Program', 'Non-Government Organization - Youth Outreach', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Selectability Limited After-Hours Program',
      lower(regexp_replace('Selectability Limited After-Hours Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Outreach',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 239: Shifting Gears
  SELECT id INTO org_id FROM organizations WHERE name = 'Shifting Gears';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Shifting Gears', 'Skills Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Shifting Gears',
      lower(regexp_replace('Shifting Gears', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Skills Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 240: So Youth Pilot Program
  SELECT id INTO org_id FROM organizations WHERE name = 'So Youth Pilot Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('So Youth Pilot Program', 'Recreation Program - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'So Youth Pilot Program',
      lower(regexp_replace('So Youth Pilot Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Recreation Program - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 241: South Burnett Youth Services (FUSION)
  SELECT id INTO org_id FROM organizations WHERE name = 'South Burnett Youth Services (FUSION)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('South Burnett Youth Services (FUSION)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'South Burnett Youth Services (FUSION)',
      lower(regexp_replace('South Burnett Youth Services (FUSION)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 242: Speak OUT
  SELECT id INTO org_id FROM organizations WHERE name = 'Speak OUT';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Speak OUT', 'Government Initiative - Youth Voice', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Speak OUT',
      lower(regexp_replace('Speak OUT', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Initiative - Youth Voice',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 243: Springfield Youth Sports Hub
  SELECT id INTO org_id FROM organizations WHERE name = 'Springfield Youth Sports Hub';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Springfield Youth Sports Hub', 'Sports Facility - Youth Recreation', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Springfield Youth Sports Hub',
      lower(regexp_replace('Springfield Youth Sports Hub', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Sports Facility - Youth Recreation',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 244: St George Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'St George Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('St George Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'St George Youth Support Service',
      lower(regexp_replace('St George Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 245: State Youth Leadership Program (SYLP)
  SELECT id INTO org_id FROM organizations WHERE name = 'State Youth Leadership Program (SYLP)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('State Youth Leadership Program (SYLP)', 'Government Program - Leadership Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'State Youth Leadership Program (SYLP)',
      lower(regexp_replace('State Youth Leadership Program (SYLP)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Leadership Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 246: Street CRED
  SELECT id INTO org_id FROM organizations WHERE name = 'Street CRED';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Street CRED', 'Outreach Program - Youth Outreach', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Street CRED',
      lower(regexp_replace('Street CRED', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Outreach Program - Youth Outreach',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 247: Street University
  SELECT id INTO org_id FROM organizations WHERE name = 'Street University';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Street University', 'Youth Center - Urban Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Street University',
      lower(regexp_replace('Street University', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Center - Urban Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 248: Stronger Community Justice Group (CJG)
  SELECT id INTO org_id FROM organizations WHERE name = 'Stronger Community Justice Group (CJG)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Stronger Community Justice Group (CJG)', 'Community Program - Indigenous Justice Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Stronger Community Justice Group (CJG)',
      lower(regexp_replace('Stronger Community Justice Group (CJG)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Program - Indigenous Justice Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 249: Stronger Connections
  SELECT id INTO org_id FROM organizations WHERE name = 'Stronger Connections';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Stronger Connections', 'Support Program - Youth Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Stronger Connections',
      lower(regexp_replace('Stronger Connections', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Program - Youth Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 250: Supporting Young Women to Safety Connection and We
  SELECT id INTO org_id FROM organizations WHERE name = 'Supporting Young Women to Safety Connection and Wellness';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Supporting Young Women to Safety Connection and Wellness', 'Gender-Specific Program - Female Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Supporting Young Women to Safety Connection and Wellness',
      lower(regexp_replace('Supporting Young Women to Safety Connection and Wellness', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Gender-Specific Program - Female Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 251: T-REK Program (Youth Off The Streets)
  SELECT id INTO org_id FROM organizations WHERE name = 'T-REK Program (Youth Off The Streets)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('T-REK Program (Youth Off The Streets)', 'Non-Government Organization - Youth Justice Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'T-REK Program (Youth Off The Streets)',
      lower(regexp_replace('T-REK Program (Youth Off The Streets)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Justice Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 252: Tablelands Youth Support Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Tablelands Youth Support Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Tablelands Youth Support Program', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Tablelands Youth Support Program',
      lower(regexp_replace('Tablelands Youth Support Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 253: TAIHS Youth Support Services (TYSS)
  SELECT id INTO org_id FROM organizations WHERE name = 'TAIHS Youth Support Services (TYSS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('TAIHS Youth Support Services (TYSS)', 'Indigenous Health Service - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'TAIHS Youth Support Services (TYSS)',
      lower(regexp_replace('TAIHS Youth Support Services (TYSS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Indigenous Health Service - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 254: Taskforce Guardian
  SELECT id INTO org_id FROM organizations WHERE name = 'Taskforce Guardian';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Taskforce Guardian', 'Government Team - Youth Crime Response', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Taskforce Guardian',
      lower(regexp_replace('Taskforce Guardian', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Team - Youth Crime Response',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 255: Ted Noffs Foundation
  SELECT id INTO org_id FROM organizations WHERE name = 'Ted Noffs Foundation';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Ted Noffs Foundation', 'Non-Government Organization - At-risk Youth', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Ted Noffs Foundation',
      lower(regexp_replace('Ted Noffs Foundation', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - At-risk Youth',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 256: The Block (Winangali Infusion)
  SELECT id INTO org_id FROM organizations WHERE name = 'The Block (Winangali Infusion)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Block (Winangali Infusion)', 'Community Hub - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Block (Winangali Infusion)',
      lower(regexp_replace('The Block (Winangali Infusion)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Hub - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 257: The Bridge Award
  SELECT id INTO org_id FROM organizations WHERE name = 'The Bridge Award';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Bridge Award', 'Youth Program - Personal Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Bridge Award',
      lower(regexp_replace('The Bridge Award', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Personal Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 258: The Deadly Matters Program
  SELECT id INTO org_id FROM organizations WHERE name = 'The Deadly Matters Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Deadly Matters Program', 'Indigenous Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Deadly Matters Program',
      lower(regexp_replace('The Deadly Matters Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Indigenous Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 259: The Drop Zone
  SELECT id INTO org_id FROM organizations WHERE name = 'The Drop Zone';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Drop Zone', 'Youth Space - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Drop Zone',
      lower(regexp_replace('The Drop Zone', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Space - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 260: The Duke of Edinburgh''s International Award
  SELECT id INTO org_id FROM organizations WHERE name = 'The Duke of Edinburgh''s International Award';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Duke of Edinburgh''s International Award', 'International Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Duke of Edinburgh''s International Award',
      lower(regexp_replace('The Duke of Edinburgh''s International Award', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'International Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 261: The Foyer Foundation
  SELECT id INTO org_id FROM organizations WHERE name = 'The Foyer Foundation';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Foyer Foundation', 'Advocacy Organization - Youth Homelessness', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Foyer Foundation',
      lower(regexp_replace('The Foyer Foundation', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Advocacy Organization - Youth Homelessness',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 262: The Lighthouse: Youth After Hours Diversionary Ser
  SELECT id INTO org_id FROM organizations WHERE name = 'The Lighthouse: Youth After Hours Diversionary Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Lighthouse: Youth After Hours Diversionary Service', 'Diversionary Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'court_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Lighthouse: Youth After Hours Diversionary Service',
      lower(regexp_replace('The Lighthouse: Youth After Hours Diversionary Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Diversionary Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 263: The Murri Bus
  SELECT id INTO org_id FROM organizations WHERE name = 'The Murri Bus';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Murri Bus', 'Outreach Service - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Murri Bus',
      lower(regexp_replace('The Murri Bus', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Outreach Service - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 264: The Salvation Army Youth Outreach Service
  SELECT id INTO org_id FROM organizations WHERE name = 'The Salvation Army Youth Outreach Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Salvation Army Youth Outreach Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Salvation Army Youth Outreach Service',
      lower(regexp_replace('The Salvation Army Youth Outreach Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 265: The Smith Family''s iTrack
  SELECT id INTO org_id FROM organizations WHERE name = 'The Smith Family''s iTrack';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('The Smith Family''s iTrack', 'Online Mentoring - Career Transitions', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'The Smith Family''s iTrack',
      lower(regexp_replace('The Smith Family''s iTrack', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Online Mentoring - Career Transitions',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 266: Townsville Youth Foyer
  SELECT id INTO org_id FROM organizations WHERE name = 'Townsville Youth Foyer';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Townsville Youth Foyer', 'Housing Program - Youth Housing', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Townsville Youth Foyer',
      lower(regexp_replace('Townsville Youth Foyer', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Housing Program - Youth Housing',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 267: TR Youth Community Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'TR Youth Community Centre';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('TR Youth Community Centre', 'Community Center - Youth Empowerment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'TR Youth Community Centre',
      lower(regexp_replace('TR Youth Community Centre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Center - Youth Empowerment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 268: Transition 2 Success (T2S)
  SELECT id INTO org_id FROM organizations WHERE name = 'Transition 2 Success (T2S)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Transition 2 Success (T2S)', 'Government Program - Education & Training', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Transition 2 Success (T2S)',
      lower(regexp_replace('Transition 2 Success (T2S)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Education & Training',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 269: Trauma-Informed Yoga for Youth via TAIHS
  SELECT id INTO org_id FROM organizations WHERE name = 'Trauma-Informed Yoga for Youth via TAIHS';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Trauma-Informed Yoga for Youth via TAIHS', 'Therapy Program - Youth Trauma Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Trauma-Informed Yoga for Youth via TAIHS',
      lower(regexp_replace('Trauma-Informed Yoga for Youth via TAIHS', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Therapy Program - Youth Trauma Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 270: TTC''s Building Better Men
  SELECT id INTO org_id FROM organizations WHERE name = 'TTC''s Building Better Men';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('TTC''s Building Better Men', 'Mentoring Program - Male Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'TTC''s Building Better Men',
      lower(regexp_replace('TTC''s Building Better Men', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Mentoring Program - Male Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 271: Turning Point
  SELECT id INTO org_id FROM organizations WHERE name = 'Turning Point';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Turning Point', 'Intervention Program - Youth Redirection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Turning Point',
      lower(regexp_replace('Turning Point', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Intervention Program - Youth Redirection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 272: UCC Aspire Burdekin
  SELECT id INTO org_id FROM organizations WHERE name = 'UCC Aspire Burdekin';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('UCC Aspire Burdekin', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'UCC Aspire Burdekin',
      lower(regexp_replace('UCC Aspire Burdekin', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 273: Valley District Youth Services
  SELECT id INTO org_id FROM organizations WHERE name = 'Valley District Youth Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Valley District Youth Services', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Valley District Youth Services',
      lower(regexp_replace('Valley District Youth Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 274: Vocational Training Queensland
  SELECT id INTO org_id FROM organizations WHERE name = 'Vocational Training Queensland';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Vocational Training Queensland', 'Educational Service - Vocational Training', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Vocational Training Queensland',
      lower(regexp_replace('Vocational Training Queensland', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Educational Service - Vocational Training',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 275: Walk About Burun
  SELECT id INTO org_id FROM organizations WHERE name = 'Walk About Burun';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Walk About Burun', 'Cultural Program - Indigenous Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Walk About Burun',
      lower(regexp_replace('Walk About Burun', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Cultural Program - Indigenous Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 276: Walk about Training
  SELECT id INTO org_id FROM organizations WHERE name = 'Walk about Training';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Walk about Training', 'Training Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Walk about Training',
      lower(regexp_replace('Walk about Training', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Training Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 277: Walking on Yarun
  SELECT id INTO org_id FROM organizations WHERE name = 'Walking on Yarun';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Walking on Yarun', 'Cultural Program - Indigenous Connection', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Walking on Yarun',
      lower(regexp_replace('Walking on Yarun', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Cultural Program - Indigenous Connection',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 278: Warwick Youth Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Warwick Youth Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Warwick Youth Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Warwick Youth Support Service',
      lower(regexp_replace('Warwick Youth Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 279: Wesley Mission Queensland
  SELECT id INTO org_id FROM organizations WHERE name = 'Wesley Mission Queensland';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Wesley Mission Queensland', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Wesley Mission Queensland',
      lower(regexp_replace('Wesley Mission Queensland', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 280: West Moreton Youth Detention Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'West Moreton Youth Detention Centre';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('West Moreton Youth Detention Centre', 'Government Facility - Youth Detention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'court_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'West Moreton Youth Detention Centre',
      lower(regexp_replace('West Moreton Youth Detention Centre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Facility - Youth Detention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 281: Western Region Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Western Region Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Western Region Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Western Region Youth Service',
      lower(regexp_replace('Western Region Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 282: Winton Shire Council Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Winton Shire Council Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Winton Shire Council Youth Service', 'Local Government Service - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Winton Shire Council Youth Service',
      lower(regexp_replace('Winton Shire Council Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Local Government Service - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 283: WMB Logan Youth Support Services
  SELECT id INTO org_id FROM organizations WHERE name = 'WMB Logan Youth Support Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('WMB Logan Youth Support Services', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'WMB Logan Youth Support Services',
      lower(regexp_replace('WMB Logan Youth Support Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 284: WMB Youth and Parenting Support Services (YHES Hou
  SELECT id INTO org_id FROM organizations WHERE name = 'WMB Youth and Parenting Support Services (YHES House)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('WMB Youth and Parenting Support Services (YHES House)', 'Non-Government Organization - Youth and Family Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'WMB Youth and Parenting Support Services (YHES House)',
      lower(regexp_replace('WMB Youth and Parenting Support Services (YHES House)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth and Family Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 285: WMQ Youth Support Services
  SELECT id INTO org_id FROM organizations WHERE name = 'WMQ Youth Support Services';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('WMQ Youth Support Services', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'WMQ Youth Support Services',
      lower(regexp_replace('WMQ Youth Support Services', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 286: Y-M-Power Project
  SELECT id INTO org_id FROM organizations WHERE name = 'Y-M-Power Project';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Y-M-Power Project', 'Empowerment Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Y-M-Power Project',
      lower(regexp_replace('Y-M-Power Project', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Empowerment Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 287: YACCA Youth Development Program
  SELECT id INTO org_id FROM organizations WHERE name = 'YACCA Youth Development Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('YACCA Youth Development Program', 'Development Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'YACCA Youth Development Program',
      lower(regexp_replace('YACCA Youth Development Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Development Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 288: YFS Logan
  SELECT id INTO org_id FROM organizations WHERE name = 'YFS Logan';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('YFS Logan', 'Non-Government Organization - Youth & Family Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'YFS Logan',
      lower(regexp_replace('YFS Logan', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth & Family Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 289: Yiliyapinya Indigenous Corporation
  SELECT id INTO org_id FROM organizations WHERE name = 'Yiliyapinya Indigenous Corporation';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Yiliyapinya Indigenous Corporation', 'Indigenous Organization - Indigenous Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Yiliyapinya Indigenous Corporation',
      lower(regexp_replace('Yiliyapinya Indigenous Corporation', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Indigenous Organization - Indigenous Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 290: YIRS Integrated Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'YIRS Integrated Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('YIRS Integrated Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'YIRS Integrated Support Service',
      lower(regexp_replace('YIRS Integrated Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 291: YMCA Queensland
  SELECT id INTO org_id FROM organizations WHERE name = 'YMCA Queensland';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('YMCA Queensland', 'Non-Government Organization - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'YMCA Queensland',
      lower(regexp_replace('YMCA Queensland', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 292: Young Parent and Youth Wellbeing Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Young Parent and Youth Wellbeing Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Young Parent and Youth Wellbeing Program', 'Non-Government Organization - Youth and Family Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'family_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Young Parent and Youth Wellbeing Program',
      lower(regexp_replace('Young Parent and Youth Wellbeing Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth and Family Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 293: Young People Ahead Youth Advisory Group
  SELECT id INTO org_id FROM organizations WHERE name = 'Young People Ahead Youth Advisory Group';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Young People Ahead Youth Advisory Group', 'Youth Advocacy - Youth Advocacy', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Young People Ahead Youth Advisory Group',
      lower(regexp_replace('Young People Ahead Youth Advisory Group', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Advocacy - Youth Advocacy',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 294: Young People''s Kinnections
  SELECT id INTO org_id FROM organizations WHERE name = 'Young People''s Kinnections';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Young People''s Kinnections', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Young People''s Kinnections',
      lower(regexp_replace('Young People''s Kinnections', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 295: Young Queenslanders Strategy
  SELECT id INTO org_id FROM organizations WHERE name = 'Young Queenslanders Strategy';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Young Queenslanders Strategy', 'Government Initiative - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Young Queenslanders Strategy',
      lower(regexp_replace('Young Queenslanders Strategy', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Initiative - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 296: Youth 4 Paws
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth 4 Paws';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth 4 Paws', 'Animal Therapy Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth 4 Paws',
      lower(regexp_replace('Youth 4 Paws', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Animal Therapy Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 297: Youth 360 Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth 360 Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth 360 Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth 360 Service',
      lower(regexp_replace('Youth 360 Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 298: Youth Access and Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Access and Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Access and Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Access and Support Service',
      lower(regexp_replace('Youth Access and Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 299: Youth Access Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Access Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Access Program', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Access Program',
      lower(regexp_replace('Youth Access Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 300: Youth Advocacy Centre (YAC)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Advocacy Centre (YAC)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Advocacy Centre (YAC)', 'Non-Government Organization - Legal and Social Justice', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'legal_aid');
    service_categories := array_append(service_categories, 'advocacy');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Advocacy Centre (YAC)',
      lower(regexp_replace('Youth Advocacy Centre (YAC)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Legal and Social Justice',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 301: Youth Affairs Network of Queensland (YANQ)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Affairs Network of Queensland (YANQ)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Affairs Network of Queensland (YANQ)', 'Peak Body - Youth Sector Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Affairs Network of Queensland (YANQ)',
      lower(regexp_replace('Youth Affairs Network of Queensland (YANQ)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Peak Body - Youth Sector Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 302: Youth and Community Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth and Community Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth and Community Program', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth and Community Program',
      lower(regexp_replace('Youth and Community Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 303: Youth Beyond Blue
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Beyond Blue';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Beyond Blue', 'Support Service - Mental Health', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Beyond Blue',
      lower(regexp_replace('Youth Beyond Blue', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Service - Mental Health',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 304: Youth Co-Responder Teams
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Co-Responder Teams';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Co-Responder Teams', 'Support Program - Crisis Intervention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Co-Responder Teams',
      lower(regexp_replace('Youth Co-Responder Teams', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Support Program - Crisis Intervention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 305: Youth Development Partnership Fund
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Development Partnership Fund';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Development Partnership Fund', 'Government Program - Youth Crime Prevention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Development Partnership Fund',
      lower(regexp_replace('Youth Development Partnership Fund', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Youth Crime Prevention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 306: Youth Drug and Alcohol Treatment Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Drug and Alcohol Treatment Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Drug and Alcohol Treatment Service', 'Health Service - Substance Treatment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Drug and Alcohol Treatment Service',
      lower(regexp_replace('Youth Drug and Alcohol Treatment Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Health Service - Substance Treatment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 307: Youth Empowered Towards Independence (YETI)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Empowered Towards Independence (YETI)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Empowered Towards Independence (YETI)', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Empowered Towards Independence (YETI)',
      lower(regexp_replace('Youth Empowered Towards Independence (YETI)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 308: Youth Empowering Strength (YES)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Empowering Strength (YES)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Empowering Strength (YES)', 'Non-Government Organization - Youth Empowerment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Empowering Strength (YES)',
      lower(regexp_replace('Youth Empowering Strength (YES)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Empowerment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 309: Youth Empowerment and Support Service (YESS)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Empowerment and Support Service (YESS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Empowerment and Support Service (YESS)', 'Non-Government Organization - Youth Empowerment', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Empowerment and Support Service (YESS)',
      lower(regexp_replace('Youth Empowerment and Support Service (YESS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Empowerment',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 310: Youth Engagement and Linkage Service (YELS)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Engagement and Linkage Service (YELS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Engagement and Linkage Service (YELS)', 'Non-Government Organization - Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Engagement and Linkage Service (YELS)',
      lower(regexp_replace('Youth Engagement and Linkage Service (YELS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 311: Youth Events Team Initiative
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Events Team Initiative';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Events Team Initiative', 'Youth Program - Event Management', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Events Team Initiative',
      lower(regexp_replace('Youth Events Team Initiative', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Youth Program - Event Management',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 312: Youth Housing and Reintegration Service (YHARS)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Housing and Reintegration Service (YHARS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Housing and Reintegration Service (YHARS)', 'Government Program - Housing Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'housing');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Housing and Reintegration Service (YHARS)',
      lower(regexp_replace('Youth Housing and Reintegration Service (YHARS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Housing Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 313: Youth Hub Outreach & Lunch Flex – Bellbird Park
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Hub Outreach & Lunch Flex – Bellbird Park';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Hub Outreach & Lunch Flex – Bellbird Park', 'School Program - Student Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Hub Outreach & Lunch Flex – Bellbird Park',
      lower(regexp_replace('Youth Hub Outreach & Lunch Flex – Bellbird Park', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'School Program - Student Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 314: Youth Hub Outreach & Lunch Flex – Redbank Plains
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Hub Outreach & Lunch Flex – Redbank Plains';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Hub Outreach & Lunch Flex – Redbank Plains', 'School Program - Student Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Hub Outreach & Lunch Flex – Redbank Plains',
      lower(regexp_replace('Youth Hub Outreach & Lunch Flex – Redbank Plains', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'School Program - Student Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 315: Youth Justice Indigenous Support
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Justice Indigenous Support';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Justice Indigenous Support', 'Government Program - Indigenous Youth', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Justice Indigenous Support',
      lower(regexp_replace('Youth Justice Indigenous Support', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Government Program - Indigenous Youth',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 316: Youth Pathways Program
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Pathways Program';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Pathways Program', 'Career Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Pathways Program',
      lower(regexp_replace('Youth Pathways Program', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Career Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 317: Youth Substance Abuse Service (YSAS)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Substance Abuse Service (YSAS)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Substance Abuse Service (YSAS)', 'Health Service - Substance Abuse', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Substance Abuse Service (YSAS)',
      lower(regexp_replace('Youth Substance Abuse Service (YSAS)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Health Service - Substance Abuse',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 318: Youth Support Coordinator Initiative (YSCI)
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Support Coordinator Initiative (YSCI)';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Support Coordinator Initiative (YSCI)', 'Education Program - Education Retention', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'education_training');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Support Coordinator Initiative (YSCI)',
      lower(regexp_replace('Youth Support Coordinator Initiative (YSCI)', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Education Program - Education Retention',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 319: Youth Wellness and Empowerment Initiative
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Wellness and Empowerment Initiative';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Wellness and Empowerment Initiative', 'Wellbeing Program - Youth Development', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'mental_health');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Wellness and Empowerment Initiative',
      lower(regexp_replace('Youth Wellness and Empowerment Initiative', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Wellbeing Program - Youth Development',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 320: Youth Yarnz After Dark
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth Yarnz After Dark';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth Yarnz After Dark', 'Community Program - Indigenous Youth Engagement', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    service_categories := array_append(service_categories, 'cultural_support');
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth Yarnz After Dark',
      lower(regexp_replace('Youth Yarnz After Dark', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Program - Indigenous Youth Engagement',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 321: Youth4GC
  SELECT id INTO org_id FROM organizations WHERE name = 'Youth4GC';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Youth4GC', 'Community Program - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Youth4GC',
      lower(regexp_replace('Youth4GC', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Community Program - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 322: YouthLink
  SELECT id INTO org_id FROM organizations WHERE name = 'YouthLink';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('YouthLink', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'YouthLink',
      lower(regexp_replace('YouthLink', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 323: YouTurn Youth Support - Toowoomba Youth Service
  SELECT id INTO org_id FROM organizations WHERE name = 'YouTurn Youth Support - Toowoomba Youth Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('YouTurn Youth Support - Toowoomba Youth Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'YouTurn Youth Support - Toowoomba Youth Service',
      lower(regexp_replace('YouTurn Youth Support - Toowoomba Youth Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 324: Zig Zag Young Women''s Resource Centre
  SELECT id INTO org_id FROM organizations WHERE name = 'Zig Zag Young Women''s Resource Centre';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Zig Zag Young Women''s Resource Centre', 'Non-Government Organization - Young Women', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Zig Zag Young Women''s Resource Centre',
      lower(regexp_replace('Zig Zag Young Women''s Resource Centre', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Young Women',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  -- Organization 325: Zillmere Young Peoples Support Service
  SELECT id INTO org_id FROM organizations WHERE name = 'Zillmere Young Peoples Support Service';
  
  IF org_id IS NULL THEN
    INSERT INTO organizations (name, description, website_url)
    VALUES ('Zillmere Young Peoples Support Service', 'Non-Government Organization - Youth Support', NULL)
    RETURNING id INTO org_id;
    orgs_created := orgs_created + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id) THEN
    service_categories := ARRAY['support'];
    
    
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state
    )
    VALUES (
      'Zillmere Young Peoples Support Service',
      lower(regexp_replace('Zillmere Young Peoples Support Service', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),
      'Non-Government Organization - Youth Support',
      'support',
      service_categories,
      org_id,
      'Queensland',
      'QLD'
    );
    services_created := services_created + 1;
  END IF;

  RAISE NOTICE 'Import complete: % orgs created, % services created', orgs_created, services_created;
END $$;

-- Verify results
SELECT 'Organizations' as type, COUNT(*) as total FROM organizations
UNION ALL
SELECT 'Services' as type, COUNT(*) as total FROM services;

