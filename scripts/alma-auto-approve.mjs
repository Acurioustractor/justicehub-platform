#!/usr/bin/env node
/**
 * ALMA auto-approve — promotes unambiguous enrichment candidates to the
 * organizations table without a human in the loop.
 *
 * Eligibility (all required):
 *   - status='pending_review'
 *   - confidence >= 0.95
 *   - extracted_fields.identity_match.represents_named_org !== false
 *   - For every field that would be applied, the destination column on the
 *     organisation must be empty (we never overwrite)
 *   - If contact_email is present, email_validation.kind === 'valid' AND
 *     email_validation.generic === true (we only auto-publish generic
 *     mailboxes like info@; personal ones still require human review for
 *     consent)
 *
 * Usage:
 *   node scripts/alma-auto-approve.mjs                # dry-run, 50 candidates
 *   node scripts/alma-auto-approve.mjs --apply        # actually promote
 *   node scripts/alma-auto-approve.mjs --apply --limit 200
 *
 * Designed to be safe to schedule daily. A cron of
 *   `0 11 * * *  node scripts/alma-auto-approve.mjs --apply --limit 200`
 * will continuously chew through the easy wins; humans only see the rest.
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
const limit = parseInt(args.find((_, i) => args[i - 1] === '--limit') || '50', 10);
const minConfidence = parseFloat(args.find((_, i) => args[i - 1] === '--min-confidence') || '0.95');

const FIELD_MAP = {
  email: { from: 'contact_email', to: 'contact_email' },
  phone: { from: 'contact_phone', to: 'phone' },
  logo: { from: 'logo_url', to: 'logo_url' },
  annual_report: { from: 'annual_report_url', to: 'annual_report_url' },
  history: { from: 'history_summary', to: 'history_summary' },
};

// The reserved system user id we attribute auto-approvals to. We don't have
// a real user row for this, so we leave reviewed_by null and stamp the
// provenance instead — that way the candidate row still says "reviewed at
// time T by the auto-approve script" without lying about an admin.
const AUTO_APPROVE_MARKER = 'alma-auto-approve.mjs';

function shouldAutoApprove(candidate, org) {
  const reasons = [];
  if (candidate.confidence < minConfidence) {
    reasons.push(`confidence ${candidate.confidence} < ${minConfidence}`);
  }
  const ext = candidate.extracted_fields || {};
  const im = ext.identity_match || {};
  if (im.represents_named_org === false) {
    reasons.push('identity mismatch (data-repair lane)');
  }
  // Check email validation if email is being proposed
  if (ext.contact_email) {
    const ev = ext.email_validation || {};
    if (ev.kind !== 'valid') reasons.push(`email validation ${ev.kind}`);
    if (ev.generic !== true) reasons.push('email is personal mailbox — needs human consent check');
  }
  // Which fields would we actually apply?
  const fieldsToApply = [];
  const skips = [];
  for (const [key, { from, to }] of Object.entries(FIELD_MAP)) {
    const val = ext[from];
    if (!val || typeof val !== 'string' || !val.trim()) continue;
    if (key === 'email') {
      if (org.contact_email || org.email) {
        skips.push(`${key} (org already has)`);
        continue;
      }
    } else if (org[to]) {
      skips.push(`${key} (org already has)`);
      continue;
    }
    fieldsToApply.push(key);
  }
  if (fieldsToApply.length === 0) {
    reasons.push('no fields would be applied (all already populated)');
  }
  return { eligible: reasons.length === 0, reasons, fieldsToApply, skips };
}

async function autoApprove(candidate, org) {
  const updatePayload = { updated_at: new Date().toISOString() };
  const applied = [];
  const ext = candidate.extracted_fields || {};
  for (const [key, { from, to }] of Object.entries(FIELD_MAP)) {
    const val = ext[from];
    if (!val || typeof val !== 'string' || !val.trim()) continue;
    if (key === 'email' && (org.contact_email || org.email)) continue;
    if (key !== 'email' && org[to]) continue;
    updatePayload[to] = val.trim();
    applied.push(key);
  }
  if (applied.length === 0) {
    return { applied: [], status: 'no_changes' };
  }
  const { error: orgErr } = await supabase
    .from('organizations')
    .update(updatePayload)
    .eq('id', org.id);
  if (orgErr) throw new Error(`org update failed: ${orgErr.message}`);

  // Mark candidate approved. reviewed_by stays null because no real user
  // signed off — the provenance.auto_approved_by field carries the truth.
  const provenance = {
    ...(candidate.provenance || {}),
    auto_approved_by: AUTO_APPROVE_MARKER,
    auto_approved_at: new Date().toISOString(),
    auto_applied_fields: applied,
  };
  const { error: candErr } = await supabase
    .from('alma_org_enrichment_candidates')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      provenance,
    })
    .eq('id', candidate.id);
  if (candErr) throw new Error(`candidate mark failed: ${candErr.message}`);

  return { applied, status: 'approved' };
}

async function main() {
  console.log(
    `ALMA auto-approve · ${apply ? 'APPLY' : 'DRY-RUN'} · limit=${limit} · minConf=${minConfidence}\n`
  );

  // Pull high-confidence pending candidates. Order by confidence desc so we
  // process the most certain ones first — if the script aborts we lose the
  // tail, not the front.
  const { data: candidates, error } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('id, organization_id, extracted_fields, confidence, provenance')
    .eq('source', 'website_scrape')
    .eq('status', 'pending_review')
    .gte('confidence', minConfidence)
    .order('confidence', { ascending: false, nullsFirst: false })
    .limit(limit * 3); // overpull so we can filter and still hit the target

  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }

  if (!candidates || candidates.length === 0) {
    console.log('No candidates at the minimum confidence threshold.');
    return;
  }

  // Pull org records in one go
  const orgIds = Array.from(new Set(candidates.map((c) => c.organization_id)));
  const orgsById = {};
  for (let i = 0; i < orgIds.length; i += 100) {
    const slice = orgIds.slice(i, i + 100);
    const { data: orgs } = await supabase
      .from('organizations')
      .select(
        'id, name, slug, contact_email, email, phone, logo_url, annual_report_url, history_summary, is_indigenous_org, archived'
      )
      .in('id', slice);
    for (const o of orgs || []) orgsById[o.id] = o;
  }

  // Triage
  const eligible = [];
  const skipped = [];
  for (const c of candidates) {
    const org = orgsById[c.organization_id];
    if (!org) {
      skipped.push({ candidate: c, reasons: ['org not found'] });
      continue;
    }
    if (org.archived) {
      skipped.push({ candidate: c, reasons: ['org archived'] });
      continue;
    }
    if (org.is_indigenous_org) {
      skipped.push({ candidate: c, reasons: ['Indigenous-led org — never auto-approve'] });
      continue;
    }
    const check = shouldAutoApprove(c, org);
    if (check.eligible) {
      eligible.push({ candidate: c, org, fields: check.fieldsToApply });
    } else {
      skipped.push({ candidate: c, reasons: check.reasons });
    }
    if (eligible.length >= limit) break;
  }

  console.log(`Triage: ${eligible.length} eligible, ${skipped.length} skipped.\n`);

  if (eligible.length === 0) {
    console.log('Nothing to do.');
    if (skipped.length > 0) {
      const reasonCounts = {};
      for (const s of skipped) {
        for (const r of s.reasons) reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      }
      console.log('Skip reasons:');
      for (const [r, n] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${n}× ${r}`);
      }
    }
    return;
  }

  if (!apply) {
    console.log('Would auto-approve:');
    for (const e of eligible.slice(0, 20)) {
      console.log(`  · ${e.org.name} (${e.org.slug}) — ${e.fields.join(', ')}`);
    }
    if (eligible.length > 20) console.log(`  · …and ${eligible.length - 20} more`);
    console.log('\nDry-run — pass --apply to actually promote.');
    return;
  }

  let approved = 0;
  let fieldsApplied = 0;
  let errors = 0;
  for (const e of eligible) {
    try {
      const r = await autoApprove(e.candidate, e.org);
      if (r.status === 'approved') {
        approved++;
        fieldsApplied += r.applied.length;
        console.log(`  ✓ ${e.org.name} (${r.applied.join(', ')})`);
      } else {
        console.log(`  · ${e.org.name} — ${r.status}`);
      }
    } catch (err) {
      errors++;
      console.warn(`  ! ${e.org.name}: ${err.message}`);
    }
  }

  console.log(`\nApproved ${approved} candidates · wrote ${fieldsApplied} fields · ${errors} errors`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
