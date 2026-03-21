/**
 * Convert HEIC photos in Empathy Ledger to JPEG
 * 1. Fetch all HEIC media from v2 API
 * 2. Download each HEIC file
 * 3. Convert to JPEG using macOS sips
 * 4. Re-upload to EL Supabase storage
 * 5. Update the media_assets record with new URL + content type
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, unlinkSync } from 'fs';

const V2_URL = process.env.EMPATHY_LEDGER_V2_URL || 'http://localhost:3030';
const V2_KEY = process.env.EMPATHY_LEDGER_V2_KEY;
const EL_SUPABASE_URL = 'https://yvnuayzslukamizrlhwb.supabase.co';
const EL_SUPABASE_KEY = process.env.EMPATHY_LEDGER_SERVICE_KEY;

if (!V2_KEY) { console.error('Missing EMPATHY_LEDGER_V2_KEY'); process.exit(1); }
if (!EL_SUPABASE_KEY) { console.error('Missing EMPATHY_LEDGER_SERVICE_KEY'); process.exit(1); }

const el = createClient(EL_SUPABASE_URL, EL_SUPABASE_KEY);
const tmpDir = '/tmp/heic-convert';
mkdirSync(tmpDir, { recursive: true });

// Fetch all media pages to find HEIC files
async function fetchAllMedia() {
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${V2_URL}/api/v2/media?limit=200&page=${page}`, {
      headers: { 'X-API-Key': V2_KEY }
    });
    const data = await res.json();
    if (!data.data?.length) break;
    all.push(...data.data);
    if (!data.pagination?.hasMore) break;
    page++;
  }
  return all;
}

console.log('Fetching all media from EL v2 API...');
const allMedia = await fetchAllMedia();
console.log(`Total media: ${allMedia.length}`);

const heicFiles = allMedia.filter(m => {
  const url = (m.url || '').toLowerCase();
  const filename = (m.filename || m.title || '').toLowerCase();
  return url.endsWith('.heic') || filename.endsWith('.heic');
});

console.log(`HEIC files found: ${heicFiles.length}`);
if (!heicFiles.length) { console.log('Nothing to convert.'); process.exit(0); }

let converted = 0;
let failed = 0;

for (const media of heicFiles) {
  const id = media.id;
  const title = media.title || media.filename || id;
  console.log(`\n--- Converting: ${title} (${id}) ---`);

  try {
    // 1. Download HEIC
    const heicPath = `${tmpDir}/${id}.heic`;
    const jpegPath = `${tmpDir}/${id}.jpg`;

    console.log('  Downloading...');
    const res = await fetch(media.url);
    if (!res.ok) { console.log(`  SKIP: download failed (${res.status})`); failed++; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(heicPath, buf);
    console.log(`  Downloaded: ${(buf.length / 1024).toFixed(0)} KB`);

    // 2. Convert with sips
    console.log('  Converting HEIC → JPEG...');
    execSync(`sips -s format jpeg -s formatOptions 85 "${heicPath}" --out "${jpegPath}"`, { stdio: 'pipe' });
    const jpegBuf = readFileSync(jpegPath);
    console.log(`  Converted: ${(jpegBuf.length / 1024).toFixed(0)} KB`);

    // 3. Upload JPEG to same storage path but with .jpg extension
    const oldUrl = media.url;
    // Extract storage path from URL
    const pathMatch = oldUrl.match(/\/object\/public\/(.+)$/);
    if (!pathMatch) { console.log('  SKIP: cannot parse storage path'); failed++; continue; }
    const oldPath = decodeURIComponent(pathMatch[1]);
    const bucket = oldPath.split('/')[0]; // 'media' or 'gallery-photos'
    const filePath = oldPath.substring(bucket.length + 1);
    const newFilePath = filePath.replace(/\.heic$/i, '.jpg');

    console.log(`  Uploading to ${bucket}/${newFilePath}...`);
    const { data: uploadData, error: uploadErr } = await el.storage
      .from(bucket)
      .upload(newFilePath, jpegBuf, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) { console.log(`  SKIP: upload failed: ${uploadErr.message}`); failed++; continue; }

    // 4. Get the public URL
    const { data: urlData } = el.storage.from(bucket).getPublicUrl(newFilePath);
    const newUrl = urlData.publicUrl;
    console.log(`  New URL: ${newUrl.substring(0, 80)}...`);

    // 5. Update media_assets record
    const newFilename = (media.filename || title).replace(/\.heic$/i, '.jpg');
    const { error: updateErr } = await el.from('media_assets')
      .update({
        url: newUrl,
        cdn_url: newUrl,
        thumbnail_url: newUrl,
        medium_url: newUrl,
        file_type: 'image/jpeg',
        mime_type: 'image/jpeg',
        filename: newFilename,
        original_filename: newFilename,
      })
      .eq('id', id);

    if (updateErr) {
      console.log(`  SKIP: DB update failed: ${updateErr.message}`);
      failed++; continue;
    }

    console.log(`  ✓ Converted and updated!`);
    converted++;

    // Cleanup temp files
    try { unlinkSync(heicPath); unlinkSync(jpegPath); } catch {}
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    failed++;
  }
}

console.log(`\n=== Done ===`);
console.log(`Converted: ${converted}`);
console.log(`Failed: ${failed}`);
console.log(`Total HEIC: ${heicFiles.length}`);
