# 🚀 JusticeHub Service Finder & AI Scraper - Complete Setup Guide

## 🔧 Prerequisites
- Node.js 18+
- Supabase account with project `tednluwflfhxyucgwigh`
- API keys for OpenAI, Anthropic, and Firecrawl (already in your .env.local)

## 📋 Step-by-Step Setup

### Step 1: Create Database Tables

#### 1.1 Create Services Table
1. Go to your [Supabase Dashboard](https://app.supabase.com/project/tednluwflfhxyucgwigh)
2. Navigate to SQL Editor
3. Run this SQL command:

```sql
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    eligibility_criteria TEXT[],
    cost_structure VARCHAR(50),
    availability_schedule JSONB,
    contact_info JSONB,
    outcomes_evidence TEXT[],
    geographical_coverage JSONB,
    target_demographics JSONB,
    capacity_indicators JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_organization ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_geographical ON services USING GIN(geographical_coverage);
```

#### 1.2 Create AI Scraper Tables
Run this SQL command:

```sql
-- Core scraping metadata table
CREATE TABLE IF NOT EXISTS scraping_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_url TEXT NOT NULL,
    discovery_method VARCHAR(50) NOT NULL,
    extraction_method VARCHAR(50) NOT NULL,
    scraping_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ai_processing_version VARCHAR(20) NOT NULL,
    confidence_scores JSONB NOT NULL DEFAULT '{}',
    validation_status VARCHAR(20) DEFAULT 'pending',
    data_lineage JSONB DEFAULT '[]',
    quality_flags JSONB DEFAULT '[]',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data sources configuration and monitoring
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    scraping_config JSONB NOT NULL DEFAULT '{}',
    discovery_patterns JSONB DEFAULT '[]',
    update_frequency VARCHAR(20) DEFAULT 'weekly',
    reliability_score DECIMAL(3,2) DEFAULT 0.5,
    last_successful_scrape TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    active BOOLEAN DEFAULT true,
    rate_limit_ms INTEGER DEFAULT 1000,
    max_concurrent_requests INTEGER DEFAULT 1,
    respect_robots_txt BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type)
);

-- Organization enrichment data from AI scraping
CREATE TABLE IF NOT EXISTS organization_enrichment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    enrichment_type VARCHAR(50) NOT NULL, -- 'services', 'demographics', 'capacity', etc.
    data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    source_metadata JSONB,
    validation_status VARCHAR(20) DEFAULT 'pending',
    validated_by VARCHAR(255), -- User who validated the data
    validated_at TIMESTAMP WITH TIME ZONE,
    validation_notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, enrichment_type, created_at)
);

-- Service offerings extracted through AI scraping
CREATE TABLE IF NOT EXISTS scraped_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    eligibility_criteria TEXT[],
    cost_structure VARCHAR(50),
    availability_schedule JSONB,
    contact_info JSONB,
    outcomes_evidence TEXT[],
    geographical_coverage JSONB,
    target_demographics JSONB,
    capacity_indicators JSONB,
    confidence_score DECIMAL(3,2) NOT NULL,
    source_url TEXT,
    extraction_timestamp TIMESTAMP WITH TIME ZONE,
    validation_status VARCHAR(20) DEFAULT 'pending',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_scraping_metadata_org_id ON scraping_metadata(organization_id);
CREATE INDEX IF NOT EXISTS idx_scraping_metadata_source_type ON scraping_metadata(source_type);
CREATE INDEX IF NOT EXISTS idx_scraping_metadata_timestamp ON scraping_metadata(scraping_timestamp);
CREATE INDEX IF NOT EXISTS idx_scraping_metadata_validation_status ON scraping_metadata(validation_status);

CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(active);
CREATE INDEX IF NOT EXISTS idx_data_sources_last_scrape ON data_sources(last_successful_scrape);

CREATE INDEX IF NOT EXISTS idx_organization_enrichment_org_id ON organization_enrichment(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_enrichment_type ON organization_enrichment(enrichment_type);
CREATE INDEX IF NOT EXISTS idx_organization_enrichment_confidence ON organization_enrichment(confidence_score);
CREATE INDEX IF NOT EXISTS idx_organization_enrichment_validation ON organization_enrichment(validation_status);

CREATE INDEX IF NOT EXISTS idx_scraped_services_org_id ON scraped_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_scraped_services_category ON scraped_services(category);
CREATE INDEX IF NOT EXISTS idx_scraped_services_confidence ON scraped_services(confidence_score);
CREATE INDEX IF NOT EXISTS idx_scraped_services_validation ON scraped_services(validation_status);
```

### Step 2: Insert Sample Data

```bash
cd /Users/benknight/Code/JusticeHub
npx tsx src/scripts/insert-sample-data.ts
```

### Step 3: Initialize AI Scraper

```bash
npx tsx src/scripts/initialize-scraper.ts
```

### Step 4: Test the Setup

```bash
npx tsx src/scripts/run-test-scrape.ts
```

### Step 5: Run the Application

```bash
npm run dev
```

Visit http://localhost:3000/services to see the Service Finder in action!

## 🎯 Expected Results

1. **Service Finder Widget** will display real data from your Supabase database
2. **AI Scraper** will automatically discover and extract youth justice services from government websites
3. **Your services database** will be automatically populated with real service data
4. **The platform** will have a comprehensive directory of youth justice services

## 🆘 Troubleshooting

### If you see "relation does not exist" errors:
- Make sure you've run the SQL commands to create all required tables
- Refresh your Supabase database connection

### If API routes return errors:
- Check that your `.env.local` file has the correct Supabase credentials
- Verify that the services table exists in your database

### If scraping doesn't work:
- Ensure your API keys in `.env.local` are valid and not expired
- Check the Supabase logs for any errors

## 📁 Files Reference

- `/src/app/api/services/route.ts` - Main services API endpoint
- `/src/app/api/services/search/route.ts` - Search services API endpoint
- `/src/app/api/services/stats/route.ts` - Services statistics API endpoint
- `/src/scripts/insert-sample-data.ts` - Script to insert sample data
- `/src/database/services-schema.sql` - Services table schema
- `/src/database/ai-scraper-schema.sql` - AI scraper tables schema

## 🎉 Success!

Once everything is set up correctly, you'll have:
- A fully functional Service Finder that displays real data
- An AI-powered scraper that automatically populates your database
- A comprehensive directory of youth justice services
- A platform ready for production use