/**
 * Import ROGS 2026 Youth Justice CSV into rogs_justice_spending table
 *
 * Source: Productivity Commission Report on Government Services 2026
 * CSV: data/rogs-2026-youth-justice.csv (2,444 rows, 28 tables)
 *
 * Existing data: 176 rows across 4 tables (17A.1, 17A.5, 17A.7, 17A.10)
 * This script imports ALL 28 tables including cost-per-day (17A.20, 17A.21)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const env = readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.+)`))?.[1];

const supabase = createClient(
  `https://${getEnv('NEXT_PUBLIC_SUPABASE_URL')?.replace('https://', '') || 'tednluwflfhxyucgwigh.supabase.co'}`,
  getEnv('SUPABASE_SERVICE_ROLE_KEY')
);

// Parse CSV
const csvData = readFileSync('data/rogs-2026-youth-justice.csv', 'utf8');
const records = parse(csvData, { columns: true, skip_empty_lines: true });

console.log(`Parsed ${records.length} rows from ROGS 2026 CSV`);
console.log(`Tables found: ${[...new Set(records.map(r => r.Table_Number))].join(', ')}`);

// Map CSV columns to DB columns
function mapRow(row) {
  const parseNum = (val) => {
    if (!val || val === 'na' || val === 'np' || val === '..') return null;
    // Remove commas and try to parse
    const cleaned = val.replace(/,/g, '').trim();
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  };

  return {
    rogs_table: row.Table_Number,
    rogs_section: 'youth_justice',
    financial_year: row.Year,
    measure: row.Measure || null,
    service_type: row.Service_Type || null,
    indigenous_status: row.Indigenous_Status === 'All people' ? null : row.Indigenous_Status,
    age_group: row.Age === 'Young people' || row.Age === '10-17 years old' ? null : row.Age,
    description1: row.Description1 || null,
    description2: row.Description2 || null,
    description3: row.Description3 || null,
    description4: row.Description4 || null,
    unit: row.Unit || null,
    nsw: parseNum(row.NSW),
    vic: parseNum(row.Vic),
    qld: parseNum(row.Qld),
    wa: parseNum(row.WA),
    sa: parseNum(row.SA),
    tas: parseNum(row.Tas),
    act: parseNum(row.ACT),
    nt: parseNum(row.NT),
    aust: parseNum(row.Aust),
    data_source: row.Data_Source || null,
    year_dollars: row.Year_Dollars || null,
  };
}

const mapped = records.map(mapRow);

// Count by table
const tableCounts = {};
for (const row of mapped) {
  tableCounts[row.rogs_table] = (tableCounts[row.rogs_table] || 0) + 1;
}
console.log('\nRows per table:');
for (const [table, count] of Object.entries(tableCounts).sort()) {
  console.log(`  ${table}: ${count}`);
}

// Unique constraint: (rogs_table, financial_year, measure, service_type, description1, description2, description3, description4, unit)
// Some CSV rows differ by indigenous_status/age_group but collide on the unique key.
// Deduplicate by keeping the "All people" / most general row per unique key.
const seen = new Map();
for (const row of mapped) {
  const key = [row.rogs_table, row.financial_year, row.measure, row.service_type,
    row.description1, row.description2, row.description3, row.description4, row.unit].join('|');
  // Prefer rows with indigenous_status=null (All people) and age_group=null
  if (!seen.has(key) || (!row.indigenous_status && !row.age_group)) {
    seen.set(key, row);
  }
}
const deduped = [...seen.values()];
console.log(`\nDeduped: ${mapped.length} → ${deduped.length} unique rows`);

// Delete existing youth_justice data, then bulk insert
console.log('Deleting existing youth_justice data...');
const { error: delError } = await supabase
  .from('rogs_justice_spending')
  .delete()
  .eq('rogs_section', 'youth_justice');

if (delError) {
  console.error('Delete error:', delError);
  process.exit(1);
}

// Insert in batches of 200
const BATCH_SIZE = 200;
let inserted = 0;
let errors = 0;

for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
  const batch = deduped.slice(i, i + BATCH_SIZE);
  const { data, error } = await supabase
    .from('rogs_justice_spending')
    .insert(batch)
    .select('id');

  if (error) {
    console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    // Try one-by-one for failed batch
    for (const row of batch) {
      const { data: d, error: e } = await supabase
        .from('rogs_justice_spending')
        .upsert(row, { onConflict: 'rogs_table,financial_year,measure,service_type,description1,description2,description3,description4,unit' })
        .select('id');
      if (e) errors++;
      else inserted += (d?.length || 0);
    }
  } else {
    inserted += data.length;
    process.stdout.write(`\r  Inserted: ${inserted}/${deduped.length}`);
  }
}

console.log(`\n\n=== IMPORT COMPLETE ===`);
console.log(`Total rows: ${mapped.length}`);
console.log(`Inserted: ${inserted}`);
console.log(`Errors: ${errors}`);

// Verify cost-per-day data
const { data: costCheck } = await supabase
  .from('rogs_justice_spending')
  .select('rogs_table, financial_year, description1, nsw, vic, qld, wa, sa, aust, unit')
  .eq('rogs_section', 'youth_justice')
  .in('rogs_table', ['17A.20', '17A.21'])
  .eq('financial_year', '2024-25')
  .ilike('description1', '%Cost per%');

console.log('\n=== COST PER DAY DATA (2024-25) ===');
for (const row of costCheck || []) {
  console.log(`${row.rogs_table} | ${row.description1} | Unit: ${row.unit}`);
  console.log(`  NSW: $${row.nsw} | VIC: $${row.vic} | QLD: $${row.qld} | WA: $${row.wa} | SA: $${row.sa} | National: $${row.aust}`);
}
