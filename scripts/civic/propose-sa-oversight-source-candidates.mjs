#!/usr/bin/env node
/**
 * Propose SA oversight source rows for Adelaide launch review.
 *
 * Read-only. Checks whether official South Australian youth justice oversight
 * sources are already indexed in production, then writes a local source-review
 * artifact. It does not write to Supabase.
 *
 * Usage:
 *   node scripts/civic/propose-sa-oversight-source-candidates.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');

export const CANDIDATES = [
  {
    candidate_id: 'sa-gcyp-annual-report-2024-25',
    priority: 1,
    jurisdiction: 'SA',
    recommended_table: 'children_commissioner_reports',
    body_name: 'Guardian for Children and Young People / Training Centre Visitor / Youth Treatment Orders Visitor (SA)',
    report_year: '2024-25',
    report_title: 'Guardian & Visitors Annual Report 2024 to 2025',
    report_url: 'https://gcyp.sa.gov.au/wordpress/wp-content/uploads/2025/11/Guardian-for-Children-and-Young-People-Child-and-Young-Persons-Visitor-Training-Centre-Visitor-and-Youth-Treatment-Orders-Visitor-Annual-Report-2024-25-.pdf',
    published_date: '2025-09-30',
    yj_relevant: true,
    detention_mentioned: true,
    indigenous_overrep_mentioned: true,
    reason: 'Current consolidated statutory annual report with a Training Centre Visitor section, youth detention system issues, Aboriginal over-representation and 2024-25 detention population figures.',
    source_locator: 'PDF pp. 3, 8, 17-18, 60-64, 78-80.',
    source_review: [
      {
        theme: 'source_authority',
        status: 'verified',
        evidence: 'The report was presented on 30 September 2025 and covers the Guardian, Child and Young Person Visitor, Training Centre Visitor and Youth Treatment Orders Visitor statutory roles.',
        locator: 'PDF p. 3; ministerial transmittal letter and statutory role list.',
      },
      {
        theme: 'detention_oversight',
        status: 'verified',
        evidence: 'The Training Centre Visitor section says the office conducted 90 AYTC visits in 2024-25 and engaged with 86% of children and young people present during those visits.',
        locator: 'PDF p. 60; Training Centre Visitor, What We Heard and Saw.',
      },
      {
        theme: 'indigenous_overrep',
        status: 'verified',
        evidence: 'The report identifies Aboriginal children and young people as 53% of detained young people and 61% of AYTC admissions in 2024-25.',
        locator: 'PDF pp. 8 and 17-18; executive summary and detained-young-people profile.',
      },
      {
        theme: 'detention_conditions',
        status: 'verified',
        evidence: 'Children and young people raised isolation, segregation, room lock-ins, legal safeguards, family contact, culture, basic services and staff conduct as detention concerns.',
        locator: 'PDF pp. 62-64; Training Centre Visitor, What Children and Young People Told Us and Key Systemic Issues.',
      },
      {
        theme: 'isolation_practice',
        status: 'verified',
        evidence: 'The report recommends that isolation and lockdowns be tightly limited, used only as a last resort and not used as routine behaviour management.',
        locator: 'PDF p. 64; Key Systemic Issues in Youth Detention.',
      },
    ],
  },
  {
    candidate_id: 'sa-tcv-special-isolation-aytc-2025',
    priority: 1,
    jurisdiction: 'SA',
    recommended_table: 'children_commissioner_reports',
    body_name: 'Training Centre Visitor (SA)',
    report_year: '2025',
    report_title: 'Special Report into the Use of Isolation at the Adelaide Youth Training Centre',
    report_url: 'https://gcyp.sa.gov.au/wordpress/wp-content/uploads/2025/08/Special-Report-into-the-use-of-Isolation-at-the-Adelaide-Youth-Training-Centre.pdf',
    published_date: '2025-07-28',
    yj_relevant: true,
    detention_mentioned: true,
    indigenous_overrep_mentioned: true,
    reason: 'Current special report under the Youth Justice Administration Act examining isolation at AYTC, with explicit findings and oversight recommendations.',
    source_locator: 'PDF pp. 3, 5, 10-12, 27-28.',
    source_review: [
      {
        theme: 'source_authority',
        status: 'verified',
        evidence: 'The Training Centre Visitor provided this special report under section 18(3) of the Youth Justice Administration Act 2016 after reviewing isolation records, logs and operational practices at AYTC.',
        locator: 'PDF p. 3; ministerial transmittal letter.',
      },
      {
        theme: 'detention_conditions',
        status: 'verified',
        evidence: 'The executive summary says isolation is a common AYTC practice and children report reduced access to education, exercise and human connection while locked in rooms.',
        locator: 'PDF p. 5; Executive Summary.',
      },
      {
        theme: 'legal_framework',
        status: 'verified',
        evidence: 'The report identifies staff-ordered and resident-requested isolation practices and says some operational practices do not mirror the regulation 6 requirements for isolation.',
        locator: 'PDF pp. 10-12; Scope and legal/human-rights framework.',
      },
      {
        theme: 'indigenous_overrep',
        status: 'verified',
        evidence: 'The findings say isolation has disproportionate impact on children with disabilities, Aboriginal children and young people, and children with complex trauma histories.',
        locator: 'PDF p. 27; Findings.',
      },
      {
        theme: 'recommendations',
        status: 'verified',
        evidence: 'The recommendations call for legislative and policy reform, comprehensive record keeping, operational-order alignment, practice reform and child-centred accountability mechanisms.',
        locator: 'PDF p. 28; Recommendations.',
      },
    ],
  },
  {
    candidate_id: 'sa-tcv-special-avl-youth-court-2026',
    priority: 1,
    jurisdiction: 'SA',
    recommended_table: 'children_commissioner_reports',
    body_name: 'Training Centre Visitor (SA)',
    report_year: '2026',
    report_title: 'Special Report: Inquiry into the use of audiovisual link in Youth Court proceedings for children and young people at the Adelaide Youth Training Centre',
    report_url: 'https://gcyp.sa.gov.au/wordpress/wp-content/uploads/2026/02/16-Feb-2026-Training-Centre-Visitor-Special-Report.pdf',
    published_date: '2026-02-02',
    yj_relevant: true,
    detention_mentioned: true,
    indigenous_overrep_mentioned: true,
    reason: 'Recent Training Centre Visitor special report on Youth Court AVL use for children and young people detained at AYTC, including cultural-rights and Aboriginal-community stakeholder evidence.',
    source_locator: 'PDF pp. 1, 3, 16-17, 33, 36, 40-46.',
    source_review: [
      {
        theme: 'source_authority',
        status: 'verified',
        evidence: 'The Training Centre Visitor provided this public special report in February 2026 under section 18(3) of the Youth Justice Administration Act 2016.',
        locator: 'PDF pp. 1 and 3; title page and ministerial transmittal letter.',
      },
      {
        theme: 'court_access',
        status: 'verified',
        evidence: 'The report says in-custody Youth Court appearances had low in-person rates and that Youth Court AVL appearances increased from 5,942 in 2020-21 to 7,799 in 2024-25.',
        locator: 'PDF pp. 16-17; Use of AVL in Practice.',
      },
      {
        theme: 'indigenous_overrep',
        status: 'verified',
        evidence: 'The report records concerns from Aboriginal community-controlled organisations and peaks about cultural rights, cultural misinterpretation and access to family, community and cultural supports during court proceedings.',
        locator: 'PDF pp. 33 and 36; cultural impacts and ACCO/peak stakeholder evidence.',
      },
      {
        theme: 'detention_conditions',
        status: 'verified',
        evidence: 'The findings say current AVL practices risk normalising a lower standard of participation and protection for children and young people in detention without robust safeguards and genuine choice.',
        locator: 'PDF p. 40; Concluding observation on findings.',
      },
      {
        theme: 'recommendations',
        status: 'verified',
        evidence: 'The report makes nine recommendations covering court environments, support before/during/after court, informed choice, communication support, legislative guidance, private AVL settings and cross-agency consideration of AVL impacts.',
        locator: 'PDF pp. 40-46; Recommendations.',
      },
    ],
  },
  {
    candidate_id: 'sa-tcv-annual-report-2022-23',
    priority: 2,
    jurisdiction: 'SA',
    recommended_table: 'children_commissioner_reports',
    body_name: 'Training Centre Visitor (SA)',
    report_year: '2022-23',
    report_title: 'Training Centre Visitor 2022-2023 Annual Report',
    report_url: 'https://gcyp.sa.gov.au/wordpress/wp-content/uploads/2023/11/Training-Centre-Visitor-2022-2023-Annual-Report.pdf',
    published_date: '2023-11-01',
    yj_relevant: true,
    detention_mentioned: true,
    indigenous_overrep_mentioned: true,
    reason: 'Detailed TCV annual report covering Kurlana Tapa population, remand, disability, Aboriginal over-representation, guardianship overlap, education, isolation and complaints.',
    source_locator: 'PDF pp. 18-19, 55.',
  },
  {
    candidate_id: 'sa-dual-involved-final-report-2022',
    priority: 2,
    jurisdiction: 'SA',
    recommended_table: 'children_commissioner_reports',
    body_name: 'Guardian for Children and Young People (SA)',
    report_year: '2022',
    report_title: 'Final Report of the South Australian Dual Involved Project',
    report_url: 'https://gcyp.sa.gov.au/wordpress/wp-content/uploads/2022/07/OGCYP-Final-Report-of-the-South-Australian-Dual-Involved-Project.pdf',
    published_date: '2022-07-08',
    yj_relevant: true,
    detention_mentioned: true,
    indigenous_overrep_mentioned: true,
    reason: 'Systemic report on children in state care who experienced youth detention, including the care-to-custody pathway and Aboriginal over-representation.',
    source_locator: 'PDF; GCYP release dated 2022-07-08.',
  },
  {
    candidate_id: 'sa-npm-annual-report-2023-24',
    priority: 3,
    jurisdiction: 'SA',
    recommended_table: 'children_commissioner_reports',
    body_name: 'South Australian National Preventive Mechanism',
    report_year: '2023-24',
    report_title: 'Australian NPM Annual Report 2023-24',
    report_url: 'https://gcyp.sa.gov.au/wordpress/wp-content/uploads/2025/05/Australian-NPM-Annual-Report-2023-24.pdf',
    published_date: '2025-05-01',
    yj_relevant: true,
    detention_mentioned: true,
    indigenous_overrep_mentioned: false,
    reason: 'OPCAT/NPM context for places of detention. Lower priority because it is not SA-youth-justice-specific, but useful for rights and detention oversight framing.',
    source_locator: 'GCYP reports index, SA National Preventive Mechanism section.',
  },
];

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function parseArgs() {
  return {
    outputDir: path.resolve(PROJECT_ROOT, getArg('--output-dir') || OUTPUT_DIR),
  };
}

async function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  try {
    const content = await fs.readFile(envPath, 'utf8');
    for (const line of content.split('\n')) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
      const eq = line.indexOf('=');
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!env[key]) env[key] = value;
    }
  } catch {
    // Environment may already be present.
  }
  return env;
}

function tableEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

async function fetchExistingStatus(supabase) {
  const urls = CANDIDATES.map((row) => row.report_url);
  const [children, auditors, recommendations] = await Promise.all([
    supabase
      .from('children_commissioner_reports')
      .select('id,report_url,report_title,jurisdiction')
      .in('report_url', urls),
    supabase
      .from('auditor_general_audits')
      .select('id,url,title,jurisdiction')
      .in('url', urls),
    supabase
      .from('oversight_recommendations')
      .select('id,report_url,report_title,jurisdiction')
      .in('report_url', urls),
  ]);

  if (children.error) throw new Error(`children_commissioner_reports: ${children.error.message}`);
  if (auditors.error) throw new Error(`auditor_general_audits: ${auditors.error.message}`);
  if (recommendations.error) throw new Error(`oversight_recommendations: ${recommendations.error.message}`);

  const existingChildrenUrls = new Set((children.data || []).map((row) => row.report_url));
  const existingAuditorUrls = new Set((auditors.data || []).map((row) => row.url));
  const existingRecommendationUrls = new Set((recommendations.data || []).map((row) => row.report_url));

  return {
    children: children.data || [],
    auditors: auditors.data || [],
    recommendations: recommendations.data || [],
    candidates: CANDIDATES.map((candidate) => ({
      ...candidate,
      exists_in_children_commissioner_reports: existingChildrenUrls.has(candidate.report_url),
      exists_in_auditor_general_audits: existingAuditorUrls.has(candidate.report_url),
      exists_in_oversight_recommendations: existingRecommendationUrls.has(candidate.report_url),
    })),
  };
}

function buildPayload(existingStatus) {
  const candidates = existingStatus.candidates;
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      candidates: candidates.length,
      already_indexed_as_children_reports: candidates.filter((row) => row.exists_in_children_commissioner_reports).length,
      already_indexed_as_auditor_audits: candidates.filter((row) => row.exists_in_auditor_general_audits).length,
      already_indexed_as_recommendations: candidates.filter((row) => row.exists_in_oversight_recommendations).length,
      missing_children_report_rows: candidates.filter((row) => !row.exists_in_children_commissioner_reports).length,
      priority_1_missing: candidates.filter((row) => row.priority === 1 && !row.exists_in_children_commissioner_reports).length,
    },
    candidates,
    existing_rows: {
      children_commissioner_reports: existingStatus.children,
      auditor_general_audits: existingStatus.auditors,
      oversight_recommendations: existingStatus.recommendations,
    },
  };
}

function renderMarkdown(payload) {
  const lines = [
    '# SA Oversight Source Candidates',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    'Read-only source-review artifact. It does not write to Supabase. Use it to close the Adelaide launch gap where SA has recommendation rows but no broader children-commissioner or auditor evidence rows.',
    '',
    '## Summary',
    '',
    `- Candidate official sources: ${payload.summary.candidates}`,
    `- Already indexed as children commissioner reports: ${payload.summary.already_indexed_as_children_reports}`,
    `- Already indexed as auditor-general audits: ${payload.summary.already_indexed_as_auditor_audits}`,
    `- Already indexed as oversight recommendations: ${payload.summary.already_indexed_as_recommendations}`,
    `- Missing children commissioner/source rows: ${payload.summary.missing_children_report_rows}`,
    `- Priority 1 missing rows: ${payload.summary.priority_1_missing}`,
    '',
    '## Candidate Queue',
    '',
    '| Priority | Indexed | Recommended table | Report | Year | Flags | Locator | Why it matters |',
    '| ---: | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const row of payload.candidates) {
    const indexed = row.exists_in_children_commissioner_reports || row.exists_in_auditor_general_audits || row.exists_in_oversight_recommendations;
    const flags = [
      row.yj_relevant ? 'YJ' : null,
      row.detention_mentioned ? 'detention' : null,
      row.indigenous_overrep_mentioned ? 'Indigenous over-rep' : null,
    ].filter(Boolean).join(', ');
    lines.push(`| ${row.priority} | ${indexed ? 'yes' : 'no'} | ${tableEscape(row.recommended_table)} | [${tableEscape(row.report_title)}](${row.report_url}) | ${tableEscape(row.report_year)} | ${tableEscape(flags)} | ${tableEscape(row.source_locator)} | ${tableEscape(row.reason)} |`);
  }

  const reviewedCandidates = payload.candidates.filter((row) => row.source_review?.length);
  if (reviewedCandidates.length > 0) {
    lines.push('', '## Source Review', '');
    for (const row of reviewedCandidates) {
      lines.push(`### ${row.report_title}`);
      lines.push('');
      lines.push('| Theme | Status | Evidence | Locator |');
      lines.push('| --- | --- | --- | --- |');
      for (const review of row.source_review) {
        lines.push(`| ${tableEscape(review.theme)} | ${tableEscape(review.status)} | ${tableEscape(review.evidence)} | ${tableEscape(review.locator)} |`);
      }
      lines.push('');
    }
  }

  lines.push('', '## Operator Notes', '');
  lines.push('- Start with the three priority 1 rows: 2024-25 Guardian & Visitors Annual Report, 2025 isolation special report, and 2026 AVL special report.');
  lines.push('- Ingest source text into `children_commissioner_reports` first, then extract explicit recommendations into `oversight_recommendations` after source review.');
  lines.push('- Do not treat the broader SA oversight gap as closed until the state page shows at least one SA children/visitor evidence row in addition to the existing recommendation rows.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'sa-oversight-source-candidates.json');
  const mdPath = path.join(outputDir, 'sa-oversight-source-candidates.md');
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(payload));
  return { jsonPath, mdPath };
}

async function main() {
  const args = parseArgs();
  const env = await loadEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const payload = buildPayload(await fetchExistingStatus(supabase));
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log('SA oversight source candidates');
  console.log(`- Candidate sources: ${payload.summary.candidates}`);
  console.log(`- Already indexed as children reports: ${payload.summary.already_indexed_as_children_reports}`);
  console.log(`- Missing children/source rows: ${payload.summary.missing_children_report_rows}`);
  console.log(`- Priority 1 missing rows: ${payload.summary.priority_1_missing}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
