import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

// Mirrors scripts/alma-migrate-logos.mjs.
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
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

function isAlreadyStorageUrl(url: string | null): boolean {
  return typeof url === 'string' && url.includes('/storage/v1/object/public/');
}

async function migrateLogo(
  supabase: any,
  orgSlug: string,
  remoteUrl: string
): Promise<{ ok: boolean; storageUrl?: string; bytes?: number; reason?: string }> {
  let res: Response;
  try {
    res = await fetch(remoteUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'JusticeHubMapBot/1.0 (+https://justicehub.com.au; logo cache)',
        Accept: 'image/*,*/*;q=0.5',
      },
    });
  } catch (e: any) {
    return { ok: false, reason: `fetch_failed: ${e?.message || 'unknown'}` };
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

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batch = Math.min(parseInt(searchParams.get('batch') || '100', 10), 250);

  const supabase = createServiceClient() as any;

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, slug, name, logo_url')
    .not('logo_url', 'is', null)
    .neq('archived', true)
    .order('profile_completeness_score', { ascending: false, nullsFirst: false })
    .limit(batch * 3);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const candidates = (orgs || [])
    .filter((o: any) => !isAlreadyStorageUrl(o.logo_url))
    .slice(0, batch);

  if (candidates.length === 0) {
    return NextResponse.json({ migrated: 0, reason: 'nothing_to_migrate' });
  }

  let migrated = 0;
  let failed = 0;
  const failureReasons: Record<string, number> = {};
  const samples: string[] = [];

  for (const org of candidates) {
    const result = await migrateLogo(supabase, org.slug, org.logo_url);
    if (!result.ok) {
      failed++;
      failureReasons[result.reason!] = (failureReasons[result.reason!] || 0) + 1;
      continue;
    }
    const { error: updErr } = await supabase
      .from('organizations')
      .update({ logo_url: result.storageUrl })
      .eq('id', org.id);
    if (updErr) {
      failed++;
      continue;
    }
    migrated++;
    if (samples.length < 10) samples.push(org.slug);
  }

  return NextResponse.json({
    migrated,
    failed,
    candidates: candidates.length,
    samples,
    failureReasons,
  });
}
