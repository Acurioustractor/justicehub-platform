#!/usr/bin/env node
/**
 * Create Missing AI Scraper Tables
 * 
 * Creates the missing database tables needed for the AI scraper module
 */

import { createClient } from '@supabase/supabase-js'

async function createMissingTables() {
  console.log('🔧 Creating missing AI Scraper tables...')
  
  // Create Supabase client with service key
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  // SQL statements to create missing tables
  const tableStatements = [
    `
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
    `,
    `
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
    `,
    `
    CREATE TABLE IF NOT EXISTS organization_enrichment (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        enrichment_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        confidence_score DECIMAL(3,2) NOT NULL,
        source_metadata JSONB,
        validation_status VARCHAR(20) DEFAULT 'pending',
        validated_by VARCHAR(255),
        validated_at TIMESTAMP WITH TIME ZONE,
        validation_notes TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, enrichment_type, created_at)
    );
    `,
    `
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
    `
  ]
  
  // Create indexes
  const indexStatements = [
    "CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);",
    "CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(active);",
    "CREATE INDEX IF NOT EXISTS idx_data_sources_last_scrape ON data_sources(last_successful_scrape);",
    "CREATE INDEX IF NOT EXISTS idx_scraping_metadata_org_id ON scraping_metadata(organization_id);",
    "CREATE INDEX IF NOT EXISTS idx_scraping_metadata_source_type ON scraping_metadata(source_type);",
    "CREATE INDEX IF NOT EXISTS idx_scraping_metadata_timestamp ON scraping_metadata(scraping_timestamp);",
    "CREATE INDEX IF NOT EXISTS idx_scraping_metadata_validation_status ON scraping_metadata(validation_status);",
    "CREATE INDEX IF NOT EXISTS idx_organization_enrichment_org_id ON organization_enrichment(organization_id);",
    "CREATE INDEX IF NOT EXISTS idx_organization_enrichment_type ON organization_enrichment(enrichment_type);",
    "CREATE INDEX IF NOT EXISTS idx_organization_enrichment_confidence ON organization_enrichment(confidence_score);",
    "CREATE INDEX IF NOT EXISTS idx_organization_enrichment_validation ON organization_enrichment(validation_status);",
    "CREATE INDEX IF NOT EXISTS idx_scraped_services_org_id ON scraped_services(organization_id);",
    "CREATE INDEX IF NOT EXISTS idx_scraped_services_category ON scraped_services(category);",
    "CREATE INDEX IF NOT EXISTS idx_scraped_services_confidence ON scraped_services(confidence_score);",
    "CREATE INDEX IF NOT EXISTS idx_scraped_services_validation ON scraped_services(validation_status);"
  ]
  
  try {
    // Create tables
    for (const statement of tableStatements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.log(`⚠️  Warning: ${error.message}`)
      } else {
        // Extract table name
        const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)
        if (tableMatch) {
          console.log(`✅ Created table: ${tableMatch[1]}`)
        }
      }
    }
    
    // Create indexes
    console.log('.CreateIndexes...')
    for (const statement of indexStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log(`⚠️  Index warning: ${error.message}`)
        } else {
          console.log(`✅ Created index`)
        }
      } catch (error) {
        console.log(`⚠️  Index error: ${error}`)
      }
    }
    
    console.log('\n🎉 All missing AI Scraper tables created successfully!')
    
  } catch (error) {
    console.error('💥 Failed to create tables:', error)
  }
}

// Run the function
createMissingTables()
