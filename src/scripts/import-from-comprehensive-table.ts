#!/usr/bin/env node
/**
 * Import Services from Comprehensive Youth Justice Table
 *
 * This imports all the programs and services documented in the
 * comprehensive table of youth justice programs across Australia.
 */

import { importServices, ServiceInput } from '../lib/service-importer';

// Comprehensive list of youth justice programs from the table
const youthJusticePrograms: ServiceInput[] = [
  // NSW Youth Justice Detention Centres
  {
    name: 'Acmena Youth Justice Centre',
    organizationName: 'NSW Youth Justice',
    description: 'Youth detention centre providing custodial rehabilitation and education',
    city: 'Sydney',
    state: 'NSW',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'NSW',
      data_source: 'https://data.nsw.gov.au'
    }
  },
  {
    name: 'Cobham Youth Justice Centre',
    organizationName: 'NSW Youth Justice',
    description: 'Youth detention centre providing custodial rehabilitation and education',
    city: 'Sydney',
    state: 'NSW',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'NSW'
    }
  },
  {
    name: 'Frank Baxter Youth Justice Centre',
    organizationName: 'NSW Youth Justice',
    description: 'Youth detention centre providing custodial rehabilitation and education',
    city: 'Sydney',
    state: 'NSW',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'NSW'
    }
  },
  {
    name: 'Orana Youth Justice Centre',
    organizationName: 'NSW Youth Justice',
    description: 'Youth detention centre providing custodial rehabilitation and education',
    city: 'Dubbo',
    state: 'NSW',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'NSW'
    }
  },
  {
    name: 'Reiby Youth Justice Centre',
    organizationName: 'NSW Youth Justice',
    description: 'Youth detention centre providing custodial rehabilitation and education',
    city: 'Sydney',
    state: 'NSW',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'NSW'
    }
  },
  {
    name: 'Riverina Youth Justice Centre',
    organizationName: 'NSW Youth Justice',
    description: 'Youth detention centre providing custodial rehabilitation and education',
    city: 'Wagga Wagga',
    state: 'NSW',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'NSW'
    }
  },

  // VIC Youth Justice
  {
    name: 'Parkville Youth Justice Centre',
    organizationName: 'Victorian Department of Justice',
    description: 'Main youth detention facility in Victoria',
    city: 'Melbourne',
    state: 'VIC',
    website: 'https://www.justice.vic.gov.au',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'VIC'
    }
  },
  {
    name: 'Cherry Creek Youth Justice Centre',
    organizationName: 'Victorian Department of Justice',
    description: 'Youth detention facility in Victoria',
    city: 'Melbourne',
    state: 'VIC',
    website: 'https://www.justice.vic.gov.au',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'VIC'
    }
  },

  // QLD Youth Justice (Focus on Queensland!)
  {
    name: 'Brisbane Youth Detention Centre',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Secure youth detention centre in Queensland',
    city: 'Brisbane',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'QLD',
      data_source: 'https://data.qld.gov.au/dataset/youth-justice-centres-locations'
    }
  },
  {
    name: 'Cleveland Youth Detention Centre',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Secure youth detention centre in Queensland',
    city: 'Cleveland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'QLD',
      data_source: 'https://data.qld.gov.au/dataset/youth-justice-centres-locations'
    }
  },

  // QLD Community Youth Justice (25+ Service Centres)
  {
    name: 'Youth Justice Service Centres Queensland',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Network of 25+ community-based youth justice service centres providing supervision and bail support across Queensland',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Community Youth Justice Offices',
      jurisdiction: 'QLD',
      service_count: '25+',
      data_source: 'https://data.qld.gov.au/dataset/youth-justice-centres-locations'
    }
  },

  // Other States
  {
    name: 'Banksia Hill Detention Centre',
    organizationName: 'WA Department of Justice',
    description: 'Only youth detention facility in Western Australia',
    city: 'Perth',
    state: 'WA',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'WA'
    }
  },
  {
    name: 'Kurlana Tapa Youth Justice Centre',
    organizationName: 'SA Department of Human Services',
    description: 'State youth detention and rehabilitation centre in South Australia',
    city: 'Adelaide',
    state: 'SA',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'SA'
    }
  },
  {
    name: 'Ashley Youth Detention Centre',
    organizationName: 'Tasmania Department for Education, Children and Young People',
    description: 'State youth detention centre; planned for closure',
    city: 'Hobart',
    state: 'TAS',
    categories: ['court_support', 'education_training', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'TAS',
      notes: 'Planned for closure'
    }
  },
  {
    name: 'Bimberi Youth Justice Centre',
    organizationName: 'ACT Government',
    description: 'Rights-based, rehabilitative youth detention facility',
    city: 'Canberra',
    state: 'ACT',
    categories: ['court_support', 'education_training', 'life_skills', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Youth Justice Detention Centre',
      jurisdiction: 'ACT',
      approach: 'Rights-based, rehabilitative'
    }
  },

  // Justice Reinvestment Programs - QLD Focus
  {
    name: 'Cherbourg Justice Reinvestment Project',
    organizationName: 'Gindaja',
    description: 'First Nations-led justice reinvestment project funded under National Justice Reinvestment Program',
    city: 'Cherbourg',
    state: 'QLD',
    categories: ['cultural_support', 'family_support', 'advocacy', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Justice Reinvestment',
      jurisdiction: 'QLD',
      funding: 'National Justice Reinvestment Program',
      first_nations_led: true
    }
  },
  {
    name: 'Yarrabah Justice Reinvestment',
    organizationName: 'Yarrabah Aboriginal Shire Council',
    description: 'Community-led justice reinvestment initiative',
    city: 'Yarrabah',
    state: 'QLD',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Justice Reinvestment',
      jurisdiction: 'QLD',
      first_nations_led: true
    }
  },
  {
    name: 'Doomadgee Justice Reinvestment',
    organizationName: 'Doomadgee Aboriginal Shire Council',
    description: 'First Nations-led justice reinvestment funded under NJRP',
    city: 'Doomadgee',
    state: 'QLD',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Justice Reinvestment',
      jurisdiction: 'QLD',
      funding: 'NJRP',
      first_nations_led: true
    }
  },
  {
    name: 'Minjerribah Justice Reinvestment (Quandamooka Region)',
    organizationName: 'MMEIC',
    description: 'Justice reinvestment project in Quandamooka Region',
    city: 'North Stradbroke Island',
    state: 'QLD',
    website: 'https://www.justicehub.com.au',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Justice Reinvestment',
      jurisdiction: 'QLD',
      first_nations_led: true,
      documentation: 'Minjerribah JR Briefing 2024'
    }
  },

  // National Justice Reinvestment
  {
    name: 'Maranguka Justice Reinvestment Project',
    organizationName: 'Bourke Tribal Council',
    description: 'First Aboriginal-led justice reinvestment model in Australia with proven outcomes (46% reduction in domestic violence)',
    city: 'Bourke',
    state: 'NSW',
    website: 'https://justreinvest.org.au',
    categories: ['cultural_support', 'family_support', 'advocacy', 'court_support'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Justice Reinvestment',
      jurisdiction: 'NSW',
      first_nations_led: true,
      flagship_program: true,
      outcomes: '46% reduction in domestic violence'
    }
  },

  // Diversion Programs
  {
    name: 'Youth Justice Conferencing NSW',
    organizationName: 'NSW Youth Justice',
    description: 'Restorative justice conferencing program',
    state: 'NSW',
    website: 'https://www.justice.nsw.gov.au',
    categories: ['court_support', 'advocacy', 'family_support'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Diversion & Bail',
      jurisdiction: 'NSW',
      approach: 'Restorative justice'
    }
  },
  {
    name: 'Koori Youth Court',
    organizationName: 'Victorian Children\'s Court',
    description: 'Culturally tailored diversion court for Indigenous youth',
    city: 'Melbourne',
    state: 'VIC',
    website: 'https://www.childrenscourt.vic.gov.au',
    categories: ['court_support', 'cultural_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Diversion Court',
      jurisdiction: 'VIC',
      culturally_specific: true
    }
  },
  {
    name: 'Bail Support Services - 54 Reasons',
    organizationName: 'Save the Children',
    description: 'NGO-delivered case management for youth on bail across TAS, QLD, WA',
    website: 'https://www.54reasons.org.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Bail Support',
      multi_jurisdiction: true,
      jurisdictions: ['TAS', 'QLD', 'WA']
    }
  },

  // VIC Community Support
  {
    name: 'Youth Justice Community Support Service',
    organizationName: 'Jesuit Social Services',
    description: 'NGO-managed case management post-custody',
    city: 'Melbourne',
    state: 'VIC',
    website: 'https://jss.org.au',
    categories: ['family_support', 'court_support', 'life_skills'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Community Support',
      jurisdiction: 'VIC',
      delivery: 'NGO-managed'
    }
  },

  // Cultural Programs
  {
    name: 'Target 120 Broome',
    organizationName: 'Aboriginal Community Controlled Health Organisation',
    description: 'ATSICCO-led diversion program with 70% success rate',
    city: 'Broome',
    state: 'WA',
    website: 'https://www.naccho.org.au',
    categories: ['cultural_support', 'health', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Cultural & On-Country Diversion',
      jurisdiction: 'WA',
      atsicco_led: true,
      success_rate: '70%'
    }
  },
  {
    name: 'Yiriman Project',
    organizationName: 'Kimberley Elders',
    description: 'Cultural camps reconnecting youth to Country',
    city: 'Kimberley',
    state: 'WA',
    website: 'https://www.indigenousjustice.gov.au',
    categories: ['cultural_support', 'life_skills', 'mental_health'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Cultural Program',
      jurisdiction: 'WA',
      approach: 'On-Country cultural camps'
    }
  },
  {
    name: 'Olabud Doogethu',
    organizationName: 'Olabud Doogethu Aboriginal Corporation',
    description: 'First JR site in WA; 63% reduction in burglaries',
    city: 'Halls Creek',
    state: 'WA',
    website: 'https://olabuddoogethu.org.au',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Justice Reinvestment',
      jurisdiction: 'WA',
      first_in_wa: true,
      outcomes: '63% reduction in burglaries'
    }
  },

  // SA Justice Reinvestment
  {
    name: 'Tiraapendi Wodli',
    organizationName: 'Australian Red Cross',
    description: 'Community-led justice reinvestment program',
    city: 'Port Adelaide',
    state: 'SA',
    website: 'https://www.redcross.org.au',
    categories: ['family_support', 'cultural_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Justice Reinvestment',
      jurisdiction: 'SA'
    }
  },

  // VIC Justice Reinvestment
  {
    name: 'Target Zero Melton',
    organizationName: 'WestJustice',
    description: 'Justice reinvestment model for multicultural communities',
    city: 'Melton',
    state: 'VIC',
    website: 'https://www.westjustice.org.au',
    categories: ['legal_aid', 'family_support', 'advocacy'],
    metadata: {
      source: 'Comprehensive Youth Justice Table',
      program_type: 'Justice Reinvestment',
      jurisdiction: 'VIC',
      focus: 'Multicultural communities'
    }
  },
];

async function main() {
  console.log('============================================================');
  console.log('📋 IMPORTING FROM COMPREHENSIVE YOUTH JUSTICE TABLE');
  console.log('============================================================\n');

  console.log(`Total programs to import: ${youthJusticePrograms.length}\n`);

  const result = await importServices(youthJusticePrograms);

  console.log('\n============================================================');
  console.log('📊 IMPORT SUMMARY');
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

  console.log('\n💡 Next: Check database to verify imports!');
}

main().catch(console.error);
