#!/usr/bin/env node
/**
 * Discover Justice Funders — CONTAINED Campaign
 *
 * Queries gs_entities + justice_funding to produce a prioritized
 * top-200 outreach list of orgs receiving the biggest justice contracts.
 * Enriches with ALMA intervention links and updates campaign_alignment_entities.
 *
 * Usage:
 *   node scripts/discover-justice-funders.mjs              # full run (top 200)
 *   node scripts/discover-justice-funders.mjs --limit 10   # test with 10
 *   node scripts/discover-justice-funders.mjs --dry-run    # preview only
 *   node scripts/discover-justice-funders.mjs --csv-only   # just export CSV
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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
const CSV_ONLY = process.argv.includes('--csv-only');
const limitIdx = process.argv.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1]) : 200;

// Tour stop states get accessibility boost
const TOUR_STOP_STATES = ['QLD', 'NSW', 'SA', 'NT'];

function formatDollars(amount) {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function fundingTierScore(totalFunding) {
  if (totalFunding >= 100_000_000) return 95;
  if (totalFunding >= 10_000_000) return 80;
  if (totalFunding >= 1_000_000) return 60;
  return 40;
}

async function main() {
  console.log(`\n=== Discover Justice Funders — Top ${LIMIT} ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : CSV_ONLY ? 'CSV ONLY' : 'LIVE'}\n`);

  // 1. Query top funding recipients
  console.log('1. Querying top justice funding recipients...');
  const { data: topFunders, error: fundErr } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT e.id, e.canonical_name, e.abn, e.state, e.entity_type,
             e.is_community_controlled, e.seifa_irsd_decile,
             SUM(jf.amount_dollars)::numeric as total_funding,
             COUNT(DISTINCT jf.source) as funding_sources,
             COUNT(jf.id) as grant_count
      FROM gs_entities e
      JOIN justice_funding jf ON jf.gs_entity_id = e.id
      WHERE jf.amount_dollars IS NOT NULL AND jf.amount_dollars > 0
      GROUP BY e.id
      HAVING SUM(jf.amount_dollars) > 100000
      ORDER BY total_funding DESC
      LIMIT ${LIMIT}
    `
  });

  // Fallback: if RPC doesn't exist, use direct queries
  let funders;
  if (fundErr) {
    console.log('   RPC not available, using paginated queries...');
    // Direct query approach
    const { data, error } = await supabase
      .from('justice_funding')
      .select('gs_entity_id, amount_dollars, source')
      .not('gs_entity_id', 'is', null)
      .not('amount_dollars', 'is', null)
      .gt('amount_dollars', 0);

    if (error) throw new Error(`Funding query: ${error.message}`);

    // Aggregate in memory
    const byEntity = new Map();
    for (const row of (data || [])) {
      const existing = byEntity.get(row.gs_entity_id) || { total: 0, sources: new Set(), count: 0 };
      existing.total += parseFloat(row.amount_dollars);
      existing.sources.add(row.source);
      existing.count++;
      byEntity.set(row.gs_entity_id, existing);
    }

    // Filter to >$100K and sort
    const topIds = [...byEntity.entries()]
      .filter(([, v]) => v.total > 100000)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, LIMIT);

    // Fetch entity details
    const entityIds = topIds.map(([id]) => id);
    const { data: entities } = await supabase
      .from('gs_entities')
      .select('id, canonical_name, abn, state, entity_type, is_community_controlled, seifa_irsd_decile')
      .in('id', entityIds);

    const entityMap = new Map((entities || []).map(e => [e.id, e]));
    funders = topIds.map(([id, funding]) => ({
      ...entityMap.get(id),
      total_funding: funding.total,
      funding_sources: funding.sources.size,
      grant_count: funding.count,
    })).filter(f => f.canonical_name);
  } else {
    funders = topFunders || [];
  }

  console.log(`   Found ${funders.length} orgs with >$100K in justice funding`);
  if (funders.length > 0) {
    const totalTracked = funders.reduce((s, f) => s + parseFloat(f.total_funding), 0);
    console.log(`   Total funding tracked: ${formatDollars(totalTracked)}`);
  }

  // 2. Enrich with ALMA intervention counts
  console.log('\n2. Enriching with ALMA interventions...');
  const entityIds = funders.map(f => f.id).filter(Boolean);

  // ALMA links go through organizations table: alma_interventions.operating_organization_id → organizations.gs_entity_id
  // First get organizations that map to our gs_entities
  const { data: orgMappings } = await supabase
    .from('organizations')
    .select('id, gs_entity_id')
    .in('gs_entity_id', entityIds)
    .not('gs_entity_id', 'is', null);

  const orgIdToGsId = new Map((orgMappings || []).map(o => [o.id, o.gs_entity_id]));
  const orgIds = [...orgIdToGsId.keys()];

  // Get ALMA intervention counts via organizations
  const { data: almaLinks } = orgIds.length > 0 ? await supabase
    .from('alma_interventions')
    .select('operating_organization_id')
    .neq('verification_status', 'ai_generated')
    .in('operating_organization_id', orgIds) : { data: [] };

  const almaCounts = new Map();
  for (const link of (almaLinks || [])) {
    // Map back from organization_id to gs_entity_id
    const gsId = orgIdToGsId.get(link.operating_organization_id);
    if (gsId) {
      almaCounts.set(gsId, (almaCounts.get(gsId) || 0) + 1);
    }
  }
  console.log(`   ${almaCounts.size} funders have ALMA interventions`);

  // 3. Check existing campaign_alignment_entities by ABN
  console.log('\n3. Checking existing campaign_alignment_entities...');
  const abns = funders.map(f => f.abn).filter(Boolean);
  const { data: existingEntities } = await supabase
    .from('campaign_alignment_entities')
    .select('id, acnc_abn, organization_name, composite_score')
    .in('acnc_abn', abns);
  const existingByAbn = new Map((existingEntities || []).map(e => [e.acnc_abn, e]));
  console.log(`   ${existingByAbn.size} already in campaign_alignment_entities`);

  // 4. Score and build entities
  console.log('\n4. Scoring funders...');
  const entities = [];

  for (const funder of funders) {
    const totalFunding = parseFloat(funder.total_funding);
    const almaCount = almaCounts.get(funder.id) || 0;
    const isTourState = TOUR_STOP_STATES.includes(funder.state);
    const isCommunityControlled = funder.is_community_controlled;

    // Base justice alignment from existing scoring engine
    let justiceAlignmentScore = 50; // baseline: they receive justice funding
    if (isCommunityControlled) justiceAlignmentScore += 15;
    if (almaCount > 0) justiceAlignmentScore += 20;
    justiceAlignmentScore = Math.min(100, justiceAlignmentScore);

    // Reach/influence based on funding tier
    const reachInfluenceScore = fundingTierScore(totalFunding);

    // Accessibility
    let accessibilityScore = 30; // base: we know they exist
    if (isTourState) accessibilityScore += 20;
    if (funder.state) accessibilityScore += 10; // we know their state
    accessibilityScore = Math.min(100, accessibilityScore);

    const compositeScore = Math.round(
      justiceAlignmentScore * 0.4 + reachInfluenceScore * 0.3 + accessibilityScore * 0.3
    );

    const alignmentCategory = justiceAlignmentScore > 50 ? 'ally'
      : justiceAlignmentScore > 20 ? 'potential_ally' : 'neutral';

    const campaignList = totalFunding >= 1_000_000 ? 'funders_to_pitch' : 'allies_to_activate';

    const alignmentSignals = [
      { type: 'funding', detail: `${formatDollars(totalFunding)} across ${funder.funding_sources} sources (${funder.grant_count} grants)` },
    ];
    if (isCommunityControlled) alignmentSignals.push({ type: 'community_controlled', detail: 'Community-controlled organisation' });
    if (almaCount > 0) alignmentSignals.push({ type: 'alma', detail: `${almaCount} ALMA interventions linked` });
    if (isTourState) alignmentSignals.push({ type: 'geography', detail: `Tour stop state: ${funder.state}` });
    if (funder.seifa_irsd_decile && funder.seifa_irsd_decile <= 3) {
      alignmentSignals.push({ type: 'disadvantage', detail: `SEIFA IRSD decile ${funder.seifa_irsd_decile} (high disadvantage)` });
    }

    const entity = {
      entity_type: 'organization',
      name: funder.canonical_name,
      organization_name: funder.canonical_name,
      acnc_abn: funder.abn,
      website: null,
      justice_alignment_score: justiceAlignmentScore,
      reach_influence_score: reachInfluenceScore,
      accessibility_score: accessibilityScore,
      composite_score: compositeScore,
      alignment_category: alignmentCategory,
      campaign_list: campaignList,
      alignment_signals: alignmentSignals,
      warm_paths: [],
      funding_history: [{
        total: totalFunding,
        sources: funder.funding_sources,
        grants: funder.grant_count,
      }],
      outreach_status: 'pending',
      score_confidence: 'high',
      last_scored_at: new Date().toISOString(),
    };

    // If existing, preserve their current outreach_status
    const existing = existingByAbn.get(funder.abn);
    if (existing) {
      entity._existingId = existing.id;
    }

    entities.push(entity);
  }

  // 5. Print top 20
  console.log('\nTop 20 by composite score:');
  const sorted = [...entities].sort((a, b) => b.composite_score - a.composite_score);
  for (const e of sorted.slice(0, 20)) {
    const funding = e.funding_history[0];
    const almaTag = (e.alignment_signals.find(s => s.type === 'alma')?.detail || '').replace(/ ALMA interventions linked/, ' ALMA');
    console.log(
      `  ${String(e.composite_score).padStart(3)} | ${e.alignment_category.padEnd(14)} | ${formatDollars(funding.total).padStart(8)} | ${almaTag.padEnd(10)} | ${e.name.slice(0, 50)}`
    );
  }

  // 6. Upsert to campaign_alignment_entities
  if (!DRY_RUN && !CSV_ONLY) {
    console.log(`\n5. Upserting ${entities.length} funder entities...`);
    let inserted = 0, updated = 0, errors = 0;

    for (const entity of entities) {
      const existingId = entity._existingId;
      delete entity._existingId;

      if (existingId) {
        const { error } = await supabase
          .from('campaign_alignment_entities')
          .update({
            ...entity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingId);
        if (error) { console.warn(`   UPDATE error: ${error.message}`); errors++; }
        else updated++;
      } else {
        const { error } = await supabase
          .from('campaign_alignment_entities')
          .insert(entity);
        if (error) { console.warn(`   INSERT error for ${entity.name}: ${error.message}`); errors++; }
        else inserted++;
      }
    }
    console.log(`   Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`);
  } else {
    console.log(`\n5. [${DRY_RUN ? 'DRY RUN' : 'CSV ONLY'}] Would upsert ${entities.length} entities`);
  }

  // 7. Export CSV
  const outputDir = join(root, 'output');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const date = new Date().toISOString().split('T')[0];
  const csvPath = join(outputDir, `justice-funders-outreach-${date}.csv`);

  const csvHeaders = [
    'rank', 'name', 'abn', 'state', 'entity_type', 'community_controlled',
    'total_funding', 'funding_sources', 'grant_count', 'alma_interventions',
    'justice_alignment', 'reach_influence', 'accessibility', 'composite_score',
    'alignment_category', 'campaign_list', 'tour_stop_state',
  ];

  const csvRows = sorted.map((e, i) => {
    const funding = e.funding_history[0];
    const almaSignal = e.alignment_signals.find(s => s.type === 'alma');
    const almaCount = almaSignal ? almaSignal.detail.match(/\d+/)?.[0] || '0' : '0';
    const isTourState = e.alignment_signals.some(s => s.type === 'geography');
    return [
      i + 1,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      e.acnc_abn || '',
      (funders.find(f => f.canonical_name === e.name) || {}).state || '',
      (funders.find(f => f.canonical_name === e.name) || {}).entity_type || '',
      (funders.find(f => f.canonical_name === e.name) || {}).is_community_controlled ? 'Y' : 'N',
      Math.round(funding.total),
      funding.sources,
      funding.grants,
      almaCount,
      e.justice_alignment_score,
      e.reach_influence_score,
      e.accessibility_score,
      e.composite_score,
      e.alignment_category,
      e.campaign_list,
      isTourState ? 'Y' : 'N',
    ].join(',');
  });

  writeFileSync(csvPath, [csvHeaders.join(','), ...csvRows].join('\n'));
  console.log(`\n6. CSV exported: ${csvPath}`);

  // 8. Final summary
  console.log('\n=== Summary ===');
  const byList = {};
  const byCategory = {};
  for (const e of entities) {
    byList[e.campaign_list] = (byList[e.campaign_list] || 0) + 1;
    byCategory[e.alignment_category] = (byCategory[e.alignment_category] || 0) + 1;
  }
  console.log(`Total: ${entities.length} funders`);
  console.log(`By campaign list:`, JSON.stringify(byList));
  console.log(`By category:`, JSON.stringify(byCategory));
  console.log(`Avg composite score: ${Math.round(entities.reduce((s, e) => s + e.composite_score, 0) / entities.length)}`);
  console.log(`With ALMA interventions: ${entities.filter(e => e.alignment_signals.some(s => s.type === 'alma')).length}`);
  console.log(`Tour stop states: ${entities.filter(e => e.alignment_signals.some(s => s.type === 'geography')).length}`);
  console.log(`Community-controlled: ${entities.filter(e => e.alignment_signals.some(s => s.type === 'community_controlled')).length}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
