/**
 * Justice Matrix Seeding Script
 *
 * Seeds the justice_matrix_cases and justice_matrix_campaigns tables
 * from the seed JSON data.
 *
 * Usage: npx tsx scripts/seed-justice-matrix.ts
 */

import { createClient } from '@supabase/supabase-js';
import seedData from '../src/data/justice-matrix-seed.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tednluwflfhxyucgwigh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SeedCase {
  id: string;
  jurisdiction: string;
  case_citation: string;
  year: number;
  court: string;
  strategic_issue: string;
  key_holding: string;
  authoritative_link: string;
  region: string;
  country_code: string;
  lat: number;
  lng: number;
  categories: string[];
  outcome: 'favorable' | 'adverse' | 'pending';
  precedent_strength: 'high' | 'medium' | 'low';
}

interface SeedCampaign {
  id: string;
  country_region: string;
  campaign_name: string;
  lead_organizations: string;
  goals: string;
  notable_tactics: string;
  outcome_status: string;
  campaign_link: string;
  is_ongoing: boolean;
  start_year: number;
  end_year?: number;
  country_code: string;
  lat: number;
  lng: number;
  categories: string[];
}

async function seedJusticeMatrix() {
  console.log('🌱 Seeding Justice Matrix data...\n');

  // ============================================
  // 1. SEED CASES
  // ============================================
  console.log('📜 Seeding cases...');

  const cases = (seedData.cases as SeedCase[]).map((c) => ({
    jurisdiction: c.jurisdiction,
    case_citation: c.case_citation,
    year: c.year,
    court: c.court,
    strategic_issue: c.strategic_issue,
    key_holding: c.key_holding,
    authoritative_link: c.authoritative_link,
    region: c.region,
    country_code: c.country_code,
    lat: c.lat,
    lng: c.lng,
    categories: c.categories,
    outcome: c.outcome,
    precedent_strength: c.precedent_strength,
    source: 'seed_data',
    verified: true,
    verified_at: new Date().toISOString(),
  }));

  // Check for existing cases by citation to avoid duplicates
  for (const caseData of cases) {
    const { data: existing } = await supabase
      .from('justice_matrix_cases')
      .select('id')
      .eq('case_citation', caseData.case_citation)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('justice_matrix_cases')
        .update(caseData)
        .eq('id', existing.id);

      if (error) {
        console.error(`  ✗ Error updating case "${caseData.case_citation}":`, error.message);
      } else {
        console.log(`  ↻ Updated: ${caseData.case_citation.substring(0, 60)}...`);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('justice_matrix_cases')
        .insert(caseData);

      if (error) {
        console.error(`  ✗ Error inserting case "${caseData.case_citation}":`, error.message);
      } else {
        console.log(`  ✓ Added: ${caseData.case_citation.substring(0, 60)}...`);
      }
    }
  }

  console.log(`\n  Total cases processed: ${cases.length}`);

  // ============================================
  // 2. SEED CAMPAIGNS
  // ============================================
  console.log('\n📢 Seeding campaigns...');

  const campaigns = (seedData.campaigns as SeedCampaign[]).map((c) => ({
    country_region: c.country_region,
    campaign_name: c.campaign_name,
    lead_organizations: c.lead_organizations,
    goals: c.goals,
    notable_tactics: c.notable_tactics,
    outcome_status: c.outcome_status,
    campaign_link: c.campaign_link,
    is_ongoing: c.is_ongoing,
    start_year: c.start_year,
    end_year: c.end_year || null,
    country_code: c.country_code,
    lat: c.lat,
    lng: c.lng,
    categories: c.categories,
    source: 'seed_data',
    verified: true,
    verified_at: new Date().toISOString(),
  }));

  // Check for existing campaigns by name to avoid duplicates
  for (const campaignData of campaigns) {
    const { data: existing } = await supabase
      .from('justice_matrix_campaigns')
      .select('id')
      .eq('campaign_name', campaignData.campaign_name)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('justice_matrix_campaigns')
        .update(campaignData)
        .eq('id', existing.id);

      if (error) {
        console.error(`  ✗ Error updating campaign "${campaignData.campaign_name}":`, error.message);
      } else {
        console.log(`  ↻ Updated: ${campaignData.campaign_name}`);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('justice_matrix_campaigns')
        .insert(campaignData);

      if (error) {
        console.error(`  ✗ Error inserting campaign "${campaignData.campaign_name}":`, error.message);
      } else {
        console.log(`  ✓ Added: ${campaignData.campaign_name}`);
      }
    }
  }

  console.log(`\n  Total campaigns processed: ${campaigns.length}`);

  // ============================================
  // 3. VERIFY COUNTS
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 Verifying data...');

  const { count: caseCount } = await supabase
    .from('justice_matrix_cases')
    .select('*', { count: 'exact', head: true });

  const { count: campaignCount } = await supabase
    .from('justice_matrix_campaigns')
    .select('*', { count: 'exact', head: true });

  const { count: sourceCount } = await supabase
    .from('justice_matrix_sources')
    .select('*', { count: 'exact', head: true });

  console.log(`\n  📜 Cases in database: ${caseCount}`);
  console.log(`  📢 Campaigns in database: ${campaignCount}`);
  console.log(`  🔍 Research sources: ${sourceCount}`);

  // Breakdown by region
  const { data: regionStats } = await supabase
    .from('justice_matrix_cases')
    .select('region');

  if (regionStats) {
    const byRegion = regionStats.reduce((acc, row) => {
      acc[row.region] = (acc[row.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n  Cases by region:');
    for (const [region, count] of Object.entries(byRegion)) {
      console.log(`    - ${region}: ${count}`);
    }
  }

  // Breakdown by outcome
  const { data: outcomeStats } = await supabase
    .from('justice_matrix_cases')
    .select('outcome');

  if (outcomeStats) {
    const byOutcome = outcomeStats.reduce((acc, row) => {
      acc[row.outcome] = (acc[row.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n  Cases by outcome:');
    for (const [outcome, count] of Object.entries(byOutcome)) {
      console.log(`    - ${outcome}: ${count}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Justice Matrix seeding complete!');
  console.log('='.repeat(50));
}

// Run the script
seedJusticeMatrix().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
