-- Add latitude and longitude to services_complete view
-- This enables the community map to display services with coordinates

DROP VIEW IF EXISTS services_complete;

CREATE OR REPLACE VIEW services_complete AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.description,
  s.categories,
  s.keywords,
  s.target_age_min AS minimum_age,
  s.target_age_max AS maximum_age,

  -- Age range object
  CASE
    WHEN s.target_age_min IS NOT NULL OR s.target_age_max IS NOT NULL THEN
      jsonb_build_object(
        'minimum', s.target_age_min,
        'maximum', s.target_age_max
      )
    ELSE NULL
  END AS age_range,

  s.youth_specific,
  s.indigenous_specific,
  s.website_url AS url,
  s.is_active AS active,
  s.scrape_confidence_score AS score,

  -- Latitude and longitude for mapping
  s.latitude AS location_latitude,
  s.longitude AS location_longitude,

  -- Organization data
  CASE
    WHEN o.id IS NOT NULL THEN
      jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'type', o.type,
        'website', o.website
      )
    ELSE NULL
  END AS organization,

  -- Alternative organization structure (for compatibility)
  CASE
    WHEN o.id IS NOT NULL THEN
      jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'website', o.website
      )
    ELSE NULL
  END AS organizations,

  -- Primary location data
  CASE
    WHEN s.location_address IS NOT NULL OR s.location_city IS NOT NULL THEN
      jsonb_build_object(
        'address', s.location_address,
        'city', s.location_city,
        'region', s.location_city,
        'state', s.location_state,
        'postcode', s.location_postcode
      )
    ELSE NULL
  END AS location,

  -- Primary contact data
  jsonb_build_object(
    'phone', s.contact_phone,
    'email', s.contact_email,
    'website', s.website_url,
    'hours', s.operating_hours
  ) AS contact,

  -- All locations array
  (
    SELECT COALESCE(json_agg(
      jsonb_build_object(
        'id', sl.id,
        'street_address', sl.street_address,
        'locality', sl.locality,
        'region', sl.region,
        'state', sl.state,
        'postcode', sl.postcode,
        'latitude', sl.latitude,
        'longitude', sl.longitude
      ) ORDER BY sl.is_primary DESC, sl.location_name
    ), '[]'::json)
    FROM service_locations sl
    WHERE sl.service_id = s.id
  ) AS locations,

  -- All contacts array
  (
    SELECT COALESCE(json_agg(
      jsonb_build_object(
        'id', sc.id,
        'phone', sc.phone,
        'email', sc.email,
        'website', sc.website,
        'hours', sc.hours
      ) ORDER BY sc.is_primary DESC, sc.contact_type
    ), '[]'::json)
    FROM service_contacts sc
    WHERE sc.service_id = s.id
  ) AS contacts,

  s.created_at,
  s.updated_at,
  s.last_scraped_at

FROM services s
LEFT JOIN organizations o ON s.organization_id = o.id;

-- Grant permissions
GRANT SELECT ON services_complete TO anon, authenticated;

-- Add comment
COMMENT ON VIEW services_complete IS 'Complete service data including coordinates for mapping';
