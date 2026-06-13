'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

const C = {
  cream: '#f8f1e6',
  surface: '#fff8ef',
  border: '#eadfce',
  borderWarm: '#e6d7c1',
  ink: '#2b2530',
  body: '#584b40',
  muted: '#8d6a44',
  purple: '#4a2560',
};
const SERIF = "'Cormorant Garamond', Georgia, serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

interface SiteResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  score: number;
  metadata: {
    state?: string;
    organizationName?: string;
    imageUrl?: string;
    category?: string;
    outcomeCount?: number;
    programCount?: number;
    peopleCount?: number;
    town?: string;
  };
  highlights?: string[];
}

interface SearchResponse {
  query: string;
  results: SiteResult[];
  stateCounts: Record<string, number>;
  total: number;
}

function initialsOf(name: string): string {
  const words = name.replace(/[(),]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'JR';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function JRSearchBar() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(
          `/api/communities/justice-reinvestment/search?q=${encodeURIComponent(q)}&limit=24`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error('search failed');
        const json = (await res.json()) as SearchResponse;
        setData(json);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setData({ query: q, results: [], stateCounts: {}, total: 0 });
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const stateSummary = useMemo(() => {
    if (!data) return '';
    const states = Object.keys(data.stateCounts);
    if (states.length === 0) return '';
    return `${data.total} ${data.total === 1 ? 'site' : 'sites'} across ${states.length} ${states.length === 1 ? 'state' : 'states and territories'}`;
  }, [data]);

  return (
    <section className="mx-auto max-w-7xl px-6 pt-14 md:px-10 md:pt-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: C.muted }}>
        Search the network
      </p>
      <h2 className="mt-3 text-5xl leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
        Find a place, a program, a person
      </h2>
      <p className="mt-5 max-w-3xl text-base leading-7" style={{ color: C.body }}>
        One search across every site. Type a town, a lead organisation, a program, a partner, or the name
        of someone leading the work, and the site it belongs to comes back.
      </p>

      <div className="mt-7 max-w-2xl">
        <label htmlFor="jr-search" className="sr-only">
          Search the justice reinvestment network
        </label>
        <input
          id="jr-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try Bourke, healing, Just Reinvest NSW, bail, or a name"
          autoComplete="off"
          className="w-full rounded-full border px-5 py-3.5 text-base outline-none transition-colors duration-150 focus:border-[#4a2560]"
          style={{ borderColor: C.border, background: C.surface, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif' }}
        />
      </div>

      {query.trim().length >= 2 ? (
        <div className="mt-6">
          <p className="text-[12px]" style={{ color: C.muted, fontFamily: MONO }}>
            {loading ? 'Searching the network...' : data && data.total > 0 ? stateSummary : 'No sites match that yet. Try a place, a program, or an organisation.'}
          </p>

          {data && data.results.length > 0 ? (
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {data.results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.url}
                    className="flex h-full gap-4 rounded-[18px] border p-4 transition-colors duration-150 hover:border-[#c9a877]"
                    style={{ borderColor: C.border, background: C.surface }}
                  >
                    {r.metadata.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.metadata.imageUrl} alt="" width={44} height={44} className="h-11 w-11 flex-none rounded-xl bg-white object-contain p-1" />
                    ) : (
                      <span
                        className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-xs font-semibold"
                        style={{ background: C.purple, color: '#f1e6f7', fontFamily: MONO }}
                      >
                        {initialsOf(r.title)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-lg leading-6" style={{ fontFamily: SERIF, fontWeight: 500, color: C.ink }}>
                        {r.title}
                      </p>
                      <p className="mt-0.5 text-[12px]" style={{ color: C.muted, fontFamily: MONO }}>
                        {[r.metadata.town, r.metadata.state].filter(Boolean).join(', ')}
                        {r.metadata.organizationName ? `  ·  ${r.metadata.organizationName}` : ''}
                      </p>
                      {r.highlights && r.highlights.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {r.highlights.map((h, i) => (
                            <li
                              key={i}
                              className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                              style={{ borderColor: C.borderWarm, color: C.body }}
                            >
                              {h}
                            </li>
                          ))}
                        </ul>
                      ) : r.description ? (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-5" style={{ color: C.body }}>
                          {r.description}
                        </p>
                      ) : null}
                      {typeof r.metadata.outcomeCount === 'number' && r.metadata.outcomeCount > 0 ? (
                        <span
                          className="mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                          style={{ background: '#eef3e6', borderColor: '#7a9a6b', color: '#4a6138' }}
                        >
                          {r.metadata.outcomeCount} evaluated outcome{r.metadata.outcomeCount === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
