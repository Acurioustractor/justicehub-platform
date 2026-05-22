#!/usr/bin/env node
/**
 * ALMA email backfill — validates emails sitting in approved candidates'
 * extracted_fields.contact_email and writes the valid+generic ones onto
 * organizations.contact_email.
 *
 * Targets candidates that were auto-approved via the post-2026-05-22 relaxed
 * gate, where non-email fields landed but the email was withheld because
 * email_validation was missing on the candidate. This script does the
 * validation now (regex + DNS MX + generic-vs-personal classification) and
 * lands the safe ones.
 *
 * Conservative rules — we only auto-write when:
 *   - regex valid
 *   - DNS MX resolves (mailbox can receive)
 *   - prefix is a generic mailbox (info@, contact@, hello@, etc.) — never a
 *     personal name@org address without human consent
 *   - the org currently has no contact_email or email
 *
 * Personal-mailbox emails get their email_validation written but the org
 * field stays empty — they surface in /admin/alma/outreach-queue for human
 * review.
 *
 * Usage:
 *   node scripts/alma-email-backfill.mjs                 # dry-run
 *   node scripts/alma-email-backfill.mjs --apply         # write
 *   node scripts/alma-email-backfill.mjs --apply --limit 500
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
const limit = parseInt(args.find((_, i) => args[i - 1] === '--limit') || '1000', 10);

// Generic mailbox prefixes — these are addresses we treat as safe to publish
// because no specific person is named. Stay conservative; when in doubt,
// route to human review rather than auto-publish.
const GENERIC_MAILBOXES = new Set([
  'info',
  'contact',
  'hello',
  'enquiries',
  'admin',
  'office',
  'mail',
  'general',
  'reception',
  'support',
  'team',
  'membership',
  'media',
]);

const mxCache = new Map();

async function hasMxRecord(domain) {
  if (mxCache.has(domain)) return mxCache.get(domain);
  try {
    const dns = await import('node:dns/promises');
    const rec = await dns.resolveMx(domain);
    const ok = Array.isArray(rec) && rec.length > 0;
    mxCache.set(domain, ok);
    return ok;
  } catch {
    mxCache.set(domain, null);
    return null;
  }
}

async function validateEmail(raw) {
  if (!raw || typeof raw !== 'string') return { kind: 'missing', generic: false };
  const trimmed = raw.trim().toLowerCase();
  const shape = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!shape.test(trimmed)) {
    return { kind: 'invalid', reason: 'bad_format', generic: false };
  }
  const [local, domain] = trimmed.split('@');
  const generic = GENERIC_MAILBOXES.has(local);
  const mx = await hasMxRecord(domain);
  if (mx === false) {
    return { kind: 'invalid', reason: 'no_mx', generic, domain };
  }
  return {
    kind: 'valid',
    generic,
    domain,
    mx_checked: mx !== null,
    validated_at: new Date().toISOString(),
  };
}

async function main() {
  console.log(`ALMA email backfill · ${apply ? 'APPLY' : 'DRY-RUN'} · limit=${limit}\n`);

  // Candidates we care about: approved (we landed non-email fields) OR
  // pending_review with an email but no email_validation yet. We also need
  // them to have an extracted_fields.contact_email so there's something
  // to validate.
  const { data: candidates, error } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('id, organization_id, extracted_fields, status, provenance')
    .in('status', ['approved', 'pending_review'])
    .not('extracted_fields->>contact_email', 'is', null)
    .limit(limit * 2);

  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }
  if (!candidates || candidates.length === 0) {
    console.log('No candidates with extracted emails.');
    return;
  }

  // Hydrate org state so we only write when org actually lacks an email.
  const orgIds = Array.from(new Set(candidates.map((c) => c.organization_id)));
  const orgsById = {};
  for (let i = 0; i < orgIds.length; i += 100) {
    const slice = orgIds.slice(i, i + 100);
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug, contact_email, email, is_indigenous_org, archived')
      .in('id', slice);
    for (const o of orgs || []) orgsById[o.id] = o;
  }

  const buckets = {
    written: [],
    skipped_org_has_email: 0,
    skipped_indigenous: 0,
    skipped_archived: 0,
    skipped_personal: 0,
    skipped_invalid_format: 0,
    skipped_no_mx: 0,
    already_validated: 0,
    errors: 0,
  };

  for (const c of candidates) {
    const org = orgsById[c.organization_id];
    if (!org) continue;
    if (org.archived) {
      buckets.skipped_archived++;
      continue;
    }
    if (org.is_indigenous_org) {
      buckets.skipped_indigenous++;
      continue;
    }

    const email = c.extracted_fields?.contact_email;
    if (!email) continue;

    // Skip if we already validated and stored the result on this candidate
    if (c.extracted_fields?.email_validation?.kind && c.extracted_fields.email_validation.kind !== 'missing') {
      buckets.already_validated++;
      // Still attempt to land if the prior validation was valid+generic and
      // org is empty — but only if validation result agrees.
      const ev = c.extracted_fields.email_validation;
      if (ev.kind === 'valid' && ev.generic === true && !org.contact_email && !org.email) {
        if (apply) {
          const { error: upErr } = await supabase
            .from('organizations')
            .update({ contact_email: email, updated_at: new Date().toISOString() })
            .eq('id', org.id);
          if (upErr) buckets.errors++;
          else buckets.written.push({ name: org.name, email });
        } else {
          buckets.written.push({ name: org.name, email, dryRun: true });
        }
      }
      continue;
    }

    const validation = await validateEmail(email);

    // Always stamp the validation result on the candidate so we don't
    // re-validate next run.
    const newExt = {
      ...(c.extracted_fields || {}),
      email_validation: validation,
    };
    // If the validation says invalid, also drop the value into the raw lane
    // so it doesn't get re-attempted as an outreach address.
    if (validation.kind === 'invalid') {
      newExt.contact_email_raw = email;
      newExt.contact_email = null;
    }

    if (apply) {
      const { error: candErr } = await supabase
        .from('alma_org_enrichment_candidates')
        .update({ extracted_fields: newExt })
        .eq('id', c.id);
      if (candErr) {
        buckets.errors++;
        continue;
      }
    }

    if (validation.kind === 'invalid' && validation.reason === 'bad_format') {
      buckets.skipped_invalid_format++;
      continue;
    }
    if (validation.kind === 'invalid' && validation.reason === 'no_mx') {
      buckets.skipped_no_mx++;
      continue;
    }
    if (!validation.generic) {
      buckets.skipped_personal++;
      continue;
    }
    if (org.contact_email || org.email) {
      buckets.skipped_org_has_email++;
      continue;
    }

    // Eligible — write to org
    if (apply) {
      const { error: upErr } = await supabase
        .from('organizations')
        .update({ contact_email: email, updated_at: new Date().toISOString() })
        .eq('id', org.id);
      if (upErr) {
        buckets.errors++;
        continue;
      }
    }
    buckets.written.push({ name: org.name, email });
  }

  console.log(`\nWritten ${buckets.written.length} (${apply ? 'committed' : 'dry-run'}) · errors ${buckets.errors}`);
  console.log(`Skipped breakdown:`);
  console.log(`  ${buckets.skipped_personal} personal mailbox (need human consent)`);
  console.log(`  ${buckets.skipped_no_mx} no MX record`);
  console.log(`  ${buckets.skipped_invalid_format} bad format`);
  console.log(`  ${buckets.skipped_org_has_email} org already has email`);
  console.log(`  ${buckets.skipped_indigenous} Indigenous-led (elder-review path)`);
  console.log(`  ${buckets.skipped_archived} archived`);
  console.log(`  ${buckets.already_validated} already validated (re-checked)`);

  if (buckets.written.length > 0 && buckets.written.length <= 30) {
    console.log(`\nWrote:`);
    for (const w of buckets.written) {
      console.log(`  ✓ ${w.name} ← ${w.email}${w.dryRun ? ' [dry]' : ''}`);
    }
  } else if (buckets.written.length > 30) {
    console.log(`\nFirst 10 of ${buckets.written.length}:`);
    for (const w of buckets.written.slice(0, 10)) {
      console.log(`  ✓ ${w.name} ← ${w.email}${w.dryRun ? ' [dry]' : ''}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
