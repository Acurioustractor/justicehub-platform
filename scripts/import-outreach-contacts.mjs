#!/usr/bin/env node
/**
 * Import Outreach Contacts — CONTAINED Campaign
 *
 * Pulls warm contacts from ghl_contacts (tagged "container request"),
 * cross-references with gs_entities for funding history,
 * scores them, and upserts into campaign_alignment_entities.
 *
 * Usage:
 *   node scripts/import-outreach-contacts.mjs           # full run
 *   node scripts/import-outreach-contacts.mjs --dry-run  # preview only
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

const DRY_RUN = process.argv.includes('--dry-run');

// GHL API helpers (for tag sync)
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_KEY = env.GHL_API_KEY;
const GHL_LOCATION_ID = env.GHL_LOCATION_ID;
const ghlHeaders = {
  Authorization: `Bearer ${GHL_API_KEY}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
};

async function addGhlTags(contactId, tags) {
  if (!GHL_API_KEY || DRY_RUN) return;
  try {
    await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: ghlHeaders,
      body: JSON.stringify({ tags }),
    });
  } catch (e) {
    console.warn(`  GHL tag sync failed for ${contactId}: ${e.message}`);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Map GHL tags to outreach status
// Valid: pending, draft_ready, approved, sent, responded, converted, declined
function deriveOutreachStatus(tags) {
  const t = tags.map(t => t.toLowerCase());
  if (t.includes('container - scheduled')) return 'responded';
  if (t.includes('container - contacted')) return 'sent';
  return 'pending';
}

// Org type scoring for reach_influence
const ORG_TYPE_SCORES = {
  government: 70,
  foundation: 70,
  university: 60,
  community: 50,
  individual: 30,
};

function classifyOrgType(companyName, email) {
  if (!companyName && !email) return 'individual';
  const combined = `${companyName || ''} ${email || ''}`.toLowerCase();
  if (combined.includes('gov.au') || combined.includes('government')) return 'government';
  if (combined.includes('foundation') || combined.includes('minderoo') || combined.includes('philanthrop')) return 'foundation';
  if (combined.includes('edu.au') || combined.includes('university') || combined.includes('sydney.edu')) return 'university';
  if (combined.includes('.org') || combined.includes('initiative') || combined.includes('network') || combined.includes('pathway')) return 'community';
  return 'individual';
}

async function main() {
  console.log(`\n=== Import Outreach Contacts → campaign_alignment_entities ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  // 1. Pull warm contacts from ghl_contacts
  console.log('1. Fetching container request contacts from ghl_contacts...');
  const { data: ghlContacts, error: ghlErr } = await supabase
    .from('ghl_contacts')
    .select('*')
    .contains('tags', ['container request']);

  if (ghlErr) throw new Error(`GHL contacts fetch: ${ghlErr.message}`);
  console.log(`   Found ${ghlContacts.length} contacts with "container request" tag`);

  // 2. Build org name lookup for gs_entities cross-reference
  console.log('\n2. Cross-referencing with gs_entities...');
  const orgNames = ghlContacts
    .map(c => c.company_name)
    .filter(Boolean)
    .map(n => n.toLowerCase().replace(/\.com|\.org|\.au|\.net/g, '').trim());

  // Fetch gs_entities that might match
  const { data: gsEntities } = await supabase
    .from('gs_entities')
    .select('id, canonical_name, abn, state, entity_type')
    .limit(1000);

  const gsLookup = new Map();
  for (const gs of (gsEntities || [])) {
    if (gs.canonical_name) {
      gsLookup.set(gs.canonical_name.toLowerCase(), gs);
    }
  }

  // 3. Check for existing campaign_alignment_entities by email
  console.log('\n3. Checking existing campaign_alignment_entities...');
  const emails = ghlContacts.map(c => c.email).filter(Boolean);
  const { data: existingEntities } = await supabase
    .from('campaign_alignment_entities')
    .select('id, email, name')
    .in('email', emails);
  const existingByEmail = new Map((existingEntities || []).map(e => [e.email, e]));
  console.log(`   ${existingByEmail.size} already exist in campaign_alignment_entities`);

  // 4. Build entities
  console.log('\n4. Scoring and building entities...');
  const entities = [];
  const ghlTagUpdates = [];

  for (const contact of ghlContacts) {
    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
    const email = contact.email;
    const orgType = classifyOrgType(contact.company_name, email);
    const tags = contact.tags || [];

    // Skip placeholder emails
    const isPlaceholder = email?.includes('@placeholder.contained');

    // Scoring
    const justiceAlignmentScore = 80; // all expressed direct interest
    const reachInfluenceScore = ORG_TYPE_SCORES[orgType] || 30;

    let accessibilityScore = 0;
    if (email && !isPlaceholder) accessibilityScore += 70;
    if (contact.phone) accessibilityScore += 15;
    if (deriveOutreachStatus(tags) === 'sent' || deriveOutreachStatus(tags) === 'meeting_scheduled') {
      accessibilityScore += 15; // warm message already sent
    }
    accessibilityScore = Math.min(100, accessibilityScore);

    const compositeScore = Math.round(
      justiceAlignmentScore * 0.4 + reachInfluenceScore * 0.3 + accessibilityScore * 0.3
    );

    // GS entity cross-reference
    const companyKey = (contact.company_name || '').toLowerCase().replace(/\.com|\.org|\.au|\.net/g, '').trim();
    const gsMatch = companyKey ? gsLookup.get(companyKey) : null;

    const warmPaths = [{
      via: 'website_form',
      date: '2025',
      message: 'Expressed interest in CONTAINED via container request form',
    }];

    const alignmentSignals = [
      { type: 'direct_interest', detail: 'Submitted container request (2025)' },
    ];
    if (gsMatch) {
      alignmentSignals.push({ type: 'gs_entity', detail: `Linked to ${gsMatch.canonical_name} (ABN: ${gsMatch.abn})` });
    }
    if (orgType === 'government') alignmentSignals.push({ type: 'sector', detail: 'Government sector' });
    if (orgType === 'foundation') alignmentSignals.push({ type: 'sector', detail: 'Foundation/philanthropy' });

    const entity = {
      entity_type: 'person',
      name,
      email: isPlaceholder ? null : email,
      organization: contact.company_name || null,
      organization_name: contact.company_name || null,
      position: null,
      acnc_abn: gsMatch?.abn || null,
      justice_alignment_score: justiceAlignmentScore,
      reach_influence_score: reachInfluenceScore,
      accessibility_score: accessibilityScore,
      composite_score: compositeScore,
      alignment_category: 'ally',
      campaign_list: 'warm_intros',
      alignment_signals: alignmentSignals,
      warm_paths: warmPaths,
      funding_history: [],
      outreach_status: deriveOutreachStatus(tags),
      ghl_contact_id: contact.id,
      score_confidence: 'high',
      last_scored_at: new Date().toISOString(),
    };

    entities.push(entity);

    // Queue GHL tag updates
    ghlTagUpdates.push({
      ghlId: contact.id,
      tags: ['CONTAINED_2025_INTEREST', 'CONTAINED_LAUNCH'],
    });

    const statusEmoji = entity.outreach_status === 'sent' ? '✉' :
      entity.outreach_status === 'meeting_scheduled' ? '📅' : '⏳';
    console.log(`   ${statusEmoji} ${name.padEnd(25)} | ${orgType.padEnd(12)} | score: ${compositeScore} | ${entity.outreach_status}`);
  }

  // 5. Upsert to campaign_alignment_entities
  console.log(`\n5. Upserting ${entities.length} entities...`);
  if (!DRY_RUN) {
    let upserted = 0;
    let updated = 0;

    for (const entity of entities) {
      // Check if already exists by ghl_contact_id or email
      const existing = existingByEmail.get(entity.email);

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('campaign_alignment_entities')
          .update({
            ...entity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) {
          console.warn(`   UPDATE failed for ${entity.name}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('campaign_alignment_entities')
          .insert(entity);
        if (error) {
          console.warn(`   INSERT failed for ${entity.name}: ${error.message}`);
        } else {
          upserted++;
        }
      }
    }
    console.log(`   Inserted: ${upserted}, Updated: ${updated}`);
  } else {
    console.log('   [DRY RUN] Would upsert', entities.length, 'entities');
  }

  // 6. Sync GHL tags
  console.log(`\n6. Syncing GHL tags...`);
  if (!DRY_RUN && GHL_API_KEY) {
    let taggedCount = 0;
    for (const update of ghlTagUpdates) {
      await addGhlTags(update.ghlId, update.tags);
      taggedCount++;
      await sleep(300); // rate limit
    }
    console.log(`   Tagged ${taggedCount} GHL contacts`);
  } else {
    console.log(`   [${DRY_RUN ? 'DRY RUN' : 'NO GHL KEY'}] Would tag ${ghlTagUpdates.length} contacts`);
  }

  // 7. Summary
  console.log('\n=== Summary ===');
  const byStatus = {};
  const byOrgType = {};
  for (const e of entities) {
    byStatus[e.outreach_status] = (byStatus[e.outreach_status] || 0) + 1;
    const ot = classifyOrgType(e.organization, e.email);
    byOrgType[ot] = (byOrgType[ot] || 0) + 1;
  }
  console.log(`Total: ${entities.length} warm contacts`);
  console.log(`By status:`, JSON.stringify(byStatus));
  console.log(`By org type:`, JSON.stringify(byOrgType));
  console.log(`Avg composite score: ${Math.round(entities.reduce((s, e) => s + e.composite_score, 0) / entities.length)}`);

  const top5 = [...entities].sort((a, b) => b.composite_score - a.composite_score).slice(0, 5);
  console.log('\nTop 5 by composite score:');
  for (const e of top5) {
    console.log(`  ${e.composite_score} | ${e.name.padEnd(25)} | ${e.organization || '(individual)'}`);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
