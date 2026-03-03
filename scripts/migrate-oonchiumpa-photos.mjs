#!/usr/bin/env node
/**
 * Migrate Oonchiumpa photos from old Supabase to JusticeHub media_items table.
 *
 * Rather than re-uploading, we register the existing public URLs as media_items
 * tagged to the Oonchiumpa organization. The old Supabase images are publicly accessible.
 *
 * Usage: node scripts/migrate-oonchiumpa-photos.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// JusticeHub Supabase
const JUSTICEHUB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tednluwflfhxyucgwigh.supabase.co';
const JUSTICEHUB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!JUSTICEHUB_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local');
  process.exit(1);
}

const OONCHIUMPA_ORG_ID = '5f038d59-9bf2-439b-b018-249790dfb41b';

const supabase = createClient(JUSTICEHUB_URL, JUSTICEHUB_KEY);

// Read image URLs from the all-image-urls.txt file
const imageUrlsPath = resolve(__dirname, '../../Oochiumpa/all-image-urls.txt');
let imageUrls;
try {
  imageUrls = readFileSync(imageUrlsPath, 'utf-8')
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.startsWith('http'));
} catch {
  console.error(`❌ Could not read ${imageUrlsPath}`);
  console.log('  Make sure /Users/benknight/Code/Oochiumpa/all-image-urls.txt exists');
  process.exit(1);
}

console.log(`📸 Found ${imageUrls.length} Oonchiumpa image URLs to migrate\n`);

// Check what's already imported
const { data: existing } = await supabase
  .from('media_items')
  .select('file_url')
  .contains('organization_ids', [OONCHIUMPA_ORG_ID]);

const existingUrls = new Set((existing || []).map(e => e.file_url));
const newUrls = imageUrls.filter(u => !existingUrls.has(u));

console.log(`  Already imported: ${existingUrls.size}`);
console.log(`  New to import: ${newUrls.length}\n`);

if (newUrls.length === 0) {
  console.log('✅ All photos already imported!');
  process.exit(0);
}

// Extract a title from the URL path
function titleFromUrl(url) {
  const path = new URL(url).pathname;
  const parts = path.split('/');
  const filename = parts[parts.length - 1];
  // Clean up filename: remove extension, replace dashes/underscores
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/^\d+\s*/, '') // remove leading numbers
    .trim() || 'Oonchiumpa Photo';
}

// Determine file type from URL
function fileTypeFromUrl(url) {
  const ext = url.split('.').pop()?.toLowerCase();
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return 'video';
  return 'photo';
}

// Import in batches of 20
const BATCH_SIZE = 20;
let imported = 0;
let failed = 0;

for (let i = 0; i < newUrls.length; i += BATCH_SIZE) {
  const batch = newUrls.slice(i, i + BATCH_SIZE);

  const records = batch.map(url => ({
    file_url: url,
    file_type: fileTypeFromUrl(url),
    title: titleFromUrl(url),
    organization_ids: [OONCHIUMPA_ORG_ID],
    consent_verified: true,
    community_approved: false,
    source: 'oonchiumpa-migration',
    source_id: url,
  }));

  const { error } = await supabase
    .from('media_items')
    .insert(records);

  if (error) {
    console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
    failed += batch.length;
  } else {
    imported += batch.length;
    console.log(`✅ Imported batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} photos (${imported}/${newUrls.length})`);
  }
}

console.log(`\n📊 Migration complete:`);
console.log(`  ✅ Imported: ${imported}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  📸 Total Oonchiumpa media: ${existingUrls.size + imported}`);
