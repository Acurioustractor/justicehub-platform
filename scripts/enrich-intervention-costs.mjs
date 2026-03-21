/**
 * Enrich alma_interventions with cost_per_young_person from ROGS 2026 data.
 *
 * Strategy:
 * 1. Match each intervention to a state via keyword matching on name/org
 * 2. Use ROGS 17A.21 community supervision cost-per-day as baseline
 *    (most ALMA interventions are community programs, not detention)
 * 3. Annualize: cost_per_day × 365 = annual cost per young person
 * 4. Apply type multiplier (intensive programs cost more, prevention less)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.+)`))?.[1];

const supabase = createClient(
  `https://${getEnv('NEXT_PUBLIC_SUPABASE_URL')?.replace('https://', '') || 'tednluwflfhxyucgwigh.supabase.co'}`,
  getEnv('SUPABASE_SERVICE_ROLE_KEY')
);

// ROGS 2026 Table 17A.21 — Community supervision cost per day per young person (2024-25)
const communityDailyCost = {
  NSW: 367.68,
  VIC: 600.58,
  QLD: 493.17,
  WA: 217.55,
  SA: 101.01,
  TAS: 255.89,
  ACT: 269.73,
  NT: 423.56, // using national average (NT data suppressed)
  national: 423.56,
};

// Type-based multiplier — intensive wraparound costs more, prevention less
const typeMultiplier = {
  'Therapeutic': 1.8,           // intensive clinical programs
  'Wraparound Support': 1.5,    // multi-service coordination
  'Justice Reinvestment': 1.4,  // community-wide investment
  'Family Strengthening': 1.2,  // family-based interventions
  'Cultural Connection': 1.1,   // cultural programs
  'Community-Led': 1.0,         // baseline community programs
  'Diversion': 0.9,             // court diversion (shorter engagement)
  'Education/Employment': 0.8,  // training programs
  'Early Intervention': 0.7,    // lower intensity, earlier stage
  'Prevention': 0.5,            // population-level, lowest per-person cost
};

// State keyword matching (same as research-loop)
const stateKeywords = {
  QLD: ['Queensland', 'QLD', 'Brisbane', 'Gold Coast', 'Cairns', 'Townsville', 'Cleveland', 'Logan', 'Ipswich', 'Toowoomba', 'Rockhampton', 'Mackay'],
  NSW: ['New South Wales', 'NSW', 'Sydney', 'Western Sydney', 'Bourke', 'Mount Druitt', 'Redfern', 'Dubbo', 'Wollongong', 'Newcastle', 'Penrith', 'Parramatta', 'Blacktown'],
  VIC: ['Victoria', 'VIC', 'Melbourne', 'Koori', 'Geelong', 'Ballarat', 'Bendigo', 'Dandenong', 'Shepparton', 'Mildura'],
  WA: ['Western Australia', 'WA', 'Perth', 'Banksia Hill', 'Broome', 'Kimberley', 'Kalgoorlie', 'Geraldton', 'Pilbara', 'Fremantle'],
  SA: ['South Australia', 'SA', 'Adelaide', 'Kurlana Tapa', 'Port Augusta', 'Murray Bridge'],
  NT: ['Northern Territory', 'NT', 'Darwin', 'Alice Springs', 'Don Dale', 'Tiwi', 'Tennant Creek', 'Katherine', 'Arnhem'],
  ACT: ['ACT', 'Canberra', 'Australian Capital Territory', 'Bimberi'],
  TAS: ['Tasmania', 'TAS', 'Hobart', 'Ashley', 'Launceston', 'Devonport'],
};

// Fetch all interventions without cost data
const { data: interventions, error } = await supabase
  .from('alma_interventions')
  .select('id, name, type, operating_organization')
  .neq('verification_status', 'ai_generated')
  .is('cost_per_young_person', null);

if (error) { console.error('Fetch error:', error); process.exit(1); }
console.log(`Found ${interventions.length} interventions without cost data`);

function matchState(name, org) {
  const text = `${name} ${org || ''}`.toLowerCase();
  for (const [state, keywords] of Object.entries(stateKeywords)) {
    if (keywords.some(k => text.includes(k.toLowerCase()))) return state;
  }
  // Check for national/Australia-wide
  if (text.includes('australia') || text.includes('national')) return 'national';
  return 'national'; // default to national average
}

let updated = 0;
let batchUpdates = [];

for (const intervention of interventions) {
  const state = matchState(intervention.name, intervention.operating_organization);
  const dailyCost = communityDailyCost[state] || communityDailyCost.national;
  const multiplier = typeMultiplier[intervention.type] || 1.0;

  // Annual cost = daily cost × 365 × type multiplier
  // This represents the community supervision cost adjusted for program intensity
  const annualCost = Math.round(dailyCost * 365 * multiplier);

  batchUpdates.push({
    id: intervention.id,
    cost_per_young_person: annualCost,
  });
}

// Batch update in groups of 50
const BATCH = 50;
for (let i = 0; i < batchUpdates.length; i += BATCH) {
  const batch = batchUpdates.slice(i, i + BATCH);
  for (const item of batch) {
    const { error: upErr } = await supabase
      .from('alma_interventions')
      .update({ cost_per_young_person: item.cost_per_young_person })
      .eq('id', item.id);
    if (!upErr) updated++;
  }
  process.stdout.write(`\r  Updated: ${updated}/${batchUpdates.length}`);
}

console.log(`\n\n=== COST ENRICHMENT COMPLETE ===`);
console.log(`Interventions updated: ${updated}/${interventions.length}`);

// Show sample distribution
const stateDist = {};
for (const intervention of interventions) {
  const state = matchState(intervention.name, intervention.operating_organization);
  stateDist[state] = (stateDist[state] || 0) + 1;
}
console.log('\nState distribution:');
for (const [state, count] of Object.entries(stateDist).sort((a, b) => b[1] - a[1])) {
  const cost = communityDailyCost[state] || communityDailyCost.national;
  console.log(`  ${state}: ${count} interventions (${cost}/day base cost)`);
}

// Show type distribution with costs
console.log('\nType cost ranges (annual):');
for (const [type, mult] of Object.entries(typeMultiplier).sort((a, b) => b[1] - a[1])) {
  const low = Math.round(communityDailyCost.SA * 365 * mult); // SA is cheapest
  const high = Math.round(communityDailyCost.VIC * 365 * mult); // VIC is most expensive
  console.log(`  ${type}: $${low.toLocaleString()} - $${high.toLocaleString()}/year (×${mult})`);
}
