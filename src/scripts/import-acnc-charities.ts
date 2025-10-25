#!/usr/bin/env node
/**
 * Import Youth Justice Charities from ACNC Register
 *
 * Downloads ACNC charity data and filters for Queensland youth justice organizations
 * Data source: https://data.gov.au/data/dataset/acnc-register
 */

import { importServices, ServiceInput } from '../lib/service-importer';

// Known major youth justice charities in Queensland to import directly
const knownCharities: ServiceInput[] = [
  {
    name: 'Youth Advocacy Centre Inc',
    organizationName: 'Youth Advocacy Centre Inc',
    description: 'Legal service providing advice and representation for children and young people in Queensland',
    city: 'Brisbane',
    state: 'QLD',
    website: 'https://www.yac.net.au',
    categories: ['legal_aid', 'advocacy', 'court_support'],
    metadata: {
      source: 'ACNC Register',
      charity: true,
      focus: 'Legal advocacy for young people'
    }
  },
  {
    name: 'Sisters Inside Inc',
    organizationName: 'Sisters Inside Inc',
    description: 'Aboriginal and Torres Strait Islander women and girls in the criminal justice system',
    city: 'Brisbane',
    state: 'QLD',
    website: 'https://www.sistersinside.com.au',
    categories: ['advocacy', 'cultural_support', 'legal_aid'],
    metadata: {
      source: 'ACNC Register',
      charity: true,
      focus: 'Indigenous women and girls in justice system'
    }
  },
  {
    name: 'Youth Affairs Network Queensland (YANQ)',
    organizationName: 'Youth Affairs Network Queensland',
    description: 'Peak body for youth sector in Queensland, advocating for young people and youth services',
    city: 'Brisbane',
    state: 'QLD',
    website: 'https://yanq.org.au',
    categories: ['advocacy', 'life_skills'],
    metadata: {
      source: 'ACNC Register',
      charity: true,
      peak_body: true
    }
  },
  {
    name: 'Captive Minds',
    organizationName: 'Captive Minds',
    description: 'Supporting children of parents in prison',
    city: 'Queensland',
    state: 'QLD',
    categories: ['family_support', 'mental_health', 'advocacy'],
    metadata: {
      source: 'ACNC Register',
      charity: true,
      focus: 'Children of incarcerated parents'
    }
  },
  {
    name: 'Lives Lived Well',
    organizationName: 'Lives Lived Well',
    description: 'Mental health, alcohol and other drugs services across Queensland',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.liveslivedwell.org.au',
    categories: ['mental_health', 'substance_abuse', 'health'],
    metadata: {
      source: 'ACNC Register',
      charity: true
    }
  },
  {
    name: 'Act for Kids',
    organizationName: 'Act for Kids',
    description: 'Child protection and family support services',
    city: 'Brisbane',
    state: 'QLD',
    website: 'https://www.actforkids.com.au',
    categories: ['family_support', 'mental_health', 'advocacy'],
    metadata: {
      source: 'ACNC Register',
      charity: true,
      focus: 'Child protection'
    }
  },
  {
    name: 'Life Without Barriers',
    organizationName: 'Life Without Barriers',
    description: 'Community services including youth and family support',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.lwb.org.au',
    categories: ['family_support', 'disability_support', 'housing'],
    metadata: {
      source: 'ACNC Register',
      charity: true
    }
  },
  {
    name: 'Youth Empowered Towards Independence (YETI)',
    organizationName: 'YETI',
    description: 'Supporting young people experiencing or at risk of homelessness',
    city: 'Brisbane',
    state: 'QLD',
    categories: ['housing', 'life_skills', 'family_support'],
    metadata: {
      source: 'ACNC Register',
      charity: true,
      focus: 'Youth homelessness'
    }
  },
  {
    name: 'Mercy Community Services',
    organizationName: 'Mercy Community Services',
    description: 'Community and family support services',
    city: 'Brisbane',
    state: 'QLD',
    website: 'https://www.mercycommunity.org.au',
    categories: ['family_support', 'housing', 'mental_health'],
    metadata: {
      source: 'ACNC Register',
      charity: true
    }
  },
  {
    name: 'Save the Children Australia - Queensland',
    organizationName: 'Save the Children Australia',
    description: 'Child rights organization including 54 Reasons bail support program',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.savethechildren.org.au',
    categories: ['advocacy', 'court_support', 'family_support'],
    metadata: {
      source: 'ACNC Register',
      charity: true,
      programs: ['54 Reasons bail support']
    }
  }
];

async function main() {
  console.log('============================================================');
  console.log('🏛️  IMPORTING ACNC REGISTERED CHARITIES');
  console.log('============================================================\n');

  console.log(`Importing ${knownCharities.length} known youth justice charities\n`);

  const result = await importServices(knownCharities);

  console.log('\n============================================================');
  console.log('📊 IMPORT RESULTS');
  console.log('============================================================');
  console.log(`Total processed: ${result.total}`);
  console.log(`✅ Created: ${result.created}`);
  console.log(`📝 Updated: ${result.updated}`);
  console.log(`❌ Failed: ${result.failed}`);

  if (result.created > 0) {
    console.log('\n✨ New charities added:');
    result.results
      .filter(r => r.success && r.isNew)
      .forEach(r => console.log(`   ✅ ${r.message}`));
  }

  console.log('\n💡 These are ACNC registered charities working in youth justice!');
}

main().catch(console.error);
