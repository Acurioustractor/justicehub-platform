-- Unlock the live-verified HUDOC + CourtListener adapters.
--
-- scan-json only scans sources WHERE data_format='json' and host-branches to a
-- verified JSON adapter. HUDOC and CourtListener had adapters wired but their
-- source rows were registered as 'html', so the weekly cron skipped them and
-- the corpus stayed supply-starved on two of the three court APIs we support.
--
-- Idempotent: only flips rows still on 'html'. Applied to the live DB on
-- 2026-05-29; this file propagates the same flip to any other environment.
UPDATE public.justice_matrix_sources
SET data_format = 'json', updated_at = now()
WHERE name IN ('ECHR HUDOC', 'CourtListener (US Federal Courts)')
  AND data_format = 'html';
