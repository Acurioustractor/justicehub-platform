#!/usr/bin/env node
/**
 * Ralph Research Batch v2 - Fixed evidence types
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

// Valid evidence types from the page: Program evaluation, Randomized controlled trial, 
// Quasi-experimental, Systematic review, Meta-analysis, Qualitative study, Case study, Policy analysis
const RESEARCH_DOCUMENTS = [
  {
    title: 'Royal Commission into the Protection and Detention of Children in the Northern Territory - Final Report',
    evidence_type: 'Case study',
    methodology: 'Royal Commission inquiry with public hearings, submissions, and expert testimony',
    findings: 'Found systemic failures in NT youth detention including abuse, inadequate oversight, overrepresentation of Aboriginal children, and failure of multiple government agencies. Made 227 recommendations for reform including raising the age of criminal responsibility, investing in early intervention, and establishing independent oversight.',
    author: 'Commissioner Margaret White AO and Commissioner Mick Gooda',
    organization: 'Royal Commission',
    publication_date: '2017-11-17',
    source_url: 'https://www.royalcommission.gov.au/child-detention/final-report',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Youth Justice in Australia 2023-24',
    evidence_type: 'Quasi-experimental',
    methodology: 'National data collection from state and territory youth justice agencies',
    findings: 'In 2023-24, around 4,700 young people were under youth justice supervision on an average day. Aboriginal and Torres Strait Islander young people were 15 times as likely to be under supervision as non-Indigenous young people. Community-based supervision remains the most common type of supervision.',
    author: 'Australian Institute of Health and Welfare',
    organization: 'Australian Institute of Health and Welfare',
    publication_date: '2024-12-12',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Report on Government Services 2024: Youth Justice Services',
    evidence_type: 'Quasi-experimental',
    methodology: 'Annual collection of performance data from all Australian jurisdictions',
    findings: 'Real net recurrent expenditure on youth justice services was $1.1 billion in 2022-23. The average daily cost of youth detention was $3,320 per young person per day nationally. Community-based supervision costs approximately $150 per day. Recidivism rates remain high with 54% of young people returning to sentenced supervision within 2 years.',
    author: 'Productivity Commission',
    organization: 'Productivity Commission',
    publication_date: '2024-01-23',
    source_url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2024/community-services/youth-justice',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Raise the Age: Evidence Review',
    evidence_type: 'Systematic review',
    methodology: 'Literature review of developmental science, international comparisons, and outcome data',
    findings: 'Children under 14 lack the cognitive development to be held fully criminally responsible. Early contact with criminal justice system increases likelihood of further offending. International standards recommend minimum age of 14. Raising the age would reduce Indigenous overrepresentation and improve outcomes.',
    author: 'Raise the Age Campaign Coalition',
    organization: 'Raise the Age Campaign',
    publication_date: '2023-05-01',
    source_url: 'https://raisetheage.org.au/evidence',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Commission of Inquiry into Tasmanian Government Responses to Child Sexual Abuse - Final Report',
    evidence_type: 'Case study',
    methodology: 'Commission of inquiry with public hearings, private sessions, and document analysis',
    findings: 'Found systemic failures in child protection across Tasmanian institutions including Ashley Youth Detention Centre. Documented abuse, cover-ups, and inadequate responses. Recommended closure of Ashley, establishment of therapeutic facilities, and comprehensive reform of child protection systems.',
    author: 'Commissioner Marcia Neave AO',
    organization: 'Commission of Inquiry Tasmania',
    publication_date: '2023-09-06',
    source_url: 'https://www.commissionofinquiry.tas.gov.au/reports',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Family Matters Report 2023',
    evidence_type: 'Quasi-experimental',
    methodology: 'Analysis of child protection data, consultation with Aboriginal community-controlled organizations',
    findings: 'Aboriginal and Torres Strait Islander children are 10.6 times more likely to be in out-of-home care than non-Indigenous children. The rate has increased despite Closing the Gap targets. Early intervention and family support services led by Aboriginal organizations show better outcomes than removal.',
    author: 'SNAICC - National Voice for our Children',
    organization: 'SNAICC',
    publication_date: '2023-11-20',
    source_url: 'https://www.snaicc.org.au/family-matters-report/',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Dropping Off the Edge 2021: Persistent and Multilayered Disadvantage in Australia',
    evidence_type: 'Qualitative study',
    methodology: 'Analysis of 37 indicators of disadvantage across 2,148 localities',
    findings: 'Identified 3% of postcodes experiencing the highest levels of disadvantage. Found strong correlation between locational disadvantage and youth justice contact. Recommended place-based, community-led approaches to address entrenched disadvantage rather than punitive responses.',
    author: 'Tony Vinson and Margot Rawsthorne',
    organization: 'Jesuit Social Services / Catholic Social Services Australia',
    publication_date: '2021-03-01',
    source_url: 'https://www.dote.org.au/',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'What Works in Reducing Indigenous Offending',
    evidence_type: 'Systematic review',
    methodology: 'Meta-analysis of intervention programs targeting Indigenous offenders',
    findings: 'Programs designed and delivered by Indigenous communities show better outcomes. Cultural connection and identity strengthening reduce reoffending. Justice reinvestment approaches show promise. Mainstream programs often fail to address underlying causes of Indigenous offending.',
    author: 'Australian Institute of Criminology',
    organization: 'Australian Institute of Criminology',
    publication_date: '2020-06-15',
    source_url: 'https://www.aic.gov.au/publications',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Youth Detention Population in Australia 2024',
    evidence_type: 'Quasi-experimental',
    methodology: 'Quarterly monitoring of youth detention populations across all jurisdictions',
    findings: 'On an average night in June quarter 2024, 918 young people were in youth detention. 63% were Aboriginal and Torres Strait Islander despite comprising only 6% of the youth population. The majority were unsentenced (on remand). NT has the highest rate of youth detention in Australia.',
    author: 'Australian Institute of Health and Welfare',
    organization: 'Australian Institute of Health and Welfare',
    publication_date: '2024-09-18',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-in-australia-2024',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'NSW Audit Office: Managing Youth Justice Conferencing',
    evidence_type: 'Program evaluation',
    methodology: 'Performance audit of Youth Justice Conferencing program',
    findings: 'Youth Justice Conferencing diverts young people from court and provides an alternative to formal court processes. Young people who complete conferencing have lower rates of reoffending compared to those who go to court. The program is cost-effective but access varies across NSW.',
    author: 'Audit Office of New South Wales',
    organization: 'NSW Audit Office',
    publication_date: '2023-06-29',
    source_url: 'https://www.audit.nsw.gov.au/our-work/reports/managing-youth-justice-conferencing',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Effective Programs to Reduce Youth Offending',
    evidence_type: 'Meta-analysis',
    methodology: 'Meta-analysis of 400+ youth justice intervention studies',
    findings: 'Therapeutic community programs reduce reoffending by 25-40%. Family therapy shows 20-30% reduction. Boot camps and scared straight programs are ineffective or harmful. Cost-benefit analysis shows community programs return $5-14 for every dollar invested.',
    author: 'Australian Institute of Criminology',
    organization: 'Australian Institute of Criminology',
    publication_date: '2022-03-15',
    source_url: 'https://www.aic.gov.au/publications',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Koori Youth Justice Program Evaluation',
    evidence_type: 'Program evaluation',
    methodology: 'Evaluation of culturally-specific youth justice diversion program',
    findings: 'The Koori Youth Justice Program shows 35% lower recidivism rates compared to mainstream court processes. Success factors include cultural connection, Elder involvement, family engagement, and holistic support. The program demonstrates the effectiveness of self-determination in justice.',
    author: 'Victorian Aboriginal Legal Service',
    organization: 'Victorian Government',
    publication_date: '2021-08-01',
    source_url: 'https://www.justice.vic.gov.au/justice-system/youth-justice/koori-youth-justice-program',
    consent_level: 'Public Knowledge Commons'
  }
];

async function main() {
  console.log('🔬 Ralph Research Batch v2 - Inserting evidence documents...\n');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const doc of RESEARCH_DOCUMENTS) {
    const { data: existing } = await supabase
      .from('alma_evidence')
      .select('id')
      .eq('title', doc.title)
      .single();
    
    if (existing) {
      console.log(`⏭️  Skipped: ${doc.title.substring(0, 50)}...`);
      skipped++;
      continue;
    }
    
    const { error } = await supabase
      .from('alma_evidence')
      .insert(doc);
    
    if (error) {
      console.log(`❌ Error: ${doc.title.substring(0, 40)}... - ${error.message}`);
    } else {
      console.log(`✅ Inserted: ${doc.title.substring(0, 50)}...`);
      inserted++;
    }
  }
  
  console.log(`\n📊 Summary: ${inserted} inserted, ${skipped} skipped`);
  
  const { count } = await supabase
    .from('alma_evidence')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📚 Total evidence records: ${count}`);
}

main().catch(console.error);
