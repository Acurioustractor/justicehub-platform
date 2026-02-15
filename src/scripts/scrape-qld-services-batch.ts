/**
 * Batch Scraper for Queensland Youth Justice Services
 * Loads URLs from JSON config and processes them in batches
 */

import { WebScraper } from '../lib/scraping/web-scraper';
import { ScraperConfig, ScrapedService } from '../lib/scraping/types';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface SourceConfig {
  id: string;
  name: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  expected_services: number;
  timeout: number;
  enabled: boolean;
}

interface URLConfig {
  version: string;
  last_updated: string;
  description: string;
  sources: SourceConfig[];
  statistics: {
    total_sources: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
    estimated_total_services: number;
    enabled_sources: number;
  };
}

// Load URL configuration
function loadURLConfig(): URLConfig {
  const configPath = path.join(process.cwd(), 'data', 'qld-service-urls.json');
  const configData = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configData);
}

// Check if service already exists (basic deduplication)
async function serviceExists(supabase: any, name: string, organizationName: string): Promise<boolean> {
  const { data } = await supabase
    .from('services')
    .select('id, name')
    .ilike('name', name)
    .limit(1);

  return data && data.length > 0;
}

async function saveToDatabase(services: ScrapedService[], batchNumber: number) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    return { saved: 0, skipped: 0, errors: 0 };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\n📊 Saving batch ${batchNumber} services to database...`);

  let savedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const service of services) {
    try {
      // Check for duplicates
      const exists = await serviceExists(supabase, service.name, service.organization_name);
      if (exists) {
        console.log(`⏭️  Skipped (duplicate): ${service.name}`);
        skippedCount++;
        continue;
      }

      // Find or create organization
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', service.organization_name)
        .single();

      let organizationId = existingOrg?.id;

      if (!organizationId) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: service.organization_name,
            type: 'nonprofit',
            is_active: true,
          })
          .select('id')
          .single();

        if (orgError) {
          console.error(`❌ Error creating org ${service.organization_name}:`, orgError.message);
          errorCount++;
          continue;
        }

        organizationId = newOrg.id;
      }

      // Generate unique slug
      const slug = service.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      // Insert service
      const { error: serviceError } = await supabase
        .from('services')
        .insert({
          name: service.name,
          slug: `${slug}-${Date.now()}`,
          description: service.description,
          organization_id: organizationId,
          categories: service.categories || [],
          keywords: service.keywords || [],
          target_age_min: service.target_age_min,
          target_age_max: service.target_age_max,
          youth_specific: service.youth_specific || false,
          indigenous_specific: service.indigenous_specific || false,
          contact_phone: service.contact_phone,
          contact_email: service.contact_email,
          website_url: service.website_url,
          location_address: service.street_address,
          location_city: service.city || 'Brisbane',
          location_state: service.state || 'QLD',
          location_postcode: service.postcode,
          eligibility_criteria: service.eligibility_criteria || [],
          cost: service.cost || 'unknown',
          delivery_method: service.delivery_method || [],
          operating_hours: service.operating_hours || {},
          data_source: service.data_source,
          data_source_url: service.data_source_url,
          scrape_confidence_score: service.scrape_confidence_score,
          verification_status: service.scrape_confidence_score >= 0.8 ? 'verified' : 'needs_review',
          is_active: true,
          is_accepting_referrals: true,
          program_type: service.categories?.[0] || 'general_support',
          last_scraped_at: new Date().toISOString(),
        });

      if (serviceError) {
        console.error(`❌ Error saving service ${service.name}:`, serviceError.message);
        errorCount++;
      } else {
        savedCount++;
        console.log(`✅ Saved: ${service.name} (confidence: ${service.scrape_confidence_score.toFixed(2)})`);
      }
    } catch (error) {
      console.error(`❌ Unexpected error saving service:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Batch ${batchNumber} save complete:`);
  console.log(`   ✅ Saved: ${savedCount} services`);
  console.log(`   ⏭️  Skipped: ${skippedCount} duplicates`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { saved: savedCount, skipped: skippedCount, errors: errorCount };
}

async function main() {
  console.log('🚀 Queensland Youth Services Batch Scraper');
  console.log('=' .repeat(60));

  // Command line arguments
  const args = process.argv.slice(2);
  const batchSize = parseInt(args[0]) || 5; // Default 5 sources per batch
  const priorityFilter = args[1] || 'all'; // 'all', 'high', 'medium', 'low'

  console.log(`📋 Configuration:`);
  console.log(`   Batch size: ${batchSize} sources`);
  console.log(`   Priority filter: ${priorityFilter}`);

  // Load URL configuration
  const urlConfig = loadURLConfig();
  console.log(`\n📚 Loaded ${urlConfig.sources.length} sources from config`);
  console.log(`   Expected total services: ~${urlConfig.statistics.estimated_total_services}`);

  // Filter sources
  let sources = urlConfig.sources.filter(s => s.enabled);
  if (priorityFilter !== 'all') {
    sources = sources.filter(s => s.priority === priorityFilter);
  }

  console.log(`\n🎯 Processing ${sources.length} sources...`);

  const scraper = new WebScraper();
  let totalStats = {
    sources_attempted: 0,
    sources_succeeded: 0,
    services_extracted: 0,
    services_saved: 0,
    services_skipped: 0,
    errors: 0,
  };

  try {
    // Process in batches
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(sources.length / batchSize);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 BATCH ${batchNumber}/${totalBatches} (${batch.length} sources)`);
      console.log('='.repeat(60));

      // Convert to scraper configs
      const scraperConfigs: ScraperConfig[] = batch.map(source => ({
        name: source.name,
        url: source.url,
        useAI: true,
        headless: true,
        timeout: source.timeout,
      }));

      // Scrape batch
      const results = await scraper.scrapeMultiple(scraperConfigs);
      const allServices = results.flatMap(r => r.services);

      totalStats.sources_attempted += batch.length;
      totalStats.sources_succeeded += results.filter(r => r.success).length;
      totalStats.services_extracted += allServices.length;

      console.log(`\n📊 Batch ${batchNumber} Results:`);
      results.forEach((result, idx) => {
        const source = batch[idx];
        console.log(`\n  ${source.name}:`);
        console.log(`    URL: ${source.url}`);
        console.log(`    Services found: ${result.services.length}`);
        console.log(`    Success: ${result.success ? '✅' : '❌'}`);
        console.log(`    Expected: ${source.expected_services}`);
      });

      // Save to database
      if (allServices.length > 0) {
        const saveResults = await saveToDatabase(allServices, batchNumber);
        totalStats.services_saved += saveResults.saved;
        totalStats.services_skipped += saveResults.skipped;
        totalStats.errors += saveResults.errors;
      }

      // Delay between batches to be polite
      if (i + batchSize < sources.length) {
        console.log(`\n⏳ Waiting 10 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Sources attempted: ${totalStats.sources_attempted}`);
    console.log(`Sources succeeded: ${totalStats.sources_succeeded} (${Math.round(totalStats.sources_succeeded / totalStats.sources_attempted * 100)}%)`);
    console.log(`Services extracted: ${totalStats.services_extracted}`);
    console.log(`Services saved: ${totalStats.services_saved}`);
    console.log(`Services skipped (duplicates): ${totalStats.services_skipped}`);
    console.log(`Errors: ${totalStats.errors}`);
    console.log(`\n✅ Batch scraping complete!`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await scraper.close();
  }
}

// Run the scraper
main().catch(console.error);
