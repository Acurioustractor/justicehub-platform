#!/usr/bin/env node
/**
 * Import local photos into Empathy Ledger + JusticeHub media_assets catalog.
 *
 * Usage:
 *   node scripts/import-photos-to-el.mjs --dry-run     # Preview what would happen
 *   node scripts/import-photos-to-el.mjs               # Actually import
 *   node scripts/import-photos-to-el.mjs --category hero  # Import only one category
 *
 * What it does:
 *   1. Scans public/images/ for all photos
 *   2. Uploads each to EL gallery-photos bucket (gets CDN URL)
 *   3. Inserts into JH media_assets table (catalog with tags, CDN URL, local path)
 *   4. Idempotent — skips files already in media_assets (matched by filename)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// --- Config ---
const JH_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const JH_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EL_URL = process.env.EMPATHY_LEDGER_URL;
const EL_SERVICE_KEY = process.env.EMPATHY_LEDGER_SERVICE_KEY;

if (!JH_URL || !JH_SERVICE_KEY) {
  console.error('Missing JH Supabase env vars');
  process.exit(1);
}

const jhClient = createClient(JH_URL, JH_SERVICE_KEY);
const elClient = EL_URL && EL_SERVICE_KEY
  ? createClient(EL_URL, EL_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const DRY_RUN = process.argv.includes('--dry-run');
const CATEGORY_FILTER = (() => {
  const idx = process.argv.indexOf('--category');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'images');
const EL_BUCKET = 'gallery-photos';

// --- Photo catalog ---
// Maps local paths to metadata. Built from the gallery HTML structure.
const PHOTO_CATALOG = [];

// Category definitions with auto-detection rules
const CATEGORIES = {
  hero: {
    label: 'Hero & Campaign-Ready',
    description: 'Best for email banners, social headers, website heroes',
    detect: (p) => [
      'orgs/oonchiumpa/hero.jpg',
      'orgs/oonchiumpa/homestead.jpg',
      'orgs/oonchiumpa/mentoring.jpg',
      'orgs/bg-fit/hero.jpg',
      'orgs/bg-fit/brodie.jpg',
      'the-courage-to-connect',
    ].some(f => p.includes(f)),
  },
  people: {
    label: 'People & Portraits',
    description: 'Changemakers, community leaders, youth',
    detect: (p) => [
      'team/', 'spotlight-on-changemaker', 'heros-journey', 'richard-cassidy',
      'joe-kwon', 'hamilton', 'law-students',
    ].some(f => p.includes(f)),
  },
  places: {
    label: 'Places & Country',
    description: 'On-country landscapes, facilities, campsite',
    detect: (p) => [
      'atnarpa/', 'campsite/', 'originals/', 'video-posters/',
    ].some(f => p.includes(f)),
  },
  programs: {
    label: 'Programs in Action',
    description: 'BG-FIT, DeadlyLabs, Confit, Bimberi, community programs',
    detect: (p) => [
      'from-trouble-to-transformation', 'deadlylabs', 'confit-pathways',
      'resoleution', 'bg-fit/activity', 'bg-fit/gallery',
      'campfire-journey', 'creating-spaces', 'walking-new-paths',
      'community-at-the-core',
    ].some(f => p.includes(f)),
  },
  spain: {
    label: 'Spain / Diagrama',
    description: 'Diagrama Foundation, Spanish youth justice model',
    detect: (p) => [
      'diagrama', 'spain', 'beyond-walls', 'punishment-to-potential',
      'nature-of-power', 'control-to-care', 'comparative-analysis',
      'youth-detention-and-youth-justice-models-in-europe',
    ].some(f => p.includes(f)),
  },
  community: {
    label: 'Community & Indigenous',
    description: 'Relationship-based justice, cultural programs',
    detect: (p) => [
      'beyond-cases-and-problems', 'beyond-systems', 'navigating-two-worlds',
      'breaking-bread', 'connecting-communities',
    ].some(f => p.includes(f)),
  },
  data: {
    label: 'Data & Analysis',
    description: 'Funding charts, parliamentary submissions, analysis graphics',
    detect: (p) => [
      'queensland-government-spending', 'rethinking-youth-justice-funding',
      'inquiry-into', 'necessity-of-state', 'road-to-hell', 'paradox-of-youth',
      'gold-standard', 'beyond-shadows',
    ].some(f => p.includes(f)),
  },
  contained: {
    label: 'CONTAINED Campaign',
    description: 'Campaign-specific assets (illustrations, posters, data viz)',
    detect: (p) => p.includes('contained/'),
  },
  goods: {
    label: 'Products & Goods',
    description: 'Community products, Stretch Bed, merchandise',
    detect: (p) => p.includes('goods/'),
  },
};

// AI photos that must be flagged
const AI_PHOTOS_TO_REPLACE = [
  'bespoke-two-realities.png',
  'hero-container-landscape.png',
  'bespoke-story-container.png',
];

function detectCategory(relativePath) {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.detect(relativePath)) return key;
  }
  // Fallback based on directory
  if (relativePath.startsWith('articles/')) return 'articles';
  if (relativePath.startsWith('orgs/')) return 'orgs';
  return 'uncategorized';
}

function getMimeType(ext) {
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

function buildTitle(relativePath) {
  // Extract meaningful name from path
  const basename = path.basename(relativePath, path.extname(relativePath));
  return basename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\d{8,}/g, '') // strip long numeric prefixes
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ')
    .trim() || basename;
}

async function scanPhotos() {
  const photos = [];

  function walk(dir, base = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
        const stats = fs.statSync(fullPath);
        const category = detectCategory(relPath);
        const isAI = AI_PHOTOS_TO_REPLACE.some(f => entry.name === f);

        photos.push({
          localPath: fullPath,
          relativePath: relPath,
          webPath: `/images/${relPath}`,
          filename: entry.name,
          fileSize: stats.size,
          mimeType: getMimeType(path.extname(entry.name)),
          category,
          title: buildTitle(relPath),
          isAI,
          tags: [
            category,
            ...(isAI ? ['ai-generated', 'replace'] : ['real-photo']),
            ...(relPath.includes('orgs/oonchiumpa') ? ['oonchiumpa', 'indigenous'] : []),
            ...(relPath.includes('orgs/bg-fit') ? ['bg-fit'] : []),
          ],
        });
      }
    }
  }

  walk(PUBLIC_DIR);
  return photos;
}

async function getExistingAssets() {
  const { data, error } = await jhClient
    .from('media_assets')
    .select('filename')
    .eq('uploaded_by', 'import-photos-to-el');

  if (error) {
    console.error('Error fetching existing assets:', error.message);
    return new Set();
  }
  return new Set((data || []).map(r => r.filename));
}

async function uploadToEL(photo) {
  if (!elClient) return null;

  const fileData = fs.readFileSync(photo.localPath);
  const storagePath = `justicehub/${photo.category}/${photo.filename}`;

  const { data, error } = await elClient.storage
    .from(EL_BUCKET)
    .upload(storagePath, fileData, {
      contentType: photo.mimeType,
      upsert: true,
    });

  if (error) {
    // If bucket doesn't exist, log and return null
    console.warn(`  EL upload failed for ${photo.filename}: ${error.message}`);
    return null;
  }

  // Get public URL
  const { data: urlData } = elClient.storage.from(EL_BUCKET).getPublicUrl(storagePath);
  return urlData?.publicUrl || null;
}

async function insertToJH(photo, cdnUrl) {
  const { error } = await jhClient.from('media_assets').insert({
    filename: photo.filename,
    file_path: photo.webPath,
    file_size: photo.fileSize,
    mime_type: photo.mimeType,
    category: photo.category,
    tags: photo.tags,
    uploaded_by: 'import-photos-to-el',
    metadata: {
      title: photo.title,
      relative_path: photo.relativePath,
      cdn_url: cdnUrl,
      is_ai_generated: photo.isAI,
      privacy_level: 'public',
      campaign_status: photo.isAI ? 'flagged-replace' : 'available',
      source: photo.relativePath.startsWith('articles/') ? 'alma-articles'
        : photo.relativePath.startsWith('orgs/') ? 'org-photos'
        : photo.relativePath.startsWith('contained/') ? 'campaign-assets'
        : 'other',
    },
  });

  if (error) {
    console.warn(`  JH insert failed for ${photo.filename}: ${error.message}`);
    return false;
  }
  return true;
}

async function main() {
  console.log('=== CONTAINED Photo Import ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE IMPORT'}`);
  console.log(`EL upload: ${elClient ? 'ENABLED' : 'DISABLED (no EL credentials)'}`);
  if (CATEGORY_FILTER) console.log(`Category filter: ${CATEGORY_FILTER}`);
  console.log('');

  // Scan
  let photos = await scanPhotos();
  console.log(`Found ${photos.length} photos in public/images/`);

  // Filter by category
  if (CATEGORY_FILTER) {
    photos = photos.filter(p => p.category === CATEGORY_FILTER);
    console.log(`Filtered to ${photos.length} in category "${CATEGORY_FILTER}"`);
  }

  // Category breakdown
  const byCat = {};
  for (const p of photos) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  }
  console.log('\nCategory breakdown:');
  for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
    const label = CATEGORIES[cat]?.label || cat;
    console.log(`  ${label}: ${count}`);
  }

  const aiCount = photos.filter(p => p.isAI).length;
  if (aiCount > 0) {
    console.log(`\n⚠️  ${aiCount} AI-generated photos flagged for replacement`);
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN complete. No changes made. ---');
    console.log('\nSample entries:');
    for (const p of photos.slice(0, 5)) {
      console.log(`  ${p.filename} → category: ${p.category}, tags: [${p.tags.join(', ')}]`);
    }
    return;
  }

  // Check existing
  const existing = await getExistingAssets();
  const toImport = photos.filter(p => !existing.has(p.filename));
  console.log(`\n${existing.size} already imported, ${toImport.length} new to import`);

  if (toImport.length === 0) {
    console.log('Nothing new to import. Done.');
    return;
  }

  // Import
  let uploaded = 0, cataloged = 0, failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < toImport.length; i++) {
    const photo = toImport[i];
    process.stdout.write(`\r[${i + 1}/${toImport.length}] ${photo.filename.substring(0, 50).padEnd(50)}`);

    try {
      // Upload to EL (if configured)
      let cdnUrl = null;
      if (elClient) {
        cdnUrl = await uploadToEL(photo);
        if (cdnUrl) uploaded++;
      }

      // Insert into JH catalog
      const ok = await insertToJH(photo, cdnUrl);
      if (ok) cataloged++;
      else failed++;
    } catch (err) {
      console.warn(`\n  Error on ${photo.filename}: ${err.message}`);
      failed++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n=== Import Complete (${elapsed}s) ===`);
  console.log(`  Cataloged: ${cataloged}`);
  if (elClient) console.log(`  EL uploaded: ${uploaded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Skipped (existing): ${existing.size}`);
  console.log(`  Total in catalog: ${existing.size + cataloged}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
