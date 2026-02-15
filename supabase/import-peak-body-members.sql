-- Import Peak Body Member Organizations
-- Generated: 2025-10-11T03:47:11.844Z
-- Total organizations: 7
-- Sources: QATSICPP, PeakCare, QCOSS, YANQ, QNADA


-- Aboriginal and Torres Strait Islander Community Health Service Mackay Ltd (Queensland Aboriginal and Torres Strait Islander Child Protection Peak)
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Aboriginal and Torres Strait Islander Community Health Service Mackay Ltd', 'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description),
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Aboriginal and Torres Strait Islander Community Health Service Mackay Ltd'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Aboriginal and Torres Strait Islander Community Health Service Mackay Ltd',
      'aboriginal-and-torres-strait-islander-community-health-service-mackay-ltd-' || substring(md5(random()::text) from 1 for 8),
      'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Mackay',
      'QLD',
      NULL,
      jsonb_build_object(
        'peak_body_verified', true,
        'peak_body', 'Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
        'source', 'Peak Body Member Directory',
        'imported_at', NOW()
      )
    );
  END IF;
END $$;

-- REFOCUS Aboriginal and Torres Strait Islander Corporation (Queensland Aboriginal and Torres Strait Islander Child Protection Peak)
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('REFOCUS Aboriginal and Torres Strait Islander Corporation', 'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description),
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'REFOCUS Aboriginal and Torres Strait Islander Corporation'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'REFOCUS Aboriginal and Torres Strait Islander Corporation',
      'refocus-aboriginal-and-torres-strait-islander-corporation-' || substring(md5(random()::text) from 1 for 8),
      'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
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
        'peak_body_verified', true,
        'peak_body', 'Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
        'source', 'Peak Body Member Directory',
        'imported_at', NOW()
      )
    );
  END IF;
END $$;

-- Central Queensland Indigenous Development Ltd (Queensland Aboriginal and Torres Strait Islander Child Protection Peak)
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Central Queensland Indigenous Development Ltd', 'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description),
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Central Queensland Indigenous Development Ltd'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Central Queensland Indigenous Development Ltd',
      'central-queensland-indigenous-development-ltd-' || substring(md5(random()::text) from 1 for 8),
      'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Rockhampton',
      'QLD',
      NULL,
      jsonb_build_object(
        'peak_body_verified', true,
        'peak_body', 'Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
        'source', 'Peak Body Member Directory',
        'imported_at', NOW()
      )
    );
  END IF;
END $$;

-- Port Curtis Coral Coast Indigenous Corporation (Queensland Aboriginal and Torres Strait Islander Child Protection Peak)
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Port Curtis Coral Coast Indigenous Corporation', 'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description),
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Port Curtis Coral Coast Indigenous Corporation'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Port Curtis Coral Coast Indigenous Corporation',
      'port-curtis-coral-coast-indigenous-corporation-' || substring(md5(random()::text) from 1 for 8),
      'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Bundaberg',
      'QLD',
      NULL,
      jsonb_build_object(
        'peak_body_verified', true,
        'peak_body', 'Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
        'source', 'Peak Body Member Directory',
        'imported_at', NOW()
      )
    );
  END IF;
END $$;

-- Goolburri Aboriginal Health Advancement Company Ltd (Queensland Aboriginal and Torres Strait Islander Child Protection Peak)
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Goolburri Aboriginal Health Advancement Company Ltd', 'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description),
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Goolburri Aboriginal Health Advancement Company Ltd'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Goolburri Aboriginal Health Advancement Company Ltd',
      'goolburri-aboriginal-health-advancement-company-ltd-' || substring(md5(random()::text) from 1 for 8),
      'Member of Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
      'support',
      ARRAY['support']::text[],
      v_org_id,
      NULL,
      NULL,
      NULL,
      NULL,
      'Toowoomba',
      'QLD',
      NULL,
      jsonb_build_object(
        'peak_body_verified', true,
        'peak_body', 'Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
        'source', 'Peak Body Member Directory',
        'imported_at', NOW()
      )
    );
  END IF;
END $$;

-- 404 Error - No Organizations Found (Youth Affairs Network Queensland)
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('404 Error - No Organizations Found', 'The provided page appears to be a 404 error page with no member organizations listed.', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description),
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = '404 Error - No Organizations Found'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      '404 Error - No Organizations Found',
      '404-error-no-organizations-found-' || substring(md5(random()::text) from 1 for 8),
      'The provided page appears to be a 404 error page with no member organizations listed.',
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
        'peak_body_verified', true,
        'peak_body', 'Youth Affairs Network Queensland',
        'source', 'Peak Body Member Directory',
        'imported_at', NOW()
      )
    );
  END IF;
END $$;

-- Note: The provided HTML does not contain any member organization listings. The page appears to be a navigation menu / header section only. Unable to extract member organizations without the actual member listings content. (Queensland Network of Alcohol and Drug Agencies)
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('Note: The provided HTML does not contain any member organization listings. The page appears to be a navigation menu / header section only. Unable to extract member organizations without the actual member listings content.', 'Member of Queensland Network of Alcohol and Drug Agencies', NULL)
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description),
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = 'Note: The provided HTML does not contain any member organization listings. The page appears to be a navigation menu / header section only. Unable to extract member organizations without the actual member listings content.'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      'Note: The provided HTML does not contain any member organization listings. The page appears to be a navigation menu / header section only. Unable to extract member organizations without the actual member listings content.',
      'note-the-provided-html-does-not-contain-any-member-organization-listings-the-page-appears-to-be-a-navigation-menu-header-section-only-unable-to-extract-member-organizations-without-the-actual-member-listings-content--' || substring(md5(random()::text) from 1 for 8),
      'Member of Queensland Network of Alcohol and Drug Agencies',
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
        'peak_body_verified', true,
        'peak_body', 'Queensland Network of Alcohol and Drug Agencies',
        'source', 'Peak Body Member Directory',
        'imported_at', NOW()
      )
    );
  END IF;
END $$;
