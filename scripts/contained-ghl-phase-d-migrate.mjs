#!/usr/bin/env node
/**
 * CONTAINED → canonical GHL tag migration (Phase D, RC3 additive-then-strip).
 *
 * Brings the ~260 live CONTAINED contacts onto the canonical one-account tag
 * contract WITHOUT a window where a contact has no project tag. It does this in
 * two SEPARATE, separately-gated passes:
 *
 *   Pass A (--apply)  ADD canonical tags. Strips NOTHING.
 *   Pass B (--strip)  REMOVE the legacy project:contained* tags. Run only AFTER
 *                     Pass A is verified green in the GHL UI.
 *
 * Canonical target per contact (mirrors the shipped /api/ghl/register CONTAINED
 * branch — src/lib/ghl/client.ts GHL_CANONICAL / STATE_TO_PLACE):
 *   ADD (if absent):  project:act-jh, source:event:contained,
 *                     interest:justice-reform, place:sa,
 *                     engagement:warm  (ONLY if the contact has no engagement:* —
 *                                       RC2 keeps the existing lifecycle layer)
 *   STRIP (Pass B):   project:contained, project:contained-adelaide-2026
 *   PRESERVE:         every existing role:* / comms:* / engagement:* / source:* /
 *                     interest:* and the flat contained-* lead-quality markers.
 *   role:             NEVER invented. Contacts with no canonical role:* are listed
 *                     under needsRoleReview for a human to set by hand.
 *
 * SAFETY MODEL (this is a Tier-3 live-CRM write — day-shift, human-in-loop,
 * gated to the 16-Jun go/no-go):
 *   - DEFAULT is dry-run. Reads live GHL read-only, prints the plan, writes a
 *     plan JSON. Writes NOTHING. Safe to run anytime (Tier 1).
 *   - Writes are blocked unless  CONTAINED_PHASE_D_APPLY=yes-write-live-ghl
 *     AND the matching confirm flag is passed.
 *   - The two passes are separate invocations on purpose: that separation IS the
 *     additive-then-strip guarantee.
 *
 * DO NOT confuse this with output/ghl-contained-adelaide-audit/tag-normalize-*.
 * That artifact renames colon→underscore (project:contained → project_contained)
 * and is WRONG-DIRECTION. It must never be applied. This script only ever writes
 * colon-namespaced tags (asserted below) and never reads those files.
 *
 * Usage:
 *   node scripts/contained-ghl-phase-d-migrate.mjs              # dry-run (default, read-only)
 *   node scripts/contained-ghl-phase-d-migrate.mjs --dry-run    # same, explicit
 *   node scripts/contained-ghl-phase-d-migrate.mjs --self-test  # offline logic check, no network
 *
 *   # DAY-SHIFT ONLY (16-Jun gate). Pass A — additive:
 *   CONTAINED_PHASE_D_APPLY=yes-write-live-ghl \
 *     node scripts/contained-ghl-phase-d-migrate.mjs --apply --confirm
 *
 *   # DAY-SHIFT ONLY. Pass B — strip, AFTER Pass A is verified in GHL:
 *   CONTAINED_PHASE_D_APPLY=yes-write-live-ghl \
 *     node scripts/contained-ghl-phase-d-migrate.mjs --strip --confirm-strip
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: '.env.local' });

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';
const OUTPUT_DIR = 'output/ghl-contained-adelaide-audit';
const PLAN_PATH = path.join(OUTPUT_DIR, 'phase-d-migration-plan.json');

// ── Canonical contract (must mirror src/lib/ghl/client.ts) ───────────────────
const LEGACY_PROJECT_STRIP = ['project:contained', 'project:contained-adelaide-2026'];
const CANONICAL_ADD_ALWAYS = [
  'project:act-jh',
  'source:event:contained',
  'interest:justice-reform',
];
const PLACE_TAG = 'place:sa'; // CONTAINED Adelaide cohort = SA (R5: city encoded by place:)
const ENGAGEMENT_DEFAULT = 'engagement:warm';

// Every tag this script could ever ADD. Used both for planning and for the
// colon-namespace safety assertion (guards against the underscore wrong-turn).
const ALL_ADDABLE = [...CANONICAL_ADD_ALWAYS, PLACE_TAG, ENGAGEMENT_DEFAULT];
for (const t of [...ALL_ADDABLE, ...LEGACY_PROJECT_STRIP]) {
  if (!/^[a-z][a-z-]*:[a-z0-9:-]+$/.test(t)) {
    throw new Error(`Non-canonical (non-colon) tag in contract: "${t}" — refusing to run.`);
  }
}

// ── Pure planner — the unit under --self-test ────────────────────────────────
/**
 * @param {string[]} tags  the contact's current tag list
 * @returns {{toAdd:string[], toStrip:string[], needsRoleReview:boolean, hasEngagement:boolean}}
 */
function planContact(tags) {
  const set = new Set((tags || []).map((t) => String(t)));
  const has = (t) => set.has(t);
  const hasPrefix = (p) => [...set].some((t) => t.startsWith(p));

  const toAdd = [];
  for (const t of CANONICAL_ADD_ALWAYS) if (!has(t)) toAdd.push(t);
  if (!has(PLACE_TAG)) toAdd.push(PLACE_TAG);
  // RC2: preserve the existing lifecycle layer. Only seed engagement:warm when
  // the contact has NO engagement:* at all.
  if (!hasPrefix('engagement:')) toAdd.push(ENGAGEMENT_DEFAULT);

  const toStrip = LEGACY_PROJECT_STRIP.filter((t) => has(t));
  const needsRoleReview = !hasPrefix('role:');

  return { toAdd, toStrip, needsRoleReview, hasEngagement: hasPrefix('engagement:') };
}

// ── Offline self-test ────────────────────────────────────────────────────────
function selfTest() {
  const cases = [
    {
      name: 'partner already on colon role + nurture lifecycle',
      tags: ['project:contained', 'project:contained-adelaide-2026', 'role:partner', 'engagement:nurture'],
      expectAdd: ['project:act-jh', 'source:event:contained', 'interest:justice-reform', 'place:sa'],
      expectStrip: ['project:contained', 'project:contained-adelaide-2026'],
      expectReview: false,
    },
    {
      name: 'no engagement, no role → seed warm + flag review',
      tags: ['project:contained', 'project:contained-adelaide-2026', 'contained-hot-lead'],
      expectAdd: ['project:act-jh', 'source:event:contained', 'interest:justice-reform', 'place:sa', 'engagement:warm'],
      expectStrip: ['project:contained', 'project:contained-adelaide-2026'],
      expectReview: true,
    },
    {
      name: 'already fully canonical → no-op add, strip only the one legacy tag present',
      tags: ['project:act-jh', 'source:event:contained', 'interest:justice-reform', 'place:sa', 'role:supporter', 'engagement:hot', 'project:contained'],
      expectAdd: [],
      expectStrip: ['project:contained'],
      expectReview: false,
    },
  ];

  let pass = 0;
  for (const c of cases) {
    const got = planContact(c.tags);
    const okAdd = JSON.stringify(got.toAdd.sort()) === JSON.stringify([...c.expectAdd].sort());
    const okStrip = JSON.stringify(got.toStrip.sort()) === JSON.stringify([...c.expectStrip].sort());
    const okReview = got.needsRoleReview === c.expectReview;
    const ok = okAdd && okStrip && okReview;
    console.log(`${ok ? '✓' : '✗'} ${c.name}`);
    if (!ok) {
      console.log('   add   expected', c.expectAdd, 'got', got.toAdd);
      console.log('   strip expected', c.expectStrip, 'got', got.toStrip);
      console.log('   review expected', c.expectReview, 'got', got.needsRoleReview);
    }
    if (ok) pass++;
  }
  console.log(`\n${pass}/${cases.length} self-test cases passed.`);
  process.exit(pass === cases.length ? 0 : 1);
}

// ── Live GHL (read-only fetch of the CONTAINED pool) ─────────────────────────
function ghlHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Version: GHL_API_VERSION };
}

async function fetchContainedContacts(apiKey, locationId) {
  const wanted = new Set(LEGACY_PROJECT_STRIP);
  const byId = new Map();
  let nextPageUrl = `${GHL_API_BASE}/contacts/?locationId=${locationId}&limit=100`;
  let pages = 0;

  while (nextPageUrl && pages < 80) {
    const res = await fetch(nextPageUrl, { method: 'GET', headers: ghlHeaders(apiKey) });
    if (!res.ok) throw new Error(`GHL contacts fetch failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    for (const c of data.contacts || []) {
      const tags = c.tags || [];
      if (tags.some((t) => wanted.has(t))) {
        byId.set(c.id, { id: c.id, email: c.email || '', name: c.contactName || '', tags });
      }
    }
    pages++;
    nextPageUrl = data.meta?.nextPageUrl || null;
  }
  return [...byId.values()];
}

async function mutateTags(apiKey, contactId, tags, method) {
  const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
    method, // 'POST' = add, 'DELETE' = remove
    headers: ghlHeaders(apiKey),
    body: JSON.stringify({ tags }),
  });
  return res.ok;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) return selfTest();

  const wantApply = argv.includes('--apply');
  const wantStrip = argv.includes('--strip');
  const isWrite = wantApply || wantStrip;
  const dryRun = !isWrite;

  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) {
    console.error('Missing GHL_API_KEY or GHL_LOCATION_ID in .env.local');
    process.exit(1);
  }

  // ── Write-path gates ──
  if (isWrite) {
    if (process.env.CONTAINED_PHASE_D_APPLY !== 'yes-write-live-ghl') {
      console.error('REFUSING to write: set CONTAINED_PHASE_D_APPLY=yes-write-live-ghl (day-shift, 16-Jun gate).');
      process.exit(2);
    }
    if (wantApply && !argv.includes('--confirm')) {
      console.error('REFUSING --apply without --confirm.');
      process.exit(2);
    }
    if (wantStrip && !argv.includes('--confirm-strip')) {
      console.error('REFUSING --strip without --confirm-strip.');
      process.exit(2);
    }
    if (wantStrip && !fs.existsSync(PLAN_PATH)) {
      console.error(`REFUSING --strip: no ${PLAN_PATH}. Run dry-run, then --apply, verify in GHL, THEN strip.`);
      process.exit(2);
    }
  }

  console.log(`\nCONTAINED → canonical GHL migration — mode: ${wantStrip ? 'STRIP (Pass B)' : wantApply ? 'APPLY (Pass A, additive)' : 'DRY-RUN (read-only)'}`);
  console.log('Reading live CONTAINED pool (project:contained*)...');
  const contacts = await fetchContainedContacts(apiKey, locationId);
  console.log(`Found ${contacts.length} CONTAINED contacts.\n`);

  const plans = contacts.map((c) => ({ ...c, plan: planContact(c.tags) }));
  const addCounts = {};
  let touchedAdd = 0;
  let touchedStrip = 0;
  const needsRoleReview = [];
  for (const p of plans) {
    if (p.plan.toAdd.length) touchedAdd++;
    if (p.plan.toStrip.length) touchedStrip++;
    for (const t of p.plan.toAdd) addCounts[t] = (addCounts[t] || 0) + 1;
    if (p.plan.needsRoleReview) needsRoleReview.push({ id: p.id, email: p.email, name: p.name });
  }

  console.log('Tags to ADD (Pass A), by tag:');
  for (const [t, n] of Object.entries(addCounts).sort((a, b) => b[1] - a[1])) console.log(`  +${n.toString().padStart(4)}  ${t}`);
  console.log(`\nTags to STRIP (Pass B): ${LEGACY_PROJECT_STRIP.join(', ')}  (${touchedStrip} contacts)`);
  console.log(`Contacts needing manual role:* review (no canonical role): ${needsRoleReview.length}`);

  // Always (re)write the plan artifact on dry-run / apply for the audit trail.
  if (!wantStrip) {
    const planDoc = {
      generatedAt: new Date().toISOString(),
      mode: dryRun ? 'dry-run' : 'apply',
      contactsScanned: contacts.length,
      contactsToAdd: touchedAdd,
      contactsToStrip: touchedStrip,
      addCounts,
      stripTags: LEGACY_PROJECT_STRIP,
      needsRoleReview,
      contacts: plans.map((p) => ({ id: p.id, email: p.email, toAdd: p.plan.toAdd, toStrip: p.plan.toStrip, needsRoleReview: p.plan.needsRoleReview })),
    };
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(PLAN_PATH, JSON.stringify(planDoc, null, 2));
    console.log(`\nPlan written → ${PLAN_PATH}`);
  }

  if (dryRun) {
    console.log('\nDRY-RUN — no tags written. To execute, see the --apply / --strip usage in the header (day-shift only).');
    return;
  }

  // ── Live writes ──
  let ok = 0;
  let fail = 0;
  for (const p of plans) {
    const tags = wantStrip ? p.plan.toStrip : p.plan.toAdd;
    if (!tags.length) continue;
    const method = wantStrip ? 'DELETE' : 'POST';
    try {
      const success = await mutateTags(apiKey, p.id, tags, method);
      if (success) ok++;
      else { fail++; console.error(`  FAIL ${p.email} (${p.id})`); }
    } catch (err) {
      fail++;
      console.error(`  ERROR ${p.email} (${p.id}): ${err.message}`);
    }
  }
  console.log(`\n${wantStrip ? 'STRIP' : 'ADD'} complete — ${ok} ok, ${fail} failed.`);
  if (wantApply) console.log('Next: verify in the GHL UI, then run the --strip pass.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
