#!/usr/bin/env node
/**
 * Discover Opposition Entities — CONTAINED Campaign
 *
 * Data-driven discovery of entities working against youth justice reform:
 * 1. Detention contractors (hardcoded known operators + funding cross-ref)
 * 2. Political donor conflicts (orgs receiving justice funding AND donating)
 * 3. "Tough on crime" politicians (donation recipients in justice space)
 *
 * Usage:
 *   node scripts/discover-opposition-entities.mjs
 *   node scripts/discover-opposition-entities.mjs --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .forEach(l => {
        const eqIdx = l.indexOf('=');
        const key = l.slice(0, eqIdx).trim();
        const val = l.slice(eqIdx + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}
const env = loadEnv();

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DRY_RUN = process.argv.includes('--dry-run');

// Known private detention / corrections operators in Australia
const DETENTION_CONTRACTORS = [
  { name: 'Serco', abn_prefix: '44003', keywords: ['serco'] },
  { name: 'GEO Group', abn_prefix: '45074', keywords: ['geo group', 'geo australia'] },
  { name: 'G4S', abn_prefix: '98050', keywords: ['g4s'] },
  { name: 'Wilson Security', abn_prefix: '89004', keywords: ['wilson security'] },
  { name: 'Broadspectrum', abn_prefix: '69063', keywords: ['broadspectrum'] },
  { name: 'Sodexo Justice', abn_prefix: '', keywords: ['sodexo'] },
  { name: 'MTC Australia', abn_prefix: '', keywords: ['mtc australia'] },
  { name: 'Compass Group', abn_prefix: '', keywords: ['compass group'] },
];

async function run() {
  console.log('=== Opposition Entity Discovery ===\n');
  if (DRY_RUN) console.log('** DRY RUN — no writes **\n');

  const results = { contractors: 0, donorConflicts: 0, updated: 0, errors: 0 };

  // 1. DETENTION CONTRACTORS — find in justice_funding
  console.log('1. Scanning for detention contractors in justice funding...');
  for (const contractor of DETENTION_CONTRACTORS) {
    // Search by name pattern in funding recipients
    const namePattern = `%${contractor.keywords[0]}%`;
    const { data: funding } = await supabase
      .from('justice_funding')
      .select('recipient_name, recipient_abn, amount_dollars, source, program_name')
      .or(`recipient_name.ilike.${namePattern}`)
      .gt('amount_dollars', 100000);

    if (!funding || funding.length === 0) continue;

    const totalFunding = funding.reduce((sum, f) => sum + (f.amount_dollars || 0), 0);
    console.log(`  ${contractor.name}: ${funding.length} contracts, $${totalFunding.toLocaleString()}`);
    results.contractors++;

    // Check if entity already exists
    const { data: existing } = await supabase
      .from('campaign_alignment_entities')
      .select('id')
      .ilike('name', `%${contractor.keywords[0]}%`)
      .eq('entity_type', 'organization')
      .limit(1);

    const entityData = {
      entity_type: 'organization',
      name: contractor.name,
      organization: contractor.name,
      alignment_category: 'opponent',
      campaign_list: 'opponents_to_understand',
      justice_alignment_score: -50,
      reach_influence_score: 60,
      accessibility_score: 20,
      composite_score: -10,
      alignment_signals: [
        { type: 'detention_contractor', detail: `Private detention/corrections operator` },
        { type: 'funding', detail: `${funding.length} justice contracts worth $${totalFunding.toLocaleString()}` },
        ...funding.slice(0, 5).map(f => ({
          type: 'contract',
          detail: `${f.program_name || f.source}: $${(f.amount_dollars || 0).toLocaleString()}`
        })),
      ],
      funding_history: [{ total: totalFunding, grants: funding.length }],
      score_confidence: 'high',
      outreach_status: 'pending',
      last_scored_at: new Date().toISOString(),
    };

    if (DRY_RUN) {
      console.log(`    [DRY RUN] Would upsert: ${contractor.name}`);
      continue;
    }

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('campaign_alignment_entities')
        .update(entityData)
        .eq('id', existing[0].id);
      if (error) { console.warn(`    Update error: ${error.message}`); results.errors++; }
      else results.updated++;
    } else {
      const { error } = await supabase
        .from('campaign_alignment_entities')
        .insert(entityData);
      if (error) { console.warn(`    Insert error: ${error.message}`); results.errors++; }
      else results.updated++;
    }
  }

  // 2. POLITICAL DONOR CONFLICTS — orgs receiving justice funding AND making political donations
  console.log('\n2. Cross-referencing justice funding recipients with political donors...');

  // Get all ABNs that appear in both justice_funding and political_donations
  let conflicts = null;
  try {
    const res = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          jf.recipient_abn as abn,
          jf.recipient_name as name,
          SUM(jf.amount_dollars) as total_justice_funding,
          COUNT(DISTINCT jf.id) as funding_count
        FROM justice_funding jf
        WHERE jf.recipient_abn IS NOT NULL
          AND jf.amount_dollars > 100000
        GROUP BY jf.recipient_abn, jf.recipient_name
        HAVING jf.recipient_abn IN (
          SELECT DISTINCT donor_abn FROM political_donations WHERE donor_abn IS NOT NULL AND amount > 10000
        )
        ORDER BY total_justice_funding DESC
        LIMIT 50
      `
    });
    conflicts = res.data;
  } catch {
    conflicts = null;
  }

  if (!conflicts) {
    // Fallback: query both tables separately and cross-reference
    console.log('  RPC not available, using fallback cross-reference...');

    // Get all ABNs from political donations > $10K
    const { data: donorAbns } = await supabase
      .from('political_donations')
      .select('donor_abn, donor_name, amount, donation_to')
      .not('donor_abn', 'is', null)
      .gt('amount', 10000);

    if (donorAbns && donorAbns.length > 0) {
      // Build lookup of donor ABNs
      const donorMap = new Map();
      for (const d of donorAbns) {
        if (!d.donor_abn) continue;
        const key = d.donor_abn.replace(/\s/g, '');
        if (!donorMap.has(key)) donorMap.set(key, { total: 0, donations: [] });
        const entry = donorMap.get(key);
        entry.total += Number(d.amount) || 0;
        entry.donations.push({ to: d.donation_to, amount: d.amount, name: d.donor_name });
      }

      console.log(`  Found ${donorMap.size} unique donor ABNs (>$10K donations)`);

      // Check which of these also appear in justice_funding
      const donorAbnList = [...donorMap.keys()].slice(0, 200);
      for (const abn of donorAbnList) {
        const { data: fundingRecords } = await supabase
          .from('justice_funding')
          .select('recipient_name, amount_dollars, source')
          .eq('recipient_abn', abn)
          .gt('amount_dollars', 100000);

        if (!fundingRecords || fundingRecords.length === 0) continue;

        const totalFunding = fundingRecords.reduce((s, f) => s + (f.amount_dollars || 0), 0);
        const donorInfo = donorMap.get(abn);
        const conflictScore = donorInfo.total > 0 && totalFunding > 0
          ? Math.round((donorInfo.total / totalFunding) * 100)
          : 0;

        const name = fundingRecords[0].recipient_name || donorInfo.donations[0]?.name || abn;
        console.log(`  CONFLICT: ${name} — $${totalFunding.toLocaleString()} justice funding, $${donorInfo.total.toLocaleString()} political donations (conflict: ${conflictScore}%)`);
        results.donorConflicts++;

        if (DRY_RUN) continue;

        // Check if entity exists
        const { data: existing } = await supabase
          .from('campaign_alignment_entities')
          .select('id')
          .eq('acnc_abn', abn)
          .limit(1);

        const updateData = {
          political_donations_summary: {
            total_donations: donorInfo.total,
            donation_count: donorInfo.donations.length,
            recipients: donorInfo.donations.slice(0, 10).map((d) => ({
              party: d.to,
              amount: d.amount,
            })),
            total_justice_funding: totalFunding,
            funding_contracts: fundingRecords.length,
          },
          conflict_score: conflictScore,
        };

        if (existing && existing.length > 0) {
          await supabase
            .from('campaign_alignment_entities')
            .update(updateData)
            .eq('id', existing[0].id);
          results.updated++;
        } else {
          await supabase
            .from('campaign_alignment_entities')
            .insert({
              entity_type: 'organization',
              name,
              acnc_abn: abn,
              alignment_category: 'opponent',
              campaign_list: 'opponents_to_understand',
              justice_alignment_score: -30,
              reach_influence_score: 40,
              accessibility_score: 10,
              composite_score: -10,
              alignment_signals: [
                { type: 'donor_conflict', detail: `$${donorInfo.total.toLocaleString()} in political donations while receiving $${totalFunding.toLocaleString()} in justice funding` },
              ],
              ...updateData,
              score_confidence: 'high',
              outreach_status: 'pending',
              last_scored_at: new Date().toISOString(),
            });
          results.updated++;
        }
      }
    }
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`Detention contractors found: ${results.contractors}`);
  console.log(`Political donor conflicts: ${results.donorConflicts}`);
  console.log(`Entities updated/created: ${results.updated}`);
  console.log(`Errors: ${results.errors}`);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
