-- Unlock the EDAL adapter.
--
-- The EDAL source was registered as data_format='html', so scan-json (which
-- only scans json sources) skipped it. The new edal-adapter reads EDAL's
-- sitemaps + per-page meta tags, so flip the source to 'json' to route it
-- through the adapter (the scan-json + CLI pickers branch on the
-- asylumlawdatabase.eu host).
--
-- Idempotent. Applied to the live DB on 2026-05-29; this file propagates it.
UPDATE public.justice_matrix_sources
SET data_format = 'json', updated_at = now()
WHERE url ILIKE '%asylumlawdatabase.eu%'
  AND data_format = 'html';
