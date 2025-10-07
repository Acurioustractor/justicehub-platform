/**
 * AI Scraper Setup Utilities
 * 
 * Functions for initializing the scraping system with default data sources
 */

import { createSupabaseClient } from '@/lib/supabase/client';
import type { DataSource, SourceType, UpdateFrequency } from '../types';

/**
 * Initialize the AI scraper with default Australian government data sources
 */
export async function initializeScrapingSystem(): Promise<void> {
  const supabase = createSupabaseClient();
  
  console.log('🔧 Initializing AI Scraping System...');

  // Create default data sources
  const defaultSources = getDefaultDataSources();
  
  for (const source of defaultSources) {
    try {
      // Check if source already exists
      const { data: existing } = await supabase
        .from('data_sources')
        .select('id')
        .eq('name', source.name)
        .eq('type', source.type)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('data_sources')
          .insert(source);

        if (error) {
          console.error(`Failed to create data source ${source.name}:`, error);
        } else {
          console.log(`✅ Created data source: ${source.name}`);
        }
      } else {
        console.log(`⏭️  Data source already exists: ${source.name}`);
      }
    } catch (error) {
      console.error(`Error setting up data source ${source.name}:`, error);
    }
  }

  console.log('🎉 AI Scraping System initialization complete');
}

/**
 * Get default Australian government and legal aid data sources
 */
function getDefaultDataSources(): Omit<DataSource, 'id' | 'created_at' | 'updated_at'>[] {
  return [
    // Federal Government
    {
      name: 'Australian Government Open Data',
      type: SourceType.GOVERNMENT_DATABASE,
      base_url: 'https://data.gov.au',
      api_endpoint: 'https://data.gov.au/api/3',
      scraping_config: {
        rate_limit_ms: 2000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0',
        headers: {
          'Accept': 'application/json'
        }
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="youth"], a[href*="justice"], a[href*="legal"], a[href*="community"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.7
        }
      ],
      update_frequency: UpdateFrequency.WEEKLY,
      reliability_score: 0.9,
      last_successful_scrape: null,
      active: true
    },

    // NSW Government
    {
      name: 'NSW Family and Community Services',
      type: SourceType.GOVERNMENT_DATABASE,
      base_url: 'https://www.facs.nsw.gov.au',
      scraping_config: {
        rate_limit_ms: 1500,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="service"], a[href*="provider"], a[href*="youth"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.8
        }
      ],
      update_frequency: UpdateFrequency.MONTHLY,
      reliability_score: 0.85,
      last_successful_scrape: null,
      active: true
    },

    // Queensland Government
    {
      name: 'QLD Youth Justice Services',
      type: SourceType.GOVERNMENT_DATABASE,
      base_url: 'https://www.youthjustice.qld.gov.au',
      scraping_config: {
        rate_limit_ms: 1500,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="partner"], a[href*="service"], a[href*="program"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.8
        }
      ],
      update_frequency: UpdateFrequency.MONTHLY,
      reliability_score: 0.9,
      last_successful_scrape: null,
      active: true
    },

    // Victoria Government
    {
      name: 'VIC Department of Justice',
      type: SourceType.GOVERNMENT_DATABASE,
      base_url: 'https://www.justice.vic.gov.au',
      scraping_config: {
        rate_limit_ms: 1500,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="youth"], a[href*="community"], a[href*="service"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.8
        }
      ],
      update_frequency: UpdateFrequency.MONTHLY,
      reliability_score: 0.85,
      last_successful_scrape: null,
      active: true
    },

    // Legal Aid - NSW
    {
      name: 'Legal Aid NSW',
      type: SourceType.LEGAL_AID_DIRECTORY,
      base_url: 'https://www.legalaid.nsw.gov.au',
      scraping_config: {
        rate_limit_ms: 2000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="help"], a[href*="service"], a[href*="legal"]',
          expected_result_type: 'service_info',
          confidence_threshold: 0.9
        }
      ],
      update_frequency: UpdateFrequency.MONTHLY,
      reliability_score: 0.95,
      last_successful_scrape: null,
      active: true
    },

    // Legal Aid - Queensland
    {
      name: 'Legal Aid Queensland',
      type: SourceType.LEGAL_AID_DIRECTORY,
      base_url: 'https://www.legalaid.qld.gov.au',
      scraping_config: {
        rate_limit_ms: 2000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="help"], a[href*="youth"], a[href*="criminal"]',
          expected_result_type: 'service_info',
          confidence_threshold: 0.9
        }
      ],
      update_frequency: UpdateFrequency.MONTHLY,
      reliability_score: 0.95,
      last_successful_scrape: null,
      active: true
    },

    // Legal Aid - Victoria
    {
      name: 'Victoria Legal Aid',
      type: SourceType.LEGAL_AID_DIRECTORY,
      base_url: 'https://www.legalaid.vic.gov.au',
      scraping_config: {
        rate_limit_ms: 2000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="legal-answers"], a[href*="youth"], a[href*="criminal"]',
          expected_result_type: 'service_info',
          confidence_threshold: 0.9
        }
      ],
      update_frequency: UpdateFrequency.MONTHLY,
      reliability_score: 0.95,
      last_successful_scrape: null,
      active: true
    },

    // Community Organizations Registry
    {
      name: 'Australian Charities and Not-for-profits Commission',
      type: SourceType.NGO_REGISTRY,
      base_url: 'https://www.acnc.gov.au',
      api_endpoint: 'https://data.gov.au/data/api/3/action/datastore_search',
      scraping_config: {
        rate_limit_ms: 3000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 45000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'ai_guided',
          pattern: 'youth justice, legal aid, community support, juvenile services',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.7
        }
      ],
      update_frequency: UpdateFrequency.WEEKLY,
      reliability_score: 0.8,
      last_successful_scrape: null,
      active: true
    },

    // Youth-specific organizations
    {
      name: 'Youth Law Australia',
      type: SourceType.COMMUNITY_DIRECTORY,
      base_url: 'https://www.youthlaw.asn.au',
      scraping_config: {
        rate_limit_ms: 2000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="resource"], a[href*="service"], a[href*="legal"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.9
        }
      ],
      update_frequency: UpdateFrequency.MONTHLY,
      reliability_score: 0.9,
      last_successful_scrape: null,
      active: true
    },

    // Indigenous Legal Services
    {
      name: 'National Aboriginal and Torres Strait Islander Legal Services',
      type: SourceType.LEGAL_AID_DIRECTORY,
      base_url: 'https://www.natsils.org.au',
      scraping_config: {
        rate_limit_ms: 2500,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="service"], a[href*="legal"], a[href*="member"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.9
        }
      ],
      update_frequency: UpdateFrequency.MONTHLY,
      reliability_score: 0.85,
      last_successful_scrape: null,
      active: true
    }
  ];
}

/**
 * Create a test scraping job for validation
 */
export async function createTestScrapingJob(dataSourceName: string): Promise<string | null> {
  const supabase = createSupabaseClient();
  
  try {
    // Get the data source
    const { data: dataSource, error: sourceError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('name', dataSourceName)
      .single();

    if (sourceError || !dataSource) {
      throw new Error(`Data source '${dataSourceName}' not found`);
    }

    // Create a test job
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        type: 'discovery',
        status: 'queued',
        priority: 'low',
        data_source_id: dataSource.id,
        configuration: {
          test_mode: true,
          max_urls: 5,
          timeout_override: 10000
        },
        created_by: 'system_test'
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create test job: ${jobError.message}`);
    }

    console.log(`✅ Created test job ${job.id} for data source: ${dataSourceName}`);
    return job.id;

  } catch (error) {
    console.error('Failed to create test job:', error);
    return null;
  }
}

/**
 * Validate the scraping system setup
 */
export async function validateScrapingSetup(): Promise<{
  valid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const supabase = createSupabaseClient();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check database tables exist
  try {
    const { error: tableError } = await supabase
      .from('data_sources')
      .select('count')
      .limit(1);

    if (tableError) {
      issues.push('Database tables not found - run migrations first');
    }
  } catch (error) {
    issues.push('Database connection failed');
  }

  // Check for active data sources
  try {
    const { data: sources, error } = await supabase
      .from('data_sources')
      .select('count')
      .eq('active', true);

    if (error || !sources || sources.length === 0) {
      issues.push('No active data sources configured');
      recommendations.push('Run initializeScrapingSystem() to create default sources');
    }
  } catch (error) {
    issues.push('Failed to check data sources');
  }

  // Check API configuration
  const { env } = await import('@/lib/env');
  
  if (!env.FIRECRAWL_API_KEY) {
    issues.push('Firecrawl API key not configured');
    recommendations.push('Add FIRECRAWL_API_KEY to environment variables');
  }

  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    issues.push('No AI API keys configured');
    recommendations.push('Add OPENAI_API_KEY or ANTHROPIC_API_KEY to environment variables');
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations
  };
}