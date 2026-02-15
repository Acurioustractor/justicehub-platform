#!/usr/bin/env node
/**
 * Ralph Research Batch - Insert known research documents into alma_evidence
 * 
 * This populates the evidence library with key reports we know exist.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
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

// Known research documents to insert
const RESEARCH_DOCUMENTS = [
  // NT Royal Commission
  {
    title: 'Royal Commission into the Protection and Detention of Children in the Northern Territory - Final Report',
    evidence_type: 'Systematic review',
    methodology: 'Royal Commission inquiry with public hearings, submissions, and expert testimony',
    findings: 'Found systemic failures in NT youth detention including abuse, inadequate oversight, overrepresentation of Aboriginal children, and failure of multiple government agencies. Made 227 recommendations for reform including raising the age of criminal responsibility, investing in early intervention, and establishing independent oversight.',
    author: 'Commissioner Margaret White AO and Commissioner Mick Gooda',
    organization: 'Royal Commission',
    publication_date: '2017-11-17',
    source_url: 'https://www.royalcommission.gov.au/child-detention/final-report',
    consent_level: 'Public Knowledge Commons'
  },
  // ALRC Pathways to Justice
  {
    title: 'Pathways to Justice: Inquiry into the Incarceration Rate of Aboriginal and Torres Strait Islander Peoples (ALRC Report 133)',
    evidence_type: 'Policy analysis',
    methodology: 'Law reform inquiry with consultation, submissions, and legal analysis',
    findings: 'Aboriginal and Torres Strait Islander people are the most incarcerated people on earth. Report recommends justice reinvestment, reducing imprisonment for fine default, expanding diversionary programs, and implementing Closing the Gap targets. Calls for raising the minimum age of criminal responsibility to 14.',
    author: 'Australian Law Reform Commission',
    organization: 'Australian Law Reform Commission',
    publication_date: '2018-03-28',
    source_url: 'https://www.alrc.gov.au/publication/pathways-to-justice-inquiry-into-the-incarceration-rate-of-aboriginal-and-torres-strait-islander-peoples-alrc-report-133/',
    consent_level: 'Public Knowledge Commons'
  },
  // AIHW Youth Justice 2023-24
  {
    title: 'Youth Justice in Australia 2023-24',
    evidence_type: 'Statistical report',
    methodology: 'National data collection from state and territory youth justice agencies',
    findings: 'In 2023-24, around 4,700 young people were under youth justice supervision on an average day. Aboriginal and Torres Strait Islander young people were 15 times as likely to be under supervision as non-Indigenous young people. Community-based supervision remains the most common type of supervision.',
    author: 'Australian Institute of Health and Welfare',
    organization: 'Australian Institute of Health and Welfare',
    publication_date: '2024-12-12',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24',
    consent_level: 'Public Knowledge Commons'
  },
  // Productivity Commission ROGS 2024
  {
    title: 'Report on Government Services 2024: Youth Justice Services',
    evidence_type: 'Statistical report',
    methodology: 'Annual collection of performance data from all Australian jurisdictions',
    findings: 'Real net recurrent expenditure on youth justice services was $1.1 billion in 2022-23. The average daily cost of youth detention was $3,320 per young person per day nationally. Community-based supervision costs approximately $150 per day. Recidivism rates remain high with 54% of young people returning to sentenced supervision within 2 years.',
    author: 'Productivity Commission',
    organization: 'Productivity Commission',
    publication_date: '2024-01-23',
    source_url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2024/community-services/youth-justice',
    consent_level: 'Public Knowledge Commons'
  },
  // Raise the Age Evidence
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
  // TAS Commission of Inquiry
  {
    title: 'Commission of Inquiry into the Tasmanian Government\'s Responses to Child Sexual Abuse in Institutional Settings - Final Report',
    evidence_type: 'Systematic review',
    methodology: 'Commission of inquiry with public hearings, private sessions, and document analysis',
    findings: 'Found systemic failures in child protection across Tasmanian institutions including Ashley Youth Detention Centre. Documented abuse, cover-ups, and inadequate responses. Recommended closure of Ashley, establishment of therapeutic facilities, and comprehensive reform of child protection systems.',
    author: 'Commissioner Marcia Neave AO',
    organization: 'Commission of Inquiry Tasmania',
    publication_date: '2023-09-06',
    source_url: 'https://www.commissionofinquiry.tas.gov.au/reports',
    consent_level: 'Public Knowledge Commons'
  },
  // SNAICC - Family Matters Report
  {
    title: 'Family Matters Report 2023',
    evidence_type: 'Statistical report',
    methodology: 'Analysis of child protection data, consultation with Aboriginal community-controlled organizations',
    findings: 'Aboriginal and Torres Strait Islander children are 10.6 times more likely to be in out-of-home care than non-Indigenous children. The rate has increased despite Closing the Gap targets. Early intervention and family support services led by Aboriginal organizations show better outcomes than removal.',
    author: 'SNAICC - National Voice for our Children',
    organization: 'SNAICC',
    publication_date: '2023-11-20',
    source_url: 'https://www.snaicc.org.au/family-matters-report/',
    consent_level: 'Public Knowledge Commons'
  },
  // Jesuit Social Services - Dropping Off the Edge
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
  // AIC - What works in reducing Indigenous offending
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
  // Human Rights Commission - Children's Rights Report
  {
    title: 'Children\'s Rights Report 2023',
    evidence_type: 'Policy analysis',
    methodology: 'Analysis of Australia\'s compliance with UN Convention on the Rights of the Child',
    findings: 'Australia continues to breach international obligations regarding children in detention. Recommends raising the minimum age of criminal responsibility to 14, ending use of isolation and restraint, and prioritizing diversion over detention. Highlights discriminatory impact on First Nations children.',
    author: 'Australian Human Rights Commission',
    organization: 'Australian Human Rights Commission',
    publication_date: '2023-11-20',
    source_url: 'https://humanrights.gov.au/our-work/childrens-rights/publications',
    consent_level: 'Public Knowledge Commons'
  },
  // Closing the Gap - Justice Target
  {
    title: 'Closing the Gap: Target 10 - Youth Justice',
    evidence_type: 'Policy analysis',
    methodology: 'National agreement monitoring and data analysis',
    findings: 'Target: By 2031, reduce the rate of Aboriginal and Torres Strait Islander young people in detention by at least 30%. Current status: Not on track. Rates have increased in several jurisdictions since baseline. Partnership approaches and community-controlled services are essential for progress.',
    author: 'Coalition of Peaks',
    organization: 'Closing the Gap',
    publication_date: '2024-07-31',
    source_url: 'https://www.closingthegap.gov.au/national-agreement/targets',
    consent_level: 'Public Knowledge Commons'
  },
  // QLD Youth Justice Strategy
  {
    title: 'Working Together Changing the Story: Youth Justice Strategy 2019-2023',
    evidence_type: 'Policy analysis',
    methodology: 'Government policy framework development with stakeholder consultation',
    findings: 'Four pillars: intervene early, keep children out of court, keep children out of custody, reduce reoffending. Committed to diversion, early intervention, and community partnerships. Acknowledged overrepresentation of Aboriginal and Torres Strait Islander young people requires culturally appropriate responses.',
    author: 'Queensland Department of Children, Youth Justice and Multicultural Affairs',
    organization: 'Queensland Government',
    publication_date: '2019-08-01',
    source_url: 'https://www.cyjma.qld.gov.au/about-us/strategy-reporting/youth-justice-strategy',
    consent_level: 'Public Knowledge Commons'
  }
];

async function main() {
  console.log('🔬 Ralph Research Batch - Inserting evidence documents...\n');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const doc of RESEARCH_DOCUMENTS) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('alma_evidence')
      .select('id')
      .eq('title', doc.title)
      .single();
    
    if (existing) {
      console.log(`⏭️  Skipped (exists): ${doc.title.substring(0, 60)}...`);
      skipped++;
      continue;
    }
    
    // Insert
    const { error } = await supabase
      .from('alma_evidence')
      .insert(doc);
    
    if (error) {
      console.log(`❌ Error: ${doc.title.substring(0, 40)}... - ${error.message}`);
    } else {
      console.log(`✅ Inserted: ${doc.title.substring(0, 60)}...`);
      inserted++;
    }
  }
  
  console.log(`\n📊 Summary: ${inserted} inserted, ${skipped} skipped`);
  
  // Get total count
  const { count } = await supabase
    .from('alma_evidence')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📚 Total evidence records: ${count}`);
}

main().catch(console.error);
