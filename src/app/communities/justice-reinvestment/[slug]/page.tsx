import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  loadJrSiteProfile,
  getAllJrSiteSlugs,
  type JrMetricClass,
  type JrMetricVerdict,
  type JrResearchMetric,
} from '@/lib/communities/justice-reinvestment';
import { serifDisplay } from '@/lib/communities/style';
import { DETENTION_COST_PER_CHILD } from '@/lib/intelligence/regional-computations';

export const revalidate = 300;

const C = {
  cream: '#f8f1e6',
  surface: '#fff8ef',
  panel: '#faf5ec',
  border: '#eadfce',
  borderWarm: '#e6d7c1',
  ink: '#2b2530',
  body: '#584b40',
  muted: '#8d6a44',
  purple: '#4a2560',
  purpleDeep: '#3c1d53',
  purpleSoft: '#d7c2e3',
};

const MONO = "'IBM Plex Mono', ui-monospace, monospace";

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

/** Two-letter initials for the fallback identity mark (no logo). */
function initialsOf(name: string): string {
  const words = name.replace(/[(),]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'JR';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Pre-render the known routes; the page still loads its data per request. */
export function generateStaticParams() {
  return getAllJrSiteSlugs().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadJrSiteProfile(slug).catch(() => null);
  if (!profile) return { title: 'Justice reinvestment site | JusticeHub' };
  const { site, research } = profile;
  const place = [site.town, site.state].filter(Boolean).join(', ');
  return {
    title: `${site.displayName} | Justice reinvestment | JusticeHub`,
    description:
      research?.oneLine ||
      site.blurb ||
      `${site.displayName}${place ? `, ${place}` : ''}: a justice reinvestment site on the JusticeHub national map, built from public records.`,
  };
}

/* ---------- metric class + verification presentation ---------- */

const METRIC_CLASS_LABEL: Record<JrMetricClass, string> = {
  outcome: 'Evaluated outcome',
  process: 'Activity / output',
  projection: 'Projection',
  context: 'Context baseline',
  borrowed: 'Related program',
  unclassified: 'Reported figure',
};

const METRIC_CLASS_NOTE: Record<JrMetricClass, string> = {
  outcome: 'An independently evaluated change attributed to the site.',
  process: 'What the site did or delivered, not yet an evaluated outcome.',
  projection: 'A modelled or forecast figure, not a measured result.',
  context: 'A background figure about the place, not a result of this work.',
  borrowed: 'A figure from a related but distinct program.',
  unclassified: 'A figure drawn from a public source, classification pending.',
};

function classStyle(cls: JrMetricClass): { bg: string; border: string; color: string } {
  switch (cls) {
    case 'outcome':
      return { bg: '#eef3e6', border: '#7a9a6b', color: '#4a6138' };
    case 'projection':
    case 'borrowed':
      return { bg: '#f6efe1', border: C.borderWarm, color: '#8a5a2b' };
    default:
      return { bg: C.surface, border: C.border, color: C.muted };
  }
}

function VerdictBadge({ verdict }: { verdict: JrMetricVerdict | null }) {
  const map: Record<string, { label: string; bg: string; border: string; color: string }> = {
    confirmed: { label: 'Source confirmed', bg: '#eef3e6', border: '#7a9a6b', color: '#4a6138' },
    unconfirmed: { label: 'Awaiting confirmation', bg: '#f6efe1', border: C.borderWarm, color: '#8a5a2b' },
    contradicted: { label: 'Source disputed', bg: '#f7e9e6', border: '#caa39b', color: '#9a3324' },
  };
  const s = verdict ? map[verdict] : { label: 'Source cited', bg: C.surface, border: C.border, color: C.muted };
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function MetricCard({ m }: { m: JrResearchMetric }) {
  const cs = classStyle(m.metricClass);
  return (
    <article className="rounded-[18px] border p-5" style={{ borderColor: C.border, background: C.surface }}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ background: cs.bg, borderColor: cs.border, color: cs.color }}
          title={METRIC_CLASS_NOTE[m.metricClass]}
        >
          {METRIC_CLASS_LABEL[m.metricClass]}
        </span>
        <VerdictBadge verdict={m.verdict} />
        {m.year ? (
          <span className="text-[11px]" style={{ color: C.muted, fontFamily: MONO }}>
            {m.year}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl leading-none" style={{ ...serifDisplay, color: C.ink }}>
        {m.value}
      </p>
      <p className="mt-2 text-sm leading-6" style={{ color: C.body }}>
        {m.metric}
      </p>
      {m.asReported ? (
        <p className="mt-3 line-clamp-4 border-l-2 pl-3 text-[12px] leading-5 italic" style={{ borderColor: C.borderWarm, color: '#6b5d50' }}>
          &ldquo;{m.asReported}&rdquo;
        </p>
      ) : null}
      <Link
        href={m.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex text-[11px] font-semibold"
        style={{ color: C.purple }}
      >
        View the source &rarr;
      </Link>
    </article>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: C.muted }}>
      {children}
    </p>
  );
}

export default async function JusticeReinvestmentSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await loadJrSiteProfile(slug).catch(() => null);
  if (!profile) notFound();

  const { site, detail, research, relatedLinks } = profile;
  const place = [site.town, site.state].filter(Boolean).join(', ');
  const leadOrg = detail?.orgName ?? site.org;
  const logo = research?.logoUrl ?? site.logoUrl;
  const website = research?.confirmedWebsite ?? site.website;
  const blurb = research?.oneLine ?? site.blurb;
  const metrics = research?.impactMetrics ?? [];
  const programNames = research?.programs ?? [];
  const people = research?.people ?? [];
  const history = research?.history ?? [];
  const news = research?.news ?? [];
  const funding = detail?.funding ?? [];

  const isClaimed = detail?.claimStatus === 'verified' || detail?.claimStatus === 'community_verified';

  // Funding-vs-detention framing. Lead-org funding on record, set against the
  // ROGS annual cost of detaining one child. Honest: this is org-level, because
  // per-site federal allocations are not published.
  const totalFunding = funding.reduce((sum, f) => sum + (f.amountDollars ?? 0), 0);
  const childYears = totalFunding > 0 ? totalFunding / DETENTION_COST_PER_CHILD : 0;

  return (
    <div className="min-h-screen" style={{ background: C.cream, color: C.ink }}>
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: C.purple, color: '#f1e6f7' }}>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-16">
          <Link href="/communities/justice-reinvestment" className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: C.purpleSoft }}>
            &larr; The justice reinvestment network
          </Link>

          <div className="mt-6 flex items-start gap-5">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={72} height={72} className="h-16 w-16 flex-none rounded-2xl bg-white/90 object-contain p-1.5 md:h-[72px] md:w-[72px]" />
            ) : (
              <span
                className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl text-lg font-semibold md:h-[72px] md:w-[72px]"
                style={{ background: C.purpleDeep, color: '#f1e6f7', fontFamily: MONO, letterSpacing: '0.04em' }}
              >
                {initialsOf(site.displayName)}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-4xl leading-none md:text-5xl" style={serifDisplay}>
                {site.displayName}
              </h1>
              {place ? (
                <p className="mt-2 text-sm" style={{ color: C.purpleSoft, fontFamily: MONO }}>
                  {place}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {leadOrg ? (
              <span className="rounded-full border px-3 py-1 text-[11px] font-medium" style={{ borderColor: '#6a4a82', color: '#eadff2' }}>
                {leadOrg}
              </span>
            ) : null}
            {research?.dataQuality ? (
              <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: '#6a4a82', color: '#cbb1dc' }}>
                {research.dataQuality === 'rich' ? 'Detailed record' : research.dataQuality === 'moderate' ? 'Growing record' : 'Early record'}
              </span>
            ) : null}
            <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: '#6a4a82', color: '#cbb1dc' }}>
              {isClaimed ? 'Community-claimed' : 'Public record'}
            </span>
          </div>

          {blurb ? (
            <p className="mt-6 max-w-2xl text-lg leading-7" style={{ color: '#eadff2' }}>
              {blurb}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            {website ? (
              <Link href={website} target="_blank" rel="noopener noreferrer" className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: '#f1e6f7', color: C.purple }}>
                Visit the site &rarr;
              </Link>
            ) : null}
            <Link href="/communities/justice-reinvestment" className="rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: '#6a4a82', color: '#f1e6f7' }}>
              Back to the map
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
        {/* Impact */}
        <section>
          <SectionKicker>Impact on the record</SectionKicker>
          <h2 className="mt-3 text-4xl leading-none" style={serifDisplay}>
            What the public record shows
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6" style={{ color: C.body }}>
            Every figure carries the source it came from and a label for what kind of figure it is, so an
            evaluated outcome is never confused with a projection, a background number, or a figure from a
            related program. Most sites here were funded in the 2024 and 2025 Commonwealth rounds, and the
            first evaluations under the national framework begin from late 2026. An empty panel is an honest
            early-stage record, not a failure.
          </p>

          {metrics.length > 0 ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((m, i) => (
                <MetricCard key={`${m.metric}-${i}`} m={m} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[18px] border px-5 py-5" style={{ borderColor: C.borderWarm, background: C.panel }}>
              <p className="text-sm leading-6" style={{ color: '#5e5145' }}>
                No evaluated outcomes are on the public record for this site yet. This is expected for an
                establishment-stage initiative. What we can show today is its programs, the people leading it,
                and the funding attached to the lead organisation. When the site publishes its own figures,
                each will appear here with its source.
              </p>
            </div>
          )}
        </section>

        {/* Funding vs detention */}
        {totalFunding > 0 ? (
          <section className="mt-12 rounded-[22px] border p-6 md:p-8" style={{ borderColor: C.border, background: C.panel }}>
            <SectionKicker>The ledger in plain view</SectionKicker>
            <div className="mt-4 grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                  Funding on record (lead organisation)
                </p>
                <p className="mt-2 text-3xl" style={{ ...serifDisplay, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {currency.format(totalFunding)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                  Cost of detaining one child for a year
                </p>
                <p className="mt-2 text-3xl" style={{ ...serifDisplay, color: '#9a3324', fontVariantNumeric: 'tabular-nums' }}>
                  {currency.format(DETENTION_COST_PER_CHILD)}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
                  ROGS 2026 national average
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                  Equivalent child-years of detention
                </p>
                <p className="mt-2 text-3xl" style={{ ...serifDisplay, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {childYears < 1 ? childYears.toFixed(2) : Math.round(childYears).toString()}
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-[12px] leading-5" style={{ color: C.muted }}>
              This is funding recorded against the lead organisation, not the site-specific federal
              allocation, which governments publish only as national envelopes. The comparison sets what a
              community receives against the price of a single cell, so the question moves from whether to
              fund the community to why we still fund the cell.
            </p>
            {funding.some((f) => f.source) ? (
              <ul className="mt-4 space-y-1.5">
                {funding.map((f, i) => (
                  <li key={`fund-${i}`} className="flex items-baseline justify-between gap-3 text-[13px]" style={{ color: C.body }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: C.ink }}>
                      {f.amountDollars != null ? currency.format(f.amountDollars) : 'Amount not recorded'}
                    </span>
                    {f.source ? <span className="text-right" style={{ color: C.muted }}>{f.source}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {/* Programs */}
        {(programNames.length > 0 || detail?.siteProgram || (detail?.programs?.length ?? 0) > 0) ? (
          <section className="mt-12">
            <SectionKicker>What runs here</SectionKicker>
            <h2 className="mt-3 text-4xl leading-none" style={serifDisplay}>
              Programs and approaches
            </h2>
            {detail?.siteProgram ? (
              <article className="mt-6 rounded-[18px] border p-5" style={{ borderColor: C.border, background: C.surface }}>
                <p className="text-lg leading-6" style={{ ...serifDisplay, color: C.ink }}>
                  {detail.siteProgram.name}
                </p>
                {detail.siteProgram.description ? (
                  <p className="mt-2 text-sm leading-6" style={{ color: C.body }}>
                    {detail.siteProgram.description}
                  </p>
                ) : null}
              </article>
            ) : null}
            {programNames.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {programNames.map((p, i) => (
                  <li key={`prog-${i}`} className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: C.borderWarm, color: C.body, background: C.surface }}>
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
            {(detail?.programs?.length ?? 0) > 0 ? (
              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                  The lead organisation also supports
                </p>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {detail!.programs.map((p, i) => (
                    <li key={`org-prog-${i}`} className="rounded-[16px] border p-4" style={{ borderColor: C.border, background: C.surface }}>
                      <p className="text-base leading-6" style={{ ...serifDisplay, color: C.ink }}>
                        {p.name}
                      </p>
                      {p.description ? (
                        <p className="mt-1.5 text-[13px] leading-5" style={{ color: C.body }}>
                          {p.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* People */}
        <section className="mt-12">
          <SectionKicker>The people</SectionKicker>
          <h2 className="mt-3 text-4xl leading-none" style={serifDisplay}>
            Who leads the work
          </h2>
          {people.length > 0 ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((p, i) => (
                <li key={`person-${i}`} className="rounded-[16px] border p-4" style={{ borderColor: C.border, background: C.surface }}>
                  <p className="text-lg leading-6" style={{ ...serifDisplay, color: C.ink }}>
                    {p.name}
                  </p>
                  <p className="mt-1 text-[13px] leading-5" style={{ color: C.body }}>
                    {p.role}
                  </p>
                  <Link href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-[11px] font-semibold" style={{ color: C.purple }}>
                    Source &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 max-w-3xl rounded-[16px] border px-5 py-4 text-sm leading-6" style={{ borderColor: C.borderWarm, background: C.panel, color: '#5e5145' }}>
              We do not name individuals here until the community chooses to. At remote and survivor-led sites,
              naming people without community sign-off, or where Sorry Business may apply, is unsafe. When the
              site claims this page, it decides who is named and how.
            </p>
          )}
        </section>

        {/* History */}
        {history.length > 0 ? (
          <section className="mt-12">
            <SectionKicker>The arc</SectionKicker>
            <h2 className="mt-3 text-4xl leading-none" style={serifDisplay}>
              How this site came to be
            </h2>
            <ol className="mt-8 space-y-0 border-l" style={{ borderColor: C.border }}>
              {history.map((h, i) => (
                <li key={`hist-${i}`} className="relative pb-8 pl-8 last:pb-0">
                  <span aria-hidden className="absolute left-[-7px] top-1.5 h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: C.cream, background: C.purple }} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: C.muted, fontFamily: MONO }}>
                    {h.year}
                  </p>
                  <p className="mt-1 max-w-3xl text-base leading-7" style={{ color: C.body }}>
                    {h.event}
                  </p>
                  <Link href={h.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-[11px] font-semibold" style={{ color: C.purple }}>
                    Source &rarr;
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* News */}
        {news.length > 0 ? (
          <section className="mt-12">
            <SectionKicker>In the record</SectionKicker>
            <h2 className="mt-3 text-4xl leading-none" style={serifDisplay}>
              News and reports
            </h2>
            <ul className="mt-6 space-y-3">
              {news.map((n, i) => (
                <li key={`news-${i}`} className="rounded-[16px] border p-4" style={{ borderColor: C.border, background: C.surface }}>
                  <Link href={n.url} target="_blank" rel="noopener noreferrer" className="text-base leading-6 font-medium" style={{ color: C.ink }}>
                    {n.title}
                  </Link>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted, fontFamily: MONO }}>
                    {[n.outlet, n.date].filter(Boolean).join('  ·  ')}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Related sites */}
        {relatedLinks.length > 0 ? (
          <section className="mt-12">
            <SectionKicker>The network</SectionKicker>
            <h2 className="mt-3 text-4xl leading-none" style={serifDisplay}>
              Connected sites
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {relatedLinks.map((r) => (
                <Link
                  key={r.slug}
                  href={`/communities/justice-reinvestment/${r.slug}`}
                  className="rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150"
                  style={{ borderColor: C.borderWarm, color: C.purple, background: C.surface }}
                >
                  {r.displayName} &rarr;
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Read-only / co-design note */}
        <section className="mt-14 rounded-[22px] border p-6 md:p-8" style={{ borderColor: C.borderWarm, background: C.panel }}>
          <SectionKicker>About this page</SectionKicker>
          <p className="mt-3 max-w-3xl text-base leading-7" style={{ color: C.body }}>
            This is a public record built from sources in the open, not yet a profile the community holds.
            {leadOrg ? ` ${leadOrg} is the editor of record once it claims this page.` : ''} When a site
            claims it, the community decides what the world sees, names its own people, and publishes its own
            figures. We can stage a page. The community publishes it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/communities" className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: C.purple, color: '#f1e6f7' }}>
              See the founding profiles &rarr;
            </Link>
            {detail?.orgSlug ? (
              <Link href={`/organizations/${detail.orgSlug}#claim-organization`} className="rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: C.borderWarm, color: C.body }}>
                Claim this site
              </Link>
            ) : null}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
