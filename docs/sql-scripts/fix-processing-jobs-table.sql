-- Fix processing_jobs table for AI scraper
-- Drop the existing table and recreate with correct structure

-- First, rename existing table to backup
ALTER TABLE IF EXISTS processing_jobs RENAME TO processing_jobs_backup;

-- Create the correct processing_jobs table for AI scraper
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'queued',
    priority VARCHAR(20) DEFAULT 'medium',
    source_urls TEXT[] DEFAULT '{}',
    data_source_id UUID REFERENCES data_sources(id),
    configuration JSONB NOT NULL DEFAULT '{}',
    progress_percentage INTEGER DEFAULT 0,
    results_summary JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_priority ON processing_jobs(priority);
CREATE INDEX idx_processing_jobs_type ON processing_jobs(type);
CREATE INDEX idx_processing_jobs_created_at ON processing_jobs(created_at);

-- Add comment for documentation
COMMENT ON TABLE processing_jobs IS 'Queue and status tracking for AI scraping and processing jobs';