import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ArrowRight, Compass, MapPinned, Navigation, Search } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { bucketJurisdiction, compareRegions } from '@/lib/justice-matrix/jurisdiction';
import { precisionLabel, resolveMatrixGeo } from '@/lib/justice-matrix/geo';
import { MatrixFlowNav } from '../_components/MatrixFlowNav';
import JusticeMatrixMapClient, {
  type MatrixMapFacetSeed,
  type MatrixMapRecord,
  type MatrixMapSurface,
} from './JusticeMatrixMapClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Map · Justice Matrix',
  description:
    'Search the Justice Matrix on a live world map across cases, campaigns, and consent-gated youth-justice evidence.',
};

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const C = {
  page: '#fafafa',
  surface: '#ffffff',
  border: '#e4e4e7',
  ink: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  accent: '#4a2560',
  teal: '#1f6f78',
  amber: '#a96a1c',
  gold: '#d3b583',
  dark: '#1c1420',
};

interface CaseRow {
  id: string;
  case_citation: string | null;
  jurisdiction: string | null;
  year: number | null;
  court: string | null;
  strategic_issue: string | null;
  key_holding: string | null;
  region: string | null;
  country_code: string | null;
  categories: string[] | null;
  outcome: string | null;
  precedent_strength: string | null;
  case_type: string | null;
  authoritative_link: string | null;
  verified: boolean | null;
  human_confirmed: boolean | null;
  lat: number | string | null;
  lng: number | string | null;
}

interface CampaignRow {
  id: string;
  campaign_name: string | null;
  country_region: string | null;
  start_year: number | null;
  end_year: number | null;
  is_ongoing: boolean | null;
  goals: string | null;
  notable_tactics: string | null;
  country_code: string | null;
  categories: string[] | null;
  lead_organizations: string | null;
  campaign_link: string | null;
  lat: number | string | null;
  lng: number | string | null;
}

interface EvidenceRow {
  id: string;
  title: string | null;
  evidence_type: string | null;
  findings: string | null;
  methodology: string | null;
  organization: string | null;
  author: string | null;
  publication_date: string | null;
  consent_level: string | null;
  cultural_safety: string | null;
}

function clean(value: string | null | undefined, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function truncate(value: string | null | undefined, max = 260): string | null {
  const text = clean(value);
  if (!text) return null;
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}...`;
}

function yearFromDate(value: string | null): number | null {
  if (!value) return null;
  const year = new Date(value).getUTCFullYear();
  return Number.isFinite(year) ? year : null;
}

function surfaceFor(kind: MatrixMapRecord['kind'], title: string, excerpt: string | null, categories: string[], geoText: string): MatrixMapSurface {
  if (kind === 'evidence') return 'youth';
  const haystack = `${title} ${excerpt ?? ''} ${categories.join(' ')} ${geoText}`.toLowerCase();
  if (
    categories.some((c) =>
      [
        'refugee',
        'asylum',
        'non-refoulement',
        'refugee-protection',
        'asylum-seekers',
        'offshore-detention',
        'immigration-detention',
      ].includes(c),
    ) ||
    /\b(refugee|asylum|non-refoulement|immigration detention|offshore detention)\b/.test(haystack)
  ) {
    return 'refugee';
  }
  if (
    categories.some((c) =>
      ['youth-justice', 'children', 'child-rights', 'raise-the-age', 'justice-reinvestment', 'detention-conditions'].includes(c),
    ) ||
    /\b(youth justice|children|child rights|raise the age|young people|detention)\b/.test(haystack)
  ) {
    return 'youth';
  }
  return 'general';
}

async function loadMapData(): Promise<{ records: MatrixMapRecord[]; facets: MatrixMapFacetSeed }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  const [caseRes, campaignRes, evidenceRes] = await Promise.all([
    supabase
      .from('justice_matrix_cases')
      .select(
        'id,case_citation,jurisdiction,year,court,strategic_issue,key_holding,region,country_code,categories,outcome,precedent_strength,case_type,authoritative_link,verified,human_confirmed,lat,lng',
      )
      .order('year', { ascending: false, nullsFirst: false })
      .limit(700),
    supabase
      .from('justice_matrix_campaigns')
      .select(
        'id,campaign_name,country_region,start_year,end_year,is_ongoing,goals,notable_tactics,country_code,categories,lead_organizations,campaign_link,lat,lng',
      )
      .order('start_year', { ascending: false, nullsFirst: false })
      .limit(300),
    supabase
      .from('alma_evidence')
      .select(
        'id,title,evidence_type,findings,methodology,organization,author,publication_date,consent_level,cultural_safety',
      )
      .in('consent_level', ['Public Knowledge Commons', 'Community Controlled'])
      .order('publication_date', { ascending: false, nullsFirst: false })
      .limit(700),
  ]);

  const records: MatrixMapRecord[] = [];
  let unmappedCount = 0;
  let recordedCount = 0;
  const categoryCounts = new Map<string, number>();
  const regionSet = new Set<string>();

  function addRecord(record: MatrixMapRecord) {
    records.push(record);
    regionSet.add(record.region);
    for (const category of record.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
    if (record.precision === 'recorded') recordedCount += 1;
  }

  for (const row of (caseRes.data ?? []) as CaseRow[]) {
    const title = clean(row.case_citation, 'Untitled case');
    const geoText = clean(row.jurisdiction ?? row.region, 'Unknown jurisdiction');
    const geo = resolveMatrixGeo({ raw: geoText, countryCode: row.country_code, lat: row.lat, lng: row.lng });
    if (!geo) {
      unmappedCount += 1;
      continue;
    }
    const categories = row.categories ?? [];
    const bucket = bucketJurisdiction(geoText);
    const excerpt = truncate(row.strategic_issue ?? row.key_holding);
    addRecord({
      id: row.id,
      kind: 'case',
      title,
      href: `/justice-matrix/cases/${row.id}`,
      year: row.year ?? null,
      status: row.outcome ?? row.precedent_strength ?? row.case_type ?? null,
      geoText,
      region: row.region ?? bucket.region,
      countryCode: row.country_code ?? null,
      lat: geo.lat,
      lng: geo.lng,
      precision: geo.precision,
      precisionLabel: precisionLabel(geo.precision),
      geoLabel: geo.label,
      geoReason: geo.reason,
      categories,
      surface: surfaceFor('case', title, excerpt, categories, geoText),
      excerpt,
      source: row.court ?? row.authoritative_link ?? null,
      verified: row.verified === true,
      humanConfirmed: row.human_confirmed === true,
    });
  }

  for (const row of (campaignRes.data ?? []) as CampaignRow[]) {
    const title = clean(row.campaign_name, 'Untitled campaign');
    const geoText = clean(row.country_region, 'Unknown region');
    const geo = resolveMatrixGeo({ raw: geoText, countryCode: row.country_code, lat: row.lat, lng: row.lng });
    if (!geo) {
      unmappedCount += 1;
      continue;
    }
    const categories = row.categories ?? [];
    const bucket = bucketJurisdiction(geoText);
    const excerpt = truncate(row.goals ?? row.notable_tactics);
    addRecord({
      id: row.id,
      kind: 'campaign',
      title,
      href: `/justice-matrix/campaigns/${row.id}`,
      year: row.start_year ?? row.end_year ?? null,
      status: row.is_ongoing ? 'active' : row.end_year ? 'concluded' : null,
      geoText,
      region: bucket.region === 'Other' ? geo.label : bucket.region,
      countryCode: row.country_code ?? null,
      lat: geo.lat,
      lng: geo.lng,
      precision: geo.precision,
      precisionLabel: precisionLabel(geo.precision),
      geoLabel: geo.label,
      geoReason: geo.reason,
      categories,
      surface: surfaceFor('campaign', title, excerpt, categories, geoText),
      excerpt,
      source: row.lead_organizations ?? row.campaign_link ?? null,
      verified: null,
      humanConfirmed: null,
    });
  }

  for (const row of (evidenceRes.data ?? []) as EvidenceRow[]) {
    const title = clean(row.title, 'Untitled evidence');
    const restricted = row.consent_level === 'Community Controlled';
    const excerpt = restricted ? null : truncate(row.findings ?? row.methodology);
    const geo = resolveMatrixGeo({ raw: 'Australia', countryCode: 'AU' });
    if (!geo) {
      unmappedCount += 1;
      continue;
    }
    const categories = ['youth-justice', 'evidence'];
    addRecord({
      id: row.id,
      kind: 'evidence',
      title,
      href: `/justice-matrix/evidence/${row.id}`,
      year: yearFromDate(row.publication_date),
      status: row.evidence_type ?? row.consent_level ?? null,
      geoText: 'Australia (ALMA evidence corpus)',
      region: 'Australia',
      countryCode: 'AU',
      lat: geo.lat,
      lng: geo.lng,
      precision: geo.precision,
      precisionLabel: precisionLabel(geo.precision),
      geoLabel: geo.label,
      geoReason: 'ALMA evidence is currently Australia-scoped; precise study geographies are not exposed here.',
      categories,
      surface: 'youth',
      excerpt,
      source: row.organization ?? row.author ?? row.cultural_safety ?? null,
      verified: null,
      humanConfirmed: null,
    });
  }

  const sortedRecords = records.sort((a, b) => {
    const yearDiff = (b.year ?? 0) - (a.year ?? 0);
    if (yearDiff !== 0) return yearDiff;
    return a.title.localeCompare(b.title);
  });

  return {
    records: sortedRecords,
    facets: {
      categories: Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 24),
      regions: Array.from(regionSet).sort(compareRegions),
      totals: {
        case: sortedRecords.filter((r) => r.kind === 'case').length,
        campaign: sortedRecords.filter((r) => r.kind === 'campaign').length,
        evidence: sortedRecords.filter((r) => r.kind === 'evidence').length,
      },
      mappedCount: sortedRecords.length,
      unmappedCount,
      recordedCount,
      inferredCount: sortedRecords.length - recordedCount,
    },
  };
}

export default async function JusticeMatrixMapPage() {
  const { records, facets } = await loadMapData();
  const total = facets.mappedCount + facets.unmappedCount;

  return (
    <main className="min-h-screen" style={{ background: C.page, color: C.ink, fontFamily: SANS }}>
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: C.border, background: 'linear-gradient(135deg, #1c1420 0%, #2f1d38 44%, #123f45 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
          <Link
            href="/justice-matrix"
            className="mb-5 inline-flex items-center gap-2 uppercase"
            style={{ color: C.gold, fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em' }}
          >
            <Compass className="h-4 w-4" />
            Justice Matrix
          </Link>
          <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-2" style={{ color: C.gold }}>
                <MapPinned className="h-5 w-5" />
                <span className="uppercase" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em' }}>
                  Global map
                </span>
              </div>
              <h1 className="mb-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
                Search the matrix by place, pattern, and movement.
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 md:text-base" style={{ color: '#d9cbe3' }}>
                A live atlas across cases, campaigns, and consent-gated youth-justice evidence. Stored GPS points are
                used where the database has them; the rest are clearly labelled jurisdiction centroids.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <HeroLink href="/justice-matrix/explore">Open Explore</HeroLink>
                <HeroLink href="/justice-matrix/ask">Ask the Matrix</HeroLink>
                <HeroLink href="/justice-network/youth-remand">Youth remand scenario</HeroLink>
              </div>
            </div>
            <aside
              className="rounded-lg border p-4"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#e8ddec' }}
            >
              <div className="mb-3 flex items-center gap-2 font-semibold text-white">
                <Navigation className="h-4 w-4" />
                Map coverage
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric value={facets.mappedCount} label={`mapped of ${total.toLocaleString()}`} />
                <Metric value={facets.recordedCount} label="recorded GPS" />
                <Metric value={facets.totals.case} label="cases" />
                <Metric value={facets.totals.campaign + facets.totals.evidence} label="movement + evidence" />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <MatrixFlowNav active="map" />

      <section className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border p-4" style={{ background: C.surface, borderColor: C.border }}>
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Search className="h-4 w-4" style={{ color: C.accent }} />
              Search works across every mapped record.
            </div>
            <p className="text-[14px] leading-6" style={{ color: C.body }}>
              Filter by type, surface, region, category, active campaign, verified case, or recorded GPS. Click a marker
              to open the profile, or use the list when the map is dense.
            </p>
          </div>
          <div className="rounded-lg border p-4" style={{ background: '#fff8ef', borderColor: '#eadbc5' }}>
            <div className="mb-2 font-semibold" style={{ color: C.dark }}>
              Coordinate honesty
            </div>
            <p className="text-[13px] leading-6" style={{ color: C.body }}>
              Most records carry jurisdiction text, not street addresses. The map keeps those points visible while
              labelling their precision so research users do not over-read location accuracy.
            </p>
          </div>
        </div>

        <JusticeMatrixMapClient records={records} facets={facets} />
      </section>
    </main>
  );
}

function HeroLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold"
      style={{ background: C.gold, color: C.dark }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-md px-3 py-3" style={{ background: 'rgba(255,255,255,0.10)' }}>
      <div className="text-2xl font-semibold text-white">{value.toLocaleString()}</div>
      <div className="uppercase" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: '#d9cbe3' }}>
        {label}
      </div>
    </div>
  );
}
