#!/usr/bin/env node
/**
 * Import ALL Justice Reinvestment Sites from Comprehensive Table
 * Extracting every JR site mentioned across all jurisdictions
 */

import { importServices, ServiceInput } from '../lib/service-importer';

const allJRSites: ServiceInput[] = [
  // NSW Sites
  {
    name: 'Maranguka Justice Reinvestment - Bourke',
    organizationName: 'Just Reinvest NSW',
    description: 'Flagship Aboriginal-led justice reinvestment model with 46% reduction in domestic violence',
    city: 'Bourke',
    state: 'NSW',
    website: 'https://justreinvest.org.au',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', jr_site: true, flagship: true }
  },
  {
    name: 'Mount Druitt Justice Reinvestment',
    organizationName: 'Just Reinvest NSW',
    city: 'Mount Druitt',
    state: 'NSW',
    categories: ['family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Moree Justice Reinvestment',
    organizationName: 'Just Reinvest NSW',
    city: 'Moree',
    state: 'NSW',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Cowra Justice Reinvestment',
    organizationName: 'Just Reinvest NSW',
    city: 'Cowra',
    state: 'NSW',
    categories: ['family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Nowra Justice Reinvestment',
    organizationName: 'Just Reinvest NSW',
    city: 'Nowra',
    state: 'NSW',
    categories: ['family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },

  // NT Sites
  {
    name: 'Groote Eylandt Justice Reinvestment',
    organizationName: 'Njamarleya Aboriginal Corporation',
    description: 'Community-led justice reinvestment in Groote Eylandt',
    city: 'Groote Eylandt',
    state: 'NT',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Lajamanu Justice Reinvestment',
    organizationName: 'Kurdiji Aboriginal Corporation',
    city: 'Lajamanu',
    state: 'NT',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Maningrida Justice Reinvestment',
    city: 'Maningrida',
    state: 'NT',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Ntaria Justice Reinvestment',
    city: 'Ntaria (Hermannsburg)',
    state: 'NT',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },

  // WA Sites
  {
    name: 'Olabud Doogethu - Halls Creek',
    organizationName: 'Olabud Doogethu Aboriginal Corporation',
    description: 'First JR site in WA with 63% reduction in burglaries',
    city: 'Halls Creek',
    state: 'WA',
    website: 'https://olabuddoogethu.org.au',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', jr_site: true, first_in_wa: true }
  },
  {
    name: 'Yiriman Project',
    organizationName: 'Kimberley Elders',
    description: 'Cultural camps reconnecting youth to Country',
    city: 'Kimberley',
    state: 'WA',
    categories: ['cultural_support', 'life_skills', 'mental_health'],
    metadata: { source: 'Comprehensive Table', jr_site: true, cultural_program: true }
  },
  {
    name: 'Roebourne Justice Reinvestment',
    city: 'Roebourne',
    state: 'WA',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Warburton Justice Reinvestment',
    city: 'Warburton',
    state: 'WA',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Fitzroy Crossing Justice Reinvestment',
    city: 'Fitzroy Crossing',
    state: 'WA',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },

  // SA Sites
  {
    name: 'Tiraapendi Wodli - Port Adelaide',
    organizationName: 'Australian Red Cross',
    description: 'Community-led justice reinvestment program',
    city: 'Port Adelaide',
    state: 'SA',
    website: 'https://www.redcross.org.au',
    categories: ['family_support', 'cultural_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Healthy Dreaming - Port Augusta',
    organizationName: 'Aboriginal Community Council',
    description: 'Cultural connection justice reinvestment initiative',
    city: 'Port Augusta',
    state: 'SA',
    categories: ['cultural_support', 'family_support', 'health'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },
  {
    name: 'Ceduna Justice Reinvestment',
    city: 'Ceduna',
    state: 'SA',
    categories: ['cultural_support', 'family_support'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  },

  // VIC Sites
  {
    name: 'Target Zero - West Melbourne',
    organizationName: 'WestJustice',
    description: 'Justice reinvestment for multicultural communities',
    city: 'Melton',
    state: 'VIC',
    website: 'https://www.westjustice.org.au',
    categories: ['legal_aid', 'family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', jr_site: true, multicultural: true }
  },
  {
    name: 'Shepparton Justice Reinvestment',
    city: 'Shepparton',
    state: 'VIC',
    categories: ['family_support', 'advocacy'],
    metadata: { source: 'Comprehensive Table', jr_site: true }
  }
];

async function main() {
  console.log('============================================================');
  console.log('⚖️  IMPORTING ALL JUSTICE REINVESTMENT SITES');
  console.log('============================================================\n');

  console.log(`Total JR sites: ${allJRSites.length}`);
  console.log('NSW: 5, QLD: 4 (already imported), NT: 4, WA: 5, SA: 3, VIC: 2\n');

  const result = await importServices(allJRSites);

  console.log('\n============================================================');
  console.log('📊 IMPORT RESULTS');
  console.log('============================================================');
  console.log(`Total processed: ${result.total}`);
  console.log(`✅ Created: ${result.created}`);
  console.log(`📝 Updated: ${result.updated}`);
  console.log(`❌ Failed: ${result.failed}`);

  console.log('\n💡 Justice Reinvestment sites represent proven community-led approaches!');
}

main().catch(console.error);
