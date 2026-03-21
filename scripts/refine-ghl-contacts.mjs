#!/usr/bin/env node
/**
 * Refine GHL contacts — tag uncontacted container requesters,
 * apply engagement tier tags, and report pipeline status.
 *
 * Run: node scripts/refine-ghl-contacts.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config({ path: '.env.local' });

const GHL_API = 'https://services.leadconnectorhq.com';
const API_KEY = process.env.GHL_API_KEY;
const LOC_ID = process.env.GHL_LOCATION_ID;

if (!API_KEY || !LOC_ID) {
  console.log('GHL not configured — set GHL_API_KEY and GHL_LOCATION_ID in .env.local');
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
};

// --- Tag taxonomy ---
const TIER_TAGS = {
  HOT_LEAD: 'contained-hot-lead',           // Container requesters + personal contacts
  PERSONAL_OUTREACH: 'contained-personal-outreach',
  LAUNCH_2026: 'contained-2026-launch',
  NEEDS_FOLLOWUP: 'contained-needs-followup', // Contacted but no response
  RESPONDED: 'contained-responded',
  VISITOR: 'contained-visitor',              // Walked through
};

// --- 8 uncontacted container requesters ---
const UNCONTACTED_REQUESTERS = [
  'Penny Lamaro',
  'Irene Portelli',
  'Lewina Schrale',
  'Loic Fery',
  'Toby Gowland',
  'Baressa Frazer',
  'Michael Haji-Ali',
  'Romina Reyftmann',
];

// Already contacted
const ALREADY_SENT = [
  'Lucy Stronach',
  'Alice Mahar',
  'Delilah MacGillivray',
  'Jess Lilley',
  'Daniel Daylight',
];

async function searchContact(name) {
  const url = `${GHL_API}/contacts/?locationId=${LOC_ID}&limit=5&query=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.contacts || [])[0] || null;
}

async function addTags(contactId, tags) {
  const res = await fetch(`${GHL_API}/contacts/${contactId}/tags`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags }),
  });
  return res.ok;
}

// --- Main ---
console.log('=== GHL Contact Refinement ===\n');

// Phase 1: Tag uncontacted container requesters
console.log('--- Phase 1: Tag 8 uncontacted container requesters as HOT LEADS ---\n');

const hotLeadResults = [];
for (const name of UNCONTACTED_REQUESTERS) {
  const contact = await searchContact(name);
  if (!contact) {
    console.log(`  NOT FOUND: ${name}`);
    hotLeadResults.push({ name, status: 'not_found' });
    continue;
  }

  const existingTags = contact.tags || [];
  const hasRealEmail = contact.email && !contact.email.includes('placeholder') && !contact.email.includes('noemail');

  console.log(`  [${contact.contactName || name}]`);
  console.log(`    Email: ${contact.email || '(none)'} ${hasRealEmail ? '✓' : '⚠ NO REAL EMAIL'}`);
  console.log(`    Tags: ${existingTags.join(', ') || '(none)'}`);

  // Apply hot lead + launch tags
  const newTags = [TIER_TAGS.HOT_LEAD, TIER_TAGS.LAUNCH_2026];
  const ok = await addTags(contact.id, newTags);
  console.log(`    -> Tagged: ${ok ? 'SUCCESS' : 'FAILED'}`);

  hotLeadResults.push({
    name: contact.contactName || name,
    email: contact.email,
    hasRealEmail,
    tags: [...existingTags, ...newTags],
    status: ok ? 'tagged' : 'failed',
  });
  console.log('');
}

// Phase 2: Tag already-sent contacts with needs-followup
console.log('--- Phase 2: Tag 5 already-sent contacts with follow-up status ---\n');

for (const name of ALREADY_SENT) {
  const contact = await searchContact(name);
  if (!contact) {
    console.log(`  NOT FOUND: ${name}`);
    continue;
  }

  const existingTags = contact.tags || [];
  const hasResponded = existingTags.includes('contained-responded');

  console.log(`  [${contact.contactName || name}]`);
  console.log(`    Tags: ${existingTags.join(', ') || '(none)'}`);

  if (!hasResponded) {
    const ok = await addTags(contact.id, [TIER_TAGS.NEEDS_FOLLOWUP]);
    console.log(`    -> Added needs-followup: ${ok ? 'SUCCESS' : 'FAILED'}`);
  } else {
    console.log(`    -> Already responded, skipping followup tag`);
  }
  console.log('');
}

// Phase 3: Summary
console.log('=== PIPELINE SUMMARY ===\n');

const canEmail = hotLeadResults.filter(r => r.hasRealEmail && r.status === 'tagged');
const noEmail = hotLeadResults.filter(r => !r.hasRealEmail && r.status === 'tagged');
const notFound = hotLeadResults.filter(r => r.status === 'not_found');

console.log(`Hot leads ready for personal email (${canEmail.length}):`);
canEmail.forEach(r => console.log(`  ✓ ${r.name} — ${r.email}`));

if (noEmail.length > 0) {
  console.log(`\nHot leads WITHOUT email (${noEmail.length}):`);
  noEmail.forEach(r => console.log(`  ⚠ ${r.name} — needs email address`));
}

if (notFound.length > 0) {
  console.log(`\nNot found in GHL (${notFound.length}):`);
  notFound.forEach(r => console.log(`  ✗ ${r.name}`));
}

console.log('\n--- NEXT STEPS ---');
console.log('1. Send personal emails to the hot leads with real emails');
console.log('2. Find email addresses for contacts without them');
console.log('3. Follow up on the 5 already-sent contacts (Day 5 bump)');
console.log('4. Begin Tier 2 warm broadcast next week');
console.log('\nDone.');
