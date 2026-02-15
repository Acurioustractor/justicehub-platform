#!/usr/bin/env node
/**
 * Import Queensland Youth Justice Programs and Regional Offices
 *
 * Sources:
 * - https://www.youthjustice.qld.gov.au/contact-us/regional-offices
 * - https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all
 */

import { importServices, ServiceInput } from '../lib/service-importer';

const qldYouthJusticeServices: ServiceInput[] = [
  // Regional Offices
  {
    name: 'Youth Justice Far North Queensland Region',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Regional youth justice office providing supervision, support and case management services for young people in the youth justice system',
    address: 'Level 10, 15 Lake Street',
    city: 'Cairns',
    state: 'QLD',
    postcode: '4870',
    phone: '(07) 4255 7585',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'QLD Youth Justice Regional Offices',
      region: 'Far North Queensland',
      office_type: 'Regional Office'
    }
  },
  {
    name: 'Youth Justice North Queensland Region',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Regional youth justice office providing supervision, support and case management services for young people in the youth justice system',
    address: 'Level 8, 445 Flinders Street',
    city: 'Townsville',
    state: 'QLD',
    postcode: '4810',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'QLD Youth Justice Regional Offices',
      region: 'North Queensland',
      office_type: 'Regional Office'
    }
  },
  {
    name: 'Youth Justice Sunshine Coast and Central Region',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Regional youth justice office providing supervision, support and case management services for young people in the youth justice system',
    address: 'Level 3, 209 Bolsover Street',
    city: 'Rockhampton',
    state: 'QLD',
    postcode: '4700',
    phone: '(07) 4848 4310',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'QLD Youth Justice Regional Offices',
      region: 'Sunshine Coast and Central',
      office_type: 'Regional Office'
    }
  },
  {
    name: 'Youth Justice Brisbane and Moreton Bay Region',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Regional youth justice office providing supervision, support and case management services for young people in the youth justice system',
    address: 'Level 1, 55 Russell Street',
    city: 'South Brisbane',
    state: 'QLD',
    postcode: '4101',
    phone: '(07) 3097 0300',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'QLD Youth Justice Regional Offices',
      region: 'Brisbane and Moreton Bay',
      office_type: 'Regional Office'
    }
  },
  {
    name: 'Youth Justice South East Region',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Regional youth justice office providing supervision, support and case management services for young people in the youth justice system',
    address: '100 George Street',
    city: 'Beenleigh',
    state: 'QLD',
    postcode: '4207',
    phone: '(07) 3094 7003',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'QLD Youth Justice Regional Offices',
      region: 'South East',
      office_type: 'Regional Office'
    }
  },
  {
    name: 'Youth Justice South West Region',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Regional youth justice office providing supervision, support and case management services for young people in the youth justice system',
    address: 'Level 1, 38 Limestone Street',
    city: 'Ipswich',
    state: 'QLD',
    postcode: '4305',
    phone: '(07) 3432 1905',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'QLD Youth Justice Regional Offices',
      region: 'South West',
      office_type: 'Regional Office'
    }
  },

  // Programs
  {
    name: 'Emotional Regulation and Impulse Control (ERIC)',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Program encouraging healthy social and emotional development, helping young people identify and manage emotions to improve decision-making and behavior',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['mental_health', 'life_skills'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Therapeutic Program',
      target_group: 'Young offenders'
    }
  },
  {
    name: 'Changing Habits and Reaching Targets (CHART)',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Behavior change program helping reduce reoffending by supporting young people to reflect on offending thinking and develop positive lifestyle changes',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['life_skills', 'court_support'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Behavior Change Program',
      target_group: 'Young offenders'
    }
  },
  {
    name: 'Re-thinking Our Attitude to Driving (ROAD)',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Targets young people with motor vehicle offences, exploring motivations behind unsafe driving behaviors and developing victim empathy',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['life_skills', 'court_support'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Offence-Specific Program',
      focus: 'Motor vehicle offences'
    }
  },
  {
    name: 'Aggression Replacement Training (ART)',
    organizationName: 'Queensland Department of Youth Justice',
    description: '10-week intensive group program helping young people manage anger and aggression, focusing on pro-social skills and moral reasoning',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['mental_health', 'life_skills'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Therapeutic Program',
      duration: '10 weeks',
      delivery: 'Group program'
    }
  },
  {
    name: '72-Hour Transition Support',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Intensive support for high-risk young offenders after release from detention, supporting both young people and families to reduce reoffending',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'housing'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Transition Support',
      target_group: 'High-risk youth post-release'
    }
  },
  {
    name: 'Aboriginal and Torres Strait Islander Family Wellbeing Services',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Culturally appropriate assistance for First Nations families to prevent offending behavior and connect with specialized services',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['cultural_support', 'family_support', 'advocacy'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Cultural Support',
      culturally_specific: true,
      target_group: 'Aboriginal and Torres Strait Islander families'
    }
  },
  {
    name: 'Alternative Diversion Programs (ADPs)',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Tailored programs when restorative justice conferences cannot be held, designed to address individual offending behaviors and repair harm',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'advocacy', 'life_skills'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Diversion Program',
      approach: 'Individualized'
    }
  },
  {
    name: 'Bail Support Program',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Helps at-risk youth comply with bail conditions, provides basic needs and connects to support services across multiple Queensland locations',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'housing'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Bail Support',
      availability: 'Multiple locations statewide'
    }
  },
  {
    name: 'Black Chicks Talking',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Cultural program for Aboriginal and Torres Strait Islander young women supporting cultural connections and identity through storytelling and yarning circles',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['cultural_support', 'mental_health', 'life_skills'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Cultural Program',
      culturally_specific: true,
      target_group: 'Aboriginal and Torres Strait Islander young women'
    }
  },
  {
    name: 'Community Youth Response and Diversion (CYRaD)',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Early intervention program connecting at-risk young people and families with community support services to prevent youth justice involvement',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['family_support', 'advocacy', 'life_skills'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Early Intervention',
      approach: 'Diversion from justice system'
    }
  },
  {
    name: 'Intensive Bail Initiative (IBI)',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Works with young people on bail, exiting detention or at risk of reoffending, supporting offenders aged 10-17 years and their families',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'family_support', 'housing'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Intensive Support',
      age_range: '10-17 years'
    }
  },
  {
    name: 'Restorative Justice Conferencing',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Brings together young offenders, victims, families and community members to discuss the impact of offending and develop agreements to repair harm',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['court_support', 'advocacy', 'family_support'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Restorative Justice',
      approach: 'Conference-based'
    }
  },
  {
    name: 'Victim Connect Queensland',
    organizationName: 'Queensland Department of Youth Justice',
    description: 'Provides support and information for victims of youth offending, connecting them with appropriate services and support',
    city: 'Queensland',
    state: 'QLD',
    website: 'https://www.youthjustice.qld.gov.au',
    categories: ['advocacy', 'family_support'],
    metadata: {
      source: 'QLD Youth Justice Programs',
      program_type: 'Victim Support',
      target_group: 'Victims of youth crime'
    }
  },
];

async function main() {
  console.log('============================================================');
  console.log('📋 IMPORTING QLD YOUTH JUSTICE PROGRAMS & OFFICES');
  console.log('============================================================\n');

  console.log(`Total services to import: ${qldYouthJusticeServices.length}\n`);

  const result = await importServices(qldYouthJusticeServices);

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

  console.log('\n💡 These are official QLD Youth Justice programs and regional offices!');
  console.log('   All have complete addresses and phone numbers where available.');
}

main().catch(console.error);
