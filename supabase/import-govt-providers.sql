-- Import Queensland Government Youth Justice Service Providers
-- Generated: 2025-10-11T03:03:55.613Z
-- Source: https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list
-- Total providers: 19


-- Aboriginal and Torres Strait Islander Health Service
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Aboriginal and Torres Strait Islander Health Service', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Aboriginal and Torres Strait Islander Health Service'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Aboriginal and Torres Strait Islander Health Service',
      'aboriginal-and-torres-strait-islander-health-service-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Aboriginal and Torres Strait Islander Health Service';
  END IF;
END $$;

-- Anglicare Southern Queensland
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Anglicare Southern Queensland', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Anglicare Southern Queensland'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Anglicare Southern Queensland',
      'anglicare-southern-queensland-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Anglicare Southern Queensland';
  END IF;
END $$;

-- Bridges Health and Community Care
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Bridges Health and Community Care', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Bridges Health and Community Care'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Bridges Health and Community Care',
      'bridges-health-and-community-care-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Bridges Health and Community Care';
  END IF;
END $$;

-- Brisbane Youth Service Inc
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Brisbane Youth Service Inc', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Brisbane Youth Service Inc'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Brisbane Youth Service Inc',
      'brisbane-youth-service-inc-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Brisbane Youth Service Inc';
  END IF;
END $$;

-- EACH Ltd
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('EACH Ltd', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'EACH Ltd'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'EACH Ltd',
      'each-ltd-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'EACH Ltd';
  END IF;
END $$;

-- Headspace
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Headspace', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Headspace'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Headspace',
      'headspace-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Headspace';
  END IF;
END $$;

-- Institute for Urban Indigenous Health
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Institute for Urban Indigenous Health', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Institute for Urban Indigenous Health'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Institute for Urban Indigenous Health',
      'institute-for-urban-indigenous-health-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Institute for Urban Indigenous Health';
  END IF;
END $$;

-- Lives Lived Well
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Lives Lived Well', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Lives Lived Well'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Lives Lived Well',
      'lives-lived-well-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Lives Lived Well';
  END IF;
END $$;

-- Mission Australia
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Mission Australia', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Mission Australia'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Mission Australia',
      'mission-australia-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Mission Australia';
  END IF;
END $$;

-- Open Minds Australia Ltd
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Open Minds Australia Ltd', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Open Minds Australia Ltd'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Open Minds Australia Ltd',
      'open-minds-australia-ltd-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Open Minds Australia Ltd';
  END IF;
END $$;

-- PCYC Queensland
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('PCYC Queensland', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'PCYC Queensland'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'PCYC Queensland',
      'pcyc-queensland-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'PCYC Queensland';
  END IF;
END $$;

-- Queensland Health
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Queensland Health', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Queensland Health'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Queensland Health',
      'queensland-health-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Queensland Health';
  END IF;
END $$;

-- Queensland Police Service
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Queensland Police Service', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Queensland Police Service'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Queensland Police Service',
      'queensland-police-service-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Queensland Police Service';
  END IF;
END $$;

-- Richmond Fellowship Queensland
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Richmond Fellowship Queensland', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Richmond Fellowship Queensland'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Richmond Fellowship Queensland',
      'richmond-fellowship-queensland-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Richmond Fellowship Queensland';
  END IF;
END $$;

-- St Vincent's Private Hospital
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('St Vincent''s Private Hospital', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'St Vincent''s Private Hospital'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'St Vincent''s Private Hospital',
      'st-vincent-s-private-hospital-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'St Vincent''s Private Hospital';
  END IF;
END $$;

-- The Salvation Army
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('The Salvation Army', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'The Salvation Army'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'The Salvation Army',
      'the-salvation-army-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'The Salvation Army';
  END IF;
END $$;

-- UnitingCare Community
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('UnitingCare Community', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'UnitingCare Community'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'UnitingCare Community',
      'unitingcare-community-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'UnitingCare Community';
  END IF;
END $$;

-- Wesley Mission Queensland
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Wesley Mission Queensland', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Wesley Mission Queensland'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Wesley Mission Queensland',
      'wesley-mission-queensland-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'Wesley Mission Queensland';
  END IF;
END $$;

-- yourtown
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('yourtown', 'Queensland Government verified youth justice service provider', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'yourtown'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'yourtown',
      'yourtown-' || substring(md5(random()::text) from 1 for 8),
      'Queensland Government verified youth justice service provider',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Queensland',
      'QLD',
      NULL,
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(NULL, contact_phone),
      contact_email = COALESCE(NULL, contact_email),
      website_url = COALESCE(NULL, website_url),
      location_address = COALESCE(NULL, location_address),
      location_city = 'Queensland',
      location_postcode = COALESCE(NULL, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = 'yourtown';
  END IF;
END $$;
