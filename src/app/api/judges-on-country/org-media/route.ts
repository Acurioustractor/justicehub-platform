import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Use local EL in dev, production URL otherwise
const EL_V2_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3030'
  : process.env.EMPATHY_LEDGER_V2_URL;
const EL_V2_KEY = process.env.EMPATHY_LEDGER_V2_KEY;

// Oonchiumpa org ID in Empathy Ledger
const OONCHIUMPA_ORG_ID = 'c53077e1-98de-4216-9149-6268891ff62e';

export async function GET() {
  if (!EL_V2_URL || !EL_V2_KEY) {
    return NextResponse.json({ photos: [], error: 'EL v2 not configured' });
  }

  try {
    // Use the proper EL Content Hub API with org scope
    const photos: { id: string; url: string; alt: string }[] = [];
    const seen = new Set<string>();

    // Fetch up to 3 pages (150 photos max in picker)
    for (let page = 1; page <= 3; page++) {
      const url = new URL('/api/v1/content-hub/media', EL_V2_URL);
      url.searchParams.set('organization_id', OONCHIUMPA_ORG_ID);
      url.searchParams.set('type', 'image');
      url.searchParams.set('limit', '50');
      url.searchParams.set('page', String(page));

      const response = await fetch(url.toString(), {
        headers: { 'x-api-key': EL_V2_KEY },
        next: { revalidate: 300 },
      });

      if (!response.ok) break;

      const data = await response.json();
      const items = data.media || data.data || [];

      for (const m of items) {
        const imgUrl = m.url || m.thumbnailUrl;
        if (imgUrl && !seen.has(imgUrl)) {
          seen.add(imgUrl);
          photos.push({
            id: m.id,
            url: imgUrl,
            alt: m.altText || m.description || m.title || 'Oonchiumpa photo',
          });
        }
      }

      if (!data.pagination?.hasMore) break;
    }

    return NextResponse.json({ photos, count: photos.length });
  } catch (err) {
    console.error('Oonchiumpa org-media error:', err);
    return NextResponse.json({ photos: [], error: 'Failed to fetch' }, { status: 500 });
  }
}
