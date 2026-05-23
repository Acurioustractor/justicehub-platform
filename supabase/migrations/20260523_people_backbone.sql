-- People backbone + money→outcomes + temporal snapshots.
-- See in-DB COMMENTs for purpose of each table.

CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  full_name text NOT NULL,
  display_name text,
  honorific text,
  primary_role text,
  indigenous boolean,
  region_focus text,
  state_focus text,
  bio_text text,
  photo_url text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_people_full_name ON people USING gin (to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_people_region ON people (state_focus, region_focus);

CREATE TABLE IF NOT EXISTS person_role_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role_type text NOT NULL CHECK (role_type IN (
    'org_leader', 'board_member', 'minister', 'shadow_minister', 'mp_senator',
    'commissioner', 'auditor_general', 'judge', 'community_elder', 'researcher',
    'storyteller', 'staff', 'other'
  )),
  role_title text,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  body_name text,
  jurisdiction text,
  party text,
  start_year smallint,
  end_year smallint,
  is_current boolean NOT NULL DEFAULT true,
  source_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prh_person ON person_role_holdings (person_id, role_type);
CREATE INDEX IF NOT EXISTS idx_prh_org ON person_role_holdings (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prh_current ON person_role_holdings (role_type) WHERE is_current = true;

CREATE TABLE IF NOT EXISTS acnc_ais_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abn text NOT NULL,
  report_year smallint NOT NULL,
  line_type text NOT NULL CHECK (line_type IN ('revenue', 'expense', 'asset', 'liability', 'outcome', 'metric')),
  category text,
  label text,
  value_dollars numeric,
  value_count integer,
  source_url text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_acnc_ais_abn_year ON acnc_ais_line_items (abn, report_year);
CREATE INDEX IF NOT EXISTS idx_acnc_ais_line_type ON acnc_ais_line_items (line_type, category);

CREATE TABLE IF NOT EXISTS civic_metric_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  metric_key text NOT NULL,
  metric_value numeric NOT NULL,
  metric_context jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date, metric_key)
);
CREATE INDEX IF NOT EXISTS idx_civic_metric_snapshots_key_date ON civic_metric_snapshots (metric_key, snapshot_date DESC);

CREATE OR REPLACE VIEW v_person_360 AS
SELECT
  p.id AS person_id, p.slug, p.full_name, p.display_name, p.honorific,
  p.primary_role, p.indigenous, p.state_focus, p.region_focus, p.photo_url,
  COUNT(prh.id) AS role_count,
  COUNT(prh.id) FILTER (WHERE prh.is_current) AS current_role_count,
  ARRAY_AGG(DISTINCT prh.role_type) FILTER (WHERE prh.role_type IS NOT NULL) AS role_types,
  ARRAY_AGG(DISTINCT prh.organization_id) FILTER (WHERE prh.organization_id IS NOT NULL) AS linked_org_ids
FROM people p
LEFT JOIN person_role_holdings prh ON prh.person_id = p.id
GROUP BY p.id;
