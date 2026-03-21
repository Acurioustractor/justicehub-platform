#!/usr/bin/env node
/**
 * Tag 5 sent contacts in GHL with contained campaign tags.
 * Run: node scripts/tag-ghl-contacts.mjs
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

const TAGS = ['contained-personal-outreach', 'contained-2026-launch'];
const NAMES = [
  'Lucy Stronach',
  'Alice Mahar',
  'Delilah MacGillivray',
  'Jess Lilley',
  'Daniel Daylight',
];

async function findAndTag(name) {
  const url = `${GHL_API}/contacts/?locationId=${LOC_ID}&limit=5&query=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    console.log(`  Search failed for ${name}: ${res.status}`);
    return;
  }

  const data = await res.json();
  const contact = (data.contacts || [])[0];

  if (!contact) {
    console.log(`  NOT FOUND: ${name}`);
    return;
  }

  const existingTags = contact.tags || [];
  console.log(`  Found: ${contact.contactName || contact.email}`);
  console.log(`  Existing tags: ${existingTags.join(', ') || '(none)'}`);

  const tagRes = await fetch(`${GHL_API}/contacts/${contact.id}/tags`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags: TAGS }),
  });

  if (tagRes.ok) {
    console.log(`  -> Tagged: SUCCESS`);
  } else {
    console.log(`  -> Tagged: FAILED (${tagRes.status})`);
  }
}

console.log(`Tagging ${NAMES.length} contacts with: ${TAGS.join(', ')}\n`);

for (const name of NAMES) {
  console.log(`[${name}]`);
  await findAndTag(name);
  console.log('');
}

console.log('Done.');
