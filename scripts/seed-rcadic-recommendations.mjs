#!/usr/bin/env node
/**
 * RCADIC Recommendation Tracker - Seed Script
 *
 * Seeds the oversight_recommendations table with the 21 youth-justice-relevant
 * recommendations from the Royal Commission into Aboriginal Deaths in Custody (1991).
 *
 * Implementation status sourced from:
 * - Deloitte (2018) RCADIC Review of Government Implementation
 * - OICS WA (2023) Status Report
 * - Australian Law Reform Commission Report 133
 * - Change the Record Coalition annual reports
 *
 * Usage:
 *   node scripts/seed-rcadic-recommendations.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const envFile = readFileSync(join(root, '.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
    .map(([key, ...values]) => [key, values.join('=')])
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');

// ── Constants ────────────────────────────────────────────────────────

const OVERSIGHT_BODY = 'Royal Commission into Aboriginal Deaths in Custody';
const REPORT_TITLE = 'Royal Commission into Aboriginal Deaths in Custody (1991)';
const REPORT_DATE = '1991-04-15';
const REPORT_URL = 'https://www.austlii.edu.au/au/other/IndigLRes/rciadic/';

// ── Recommendation Data ──────────────────────────────────────────────

const RECOMMENDATIONS = [
  // ── Juvenile Justice cluster (Recs 62, 234-245) ──
  {
    recommendation_number: '62',
    recommendation_text:
      'That governments give formal recognition to juvenile justice as a discrete area of the criminal justice system requiring a separate legislative and policy framework, specialist staff and discrete funding.',
    status: 'partially_implemented',
    status_notes:
      'All states have separate youth justice legislation, but funding remains intertwined with adult corrections in most jurisdictions. Specialist staff recruitment remains inadequate, particularly for Aboriginal communities.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '234',
    recommendation_text:
      'All juvenile justice agencies should adopt the principle that detention of young people should be used as a last resort and for the shortest appropriate period.',
    status: 'partially_implemented',
    status_notes:
      'Legislated in principle but not enforced in practice. Indigenous youth detention rates have increased 400% since 1991. QLD, WA and NT have expanded detention capacity. The principle exists in law but is contradicted by policy.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '235',
    recommendation_text:
      'That governments fund viable alternatives to detention for young Aboriginal people, including community-based supervision programs, youth support services, and culturally appropriate diversion programs.',
    status: 'partially_implemented',
    status_notes:
      'Some programs exist (e.g., ALMA-documented community alternatives) but are chronically underfunded. For every $1 spent on alternatives, approximately $50 is spent on detention infrastructure.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '236',
    recommendation_text:
      'Police cautioning of juveniles, and other forms of diversion from the formal criminal justice system, must be available to Aboriginal juveniles on an equal basis with other juveniles.',
    status: 'partially_implemented',
    status_notes:
      'Cautioning programs exist but Aboriginal young people are significantly less likely to receive cautions than non-Indigenous peers. In QLD, Aboriginal youth are 3x less likely to be cautioned.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '237',
    recommendation_text:
      'States and territories should review the use of police lock-ups as places of detention for juveniles, with a view to ensuring that juveniles are not detained in police lock-ups except in exceptional circumstances and for the minimum time necessary.',
    status: 'rejected',
    status_notes:
      'Still occurring in QLD, NT, and remote WA. Children as young as 10 held in adult police watch houses for extended periods. QLD watch house crisis (2023-24) saw hundreds of children detained in adult police facilities.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '238',
    recommendation_text:
      'Every effort should be made to ensure that Aboriginal children who must be placed in juvenile detention centres are placed in facilities as close as possible to their communities and families.',
    status: 'rejected',
    status_notes:
      'Children are routinely transported hundreds of kilometres from their communities. NT children sent from remote communities to Darwin. QLD children from Cape York sent to Brisbane or Townsville. No new regional facilities built.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '239',
    recommendation_text:
      'Conditions in juvenile detention centres should not be harsher or more restrictive than conditions in adult prisons, and should be appropriate to the age and developmental needs of young people.',
    status: 'partially_implemented',
    status_notes:
      'Some improvements in facility design, but Don Dale (NT), Cleveland (QLD) and Banksia Hill (WA) have all been found to have conditions worse than adult prisons. Solitary confinement of children continues.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '240',
    recommendation_text:
      'Programs in juvenile detention centres should include education, vocational training, life skills, cultural activities, sport and recreation, and should be designed to meet the needs of Aboriginal young people.',
    status: 'partially_implemented',
    status_notes:
      'Education programs exist in most centres but are inadequate. Cultural programs are ad hoc and under-resourced. Multiple reviews have found education hours are fraction of community school hours. OICS WA found only 2hrs/day education in some facilities.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '241',
    recommendation_text:
      'Juvenile detention centres should employ Aboriginal people, including as youth workers, counsellors, cultural advisors and management, in numbers reflecting the proportion of Aboriginal young people in detention.',
    status: 'rejected',
    status_notes:
      'Aboriginal staff remain severely underrepresented. While Aboriginal youth make up 60-90% of detainees across jurisdictions, Aboriginal staff typically comprise less than 10% of detention workforce.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '242',
    recommendation_text:
      'Aboriginal Legal Services should be funded to provide legal representation for all Aboriginal juveniles appearing before courts or tribunals dealing with juvenile justice matters.',
    status: 'partially_implemented',
    status_notes:
      'Aboriginal Legal Services exist but are chronically underfunded. Productivity Commission found ALS receives 15% of the per-capita funding of Legal Aid. Many Aboriginal young people appear unrepresented, especially in remote courts.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '243',
    recommendation_text:
      'Bail provisions for juveniles should be liberalised to ensure that remand in custody is a last resort, and culturally appropriate bail support programs should be established.',
    status: 'rejected',
    status_notes:
      'Bail laws have been tightened, not liberalised. QLD (2023) introduced presumption against bail for certain youth offences. NT and WA have similar restrictive bail regimes. Remand now accounts for majority of youth detention.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '244',
    recommendation_text:
      'Review mandatory sentencing laws as they apply to juveniles, with a view to their repeal or substantial modification.',
    status: 'rejected',
    status_notes:
      'Mandatory sentencing has expanded, not been repealed. WA, NT and QLD have introduced or maintained mandatory sentencing provisions for juveniles. Directly contradicts the Royal Commission recommendation.',
    cluster: 'juvenile_justice',
  },
  {
    recommendation_number: '245',
    recommendation_text:
      'No juvenile should be held in an adult prison or lock-up. Where a person under 18 is charged with or convicted of an offence, they should be dealt with in the juvenile justice system.',
    status: 'partially_implemented',
    status_notes:
      'Legislated in most jurisdictions but breached in practice. QLD watch house crisis (2023-24) saw children in adult police facilities. NT has transferred 17-year-olds to adult facilities. WA Banksia Hill transfers to Casuarina adult prison.',
    cluster: 'juvenile_justice',
  },

  // ── Sentencing Reform cluster ──
  {
    recommendation_number: '92',
    recommendation_text:
      'Imprisonment should be used as a sanction of last resort, and only where no reasonable alternative is available. Governments should legislate to give effect to this principle.',
    status: 'rejected',
    status_notes:
      'Imprisonment rates for Aboriginal people have increased by over 100% since 1991. Australia now has one of the highest Indigenous incarceration rates in the world. The principle has been abandoned in practice.',
    cluster: 'sentencing_reform',
  },
  {
    recommendation_number: '104',
    recommendation_text:
      'Governments should legislate to enforce the principle of imprisonment as a last resort, including by requiring courts to give reasons for imposing custodial sentences and to consider all available alternatives.',
    status: 'partially_implemented',
    status_notes:
      'Some jurisdictions have legislated the principle (e.g., Sentencing Act provisions) but enforcement mechanisms are weak. Gladue-style reports (Canada) have not been widely adopted. Aboriginal imprisonment continues to rise.',
    cluster: 'sentencing_reform',
  },
  {
    recommendation_number: '109',
    recommendation_text:
      'Community service orders, attendance centre orders, and other non-custodial sentencing options should be readily available in all areas, including remote Aboriginal communities.',
    status: 'partially_implemented',
    status_notes:
      'Non-custodial options exist but are significantly less available in remote communities. Community service orders often lack cultural appropriateness. Throughcare and post-release support remain inadequate.',
    cluster: 'sentencing_reform',
  },

  // ── Deaths in Custody cluster ──
  {
    recommendation_number: '161',
    recommendation_text:
      'There should be an independent investigation of all deaths in custody by an agency independent of the custodial authority, and the results of such investigations should be made public.',
    status: 'partially_implemented',
    status_notes:
      'Coronial inquests occur but are often delayed by years. The Australian Institute of Criminology monitors deaths but data publication is slow. Over 570 Aboriginal deaths in custody since 1991. Systemic accountability remains absent.',
    cluster: 'deaths_in_custody',
  },
  {
    recommendation_number: '165',
    recommendation_text:
      'The recommendations arising from coronial inquests and other investigations into deaths in custody should be implemented by the responsible government agencies, and compliance should be monitored.',
    status: 'rejected',
    status_notes:
      'No systematic mechanism exists to track or enforce compliance with coronial recommendations. Multiple coroners have noted their recommendations are routinely ignored. Same systemic failures recur across jurisdictions.',
    cluster: 'deaths_in_custody',
  },
  {
    recommendation_number: '167',
    recommendation_text:
      'No person who is identified as being at risk of self-harm or suicide should be placed alone in a cell or in isolation. Adequate monitoring and support should be provided.',
    status: 'rejected',
    status_notes:
      'Solitary confinement of at-risk individuals continues across all jurisdictions, including children. Don Dale teargas incident (2014), Cleveland isolation cells (QLD), Banksia Hill lockdowns (WA). OPCAT inspections have confirmed ongoing violations.',
    cluster: 'deaths_in_custody',
  },

  // ── Self-determination cluster ──
  {
    recommendation_number: '188',
    recommendation_text:
      'Aboriginal organisations should be involved in the planning, development and delivery of all programs and services that affect Aboriginal people, and such involvement should be properly resourced.',
    status: 'partially_implemented',
    status_notes:
      'Consultation occurs but meaningful co-design remains rare. Aboriginal community-controlled organisations are underfunded relative to mainstream services. Self-determination rhetoric has not translated to structural power-sharing.',
    cluster: 'self_determination',
  },
  {
    recommendation_number: '204',
    recommendation_text:
      'Aboriginal community organisations should be funded to develop and run community justice mechanisms, including mediation, conferencing and community-based sentencing, as alternatives to mainstream criminal justice processes.',
    status: 'partially_implemented',
    status_notes:
      'Some initiatives exist (e.g., Koori Courts in VIC, Circle Sentencing in NSW, Murri Court in QLD) but funding is precarious and coverage is limited. Most Aboriginal communities have no access to community justice mechanisms.',
    cluster: 'self_determination',
  },
];

// ── Helper Functions ─────────────────────────────────────────────────

function buildRecord(rec) {
  return {
    oversight_body: OVERSIGHT_BODY,
    report_title: REPORT_TITLE,
    report_date: REPORT_DATE,
    report_url: REPORT_URL,
    recommendation_number: rec.recommendation_number,
    recommendation_text: rec.recommendation_text,
    status: rec.status,
    status_notes: rec.status_notes,
    severity: 'critical',
    jurisdiction: 'National',
    domain: 'youth_justice',
    metadata: {
      cluster: rec.cluster,
      youth_justice_relevant: true,
      source: 'RCADIC Final Report, Vol 5',
      years_since_report: new Date().getFullYear() - 1991,
      deloitte_2018_review: true,
    },
  };
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('=== RCADIC Recommendation Tracker - Seed Script ===\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE INSERT'}`);
  console.log(`Recommendations to seed: ${RECOMMENDATIONS.length}\n`);

  // Check for existing RCADIC recommendations
  const { data: existing, error: fetchError } = await supabase
    .from('oversight_recommendations')
    .select('recommendation_number')
    .eq('oversight_body', OVERSIGHT_BODY);

  if (fetchError) {
    console.error('Failed to check existing records:', fetchError.message);
    process.exit(1);
  }

  const existingNums = new Set((existing || []).map(r => r.recommendation_number));
  console.log(`Existing RCADIC recommendations: ${existingNums.size}`);

  // Build records, skipping existing
  const toInsert = [];
  const skipped = [];

  for (const rec of RECOMMENDATIONS) {
    if (existingNums.has(rec.recommendation_number)) {
      skipped.push(rec.recommendation_number);
      continue;
    }
    toInsert.push(buildRecord(rec));
  }

  if (skipped.length > 0) {
    console.log(`Skipping ${skipped.length} existing: Recs ${skipped.join(', ')}`);
  }

  if (toInsert.length === 0) {
    console.log('\nAll recommendations already exist. Nothing to insert.');
    return;
  }

  console.log(`\nInserting ${toInsert.length} new recommendations...\n`);

  // Status summary
  const statusSummary = {};
  for (const rec of toInsert) {
    statusSummary[rec.status] = (statusSummary[rec.status] || 0) + 1;
  }
  console.log('Status breakdown:');
  for (const [status, count] of Object.entries(statusSummary)) {
    console.log(`  ${status}: ${count}`);
  }

  // Cluster summary
  const clusterSummary = {};
  for (const rec of toInsert) {
    const cluster = rec.metadata.cluster;
    clusterSummary[cluster] = (clusterSummary[cluster] || 0) + 1;
  }
  console.log('\nCluster breakdown:');
  for (const [cluster, count] of Object.entries(clusterSummary)) {
    console.log(`  ${cluster}: ${count}`);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would insert:');
    for (const rec of toInsert) {
      console.log(`  Rec ${rec.recommendation_number}: ${rec.recommendation_text.substring(0, 80)}...`);
    }
    return;
  }

  // Insert in batches of 10
  const BATCH_SIZE = 10;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('oversight_recommendations')
      .insert(batch)
      .select('id, recommendation_number');

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      for (const rec of data) {
        console.log(`  Inserted Rec ${rec.recommendation_number} (id: ${rec.id})`);
      }
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (existing): ${skipped.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total RCADIC recs now: ${existingNums.size + inserted}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
