-- Justice Matrix — corpus gap log (Phase 3, on-demand acquisition sensor).
--
-- When /ask returns a THIN answer (the corpus could not confidently answer a
-- question), we record the question here. This is the demand signal that drives
-- corpus growth: the questions readers actually ask that the Matrix cannot yet
-- answer, ranked by how often they recur. It is the OPPOSITE of
-- justice_matrix_discovered (which holds FOUND items awaiting review); this
-- holds the ABSENCE of a record — a thing to go and acquire.
--
-- One row per distinct normalized question. Recurrence increments hit_count and
-- refreshes the latest observation, so a frequently-asked unanswerable question
-- rises to the top of the acquisition queue.
--
-- No RLS (service-role accessed, like the other justice_matrix_* tables).

CREATE TABLE IF NOT EXISTS justice_matrix_gaps (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The verbatim question (latest observation) + a normalized key for dedup.
  question             TEXT NOT NULL,
  normalized_question  TEXT NOT NULL UNIQUE,
  -- Plan + retrieval context at the time the gap was seen (latest observation).
  surface              TEXT,             -- all | refugee | youth
  intent               TEXT,             -- find-cases | find-campaigns | find-evidence | unknown
  confidence           TEXT,             -- thin (the gap signal)
  citation_count       INTEGER NOT NULL DEFAULT 0,
  best_distance        DOUBLE PRECISION, -- min cosine distance of the best hit (NULL if none)
  relaxed              BOOLEAN NOT NULL DEFAULT FALSE, -- retrieval had to broaden and STILL came up thin
  plan_source          TEXT,             -- llm | heuristic
  categories           TEXT[] NOT NULL DEFAULT '{}', -- the planned topic of the gap
  -- Lifecycle: open -> acquiring -> resolved (corpus now answers it) / dismissed.
  status               TEXT NOT NULL DEFAULT 'open',
  hit_count            INTEGER NOT NULL DEFAULT 1,
  first_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Acquisition queue read: open gaps, most-asked first.
CREATE INDEX IF NOT EXISTS idx_jm_gaps_status_hits ON justice_matrix_gaps (status, hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_jm_gaps_last_seen ON justice_matrix_gaps (last_seen_at DESC);

-- Atomic record-or-bump. INSERT on first sight; on a recurrence increment
-- hit_count, refresh the latest observation, and re-open a gap that had been
-- marked resolved (the corpus apparently still cannot answer it). ON CONFLICT
-- needs the FULL unique index on normalized_question (it is, above), so this
-- never hits the partial-index upsert failure mode.
CREATE OR REPLACE FUNCTION justice_matrix_record_gap(
  p_question        TEXT,
  p_normalized      TEXT,
  p_surface         TEXT,
  p_intent          TEXT,
  p_confidence      TEXT,
  p_citation_count  INTEGER,
  p_best_distance   DOUBLE PRECISION,
  p_relaxed         BOOLEAN,
  p_plan_source     TEXT,
  p_categories      TEXT[]
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO justice_matrix_gaps AS g (
    question, normalized_question, surface, intent, confidence,
    citation_count, best_distance, relaxed, plan_source, categories
  ) VALUES (
    p_question, p_normalized, p_surface, p_intent, p_confidence,
    COALESCE(p_citation_count, 0), p_best_distance, COALESCE(p_relaxed, FALSE),
    p_plan_source, COALESCE(p_categories, '{}')
  )
  ON CONFLICT (normalized_question) DO UPDATE SET
    hit_count     = g.hit_count + 1,
    last_seen_at  = NOW(),
    question      = EXCLUDED.question,
    surface       = EXCLUDED.surface,
    intent        = EXCLUDED.intent,
    confidence    = EXCLUDED.confidence,
    citation_count = EXCLUDED.citation_count,
    best_distance = EXCLUDED.best_distance,
    relaxed       = EXCLUDED.relaxed,
    plan_source   = EXCLUDED.plan_source,
    categories    = EXCLUDED.categories,
    -- a previously-resolved gap that recurs re-opens; acquiring/dismissed hold.
    status        = CASE WHEN g.status = 'resolved' THEN 'open' ELSE g.status END;
END;
$$;
