#!/usr/bin/env node
/**
 * ALMA logo migration — copy remote org logos into Supabase Storage so
 * they survive when the source host goes down.
 *
 * The approval flow now migrates logos inline at approve-time, but there
 * are pre-existing organizations.logo_url values pointing at remote CDNs
 * (Squarespace, /assets/logo.png on community hosts, etc.) that are
 * fragile. This script catches up the backlog.
 *
 * Storage layout: images/logos/orgs/{slug}.{ext}
 *
 * Usage:
 *   node scripts/alma-migrate-logos.mjs               # dry-run, 25 orgs
 *   node scripts/alma-migrate-logos.mjs --apply       # write storage URLs back
 *   node scripts/alma-migrate-logos.mjs --apply --batch 200
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '25', 10);

const STORAGE_BUCKET = 'images';
const STORAGE_PREFIX = 'logos/orgs';
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 6000;
const ALLOWED_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);
const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

function isAlreadyStorageUrl(url) {
  return typeof url === 'string' && url.includes('/storage/v1/object/public/');
}

async function migrateLogo(orgSlug, remoteUrl) {
  let res;
  try {
    res = await fetch(remoteUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'JusticeHubMapBot/1.0 (+https://justicehub.com.au; logo cache)',
        Accept: 'image/*,*/*;q=0.5',
      },
    });
  } catch (e) {
    return { ok: false, reason: `fetch_failed: ${e.message}` };
  }
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };

  const rawCT = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.has(rawCT)) {
    return { ok: false, reason: `bad_content_type:${rawCT || 'missing'}` };
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) return { ok: false, reason: 'empty_body' };
  if (buffer.length > MAX_LOGO_BYTES) return { ok: false, reason: `too_large:${buffer.length}` };

  const ext = EXT_BY_MIME[rawCT] || 'png';
  const path = `${STORAGE_PREFIX}/${orgSlug}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: rawCT, cacheControl: '604800', upsert: true });
  if (uploadErr) return { ok: false, reason: `upload_failed: ${uploadErr.message}` };

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) return { ok: false, reason: 'no_public_url' };
  return { ok: true, storageUrl: data.publicUrl, bytes: buffer.length };
}

async function main() {
  console.log(`ALMA logo migration · ${apply ? 'APPLY' : 'DRY-RUN'} · batch=${batchSize}\n`);

  // Pull orgs with a non-storage logo_url. Order by completeness desc so
  // we hit the orgs most visible on the map first.
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, slug, name, logo_url')
    .not('logo_url', 'is', null)
    .neq('archived', true)
    .order('profile_completeness_score', { ascending: false, nullsFirst: false })
    .limit(batchSize * 3);

  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }

  const candidates = (orgs || []).filter((o) => !isAlreadyStorageUrl(o.logo_url)).slice(0, batchSize);

  if (candidates.length === 0) {
    console.log('Nothing to migrate — all org logos are already in storage.');
    return;
  }

  console.log(`Found ${candidates.length} orgs with remote logo URLs.\n`);

  let migrated = 0;
  let failed = 0;
  const failureReasons = {};
  for (const org of candidates) {
    process.stdout.write(`→ ${org.slug} ... `);
    const result = await migrateLogo(org.slug, org.logo_url);
    if (!result.ok) {
      failed++;
      failureReasons[result.reason] = (failureReasons[result.reason] || 0) + 1;
      console.log(`SKIP (${result.reason})`);
      continue;
    }
    if (apply) {
      const { error: updErr } = await supabase
        .from('organizations')
        .update({ logo_url: result.storageUrl })
        .eq('id', org.id);
      if (updErr) {
        failed++;
        console.log(`WROTE TO STORAGE but DB update failed: ${updErr.message}`);
        continue;
      }
    }
    migrated++;
    console.log(`✓ ${result.bytes}B${apply ? ' (DB updated)' : ' (dry-run)'}`);
  }

  console.log(`\n${migrated} migrated · ${failed} skipped/failed`);
  if (Object.keys(failureReasons).length > 0) {
    console.log('Failure reasons:');
    for (const [r, n] of Object.entries(failureReasons).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${n}× ${r}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
