import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { Search, ChevronLeft, ChevronRight, Megaphone, X } from 'lucide-react';

const DISPLAY = "'Cormorant Garamond', Georgia, serif";
const LIMIT = 20;

type SP = Record<string, string | string[] | undefined>;

interface CampaignListRow {
  id: string;
  campaign_name: string;
  country_region: string;
  lead_organizations: string | null;
  goals: string | null;
  notable_tactics: string | null;
  start_year: number | null;
  end_year: number | null;
  is_ongoing: boolean | null;
  categories: string[] | null;
}

function safeQ(q: string): string {
  return q.replace(/[,()*%]/g, ' ').trim().slice(0, 100);
}
function sp(value: SP[string], def = ''): string {
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? def : def;
}
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

async function loadData(opts: { q: string; cats: string[]; status: string; page: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  let q = supabase
    .from('justice_matrix_campaigns')
    .select(
      'id,campaign_name,country_region,lead_organizations,goals,notable_tactics,start_year,end_year,is_ongoing,categories',
      { count: 'exact' },
    )
    .order('is_ongoing', { ascending: false, nullsFirst: false })
    .order('start_year', { ascending: false, nullsFirst: false })
    .range((opts.page - 1) * LIMIT, opts.page * LIMIT - 1);

  if (opts.q) {
    const s = opts.q;
    q = q.or(`campaign_name.ilike.%${s}%,country_region.ilike.%${s}%,goals.ilike.%${s}%`);
  }
  if (opts.cats.length) q = q.overlaps('categories', opts.cats);
  if (opts.status === 'active') q = q.eq('is_ongoing', true);
  if (opts.status === 'concluded') q = q.eq('is_ongoing', false);

  const allCatsQ = supabase.from('justice_matrix_campaigns').select('categories');
  const [rows, allCats] = await Promise.all([q, allCatsQ]);

  const counts = new Map<string, number>();
  for (const row of (allCats.data ?? []) as { categories: string[] | null }[]) {
    for (const c of row.categories ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const topCats = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14);

  return {
    rows: (rows.data ?? []) as CampaignListRow[],
    total: rows.count ?? 0,
    topCats,
  };
}

export default async function CampaignsListPage({ searchParams }: { searchParams: Promise<SP> }) {
  const raw = await searchParams;
  const q = safeQ(sp(raw.q));
  const cats = sp(raw.cat)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const status = sp(raw.status); // '' | 'active' | 'concluded'
  const page = Math.max(1, parseInt(sp(raw.page, '1'), 10) || 1);

  const { rows, total, topCats } = await loadData({ q, cats, status, page });
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const current: Record<string, string> = {};
  if (q) current.q = q;
  if (cats.length) current.cat = cats.join(',');
  if (status) current.status = status;

  const anyFilter = !!(q || cats.length || status);

  function toggleCatHref(c: string): string {
    const next = cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c];
    return `/justice-matrix/campaigns${urlWith(current, { cat: next.join(',') || null })}`;
  }
  function setStatusHref(value: 'active' | 'concluded'): string {
    return `/justice-matrix/campaigns${urlWith(current, { status: current.status === value ? null : value })}`;
  }
  function pageHref(p: number): string {
    return `/justice-matrix/campaigns${urlWith({ ...current, page: String(p) }, {})}`;
  }

  return (
    <main style={{ background: '#f8f1e6', color: '#2b2530' }} className="min-h-screen">
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
              href="/justice-matrix"
              className="inline-flex items-center gap-2 text-[#eadff2] hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to the matrix overview
            </Link>
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d3b583] mb-4">
              Justice Matrix · Campaigns
            </div>
            <h1
              style={{ fontFamily: DISPLAY, fontWeight: 500, lineHeight: 1.05 }}
              className="text-4xl md:text-5xl lg:text-6xl text-white max-w-3xl mb-4"
            >
              Advocacy, organised.
            </h1>
            <p className="text-[#eadff2] text-base md:text-lg max-w-2xl">
              {total.toLocaleString()} {total === 1 ? 'campaign' : 'campaigns'} across {topCats.length} issue areas. Filter by status or topic. Each entry is a playbook other organisers can borrow from.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-14">
          <div className="grid lg:grid-cols-[260px_1fr] gap-10">
            <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
              <form action="/justice-matrix/campaigns" method="get" className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#8d6a44' }}>
                  Search
                </label>
                {cats.length > 0 && <input type="hidden" name="cat" value={cats.join(',')} />}
                {status && <input type="hidden" name="status" value={status} />}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8d6a44' }} />
                  <input
                    type="text"
                    name="q"
                    defaultValue={q}
                    placeholder="Campaign, region, goal..."
                    className="w-full rounded-[18px] pl-9 pr-3 py-2.5 text-sm border focus:outline-none"
                    style={{ background: '#fff8ef', borderColor: '#e6d7c1', color: '#2b2530' }}
                  />
                </div>
              </form>

              {anyFilter && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2" style={{ color: '#8d6a44' }}>
                    Active filters
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q && (
                      <Link
                        href={`/justice-matrix/campaigns${urlWith(current, { q: null })}`}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold border hover:bg-white transition-colors"
                        style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#4a2560' }}
                      >
                        “{q}”
                        <X className="w-3 h-3" />
                      </Link>
                    )}
                    {status && (
                      <Link
                        href={setStatusHref(status as 'active' | 'concluded')}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold border hover:bg-white transition-colors"
                        style={{ background: '#faf5ec', borderColor: '#dbc7a9', color: '#4a2560' }}
                      >
                        {status}
                        <X className="w-3 h-3" />
                      </Link>
                    )}
                    <Link
                      href="/justice-matrix/campaigns"
                      className="text-[12px] font-semibold underline"
                      style={{ color: '#7d5f3d' }}
                    >
                      clear all
                    </Link>
                  </div>
                </div>
              )}

              <FacetGroup title="Status">
                {(['active', 'concluded'] as const).map((s) => (
                  <FacetChip key={s} href={setStatusHref(s)} active={status === s}>
                    {s}
                  </FacetChip>
                ))}
              </FacetGroup>

              <FacetGroup title="Issue areas">
                {topCats.map(([c, n]) => (
                  <FacetChip key={c} href={toggleCatHref(c)} active={cats.includes(c)}>
                    {c}
                    <span className="ml-1 opacity-60">{n}</span>
                  </FacetChip>
                ))}
              </FacetGroup>
            </aside>

            <div>
              <div className="flex items-baseline justify-between mb-6">
                <div className="text-sm" style={{ color: '#5e5145' }}>
                  Showing <strong style={{ color: '#2b2530' }}>{rows.length}</strong> of {total.toLocaleString()} {total === 1 ? 'campaign' : 'campaigns'}
                  {totalPages > 1 && ` · page ${page} of ${totalPages}`}
                </div>
              </div>

              {rows.length === 0 ? (
                <div
                  className="rounded-[22px] border p-10 text-center"
                  style={{ background: '#fff8ef', borderColor: '#e6d7c1' }}
                >
                  <p style={{ color: '#584b40' }}>No campaigns match these filters.</p>
                  {anyFilter && (
                    <Link
                      href="/justice-matrix/campaigns"
                      className="inline-block mt-3 text-sm font-semibold underline"
                      style={{ color: '#4a2560' }}
                    >
                      Clear all filters
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="space-y-4">
                  {rows.map((r) => {
                    const years = r.start_year && r.end_year && r.start_year !== r.end_year
                      ? `${r.start_year}–${r.end_year}`
                      : r.start_year
                      ? `${r.start_year}`
                      : '';
                    return (
                      <li key={r.id}>
                        <Link
                          href={`/justice-matrix/campaigns/${r.id}`}
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
                              <Megaphone className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span
                                  className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                                  style={{ color: '#8d6a44' }}
                                >
                                  {r.country_region}
                                </span>
                                {years && <span className="text-[12px]" style={{ color: '#5e5145' }}>· {years}</span>}
                                <StatusBadge ongoing={r.is_ongoing} />
                              </div>
                              <h3
                                style={{ fontFamily: DISPLAY, fontWeight: 500, color: '#2b2530' }}
                                className="text-2xl md:text-[26px] leading-tight mb-2"
                              >
                                {r.campaign_name}
                              </h3>
                              {r.goals && (
                                <p className="text-sm leading-6 line-clamp-2" style={{ color: '#584b40' }}>
                                  {r.goals}
                                </p>
                              )}
                              {r.lead_organizations && (
                                <p className="text-[12px] mt-2" style={{ color: '#7d5f3d' }}>
                                  Led by {r.lead_organizations}
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
                    );
                  })}
                </ul>
              )}

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
  );
}

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

function FacetChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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

function StatusBadge({ ongoing }: { ongoing: boolean | null }) {
  if (ongoing === true) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] border"
        style={{ background: 'rgba(61,111,74,0.15)', color: '#3d6f4a', borderColor: '#9fc3a6' }}
      >
        active
      </span>
    );
  }
  if (ongoing === false) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] border"
        style={{ background: 'rgba(169,106,28,0.12)', color: '#a96a1c', borderColor: '#dbbf90' }}
      >
        concluded
      </span>
    );
  }
  return null;
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
