#!/usr/bin/env node
/**
 * Review and verify auto-assigned service categories
 * Shows services grouped by category for manual review
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function main() {
  console.log('============================================================');
  console.log('📋 SERVICE CATEGORY REVIEW');
  console.log('============================================================\n');

  // Get all services with their categories
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, service_category, description, organizations(name)')
    .order('name');

  if (error) {
    console.error('❌ Error fetching services:', error);
    return;
  }

  console.log(`📊 Total services: ${services?.length || 0}\n`);

  // Group by category
  const categoryGroups: Record<string, any[]> = {};

  for (const service of services || []) {
    const categories = service.service_category || ['uncategorized'];
    for (const category of categories) {
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(service);
    }
  }

  // Display category statistics
  console.log('📊 CATEGORY DISTRIBUTION');
  console.log('============================================================\n');

  const sortedCategories = Object.entries(categoryGroups).sort((a, b) => b[1].length - a[1].length);

  for (const [category, categoryServices] of sortedCategories) {
    console.log(`\n${category.toUpperCase().replace(/_/g, ' ')}: ${categoryServices.length} services`);
    console.log('─'.repeat(60));

    // Show first 5 services in this category
    for (const service of categoryServices.slice(0, 5)) {
      const orgName = (service.organizations as any)?.name || 'Unknown';
      console.log(`  • ${service.name}`);
      console.log(`    Org: ${orgName}`);
      console.log(`    Description: ${service.description?.substring(0, 80)}...`);
      console.log(`    Categories: ${(service.service_category || []).join(', ')}`);
    }

    if (categoryServices.length > 5) {
      console.log(`  ... and ${categoryServices.length - 5} more`);
    }
  }

  // Services with only 'support' category (default)
  console.log('\n\n⚠️  SERVICES WITH ONLY DEFAULT CATEGORY');
  console.log('============================================================\n');

  const defaultOnly = services?.filter(s =>
    s.service_category?.length === 1 && s.service_category[0] === 'support'
  ) || [];

  console.log(`Found ${defaultOnly.length} services with only 'support' category\n`);

  for (const service of defaultOnly.slice(0, 10)) {
    const orgName = (service.organizations as any)?.name || 'Unknown';
    console.log(`• ${service.name}`);
    console.log(`  Org: ${orgName}`);
    console.log(`  Description: ${service.description}`);
    console.log();
  }

  if (defaultOnly.length > 10) {
    console.log(`... and ${defaultOnly.length - 10} more\n`);
  }

  // Summary statistics
  console.log('\n============================================================');
  console.log('📊 SUMMARY');
  console.log('============================================================');
  console.log(`Total categories: ${Object.keys(categoryGroups).length}`);
  console.log(`Services with multiple categories: ${services?.filter(s => (s.service_category?.length || 0) > 1).length}`);
  console.log(`Services with only 'support': ${defaultOnly.length}`);
  console.log(`Most common category: ${sortedCategories[0]?.[0]} (${sortedCategories[0]?.[1].length} services)`);
}

main().catch(console.error);
