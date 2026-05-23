-- Backfill ACCO certification on organizations.
--
-- The ORIC register has 3,895 entries with ABNs. ~1,500 orgs were already
-- flagged acco_certified=true from earlier backfills, but 97 more were
-- matchable purely by ABN and not yet flagged. This update closes that gap.
--
-- We only flag corps with status='Registered' to avoid stamping ACCO on
-- corporations that have been deregistered or are in administration.
--
-- Idempotent: only flags rows not already true.

UPDATE organizations
SET acco_certified = true
WHERE acco_certified IS NOT TRUE
  AND abn IS NOT NULL
  AND abn IN (
    SELECT DISTINCT abn FROM oric_corporations
    WHERE abn IS NOT NULL AND status = 'Registered'
  );
