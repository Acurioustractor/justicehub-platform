# Multi-Source Data Pipeline Architecture

## Overview

The multi-source data pipeline is designed to integrate service data from various sources including APIs, web scraping, and government databases. It provides a unified interface for data ingestion, normalization, deduplication, and quality assessment.

## Architecture Components

### 1. Source Adapters Layer
- **Ask Izzy/Infoxchange API Adapter** - Primary integration (400K+ services)
- **Queensland Open Data CKAN Adapter** - Government data feeds
- **Web Scraping Adapters** - For sources without APIs
- **CSV/JSON File Adapters** - Static data imports

### 2. Data Normalization Engine
- Schema mapping from source formats to unified HSDS format
- Field standardization and validation
- Geographic coordinate normalization
- Category taxonomy mapping

### 3. Deduplication System
- Fuzzy matching algorithms for organization/service names
- Geographic proximity analysis
- Contact information matching
- ABN/ACN verification

### 4. Quality Assessment Engine
- Completeness scoring (0-100 points)
- Data freshness tracking
- Source reliability weighting
- Automated quality issue detection

### 5. Pipeline Orchestration
- Job scheduling and management
- Error handling and retry logic
- Progress monitoring and logging
- Rate limiting and throttling

## Data Flow

```
[Data Sources] → [Source Adapters] → [Normalization] → [Deduplication] → [Quality Assessment] → [Database] → [API]
```

## Implementation Structure

```
src/data-pipeline/
├── adapters/
│   ├── base-adapter.js          # Abstract base class
│   ├── askizzy-adapter.js       # Ask Izzy API integration
│   ├── qld-ckan-adapter.js      # Queensland Open Data
│   ├── web-scraper-adapter.js   # Generic web scraping
│   └── file-adapter.js          # Static file imports
├── engines/
│   ├── normalization-engine.js  # Data transformation
│   ├── deduplication-engine.js  # Duplicate detection
│   └── quality-engine.js        # Quality assessment
├── orchestration/
│   ├── pipeline-manager.js      # Main orchestrator
│   ├── job-scheduler.js         # Scheduling system
│   └── monitoring.js            # Progress tracking
├── models/
│   ├── pipeline-job.js          # Job data models
│   └── source-mapping.js        # Schema mappings
└── utils/
    ├── rate-limiter.js          # Request throttling
    └── error-handler.js         # Error management
```

## Database Schema Extensions

### New Tables for Pipeline Management

```sql
-- Data sources registry
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('api', 'scraper', 'file', 'database')),
    base_url VARCHAR(500),
    api_key_required BOOLEAN DEFAULT FALSE,
    rate_limit_requests INTEGER DEFAULT 60,
    rate_limit_window INTEGER DEFAULT 60, -- seconds
    update_frequency VARCHAR(50) DEFAULT 'daily',
    last_successful_run TIMESTAMP WITH TIME ZONE,
    total_services_extracted INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline jobs (extended from existing scraping_jobs)
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS data_source_id UUID REFERENCES data_sources(id);
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS duplicate_count INTEGER DEFAULT 0;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS quality_issues JSONB DEFAULT '[]';

-- Service deduplication tracking
CREATE TABLE service_duplicates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    duplicate_service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    similarity_score DECIMAL(3,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    match_type VARCHAR(50) NOT NULL CHECK (match_type IN ('exact', 'fuzzy_name', 'location', 'contact', 'abn')),
    match_confidence VARCHAR(20) NOT NULL CHECK (match_confidence IN ('low', 'medium', 'high')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_action VARCHAR(20) CHECK (resolved_action IN ('merge', 'keep_separate', 'flag')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data source performance metrics
CREATE TABLE source_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    extraction_date DATE NOT NULL,
    services_extracted INTEGER DEFAULT 0,
    services_new INTEGER DEFAULT 0,
    services_updated INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    avg_quality_score DECIMAL(3,2),
    processing_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Quality Scoring Algorithm

### Completeness Score (40 points)
- Has description (10 points)
- Has contact information (10 points)  
- Has location details (10 points)
- Has operating hours (5 points)
- Has eligibility criteria (5 points)

### Source Reliability (25 points)
- Government source (25 points)
- Verified NGO (20 points)
- Community organization (15 points)
- Unverified source (10 points)

### Data Freshness (20 points)
- Updated within 30 days (20 points)
- Updated within 90 days (15 points)
- Updated within 180 days (10 points)
- Updated within 1 year (5 points)
- Older than 1 year (0 points)

### Contact Verification (10 points)
- Phone number verified (5 points)
- Email verified (3 points)
- Website accessible (2 points)

### Community Validation (5 points)
- User ratings/reviews (5 points)
- Community feedback (3 points)

## Deduplication Algorithm

### Stage 1: Exact Matches
- ABN/ACN matching
- Email exact match
- Phone number exact match

### Stage 2: High Confidence Fuzzy Matching
- Organization name similarity > 90%
- Same address + similar service names
- Website domain matching

### Stage 3: Medium Confidence Matching
- Organization name similarity > 80%
- Location proximity < 500m + name similarity > 70%
- Multiple contact method overlaps

### Stage 4: Low Confidence Flagging
- Name similarity 60-80%
- Location proximity < 2km + category overlap
- Requires manual review

## Error Handling Strategy

### Retry Logic
- Exponential backoff for temporary failures
- Maximum 3 retry attempts per source
- Circuit breaker for consistently failing sources

### Error Categories
- **Network Errors**: Retry with backoff
- **Rate Limiting**: Respect rate limits, queue requests
- **Data Format Errors**: Log and continue with other records
- **Authentication Errors**: Alert administrators, pause source

### Monitoring and Alerting
- Real-time pipeline status dashboard
- Email alerts for critical failures
- Slack integration for pipeline notifications
- Daily quality reports

## API Integration Guidelines

### Rate Limiting
- Respect source rate limits
- Implement adaptive throttling
- Use request queuing for high-volume sources

### Authentication
- Secure API key storage
- Token refresh handling
- Multi-tenant API access

### Data Caching
- Cache frequently accessed data
- Implement cache invalidation strategies
- Use Redis for temporary data storage

This architecture provides a robust, scalable foundation for integrating multiple data sources while maintaining data quality and system reliability.