-- Initialize JusticeHub database
-- This file runs when PostgreSQL container starts for the first time

-- Create vector extension for AI search
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE justicehub TO "user";