import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  FileText,
  Globe2,
  Handshake,
  Layers,
  MapPinned,
  Network,
  PencilLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getThisWeekSummary } from '@/lib/bgfit/queries';
import type { BGFitDashboardSummary } from '@/lib/bgfit/types';
import { getEntityEnrichment, type EntityEnrichment } from '@/lib/grantscope/entity-enrichment';
import { DashboardView } from './DashboardView';
import { OrgEnrichmentPanel } from './OrgEnrichmentPanel';

interface OrgRecord {
  id: string;
  name: string;
  slug: string;
  abn: string | null;
  state: string | null;
  city: string | null;
}

interface OperatingCounts {
  capabilityProfiles: number;
  deliveryRecords: number;
  interventions: number;
  members: number;
  partnerships: number;
  people: number;
  proofRecords: number;
  services: number;
}

type ReadinessStatus = 'ready' | 'open' | 'needs work';

interface ReadinessItem {
  label: string;
  detail: string;
  status: ReadinessStatus;
}

async function getOrg(slug: string): Promise<OrgRecord | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug, abn, state, city')
    .eq('slug', slug)
    .single();
  return (data as OrgRecord | null) ?? null;
}

async function getGsEntityByAbn(abn: string): Promise<string | null> {
  const supabase = createServiceClient() as any;
  const { data } = await supabase
    .from('gs_entities')
    .select('id')
    .eq('abn', abn)
    .limit(1)
    .single();
  return data?.id ?? null;
}

async function getOperatingCounts(orgId: string): Promise<OperatingCounts> {
  const supabase = createServiceClient() as any;

  async function safeCount(query: any): Promise<number> {
    try {
      const { count, error } = await query;
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  }

  const [
    registeredServices,
    services,
    operatingInterventions,
    almaInterventions,
    articles,
    stories,
    communityPeople,
    organizationPeople,
    activeMembers,
    partnerships,
    capabilityProfiles,
    mediaItems,
    partnerPhotos,
    partnerVideos,
  ] = await Promise.all([
    safeCount(
      supabase
        .from('registered_services')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      supabase
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true })
        .eq('operating_organization_id', orgId)
        .neq('verification_status', 'ai_generated'),
    ),
    safeCount(
      supabase
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true })
        .eq('alma_organization_id', orgId)
        .neq('verification_status', 'ai_generated'),
    ),
    safeCount(
      supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      supabase
        .from('stories')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      supabase
        .from('community_programs_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      supabase
        .from('organizations_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      supabase
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active'),
    ),
    safeCount(
      supabase
        .from('facility_partnerships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true),
    ),
    safeCount(
      supabase
        .from('organization_capability_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      supabase
        .from('media_items')
        .select('id', { count: 'exact', head: true })
        .contains('organization_ids', [orgId]),
    ),
    safeCount(
      supabase
        .from('partner_photos')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      supabase
        .from('partner_videos')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
  ]);

  return {
    capabilityProfiles,
    deliveryRecords: registeredServices + services + operatingInterventions + almaInterventions,
    interventions: operatingInterventions + almaInterventions,
    members: activeMembers,
    partnerships,
    people: communityPeople + organizationPeople,
    proofRecords: articles + stories + mediaItems + partnerPhotos + partnerVideos,
    services: registeredServices + services,
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AU').format(value);
}

function buildReadinessItems(
  org: OrgRecord,
  counts: OperatingCounts,
  summary: BGFitDashboardSummary,
  enrichment: EntityEnrichment | null,
): ReadinessItem[] {
  const fundingSignals =
    summary.activeGrants +
    counts.capabilityProfiles +
    (enrichment?.relationshipSummary.totalRelationships ?? 0);

  return [
    {
      label: 'Your ABN is linked',
      detail: org.abn
        ? `ABN ${org.abn} is attached${enrichment ? ' and we are reading the public record on your behalf.' : ' but the public record has not synced yet.'}`
        : 'Add your ABN so we can pull the public record across for you.',
      status: org.abn || enrichment ? 'ready' : 'needs work',
    },
    {
      label: 'What you run',
      detail:
        counts.deliveryRecords > 0
          ? `${formatNumber(counts.deliveryRecords)} programs and services are on your page.`
          : 'Add the programs and services you actually run, the places you run them, and who they are for.',
      status: counts.deliveryRecords > 0 ? 'ready' : 'needs work',
    },
    {
      label: 'Funding ready to match',
      detail:
        fundingSignals > 0
          ? `${formatNumber(fundingSignals)} funding signals are visible to potential funders.`
          : 'Add a capability profile so funders can see what kind of work fits.',
      status: fundingSignals > 0 ? 'ready' : 'needs work',
    },
    {
      label: 'Your people',
      detail:
        counts.people + counts.members > 0
          ? `${formatNumber(counts.people + counts.members)} people are credited on the page or have workspace access.`
          : 'Add your team, your Elders, your board. Names build trust.',
      status: counts.people + counts.members > 0 ? 'ready' : 'open',
    },
    {
      label: 'Your stories',
      detail:
        counts.proofRecords > 0
          ? `${formatNumber(counts.proofRecords)} stories, photos, films, and articles are live.`
          : 'Add a story, a photo, a film. Tell what is true about the work you do.',
      status: counts.proofRecords > 0 ? 'ready' : 'open',
    },
    {
      label: 'Who you work with',
      detail:
        counts.partnerships > 0
          ? `${formatNumber(counts.partnerships)} partner centres are linked.`
          : 'Link the centres, peer organisations, and partners you walk alongside.',
      status: counts.partnerships > 0 ? 'ready' : 'open',
    },
  ];
}

function buildNextActions(
  org: OrgRecord,
  counts: OperatingCounts,
  summary: BGFitDashboardSummary,
  enrichment: EntityEnrichment | null,
) {
  const actions: Array<{
    title: string;
    detail: string;
    href: string;
    label: string;
    icon: LucideIcon;
    tone: 'green' | 'blue' | 'orange' | 'purple';
  }> = [];

  if (counts.deliveryRecords === 0) {
    actions.push({
      title: 'Add what you run',
      detail: 'The programs and services you actually deliver. Where they happen. Who they are for. The work you do every day.',
      href: `/hub/${org.slug}/profile?tab=programs`,
      label: 'Add programs',
      icon: MapPinned,
      tone: 'green',
    });
  }

  if (summary.activeGrants === 0 && counts.capabilityProfiles === 0) {
    actions.push({
      title: 'Set up your funding profile',
      detail: 'Tell us the kind of work you do so funders looking for it can find you. No grant chasing.',
      href: `/funding/workspace/${org.id}`,
      label: 'Set up matches',
      icon: Briefcase,
      tone: 'blue',
    });
  }

  if (counts.proofRecords === 0) {
    actions.push({
      title: 'Add a story or a photo',
      detail: 'A face. A film. A quote from a young person. The truth of the work, in your own words and on your own terms.',
      href: `/hub/${org.slug}/profile?tab=proof`,
      label: 'Add a story',
      icon: FileText,
      tone: 'orange',
    });
  }

  if (counts.members < 2) {
    actions.push({
      title: 'Bring your team into the workspace',
      detail: 'Whoever needs to edit the page, post stories, or work on funding asks. You decide who, and what they can do.',
      href: `/hub/${org.slug}/profile?tab=people`,
      label: 'Invite your team',
      icon: Users,
      tone: 'purple',
    });
  }

  if (!enrichment) {
    actions.push({
      title: 'Connect your ABN',
      detail: 'Adding your ABN lets us pull your public records across so you do not have to type them in twice.',
      href: `/organizations/${org.slug}`,
      label: 'Connect ABN',
      icon: Network,
      tone: 'blue',
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: 'See who could fund the work',
      detail: 'Funders, government opportunities, and partners that fit what you actually do. No applying blind.',
      href: `/funding/workspace/${org.id}`,
      label: 'See matches',
      icon: Handshake,
      tone: 'blue',
    });
  }

  return actions.slice(0, 4);
}

export default async function DashboardPage({ params }: { params: { 'org-slug': string } }) {
  const org = await getOrg(params['org-slug']);
  if (!org) return <p className="text-gray-500">Organization not found.</p>;

  const [summary, counts] = await Promise.all([
    getThisWeekSummary(org.id),
    getOperatingCounts(org.id),
  ]);

  // Try to get GS enrichment via ABN
  let enrichment: EntityEnrichment | null = null;
  if (org.abn) {
    const gsEntityId = await getGsEntityByAbn(org.abn);
    if (gsEntityId) {
      enrichment = await getEntityEnrichment(gsEntityId);
    }
  }

  const readinessItems = buildReadinessItems(org, counts, summary, enrichment);
  const nextActions = buildNextActions(org, counts, summary, enrichment);
  const readyCount = readinessItems.filter((item) => item.status === 'ready').length;
  const sourceCount = enrichment?.sourceCount ?? 0;
  const relationshipCount = enrichment?.relationshipSummary.totalRelationships ?? 0;
  const location = [org.city, org.state].filter(Boolean).join(', ');
  const fundingSignals = summary.activeGrants + counts.capabilityProfiles + relationshipCount;
  const needsConfirmationCount = readinessItems.filter((item) => item.status !== 'ready').length;

  return (
    <div className="space-y-8">
      <section className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border-2 border-eucalyptus-700 bg-eucalyptus-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-eucalyptus-800">
              <Building2 className="h-4 w-4" />
              Your workspace
            </div>
            <h1 className="text-3xl font-black leading-tight">{org.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
              One place to keep your story straight. Your programs, your people, your funding,
              your public profile. You decide what the world sees and what stays in the room.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              {location && <span>{location}</span>}
              {org.abn && <span>ABN {org.abn}</span>}
              <span>{readyCount} of 6 ready</span>
            </div>
          </div>

          <div className="grid min-w-full gap-2 sm:min-w-[360px] sm:grid-cols-2 lg:min-w-[420px]">
            <QuickActionLink
              href={`/hub/${org.slug}/practice`}
              icon={RefreshCw}
              label="Practice Reflex"
              primary
            />
            <QuickActionLink
              href={`/funding/workspace/${org.id}`}
              icon={Briefcase}
              label="Plan your funding"
            />
            <QuickActionLink href={`/hub/${org.slug}/grants`} icon={Search} label="Find grants" />
            <QuickActionLink href={`/organizations/${org.slug}`} icon={Globe2} label="Your public page" />
            <QuickActionLink
              href={`/justice-funding?state=${org.state || ''}`}
              icon={DollarSign}
              label="Funding in your state"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border-2 border-black bg-sand-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">Your priorities</p>
              <h2 className="text-2xl font-black">Do these next</h2>
            </div>
            <ClipboardList className="h-6 w-6 text-eucalyptus-700" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {nextActions.map((action) => (
              <NextActionCard key={action.title} {...action} />
            ))}
          </div>
        </div>

        <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">Readiness map</p>
              <h2 className="text-2xl font-black">{readyCount}/6 ready</h2>
            </div>
            <BadgeCheck className="h-6 w-6 text-eucalyptus-700" />
          </div>
          <div className="space-y-3">
            {readinessItems.map((item) => (
              <ReadinessRow key={item.label} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PathwayCard
          href={`/hub/${org.slug}/profile`}
          icon={PencilLine}
          label="Your profile"
          title="Tell your story your way"
          detail="Edit your public page, your people, your stories, your photos. Decide what travels and what stays close."
        />
        <PathwayCard
          href={`/hub/${org.slug}/profile?tab=programs`}
          icon={MapPinned}
          label={`${formatNumber(counts.deliveryRecords)} programs`}
          title="What you run, where you run it"
          detail="The work you do every day. Programs, services, places, and the young people you walk alongside."
        />
        <PathwayCard
          href={`/funding/workspace/${org.id}`}
          icon={Briefcase}
          label={`${formatNumber(summary.activeGrants)} active grants`}
          title="Funding, on your terms"
          detail="See who could fund the work, track the asks you've made, and keep notes on the ones that matter."
          prefetch={false}
        />
        <PathwayCard
          href={`/organizations/${org.slug}`}
          icon={Globe2}
          label="Public view"
          title="See what the world sees"
          detail="Open your public profile the way a funder, a journalist, or a young person would find it."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <FundingPreviewPanel
          orgId={org.id}
          activeGrants={summary.activeGrants}
          capabilityProfiles={counts.capabilityProfiles}
          relationshipCount={relationshipCount}
          fundingSignals={fundingSignals}
        />
        <PublicProofPreviewPanel
          orgSlug={org.slug}
          proofRecords={counts.proofRecords}
          deliveryRecords={counts.deliveryRecords}
          peopleSignals={counts.people + counts.members}
        />
      </section>

      <section className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              <Layers className="h-4 w-4" />
              Where your information lives
            </div>
            <h2 className="text-2xl font-black">You only have to tell us once</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
              Some of what funders see is already on the public record. The rest is the context
              only you can add. We bring both into one workspace so you are not filling out the
              same forms twice.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase tracking-wide">
            <div className="border-2 border-black bg-sand-50 px-3 py-2">
              <div className="text-xl font-black">{sourceCount}</div>
              Sources
            </div>
            <div className="border-2 border-black bg-blue-50 px-3 py-2">
              <div className="text-xl font-black">{relationshipCount}</div>
              Graph links
            </div>
            <div className="border-2 border-black bg-eucalyptus-50 px-3 py-2">
              <div className="text-xl font-black">{counts.deliveryRecords}</div>
              Delivery
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-2 md:grid-cols-4">
          <SyncState label="From the public record" value={sourceCount + relationshipCount} tone="blue" />
          <SyncState label="What you have added" value={counts.deliveryRecords + counts.proofRecords + counts.members} tone="green" />
          <SyncState label="Still to confirm" value={needsConfirmationCount} tone="orange" />
          <SyncState label="Live on your page" value={counts.proofRecords + (org.slug ? 1 : 0)} tone="black" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SourceColumn
            icon={Network}
            title="From public records"
            status={enrichment ? 'linked' : 'needs your ABN linked'}
            lines={[
              org.abn ? `ABN ${org.abn}` : 'ABN not attached yet',
              `${formatNumber(sourceCount)} public datasets we read for you`,
              `${formatNumber(relationshipCount)} funding and partnership records found`,
              'Registry, ACNC, contracts, and people lists. Already public, brought together for you.',
            ]}
          />
          <SourceColumn
            icon={ShieldCheck}
            title="What you add"
            status="yours to edit, anytime"
            lines={[
              `${formatNumber(counts.services)} services and ${formatNumber(counts.interventions)} programs`,
              `${formatNumber(counts.proofRecords)} stories, photos, films, and articles`,
              `${formatNumber(counts.members)} people with workspace access`,
              'The story behind the data. Consent, context, and the truth only you can tell.',
            ]}
          />
          <SourceColumn
            icon={Handshake}
            title="Funding matches"
            status={counts.capabilityProfiles > 0 ? 'ready to match you' : 'add a capability profile'}
            lines={[
              `${formatNumber(counts.capabilityProfiles)} capability profiles set up`,
              `${formatNumber(summary.activeGrants)} grants you are tracking`,
              `${formatNumber(counts.partnerships)} partner centres linked`,
              'Funders, government opportunities, and partners that fit the work you actually do.',
            ]}
          />
        </div>
      </section>

      {enrichment && <OrgEnrichmentPanel enrichment={enrichment} orgName={org.name} />}
      <DashboardView summary={summary} />
    </div>
  );
}

function QuickActionLink({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={primary ? false : undefined}
      className={`inline-flex items-center justify-between gap-3 border-2 border-black px-4 py-3 text-sm font-black transition ${
        primary
          ? 'bg-eucalyptus-600 text-white hover:bg-eucalyptus-700'
          : 'bg-white hover:bg-sand-50'
      }`}
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function NextActionCard({
  title,
  detail,
  href,
  label,
  icon: Icon,
  tone,
}: {
  title: string;
  detail: string;
  href: string;
  label: string;
  icon: LucideIcon;
  tone: 'green' | 'blue' | 'orange' | 'purple';
}) {
  const toneClass =
    tone === 'green'
      ? 'text-eucalyptus-700 bg-eucalyptus-50 border-eucalyptus-700'
      : tone === 'blue'
        ? 'text-blue-700 bg-blue-50 border-blue-700'
        : tone === 'orange'
          ? 'text-orange-700 bg-orange-50 border-orange-700'
          : 'text-purple-700 bg-purple-50 border-purple-700';

  return (
    <Link
      href={href}
      prefetch={false}
      className="group border-2 border-black bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={`inline-flex items-center gap-2 border px-2 py-1 text-xs font-black uppercase ${toneClass}`}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
      <h3 className="text-base font-black leading-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{detail}</p>
    </Link>
  );
}

function ReadinessRow({ item }: { item: ReadinessItem }) {
  const isReady = item.status === 'ready';
  const isNeedsWork = item.status === 'needs work';
  const Icon = isReady ? CheckCircle2 : isNeedsWork ? AlertTriangle : ClipboardList;
  const colorClass = isReady
    ? 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-800'
    : isNeedsWork
      ? 'border-red-700 bg-red-50 text-red-800'
      : 'border-ochre-700 bg-ochre-50 text-ochre-800';

  return (
    <div className="flex gap-3 border border-black/15 bg-sand-50 p-3">
      <div className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center border ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black">{item.label}</p>
          <span className={`border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${colorClass}`}>
            {item.status}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.detail}</p>
      </div>
    </div>
  );
}

function PathwayCard({
  href,
  icon: Icon,
  label,
  title,
  detail,
  prefetch,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  title: string;
  detail: string;
  prefetch?: false;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className="group border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 border-2 border-black bg-sand-50 px-2 py-1 text-xs font-black uppercase tracking-wide">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
      <h3 className="text-xl font-black leading-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{detail}</p>
    </Link>
  );
}

function FundingPreviewPanel({
  orgId,
  activeGrants,
  capabilityProfiles,
  relationshipCount,
  fundingSignals,
}: {
  orgId: string;
  activeGrants: number;
  capabilityProfiles: number;
  relationshipCount: number;
  fundingSignals: number;
}) {
  const ready = capabilityProfiles > 0 || activeGrants > 0;
  return (
    <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 border border-blue-700 bg-blue-50 px-2 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
            <Briefcase className="h-4 w-4" />
            Your funding
          </div>
          <h2 className="text-2xl font-black">{ready ? 'Funding work in motion' : 'Set up your first match'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            The more you tell us about the work you do and where you do it, the better the matches
            we can put in front of you. No grant chasing. No applying blind.
          </p>
        </div>
        <div className="border-2 border-black bg-blue-50 px-4 py-3 text-center">
          <p className="text-2xl font-black">{fundingSignals}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-600">signals</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <MiniSignal label="Active grants" value={activeGrants} />
        <MiniSignal label="Capability profiles" value={capabilityProfiles} />
        <MiniSignal label="Funder records found" value={relationshipCount} />
      </div>
      <Link
        href={`/funding/workspace/${orgId}`}
        prefetch={false}
        className="mt-4 inline-flex min-h-[44px] items-center justify-between gap-3 border-2 border-black bg-eucalyptus-600 px-4 py-3 text-sm font-black text-white hover:bg-eucalyptus-700"
      >
        Open your funding workspace
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function PublicProofPreviewPanel({
  orgSlug,
  proofRecords,
  deliveryRecords,
  peopleSignals,
}: {
  orgSlug: string;
  proofRecords: number;
  deliveryRecords: number;
  peopleSignals: number;
}) {
  const ready = proofRecords > 0 && deliveryRecords > 0;
  return (
    <section className="border-2 border-black bg-sand-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 border border-orange-700 bg-orange-50 px-2 py-1 text-xs font-black uppercase tracking-wide text-orange-700">
            <FileText className="h-4 w-4" />
            What the world sees
          </div>
          <h2 className="text-2xl font-black">{ready ? 'Your story is travelling' : 'Add the story behind the work'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            The work you do every day deserves to be seen. Add a story, a face, a film, or a photo,
            and your public profile starts to carry the truth of what you do.
          </p>
        </div>
        <div className="border-2 border-black bg-white px-4 py-3 text-center">
          <p className="text-2xl font-black">{proofRecords}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-600">proof records</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <MiniSignal label="Programs" value={deliveryRecords} />
        <MiniSignal label="Your team" value={peopleSignals} />
        <MiniSignal label="Stories live" value={proofRecords} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/hub/${orgSlug}/profile?tab=proof`}
          className="inline-flex min-h-[44px] items-center justify-between gap-3 border-2 border-black bg-black px-4 py-3 text-sm font-black text-white hover:bg-gray-900"
        >
          Add a story
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/organizations/${orgSlug}`}
          className="inline-flex min-h-[44px] items-center justify-between gap-3 border-2 border-black bg-white px-4 py-3 text-sm font-black hover:bg-sand-100"
        >
          See your public page
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function MiniSignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-black/20 bg-white px-3 py-2">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function SyncState({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'blue' | 'green' | 'orange' | 'black';
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-50 text-blue-800'
      : tone === 'green'
        ? 'bg-eucalyptus-50 text-eucalyptus-800'
        : tone === 'orange'
          ? 'bg-orange-50 text-orange-800'
          : 'bg-black text-white';

  return (
    <div className={`border-2 border-black px-3 py-2 ${toneClass}`}>
      <p className="text-xl font-black">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wide">{label}</p>
    </div>
  );
}

function SourceColumn({
  icon: Icon,
  title,
  status,
  lines,
}: {
  icon: LucideIcon;
  title: string;
  status: string;
  lines: string[];
}) {
  return (
    <div className="border-2 border-black bg-sand-50 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-white">
          <Icon className="h-5 w-5" />
        </div>
        <span className="border border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide">
          {status}
        </span>
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-black" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
