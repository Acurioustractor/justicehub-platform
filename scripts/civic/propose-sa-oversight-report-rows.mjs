#!/usr/bin/env node
/**
 * Propose children_commissioner_reports rows for SA youth justice oversight.
 *
 * Dry-run by default. Downloads official GCYP/Training Centre Visitor PDFs,
 * extracts text with pdftotext, builds deterministic source-evidence rows, and
 * checks production for existing (jurisdiction, report_year) collisions.
 *
 * This deliberately does not infer recommendations. It stores recommendation
 * extraction as a follow-up source-review task so only explicit report language
 * can become oversight_recommendations later.
 *
 * Usage:
 *   node scripts/civic/propose-sa-oversight-report-rows.mjs
 *   node scripts/civic/propose-sa-oversight-report-rows.mjs --only priority1
 *   node scripts/civic/propose-sa-oversight-report-rows.mjs --apply --yes-production
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
const RAW_TEXT_LIMIT = 500000;

const FINDING_PATTERNS = [
  { theme: 'detention', pattern: /Kurlana Tapa|Adelaide Youth Training Centre|training centre|youth detention|custodial|isolation|audiovisual link|AVL/i },
  { theme: 'indigenous_overrep', pattern: /Aboriginal|First Nations|over-represent|over represent|cultural/i },
  { theme: 'child_protection', pattern: /dual involved|guardianship|care and protection|state care|child protection/i },
  { theme: 'education', pattern: /education|school|learning|vocational/i },
  { theme: 'disability', pattern: /disability|NDIS|neurodevelopment|FASD|mental health/i },
];
const LOW_VALUE_SNIPPET_PATTERNS = [
  /annual report prepared/i,
  /preliminary notes/i,
  /table of contents/i,
  /suggested citation/i,
  /copyright/i,
  /minister/i,
  /gpo box/i,
];

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function parseArgs() {
  const only = getArg('--only');
  return {
    apply: process.argv.includes('--apply'),
    yesProduction: process.argv.includes('--yes-production'),
    only,
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

function selectedCandidates(only) {
  if (!only) return CANDIDATES;
  if (only === 'priority1') return CANDIDATES.filter((row) => row.priority === 1);
  const wanted = new Set(only.split(',').map((item) => item.trim()).filter(Boolean));
  return CANDIDATES.filter((row) => wanted.has(row.candidate_id));
}

function tableEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function snippetScore(snippet, index) {
  const lower = snippet.toLowerCase();
  let score = Math.min(index / 2000, 20);
  if (lower.includes('children and young people')) score += 20;
  if (lower.includes('kurlana tapa') || lower.includes('adelaide youth training centre') || lower.includes('aytc')) score += 18;
  if (lower.includes('isolation') || lower.includes('audiovisual') || lower.includes('avl')) score += 15;
  if (lower.includes('aboriginal') || lower.includes('first nations')) score += 12;
  if (lower.includes('recommend')) score += 10;
  if (lower.includes('guardian & visitors')) score -= 8;
  if (LOW_VALUE_SNIPPET_PATTERNS.some((pattern) => pattern.test(snippet))) score -= 35;
  return score;
}

function snippetAround(text, pattern, radius = 360) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const search = new RegExp(pattern.source, flags);
  let best = null;
  let match;
  while ((match = search.exec(text)) !== null) {
    const index = match.index ?? 0;
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + match[0].length + radius);
    const snippet = compactText(text.slice(start, end));
    const score = snippetScore(snippet, index);
    if (!best || score > best.score) best = { snippet, score };
    if (search.lastIndex === match.index) search.lastIndex += 1;
  }
  return best?.snippet || null;
}

function buildFindings(candidate, text) {
  const findings = [];
  for (const item of FINDING_PATTERNS) {
    const snippet = snippetAround(text, item.pattern);
    if (!snippet) continue;
    findings.push({
      theme: item.theme,
      finding: snippet.slice(0, 900),
      page_ref: null,
      source: 'deterministic_keyword_snippet',
    });
  }

  if (findings.length === 0) {
    findings.push({
      theme: 'detention',
      finding: candidate.reason,
      page_ref: null,
      source: 'candidate_metadata',
    });
  }

  return findings.slice(0, 8);
}

function buildSourceReviewFindings(candidate) {
  return (candidate.source_review || [])
    .filter((row) => row.status === 'verified')
    .map((row) => ({
      theme: row.theme,
      finding: row.evidence,
      page_ref: row.locator,
      source: 'human_source_review',
    }));
}

async function downloadPdf(candidate) {
  await fs.mkdir(TMP_DIR, { recursive: true });
  const pdfPath = path.join(TMP_DIR, `${candidate.candidate_id}.pdf`);
  const res = await fetch(candidate.report_url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'JusticeHubMapBot/1.0 (+https://justicehub.com.au)',
      Accept: 'application/pdf,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`${candidate.candidate_id}: HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!contentType.toLowerCase().includes('pdf') && buffer.slice(0, 4).toString() !== '%PDF') {
    throw new Error(`${candidate.candidate_id}: response was not a PDF (${contentType || 'unknown content-type'})`);
  }
  await fs.writeFile(pdfPath, buffer);
  return { pdfPath, bytes: buffer.length, contentType };
}

async function extractPdfText(pdfPath, candidateId) {
  const textPath = path.join(TMP_DIR, `${candidateId}.txt`);
  await execFileAsync('pdftotext', ['-layout', pdfPath, textPath], { timeout: 60000 });
  const text = await fs.readFile(textPath, 'utf8');
  const pageCount = (text.match(/\f/g) || []).length || null;
  return { text, pageCount };
}

async function buildCandidateRow(candidate) {
  const download = await downloadPdf(candidate);
  const extraction = await extractPdfText(download.pdfPath, candidate.candidate_id);
  const rawText = extraction.text.slice(0, RAW_TEXT_LIMIT);
  const keyFindings = [
    ...buildSourceReviewFindings(candidate),
    ...buildFindings(candidate, rawText),
  ].slice(0, 10);
  return {
    candidate,
    download: {
      bytes: download.bytes,
      content_type: download.contentType,
    },
    text_stats: {
      raw_text_chars: extraction.text.length,
      stored_text_chars: rawText.length,
      page_count: extraction.pageCount,
      key_findings: keyFindings.length,
    },
    record: {
      jurisdiction: candidate.jurisdiction,
      body_name: candidate.body_name,
      report_year: candidate.report_year,
      report_url: candidate.report_url,
      report_title: candidate.report_title,
      page_count: extraction.pageCount,
      published_date: candidate.published_date,
      raw_text: rawText,
      key_findings: keyFindings,
      recommendations: [],
      yj_relevant: candidate.yj_relevant,
      raise_age_mentioned: false,
      detention_mentioned: candidate.detention_mentioned,
      indigenous_overrep_mentioned: candidate.indigenous_overrep_mentioned,
      metadata: {
        source_format: 'pdf',
        proposed_from: 'scripts/civic/propose-sa-oversight-report-rows.mjs',
        source_candidate_id: candidate.candidate_id,
        source_locator: candidate.source_locator,
        source_review: candidate.source_review || [],
        extraction_method: 'pdftotext_keyword_snippets_no_llm',
        recommendation_extraction_required: true,
        pdf_bytes: download.bytes,
        raw_text_chars: extraction.text.length,
      },
      llm_model: 'none_deterministic_pdftotext',
    },
  };
}

async function fetchExistingKeys(supabase) {
  const { data, error } = await supabase
    .from('children_commissioner_reports')
    .select('id,jurisdiction,report_year,report_url,report_title')
    .eq('jurisdiction', 'SA')
    .limit(200);
  if (error) throw new Error(`children_commissioner_reports: ${error.message}`);
  return {
    rows: data || [],
    byYear: new Set((data || []).map((row) => `${row.jurisdiction}::${row.report_year}`)),
    byUrl: new Set((data || []).map((row) => row.report_url).filter(Boolean)),
  };
}

function markExisting(candidateRows, existing) {
  return candidateRows.map((row) => {
    const key = `${row.record.jurisdiction}::${row.record.report_year}`;
    return {
      ...row,
      exists_by_year: existing.byYear.has(key),
      exists_by_url: existing.byUrl.has(row.record.report_url),
    };
  });
}

async function applyRows(supabase, candidateRows) {
  const records = candidateRows
    .filter((row) => !row.exists_by_year && !row.exists_by_url)
    .map((row) => row.record);
  if (records.length === 0) return [];
  const { data, error } = await supabase
    .from('children_commissioner_reports')
    .insert(records)
    .select('id,jurisdiction,report_year,report_title');
  if (error) throw new Error(`children_commissioner_reports insert: ${error.message}`);
  return data || [];
}

function buildPayload({ candidateRows, existingRows, insertedRows, mode }) {
  const missingRows = candidateRows.filter((row) => !row.exists_by_year && !row.exists_by_url);
  return {
    generatedAt: new Date().toISOString(),
    mode,
    summary: {
      candidate_rows: candidateRows.length,
      existing_sa_children_rows: existingRows.length,
      already_present: candidateRows.length - missingRows.length,
      missing_rows: missingRows.length,
      priority_1_missing: missingRows.filter((row) => row.candidate.priority === 1).length,
      inserted_rows: insertedRows.length,
    },
    candidate_rows: candidateRows.map((row) => ({
      candidate: row.candidate,
      source_review: row.candidate.source_review || [],
      download: row.download,
      text_stats: row.text_stats,
      exists_by_year: row.exists_by_year,
      exists_by_url: row.exists_by_url,
      record: {
        ...row.record,
        raw_text: `[omitted from review JSON: ${row.record.raw_text.length} chars stored in apply payload]`,
      },
      key_findings_preview: row.record.key_findings,
    })),
    existing_rows: existingRows,
    inserted_rows: insertedRows,
  };
}

function renderMarkdown(payload) {
  const lines = [
    '# SA Oversight Report Row Candidates',
    '',
    `Generated: ${payload.generatedAt}`,
    `Mode: ${payload.mode}`,
    '',
    'Dry-run artifact for actual `children_commissioner_reports` rows. It extracts PDF text locally with `pdftotext`; recommendations are intentionally left empty until source review confirms explicit recommendation wording.',
    '',
    '## Summary',
    '',
    `- Candidate rows: ${payload.summary.candidate_rows}`,
    `- Existing SA children/visitor rows: ${payload.summary.existing_sa_children_rows}`,
    `- Already present: ${payload.summary.already_present}`,
    `- Missing rows: ${payload.summary.missing_rows}`,
    `- Priority 1 missing rows: ${payload.summary.priority_1_missing}`,
    `- Inserted rows: ${payload.summary.inserted_rows}`,
    '',
    '## Candidate Rows',
    '',
    '| Priority | Exists | Report year | Report | Locator | Text chars | Findings | Treatment |',
    '| ---: | --- | --- | --- | --- | ---: | ---: | --- |',
  ];

  for (const row of payload.candidate_rows) {
    const exists = row.exists_by_year || row.exists_by_url;
    lines.push(`| ${row.candidate.priority} | ${exists ? 'yes' : 'no'} | ${tableEscape(row.candidate.report_year)} | [${tableEscape(row.candidate.report_title)}](${row.candidate.report_url}) | ${tableEscape(row.candidate.source_locator)} | ${row.text_stats.raw_text_chars} | ${row.text_stats.key_findings} | ${exists ? 'skip' : 'candidate for guarded apply'} |`);
  }

  const reviewedRows = payload.candidate_rows.filter((row) => row.source_review?.length);
  if (reviewedRows.length > 0) {
    lines.push('', '## Source Review', '');
    for (const row of reviewedRows) {
      lines.push(`### ${row.candidate.report_title}`);
      lines.push('');
      lines.push('| Theme | Status | Evidence | Locator |');
      lines.push('| --- | --- | --- | --- |');
      for (const review of row.source_review) {
        lines.push(`| ${tableEscape(review.theme)} | ${tableEscape(review.status)} | ${tableEscape(review.evidence)} | ${tableEscape(review.locator)} |`);
      }
      lines.push('');
    }
  }

  lines.push('', '## Key Finding Previews', '');
  for (const row of payload.candidate_rows) {
    lines.push(`### ${row.candidate.report_title}`);
    lines.push('');
    for (const finding of row.key_findings_preview.slice(0, 4)) {
      lines.push(`- **${finding.theme}**: ${tableEscape(finding.finding).slice(0, 420)}`);
    }
    lines.push('');
  }

  lines.push('## Apply Command', '');
  lines.push('Production write requires explicit approval:');
  lines.push('');
  lines.push('```bash');
  lines.push('node scripts/civic/propose-sa-oversight-report-rows.mjs --apply --yes-production');
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'sa-oversight-report-rows.json');
  const mdPath = path.join(outputDir, 'sa-oversight-report-rows.md');
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

  const existing = await fetchExistingKeys(supabase);
  const rows = [];
  for (const candidate of selectedCandidates(args.only)) {
    // eslint-disable-next-line no-await-in-loop
    rows.push(await buildCandidateRow(candidate));
  }
  const markedRows = markExisting(rows, existing);
  const insertedRows = args.apply ? await applyRows(supabase, markedRows) : [];
  const payload = buildPayload({
    candidateRows: markedRows,
    existingRows: existing.rows,
    insertedRows,
    mode: args.apply ? 'apply' : 'dry-run',
  });
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log('SA oversight report row candidates');
  console.log(`- Mode: ${payload.mode}`);
  console.log(`- Candidate rows: ${payload.summary.candidate_rows}`);
  console.log(`- Missing rows: ${payload.summary.missing_rows}`);
  console.log(`- Priority 1 missing rows: ${payload.summary.priority_1_missing}`);
  console.log(`- Inserted rows: ${payload.summary.inserted_rows}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
