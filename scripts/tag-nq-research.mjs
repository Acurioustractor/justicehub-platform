#!/usr/bin/env node
/**
 * NQ Research Findings Tagger
 *
 * Tags alma_research_findings for NQ and QLD relevance
 * by scanning content JSONB and sources for location keywords.
 *
 * Usage:
 *   node scripts/tag-nq-research.mjs                    # dry-run
 *   node scripts/tag-nq-research.mjs --apply --migrate   # add columns + tag
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Env ───────────────────────────────────────────────────────────────────────

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ─── Flags ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const MIGRATE = args.includes('--migrate');

// ─── Keywords ───────────────────────────────────────────────────────────────────

const NQ_KEYWORDS = [
  'townsville', 'mount isa', 'cairns', 'palm island', 'thursday island',
  'north queensland', 'north qld', 'nq',
  'cleveland youth detention',
  'tropical north', 'far north queensland', 'fnq',
  'kalkadoon', 'wulgurukaba', 'bindal', 'yidinji', 'djabugay',
  'torres strait', 'cape york',
];

const QLD_KEYWORDS = [
  'queensland', 'qld', 'brisbane', 'gold coast', 'sunshine coast',
  'logan', 'ipswich', 'rockhampton', 'mackay', 'gladstone',
];

// NQ keywords also imply QLD relevance
const ALL_QLD_KEYWORDS = [...QLD_KEYWORDS, ...NQ_KEYWORDS];

/**
 * Check if text contains any keyword from the list (case-insensitive, word boundary).
 */
function matchesKeywords(text, keywords) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => {
    // Use word boundary matching for short keywords to avoid false positives
    if (kw.length <= 3) {
      const re = new RegExp(`\\b${kw}\\b`, 'i');
      return re.test(lower);
    }
    return lower.includes(kw);
  });
}

// ─── Migration ──────────────────────────────────────────────────────────────────

async function migrateColumns() {
  console.log('[migrate] Adding nq_relevant and qld_relevant columns...');

  // Check if columns exist by fetching one row
  const { data: sample, error: sampleErr } = await supabase
    .from('alma_research_findings')
    .select('id')
    .limit(1)
    .single();

  // Try adding columns via raw SQL (using rpc or direct)
  const { error: err1 } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE alma_research_findings ADD COLUMN IF NOT EXISTS nq_relevant boolean DEFAULT false',
  });

  if (err1) {
    // Fallback: use the REST API to check — if rpc doesn't exist, log instruction
    console.log('[migrate] rpc exec_sql not available, trying direct SQL...');
    // Use supabase-js admin query
    const res1 = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          query: `
            ALTER TABLE alma_research_findings ADD COLUMN IF NOT EXISTS nq_relevant boolean DEFAULT false;
            ALTER TABLE alma_research_findings ADD COLUMN IF NOT EXISTS qld_relevant boolean DEFAULT false;
          `,
        }),
      }
    );
    if (!res1.ok) {
      const body = await res1.text();
      if (body.includes('could not find the function')) {
        console.log('[migrate] No exec_sql RPC found. Run this SQL manually in Supabase Dashboard:');
        console.log('  ALTER TABLE alma_research_findings ADD COLUMN IF NOT EXISTS nq_relevant boolean DEFAULT false;');
        console.log('  ALTER TABLE alma_research_findings ADD COLUMN IF NOT EXISTS qld_relevant boolean DEFAULT false;');
        console.log('');
        console.log('Then re-run: node scripts/tag-nq-research.mjs --apply');
        process.exit(1);
      }
      console.error('[migrate] SQL error:', body);
      process.exit(1);
    }
    console.log('[migrate] Columns added via REST RPC.');
    return;
  }

  // If first rpc worked, do the second column
  await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE alma_research_findings ADD COLUMN IF NOT EXISTS qld_relevant boolean DEFAULT false',
  });

  console.log('[migrate] Columns added successfully.');
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== NQ Research Findings Tagger ===`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}${MIGRATE ? ' + MIGRATE' : ''}\n`);

  // Step 1: Migrate if needed
  if (MIGRATE && APPLY) {
    await migrateColumns();
  } else if (MIGRATE && !APPLY) {
    console.log('[skip] --migrate requires --apply to actually run migrations.\n');
  }

  // Step 2: Fetch all findings
  console.log('[fetch] Loading all alma_research_findings...');

  let allFindings = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('alma_research_findings')
      .select('id, content, sources, finding_type, confidence')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('[error] Fetch failed:', error.message);
      process.exit(1);
    }

    allFindings = allFindings.concat(data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log(`[fetch] Loaded ${allFindings.length} research findings.\n`);

  // Step 3: Classify each finding
  const nqMatches = [];
  const qldMatches = [];
  const nqKeywordHits = {};
  const qldKeywordHits = {};

  for (const finding of allFindings) {
    // Stringify content JSONB for keyword search
    const contentStr = finding.content ? JSON.stringify(finding.content) : '';
    const sourcesStr = finding.sources ? finding.sources.join(' ') : '';
    const searchText = `${contentStr} ${sourcesStr}`;

    const isNQ = matchesKeywords(searchText, NQ_KEYWORDS);
    const isQLD = matchesKeywords(searchText, ALL_QLD_KEYWORDS);

    if (isNQ) {
      nqMatches.push(finding.id);
      // Track which keywords matched for reporting
      for (const kw of NQ_KEYWORDS) {
        if (matchesKeywords(searchText, [kw])) {
          nqKeywordHits[kw] = (nqKeywordHits[kw] || 0) + 1;
        }
      }
    }

    if (isQLD) {
      qldMatches.push(finding.id);
      for (const kw of ALL_QLD_KEYWORDS) {
        if (matchesKeywords(searchText, [kw])) {
          qldKeywordHits[kw] = (qldKeywordHits[kw] || 0) + 1;
        }
      }
    }
  }

  // Step 4: Report
  console.log(`── Results ──────────────────────────────`);
  console.log(`Total findings:   ${allFindings.length}`);
  console.log(`NQ relevant:      ${nqMatches.length} (${((nqMatches.length / allFindings.length) * 100).toFixed(1)}%)`);
  console.log(`QLD relevant:     ${qldMatches.length} (${((qldMatches.length / allFindings.length) * 100).toFixed(1)}%)`);
  console.log(`Neither:          ${allFindings.length - qldMatches.length}`);
  console.log('');

  if (Object.keys(nqKeywordHits).length > 0) {
    console.log('NQ keyword hits:');
    for (const [kw, count] of Object.entries(nqKeywordHits).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${kw}: ${count}`);
    }
    console.log('');
  }

  if (Object.keys(qldKeywordHits).length > 0) {
    console.log('QLD keyword hits (top 10):');
    for (const [kw, count] of Object.entries(qldKeywordHits).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`  ${kw}: ${count}`);
    }
    console.log('');
  }

  // Step 5: Apply if requested
  if (APPLY) {
    console.log('[apply] Updating records...');

    // Reset all to false first
    const { error: resetErr } = await supabase
      .from('alma_research_findings')
      .update({ nq_relevant: false, qld_relevant: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // match all

    if (resetErr) {
      // Column might not exist yet
      if (resetErr.message.includes('column') || resetErr.code === '42703') {
        console.error('[error] Columns do not exist. Run with --apply --migrate first.');
        process.exit(1);
      }
      console.error('[error] Reset failed:', resetErr.message);
      process.exit(1);
    }

    // Tag NQ matches in batches
    if (nqMatches.length > 0) {
      const BATCH = 100;
      for (let i = 0; i < nqMatches.length; i += BATCH) {
        const batch = nqMatches.slice(i, i + BATCH);
        const { error } = await supabase
          .from('alma_research_findings')
          .update({ nq_relevant: true })
          .in('id', batch);
        if (error) {
          console.error(`[error] NQ batch ${i / BATCH + 1} failed:`, error.message);
        }
      }
      console.log(`[apply] Tagged ${nqMatches.length} NQ-relevant findings.`);
    }

    // Tag QLD matches in batches
    if (qldMatches.length > 0) {
      const BATCH = 100;
      for (let i = 0; i < qldMatches.length; i += BATCH) {
        const batch = qldMatches.slice(i, i + BATCH);
        const { error } = await supabase
          .from('alma_research_findings')
          .update({ qld_relevant: true })
          .in('id', batch);
        if (error) {
          console.error(`[error] QLD batch ${i / BATCH + 1} failed:`, error.message);
        }
      }
      console.log(`[apply] Tagged ${qldMatches.length} QLD-relevant findings.`);
    }

    console.log('[done] Tags applied successfully.');
  } else {
    console.log('[dry-run] No changes made. Use --apply to write tags.');
    console.log('[dry-run] Use --apply --migrate to also add columns.\n');
  }
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
