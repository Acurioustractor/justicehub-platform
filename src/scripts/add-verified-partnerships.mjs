#!/usr/bin/env node
/**
 * Add Verified Facility Partnerships
 *
 * IMPORTANT: Only add partnerships here that we have CONFIRMED evidence for.
 * Do NOT assume community programs work with detention centres - we need proof.
 *
 * Sources for verification:
 * - Official government partner lists
 * - Program websites stating they work in detention
 * - News articles confirming partnerships
 * - Annual reports
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * VERIFIED PARTNERSHIPS
 *
 * Only government Youth Justice services are included by default.
 * Community programs should ONLY be added when we have confirmed evidence.
 */
const VERIFIED_PARTNERSHIPS = [
  // ============================================
  // GOVERNMENT YOUTH JUSTICE SERVICES
  // These operate in conjunction with detention centres by definition
  // ============================================

  // NSW - Youth Justice Conferencing (all centres)
  { facility_slug: 'cobham-jjc', partner_name: 'Youth Justice Conferencing NSW', partner_type: 'service', partnership_type: 'bail_support', source: 'NSW Youth Justice Conferencing - diversionary program' },
  { facility_slug: 'frank-baxter-jjc', partner_name: 'Youth Justice Conferencing NSW', partner_type: 'service', partnership_type: 'bail_support', source: 'NSW Youth Justice Conferencing - diversionary program' },
  { facility_slug: 'reiby-jjc', partner_name: 'Youth Justice Conferencing NSW', partner_type: 'service', partnership_type: 'bail_support', source: 'NSW Youth Justice Conferencing - diversionary program' },
  { facility_slug: 'orana-jjc', partner_name: 'Youth Justice Conferencing NSW', partner_type: 'service', partnership_type: 'bail_support', source: 'NSW Youth Justice Conferencing - diversionary program' },
  { facility_slug: 'acmena-jjc', partner_name: 'Youth Justice Conferencing NSW', partner_type: 'service', partnership_type: 'bail_support', source: 'NSW Youth Justice Conferencing - diversionary program' },
  { facility_slug: 'riverina-jjc', partner_name: 'Youth Justice Conferencing NSW', partner_type: 'service', partnership_type: 'bail_support', source: 'NSW Youth Justice Conferencing - diversionary program' },

  // QLD - Youth Justice Services
  { facility_slug: 'brisbane-ydc', partner_name: 'Youth Justice Service Centres Queensland', partner_type: 'service', partnership_type: 'in_facility_program', source: 'QLD Government Youth Justice service centres' },
  { facility_slug: 'cleveland-ydc', partner_name: 'Youth Justice Service Centres Queensland', partner_type: 'service', partnership_type: 'in_facility_program', source: 'QLD Government Youth Justice service centres' },
  { facility_slug: 'west-moreton-ydc', partner_name: 'Youth Justice Service Centres Queensland', partner_type: 'service', partnership_type: 'in_facility_program', source: 'QLD Government Youth Justice service centres' },
  { facility_slug: 'brisbane-ydc', partner_name: 'Youth Justice Brisbane and Moreton Bay Region', partner_type: 'service', partnership_type: 'in_facility_program', source: 'QLD Government regional Youth Justice service' },
  { facility_slug: 'cleveland-ydc', partner_name: 'Youth Justice North Queensland Region', partner_type: 'service', partnership_type: 'in_facility_program', source: 'QLD Government regional Youth Justice service' },
  { facility_slug: 'brisbane-ydc', partner_name: 'Department of Youth Justice', partner_type: 'service', partnership_type: 'in_facility_program', source: 'QLD Department of Youth Justice' },
  { facility_slug: 'cleveland-ydc', partner_name: 'Department of Youth Justice', partner_type: 'service', partnership_type: 'in_facility_program', source: 'QLD Department of Youth Justice' },
  { facility_slug: 'west-moreton-ydc', partner_name: 'Department of Youth Justice', partner_type: 'service', partnership_type: 'in_facility_program', source: 'QLD Department of Youth Justice' },

  // VIC - Youth Justice Services (Parkville & Cherry Creek)
  { facility_slug: 'parkville-yjc', partner_name: 'Youth Justice Community Support Service', partner_type: 'service', partnership_type: 'post_release_support', source: 'VIC Youth Justice community support program' },
  { facility_slug: 'cherry-creek-yjc', partner_name: 'Youth Justice Community Support Service', partner_type: 'service', partnership_type: 'post_release_support', source: 'VIC Youth Justice community support program' },
  { facility_slug: 'parkville-yjc', partner_name: 'Koori Youth Justice Program', partner_type: 'service', partnership_type: 'cultural_program', source: 'VIC Koori Youth Justice Program for Aboriginal young people' },
  { facility_slug: 'cherry-creek-yjc', partner_name: 'Koori Youth Justice Program', partner_type: 'service', partnership_type: 'cultural_program', source: 'VIC Koori Youth Justice Program for Aboriginal young people' },
  { facility_slug: 'parkville-yjc', partner_name: 'Youth Justice Group Conferencing', partner_type: 'service', partnership_type: 'bail_support', source: 'VIC Youth Justice Group Conferencing - diversionary program' },
  { facility_slug: 'cherry-creek-yjc', partner_name: 'Youth Justice Group Conferencing', partner_type: 'service', partnership_type: 'bail_support', source: 'VIC Youth Justice Group Conferencing - diversionary program' },
  // VALS - confirmed legal support in detention
  { facility_slug: 'parkville-yjc', partner_name: 'Victorian Aboriginal Legal Service (VALS)', partner_type: 'organization', partnership_type: 'legal_support', source: 'VALS provides legal representation to Aboriginal youth in detention' },
  { facility_slug: 'cherry-creek-yjc', partner_name: 'Victorian Aboriginal Legal Service (VALS)', partner_type: 'organization', partnership_type: 'legal_support', source: 'VALS provides legal representation to Aboriginal youth in detention' },

  // SA - Youth Justice
  { facility_slug: 'kurlana-tapa', partner_name: 'Youth Justice Community Programs', partner_type: 'service', partnership_type: 'post_release_support', source: 'SA Youth Justice community programs' },
  { facility_slug: 'kurlana-tapa', partner_name: 'Department for Child Protection - Youth Justice', partner_type: 'service', partnership_type: 'in_facility_program', source: 'SA Department for Child Protection Youth Justice division' },

  // WA - Youth Justice
  { facility_slug: 'banksia-hill', partner_name: 'Department of Justice Youth Justice Services', partner_type: 'service', partnership_type: 'in_facility_program', source: 'WA Department of Justice Youth Justice Services' },
  { facility_slug: 'banksia-hill', partner_name: 'Community Juvenile Justice Teams', partner_type: 'service', partnership_type: 'post_release_support', source: 'WA Community Juvenile Justice Teams' },

  // NT - Territory Families (Holtze only - Don Dale & Alice Springs closed)
  { facility_slug: 'holtze-ydc', partner_name: 'Territory Families Youth Justice Services', partner_type: 'service', partnership_type: 'in_facility_program', source: 'NT Territory Families Youth Justice Services' },

  // ============================================
  // CONFIRMED COMMUNITY PARTNERSHIPS
  // Add here ONLY when we have verified evidence
  // ============================================

  // Example format (DO NOT ADD WITHOUT PROOF):
  // { facility_slug: 'xxx', partner_name: 'Program Name', partner_type: 'community_program', partnership_type: 'xxx', source: 'URL or document proving partnership' },
];

async function main() {
  console.log('============================================================');
  console.log('ADDING VERIFIED FACILITY PARTNERSHIPS');
  console.log('============================================================\n');

  console.log(`Found ${VERIFIED_PARTNERSHIPS.length} verified partnerships to process\n`);

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const partnership of VERIFIED_PARTNERSHIPS) {
    // Get facility ID (only operational facilities)
    const { data: facility } = await supabase
      .from('youth_detention_facilities')
      .select('id, name, operational_status')
      .eq('slug', partnership.facility_slug)
      .single();

    if (!facility) {
      console.log(`  X Facility not found: ${partnership.facility_slug}`);
      failed++;
      continue;
    }

    if (facility.operational_status !== 'operational') {
      console.log(`  - Skipping closed facility: ${facility.name}`);
      skipped++;
      continue;
    }

    // Get partner ID based on type
    let partnerId = null;

    if (partnership.partner_type === 'community_program') {
      const { data: program } = await supabase
        .from('community_programs')
        .select('id, name')
        .ilike('name', `%${partnership.partner_name}%`)
        .limit(1)
        .single();
      partnerId = program?.id;
    } else if (partnership.partner_type === 'organization') {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', `%${partnership.partner_name}%`)
        .limit(1)
        .single();
      partnerId = org?.id;
    } else if (partnership.partner_type === 'service') {
      const { data: service } = await supabase
        .from('services')
        .select('id, name')
        .ilike('name', `%${partnership.partner_name}%`)
        .limit(1)
        .single();
      partnerId = service?.id;
    }

    if (!partnerId) {
      console.log(`  ? Partner not found: ${partnership.partner_name}`);
      failed++;
      continue;
    }

    // Check if partnership already exists
    const existingQuery = supabase
      .from('facility_partnerships')
      .select('id')
      .eq('facility_id', facility.id);

    if (partnership.partner_type === 'community_program') {
      existingQuery.eq('program_id', partnerId);
    } else if (partnership.partner_type === 'organization') {
      existingQuery.eq('organization_id', partnerId);
    } else if (partnership.partner_type === 'service') {
      existingQuery.eq('service_id', partnerId);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      skipped++;
      continue;
    }

    // Create partnership
    const partnershipData = {
      facility_id: facility.id,
      partner_type: partnership.partner_type,
      partnership_type: partnership.partnership_type,
      is_active: true,
      description: partnership.source
    };

    if (partnership.partner_type === 'community_program') {
      partnershipData.program_id = partnerId;
    } else if (partnership.partner_type === 'organization') {
      partnershipData.organization_id = partnerId;
    } else if (partnership.partner_type === 'service') {
      partnershipData.service_id = partnerId;
    }

    const { error } = await supabase
      .from('facility_partnerships')
      .insert(partnershipData);

    if (error) {
      console.log(`  X Failed: ${partnership.partner_name} -> ${facility.name}`);
      failed++;
    } else {
      console.log(`  + ${partnership.partner_name} -> ${facility.name} (${partnership.partnership_type})`);
      added++;
    }
  }

  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Added: ${added}`);
  console.log(`Skipped (already exists or closed): ${skipped}`);
  console.log(`Failed: ${failed}`);

  // Show current partnerships count by facility
  const { data: stats } = await supabase
    .from('facility_partnerships')
    .select(`
      youth_detention_facilities!inner(name, state, operational_status)
    `);

  if (stats) {
    const byFacility = {};
    stats.forEach(p => {
      const name = p.youth_detention_facilities?.name;
      if (name && p.youth_detention_facilities?.operational_status === 'operational') {
        byFacility[name] = (byFacility[name] || 0) + 1;
      }
    });

    console.log('\nPartnerships by operational facility:');
    Object.entries(byFacility).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
      console.log(`  ${name}: ${count}`);
    });
  }

  console.log('\n⚠️  To add community program partnerships, you must:');
  console.log('   1. Find evidence the program works with detention centres');
  console.log('   2. Add to VERIFIED_PARTNERSHIPS with source URL/document');
  console.log('   3. Run this script again');
}

main().catch(console.error);
