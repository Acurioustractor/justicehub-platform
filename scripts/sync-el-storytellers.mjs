#!/usr/bin/env node
/**
 * Sync Empathy Ledger v2 Storytellers & Transcripts into JusticeHub Supabase
 *
 * Fetches storytellers and transcripts from EL v2 API and upserts them
 * into el_storytellers and el_transcripts tables.
 *
 * Usage:
 *   node scripts/sync-el-storytellers.mjs             # dry-run (no DB writes)
 *   node scripts/sync-el-storytellers.mjs --apply     # write to DB
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// --- Env loading (matches existing scripts) ---

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

// --- Config ---

const EL_BASE = 'https://www.empathyledger.com';
const EL_API_KEY = process.env.EMPATHY_LEDGER_V2_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');

if (!EL_API_KEY) {
  console.error('Missing EMPATHY_LEDGER_V2_KEY in environment');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- NQ location detection ---

const NQ_LOCATIONS = [
  'mount isa',
  'townsville',
  'palm island',
  'cairns',
  'thursday island',
];

function isNqRelevant(location) {
  if (!location) return false;
  const lower = location.toLowerCase();
  return NQ_LOCATIONS.some((nq) => lower.includes(nq));
}

// --- API helpers ---

async function fetchAllPages(endpoint) {
  const results = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const url = `${EL_BASE}${endpoint}?limit=${limit}&page=${page}`;
    console.log(`  Fetching ${url}`);

    const res = await fetch(url, {
      headers: { 'X-API-Key': EL_API_KEY },
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();
    const data = json.data || [];
    results.push(...data);

    // Stop if we got fewer than limit (last page)
    if (data.length < limit) break;
    page++;
  }

  return results;
}

// --- Sync logic ---

async function syncStorytellers(storytellers) {
  const rows = storytellers.map((s) => ({
    id: s.id,
    display_name: s.displayName,
    bio: s.bio || null,
    avatar_url: s.avatarUrl || null,
    cultural_background: s.culturalBackground || [],
    location: s.location || null,
    role: s.role || null,
    is_elder: s.isElder || false,
    is_active: s.isActive !== false,
    story_count: s.storyCount || 0,
    el_created_at: s.createdAt || null,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  if (!APPLY) {
    console.log(`  [dry-run] Would upsert ${rows.length} storytellers`);
    return rows.length;
  }

  const { data, error } = await supabase
    .from('el_storytellers')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('  Error upserting storytellers:', error.message);
    throw error;
  }

  return rows.length;
}

async function syncTranscripts(transcripts, storytellerMap) {
  const rows = transcripts.map((t) => {
    const storytellerId = t.storyteller?.id || null;
    const storytellerLocation = storytellerId
      ? storytellerMap.get(storytellerId)?.location || null
      : null;
    const location = storytellerLocation;
    const nqRelevant = isNqRelevant(location);

    return {
      id: t.id,
      title: t.title || null,
      content: t.content || null,
      status: t.status || null,
      word_count: t.wordCount || null,
      project_id: t.projectId || null,
      has_video: t.hasVideo || false,
      video_url: t.videoUrl || null,
      video_platform: t.videoPlatform || null,
      video_thumbnail: t.videoThumbnail || null,
      storyteller_id: storytellerId,
      storyteller_name: t.storyteller?.displayName || null,
      el_created_at: t.createdAt || null,
      el_updated_at: t.updatedAt || null,
      synced_at: new Date().toISOString(),
      location: location,
      is_nq_relevant: nqRelevant,
    };
  });

  const nqCount = rows.filter((r) => r.is_nq_relevant).length;

  if (!APPLY) {
    console.log(`  [dry-run] Would upsert ${rows.length} transcripts (${nqCount} NQ-relevant)`);
    return { total: rows.length, nq: nqCount };
  }

  const { data, error } = await supabase
    .from('el_transcripts')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('  Error upserting transcripts:', error.message);
    throw error;
  }

  return { total: rows.length, nq: nqCount };
}

// --- Main ---

async function main() {
  console.log(`\n🎙️  EL Storyteller & Transcript Sync`);
  console.log(`    Mode: ${APPLY ? 'APPLY (writing to DB)' : 'DRY-RUN (no writes)'}`);
  console.log('');

  // 1. Fetch storytellers
  console.log('📥 Fetching storytellers from EL v2...');
  const storytellers = await fetchAllPages('/api/v2/storytellers');
  console.log(`  Found ${storytellers.length} storytellers`);

  // Build lookup map
  const storytellerMap = new Map();
  for (const s of storytellers) {
    storytellerMap.set(s.id, s);
  }

  // 2. Fetch transcripts
  console.log('📥 Fetching transcripts from EL v2...');
  const transcripts = await fetchAllPages('/api/v2/transcripts');
  console.log(`  Found ${transcripts.length} transcripts`);

  // 3. Sync storytellers first (transcripts have FK)
  console.log('\n📤 Syncing storytellers...');
  const storytellerCount = await syncStorytellers(storytellers);

  // 4. Sync transcripts
  console.log('📤 Syncing transcripts...');
  const { total: transcriptCount, nq: nqCount } = await syncTranscripts(
    transcripts,
    storytellerMap
  );

  // 5. Summary
  console.log('\n✅ Sync complete!');
  console.log(`  Storytellers: ${storytellerCount}`);
  console.log(`  Transcripts:  ${transcriptCount}`);
  console.log(`  NQ-relevant:  ${nqCount}`);

  if (!APPLY) {
    console.log('\n⚠️  This was a dry run. Pass --apply to write to DB.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
