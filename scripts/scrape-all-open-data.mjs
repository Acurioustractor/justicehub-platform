#!/usr/bin/env node
/**
 * scrape-all-open-data.mjs
 *
 * Scrapes ALL remaining Australian youth justice open data sources:
 * 1. QLD Open Data — detention, orders, crossover kids, Evolve, historical grants
 * 2. QLD YJ Centre locations
 * 3. QPS offender numbers by region
 * 4. NSW, VIC, WA, SA, NT, TAS, ACT equivalents from data.gov.au
 * 5. AIHW youth justice datasets
 * 6. Productivity Commission ROGS supplementary data
 *
 * Usage: node scripts/scrape-all-open-data.mjs [mode]
 *   modes: all, qld, national, aihw
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mode = process.argv[2] || 'all';
const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));

console.log(`╔══════════════════════════════════════════════════╗`);
console.log(`║  Australian Youth Justice Open Data Scraper      ║`);
console.log(`║  Mode: ${mode.padEnd(42)}║`);
console.log(`╚══════════════════════════════════════════════════╝`);

// Helper: fetch CSV and parse
async function fetchCSV(url, label) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'JusticeHub-Research/1.0' } });
    if (!res.ok) { console.log(`  [SKIP] ${label} — HTTP ${res.status}`); return []; }
    const text = await res.text();
    return parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true, relax_quotes: true, trim: true });
  } catch (e) {
    console.log(`  [ERROR] ${label}: ${e.message}`);
    return [];
  }
}

// Helper: insert research finding (dedup by title in content jsonb)
// Schema: content (jsonb), sources (text[]), finding_type, confidence, validated
async function insertFinding(title, data, sourceUrl, findingType = 'external_source') {
  const titleKey = title.substring(0, 500);

  // Dedup: check if content->>'title' already exists
  const { count } = await supabase.from('alma_research_findings')
    .select('*', { count: 'exact', head: true })
    .eq('content->>title', titleKey);
  if (count > 0) return false;

  const contentObj = {
    title: titleKey,
    data: typeof data === 'string' ? data : data,
  };

  const { error } = await supabase.from('alma_research_findings').insert({
    finding_type: findingType,
    content: contentObj,
    sources: sourceUrl ? [sourceUrl] : [],
    confidence: 0.8,
    validated: true,
    validation_source: 'open_data_scraper',
  });
  if (error && error.code !== '23505') console.log(`  [WARN] ${error.message}`);
  return !error;
}

// Helper: insert funding record (dedup by source + statement_id)
async function insertFunding(record) {
  const { count } = await supabase.from('justice_funding')
    .select('*', { count: 'exact', head: true })
    .eq('source', record.source)
    .eq('source_statement_id', record.source_statement_id);
  if (count > 0) return false;

  const { error } = await supabase.from('justice_funding').insert(record);
  if (error) console.log(`  [WARN] ${error.message}`);
  return !error;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QLD 1: Youth Detention Daily Numbers (2011-2016)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeQLDDetention() {
  console.log('\n══════ QLD: Youth Detention Daily Numbers ══════');

  const datasets = [
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0017/12734/20170228-yj-daily-num-detention-age-2011-12-2015-16.csv', label: 'By Age' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0018/12735/20170228-yj-daily-num-detention-det-centre-2011-12-2015-16.csv', label: 'By Centre' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0021/12738/20170228-yj-daily-num-detention-sex-2011-12-2015-16.csv', label: 'By Sex' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0019/12736/20170228-yj-daily-num-detention-indig-status-2011-12-2015-16.csv', label: 'By Indigenous Status' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0020/12737/20170228-yj-daily-num-detention-legalstatus-2011-12-2015-16.csv', label: 'By Legal Status' },
  ];

  let total = 0;
  for (const ds of datasets) {
    const rows = await fetchCSV(ds.url, ds.label);
    if (!rows.length) continue;

    // Summarize each dataset into research findings
    const summary = {};
    for (const row of rows) {
      const year = row['Financial Year'] || row['Year'] || Object.values(row)[0];
      if (!summary[year]) summary[year] = [];
      summary[year].push(row);
    }

    for (const [year, data] of Object.entries(summary)) {
      const ok = await insertFinding(
        `QLD Detention ${ds.label}: ${year} (${data.length} records)`,
        data,
        ds.url,
        'external_source'
      );
      if (ok) total++;
    }

    console.log(`  ${ds.label}: ${rows.length} rows → ${Object.keys(summary).length} findings`);
    await SLEEP(300);
  }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QLD 2: Youth Justice Orders (supervised + unsupervised)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeQLDOrders() {
  console.log('\n══════ QLD: Youth Justice Orders ══════');

  const datasets = [
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0022/12739/20170228-yj-distinct-offenders-starting-supervised-orders-2011-12-2015-16.csv', label: 'Supervised Orders' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0014/12740/20170228-yj-distinct-offenders-starting-unsupervised-orders-2011-12-2015-16.csv', label: 'Unsupervised Orders' },
  ];

  let total = 0;
  for (const ds of datasets) {
    const rows = await fetchCSV(ds.url, ds.label);
    if (!rows.length) continue;

    const ok = await insertFinding(
      `QLD ${ds.label} 2011-2016 (${rows.length} records)`,
      rows.slice(0, 50), // Summary
      ds.url
    );
    if (ok) total++;
    console.log(`  ${ds.label}: ${rows.length} rows`);
    await SLEEP(300);
  }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QLD 3: Crossover Children (child protection + youth justice)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeQLDCrossover() {
  console.log('\n══════ QLD: Crossover Children ══════');

  // Old communities.qld.gov.au URLs are dead. Use data.qld.gov.au CKAN API
  let total = 0;
  try {
    const apiUrl = 'https://www.data.qld.gov.au/api/3/action/package_show?id=children-subject-to-supervised-youth-justice-orders-and-child-protection-orders';
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.log(`  [SKIP] data.qld.gov.au — HTTP ${res.status}`); return 0; }
    const data = await res.json();
    const pkg = data.result;
    const csvResources = (pkg?.resources || []).filter(r =>
      r.format?.toUpperCase() === 'CSV' && r.url
    );

    console.log(`  Found ${csvResources.length} CSV resources`);

    for (const r of csvResources) {
      const rows = await fetchCSV(r.url, r.name || 'Crossover');
      if (!rows.length) continue;

      const ok = await insertFinding(
        `QLD Crossover Children: ${r.name || r.description || 'CP+YJ'} (${rows.length} records)`,
        { sample: rows.slice(0, 20), total_rows: rows.length, columns: Object.keys(rows[0]) },
        r.url,
        'evidence_link'
      );
      if (ok) total++;
      console.log(`  ${r.name}: ${rows.length} rows`);
      await SLEEP(300);
    }

    // Also store the dataset metadata
    if (pkg) {
      await insertFinding(
        `QLD Crossover Dataset Metadata: ${pkg.title}`,
        { description: pkg.notes?.substring(0, 1000), resources: csvResources.length, organization: pkg.organization?.title },
        `https://www.data.qld.gov.au/dataset/${pkg.name}`,
        'external_source'
      );
    }
  } catch (e) {
    console.log(`  [ERROR] ${e.message}`);
  }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QLD 4: Evolve Program (interagency therapeutic services)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeQLDEvolve() {
  console.log('\n══════ QLD: Evolve Program ══════');

  const datasets = [
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0014/13127/evolve-clients-region-age.csv', label: 'By Region/Age' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0016/13129/evolve-clients-region-gender.csv', label: 'By Region/Gender' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0009/13131/evolve-clients-region-service-indigenous.csv', label: 'By Region/Service/Indigenous' },
  ];

  let total = 0;
  for (const ds of datasets) {
    const rows = await fetchCSV(ds.url, ds.label);
    if (!rows.length) continue;

    const ok = await insertFinding(
      `QLD Evolve Interagency Program ${ds.label} (${rows.length} records)`,
      rows,
      ds.url
    );
    if (ok) total++;
    console.log(`  ${ds.label}: ${rows.length} rows`);
    await SLEEP(300);
  }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QLD 5: Historical Grants (2008-2013)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeQLDHistoricalGrants() {
  console.log('\n══════ QLD: Historical Grants (2008-2013) ══════');

  const datasets = [
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0018/13176/grant-funding-2012-2013.csv', fy: '2012-13' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0016/13174/grant-funding-2011-2012.csv', fy: '2011-12' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0014/13172/grant-funding-2010-2011.csv', fy: '2010-11' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0012/13170/grant-funding-2009-2010.csv', fy: '2009-10' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0019/13168/grant-funding-2008-2009.csv', fy: '2008-09' },
  ];

  let total = 0;
  for (const ds of datasets) {
    const rows = await fetchCSV(ds.url, ds.fy);
    if (!rows.length) continue;

    console.log(`  ${ds.fy}: ${rows.length} grants — columns: ${Object.keys(rows[0]).join(', ')}`);

    let inserted = 0;
    for (const row of rows) {
      // First column is always the org name (varies: "Organisation", "Organisation name", etc.)
      const cols = Object.keys(row);
      const orgName = (row[cols[0]] || '').trim();
      if (!orgName) continue;

      // All other columns are service areas with dollar amounts
      // Column names often contain \n and ($) — e.g. "Child Safety\n($)"
      for (let i = 1; i < cols.length; i++) {
        const val = row[cols[i]];
        if (!val) continue;
        const amount = parseFloat(String(val).replace(/[$,\s"]/g, ''));
        if (isNaN(amount) || amount === 0) continue;

        // Clean up the column name to get the program area
        const program = cols[i].replace(/\n/g, ' ').replace(/\(\$\)/g, '').replace(/\s+/g, ' ').trim();

        const ok = await insertFunding({
          source: 'qld-historical-grants',
          source_url: ds.url,
          source_statement_id: `${orgName}-${program}-${ds.fy}`.substring(0, 200),
          recipient_name: orgName,
          program_name: program,
          amount_dollars: amount,
          state: 'QLD',
          funding_type: 'grant',
          sector: 'community_services',
          project_description: `${orgName}: $${amount.toLocaleString()} for ${program} (${ds.fy})`,
          financial_year: ds.fy,
        });
        if (ok) inserted++;
      }
    }

    total += inserted;
    console.log(`  → Inserted ${inserted} new grants from ${ds.fy}`);
    await SLEEP(500);
  }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QLD 6: YJ Centre Locations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeYJCentres() {
  console.log('\n══════ QLD: YJ Centre Locations ══════');

  const rows = await fetchCSV('https://www.dcssds.qld.gov.au/_media/documents/open-data/youth-justice-centre-locations.csv', 'YJ Centres');
  if (!rows.length) return 0;

  console.log(`  ${rows.length} centres — columns: ${Object.keys(rows[0]).join(', ')}`);

  let total = 0;
  for (const row of rows) {
    const name = row['Centre Name'] || row['Name'] || row['Location'] || Object.values(row)[0];
    const ok = await insertFinding(
      `QLD YJ Centre: ${name}`,
      row,
      'https://www.dcssds.qld.gov.au/_media/documents/open-data/youth-justice-centre-locations.csv'
    );
    if (ok) total++;
  }

  console.log(`  → ${total} centres added`);
  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NATIONAL: data.gov.au youth justice datasets
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeNationalData() {
  console.log('\n══════ NATIONAL: Direct CSV Downloads ══════');

  // Skip flaky CKAN API (HTTP 409). Use direct downloads from known sources.
  const directCSVs = [
    // Productivity Commission ROGS 2025 — national youth justice spending
    { url: 'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/rogs-2025-partf-section17-youth-justice-dataset.csv', label: 'ROGS 2025 Youth Justice (National)', state: 'National' },
    // Closing the Gap — Indigenous youth justice
    { url: 'https://www.pc.gov.au/closing-the-gap-data/annual-data-report/data-downloads/adcr-2025-ctg11-youth-justice-dataset.csv', label: 'Closing the Gap Youth Justice (CTG11)', state: 'National' },
    // NT detention weekly census
    { url: 'https://corrections.nt.gov.au/youth-justice/youth-detention-census/data/weekly-detention-statistics-december25.csv', label: 'NT Youth Detention Weekly Census Dec 2025', state: 'NT' },
  ];

  let total = 0;
  for (const ds of directCSVs) {
    const rows = await fetchCSV(ds.url, ds.label);
    if (!rows.length) { continue; }

    const ok = await insertFinding(
      `${ds.label} (${rows.length} records)`,
      { sample: rows.slice(0, 20), total_rows: rows.length, columns: Object.keys(rows[0]), state: ds.state },
      ds.url,
      'external_source'
    );
    if (ok) total++;
    console.log(`  ${ds.label}: ${rows.length} rows`);
    await SLEEP(500);
  }

  // Also try data.gov.au with working queries only
  console.log('\n  Trying data.gov.au CKAN (working queries only)...');
  for (const query of ['youth offender', 'child protection youth justice']) {
    try {
      const url = `https://data.gov.au/api/3/action/package_search?q=${encodeURIComponent(query)}&rows=20`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) { console.log(`  [SKIP] "${query}" — HTTP ${res.status}`); continue; }
      const data = await res.json();
      const results = data.result?.results || [];
      console.log(`  "${query}": ${results.length} datasets`);

      for (const pkg of results) {
        const csvResources = (pkg.resources || []).filter(r => r.format?.toUpperCase() === 'CSV' && r.url);
        if (!csvResources.length) continue;

        const ok = await insertFinding(
          `National: ${pkg.title}`.substring(0, 500),
          { description: pkg.notes?.substring(0, 1000), organization: pkg.organization?.title, resources: csvResources.map(r => ({ name: r.name, url: r.url })) },
          `https://data.gov.au/dataset/${pkg.name}`,
          'external_source'
        );
        if (ok) total++;

        if (csvResources[0]) {
          const rows = await fetchCSV(csvResources[0].url, pkg.title);
          if (rows.length > 0) {
            await insertFinding(`Data: ${pkg.title} — ${rows.length} rows`.substring(0, 500),
              { sample: rows.slice(0, 10), total_rows: rows.length, columns: Object.keys(rows[0]) }, csvResources[0].url);
            console.log(`    → ${pkg.title}: ${rows.length} rows`);
          }
        }
        await SLEEP(500);
      }
    } catch (e) {
      console.log(`  [ERROR] "${query}": ${e.message}`);
    }
    await SLEEP(1000);
  }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NATIONAL: State-level open data portals
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeStatePortals() {
  console.log('\n══════ STATE DATA PORTALS ══════');

  // CKAN-based portals (search API)
  const ckanPortals = [
    // NSW — correct CKAN endpoint (data/ prefix)
    { state: 'NSW', url: 'https://data.nsw.gov.au/data/api/3/action/package_search?q=youth+justice&rows=10', label: 'data.nsw.gov.au' },
    // VIC
    { state: 'VIC', url: 'https://discover.data.vic.gov.au/api/3/action/package_search?q=youth+justice&rows=10', label: 'data.vic.gov.au' },
    // SA
    { state: 'SA', url: 'https://data.sa.gov.au/data/api/3/action/package_search?q=youth+justice&rows=10', label: 'data.sa.gov.au' },
    // WA
    { state: 'WA', url: 'https://catalogue.data.wa.gov.au/api/3/action/package_search?q=youth+justice&rows=10', label: 'data.wa.gov.au' },
    // NT
    { state: 'NT', url: 'https://data.nt.gov.au/api/3/action/package_search?q=youth+justice&rows=10', label: 'data.nt.gov.au' },
  ];

  let total = 0;

  for (const { state, url, label } of ckanPortals) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) { console.log(`  [${state}] ${label} — HTTP ${res.status}`); continue; }

      const data = await res.json();
      const results = data.result?.results || [];
      console.log(`  [${state}] ${label}: ${results.length} datasets`);

      for (const pkg of results) {
        const csvResources = (pkg.resources || []).filter(r =>
          r.format?.toUpperCase() === 'CSV' && r.url
        );

        const ok = await insertFinding(
          `${state}: ${pkg.title}`.substring(0, 500),
          {
            description: pkg.notes?.substring(0, 1000),
            organization: pkg.organization?.title,
            resources: csvResources.map(r => ({ name: r.name, url: r.url })),
            state: state,
          },
          pkg.url || `https://${label}/dataset/${pkg.name}`,
          'external_source'
        );
        if (ok) total++;

        // Fetch first CSV if available
        if (csvResources.length > 0) {
          const rows = await fetchCSV(csvResources[0].url, `${state}: ${pkg.title}`);
          if (rows.length > 0) {
            await insertFinding(
              `Data ${state}: ${pkg.title} — ${rows.length} rows`.substring(0, 500),
              { sample: rows.slice(0, 10), total_rows: rows.length, columns: Object.keys(rows[0]) },
              csvResources[0].url
            );
            console.log(`    → ${pkg.title}: ${rows.length} rows`);
          }
        }

        await SLEEP(500);
      }
    } catch (e) {
      console.log(`  [${state}] ${label}: ${e.message}`);
    }

    await SLEEP(1000);
  }

  // Also try broader searches on NT for juvenile/detention
  console.log('\n  NT broader searches...');
  for (const q of ['juvenile detention', 'youth detention', 'juvenile']) {
    try {
      const res = await fetch(`https://data.nt.gov.au/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=10`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const data = await res.json();
      const results = data.result?.results || [];
      if (!results.length) continue;
      console.log(`  [NT] "${q}": ${results.length} datasets`);

      for (const pkg of results) {
        const csvResources = (pkg.resources || []).filter(r => r.format?.toUpperCase() === 'CSV' && r.url);
        const ok = await insertFinding(
          `NT: ${pkg.title}`.substring(0, 500),
          { description: pkg.notes?.substring(0, 1000), resources: csvResources.map(r => ({ name: r.name, url: r.url })), state: 'NT' },
          pkg.url || `https://data.nt.gov.au/dataset/${pkg.name}`,
          'external_source'
        );
        if (ok) total++;

        if (csvResources.length > 0) {
          const rows = await fetchCSV(csvResources[0].url, `NT: ${pkg.title}`);
          if (rows.length > 0) {
            await insertFinding(`Data NT: ${pkg.title} — ${rows.length} rows`.substring(0, 500),
              { sample: rows.slice(0, 10), total_rows: rows.length, columns: Object.keys(rows[0]) }, csvResources[0].url);
            console.log(`    → ${pkg.title}: ${rows.length} rows`);
          }
        }
        await SLEEP(500);
      }
    } catch (e) { /* skip */ }
  }

  // NSW also try juvenile justice org
  console.log('\n  NSW juvenile justice org...');
  try {
    const res = await fetch('https://data.nsw.gov.au/data/api/3/action/package_search?q=juvenile+justice&rows=10', { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      const results = data.result?.results || [];
      console.log(`  [NSW] "juvenile justice": ${results.length} datasets`);
      for (const pkg of results) {
        const csvResources = (pkg.resources || []).filter(r => r.format?.toUpperCase() === 'CSV' && r.url);
        const ok = await insertFinding(`NSW: ${pkg.title}`.substring(0, 500),
          { description: pkg.notes?.substring(0, 1000), resources: csvResources.map(r => ({ name: r.name, url: r.url })), state: 'NSW' },
          pkg.url || `https://data.nsw.gov.au/data/dataset/${pkg.name}`, 'external_source');
        if (ok) total++;

        if (csvResources.length > 0) {
          const rows = await fetchCSV(csvResources[0].url, `NSW: ${pkg.title}`);
          if (rows.length > 0) {
            await insertFinding(`Data NSW: ${pkg.title} — ${rows.length} rows`.substring(0, 500),
              { sample: rows.slice(0, 10), total_rows: rows.length, columns: Object.keys(rows[0]) }, csvResources[0].url);
            console.log(`    → ${pkg.title}: ${rows.length} rows`);
          }
        }
        await SLEEP(500);
      }
    }
  } catch (e) { console.log(`  [NSW] juvenile justice: ${e.message}`); }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QLD 7: DYJVS Consultancies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeConsultancies() {
  console.log('\n══════ QLD: DYJVS Consultancies ══════');

  const datasets = [
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0019/13096/dyj-consultancies-2019-20.csv', fy: '2019-20' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0007/13003/dcyjma-consultancies-reporting-202122.csv', fy: '2021-22' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0006/13002/dcyjma-consultancies-reporting-202021.csv', fy: '2020-21' },
  ];

  let total = 0;
  for (const ds of datasets) {
    const rows = await fetchCSV(ds.url, ds.fy);
    if (!rows.length) continue;

    const cols = Object.keys(rows[0]);
    console.log(`  ${ds.fy}: ${rows.length} rows — columns: ${cols.join(', ')}`);

    // These CSVs have category rows (Management, HR, etc.) with amounts as columns
    // OR summary rows with category columns. Extract all dollar values.
    for (const row of rows) {
      // Try each column for category/amount pairs
      for (const [key, val] of Object.entries(row)) {
        if (!val || key === 'Notes') continue;
        const amount = parseFloat(String(val).replace(/[$,\s]/g, ''));
        if (isNaN(amount) || amount === 0) continue;

        // For 2019-20 format: "Consultancy category" + "Expenditure ($)"
        const category = row['Consultancy category'] || key.replace(/\s*\(\$\)\s*$/, '').trim();

        const ok = await insertFunding({
          source: 'dyjvs-consultancies',
          source_url: ds.url,
          source_statement_id: `consultancy-${category}-${ds.fy}`.substring(0, 200),
          recipient_name: 'DYJVS Consultancy Services',
          program_name: category,
          amount_dollars: amount,
          state: 'QLD',
          funding_type: 'consultancy',
          sector: 'youth_justice',
          project_description: `${category}: $${amount.toLocaleString()} (${ds.fy})`,
          financial_year: ds.fy,
        });
        if (ok) total++;
      }
    }

    console.log(`  → ${total} consultancy line items from ${ds.fy}`);
    await SLEEP(500);
  }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QLD 8: Out-of-Home Care (child safety → YJ pipeline)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeOOHC() {
  console.log('\n══════ QLD: Out-of-Home Care Data ══════');

  const datasets = [
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0017/12824/child-safety-services-admissions-placement-type-amend.csv', label: 'Admissions by Placement' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0020/12836/child-safety-services-out-of-home-care-age-placement-type-indigenous-amend.csv', label: 'By Age/Indigenous' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0021/12828/child-safety-services-exiting-ohc-indigenous-order-length-placements.csv', label: 'Exits by Indigenous/Length' },
    { url: 'https://www.dcssds.qld.gov.au/__data/assets/file/0016/12814/children-in-out-of-home-care-any-time-by-region.csv', label: 'By Region' },
  ];

  let total = 0;
  for (const ds of datasets) {
    const rows = await fetchCSV(ds.url, ds.label);
    if (!rows.length) continue;

    const ok = await insertFinding(
      `QLD Out-of-Home Care: ${ds.label} (${rows.length} records)`,
      { sample: rows.slice(0, 20), total_rows: rows.length, columns: Object.keys(rows[0]) },
      ds.url,
      'evidence_link'
    );
    if (ok) total++;
    console.log(`  ${ds.label}: ${rows.length} rows`);
    await SLEEP(300);
  }

  return total;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const results = {};

if (mode === 'all' || mode === 'qld') {
  results.detention = await scrapeQLDDetention();
  results.orders = await scrapeQLDOrders();
  results.crossover = await scrapeQLDCrossover();
  results.evolve = await scrapeQLDEvolve();
  results.historical = await scrapeQLDHistoricalGrants();
  results.centres = await scrapeYJCentres();
  results.consultancies = await scrapeConsultancies();
  results.oohc = await scrapeOOHC();
}

if (mode === 'all' || mode === 'national') {
  results.national = await scrapeNationalData();
  results.states = await scrapeStatePortals();
}

console.log(`\n╔══════════════════════════════════════════════════╗`);
console.log(`║                  FINAL RESULTS                   ║`);
console.log(`╠══════════════════════════════════════════════════╣`);
for (const [key, val] of Object.entries(results)) {
  console.log(`║  ${key.padEnd(25)} ${String(val).padStart(5)} items    ║`);
}
const total = Object.values(results).reduce((a, b) => a + b, 0);
console.log(`╠══════════════════════════════════════════════════╣`);
console.log(`║  TOTAL                     ${String(total).padStart(5)} items    ║`);
console.log(`╚══════════════════════════════════════════════════╝`);
