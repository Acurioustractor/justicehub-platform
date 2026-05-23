-- SCAG (Standing Council of Attorneys-General) communiques
-- Source: https://www.ag.gov.au/about-us/publications/standing-council-attorneys-general-communiques
-- Per docs/civic-connectors/build-specs.md section 7.B.
--
-- Captures national AG-level signals on youth justice positioning:
--   - Raise-the-age status across jurisdictions
--   - YJ-relevant decisions / agreements / referrals
--   - Member states present, host jurisdiction
--
-- Idempotent on meeting_date. Hash-diff via content_hash lets weekly
-- polls skip unchanged content cheaply.

CREATE TABLE IF NOT EXISTS scag_communiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Meeting identity (unique on meeting_date — there is at most one
  -- communique per meeting, and meetings are dated)
  meeting_date DATE NOT NULL UNIQUE,
  host_jurisdiction TEXT,
  communique_url TEXT NOT NULL,

  -- Extracted signals
  yj_decisions_jsonb JSONB DEFAULT '[]'::jsonb,
  raise_age_position TEXT,
  member_states TEXT[],
  agenda_items_jsonb JSONB DEFAULT '[]'::jsonb,

  -- Raw + diff
  content_text TEXT,
  content_hash TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scag_communiques_meeting_date
  ON scag_communiques(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_scag_communiques_host
  ON scag_communiques(host_jurisdiction) WHERE host_jurisdiction IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scag_communiques_hash
  ON scag_communiques(content_hash);
CREATE INDEX IF NOT EXISTS idx_scag_communiques_raise_age
  ON scag_communiques(raise_age_position) WHERE raise_age_position IS NOT NULL;

-- RLS
ALTER TABLE scag_communiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON scag_communiques
  FOR SELECT USING (true);

CREATE POLICY "Service role write access" ON scag_communiques
  FOR ALL USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE scag_communiques IS
  'Standing Council of Attorneys-General communiques. Source: ag.gov.au. Weekly poll, hash-diff via content_hash. Per docs/civic-connectors/build-specs.md section 7.B.';
COMMENT ON COLUMN scag_communiques.yj_decisions_jsonb IS
  'Array of extracted youth-justice-relevant decisions, with snippet + section heading.';
COMMENT ON COLUMN scag_communiques.raise_age_position IS
  'Snapshot of the raise-the-age national position from this meeting (e.g. "MACR=14 recommended, no national decision").';
COMMENT ON COLUMN scag_communiques.member_states IS
  'Jurisdictions present / signatory at the meeting (NSW, VIC, QLD, WA, SA, TAS, ACT, NT, Cth, NZ).';
COMMENT ON COLUMN scag_communiques.content_hash IS
  'SHA-256 of normalised content_text. Used by the weekly poller to short-circuit unchanged scrapes.';
