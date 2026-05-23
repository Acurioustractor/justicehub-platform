#!/usr/bin/env node
/**
 * ABR (Australian Business Register) refresh detector — CHEAP path.
 *
 * Polls the data.gov.au CKAN API for the `abn-bulk-extract` package,
 * inspects each resource's `last_modified` timestamp, and compares
 * against rows already in `abr_refresh_log`. When a resource has a
 * newer publish date than anything we've seen, insert a new log row
 * with `processed=false` so a downstream streaming ingestor can pick
 * it up later.
 *
 * What this script DOES:
 *   - GETs https://data.gov.au/data/api/3/action/package_show?id=abn-bulk-extract
 *   - Reads each resource.last_modified
 *   - Inserts a new abr_refresh_log row only when newer than last seen
 *   - Logs everything detected
 *
 * What this script DOES NOT do:
 *   - Download the ~2GB of XML
 *   - Stream-parse XML
 *   - Touch abr_registry
 *   - Trigger anything else
 *
 * The full streaming ingestor is a separate later job. This is just
 * the polling step that tells us a new extract exists.
 *
 * Usage:
 *   node scripts/civic/abr-refresh-check.mjs               # dry-run (no writes)
 *   node scripts/civic/abr-refresh-check.mjs --apply       # insert detected rows
 *
 * Cadence target: weekly (Mon morning), via Vercel cron or pm2.
 *
 * Fallback: on CKAN error (non-200 or network), log status and exit
 * cleanly (exit code 0) — refresh detection is best-effort, retry next
 * cycle.
 *
 * See: docs/civic-connectors/build-specs.md section 6.A
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const apply = process.argv.includes('--apply');

// Package id on data.gov.au CKAN. Verified in build-specs.md §6.A.
const CKAN_URL = 'https://data.gov.au/data/api/3/action/package_show?id=abn-bulk-extract';

async function fetchCkanPackage() {
  const res = await fetch(CKAN_URL, {
    headers: { Accept: 'application/json', 'User-Agent': 'JusticeHub-ABR-Refresh-Detector/1.0' },
  });
  if (!res.ok) {
    throw new Error(`CKAN ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  if (!body || body.success !== true || !body.result) {
    throw new Error('CKAN response missing result/success');
  }
  return body.result;
}

async function getLastSeen(resourceId) {
  // Most recent log row for this resource — used to decide whether
  // the CKAN-reported last_modified is genuinely new.
  const { data, error } = await supabase
    .from('abr_refresh_log')
    .select('last_modified, processed')
    .eq('resource_id', resourceId)
    .order('last_modified', { ascending: false })
    .limit(1);
  if (error) {
    // Table missing is OK in dry-run before migration is applied.
    // PostgREST surfaces this as "Could not find the table 'public.X' in
    // the schema cache" (PGRST205); raw PG gives "relation does not exist".
    if (/relation .* does not exist/i.test(error.message) ||
        /could not find the table/i.test(error.message) ||
        error.code === 'PGRST205') {
      return { _missing: true };
    }
    throw new Error(`select abr_refresh_log: ${error.message}`);
  }
  return data && data[0] ? data[0] : null;
}

async function insertRefreshRow(row) {
  if (!apply) return { action: 'would_insert' };
  const { error } = await supabase.from('abr_refresh_log').insert({
    resource_id: row.resource_id,
    resource_label: row.resource_label,
    last_modified: row.last_modified,
    processed: false,
  });
  if (error) {
    // Unique-constraint hit means another run already logged this
    // (resource_id, last_modified) pair. Idempotent — not an error.
    if (/duplicate key|unique constraint/i.test(error.message)) {
      return { action: 'duplicate_skipped' };
    }
    throw new Error(`insert abr_refresh_log: ${error.message}`);
  }
  return { action: 'inserted' };
}

function normalisedTs(s) {
  // CKAN last_modified is sometimes 'YYYY-MM-DDTHH:MM:SS' with no
  // timezone. Treat naive timestamps as UTC for consistent compares.
  if (!s) return null;
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s);
  const iso = hasTz ? s : `${s}Z`;
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

async function main() {
  console.log(`ABR refresh detector · ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`CKAN endpoint: ${CKAN_URL}\n`);

  let pkg;
  try {
    pkg = await fetchCkanPackage();
  } catch (e) {
    // Fallback per spec: log + exit clean. Detector is best-effort;
    // next scheduled run picks up any missed refresh.
    console.warn(`! CKAN fetch failed: ${e.message}`);
    console.warn(`  (exiting cleanly — refresh check will retry next cycle)`);
    process.exit(0);
  }

  const resources = Array.isArray(pkg.resources) ? pkg.resources : [];
  console.log(`Package: ${pkg.title || pkg.name || '(unknown)'} — ${resources.length} resources\n`);

  if (resources.length === 0) {
    console.warn(`! No resources on CKAN package — possible upstream restructure`);
    process.exit(0);
  }

  let newCount = 0;
  let unchangedCount = 0;
  let errorCount = 0;

  for (const r of resources) {
    const resourceId = r.id || r.url || r.name;
    const label = r.name || r.format || '(unnamed)';
    const lastModified = normalisedTs(r.last_modified || r.created);

    if (!resourceId || !lastModified) {
      console.warn(`  ! skipping resource with missing id/last_modified: ${JSON.stringify({ id: r.id, last_modified: r.last_modified })}`);
      errorCount++;
      continue;
    }

    try {
      const prev = await getLastSeen(resourceId);
      if (prev && prev._missing) {
        // Migration not yet applied — print what we'd record and move on.
        console.log(`  NEW?   ${label.padEnd(38)} ${lastModified}  (table not yet applied)`);
        newCount++;
        continue;
      }
      const prevTs = prev ? new Date(prev.last_modified).getTime() : 0;
      const curTs = new Date(lastModified).getTime();

      if (curTs > prevTs) {
        const res = await insertRefreshRow({
          resource_id: resourceId,
          resource_label: label,
          last_modified: lastModified,
        });
        newCount++;
        console.log(`  NEW    ${label.padEnd(38)} ${lastModified}  → ${res.action}`);
      } else {
        unchangedCount++;
        console.log(`  same   ${label.padEnd(38)} ${lastModified}`);
      }
    } catch (e) {
      errorCount++;
      console.warn(`  ! ${label}: ${e.message}`);
    }
  }

  console.log(`\n${newCount} new · ${unchangedCount} unchanged · ${errorCount} errors`);
  if (!apply && newCount > 0) {
    console.log(`\nDry-run: rerun with --apply to record ${newCount} new refresh row(s).`);
  }
}

main().catch((e) => {
  console.error(`fatal: ${e.message}`);
  process.exit(1);
});
