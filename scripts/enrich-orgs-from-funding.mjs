#!/usr/bin/env node
/**
 * Enrich skeleton organizations using their linked justice_funding records.
 * Infers type from program names, backfills state from funding state.
 *
 * Usage: node scripts/enrich-orgs-from-funding.mjs [--dry-run] [--limit N]
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : 99999;

// Infer org type from program names.
// Rules are ordered by specificity — first match wins.
// The last rule (community-service) requires justice/welfare-adjacent keywords
// to avoid tagging golf clubs, orchid societies, etc. that receive generic
// "Community Benefit Fund" grants.
const TYPE_RULES = [
  { pattern: /aboriginal|indigenous|torres strait|first nations/i, type: 'indigenous-service' },
  { pattern: /youth|young people|juvenile|child protect/i, type: 'youth-service' },
  { pattern: /family|domestic violence|women|child safety/i, type: 'family-service' },
  { pattern: /health|medical|mental health|drug|alcohol|disability/i, type: 'health-service' },
  { pattern: /education|school|training|vocational|literacy/i, type: 'education-service' },
  { pattern: /legal|justice|court|law|prison|detention|corrective/i, type: 'service_provider' },
  // community-service: require both "community" AND a justice/welfare signal word
  { pattern: /community.{0,30}(service|support|care|welfare|housing|homelessness|crisis|counselling|intervention|outreach|rehabilitation|reintegration|restorative)/i, type: 'community-service' },
  { pattern: /(service|support|care|welfare|housing|homelessness|crisis|counselling|intervention|outreach|rehabilitation|reintegration|restorative).{0,30}community/i, type: 'community-service' },
  { pattern: /neighbourhood centre|community (centre|center)|settlement service|migrant|refugee/i, type: 'community-service' },
];

function inferType(programNames) {
  const combined = programNames.join(' ');
  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(combined)) return rule.type;
  }
  return null;
}

async function main() {
  console.log(`Funding-based org enrichment${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('---');

  // Get skeleton orgs (no type, no description, no city, no tags)
  let offset = 0;
  const skeletonOrgs = [];
  while (true) {
    const { data } = await sb
      .from('organizations')
      .select('id, name, state, type, city')
      .eq('is_active', true)
      .is('type', null)
      .is('description', null)
      .is('city', null)
      .order('name')
      .range(offset, offset + 999);
    if (!data?.length) break;
    // Filter out those with tags
    skeletonOrgs.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  console.log(`Skeleton orgs to enrich: ${skeletonOrgs.length}`);
  const toProcess = skeletonOrgs.slice(0, LIMIT);

  let enrichedType = 0;
  let enrichedState = 0;
  let enrichedCity = 0;
  let noFunding = 0;
  let batch = [];

  for (let i = 0; i < toProcess.length; i++) {
    const org = toProcess[i];

    // Get funding records for this org
    const { data: funding } = await sb
      .from('justice_funding')
      .select('program_name, state, location')
      .eq('alma_organization_id', org.id)
      .limit(20);

    if (!funding?.length) {
      noFunding++;
      continue;
    }

    const updates = {};

    // Infer type from program names
    if (!org.type) {
      const programNames = funding.map(f => f.program_name).filter(Boolean);
      const inferred = inferType(programNames);
      if (inferred) {
        updates.type = inferred;
        enrichedType++;
      }
    }

    // Backfill state from funding
    if (!org.state) {
      const states = funding.map(f => f.state).filter(Boolean);
      if (states.length > 0) {
        // Most common state
        const stateCount = {};
        states.forEach(s => { stateCount[s] = (stateCount[s] || 0) + 1; });
        const topState = Object.entries(stateCount).sort((a, b) => b[1] - a[1])[0][0];
        updates.state = topState;
        enrichedState++;
      }
    }

    // Backfill city from funding location
    if (!org.city) {
      const locations = funding.map(f => f.location).filter(Boolean);
      if (locations.length > 0) {
        updates.city = locations[0]; // Use first non-null location
        enrichedCity++;
      }
    }

    if (Object.keys(updates).length > 0) {
      if (!DRY_RUN) {
        batch.push(sb.from('organizations').update(updates).eq('id', org.id));
        // Flush every 50
        if (batch.length >= 50) {
          await Promise.all(batch);
          batch = [];
        }
      }
    }

    if ((i + 1) % 2000 === 0) {
      console.log(`  Progress: ${i + 1}/${toProcess.length} (type: ${enrichedType}, state: ${enrichedState}, city: ${enrichedCity})`);
    }
  }

  // Flush remaining
  if (batch.length > 0) await Promise.all(batch);

  console.log('\nResults:');
  console.log(`  Total processed: ${toProcess.length}`);
  console.log(`  Type inferred: ${enrichedType}`);
  console.log(`  State backfilled: ${enrichedState}`);
  console.log(`  City backfilled: ${enrichedCity}`);
  console.log(`  No funding records: ${noFunding}`);
}

main().catch(console.error);
