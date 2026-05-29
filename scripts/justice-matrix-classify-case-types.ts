#!/usr/bin/env npx tsx
/**
 * Classify justice_matrix_cases.case_type (#8). Deterministic, no LLM.
 *
 * Two safe actions, driven by the shared normalizer (src/lib/justice-matrix/case-type):
 *   fill    case_type IS NULL -> the kind's canonical value (the 38 untyped rows
 *           are court decisions by jurisdiction; they get court_decision)
 *   retype  the citation strongly contradicts the stored type (e.g. an NGO
 *           "Position Paper" stored as court_decision) -> corrected to its kind
 *
 * Rows whose stored type already agrees with the citation are left untouched -
 * specific values (royal_commission, statistical_report, legislative_reform) are
 * correct and the UI overlay rolls them up to a kind anyway.
 *
 * Usage:
 *   npx tsx scripts/justice-matrix-classify-case-types.ts            (dry run, full diff)
 *   npx tsx scripts/justice-matrix-classify-case-types.ts --apply
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { classifyCase, rawKind, CANONICAL_TYPE } from '../src/lib/justice-matrix/case-type';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce<Record<string, string>>((acc, l) => {
    const [k, ...v] = l.split('=');
    acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');

interface Row {
  id: string;
  case_citation: string | null;
  jurisdiction: string | null;
  case_type: string | null;
}

async function run() {
  console.log(`\nCase-type classify (#8)  |  ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const { data, error } = await supabase
    .from('justice_matrix_cases')
    .select('id,case_citation,jurisdiction,case_type')
    .order('case_type', { ascending: true, nullsFirst: true });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  const rows = (data ?? []) as Row[];

  let fills = 0;
  let retypes = 0;
  let kept = 0;
  let failed = 0;

  for (const r of rows) {
    const kind = classifyCase(r.case_citation, r.case_type, r.jurisdiction);
    const target = CANONICAL_TYPE[kind];
    const stored = rawKind(r.case_type);

    let action: 'fill' | 'retype' | 'keep';
    if (!r.case_type) action = 'fill';
    else if (stored !== kind) action = 'retype'; // title signal overrode the stored type
    else action = 'keep';

    if (action === 'keep') {
      kept++;
      continue;
    }

    const tag = action === 'fill' ? 'FILL  ' : 'RETYPE';
    const was = action === 'retype' ? ` (was ${r.case_type})` : '';
    console.log(`  ${tag} -> ${target}${was}  |  ${(r.case_citation || '').slice(0, 58)}`);

    if (APPLY) {
      const { error: upErr } = await supabase
        .from('justice_matrix_cases')
        .update({ case_type: target, updated_at: new Date().toISOString() })
        .eq('id', r.id);
      if (upErr) {
        console.log(`    ! write failed: ${upErr.message}`);
        failed++;
        continue;
      }
    }
    if (action === 'fill') fills++;
    else retypes++;
  }

  console.log(
    `\n${APPLY ? 'Wrote' : 'Would write'}: ${fills} fills, ${retypes} retypes  |  kept ${kept}  |  failed ${failed}  |  total ${rows.length}`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
