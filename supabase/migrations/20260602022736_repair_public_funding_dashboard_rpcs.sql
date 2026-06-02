-- Repair public Justice Funding dashboard aggregates.
--
-- These functions previously failed under PostgREST because they referenced
-- `justice_funding` without a schema-qualified table name. Keep public table
-- references explicit so API search_path changes cannot turn live data into
-- 500s or misleading fallback values.

DROP FUNCTION IF EXISTS public.justice_funding_overview(text);
DROP FUNCTION IF EXISTS public.justice_funding_by_sector(text);
DROP FUNCTION IF EXISTS public.justice_funding_by_year(text);
DROP FUNCTION IF EXISTS public.justice_funding_top_recipients(text, text, text, boolean, integer);
DROP FUNCTION IF EXISTS public.get_top_justice_funding();

CREATE OR REPLACE FUNCTION public.justice_funding_overview(p_state text DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      jf.*,
      (
        coalesce(o.is_indigenous_org, false)
        OR coalesce(o.acco_certified, false)
        OR jf.recipient_name ~* '(aboriginal|torres strait|indigenous|murri|first nations)'
      ) AS is_indigenous
    FROM public.justice_funding AS jf
    LEFT JOIN public.organizations AS o ON o.id = jf.alma_organization_id
    WHERE (p_state IS NULL OR jf.state = upper(p_state))
      AND jf.amount_dollars IS NOT NULL
      AND jf.amount_dollars > 0
  ),
  sector_totals AS (
    SELECT coalesce(sector, 'unknown') AS sector, sum(amount_dollars) AS total_dollars
    FROM filtered
    GROUP BY coalesce(sector, 'unknown')
    ORDER BY total_dollars DESC NULLS LAST
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'total_records', count(*)::bigint,
    'total_dollars', coalesce(sum(amount_dollars), 0)::numeric,
    'unique_orgs', count(DISTINCT coalesce(alma_organization_id::text, recipient_abn, recipient_name))::bigint,
    'unique_programs', count(DISTINCT program_name)::bigint,
    'alma_linked', count(*) FILTER (WHERE alma_organization_id IS NOT NULL)::bigint,
    'years_covered', count(DISTINCT financial_year)::bigint,
    'indigenous_records', count(*) FILTER (WHERE is_indigenous)::bigint,
    'indigenous_dollars', coalesce(sum(amount_dollars) FILTER (WHERE is_indigenous), 0)::numeric,
    'indigenous_orgs', count(DISTINCT coalesce(alma_organization_id::text, recipient_abn, recipient_name)) FILTER (WHERE is_indigenous)::bigint,
    'non_indigenous_dollars', coalesce(sum(amount_dollars) FILTER (WHERE NOT is_indigenous), 0)::numeric,
    'top_sector', (SELECT sector FROM sector_totals),
    'earliest_year', min(financial_year),
    'latest_year', max(financial_year)
  )
  FROM filtered;
$$;

CREATE OR REPLACE FUNCTION public.justice_funding_by_sector(p_state text DEFAULT NULL)
RETURNS TABLE (
  sector text,
  record_count bigint,
  total_dollars numeric,
  org_count bigint,
  indigenous_records bigint,
  indigenous_dollars numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      jf.*,
      (
        coalesce(o.is_indigenous_org, false)
        OR coalesce(o.acco_certified, false)
        OR jf.recipient_name ~* '(aboriginal|torres strait|indigenous|murri|first nations)'
      ) AS is_indigenous
    FROM public.justice_funding AS jf
    LEFT JOIN public.organizations AS o ON o.id = jf.alma_organization_id
    WHERE (p_state IS NULL OR jf.state = upper(p_state))
      AND jf.amount_dollars IS NOT NULL
      AND jf.amount_dollars > 0
  )
  SELECT
    coalesce(f.sector, 'unknown') AS sector,
    count(*)::bigint AS record_count,
    coalesce(sum(f.amount_dollars), 0)::numeric AS total_dollars,
    count(DISTINCT coalesce(f.alma_organization_id::text, f.recipient_abn, f.recipient_name))::bigint AS org_count,
    count(*) FILTER (WHERE f.is_indigenous)::bigint AS indigenous_records,
    coalesce(sum(f.amount_dollars) FILTER (WHERE f.is_indigenous), 0)::numeric AS indigenous_dollars
  FROM filtered AS f
  GROUP BY coalesce(f.sector, 'unknown')
  ORDER BY total_dollars DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.justice_funding_by_year(p_state text DEFAULT NULL)
RETURNS TABLE (
  financial_year text,
  record_count bigint,
  total_dollars numeric,
  org_count bigint,
  indigenous_records bigint,
  indigenous_dollars numeric,
  indigenous_orgs bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      jf.*,
      (
        coalesce(o.is_indigenous_org, false)
        OR coalesce(o.acco_certified, false)
        OR jf.recipient_name ~* '(aboriginal|torres strait|indigenous|murri|first nations)'
      ) AS is_indigenous
    FROM public.justice_funding AS jf
    LEFT JOIN public.organizations AS o ON o.id = jf.alma_organization_id
    WHERE (p_state IS NULL OR jf.state = upper(p_state))
      AND jf.amount_dollars IS NOT NULL
      AND jf.amount_dollars > 0
  )
  SELECT
    coalesce(f.financial_year, 'Unknown') AS financial_year,
    count(*)::bigint AS record_count,
    coalesce(sum(f.amount_dollars), 0)::numeric AS total_dollars,
    count(DISTINCT coalesce(f.alma_organization_id::text, f.recipient_abn, f.recipient_name))::bigint AS org_count,
    count(*) FILTER (WHERE f.is_indigenous)::bigint AS indigenous_records,
    coalesce(sum(f.amount_dollars) FILTER (WHERE f.is_indigenous), 0)::numeric AS indigenous_dollars,
    count(DISTINCT coalesce(f.alma_organization_id::text, f.recipient_abn, f.recipient_name)) FILTER (WHERE f.is_indigenous)::bigint AS indigenous_orgs
  FROM filtered AS f
  GROUP BY coalesce(f.financial_year, 'Unknown')
  ORDER BY financial_year DESC;
$$;

CREATE OR REPLACE FUNCTION public.justice_funding_top_recipients(
  p_state text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_year text DEFAULT NULL,
  p_indigenous_only boolean DEFAULT false,
  p_limit integer DEFAULT 25
)
RETURNS TABLE (
  recipient_name text,
  recipient_abn text,
  grant_count bigint,
  total_dollars numeric,
  years_funded bigint,
  program_count bigint,
  sectors text[],
  is_indigenous boolean,
  alma_linked boolean,
  alma_org_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      jf.*,
      (
        coalesce(o.is_indigenous_org, false)
        OR coalesce(o.acco_certified, false)
        OR jf.recipient_name ~* '(aboriginal|torres strait|indigenous|murri|first nations)'
      ) AS is_indigenous
    FROM public.justice_funding AS jf
    LEFT JOIN public.organizations AS o ON o.id = jf.alma_organization_id
    WHERE (p_state IS NULL OR jf.state = upper(p_state))
      AND (p_sector IS NULL OR jf.sector = p_sector)
      AND (p_year IS NULL OR jf.financial_year = p_year)
      AND jf.amount_dollars IS NOT NULL
      AND jf.amount_dollars > 0
  )
  SELECT
    f.recipient_name,
    max(f.recipient_abn) AS recipient_abn,
    count(*)::bigint AS grant_count,
    coalesce(sum(f.amount_dollars), 0)::numeric AS total_dollars,
    count(DISTINCT f.financial_year)::bigint AS years_funded,
    count(DISTINCT f.program_name)::bigint AS program_count,
    array_remove(array_agg(DISTINCT f.sector), NULL) AS sectors,
    bool_or(f.is_indigenous) AS is_indigenous,
    bool_or(f.alma_organization_id IS NOT NULL) AS alma_linked,
    (array_remove(array_agg(DISTINCT f.alma_organization_id), NULL))[1] AS alma_org_id
  FROM filtered AS f
  WHERE (NOT p_indigenous_only OR f.is_indigenous)
  GROUP BY f.recipient_name
  ORDER BY total_dollars DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 25), 100));
$$;

CREATE OR REPLACE FUNCTION public.get_top_justice_funding()
RETURNS TABLE (
  recipient_name text,
  amount_dollars numeric,
  source text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jf.recipient_name, jf.amount_dollars, jf.source
  FROM public.justice_funding AS jf
  WHERE jf.amount_dollars IS NOT NULL
    AND jf.amount_dollars > 0
  ORDER BY jf.amount_dollars DESC NULLS LAST
  LIMIT 30;
$$;

GRANT EXECUTE ON FUNCTION public.justice_funding_overview(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.justice_funding_by_sector(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.justice_funding_by_year(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.justice_funding_top_recipients(text, text, text, boolean, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_top_justice_funding() TO anon, authenticated, service_role;
