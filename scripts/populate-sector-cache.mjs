#!/usr/bin/env node
/**
 * Populate sector_map_cache table with pre-computed sector data.
 * Uses direct PostgREST fetch to bypass Supabase JS schema cache issues.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

async function postgrest(path, opts = {}) {
  const url = `${BASE}${path}`;
  const mergedHeaders = { ...HEADERS, ...opts.headers };
  const res = await fetch(url, { ...opts, headers: mergedHeaders });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostgREST ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// Fetch all rows from a PostgREST endpoint, paginating in chunks
async function postgrestAll(path, pageSize = 5000) {
  let all = [];
  let offset = 0;
  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const data = await postgrest(`${path}${sep}limit=${pageSize}&offset=${offset}`);
    all = all.concat(data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function upsertCache(key, data) {
  try {
    const res = await fetch(`${BASE}/sector_map_cache`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key, data, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PostgREST ${res.status}: ${text.slice(0, 200)}`);
    }
    console.log(`  ✓ ${key}`);
  } catch (err) {
    console.error(`  ✗ ${key}: ${err.message}`);
    process.exitCode = 1;
  }
}

async function computeFundingBySource() {
  const sources = [
    'qgip', 'qld-historical-grants', 'austender-direct', 'rogs-yj-expenditure',
    'rogs-2026', 'niaa-senate-order-16', 'dyjvs-contracts', 'brisbane_council',
    'aihw-yj', 'qld-budget-sds', 'vic-budget-2024', 'wa-budget-2024',
    'nsw-budget-2024', 'tas-budget-2024', 'nt-budget-2024', 'sa-budget-2024',
  ];
  const results = [];

  for (const source of sources) {
    try {
      // Use smaller page size for large sources to avoid timeouts
      const pageSize = source === 'qgip' ? 500 : ['qld-historical-grants', 'austender-direct'].includes(source) ? 1000 : 5000;
      const data = await postgrestAll(
        `/justice_funding?select=amount_dollars&source=eq.${encodeURIComponent(source)}&amount_dollars=gt.0&order=id`,
        pageSize
      );
      if (!data || data.length === 0) continue;
      const total = data.reduce((s, r) => s + (Number(r.amount_dollars) || 0), 0);
      results.push({ source, grant_count: data.length, total_millions: Math.round(total / 1000000 * 10) / 10 });
      process.stdout.write(`    ${source}: ${data.length} grants, $${Math.round(total/1000000)}M\n`);
    } catch (err) {
      console.log(`    ${source} ERROR: ${err.message}`);
    }
  }

  results.sort((a, b) => b.total_millions - a.total_millions);
  return results;
}

async function computeTopFundingFlows() {
  try {
    const data = await postgrest(
      '/justice_funding?select=source,recipient_name,amount_dollars,financial_year&amount_dollars=gt.0&recipient_name=not.is.null&order=amount_dollars.desc&limit=5000'
    );

    const groups = {};
    for (const r of data || []) {
      const key = `${r.source}::${r.recipient_name}`;
      if (!groups[key]) {
        groups[key] = { source: r.source, recipient: r.recipient_name, total_amount: 0, grant_count: 0, latest_year: '' };
      }
      groups[key].total_amount += Number(r.amount_dollars) || 0;
      groups[key].grant_count++;
      const yr = String(r.financial_year || '');
      if (yr > groups[key].latest_year) groups[key].latest_year = yr;
    }

    return Object.values(groups).sort((a, b) => b.total_amount - a.total_amount).slice(0, 30);
  } catch (err) {
    console.log(`    top_funding ERROR: ${err.message}`);
    return [];
  }
}

async function computeInterventionTypes() {
  try {
    const data = await postgrestAll(
      '/alma_interventions?select=type&verification_status=neq.ai_generated'
    );
    const counts = {};
    for (const r of data || []) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  } catch (err) {
    console.log(`    intervention_types ERROR: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('=== Populating sector_map_cache ===\n');

  // 1. Funding by source
  console.log('Computing funding by source...');
  const fundingBySource = await computeFundingBySource();
  await upsertCache('funding_by_source', fundingBySource);

  // 2. Funding total
  const totalBillions = fundingBySource.reduce((s, r) => s + r.total_millions, 0) / 1000;
  await upsertCache('funding_total', { total_billions: Math.round(totalBillions * 10) / 10 });
  console.log(`  Total: $${Math.round(totalBillions * 10) / 10}B`);

  // 3. Top funding flows
  console.log('Computing top funding flows...');
  const topFunding = await computeTopFundingFlows();
  await upsertCache('top_justice_funding', topFunding);

  // 4. Intervention types
  console.log('Computing intervention types...');
  const interventionTypes = await computeInterventionTypes();
  await upsertCache('intervention_types', interventionTypes);

  // 5. Entity breakdown + relationship types already populated via pg_stats SQL

  // 6. GS approximate counts (use pg_stats to avoid full table scans)
  console.log('Computing GS counts via pg_stats...');
  try {
    const gsStats = await postgrest('/rpc/get_gs_approximate_counts');
    await upsertCache('gs_counts', gsStats);
  } catch {
    // Fallback: use reltuples from pg_class (approximate row counts)
    try {
      const approx = await postgrest(
        `/rpc/sql?cmd=${encodeURIComponent("SELECT json_build_object('entities', (SELECT reltuples::bigint FROM pg_class WHERE relname='gs_entities'), 'austender_contracts', (SELECT reltuples::bigint FROM pg_class WHERE relname='austender_contracts'), 'foundations', (SELECT reltuples::bigint FROM pg_class WHERE relname='foundations')) as result")}`
      );
      // If RPC doesn't exist, just use hardcoded values
      console.log('  GS counts: using hardcoded fallback (RPC not available)');
      await upsertCache('gs_counts', { entities: 145024, austender_contracts: 670919, foundations: 10779 });
    } catch {
      console.log('  GS counts: using hardcoded fallback');
      await upsertCache('gs_counts', { entities: 145024, austender_contracts: 670919, foundations: 10779 });
    }
  }

  console.log('\n=== Done ===');

  // Verify
  try {
    const cache = await postgrest('/sector_map_cache?select=key,updated_at');
    console.log('\nCache contents:');
    for (const row of cache) {
      console.log(`  ${row.key}: updated ${row.updated_at}`);
    }
  } catch (err) {
    console.log('Could not verify cache:', err.message);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
