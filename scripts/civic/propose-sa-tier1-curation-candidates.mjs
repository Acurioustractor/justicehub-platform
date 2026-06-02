#!/usr/bin/env node
/**
 * Propose SA Tier 1 / ACCO curation candidates from existing organization data.
 *
 * This is a deterministic, no-LLM review queue for Adelaide launch work. It
 * does not confirm Tier 1 status. Dry-run writes local artifacts only. Applying
 * writes unconfirmed proposals to civic_org_classifications so the existing
 * /admin/civic/tier-1-curation UI can review them.
 *
 * Usage:
 *   node scripts/civic/propose-sa-tier1-curation-candidates.mjs
 *   node scripts/civic/propose-sa-tier1-curation-candidates.mjs --limit 25
 *   node scripts/civic/propose-sa-tier1-curation-candidates.mjs --apply --yes-production
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');
const DEFAULT_LIMIT = 25;
const YOUTH_NAME_RE = /\b(youth|young|child|children|adolescent|teen|student|family|families)\b/i;
const JUSTICE_NAME_RE = /\b(justice|legal|rights|court|bail|detention|diversion|reintegration|custody|custodial|offenders?|prisoners?|prison|police)\b/i;
const FIRST_NATIONS_NAME_RE = /\b(aboriginal|first nations|indigenous|nunga|kaurna|narungga|ngarrindjeri|anangu|adnyamathanha|kokatha|pitjantjatjara|yankunytjatjara)\b/i;
const EXCLUDE_NAME_RE = /\b(university|school|kindergarten|college|council|department|ministers?|parliament|foundation|trust|pty|proprietary|consulting|consultants?|arts?|media|network|training)\b/i;

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function parseArgs() {
  const limitArg = getArg('--limit');
  return {
    apply: process.argv.includes('--apply'),
    yesProduction: process.argv.includes('--yes-production'),
    limit: limitArg ? Number(limitArg) : DEFAULT_LIMIT,
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

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function confidenceForScore(score) {
  if (score >= 22) return 0.9;
  if (score >= 18) return 0.86;
  if (score >= 14) return 0.78;
  return 0.72;
}

function sectorForCandidate(candidate) {
  const name = String(candidate.name || '');
  if (/\b(legal|rights)\b/i.test(name)) return 'legal_service';
  if (candidate.acco_certified || candidate.is_indigenous_org) return 'primary_frontline';
  return 'primary_frontline';
}

function evidenceFlags({ row, hasYouthSignal, hasJusticeSignal }) {
  const flags = [];
  if (row.acco_certified) flags.push('acco_certified');
  if (row.is_indigenous_org) flags.push('indigenous_led_flag');
  if (hasYouthSignal) flags.push('youth_or_family_text_signal');
  if (hasJusticeSignal) flags.push('justice_or_legal_text_signal');
  if (FIRST_NATIONS_NAME_RE.test(`${row.name || ''} ${row.description || ''}`)) flags.push('first_nations_text_signal');
  if (row.website) flags.push('has_website');
  else flags.push('missing_website');
  if (row.description) flags.push('has_description');
  else flags.push('missing_description');
  return flags;
}

function reviewStatusForFlags(flags) {
  const hasJustice = flags.includes('justice_or_legal_text_signal');
  const hasYouth = flags.includes('youth_or_family_text_signal');
  const isAcco = flags.includes('acco_certified');
  if (isAcco && hasJustice && hasYouth) return 'strong_acco_youth_justice_review';
  if (isAcco && hasJustice) return 'acco_justice_review_needs_youth_scope';
  if (isAcco && hasYouth) return 'acco_youth_review_needs_justice_scope';
  if (hasJustice && hasYouth) return 'non_acco_youth_justice_review';
  return 'needs_external_source_before_tier1_confirmation';
}

function reviewActionForStatus(status) {
  if (status === 'strong_acco_youth_justice_review') {
    return 'Review source page, then propose/confirm only if the organisation directly works with young people in justice, legal, detention, diversion, bail or post-release contexts.';
  }
  if (status === 'acco_justice_review_needs_youth_scope') {
    return 'Verify youth-specific scope before confirming Tier 1; ACCO plus justice language is not enough by itself.';
  }
  if (status === 'acco_youth_review_needs_justice_scope') {
    return 'Verify justice-specific scope before confirming Tier 1; ACCO plus youth/family language is not enough by itself.';
  }
  if (status === 'non_acco_youth_justice_review') {
    return 'Verify frontline youth justice service delivery and ACCO status separately before confirmation.';
  }
  return 'Do not confirm Tier 1 from current signals alone; gather an external source or leave as a watchlist candidate.';
}

function confirmationBlockers(flags) {
  const blockers = [];
  if (!flags.includes('justice_or_legal_text_signal')) blockers.push('no direct justice/legal text signal');
  if (!flags.includes('youth_or_family_text_signal')) blockers.push('no direct youth/family text signal');
  if (!flags.includes('has_website')) blockers.push('no website in organisation record');
  if (!flags.includes('has_description')) blockers.push('no description in organisation record');
  return blockers;
}

function sourceLocator(row) {
  const parts = [`organizations:${row.id}`];
  if (row.abn) parts.push(`ABN ${row.abn}`);
  if (row.website) parts.push(`website ${row.website}`);
  if (row.city || row.state) parts.push(`location ${[row.city, row.state].filter(Boolean).join(', ')}`);
  return parts.join('; ');
}

function scoreCandidate(row) {
  if (!row || row.is_confirmed_tier1) return null;
  const name = String(row.name || '');
  const text = `${name} ${row.description || ''}`;
  const hasYouthSignal = YOUTH_NAME_RE.test(text);
  const hasJusticeSignal = JUSTICE_NAME_RE.test(text);
  const signals = [];
  let score = 0;

  if (row.acco_certified) {
    score += 8;
    signals.push('ACCO-certified');
  }
  if (row.is_indigenous_org) {
    score += 4;
    signals.push('Indigenous-led flag');
  }
  if (hasYouthSignal) {
    score += 3;
    signals.push('youth/family text signal');
  }
  if (hasJusticeSignal) {
    score += 4;
    signals.push('justice/legal text signal');
  }
  if (FIRST_NATIONS_NAME_RE.test(text)) {
    score += 3;
    signals.push('First Nations text signal');
  }
  if (EXCLUDE_NAME_RE.test(name)) {
    score -= 4;
    signals.push('likely system/funder/generalist review');
  }

  if (!hasYouthSignal && !hasJusticeSignal) return null;
  if (score < 10) return null;

  const flags = evidenceFlags({ row, hasYouthSignal, hasJusticeSignal });
  const reviewStatus = reviewStatusForFlags(flags);
  return {
    organization_id: row.id,
    name: row.name,
    slug: row.slug,
    abn: row.abn || null,
    city: row.city || null,
    state: row.state || 'SA',
    website: row.website || null,
    description: row.description || null,
    score,
    acco_certified: Boolean(row.acco_certified),
    is_indigenous_org: Boolean(row.is_indigenous_org),
    proposed_tier: 1,
    proposed_sector: sectorForCandidate(row),
    proposed_confidence: confidenceForScore(score),
    evidence_snippet: signals.join('; '),
    signals,
    quality_flags: flags,
    review_status: reviewStatus,
    review_action: reviewActionForStatus(reviewStatus),
    confirmation_blockers: confirmationBlockers(flags),
    source_locator: sourceLocator(row),
  };
}

async function fetchAll(supabase, table, select, filter, { pageSize = 1000, maxRows = 20000 } = {}) {
  const rows = [];
  for (let from = 0; from <= maxRows; from += pageSize) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (filter) query = filter(query);
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
  throw new Error(`${table}: exceeded max row limit ${maxRows}`);
}

async function fetchCandidates(supabase, limit) {
  const [classifications, saOrgs] = await Promise.all([
    fetchAll(
      supabase,
      'civic_org_classifications',
      'organization_id,tier,confirmed_at,llm_proposed_tier,llm_proposed_at',
      null,
      { maxRows: 10000 }
    ),
    fetchAll(
      supabase,
      'organizations',
      'id,name,slug,abn,city,state,website,description,acco_certified,is_indigenous_org,is_active,archived',
      (query) => query.eq('state', 'SA').eq('is_active', true).neq('archived', true),
      { maxRows: 30000 }
    ),
  ]);

  const confirmedTier1Ids = new Set(
    classifications
      .filter((row) => row.tier === 1 && row.confirmed_at)
      .map((row) => row.organization_id)
  );
  const existingProposalIds = new Set(classifications.map((row) => row.organization_id));
  const confirmedNameKeys = new Set();
  for (const row of saOrgs) {
    if (confirmedTier1Ids.has(row.id)) confirmedNameKeys.add(normalizeName(row.name));
  }

  const deduped = new Map();
  for (const row of saOrgs) {
    const candidate = scoreCandidate({
      ...row,
      is_confirmed_tier1: confirmedTier1Ids.has(row.id) || confirmedNameKeys.has(normalizeName(row.name)),
    });
    if (!candidate) continue;
    candidate.already_has_classification_row = existingProposalIds.has(candidate.organization_id);
    if (candidate.already_has_classification_row) {
      candidate.quality_flags.push('existing_classification_row');
      candidate.confirmation_blockers.push('review existing classification row before creating another proposal');
    }
    const key = `${normalizeName(candidate.name)}::${normalizeName(candidate.city)}`;
    const current = deduped.get(key);
    if (
      !current ||
      candidate.score > current.score ||
      Number(candidate.acco_certified) > Number(current.acco_certified)
    ) {
      deduped.set(key, candidate);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) =>
      b.score - a.score ||
      Number(b.acco_certified) - Number(a.acco_certified) ||
      String(a.name || '').localeCompare(String(b.name || ''))
    )
    .slice(0, limit);
}

function proposalRow(candidate) {
  return {
    organization_id: candidate.organization_id,
    llm_proposed_tier: candidate.proposed_tier,
    llm_proposed_sector: candidate.proposed_sector,
    llm_confidence: candidate.proposed_confidence,
    llm_evidence_snippet: candidate.evidence_snippet.slice(0, 500),
    llm_model: 'deterministic-sa-launch-signals',
    llm_proposed_at: new Date().toISOString(),
    notes: [
      'SA launch review candidate generated from ACCO, Indigenous, youth/family and justice/legal text signals. Human confirmation required.',
      `Review status: ${candidate.review_status}.`,
      `Review action: ${candidate.review_action}`,
      candidate.confirmation_blockers.length ? `Blockers: ${candidate.confirmation_blockers.join('; ')}.` : 'No automated review blockers.',
    ].join(' '),
  };
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts, ([key, count]) => ({ key, count })).sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

function flagCounts(candidates) {
  const rows = [];
  for (const candidate of candidates) {
    for (const flag of candidate.quality_flags || []) rows.push({ flag });
  }
  return countBy(rows, (row) => row.flag);
}

function tableEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

async function applyProposals(supabase, candidates) {
  const rows = candidates
    .filter((candidate) => !candidate.already_has_classification_row)
    .map(proposalRow);
  if (rows.length === 0) return { upserted: 0, skippedExisting: candidates.length };

  const { error, count } = await supabase
    .from('civic_org_classifications')
    .upsert(rows, { onConflict: 'organization_id', ignoreDuplicates: false, count: 'exact' });
  if (error) throw new Error(`civic_org_classifications upsert failed: ${error.message}`);
  return {
    upserted: typeof count === 'number' ? count : rows.length,
    skippedExisting: candidates.length - rows.length,
  };
}

function renderMarkdown(payload) {
  const lines = [
    '# SA Tier 1 / ACCO Curation Candidates',
    '',
    `Generated: ${payload.generatedAt}`,
    `Mode: ${payload.mode}`,
    `Candidates: ${payload.candidates.length}`,
    `Existing classification rows: ${payload.candidates.filter((candidate) => candidate.already_has_classification_row).length}`,
    '',
    'These are review candidates only. They are not confirmed Tier 1 rows until a human accepts them in `/admin/civic/tier-1-curation` or a separately approved apply path.',
    'The review gates below are intentionally conservative: ACCO status, Indigenous-led flags or broad youth/family language do not prove a direct youth justice role.',
    '',
    '## Review Status Counts',
    '',
    '| Review status | Candidates |',
    '| --- | ---: |',
  ];

  for (const row of payload.summary.by_review_status) {
    lines.push(`| ${tableEscape(row.key)} | ${row.count} |`);
  }

  lines.push(
    '',
    '## Quality Flag Counts',
    '',
    '| Quality flag | Candidates |',
    '| --- | ---: |',
  );

  for (const row of payload.summary.by_quality_flag) {
    lines.push(`| ${tableEscape(row.key)} | ${row.count} |`);
  }

  lines.push(
    '',
    '## Candidates',
    '',
    '| Score | Confidence | Organisation | City | ACCO | Review status | Source locator | Blockers | Signals |',
    '| ---: | ---: | --- | --- | --- | --- | --- | --- | --- |',
  );

  for (const candidate of payload.candidates) {
    lines.push(`| ${candidate.score} | ${candidate.proposed_confidence.toFixed(2)} | ${tableEscape(candidate.name)} | ${tableEscape(candidate.city || '')} | ${candidate.acco_certified ? 'yes' : 'no'} | ${tableEscape(candidate.review_status)} | ${tableEscape(candidate.source_locator)} | ${tableEscape(candidate.confirmation_blockers.join('; ') || 'none')} | ${tableEscape(candidate.signals.join('; '))} |`);
  }

  lines.push('', '## Operator Review Notes', '');
  for (const candidate of payload.candidates) {
    lines.push(`### ${candidate.name}`);
    lines.push('');
    lines.push(`- Source locator: ${candidate.source_locator}`);
    lines.push(`- Review status: ${candidate.review_status}`);
    lines.push(`- Review action: ${candidate.review_action}`);
    lines.push(`- Quality flags: ${(candidate.quality_flags || []).join(', ')}`);
    lines.push(`- Confirmation blockers: ${candidate.confirmation_blockers.join('; ') || 'none'}`);
    if (candidate.website) lines.push(`- Website: ${candidate.website}`);
    if (candidate.description) lines.push(`- Description: ${candidate.description}`);
    lines.push('');
  }

  if (payload.applyResult) {
    lines.push('', '## Apply Result', '');
    lines.push(`Upserted proposal rows: ${payload.applyResult.upserted}`);
    lines.push(`Skipped existing classification rows: ${payload.applyResult.skippedExisting}`);
  }

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'sa-tier1-curation-candidates.json');
  const mdPath = path.join(outputDir, 'sa-tier1-curation-candidates.md');
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(payload));
  return { jsonPath, mdPath };
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

  const candidates = await fetchCandidates(supabase, Number.isFinite(args.limit) && args.limit > 0 ? args.limit : DEFAULT_LIMIT);
  let applyResult = null;
  if (args.apply) applyResult = await applyProposals(supabase, candidates);

  const payload = {
    generatedAt: new Date().toISOString(),
    mode: args.apply ? 'apply' : 'dry-run',
    limit: args.limit,
    summary: {
      candidates: candidates.length,
      acco_certified: candidates.filter((candidate) => candidate.acco_certified).length,
      existing_classification_rows: candidates.filter((candidate) => candidate.already_has_classification_row).length,
      by_review_status: countBy(candidates, (candidate) => candidate.review_status),
      by_quality_flag: flagCounts(candidates),
    },
    candidates,
    applyResult,
  };
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log(`SA Tier 1 curation candidates · ${payload.mode}`);
  console.log(`- Candidates: ${payload.summary.candidates}`);
  console.log(`- ACCO-certified candidates: ${payload.summary.acco_certified}`);
  console.log(`- Existing classification rows: ${payload.summary.existing_classification_rows}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
  if (applyResult) console.log(`- Upserted proposal rows: ${applyResult.upserted}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
