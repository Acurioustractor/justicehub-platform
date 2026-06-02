import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  DollarSign,
  GitBranch,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createServiceClient, type LooseSupabaseClient } from '@/lib/supabase/service-lite';
import { fmt } from '@/lib/format';
import { RecordTrustBadges } from '@/components/trust/RecordTrustBadges';
import { getFeaturedDirectoryOrganizations, type DirectoryOrgSummary } from '@/lib/directory/org-dossier';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'JusticeHub Directory — Australian justice and community support records',
  description:
    'Search the JusticeHub Directory for Australian justice and community organisations, services, programs, grants, funding records, and source coverage.',
};

type CountResult = {
  value: number | null;
  error?: string;
};

type CountError = {
  message?: string;
};

type FundingTotal = {
  dollars: number | null;
  records: number | null;
  error?: string;
};

type DirectoryData = {
  services: CountResult;
  servicesSourceLinked: CountResult;
  programs: CountResult;
  evidenceRatedPrograms: CountResult;
  costedPrograms: CountResult;
  organizations: CountResult;
  organizationsWithAbn: CountResult;
  organizationsWithGrantScope: CountResult;
  verifiedOrganizations: CountResult;
  funding: FundingTotal;
  grantOpportunities: CountResult;
  openGrantOpportunities: CountResult;
  civicGraphEntities: CountResult;
  civicGraphRelationships: CountResult;
  acncCharities: CountResult;
  foundations: CountResult;
  featuredOrganizations: DirectoryOrgSummary[];
  generatedAt: string;
};

const entryPoints = [
  {
    label: 'Find support',
    body: 'Services, legal help, crisis support, housing, mentoring, family support, and local pathways.',
    href: '/services',
    icon: HeartHandshake,
    action: 'Search services',
  },
  {
    label: 'Find alternatives',
    body: 'Community models and practical alternatives to detention, with evidence and review labels.',
    href: '/community-programs',
    icon: Sparkles,
    action: 'Browse programs',
  },
  {
    label: 'Find organisations',
    body: 'Public organisation records linked where possible to ABN, CivicGraph, GrantScope, programs, and funding.',
    href: '/organizations',
    icon: Building2,
    action: 'Open org directory',
  },
  {
    label: 'Find grants',
    body: 'Open grant opportunities and funder pathways. Treat this as discovery, then check the source before applying.',
    href: '/grants',
    icon: DollarSign,
    action: 'Search grants',
  },
  {
    label: 'Follow funding',
    body: 'Historical funding and spending records so people can see where money is already going.',
    href: '/justice-funding',
    icon: GitBranch,
    action: 'Open funding records',
  },
  {
    label: 'Add missing work',
    body: 'Tell JusticeHub about a missing organisation, service, program, model, grant, or source.',
    href: '/join',
    icon: ClipboardCheck,
    action: 'Submit a record',
  },
];

const trustLevels = [
  {
    title: 'Discovery record',
    body: 'Useful lead. It may be scraped, imported, or suggested. It should not be treated as a recommendation yet.',
    badges: [{ label: 'Needs review', tone: 'review' as const }, { label: 'Untested', tone: 'warning' as const }],
  },
  {
    title: 'Source-linked record',
    body: 'A public source, data portal, website, registry, or source URL is attached so the claim can be checked.',
    badges: [{ label: 'Source linked', tone: 'source' as const }, { label: 'Local', tone: 'neutral' as const }],
  },
  {
    title: 'Human or community checked',
    body: 'A reviewer, organisation, or community partner has confirmed the record or part of the record.',
    badges: [{ label: 'Human verified', tone: 'strong' as const }, { label: 'Community verified', tone: 'community' as const }],
  },
];

function zeroCount(): CountResult {
  return { value: 0 };
}

async function safeCount(
  label: string,
  query: PromiseLike<{ count: number | null; error: CountError | null }>,
): Promise<CountResult> {
  try {
    const { count, error } = await query;
    if (error) {
      console.error(`[directory] ${label}:`, error);
      return { value: null, error: error.message || 'Count unavailable' };
    }
    return { value: count ?? 0 };
  } catch (error) {
    console.error(`[directory] ${label}:`, error);
    return { value: null, error: error instanceof Error ? error.message : 'Count unavailable' };
  }
}

async function getFundingTotal(service: LooseSupabaseClient): Promise<FundingTotal> {
  try {
    const { data, error } = await service.rpc('get_funding_total').single();
    if (error) {
      console.error('[directory] get_funding_total:', error);
      return { dollars: null, records: null, error: error.message || 'Funding RPC unavailable' };
    }
    return {
      dollars: data?.total_dollars ? Number(data.total_dollars) : null,
      records: data?.grant_count ? Number(data.grant_count) : null,
    };
  } catch (error) {
    console.error('[directory] get_funding_total:', error);
    return {
      dollars: null,
      records: null,
      error: error instanceof Error ? error.message : 'Funding RPC unavailable',
    };
  }
}

async function getDirectoryData(): Promise<DirectoryData> {
  const service = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    services,
    servicesSourceLinked,
    programs,
    evidenceRatedPrograms,
    costedPrograms,
    organizations,
    organizationsWithAbn,
    organizationsWithGrantScope,
    verifiedOrganizations,
    funding,
    grantOpportunities,
    openGrantOpportunities,
    civicGraphEntities,
    civicGraphRelationships,
    acncCharities,
    foundations,
    featuredOrganizations,
  ] = await Promise.all([
    safeCount(
      'services.active',
      service.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ),
    safeCount(
      'services.source_linked',
      service
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('data_source_url', 'is', null),
    ),
    safeCount(
      'alma_interventions.catalogue',
      service
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true })
        .neq('verification_status', 'ai_generated'),
    ),
    safeCount(
      'alma_interventions.evidence_rated',
      service
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true })
        .neq('verification_status', 'ai_generated')
        .neq('evidence_level', 'Untested (theory/pilot stage)'),
    ),
    safeCount(
      'alma_interventions.cost_data',
      service
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true })
        .neq('verification_status', 'ai_generated')
        .not('cost_per_young_person', 'is', null)
        .gt('cost_per_young_person', 0),
    ),
    safeCount(
      'organizations.active',
      service.from('organizations').select('id', { count: 'planned', head: true }).eq('is_active', true),
    ),
    safeCount(
      'organizations.abn',
      service
        .from('organizations')
        .select('id', { count: 'planned', head: true })
        .eq('is_active', true)
        .not('abn', 'is', null),
    ),
    safeCount(
      'organizations.gs_entity_id',
      service
        .from('organizations')
        .select('id', { count: 'planned', head: true })
        .eq('is_active', true)
        .not('gs_entity_id', 'is', null),
    ),
    safeCount(
      'organizations.verified',
      service
        .from('organizations')
        .select('id', { count: 'planned', head: true })
        .eq('is_active', true)
        .in('verification_status', ['verified', 'acnc_verified']),
    ),
    getFundingTotal(service),
    safeCount('grant_opportunities.total', service.from('grant_opportunities').select('id', { count: 'planned', head: true })),
    safeCount(
      'grant_opportunities.open',
      service
        .from('grant_opportunities')
        .select('id', { count: 'planned', head: true })
        .gte('closes_at', today),
    ),
    safeCount('gs_entities.total', service.from('gs_entities').select('id', { count: 'planned', head: true })),
    safeCount('gs_relationships.total', service.from('gs_relationships').select('id', { count: 'planned', head: true })),
    safeCount('acnc_charities.total', service.from('acnc_charities').select('abn', { count: 'planned', head: true })),
    safeCount('foundations.total', service.from('foundations').select('id', { count: 'planned', head: true })),
    getFeaturedDirectoryOrganizations(4),
  ]);

  return {
    services: services || zeroCount(),
    servicesSourceLinked: servicesSourceLinked || zeroCount(),
    programs: programs || zeroCount(),
    evidenceRatedPrograms: evidenceRatedPrograms || zeroCount(),
    costedPrograms: costedPrograms || zeroCount(),
    organizations: organizations || zeroCount(),
    organizationsWithAbn: organizationsWithAbn || zeroCount(),
    organizationsWithGrantScope: organizationsWithGrantScope || zeroCount(),
    verifiedOrganizations: verifiedOrganizations || zeroCount(),
    funding,
    grantOpportunities: grantOpportunities || zeroCount(),
    openGrantOpportunities: openGrantOpportunities || zeroCount(),
    civicGraphEntities: civicGraphEntities || zeroCount(),
    civicGraphRelationships: civicGraphRelationships || zeroCount(),
    acncCharities: acncCharities || zeroCount(),
    foundations: foundations || zeroCount(),
    featuredOrganizations,
    generatedAt: new Date().toISOString(),
  };
}

function countLabel(count: CountResult, fallback = 'Source check') {
  return count.value === null ? fallback : count.value.toLocaleString();
}

function compactCount(count: CountResult, fallback = 'Check') {
  if (count.value === null) return fallback;
  if (count.value >= 1_000_000) return `${(count.value / 1_000_000).toFixed(1)}M`;
  if (count.value >= 1_000) return `${Math.round(count.value / 1_000).toLocaleString()}K`;
  return count.value.toLocaleString();
}

function moneyLabel(value: number | null) {
  return value === null ? 'Source check' : fmt(value);
}

function pct(part: CountResult, total: CountResult) {
  if (part.value === null || total.value === null || total.value === 0) return 'Source check';
  return `${Math.round((part.value / total.value) * 100)}%`;
}

export default async function DirectoryPage() {
  const data = await getDirectoryData();

  const headlineStats = [
    {
      label: 'Support records',
      value: countLabel(data.services),
      detail: `${countLabel(data.servicesSourceLinked)} source-linked`,
      tone: 'text-emerald-700',
    },
    {
      label: 'Community models',
      value: countLabel(data.programs),
      detail: `${countLabel(data.evidenceRatedPrograms)} with evidence signal`,
      tone: 'text-purple-700',
    },
    {
      label: 'Organisations',
      value: countLabel(data.organizations),
      detail: `${countLabel(data.organizationsWithAbn)} ABN-backed`,
      tone: 'text-stone-900',
    },
    {
      label: 'Funding tracked',
      value: moneyLabel(data.funding.dollars),
      detail: data.funding.records === null ? 'Records under source check' : `${data.funding.records.toLocaleString()} records`,
      tone: 'text-red-700',
    },
  ];

  const coverageRows = [
    {
      area: 'Services and support',
      count: countLabel(data.services),
      source: 'JusticeHub services table and source-linked service records',
      status: `${pct(data.servicesSourceLinked, data.services)} source-linked`,
      route: '/services',
    },
    {
      area: 'Community programs and alternatives',
      count: countLabel(data.programs),
      source: 'ALMA interventions, program catalogue, evidence links, cost metadata',
      status: `${countLabel(data.costedPrograms)} with cost data`,
      route: '/community-programs',
    },
    {
      area: 'Organisations',
      count: countLabel(data.organizations),
      source: 'JusticeHub organisations bridged where possible to ABN and GrantScope/CivicGraph',
      status: `${countLabel(data.organizationsWithGrantScope)} CivicGraph-linked`,
      route: '/organizations',
    },
    {
      area: 'Funding history',
      count: data.funding.records === null ? 'Source check' : data.funding.records.toLocaleString(),
      source: 'Justice funding records and public funding datasets',
      status: `${moneyLabel(data.funding.dollars)} currently aggregated`,
      route: '/justice-funding',
    },
    {
      area: 'Open grants',
      count: countLabel(data.openGrantOpportunities),
      source: 'GrantScope grant opportunity sources and current close dates',
      status: `${countLabel(data.grantOpportunities)} total opportunities indexed`,
      route: '/grants',
    },
    {
      area: 'CivicGraph backbone',
      count: countLabel(data.civicGraphEntities),
      source: 'GrantScope entities, relationships, ACNC, public registries, and graph links',
      status: `${compactCount(data.civicGraphRelationships)} relationships tracked`,
      route: '/organizations',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        <section className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.15fr_0.85fr] md:px-10 lg:px-12">
            <div>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#F97316]">
                JusticeHub Directory
              </p>
              <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-tight md:text-6xl">
                One public place to find Australian justice and community support.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/70 md:text-lg">
                Search organisations, services, programs, funding records, grants, and source trails.
                This is a live catalogue, not an endorsement list. The point is to make the work findable,
                show where it came from, and mark what still needs checking.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-white/90"
                >
                  Search support <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/grants"
                  className="inline-flex items-center gap-2 rounded-md bg-[#DC2626] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#B91C1C]"
                >
                  Find grants <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/directory/methodology"
                  className="inline-flex items-center gap-2 rounded-md border border-white/25 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  How coverage works
                </Link>
              </div>
            </div>

            <aside className="rounded-lg border border-white/15 bg-white/8 p-5">
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.24em] text-white/50">
                Trust model
              </p>
              <div className="space-y-4">
                {trustLevels.map((level) => (
                  <div key={level.title} className="rounded-md border border-white/10 bg-white/5 p-4">
                    <RecordTrustBadges
                      showReview={false}
                      extraBadges={level.badges}
                      badgeClassName="bg-white"
                    />
                    <h2 className="mt-3 text-base font-bold text-white">{level.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-white/60">{level.body}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-white">
          <div className="mx-auto grid max-w-7xl gap-px bg-[#0A0A0A] sm:grid-cols-2 lg:grid-cols-4">
            {headlineStats.map((stat) => (
              <div key={stat.label} className="bg-white px-6 py-7">
                <p className={`text-3xl font-black ${stat.tone}`}>{stat.value}</p>
                <p className="mt-2 text-sm font-bold">{stat.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#0A0A0A]/55">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#F5F0E8]">
          <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 lg:px-12">
            <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#0A0A0A]/45">
                  Start here
                </p>
                <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
                  Six doors into the same public record.
                </h2>
              </div>
              <Link
                href="/join"
                className="inline-flex w-fit items-center gap-2 rounded-md border border-[#0A0A0A] bg-white px-4 py-3 text-sm font-bold transition-colors hover:bg-[#0A0A0A] hover:text-white"
              >
                Missing something? Add it <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {entryPoints.map((entry) => {
                const Icon = entry.icon;
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className="group rounded-lg border border-[#D8D0C6] bg-white p-5 transition-colors hover:border-[#0A0A0A] hover:bg-[#FBFAF7]"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#0A0A0A] text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <ArrowRight className="h-5 w-5 text-[#0A0A0A]/35 transition-transform group-hover:translate-x-1 group-hover:text-[#0A0A0A]" />
                    </div>
                    <h3 className="text-xl font-black">{entry.label}</h3>
                    <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-[#0A0A0A]/65">{entry.body}</p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#DC2626]">{entry.action}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 lg:px-12">
            <div className="mb-8 max-w-3xl">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#0A0A0A]/45">
                Coverage ledger
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
                The honest path to becoming the one list.
              </h2>
              <p className="mt-3 text-base leading-7 text-[#0A0A0A]/65">
                A reputable national list is built by tracking source coverage, not pretending every
                scraped record is verified. Each row below shows what is already live and what still
                needs deeper review.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#0A0A0A]">
              <div className="grid bg-[#0A0A0A] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white md:grid-cols-[1fr_0.7fr_1.4fr_1fr_0.45fr]">
                <span>Area</span>
                <span className="hidden md:block">Count</span>
                <span className="hidden md:block">Source base</span>
                <span className="hidden md:block">Current status</span>
                <span className="hidden md:block">Open</span>
              </div>
              {coverageRows.map((row) => (
                <div
                  key={row.area}
                  className="grid gap-3 border-t border-[#0A0A0A]/12 bg-white px-4 py-4 text-sm md:grid-cols-[1fr_0.7fr_1.4fr_1fr_0.45fr] md:items-center"
                >
                  <div>
                    <p className="font-bold">{row.area}</p>
                    <p className="mt-1 text-xs text-[#0A0A0A]/50 md:hidden">{row.count} · {row.status}</p>
                  </div>
                  <p className="hidden font-mono text-xs font-bold md:block">{row.count}</p>
                  <p className="text-sm leading-6 text-[#0A0A0A]/65">{row.source}</p>
                  <p className="text-sm leading-6 text-[#0A0A0A]/65">{row.status}</p>
                  <Link
                    href={row.route}
                    className="inline-flex w-fit items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-[#DC2626] hover:underline"
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#F5F0E8]">
          <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 lg:px-12">
            <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#0A0A0A]/45">
                  Live dossiers
                </p>
                <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
                  Start with organisations that already have links across the graph.
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[#0A0A0A]/65">
                  Each dossier shows the identity key, linked services, ALMA records, funding history,
                  CivicScope signals, possible grants, and the gaps that still need review.
                </p>
              </div>
              <Link
                href="/api/directory/search"
                className="inline-flex w-fit items-center gap-2 rounded-md border border-[#0A0A0A] bg-white px-4 py-3 text-sm font-bold transition-colors hover:bg-[#0A0A0A] hover:text-white"
              >
                Open API <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {data.featuredOrganizations.map((org) => (
                <Link
                  key={org.id}
                  href={`/directory/org/${org.slug || org.id}`}
                  className="group rounded-lg border border-[#D8D0C6] bg-white p-5 transition-colors hover:border-[#0A0A0A] hover:bg-[#FBFAF7]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#0A0A0A] text-white">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-5 w-5 text-[#0A0A0A]/35 transition-transform group-hover:translate-x-1 group-hover:text-[#0A0A0A]" />
                  </div>
                  <h3 className="text-lg font-black leading-tight">{org.name}</h3>
                  <p className="mt-2 text-xs font-bold text-[#0A0A0A]/50">
                    {[org.state, org.abn ? 'ABN linked' : null, org.gsEntityId ? 'CivicGraph' : null].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="font-mono text-lg font-black">{org.counts.services}</p>
                      <p className="text-[#0A0A0A]/50">services</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg font-black">{org.counts.programs}</p>
                      <p className="text-[#0A0A0A]/50">models</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg font-black">{org.counts.fundingRecords}</p>
                      <p className="text-[#0A0A0A]/50">funding</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#DC2626]">Open dossier</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#0A0A0A] bg-[#0A0A0A] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:px-10 lg:px-12">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#F97316]">
                Grants reality check
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                We can get close to all public grants. We cannot honestly claim every private opportunity.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65">
                GrantScope can monitor federal, state, territory, council, data portal, and many foundation
                sources. The hard edge is philanthropic and relationship-only funding that never appears
                as a public round. JusticeHub should show the gap instead of hiding it.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                ['High coverage possible', 'Federal/state public grant portals, recurring government rounds, public tenders, and source-linked datasets.'],
                ['Medium coverage', 'Council grants, foundation programs, annual reports, and sector-specific opportunities that need source-by-source upkeep.'],
                ['Never fully complete', 'Invitation-only funding, private donor relationships, unpublished philanthropic decisions, and word-of-mouth opportunities.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-white/15 bg-white/8 p-4">
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/60">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F0E8]">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-[0.8fr_1.2fr] md:px-10 lg:px-12">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#0A0A0A]/45">
                What happens next
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                Turn the catalogue into a review workflow.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#0A0A0A]/65">
                The next build is not more pages. It is source health, missing-record intake,
                reviewer queues, and GrantScope sync so the directory keeps getting more reliable.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Source health', 'Show which portals and datasets are monitored, stale, blocked, or missing.'],
                ['Entity resolution', 'Join JusticeHub organisations to ABN, ACNC, ORIC, GrantScope, and CivicGraph identities.'],
                ['Review queues', 'Prioritise records used in public claims, funder briefs, partner demos, and service referrals.'],
                ['Public submissions', 'Let organisations, workers, and communities suggest missing records and corrections.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-[#D8D0C6] bg-white p-5">
                  <p className="font-bold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#0A0A0A]/65">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
