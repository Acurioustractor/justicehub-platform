#!/usr/bin/env node
/**
 * Propose SA oversight_recommendations rows from priority-1 SA oversight PDFs.
 *
 * Dry-run by default. Downloads official GCYP/Training Centre Visitor PDFs,
 * extracts text with pdftotext, deterministically captures explicit
 * recommendation sections, checks production for duplicates, and writes local
 * review artifacts.
 *
 * Usage:
 *   node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs
 *   node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs --apply --yes-production
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { CANDIDATES } from './propose-sa-oversight-source-candidates.mjs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');
const TMP_DIR = path.join('/private/tmp', 'justicehub-sa-oversight');
const DEFAULT_STATUS = 'pending';
const DEFAULT_DOMAIN = 'youth_justice';

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function parseArgs() {
  return {
    apply: process.argv.includes('--apply'),
    yesProduction: process.argv.includes('--yes-production'),
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

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanRecommendationText(value) {
  return compactText(value)
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\.\.+/g, '.')
    .replace(/\s+\d{1,3}$/g, '')
    .trim();
}

function normalizeAvlTitle(title, block) {
  const cleanTitle = compactText(title);
  if (/\bvia$/i.test(cleanTitle) && /^AVL\b/i.test(compactText(block))) {
    return `${cleanTitle} AVL`;
  }
  return cleanTitle;
}

function tableEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function severityForText(text) {
  const value = String(text || '').toLowerCase();
  if (/prohibit|legislative|statutory|must|mandate|required|rights|isolation|solitary/.test(value)) return 'critical';
  if (/establish|ensure|require|implement|develop|provide|upgrade|amend/.test(value)) return 'high';
  return 'medium';
}

function targetForRecommendation(title, fallback) {
  const value = String(title || '').toLowerCase();
  if (value.includes('court environment')) return 'Courts Administration Authority / Department of Human Services';
  if (value.includes('support before') || value.includes('support before, during')) return 'Courts Administration Authority / Department of Human Services';
  if (value.includes('choice') || value.includes('inclusion')) return 'Youth Court / Courts Administration Authority / Department of Human Services';
  if (value.includes('legal representatives') || value.includes('participation')) return 'Legal representatives / Youth Court / Department of Human Services';
  if (value.includes('communication')) return 'Youth Court / legal profession / Department of Human Services';
  if (value.includes('legislation')) return 'South Australian Government / Attorney-General / Courts Administration Authority';
  if (value.includes('avl settings')) return 'Department of Human Services';
  if (value.includes('aytc staff')) return 'Department of Human Services';
  if (value.includes('cross-agency')) return 'South Australian Government / Courts Administration Authority / Department of Human Services';
  return fallback;
}

async function downloadPdf(candidate) {
  await fs.mkdir(TMP_DIR, { recursive: true });
  const pdfPath = path.join(TMP_DIR, `${candidate.candidate_id}.pdf`);
  try {
    await fs.access(pdfPath);
    return pdfPath;
  } catch {
    // Download below.
  }
  const res = await fetch(candidate.report_url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'JusticeHubMapBot/1.0 (+https://justicehub.com.au)',
      Accept: 'application/pdf,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`${candidate.candidate_id}: HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.slice(0, 4).toString() !== '%PDF') {
    throw new Error(`${candidate.candidate_id}: response was not a PDF`);
  }
  await fs.writeFile(pdfPath, buffer);
  return pdfPath;
}

async function extractPdfText(candidate) {
  const pdfPath = await downloadPdf(candidate);
  const textPath = path.join(TMP_DIR, `${candidate.candidate_id}.txt`);
  try {
    return await fs.readFile(textPath, 'utf8');
  } catch {
    await execFileAsync('pdftotext', ['-layout', pdfPath, textPath], { timeout: 60000 });
    return fs.readFile(textPath, 'utf8');
  }
}

function sectionAfter(text, marker) {
  const index = text.search(marker);
  if (index < 0) return '';
  return text.slice(index);
}

function stripLinkedTo(block) {
  return block.replace(/\s+Linked to:[\s\S]*$/i, '').trim();
}

function extractMethod(block) {
  const match = block.match(/Method:\s*([\s\S]*?)(?=\n\s*Linked to:|\n\s*Recommendation\s+\d+|\n\s*Rec\s+\d+:|\n\s*16\.1|\n\s*These reforms|$)/i);
  return match ? compactText(match[1]) : '';
}

function extractRationale(block) {
  const match = block.match(/Rationale:\s*([\s\S]*?)(?=\n\s*Method:|\n\s*Linked to:|\n\s*Recommendation\s+\d+|\n\s*Rec\s+\d+:|$)/i);
  return match ? compactText(match[1]) : '';
}

function sourceCandidateById(id) {
  return CANDIDATES.find((candidate) => candidate.candidate_id === id);
}

function recordFromCandidate({
  candidate,
  number,
  title,
  text,
  targetDepartment,
  sourceLocator,
  extractionMethod = 'deterministic_pdftotext_recommendation_section',
  sourceReviewStatus = 'requires_operator_review',
  qualityFlags = [],
}) {
  const recommendationText = cleanRecommendationText(text).slice(0, 2000);
  return {
    candidate_id: [
      candidate.candidate_id,
      number || title,
      recommendationText.slice(0, 80),
    ].join(':').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    source_candidate_id: candidate.candidate_id,
    review_note: 'Review source PDF before applying to production.',
    source_locator: sourceLocator || candidate.source_locator,
    source_review_status: sourceReviewStatus,
    quality_flags: qualityFlags,
    record: {
      jurisdiction: 'SA',
      domain: DEFAULT_DOMAIN,
      oversight_body: candidate.body_name,
      report_title: candidate.report_title,
      report_date: candidate.published_date,
      report_url: candidate.report_url,
      recommendation_number: number,
      recommendation_text: recommendationText,
      status: DEFAULT_STATUS,
      status_notes: null,
      target_department: targetDepartment,
      severity: severityForText(`${title} ${recommendationText}`),
      metadata: {
        proposed_from: 'scripts/civic/propose-sa-oversight-recommendation-candidates.mjs',
        source_candidate_id: candidate.candidate_id,
        source_locator: sourceLocator || candidate.source_locator,
        source_review_status: sourceReviewStatus,
        quality_flags: qualityFlags,
        source_review: candidate.source_review || [],
        extraction_method: extractionMethod,
        generated_at: new Date().toISOString(),
      },
    },
  };
}

function extractIsolationRecommendations(text) {
  const candidate = sourceCandidateById('sa-tcv-special-isolation-aytc-2025');
  const section = sectionAfter(text, /12\.\s+Recommendations/i);
  const results = [];
  const recRegex = /Rec\s+(\d+):\s+([\s\S]*?)(?=\n\s+Rec\s+\d+:|\n\s+These reforms|\f|$)/gi;
  let match;
  while ((match = recRegex.exec(section)) !== null) {
    const number = `Rec ${match[1]}`;
    const block = match[2];
    const title = compactText(block.split(/Rationale:/i)[0]);
    const rationale = extractRationale(block);
    const method = extractMethod(block);
    const textBody = `${title}. ${rationale ? `Rationale: ${rationale}. ` : ''}${method ? `Method: ${method}` : ''}`;
    results.push(recordFromCandidate({
      candidate,
      number,
      title,
      text: textBody,
      targetDepartment: 'South Australian Government / Department of Human Services',
      sourceLocator: 'Section 12 Recommendations, p. 28',
      sourceReviewStatus: 'explicit_numbered_recommendation',
      qualityFlags: ['explicit_numbered_recommendation', 'pdftotext_extracted'],
    }));
  }
  return results;
}

function extractAvlRecommendations(text) {
  const candidate = sourceCandidateById('sa-tcv-special-avl-youth-court-2026');
  const section = sectionAfter(text, /16\.\s+Recommendations/i);
  const results = [];
  const recRegex = /Recommendation\s+(\d+)\s+([^\n]+)([\s\S]*?)(?=\n\s*Recommendation\s+\d+|\n\s*16\.1|\f|$)/gi;
  let match;
  while ((match = recRegex.exec(section)) !== null) {
    const number = `Recommendation ${match[1]}`;
    const block = match[3];
    const title = normalizeAvlTitle(match[2], block);
    const rationale = extractRationale(block);
    const method = extractMethod(block);
    const textBody = `${title}. ${rationale ? `Rationale: ${rationale}. ` : ''}${method ? `Method: ${method}` : stripLinkedTo(block)}`;
    results.push(recordFromCandidate({
      candidate,
      number,
      title,
      text: textBody,
      targetDepartment: targetForRecommendation(title, 'South Australian Government / Department of Human Services / Courts Administration Authority'),
      sourceLocator: 'Section 16 Recommendations, pp. 40-46',
      sourceReviewStatus: 'explicit_numbered_recommendation',
      qualityFlags: ['explicit_numbered_recommendation', 'pdftotext_extracted'],
    }));
  }
  return results;
}

function extractAnnualReportRecommendations(text) {
  const candidate = sourceCandidateById('sa-gcyp-annual-report-2024-25');
  const normalizedText = compactText(text);
  const reviewedRecommendations = [
    {
      number: 'Annual-youth-detention-isolation',
      title: 'Limit isolation and lockdowns in youth detention',
      requiredPattern: /isolation[\s\S]{0,250}?lockdowns be tightly limited[\s\S]{0,250}?routine behaviour management/i,
      text: 'Limit isolation and lockdowns in youth detention. The report states that isolation and lockdowns should be tightly limited, used only as a last resort, and not used as routine behaviour management. It also calls for enforceable standards that prohibit solitary confinement of children and young people except in rare emergencies.',
      sourceLocator: 'PDF p. 64; Key Systemic Issues in Youth Detention.',
      targetDepartment: 'Department of Human Services',
    },
    {
      number: 'Annual-cultural-input',
      title: 'Integrate cultural input into incident workflows',
      requiredPattern: /cultural input be explicitly integrated into incident workflows/i,
      text: 'Integrate cultural input into incident workflows. The report recommends explicitly including cultural input in incident workflows, including space for cultural workers to contribute to records as part of a child-centred, rights-based response.',
      sourceLocator: 'PDF p. 80; Training Centre Visitor incident reporting and cultural input discussion.',
      targetDepartment: 'Department of Human Services',
    },
  ];

  return reviewedRecommendations.flatMap((item) => {
    if (!item.requiredPattern.test(normalizedText)) return [];
    return [recordFromCandidate({
      candidate,
      number: item.number,
      title: item.title,
      text: item.text,
      targetDepartment: item.targetDepartment,
      sourceLocator: item.sourceLocator,
      extractionMethod: 'manual_source_reviewed_annual_report_recommendation',
      sourceReviewStatus: 'source_reviewed_non_numbered_recommendation',
      qualityFlags: ['source_reviewed_summary', 'non_numbered_annual_report_recommendation'],
    })];
  });
}

async function buildCandidates() {
  const priorityCandidates = CANDIDATES.filter((candidate) => candidate.priority === 1);
  const texts = new Map();
  for (const candidate of priorityCandidates) {
    // eslint-disable-next-line no-await-in-loop
    texts.set(candidate.candidate_id, await extractPdfText(candidate));
  }
  return [
    ...extractAnnualReportRecommendations(texts.get('sa-gcyp-annual-report-2024-25') || ''),
    ...extractIsolationRecommendations(texts.get('sa-tcv-special-isolation-aytc-2025') || ''),
    ...extractAvlRecommendations(texts.get('sa-tcv-special-avl-youth-court-2026') || ''),
  ];
}

function recommendationKey(row) {
  return [
    row.jurisdiction,
    compactText(row.oversight_body).toLowerCase(),
    compactText(row.report_title).toLowerCase(),
    compactText(row.recommendation_text).toLowerCase(),
  ].join('|');
}

async function fetchExistingKeys(supabase) {
  const urls = CANDIDATES.filter((candidate) => candidate.priority === 1).map((candidate) => candidate.report_url);
  const { data, error } = await supabase
    .from('oversight_recommendations')
    .select('jurisdiction,oversight_body,report_title,recommendation_text,report_url')
    .in('report_url', urls)
    .limit(1000);
  if (error) throw new Error(`oversight_recommendations: ${error.message}`);
  return new Set((data || []).map(recommendationKey));
}

function markExisting(candidates, existingKeys) {
  return candidates.map((candidate) => ({
    ...candidate,
    already_indexed: existingKeys.has(recommendationKey(candidate.record)),
  }));
}

async function applyRows(supabase, candidates) {
  const records = candidates.filter((candidate) => !candidate.already_indexed).map((candidate) => candidate.record);
  if (records.length === 0) return [];
  const { data, error } = await supabase
    .from('oversight_recommendations')
    .insert(records)
    .select('id,jurisdiction,report_title,recommendation_number');
  if (error) throw new Error(`oversight_recommendations insert: ${error.message}`);
  return data || [];
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts, ([key, count]) => ({ key, count })).sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

function buildPayload({ candidates, insertedRows, mode }) {
  const pending = candidates.filter((candidate) => !candidate.already_indexed);
  return {
    generatedAt: new Date().toISOString(),
    mode,
    summary: {
      candidates: candidates.length,
      already_indexed: candidates.length - pending.length,
      pending_review: pending.length,
      inserted_rows: insertedRows.length,
      by_source: countBy(candidates, (candidate) => candidate.source_candidate_id),
      by_review_status: countBy(candidates, (candidate) => candidate.source_review_status),
    },
    candidates,
    inserted_rows: insertedRows,
  };
}

function renderMarkdown(payload) {
  const lines = [
    '# SA Oversight Recommendation Candidates',
    '',
    `Generated: ${payload.generatedAt}`,
    `Mode: ${payload.mode}`,
    '',
    'Dry-run review artifact for explicit SA oversight recommendations extracted from priority-1 GCYP / Training Centre Visitor PDFs. Production writes require source review and explicit approval.',
    '',
    '## Summary',
    '',
    `- Recommendation candidates: ${payload.summary.candidates}`,
    `- Already indexed: ${payload.summary.already_indexed}`,
    `- Pending review: ${payload.summary.pending_review}`,
    `- Inserted rows: ${payload.summary.inserted_rows}`,
    '',
    '## Source Counts',
    '',
    '| Source candidate | Count |',
    '| --- | ---: |',
  ];

  for (const row of payload.summary.by_source) {
    lines.push(`| ${tableEscape(row.key)} | ${row.count} |`);
  }

  lines.push('', '## Review Status Counts', '');
  lines.push('| Review status | Count |');
  lines.push('| --- | ---: |');
  for (const row of payload.summary.by_review_status) {
    lines.push(`| ${tableEscape(row.key)} | ${row.count} |`);
  }

  lines.push('', '## Candidate Queue', '');
  lines.push('| Indexed | Number | Report | Target | Severity | Review status | Locator | Recommendation preview |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const candidate of payload.candidates) {
    const row = candidate.record;
    lines.push(`| ${candidate.already_indexed ? 'yes' : 'no'} | ${tableEscape(row.recommendation_number || '')} | [${tableEscape(row.report_title)}](${row.report_url}) | ${tableEscape(row.target_department || '')} | ${tableEscape(row.severity)} | ${tableEscape(candidate.source_review_status)} | ${tableEscape(candidate.source_locator)} | ${tableEscape(row.recommendation_text).slice(0, 220)} |`);
  }

  lines.push('', '## Full Review Text', '');
  for (const candidate of payload.candidates) {
    const row = candidate.record;
    lines.push(`### ${row.recommendation_number || candidate.candidate_id}`);
    lines.push('');
    lines.push(`- Report: [${row.report_title}](${row.report_url})`);
    lines.push(`- Target: ${row.target_department || 'unknown'}`);
    lines.push(`- Severity: ${row.severity}`);
    lines.push(`- Review status: ${candidate.source_review_status}`);
    lines.push(`- Locator: ${candidate.source_locator}`);
    lines.push(`- Quality flags: ${candidate.quality_flags.join(', ') || 'none'}`);
    lines.push('');
    lines.push(row.recommendation_text);
    lines.push('');
  }

  lines.push('', '## Apply Command', '');
  lines.push('Production write requires explicit approval:');
  lines.push('');
  lines.push('```bash');
  lines.push('node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs --apply --yes-production');
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'sa-oversight-recommendation-candidates.json');
  const mdPath = path.join(outputDir, 'sa-oversight-recommendation-candidates.md');
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(payload));
  return { jsonPath, mdPath };
}

async function main() {
  const args = parseArgs();
  if (args.apply && !args.yesProduction) {
    throw new Error('Refusing production write without --yes-production.');
  }

  const env = await loadEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const candidates = markExisting(await buildCandidates(), await fetchExistingKeys(supabase));
  const insertedRows = args.apply ? await applyRows(supabase, candidates) : [];
  const payload = buildPayload({
    candidates: args.apply ? markExisting(candidates, new Set(candidates.map((candidate) => recommendationKey(candidate.record)))) : candidates,
    insertedRows,
    mode: args.apply ? 'apply' : 'dry-run',
  });
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log('SA oversight recommendation candidates');
  console.log(`- Mode: ${payload.mode}`);
  console.log(`- Candidates: ${payload.summary.candidates}`);
  console.log(`- Already indexed: ${payload.summary.already_indexed}`);
  console.log(`- Pending review: ${payload.summary.pending_review}`);
  console.log(`- Inserted rows: ${payload.summary.inserted_rows}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
