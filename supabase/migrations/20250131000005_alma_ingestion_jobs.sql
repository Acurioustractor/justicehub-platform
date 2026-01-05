-- ALMA Ingestion Jobs Table
-- Tracks web scraping and document processing jobs

CREATE TABLE alma_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  source_type TEXT NOT NULL CHECK (source_type IN (
    'url', 'website', 'pdf', 'search', 'rss', 'api'
  )),
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'crawling', 'extracting', 'completed', 'failed'
  )),

  documents_found INTEGER DEFAULT 0,
  entities_created INTEGER DEFAULT 0,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  error TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for querying jobs
CREATE INDEX idx_alma_ingestion_jobs_status ON alma_ingestion_jobs(status);
CREATE INDEX idx_alma_ingestion_jobs_created_at ON alma_ingestion_jobs(created_at DESC);
CREATE INDEX idx_alma_ingestion_jobs_source_url ON alma_ingestion_jobs(source_url);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_alma_ingestion_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alma_ingestion_jobs_updated_at
  BEFORE UPDATE ON alma_ingestion_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_alma_ingestion_jobs_updated_at();
