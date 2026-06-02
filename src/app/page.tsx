import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowRight,
  Shield,
  Heart,
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  Mic,
  Calendar,
  Sparkles,
  Search,
  Scale,
  FileText,
  Network,
} from 'lucide-react';
import { ActivityFeed } from '@/components/activity-feed';
import { JusticePathwaysSection } from '@/components/justice-network/JusticePathwaysSection';
import { YouthRemandVerticalCard } from '@/components/justice-network/YouthRemandVerticalCard';
import { fmt } from '@/lib/format';
import { getDetentionCosts } from '@/lib/detention-costs';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

const audienceRoutes = [
  {
    label: 'I walked through CONTAINED',
    href: '/justice-network/youth-remand',
    icon: Network,
    body: 'If the container stayed with you, start here. See why children are held on remand, what else could happen, and what you can share.',
    action: 'Keep going',
    color: '#DC2626',
  },
  {
    label: 'I need support now',
    href: '/services',
    icon: Heart,
    body: 'Find legal help, crisis support, mentoring, housing, and community services without needing to understand the whole system first.',
    action: 'Find support',
    color: '#9F1239',
  },
  {
    label: 'I work with young people',
    href: '/join',
    icon: Users,
    body: 'Add a service, program, place, or local example so families, workers, funders, and advocates can find what already helps.',
    action: 'Add your work',
    color: '#059669',
  },
  {
    label: 'I do legal or advocacy work',
    href: '/justice-matrix',
    icon: Scale,
    body: 'Find cases, campaigns, source links, and plain-language issue guides that help turn concern into a stronger public argument.',
    action: 'Use the evidence',
    color: '#4C1D95',
  },
  {
    label: 'I fund or shape policy',
    href: '/follow-the-money',
    icon: DollarSign,
    body: 'Compare what detention costs with the local support that could keep young people safer, connected, and out of custody.',
    action: 'Compare costs',
    color: '#0A0A0A',
  },
  {
    label: 'I want to understand the proof',
    href: '/proof',
    icon: FileText,
    body: 'Check the claims, named organisations, sources, and limits before you repeat anything or ask someone else to trust it.',
    action: 'Check the claims',
    color: '#1F6F78',
  },
];

const journeySteps = [
  {
    label: 'Feel it',
    href: '/contained',
    icon: Heart,
    body: 'CONTAINED turns youth detention from an abstract policy issue into a human encounter.',
  },
  {
    label: 'Name it',
    href: '/remand',
    icon: Network,
    body: 'Understand remand: why a child can be held before sentence, what it costs, and what support can change the path.',
  },
  {
    label: 'Find help',
    href: '/services',
    icon: Search,
    body: 'Look for services, community programs, and practical alternatives near the people who need them.',
  },
  {
    label: 'Prove it',
    href: '/proof',
    icon: Shield,
    body: 'Check the evidence trail before asking anyone to trust the claim.',
  },
  {
    label: 'Move it',
    href: '/join',
    icon: ArrowRight,
    body: 'Share the page, add a local program, back an organisation, brief a decision-maker, or bring people together.',
  },
];

type MetricIssue = {
  source: string;
  message: string;
};

type SupabaseLikeResult<T = any> = {
  data: T | null;
  count?: number | null;
  error?: {
    code?: string;
    message?: string;
    details?: string | null;
  } | null;
};

function logMetricIssues(issues: MetricIssue[]) {
  if (issues.length === 0) return;

  console.warn(
    '[homepage-metrics] Some live metrics were withheld instead of rendered as zero:',
    issues.map((issue) => `${issue.source}: ${issue.message}`).join(' | ')
  );
}

function issueMessage(error: SupabaseLikeResult['error']) {
  return [error?.code, error?.message, error?.details].filter(Boolean).join(' — ') || 'Unknown query failure';
}

function readCount(result: SupabaseLikeResult, source: string, issues: MetricIssue[]): number | null {
  if (result.error) {
    issues.push({ source, message: issueMessage(result.error) });
    return null;
  }

  if (typeof result.count === 'number') return result.count;

  issues.push({ source, message: 'No count returned' });
  return null;
}

function readRows<T>(result: SupabaseLikeResult<T[]>, source: string, issues: MetricIssue[]): T[] | null {
  if (result.error) {
    issues.push({ source, message: issueMessage(result.error) });
    return null;
  }

  if (Array.isArray(result.data)) return result.data;
  return [];
}

function formatCountMetric(value: number | null): string {
  return value === null ? 'Source check' : value.toLocaleString();
}

function formatMoneyMetric(value: number | null): string {
  return value === null ? 'Source check' : fmt(value);
}

function formatRatioMetric(value: number | null): string {
  return value === null ? 'Source check' : `${value}x`;
}

function metricPhrase(value: number | null, label: string): string {
  return value === null ? `${label} under source check` : `${value.toLocaleString()} ${label}`;
}

async function loadCostRows(supabase: any, issues: MetricIssue[]) {
  const baseQuery = () =>
    supabase
      .from('alma_interventions')
      .select('cost_per_young_person', { count: 'exact' })
      .neq('verification_status', 'ai_generated')
      .not('cost_per_young_person', 'is', null)
      .gt('cost_per_young_person', 0)
      .lt('cost_per_young_person', 500000);

  const firstPage = await baseQuery().range(0, 999);
  const rows = readRows<{ cost_per_young_person: number | string | null }>(
    firstPage,
    'alma_interventions.cost_per_young_person',
    issues
  );

  if (!rows) return { rows: null, count: null };

  const total = typeof firstPage.count === 'number' ? firstPage.count : rows.length;
  let allRows = rows;

  for (let start = 1000; start < total; start += 1000) {
    const page = await baseQuery().range(start, start + 999);
    const pageRows = readRows<{ cost_per_young_person: number | string | null }>(
      page,
      `alma_interventions.cost_per_young_person page ${Math.floor(start / 1000) + 1}`,
      issues
    );
    if (!pageRows) break;
    allRows = allRows.concat(pageRows);
  }

  return { rows: allRows, count: total };
}

async function loadHomePageData() {
  const supabase = createServiceClient() as any;
  const metricIssues: MetricIssue[] = [];

  const [
    interventionsRes,
    youthJusticeInterventionsRes,
    evidenceRatedInterventionsRes,
    fundingCountRes,
    fundingTotalRes,
    orgRes,
    basecampsRes,
    evidenceRes,
    storiesRes,
    youthOppsRes,
  ] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated')
      .eq('serves_youth_justice', true),
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated')
      .neq('evidence_level', 'Untested (theory/pilot stage)'),
    supabase
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .gt('amount_dollars', 0),
    supabase.rpc('get_funding_total').single(),
    supabase
      .from('organizations')
      .select('id', { count: 'planned', head: true })
      .eq('is_active', true),
    supabase
      .from('organizations')
      .select('id, name, slug, state, is_indigenous_org')
      .or('partner_tier.eq.basecamp,type.eq.basecamp')
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .order('state'),
    supabase
      .from('alma_evidence')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, featured_image_url, published_at, author_id, profiles:author_id(full_name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('youth_opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
  ]);

  const { rows: costRows, count: costDataCount } = await loadCostRows(supabase, metricIssues);
  const costData = (costRows || []).map((r: any) => Number(r.cost_per_young_person)).filter((n: number) => n > 0);
  const basecamps = readRows(basecampsRes, 'organizations.basecamps', metricIssues) || [];
  const stories = readRows(storiesRes, 'articles.published', metricIssues) || [];
  const catalogueCount = readCount(interventionsRes, 'alma_interventions.catalogue_count', metricIssues);
  const youthJusticeCount = readCount(youthJusticeInterventionsRes, 'alma_interventions.youth_justice_count', metricIssues);
  const evidenceRatedCount = readCount(evidenceRatedInterventionsRes, 'alma_interventions.evidence_rated_count', metricIssues);
  const fundingRecordCount = readCount(fundingCountRes, 'justice_funding.record_count', metricIssues);
  const fundingTotalData = !fundingTotalRes.error && fundingTotalRes.data ? fundingTotalRes.data as any : null;
  if (fundingTotalRes.error) {
    metricIssues.push({ source: 'get_funding_total.rpc', message: issueMessage(fundingTotalRes.error) });
  }

  // Centre of Excellence headline counts — triangulation tier distribution + ACCO tally.
  const [triangulationRes, accoRes, tier1ConfirmedRes] = await Promise.all([
    supabase.from('v_claim_evidence_summary').select('triangulation_tier'),
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('acco_certified', true).eq('is_active', true),
    supabase.from('civic_org_classifications').select('id', { count: 'exact', head: true }).eq('tier', 1).not('confirmed_at', 'is', null),
  ]);
  const triangulationRows = readRows<{ triangulation_tier: string }>(
    triangulationRes,
    'v_claim_evidence_summary.triangulation_tier',
    metricIssues
  );
  const tierCounts = {
    triangulated: triangulationRows ? triangulationRows.filter((r) => r.triangulation_tier === 'triangulated').length : null,
    corroborated: triangulationRows ? triangulationRows.filter((r) => r.triangulation_tier === 'corroborated').length : null,
    single: triangulationRows ? triangulationRows.filter((r) => r.triangulation_tier === 'single_source').length : null,
    total: triangulationRows ? triangulationRows.length : null,
  };
  const accoCount = readCount(accoRes, 'organizations.acco_certified_count', metricIssues);
  const tier1Count = readCount(tier1ConfirmedRes, 'civic_org_classifications.tier1_confirmed_count', metricIssues);

  const totalFunding = fundingTotalData?.total_dollars ? Number(fundingTotalData.total_dollars) : null;
  const avgCost = costData.length ? Math.round(costData.reduce((a: number, b: number) => a + b, 0) / costData.length) : null;

  let detentionCost: number | null = null;
  let nationalDailyCost: number | null = null;
  let ntDailyCost: number | null = null;
  let detentionFinancialYear: string | null = null;
  try {
    const detentionCostsData = await getDetentionCosts();
    if (detentionCostsData.national.dailyCost > 0 && detentionCostsData.national.annualCost > 0) {
      detentionCost = detentionCostsData.national.annualCost;
      nationalDailyCost = detentionCostsData.national.dailyCost;
      ntDailyCost = detentionCostsData.byState.NT?.dailyCost || nationalDailyCost;
      detentionFinancialYear = detentionCostsData.financialYear;
    } else {
      metricIssues.push({ source: 'rogs_justice_spending.detention_costs', message: 'ROGS detention costs returned zero or missing daily cost' });
    }
  } catch (error) {
    metricIssues.push({ source: 'rogs_justice_spending.detention_costs', message: error instanceof Error ? error.message : 'Unknown detention cost failure' });
  }

  const ratio = detentionCost && avgCost ? Math.round(detentionCost / avgCost) : null;
  const evidenceCount = readCount(evidenceRes, 'alma_evidence.count', metricIssues);
  const youthOppsCount = readCount(youthOppsRes, 'youth_opportunities.open_count', metricIssues);
  const orgCount = readCount(orgRes, 'organizations.active_count', metricIssues);

  logMetricIssues(metricIssues);

  return {
    catalogueCount,
    youthJusticeCount,
    evidenceRatedCount,
    costDataCount,
    basecamps,
    stories,
    evidenceCount,
    youthOppsCount,
    orgCount,
    tierCounts,
    accoCount,
    tier1Count,
    fundingRecordCount,
    totalFunding,
    avgCost,
    detentionCost,
    nationalDailyCost,
    ntDailyCost,
    detentionFinancialYear,
    ratio,
    metricIssues,
  };
}

const getHomePageData = unstable_cache(loadHomePageData, ['justicehub-home-public-v4'], {
  revalidate: 300,
  tags: ['homepage'],
});

export default async function HomePage() {
  const {
    catalogueCount,
    youthJusticeCount,
    evidenceRatedCount,
    costDataCount,
    basecamps,
    stories,
    evidenceCount,
    youthOppsCount,
    orgCount,
    tierCounts,
    accoCount,
    tier1Count,
    fundingRecordCount,
    totalFunding,
    avgCost,
    detentionCost,
    nationalDailyCost,
    ntDailyCost,
    detentionFinancialYear,
    ratio,
    metricIssues,
  } = await getHomePageData();

  const hasMetricIssues = metricIssues.length > 0;
  const fundingDisplayValue = totalFunding !== null
    ? formatMoneyMetric(totalFunding)
    : fundingRecordCount !== null
      ? fundingRecordCount.toLocaleString()
      : 'Source check';
  const fundingDisplayLabel = totalFunding !== null ? 'funding tracked' : 'funding records indexed';

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navigation />

      <main id="main-content">
        {/* Hero — make the system human, then make the action obvious */}
        <section className="bg-[#0A0A0A] text-white header-offset">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 py-24 md:py-32">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#DC2626] mb-6"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {metricPhrase(youthJusticeCount, 'youth-justice records')}. {metricPhrase(evidenceRatedCount, 'evidence-rated')}. {ratio === null ? 'Cost gap under source check.' : `${ratio}x average cost gap.`}
            </p>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.05]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Australia locks up children.
              <br />
              <span className="text-[#059669]">There are better answers.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-10">
              This is a public guide for people who have seen the harm and want to understand what can change.
              Start with the human story, then find the evidence, services, alternatives, costs, and people already
              working for a different future.
            </p>
            <p className="mb-8 max-w-2xl border-l-2 border-white/20 pl-4 text-sm leading-6 text-white/55">
              The numbers are catalogue records, not endorsements. Each record should be read with its evidence level,
              source trail, location, and review status so weak signals stay visible.
            </p>
            {hasMetricIssues && (
              <p className="mb-8 max-w-2xl rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
                Some live totals are under source check, so JusticeHub is not publishing placeholder zeroes for them.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                href="/justice-network/youth-remand"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
              >
                Understand youth remand <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contained"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#DC2626]/90 transition-colors text-sm"
              >
                Visit CONTAINED
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Find support
              </Link>
              <Link
                href="/proof"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Check the proof
              </Link>
            </div>
          </div>
        </section>

        {/* Human route finder */}
        <section className="bg-white border-b border-[#0A0A0A]/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.7fr] lg:items-start">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.3em] text-[#7C2D12] mb-3"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Start where you are
                </p>
                <h2
                  className="text-2xl md:text-3xl font-bold tracking-tight text-[#0A0A0A]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Choose the door that matches why you came.
                </h2>
                <p className="mt-4 text-sm leading-6 text-[#0A0A0A]/65">
                  You might be here after CONTAINED, looking for help, checking a claim, adding a local service, or
                  trying to move money toward what works. Start with one path. You can go deeper later.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {audienceRoutes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <Link
                      key={route.label}
                      href={route.href}
                      className="group rounded-lg border border-[#E5DDD2] bg-[#FBFAF7] p-4 transition-colors hover:border-[#0A0A0A]/30 hover:bg-white"
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white"
                          style={{ background: route.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3
                            className="text-base font-bold leading-tight text-[#0A0A0A] md:text-lg"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {route.label}
                          </h3>
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0A0A]/55 group-hover:text-[#0A0A0A]">
                            {route.action} <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-[#0A0A0A]/65">{route.body}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Full user flow */}
        <section className="bg-[#F5F0E8] border-b border-stone-200">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.3em] text-stone-600 mb-3"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  A simple path
                </p>
                <h2
                  className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  From seeing the issue to knowing what to do next.
                </h2>
              </div>
              <Link
                href="/justice-network"
                className="inline-flex items-center gap-2 self-start rounded-md bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 md:self-auto"
              >
                Explore the issue guide <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {journeySteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.label}
                    href={step.href}
                    className="group relative rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-stone-500"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0A0A0A] text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className="text-xs uppercase text-stone-400"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.14em' }}
                      >
                        0{index + 1}
                      </span>
                    </div>
                    <h3
                      className="mb-2 text-lg font-bold text-stone-900"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {step.label}
                    </h3>
                    <p className="text-sm leading-6 text-stone-600">{step.body}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-stone-500 group-hover:text-stone-900">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ALMA + local support path */}
        <section className="bg-white border-b border-stone-200">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 py-14">
            <JusticePathwaysSection variant="home" />
          </div>
        </section>

        {/* Centre of Excellence band */}
        <section className="bg-[#F5F0E8] border-t border-stone-200">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div className="max-w-2xl">
                <p
                  className="text-xs uppercase tracking-[0.3em] text-stone-600 mb-3"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Centre of Excellence for Youth Justice
                </p>
                <h2
                  className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  If we ask people to believe something, we show where it came from.
                </h2>
                <p className="mt-3 text-base text-stone-700 max-w-xl leading-relaxed">
                  JusticeHub is careful with claims. We name the source, show the organisation where possible, and mark what is still being checked.
                </p>
              </div>
              <Link
                href="/intelligence/civic/centre-of-excellence"
                className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 text-white text-sm font-semibold rounded shrink-0 hover:bg-stone-800 transition-colors self-start md:self-center"
              >
                See the evidence trail <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border-2 border-emerald-300 bg-emerald-50 p-4 rounded">
                <p className="text-3xl font-bold text-emerald-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatCountMetric(tierCounts.triangulated)}</p>
                <p className="text-xs font-mono uppercase tracking-widest text-emerald-800 mt-1">Triangulated claims</p>
                <p className="text-xs text-stone-600 mt-1">Checked against 3+ sources</p>
              </div>
              <div className="border-2 border-amber-300 bg-amber-50 p-4 rounded">
                <p className="text-3xl font-bold text-amber-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatCountMetric(tierCounts.corroborated)}</p>
                <p className="text-xs font-mono uppercase tracking-widest text-amber-800 mt-1">Corroborated</p>
                <p className="text-xs text-stone-600 mt-1">Checked against 2 sources</p>
              </div>
              <div className="border-2 border-stone-300 bg-white p-4 rounded">
                <p className="text-3xl font-bold text-stone-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatCountMetric(tier1Count)}</p>
                <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-1">Tier 1 frontline YJ orgs</p>
                <p className="text-xs text-stone-600 mt-1">Confirmed in civic register</p>
              </div>
              <div className="border-2 border-purple-300 bg-purple-50 p-4 rounded">
                <p className="text-3xl font-bold text-purple-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatCountMetric(accoCount)}</p>
                <p className="text-xs font-mono uppercase tracking-widest text-purple-800 mt-1">ACCO certified</p>
                <p className="text-xs text-stone-600 mt-1">Via ORIC public register</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-mono uppercase tracking-widest text-stone-500">
              <Link href="/intelligence/civic" className="hover:text-stone-900 hover:underline">See all claims with their evidence trail →</Link>
              <Link href="/intelligence/civic/whats-new" className="hover:text-stone-900 hover:underline">What changed this week →</Link>
            </div>
          </div>
        </section>

        {/* The Cost Argument — Visceral, immediate */}
        <section className="bg-black text-white border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#DC2626]/10 rounded-xl p-6 border border-[#DC2626]/20">
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#DC2626' }}
                >
                  Detention
                </p>
                <p
                  className="text-4xl font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#DC2626' }}
                >
                  {formatMoneyMetric(detentionCost)}
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>per young person per year</p>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {nationalDailyCost !== null && ntDailyCost !== null
                    ? `$${nationalDailyCost.toLocaleString()}/day national average. NT: $${ntDailyCost.toLocaleString()}/day. ROGS ${detentionFinancialYear}.`
                    : 'ROGS detention cost source is under check; no placeholder zero published.'}
                </p>
              </div>
              <div className="bg-[#059669]/10 rounded-xl p-6 border border-[#059669]/20">
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#059669' }}
                >
                  Community Models
                </p>
                <p
                  className="text-4xl font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#059669' }}
                >
                  {formatMoneyMetric(avgCost)}
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>per young person (average)</p>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {costDataCount !== null ? `Across ${costDataCount.toLocaleString()} models with cost data.` : 'Cost model count is under source check.'}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col justify-center">
                <p
                  className="text-5xl font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#ffffff' }}
                >
                  {formatRatioMetric(ratio)}
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {ratio === null ? 'Cost comparison held until both source paths are clean.' : 'cheaper. Better outcomes. Proven.'}
                </p>
                <Link
                  href="/calculator"
                  className="text-sm font-semibold text-[#059669] mt-3 flex items-center gap-1 hover:underline"
                >
                  Try the calculator <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Youth remand guide */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 py-14">
          <YouthRemandVerticalCard />
        </section>

        {/* Three deeper modes */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 py-20">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Three ways to go deeper.
          </h2>
          <p className="text-center text-[#0A0A0A]/60 mb-12 max-w-xl mx-auto">
            Once you know why you are here, choose a practical next step: find help, add what you know, or use the proof.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/services"
              className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#0A0A0A]/40 transition-all group"
            >
              <Heart className="w-8 h-8 text-[#DC2626] mb-4" />
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Find support
              </h3>
              <p className="text-sm text-[#0A0A0A]/60 mb-4">
                Find services near you. Crisis support, legal help, mentorship, housing.
                No judgment, just options.
              </p>
              <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#DC2626] group-hover:underline">
                Find support <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              href="/join"
              className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#0A0A0A]/40 transition-all group"
            >
              <Users className="w-8 h-8 text-[#059669] mb-4" />
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Strengthen the work
              </h3>
              <p className="text-sm text-[#0A0A0A]/60 mb-4">
                Add your program, place, story, or local knowledge so people can find the alternatives already working.
              </p>
              <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#059669] group-hover:underline">
                Add your work <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              href="/proof"
              className="bg-white rounded-xl border-2 border-[#0A0A0A]/10 p-8 hover:border-[#0A0A0A]/40 transition-all group"
            >
              <DollarSign className="w-8 h-8 text-[#0A0A0A] mb-4" />
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Shift policy and money
              </h3>
              <p className="text-sm text-[#0A0A0A]/60 mb-4">
                {catalogueCount !== null && evidenceRatedCount !== null
                  ? `See the evidence. ${catalogueCount.toLocaleString()} support records are catalogued, with ${evidenceRatedCount.toLocaleString()} carrying an evidence signal. Use that to ask better questions.`
                  : 'See the evidence. Live support-record totals are under source check, so the page is not publishing a placeholder number.'}
              </p>
              <span className="inline-flex items-center gap-2 font-semibold text-sm text-[#0A0A0A]/60 group-hover:underline">
                See the proof <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </section>

        {/* The Network — Basecamps — hidden until org data is verified */}
        {false && <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <p
                  className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  ALMA Network
                </p>
                <h2
                  className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Community organisations in every state
                </h2>
                <p className="text-white/60 mb-8">
                  Basecamps coordinate the network. Miners do the work. Validators confirm
                  it&apos;s real. Together, they&apos;re building the alternative to a system
                  that spends billions failing kids.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { value: basecamps.length, label: 'Basecamps' },
                    { value: formatCountMetric(catalogueCount), label: 'ALMA Records' },
                    { value: formatCountMetric(evidenceCount), label: 'Evidence Items' },
                    { value: formatCountMetric(youthOppsCount), label: 'Open Opportunities' },
                  ].map((s) => (
                    <div key={s.label}>
                      <p
                        className="text-2xl font-bold text-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {s.value}
                      </p>
                      <p
                        className="text-xs text-white/40"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/network/alma"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                  >
                    Explore the Network <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/basecamps"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                  >
                    See Basecamps
                  </Link>
                </div>
              </div>

              {/* Basecamp cards */}
              <div className="space-y-3">
                {basecamps.slice(0, 6).map((bc: any) => (
                  <Link
                    key={bc.id}
                    href={`/sites/${bc.slug}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#059669]/20">
                      <Shield className="w-4 h-4 text-[#059669]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white group-hover:underline truncate">
                        {bc.name}
                      </p>
                      <p className="text-xs text-white/40 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {bc.state}
                        {bc.is_indigenous_org && ' · Indigenous-led'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>}

        {/* The Proof Row */}
        <section className="max-w-6xl mx-auto px-6 sm:px-12 py-20">
          <h2
            className="text-3xl font-bold tracking-tight mb-4 text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            The public record
          </h2>
          <p className="text-center text-[#0A0A0A]/60 mb-12 max-w-xl mx-auto">
            Numbers are not enough on their own. They help people see where money goes, what support exists, and which claims still need care.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/directory" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Shield className="w-5 h-5 text-[#059669] mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatCountMetric(catalogueCount)}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>support records</p>
              <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">National Directory <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link href="/follow-the-money" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <DollarSign className="w-5 h-5 text-[#DC2626] mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{fundingDisplayValue}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fundingDisplayLabel}</p>
              <span className="text-xs font-semibold text-[#DC2626] mt-2 flex items-center gap-1 group-hover:underline">Follow the Money <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link href="/funders" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Users className="w-5 h-5 text-[#0A0A0A]/60 mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{formatCountMetric(orgCount)}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>organisations</p>
              <span className="text-xs font-semibold text-[#0A0A0A]/60 mt-2 flex items-center gap-1 group-hover:underline">Funders <ArrowRight className="w-3 h-3" /></span>
            </Link>
            <Link href="/intelligence/chat" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Sparkles className="w-5 h-5 text-[#059669] mb-2" />
              <p className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ALMA</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>ask a question</p>
              <span className="text-xs font-semibold text-[#059669] mt-2 flex items-center gap-1 group-hover:underline">Ask ALMA <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Link href="/calculator" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <TrendingUp className="w-5 h-5 text-[#0A0A0A]/60 mb-2" />
              <p className="font-bold text-sm">Cost Calculator</p>
              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">Detention vs alternatives</p>
            </Link>
            <Link href="/follow-the-money/big-vs-small" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <TrendingUp className="w-5 h-5 text-[#DC2626] mb-2" />
              <p className="font-bold text-sm">Big vs Small</p>
              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">Corporate vs community</p>
            </Link>
            <Link href="/voices" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Mic className="w-5 h-5 text-[#059669] mb-2" />
              <p className="font-bold text-sm">Community Voices</p>
              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">Real stories</p>
            </Link>
            <Link href="/trips" className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
              <Calendar className="w-5 h-5 text-[#059669] mb-2" />
              <p className="font-bold text-sm">Learning Trips</p>
              <p className="text-xs text-[#0A0A0A]/40 mt-0.5">Visit each other&apos;s Country</p>
            </Link>
          </div>
        </section>

        {/* Stories */}
        {stories.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 sm:px-12 pb-16">
            <div className="flex items-baseline justify-between mb-6">
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Stories
              </h2>
              <Link href="/stories" className="text-sm font-semibold text-[#059669] hover:underline flex items-center gap-1">
                All stories <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stories.map((story: any) => (
                <Link key={story.id} href={`/stories/${story.slug}`} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group">
                  {story.featured_image_url && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-[#0A0A0A]/5">
                      <img
                        src={story.featured_image_url}
                        alt={story.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="font-semibold text-sm mb-1 group-hover:underline">{story.title}</p>
                  <p className="text-xs text-[#0A0A0A]/40 mb-2">
                    {story.profiles?.full_name || 'JusticeHub'}
                  </p>
                  {story.excerpt && (
                    <p className="text-xs text-[#0A0A0A]/60 line-clamp-3">{story.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Activity Feed — hidden until data is reliable */}
        {false && <ActivityFeed />}

        {/* Final CTA — The line */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-4xl mx-auto px-6 sm:px-12 text-center">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-6"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Stay with the work
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              The alternative is already here. The next step is helping more people find it, trust it, fund it, and grow it.
            </h2>
            <p className="text-white/60 mb-10 max-w-2xl mx-auto">
              The work is happening in communities, services, courts, campaigns, and families. JusticeHub brings those
              threads together so people can act with care instead of guessing.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
              >
                Join the Network <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/proof"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#DC2626]/90 transition-colors text-sm"
              >
                See the Proof
              </Link>
              <Link
                href="/contained"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Experience CONTAINED
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
