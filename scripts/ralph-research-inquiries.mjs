#!/usr/bin/env node
/**
 * Ralph Research Session 2 - Parliamentary Inquiries & Submissions
 * Focus: Major inquiries, royal commissions, government reviews
 */

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

// Parliamentary Inquiries & Major Reviews
const INQUIRY_DOCUMENTS = [
  // === ROYAL COMMISSIONS ===
  {
    title: 'Royal Commission into Aboriginal Deaths in Custody - National Report',
    evidence_type: 'Case study',
    methodology: 'Royal Commission with 99 individual death investigations and systemic analysis',
    findings: '339 recommendations addressing systemic racism, over-policing, inadequate health care, and need for self-determination. Found that deaths were largely due to systemic failures rather than foul play. Recommendations largely unimplemented 30+ years later.',
    author: 'Commissioner Elliott Johnston QC',
    organization: 'Royal Commission into Aboriginal Deaths in Custody',
    publication_date: '1991-04-15',
    source_url: 'https://www.naa.gov.au/explore-collection/first-australians/royal-commission-aboriginal-deaths-custody',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Royal Commission into Institutional Responses to Child Sexual Abuse - Final Report',
    evidence_type: 'Case study',
    methodology: 'Royal Commission examining child sexual abuse across Australian institutions including youth detention',
    findings: 'Documented systemic failures in youth detention centres including Don Dale, Cleveland, and others. Recommended independent oversight, trauma-informed care, and raising age of criminal responsibility. Found detention environments increased vulnerability to abuse.',
    author: 'Justice Peter McClellan AM and Commissioners',
    organization: 'Royal Commission into Institutional Responses to Child Sexual Abuse',
    publication_date: '2017-12-15',
    source_url: 'https://www.childabuseroyalcommission.gov.au/final-report',
    consent_level: 'Public Knowledge Commons'
  },

  // === PARLIAMENTARY INQUIRIES ===
  {
    title: 'Senate Inquiry into the Indefinite Detention of People with Cognitive and Psychiatric Impairment',
    evidence_type: 'Policy analysis',
    methodology: 'Senate committee inquiry with public hearings and submissions',
    findings: 'Found Aboriginal people with disabilities disproportionately subject to indefinite detention. Recommended abolishing indefinite detention, improving disability services, and implementing UNCRPD. Highlighted case of Marlon Noble detained 10+ years without conviction.',
    author: 'Senate Community Affairs References Committee',
    organization: 'Australian Senate',
    publication_date: '2016-11-29',
    source_url: 'https://www.aph.gov.au/Parliamentary_Business/Committees/Senate/Community_Affairs/IndefiniteDetention45/Report',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'NSW Legislative Council Inquiry into the Child Protection and Social Services System',
    evidence_type: 'Policy analysis',
    methodology: 'Parliamentary inquiry examining child protection and its intersection with youth justice',
    findings: 'Found child protection failures leading to youth justice involvement. Recommended early intervention, family preservation, and Aboriginal community-controlled services. Identified foster care to prison pipeline affecting Aboriginal children.',
    author: 'NSW Legislative Council General Purpose Standing Committee No. 2',
    organization: 'NSW Parliament',
    publication_date: '2022-03-24',
    source_url: 'https://www.parliament.nsw.gov.au/committees/inquiries/Pages/inquiry-details.aspx?pk=2775',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'QLD Youth Justice and Other Legislation Amendment Bill Inquiry',
    evidence_type: 'Policy analysis',
    methodology: 'Parliamentary committee examination of proposed youth justice reforms',
    findings: 'Examined impact of breach of bail provisions, increased maximum sentences, and removal of detention as last resort principle. Submissions warned changes would increase Indigenous incarceration and harm rehabilitation outcomes.',
    author: 'Legal Affairs and Safety Committee',
    organization: 'Queensland Parliament',
    publication_date: '2021-02-19',
    source_url: 'https://www.parliament.qld.gov.au/Work-of-Committees/Committees/Committee-Details?cid=165',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Victorian Parliamentary Inquiry into Youth Justice Centres in Victoria',
    evidence_type: 'Policy analysis',
    methodology: 'Parliamentary inquiry following riots and abuse allegations at Parkville and Malmsbury',
    findings: 'Found systemic failures including violence, inadequate staffing, over-reliance on isolation, and lack of rehabilitation programs. Recommended therapeutic models, smaller facilities, and alternatives to detention.',
    author: 'Legal and Social Issues Committee',
    organization: 'Victorian Parliament',
    publication_date: '2018-03-14',
    source_url: 'https://www.parliament.vic.gov.au/lsic-la/inquiries/article/4683',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'WA Inspector of Custodial Services Review of Banksia Hill Detention Centre',
    evidence_type: 'Program evaluation',
    methodology: 'Independent inspection of youth detention facility',
    findings: 'Found critical failures including children held in adult facility, excessive lockdowns (23 hours/day), inadequate education, mental health crisis. 70%+ of detainees are Aboriginal. Recommended immediate reform and investment in alternatives.',
    author: 'Office of the Inspector of Custodial Services',
    organization: 'WA Inspector of Custodial Services',
    publication_date: '2023-07-20',
    source_url: 'https://www.oics.wa.gov.au/reports/banksia-hill/',
    consent_level: 'Public Knowledge Commons'
  },

  // === OMBUDSMAN & INSPECTOR REPORTS ===
  {
    title: 'NSW Ombudsman: Review of the Bail Act - Young People',
    evidence_type: 'Policy analysis',
    methodology: 'Analysis of bail outcomes for young people in NSW',
    findings: 'Found young people increasingly held on remand for minor offences. Aboriginal young people 24x more likely to be refused bail. Recommended presumption of bail for children, prohibition of remand for non-imprisonable offences.',
    author: 'NSW Ombudsman',
    organization: 'NSW Ombudsman',
    publication_date: '2020-06-01',
    source_url: 'https://www.ombo.nsw.gov.au/news-and-publications/publications/reports/youth',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Victorian Ombudsman: Investigation into the Rehabilitation and Reintegration of Prisoners',
    evidence_type: 'Program evaluation',
    methodology: 'Investigation into prison rehabilitation programs including youth facilities',
    findings: 'Found lack of rehabilitation programs, inadequate transition support, and high recidivism. Young people particularly affected by lack of education and employment pathways. Recommended throughcare model and community partnerships.',
    author: 'Victorian Ombudsman',
    organization: 'Victorian Ombudsman',
    publication_date: '2015-09-17',
    source_url: 'https://www.ombudsman.vic.gov.au/our-impact/investigation-reports/',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'ACT Inspector of Correctional Services: Review of Bimberi Youth Justice Centre',
    evidence_type: 'Program evaluation',
    methodology: 'Independent inspection and review of ACT youth detention',
    findings: 'Found good practices in therapeutic approach but concerns about isolation use, staffing levels, and Aboriginal cultural programs. Recommended expansion of on-Country programs and family connection initiatives.',
    author: 'ACT Inspector of Correctional Services',
    organization: 'ACT Inspector of Correctional Services',
    publication_date: '2022-11-15',
    source_url: 'https://www.ics.act.gov.au/reports-and-publications',
    consent_level: 'Public Knowledge Commons'
  },

  // === GOVERNMENT REVIEWS & STRATEGIES ===
  {
    title: 'NT Youth Detention Review - Keith Hamburger Report',
    evidence_type: 'Program evaluation',
    methodology: 'Independent review commissioned following Don Dale abuse revelations',
    findings: 'Found systemic failures, inappropriate use of force, isolation as punishment, and lack of therapeutic care. Recommended immediate closure of Don Dale, new therapeutic facility, and Aboriginal-led alternatives. Many recommendations remain unimplemented.',
    author: 'Keith Hamburger AM',
    organization: 'Northern Territory Government',
    publication_date: '2016-08-01',
    source_url: 'https://justice.nt.gov.au/youth-justice/youth-detention-review',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'SA Training Centre Visitor Annual Report 2022-23',
    evidence_type: 'Program evaluation',
    methodology: 'Independent oversight of SA youth detention (Kurlana Tapa)',
    findings: 'Documented concerns about isolation, restraint practices, education access, and Aboriginal overrepresentation. Found 65% of young people are Aboriginal despite being 4% of population. Recommended cultural strengthening and community alternatives.',
    author: 'Training Centre Visitor',
    organization: 'SA Training Centre Visitor',
    publication_date: '2023-10-31',
    source_url: 'https://www.trainingcentrevisitor.sa.gov.au/annual-reports',
    consent_level: 'Public Knowledge Commons'
  },

  // === RESEARCH REPORTS ===
  {
    title: 'Sentencing Advisory Council Victoria: Reoffending by Children and Young People',
    evidence_type: 'Quasi-experimental',
    methodology: 'Longitudinal analysis of reoffending rates by sentence type',
    findings: 'Found detention increases reoffending compared to community orders. Young people sentenced to detention 1.5x more likely to reoffend. First Nations young people face compounding disadvantage. Early diversion most effective intervention.',
    author: 'Sentencing Advisory Council',
    organization: 'Sentencing Advisory Council Victoria',
    publication_date: '2023-05-01',
    source_url: 'https://www.sentencingcouncil.vic.gov.au/publications/reoffending-children-and-young-people',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Australian Human Rights Commission: Wiyi Yani U Thangani Report',
    evidence_type: 'Community-led research',
    methodology: 'Nationwide consultations with Aboriginal and Torres Strait Islander women and girls',
    findings: 'Documented impact of justice system on First Nations women and girls including as mothers of incarcerated children. Recommended self-determination, justice reinvestment, and healing approaches. Highlighted intergenerational trauma from child removal.',
    author: 'June Oscar AO, Aboriginal and Torres Strait Islander Social Justice Commissioner',
    organization: 'Australian Human Rights Commission',
    publication_date: '2020-10-28',
    source_url: 'https://humanrights.gov.au/our-work/aboriginal-and-torres-strait-islander-social-justice/publications/wiyi-yani-u-thangani',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Change the Record: Blueprint for Change',
    evidence_type: 'Policy analysis',
    methodology: 'Coalition-developed policy framework led by Aboriginal organizations',
    findings: 'Proposes justice targets including 45% reduction in youth incarceration by 2031. Calls for raising age to 14, ending watchhouse detention, justice reinvestment, and Aboriginal community control. Costed alternatives show savings of billions.',
    author: 'Change the Record Coalition',
    organization: 'Change the Record',
    publication_date: '2021-07-01',
    source_url: 'https://www.changetherecord.org.au/blueprint',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Amnesty International: A Brighter Tomorrow - Keeping Indigenous Kids in the Community',
    evidence_type: 'Policy analysis',
    methodology: 'Human rights analysis of youth justice with focus on Indigenous children',
    findings: 'Documents Australia\'s breach of international human rights obligations. Found children as young as 10 imprisoned, excessive use of solitary confinement, and systematic discrimination. Calls for implementation of UN recommendations.',
    author: 'Amnesty International Australia',
    organization: 'Amnesty International',
    publication_date: '2015-06-01',
    source_url: 'https://www.amnesty.org.au/brighter-tomorrow/',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Law Council of Australia: Justice Project - People Who Are Incarcerated',
    evidence_type: 'Policy analysis',
    methodology: 'Legal sector review of access to justice for prisoners including young people',
    findings: 'Found significant barriers to legal representation for young people in detention. Documented inadequate legal aid, lack of specialist youth lawyers, and communication barriers. Recommended increased funding and youth-specific legal services.',
    author: 'Law Council of Australia',
    organization: 'Law Council of Australia',
    publication_date: '2018-08-01',
    source_url: 'https://www.lawcouncil.asn.au/justice-project/final-report',
    consent_level: 'Public Knowledge Commons'
  },

  // === STATE-SPECIFIC EVALUATIONS ===
  {
    title: 'QLD Youth Justice Census 2023',
    evidence_type: 'Quasi-experimental',
    methodology: 'Point-in-time census of young people under youth justice supervision',
    findings: '2,847 young people under supervision on census date. 52% Aboriginal/Torres Strait Islander. 68% had prior child protection involvement. 45% had mental health diagnosis. Shows intersection of disadvantage, not criminality.',
    author: 'Department of Children, Youth Justice and Multicultural Affairs',
    organization: 'Queensland Government',
    publication_date: '2023-12-01',
    source_url: 'https://www.cyjma.qld.gov.au/about-us/strategy-reporting',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'NSW Young People in Custody Health Survey 2022',
    evidence_type: 'Quasi-experimental',
    methodology: 'Health survey of young people in NSW youth detention centres',
    findings: '83% experienced psychological distress. 74% had at least one parent with substance abuse. 68% had experienced abuse or neglect. 42% had attempted suicide. Demonstrates detention as health crisis, not crime problem.',
    author: 'Justice Health & Forensic Mental Health Network',
    organization: 'NSW Health',
    publication_date: '2022-09-01',
    source_url: 'https://www.justicehealth.nsw.gov.au/publications/young-people-in-custody',
    consent_level: 'Public Knowledge Commons'
  },
  {
    title: 'Youth Parole Board Victoria Annual Report 2022-23',
    evidence_type: 'Quasi-experimental',
    methodology: 'Annual reporting on parole outcomes for young people',
    findings: 'Parole completion rate of 78%. Young people on parole with stable housing 3x more likely to complete successfully. Aboriginal young people face additional barriers including lack of culturally safe housing and support services.',
    author: 'Youth Parole Board',
    organization: 'Victorian Government',
    publication_date: '2023-09-30',
    source_url: 'https://www.justice.vic.gov.au/youth-parole-board',
    consent_level: 'Public Knowledge Commons'
  }
];

async function main() {
  console.log('🔬 Ralph Research Session 2 - Parliamentary Inquiries & Submissions\n');
  console.log(`📋 ${INQUIRY_DOCUMENTS.length} documents to process\n`);

  let inserted = 0;
  let skipped = 0;

  for (const doc of INQUIRY_DOCUMENTS) {
    const { data: ex } = await supabase
      .from('alma_evidence')
      .select('id')
      .eq('title', doc.title)
      .single();

    if (ex) {
      console.log(`⏭️  Skip: ${doc.title.slice(0, 50)}...`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from('alma_evidence').insert(doc);

    if (error) {
      console.log(`❌ Err: ${doc.title.slice(0, 40)}... - ${error.message}`);
    } else {
      console.log(`✅ OK: ${doc.title.slice(0, 55)}...`);
      inserted++;
    }
  }

  const { count } = await supabase
    .from('alma_evidence')
    .select('*', { count: 'exact', head: true });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary: ${inserted} inserted, ${skipped} skipped`);
  console.log(`📚 Total evidence records: ${count}`);
}

main().catch(console.error);
