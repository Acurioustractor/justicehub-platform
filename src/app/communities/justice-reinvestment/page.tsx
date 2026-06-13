import { Metadata } from 'next';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ANCHOR_COMMUNITIES } from '@/lib/communities/anchors';
import {
  loadJusticeReinvestmentNetwork,
  loadJusticeReinvestmentSites,
  buildSiteEnrichmentIndex,
  buildSiteOrgIndex,
  loadJrConnectionIndex,
} from '@/lib/communities/justice-reinvestment';
import { serifDisplay } from '@/lib/communities/style';
import historyData from '@/data/justice-reinvestment/history.json';
import JRNetworkExplorer, {
  type EnrichedGroup,
} from './JRNetworkExplorer';
import JRSearchBar from './JRSearchBar';

export const revalidate = 300;
const JR_DATA_TIMEOUT_MS = 1800;

export const metadata: Metadata = {
  title: 'The justice reinvestment network | JusticeHub',
  description:
    'Every justice reinvestment initiative we can find, on one national map, grouped by place. An honest count, lead organisations named where known, and twenty years of the movement on one timeline.',
};

interface HistoryEntry {
  year: number;
  title: string;
  body: string;
  source_url: string;
}

async function withJrFallback<T>(query: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    query.catch(() => fallback),
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), JR_DATA_TIMEOUT_MS);
    }),
  ]);
}

function buildFallbackGroups(sites: ReturnType<typeof loadJusticeReinvestmentSites>): EnrichedGroup[] {
  const stateLabels: Record<string, string> = {
    NSW: 'New South Wales',
    NT: 'Northern Territory',
    QLD: 'Queensland',
    SA: 'South Australia',
    WA: 'Western Australia',
    VIC: 'Victoria',
    ACT: 'Australian Capital Territory',
    TAS: 'Tasmania',
    National: 'National',
  };
  const order = ['NSW', 'NT', 'QLD', 'SA', 'WA', 'VIC', 'ACT', 'TAS', 'National'];
  const buckets = new Map<string, EnrichedGroup['initiatives']>();

  sites.forEach((site) => {
    const key = site.state || 'National';
    const list = buckets.get(key) ?? [];
    list.push({
      id: site.matchName,
      name: site.displayName,
      verificationStatus: 'verified',
      orgName: site.org,
      state: site.state,
      isIndigenousOrg: false,
      website: site.website,
      blurb: site.blurb,
      siteSlug: site.siteSlug,
    });
    buckets.set(key, list);
  });

  return order
    .filter((key) => buckets.has(key))
    .map((key) => ({
      key,
      label: stateLabels[key] || key,
      initiatives: buckets.get(key) || [],
    }));
}

export default async function JusticeReinvestmentNetworkPage() {
  const sites = loadJusticeReinvestmentSites();
  const fallbackGroups = buildFallbackGroups(sites);
  const fallbackCounts = {
    total: sites.length,
    withLeadOrg: sites.filter((site) => site.org).length,
    states: new Set(sites.map((site) => site.state)).size,
    placeToConfirm: 0,
    communityVerified: 0,
  };
  const [
    { groups, counts },
    detailIndex,
  ] = await Promise.all([
    withJrFallback(loadJusticeReinvestmentNetwork(), {
      initiatives: [],
      groups: fallbackGroups,
      counts: fallbackCounts,
    }),
    withJrFallback(buildSiteOrgIndex(sites), {}),
  ]);
  const enrichmentIndex = buildSiteEnrichmentIndex(sites);

  // Per-site organisation detail for the full-screen sidebar, loaded once on
  // the server. The optional curated connections layer is omitted silently when
  // its data file is absent.
  const connectionIndex = loadJrConnectionIndex();

  // Honest count for the hero: curated sites on the map (34 today).
  const placedSites = sites.filter((s) => s.lat !== null && s.lng !== null);
  const siteStates = new Set(placedSites.map((s) => s.state));

  // Resolve a DB row to its per-site page slug by matching the row name against
  // a curated site's match_name or display name.
  const slugByName = new Map<string, string>();
  sites.forEach((site) => {
    slugByName.set(site.matchName.trim().toLowerCase(), site.siteSlug);
    slugByName.set(site.displayName.trim().toLowerCase(), site.siteSlug);
  });

  // Enrich each DB list row with a curated website + blurb when the name matches.
  const enrichedGroups: EnrichedGroup[] = groups.map((group) => ({
    ...group,
    initiatives: group.initiatives.map((initiative) => {
      const key = initiative.name.trim().toLowerCase();
      const enrichment = enrichmentIndex.get(key);
      return {
        ...initiative,
        website: enrichment?.website ?? null,
        blurb: enrichment?.blurb ?? null,
        siteSlug: slugByName.get(key) ?? null,
      };
    }),
  }));

  const history = (historyData as { timeline: HistoryEntry[] }).timeline;

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#2b2530]">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#4a2560] text-[#f1e6f7]">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d7c2e3]">
            The Network
          </p>
          <h1
            className="mt-5 max-w-4xl text-5xl leading-none md:text-6xl"
            style={serifDisplay}
          >
            The justice reinvestment movement, seeing itself on one map
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-7 text-[#eadff2]">
            A movement is easier to fund and harder to ignore once it can see its
            own shape. Here is every justice reinvestment site we have been able
            to place, grouped by the Country it serves, with the lead
            organisation named wherever the record holds one.
          </p>

          <dl className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
            <div className="rounded-[18px] border border-[#6a4a82] bg-[#3c1d53] px-5 py-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cbb1dc]">
                Sites on the map
              </dt>
              <dd className="mt-2 text-4xl" style={serifDisplay}>
                {placedSites.length}
              </dd>
            </div>
            <div className="rounded-[18px] border border-[#6a4a82] bg-[#3c1d53] px-5 py-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cbb1dc]">
                Records in the database
              </dt>
              <dd className="mt-2 text-4xl" style={serifDisplay}>
                {counts.total}
              </dd>
            </div>
            <div className="rounded-[18px] border border-[#6a4a82] bg-[#3c1d53] px-5 py-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cbb1dc]">
                States and territories
              </dt>
              <dd className="mt-2 text-4xl" style={serifDisplay}>
                {siteStates.size}
              </dd>
            </div>
          </dl>

          <p className="mt-6 max-w-2xl text-sm leading-6 text-[#d7c2e3]">
            These numbers are what the public record shows today, not the whole
            movement. Where a place or a lead organisation is missing, we say so
            and ask the network to fill it in.
          </p>
        </div>
      </section>

      {/* Cross-site search */}
      <JRSearchBar />

      {/* History timeline */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
          The arc
        </p>
        <h2 className="mt-3 text-5xl leading-none" style={serifDisplay}>
          Twenty years of justice reinvestment
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#584b40]">
          From a concept named in 2003 to a national tender in 2026, the idea
          travelled from the page to the Country it now serves. Each step below
          carries the source that records it.
        </p>

        <ol className="mt-12 space-y-0 border-l border-[#e2d3bd]">
          {history.map((entry, index) => (
            <li
              key={`${entry.year}-${index}`}
              className="relative pl-8 pb-10 last:pb-0"
            >
              <span
                aria-hidden
                className="absolute left-[-7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#f8f1e6] bg-[#4a2560]"
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6a44]">
                {entry.year}
              </p>
              <h3
                className="mt-1 text-2xl leading-7"
                style={serifDisplay}
              >
                {entry.title}
              </h3>
              <p className="mt-2 max-w-3xl text-base leading-7 text-[#584b40]">
                {entry.body}
              </p>
              <Link
                href={entry.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-xs font-semibold text-[#4a2560]"
              >
                Read the source &rarr;
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Map + state filter + enriched, state-grouped list */}
      <JRNetworkExplorer
        sites={sites}
        groups={enrichedGroups}
        detailIndex={detailIndex}
        connectionIndex={connectionIndex}
      />

      {/* From data to network */}
      <section className="border-t border-[#eadfce] bg-[#faf5ec]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d6a44]">
            What this becomes
          </p>
          <h2 className="mt-3 text-5xl leading-none" style={serifDisplay}>
            From data to network
          </h2>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-2xl leading-7" style={serifDisplay}>
                Profiles the community holds
              </h3>
              <p className="mt-3 text-base leading-7 text-[#584b40]">
                Today each line is a record we hold. Next it becomes a profile
                the organisation owns and edits, where the community decides what
                the world may see. We can stage a page; they publish it. See the{' '}
                <Link
                  href="/communities"
                  className="font-medium text-[#4a2560] underline decoration-[#c9add8] underline-offset-2"
                >
                  founding action-profiles
                </Link>{' '}
                for how that works.
              </p>
            </div>

            <div>
              <h3 className="text-2xl leading-7" style={serifDisplay}>
                Evidence beside detention costs
              </h3>
              <p className="mt-3 text-base leading-7 text-[#584b40]">
                A profile carries what a program runs and what it costs, set
                against the price of detaining a child for a year. When the
                ledger sits in plain view, the question stops being whether to
                fund the community and starts being why we still fund the cell.
              </p>
            </div>

            <div>
              <h3 className="text-2xl leading-7" style={serifDisplay}>
                The law reform case
              </h3>
              <p className="mt-3 text-base leading-7 text-[#584b40]">
                One site proves a model. Many sites, read together, become an
                argument a parliament cannot wave away. The map is how the
                movement makes that argument site by site, in its own words, with
                its own evidence.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-[22px] border border-[#e6d7c1] bg-[#f3eadb] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d5f3d]">
              The four founding profiles
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5e5145]">
              Four communities are shaping the profile with us before anyone else
              is listed. Each is the editor of record for its own page.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {ANCHOR_COMMUNITIES.map((anchor) => (
                <Link
                  key={anchor.slug}
                  href={`/communities/${anchor.slug}`}
                  className="rounded-full border border-[#dbc7a9] bg-[#fffaf3] px-4 py-2 text-sm font-medium text-[#6e5a42] transition-colors duration-150 hover:border-[#c9a877]"
                >
                  {anchor.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
