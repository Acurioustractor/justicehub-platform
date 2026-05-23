-- Exhibition search infrastructure: pg_trgm indexes + RPC function.
-- Powers /exhibition single-bar search across orgs + claims + government
-- programs + grant opportunities + foundations.
CREATE INDEX IF NOT EXISTS idx_orgs_name_trgm ON organizations USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orgs_city_trgm ON organizations USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_claims_label_trgm ON civic_intelligence_claims USING gin (display_label gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_programs_name_trgm ON alma_government_programs USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_grants_name_trgm ON grant_opportunities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fg_grantee_trgm ON foundation_grantees USING gin (grantee_name gin_trgm_ops);

-- Function lives in DB as exhibition_search(q text, lim int).
-- See migration apply log in session for full definition.
