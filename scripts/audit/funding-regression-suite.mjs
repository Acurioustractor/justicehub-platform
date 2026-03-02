import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const outputRoot = process.env.FUNDING_SMOKE_OUTPUT_DIR || path.join(process.cwd(), 'artifacts', 'funding-smoke');
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const runDir = path.join(outputRoot, runId);

const checks = [
  {
    label: 'Seeded funding smoke',
    command: ['node', 'scripts/audit/funding-smoke-check.mjs'],
    env: {
      FUNDING_SMOKE_EXPECT_SEEDED: 'true',
    },
  },
  {
    label: 'Funding promotion smoke',
    command: ['node', 'scripts/audit/funding-promotion-smoke.mjs'],
  },
  {
    label: 'Funding public contribution smoke',
    command: ['node', 'scripts/audit/funding-public-contribution-smoke.mjs'],
  },
  {
    label: 'Funding public evidence moderation smoke',
    command: ['node', 'scripts/audit/funding-public-evidence-moderation-smoke.mjs'],
  },
  {
    label: 'Funding admin auth smoke',
    command: ['node', 'scripts/audit/funding-admin-auth-smoke.mjs'],
  },
  {
    label: 'Funding application draft smoke',
    command: ['node', 'scripts/audit/funding-application-draft-smoke.mjs'],
  },
  {
    label: 'Funding browser flow smoke',
    command: ['node', 'scripts/audit/funding-browser-flow-smoke.mjs'],
  },
  {
    label: 'Funding conversation smoke',
    command: ['node', 'scripts/audit/funding-conversation-smoke.mjs'],
  },
  {
    label: 'Funding conversation admin triage smoke',
    command: ['node', 'scripts/audit/funding-conversation-admin-triage-smoke.mjs'],
  },
  {
    label: 'Funding relationship pathway smoke',
    command: ['node', 'scripts/audit/funding-relationship-pathway-smoke.mjs'],
  },
];

function toMarkdown(results) {
  const lines = ['# Funding Regression Suite', '', `Run: ${runId}`, ''];

  for (const result of results) {
    lines.push(`- ${result.label}: ${result.status === 0 ? 'passed' : `failed (${result.status})`} in ${result.durationMs}ms`);
  }

  return `${lines.join('\n')}\n`;
}

const results = [];

await fs.mkdir(runDir, { recursive: true });

for (const check of checks) {
  console.log(`\n=== ${check.label} ===`);
  const startedAt = Date.now();

  const result = spawnSync(check.command[0], check.command.slice(1), {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...(check.env || {}),
    },
  });

  results.push({
    label: check.label,
    status: result.status || 0,
    durationMs: Date.now() - startedAt,
  });

  if (result.status !== 0) {
    await fs.writeFile(path.join(runDir, 'report.json'), JSON.stringify({ runId, results }, null, 2), 'utf8');
    await fs.writeFile(path.join(runDir, 'report.md'), toMarkdown(results), 'utf8');
    process.exit(result.status || 1);
  }
}

await fs.writeFile(path.join(runDir, 'report.json'), JSON.stringify({ runId, results }, null, 2), 'utf8');
await fs.writeFile(path.join(runDir, 'report.md'), toMarkdown(results), 'utf8');

console.log('\nFunding regression suite passed.');
