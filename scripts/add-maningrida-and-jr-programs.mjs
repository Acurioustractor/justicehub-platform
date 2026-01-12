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

console.log('\n🚀 Adding Maningrida and Additional Justice Reinvestment Programs\n');

const additionalPrograms = [
  {
    name: 'Maningrida Justice Reinvestment Program',
    type: 'Justice Reinvestment',
    description: 'Aboriginal-led Justice Reinvestment initiative delivered by Nja-marleya Cultural Leaders and Justice Group Ltd. Includes Community Court implementation (working with judges and lawyers), Murnun Men\'s Shed, Women\'s Cultural Hub (partnership with Mala\'la Health Service), Lúrra Festival youth engagement, and cultural preservation programs. Focus on reducing youth interaction with criminal justice system through cultural connection and community-led approaches.',
    target_cohort: ['Youth', 'Young people', 'Maningrida community', '32 homelands'],
    geography: ['NT', 'Maningrida', 'West Arnhem Land', 'Arnhem Land'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Nja-marleya Cultural Leaders and Justice Group Ltd - Aboriginal-led community organization',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.njamarleya.org.au/',
    metadata: {
      source: 'Attorney-General Department National Justice Reinvestment Program, Nja-marleya website',
      funding: 'Part of $69M National Justice Reinvestment Program (2022-26), $20M/year ongoing from 2026-27',
      approved: 'February 2024 (first cohort of 26 funded initiatives)',
      programs: ['Community Court', 'Murnun Men\'s Shed', 'Women\'s Cultural Hub', 'Lúrra Festival', 'Cultural preservation'],
      partnerships: 'Mala\'la Health Service Aboriginal Corporation',
      status: 'Early implementation (2024)',
    },
  },
  {
    name: 'Ngurratjuta/Pmara Ntjarra Justice Reinvestment (Papunya, Mt Liebig, Haasts Bluff)',
    type: 'Justice Reinvestment',
    description: 'Aboriginal-led Justice Reinvestment program covering three Central Australian communities: Papunya, Mount Liebig, and Haasts Bluff. Includes Child and Family Centre in Papunya with outreach services, coordination and referral for young people, and 10-year plan covering training, housing, community safety, family services, and education. Part of $10M Central Australia Justice Reinvestment Program.',
    target_cohort: ['Youth', 'Families', 'Central Australia remote communities'],
    geography: ['NT', 'Central Australia', 'Papunya', 'Mount Liebig', 'Haasts Bluff'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Ngurratjuta/Pmara Ntjarra Aboriginal Corporation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://ngur.com.au/',
    metadata: {
      source: 'Attorney-General Department, Ngurratjuta/Pmara Ntjarra Aboriginal Corporation',
      funding: 'Part of $10M Central Australia Justice Reinvestment Program',
      communities: '3 communities (Papunya, Mt Liebig, Haasts Bluff)',
      programs: ['Child and Family Centre', 'Coordination and referral', '10-year holistic plan'],
      plan_areas: ['Training', 'Housing', 'Community safety', 'Family services', 'Education'],
    },
  },
  {
    name: 'East Arnhem Land Youth Model (Guŋga\'yunga Djamarrkuliny)',
    type: 'Justice Reinvestment',
    description: 'Pioneering Local Decision Making initiative delivered through Arnhem Land Progress Aboriginal Corporation (ALPA). Co-funded $7.75M extension to June 2027. Covers Nhulunbuy, Galiwinku, Gunyangara, Ramingining, Milingimbi, Gapuwiyak, and Yirrkala communities.',
    target_cohort: ['Youth', 'East Arnhem Land communities'],
    geography: ['NT', 'East Arnhem Land', 'Nhulunbuy', 'Galiwinku', 'Gunyangara', 'Ramingining', 'Milingimbi', 'Gapuwiyak', 'Yirrkala'],
    evidence_level: 'Promising (community-endorsed, emerging evidence)',
    cultural_authority: 'Arnhem Land Progress Aboriginal Corporation (ALPA)',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://ldm.nt.gov.au/news/east-arnhem-land-youth-model-partnership-agreement',
    metadata: {
      source: 'NT Government Local Decision Making, ALPA',
      funding: '$7.75M co-funded extension to June 2027',
      model: 'Local Decision Making initiative',
      communities: '7 communities covered',
      status: 'Pioneering program',
    },
  },
  {
    name: 'Bawinanga Aboriginal Corporation Community Services',
    type: 'Community-Led',
    description: 'Long-established Aboriginal Community Controlled Organisation providing community patrol and support services in Maningrida and West Arnhem region. Works alongside the Justice Reinvestment program led by Nja-marleya.',
    target_cohort: ['Community members', 'Youth', 'Maningrida region'],
    geography: ['NT', 'Maningrida', 'West Arnhem Land'],
    evidence_level: 'Indigenous-led (culturally grounded, community authority)',
    cultural_authority: 'Bawinanga Aboriginal Corporation',
    consent_level: 'Community Controlled',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://www.bawinanga.com/',
    metadata: {
      source: 'Bawinanga Aboriginal Corporation website',
      services: ['Community patrol', 'Community support services'],
      relationship: 'Works alongside Nja-marleya Justice Reinvestment program',
    },
  },
  {
    name: 'Jesuit Social Services NT Youth Justice Programs',
    type: 'Diversion',
    description: 'Long-running youth justice programs across NT since 2008. Operates in Alice Springs, Darwin, Katherine, Palmerston, Santa Teresa, Tennant Creek, and Wadeye. Coordinates Justice Reinvestment initiatives and delivers Youth Justice Conferencing. Works in partnership with Thamarrurr Regional Aboriginal Authority Corporation and Kalano Community Association.',
    target_cohort: ['10-17 years', 'Youth justice system', 'Multiple NT communities'],
    geography: ['NT', 'Alice Springs', 'Darwin', 'Katherine', 'Palmerston', 'Santa Teresa', 'Tennant Creek', 'Wadeye'],
    evidence_level: 'Effective (strong evaluation, positive outcomes)',
    cultural_authority: 'Jesuit Social Services - NGO with Aboriginal community partnerships',
    consent_level: 'Public Knowledge Commons',
    harm_risk_level: 'Low',
    current_funding: 'Established',
    review_status: 'Published',
    website: 'https://jss.org.au/programs/northern-territory-youth-justice-programs/',
    metadata: {
      source: 'Jesuit Social Services website',
      established: '2008 in NT',
      locations: '7 NT sites',
      programs: ['Youth Justice Conferencing', 'Justice Reinvestment coordination', 'Partnership programs'],
      partnerships: ['Thamarrurr Regional Aboriginal Authority', 'Kalano Community Association', 'Yugul Mangi Development Aboriginal Corporation'],
    },
  },
];

console.log('Programs to add:', additionalPrograms.length);

let successCount = 0;
let errorCount = 0;

for (const program of additionalPrograms) {
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
console.log(`  Total attempted: ${additionalPrograms.length}\n`);
