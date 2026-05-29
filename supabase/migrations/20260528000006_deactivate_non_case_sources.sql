-- Deactivate sources that landed in justice_matrix_sources but aren't actually
-- case/campaign-shaped — federal/state tender portals, grant-reporting feeds,
-- statistics dashboards, donations-disclosure data, academic-paper JSON APIs.
-- The scanner was wasting cycles on them and they were inflating the
-- "never-scanned" health metric.
--
-- Reversible: flip is_active back to true if a domain-specific adapter is
-- written for one of these later. Audit reasons are recorded on each row.
--
-- Originally applied 2026-05-28.

UPDATE justice_matrix_sources
SET is_active = false,
    last_error = COALESCE(last_error, '') ||
                 ' [Deactivated 2026-05-28: not case/campaign-shaped — financial/procurement/statistics data. Reactivate when a domain-specific scraper exists.]',
    updated_at = now()
WHERE name IN (
  'AusTender Justice Contracts',
  'AusTender (Federal Procurement)',
  'GrantConnect (Federal Grants)',
  'NIAA Grants Reporting',
  'NSW eTendering',
  'QLD QTenders',
  'WA Tenders',
  'SA Tenders and Contracts',
  'AEC Political Donation Returns',
  'Closing the Gap Dashboard',
  'ABS Data API',
  'Crossref Research API',
  'Semantic Scholar API',
  'OpenAlex Academic Research API'
);

-- And the broken-DNS source.
UPDATE justice_matrix_sources
SET is_active = false,
    last_error = 'DNS resolution failed (ERR_NAME_NOT_RESOLVED) for https://www.buying.vic.gov.au/. URL is broken — deactivated 2026-05-28 pending correct URL.',
    updated_at = now()
WHERE name = 'Buying for Victoria';
