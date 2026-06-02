/**
 * EL Photo Browser — pick photos from Empathy Ledger by ID.
 *
 * Hits v2 /api/v2/media via the org-scoped key, renders a grid with
 * thumbnail + filename + click-to-copy media ID. Use this when wiring
 * an EL photo into a JusticeHub page (e.g. /contained/how-it-works
 * room cards). Copy the ID, paste it into the relevant allowlist
 * (e.g. src/lib/empathy-ledger/contained-media.ts).
 */

import { getMedia, isV2Configured, type V2Media } from '@/lib/empathy-ledger/v2-client';
import { PhotoBrowser } from './photo-browser';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'EL Photo Browser · JusticeHub Admin' };

// The Contained installation storyteller — has 332 media items including
// every container interior, exterior, and event shot we have.
const CONTAINED_STORYTELLER_ID = 'd0a162d2-282e-4653-9d12-aa934c9dfa4e';

interface PageProps {
  searchParams?: { storyteller?: string; q?: string; page?: string };
}

export default async function ELPhotosPage({ searchParams }: PageProps) {
  const storytellerId = searchParams?.storyteller || CONTAINED_STORYTELLER_ID;
  const q = (searchParams?.q || '').toLowerCase().trim();
  const page = Math.max(1, Number(searchParams?.page) || 1);

  if (!isV2Configured) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8] p-12">
        <h1 className="text-3xl font-black uppercase">EL not configured</h1>
        <p className="mt-4 text-gray-400">
          Set EMPATHY_LEDGER_V2_URL and EMPATHY_LEDGER_V2_KEY in env.
        </p>
      </div>
    );
  }

  let items: V2Media[] = [];
  let total = 0;
  let error: string | null = null;
  let heicCount = 0;
  try {
    const res = await getMedia({ storytellerId, limit: 200, page });
    items = res.data;
    total = res.pagination.total;
  } catch (err) {
    error = err instanceof Error ? err.message : 'unknown error';
  }

  // HEIC originals are routed through /api/empathy-ledger/heic-proxy which
  // converts to JPEG on the fly (sharp -> heic-convert fallback) and caches.
  // Annotate each item with a `displayUrl` the browser can render.
  const isHeic = (m: V2Media) => {
    const ct = (m.contentType || '').toLowerCase();
    const fn = (m.filename || '').toLowerCase();
    return ct.includes('heic') || fn.endsWith('.heic');
  };
  heicCount = items.filter(isHeic).length;
  const annotated = items.map((m) => ({
    ...m,
    displayUrl: isHeic(m)
      ? `/api/empathy-ledger/heic-proxy?id=${m.id}&w=400`
      : m.url,
  }));

  const filtered = q
    ? annotated.filter((m) =>
        [m.filename, m.title, m.altText, m.galleryCaption, m.description]
          .filter(Boolean)
          .some((s) => (s as string).toLowerCase().includes(q))
      )
    : annotated;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="px-6 lg:px-12 py-8 max-w-[1600px] mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-tight">EL Photo Browser</h1>
        <p className="mt-1 text-sm text-gray-400 font-mono">
          storyteller {storytellerId.slice(0, 8)}… &middot; {total} total &middot; showing {filtered.length}
          {heicCount > 0 && ` · ${heicCount} HEIC converted on-the-fly`}
          {q && ` · matching "${q}"`}
        </p>

        <form className="mt-4 flex gap-2 items-center" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="filter by filename / caption / alt text"
            className="flex-1 max-w-md bg-[#1a1a1a] border border-white/20 px-3 py-2 text-sm font-mono"
          />
          <input type="hidden" name="storyteller" value={storytellerId} />
          <button type="submit" className="bg-[#DC2626] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest">
            Filter
          </button>
          <a href={`?storyteller=${storytellerId}`} className="text-xs font-mono text-gray-400 underline">clear</a>
        </form>

        {error && (
          <div className="mt-4 border border-[#DC2626] p-4 text-sm text-[#DC2626] font-mono">{error}</div>
        )}

        <PhotoBrowser items={filtered} />

        {total > 200 && (
          <div className="mt-8 flex gap-3 items-center text-sm font-mono">
            {page > 1 && (
              <a href={`?storyteller=${storytellerId}&q=${q}&page=${page - 1}`} className="underline">← prev</a>
            )}
            <span className="text-gray-400">page {page} of {Math.ceil(total / 200)}</span>
            {page * 200 < total && (
              <a href={`?storyteller=${storytellerId}&q=${q}&page=${page + 1}`} className="underline">next →</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
