/**
 * HEIC -> JPEG proxy for Empathy Ledger media.
 *
 * Browsers cannot render HEIC. Sites stuck with HEIC originals need a
 * server-side conversion. This route fetches the original from EL v2 by
 * media ID, converts via sharp, returns a cached JPEG.
 *
 * GET /api/empathy-ledger/heic-proxy?id=<media-id>&w=<width>
 */
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
// @ts-expect-error — heic-convert ships JS with implicit any types
import heicConvert from 'heic-convert';
import { getMedia } from '@/lib/empathy-ledger/v2-client';

export const runtime = 'nodejs';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
  'Content-Type': 'image/jpeg',
};

// Resolve media ID -> EL URL by querying recent media. We don't have a
// /media/:id GET in v2 client; query the storyteller list and match by id.
// For tighter coupling, callers can pass &url=<full-url> directly.
async function resolveUrl(id: string, fallbackUrl: string | null): Promise<string | null> {
  if (fallbackUrl) return fallbackUrl;
  // Best-effort lookup against the Contained installation storyteller.
  // If the photo lives elsewhere, callers should pass &url=.
  const STORYTELLER = 'd0a162d2-282e-4653-9d12-aa934c9dfa4e';
  try {
    const res = await getMedia({ storytellerId: STORYTELLER, limit: 200 });
    const match = res.data.find((m) => m.id === id);
    return match?.url ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const directUrl = req.nextUrl.searchParams.get('url');
  const widthParam = req.nextUrl.searchParams.get('w');
  const width = widthParam ? Math.min(2400, Math.max(64, parseInt(widthParam, 10) || 0)) : null;

  if (!id && !directUrl) {
    return NextResponse.json({ error: 'id or url required' }, { status: 400 });
  }

  const url = directUrl || (id ? await resolveUrl(id, null) : null);
  if (!url) {
    return NextResponse.json({ error: 'media not found' }, { status: 404 });
  }

  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (err) {
    return NextResponse.json({ error: 'fetch failed', detail: String(err) }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: `upstream ${res.status}` }, { status: res.status });
  }

  const buf = Buffer.from(await res.arrayBuffer());

  // Try sharp first (fast, native). If it fails (libvips lacks libheif on
  // this platform — Vercel + npm prebuilt sharp typically does), fall back
  // to heic-convert (pure JS, slower but reliable).
  try {
    let img = sharp(buf, { failOn: 'none' });
    if (width) img = img.resize({ width, withoutEnlargement: true });
    const jpeg = await img.jpeg({ quality: 82, progressive: true }).toBuffer();
    return new NextResponse(jpeg as any, { status: 200, headers: CACHE_HEADERS });
  } catch (sharpErr) {
    try {
      const jpegBuf = await heicConvert({ buffer: buf, format: 'JPEG', quality: 0.82 });
      let final: Buffer = Buffer.from(jpegBuf);
      if (width) {
        final = await sharp(final).resize({ width, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
      }
      return new NextResponse(final as any, { status: 200, headers: CACHE_HEADERS });
    } catch (fallbackErr) {
      return NextResponse.json(
        {
          error: 'conversion failed',
          sharp: String(sharpErr),
          fallback: String(fallbackErr),
        },
        { status: 500 }
      );
    }
  }
}
