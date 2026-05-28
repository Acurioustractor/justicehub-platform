import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { PreviewGate } from '@/components/PreviewGate';
import { Search, ChevronLeft, ChevronRight, Scale, X } from 'lucide-react';

const DISPLAY = "'Cormorant Garamond', Georgia, serif";
const LIMIT = 20;

type SP = Record<string, string | string[] | undefined>;

interface CaseListRow {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number | null;
  court: string | null;
  strategic_issue: string | null;
  categories: string[] | null;
  outcome: 'favorable' | 'adverse' | 'pending' | null;
  precedent_strength: 'high' | 'medium' | 'low' | null;
  region: string | null;
}

// Sanitise free-text query so it can't break the PostgREST .or() comma syntax.
function safeQ(q: string): string {
  return q.replace(/[,()*%]/g, ' ').trim().slice(0, 100);
}

function sp(value: SP[string], def = ''): string {
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? def : def;
}

/** Build a query string from the current params + a set of overrides. Resets page on filter change. */
function urlWith(current: Record<string, string>, changes: Record<string, string | null>): string {
  const next: Record<string, string> = { ...current };
  for (const [k, v] of Object.entries(changes)) {
    if (v === null || v === '') delete next[k];
    else next[k] = v;
  }
  if (Object.keys(changes).some((k) => k !== 'page')) delete next.page;
  const qs = new URLSearchParams(next).toString();
  return qs ? `?${qs}` : '';
}

async function loadData(opts: {
  q: string;
  cats: string[];
  outcome: string;
  strength: string;
  page: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  // Cases query with filters + range
  let casesQ = supabase
    .from('justice_matrix_cases')
    .select(
      'id,case_citation,jurisdiction,year,court,strategic_issue,categories,outcome,precedent_strength,region',
      { count: 'exact' },
    )
    .order('year', { ascending: false, nullsFirst: false })
    .range((opts.page - 1) * LIMIT, opts.page * LIMIT - 1);
  if (opts.q) {
    const s = opts.q;
    casesQ = casesQ.or(
      `case_citation.ilike.%${s}%,jurisdiction.ilike.%${s}%,strategic_issue.ilike.%${s}%`,
    );
  }
  if (opts.cats.length) casesQ = casesQ.overlaps('categories', opts.cats);
  if (opts.outcome) casesQ = casesQ.eq('outcome', opts.outcome);
  if (opts.strength) casesQ = casesQ.eq('precedent_strength', opts.strength);

  // Pull all category arrays to compute facet counts client-side. ~100 rows; fine.
  const allCatsQ = supabase.from('justice_matrix_cases').select('categories');

  const [cases, allCats] = await Promise.all([casesQ, allCatsQ]);

  // Aggregate category counts
  const counts = new Map<string, number>();
  for (const row of (allCats.data ?? []) as { categories: string[] | null }[]) {
    for (const c of row.categories ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const topCats = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14);

  return {
    rows: (cases.data ?? []) as CaseListRow[],
    total: cases.count ?? 0,
    topCats,
  };
}

export default async function CasesListPage({ searchParams }: { searchParams: Promise<SP> }) {
  const raw = await searchParams;
  const q = safeQ(sp(raw.q));
  const cats = sp(raw.cat)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const outcome = sp(raw.outcome);
  const strength = sp(raw.strength);
  const page = Math.max(1, parseInt(sp(raw.page, '1'), 10) || 1);

  const { rows, total, topCats } = await loadData({ q, cats, outcome, strength, page });
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Current params as flat object for url building (omit empty / page-only)
  const current: Record<string, string> = {};
  if (q) current.q = q;
  if (cats.length) current.cat = cats.join(',');
  if (outcome) current.outcome = outcome;
  if (strength) current.strength = strength;

  const anyFilter = !!(q || cats.length || outcome || strength);

  function toggleCatHref(c: string): string {
    const next = cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c];
    return `/justice-matrix/cases${urlWith(current, { cat: next.join(',') || null })}`;
  }
  function setFacetHref(key: 'outcome' | 'strength', value: string): string {
    return `/justice-matrix/cases${urlWith(current, { [key]: current[key] === value ? null : value })}`;
  }
  function pageHref(p: number): string {
    return `/justice-matrix/cases${urlWith({ ...current, page: String(p) }, {})}`;
  }

  return (
    <PreviewGate title="Justice Matrix" subtitle="Strategic litigation clearing house — preview">
      <main style={{ background: '#f8f1e6', color: '#2b2530' }} className="min-h-screen">
        {/* Hero strip */}
        <section
          style={{ background: 'radial-gradient(circle at 30% 0%, #5a2d74, #38184d 60%, #2c1240)' }}
          className="relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
            <Link
              href="/preview/justice-matrix"
              className="inline-flex items-center gap-2 text-[#eadff2] hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to the matrix overview
            </Link>
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d3b583] mb-4">
              Justice Matrix · Cases
            </div>
            <h1
              style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.05 }}
              className="text-4xl md:text-5xl lg:text-6xl text-white max-w-3xl mb-4"
            >
              Strategic litigation, searchable.
            </h1>
            <p className="text-[#eadff2] text-base md:text-lg max-w-2xl">
              {total.toLocaleString()} {total === 1 ? 'case' : 'cases'} across {topCats.length} issue areas. Filter by topic, outcome, or precedent strength. Each profile is a starting point for adaptation, not a finishing line.
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-14">
          <div className="grid lg:grid-cols-[260px_1fr] gap-10">
            {/* FACETS */}
            <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
              {/* Search */}
              <form action="/justice-matrix/cases" method="get" className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8d6a44' }}>
                  Search
                </label>
                {/* Preserve other facets across the GET form */}
                {cats.length > 0 && <input type="hidden" name="cat" value={cats.join(',')} />}
                {outcome && <input type="hidden" name="outcome" value={outcome} />}
                {strength && <input type="hidden" name="strength" value={strength} />}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8d6a44' }} />
                  <input
                    type="text"
                    name="q"
                    defaultValue={q}
                    placeholder="Citation, jurisdiction, issue..."
                    className="w-full rounded-[18px] pl-9 pr-3 py-2.5 text-sm border focus:outline-none"
                    style={{ background: '#fff8ef', borderColor: '#e6d7c1', color: '#2b2530' }}
                  />
                </div>
              </form>

              {/* Active filter chips */}
              {anyFilter && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2" style={{ color: '#8d6a44' }}>
                    Active filters
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q && (
                      <Link
                        href={`/justice-matrix/cases${urlWith(current, { q: null })}`}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold border hover:bg-white transition-colors"
                        style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#4a2560' }}
                      >
                        “{q}”
                        <X className="w-3 h-3" />
                      </Link>
                    )}
                    {outcome && (
                      <Link
                        href={setFacetHref('outcome', outcome)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold border hover:bg-white transition-colors"
                        style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#4a2560' }}
                      >
                        {outcome}
                        <X className="w-3 h-3" />
                      </Link>
                    )}
                    {strength && (
                      <Link
                        href={setFacetHref('strength', strength)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold border hover:bg-white transition-colors"
                        style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#4a2560' }}
                      >
                        {strength} precedent
                        <X className="w-3 h-3" />
                      </Link>
                    )}
                    <Link
                      href="/justice-matrix/cases"
                      className="text-[12px] font-semibold underline"
                      style={{ color: '#7d5f3d' }}
                    >
                      clear all
                    </Link>
                  </div>
                </div>
              )}

              {/* Outcome */}
              <FacetGroup title="Outcome">
                {(['favorable', 'adverse', 'pending'] as const).map((o) => (
                  <FacetChip key={o} href={setFacetHref('outcome', o)} active={outcome === o}>
                    {o}
                  </FacetChip>
                ))}
              </FacetGroup>

              {/* Precedent */}
              <FacetGroup title="Precedent strength">
                {(['high', 'medium', 'low'] as const).map((s) => (
                  <FacetChip key={s} href={setFacetHref('strength', s)} active={strength === s}>
                    {s}
                  </FacetChip>
                ))}
              </FacetGroup>

              {/* Categories */}
              <FacetGroup title="Issue areas">
                {topCats.map(([c, n]) => (
                  <FacetChip key={c} href={toggleCatHref(c)} active={cats.includes(c)}>
                    {c}
                    <span className="ml-1 opacity-60">{n}</span>
                  </FacetChip>
                ))}
              </FacetGroup>
            </aside>

            {/* RESULTS */}
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <div className="text-sm" style={{ color: '#5e5145' }}>
                  Showing <strong style={{ color: '#2b2530' }}>{rows.length}</strong> of {total.toLocaleString()} {total === 1 ? 'case' : 'cases'}
                  {totalPages > 1 && ` · page ${page} of ${totalPages}`}
                </div>
              </div>

              {rows.length === 0 ? (
                <div
                  className="rounded-[22px] border p-10 text-center"
                  style={{ background: '#fff8ef', borderColor: '#e6d7c1' }}
                >
                  <p style={{ color: '#584b40' }}>No cases match these filters.</p>
                  {anyFilter && (
                    <Link
                      href="/justice-matrix/cases"
                      className="inline-block mt-3 text-sm font-semibold underline"
                      style={{ color: '#4a2560' }}
                    >
                      Clear all filters
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="space-y-4">
                  {rows.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/justice-matrix/cases/${r.id}`}
                        className="block rounded-[22px] border p-5 md:p-6 transition-colors hover:bg-white"
                        style={{
                          background: '#fff8ef',
                          borderColor: '#e6d7c1',
                          boxShadow: '0 16px 40px rgba(49,31,15,0.06)',
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="hidden md:flex h-10 w-10 shrink-0 rounded-full items-center justify-center"
                            style={{ background: '#f3eadb', color: '#4a2560' }}
                          >
                            <Scale className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span
                                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                                style={{ color: '#8d6a44' }}
                              >
                                {r.jurisdiction}
                              </span>
                              {r.year && (
                                <span className="text-[12px]" style={{ color: '#5e5145' }}>
                                  · {r.year}
                                </span>
                              )}
                              {r.court && (
                                <span className="text-[12px]" style={{ color: '#5e5145' }}>
                                  · {r.court}
                                </span>
                              )}
                              {r.outcome && <OutcomeBadge outcome={r.outcome} />}
                              {r.precedent_strength === 'high' && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] border"
                                  style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#7d5f3d' }}
                                >
                                  High precedent
                                </span>
                              )}
                            </div>
                            <h3
                              style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
                              className="text-2xl md:text-[26px] leading-tight mb-2"
                            >
                              {r.case_citation}
                            </h3>
                            {r.strategic_issue && (
                              <p className="text-sm leading-6 line-clamp-2" style={{ color: '#584b40' }}>
                                {r.strategic_issue}
                              </p>
                            )}
                            {r.categories && r.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {r.categories.slice(0, 5).map((c) => (
                                  <span
                                    key={c}
                                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                    style={{ background: '#f3eadb', color: '#5e5145', border: '1px solid #eadfce' }}
                                  >
                                    {c}
                                  </span>
                                ))}
                                {r.categories.length > 5 && (
                                  <span className="text-[11px] self-center" style={{ color: '#7d5f3d' }}>
                                    +{r.categories.length - 5}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <PageLink href={page > 1 ? pageHref(page - 1) : null}>
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </PageLink>
                  <span className="text-sm font-medium" style={{ color: '#5e5145' }}>
                    Page {page} of {totalPages}
                  </span>
                  <PageLink href={page < totalPages ? pageHref(page + 1) : null}>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </PageLink>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </PreviewGate>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: '#8d6a44' }}>
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FacetChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold border transition-colors"
      style={
        active
          ? { background: '#4a2560', borderColor: '#4a2560', color: '#f8f1e6' }
          : { background: '#fff8ef', borderColor: '#e6d7c1', color: '#4a2560' }
      }
    >
      {children}
    </Link>
  );
}

function OutcomeBadge({ outcome }: { outcome: 'favorable' | 'adverse' | 'pending' }) {
  const palette =
    outcome === 'favorable'
      ? { bg: 'rgba(61,111,74,0.15)', color: '#3d6f4a', border: '#9fc3a6' }
      : outcome === 'adverse'
      ? { bg: 'rgba(138,42,42,0.12)', color: '#8a2a2a', border: '#d6a0a0' }
      : { bg: 'rgba(169,106,28,0.12)', color: '#a96a1c', border: '#dbbf90' };
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] border"
      style={{ background: palette.bg, color: palette.color, borderColor: palette.border }}
    >
      {outcome}
    </span>
  );
}

function PageLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border opacity-40 cursor-not-allowed"
        style={{ background: '#fff8ef', borderColor: '#e6d7c1', color: '#4a2560' }}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border hover:bg-white transition-colors"
      style={{ background: '#fff8ef', borderColor: '#e6d7c1', color: '#4a2560' }}
    >
      {children}
    </Link>
  );
}
