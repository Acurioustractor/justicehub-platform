#!/usr/bin/env node
/**
 * GHL Full Sync Sweep
 *
 * Fetches all GHL contacts, reconciles with Supabase tables:
 * - public_profiles (via email → social_links.ghl_contact_id)
 * - campaign_alignment_entities (via email → ghl_contact_id)
 *
 * Also reports tag distribution and unmatched contacts.
 *
 * Usage:
 *   node scripts/ghl-sync-sweep.mjs --dry-run    # Preview matches
 *   node scripts/ghl-sync-sweep.mjs              # Apply reconciliation
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GHL_API_KEY || !GHL_LOCATION_ID) {
  console.error('Missing GHL_API_KEY or GHL_LOCATION_ID');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const dryRun = process.argv.includes('--dry-run');
const headers = {
  Authorization: `Bearer ${GHL_API_KEY}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
};

const stats = {
  ghl_total: 0,
  ghl_with_email: 0,
  profiles_matched: 0,
  profiles_linked: 0,
  profiles_already_linked: 0,
  campaign_matched: 0,
  campaign_linked: 0,
  unmatched: 0,
  errors: 0,
};

async function fetchAllGHLContacts() {
  const allContacts = [];
  let nextPageUrl = `${GHL_API_BASE}/contacts/?locationId=${GHL_LOCATION_ID}&limit=100`;

  while (nextPageUrl) {
    console.log(`  Fetching page... (${allContacts.length} so far)`);
    const response = await fetch(nextPageUrl, { method: 'GET', headers });

    if (!response.ok) {
      console.error(`  GHL API error: ${response.status} ${response.statusText}`);
      break;
    }

    const data = await response.json();
    allContacts.push(...(data.contacts || []));
    nextPageUrl = data.meta?.nextPageUrl || null;

    if (allContacts.length > 5000) {
      console.warn('  Hit 5000 contact safety limit');
      break;
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return allContacts;
}

async function reconcileProfiles(emailToGHL) {
  console.log('\n--- Public Profiles ---');

  const { data: profiles, error } = await supabase
    .from('public_profiles')
    .select('id, email, full_name, social_links')
    .not('email', 'is', null);

  if (error) {
    console.error('  Error fetching profiles:', error.message);
    return;
  }

  for (const profile of (profiles || [])) {
    const email = profile.email?.toLowerCase();
    if (!email || !emailToGHL[email]) continue;

    stats.profiles_matched++;
    const ghlContact = emailToGHL[email];
    const existingLinks = profile.social_links || {};

    if (existingLinks.ghl_contact_id) {
      stats.profiles_already_linked++;
      continue;
    }

    if (dryRun) {
      console.log(`  MATCH: ${profile.full_name} <${email}> → GHL ${ghlContact.id} [tags: ${(ghlContact.tags || []).join(', ')}]`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('public_profiles')
      .update({
        social_links: { ...existingLinks, ghl_contact_id: ghlContact.id },
      })
      .eq('id', profile.id);

    if (updateErr) {
      console.error(`  Error updating ${profile.full_name}:`, updateErr.message);
      stats.errors++;
    } else {
      stats.profiles_linked++;
      console.log(`  LINKED: ${profile.full_name} → GHL ${ghlContact.id}`);
    }
  }
}

async function reconcileCampaign(emailToGHL) {
  console.log('\n--- Campaign Alignment Entities ---');

  const { data: entities, error } = await supabase
    .from('campaign_alignment_entities')
    .select('id, email, ghl_contact_id, entity_name')
    .is('ghl_contact_id', null)
    .not('email', 'is', null);

  if (error) {
    console.error('  Error fetching entities:', error.message);
    return;
  }

  for (const entity of (entities || [])) {
    const email = entity.email?.toLowerCase();
    if (!email || !emailToGHL[email]) continue;

    stats.campaign_matched++;
    const ghlContact = emailToGHL[email];

    if (dryRun) {
      console.log(`  MATCH: ${entity.entity_name} <${email}> → GHL ${ghlContact.id}`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('campaign_alignment_entities')
      .update({ ghl_contact_id: ghlContact.id })
      .eq('id', entity.id);

    if (updateErr) {
      console.error(`  Error updating ${entity.entity_name}:`, updateErr.message);
      stats.errors++;
    } else {
      stats.campaign_linked++;
    }
  }
}

async function main() {
  console.log(`\nGHL Full Sync Sweep ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(50));

  // Step 1: Fetch all GHL contacts
  console.log('\n1. Fetching all GHL contacts...');
  const ghlContacts = await fetchAllGHLContacts();
  stats.ghl_total = ghlContacts.length;
  console.log(`  Found ${ghlContacts.length} contacts in GHL`);

  // Build email → GHL contact map
  const emailToGHL = {};
  for (const c of ghlContacts) {
    if (c.email) {
      emailToGHL[c.email.toLowerCase()] = c;
      stats.ghl_with_email++;
    }
  }
  console.log(`  ${stats.ghl_with_email} have email addresses`);

  // Step 2: Reconcile
  console.log('\n2. Reconciling Supabase tables...');
  await reconcileProfiles(emailToGHL);
  await reconcileCampaign(emailToGHL);

  // Step 3: Find unmatched GHL contacts (in GHL but not in any Supabase table)
  const { data: allEmails } = await supabase
    .from('public_profiles')
    .select('email')
    .not('email', 'is', null);
  const { data: campaignEmails } = await supabase
    .from('campaign_alignment_entities')
    .select('email')
    .not('email', 'is', null);

  const supabaseEmails = new Set([
    ...(allEmails || []).map(p => p.email?.toLowerCase()),
    ...(campaignEmails || []).map(e => e.email?.toLowerCase()),
  ].filter(Boolean));

  const unmatchedContacts = [];
  for (const [email, contact] of Object.entries(emailToGHL)) {
    if (!supabaseEmails.has(email)) {
      unmatchedContacts.push(contact);
      stats.unmatched++;
    }
  }

  if (unmatchedContacts.length > 0) {
    console.log(`\n--- Unmatched GHL Contacts (${unmatchedContacts.length}) ---`);
    for (const c of unmatchedContacts.slice(0, 20)) {
      console.log(`  ${c.contactName || c.firstName + ' ' + c.lastName} <${c.email}> [${(c.tags || []).join(', ')}]`);
    }
    if (unmatchedContacts.length > 20) {
      console.log(`  ... and ${unmatchedContacts.length - 20} more`);
    }
  }

  // Step 4: Tag distribution
  console.log('\n3. GHL Tag Distribution:');
  const tagCounts = {};
  for (const c of ghlContacts) {
    for (const tag of (c.tags || [])) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sortedTags.slice(0, 25)) {
    console.log(`  ${tag}: ${count}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`GHL contacts:           ${stats.ghl_total} (${stats.ghl_with_email} with email)`);
  console.log(`Profiles matched:       ${stats.profiles_matched} (already linked: ${stats.profiles_already_linked}, ${dryRun ? 'would link' : 'linked'}: ${dryRun ? stats.profiles_matched - stats.profiles_already_linked : stats.profiles_linked})`);
  console.log(`Campaign matched:       ${stats.campaign_matched} (${dryRun ? 'would link' : 'linked'}: ${dryRun ? stats.campaign_matched : stats.campaign_linked})`);
  console.log(`Unmatched in GHL:       ${stats.unmatched}`);
  if (stats.errors > 0) console.log(`Errors:                 ${stats.errors}`);
  console.log();
}

main().catch(console.error);
