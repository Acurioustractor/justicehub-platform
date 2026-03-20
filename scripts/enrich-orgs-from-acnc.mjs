#!/usr/bin/env node
/**
 * Enrich organizations from their stored ACNC data.
 * Backfills: city, description, website, and infers type from beneficiaries/purposes.
 *
 * Usage: node scripts/enrich-orgs-from-acnc.mjs [--dry-run] [--limit N]
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
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : null;

// --- Type inference from ACNC beneficiaries/purposes ---
const TYPE_RULES = [
  { match: b => b.includes('aboriginal_tsi'), type: 'indigenous-service' },
  { match: (b, p) => p.includes('law_justice') || p.includes('legal'), type: 'legal-service' },
  { match: (b, p) => b.includes('youth') || b.includes('children'), type: 'youth-service' },
  { match: (b, p) => p.includes('mental_health') || p.includes('health'), type: 'health-service' },
  { match: (b, p) => p.includes('social_welfare'), type: 'community-service' },
  { match: (b, p) => p.includes('education') || p.includes('employment'), type: 'education-service' },
  { match: (b, p) => p.includes('housing') || p.includes('homelessness'), type: 'housing-service' },
  { match: (b, p) => b.includes('families'), type: 'family-service' },
];

function inferType(beneficiaries, purposes) {
  const b = Array.isArray(beneficiaries) ? beneficiaries : [];
  const p = Array.isArray(purposes) ? purposes : [];
  for (const rule of TYPE_RULES) {
    if (rule.match(b, p)) return rule.type;
  }
  if (p.length > 0 || b.length > 0) return 'community-service';
  return null;
}

// --- Build description from ACNC data ---
function buildDescription(acncData, name) {
  const beneficiaries = Array.isArray(acncData.beneficiaries) ? acncData.beneficiaries : [];
  const purposes = Array.isArray(acncData.purposes) ? acncData.purposes : [];

  const bLabels = beneficiaries.map(b => b.replace(/_/g, ' ')).filter(Boolean);
  const pLabels = purposes.map(p => p.replace(/_/g, ' ')).filter(Boolean);

  if (pLabels.length === 0 && bLabels.length === 0) return null;

  let desc = '';
  if (pLabels.length > 0 && bLabels.length > 0) {
    desc = `Works in ${pLabels.join(', ')}, serving ${bLabels.join(', ')}`;
  } else if (pLabels.length > 0) {
    desc = `Works in ${pLabels.join(', ')}`;
  } else {
    desc = `Organisation serving ${bLabels.join(', ')}`;
  }

  if (acncData.charity_size) {
    desc += ` (${acncData.charity_size})`;
  }
  return desc + '.';
}

async function main() {
  console.log(`Org enrichment from ACNC data${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('---');

  // Fetch orgs with acnc_data that have gaps
  const PAGE = 1000;
  let offset = 0;
  let totalUpdated = 0;
  let cityBackfilled = 0;
  let descBackfilled = 0;
  let typeBackfilled = 0;
  let websiteBackfilled = 0;
  let processed = 0;

  while (true) {
    let query = sb
      .from('organizations')
      .select('id, name, city, description, type, website, acnc_data')
      .eq('is_active', true)
      .not('acnc_data', 'is', null)
      .range(offset, offset + PAGE - 1);

    const { data: orgs, error } = await query;
    if (error) { console.error('Query error:', error); break; }
    if (!orgs || orgs.length === 0) break;

    for (const org of orgs) {
      if (LIMIT && processed >= LIMIT) break;
      const acnc = org.acnc_data;
      if (!acnc || typeof acnc !== 'object') continue;

      const updates = {};

      // Backfill city
      if (!org.city && acnc.town_city) {
        // Title-case the city (ACNC stores as uppercase)
        updates.city = acnc.town_city
          .toLowerCase()
          .replace(/\b\w/g, c => c.toUpperCase());
        cityBackfilled++;
      }

      // Backfill description
      if (!org.description) {
        const desc = buildDescription(acnc, org.name);
        if (desc) {
          updates.description = desc;
          descBackfilled++;
        }
      }

      // Backfill type
      if (!org.type) {
        const inferred = inferType(acnc.beneficiaries, acnc.purposes);
        if (inferred) {
          updates.type = inferred;
          typeBackfilled++;
        }
      }

      // Backfill website
      if (!org.website && acnc.website) {
        let url = acnc.website;
        if (!url.startsWith('http')) url = 'https://' + url;
        updates.website = url;
        websiteBackfilled++;
      }

      if (Object.keys(updates).length === 0) continue;

      if (DRY_RUN) {
        if (totalUpdated < 5) {
          console.log(`Would update ${org.name}:`, updates);
        }
      } else {
        const { error: updateErr } = await sb
          .from('organizations')
          .update(updates)
          .eq('id', org.id);
        if (updateErr) {
          console.error(`Error updating ${org.name}:`, updateErr.message);
          continue;
        }
      }
      totalUpdated++;
      processed++;
    }

    if (LIMIT && processed >= LIMIT) break;
    offset += PAGE;
    if (orgs.length < PAGE) break;
  }

  console.log('\nResults:');
  console.log(`  Total orgs enriched: ${totalUpdated}`);
  console.log(`  City backfilled: ${cityBackfilled}`);
  console.log(`  Description backfilled: ${descBackfilled}`);
  console.log(`  Type inferred: ${typeBackfilled}`);
  console.log(`  Website backfilled: ${websiteBackfilled}`);
}

main().catch(console.error);
