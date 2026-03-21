-- Synced storytellers from Empathy Ledger v2
CREATE TABLE IF NOT EXISTS el_storytellers (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cultural_background TEXT[],
  location TEXT,
  role TEXT,
  is_elder BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  story_count INTEGER DEFAULT 0,
  el_created_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Synced transcripts from Empathy Ledger v2
CREATE TABLE IF NOT EXISTS el_transcripts (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT,
  status TEXT,
  word_count INTEGER,
  project_id UUID,
  has_video BOOLEAN DEFAULT FALSE,
  video_url TEXT,
  video_platform TEXT,
  video_thumbnail TEXT,
  storyteller_id UUID REFERENCES el_storytellers(id),
  storyteller_name TEXT,
  el_created_at TIMESTAMPTZ,
  el_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- NQ journey map fields
  location TEXT,
  themes TEXT[],
  is_nq_relevant BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_el_transcripts_storyteller ON el_transcripts(storyteller_id);
CREATE INDEX IF NOT EXISTS idx_el_transcripts_nq ON el_transcripts(is_nq_relevant) WHERE is_nq_relevant = TRUE;
