#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line && line.trim() && line[0] !== '#' && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🌏 ADDING COMPREHENSIVE NATIONAL PROGRAMS\n');

// MORE NSW PROGRAMS
const additionalNSW = [
  {
    name: 'Mission Australia Youth Services NSW',
    type: 'Wraparound Support',
    description: 'Statewide youth homelessness and support services across NSW. Crisis accommodation, transitional housing, case management, mental health support, and family reconnection. Multiple sites across Sydney and regional NSW.',
    target_cohort: ['12-25 years', 'Homeless youth', 'At-risk youth'],
    geography: ['NSW', 'Sydney', 'Regional NSW'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'Mission Australia - National NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.missionaustralia.com.au/services/children-youth-families',
    operating_organization: 'Mission Australia',
    metadata: {
      source: 'Mission Australia website',
      programs: ['Youth homelessness services', 'Transition to independent living', 'Family services'],
      locations: 'Multiple sites across NSW',
    },
  },
  {
    name: 'Salvation Army Oasis Youth Support Network',
    type: 'Wraparound Support',
    description: 'Youth homelessness and support services across Sydney and NSW. Crisis accommodation, residential programs, outreach, and case management for at-risk young people.',
    target_cohort: ['12-25 years', 'Homeless youth', 'NSW'],
    geography: ['NSW', 'Sydney', 'Regional NSW'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Salvation Army - Faith-based NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.salvationarmy.org.au/oasis/',
    operating_organization: 'Salvation Army',
    metadata: {
      source: 'Salvation Army website',
      programs: ['Crisis accommodation', 'Residential programs', 'Outreach services'],
    },
  },
  {
    name: 'Barnardos Australia Youth Programs NSW',
    type: 'Family Strengthening',
    description: 'Family support, foster care, and youth programs across NSW. Evidence-based early intervention and intensive family support to prevent youth justice involvement.',
    target_cohort: ['0-25 years', 'Families at-risk', 'NSW'],
    geography: ['NSW', 'Statewide'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'Barnardos Australia - NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.barnardos.org.au/',
    operating_organization: 'Barnardos Australia',
    metadata: {
      source: 'Barnardos website',
      programs: ['Family support', 'Foster care', 'Early intervention'],
    },
  },
  {
    name: 'Redfern Youth Connect (Aboriginal Corporation)',
    type: 'Community-Led',
    description: 'Aboriginal community-controlled youth service in Redfern/Sydney. Cultural programs, mentoring, education support, and diversion for Aboriginal young people. Community-led since 2004.',
    target_cohort: ['12-25 years', 'Aboriginal youth', 'Sydney'],
    geography: ['NSW', 'Sydney', 'Redfern', 'Inner Sydney'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Redfern Aboriginal Corporation - Community Controlled',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.redfernlegalcentre.org.au/',
    operating_organization: 'Redfern Aboriginal Corporation',
    metadata: {
      source: 'Redfern community organizations',
      programs: ['Cultural programs', 'Youth mentoring', 'Education support', 'Justice diversion'],
    },
  },
  {
    name: 'Circle Sentencing NSW (Aboriginal)',
    type: 'Diversion',
    description: 'Aboriginal community sentencing circle courts operating in NSW. Aboriginal Elders, community members, and Magistrate work together on culturally appropriate sentencing for Aboriginal offenders including youth.',
    target_cohort: ['Aboriginal offenders', 'Youth eligible', 'NSW'],
    geography: ['NSW', 'Regional NSW', 'Multiple locations'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Aboriginal community Elders - Circle Sentencing panels',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.judcom.nsw.gov.au/circle-sentencing/',
    operating_organization: 'NSW Courts + Aboriginal communities',
    metadata: {
      source: 'NSW Judicial Commission',
      established: '2002 (Nowra pilot)',
      model: 'Aboriginal Elders sit in sentencing circles with Magistrate',
      locations: 'Nowra, Dubbo, Walgett, Lismore, Armidale, Brewarrina, Bourke, Kempsey, Nambucca, others',
    },
  },
];

// MORE VIC PROGRAMS
const additionalVIC = [
  {
    name: 'Berry Street Youth Services',
    type: 'Wraparound Support',
    description: 'Comprehensive youth and family services across Victoria including housing, mental health, education support, and family violence services. Evidence-based practice supporting at-risk young people.',
    target_cohort: ['0-25 years', 'At-risk youth', 'Victoria'],
    geography: ['VIC', 'Melbourne', 'Regional VIC'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'Berry Street - NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.berrystreet.org.au/',
    operating_organization: 'Berry Street',
    metadata: {
      source: 'Berry Street website',
      programs: ['Youth housing', 'Mental health', 'Education support', 'Family violence services'],
      locations: 'Statewide Victoria',
    },
  },
  {
    name: 'Jesuit Social Services Youth Justice Programs VIC',
    type: 'Diversion',
    description: 'Youth justice programs across Victoria including restorative justice conferencing, diversion, mentoring, and support for young people in contact with justice system. Evidence-based, trauma-informed practice.',
    target_cohort: ['10-25 years', 'Youth in justice system', 'Victoria'],
    geography: ['VIC', 'Melbourne', 'Regional VIC'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'Jesuit Social Services - NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.jss.org.au/what-we-do/youth-justice/',
    operating_organization: 'Jesuit Social Services',
    metadata: {
      source: 'JSS website',
      programs: ['Youth justice conferencing', 'Diversion programs', 'Mentoring', 'Support services'],
      established: '40+ years in Victoria',
    },
  },
  {
    name: 'Victorian Aboriginal Child Care Agency (VACCA) Youth Programs',
    type: 'Cultural Connection',
    description: 'Aboriginal community-controlled organization providing culturally safe services for Aboriginal children, young people, and families in Victoria. Cultural programs, family support, and justice diversion.',
    target_cohort: ['Aboriginal youth', 'Aboriginal families', 'Victoria'],
    geography: ['VIC', 'Melbourne', 'Regional VIC'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'VACCA - Aboriginal Community Controlled Organisation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.vacca.org/',
    operating_organization: 'Victorian Aboriginal Child Care Agency',
    metadata: {
      source: 'VACCA website',
      established: '1977',
      programs: ['Cultural programs', 'Family support', 'Justice support', 'Child protection'],
    },
  },
  {
    name: 'Koorie Court (Children\'s Court) VIC',
    type: 'Diversion',
    description: 'Culturally appropriate court for Aboriginal young people in Victoria. Aboriginal Elders and Respected Persons advise on culturally appropriate sentencing and support options.',
    target_cohort: ['10-18 years', 'Aboriginal youth', 'Victoria'],
    geography: ['VIC', 'Melbourne', 'Shepparton', 'Mildura', 'Bairnsdale', 'Warrnambool'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Aboriginal Elders and Respected Persons - Koorie Court panels',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.courts.vic.gov.au/koorie-court',
    operating_organization: 'Courts of Victoria + Aboriginal communities',
    metadata: {
      source: 'Courts of Victoria website',
      established: '2002 (first Children\'s Koorie Court)',
      model: 'Aboriginal Elders advise Magistrate on culturally appropriate outcomes',
      locations: 'Melbourne, Shepparton, Mildura, Bairnsdale, Warrnambool',
    },
  },
  {
    name: 'Youth Support + Advocacy Service (YSAS)',
    type: 'Therapeutic',
    description: 'Youth alcohol and drug services across Victoria. Culturally safe, trauma-informed support for young people using substances, including counseling, residential rehabilitation, and family support.',
    target_cohort: ['12-21 years', 'Substance use issues', 'Victoria'],
    geography: ['VIC', 'Melbourne', 'Regional VIC'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'YSAS - Specialist youth AOD NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.ysas.org.au/',
    operating_organization: 'YSAS',
    metadata: {
      source: 'YSAS website',
      programs: ['AOD counseling', 'Residential rehab', 'Family support', 'Outreach'],
    },
  },
];

// MORE WA PROGRAMS
const additionalWA = [
  {
    name: 'Yaandina Family Centre (Aboriginal Corporation)',
    type: 'Family Strengthening',
    description: 'Aboriginal-led family and youth services in Perth. Cultural healing, family support, and youth programs delivered by Aboriginal-controlled organization.',
    target_cohort: ['Aboriginal families', 'Aboriginal youth', 'Perth'],
    geography: ['WA', 'Perth', 'Metropolitan Perth'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Yaandina - Aboriginal Community Controlled',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    metadata: {
      source: 'Perth Aboriginal community organizations',
      programs: ['Family support', 'Youth programs', 'Cultural healing'],
    },
  },
  {
    name: 'Ngnowar Aerwah Aboriginal Corporation Youth Services',
    type: 'Cultural Connection',
    description: 'Aboriginal-led organization providing cultural programs and support for Aboriginal young people in Perth. Focus on cultural identity, healing, and connection.',
    target_cohort: ['Aboriginal youth', 'Perth metro'],
    geography: ['WA', 'Perth'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Ngnowar Aerwah - Aboriginal Corporation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    metadata: {
      source: 'Perth Aboriginal organizations',
      programs: ['Cultural programs', 'Youth support', 'Healing services'],
    },
  },
  {
    name: 'Yamatji Youth Services',
    type: 'Community-Led',
    description: 'Regional Aboriginal youth services in Geraldton and Mid-West WA. Community-controlled organization delivering cultural programs, diversion, and support for Aboriginal young people.',
    target_cohort: ['Aboriginal youth', 'Geraldton', 'Mid-West WA'],
    geography: ['WA', 'Geraldton', 'Mid-West', 'Regional WA'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Yamatji organizations - Aboriginal Community Controlled',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    metadata: {
      source: 'Yamatji organizations',
      programs: ['Youth diversion', 'Cultural programs', 'Community support'],
    },
  },
  {
    name: 'Youth Futures WA',
    type: 'Wraparound Support',
    description: 'Youth homelessness and support services in Perth. Crisis accommodation, transitional housing, and intensive case management for at-risk young people.',
    target_cohort: ['12-25 years', 'Homeless youth', 'Perth'],
    geography: ['WA', 'Perth'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Youth Futures WA - NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.youthfutureswa.org.au/',
    operating_organization: 'Youth Futures WA',
    metadata: {
      source: 'Youth Futures WA website',
      programs: ['Crisis accommodation', 'Transitional housing', 'Case management'],
    },
  },
];

// TASMANIA PROGRAMS
const tasPrograms = [
  {
    name: 'Tasmanian Aboriginal Centre Youth Programs',
    type: 'Cultural Connection',
    description: 'Peak Aboriginal organization in Tasmania providing cultural programs, advocacy, and support for Aboriginal young people. Community-controlled, culturally grounded services.',
    target_cohort: ['Aboriginal youth', 'Tasmania'],
    geography: ['TAS', 'Statewide'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Tasmanian Aboriginal Centre - Aboriginal Community Controlled',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://tacinc.com.au/',
    operating_organization: 'Tasmanian Aboriginal Centre',
    metadata: {
      source: 'TAC website',
      established: '1973',
      programs: ['Cultural programs', 'Youth support', 'Advocacy', 'Justice support'],
    },
  },
  {
    name: 'Aboriginal and Torres Strait Islander Legal Service (TAS)',
    type: 'Diversion',
    description: 'Aboriginal legal service providing culturally appropriate representation and support for Aboriginal young people in Tasmania. Legal services, court support, and diversion programs.',
    target_cohort: ['Aboriginal youth', 'Tasmania'],
    geography: ['TAS', 'Hobart', 'Launceston', 'Regional TAS'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'ATSILS Tasmania - Aboriginal Community Controlled',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.atsils.org.au/',
    operating_organization: 'ATSILS Tasmania',
    metadata: {
      source: 'ATSILS website',
      programs: ['Legal services', 'Court support', 'Custody visiting', 'Diversion'],
    },
  },
  {
    name: 'Colony 47 Youth Services',
    type: 'Wraparound Support',
    description: 'Comprehensive youth services across Tasmania including housing, mental health, drug and alcohol support, and family services. Evidence-based programs supporting at-risk young people.',
    target_cohort: ['12-25 years', 'At-risk youth', 'Tasmania'],
    geography: ['TAS', 'Hobart', 'Launceston', 'North West', 'Regional TAS'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'Colony 47 - NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.colony47.com.au/',
    operating_organization: 'Colony 47',
    metadata: {
      source: 'Colony 47 website',
      programs: ['Youth housing', 'Mental health', 'AOD services', 'Family support'],
      established: '1973',
    },
  },
  {
    name: 'Anglicare Tasmania Youth Services',
    type: 'Wraparound Support',
    description: 'Youth and family services across Tasmania including housing, family support, and youth programs. Trauma-informed, strength-based practice.',
    target_cohort: ['12-25 years', 'At-risk youth', 'Tasmania'],
    geography: ['TAS', 'Statewide'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Anglicare Tasmania - Faith-based NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.anglicare-tas.org.au/',
    operating_organization: 'Anglicare Tasmania',
    metadata: {
      source: 'Anglicare TAS website',
      programs: ['Youth housing', 'Family support', 'Youth programs'],
    },
  },
  {
    name: 'Ashley Youth Detention Centre Community Alternatives',
    type: 'Diversion',
    description: 'Community-based alternatives to Ashley Youth Detention Centre. Following Royal Commission recommendations, development of community-based therapeutic residential care and diversion programs.',
    target_cohort: ['10-18 years', 'Youth in justice system', 'Tasmania'],
    geography: ['TAS', 'Statewide'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'TAS Department of Justice - Government reform program',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Pilot/seed',
    review_status: 'Published',
    metadata: {
      source: 'TAS Justice Department reports, Royal Commission recommendations',
      status: 'Reform implementation post-Royal Commission',
      model: 'Community-based therapeutic care replacing detention',
    },
  },
];

// SOUTH AUSTRALIA - ADDITIONAL
const additionalSA = [
  {
    name: 'Junction Australia Youth Services',
    type: 'Wraparound Support',
    description: 'Youth homelessness and support services in Adelaide. Crisis accommodation, transitional housing, and case management for at-risk young people.',
    target_cohort: ['12-25 years', 'Homeless youth', 'South Australia'],
    geography: ['SA', 'Adelaide', 'Regional SA'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Junction Australia - NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.junctionaustralia.org.au/',
    operating_organization: 'Junction Australia',
    metadata: {
      source: 'Junction Australia website',
      programs: ['Youth homelessness services', 'Transitional housing', 'Case management'],
    },
  },
  {
    name: 'Nunkuwarrin Yunti Youth and Family Services',
    type: 'Cultural Connection',
    description: 'Aboriginal community health service in Adelaide providing cultural programs and support for Aboriginal young people and families. Holistic, culturally grounded practice.',
    target_cohort: ['Aboriginal youth', 'Aboriginal families', 'Adelaide'],
    geography: ['SA', 'Adelaide'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Nunkuwarrin Yunti - Aboriginal Community Controlled Health Service',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.nunku.org.au/',
    operating_organization: 'Nunkuwarrin Yunti',
    metadata: {
      source: 'Nunkuwarrin Yunti website',
      programs: ['Cultural programs', 'Youth support', 'Family services', 'Health services'],
    },
  },
];

// ACT PROGRAMS
const actPrograms = [
  {
    name: 'Gugan Gulwan Youth Aboriginal Corporation',
    type: 'Cultural Connection',
    description: 'Aboriginal youth service in Canberra providing cultural programs, education support, and youth development for Aboriginal young people in ACT. Community-controlled organization.',
    target_cohort: ['Aboriginal youth', 'ACT', 'Canberra'],
    geography: ['ACT', 'Canberra'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Gugan Gulwan - Aboriginal Community Controlled',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.gugangulwan.org.au/',
    operating_organization: 'Gugan Gulwan Youth Aboriginal Corporation',
    metadata: {
      source: 'Gugan Gulwan website',
      established: '1993',
      programs: ['Cultural programs', 'Education support', 'Youth development', 'Family support'],
    },
  },
  {
    name: 'ACT Restorative Justice Unit',
    type: 'Diversion',
    description: 'Territory-wide restorative justice program bringing together young offenders, victims, and community. Evidence-based alternative to formal court proceedings.',
    target_cohort: ['10-17 years', 'Young offenders', 'ACT'],
    geography: ['ACT', 'Canberra'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'ACT Justice and Community Safety - Government program',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.communityservices.act.gov.au/rjunit',
    operating_organization: 'ACT Government',
    metadata: {
      source: 'ACT Government website',
      established: '2004 (Crimes (Restorative Justice) Act)',
      model: 'Restorative justice conferencing',
    },
  },
  {
    name: 'OzChild ACT Youth Programs',
    type: 'Wraparound Support',
    description: 'Youth and family services in ACT including housing support, family strengthening, and youth programs. Evidence-based, trauma-informed practice.',
    target_cohort: ['12-25 years', 'At-risk youth', 'ACT'],
    geography: ['ACT', 'Canberra'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'OzChild - NGO',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.ozchild.org.au/',
    operating_organization: 'OzChild',
    metadata: {
      source: 'OzChild website',
      programs: ['Youth support', 'Family services', 'Housing assistance'],
    },
  },
];

const allPrograms = [
  ...additionalNSW,
  ...additionalVIC,
  ...additionalWA,
  ...additionalSA,
  ...tasPrograms,
  ...actPrograms,
];

console.log(`Prepared ${allPrograms.length} programs:\n`);
console.log(`  NSW additional: ${additionalNSW.length}`);
console.log(`  VIC additional: ${additionalVIC.length}`);
console.log(`  WA additional: ${additionalWA.length}`);
console.log(`  SA additional: ${additionalSA.length}`);
console.log(`  TAS: ${tasPrograms.length}`);
console.log(`  ACT: ${actPrograms.length}`);
console.log('');

// Check for duplicates
const { data: existing } = await supabase
  .from('alma_interventions')
  .select('name');

const existingNames = new Set(existing?.map(p => p.name) || []);
const newPrograms = allPrograms.filter(p => !existingNames.has(p.name));
const duplicates = allPrograms.filter(p => existingNames.has(p.name));

console.log(`${newPrograms.length} new programs to add`);
console.log(`${duplicates.length} duplicates skipped\n`);

if (duplicates.length > 0) {
  console.log('Skipping duplicates:');
  duplicates.forEach(p => console.log(`  - ${p.name}`));
  console.log('');
}

// Insert programs
let inserted = 0;
let errors = 0;

for (const program of newPrograms) {
  const { data, error } = await supabase
    .from('alma_interventions')
    .insert(program)
    .select('id, name');

  if (error) {
    console.error(`❌ ${program.name}:`, error.message);
    errors++;
  } else {
    console.log(`✅ ${program.name}`);
    inserted++;
  }
}

console.log(`\n📊 SUMMARY\n`);
console.log(`Successfully inserted: ${inserted}`);
console.log(`Errors: ${errors}`);

// Get final counts
const { count: totalCount } = await supabase
  .from('alma_interventions')
  .select('*', { count: 'exact', head: true });

console.log(`\n🎉 Total interventions in database: ${totalCount}\n`);

// State breakdown
const states = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'];
console.log('State Coverage:');

for (const state of states) {
  const { count } = await supabase
    .from('alma_interventions')
    .select('*', { count: 'exact', head: true })
    .contains('geography', [state]);

  const status = count > 20 ? '✅' : count > 10 ? '⚠️' : '❌';
  console.log(`  ${status} ${state}: ${count} programs`);
}

// Aboriginal programs breakdown
const { count: aboriginalCount } = await supabase
  .from('alma_interventions')
  .select('*', { count: 'exact', head: true })
  .eq('consent_level', 'Community Controlled');

console.log(`\n📊 Aboriginal-led Programs (Community Controlled): ${aboriginalCount}\n`);
