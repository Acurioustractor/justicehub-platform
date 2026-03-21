#!/usr/bin/env node
/**
 * Sync Campaign Allies to GoHighLevel
 *
 * Syncs high-scoring allies with emails to GHL as contacts.
 * Tags: CONTAINED_LAUNCH, JusticeHub Newsletter, Ally
 * High engagement (passion_score > 70) gets additional tag.
 *
 * Usage:
 *   node scripts/sync-allies-to-ghl.mjs
 *   node scripts/sync-allies-to-ghl.mjs --dry-run
 *   node scripts/sync-allies-to-ghl.mjs --min-score 60
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .forEach(l => {
        const eqIdx = l.indexOf('=');
        const key = l.slice(0, eqIdx).trim();
        const val = l.slice(eqIdx + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}
const env = loadEnv();

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_KEY = env.GHL_API_KEY;
const GHL_LOCATION_ID = env.GHL_LOCATION_ID;

const DRY_RUN = process.argv.includes('--dry-run');
const MIN_SCORE = (() => {
  const idx = process.argv.indexOf('--min-score');
  return idx !== -1 ? parseInt(process.argv[idx + 1]) : 40;
})();

const ghlHeaders = {
  Authorization: `Bearer ${GHL_API_KEY}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
};

async function findGHLContact(email) {
  const res = await fetch(
    `${GHL_API_BASE}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
    { method: 'GET', headers: ghlHeaders }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.contact?.id || null;
}

async function createGHLContact(contact) {
  const res = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: 'POST',
    headers: ghlHeaders,
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      email: contact.email,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      tags: contact.tags,
      source: 'JusticeHub Campaign Engine',
      customFields: [
        { key: 'organization', field_value: contact.organization || '' },
        { key: 'campaign_list', field_value: contact.campaignList || '' },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.contact?.id || null;
}

async function addGHLTags(contactId, tags) {
  await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
    method: 'POST',
    headers: ghlHeaders,
    body: JSON.stringify({ tags }),
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== GHL Newsletter Sync ===\n');
  if (DRY_RUN) console.log('** DRY RUN — no GHL writes **\n');

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.log('GHL not configured (GHL_API_KEY / GHL_LOCATION_ID missing)');
    if (!DRY_RUN) { process.exit(1); }
    console.log('Continuing in dry-run mode...\n');
  }

  // Fetch allies with email, no ghl_contact_id, composite_score > threshold
  const PAGE = 500;
  let offset = 0;
  let allEntities = [];
  while (true) {
    const { data, error } = await supabase
      .from('campaign_alignment_entities')
      .select('id, name, email, organization, position, composite_score, passion_score, campaign_list, alignment_category')
      .not('email', 'is', null)
      .is('ghl_contact_id', null)
      .gte('composite_score', MIN_SCORE)
      .in('alignment_category', ['ally', 'potential_ally'])
      .order('composite_score', { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`Fetch error: ${error.message}`);
    if (!data || data.length === 0) break;
    allEntities.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`Found ${allEntities.length} allies with email, no GHL link, score >= ${MIN_SCORE}\n`);

  const stats = { synced: 0, skipped: 0, errors: 0, highEngagement: 0 };

  for (let i = 0; i < allEntities.length; i++) {
    const entity = allEntities[i];
    const nameParts = (entity.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const tags = ['CONTAINED Launch 2026', 'JusticeHub Newsletter', 'Ally'];
    if ((entity.passion_score || 0) > 70) {
      tags.push('High Engagement');
      stats.highEngagement++;
    }

    if (DRY_RUN) {
      console.log(`  [DRY] ${entity.name} (${entity.email}) — score: ${entity.composite_score}, passion: ${entity.passion_score || 0}, tags: ${tags.join(', ')}`);
      stats.synced++;
      continue;
    }

    try {
      // Check if already in GHL
      let contactId = await findGHLContact(entity.email);

      if (contactId) {
        // Just add tags
        await addGHLTags(contactId, tags);
      } else {
        // Create new
        contactId = await createGHLContact({
          email: entity.email,
          firstName,
          lastName,
          organization: entity.organization,
          tags,
          campaignList: entity.campaign_list,
        });
      }

      if (contactId) {
        // Update entity with GHL contact ID
        await supabase
          .from('campaign_alignment_entities')
          .update({
            ghl_contact_id: contactId,
            outreach_status: 'sent',
          })
          .eq('id', entity.id);
        stats.synced++;
      } else {
        stats.errors++;
      }

      // Rate limit: 300ms between requests
      if (i < allEntities.length - 1) await sleep(300);

      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i + 1}/${allEntities.length} (${stats.synced} synced, ${stats.errors} errors)`);
      }
    } catch (err) {
      console.warn(`  Error syncing ${entity.name}: ${err.message}`);
      stats.errors++;
    }
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`Synced: ${stats.synced}`);
  console.log(`High engagement: ${stats.highEngagement}`);
  console.log(`Errors: ${stats.errors}`);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
