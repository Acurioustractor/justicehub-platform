#!/usr/bin/env node
/**
 * Build Facility Partnerships
 *
 * Links detention facilities to existing organizations, community programs,
 * and services based on location, focus area, and keywords.
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

// Keywords that indicate potential partnerships
const PARTNERSHIP_KEYWORDS = {
  in_facility_program: ['in-custody', 'detention', 'facility-based', 'incarcerated', 'custody'],
  post_release_support: ['reintegration', 'transition', 'post-release', 'aftercare', 'leaving custody'],
  bail_support: ['bail', 'remand', 'diversion', 'pre-trial'],
  family_connection: ['family', 'parent', 'carer', 'kinship', 'reunification'],
  education_provider: ['education', 'training', 'school', 'learning', 'literacy', 'employment'],
  health_provider: ['health', 'mental health', 'counselling', 'therapy', 'wellbeing', 'psychology'],
  legal_support: ['legal', 'court', 'lawyer', 'solicitor', 'advocacy'],
  cultural_program: ['cultural', 'indigenous', 'aboriginal', 'torres strait', 'first nations', 'country'],
  mentoring: ['mentor', 'role model', 'big brother', 'big sister', 'peer support'],
  housing_support: ['housing', 'accommodation', 'homeless', 'shelter'],
  employment_support: ['employment', 'job', 'work', 'vocational', 'career', 'apprentice'],
  advocacy: ['advocacy', 'rights', 'voice', 'representation', 'ombudsman']
};

function determinePartnershipType(description = '', name = '', approach = '') {
  const text = `${description} ${name} ${approach}`.toLowerCase();

  for (const [type, keywords] of Object.entries(PARTNERSHIP_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return type;
      }
    }
  }

  return 'other';
}

function isYouthJusticeRelevant(text = '') {
  const t = text.toLowerCase();
  const relevantTerms = [
    'youth', 'young', 'juvenile', 'detention', 'justice', 'court',
    'offend', 'reoffend', 'diversion', 'remand', 'custody', 'incarcerat',
    'at-risk', 'at risk', 'prevention', 'intervention', 'rehabilitat',
    'reintegrat', 'transition', 'post-release', 'community supervision'
  ];

  return relevantTerms.some(term => t.includes(term));
}

async function main() {
  console.log('============================================================');
  console.log('BUILDING FACILITY PARTNERSHIPS');
  console.log('============================================================\n');

  // Get all detention facilities
  const { data: facilities, error: facilityError } = await supabase
    .from('youth_detention_facilities')
    .select('id, name, state, city')
    .eq('operational_status', 'operational');

  if (facilityError || !facilities) {
    console.error('Error fetching facilities:', facilityError);
    return;
  }

  console.log(`Found ${facilities.length} operational detention facilities\n`);

  // Get organizations
  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, state, description, type')
    .eq('is_active', true);

  console.log(`Found ${organizations?.length || 0} active organizations`);

  // Get community programs
  const { data: programs } = await supabase
    .from('community_programs')
    .select('id, name, state, description, approach');

  console.log(`Found ${programs?.length || 0} community programs`);

  // Get services
  const { data: services } = await supabase
    .from('services')
    .select('id, name, location_state, description, category');

  console.log(`Found ${services?.length || 0} services\n`);

  let partnershipsCreated = 0;
  let partnershipsSkipped = 0;

  // Check existing partnerships
  const { data: existingPartnerships } = await supabase
    .from('facility_partnerships')
    .select('facility_id, organization_id, program_id, service_id');

  const existingSet = new Set(
    (existingPartnerships || []).map(p =>
      `${p.facility_id}-${p.organization_id || ''}-${p.program_id || ''}-${p.service_id || ''}`
    )
  );

  console.log(`Existing partnerships: ${existingPartnerships?.length || 0}\n`);

  // Link organizations to facilities
  console.log('--- Linking Organizations ---');
  for (const facility of facilities) {
    const stateOrgs = organizations?.filter(o =>
      o.state === facility.state &&
      isYouthJusticeRelevant(`${o.description} ${o.name} ${o.type}`)
    ) || [];

    for (const org of stateOrgs) {
      const key = `${facility.id}-${org.id}--`;

      if (existingSet.has(key)) {
        partnershipsSkipped++;
        continue;
      }

      const partnershipType = determinePartnershipType(org.description, org.name, '');

      const { error } = await supabase
        .from('facility_partnerships')
        .insert({
          facility_id: facility.id,
          partner_type: 'organization',
          organization_id: org.id,
          partnership_type: partnershipType,
          is_active: true,
          description: `${org.name} operates in ${facility.state} and may provide ${partnershipType.replace(/_/g, ' ')} services.`
        });

      if (!error) {
        console.log(`  + ${org.name} -> ${facility.name} (${partnershipType})`);
        partnershipsCreated++;
        existingSet.add(key);
      }
    }
  }

  // Link programs to facilities
  console.log('\n--- Linking Community Programs ---');
  for (const facility of facilities) {
    const statePrograms = programs?.filter(p =>
      p.state === facility.state &&
      isYouthJusticeRelevant(`${p.description} ${p.name} ${p.approach}`)
    ) || [];

    for (const program of statePrograms) {
      const key = `${facility.id}--${program.id}-`;

      if (existingSet.has(key)) {
        partnershipsSkipped++;
        continue;
      }

      const partnershipType = determinePartnershipType(program.description, program.name, program.approach);

      const { error } = await supabase
        .from('facility_partnerships')
        .insert({
          facility_id: facility.id,
          partner_type: 'community_program',
          program_id: program.id,
          partnership_type: partnershipType,
          is_active: true,
          description: `${program.name} provides ${partnershipType.replace(/_/g, ' ')} support for young people in ${facility.state}.`
        });

      if (!error) {
        console.log(`  + ${program.name} -> ${facility.name} (${partnershipType})`);
        partnershipsCreated++;
        existingSet.add(key);
      }
    }
  }

  // Link services to facilities
  console.log('\n--- Linking Services ---');
  for (const facility of facilities) {
    const stateServices = services?.filter(s =>
      s.location_state === facility.state &&
      isYouthJusticeRelevant(`${s.description} ${s.name} ${s.category}`)
    ) || [];

    for (const service of stateServices) {
      const key = `${facility.id}---${service.id}`;

      if (existingSet.has(key)) {
        partnershipsSkipped++;
        continue;
      }

      const partnershipType = determinePartnershipType(service.description, service.name, service.category);

      const { error } = await supabase
        .from('facility_partnerships')
        .insert({
          facility_id: facility.id,
          partner_type: 'service',
          service_id: service.id,
          partnership_type: partnershipType,
          is_active: true,
          description: `${service.name} provides ${partnershipType.replace(/_/g, ' ')} services in ${facility.state}.`
        });

      if (!error) {
        console.log(`  + ${service.name} -> ${facility.name} (${partnershipType})`);
        partnershipsCreated++;
        existingSet.add(key);
      }
    }
  }

  // Summary
  console.log('\n============================================================');
  console.log('PARTNERSHIP SUMMARY');
  console.log('============================================================');
  console.log(`Partnerships created: ${partnershipsCreated}`);
  console.log(`Partnerships skipped (already exist): ${partnershipsSkipped}`);

  // Show partnerships by state
  const { data: partnershipStats } = await supabase
    .from('facility_partnerships')
    .select(`
      youth_detention_facilities!inner(state),
      partner_type
    `);

  if (partnershipStats) {
    const byState = {};
    partnershipStats.forEach(p => {
      const state = p.youth_detention_facilities?.state;
      if (state) {
        byState[state] = (byState[state] || 0) + 1;
      }
    });

    console.log('\nPartnerships by state:');
    Object.entries(byState).sort((a, b) => b[1] - a[1]).forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });
  }

  // Show partnerships by type
  const { data: typeStats } = await supabase
    .from('facility_partnerships')
    .select('partnership_type');

  if (typeStats) {
    const byType = {};
    typeStats.forEach(p => {
      byType[p.partnership_type] = (byType[p.partnership_type] || 0) + 1;
    });

    console.log('\nPartnerships by type:');
    Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  ${type.replace(/_/g, ' ')}: ${count}`);
    });
  }

  console.log('\nFacility partnerships are now ready for ecosystem mapping!');
}

main().catch(console.error);
