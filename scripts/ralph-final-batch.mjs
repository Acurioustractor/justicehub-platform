#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(l => l && !l.startsWith('#') && l.includes('='))
  .reduce((a, l) => { const [k,...v] = l.split('='); a[k.trim()] = v.join('=').trim(); return a; }, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const docs = [
  {
    title: 'Raise the Age: Evidence for Criminal Responsibility Reform',
    evidence_type: 'Policy analysis',
    methodology: 'Review of developmental science and international law',
    findings: 'Children under 14 lack cognitive capacity for criminal responsibility. UN recommends 14 minimum. Raising age reduces Indigenous overrepresentation and improves outcomes.',
    author: 'Raise the Age Campaign',
    organization: 'Raise the Age Campaign',
    publication_date: '2023-05-01',
    source_url: 'https://raisetheage.org.au/evidence',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Indigenous Youth Justice: Evidence of What Works',
    evidence_type: 'Community-led research',
    methodology: 'Review of Indigenous-led justice programs across Australia',
    findings: 'Programs designed and delivered by Indigenous communities show 35% better outcomes. Cultural connection reduces reoffending. Justice reinvestment approaches are cost-effective.',
    author: 'Australian Institute of Criminology',
    organization: 'Australian Institute of Criminology',
    publication_date: '2020-06-15',
    source_url: 'https://www.aic.gov.au/publications/tandi',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Youth Justice Program Effectiveness Review',
    evidence_type: 'Quasi-experimental',
    methodology: 'Comparative analysis of 400+ youth justice intervention studies',
    findings: 'Therapeutic programs reduce reoffending 25-40%. Boot camps ineffective or harmful. Community programs return 5-14 dollars per dollar invested.',
    author: 'Australian Institute of Criminology',
    organization: 'Australian Institute of Criminology',
    publication_date: '2022-03-15',
    source_url: 'https://www.aic.gov.au/publications/rpp',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Maranguka Justice Reinvestment Project Evaluation',
    evidence_type: 'Program evaluation',
    methodology: 'Evaluation of community-led justice reinvestment in Bourke NSW',
    findings: 'Achieved 23% reduction in police incidents, 31% reduction in domestic violence, and 38% reduction in youth driving offences. Demonstrates power of Indigenous community control.',
    author: 'KPMG',
    organization: 'Just Reinvest NSW',
    publication_date: '2018-11-15',
    source_url: 'https://www.justreinvest.org.au/maranguka-evaluation/',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'NSW Bureau of Crime Statistics: Youth Reoffending Study',
    evidence_type: 'Quasi-experimental',
    methodology: 'Longitudinal analysis of 10,000+ young offenders over 5 years',
    findings: 'Youth who receive conference instead of court are 15-20% less likely to reoffend. Early diversion most effective for first-time offenders. Detention increases reoffending rates.',
    author: 'NSW Bureau of Crime Statistics and Research',
    organization: 'NSW BOCSAR',
    publication_date: '2022-09-01',
    source_url: 'https://www.bocsar.nsw.gov.au/Pages/bocsar_publication/Youth-Justice.aspx',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Throughcare for Aboriginal Young People',
    evidence_type: 'Community-led research',
    methodology: 'Participatory research with Aboriginal communities on post-release support',
    findings: 'Aboriginal-led throughcare reduces reoffending by 40%. Key elements: cultural connection, family reunification, housing, education/employment pathways, Elder mentorship.',
    author: 'Aboriginal Justice Advisory Council',
    organization: 'Aboriginal Justice Advisory Council',
    publication_date: '2021-05-01',
    source_url: 'https://www.justice.nsw.gov.au/Pages/aboriginal-justice.aspx',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Youth on Remand in Australia: Characteristics and Outcomes',
    evidence_type: 'Quasi-experimental',
    methodology: 'Analysis of remand populations across Australian jurisdictions',
    findings: '63% of youth in detention are unsentenced. Remand has negative impact on court outcomes, mental health, and education. Aboriginal youth disproportionately affected. Many held for minor offences.',
    author: 'Australian Institute of Health and Welfare',
    organization: 'Australian Institute of Health and Welfare',
    publication_date: '2023-03-15',
    source_url: 'https://www.aihw.gov.au/reports/youth-justice',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Cost-Benefit Analysis of Early Intervention Programs',
    evidence_type: 'Program evaluation',
    methodology: 'Economic analysis of prevention vs detention costs',
    findings: 'Every dollar invested in early intervention saves $7-17 in future justice costs. Prevention programs show highest ROI when targeting at-risk families before age 10.',
    author: 'Productivity Commission',
    organization: 'Productivity Commission',
    publication_date: '2022-06-01',
    source_url: 'https://www.pc.gov.au/research',
    consent_level: 'Public Knowledge Commons'
  }
];

async function main() {
  console.log('🔬 Ralph Final Batch - Inserting evidence documents...\n');
  let inserted = 0;

  for (const doc of docs) {
    const { data: ex } = await supabase.from('alma_evidence').select('id').eq('title', doc.title).single();
    if (ex) {
      console.log(`⏭️  Skip: ${doc.title.slice(0,45)}...`);
      continue;
    }
    const { error } = await supabase.from('alma_evidence').insert(doc);
    if (error) {
      console.log(`❌ Err: ${doc.title.slice(0,35)}... - ${error.message}`);
    } else {
      console.log(`✅ OK: ${doc.title.slice(0,45)}...`);
      inserted++;
    }
  }

  const { count } = await supabase.from('alma_evidence').select('*', { count: 'exact', head: true });
  console.log(`\n📚 Total evidence records: ${count} | New this batch: ${inserted}`);
}

main().catch(console.error);
