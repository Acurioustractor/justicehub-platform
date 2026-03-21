#!/usr/bin/env node
/**
 * Register uploaded photos in EL's media_assets table and create category galleries.
 * Photos are already in EL storage (gallery-photos/justicehub/{category}/), just need DB entries.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const EL_URL = process.env.EMPATHY_LEDGER_URL;
const EL_KEY = process.env.EMPATHY_LEDGER_SERVICE_KEY;
const JH_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const JH_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const EL_ADMIN_USER = 'e69ff35e-f736-4867-8d2e-c9d1101cd051';
const EL_TENANT_ID = '96197009-c7bb-4408-89de-cd04085cdf44';
const EL_UPLOADER_USER = 'd0a162d2-282e-4653-9d12-aa934c9dfa4e';

const el = createClient(EL_URL, EL_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const jh = createClient(JH_URL, JH_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const CATEGORIES = {
  hero: { title: 'JusticeHub — Hero & Campaign-Ready', description: 'Best photos for email banners, social headers, website heroes' },
  people: { title: 'JusticeHub — People & Portraits', description: 'Changemakers, community leaders, youth' },
  places: { title: 'JusticeHub — Places & Country', description: 'On-country landscapes, facilities, campsite' },
  programs: { title: 'JusticeHub — Programs in Action', description: 'BG-FIT, DeadlyLabs, Confit, Bimberi, community programs' },
  spain: { title: 'JusticeHub — Spain / Diagrama', description: 'Diagrama Foundation, Spanish youth justice model' },
  community: { title: 'JusticeHub — Community & Indigenous', description: 'Relationship-based justice, cultural programs' },
  data: { title: 'JusticeHub — Data & Analysis', description: 'Funding charts, parliamentary submissions, analysis graphics' },
  contained: { title: 'JusticeHub — CONTAINED Campaign', description: 'Campaign-specific assets (illustrations, posters, data viz)' },
  goods: { title: 'JusticeHub — Products & Goods', description: 'Community products, Stretch Bed, merchandise' },
};

async function main() {
  console.log(`=== Link EL Gallery Photos (${DRY_RUN ? 'DRY RUN' : 'LIVE'}) ===\n`);

  // 1. Get all JH media_assets (our photo catalog)
  const { data: jhPhotos, error: jhErr } = await jh
    .from('media_assets')
    .select('id, filename, category, tags, metadata, mime_type, file_size')
    .eq('uploaded_by', 'import-photos-to-el')
    .order('category')
    .order('filename');

  if (jhErr) { console.error('JH query error:', jhErr.message); return; }
  console.log(`Found ${jhPhotos.length} photos in JH catalog\n`);

  // 2. Check which are already in EL media_assets
  const { data: existing } = await el
    .from('media_assets')
    .select('storage_path')
    .like('storage_path', 'justicehub/%');
  const existingPaths = new Set((existing || []).map(r => r.storage_path));
  console.log(`Already in EL media_assets: ${existingPaths.size}\n`);

  // 3. Create galleries per category
  const galleryIds = {};
  for (const [cat, meta] of Object.entries(CATEGORIES)) {
    const photosInCat = jhPhotos.filter(p => p.category === cat);
    if (photosInCat.length === 0) continue;

    const slug = `justicehub-${cat}`;

    // Check if gallery exists
    const { data: existingGal } = await el
      .from('galleries')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (existingGal && existingGal.length > 0) {
      galleryIds[cat] = existingGal[0].id;
      console.log(`  Gallery exists: ${meta.title} (${existingGal[0].id})`);
    } else if (!DRY_RUN) {
      const { data: newGal, error: galErr } = await el
        .from('galleries')
        .insert({
          title: meta.title,
          slug,
          description: meta.description,
          visibility: 'public',
          status: 'active',
          is_public: true,
          photo_count: photosInCat.length,
          created_by: EL_ADMIN_USER,
        })
        .select('id')
        .single();

      if (galErr) {
        console.error(`  Gallery create failed for ${cat}: ${galErr.message}`);
      } else {
        galleryIds[cat] = newGal.id;
        console.log(`  Created gallery: ${meta.title} (${newGal.id})`);
      }
    } else {
      console.log(`  Would create gallery: ${meta.title} (${photosInCat.length} photos)`);
    }
  }

  // 4. Register photos in EL media_assets
  console.log('\nRegistering photos in EL media_assets...');
  let inserted = 0, skipped = 0, failed = 0;

  for (let i = 0; i < jhPhotos.length; i++) {
    const photo = jhPhotos[i];
    const storagePath = `justicehub/${photo.category}/${photo.filename}`;

    if (existingPaths.has(storagePath)) {
      skipped++;
      continue;
    }

    // Build CDN URL
    const cdnUrl = `${EL_URL}/storage/v1/object/public/gallery-photos/${storagePath}`;

    const record = {
      original_filename: photo.filename,
      display_name: photo.metadata?.title || photo.filename,
      file_size: photo.file_size,
      file_type: photo.mime_type,
      storage_bucket: 'media', // NOTE: files are in 'gallery-photos' bucket but check constraint only allows 'media'. cdn_url has the correct full path.
      storage_path: storagePath,
      cdn_url: cdnUrl,
      privacy_level: 'public',
      uploaded_by: EL_UPLOADER_USER,
      uploader_id: EL_UPLOADER_USER,
      tenant_id: EL_TENANT_ID,
      visibility: 'public',
      status: 'active',
      filename: photo.filename,
      mime_type: photo.mime_type,
      cultural_sensitivity: 'none',
    };

    if (DRY_RUN) {
      if (i < 3) console.log(`  [dry-run] Would insert: ${photo.filename} → ${photo.category}`);
      inserted++;
      continue;
    }

    const { error: insErr } = await el.from('media_assets').insert(record);
    if (insErr) {
      if (i < 5) console.log(`  Failed: ${photo.filename}: ${insErr.message}`);
      failed++;
    } else {
      inserted++;
    }

    if ((i + 1) % 20 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${jhPhotos.length} (${inserted} inserted, ${failed} failed)`);
    }
  }

  console.log(`\n\n=== Complete ===`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Galleries created: ${Object.keys(galleryIds).length}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
