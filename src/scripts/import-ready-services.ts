#!/usr/bin/env node
/**
 * Import Ready Services from JSON Files
 *
 * Imports the 19 government providers and 5 peak body members
 * that we've already extracted and prepared.
 */

import { importServices, ServiceInput } from '../lib/service-importer';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('============================================================');
  console.log('📦 IMPORTING READY SERVICES FROM JSON FILES');
  console.log('============================================================\n');

  // Load government providers
  const govtPath = join(process.cwd(), 'data/government/qld-youth-justice-providers.json');
  const govtProviders = JSON.parse(readFileSync(govtPath, 'utf-8'));

  console.log(`Found ${govtProviders.length} government providers\n`);

  // Transform to ServiceInput format
  const govtServices: ServiceInput[] = govtProviders.map((provider: any) => ({
    name: provider.name,
    organizationName: provider.name,
    description: `Queensland Government verified youth justice service provider`,
    city: provider.city || 'Queensland',
    state: 'QLD',
    categories: ['support', 'court_support'],
    metadata: {
      government_verified: true,
      source: 'QLD Department of Youth Justice Provider List',
      imported_from: 'qld-youth-justice-providers.json'
    }
  }));

  // Load peak body members
  const peakPath = join(process.cwd(), 'data/peak-bodies/peak-body-members.json');
  const peakMembers = JSON.parse(readFileSync(peakPath, 'utf-8'));

  // Filter out the error entries
  const validPeakMembers = peakMembers.filter((m: any) =>
    !m.name.includes('404') &&
    !m.name.includes('Error') &&
    !m.name.includes('Note:')
  );

  console.log(`Found ${validPeakMembers.length} peak body members\n`);

  // Transform to ServiceInput format
  const peakServices: ServiceInput[] = validPeakMembers.map((member: any) => ({
    name: member.name,
    organizationName: member.name,
    description: `Member of ${member.peakBody}`,
    city: member.city || 'Queensland',
    state: 'QLD',
    categories: ['support', 'cultural_support'],
    metadata: {
      peak_body_verified: true,
      peak_body: member.peakBody,
      source: 'Peak Body Member Directory',
      imported_from: 'peak-body-members.json'
    }
  }));

  // Combine all services
  const allServices = [...govtServices, ...peakServices];

  console.log('============================================================');
  console.log('📋 IMPORT SUMMARY');
  console.log('============================================================');
  console.log(`Government providers: ${govtServices.length}`);
  console.log(`Peak body members: ${peakServices.length}`);
  console.log(`Total to import: ${allServices.length}\n`);

  console.log('Starting import...\n');

  const result = await importServices(allServices);

  console.log('\n============================================================');
  console.log('📊 IMPORT RESULTS');
  console.log('============================================================');
  console.log(`Total processed: ${result.total}`);
  console.log(`✅ Created: ${result.created}`);
  console.log(`📝 Updated: ${result.updated}`);
  console.log(`❌ Failed: ${result.failed}`);

  if (result.failed > 0) {
    console.log('\n⚠️  Failed imports:');
    result.results
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.message}`));
  }

  // Show some success examples
  if (result.created > 0) {
    console.log('\n✨ Sample of new services created:');
    result.results
      .filter(r => r.success && r.isNew)
      .slice(0, 5)
      .forEach(r => console.log(`   ✅ ${r.message}`));
  }

  console.log('\n💡 These are high-quality, verified organizations!');
}

main().catch(console.error);
