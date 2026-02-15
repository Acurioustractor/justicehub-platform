#!/usr/bin/env node
/**
 * Seed Historical Inquiries
 *
 * Populates the historical_inquiries table with real Australian
 * royal commissions and parliamentary inquiries related to youth justice.
 *
 * Usage: node scripts/data-enrichment/seed-historical-inquiries.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const historicalInquiries = [
  // Royal Commissions
  {
    title: 'Royal Commission into the Protection and Detention of Children in the Northern Territory',
    inquiry_type: 'royal_commission',
    jurisdiction: 'NT',
    year_started: 2016,
    year_published: 2017,
    summary: 'Established following the broadcast of footage showing mistreatment of young people at the Don Dale Youth Detention Centre. Found systemic failures in the child protection and youth detention systems and made 227 recommendations for reform.',
    recommendations_count: 227,
    implementation_status: 'partial',
    source_url: 'https://www.royalcommission.gov.au/child-detention',
    key_findings: [
      'Systemic failures in child protection and youth justice systems',
      'Overuse of isolation and restraint',
      'Disproportionate representation of Aboriginal and Torres Strait Islander children',
      'Lack of appropriate facilities and trained staff'
    ]
  },
  {
    title: 'Royal Commission into Institutional Responses to Child Sexual Abuse',
    inquiry_type: 'royal_commission',
    jurisdiction: 'FED',
    year_started: 2013,
    year_published: 2017,
    summary: 'Examined institutional responses to child sexual abuse across Australia. Made extensive recommendations for child-safe standards, redress schemes, and criminal justice reforms that impact youth justice settings.',
    recommendations_count: 409,
    implementation_status: 'partial',
    source_url: 'https://www.childabuseroyalcommission.gov.au/',
    key_findings: [
      'Widespread institutional failures to protect children',
      'Need for child-safe standards',
      'Recommendations for redress and support services',
      'Criminal justice reforms for child abuse'
    ]
  },
  {
    title: 'Royal Commission into Aboriginal Deaths in Custody',
    inquiry_type: 'royal_commission',
    jurisdiction: 'FED',
    year_started: 1987,
    year_published: 1991,
    summary: 'Investigated 99 deaths of Aboriginal people in custody. Made 339 recommendations addressing underlying issues of disadvantage and overrepresentation. Many recommendations remain unimplemented decades later.',
    recommendations_count: 339,
    implementation_status: 'partial',
    source_url: 'https://www.naa.gov.au/explore-collection/rcdic',
    key_findings: [
      'Aboriginal deaths in custody disproportionately high',
      'Underlying social disadvantage is a key factor',
      'Need for self-determination and community control',
      'Police and corrections reform required'
    ]
  },

  // Queensland
  {
    title: 'Youth Justice Reform: Queensland Review (Atkinson Report)',
    inquiry_type: 'government_review',
    jurisdiction: 'QLD',
    year_started: 2018,
    year_published: 2018,
    summary: 'Independent review of Queensland youth justice system led by Bob Atkinson. Focused on early intervention, diversion, and reducing reoffending. Made 77 recommendations for reform.',
    recommendations_count: 77,
    implementation_status: 'partial',
    source_url: 'https://www.cyjma.qld.gov.au/youth-justice/reform',
    key_findings: [
      'Need for earlier intervention',
      'Importance of family and community involvement',
      'Reducing detention for minor offences',
      'Better transition support from detention'
    ]
  },
  {
    title: 'Queensland Productivity Commission Inquiry into Imprisonment and Recidivism',
    inquiry_type: 'government_review',
    jurisdiction: 'QLD',
    year_started: 2019,
    year_published: 2020,
    summary: 'Examined factors contributing to imprisonment and recidivism in Queensland. Made recommendations for justice reinvestment, diversion programs, and addressing drivers of incarceration.',
    recommendations_count: 41,
    implementation_status: 'partial',
    source_url: 'https://qpc.blob.core.windows.net/wordpress/2020/02/FINAL-REPORT-Imprisonment.pdf',
    key_findings: [
      'High costs of imprisonment with limited rehabilitation outcomes',
      'Need for justice reinvestment approach',
      'Importance of addressing housing, employment, and health needs',
      'Better data collection and evaluation required'
    ]
  },

  // Victoria
  {
    title: 'Our Youth, Our Way: Inquiry into the Overrepresentation of Aboriginal Children and Young People in the Victorian Youth Justice System',
    inquiry_type: 'parliamentary',
    jurisdiction: 'VIC',
    year_started: 2020,
    year_published: 2021,
    summary: 'Comprehensive inquiry into why Aboriginal children and young people are significantly overrepresented in youth justice. Made 42 recommendations focusing on self-determination, cultural support, and system reform.',
    recommendations_count: 42,
    implementation_status: 'partial',
    source_url: 'https://ccyp.vic.gov.au/our-youth-our-way/',
    key_findings: [
      'Aboriginal children 17 times more likely to be in detention',
      'Systemic racism in youth justice system',
      'Need for Aboriginal-led solutions',
      'Importance of cultural connection'
    ]
  },
  {
    title: 'Victoria Ombudsman Investigation into Youth Justice',
    inquiry_type: 'ombudsman',
    jurisdiction: 'VIC',
    year_started: 2017,
    year_published: 2017,
    summary: 'Investigation following serious incidents at Parkville Youth Justice Centre. Examined use of isolation, staff training, and facility conditions. Made recommendations for immediate and systemic reforms.',
    recommendations_count: 18,
    implementation_status: 'partial',
    source_url: 'https://www.ombudsman.vic.gov.au/',
    key_findings: [
      'Overuse of isolation and lockdowns',
      'Inadequate staff training',
      'Poor living conditions',
      'Need for therapeutic approaches'
    ]
  },

  // New South Wales
  {
    title: 'NSW Parliament Inquiry into Youth Justice in NSW',
    inquiry_type: 'parliamentary',
    jurisdiction: 'NSW',
    year_started: 2019,
    year_published: 2020,
    summary: 'Examined the effectiveness of youth justice approaches in NSW. Focused on diversionary programs, Aboriginal overrepresentation, and alternatives to detention.',
    recommendations_count: 34,
    implementation_status: 'pending',
    source_url: 'https://www.parliament.nsw.gov.au/committees/inquiries/Pages/inquiry-details.aspx?pk=2545',
    key_findings: [
      'Need for better early intervention',
      'Raising age of criminal responsibility',
      'Expanding Youth Koori Court',
      'Improving transition support'
    ]
  },
  {
    title: 'NSW Ombudsman: Youth Detention Report',
    inquiry_type: 'ombudsman',
    jurisdiction: 'NSW',
    year_started: 2015,
    year_published: 2016,
    summary: 'Review of conditions and treatment of young people in NSW detention centers. Examined use of force, segregation, and education provision.',
    recommendations_count: 25,
    implementation_status: 'partial',
    source_url: 'https://www.ombo.nsw.gov.au/',
    key_findings: [
      'Concerns about use of force',
      'Inadequate education programs',
      'Limited access to health services',
      'Need for improved complaints processes'
    ]
  },

  // Western Australia
  {
    title: 'Review of the Youth Justice System in Western Australia (Inspector of Custodial Services)',
    inquiry_type: 'government_review',
    jurisdiction: 'WA',
    year_started: 2021,
    year_published: 2022,
    summary: 'Comprehensive review of the WA youth justice system. Examined Banksia Hill Detention Centre conditions, Aboriginal overrepresentation, and rehabilitation programs.',
    recommendations_count: 48,
    implementation_status: 'partial',
    source_url: 'https://www.oics.wa.gov.au/',
    key_findings: [
      'Critical staffing shortages',
      'Overreliance on lockdowns',
      'Aboriginal young people disproportionately affected',
      'Need for on-country programs'
    ]
  },
  {
    title: 'WA Parliament Inquiry into the High Level of First Nations People in Custody',
    inquiry_type: 'parliamentary',
    jurisdiction: 'WA',
    year_started: 2020,
    year_published: 2021,
    summary: 'Examined why First Nations people are overrepresented in WA custody. Made recommendations for justice reinvestment, Closing the Gap targets, and community-led solutions.',
    recommendations_count: 35,
    implementation_status: 'pending',
    source_url: 'https://www.parliament.wa.gov.au/',
    key_findings: [
      'Highest rate of Aboriginal incarceration in the world',
      'Need for justice reinvestment',
      'Importance of Aboriginal-led programs',
      'Addressing fines and minor offence imprisonment'
    ]
  },

  // South Australia
  {
    title: 'Nyland Royal Commission: Child Protection Systems',
    inquiry_type: 'royal_commission',
    jurisdiction: 'SA',
    year_started: 2014,
    year_published: 2016,
    summary: 'Examined child protection systems in South Australia. Made recommendations that impact youth justice, including crossover children and early intervention.',
    recommendations_count: 260,
    implementation_status: 'partial',
    source_url: 'https://www.childprotection.sa.gov.au/',
    key_findings: [
      'Need for integrated child protection and youth justice responses',
      'Early intervention critical',
      'Therapeutic approaches for trauma',
      'Better information sharing between agencies'
    ]
  },
  {
    title: 'SA Training Centre Visitor Annual Reports',
    inquiry_type: 'government_review',
    jurisdiction: 'SA',
    year_started: 2019,
    year_published: 2023,
    summary: 'Ongoing monitoring of Adelaide Youth Training Centre conditions. Examines treatment of young people, education access, and use of isolation.',
    recommendations_count: 85,
    implementation_status: 'partial',
    source_url: 'https://gcyp.sa.gov.au/',
    key_findings: [
      'Concerns about isolation use',
      'Need for better mental health support',
      'Education programs require improvement',
      'Importance of family contact'
    ]
  },

  // Tasmania
  {
    title: 'Tasmania Commission of Inquiry into Government Responses to Child Sexual Abuse in Institutional Settings',
    inquiry_type: 'royal_commission',
    jurisdiction: 'TAS',
    year_started: 2020,
    year_published: 2023,
    summary: 'Examined historical and contemporary responses to child sexual abuse in Tasmanian institutions, including youth justice settings.',
    recommendations_count: 191,
    implementation_status: 'pending',
    source_url: 'https://www.commissionofinquiry.tas.gov.au/',
    key_findings: [
      'Failures to protect children in state care',
      'Need for independent oversight',
      'Improved complaints mechanisms required',
      'Support for survivors'
    ]
  },

  // ACT
  {
    title: 'ACT Human Rights Commission Review of Bimberi Youth Justice Centre',
    inquiry_type: 'government_review',
    jurisdiction: 'ACT',
    year_started: 2019,
    year_published: 2019,
    summary: 'Examined conditions at ACT youth detention facility. Focused on human rights compliance, use of isolation, and rehabilitation programs.',
    recommendations_count: 28,
    implementation_status: 'partial',
    source_url: 'https://hrc.act.gov.au/',
    key_findings: [
      'Generally positive human rights framework',
      'Need to reduce isolation use',
      'Importance of therapeutic approaches',
      'Better support for Aboriginal young people'
    ]
  },

  // National/Cross-jurisdictional
  {
    title: 'Australian Law Reform Commission: Incarceration Rates of Aboriginal and Torres Strait Islander Peoples',
    inquiry_type: 'government_review',
    jurisdiction: 'FED',
    year_started: 2017,
    year_published: 2018,
    summary: 'National inquiry into high incarceration rates. Made recommendations for justice reinvestment, raising the age of criminal responsibility, and reducing imprisonment of Aboriginal people.',
    recommendations_count: 35,
    implementation_status: 'pending',
    source_url: 'https://www.alrc.gov.au/inquiry/incarceration-rates/',
    key_findings: [
      'Need for justice targets similar to Closing the Gap',
      'Justice reinvestment approach recommended',
      'Raise age of criminal responsibility to 14',
      'Community-controlled solutions essential'
    ]
  },
  {
    title: 'Productivity Commission Report on Government Services - Youth Justice',
    inquiry_type: 'government_review',
    jurisdiction: 'FED',
    year_started: 2020,
    year_published: 2024,
    summary: 'Annual reporting on youth justice performance across all Australian jurisdictions. Tracks detention rates, recidivism, Aboriginal representation, and program outcomes.',
    recommendations_count: 0,
    implementation_status: 'partial',
    source_url: 'https://www.pc.gov.au/research/ongoing/report-on-government-services/2024/community-services/youth-justice',
    key_findings: [
      'Significant variation across jurisdictions',
      'Aboriginal overrepresentation continues',
      'Need for better outcome measurement',
      'Importance of diversion programs'
    ]
  }
];

async function seedInquiries() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Seeding Historical Inquiries');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check if table exists by querying
  const { data: existing, error: checkError } = await supabase
    .from('historical_inquiries')
    .select('id, title')
    .limit(1);

  if (checkError) {
    console.log('Table may not exist. Creating inquiries in batch...');
  }

  // Check existing count
  const { count: existingCount } = await supabase
    .from('historical_inquiries')
    .select('id', { count: 'exact', head: true });

  console.log(`Currently ${existingCount || 0} inquiries in database\n`);

  let inserted = 0;
  let skipped = 0;

  for (const inquiry of historicalInquiries) {
    // Check if already exists
    const { data: exists } = await supabase
      .from('historical_inquiries')
      .select('id')
      .eq('title', inquiry.title)
      .single();

    if (exists) {
      console.log(`⏭  Skipped (exists): ${inquiry.title.substring(0, 50)}...`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('historical_inquiries')
      .insert(inquiry);

    if (error) {
      console.error(`❌ Failed: ${inquiry.title.substring(0, 50)}...`);
      console.error(`   Error: ${error.message}`);
    } else {
      console.log(`✅ Inserted: ${inquiry.title.substring(0, 50)}...`);
      inserted++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Done! Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

seedInquiries().catch(console.error);
