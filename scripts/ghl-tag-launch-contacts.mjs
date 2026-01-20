#!/usr/bin/env node
/**
 * Tag contacts for JusticeHub Launch Email Campaign
 *
 * This script tags contacts with "JusticeHub Launch 2026" which triggers
 * a workflow in GHL to send the launch email.
 *
 * BEFORE RUNNING:
 * 1. Create workflow in GHL Dashboard:
 *    - Trigger: Tag Added = "JusticeHub Launch 2026"
 *    - Action: Send Email (your launch email template)
 *    - Action: Add Tag "launch-email-sent"
 *
 * 2. Test with --dry-run first
 *
 * Usage:
 *   node scripts/ghl-tag-launch-contacts.mjs --dry-run    # Preview what will happen
 *   node scripts/ghl-tag-launch-contacts.mjs              # Actually tag contacts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const LAUNCH_TAG = 'JusticeHub Launch 2026';
const SENT_TAG = 'launch-email-sent';

// Tags that indicate interest in JusticeHub
const TARGET_TAGS = [
  'justicehub',
  'justice',
  'youth justice',
  'interest:justice-reform',
  'Newsletter',
  'responsive',
];

const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;
const isDryRun = process.argv.includes('--dry-run');

if (!apiKey || !locationId) {
  console.error('Missing GHL_API_KEY or GHL_LOCATION_ID in .env.local');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
};

async function getAllContacts() {
  let allContacts = [];
  let nextPageUrl = `${GHL_API_BASE}/contacts/?locationId=${locationId}&limit=100`;

  while (nextPageUrl) {
    console.log(`Fetching contacts...`);
    const response = await fetch(nextPageUrl, { headers });

    if (!response.ok) {
      console.error('Failed to fetch contacts:', response.status);
      break;
    }

    const data = await response.json();
    allContacts = [...allContacts, ...(data.contacts || [])];
    nextPageUrl = data.meta?.nextPageUrl || null;

    if (allContacts.length > 2000) {
      console.log('Safety limit reached at 2000 contacts');
      break;
    }
  }

  return allContacts;
}

async function addTag(contactId, tag) {
  const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags: [tag] }),
  });
  return response.ok;
}

async function main() {
  console.log('='.repeat(60));
  console.log('JusticeHub Launch Email - Contact Tagger');
  console.log('='.repeat(60));
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Launch tag: ${LAUNCH_TAG}`);
  console.log(`Target tags: ${TARGET_TAGS.join(', ')}`);
  console.log('');

  // Fetch all contacts
  const allContacts = await getAllContacts();
  console.log(`Total contacts fetched: ${allContacts.length}`);

  // Filter contacts
  const eligibleContacts = allContacts.filter(contact => {
    const tags = contact.tags || [];

    // Skip if already tagged for launch
    if (tags.includes(LAUNCH_TAG) || tags.includes(SENT_TAG)) {
      return false;
    }

    // Include if has any target tag
    return tags.some(t =>
      TARGET_TAGS.some(target =>
        t.toLowerCase().includes(target.toLowerCase())
      )
    );
  });

  console.log(`Eligible contacts (not yet tagged): ${eligibleContacts.length}`);
  console.log('');

  if (eligibleContacts.length === 0) {
    console.log('No contacts to tag. Done!');
    return;
  }

  // Show preview
  console.log('Contacts to be tagged:');
  console.log('-'.repeat(60));
  eligibleContacts.slice(0, 20).forEach(c => {
    console.log(`  ${c.email} (tags: ${(c.tags || []).slice(0, 3).join(', ')})`);
  });
  if (eligibleContacts.length > 20) {
    console.log(`  ... and ${eligibleContacts.length - 20} more`);
  }
  console.log('');

  if (isDryRun) {
    console.log('DRY RUN complete. Run without --dry-run to apply tags.');
    return;
  }

  // Apply tags
  console.log('Applying tags...');
  let success = 0;
  let failed = 0;

  for (const contact of eligibleContacts) {
    const ok = await addTag(contact.id, LAUNCH_TAG);
    if (ok) {
      success++;
      process.stdout.write(`\rTagged: ${success}/${eligibleContacts.length}`);
    } else {
      failed++;
    }
    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('');
  console.log('');
  console.log('='.repeat(60));
  console.log('COMPLETE');
  console.log(`  Tagged: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log('');
  console.log('Next: Your GHL workflow will send the launch email to these contacts.');
  console.log('='.repeat(60));
}

main().catch(console.error);
