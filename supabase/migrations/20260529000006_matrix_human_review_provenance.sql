-- Honest provenance on justice_matrix_cases.
--
-- Move 1 of the Justice Matrix strategy: stop a script from signing off as the
-- human. We split provenance into two independent signals:
--   * verified / ai_extracted_at  — a machine extracted these fields (a script
--     or LLM-grounded enrichment). This is allowed to be set by automation.
--   * human_confirmed             — a human reviewer has actually read the row
--     and confirmed the facts. This is the credibility signal a litigation tool
--     leans on, so it MUST be earned, never asserted by a script.
--
-- IMPORTANT: human_confirmed may ONLY be set true by a human reviewer acting
-- through the admin review UI. No cron, backfill, or auto-publish script may
-- ever write human_confirmed = true. Treat any script that does so as a bug.

ALTER TABLE public.justice_matrix_cases
  ADD COLUMN IF NOT EXISTS human_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_extracted_at timestamptz;

COMMENT ON COLUMN public.justice_matrix_cases.human_confirmed IS
  'TRUE only when a human reviewer has confirmed the facts via the admin review UI. Never set true by any script, cron, or auto-publish/backfill job. Defaults false; existing rows are false until a human confirms.';

COMMENT ON COLUMN public.justice_matrix_cases.ai_extracted_at IS
  'Timestamp of the most recent machine extraction (auto-publish insert or deep-field backfill). Provenance only — does not imply human confirmation.';

-- Existing rows: the NOT NULL DEFAULT false above already backfills every row
-- to human_confirmed = false. No data statement needed.

-- Cheap partial index so the review queue ("show me everything a human has not
-- yet confirmed") stays fast as the corpus grows.
CREATE INDEX IF NOT EXISTS idx_justice_matrix_cases_unconfirmed
  ON public.justice_matrix_cases (created_at DESC)
  WHERE human_confirmed = false;
