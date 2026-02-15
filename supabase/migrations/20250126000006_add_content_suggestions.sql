-- Content Link Suggestions System
-- Tracks suggested links between content (people, orgs, programs, etc.)
-- Supports auto-linking with confidence scores

CREATE TABLE IF NOT EXISTS content_link_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What's being linked (source → target)
  source_type TEXT NOT NULL CHECK (source_type IN ('profile', 'organization', 'program', 'service', 'story')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'organization', 'program', 'service', 'story')),
  target_id UUID NOT NULL,

  -- Suggestion details
  suggested_role TEXT, -- e.g., 'Founder', 'Mentioned in', 'Lead'
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1), -- 0.00 to 1.00
  reasoning TEXT NOT NULL, -- Why this link was suggested

  -- Evidence supporting the suggestion
  evidence JSONB DEFAULT '{}', -- Keywords found, text excerpts, field matches, etc.

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto-applied')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  -- Auto-apply tracking
  auto_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Ensure unique suggestions (can't suggest same link twice)
  UNIQUE(source_type, source_id, target_type, target_id)
);

-- Indexes for performance
CREATE INDEX idx_suggestions_pending
ON content_link_suggestions(status, confidence DESC)
WHERE status = 'pending';

CREATE INDEX idx_suggestions_source
ON content_link_suggestions(source_type, source_id);

CREATE INDEX idx_suggestions_target
ON content_link_suggestions(target_type, target_id);

CREATE INDEX idx_suggestions_created
ON content_link_suggestions(created_at DESC);

-- Feedback tracking for learning
CREATE TABLE IF NOT EXISTS suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES content_link_suggestions(id) ON DELETE CASCADE,

  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'edited', 'ignored')),

  -- If role was edited, track changes
  original_role TEXT,
  final_role TEXT,

  -- Admin notes
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),

  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_feedback_suggestion
ON suggestion_feedback(suggestion_id);

CREATE INDEX idx_feedback_action
ON suggestion_feedback(action);

-- Trigger to update updated_at
CREATE TRIGGER update_suggestions_updated_at
BEFORE UPDATE ON content_link_suggestions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE content_link_suggestions IS 'Suggested links between content with confidence scores for auto-linking';
COMMENT ON COLUMN content_link_suggestions.confidence IS 'Confidence score 0.00-1.00. ≥0.90 = auto-apply, 0.60-0.89 = review, <0.60 = related content';
COMMENT ON TABLE suggestion_feedback IS 'Tracks admin actions on suggestions to improve future suggestions';
