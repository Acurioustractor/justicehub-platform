-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Content embeddings table for semantic search
CREATE TABLE IF NOT EXISTS content_embeddings (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for content embeddings
CREATE INDEX idx_content_type ON content_embeddings(content_type);
CREATE INDEX idx_content_id ON content_embeddings(content_id);
CREATE INDEX idx_embedding ON content_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Search queries table for analytics
CREATE TABLE IF NOT EXISTS search_queries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  query TEXT NOT NULL,
  enhanced_query TEXT,
  results JSONB,
  clicked_results JSONB,
  filters JSONB,
  intent TEXT,
  response_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- AI-generated content insights
CREATE TABLE IF NOT EXISTS content_insights (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  summary TEXT,
  tags JSONB,
  themes JSONB,
  sentiment TEXT,
  key_insights JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for content insights
CREATE INDEX idx_content_insights ON content_insights(content_type, content_id);

-- Add AI-related columns to stories_extended if they don't exist
ALTER TABLE stories_extended ADD COLUMN IF NOT EXISTS ai_tags JSONB;
ALTER TABLE stories_extended ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE stories_extended ADD COLUMN IF NOT EXISTS embedding_generated BOOLEAN DEFAULT FALSE;