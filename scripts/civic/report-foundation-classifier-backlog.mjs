#!/usr/bin/env node
/**
 * Report the foundation_grantees YJ-classifier backlog.
 *
 * Dry-run/reporting only. This script reads production rows and writes local
 * artifacts that rank the remaining classifier queues and emit exact follow-up
 * commands for classify-foundation-grants-yj.mjs.
 *
 * Usage:
 *   node scripts/civic/report-foundation-classifier-backlog.mjs
 *   node scripts/civic/report-foundation-classifier-backlog.mjs --top 20
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');
const DEFAULT_TOP = 20;

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

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(numberValue(value));
}

function queueKey(row) {
  return [
    row.foundation_abn || 'unknown',
    row.foundation_name || 'unknown',
    row.extraction_method || 'unknown',
    row.metadata?.source_key || '',
  ].join('||');
}

function priorityScore(queue) {
  let score = 0;
  const text = `${queue.foundation_name} ${queue.extraction_method} ${queue.source_key}`.toLowerCase();
  if (text.includes('paul ramsay') || text.includes('prf') || text.includes('paul_ramsay')) score += 1000;
  if (text.includes('minderoo')) score += 700;
  if (text.includes('dusseldorp')) score += 650;
  if (text.includes('official_grantee_surface')) score += 200;
  score += Math.min(queue.unclassified_rows, 500);
  score += Math.min(queue.unclassified_dollars / 100000, 500);
  return score;
}

async function fetchAllFoundationRows(supabase) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; from <= 20000; from += pageSize) {
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await supabase
      .from('foundation_grantees')
      .select('id,foundation_abn,foundation_name,grantee_name,program_name,grant_year,grant_amount,extraction_method,metadata,yj_classified_at,yj_relevant')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`foundation_grantees: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
  throw new Error('foundation_grantees: exceeded max row limit');
}

function buildQueues(rows) {
  const queues = new Map();
  for (const row of rows) {
    const key = queueKey(row);
    const current = queues.get(key) || {
      foundation_abn: row.foundation_abn || 'unknown',
      foundation_name: row.foundation_name || 'unknown',
      extraction_method: row.extraction_method || 'unknown',
      source_key: row.metadata?.source_key || null,
      total_rows: 0,
      classified_rows: 0,
      yj_relevant_rows: 0,
      unclassified_rows: 0,
      total_dollars: 0,
      unclassified_dollars: 0,
      samples: [],
    };

    current.total_rows += 1;
    current.total_dollars += numberValue(row.grant_amount);
    if (row.yj_classified_at) {
      current.classified_rows += 1;
      if (row.yj_relevant) current.yj_relevant_rows += 1;
    } else {
      current.unclassified_rows += 1;
      current.unclassified_dollars += numberValue(row.grant_amount);
      if (current.samples.length < 3) {
        current.samples.push({
          grantee_name: row.grantee_name,
          program_name: row.program_name,
          grant_year: row.grant_year,
          grant_amount: row.grant_amount,
        });
      }
    }
    queues.set(key, current);
  }

  return Array.from(queues.values())
    .filter((queue) => queue.unclassified_rows > 0)
    .map((queue) => ({ ...queue, priority_score: priorityScore(queue) }))
    .sort((a, b) =>
      b.priority_score - a.priority_score ||
      b.unclassified_rows - a.unclassified_rows ||
      b.unclassified_dollars - a.unclassified_dollars ||
      String(a.foundation_name).localeCompare(String(b.foundation_name))
    );
}

function classifierCommand(queue) {
  const parts = [
    'node scripts/civic/classify-foundation-grants-yj.mjs',
    `--foundation-abn ${queue.foundation_abn}`,
    `--extraction-method ${queue.extraction_method}`,
    `--batch ${queue.unclassified_rows}`,
    '--samples 15',
  ];
  if (queue.source_key) parts.push(`--source-key ${queue.source_key}`);
  return parts.join(' ');
}

function classifierApplyCommand(queue) {
  return `${classifierCommand(queue)} --apply --yes-production`;
}

function launchLane(queue) {
  const text = `${queue.foundation_name} ${queue.extraction_method} ${queue.source_key}`.toLowerCase();
  if (text.includes('paul ramsay') || text.includes('prf') || text.includes('paul_ramsay')) return 'P1 PRF annual-review launch queue';
  if (text.includes('minderoo') || text.includes('dusseldorp')) return 'P2 major youth-systems philanthropy queue';
  if (queue.unclassified_rows > 1000) return 'P2 high-volume coverage queue';
  return 'P3 residual foundation classifier queue';
}

function reviewNote(queue) {
  if (launchLane(queue).startsWith('P1')) {
    return 'Run dry-run first and review model samples; partner-list rows are commitment signals and should not be over-read as youth justice grants without explicit source text.';
  }
  if (queue.unclassified_rows > 1000) {
    return 'Large coverage queue; sample before applying and consider smaller batches to avoid burying youth justice false positives.';
  }
  return 'Run dry-run first and review sample classifications before any guarded apply.';
}

function renderMarkdown(payload) {
  const lines = [
    '# Foundation Classifier Backlog',
    '',
    `Generated: ${payload.generatedAt}`,
    `Coverage: ${payload.classified_rows}/${payload.total_rows} (${payload.classified_pct}%)`,
    `Unclassified rows: ${payload.unclassified_rows}`,
    `YJ-relevant rows so far: ${payload.yj_relevant_rows}`,
    `PRF annual-review unclassified rows: ${payload.prf_annual_review_unclassified_rows} (${money(payload.prf_annual_review_unclassified_dollars)})`,
    '',
    'This is a dry-run planning artifact. Run the generated commands without `--apply` first; production classification writes require explicit approval.',
    '',
    '## Launch-Priority Queues',
    '',
    '| Priority | Foundation | Extraction method | Source key | Unclassified | Dollars | Dry-run command |',
    '| ---: | --- | --- | --- | ---: | ---: | --- |',
  ];

  for (const queue of payload.top_queues) {
    lines.push(`| ${Math.round(queue.priority_score)} | ${queue.foundation_name.replace(/\|/g, '\\|')} | ${queue.extraction_method} | ${queue.source_key || ''} | ${queue.unclassified_rows} | ${money(queue.unclassified_dollars)} | \`${classifierCommand(queue)}\` |`);
  }

  lines.push('', '## Production Apply Gates', '');
  lines.push('| Lane | Foundation | Rows | Dry-run first | Guarded apply after approval | Review note |');
  lines.push('| --- | --- | ---: | --- | --- | --- |');
  for (const queue of payload.top_queues.slice(0, 10)) {
    lines.push(`| ${launchLane(queue)} | ${queue.foundation_name.replace(/\|/g, '\\|')} | ${queue.unclassified_rows} | \`${classifierCommand(queue)}\` | \`${classifierApplyCommand(queue)}\` | ${reviewNote(queue).replace(/\|/g, '\\|')} |`);
  }

  lines.push('', '## Samples From Top Queues', '');
  for (const queue of payload.top_queues.slice(0, 8)) {
    lines.push(`### ${queue.foundation_name}`);
    lines.push('');
    for (const sample of queue.samples) {
      lines.push(`- ${sample.grantee_name || 'unknown grantee'}${sample.program_name ? ` - ${sample.program_name}` : ''}${sample.grant_year ? ` (${sample.grant_year})` : ''}${sample.grant_amount ? ` - ${money(sample.grant_amount)}` : ''}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'foundation-classifier-backlog.json');
  const mdPath = path.join(outputDir, 'foundation-classifier-backlog.md');
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

  const rows = await fetchAllFoundationRows(supabase);
  const totalRows = rows.length;
  const classifiedRows = rows.filter((row) => row.yj_classified_at).length;
  const unclassifiedRows = totalRows - classifiedRows;
  const queues = buildQueues(rows);
  const topQueues = queues.slice(0, Number.isFinite(args.top) && args.top > 0 ? args.top : DEFAULT_TOP);

  const payload = {
    generatedAt: new Date().toISOString(),
    total_rows: totalRows,
    classified_rows: classifiedRows,
    unclassified_rows: unclassifiedRows,
    classified_pct: totalRows > 0 ? Math.round((classifiedRows / totalRows) * 1000) / 10 : 0,
    yj_relevant_rows: rows.filter((row) => row.yj_relevant).length,
    backlog_queue_count: queues.length,
    prf_annual_review_unclassified_rows: queues
      .filter((queue) => launchLane(queue).startsWith('P1'))
      .reduce((sum, queue) => sum + queue.unclassified_rows, 0),
    prf_annual_review_unclassified_dollars: queues
      .filter((queue) => launchLane(queue).startsWith('P1'))
      .reduce((sum, queue) => sum + queue.unclassified_dollars, 0),
    top_queues: topQueues,
  };
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log('Foundation classifier backlog');
  console.log(`- Coverage: ${payload.classified_rows}/${payload.total_rows} (${payload.classified_pct}%)`);
  console.log(`- Unclassified rows: ${payload.unclassified_rows}`);
  console.log(`- Backlog queues: ${payload.backlog_queue_count}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
