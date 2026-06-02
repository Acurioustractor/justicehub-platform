#!/usr/bin/env node
/**
 * Propose oversight_recommendations rows from already-indexed oversight evidence.
 *
 * This script does not call an LLM. It reads structured JSON already stored in
 * children_commissioner_reports.recommendations and
 * auditor_general_audits.key_recommendations, converts likely youth-justice
 * recommendations into review candidates, and writes review artifacts.
 *
 * Dry-run by default. Production writes require both --apply and
 * --yes-production so this cannot be triggered accidentally.
 *
 * Usage:
 *   node scripts/civic/propose-oversight-recommendation-candidates.mjs
 *   node scripts/civic/propose-oversight-recommendation-candidates.mjs --jurisdiction ACT,TAS,WA
 *   node scripts/civic/propose-oversight-recommendation-candidates.mjs --apply --yes-production
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');
const DEFAULT_JURISDICTIONS = ['ACT', 'TAS', 'WA'];
const DEFAULT_DOMAIN = 'youth_justice';
const DEFAULT_STATUS = 'pending';

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function parseArgs() {
  const jurisdictionArg = getArg('--jurisdiction');
  const jurisdictions = jurisdictionArg
    ? jurisdictionArg.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean)
    : DEFAULT_JURISDICTIONS;
  return {
    apply: process.argv.includes('--apply'),
    yesProduction: process.argv.includes('--yes-production'),
    outputDir: path.resolve(PROJECT_ROOT, getArg('--output-dir') || OUTPUT_DIR),
    jurisdictions,
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
    // Environment variables may already be injected by the caller.
  }
  return env;
}

function normalizeJurisdiction(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'unknown';
  if (raw.toLowerCase() === 'national') return 'National';
  return raw.toUpperCase();
}

function slugPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unknown';
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanRecommendationText(value) {
  return normalizeText(value)
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\.\.+/g, '.')
    .trim();
}

function parseReportDate(yearOrDate) {
  const value = String(yearOrDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const year = value.match(/\b(20\d{2}|19\d{2})\b/)?.[1];
  return year ? `${year}-01-01` : null;
}

function severityForText(text) {
  const value = String(text || '').toLowerCase();
  if (/\b(must|abolish|urgent|immediate(ly)?|abolition|repeal)\b/.test(value)) return 'critical';
  if (/\b(should|require|introduce|enact|legislate|amend|expand|increase|improve)\b/.test(value)) return 'high';
  return 'medium';
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sourceLocator({ sourceKind, sourceRow, rec }) {
  const pageRef = rec.page_ref ?? rec.page ?? null;
  const sourceRecord = `${sourceKind === 'children' ? 'children_commissioner_reports' : 'auditor_general_audits'}:${sourceRow.id}`;
  if (pageRef != null && pageRef !== '') {
    return `${sourceRecord}; page/ref ${pageRef}`;
  }
  return `${sourceRecord}; structured recommendation JSON; page/ref not supplied`;
}

function qualityFlags({ sourceKind, rec }) {
  const flags = [`source_kind:${sourceKind}`];
  if (rec.page_ref != null && rec.page_ref !== '') flags.push('has_page_ref');
  else flags.push('missing_page_ref');
  if (rec.number != null && normalizeText(rec.number)) flags.push('numbered_recommendation');
  else flags.push('unnumbered_recommendation');
  if (rec.yj_relevant === true) flags.push('yj_relevant');
  if (rec.raise_age_relevant === true) flags.push('raise_age_relevant');
  if (rec.indigenous_overrep === true) flags.push('indigenous_overrep');
  return flags;
}

function sourceReviewStatus(flags) {
  if (flags.includes('has_page_ref')) return 'structured_source_with_page_ref';
  return 'structured_source_without_page_ref';
}

function isChildrenRecommendationCandidate(rec) {
  if (!rec || typeof rec !== 'object') return false;
  const text = normalizeText(rec.text);
  if (text.length < 20) return false;
  return Boolean(rec.yj_relevant || rec.raise_age_relevant || rec.indigenous_overrep);
}

function isAuditorRecommendationCandidate(rec) {
  if (!rec || typeof rec !== 'object') return false;
  return normalizeText(rec.text).length >= 20;
}

function candidateRecord({ sourceKind, sourceRow, rec, index }) {
  const jurisdiction = normalizeJurisdiction(sourceRow.jurisdiction);
  const text = cleanRecommendationText(rec.text).slice(0, 2000);
  const title =
    sourceRow.report_title ||
    sourceRow.title ||
    `${sourceRow.body_name || 'Oversight source'} ${sourceRow.report_year || ''}`.trim() ||
    'Untitled oversight source';
  const reportDate = sourceKind === 'children'
    ? parseReportDate(sourceRow.published_date || sourceRow.report_year)
    : parseReportDate(sourceRow.publication_date || sourceRow.tabled_date);
  const reportUrl = sourceKind === 'children' ? sourceRow.report_url : sourceRow.url;
  const sourceName = sourceKind === 'children'
    ? sourceRow.body_name || "Children's Commissioner"
    : 'Auditor-General';
  const number = normalizeText(rec.number).slice(0, 50) || null;
  const locator = sourceLocator({ sourceKind, sourceRow, rec });
  const flags = qualityFlags({ sourceKind, rec });
  const reviewStatus = sourceReviewStatus(flags);
  const candidateId = [
    jurisdiction,
    sourceKind,
    slugPart(title),
    number || `unnumbered-${index + 1}`,
    slugPart(text),
  ].join(':');

  return {
    candidate_id: candidateId,
    source_kind: sourceKind,
    source_record_id: sourceRow.id,
    review_note: 'Review source text before applying to production.',
    source_locator: locator,
    source_review_status: reviewStatus,
    quality_flags: flags,
    record: {
      jurisdiction,
      domain: DEFAULT_DOMAIN,
      oversight_body: sourceName,
      report_title: title.slice(0, 500),
      report_date: reportDate,
      report_url: reportUrl || null,
      recommendation_number: number,
      recommendation_text: text,
      status: DEFAULT_STATUS,
      status_notes: null,
      target_department: normalizeText(rec.target_body || rec.addressed_to).slice(0, 200) || null,
      severity: severityForText(text),
      metadata: {
        proposed_from: sourceKind === 'children'
          ? 'children_commissioner_reports.recommendations'
          : 'auditor_general_audits.key_recommendations',
        source_record_id: sourceRow.id,
        source_report_year: sourceRow.report_year || null,
        source_report_number: sourceRow.report_number || null,
        source_page_ref: rec.page_ref ?? null,
        source_locator: locator,
        source_review_status: reviewStatus,
        quality_flags: flags,
        yj_relevant: rec.yj_relevant ?? null,
        raise_age_relevant: rec.raise_age_relevant ?? null,
        indigenous_overrep: rec.indigenous_overrep ?? null,
        response: rec.response ?? null,
        generated_by: 'scripts/civic/propose-oversight-recommendation-candidates.mjs',
        generated_at: new Date().toISOString(),
      },
    },
  };
}

async function fetchSourceRows(supabase, jurisdictions) {
  const [children, auditors] = await Promise.all([
    supabase
      .from('children_commissioner_reports')
      .select('id,jurisdiction,body_name,report_year,report_url,report_title,published_date,recommendations')
      .in('jurisdiction', jurisdictions),
    supabase
      .from('auditor_general_audits')
      .select('id,jurisdiction,title,report_number,url,publication_date,tabled_date,key_recommendations')
      .limit(500),
  ]);

  if (children.error) throw new Error(`children_commissioner_reports: ${children.error.message}`);
  if (auditors.error) throw new Error(`auditor_general_audits: ${auditors.error.message}`);

  const wanted = new Set(jurisdictions.map((item) => item.toUpperCase()));
  return {
    children: children.data || [],
    auditors: (auditors.data || []).filter((row) => wanted.has(normalizeJurisdiction(row.jurisdiction))),
  };
}

function buildCandidates(sourceRows) {
  const candidates = [];
  for (const row of sourceRows.children) {
    asArray(row.recommendations)
      .filter(isChildrenRecommendationCandidate)
      .forEach((rec, index) => candidates.push(candidateRecord({ sourceKind: 'children', sourceRow: row, rec, index })));
  }
  for (const row of sourceRows.auditors) {
    asArray(row.key_recommendations)
      .filter(isAuditorRecommendationCandidate)
      .forEach((rec, index) => candidates.push(candidateRecord({ sourceKind: 'auditor', sourceRow: row, rec, index })));
  }
  return candidates;
}

async function fetchExistingRecommendationKeys(supabase, jurisdictions) {
  const { data, error } = await supabase
    .from('oversight_recommendations')
    .select('jurisdiction,oversight_body,report_title,recommendation_text')
    .in('jurisdiction', jurisdictions)
    .limit(10000);
  if (error) throw new Error(`oversight_recommendations: ${error.message}`);
  return new Set((data || []).map((row) => [
    normalizeJurisdiction(row.jurisdiction),
    normalizeText(row.oversight_body).toLowerCase(),
    normalizeText(row.report_title).toLowerCase(),
    normalizeText(row.recommendation_text).toLowerCase(),
  ].join('|')));
}

function markExisting(candidates, existingKeys) {
  return candidates.map((candidate) => {
    const row = candidate.record;
    const key = [
      normalizeJurisdiction(row.jurisdiction),
      normalizeText(row.oversight_body).toLowerCase(),
      normalizeText(row.report_title).toLowerCase(),
      normalizeText(row.recommendation_text).toLowerCase(),
    ].join('|');
    return { ...candidate, already_indexed: existingKeys.has(key) };
  });
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts, ([key, count]) => ({ key, count })).sort((a, b) => a.key.localeCompare(b.key));
}

function moneyDash(value) {
  return value == null || value === '' ? '-' : String(value);
}

function flagCounts(candidates) {
  const rows = [];
  for (const candidate of candidates) {
    for (const flag of candidate.quality_flags || []) {
      rows.push({ flag });
    }
  }
  return countBy(rows, (row) => row.flag);
}

function renderMarkdown({ generatedAt, jurisdictions, candidates, applyResult }) {
  const pending = candidates.filter((candidate) => !candidate.already_indexed);
  const lines = [
    '# Oversight Recommendation Extraction Candidates',
    '',
    `Generated: ${generatedAt}`,
    `Jurisdictions: ${jurisdictions.join(', ')}`,
    `Pending candidates: ${pending.length}`,
    `Already indexed: ${candidates.length - pending.length}`,
    '',
    'These rows are generated from structured source JSON already stored in production. They still require source review before production apply; page-level locators are shown when the source JSON supplied them.',
    '',
    '## Candidate Counts',
    '',
    '| Jurisdiction | Source kind | Pending candidates |',
    '| --- | --- | ---: |',
  ];

  for (const jurisdiction of jurisdictions) {
    const sourceKinds = ['children', 'auditor'];
    for (const sourceKind of sourceKinds) {
      const count = pending.filter((candidate) => candidate.record.jurisdiction === jurisdiction && candidate.source_kind === sourceKind).length;
      lines.push(`| ${jurisdiction} | ${sourceKind} | ${count} |`);
    }
  }

  lines.push('', '## Review Status Counts', '');
  lines.push('| Review status | Pending candidates |');
  lines.push('| --- | ---: |');
  for (const row of countBy(pending, (candidate) => candidate.source_review_status)) {
    lines.push(`| ${row.key} | ${row.count} |`);
  }

  lines.push('', '## Quality Flag Counts', '');
  lines.push('| Quality flag | Pending candidates |');
  lines.push('| --- | ---: |');
  for (const row of flagCounts(pending)) {
    lines.push(`| ${row.key} | ${row.count} |`);
  }

  lines.push('', '## Candidates', '');
  if (pending.length === 0) {
    lines.push('_No pending candidates._');
  } else {
    lines.push('| Jurisdiction | Source | Report | Target | Severity | Review status | Locator | Recommendation preview |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const candidate of pending) {
      const row = candidate.record;
      const text = row.recommendation_text.replace(/\|/g, '\\|');
      const preview = `${text.slice(0, 220)}${text.length > 220 ? '...' : ''}`;
      lines.push(`| ${row.jurisdiction} | ${candidate.source_kind} | ${row.report_title.replace(/\|/g, '\\|')} | ${moneyDash(row.target_department).replace(/\|/g, '\\|')} | ${row.severity} | ${candidate.source_review_status} | ${candidate.source_locator.replace(/\|/g, '\\|')} | ${preview} |`);
    }
  }

  if (pending.length > 0) {
    lines.push('', '## Full Review Text', '');
    for (const [index, candidate] of pending.entries()) {
      const row = candidate.record;
      const heading = row.recommendation_number || `${row.jurisdiction} ${candidate.source_kind} ${index + 1}`;
      lines.push(`### ${heading}`);
      lines.push('');
      lines.push(`- Jurisdiction: ${row.jurisdiction}`);
      lines.push(`- Source: ${candidate.source_kind}`);
      lines.push(`- Report: ${row.report_url ? `[${row.report_title}](${row.report_url})` : row.report_title}`);
      lines.push(`- Source record: ${candidate.source_record_id}`);
      lines.push(`- Target: ${moneyDash(row.target_department)}`);
      lines.push(`- Severity: ${row.severity}`);
      lines.push(`- Review status: ${candidate.source_review_status}`);
      lines.push(`- Locator: ${candidate.source_locator}`);
      lines.push(`- Quality flags: ${(candidate.quality_flags || []).join(', ') || 'none'}`);
      lines.push('');
      lines.push(row.recommendation_text);
      lines.push('');
    }
  }

  if (applyResult) {
    lines.push('', '## Apply Result', '');
    lines.push(`Inserted: ${applyResult.inserted}`);
    lines.push(`Skipped existing: ${applyResult.skippedExisting}`);
  }

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'oversight-recommendation-candidates.json');
  const mdPath = path.join(outputDir, 'oversight-recommendation-candidates.md');
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(payload));
  return { jsonPath, mdPath };
}

async function applyCandidates(supabase, candidates) {
  const toInsert = candidates.filter((candidate) => !candidate.already_indexed).map((candidate) => candidate.record);
  if (toInsert.length === 0) return { inserted: 0, skippedExisting: candidates.length };

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const slice = toInsert.slice(i, i + 50);
    // eslint-disable-next-line no-await-in-loop
    const { error, count } = await supabase
      .from('oversight_recommendations')
      .insert(slice, { count: 'exact' });
    if (error) throw new Error(`insert failed: ${error.message}`);
    inserted += typeof count === 'number' ? count : slice.length;
  }

  return { inserted, skippedExisting: candidates.length - toInsert.length };
}

async function main() {
  const args = parseArgs();
  if (args.apply && !args.yesProduction) {
    throw new Error('Refusing production write. Re-run with --apply --yes-production after explicit approval.');
  }

  const env = await loadEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sourceRows = await fetchSourceRows(supabase, args.jurisdictions);
  const existingKeys = await fetchExistingRecommendationKeys(supabase, args.jurisdictions);
  const candidates = markExisting(buildCandidates(sourceRows), existingKeys);
  const pending = candidates.filter((candidate) => !candidate.already_indexed);
  let applyResult = null;
  if (args.apply) applyResult = await applyCandidates(supabase, candidates);

  const payload = {
    generatedAt: new Date().toISOString(),
    mode: args.apply ? 'apply' : 'dry-run',
    jurisdictions: args.jurisdictions,
    sourceRows: {
      children_commissioner_reports: sourceRows.children.length,
      auditor_general_audits: sourceRows.auditors.length,
    },
    countsByJurisdiction: countBy(pending, (candidate) => candidate.record.jurisdiction),
    countsBySourceKind: countBy(pending, (candidate) => candidate.source_kind),
    countsByReviewStatus: countBy(pending, (candidate) => candidate.source_review_status),
    countsByQualityFlag: flagCounts(pending),
    candidates,
    applyResult,
  };
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log(`Oversight recommendation candidates · ${payload.mode}`);
  console.log(`- Pending candidates: ${pending.length}`);
  console.log(`- Already indexed: ${candidates.length - pending.length}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
  if (applyResult) console.log(`- Inserted: ${applyResult.inserted}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
