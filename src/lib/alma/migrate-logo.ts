import type { LooseSupabaseClient } from '@/lib/supabase/service-lite';

const STORAGE_BUCKET = 'images';
const STORAGE_PREFIX = 'logos/orgs';
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB — anything bigger is probably a hero image misidentified as a logo
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

export interface MigrationResult {
  ok: boolean;
  storageUrl?: string;
  bytes?: number;
  contentType?: string;
  reason?: string;
}

/**
 * Already-local? — short-circuit so we don't infinite-loop on re-runs.
 * Supabase Storage URLs include `/storage/v1/object/public/` in the path.
 */
export function isAlreadyStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/');
}

/**
 * Copy a remote logo into Supabase Storage and return the public URL.
 *
 * Safety:
 *   - Validates content-type before writing (no HTML/PDF/etc. masquerading as logos)
 *   - Caps at 2MB (most real logos < 200KB)
 *   - Uses `upsert: true` so re-runs replace prior copies
 *   - Returns ok=false with a structured reason instead of throwing
 */
export async function migrateLogo(
  supabase: LooseSupabaseClient,
  opts: { orgSlug: string; remoteUrl: string }
): Promise<MigrationResult> {
  const { orgSlug, remoteUrl } = opts;
  if (!orgSlug || !remoteUrl) return { ok: false, reason: 'missing_input' };
  if (isAlreadyStorageUrl(remoteUrl)) {
    return { ok: true, storageUrl: remoteUrl, reason: 'already_local' };
  }

  let res: Response;
  try {
    res = await fetch(remoteUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent':
          'JusticeHubMapBot/1.0 (+https://justicehub.com.au; logo cache)',
        Accept: 'image/*,*/*;q=0.5',
      },
    });
  } catch (e: any) {
    return { ok: false, reason: `fetch_failed: ${e?.message || 'unknown'}` };
  }
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };

  const rawContentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.has(rawContentType)) {
    return { ok: false, reason: `bad_content_type:${rawContentType}` };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) return { ok: false, reason: 'empty_body' };
  if (buffer.length > MAX_LOGO_BYTES) {
    return { ok: false, reason: `too_large:${buffer.length}` };
  }

  const ext = EXT_BY_MIME[rawContentType] || 'png';
  const path = `${STORAGE_PREFIX}/${orgSlug}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: rawContentType,
      cacheControl: '604800', // 1 week — orgs change logos occasionally
      upsert: true,
    });
  if (uploadErr) {
    return { ok: false, reason: `upload_failed: ${uploadErr.message}` };
  }

  const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  if (!publicData?.publicUrl) {
    return { ok: false, reason: 'no_public_url' };
  }
  return {
    ok: true,
    storageUrl: publicData.publicUrl,
    bytes: buffer.length,
    contentType: rawContentType,
  };
}
