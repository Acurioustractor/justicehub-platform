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

console.log('\n🚀 Adding Expanded NT Programs to Database\n');

// NEW ABORIGINAL-LED PROGRAMS (beyond what we have)
const newAboriginalPrograms = [
  {
    name: 'Central Australian Youth Link-Up Service (CAYLUS)',
    type: 'Community-Led',
    description: 'Community-led crime prevention, alcohol and drug counselling, and youth diversion services. The Mampu-Maninjaku program provides holistic support combining substance misuse prevention with community-based diversion strategies.',
    target_cohort: ['10-25 years', 'At-risk youth', 'Substance misuse'],
    geography: ['NT', 'Central Australia', 'Alice Springs'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Tangentyere Council Aboriginal Corporation - Community partnership model',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://caylus.org.au/',
    metadata: {
      source: 'CAYLUS website, Justice Reinvestment Initiative 2024',
      programs: ['Mampu-Maninjaku crime prevention', 'Substance misuse counselling', 'Community diversion'],
      established: 'Justice Reinvestment initiative (2024)',
      similarity_to_oochiumpa: 'Community-led, holistic approach, substance misuse + diversion integration',
    },
  },
  {
    name: 'Tangentyere Council Youth Programs',
    type: 'Community-Led',
    description: 'Comprehensive suite of Aboriginal-led youth programs including Youth Centre (evening/weekend activities, mentoring, employment), Youth Engagement Program, ASYASS early intervention casework, Youth Activity Service for town camp youth, Youth Patrol (night patrol and transport to safety), and substance misuse support.',
    target_cohort: ['Youth', 'Town camp communities', 'Alice Springs'],
    geography: ['NT', 'Alice Springs', 'Town camps'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Tangentyere Council Aboriginal Corporation - Peak body for Alice Springs town camps',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.tangentyere.org.au/youth',
    metadata: {
      source: 'Tangentyere Council website',
      programs: ['Youth Centre', 'Youth Engagement', 'ASYASS', 'Youth Activity Service', 'Youth Patrol', 'Substance support'],
      authority: 'Town camp representative organization since 1979',
    },
  },
  {
    name: 'Mparntwe Peacemaking Project',
    type: 'Community-Led',
    description: 'Community-led conflict resolution and crime prevention program run by Lhere Artepe Aboriginal Corporation (Native Title Holders for Alice Springs). Includes Community Safety Patrol and Assertive Outreach Programs. Part of Justice Reinvestment consortium with Desert Knowledge and Anglicare NT.',
    target_cohort: ['Community members', 'Youth at-risk', 'Alice Springs'],
    geography: ['NT', 'Alice Springs', 'Mparntwe'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Lhere Artepe Aboriginal Corporation - Native Title Holders, Arrernte Traditional Owners',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.lhereartepe.org.au/',
    metadata: {
      source: 'Lhere Artepe website, Justice Reinvestment documentation',
      programs: ['Peacemaking', 'Safety Patrol', 'Assertive Outreach'],
      authority: 'Traditional Owners, Justice Reinvestment partner',
    },
  },
  {
    name: 'Tennant Creek Mob Youth Diversion Services',
    type: 'Diversion',
    description: 'Aboriginal-led youth diversion services including life skills, cultural activities, social and recreational programs. Runs Youth Camps (cultural camps with elders) and Annual Youth Leadership Camp. Funded by Department of Corrections as community-based alternative to detention.',
    target_cohort: ['Youth', 'Tennant Creek', 'Barkly region'],
    geography: ['NT', 'Tennant Creek', 'Ali Curung', 'Elliott', 'Barkly'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Tennant Creek Mob Aboriginal Corporation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.tennantcreekmobaboriginalcorporation.au/youth-diversion',
    metadata: {
      source: 'Tennant Creek Mob website, NT Government Youth Diversion Providers',
      programs: ['Youth Diversion', 'Cultural Camps', 'Leadership Camp'],
      government_funded: 'Department of Corrections contract',
    },
  },
  {
    name: 'GEBIE GANG Program (Groote Eylandt)',
    type: 'Community-Led',
    description: 'Highly successful Aboriginal-led youth engagement program on Groote Eylandt. Achieved 95% reduction in youth crime (346 offences in 2018-19 to 17 in 2021-22). Zero youth offenders in Don Dale as of January 2024. Includes Healing Centre (cultural healing, group therapy, drug/alcohol services) and Bush Rehabilitation Camp (traditional culture immersion, work discipline). Established under Local Decision-Making Agreement 2018.',
    target_cohort: ['10-17 years', 'Groote Eylandt youth', 'Barkly region'],
    geography: ['NT', 'Groote Eylandt', 'Barkly'],
    evidence_level: 'Proven (RCT/quasi-experimental, replicated)',
    cultural_authority: 'Anindilyakwa Land Council / Groote Eylandt Community Justice Group',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://anindilyakwa.com.au/community-justice-group-formed/',
    metadata: {
      source: 'Anindilyakwa Land Council, NT Government reports',
      outcomes: '95% reduction in youth crime (346 to 17 offences), Zero youth in Don Dale (Jan 2024)',
      programs: ['GEBIE GANG', 'Community Justice Group', 'Healing Centre', 'Bush Rehabilitation Camp'],
      government_investment: '$13M capital + $11M operational (2018-present)',
      established: '2018 Local Decision-Making Agreement',
      comparison_to_oochiumpa: 'SIMILAR SUCCESS RATE - 95% crime reduction vs Oochiumpa 95% offending reduction',
    },
  },
  {
    name: 'Gap Youth & Community Centre Programs',
    type: 'Prevention',
    description: 'Long-established Aboriginal-led youth centre (since 1977) providing After-Hours Youth Program (AHYP) 7 days/week for ages 10-17, vacation care, after-school care, and social/recreational activities. Over 40 years of continuous community service in Alice Springs.',
    target_cohort: ['10-17 years', 'Alice Springs youth'],
    geography: ['NT', 'Alice Springs', 'The Gap'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Gap Youth & Community Centre Aboriginal Corporation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.gyc.org.au/',
    metadata: {
      source: 'Gap Youth Centre website',
      established: '1977 (40+ years)',
      programs: ['After-Hours Youth Program (AHYP)', 'Vacation care', 'After-school care'],
    },
  },
  {
    name: 'Urapuntja Health Service Youth Program',
    type: 'Prevention',
    description: 'Youth health and wellbeing program delivered by Aboriginal Community Controlled Health Service. Operates in Utopia community and homeland communities. Part of comprehensive ACCHS model addressing holistic youth health.',
    target_cohort: ['Youth', 'Utopia community', 'Homeland communities'],
    geography: ['NT', 'Utopia', 'Remote communities'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Urapuntja Health Service Aboriginal Corporation (ACCHS since 1977)',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.urapuntja.org.au/youth',
    metadata: {
      source: 'Urapuntja Health Service website',
      established: '1977 as ACCHS',
      service_model: 'Comprehensive primary health care with youth focus',
    },
  },
];

// NEW GOVERNMENT PROGRAMS
const newGovernmentPrograms = [
  {
    name: 'Back on Track Program',
    type: 'Diversion',
    description: 'Community-based alternative sentencing and diversion program. 19 providers across 60 NT communities. Diverted 591 youth in 2023 with 60% non-reoffending rate. Recently scaled back in October 2024 budget cuts.',
    target_cohort: ['10-17 years', 'Court-referred youth', 'Community-based sentencing'],
    geography: ['NT', 'Statewide', '60 communities'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'NT Department of Territory Families - Government program with community partnerships',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'At-risk',
    review_status: 'Published',
    website: 'https://nt.gov.au/law/youth-justice/youth-diversion-programs',
    metadata: {
      source: 'NT Government Youth Justice website, AIHW reports',
      participants_2023: '591 youth diverted',
      outcomes: '60% non-reoffending rate',
      providers: '19 providers across 60 communities',
      status_change: 'Scaled back October 2024',
    },
  },
  {
    name: 'Youth Justice Conferencing (Expanded)',
    type: 'Diversion',
    description: 'Restorative justice and pre-sentence conferencing. Operated by Jesuit Social Services (Darwin, Palmerston, Katherine, Alice Springs) and Community Justice Centre (expanding to Tennant Creek and remote communities via Local Decision Making). 60% non-reoffending rate. Includes Victim Support from Victims of Crime NT.',
    target_cohort: ['10-17 years', 'Youth who have pleaded guilty', 'Victim-offender restoration'],
    geography: ['NT', 'Darwin', 'Palmerston', 'Katherine', 'Alice Springs', 'Tennant Creek', 'Remote communities'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'Jesuit Social Services + Community Justice Centre - Government-funded partnership',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.youthjustice.nt.gov.au/initiatives/youth-justice-conferencing-and-victim-support',
    metadata: {
      source: 'NT Government Youth Justice, Jesuit Social Services',
      outcomes: '60% non-reoffending rate',
      expansion: 'Phase 1 and Phase 2 implementation (2024)',
      providers: 'Jesuit Social Services, Community Justice Centre',
      victim_support: 'Victims of Crime NT partnership',
    },
  },
  {
    name: 'Strong Ways Program',
    type: 'Therapeutic',
    description: 'Trauma-informed therapeutic support for youth at-risk or engaged in youth justice system. Delivered by Australian Childhood Foundation in Darwin, Katherine, Tennant Creek, and Nhulunbuy. Specialist counseling and trauma recovery services.',
    target_cohort: ['Youth at-risk', 'Youth in justice system', 'Trauma recovery'],
    geography: ['NT', 'Darwin', 'Katherine', 'Tennant Creek', 'Nhulunbuy'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'Australian Childhood Foundation - NGO delivering government-funded services',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.childhood.org.au/our-services/',
    metadata: {
      source: 'Australian Childhood Foundation website',
      service_model: 'Trauma-informed care',
      locations: '4 NT centers',
    },
  },
  {
    name: 'Intensive Youth Accommodation Support Service (I/YASS)',
    type: 'Wraparound Support',
    description: 'Supported transitional accommodation and case management for homeless youth ages 15-21. Operated by Anglicare NT and partners in Katherine, Darwin, and Palmerston regions. Addresses housing instability as pathway to justice involvement.',
    target_cohort: ['15-21 years', 'Homeless youth', 'Transitional housing'],
    geography: ['NT', 'Katherine', 'Darwin', 'Palmerston'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Anglicare NT - NGO delivering government-funded services',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.anglicare-nt.org.au/services/',
    metadata: {
      source: 'Anglicare NT website',
      service_model: 'Housing + case management',
      age_range: '15-21 years',
    },
  },
  {
    name: 'Youth Camps and On-Country Programs',
    type: 'Cultural Connection',
    description: 'Government-funded cultural camps and on-country programs delivered across NT communities. Early intervention and cultural connection focus. Delivered in partnership with Aboriginal organizations and land councils.',
    target_cohort: ['Youth', 'Cultural connection', 'Remote communities'],
    geography: ['NT', 'Multiple communities', 'On-country'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'NT Government - Partnership model with Aboriginal land councils',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    metadata: {
      source: 'NT Government Youth Justice reports',
      delivery_model: 'Partnership with Aboriginal organizations',
    },
  },
  {
    name: 'Central Australia Justice Reinvestment Initiative',
    type: 'Justice Reinvestment',
    description: '$10M over 4 years (2023-24 Budget) for community-led justice reinvestment. Consortium led by Lhere Artepe, Desert Knowledge, and Anglicare NT. Focus on holistic, Aboriginal-led approaches to reducing youth incarceration in Central Australia.',
    target_cohort: ['Central Australia', 'Youth at-risk', 'Community-wide prevention'],
    geography: ['NT', 'Central Australia', 'Alice Springs region'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Lhere Artepe Aboriginal Corporation + Desert Knowledge + Anglicare NT consortium',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.ag.gov.au/legal-system/justice-reinvestment',
    metadata: {
      source: 'Attorney-General Department, NT Budget 2023-24',
      funding: '$10M over 4 years',
      consortium: 'Lhere Artepe (lead), Desert Knowledge, Anglicare NT',
      focus: 'Aboriginal-led, holistic approach',
    },
  },
];

console.log('Aboriginal-led programs to add:', newAboriginalPrograms.length);
console.log('Government programs to add:', newGovernmentPrograms.length);
console.log('Total new programs:', newAboriginalPrograms.length + newGovernmentPrograms.length);

let successCount = 0;
let errorCount = 0;

// Insert Aboriginal-led programs
console.log('\n📝 Inserting Aboriginal-led programs...\n');
for (const program of newAboriginalPrograms) {
  const { data, error } = await supabase
    .from('alma_interventions')
    .insert(program)
    .select();

  if (error) {
    console.error(`❌ Error inserting ${program.name}:`, error.message);
    errorCount++;
  } else {
    console.log(`✅ Inserted: ${program.name}`);
    successCount++;
  }
}

// Insert government programs
console.log('\n📝 Inserting government programs...\n');
for (const program of newGovernmentPrograms) {
  const { data, error } = await supabase
    .from('alma_interventions')
    .insert(program)
    .select();

  if (error) {
    console.error(`❌ Error inserting ${program.name}:`, error.message);
    errorCount++;
  } else {
    console.log(`✅ Inserted: ${program.name}`);
    successCount++;
  }
}

console.log('\n✨ Summary:');
console.log(`  Success: ${successCount} programs`);
console.log(`  Errors: ${errorCount} programs`);
console.log(`  Total attempted: ${newAboriginalPrograms.length + newGovernmentPrograms.length}\n`);
