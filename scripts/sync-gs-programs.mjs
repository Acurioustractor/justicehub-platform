#!/usr/bin/env node
/**
 * Sync GrantScope data → JusticeHub government programs
 *
 * Phase 1: Link remaining JH orgs to GS entities via ABN
 * Phase 2: Find government department contracts via GS relationships (both directions)
 * Phase 3: Search AusTender for youth justice keywords → link to programs
 * Phase 4: Link justice_funding recipients to programs via org interventions
 * Phase 5: ABN bridge — funding ABN → org → interventions → programs
 * Phase 6: GS relationship graph walk — orgs with GS links → their gov contracts → programs
 *
 * Sources: gs_entities (canonical_name), gs_relationships, organizations, justice_funding
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STATS = { orgLinked: 0, contractLinks: 0, austenderLinks: 0, fundingLinks: 0, abnBridge: 0, graphWalk: 0 };

// Helper: create program-intervention link if not exists
async function linkIfNew(programId, interventionId, notes) {
  const { data: existing } = await supabase
    .from('alma_program_interventions')
    .select('id')
    .eq('program_id', programId)
    .eq('intervention_id', interventionId)
    .limit(1);

  if (existing?.length) return false;

  const { error } = await supabase
    .from('alma_program_interventions')
    .insert({
      program_id: programId,
      intervention_id: interventionId,
      relationship: 'implements',
      notes: notes.substring(0, 500),
    });

  return !error;
}

// Helper: find interventions for an org
async function getOrgInterventions(orgId) {
  const { data } = await supabase
    .from('alma_interventions')
    .select('id, name')
    .eq('operating_organization_id', orgId)
    .neq('verification_status', 'ai_generated')
    .limit(10);
  return data || [];
}

// Helper: find JH org by ABN or name
async function findJHOrg(abn, name) {
  if (abn) {
    const cleanAbn = abn.replace(/\s/g, '');
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('abn', cleanAbn)
      .limit(1);
    if (data?.length) return data[0];
  }
  if (name && name.length > 5) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', `%${name.substring(0, 30)}%`)
      .limit(1);
    if (data?.length) return data[0];
  }
  return null;
}

// ── Phase 1: Link JH orgs to GS entities via ABN ──────────────────────────
async function linkOrgsToGS() {
  console.log('\n═══ Phase 1: Link JH orgs → GS entities via ABN ═══');

  let linked = 0;
  let offset = 0;
  const batchSize = 500;

  while (true) {
    const { data: unlinked, error } = await supabase
      .from('organizations')
      .select('id, name, abn')
      .is('gs_entity_id', null)
      .not('abn', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (error || !unlinked?.length) break;
    console.log(`  Batch ${offset / batchSize + 1}: ${unlinked.length} orgs to check`);

    for (const org of unlinked) {
      const abn = org.abn.replace(/\s/g, '');
      if (abn.length < 9) continue;

      const { data: gsEntity } = await supabase
        .from('gs_entities')
        .select('id')
        .eq('abn', abn)
        .limit(1);

      if (gsEntity?.length) {
        const { error: updateErr } = await supabase
          .from('organizations')
          .update({ gs_entity_id: gsEntity[0].id })
          .eq('id', org.id);

        if (!updateErr) {
          linked++;
          if (linked <= 10) console.log(`  Linked: ${org.name} → GS ${gsEntity[0].id.substring(0, 8)}`);
        }
      }
    }

    if (unlinked.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  ✓ Linked ${linked} orgs to GS entities`);
  STATS.orgLinked = linked;
}

// ── Phase 2: Find government contracts via GS relationships ───────────────
async function findGovernmentContracts() {
  console.log('\n═══ Phase 2: Find government contracts for YJ programs ═══');

  const { data: programs } = await supabase
    .from('alma_government_programs')
    .select('id, name, department, jurisdiction')
    .order('budget_amount', { ascending: false, nullsFirst: false });

  console.log(`  ${programs?.length || 0} government programs`);

  // Get unique departments
  const deptNames = [...new Set((programs || []).map(p => p.department).filter(Boolean))];
  console.log(`  ${deptNames.length} unique departments`);

  for (const dept of deptNames) {
    // Search GS entities by canonical_name (NOT name)
    const searchTerms = [
      dept.substring(0, 40),
      // Also try shorter fragments
      ...dept.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(s => s.length > 10),
    ];

    let deptEntity = null;
    for (const term of searchTerms) {
      const { data } = await supabase
        .from('gs_entities')
        .select('id, canonical_name, entity_type, abn')
        .ilike('canonical_name', `%${term}%`)
        .in('entity_type', ['government', 'government_body'])
        .limit(3);

      if (data?.length) {
        deptEntity = data[0];
        break;
      }
    }

    if (!deptEntity) {
      // Broader search — any entity type
      for (const term of searchTerms.slice(0, 1)) {
        const { data } = await supabase
          .from('gs_entities')
          .select('id, canonical_name, entity_type, abn')
          .ilike('canonical_name', `%${term.substring(0, 30)}%`)
          .limit(3);

        if (data?.length) {
          deptEntity = data[0];
          break;
        }
      }
    }

    if (!deptEntity) {
      console.log(`  ✗ Dept not found: ${dept}`);
      continue;
    }

    console.log(`  ✓ Dept: ${dept} → ${deptEntity.canonical_name.substring(0, 50)}`);

    // Search relationships BOTH directions
    const { data: fromDept } = await supabase
      .from('gs_relationships')
      .select('id, target_entity_id, relationship_type, dataset, amount, year, properties')
      .eq('source_entity_id', deptEntity.id)
      .limit(200);

    const { data: toDept } = await supabase
      .from('gs_relationships')
      .select('id, source_entity_id, relationship_type, dataset, amount, year, properties')
      .eq('target_entity_id', deptEntity.id)
      .limit(200);

    const contracts = [
      ...(fromDept || []).map(r => ({ ...r, contractorEntityId: r.target_entity_id })),
      ...(toDept || []).map(r => ({ ...r, contractorEntityId: r.source_entity_id })),
    ];

    if (!contracts.length) {
      console.log(`    No GS relationships for this dept`);
      continue;
    }

    console.log(`    ${contracts.length} relationships (${fromDept?.length || 0} from, ${toDept?.length || 0} to)`);

    // Get contractor entity details
    const contractorIds = [...new Set(contracts.map(c => c.contractorEntityId))];
    const { data: contractors } = await supabase
      .from('gs_entities')
      .select('id, canonical_name, abn')
      .in('id', contractorIds.slice(0, 100));

    const entityMap = new Map((contractors || []).map(e => [e.id, e]));
    const deptPrograms = (programs || []).filter(p => p.department === dept);

    for (const contract of contracts) {
      const contractor = entityMap.get(contract.contractorEntityId);
      if (!contractor) continue;

      const jhOrg = await findJHOrg(contractor.abn, contractor.canonical_name);
      if (!jhOrg) continue;

      const interventions = await getOrgInterventions(jhOrg.id);
      if (!interventions.length) continue;

      for (const prog of deptPrograms) {
        for (const intv of interventions) {
          const linked = await linkIfNew(
            prog.id, intv.id,
            `GS ${contract.dataset || 'contract'}: ${contractor.canonical_name} (ABN ${contractor.abn || 'N/A'})`
          );
          if (linked) {
            STATS.contractLinks++;
            if (STATS.contractLinks <= 20) {
              console.log(`    LINKED: ${intv.name.substring(0, 40)} → ${prog.name.substring(0, 30)}`);
            }
          }
        }
      }
    }
  }

  console.log(`  ✓ ${STATS.contractLinks} links via GS contracts`);
}

// ── Phase 3: Search AusTender for youth justice keywords ──────────────────
async function searchAusTender() {
  console.log('\n═══ Phase 3: AusTender keyword search ═══');

  const { data: programs } = await supabase
    .from('alma_government_programs')
    .select('id, name, jurisdiction');

  // Search AusTender for youth-related contracts
  const keywords = ['youth justice', 'youth detention', 'juvenile justice', 'young offender', 'youth diversion'];
  const allContracts = [];

  for (const kw of keywords) {
    const { data } = await supabase
      .from('gs_relationships')
      .select('id, source_entity_id, target_entity_id, amount, year, properties, dataset')
      .eq('dataset', 'austender')
      .textSearch('properties', kw.replace(/\s+/g, ' & '), { type: 'plain' })
      .limit(50);

    if (data?.length) {
      allContracts.push(...data);
      console.log(`  "${kw}": ${data.length} AusTender records`);
    }
  }

  // Deduplicate
  const seen = new Set();
  const uniqueContracts = allContracts.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  console.log(`  ${uniqueContracts.length} unique AusTender contracts found`);

  // Get entity details
  const entityIds = new Set();
  for (const c of uniqueContracts) {
    entityIds.add(c.source_entity_id);
    entityIds.add(c.target_entity_id);
  }
  const { data: entities } = await supabase
    .from('gs_entities')
    .select('id, canonical_name, abn')
    .in('id', [...entityIds].slice(0, 200));
  const eMap = new Map((entities || []).map(e => [e.id, e]));

  let linked = 0;
  for (const contract of uniqueContracts) {
    // The target is usually the contractor/recipient
    const target = eMap.get(contract.target_entity_id);
    if (!target) continue;

    const jhOrg = await findJHOrg(target.abn, target.canonical_name);
    if (!jhOrg) continue;

    const interventions = await getOrgInterventions(jhOrg.id);
    if (!interventions.length) continue;

    // Find best matching program — try to match by title keywords
    const title = (contract.properties?.title || '').toLowerCase();
    for (const prog of programs || []) {
      const progWords = prog.name.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const hasOverlap = progWords.some(w => title.includes(w));

      // If no title overlap, just match by jurisdiction loosely
      if (!hasOverlap && title.length > 5) continue;

      for (const intv of interventions) {
        const didLink = await linkIfNew(
          prog.id, intv.id,
          `AusTender: ${target.canonical_name} ($${contract.amount || '?'}, ${contract.year || '?'})`
        );
        if (didLink) {
          linked++;
          if (linked <= 15) {
            console.log(`  LINKED: ${intv.name.substring(0, 40)} → ${prog.name.substring(0, 30)} (AusTender)`);
          }
        }
      }
    }
  }

  console.log(`  ✓ ${linked} links via AusTender`);
  STATS.austenderLinks = linked;
}

// ── Phase 4: Link justice_funding recipients to programs ───────────────────
async function linkFundingToPrograms() {
  console.log('\n═══ Phase 4: Link funding recipients → programs ═══');

  const { data: programs } = await supabase
    .from('alma_government_programs')
    .select('id, name, department, jurisdiction');

  let totalLinked = 0;
  for (const prog of programs || []) {
    if (!prog.name || prog.name.length < 5) continue;

    const { data: funding } = await supabase
      .from('justice_funding')
      .select('id, recipient_name, recipient_abn, alma_organization_id, program_name')
      .ilike('program_name', `%${prog.name.substring(0, 30)}%`)
      .not('alma_organization_id', 'is', null)
      .limit(30);

    if (!funding?.length) continue;

    const orgIds = [...new Set(funding.map(f => f.alma_organization_id).filter(Boolean))];

    for (const orgId of orgIds) {
      const interventions = await getOrgInterventions(orgId);

      for (const intv of interventions) {
        const linked = await linkIfNew(
          prog.id, intv.id,
          `Linked via justice_funding: ${(funding.find(f => f.alma_organization_id === orgId)?.recipient_name || '').substring(0, 60)}`
        );
        if (linked) {
          totalLinked++;
          if (totalLinked <= 10) {
            console.log(`  LINKED: ${intv.name.substring(0, 40)} → ${prog.name.substring(0, 30)}`);
          }
        }
      }
    }
  }

  console.log(`  ✓ ${totalLinked} links via funding recipients`);
  STATS.fundingLinks = totalLinked;
}

// ── Phase 5: ABN bridge — funding ABN → org → interventions → programs ────
async function abnBridge() {
  console.log('\n═══ Phase 5: ABN bridge ═══');

  const { data: programs } = await supabase
    .from('alma_government_programs')
    .select('id, name')
    .order('budget_amount', { ascending: false, nullsFirst: false });

  let totalLinked = 0;

  for (const prog of programs || []) {
    if (!prog.name || prog.name.length < 5) continue;

    const { data: funding } = await supabase
      .from('justice_funding')
      .select('recipient_abn, recipient_name')
      .ilike('program_name', `%${prog.name.substring(0, 25)}%`)
      .not('recipient_abn', 'is', null)
      .limit(30);

    if (!funding?.length) continue;

    const abns = [...new Set(funding.map(f => f.recipient_abn).filter(Boolean))];

    for (const abn of abns) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('abn', abn)
        .limit(1);

      if (!org?.length) continue;

      const interventions = await getOrgInterventions(org[0].id);

      for (const intv of interventions) {
        const linked = await linkIfNew(prog.id, intv.id, `ABN bridge: ${abn}`);
        if (linked) {
          totalLinked++;
          if (totalLinked <= 10) {
            console.log(`  LINKED: ${intv.name.substring(0, 40)} → ${prog.name.substring(0, 30)} (ABN ${abn})`);
          }
        }
      }
    }
  }

  console.log(`  ✓ ${totalLinked} links via ABN bridge`);
  STATS.abnBridge = totalLinked;
}

// ── Phase 6: GS graph walk — linked orgs → gov relationships → programs ───
async function graphWalkOrgs() {
  console.log('\n═══ Phase 6: GS graph walk — org → gov contracts → programs ═══');

  const { data: programs } = await supabase
    .from('alma_government_programs')
    .select('id, name, department, jurisdiction');

  // Get JH orgs that have GS links AND interventions
  const { data: linkedOrgs } = await supabase
    .from('organizations')
    .select('id, name, gs_entity_id, state')
    .not('gs_entity_id', 'is', null)
    .limit(2000);

  console.log(`  ${linkedOrgs?.length || 0} orgs with GS links to check`);

  let totalLinked = 0;
  let checked = 0;

  for (const org of linkedOrgs || []) {
    checked++;
    if (checked % 200 === 0) console.log(`  ...checked ${checked}/${linkedOrgs.length}`);

    // Check if this org has any interventions first (skip if not)
    const interventions = await getOrgInterventions(org.id);
    if (!interventions.length) continue;

    // Find GS relationships for this org — look for gov department connections
    const { data: rels } = await supabase
      .from('gs_relationships')
      .select('id, source_entity_id, target_entity_id, relationship_type, dataset, amount, year')
      .or(`source_entity_id.eq.${org.gs_entity_id},target_entity_id.eq.${org.gs_entity_id}`)
      .limit(50);

    if (!rels?.length) continue;

    // Get the OTHER entity in each relationship
    const otherIds = [...new Set(rels.map(r =>
      r.source_entity_id === org.gs_entity_id ? r.target_entity_id : r.source_entity_id
    ))];

    const { data: others } = await supabase
      .from('gs_entities')
      .select('id, canonical_name, entity_type')
      .in('id', otherIds.slice(0, 50));

    const govPartners = (others || []).filter(e =>
      e.entity_type === 'government' || e.entity_type === 'government_body'
    );

    if (!govPartners.length) continue;

    // Match gov partners to program departments
    for (const govEnt of govPartners) {
      const govName = govEnt.canonical_name.toLowerCase();

      // Find programs whose department matches this gov entity
      const matchingPrograms = (programs || []).filter(p => {
        if (!p.department) return false;
        const deptLower = p.department.toLowerCase();
        // Check significant word overlap
        const deptWords = deptLower.split(/\s+/).filter(w => w.length > 4);
        return deptWords.some(w => govName.includes(w));
      });

      if (!matchingPrograms.length) continue;

      // Also check jurisdiction alignment
      const statePrograms = matchingPrograms.filter(p =>
        !p.jurisdiction || !org.state || p.jurisdiction === org.state || p.jurisdiction === 'Federal'
      );

      for (const prog of statePrograms) {
        for (const intv of interventions) {
          const linked = await linkIfNew(
            prog.id, intv.id,
            `GS graph: ${org.name} ↔ ${govEnt.canonical_name.substring(0, 50)} (${rels[0]?.dataset || 'unknown'})`
          );
          if (linked) {
            totalLinked++;
            if (totalLinked <= 20) {
              console.log(`  LINKED: ${intv.name.substring(0, 40)} → ${prog.name.substring(0, 30)} via ${govEnt.canonical_name.substring(0, 30)}`);
            }
          }
        }
      }
    }
  }

  console.log(`  ✓ ${totalLinked} links via GS graph walk`);
  STATS.graphWalk = totalLinked;
}

// ── Run all phases ─────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  GS → JH Government Programs Sync v2               ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const skipPhase1 = process.argv.includes('--skip-phase1');
  if (!skipPhase1) {
    await linkOrgsToGS();
  } else {
    console.log('\n  (Phase 1 skipped — already ran)');
  }
  await findGovernmentContracts();
  await searchAusTender();
  await linkFundingToPrograms();
  await abnBridge();
  await graphWalkOrgs();

  console.log('\n════════════════════════════════════════════════════════');
  console.log(`  Orgs linked to GS:        ${STATS.orgLinked}`);
  console.log(`  GS contract links:        ${STATS.contractLinks}`);
  console.log(`  AusTender keyword links:   ${STATS.austenderLinks}`);
  console.log(`  Funding recipient links:   ${STATS.fundingLinks}`);
  console.log(`  ABN bridge links:          ${STATS.abnBridge}`);
  console.log(`  GS graph walk links:       ${STATS.graphWalk}`);
  const total = STATS.contractLinks + STATS.austenderLinks + STATS.fundingLinks + STATS.abnBridge + STATS.graphWalk;
  console.log(`  TOTAL new links:           ${total}`);
  console.log('════════════════════════════════════════════════════════');
}

main().catch(console.error);
