-- Create clearinghouse_documents table for partner-submitted docs (markdown/PDF metadata)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clearinghouse_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT,
  format TEXT DEFAULT 'markdown',
  source_system TEXT NOT NULL,
  source_record_id TEXT,
  source_url TEXT,
  submitted_by TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clearinghouse_documents_source_system ON clearinghouse_documents(source_system);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_documents_status ON clearinghouse_documents(status);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_documents_tags ON clearinghouse_documents USING GIN(tags);

COMMENT ON TABLE clearinghouse_documents IS 'Partner-submitted documents (metadata + text) for the clearinghouse';
COMMENT ON COLUMN clearinghouse_documents.content IS 'Optional raw markdown/text content (PDFs should provide url instead)';
COMMENT ON COLUMN clearinghouse_documents.summary IS 'Optional short summary or AI-generated abstract';
