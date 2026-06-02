#!/usr/bin/env node
/**
 * Report the civic intelligence data backlog for launch triage.
 *
 * Read-only. Fetches source inventory, gap questions and agent findings from
 * Supabase, then writes a local artifact that ranks the unresolved work into
 * launch lanes.
 *
 * Usage:
 *   node scripts/civic/report-civic-data-backlog.mjs
 *   node scripts/civic/report-civic-data-backlog.mjs --top 40
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');
const DEFAULT_TOP = 30;

const TOPIC_WEIGHT = {
  government: 140,
  oversight: 130,
  orgs: 120,
  foundations: 110,
  demographics: 80,
  grants: 70,
  meta: 20,
};

const LANE_MATCHERS = [
  {
    lane: 'money_and_budgets',
    label: 'Money, budgets and spend',
    match: /budget|spend|allocation|appropriation|tender|contract|consultanc|grantconnect|niaa|attorney-general|portfolio|treasury/i,
  },
  {
    lane: 'oversight_and_harm',
    label: 'Oversight, inquiries and harm',
    match: /oversight|commission|commissioner|auditor|coroner|inquest|death|detention|returning|recommendation|royal commission/i,
  },
  {
    lane: 'frontline_orgs_and_acco',
    label: 'Frontline organisations and ACCO coverage',
    match: /tier 1|frontline|acco|aboriginal corporation|indigenous-led|community-led|organisation|organization|alma|ngo/i,
  },
  {
    lane: 'foundation_grants',
    label: 'Foundation and philanthropic grants',
    match: /foundation|philanthrop|paf|perpetual|minderoo|ramsay|ritchie|dusseldorp|myer|fairfax|trust/i,
  },
  {
    lane: 'demographics_and_cohorts',
    label: 'Demographics and cohort overlays',
    match: /demographic|disability|ndis|police|stop-and-search|age|cohort|closing the gap/i,
  },
];
const CLOSED_GAP_STATUSES = ['closed', 'resolved', 'done', 'wontfix'];

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function parseArgs() {
  const topArg = getArg('--top');
  return {
    top: topArg ? Number(topArg) : DEFAULT_TOP,
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

async function fetchAll(supabase, table, columns, configure = null, maxRows = 20000) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; from <= maxRows; from += pageSize) {
    let query = supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (configure) query = configure(query);
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
  throw new Error(`${table}: exceeded ${maxRows} row limit`);
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function tableEscape(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function shortText(value, max = 120) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function isPublicHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
}

function textForRow(row) {
  return [
    row.topic,
    row.source_key,
    row.display_name,
    row.description,
    row.coverage_note,
    row.question,
    row.proposed_source_url,
    row.candidate_title,
    row.summary,
    row.rationale,
    row.search_query,
  ].filter(Boolean).join(' ');
}

function laneFor(row) {
  const text = textForRow(row);
  for (const matcher of LANE_MATCHERS) {
    if (matcher.match.test(text)) return matcher;
  }
  return {
    lane: 'general_source_quality',
    label: 'General source quality',
  };
}

function priorityScore(item) {
  const topicWeight = TOPIC_WEIGHT[item.topic] || 40;
  const statusWeight = item.status === 'open'
    ? 40
    : item.status === 'investigating'
      ? 35
      : item.status === 'planned'
        ? 30
        : item.status === 'pending'
          ? 25
          : 0;
  const priorityWeight = item.priority ? Math.max(0, 6 - numberValue(item.priority)) * 30 : 0;
  const text = textForRow(item).toLowerCase();
  let score = topicWeight + statusWeight + priorityWeight;

  if (text.includes('sa ') || text.includes('adelaide') || text.includes('south australia')) score += 90;
  if (text.includes('budget') || text.includes('spend') || text.includes('allocation')) score += 50;
  if (text.includes('coroner') || text.includes('death') || text.includes('detention')) score += 45;
  if (text.includes('tier 1') || text.includes('frontline') || text.includes('acco')) score += 40;
  if (text.includes('ramsay') || text.includes('minderoo') || text.includes('ritchie')) score += 35;
  if (text.includes('auto-promoted') && item.kind === 'planned_source') score -= 10;
  if (!item.url && !item.proposed_source_url && item.kind !== 'agent_finding') score -= 15;

  return score;
}

function buildActionItems({ sources, gaps, findings }) {
  const plannedSources = sources.filter((row) => row.status === 'planned');
  const unresolvedGaps = gaps.filter((row) => !CLOSED_GAP_STATUSES.includes(row.status || ''));
  const pendingFindings = findings.filter((row) => row.status === 'pending');

  const sourceItems = plannedSources.map((row) => ({
    kind: 'planned_source',
    topic: row.topic || 'unknown',
    status: row.status || 'planned',
    title: row.display_name || row.source_key || 'Untitled source',
    url: row.url || null,
    source_key: row.source_key || null,
    note: row.coverage_note || row.description || '',
    next_step: 'Verify source quality, define ingest method, then promote only after rows land.',
    admin_path: '/admin/data-sufficiency',
    ...laneFor(row),
  }));

  const gapItems = unresolvedGaps.map((row) => ({
    kind: 'gap_question',
    topic: row.topic || 'unknown',
    status: row.status || 'open',
    priority: row.priority,
    title: row.question || 'Untitled gap',
    url: row.proposed_source_url || null,
    proposed_source_url: row.proposed_source_url || null,
    owner: row.owner || null,
    raised_at: row.raised_at || null,
    note: row.outcome_note || '',
    next_step: nextStepForGap(row),
    admin_path: '/admin/data-sufficiency',
    ...laneFor(row),
  }));

  const findingItems = pendingFindings.map((row) => ({
    kind: 'agent_finding',
    topic: row.topic || 'unknown',
    status: row.status || 'pending',
    title: row.candidate_title || row.candidate_url || 'Untitled finding',
    url: row.candidate_url || null,
    relevance_score: numberValue(row.relevance_score),
    note: row.summary || row.rationale || '',
    next_step: 'Accept, reject or mark duplicate in the agent findings queue.',
    admin_path: '/admin/data-sufficiency/findings',
    ...laneFor(row),
  }));

  return [...sourceItems, ...gapItems, ...findingItems]
    .map((item) => ({ ...item, priority_score: priorityScore(item) }))
    .sort((a, b) =>
      b.priority_score - a.priority_score ||
      numberValue(a.priority) - numberValue(b.priority) ||
      String(a.topic).localeCompare(String(b.topic)) ||
      String(a.title).localeCompare(String(b.title))
    );
}

function nextStepForGap(row) {
  const text = `${row.question || ''} ${row.proposed_source_url || ''}`.toLowerCase();
  if (text.includes('sa budget 2025-26')) {
    return 'Run scripts/civic/propose-sa-budget-yj-candidates.mjs, source-review the artifact, then apply only with approval.';
  }
  if (text.includes('low oversight coverage for sa')) {
    return 'Run SA oversight report-row and recommendation candidate scripts, review source text, then apply only with approval.';
  }
  if (row.status === 'sourced') {
    return 'Verify the source landed in the public surface, then close the gap.';
  }
  if (row.proposed_source_url) {
    return 'Review proposed source, attach evidence or mark the gap as sourced.';
  }
  return 'Find a primary source before treating this claim surface as launch-ready.';
}

function summarize({ sources, gaps, findings, actionItems }) {
  const unresolvedGaps = gaps.filter((row) => !CLOSED_GAP_STATUSES.includes(row.status || ''));
  const plannedSources = sources.filter((row) => row.status === 'planned');
  const pendingFindings = findings.filter((row) => row.status === 'pending');
  const highPriorityGaps = unresolvedGaps.filter((row) => numberValue(row.priority) <= 2);
  const noUrlPlannedSources = plannedSources.filter((row) => !row.url);

  return {
    source_status_counts: countBy(sources, (row) => `${row.topic || 'unknown'}::${row.status || 'unknown'}`)
      .map((row) => {
        const [topic, status] = row.key.split('::');
        return { topic, status, count: row.count };
      }),
    gap_status_counts: countBy(gaps, (row) => `${row.topic || 'unknown'}::P${row.priority || 'unknown'}::${row.status || 'unknown'}`)
      .map((row) => {
        const [topic, priority, status] = row.key.split('::');
        return { topic, priority, status, count: row.count };
      }),
    finding_status_counts: countBy(findings, (row) => `${row.topic || 'unknown'}::${row.status || 'unknown'}`)
      .map((row) => {
        const [topic, status] = row.key.split('::');
        return { topic, status, count: row.count };
      }),
    lane_counts: countBy(actionItems, (row) => row.lane).map((row) => {
      const lane = LANE_MATCHERS.find((matcher) => matcher.lane === row.key);
      return { lane: row.key, label: lane?.label || 'General source quality', count: row.count };
    }),
    totals: {
      sources: sources.length,
      planned_sources: plannedSources.length,
      planned_sources_without_url: noUrlPlannedSources.length,
      gaps: gaps.length,
      unresolved_gaps: unresolvedGaps.length,
      high_priority_unresolved_gaps: highPriorityGaps.length,
      agent_findings: findings.length,
      pending_agent_findings: pendingFindings.length,
      action_items: actionItems.length,
    },
  };
}

function renderMarkdown(payload) {
  const topItems = payload.top_action_items;
  const lines = [
    '# Civic Data Backlog',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    'Read-only launch triage artifact. It does not write to Supabase and does not close gaps automatically.',
    '',
    '## Headline',
    '',
    `- Planned sources: ${payload.summary.totals.planned_sources}`,
    `- Unresolved gap questions: ${payload.summary.totals.unresolved_gaps}`,
    `- High-priority unresolved gaps: ${payload.summary.totals.high_priority_unresolved_gaps}`,
    `- Pending agent findings: ${payload.summary.totals.pending_agent_findings}`,
    `- Ranked action items: ${payload.summary.totals.action_items}`,
    '',
    '## Launch Lanes',
    '',
    '| Lane | Items |',
    '| --- | ---: |',
  ];

  for (const row of payload.summary.lane_counts) {
    lines.push(`| ${tableEscape(row.label)} | ${row.count} |`);
  }

  lines.push('', '## Top Action Queue', '');
  lines.push('| Rank | Score | Type | Lane | Topic | Status | Item | Next step |');
  lines.push('| ---: | ---: | --- | --- | --- | --- | --- | --- |');
  topItems.forEach((item, index) => {
    lines.push([
      index + 1,
      Math.round(item.priority_score),
      tableEscape(item.kind),
      tableEscape(item.label),
      tableEscape(item.topic),
      tableEscape(item.priority ? `P${item.priority} ${item.status}` : item.status),
      isPublicHttpUrl(item.url) ? `[${tableEscape(shortText(item.title, 80))}](${item.url})` : tableEscape(shortText(item.title, 80)),
      tableEscape(shortText(item.next_step, 100)),
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  });

  lines.push('', '## Source Status By Topic', '');
  lines.push('| Topic | Status | Count |');
  lines.push('| --- | --- | ---: |');
  for (const row of payload.summary.source_status_counts) {
    lines.push(`| ${tableEscape(row.topic)} | ${tableEscape(row.status)} | ${row.count} |`);
  }

  lines.push('', '## Gap Status By Topic', '');
  lines.push('| Topic | Priority | Status | Count |');
  lines.push('| --- | --- | --- | ---: |');
  for (const row of payload.summary.gap_status_counts) {
    lines.push(`| ${tableEscape(row.topic)} | ${tableEscape(row.priority)} | ${tableEscape(row.status)} | ${row.count} |`);
  }

  lines.push('', '## Agent Finding Status By Topic', '');
  lines.push('| Topic | Status | Count |');
  lines.push('| --- | --- | ---: |');
  for (const row of payload.summary.finding_status_counts) {
    lines.push(`| ${tableEscape(row.topic)} | ${tableEscape(row.status)} | ${row.count} |`);
  }

  lines.push('', '## Operator Paths', '');
  lines.push('- Review sources and gaps in `/admin/data-sufficiency`.');
  lines.push('- Review pending source candidates in `/admin/data-sufficiency/findings`.');
  lines.push('- Refresh this artifact with `node scripts/civic/report-civic-data-backlog.mjs`.');
  lines.push('- Production writes still require explicit approval before running any apply, import, classify or source-promotion path.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'data-backlog.json');
  const mdPath = path.join(outputDir, 'data-backlog.md');
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

  const [sources, gaps, findings] = await Promise.all([
    fetchAll(supabase, 'data_sources_inventory', '*'),
    fetchAll(supabase, 'data_gap_questions', '*'),
    fetchAll(supabase, 'data_agent_findings', '*'),
  ]);

  const actionItems = buildActionItems({ sources, gaps, findings });
  const top = Number.isFinite(args.top) && args.top > 0 ? args.top : DEFAULT_TOP;
  const payload = {
    generatedAt: new Date().toISOString(),
    summary: summarize({ sources, gaps, findings, actionItems }),
    top_action_items: actionItems.slice(0, top),
  };
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log('Civic data backlog');
  console.log(`- Planned sources: ${payload.summary.totals.planned_sources}`);
  console.log(`- Unresolved gaps: ${payload.summary.totals.unresolved_gaps}`);
  console.log(`- Pending agent findings: ${payload.summary.totals.pending_agent_findings}`);
  console.log(`- Action items: ${payload.summary.totals.action_items}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
