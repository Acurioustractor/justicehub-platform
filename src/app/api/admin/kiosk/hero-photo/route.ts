import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { createClient } from '@/lib/supabase/server-lite';

/**
 * Hero photo upload for the kiosk hook rotator.
 *
 * Pattern: multipart/form-data with `file` (image) + `slug` (org slug).
 * The file is uploaded to the public `media` bucket at
 * `kiosk-heroes/{slug}.{ext}` and the resulting public URL is written to
 * organizations.hero_photo_url. Subsequent uploads overwrite the same path
 * so the URL is stable.
 *
 * Auth: admin only via profiles.role='admin' (matches /admin/* pattern).
 * Dev bypass: localhost skips auth, same as other admin endpoints.
 *
 * Validation: PNG / JPG / WebP only, <8MB.
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isDev) {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const slug = (form.get('slug') as string | null)?.trim();

  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Type ${file.type} not allowed. Use JPG / PNG / WebP.` }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max 8MB.` }, { status: 400 });
  }

  const service = createServiceClient() as any;

  // Verify the org exists before uploading so we don't orphan a file
  const { data: org } = await service
    .from('organizations')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: `Org with slug "${slug}" not found.` }, { status: 404 });

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `kiosk-heroes/${slug}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await service.storage
    .from('media')
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (upErr) {
    console.error('hero-photo upload failed', upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: publicUrl } = service.storage.from('media').getPublicUrl(path);
  const url = publicUrl?.publicUrl;
  if (!url) return NextResponse.json({ error: 'Could not resolve public URL.' }, { status: 500 });
  // Add cache-buster so the kiosk fetches the new image even on the same URL
  const versionedUrl = `${url}?v=${Date.now()}`;

  const { error: updErr } = await service
    .from('organizations')
    .update({ hero_photo_url: versionedUrl })
    .eq('id', org.id);
  if (updErr) {
    console.error('hero-photo org update failed', updErr);
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug: org.slug, name: org.name, url: versionedUrl });
}

export async function DELETE(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isDev) {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug')?.trim();
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const service = createServiceClient() as any;
  const { error } = await service.from('organizations').update({ hero_photo_url: null }).eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
