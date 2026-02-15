#!/usr/bin/env node
/**
 * Import Regional Youth Justice Programs from NT, WA, SA
 * Extracted from Comprehensive Table
 */

import { importServices, ServiceInput } from '../lib/service-importer';

const regionalPrograms: ServiceInput[] = [
  // NT Programs
  {
    name: 'Territory Families Youth Justice Services',
    organizationName: 'Northern Territory Government',
    description: 'Territory-wide youth justice services including detention and community support',
    city: 'Darwin',
    state: 'NT',
    website: 'https://tfhc.nt.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', government: true }
  },
  {
    name: 'Don Dale Youth Detention Centre',
    organizationName: 'Northern Territory Government',
    description: 'Youth detention facility with rehabilitation programs',
    city: 'Darwin',
    state: 'NT',
    categories: ['court_support', 'education_training', 'cultural_support'],
    metadata: { source: 'Comprehensive Table', detention_centre: true }
  },
  {
    name: 'Alice Springs Youth Detention Centre',
    organizationName: 'Northern Territory Government',
    description: 'Youth detention and rehabilitation services',
    city: 'Alice Springs',
    state: 'NT',
    categories: ['court_support', 'education_training', 'cultural_support'],
    metadata: { source: 'Comprehensive Table', detention_centre: true }
  },
  {
    name: 'NT Youth Outreach and Re-engagement (YORE)',
    organizationName: 'Northern Territory Government',
    description: 'Outreach program supporting young people at risk',
    city: 'Darwin',
    state: 'NT',
    categories: ['family_support', 'education_training', 'life_skills'],
    metadata: { source: 'Comprehensive Table', outreach: true }
  },

  // WA Programs
  {
    name: 'Department of Justice Youth Justice Services',
    organizationName: 'WA Government',
    description: 'State-wide youth justice services including detention and community programs',
    city: 'Perth',
    state: 'WA',
    website: 'https://www.justice.wa.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', government: true }
  },
  {
    name: 'Banksia Hill Detention Centre',
    organizationName: 'WA Government',
    description: 'Youth detention facility with education and rehabilitation programs',
    city: 'Perth',
    state: 'WA',
    categories: ['court_support', 'education_training', 'mental_health'],
    metadata: { source: 'Comprehensive Table', detention_centre: true }
  },
  {
    name: 'Target 120 Program',
    organizationName: 'WA Government',
    description: 'Intensive case management for high-risk young offenders',
    city: 'Perth',
    state: 'WA',
    categories: ['family_support', 'mental_health', 'court_support'],
    metadata: { source: 'Comprehensive Table', intensive_support: true }
  },
  {
    name: 'Community Juvenile Justice Teams',
    organizationName: 'WA Government',
    description: 'Regional teams providing youth justice services across WA',
    city: 'Western Australia',
    state: 'WA',
    categories: ['court_support', 'family_support', 'life_skills'],
    metadata: { source: 'Comprehensive Table', statewide: true }
  },
  {
    name: 'Aboriginal Youth at Risk Program',
    organizationName: 'WA Government',
    description: 'Cultural support and diversion for Aboriginal youth',
    city: 'Western Australia',
    state: 'WA',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', indigenous_focus: true }
  },

  // SA Programs
  {
    name: 'Department for Child Protection - Youth Justice',
    organizationName: 'SA Government',
    description: 'State youth justice services including detention and community support',
    city: 'Adelaide',
    state: 'SA',
    website: 'https://www.dcsi.sa.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', government: true }
  },
  {
    name: 'Kurlana Tapa Youth Justice Centre',
    organizationName: 'SA Government',
    description: 'Youth detention facility with rehabilitation and education programs',
    city: 'Adelaide',
    state: 'SA',
    categories: ['court_support', 'education_training', 'mental_health'],
    metadata: { source: 'Comprehensive Table', detention_centre: true }
  },
  {
    name: 'Family and Youth Drug Court',
    organizationName: 'Courts Administration Authority',
    description: 'Specialist court for young people with drug issues',
    city: 'Adelaide',
    state: 'SA',
    categories: ['court_support', 'substance_abuse', 'mental_health'],
    metadata: { source: 'Comprehensive Table', specialist_court: true }
  },
  {
    name: 'Youth Justice Community Programs',
    organizationName: 'SA Government',
    description: 'Community-based youth justice support across SA',
    city: 'South Australia',
    state: 'SA',
    categories: ['court_support', 'family_support', 'life_skills'],
    metadata: { source: 'Comprehensive Table', statewide: true }
  },
  {
    name: 'Aboriginal Family Support Services',
    organizationName: 'SA Government',
    description: 'Cultural support for Aboriginal families involved with youth justice',
    city: 'South Australia',
    state: 'SA',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', indigenous_focus: true }
  },

  // VIC Programs
  {
    name: 'Youth Justice Community Support Service',
    organizationName: 'VIC Government',
    description: 'Community-based support for young people on youth justice orders',
    city: 'Melbourne',
    state: 'VIC',
    categories: ['court_support', 'family_support', 'life_skills'],
    metadata: { source: 'Comprehensive Table', government: true }
  },
  {
    name: 'Parkville Youth Justice Precinct',
    organizationName: 'VIC Government',
    description: 'Youth detention and rehabilitation facility',
    city: 'Melbourne',
    state: 'VIC',
    categories: ['court_support', 'education_training', 'mental_health'],
    metadata: { source: 'Comprehensive Table', detention_centre: true }
  },
  {
    name: 'Cherry Creek Youth Justice Precinct',
    organizationName: 'VIC Government',
    description: 'Youth detention facility for young women',
    city: 'Melbourne',
    state: 'VIC',
    categories: ['court_support', 'education_training', 'mental_health'],
    metadata: { source: 'Comprehensive Table', detention_centre: true }
  },
  {
    name: 'Youth Justice Group Conferencing',
    organizationName: 'VIC Government',
    description: 'Restorative justice conferencing for young offenders',
    city: 'Victoria',
    state: 'VIC',
    categories: ['court_support', 'advocacy', 'family_support'],
    metadata: { source: 'Comprehensive Table', restorative_justice: true }
  },
  {
    name: 'Koori Youth Justice Program',
    organizationName: 'VIC Government',
    description: 'Cultural support and justice services for Aboriginal youth',
    city: 'Victoria',
    state: 'VIC',
    categories: ['cultural_support', 'court_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', indigenous_focus: true }
  }
];

async function main() {
  console.log('============================================================');
  console.log('🌏 IMPORTING REGIONAL YOUTH JUSTICE PROGRAMS');
  console.log('============================================================\n');

  console.log(`Total programs: ${regionalPrograms.length}`);
  console.log('NT: 4, WA: 5, SA: 5, VIC: 5\n');

  const result = await importServices(regionalPrograms);

  console.log('\n============================================================');
  console.log('📊 IMPORT RESULTS');
  console.log('============================================================');
  console.log(`Total processed: ${result.total}`);
  console.log(`✅ Created: ${result.created}`);
  console.log(`📝 Updated: ${result.updated}`);
  console.log(`❌ Failed: ${result.failed}`);

  if (result.created > 0) {
    console.log('\n✨ New programs added:');
    result.results
      .filter(r => r.success && r.isNew)
      .forEach(r => console.log(`   ✅ ${r.message}`));
  }

  console.log('\n💡 Regional programs expand national coverage of JusticeHub!');
}

main().catch(console.error);
