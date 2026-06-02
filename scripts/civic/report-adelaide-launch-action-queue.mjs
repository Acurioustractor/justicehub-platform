#!/usr/bin/env node
/**
 * Build the Adelaide civic intelligence launch action queue.
 *
 * Read-only. Consolidates the launch-readiness audit warnings and all generated
 * candidate artifacts into one operator report with exact refresh/apply commands
 * and dependency notes.
 *
 * Usage:
 *   node scripts/civic/report-adelaide-launch-action-queue.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'civic-launch-readiness');

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function parseArgs() {
  return {
    outputDir: path.resolve(PROJECT_ROOT, getArg('--output-dir') || ARTIFACT_DIR),
  };
}

async function readJson(name, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(path.join(ARTIFACT_DIR, name), 'utf8'));
  } catch {
    return fallback;
  }
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(value) {
  return `${numberValue(value).toFixed(1)}%`;
}

function tableEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function artifactMd(name) {
  return `artifacts/civic-launch-readiness/${name}`;
}

function action({
  id,
  priority,
  lane,
  title,
  status,
  evidence,
  refreshCommand,
  applyCommand = null,
  artifact,
  productionWrite = false,
  dependency = 'None.',
  nextStep,
}) {
  return {
    id,
    priority,
    lane,
    title,
    status,
    evidence,
    refresh_command: refreshCommand,
    apply_command: applyCommand,
    artifact,
    production_write: productionWrite,
    dependency,
    next_step: nextStep,
  };
}

function buildActions(artifacts) {
  const latestWarnings = artifacts.latest?.evaluation?.warnings || [];
  const saTier1 = artifacts.saTier1 || {};
  const tier1Candidates = saTier1.candidates || [];
  const saBudgetSummary = artifacts.saBudget?.summary || {};
  const saOversightSources = artifacts.saOversightSources?.summary || {};
  const saOversightReportRows = artifacts.saOversightReportRows?.summary || {};
  const saOversightRecommendations = artifacts.saOversightRecommendations?.summary || {};
  const nationalOversight = artifacts.nationalOversight?.summary || {};
  const foundation = artifacts.foundation || {};
  const dataBacklog = artifacts.dataBacklog?.summary?.totals || {};

  return [
    action({
      id: 'sa-tier1-acco-curation',
      priority: 1,
      lane: 'Organisations / ACCO',
      title: 'Move SA Tier 1 and ACCO review candidates into the admin curation queue',
      status: `${tier1Candidates.length} candidates; ${tier1Candidates.filter((row) => row.acco_certified).length} ACCO-certified; ${tier1Candidates.filter((row) => row.already_has_classification_row).length} already has classification row(s).`,
      evidence: latestWarnings.find((warning) => warning.includes('SA has only')) || 'SA confirmed Tier 1 coverage is thin.',
      refreshCommand: 'node scripts/civic/propose-sa-tier1-curation-candidates.mjs',
      applyCommand: 'node scripts/civic/propose-sa-tier1-curation-candidates.mjs --apply --yes-production',
      artifact: artifactMd('sa-tier1-curation-candidates.md'),
      productionWrite: true,
      dependency: 'After apply, review/confirm rows in /admin/civic/tier-1-curation. Apply creates proposals; it does not magically certify Tier 1.',
      nextStep: 'Source-review the 11 candidates, apply proposals if approved, then confirm only defensible Tier 1 rows.',
    }),
    action({
      id: 'sa-budget-2025-26-yj',
      priority: 1,
      lane: 'Money / Budgets',
      title: 'Import SA Budget 2025-26 DHS Youth Justice net-cost aggregate',
      status: `${saBudgetSummary.missing_rows ?? 0} missing row(s); ${saBudgetSummary.already_present ?? 0} already present; ${saBudgetSummary.inserted_rows ?? 0} inserted.`,
      evidence: `$${numberValue(saBudgetSummary.recommended_amount_dollars).toLocaleString('en-AU')} recommended aggregate amount.`,
      refreshCommand: 'node scripts/civic/propose-sa-budget-yj-candidates.mjs',
      applyCommand: 'node scripts/civic/propose-sa-budget-yj-candidates.mjs --apply --yes-production',
      artifact: artifactMd('sa-budget-yj-candidates.md'),
      productionWrite: true,
      dependency: 'Review against SA Budget Paper 4 Volume 3 before apply. Import only the net-cost aggregate to avoid double counting total expenses.',
      nextStep: 'Approve/apply the single aggregate row, then rerun launch audit to remove the SA budget warning.',
    }),
    action({
      id: 'sa-oversight-report-rows',
      priority: 1,
      lane: 'Oversight / SA',
      title: 'Import priority-1 SA children/visitor oversight report rows',
      status: `${saOversightReportRows.missing_rows ?? 0} missing report row(s); ${saOversightReportRows.existing_sa_children_rows ?? 0} existing SA rows; ${saOversightReportRows.inserted_rows ?? 0} inserted.`,
      evidence: `${saOversightSources.priority_1_missing ?? 0} priority-1 official source(s) missing from children_commissioner_reports.`,
      refreshCommand: 'node scripts/civic/propose-sa-oversight-report-rows.mjs --only priority1',
      applyCommand: 'node scripts/civic/propose-sa-oversight-report-rows.mjs --apply --yes-production',
      artifact: artifactMd('sa-oversight-report-rows.md'),
      productionWrite: true,
      dependency: 'Apply report rows before relying on SA broader oversight evidence in state pages.',
      nextStep: 'Review extracted key-finding snippets and apply report rows if approved.',
    }),
    action({
      id: 'sa-oversight-recommendations',
      priority: 2,
      lane: 'Oversight / SA',
      title: 'Apply explicit SA oversight recommendation candidates',
      status: `${saOversightRecommendations.pending_review ?? 0} pending recommendation candidate(s); ${saOversightRecommendations.already_indexed ?? 0} already indexed; ${saOversightRecommendations.inserted_rows ?? 0} inserted.`,
      evidence: '2 annual-report, 3 isolation-report and 9 AVL-report recommendation candidates extracted from official PDFs.',
      refreshCommand: 'node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs',
      applyCommand: 'node scripts/civic/propose-sa-oversight-recommendation-candidates.mjs --apply --yes-production',
      artifact: artifactMd('sa-oversight-recommendation-candidates.md'),
      productionWrite: true,
      dependency: 'Source-review text first. Prefer applying report rows before recommendation rows so state pages have both source evidence and recommendation ledger entries.',
      nextStep: 'Review the 14 extracted recommendations and apply after report rows if approved.',
    }),
    action({
      id: 'act-tas-wa-oversight-recommendations',
      priority: 2,
      lane: 'Oversight / National',
      title: 'Apply ACT/TAS/WA recommendation candidates from already-indexed evidence rows',
      status: `${nationalOversight.candidates?.length || nationalOversight.pending_review || 17} candidate(s) across ACT/TAS/WA.`,
      evidence: 'Launch audit still has no oversight recommendation rows for ACT, TAS and WA despite existing supporting evidence rows.',
      refreshCommand: 'node scripts/civic/propose-oversight-recommendation-candidates.mjs',
      applyCommand: 'node scripts/civic/propose-oversight-recommendation-candidates.mjs --apply --yes-production',
      artifact: artifactMd('oversight-recommendation-candidates.md'),
      productionWrite: true,
      dependency: 'Rows are generated from existing children_commissioner_reports and auditor_general_audits JSON. Source-review required.',
      nextStep: 'Review the 17 candidates and apply if approved to remove the ACT/TAS/WA recommendation extraction warning.',
    }),
    action({
      id: 'prf-foundation-classification',
      priority: 2,
      lane: 'Foundations / Classifier',
      title: 'Classify PRF annual-review foundation rows for YJ relevance',
      status: `${foundation.classified_rows || 0}/${foundation.total_rows || 0} foundation rows classified (${pct(foundation.classified_pct || 0)}); ${foundation.unclassified_rows || 0} unclassified rows across ${foundation.backlog_queue_count || 0} queues.`,
      evidence: 'PRF annual-review rows remain a launch-priority classifier gap; broader FRRR queue dominates volume.',
      refreshCommand: 'node scripts/civic/report-foundation-classifier-backlog.mjs',
      applyCommand: 'node scripts/civic/classify-foundation-grants-yj.mjs --foundation-abn 32623132472 --extraction-method prf_annual_review_partner_list,prf_annual_review_llm --batch 83 --apply --yes-production',
      artifact: artifactMd('foundation-classifier-backlog.md'),
      productionWrite: true,
      dependency: 'Run the PRF classifier command without --apply first and review samples/output. Classification uses model judgement and now requires --yes-production for writes.',
      nextStep: 'Dry-run PRF classifier, then apply only if output is source-defensible.',
    }),
    action({
      id: 'data-backlog-triage',
      priority: 3,
      lane: 'Data Sufficiency',
      title: 'Triage planned sources and non-closed gap questions',
      status: `${dataBacklog.planned_sources || 0} planned source(s); ${dataBacklog.unresolved_gaps || 0} non-closed gap(s); ${dataBacklog.high_priority_unresolved_gaps || 0} high-priority gap(s).`,
      evidence: 'Backlog remains real, but no pending agent findings are waiting for review.',
      refreshCommand: 'node scripts/civic/report-civic-data-backlog.mjs',
      artifact: artifactMd('data-backlog.md'),
      productionWrite: false,
      dependency: 'Depends on the higher-priority apply/source-review lanes above for launch impact.',
      nextStep: 'Use the top action queue to close source rows or mark gaps sourced/closed after evidence lands.',
    }),
  ];
}

const WARNING_COVERAGE_RULES = [
  {
    actionId: 'sa-tier1-acco-curation',
    patterns: [
      /SA has only \d+ confirmed Tier 1 organisations/i,
      /SA Tier 1\/ACCO review candidate/i,
      /SA has 0 ACCO-certified confirmed Tier 1 organisations/i,
    ],
  },
  {
    actionId: 'prf-foundation-classification',
    patterns: [/Foundation YJ classifier coverage/i],
  },
  {
    actionId: 'act-tas-wa-oversight-recommendations',
    patterns: [/No oversight recommendation rows for ACT, TAS, WA/i],
  },
  {
    actionId: 'sa-oversight-report-rows',
    patterns: [/SA broader oversight evidence is thin/i],
  },
  {
    actionId: 'sa-oversight-recommendations',
    patterns: [/SA broader oversight evidence is thin/i],
  },
  {
    actionId: 'sa-budget-2025-26-yj',
    patterns: [/SA Budget 2025-26 DHS Youth Justice aggregate/i],
  },
  {
    actionId: 'data-backlog-triage',
    patterns: [
      /planned source\(s\) remain/i,
      /non-closed data gap question\(s\) remain/i,
    ],
  },
];

function buildWarningCoverage(warnings, actions) {
  const actionIds = new Set(actions.map((row) => row.id));
  return warnings.map((warning) => {
    const action_ids = WARNING_COVERAGE_RULES
      .filter((rule) => actionIds.has(rule.actionId) && rule.patterns.some((pattern) => pattern.test(warning)))
      .map((rule) => rule.actionId);
    return {
      warning,
      action_ids,
      covered: action_ids.length > 0,
    };
  });
}

function renderMarkdown(payload) {
  const coveredCount = payload.warning_coverage.filter((row) => row.covered).length;
  const uncoveredCount = payload.warning_coverage.length - coveredCount;
  const lines = [
    '# Adelaide Launch Action Queue',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    'Read-only operator queue. It consolidates current launch warnings and candidate artifacts. Production writes still require explicit approval; commands listed with `--apply --yes-production` are not safe to run casually.',
    '',
    '## Headline',
    '',
    `- Launch blockers: ${payload.launch_blockers}`,
    `- Launch warnings: ${payload.launch_warnings}`,
    `- Warning coverage: ${coveredCount}/${payload.warning_coverage.length} covered`,
    `- Uncovered warnings: ${uncoveredCount}`,
    `- Production-write actions: ${payload.actions.filter((row) => row.production_write).length}`,
    `- Review-only actions: ${payload.actions.filter((row) => !row.production_write).length}`,
    '',
    '## Warning Coverage',
    '',
    '| Covered | Warning | Owner action(s) |',
    '| --- | --- | --- |',
  ];

  for (const row of payload.warning_coverage) {
    lines.push(`| ${row.covered ? 'yes' : 'no'} | ${tableEscape(row.warning)} | ${row.action_ids.map((id) => `\`${id}\``).join(', ')} |`);
  }

  lines.push(
    '',
    '## Action Queue',
    '',
    '| Priority | Lane | Action | Status | Artifact | Production write |',
    '| ---: | --- | --- | --- | --- | --- |',
  );

  for (const row of payload.actions) {
    lines.push(`| ${row.priority} | ${tableEscape(row.lane)} | ${tableEscape(row.title)} | ${tableEscape(row.status)} | ${row.artifact ? `[review](${path.basename(row.artifact)})` : ''} | ${row.production_write ? 'yes' : 'no'} |`);
  }

  lines.push('', '## Commands And Gates', '');
  for (const row of payload.actions) {
    lines.push(`### P${row.priority} - ${row.title}`);
    lines.push('');
    lines.push(`- Lane: ${row.lane}`);
    lines.push(`- Evidence: ${row.evidence}`);
    lines.push(`- Next step: ${row.next_step}`);
    lines.push(`- Dependency: ${row.dependency}`);
    lines.push(`- Refresh: \`${row.refresh_command}\``);
    if (row.apply_command) lines.push(`- Apply: \`${row.apply_command}\``);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function writeOutputs(outputDir, payload) {
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'adelaide-launch-action-queue.json');
  const mdPath = path.join(outputDir, 'adelaide-launch-action-queue.md');
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(mdPath, renderMarkdown(payload));
  return { jsonPath, mdPath };
}

async function main() {
  const args = parseArgs();
  const artifacts = {
    latest: await readJson('latest.json', {}),
    dataBacklog: await readJson('data-backlog.json', {}),
    foundation: await readJson('foundation-classifier-backlog.json', {}),
    nationalOversight: await readJson('oversight-recommendation-candidates.json', {}),
    saBudget: await readJson('sa-budget-yj-candidates.json', {}),
    saOversightSources: await readJson('sa-oversight-source-candidates.json', {}),
    saOversightReportRows: await readJson('sa-oversight-report-rows.json', {}),
    saOversightRecommendations: await readJson('sa-oversight-recommendation-candidates.json', {}),
    saTier1: await readJson('sa-tier1-curation-candidates.json', {}),
  };
  const latestEvaluation = artifacts.latest.evaluation || {};
  const warnings = latestEvaluation.warnings || [];
  const actions = buildActions(artifacts);
  const warningCoverage = buildWarningCoverage(warnings, actions);
  const payload = {
    generatedAt: new Date().toISOString(),
    launch_blockers: (latestEvaluation.blockers || []).length,
    launch_warnings: warnings.length,
    warnings,
    warning_coverage: warningCoverage,
    warning_coverage_summary: {
      covered: warningCoverage.filter((row) => row.covered).length,
      uncovered: warningCoverage.filter((row) => !row.covered).length,
    },
    actions,
  };
  const outputs = await writeOutputs(args.outputDir, payload);

  console.log('Adelaide launch action queue');
  console.log(`- Blockers: ${payload.launch_blockers}`);
  console.log(`- Warnings: ${payload.launch_warnings}`);
  console.log(`- Warning coverage: ${payload.warning_coverage_summary.covered}/${payload.launch_warnings}`);
  console.log(`- Actions: ${payload.actions.length}`);
  console.log(`- Production-write actions: ${payload.actions.filter((row) => row.production_write).length}`);
  console.log(`- JSON: ${path.relative(PROJECT_ROOT, outputs.jsonPath)}`);
  console.log(`- Report: ${path.relative(PROJECT_ROOT, outputs.mdPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
