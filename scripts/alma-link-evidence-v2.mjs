#!/usr/bin/env node
/**
 * ALMA Evidence Linking v2
 *
 * Enhanced evidence-intervention linking with org match scoring
 * (enabled by Phase 1 org linking) and type affinity.
 *
 * Scoring:
 *   Title/name overlap:          40 pts
 *   Organization match:          30 pts (new — uses operating_organization_id)
 *   Geography overlap:           10 pts per match
 *   Keyword clustering:           5 pts each
 *   Evidence type → int type:    20 pts
 *
 * Link if score ≥ 45 and not already linked.
 *
 * Usage:
 *   node scripts/alma-link-evidence-v2.mjs           # dry-run
 *   node scripts/alma-link-evidence-v2.mjs --apply    # write to DB
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .forEach((line) => {
          const [key, ...values] = line.split('=');
          const trimmedKey = key.trim();
          if (!env[trimmedKey]) {
            env[trimmedKey] = values.join('=').trim();
          }
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const applyMode = process.argv.includes('--apply');

// Evidence type → intervention type affinity pairs
const TYPE_AFFINITIES = [
  ['Community-led research', 'Cultural Connection'],
  ['Community-led research', 'Community-Led'],
  ['Program evaluation', 'Diversion'],
  ['Program evaluation', 'Prevention'],
  ['Program evaluation', 'Therapeutic'],
  ['Government report', 'Justice Reinvestment'],
  ['Government report', 'Early Intervention'],
  ['Peer-reviewed study', 'Therapeutic'],
  ['Indigenous knowledge', 'Cultural Connection'],
  ['Indigenous knowledge', 'Community-Led'],
  ['Community testimony', 'Family Strengthening'],
  ['Community testimony', 'Wraparound Support'],
];

const KEYWORDS = [
  'youth', 'justice', 'diversion', 'detention', 'conferencing',
  'aboriginal', 'indigenous', 'prevention', 'recidivism',
  'court', 'sentencing', 'rehabilitation', 'restorative',
  'healing', 'cultural', 'family', 'community', 'reintegration',
  'incarceration', 'bail', 'mentoring', 'education', 'employment',
];

console.log('\n📚 ALMA Evidence Linking v2');
console.log('═'.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (no changes)'}\n`);

async function main() {
  // Load evidence
  const { data: evidenceList, error: evErr } = await supabase
    .from('alma_evidence')
    .select('*');
  if (evErr) throw evErr;

  // Load interventions (with org ID from Phase 1)
  const { data: interventions, error: intErr } = await supabase
    .from('alma_interventions')
    .select('id, name, description, operating_organization, operating_organization_id, geography, type');
  if (intErr) throw intErr;

  // Load existing links to avoid duplicates
  const { data: existingLinks, error: linkErr } = await supabase
    .from('alma_intervention_evidence')
    .select('intervention_id, evidence_id');
  if (linkErr) throw linkErr;

  const linkedSet = new Set(
    (existingLinks || []).map((l) => `${l.intervention_id}::${l.evidence_id}`)
  );

  console.log(`Evidence records: ${evidenceList.length}`);
  console.log(`Interventions: ${interventions.length}`);
  console.log(`Existing links: ${linkedSet.size}\n`);

  // Build org ID → org name map for evidence org matching
  const newLinks = [];

  for (const evidence of evidenceList) {
    const evidenceTitle = (evidence.title || '').toLowerCase();
    const evidenceFindings = (evidence.findings || '').toLowerCase();
    const evidenceOrg = (evidence.organization || '').toLowerCase();

    const matches = [];

    for (const intervention of interventions) {
      // Skip if already linked
      const key = `${intervention.id}::${evidence.id}`;
      if (linkedSet.has(key)) continue;

      let score = 0;
      const intName = (intervention.name || '').toLowerCase();
      const intDesc = (intervention.description || '').toLowerCase();

      // Title/name overlap (40 pts)
      if (evidenceTitle && intName) {
        if (evidenceTitle.includes(intName) || intName.includes(evidenceTitle)) {
          score += 40;
        } else {
          // Partial token overlap
          const evTokens = new Set(evidenceTitle.split(/\s+/).filter((t) => t.length > 3));
          const intTokens = new Set(intName.split(/\s+/).filter((t) => t.length > 3));
          let overlap = 0;
          for (const t of evTokens) if (intTokens.has(t)) overlap++;
          if (evTokens.size > 0 && overlap / Math.max(evTokens.size, intTokens.size) >= 0.5) {
            score += 25;
          }
        }
      }

      // Organization match (30 pts) — enhanced with operating_organization_id
      if (evidenceOrg && intervention.operating_organization) {
        const intOrg = intervention.operating_organization.toLowerCase();
        if (evidenceOrg.includes(intOrg) || intOrg.includes(evidenceOrg)) {
          score += 30;
        } else {
          // Token-level org match
          const evOrgTokens = evidenceOrg.split(/\s+/).filter((t) => t.length > 3);
          const intOrgTokens = intOrg.split(/\s+/).filter((t) => t.length > 3);
          const orgOverlap = evOrgTokens.filter((t) => intOrgTokens.includes(t)).length;
          if (evOrgTokens.length > 0 && orgOverlap / Math.max(evOrgTokens.length, intOrgTokens.length) >= 0.5) {
            score += 20;
          }
        }
      }

      // Geography overlap (10 pts per match)
      if (evidence.findings && intervention.geography) {
        for (const geo of intervention.geography) {
          if (evidenceFindings.includes(geo.toLowerCase())) {
            score += 10;
          }
        }
      }

      // Keyword clustering (5 pts each)
      for (const kw of KEYWORDS) {
        if (
          (evidenceTitle.includes(kw) || evidenceFindings.includes(kw)) &&
          (intName.includes(kw) || intDesc.includes(kw))
        ) {
          score += 5;
        }
      }

      // Evidence type → intervention type affinity (20 pts)
      if (evidence.evidence_type && intervention.type) {
        const hasAffinity = TYPE_AFFINITIES.some(
          ([evType, intType]) =>
            evidence.evidence_type === evType && intervention.type === intType
        );
        if (hasAffinity) score += 20;
      }

      if (score >= 45) {
        matches.push({ intervention, score });
      }
    }

    // Take best match
    matches.sort((a, b) => b.score - a.score);
    if (matches.length > 0) {
      const best = matches[0];
      newLinks.push({
        intervention_id: best.intervention.id,
        evidence_id: evidence.id,
        score: best.score,
        evidenceTitle: evidence.title,
        interventionName: best.intervention.name,
      });
      // Also link any other high-confidence matches (score ≥ 60) for multi-linking
      for (let i = 1; i < matches.length && i < 3; i++) {
        if (matches[i].score >= 60) {
          newLinks.push({
            intervention_id: matches[i].intervention.id,
            evidence_id: evidence.id,
            score: matches[i].score,
            evidenceTitle: evidence.title,
            interventionName: matches[i].intervention.name,
          });
        }
      }
    }
  }

  console.log(`New links to create: ${newLinks.length}`);

  if (newLinks.length === 0) {
    console.log('\n✅ No new evidence links found.');
    return;
  }

  // Show samples
  console.log('\nSample new links:');
  for (const link of newLinks.slice(0, 15)) {
    console.log(
      `  [${link.score}] "${(link.evidenceTitle || '').substring(0, 40)}..." → "${(link.interventionName || '').substring(0, 40)}..."`
    );
  }

  if (applyMode) {
    console.log(`\nInserting ${newLinks.length} links...`);
    let inserted = 0;
    let errors = 0;

    for (const link of newLinks) {
      const { error: insertErr } = await supabase
        .from('alma_intervention_evidence')
        .insert({
          intervention_id: link.intervention_id,
          evidence_id: link.evidence_id,
        });

      if (insertErr) {
        if (insertErr.code === '23505') {
          // Duplicate — skip
        } else {
          console.error(`  ✗ ${insertErr.message}`);
          errors++;
        }
      } else {
        inserted++;
      }
    }

    console.log(`\n✅ Inserted: ${inserted}, Duplicates skipped, Errors: ${errors}`);
  } else {
    console.log('\nRun with --apply to write changes.');
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exitCode = 1;
});
