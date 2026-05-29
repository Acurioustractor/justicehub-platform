-- Deeper case fields for the Justice Matrix. Each profile so far is only
-- citation + strategic_issue + key_holding; these columns let the LLM
-- enrichment fill in what a practitioner actually wants to read — facts,
-- court reasoning, dissents, statutes invoked, cases cited, bench.
--
-- Nullable so existing rows stay valid; backfill via
-- scripts/justice-matrix-backfill-deep.mjs.

ALTER TABLE justice_matrix_cases
  ADD COLUMN IF NOT EXISTS facts text,
  ADD COLUMN IF NOT EXISTS reasoning text,
  ADD COLUMN IF NOT EXISTS dissents text,
  ADD COLUMN IF NOT EXISTS statutes_cited text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cases_cited text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS judges text[] DEFAULT NULL;

COMMENT ON COLUMN justice_matrix_cases.facts IS 'What happened to the people in this case — one paragraph from the judgment.';
COMMENT ON COLUMN justice_matrix_cases.reasoning IS 'Court''s ratio decidendi — why it decided the way it did.';
COMMENT ON COLUMN justice_matrix_cases.dissents IS 'Dissenting opinions if any: who and on what point.';
COMMENT ON COLUMN justice_matrix_cases.statutes_cited IS 'Statutes, treaties, conventions applied (e.g. Refugee Convention art. 33).';
COMMENT ON COLUMN justice_matrix_cases.cases_cited IS 'Prior cases cited as authority in the judgment.';
COMMENT ON COLUMN justice_matrix_cases.judges IS 'Judges sitting on the bench / panel.';
