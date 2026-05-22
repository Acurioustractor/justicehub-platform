#!/usr/bin/env node
/**
 * ALMA org rescore — backfills profile_completeness_score and
 * profile_completeness_breakdown across the eligible org set.
 *
 * The outreach queue, /alma map, and prioritisation in the enrichment
 * script all read profile_completeness_score. As of 2026-05-22 only 822
 * orgs had a score and 97,594 were null, so prioritisation was effectively
 * broken — the enrichment script was picking from the ranked 822 and
 * ignoring the rest of the eligible 43K pool by accident.
 *
 * This script computes the score from data on `organizations` plus the
 * most-recent `organization_claims` row plus evidence/media counts.
 *
 * Usage:
 *   node scripts/alma-rescore.mjs                       # dry-run, top 200
 *   node scripts/alma-rescore.mjs --apply               # write scores
 *   node scripts/alma-rescore.mjs --apply --all         # rescore everything
 *   node scripts/alma-rescore.mjs --apply --batch 5000  # explicit batch
 *
 * Recommended cron: daily early-morning, batch 5000 or --all.
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
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const all = args.includes('--all');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '200', 10);

// Weights match src/lib/alma/profile-completeness.ts. Keep in sync.
const WEIGHTS = {
  has_logo: 0.10,
  has_website: 0.10,
  has_tagline_or_description: 0.08,
  has_history: 0.10,
  has_annual_report: 0.08,
  has_photos: 0.10,
  has_evidence: 0.10,
  has_media_coverage: 0.07,
  is_claimed: 0.15,
  has_named_contact: 0.12,
};

function buildBreakdown(input) {
  return {
    has_logo: !!(input.logo_url && input.logo_url.trim()),
    has_website: !!(
      (input.website_url && input.website_url.trim()) ||
      (input.website && input.website.trim())
    ),
    has_tagline_or_description: !!(
      (input.tagline && input.tagline.trim().length > 0) ||
      (input.description && input.description.trim().length > 30)
    ),
    has_history: !!(input.history_summary && input.history_summary.trim().length > 30),
    has_annual_report: !!(input.annual_report_url && input.annual_report_url.trim()),
    has_photos: !!(input.el_gallery_ids && input.el_gallery_ids.length > 0),
    has_evidence: (input.evidence_count || 0) > 0,
    has_media_coverage: (input.media_count || 0) > 0,
    is_claimed: input.claim_status === 'verified' || input.claim_status === 'community_verified',
    has_named_contact: !!(input.claim_contact_name && input.claim_contact_name.trim()),
  };
}

function scoreOrg(input) {
  const breakdown = buildBreakdown(input);
  let score = 0;
  for (const k of Object.keys(WEIGHTS)) {
    if (breakdown[k]) score += WEIGHTS[k];
  }
  return { score: Math.round(score * 100) / 100, breakdown };
}

async function main() {
  console.log(
    `ALMA rescore · ${apply ? 'APPLY' : 'DRY-RUN'} · ${all ? 'ALL eligible orgs' : `batch=${batchSize}`}\n`
  );

  // Step 1 — pull org IDs to process. Eligibility = not archived. We don't
  // filter Indigenous-led here because they too need a score (just sent
  // through the elder-review path for enrichment, not auto outreach).
  const limit = all ? 100000 : batchSize;
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select(
      'id, name, slug, logo_url, website_url, website, tagline, description, history_summary, annual_report_url, el_gallery_ids, profile_completeness_score'
    )
    .neq('archived', true)
    .order('id', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Fetch orgs failed:', error.message);
    process.exit(1);
  }

  if (!orgs || orgs.length === 0) {
    console.log('No orgs to score.');
    return;
  }

  console.log(`Loaded ${orgs.length} orgs. Hydrating claim + counts in chunks…`);

  // Step 2 — hydrate claim + evidence + media counts for the batch.
  // Doing this per-org would be 4×N queries; we batch by 100 to stay under
  // supabase-js's URL-length silent-fail limit.
  const orgIds = orgs.map((o) => o.id);
  const claimByOrg = new Map();
  const evidenceCountByOrg = new Map();
  const mediaCountByOrg = new Map();

  for (let i = 0; i < orgIds.length; i += 100) {
    const slice = orgIds.slice(i, i + 100);
    const [claims, interventions, mediaArticles] = await Promise.all([
      supabase
        .from('organization_claims')
        .select('organization_id, status, contact_name, created_at')
        .in('organization_id', slice)
        .order('created_at', { ascending: false }),
      // Evidence counts: org -> interventions -> evidence (via junction)
      supabase
        .from('alma_interventions')
        .select('id, operating_organization_id')
        .in('operating_organization_id', slice),
      // Media coverage — alma_media_articles uses organizations_mentioned jsonb.
      // Cheap probe: select id + organizations_mentioned; count locally.
      supabase
        .from('alma_media_articles')
        .select('id, organizations_mentioned')
        .or(slice.map((id) => `organizations_mentioned.cs.["${id}"]`).join(',')),
    ]);

    // Latest claim per org (sorted desc above, so first occurrence wins)
    for (const c of claims.data || []) {
      if (!claimByOrg.has(c.organization_id)) claimByOrg.set(c.organization_id, c);
    }

    // Evidence: count interventions per org as a proxy when the junction
    // count is too expensive. The score only needs >0 vs 0, so an intervention
    // existing is enough to satisfy has_evidence in practice — most ALMA
    // interventions have at least one evidence link.
    const interventionsByOrg = new Map();
    for (const i of interventions.data || []) {
      if (!i.operating_organization_id) continue;
      interventionsByOrg.set(
        i.operating_organization_id,
        (interventionsByOrg.get(i.operating_organization_id) || 0) + 1
      );
    }
    if (interventionsByOrg.size > 0) {
      const interventionIds = (interventions.data || []).map((x) => x.id);
      // Probe alma_intervention_evidence to see which interventions have
      // any evidence rows. We don't need exact counts.
      for (let j = 0; j < interventionIds.length; j += 100) {
        const ivSlice = interventionIds.slice(j, j + 100);
        const { data: links } = await supabase
          .from('alma_intervention_evidence')
          .select('intervention_id')
          .in('intervention_id', ivSlice);
        const seenIv = new Set((links || []).map((l) => l.intervention_id));
        for (const iv of (interventions.data || []).filter((x) => ivSlice.includes(x.id))) {
          if (seenIv.has(iv.id)) {
            evidenceCountByOrg.set(
              iv.operating_organization_id,
              (evidenceCountByOrg.get(iv.operating_organization_id) || 0) + 1
            );
          }
        }
      }
    }

    // Media coverage from jsonb scan
    for (const m of mediaArticles.data || []) {
      const mentions = Array.isArray(m.organizations_mentioned)
        ? m.organizations_mentioned
        : [];
      for (const oid of mentions) {
        if (slice.includes(oid)) {
          mediaCountByOrg.set(oid, (mediaCountByOrg.get(oid) || 0) + 1);
        }
      }
    }
  }

  // Step 3 — score and accumulate updates
  const updates = [];
  let unchanged = 0;
  for (const o of orgs) {
    const claim = claimByOrg.get(o.id);
    const { score, breakdown } = scoreOrg({
      logo_url: o.logo_url,
      website_url: o.website_url,
      website: o.website,
      tagline: o.tagline,
      description: o.description,
      history_summary: o.history_summary,
      annual_report_url: o.annual_report_url,
      el_gallery_ids: o.el_gallery_ids,
      evidence_count: evidenceCountByOrg.get(o.id) || 0,
      media_count: mediaCountByOrg.get(o.id) || 0,
      claim_status: claim?.status,
      claim_contact_name: claim?.contact_name,
    });
    if (o.profile_completeness_score !== null && Math.abs(Number(o.profile_completeness_score) - score) < 0.005) {
      unchanged++;
      continue;
    }
    updates.push({ id: o.id, name: o.name, slug: o.slug, score, breakdown });
  }

  console.log(`Scored ${orgs.length} · ${updates.length} need updates · ${unchanged} unchanged`);

  if (!apply) {
    console.log('\nTop 10 score changes (dry-run):');
    for (const u of updates.slice(0, 10)) {
      console.log(`  ${u.slug.padEnd(40)} → ${u.score}`);
    }
    return;
  }

  // Step 4 — write updates in chunks
  let written = 0;
  let failed = 0;
  for (let i = 0; i < updates.length; i += 50) {
    const chunk = updates.slice(i, i + 50);
    // No bulk update primitive; do them serially in tight loop. Each is a
    // single-row eq update so RTT dominates, not server cost.
    for (const u of chunk) {
      const { error: updErr } = await supabase
        .from('organizations')
        .update({
          profile_completeness_score: u.score,
          profile_completeness_breakdown: u.breakdown,
        })
        .eq('id', u.id);
      if (updErr) {
        console.warn(`  ! ${u.slug}: ${updErr.message}`);
        failed++;
      } else {
        written++;
      }
    }
    if (written % 200 === 0 && written > 0) {
      console.log(`  · ${written}/${updates.length} written`);
    }
  }

  console.log(`\nWrote ${written} rescored orgs (${failed} errors).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
