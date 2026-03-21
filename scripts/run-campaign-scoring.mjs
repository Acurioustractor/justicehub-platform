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

async function run() {
  console.log('=== Campaign Alignment Engine — Scoring Run ===\n');

  // 1. Create run record
  const { data: runData } = await supabase
    .from('campaign_alignment_runs')
    .insert({ run_by: 'cli-script', status: 'running' })
    .select('id')
    .single();
  const runId = runData.id;
  console.log('Run ID:', runId);

  // 2. Refresh materialized view
  console.log('\n1. Refreshing materialized view...');
  const { error: rpcErr } = await supabase.rpc('refresh_mv_org_justice_signals');
  if (rpcErr) console.warn('  MV refresh RPC error (non-fatal):', rpcErr.message);
  else console.log('  MV refreshed.');

  // 3. Fetch org signals (only those with some signal) — paginate to get all
  console.log('\n2. Scoring organizations...');
  async function fetchAll(table, filter) {
    const all = [];
    const PAGE = 1000;
    let offset = 0;
    while (true) {
      let q = supabase.from(table).select('*').range(offset, offset + PAGE - 1);
      if (filter) q = filter(q);
      const { data, error } = await q;
      if (error) throw new Error(`Fetch ${table} at ${offset}: ${error.message}`);
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < PAGE) break;
      offset += PAGE;
    }
    return all;
  }

  const orgs = await fetchAll('mv_org_justice_signals', q =>
    q.or('purpose_score.gt.0,beneficiary_score.gt.0,has_foundation.eq.true,is_oric_registered.eq.true,grant_count.gt.0')
  );

  console.log(`  Found ${orgs.length} orgs with signals`);

  const orgEntities = orgs.map(org => {
    const purposeScore = org.purpose_score || 0;
    const beneficiaryScore = org.beneficiary_score || 0;
    const foundationBoost = org.has_foundation ? 30 : 0;
    const justiceFoundationBoost = org.has_justice_focus ? 20 : 0;
    const almaBoost = org.intervention_count > 0 ? 20 : 0;
    const fundingBoost = org.grant_count > 0 ? 20 : 0;
    const oricBoost = org.is_oric_registered ? 10 : 0;

    const rawAlignment = purposeScore + beneficiaryScore + foundationBoost +
      justiceFoundationBoost + almaBoost + fundingBoost + oricBoost;
    const justiceAlignmentScore = Math.min(100, Math.round((rawAlignment / 180) * 100));

    const sizeScore = org.charity_size === 'Large' ? 40 : org.charity_size === 'Medium' ? 25 : 10;
    const givingScore = Math.min(30, Math.round((org.total_giving_annual || 0) / 1000000));
    const interventionScore = Math.min(30, (org.intervention_count || 0) * 10);
    const reachInfluenceScore = Math.min(100, sizeScore + givingScore + interventionScore);

    const alignmentCategory = justiceAlignmentScore > 50 ? 'ally'
      : justiceAlignmentScore > 20 ? 'potential_ally'
      : justiceAlignmentScore > -20 ? 'neutral'
      : 'unknown';

    let campaignList;
    if (org.has_foundation && org.has_justice_focus) campaignList = 'funders_to_pitch';
    else if (alignmentCategory === 'ally') campaignList = 'allies_to_activate';
    else if (alignmentCategory === 'potential_ally' && org.has_foundation) campaignList = 'funders_to_pitch';
    else campaignList = 'allies_to_activate';

    const signals = [];
    if (org.purpose_law_policy) signals.push({ type: 'purpose', detail: 'Law & Policy' });
    if (org.purpose_human_rights) signals.push({ type: 'purpose', detail: 'Human Rights' });
    if (org.purpose_reconciliation) signals.push({ type: 'purpose', detail: 'Reconciliation' });
    if (org.ben_aboriginal_tsi) signals.push({ type: 'beneficiary', detail: 'Aboriginal & TSI peoples' });
    if (org.ben_youth) signals.push({ type: 'beneficiary', detail: 'Youth' });
    if (org.ben_pre_post_release) signals.push({ type: 'beneficiary', detail: 'Pre/post release' });
    if (org.is_oric_registered) signals.push({ type: 'registration', detail: 'ORIC registered Indigenous corporation' });
    if (org.has_foundation) signals.push({ type: 'foundation', detail: `Foundation (${org.has_justice_focus ? 'justice focus' : 'general'})` });
    if (org.intervention_count > 0) signals.push({ type: 'alma', detail: `${org.intervention_count} ALMA interventions` });
    if (org.grant_count > 0) signals.push({ type: 'funding', detail: `${org.grant_count} justice grants ($${(org.total_funding_received || 0).toLocaleString()})` });

    const confidence = signals.length >= 3 ? 'high' : signals.length >= 1 ? 'medium' : 'low';
    const compositeScore = Math.round(justiceAlignmentScore * 0.5 + reachInfluenceScore * 0.5);

    return {
      entity_type: 'organization',
      acnc_abn: org.abn,
      organization_name: org.name,
      name: org.name,
      website: org.website,
      justice_alignment_score: justiceAlignmentScore,
      reach_influence_score: reachInfluenceScore,
      accessibility_score: 0,
      composite_score: compositeScore,
      alignment_category: alignmentCategory,
      campaign_list: campaignList,
      alignment_signals: signals,
      funding_history: org.grant_count > 0 ? [{ total: org.total_funding_received, grants: org.grant_count }] : [],
      warm_paths: [],
      outreach_status: 'pending',
      score_confidence: confidence,
      last_scored_at: new Date().toISOString(),
      scoring_run_id: runId,
    };
  });

  // Category breakdown
  const orgCats = {};
  for (const e of orgEntities) orgCats[e.alignment_category] = (orgCats[e.alignment_category] || 0) + 1;
  console.log('  Org categories:', JSON.stringify(orgCats));

  // 4. Score persons
  console.log('\n3. Scoring persons...');
  const { data: persons, error: pErr } = await supabase
    .from('person_identity_map')
    .select('person_id, full_name, email, current_position, current_company, youth_justice_relevance_score, indigenous_affiliation, alignment_tags, ghl_contact_id, government_influence, funding_capacity, collaboration_potential, last_communication_at');
  if (pErr) throw new Error(`Person fetch: ${pErr.message}`);
  console.log(`  Found ${persons.length} persons`);

  // Build org lookup
  const orgSignals = new Map();
  for (const oe of orgEntities) {
    if (oe.organization_name) orgSignals.set(oe.organization_name.toLowerCase(), { alignment: oe.justice_alignment_score, abn: oe.acnc_abn });
  }

  const personEntities = persons.map(p => {
    const company = (p.current_company || '').toLowerCase();
    const orgMatch = company ? orgSignals.get(company) : null;
    const orgInheritance = orgMatch ? Math.round(orgMatch.alignment * 0.5) : 0;

    const yjScore = p.youth_justice_relevance_score || 0;
    const indigenousBoost = p.indigenous_affiliation ? 20 : 0;
    const tags = p.alignment_tags || [];
    const tagBoost = Math.min(30, tags.length * 10);
    const govInfluence = p.government_influence || 0;

    const rawAlignment = orgInheritance + yjScore + indigenousBoost + tagBoost;
    const justiceAlignmentScore = Math.max(-100, Math.min(100, rawAlignment));

    const ghlBoost = p.ghl_contact_id ? 30 : 0;
    const emailBoost = p.email ? 20 : 0;
    const recentCommsBoost = p.last_communication_at ? 15 : 0;
    const warmPathBoost = orgMatch ? 20 : 0;
    const accessibilityScore = Math.min(100, ghlBoost + emailBoost + recentCommsBoost + warmPathBoost);

    const govScore = Math.min(40, govInfluence * 10);
    const fundingCap = p.funding_capacity === 'high' ? 30 : p.funding_capacity === 'medium' ? 20 : 10;
    const collabScore = Math.min(30, (p.collaboration_potential || 0) * 10);
    const reachInfluenceScore = Math.min(100, govScore + fundingCap + collabScore);

    const compositeScore = Math.round(justiceAlignmentScore * 0.4 + reachInfluenceScore * 0.3 + accessibilityScore * 0.3);

    const alignmentCategory = justiceAlignmentScore > 50 ? 'ally'
      : justiceAlignmentScore > 20 ? 'potential_ally'
      : justiceAlignmentScore > -20 ? 'neutral'
      : 'unknown';

    let campaignList;
    if (p.funding_capacity === 'high') campaignList = 'funders_to_pitch';
    else if (govInfluence >= 3) campaignList = 'decision_makers';
    else if (warmPathBoost > 0 && accessibilityScore >= 50) campaignList = 'warm_intros';
    else if (alignmentCategory === 'ally') campaignList = 'allies_to_activate';
    else campaignList = 'allies_to_activate';

    const signals = [];
    if (orgMatch) signals.push({ type: 'org_link', detail: `Works at ${p.current_company} (alignment: ${orgMatch.alignment})` });
    if (yjScore > 0) signals.push({ type: 'relevance', detail: `Youth justice relevance: ${yjScore}` });
    if (p.indigenous_affiliation) signals.push({ type: 'indigenous', detail: 'Indigenous affiliation' });
    for (const tag of tags.slice(0, 5)) signals.push({ type: 'tag', detail: tag });
    if (govInfluence >= 3) signals.push({ type: 'government', detail: `Government influence: ${govInfluence}` });

    const warmPaths = orgMatch ? [{ via: 'employer', org: p.current_company, abn: orgMatch.abn }] : [];

    return {
      entity_type: 'person',
      person_id: p.person_id,
      name: p.full_name || 'Unknown',
      organization: p.current_company,
      position: p.current_position,
      email: p.email,
      justice_alignment_score: justiceAlignmentScore,
      reach_influence_score: reachInfluenceScore,
      accessibility_score: accessibilityScore,
      composite_score: compositeScore,
      alignment_category: alignmentCategory,
      campaign_list: campaignList,
      alignment_signals: signals,
      warm_paths: warmPaths,
      funding_history: [],
      ghl_contact_id: p.ghl_contact_id,
      outreach_status: 'pending',
      score_confidence: signals.length >= 2 ? 'high' : signals.length >= 1 ? 'medium' : 'low',
      last_scored_at: new Date().toISOString(),
      scoring_run_id: runId,
    };
  });

  const persCats = {};
  for (const e of personEntities) persCats[e.alignment_category] = (persCats[e.alignment_category] || 0) + 1;
  console.log('  Person categories:', JSON.stringify(persCats));

  // 5. Clear and insert
  console.log('\n4. Inserting entities...');
  await supabase.from('campaign_alignment_entities').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const allEntities = [...orgEntities, ...personEntities];
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < allEntities.length; i += BATCH) {
    const batch = allEntities.slice(i, i + BATCH);
    const { error } = await supabase.from('campaign_alignment_entities').insert(batch);
    if (error) throw new Error(`Batch ${i}: ${error.message}`);
    inserted += batch.length;
    if (inserted % 2000 === 0 || i + BATCH >= allEntities.length) {
      console.log(`  ${inserted}/${allEntities.length}`);
    }
  }

  // 6. Update run
  await supabase.from('campaign_alignment_runs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    orgs_scored: orgEntities.length,
    persons_scored: personEntities.length,
    total_entities: allEntities.length,
  }).eq('id', runId);

  console.log(`\n=== COMPLETE ===`);
  console.log(`Orgs:    ${orgEntities.length}`);
  console.log(`Persons: ${personEntities.length}`);
  console.log(`Total:   ${allEntities.length}`);

  // Top 10 by composite score
  const top10 = [...allEntities].sort((a, b) => b.composite_score - a.composite_score).slice(0, 10);
  console.log('\nTop 10 by composite score:');
  for (const e of top10) {
    console.log(`  ${e.composite_score} | ${e.alignment_category.padEnd(14)} | ${e.entity_type.padEnd(12)} | ${e.name.slice(0, 50)}`);
  }

  // List breakdown
  const byList = {};
  for (const e of allEntities) byList[e.campaign_list] = (byList[e.campaign_list] || 0) + 1;
  console.log('\nBy campaign list:', JSON.stringify(byList, null, 2));
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
