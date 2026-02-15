#!/usr/bin/env node
/**
 * Check data quality and completeness of services
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function main() {
  console.log('============================================================');
  console.log('📊 SERVICE DATA QUALITY REPORT');
  console.log('============================================================\n');

  const { data: services, error } = await supabase
    .from('services')
    .select('*');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  const total = services?.length || 0;

  // Field completeness
  const withWebsite = services?.filter(s => s.website_url).length || 0;
  const withPhone = services?.filter(s => s.contact_phone).length || 0;
  const withEmail = services?.filter(s => s.contact_email).length || 0;
  const withAddress = services?.filter(s => s.location_address).length || 0;
  const withPostcode = services?.filter(s => s.location_postcode).length || 0;

  // Category quality
  const withMultipleCategories = services?.filter(s => (s.service_category?.length || 0) > 1).length || 0;
  const withOnlySupport = services?.filter(s =>
    s.service_category?.length === 1 && s.service_category[0] === 'support'
  ).length || 0;

  console.log('📈 FIELD COMPLETENESS');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`Total services: ${total}`);
  console.log(`With website: ${withWebsite} (${Math.round(withWebsite/total*100)}%)`);
  console.log(`With phone: ${withPhone} (${Math.round(withPhone/total*100)}%)`);
  console.log(`With email: ${withEmail} (${Math.round(withEmail/total*100)}%)`);
  console.log(`With address: ${withAddress} (${Math.round(withAddress/total*100)}%)`);
  console.log(`With postcode: ${withPostcode} (${Math.round(withPostcode/total*100)}%)`);

  console.log('\n🏷️  CATEGORY QUALITY');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`With multiple categories: ${withMultipleCategories} (${Math.round(withMultipleCategories/total*100)}%)`);
  console.log(`With only 'support': ${withOnlySupport} (${Math.round(withOnlySupport/total*100)}%)`);

  // Completeness score
  const avgFields = (withWebsite + withPhone + withEmail + withAddress + withPostcode) / 5;
  const completenessScore = Math.round((avgFields / total) * 100);

  console.log('\n⭐ OVERALL DATA QUALITY');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`Completeness score: ${completenessScore}%`);

  if (completenessScore < 30) {
    console.log('Status: 🔴 Poor - Needs significant enrichment');
  } else if (completenessScore < 60) {
    console.log('Status: 🟡 Fair - Enrichment in progress');
  } else if (completenessScore < 80) {
    console.log('Status: 🟢 Good - Minor gaps remaining');
  } else {
    console.log('Status: 🟢 Excellent - Well enriched');
  }

  console.log('\n📋 NEXT ACTIONS');
  console.log('────────────────────────────────────────────────────────────');
  if (withOnlySupport > 50) {
    console.log(`• Improve categories for ${withOnlySupport} services`);
  }
  if (withWebsite < total * 0.5) {
    console.log(`• Add websites for ${total - withWebsite} services`);
  }
  if (withPhone < total * 0.5) {
    console.log(`• Add phone numbers for ${total - withPhone} services`);
  }
  if (withAddress < total * 0.5) {
    console.log(`• Add addresses for ${total - withAddress} services`);
  }
}

main().catch(console.error);
