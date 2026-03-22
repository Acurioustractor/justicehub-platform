#!/usr/bin/env node
/**
 * Supplier Outcomes & Accountability Researcher
 *
 * Researches and imports accountability/outcome data for the top QLD youth
 * justice contract suppliers. Checks ACNC charity data, links to organizations
 * table, and searches for published outcome/financial data via Serper.
 *
 * Findings are stored in cross_system_stats with domain='accountability'.
 *
 * Usage:
 *   node scripts/scrape-supplier-outcomes.mjs          # dry-run
 *   node scripts/scrape-supplier-outcomes.mjs --apply   # write to DB
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

const applyMode = process.argv.includes('--apply');

// ─── Suppliers ─────────────────────────────────────────────────────────────────

const SUPPLIERS = [
  { name: 'Life Without Barriers', contractValue: 337_000_000, searchName: 'Life Without Barriers', indigenous: false },
  { name: 'Churches of Christ in Queensland', contractValue: 310_000_000, searchName: 'Churches of Christ in Queensland', indigenous: false },
  { name: 'Mercy Community Services SEQ', contractValue: 293_000_000, searchName: 'Mercy Community Services', indigenous: false },
  { name: 'Safe Places Community Services', contractValue: 279_000_000, searchName: 'Safe Places Community Services', indigenous: false },
  { name: 'Diocese of Brisbane', contractValue: 264_000_000, searchName: 'Diocese of Brisbane', indigenous: false },
  { name: 'UnitingCare Community', contractValue: 229_000_000, searchName: 'UnitingCare Community', indigenous: false },
  { name: 'Act for Kids', contractValue: 218_000_000, searchName: 'Act for Kids', indigenous: false },
  { name: 'IFYS Limited', contractValue: 188_000_000, searchName: 'IFYS Limited', indigenous: false },
  { name: 'GEO Group Australia', contractValue: 82_000_000, searchName: 'GEO Group Australia', indigenous: false },
  { name: 'Anglicare North Queensland', contractValue: 65_000_000, searchName: 'Anglicare North Queensland', indigenous: false },
  { name: 'Kummara Limited', contractValue: 55_000_000, searchName: 'Kummara', indigenous: true },
];

// ─── Search ────────────────────────────────────────────────────────────────────

let searchCount = 0;
const MAX_SEARCHES = 10;

async function searchSerper(query) {
  if (!env.SERPER_API_KEY) {
    console.log('  [search] No SERPER_API_KEY — skipping web search');
    return [];
  }
  if (searchCount >= MAX_SEARCHES) {
    console.log(`  [search] Search quota reached (${MAX_SEARCHES}) — skipping`);
    return [];
  }
  searchCount++;
  console.log(`  [search ${searchCount}/${MAX_SEARCHES}] ${query}`);
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': env.SERPER_API_KEY },
      body: JSON.stringify({ q: query, num: 5 }),
    });
    if (!res.ok) throw new Error(`Serper ${res.status}`);
    const data = await res.json();
    return (data.organic || []).map((r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet || '',
    }));
  } catch (err) {
    console.log(`  [search] Error: ${err.message}`);
    return [];
  }
}

// ─── ACNC Lookup ───────────────────────────────────────────────────────────────

async function lookupACNC(supplier) {
  // Try exact-ish match first, then broader
  const patterns = [
    supplier.searchName,
    supplier.name,
  ];

  for (const pattern of patterns) {
    const { data, error } = await supabase
      .from('acnc_charities')
      .select('*')
      .ilike('name', `%${pattern}%`)
      .limit(3);

    if (error) {
      console.log(`  [acnc] Error: ${error.message}`);
      return null;
    }
    if (data && data.length > 0) {
      return data[0]; // Best match
    }
  }
  return null;
}

// ─── Organizations Lookup ──────────────────────────────────────────────────────

async function lookupOrganization(supplier, abn) {
  // Try by ABN first (most reliable)
  if (abn) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn, state, is_indigenous_org, acnc_data')
      .eq('abn', abn)
      .limit(1);
    if (data && data.length > 0) return data[0];
  }

  // Fall back to name search
  const patterns = [supplier.searchName, supplier.name];
  for (const pattern of patterns) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, abn, state, is_indigenous_org, acnc_data')
      .ilike('name', `%${pattern}%`)
      .limit(3);
    if (data && data.length > 0) return data[0];
  }
  return null;
}

// ─── Research a Single Supplier ────────────────────────────────────────────────

async function researchSupplier(supplier) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Researching: ${supplier.name} ($${(supplier.contractValue / 1e6).toFixed(0)}M in QLD contracts)`);
  console.log('='.repeat(70));

  const findings = [];

  // 1. ACNC lookup
  console.log('\n  [acnc] Searching ACNC charities...');
  const acnc = await lookupACNC(supplier);
  if (acnc) {
    console.log(`  [acnc] Found: ${acnc.name} (ABN: ${acnc.abn || 'N/A'})`);
    console.log(`  [acnc] Status: ${acnc.status || 'unknown'} | Type: ${acnc.type || 'unknown'}`);
    console.log(`  [acnc] State: ${acnc.state || 'unknown'} | Town: ${acnc.town_city || 'unknown'}`);

    // Record ACNC registration status
    findings.push({
      domain: 'accountability',
      metric: 'supplier_acnc_registered',
      value: 1,
      unit: 'boolean',
      state: 'QLD',
      indigenous_status: supplier.indigenous ? 'indigenous' : 'all',
      financial_year: '2024-25',
      source_name: 'ACNC Register',
      source_url: `https://www.acnc.gov.au/charity/${acnc.abn || ''}`,
      notes: `${supplier.name} — ACNC status: ${acnc.status || 'unknown'}. QLD YJ contract value: $${(supplier.contractValue / 1e6).toFixed(0)}M`,
    });
  } else {
    console.log('  [acnc] Not found in ACNC register');
    findings.push({
      domain: 'accountability',
      metric: 'supplier_acnc_registered',
      value: 0,
      unit: 'boolean',
      state: 'QLD',
      indigenous_status: supplier.indigenous ? 'indigenous' : 'all',
      financial_year: '2024-25',
      source_name: 'ACNC Register',
      notes: `${supplier.name} — NOT found in ACNC register. QLD YJ contract value: $${(supplier.contractValue / 1e6).toFixed(0)}M`,
    });
  }

  // 2. Organizations table lookup
  console.log('\n  [org] Searching organizations table...');
  const org = await lookupOrganization(supplier, acnc?.abn);
  if (org) {
    console.log(`  [org] Found: ${org.name} (ID: ${org.id})`);
    console.log(`  [org] ABN: ${org.abn || 'N/A'} | State: ${org.state || 'N/A'} | Indigenous: ${org.is_indigenous_org || false}`);

    findings.push({
      domain: 'accountability',
      metric: 'supplier_in_org_database',
      value: 1,
      unit: 'boolean',
      state: 'QLD',
      indigenous_status: supplier.indigenous ? 'indigenous' : 'all',
      financial_year: '2024-25',
      source_name: 'JusticeHub Organizations',
      notes: `${supplier.name} — org_id: ${org.id}, ABN: ${org.abn || 'N/A'}`,
    });
  } else {
    console.log('  [org] Not found in organizations table');
  }

  // 3. Record the contract value itself
  findings.push({
    domain: 'accountability',
    metric: 'supplier_qld_contract_value',
    value: supplier.contractValue,
    unit: 'dollars',
    state: 'QLD',
    indigenous_status: supplier.indigenous ? 'indigenous' : 'all',
    financial_year: '2023-24',
    source_name: 'QLD Government Contract Disclosures',
    source_url: 'https://www.data.qld.gov.au',
    notes: `${supplier.name} — total QLD youth justice contract value`,
  });

  // 4. Web search for outcomes (max 2 per supplier, but respect global cap)
  if (searchCount < MAX_SEARCHES) {
    console.log('\n  [web] Searching for outcome/accountability data...');

    // Search 1: outcomes + annual report
    const outcomeResults = await searchSerper(
      `"${supplier.searchName}" youth justice outcomes Queensland annual report`
    );
    if (outcomeResults.length > 0) {
      const topResults = outcomeResults.slice(0, 3);
      console.log(`  [web] Found ${outcomeResults.length} results for outcomes:`);
      for (const r of topResults) {
        console.log(`    - ${r.title}`);
        console.log(`      ${r.url}`);
      }

      findings.push({
        domain: 'accountability',
        metric: 'supplier_outcome_data_available',
        value: outcomeResults.length,
        unit: 'search_results',
        state: 'QLD',
        indigenous_status: supplier.indigenous ? 'indigenous' : 'all',
        financial_year: '2024-25',
        source_name: 'Web Research — Outcome Reports',
        source_url: topResults[0]?.url || null,
        notes: `${supplier.name} — top result: "${topResults[0]?.title || 'N/A'}". ${topResults[0]?.snippet || ''}`.slice(0, 500),
      });
    }

    // Search 2: ACNC financials (only if we have quota)
    if (searchCount < MAX_SEARCHES) {
      const finResults = await searchSerper(
        `"${supplier.searchName}" ACNC annual information statement revenue`
      );
      if (finResults.length > 0) {
        const topResults = finResults.slice(0, 3);
        console.log(`  [web] Found ${finResults.length} results for financials:`);
        for (const r of topResults) {
          console.log(`    - ${r.title}`);
          console.log(`      ${r.url}`);
        }

        findings.push({
          domain: 'accountability',
          metric: 'supplier_financial_data_available',
          value: finResults.length,
          unit: 'search_results',
          state: 'QLD',
          indigenous_status: supplier.indigenous ? 'indigenous' : 'all',
          financial_year: '2024-25',
          source_name: 'Web Research — ACNC Financials',
          source_url: topResults[0]?.url || null,
          notes: `${supplier.name} — top result: "${topResults[0]?.title || 'N/A'}". ${topResults[0]?.snippet || ''}`.slice(0, 500),
        });
      }
    }
  }

  // 5. Special flags
  if (supplier.name === 'GEO Group Australia') {
    findings.push({
      domain: 'accountability',
      metric: 'supplier_private_prison_operator',
      value: 1,
      unit: 'boolean',
      state: 'QLD',
      indigenous_status: 'all',
      financial_year: '2024-25',
      source_name: 'Public Record',
      notes: 'GEO Group Australia — subsidiary of The GEO Group Inc (US), publicly traded private prison/detention company (NYSE: GEO). $82M in QLD youth justice contracts.',
    });
  }

  if (supplier.indigenous) {
    findings.push({
      domain: 'accountability',
      metric: 'supplier_indigenous_controlled',
      value: 1,
      unit: 'boolean',
      state: 'QLD',
      indigenous_status: 'indigenous',
      financial_year: '2024-25',
      source_name: 'Organization Records',
      notes: `${supplier.name} — Indigenous-controlled organization. QLD YJ contract value: $${(supplier.contractValue / 1e6).toFixed(0)}M`,
    });
  }

  return findings;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== QLD Youth Justice Supplier Outcomes Research ===');
  console.log(`Mode: ${applyMode ? 'APPLY (will write to DB)' : 'DRY-RUN'}`);
  console.log(`Suppliers: ${SUPPLIERS.length}`);
  console.log(`Max web searches: ${MAX_SEARCHES}`);
  console.log(`Serper API key: ${env.SERPER_API_KEY ? 'present' : 'MISSING'}`);
  console.log('');

  // Check DB connection
  const { count, error: dbErr } = await supabase
    .from('cross_system_stats')
    .select('*', { count: 'exact', head: true })
    .eq('domain', 'accountability');

  if (dbErr) {
    console.error('[db] Error connecting:', dbErr.message);
    process.exit(1);
  }
  console.log(`[db] Existing accountability records: ${count || 0}`);

  // Research all suppliers
  const allFindings = [];
  for (const supplier of SUPPLIERS) {
    const findings = await researchSupplier(supplier);
    allFindings.push(...findings);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total findings: ${allFindings.length}`);
  console.log(`Web searches used: ${searchCount}/${MAX_SEARCHES}`);

  const metrics = {};
  for (const f of allFindings) {
    metrics[f.metric] = (metrics[f.metric] || 0) + 1;
  }
  console.log('\nFindings by metric:');
  for (const [metric, count] of Object.entries(metrics).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${metric}: ${count}`);
  }

  // ACNC summary
  const acncFound = allFindings.filter(f => f.metric === 'supplier_acnc_registered' && f.value === 1).length;
  const acncMissing = allFindings.filter(f => f.metric === 'supplier_acnc_registered' && f.value === 0).length;
  console.log(`\nACNC registered: ${acncFound}/${SUPPLIERS.length}`);
  if (acncMissing > 0) {
    console.log(`ACNC not found: ${acncMissing}`);
  }

  const orgFound = allFindings.filter(f => f.metric === 'supplier_in_org_database').length;
  console.log(`In org database: ${orgFound}/${SUPPLIERS.length}`);

  const totalContractValue = SUPPLIERS.reduce((s, sup) => s + sup.contractValue, 0);
  console.log(`\nTotal QLD YJ contract value (top ${SUPPLIERS.length}): $${(totalContractValue / 1e6).toFixed(0)}M`);

  // Write to DB
  if (applyMode) {
    console.log('\n[db] Writing findings to cross_system_stats...');

    // Clear existing accountability records to avoid duplicates
    const { error: delErr } = await supabase
      .from('cross_system_stats')
      .delete()
      .eq('domain', 'accountability');

    if (delErr) {
      console.error('[db] Error clearing old records:', delErr.message);
    } else {
      console.log('[db] Cleared old accountability records');
    }

    // Insert in batches of 20
    let inserted = 0;
    for (let i = 0; i < allFindings.length; i += 20) {
      const batch = allFindings.slice(i, i + 20);
      const { data, error } = await supabase
        .from('cross_system_stats')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`[db] Batch insert error: ${error.message}`);
        // Try one by one
        for (const row of batch) {
          const { error: rowErr } = await supabase
            .from('cross_system_stats')
            .insert(row);
          if (rowErr) {
            console.error(`[db] Row error: ${rowErr.message} — ${row.notes?.slice(0, 60)}`);
          } else {
            inserted++;
          }
        }
      } else {
        inserted += (data?.length || batch.length);
      }
    }
    console.log(`[db] Inserted ${inserted}/${allFindings.length} records`);
  } else {
    console.log('\n[dry-run] Would insert these records:');
    for (const f of allFindings) {
      const valueStr = f.unit === 'dollars'
        ? `$${(f.value / 1e6).toFixed(0)}M`
        : `${f.value} ${f.unit}`;
      console.log(`  ${f.metric}: ${valueStr} — ${(f.notes || '').slice(0, 80)}`);
    }
    console.log(`\nRun with --apply to write ${allFindings.length} records to DB`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
