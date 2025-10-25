#!/usr/bin/env node
/**
 * Identify top services needing contact enrichment
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  console.log('============================================================');
  console.log('🎯 IDENTIFYING TOP SERVICES FOR MANUAL ENRICHMENT');
  console.log('============================================================\n');

  // Get all services ordered by created date (oldest first = most established)
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      id,
      name,
      contact_phone,
      contact_email,
      website_url,
      location_address,
      location_city,
      location_state,
      service_category,
      organizations!inner(name, website_url)
    `)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  if (!services || services.length === 0) {
    console.log('No services found');
    return;
  }

  // Calculate completeness score for each service
  const scored = services.map((s: any) => {
    let score = 0;
    let missing: string[] = [];

    if (s.contact_phone) score++; else missing.push('phone');
    if (s.contact_email) score++; else missing.push('email');
    if (s.website_url) score++; else missing.push('website');
    if (s.location_address) score++; else missing.push('address');

    return {
      ...s,
      completenessScore: score,
      missingFields: missing
    };
  });

  // Sort by completeness (least complete first) and take top 50
  const targets = scored
    .sort((a, b) => a.completenessScore - b.completenessScore)
    .slice(0, 50);

  console.log('TOP 50 SERVICES NEEDING ENRICHMENT\n');
  console.log('Rank | Service Name | Organization | Phone | Email | Website | Address | Missing');
  console.log('─'.repeat(120));

  targets.forEach((s, idx) => {
    const name = s.name.substring(0, 30).padEnd(30);
    const org = s.organizations?.name?.substring(0, 25).padEnd(25) || 'No org'.padEnd(25);
    const phone = s.contact_phone ? '✅' : '❌';
    const email = s.contact_email ? '✅' : '❌';
    const website = s.website_url ? '✅' : '❌';
    const address = s.location_address ? '✅' : '❌';
    const missing = s.missingFields.join(', ');

    console.log(`${String(idx + 1).padStart(4)} | ${name} | ${org} | ${phone}    | ${email}    | ${website}      | ${address}      | ${missing}`);
  });

  // Summary statistics
  const stats = {
    needsPhone: targets.filter(s => !s.contact_phone).length,
    needsEmail: targets.filter(s => !s.contact_email).length,
    needsWebsite: targets.filter(s => !s.website_url).length,
    needsAddress: targets.filter(s => !s.location_address).length,
    fullyMissing: targets.filter(s => s.completenessScore === 0).length,
  };

  console.log('\n============================================================');
  console.log('📊 ENRICHMENT NEEDS SUMMARY');
  console.log('============================================================');
  console.log(`Services analyzed: ${targets.length}`);
  console.log(`Needs phone: ${stats.needsPhone} (${Math.round(stats.needsPhone/targets.length*100)}%)`);
  console.log(`Needs email: ${stats.needsEmail} (${Math.round(stats.needsEmail/targets.length*100)}%)`);
  console.log(`Needs website: ${stats.needsWebsite} (${Math.round(stats.needsWebsite/targets.length*100)}%)`);
  console.log(`Needs address: ${stats.needsAddress} (${Math.round(stats.needsAddress/targets.length*100)}%)`);
  console.log(`Fully missing (0/4): ${stats.fullyMissing}`);

  console.log('\n💡 RECOMMENDED APPROACH:');
  console.log('1. Start with government/official services (highest trust)');
  console.log('2. Research organization websites for contact details');
  console.log('3. Use Google search: "[organization name] contact"');
  console.log('4. Check official directories (ACNC, ABR, etc.)');
  console.log('5. Update using service-importer.ts for batch updates\n');

  // Group by organization for efficiency
  const byOrg = targets.reduce((acc: any, s) => {
    const orgName = s.organizations?.name || 'Unknown';
    if (!acc[orgName]) acc[orgName] = [];
    acc[orgName].push(s);
    return acc;
  }, {});

  console.log('============================================================');
  console.log('🏢 SERVICES GROUPED BY ORGANIZATION (for efficient research)');
  console.log('============================================================\n');

  Object.entries(byOrg)
    .sort(([, a]: any, [, b]: any) => b.length - a.length)
    .slice(0, 20)
    .forEach(([org, services]: any) => {
      console.log(`📌 ${org} (${services.length} services)`);
      services.forEach((s: any) => {
        console.log(`   - ${s.name} | Missing: ${s.missingFields.join(', ')}`);
      });
      console.log();
    });
}

main().catch(console.error);
