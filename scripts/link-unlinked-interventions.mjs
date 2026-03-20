#!/usr/bin/env node
/**
 * Link unlinked ALMA interventions to organizations.
 * Matches by operating_organization name to org name (exact + fuzzy).
 *
 * Usage: node scripts/link-unlinked-interventions.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const DRY_RUN = process.argv.includes('--dry-run');

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\b(inc|ltd|pty|limited|incorporated|association|corp|corporation|co|the)\b\.?/gi, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log(`Link unlinked interventions${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('---');

  // Get unlinked interventions
  const { data: unlinked } = await sb
    .from('alma_interventions')
    .select('id, name, operating_organization, operating_organization_id')
    .is('operating_organization_id', null)
    .neq('verification_status', 'ai_generated')
    .not('operating_organization', 'is', null);

  console.log(`Unlinked interventions with operating_organization text: ${unlinked?.length || 0}`);

  if (!unlinked?.length) {
    console.log('Nothing to link!');
    return;
  }

  // Get all orgs (paginated)
  const orgs = [];
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from('organizations')
      .select('id, name, abn')
      .eq('is_active', true)
      .range(offset, offset + 999);
    if (!data?.length) break;
    orgs.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`Total orgs to match against: ${orgs.length}`);

  // Build lookup maps
  const exactMap = new Map(); // normalized name -> org
  const wordMap = new Map(); // significant words -> [orgs]
  for (const org of orgs) {
    const norm = normalize(org.name);
    exactMap.set(norm, org);

    // Index by significant words (3+ chars)
    const words = norm.split(' ').filter(w => w.length >= 3);
    for (const word of words) {
      if (!wordMap.has(word)) wordMap.set(word, []);
      wordMap.get(word).push(org);
    }
  }

  let exactMatches = 0;
  let fuzzyMatches = 0;
  let noMatch = 0;
  const noMatchList = [];

  for (const intv of unlinked) {
    const normOp = normalize(intv.operating_organization);

    // Exact match
    if (exactMap.has(normOp)) {
      const org = exactMap.get(normOp);
      if (!DRY_RUN) {
        await sb
          .from('alma_interventions')
          .update({ operating_organization_id: org.id })
          .eq('id', intv.id);
      }
      exactMatches++;
      continue;
    }

    // Fuzzy: find orgs sharing the most significant words
    const opWords = normOp.split(' ').filter(w => w.length >= 3);
    if (opWords.length === 0) {
      noMatch++;
      noMatchList.push(intv.operating_organization);
      continue;
    }

    const candidates = new Map(); // org.id -> { org, score }
    for (const word of opWords) {
      const matches = wordMap.get(word) || [];
      for (const org of matches) {
        if (!candidates.has(org.id)) candidates.set(org.id, { org, score: 0 });
        candidates.get(org.id).score++;
      }
    }

    // Best match must share >50% of words
    let bestOrg = null;
    let bestScore = 0;
    for (const { org, score } of candidates.values()) {
      const threshold = Math.max(2, Math.ceil(opWords.length * 0.5));
      if (score >= threshold && score > bestScore) {
        bestScore = score;
        bestOrg = org;
      }
    }

    if (bestOrg) {
      if (!DRY_RUN) {
        await sb
          .from('alma_interventions')
          .update({ operating_organization_id: bestOrg.id })
          .eq('id', intv.id);
      }
      if (fuzzyMatches < 10) {
        console.log(`  Fuzzy: "${intv.operating_organization}" → "${bestOrg.name}" (score: ${bestScore}/${opWords.length})`);
      }
      fuzzyMatches++;
    } else {
      noMatch++;
      if (noMatchList.length < 20) noMatchList.push(intv.operating_organization);
    }
  }

  console.log('\nResults:');
  console.log(`  Exact matches: ${exactMatches}`);
  console.log(`  Fuzzy matches: ${fuzzyMatches}`);
  console.log(`  No match: ${noMatch}`);
  console.log(`  Total linked: ${exactMatches + fuzzyMatches} of ${unlinked.length}`);

  if (noMatchList.length > 0) {
    console.log(`\nSample unmatched (${Math.min(noMatchList.length, 20)}):`);
    for (const name of noMatchList.slice(0, 20)) {
      console.log(`  - ${name}`);
    }
  }
}

main().catch(console.error);
