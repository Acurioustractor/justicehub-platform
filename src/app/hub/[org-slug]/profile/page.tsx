import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Globe2,
  Layers,
  MapPinned,
  Newspaper,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { getOrganizationDossier, type OrganizationDossier } from '@/lib/grantscope/org-dossier';
import { ProgramCreateForm } from './ProgramCreateForm';

type ProfileTab = 'identity' | 'programs' | 'people' | 'proof' | 'public';

type OrgRecord = {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  partner_tier: string | null;
  description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  abn: string | null;
  gs_entity_id: string | null;
  verification_status: string | null;
};

type ProgramRecord = {
  id: string;
  name: string;
  description: string | null;
  approach: string | null;
  impact_summary: string | null;
  participants_served: number | null;
  success_rate: number | null;
  tags: string[] | null;
};

type PersonRecord = {
  id: string;
  role: string | null;
  role_description: string | null;
  is_current: boolean | null;
  is_featured: boolean | null;
  public_profiles:
    | {
        id: string;
        full_name: string | null;
        slug: string | null;
        preferred_name: string | null;
        bio: string | null;
        photo_url: string | null;
        location: string | null;
        is_public: boolean | null;
        is_featured: boolean | null;
      }
    | Array<{
        id: string;
        full_name: string | null;
        slug: string | null;
        preferred_name: string | null;
        bio: string | null;
        photo_url: string | null;
        location: string | null;
        is_public: boolean | null;
        is_featured: boolean | null;
      }>
    | null;
};

type ArticleRecord = {
  id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  status: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string | null;
};

type MediaRecord = {
  id: string;
  title: string | null;
  description: string | null;
  url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
  video_url?: string | null;
  created_at: string | null;
};

type ProfileData = {
  org: OrgRecord;
  programs: ProgramRecord[];
  people: PersonRecord[];
  articles: ArticleRecord[];
  photos: MediaRecord[];
  videos: MediaRecord[];
  mediaItems: MediaRecord[];
  memberCount: number;
  dossier: OrganizationDossier;
};

const TABS: Array<{ key: ProfileTab; label: string; icon: LucideIcon }> = [
  { key: 'identity', label: 'Identity', icon: Building2 },
  { key: 'programs', label: 'Programs & Services', icon: MapPinned },
  { key: 'people', label: 'People', icon: Users },
  { key: 'proof', label: 'Stories & Proof', icon: BookOpen },
  { key: 'public', label: 'Public Output', icon: Globe2 },
];

function asTab(value: string | string[] | undefined): ProfileTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return TABS.some((tab) => tab.key === raw) ? (raw as ProfileTab) : 'identity';
}

async function safeList<T>(query: any): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) return [];
    return (data || []) as T[];
  } catch {
    return [];
  }
}

async function safeCount(query: any): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function getProfileData(slug: string): Promise<ProfileData | null> {
  const service = createServiceClient() as any;
  const { data: org } = await service
    .from('organizations')
    .select('id, name, slug, type, partner_tier, description, location, city, state, website, abn, gs_entity_id, verification_status')
    .eq('slug', slug)
    .maybeSingle();

  if (!org) return null;

  const dossierPromise = getOrganizationDossier({
    orgId: org.id,
    orgName: org.name,
    gsEntityId: org.gs_entity_id,
    abn: org.abn,
  }).catch(() => ({
    entity: null,
    justiceFunding: [],
    contracts: [],
    relationships: [],
    fundingReceived: [],
    fundingProvided: [],
    networkLinks: [],
    boardRoles: [],
    interventions: [],
    centrePartnerships: [],
    summary: {
      knownFundingTotal: 0,
      justiceFundingTotal: 0,
      contractTotal: 0,
      relationshipFundingTotal: 0,
      fundingRecordCount: 0,
      relationshipCount: 0,
      boardRoleCount: 0,
      centreCount: 0,
      interventionCount: 0,
    },
  }));

  const [programs, people, articles, photos, videos, mediaItems, memberCount, dossier] = await Promise.all([
    safeList<ProgramRecord>(
      service
        .from('programs_catalog_v')
        .select('id, name, description, approach, impact_summary, participants_served, success_rate, tags')
        .eq('organization_id', org.id)
        .order('name'),
    ),
    safeList<PersonRecord>(
      service
        .from('organizations_profiles')
        .select(`
          id,
          role,
          role_description,
          is_current,
          is_featured,
          public_profiles (
            id,
            full_name,
            slug,
            preferred_name,
            bio,
            photo_url,
            location,
            is_public,
            is_featured
          )
        `)
        .eq('organization_id', org.id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ),
    safeList<ArticleRecord>(
      service
        .from('articles')
        .select('id, title, slug, excerpt, status, category, published_at, created_at')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ),
    safeList<MediaRecord>(
      service
        .from('partner_photos')
        .select('id, title, description, photo_url, created_at')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ),
    safeList<MediaRecord>(
      service
        .from('partner_videos')
        .select('id, title, description, video_url, created_at')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ),
    safeList<MediaRecord>(
      service
        .from('media_items')
        .select('id, title, description, file_url, created_at')
        .contains('organization_ids', [org.id])
        .order('created_at', { ascending: false })
        .limit(20),
    ),
    safeCount(
      service
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('status', 'active'),
    ),
    dossierPromise,
  ]);

  return {
    org: org as OrgRecord,
    programs,
    people,
    articles,
    photos,
    videos,
    mediaItems,
    memberCount,
    dossier,
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-AU').format(value);
}

function formatMoney(value: number) {
  if (!value) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);
}

function profileFromLink(link: PersonRecord) {
  return Array.isArray(link.public_profiles) ? link.public_profiles[0] : link.public_profiles;
}

export default async function OrganizationProfileWorkspacePage({
  params,
  searchParams,
}: {
  params: { 'org-slug': string };
  searchParams?: { tab?: string | string[] };
}) {
  const data = await getProfileData(params['org-slug']);
  if (!data) {
    return <p className="text-sm text-gray-500">Organization not found.</p>;
  }

  const activeTab = asTab(searchParams?.tab);
  const { org, dossier } = data;
  const publicProofCount = data.articles.length + data.photos.length + data.videos.length + data.mediaItems.length;
  const deliveryCount = data.programs.length + dossier.interventions.length;
  const location = [org.city || org.location, org.state].filter(Boolean).join(', ');
  const isVerified = org.verification_status === 'verified' || org.verification_status === 'acnc_verified';

  return (
    <div className="space-y-6">
      <section className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              <UserRound className="h-4 w-4" />
              Organization profile workspace
            </div>
            <h1 className="text-3xl font-black leading-tight">{org.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
              Use this workspace to turn the claimed record into a funder-ready public profile:
              identity, programs, people, proof, and the public outputs that flow into JusticeHub.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-gray-500">
              {location && <span>{location}</span>}
              {org.abn && <span>ABN {org.abn}</span>}
              <span>{isVerified ? 'Verified access' : 'Verification open'}</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[460px]">
            <TopAction href={`/funding/workspace/${org.id}`} icon={Briefcase} label="Funding workspace" primary />
            <TopAction href={`/organizations/${org.slug}`} icon={Globe2} label="Public profile" />
            <TopAction href={`/hub/${org.slug}/profile?tab=programs`} icon={MapPinned} label="Programs" />
            <TopAction href={`/hub/${org.slug}/profile?tab=proof`} icon={BookOpen} label="Proof" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Delivery records" value={deliveryCount} detail={`${data.programs.length} services, ${dossier.interventions.length} interventions`} />
        <MetricCard label="People and board" value={data.people.length + dossier.boardRoles.length} detail={`${data.people.length} public, ${dossier.boardRoles.length} CivicScope roles`} />
        <MetricCard label="Proof records" value={publicProofCount} detail={`${data.articles.length} stories/articles, ${data.photos.length + data.videos.length + data.mediaItems.length} media`} />
        <MetricCard label="Known funding" value={formatMoney(dossier.summary.knownFundingTotal)} detail={`${dossier.summary.fundingRecordCount} public funding signals`} />
      </section>

      <PopulationGuide data={data} />

      <nav className="flex flex-wrap gap-2 border-2 border-black bg-white p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        {TABS.map((tab) => (
          <TabLink key={tab.key} orgSlug={org.slug} tab={tab} active={activeTab === tab.key} />
        ))}
      </nav>

      {activeTab === 'identity' && <IdentityTab data={data} />}
      {activeTab === 'programs' && <ProgramsTab data={data} />}
      {activeTab === 'people' && <PeopleTab data={data} />}
      {activeTab === 'proof' && <ProofTab data={data} />}
      {activeTab === 'public' && <PublicOutputTab data={data} />}
    </div>
  );
}

function TabLink({
  orgSlug,
  tab,
  active,
}: {
  orgSlug: string;
  tab: { key: ProfileTab; label: string; icon: LucideIcon };
  active: boolean;
}) {
  const Icon = tab.icon;
  return (
    <Link
      href={`/hub/${orgSlug}/profile${tab.key === 'identity' ? '' : `?tab=${tab.key}`}`}
      className={`inline-flex min-h-[44px] items-center gap-2 border-2 px-4 py-2 text-sm font-black transition ${
        active
          ? 'border-black bg-black text-white'
          : 'border-transparent text-gray-600 hover:border-black hover:bg-sand-50 hover:text-black'
      }`}
    >
      <Icon className="h-4 w-4" />
      {tab.label}
    </Link>
  );
}

function TopAction({
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
      prefetch={href.includes('/funding/workspace') ? false : undefined}
      className={`inline-flex min-h-[48px] items-center justify-between gap-3 border-2 border-black px-4 py-3 text-sm font-black transition ${
        primary ? 'bg-eucalyptus-600 text-white hover:bg-eucalyptus-700' : 'bg-white hover:bg-sand-50'
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

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">{detail}</p>
    </div>
  );
}

function PopulationGuide({ data }: { data: ProfileData }) {
  const { org, dossier } = data;
  const deliveryCount = data.programs.length + dossier.interventions.length;
  const proofCount = data.articles.length + data.photos.length + data.videos.length + data.mediaItems.length;
  const peopleCount = data.people.length + dossier.boardRoles.length;

  return (
    <section className="grid gap-4 border-2 border-black bg-sand-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] xl:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-gray-500">How this gets populated</p>
        <h2 className="mt-2 text-2xl font-black">CivicScope gives the evidence graph. JusticeHub adds the working record.</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          For this org we have enough to prove identity and governance, but not enough yet to explain delivery,
          proof, live grants, or compliance. The zeros mean those JusticeHub working records have not been
          created or linked to this organization.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <PopulationStep
          label="Already synced"
          value={`${org.abn ? 'ABN' : 'No ABN'} + ${dossier.boardRoles.length} board roles`}
          detail="ABN, ACNC/CivicScope identity, graph relationships, and public registry roles."
          complete={Boolean(org.abn || dossier.entity || dossier.boardRoles.length)}
          href={`/hub/${org.slug}/profile`}
        />
        <PopulationStep
          label="Add next"
          value={`${deliveryCount} delivery records`}
          detail="Programs, services, locations, who is served, and centre/community relationships."
          complete={deliveryCount > 0}
          href={`/hub/${org.slug}/profile?tab=programs`}
        />
        <PopulationStep
          label="Make funder-ready"
          value={`${proofCount} proof records`}
          detail="Stories, media, outcomes, support letters, and public proof that can be shared."
          complete={proofCount > 0}
          href={`/hub/${org.slug}/profile?tab=proof`}
        />
        <PopulationStep
          label="Open money workflow"
          value={formatMoney(dossier.summary.knownFundingTotal)}
          detail="Use GrantScope to find matches, then promote real applications or grants into tracking."
          complete={dossier.summary.fundingRecordCount > 0}
          href={`/funding/workspace/${org.id}`}
          prefetch={false}
        />
        <PopulationStep
          label="People"
          value={`${peopleCount} people signals`}
          detail="Public team records come from JusticeHub; governance roles can sync from CivicScope."
          complete={peopleCount > 0}
          href={`/hub/${org.slug}/profile?tab=people`}
        />
        <PopulationStep
          label="Compliance"
          value="Starts after grants"
          detail="Deadlines appear once a managed grant has dates and reporting requirements."
          complete={false}
          href={`/hub/${org.slug}/compliance`}
        />
      </div>
    </section>
  );
}

function PopulationStep({
  label,
  value,
  detail,
  complete,
  href,
  prefetch,
}: {
  label: string;
  value: string;
  detail: string;
  complete: boolean;
  href: string;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className="group border-2 border-black bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-lg font-black">{value}</p>
        </div>
        <span className={`border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${complete ? 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-800' : 'border-ochre-700 bg-ochre-50 text-ochre-800'}`}>
          {complete ? 'ready' : 'populate'}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-600">{detail}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-ochre-700">
        Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function IdentityTab({ data }: { data: ProfileData }) {
  const { org, dossier } = data;
  const entity = dossier.entity;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <Panel title="Identity and source record" icon={Building2}>
        <div className="grid gap-3 md:grid-cols-2">
          <InfoTile label="JusticeHub name" value={org.name} status="editable" />
          <InfoTile label="ABN" value={org.abn || 'Not attached'} status={org.abn ? 'synced' : 'needs confirmation'} />
          <InfoTile label="Location" value={[org.city || org.location, org.state].filter(Boolean).join(', ') || 'Not recorded'} status="editable" />
          <InfoTile label="Website" value={org.website || 'Not recorded'} status={org.website ? 'published' : 'needs confirmation'} />
          <InfoTile label="CivicScope entity" value={entity?.canonicalName || 'Not resolved'} status={entity ? 'synced' : 'needs confirmation'} />
          <InfoTile label="Source datasets" value={`${entity?.sourceCount ?? 0} source datasets`} status={entity ? 'synced' : 'open'} />
        </div>
        <div className="mt-4 border border-black/15 bg-sand-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Public summary</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {org.description || entity?.description || 'No public summary is recorded yet. Add a plain-English description before this profile is used with funders or partners.'}
          </p>
        </div>
      </Panel>

      <Panel title="Civic OS sync model" icon={Layers}>
        <StatusRow icon={CheckCircle2} label="CivicScope / GrantScope synced" detail="ABN, ACNC, contracts, graph links, public source datasets, and board roles." active={Boolean(entity)} />
        <StatusRow icon={ShieldCheck} label="JusticeHub editable" detail="Description, programs, service locations, people, stories, media, proof, and publishing decisions." active />
        <StatusRow icon={CircleAlert} label="Needs confirmation" detail="Anything missing from programs, proof, people, or delivery locations should be confirmed here." active={!org.description || data.programs.length === 0} />
        <StatusRow icon={Globe2} label="Published surfaces" detail="The public organization profile and funder proof surfaces read from this shared record." active />
      </Panel>
    </div>
  );
}

function ProgramsTab({ data }: { data: ProfileData }) {
  const deliveryCount = data.programs.length + data.dossier.interventions.length;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
      <Panel title="Programs and services" icon={MapPinned}>
        {deliveryCount === 0 ? (
          <EmptyState
            title="No delivery records are attached yet"
            detail="This is the largest usefulness gap for an early adopter org. Add programs, services, locations, target groups, and centre links so funders can understand what the organization actually runs."
          />
        ) : (
          <div className="space-y-3">
            {data.programs.map((program) => (
              <RecordCard
                key={program.id}
                title={program.name}
                badge="Service"
                detail={program.description || program.approach || program.impact_summary || 'No service summary yet.'}
                meta={[
                  program.participants_served ? `${formatNumber(program.participants_served)} participants` : null,
                  program.success_rate ? `${program.success_rate}% success` : null,
                  ...(program.tags || []).slice(0, 2),
                ]}
              />
            ))}
            {data.dossier.interventions.map((intervention) => (
              <RecordCard
                key={intervention.id}
                title={intervention.name}
                badge="ALMA"
                detail={intervention.serviceRole || intervention.type || 'ALMA intervention attached to this organization.'}
                meta={[intervention.geography, intervention.evidenceLevel, intervention.estimatedAnnualCapacity ? `${formatNumber(intervention.estimatedAnnualCapacity)} capacity` : null]}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="What to publish next" icon={ClipboardList}>
        <ActionChecklist
          items={[
            { label: 'Name each program in plain language', complete: data.programs.length > 0 },
            { label: 'Attach locations and centre relationships', complete: data.dossier.centrePartnerships.length > 0 },
            { label: 'Describe who each service is for', complete: data.programs.some((program) => Boolean(program.description)) },
            { label: 'Connect proof or stories to delivery', complete: data.articles.length > 0 },
          ]}
        />
        <ProgramCreateForm
          orgId={data.org.id}
          defaultLocation={data.org.city || data.org.location || ''}
          defaultState={data.org.state || ''}
        />
      </Panel>
    </div>
  );
}

function PeopleTab({ data }: { data: ProfileData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
      <Panel title="People and public team" icon={Users}>
        {data.people.length === 0 ? (
          <EmptyState
            title="No public team members are attached"
            detail="Add the people an org wants visible: contact people, storytellers, board members, program leads, or governance contacts."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.people.map((link) => {
              const profile = profileFromLink(link);
              if (!profile) return null;
              return (
                <RecordCard
                  key={link.id}
                  title={profile.full_name || profile.preferred_name || 'Unnamed person'}
                  badge={link.role || 'Person'}
                  detail={link.role_description || profile.bio || 'No public person summary yet.'}
                  meta={[profile.location, profile.is_public ? 'Public' : 'Private', link.is_featured ? 'Featured' : null]}
                />
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="CivicScope governance roles" icon={BadgeCheck}>
        {data.dossier.boardRoles.length === 0 ? (
          <EmptyState
            title="No board roles resolved from CivicScope"
            detail="When ABN/ACNC data resolves, governance roles can help funders understand the organization and related entities."
          />
        ) : (
          <div className="space-y-3">
            {data.dossier.boardRoles.slice(0, 8).map((role) => (
              <RecordCard
                key={role.id}
                title={role.personName}
                badge={role.roleType}
                detail={role.companyName || data.org.name}
                meta={[role.source, role.confidence, role.cessationDate ? 'Former' : 'Current']}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ProofTab({ data }: { data: ProfileData }) {
  const mediaCount = data.photos.length + data.videos.length + data.mediaItems.length;
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
      <Panel title="Stories, articles, and proof" icon={BookOpen}>
        {data.articles.length === 0 ? (
          <EmptyState
            title="No stories or proof articles are attached"
            detail="Add consented voices, public stories, outcome evidence, photos, and quotes that explain why the work matters."
          />
        ) : (
          <div className="space-y-3">
            {data.articles.map((article) => (
              <RecordCard
                key={article.id}
                title={article.title || 'Untitled story'}
                badge={article.status || 'Story'}
                detail={article.excerpt || 'No excerpt recorded yet.'}
                meta={[article.category, article.published_at ? 'Published' : 'Draft', article.created_at?.slice(0, 10)]}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Proof readiness" icon={Newspaper}>
        <div className="grid gap-3">
          <InfoTile label="Stories/articles" value={String(data.articles.length)} status={data.articles.length > 0 ? 'published' : 'needs confirmation'} />
          <InfoTile label="Media assets" value={String(mediaCount)} status={mediaCount > 0 ? 'published' : 'open'} />
          <InfoTile label="Outcome evidence" value={data.dossier.interventions.length > 0 ? `${data.dossier.interventions.length} ALMA signals` : 'Not recorded'} status={data.dossier.interventions.length > 0 ? 'synced' : 'needs confirmation'} />
        </div>
        <div className="mt-4">
          <ActionChecklist
            items={[
              { label: 'Add at least one consented public story', complete: data.articles.length > 0 },
              { label: 'Attach media or photos', complete: mediaCount > 0 },
              { label: 'Connect proof to programs/services', complete: data.programs.length > 0 && data.articles.length > 0 },
              { label: 'Review public profile before sharing with funders', complete: false },
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}

function PublicOutputTab({ data }: { data: ProfileData }) {
  const { org } = data;
  const isBasecamp = org.type === 'basecamp' || org.partner_tier === 'basecamp';
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
      <Panel title="Published surfaces" icon={Globe2}>
        <div className="grid gap-3 md:grid-cols-2">
          <OutputCard title="Organization profile" detail="Public dossier, claim status, source map, partner map, programs, and proof." href={`/organizations/${org.slug}`} />
          <OutputCard title="Funding workspace" detail="Private readiness, partner asks, applications, blockers, and GrantScope matches." href={`/funding/workspace/${org.id}`} />
          <OutputCard title="Funder proof page" detail="Funder-facing proof should read from the same source map and public proof records." href={`/for-funders/org/${org.slug}`} />
          <OutputCard title={isBasecamp ? 'Mini-site editor' : 'Profile workspace'} detail={isBasecamp ? 'Basecamp mini-site content and gallery controls.' : 'Standard orgs use this profile workspace instead of the mini-site editor.'} href={isBasecamp ? `/hub/${org.slug}/site-editor` : `/hub/${org.slug}/profile`} />
        </div>
      </Panel>

      <Panel title="Before sharing this profile" icon={ShieldCheck}>
        <ActionChecklist
          items={[
            { label: 'Identity and ABN are confirmed', complete: Boolean(org.abn) },
            { label: 'Program/service records explain delivery', complete: data.programs.length + data.dossier.interventions.length > 0 },
            { label: 'People or governance roles are visible', complete: data.people.length + data.dossier.boardRoles.length > 0 },
            { label: 'Stories, proof, or media are attached', complete: data.articles.length + data.photos.length + data.videos.length + data.mediaItems.length > 0 },
            { label: 'Funding readiness has been reviewed', complete: data.dossier.summary.fundingRecordCount > 0 },
          ]}
        />
      </Panel>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-eucalyptus-700" />
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoTile({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="border border-black/15 bg-sand-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
        <span className="border border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold leading-relaxed text-black">{value}</p>
    </div>
  );
}

function StatusRow({ icon: Icon, label, detail, active }: { icon: LucideIcon; label: string; detail: string; active: boolean }) {
  return (
    <div className="mb-3 flex gap-3 border border-black/15 bg-sand-50 p-3 last:mb-0">
      <div className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center border ${active ? 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-800' : 'border-gray-400 bg-white text-gray-500'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-black">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">{detail}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border-2 border-dashed border-black bg-sand-50 p-5">
      <p className="text-base font-black">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{detail}</p>
    </div>
  );
}

function RecordCard({
  title,
  badge,
  detail,
  meta,
}: {
  title: string;
  badge: string;
  detail: string;
  meta: Array<string | null | undefined>;
}) {
  return (
    <article className="border-2 border-black bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-black leading-tight">{title}</h3>
        <span className="shrink-0 border border-black bg-sand-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide">
          {badge}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{detail}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {meta.filter(Boolean).map((item) => (
          <span key={item} className="border border-black/20 bg-sand-50 px-2 py-1 text-xs font-bold text-gray-600">
            {item}
          </span>
        ))}
      </div>
    </article>
  );
}

function ActionChecklist({ items }: { items: Array<{ label: string; complete: boolean }> }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex gap-3 border border-black/15 bg-sand-50 p-3">
          <div className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center border ${item.complete ? 'border-eucalyptus-700 bg-eucalyptus-50 text-eucalyptus-800' : 'border-ochre-700 bg-ochre-50 text-ochre-800'}`}>
            {item.complete ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
          </div>
          <p className="text-sm font-bold leading-relaxed">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function OutputCard({ title, detail, href }: { title: string; detail: string; href: string }) {
  return (
    <Link
      href={href}
      prefetch={href.includes('/funding/workspace') ? false : undefined}
      className="group border-2 border-black bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-black">{title}</h3>
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{detail}</p>
    </Link>
  );
}
