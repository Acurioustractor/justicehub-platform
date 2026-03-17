#!/usr/bin/env node
/**
 * Backfill metadata on EL media_assets for JusticeHub photos.
 *
 * What it does:
 *   1. Sets project_code='justicehub' on all assets with storage_path LIKE 'justicehub/%'
 *   2. Populates title from filename (humanized) where title is null
 *   3. Links collection_id to matching gallery UUID (by slug 'justicehub-{category}')
 *   4. For org gallery photos (storage_path LIKE 'galleries/{uuid}/'), ensures collection_id is set
 *
 * Usage:
 *   node scripts/fix-el-media-metadata.mjs --dry-run
 *   node scripts/fix-el-media-metadata.mjs
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const EL_URL = process.env.EMPATHY_LEDGER_URL;
const EL_KEY = process.env.EMPATHY_LEDGER_SERVICE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!EL_URL || !EL_KEY) {
  console.error('Missing EMPATHY_LEDGER_URL or EMPATHY_LEDGER_SERVICE_KEY');
  process.exit(1);
}

const el = createClient(EL_URL, EL_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function humanizeFilename(filename) {
  return filename
    .replace(/\.\w+$/, '')           // strip extension
    .replace(/[-_]+/g, ' ')          // replace dashes/underscores with spaces
    .replace(/\b[a-f0-9]{8,}\b/g, '') // strip hash suffixes
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase()); // title case
}

async function main() {
  console.log(`=== Fix EL Media Metadata (${DRY_RUN ? 'DRY RUN' : 'LIVE'}) ===\n`);

  // 1. Load all JH galleries (slug like 'justicehub-%') to build category→gallery ID map
  const { data: galleries, error: galErr } = await el
    .from('galleries')
    .select('id, slug, title')
    .like('slug', 'justicehub-%');

  if (galErr) {
    console.error('Failed to load galleries:', galErr.message);
    return;
  }

  const categoryToGalleryId = {};
  for (const g of galleries || []) {
    const category = g.slug.replace('justicehub-', '');
    categoryToGalleryId[category] = g.id;
    console.log(`  Gallery: ${g.slug} → ${g.id}`);
  }
  console.log(`\nLoaded ${Object.keys(categoryToGalleryId).length} JH galleries\n`);

  // 2. Fix JH photos (storage_path LIKE 'justicehub/%')
  const { data: jhPhotos, error: jhErr } = await el
    .from('media_assets')
    .select('id, storage_path, filename, display_name, title, project_code, collection_id')
    .like('storage_path', 'justicehub/%');

  if (jhErr) {
    console.error('Failed to load JH photos:', jhErr.message);
    return;
  }

  console.log(`Found ${jhPhotos.length} JH photos in media_assets\n`);

  let updated = 0, skipped = 0, failed = 0;

  for (const photo of jhPhotos) {
    const pathParts = photo.storage_path.split('/');
    const category = pathParts.length >= 2 ? pathParts[1] : null;
    const galleryId = category ? categoryToGalleryId[category] : null;
    const filename = photo.filename || photo.display_name || pathParts[pathParts.length - 1] || '';

    const updates = {};

    // Set project_code if missing
    if (!photo.project_code) {
      updates.project_code = 'justicehub';
    }

    // Set title if missing
    if (!photo.title && filename) {
      updates.title = humanizeFilename(filename);
    }

    // Set collection_id if missing and we have a gallery match
    if (!photo.collection_id && galleryId) {
      updates.collection_id = galleryId;
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      if (updated < 5) {
        console.log(`  [dry-run] ${photo.id}: ${JSON.stringify(updates)}`);
      }
      updated++;
      continue;
    }

    const { error: upErr } = await el
      .from('media_assets')
      .update(updates)
      .eq('id', photo.id);

    if (upErr) {
      if (failed < 3) console.error(`  Failed ${photo.id}: ${upErr.message}`);
      failed++;
    } else {
      updated++;
    }
  }

  console.log(`\nJH photos: ${updated} updated, ${skipped} already OK, ${failed} failed`);

  // 3. Fix org gallery photos (storage_path LIKE 'galleries/%')
  const { data: galPhotos, error: galPhotoErr } = await el
    .from('media_assets')
    .select('id, storage_path, collection_id')
    .like('storage_path', 'galleries/%')
    .is('collection_id', null);

  if (galPhotoErr) {
    console.error('Failed to load gallery photos:', galPhotoErr.message);
    return;
  }

  console.log(`\nFound ${(galPhotos || []).length} org gallery photos missing collection_id`);

  let galUpdated = 0, galFailed = 0;

  for (const photo of galPhotos || []) {
    // Extract gallery UUID from path: galleries/{uuid}/filename.jpg
    const match = photo.storage_path.match(/^galleries\/([a-f0-9-]{36})\//);
    if (!match) continue;

    const galleryUuid = match[1];

    if (DRY_RUN) {
      if (galUpdated < 3) {
        console.log(`  [dry-run] ${photo.id}: collection_id → ${galleryUuid}`);
      }
      galUpdated++;
      continue;
    }

    const { error: upErr } = await el
      .from('media_assets')
      .update({ collection_id: galleryUuid })
      .eq('id', photo.id);

    if (upErr) {
      if (galFailed < 3) console.error(`  Failed ${photo.id}: ${upErr.message}`);
      galFailed++;
    } else {
      galUpdated++;
    }
  }

  console.log(`Org gallery photos: ${galUpdated} updated, ${galFailed} failed`);
  console.log(`\n=== Done ===`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
