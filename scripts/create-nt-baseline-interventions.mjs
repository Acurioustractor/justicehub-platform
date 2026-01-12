#!/usr/bin/env node
/**
 * Create NT Baseline Interventions
 *
 * Documents NT government and Aboriginal-led programs discovered through
 * manual scraping (AIHW, NAAJA, AMSANT, APO NT).
 *
 * Week 2 baseline - comparison to Oochiumpa model.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n📊 Creating NT Baseline Interventions');
console.log('═'.repeat(80));
console.log('\nDocumenting NT government and Aboriginal-led programs\n');

// ==========================================
// NT GOVERNMENT PROGRAMS (from AIHW data)
// ==========================================

const ntGovernmentPrograms = [
  {
    name: 'Youth Pre-Court Diversion Scheme (YDS)',
    type: 'Diversion',
    description: `NT Police-led diversion program operating under restorative justice framework. Provides alternatives to court proceedings for eligible young offenders through conferencing and community-based interventions.`,
    target_cohort: ['10-17 years', 'First-time or low-level offenders', 'NT'],
    geography: ['NT', 'Darwin', 'Alice Springs', 'Regional'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'NT Department of Corrections - Government program',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    metadata: {
      source: 'AIHW Youth Justice in Australia 2023-24, Appendix D',
      program_type: 'Police diversion',
      delivery_model: 'Restorative justice conferencing',
      comparison_to_oochiumpa: 'Government-led vs Aboriginal-owned, limited cultural authority',
    },
  },
  {
    name: 'Youth Justice Conferencing (NT)',
    type: 'Diversion',
    description: `Family or victim-offender conferencing program for young people in NT youth justice system. Brings together affected parties to discuss harm and pathways forward.`,
    target_cohort: ['12-17 years', 'Court-referred youth', 'NT'],
    geography: ['NT', 'Darwin', 'Alice Springs'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'NT Department of Corrections - Government program with Aboriginal Cultural Advisors',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    metadata: {
      source: 'AIHW Youth Justice in Australia 2023-24, Appendix D',
      program_type: 'Restorative justice',
      cultural_components: 'Aboriginal Cultural Advisors support culturally sensitive approaches',
      comparison_to_oochiumpa: 'Government-led with cultural support vs community-controlled',
    },
  },
  {
    name: 'Community Youth Justice Officers (CYJOs)',
    type: 'Wraparound Support',
    description: `Government case management and court-ordered supervision for young people in NT. Officers manage community-based supervision orders and provide ongoing risk assessment and support connections.`,
    target_cohort: ['12-17 years', 'Court-ordered supervision', 'NT'],
    geography: ['NT', 'Darwin', 'Alice Springs', 'Remote communities'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'NT Department of Corrections - Government program',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Medium',
    current_funding: 'Established',
    metadata: {
      source: 'AIHW Youth Justice in Australia 2023-24, Appendix D',
      program_type: 'Community supervision',
      delivery_model: 'Case management by government officers + non-government providers (urban/remote)',
      comparison_to_oochiumpa: 'Compliance-focused supervision vs holistic healing',
    },
  },
  {
    name: 'Alice Springs Youth Detention Centre',
    type: 'Therapeutic',
    description: `Secure youth detention facility in Alice Springs, NT. Provides custodial supervision for young people on remand or sentenced detention orders.`,
    target_cohort: ['10-17 years', 'Remand or sentenced', 'Central Australia'],
    geography: ['NT', 'Alice Springs', 'Central Australia'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'NT Department of Corrections - Government facility',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'High',
    current_funding: 'Established',
    metadata: {
      source: 'AIHW Youth Justice in Australia 2023-24, Appendix D',
      program_type: 'Custodial detention',
      known_issues: 'Royal Commission documented systemic failures, harm to young people',
      comparison_to_oochiumpa: 'Detention (40% recidivism) vs Oochiumpa (95% success)',
      aboriginal_overrepresentation: '95% of detained youth in NT are Aboriginal/TSI',
    },
  },
  {
    name: 'Don Dale Youth Detention Centre',
    type: 'Therapeutic',
    description: `Secure youth detention facility in Darwin, NT (now known as Holtze Youth Detention Centre). Site of Royal Commission inquiry into protection and detention of children following documented abuses.`,
    target_cohort: ['10-17 years', 'Remand or sentenced', 'Top End NT'],
    geography: ['NT', 'Darwin', 'Top End'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'NT Department of Corrections - Government facility',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'High',
    current_funding: 'Established',
    metadata: {
      source: 'AIHW Youth Justice in Australia 2023-24, Appendix D',
      program_type: 'Custodial detention',
      known_issues: 'Royal Commission 2017 documented abuse, torture, systemic failures',
      comparison_to_oochiumpa: 'Detention causes harm vs Oochiumpa heals',
      aboriginal_overrepresentation: '95% of detained youth in NT are Aboriginal/TSI',
      facility_name_change: 'Renamed to Holtze Youth Detention Centre',
    },
  },
  {
    name: 'Youth Outreach and Re-engagement Teams (NT)',
    type: 'Early Intervention',
    description: `NT Department of Children and Families program providing alternative pathways and early intervention for at-risk youth. Aims to prevent justice system involvement through community engagement.`,
    target_cohort: ['10-17 years', 'At-risk youth', 'NT'],
    geography: ['NT', 'Darwin', 'Alice Springs', 'Regional'],
    evidence_level: 'Untested (theory/pilot stage)',
    cultural_authority: 'NT Department of Children and Families - Government program',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    metadata: {
      source: 'AIHW Youth Justice in Australia 2023-24, Appendix D',
      program_type: 'Early intervention',
      delivery_model: 'Outreach teams engage youth before justice involvement',
      comparison_to_oochiumpa: 'Government-led intervention vs community-owned prevention',
    },
  },
];

// ==========================================
// ABORIGINAL-LED PROGRAMS (from NAAJA, AMSANT)
// ==========================================

const aboriginalLedPrograms = [
  {
    name: 'NAAJA Youth Throughcare',
    type: 'Wraparound Support',
    description: `Aboriginal-led case management program supporting young Aboriginal people involved in the criminal justice system and their families. Provides culturally appropriate support through transitions and court processes.`,
    target_cohort: ['10-17 years', 'Aboriginal & Torres Strait Islander', 'Justice-involved', 'NT'],
    geography: ['NT', 'Darwin', 'Alice Springs', 'Palmerston'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'North Australian Aboriginal Justice Agency - Aboriginal Community Controlled Organisation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    metadata: {
      source: 'NAAJA website (https://www.naaja.org.au/justice-programs)',
      program_type: 'Case management + family support',
      aboriginal_led: 'Yes - NAAJA is Aboriginal Community Controlled',
      cultural_components: 'Culturally appropriate service delivery',
      similarity_to_oochiumpa: 'Aboriginal-led, family-centered, culturally grounded',
      discovery_pattern_match: ['Aboriginal-owned', 'holistic youth support', 'family healing'],
      requires_consent: 'Yes - contact NAAJA for program details and outcomes',
    },
  },
  {
    name: 'Kunga Stopping Violence Program',
    type: 'Therapeutic',
    description: `NAAJA program operating from Alice Springs serving women in prison and post-release. Aims to reduce recidivism, support transition back to community, and increase safety of women and children.`,
    target_cohort: ['Women (includes young women)', 'In prison or post-release', 'Alice Springs'],
    geography: ['NT', 'Alice Springs', 'Central Australia'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'North Australian Aboriginal Justice Agency - Aboriginal Community Controlled Organisation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    metadata: {
      source: 'NAAJA website (https://www.naaja.org.au/justice-programs)',
      program_type: 'Violence prevention + reintegration',
      aboriginal_led: 'Yes - NAAJA is Aboriginal Community Controlled',
      outcomes_stated: 'Reduce recidivism, support community transition, increase safety',
      similarity_to_oochiumpa: 'Aboriginal-led, healing-focused, addresses root causes',
      requires_consent: 'Yes - contact NAAJA for program details',
    },
  },
  {
    name: 'AMSANT Social Emotional Wellbeing (SEWB) Program',
    type: 'Therapeutic',
    description: `Aboriginal Medical Services Alliance NT program addressing emotional and psychological health needs across 15 Aboriginal health services in NT. Holistic approach to mental health and wellbeing for Aboriginal communities.`,
    target_cohort: ['All ages including youth', 'Aboriginal & Torres Strait Islander', 'NT'],
    geography: ['NT', 'Darwin', 'Alice Springs', 'Remote communities'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Aboriginal Medical Services Alliance NT - Aboriginal Community Controlled Health Organisation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    metadata: {
      source: 'AMSANT website (https://www.amsant.org.au)',
      program_type: 'Social emotional wellbeing',
      aboriginal_led: 'Yes - AMSANT represents 15 Aboriginal health services',
      delivery_model: 'Distributed across member services (community-based)',
      overlap_with_justice: 'Mental health and wellbeing supports prevent justice involvement',
      similarity_to_oochiumpa: 'Holistic healing, Aboriginal-controlled, community-based',
      requires_consent: 'Yes - contact AMSANT for program details',
    },
  },
];

// ==========================================
// CREATE INTERVENTION RECORDS
// ==========================================

async function createInterventions() {
  console.log('📝 Creating Government Programs\n');

  const createdGovernment = [];
  for (const program of ntGovernmentPrograms) {
    console.log(`   Creating: ${program.name}`);

    const { data, error } = await supabase
      .from('alma_interventions')
      .insert(program)
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Error:`, error.message);
    } else {
      console.log(`   ✅ Created: ${data.id}`);
      createdGovernment.push(data);
    }
  }

  console.log(`\n✅ Government programs created: ${createdGovernment.length}\n`);

  console.log('📝 Creating Aboriginal-Led Programs\n');

  const createdAboriginal = [];
  for (const program of aboriginalLedPrograms) {
    console.log(`   Creating: ${program.name}`);

    const { data, error } = await supabase
      .from('alma_interventions')
      .insert(program)
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Error:`, error.message);
    } else {
      console.log(`   ✅ Created: ${data.id}`);
      createdAboriginal.push(data);
    }
  }

  console.log(`\n✅ Aboriginal-led programs created: ${createdAboriginal.length}\n`);

  return { createdGovernment, createdAboriginal };
}

// ==========================================
// COMPARISON SUMMARY
// ==========================================

async function createComparisonSummary(created) {
  console.log('\n📊 NT Baseline Summary');
  console.log('═'.repeat(80));

  console.log(`\n✅ Total Interventions Created: ${created.createdGovernment.length + created.createdAboriginal.length}`);
  console.log(`   Government programs: ${created.createdGovernment.length}`);
  console.log(`   Aboriginal-led programs: ${created.createdAboriginal.length}`);

  console.log('\n🔥 High Harm Risk (Detention):');
  created.createdGovernment
    .filter((p) => p.harm_risk_level === 'High' || p.harm_risk_level === 'Very High')
    .forEach((p) => {
      console.log(`   ⚠️  ${p.name} - ${p.harm_risk_level}`);
    });

  console.log('\n✅ Aboriginal Community Authority:');
  created.createdAboriginal.forEach((p) => {
    console.log(`   ✓ ${p.name} (${p.cultural_authority})`);
  });

  console.log('\n📋 Next Steps:');
  console.log('   1. Contact NAAJA for consent to document Youth Throughcare outcomes');
  console.log('   2. Contact AMSANT for SEWB program details');
  console.log('   3. Add evidence records linking to AIHW reports');
  console.log('   4. Create outcome records for programs with available data');
  console.log('   5. Generate NT baseline comparison (Oochiumpa vs government)\n');

  console.log('✨ NT Baseline complete!\n');
}

// ==========================================
// RUN
// ==========================================

async function main() {
  const created = await createInterventions();
  await createComparisonSummary(created);
}

main().catch(console.error);
