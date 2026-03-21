/**
 * Import AIHW Youth Justice Datasets from data.gov.au
 *
 * Pulls CSV datasets directly and stores structured data:
 * - Youth Justice Detention Data (42K rows)
 * - Youth justice centre locations (63 rows)
 * - Daily detention by Indigenous status
 * - Conference referrals by region
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_AGENT = 'JusticeHub/1.0 (benjamin@act.place)';

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // Handle quoted CSV fields
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += char;
    }
    values.push(current.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

async function fetchCSV(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ━━━ Discover all CSV URLs from data.gov.au CKAN API ━━━

async function discoverDatasets() {
  console.log('Discovering datasets from data.gov.au...\n');

  const datasets = [];

  // Search for youth justice datasets
  const queries = ['youth+justice', 'youth+detention', 'juvenile+detention'];

  for (const q of queries) {
    const res = await fetch(
      `https://data.gov.au/data/api/3/action/package_search?q=${q}&rows=20`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const ds of data?.result?.results || []) {
      for (const resource of ds.resources || []) {
        if (resource.format === 'CSV' && resource.url) {
          datasets.push({
            title: ds.title,
            name: resource.name || resource.description || ds.title,
            url: resource.url,
          });
        }
      }
    }
  }

  // Dedupe by URL
  const seen = new Set();
  return datasets.filter(d => {
    if (seen.has(d.url)) return false;
    seen.add(d.url);
    return true;
  });
}

// ━━━ Import youth justice centre locations ━━━

async function importCentreLocations(csvData) {
  console.log('\n━━━ Youth Justice Centre Locations ━━━');
  const rows = parseCSV(csvData);
  console.log(`  Parsed ${rows.length} centre locations`);

  let inserted = 0;
  for (const row of rows) {
    const name = row['Centre Name'] || row['centre_name'] || row['Name'] || Object.values(row)[0];
    if (!name) continue;

    // Try to find state from data
    const state = row['State'] || row['state'] || row['Jurisdiction'] || '';
    const lat = parseFloat(row['Latitude'] || row['latitude'] || row['lat'] || '0');
    const lng = parseFloat(row['Longitude'] || row['longitude'] || row['lng'] || row['lon'] || '0');

    // Store as research finding with structured data
    const content = `Youth Justice Centre: ${name}. ${state ? `State: ${state}.` : ''} ${lat ? `Location: ${lat}, ${lng}` : ''} ${JSON.stringify(row)}`;

    const { error } = await supabase.from('alma_research_findings').insert({
      finding_type: 'facility',
      content: content.substring(0, 2000),
      confidence: 1.0,
      sources: ['AIHW Youth Justice Centre Locations via data.gov.au'],
    });
    if (!error) inserted++;
  }
  console.log(`  Inserted ${inserted} centre records`);
  return inserted;
}

// ━━━ Import detention population data ━━━

async function importDetentionData(csvData, datasetName) {
  console.log(`\n━━━ ${datasetName} ━━━`);
  const rows = parseCSV(csvData);
  console.log(`  Parsed ${rows.length} rows`);

  // For large datasets, create summary findings rather than row-by-row inserts
  if (rows.length > 100) {
    // Aggregate key insights
    const headers = Object.keys(rows[0] || {});
    const stateCol = headers.find(h => /state|jurisdiction/i.test(h));
    const yearCol = headers.find(h => /year|period|date/i.test(h));
    const valueCol = headers.find(h => /count|number|value|total/i.test(h));

    // Create state-level summaries
    const byState = {};
    for (const row of rows) {
      const state = stateCol ? row[stateCol] : 'National';
      if (!byState[state]) byState[state] = { count: 0, total: 0 };
      byState[state].count++;
      if (valueCol) byState[state].total += parseFloat(row[valueCol]) || 0;
    }

    let inserted = 0;
    for (const [state, stats] of Object.entries(byState)) {
      const content = `AIHW ${datasetName} — ${state}: ${stats.count} data points, aggregate value: ${stats.total.toFixed(0)}. Columns: ${headers.join(', ')}`;

      const { error } = await supabase.from('alma_research_findings').insert({
        finding_type: 'statistical',
        content: content.substring(0, 2000),
        confidence: 1.0,
        sources: [`AIHW ${datasetName} via data.gov.au`],
      });
      if (!error) inserted++;
    }

    // Also store a complete summary
    const totalRows = rows.length;
    const years = yearCol ? [...new Set(rows.map(r => r[yearCol]).filter(Boolean))].sort() : [];
    const states = stateCol ? [...new Set(rows.map(r => r[stateCol]).filter(Boolean))].sort() : [];

    await supabase.from('alma_evidence').upsert(
      {
        title: `[AIHW] ${datasetName} — ${totalRows} data points`,
        findings: `Dataset contains ${totalRows} observations. ${yearCol ? `Years: ${years[0]} to ${years[years.length - 1]}.` : ''} ${stateCol ? `Jurisdictions: ${states.join(', ')}.` : ''} Columns: ${headers.join(', ')}`,
        evidence_type: 'government_data',
        source_url: `https://data.gov.au/search?q=${encodeURIComponent(datasetName)}`,
        year_published: 2024,
      },
      { onConflict: 'source_url' }
    );
    inserted++;

    console.log(`  Created ${inserted} summary findings (${Object.keys(byState).length} jurisdictions)`);
    return inserted;
  }

  // For smaller datasets, store each row
  let inserted = 0;
  for (const row of rows) {
    const content = `AIHW ${datasetName}: ${JSON.stringify(row)}`;
    const { error } = await supabase.from('alma_research_findings').insert({
      finding_type: 'statistical',
      content: content.substring(0, 2000),
      confidence: 1.0,
      sources: [`AIHW ${datasetName} via data.gov.au`],
    });
    if (!error) inserted++;
  }
  console.log(`  Inserted ${inserted} rows`);
  return inserted;
}

// ━━━ MAIN ━━━

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  AIHW Youth Justice Dataset Import               ║');
console.log('╚══════════════════════════════════════════════════╝');

const allDatasets = await discoverDatasets();
console.log(`Found ${allDatasets.length} CSV datasets\n`);

let totalInserted = 0;

// Prioritize the most valuable datasets
const priorityKeywords = [
  'detention',
  'indigenous',
  'centre location',
  'conference',
  'supervised',
  'unsupervised',
  'young offender',
];

// Sort: priority datasets first
const sorted = allDatasets.sort((a, b) => {
  const aScore = priorityKeywords.filter(k => a.name.toLowerCase().includes(k)).length;
  const bScore = priorityKeywords.filter(k => b.name.toLowerCase().includes(k)).length;
  return bScore - aScore;
});

for (const ds of sorted.slice(0, 20)) { // Cap at 20 most relevant
  try {
    console.log(`\nFetching: ${ds.name.substring(0, 70)}...`);
    const csvText = await fetchCSV(ds.url);

    if (ds.name.toLowerCase().includes('location') || ds.name.toLowerCase().includes('centre')) {
      totalInserted += await importCentreLocations(csvText);
    } else {
      totalInserted += await importDetentionData(csvText, ds.name);
    }
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
}

console.log(`\n╔══════════════════════════════════════════════════╗`);
console.log(`║  TOTAL INSERTED: ${String(totalInserted).padStart(6)} items${' '.repeat(18)}║`);
console.log(`╚══════════════════════════════════════════════════╝`);
