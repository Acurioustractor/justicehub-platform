#!/usr/bin/env node
/**
 * Import Justice Funding from all QLD sources
 *
 * Sources:
 * 1. QLD Ministerial Statements (scraped — Community Partnership Innovation Grants)
 * 2. Brisbane City Council Open Data (12K+ grants, filtered for justice-related)
 * 3. QLD Open Data CKAN API (state-level datasets)
 *
 * Usage:
 *   node scripts/import-justice-funding.mjs --dry-run     # Preview what will be imported
 *   node scripts/import-justice-funding.mjs --apply        # Write to database
 *   node scripts/import-justice-funding.mjs --apply --source brisbane  # Only Brisbane data
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';
import fs from 'fs';

// Simple CSV parser (no external dependency)
function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  // Handle BOM
  let headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine);
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const record = {};
    headers.forEach((h, idx) => { record[h.trim()] = (values[idx] || '').trim(); });
    records.push(record);
  }
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--apply');
const SOURCE_FILTER = args.find(a => a.startsWith('--source'))?.split('=')[1] ||
  (args.includes('--source') ? args[args.indexOf('--source') + 1] : null);

console.log(`\n💰 Justice Funding Importer`);
console.log(`${'═'.repeat(60)}`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (use --apply to write)' : 'APPLY (writing to DB)'}`);
if (SOURCE_FILTER) console.log(`Source filter: ${SOURCE_FILTER}`);
console.log();

// ── Fetch helper ──
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'JusticeHub/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Source 1: QLD Ministerial Statements ──
function getMinisterialGrants() {
  // Hardcoded from scraped statements — these are the confirmed recipients
  return [
    // Community Partnership Innovation Grants Round 2 (Statement #97570, April 2023)
    { recipient_name: 'Lutheran Church', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 300000, location: 'Brisbane', project_description: 'Targeted holistic complex case coordination and intensive case management for at risk, vulnerable young people displaying offending behaviours.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Beyond DV', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 295665, location: 'Brisbane', project_description: 'Holistic early intervention to young people affected by domestic and family violence, with the goal of reducing the impact of trauma and minimising the likelihood they will engage in criminal activity.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Selectability Limited', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 259331, location: 'Cairns', project_description: 'After-hours outreach and mentoring program in Earlville and Edmonton. Includes transportation to return young people home, and referrals to connect them with existing cultural programs and key agencies.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Australian Training Works Group Pty Ltd', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 299423, location: 'Cairns', project_description: 'Indigenous Group Training Organisation providing work readiness courses and building young people\'s skills for the workplace.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Queensland Youth Services', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 128592, location: 'Townsville/Mount Isa', project_description: 'Proud Warrior project providing multi-agency intervention for primarily Indigenous young people at risk of disengaging from school.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Save the Children (54 Reasons)', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 300000, location: 'Mount Isa', project_description: 'Back to Community reintegration program providing trauma-informed, culturally responsive throughcare support for young people leaving Cleveland Youth Detention Centre.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Marigurim Yalaam Indigenous Corporation for Community Justice', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 298980, location: 'Hervey Bay', project_description: 'Rites of Passage framework with intensive support over six weeks leading to peak experience camp and six weeks follow-up.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Yiliyapinya Indigenous Corporation', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 300000, location: 'Woorabinda', project_description: 'Neuroscience-informed program for Aboriginal 10-18 year olds on bail whose needs cannot be met by mainstream education and training programs.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Youth Off The Streets', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 293500, location: 'Logan', project_description: 'T-REK program supporting young people leaving detention and returning to community, and young people re-engaging with education. First Nations, Pasifika and African communities.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Adam Wenitong', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 142483, location: 'Toowoomba', project_description: 'Intensive 30-week immediate response for re-offending youth including seven-month cultural project with cultural mentoring and connection to the First Nations community.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Raw Impact', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 300000, location: 'Toowoomba', project_description: 'Cultural connection over an intensive period of seven weeks for at-risk young people, with ongoing engagement in cultural activities supporting rejuvenation of native title land at the Yumba.', announcement_date: '2023-04-15', source_statement_id: '97570' },
    { recipient_name: 'Winangali Infusion', program_name: 'Community Partnership Innovation Grants', program_round: 'Round 2', amount_dollars: 300000, location: 'Goondiwindi', project_description: 'The Block — safe and supervised community hub for young people in Goondiwindi, Boggabila and Toomelah with pro-social opportunities, cultural education, recreational activities.', announcement_date: '2023-04-15', source_statement_id: '97570' },
  ].map(g => ({
    ...g,
    source: 'qld_ministerial',
    source_url: `https://statements.qld.gov.au/statements/${g.source_statement_id}`,
    state: 'QLD',
    funding_type: 'grant',
    sector: 'youth_justice',
    financial_year: '2022-23',
  }));
}

// ── Source 2: Brisbane City Council ──
async function getBrisbaneGrants() {
  console.log('📥 Fetching Brisbane City Council grants...');
  const csvUrl = 'https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets/grants-recipients/exports/csv?limit=-1&delimiter=%2C';

  let csvData;
  const localPath = '/tmp/brisbane-grants.csv';
  if (fs.existsSync(localPath)) {
    console.log('  Using cached file...');
    csvData = fs.readFileSync(localPath, 'utf8');
  } else {
    csvData = await fetchUrl(csvUrl);
    fs.writeFileSync(localPath, csvData);
  }

  const records = parseCSV(csvData);
  console.log(`  Total Brisbane grants: ${records.length}`);

  // Filter for justice-related
  const justiceKeywords = [
    'youth', 'justice', 'crime', 'safety', 'offend', 'detention',
    'indigenous', 'aboriginal', 'first nations', 'torres strait',
    'diversion', 'intervention', 'wraparound', 'mentoring',
    'pcyc', 'police-citizen', 'legal', 'domestic violence',
    'family violence', 'victim', 'survivor', 'rehabilitation',
    'reintegration', 'custody', 'correcti', 'probation',
    'community safety', 'at-risk', 'at risk', 'vulnerable youth'
  ];

  const justiceGrants = records.filter(r => {
    const text = `${r.grant || ''} ${r.organisation_recipient || ''} ${r.project || ''}`.toLowerCase();
    return justiceKeywords.some(k => text.includes(k));
  });

  console.log(`  Justice-related: ${justiceGrants.length}`);

  return justiceGrants.map(r => ({
    source: 'brisbane_council',
    source_url: 'https://data.brisbane.qld.gov.au/explore/dataset/grants-recipients',
    recipient_name: r.organisation_recipient?.trim(),
    recipient_abn: r.abn?.trim() || null,
    program_name: r.grant?.trim(),
    program_round: r.grant_round?.trim() || null,
    amount_dollars: parseFloat(r.amount_approved) || null,
    state: 'QLD',
    location: 'Brisbane',
    funding_type: 'grant',
    sector: classifySector(r),
    project_description: r.project?.trim() || null,
  })).filter(r => r.recipient_name);
}

function classifySector(row) {
  const text = `${row.grant || ''} ${row.project || ''}`.toLowerCase();
  if (text.includes('youth') || text.includes('young')) return 'youth_justice';
  if (text.includes('safety') || text.includes('crime') || text.includes('cctv')) return 'community_safety';
  if (text.includes('indigenous') || text.includes('aboriginal') || text.includes('first nations')) return 'indigenous_services';
  if (text.includes('domestic') || text.includes('family violence')) return 'family_violence';
  if (text.includes('legal')) return 'legal_services';
  return 'community_safety';
}

// ── Source 3: QGIP (Queensland Government Investment Portal) ──
async function getQGIPGrants() {
  const JUSTICE_AGENCIES = new Set(['DCYJMA', 'DYJ', 'DYJEVS', 'DYJESBT', 'DCSYW', 'DCSSDS', 'DJAG', 'QCS']);
  const JUSTICE_KEYWORDS = ['youth justice', 'youth detention', 'juvenile', 'justice reinvestment', 'diversion', 'community safety', 'crime prevention', 'victim support', 'offend', 'custod', 'probation', 'parole', 'legal aid', 'legal assistance'];

  // All 13 years of QGIP expenditure data
  const files = [
    { path: '/tmp/qgip-2024-25.csv', year: '2024-25' },
    { path: '/tmp/qgip-2023-24.csv', year: '2023-24' },
    { path: '/tmp/qgip-2022-23.csv', year: '2022-23' },
    { path: '/tmp/qgip-2021-22.csv', year: '2021-22' },
    { path: '/tmp/qgip-2020-21.csv', year: '2020-21' },
    { path: '/tmp/qgip-2019-20.csv', year: '2019-20' },
    { path: '/tmp/qgip-2018-19.csv', year: '2018-19' },
    { path: '/tmp/qgip-2017-18.csv', year: '2017-18' },
    { path: '/tmp/qgip-2016-17.csv', year: '2016-17' },
    { path: '/tmp/qgip-2015-16.csv', year: '2015-16' },
    { path: '/tmp/qgip-2014-15.csv', year: '2014-15' },
    { path: '/tmp/qgip-2013-14.csv', year: '2013-14' },
    { path: '/tmp/qgip-2012-13.csv', year: '2012-13' },
  ].filter(f => fs.existsSync(f.path));

  // Download URLs (for files not yet cached)
  const urls = {
    '2024-25': 'https://www.data.qld.gov.au/dataset/b102c881-2c7f-484a-a8b6-b056fe318964/resource/1c1786e3-16b7-4fc0-ac3f-4d9314e59bdf/download/2024-25-expenditure-consolidated.csv',
    '2023-24': 'https://www.data.qld.gov.au/dataset/b102c881-2c7f-484a-a8b6-b056fe318964/resource/66bfd607-0bb5-4c28-bc1e-1c40f2e9c2c1/download/2023-24-expenditure-consolidated.csv',
    '2022-23': 'https://www.data.qld.gov.au/ckan-opendata-attachments-prod/resources/991a217c-a57a-4125-81db-763ed79955f5/2022-23-expenditure-consolidated.csv',
  };

  const allResults = [];

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`  Downloading ${file.year}...`);
      const data = await fetchUrl(urls[file.year]);
      fs.writeFileSync(file.path, data);
    }

    console.log(`  Processing ${file.year}...`);
    const csvData = fs.readFileSync(file.path, 'latin1');
    const records = parseCSV(csvData);
    let justiceCount = 0;

    for (const row of records) {
      const agency = row['Funding agency'] || '';
      // Handle column name variations across years
      const programTitle = row['Program title'] || row['Funding title'] || '';
      const subProgram = row['Sub-program title'] || '';
      const purpose = row['Purpose'] || row['Funding type'] || '';
      const program = `${programTitle} ${subProgram} ${purpose}`.toLowerCase();

      if (!JUSTICE_AGENCIES.has(agency) && !JUSTICE_KEYWORDS.some(k => program.includes(k))) continue;

      // Handle column name variations: 'Service provider name' (2018+), 'Service provider' (older), 'Legal entity name'/'Legal entity'
      const orgName = (row['Service provider name'] || row['Service provider'] || row['Legal entity name'] || row['Legal entity'] || '').trim();
      if (!orgName || orgName === '0') continue;

      // Handle 'Financial year expenditure' (2018+) vs 'Expenditure ($)' (older) vs 'Total funding' etc
      let amountRaw = row['Financial year expenditure'] || row['Expenditure ($)'] || row['Expenditure'] || row['Total funding under this agreement to date'] || '0';
      let amount = parseFloat(String(amountRaw).replace(/,/g, '').replace(/\$/g, '')) || null;

      const agencySector = {
        'DJAG': 'legal_services',
        'QCS': 'corrections',
        'QPS': 'policing',
        'DCYJMA': 'youth_justice',
        'DYJ': 'youth_justice',
        'DYJEVS': 'youth_justice',
        'DYJESBT': 'youth_justice',
        'DCSSDS': 'community_services',
        'DCSYW': 'community_services',
      };

      const location = (row['Service delivery suburb/locality'] || row['Legal entity suburb/locality'] || row['Legal entity LGA'] || '').trim();

      allResults.push({
        source: 'qgip',
        source_url: 'https://www.data.qld.gov.au/dataset/queensland-government-investment-portal-expenditure-data-consolidated-view',
        recipient_name: orgName,
        recipient_abn: (row['Australian Business Number (ABN)'] || '').trim() || null,
        program_name: programTitle.trim(),
        program_round: subProgram.trim() || null,
        amount_dollars: amount,
        state: 'QLD',
        location: location || null,
        funding_type: (row['Funding use'] || row['Funding type'] || 'grant').toLowerCase().includes('capital') ? 'capital' : 'grant',
        sector: agencySector[agency] || classifyQGIPSector(program),
        project_description: (row['Purpose'] || '').trim() || null,
        financial_year: file.year,
      });
      justiceCount++;
    }
    console.log(`  ${file.year}: ${justiceCount} justice records from ${records.length} total`);
  }

  console.log(`  Total QGIP justice records: ${allResults.length}`);
  return allResults;
}

function classifyQGIPSector(program) {
  if (program.includes('youth') || program.includes('juvenile')) return 'youth_justice';
  if (program.includes('victim')) return 'victim_support';
  if (program.includes('domestic') || program.includes('family violence')) return 'family_violence';
  if (program.includes('legal')) return 'legal_services';
  if (program.includes('custod') || program.includes('correction') || program.includes('prison')) return 'corrections';
  if (program.includes('community safety') || program.includes('crime')) return 'community_safety';
  return 'justice_services';
}

// ── ALMA org matching ──
async function loadAlmaOrgs() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1000);
  if (error) { console.error('Error loading orgs:', error.message); return []; }
  return data || [];
}

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|inc|ltd|pty|limited|incorporated|association|corporation|co-operative|cooperative)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchOrg(recipientName, orgs) {
  const normRecipient = normalize(recipientName);
  if (!normRecipient) return null;

  // Exact match
  for (const org of orgs) {
    if (normalize(org.name) === normRecipient) return org.id;
  }

  // Substring match
  for (const org of orgs) {
    const normOrg = normalize(org.name);
    if (normOrg.length > 5 && (normRecipient.includes(normOrg) || normOrg.includes(normRecipient))) {
      return org.id;
    }
  }

  // Token overlap (Jaccard >= 0.5)
  const recipientTokens = new Set(normRecipient.split(' ').filter(t => t.length > 2));
  if (recipientTokens.size < 2) return null;

  for (const org of orgs) {
    const orgTokens = new Set(normalize(org.name).split(' ').filter(t => t.length > 2));
    if (orgTokens.size < 2) continue;
    const intersection = [...recipientTokens].filter(t => orgTokens.has(t)).length;
    const union = new Set([...recipientTokens, ...orgTokens]).size;
    if (intersection / union >= 0.5) return org.id;
  }

  return null;
}

// ── Main ──
async function main() {
  const allRecords = [];
  const sources = SOURCE_FILTER ? [SOURCE_FILTER] : ['ministerial', 'brisbane', 'qgip'];

  // Load ALMA orgs for cross-referencing
  const orgs = await loadAlmaOrgs();
  console.log(`📋 Loaded ${orgs.length} ALMA organizations for cross-referencing\n`);

  // Source 1: Ministerial Statements
  if (sources.includes('ministerial') || sources.includes('all')) {
    const ministerial = getMinisterialGrants();
    console.log(`📜 QLD Ministerial Statements: ${ministerial.length} grants`);
    ministerial.forEach(g => console.log(`  $${g.amount_dollars?.toLocaleString()} → ${g.recipient_name} (${g.location})`));
    console.log(`  Total: $${ministerial.reduce((s, g) => s + (g.amount_dollars || 0), 0).toLocaleString()}\n`);
    allRecords.push(...ministerial);
  }

  // Source 2: Brisbane Council
  if (sources.includes('brisbane') || sources.includes('all')) {
    const brisbane = await getBrisbaneGrants();
    console.log(`  Top 10 by amount:`);
    brisbane.sort((a, b) => (b.amount_dollars || 0) - (a.amount_dollars || 0));
    brisbane.slice(0, 10).forEach(g => console.log(`  $${g.amount_dollars?.toLocaleString()} → ${g.recipient_name} | ${g.program_name}`));
    console.log(`  Total: $${brisbane.reduce((s, g) => s + (g.amount_dollars || 0), 0).toLocaleString()}\n`);
    allRecords.push(...brisbane);
  }

  // Source 3: QGIP
  if (sources.includes('qgip') || sources.includes('all')) {
    console.log(`📥 Fetching QGIP (Queensland Government Investment Portal)...`);
    const qgip = await getQGIPGrants();
    console.log(`  Top 15 by amount:`);
    qgip.sort((a, b) => (b.amount_dollars || 0) - (a.amount_dollars || 0));
    qgip.slice(0, 15).forEach(g => console.log(`  $${g.amount_dollars?.toLocaleString()} → ${g.recipient_name} | ${g.program_name} (${g.financial_year})`));
    console.log(`  Total: $${qgip.reduce((s, g) => s + (g.amount_dollars || 0), 0).toLocaleString()}\n`);
    allRecords.push(...qgip);
  }

  // Cross-reference with ALMA
  let linkedCount = 0;
  for (const record of allRecords) {
    const orgId = matchOrg(record.recipient_name, orgs);
    if (orgId) {
      record.alma_organization_id = orgId;
      linkedCount++;
    }
  }
  console.log(`🔗 ALMA cross-reference: ${linkedCount}/${allRecords.length} matched to organizations\n`);

  // Summary
  console.log(`${'═'.repeat(60)}`);
  console.log(`📊 SUMMARY`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`Total records: ${allRecords.length}`);
  console.log(`Total funding: $${allRecords.reduce((s, g) => s + (g.amount_dollars || 0), 0).toLocaleString()}`);
  console.log(`Unique orgs: ${new Set(allRecords.map(r => r.recipient_name)).size}`);
  console.log(`ALMA-linked: ${linkedCount}`);
  console.log(`With ABN: ${allRecords.filter(r => r.recipient_abn).length}`);

  const bySector = {};
  allRecords.forEach(r => {
    bySector[r.sector] = (bySector[r.sector] || 0) + 1;
  });
  console.log(`\nBy sector:`);
  Object.entries(bySector).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

  if (DRY_RUN) {
    console.log(`\n⚠️  DRY RUN — no data written. Use --apply to import.`);
    return;
  }

  // Upsert in batches
  console.log(`\n📤 Upserting ${allRecords.length} records...`);
  const BATCH = 200;
  let inserted = 0, errors = 0;

  for (let i = 0; i < allRecords.length; i += BATCH) {
    const batch = allRecords.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('justice_funding')
      .upsert(batch, {
        onConflict: 'source,recipient_name,program_name,coalesce_program_round,coalesce_amount',
        ignoreDuplicates: true
      });

    if (error) {
      // Try individual inserts on batch failure
      for (const record of batch) {
        const { error: singleError } = await supabase
          .from('justice_funding')
          .insert(record);
        if (singleError) {
          if (!singleError.message?.includes('duplicate')) {
            console.error(`  ❌ ${record.recipient_name}: ${singleError.message}`);
            errors++;
          }
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`  ${Math.min(i + BATCH, allRecords.length)}/${allRecords.length}\r`);
  }

  console.log(`\n\n✅ Import complete!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);

  // Verify
  const { count } = await supabase.from('justice_funding').select('*', { count: 'exact', head: true });
  console.log(`  Total in DB: ${count}`);
}

main().catch(console.error);
