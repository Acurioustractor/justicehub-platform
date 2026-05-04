import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ClaimOrgButton } from '@/components/claims/ClaimOrgButton';
import { OrganizationSupportPathway } from '@/components/organizations/OrganizationSupportPathway';
import {
  GrantScopePartnerMapPanel,
  OrganizationDataSourcesPanel,
  WhyClaimOrganizationPanel,
  type GrantScopePartnerMapData,
  type OrganizationDataSource,
} from '@/components/organizations/OrganizationJourneyPanels';
import {
  getEntityEnrichment,
  getEntityEnrichmentByAbn,
  type EntityEnrichment,
} from '@/lib/grantscope/entity-enrichment';
import {
  getOrganizationDossier,
  type DossierFundingRecord,
  type DossierRelationship,
  type OrganizationDossier,
} from '@/lib/grantscope/org-dossier';
import {
  ArrowRight,
  Building2,
  MapPin,
  Globe,
  Users,
  Briefcase,
  Heart,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Star,
  Phone,
  Mail,
  Play,
  Quote,
  Target,
  Sparkles,
  Shield,
  TrendingDown,
  GraduationCap,
  Mountain,
  Calendar,
  Dumbbell,
  FileText,
  Mic,
  Eye,
  Home,
  Award,
  Link2,
  ImageIcon,
  BarChart3,
  MapPinned,
  DollarSign,
  Handshake,
  Landmark,
  Network,
  UserCheck,
  Lock,
  Clock
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  description: string | null;
  verification_status: string | null;
  is_active: boolean | null;
  city: string | null;
  state: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  abn?: string | null;
  tags: string[] | null;
  created_at: string | null;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  impact_summary: string | null;
  success_rate: number | null;
  participants_served: number | null;
  approach: string;
  is_featured: boolean | null;
  tags: string[] | null;
  [key: string]: unknown;
}

interface Service {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  description: string | null;
  location_city: string | null;
  location_state: string | null;
}

interface TeamMember {
  id: string;
  role: string;
  role_description: string | null;
  is_featured: boolean;
  public_profiles: {
    id: string;
    full_name: string;
    slug: string;
    photo_url: string | null;
    tagline: string | null;
    role_tags: string[];
  };
}

// Partner enrichment interfaces
interface Storyteller {
  id: string;
  display_name: string;
  role_at_org: string | null;
  bio_excerpt: string | null;
  quote: string | null;
  avatar_url: string | null;
  is_featured: boolean | null;
  display_order: number | null;
  [key: string]: unknown;
}

interface Video {
  id: string;
  title: string | null;
  description: string | null;
  video_url: string | null;
  platform: string | null;
  video_type: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_featured: boolean | null;
  [key: string]: unknown;
}

interface Story {
  id: string;
  title: string;
  quote: string | null;
  summary: string | null;
  excerpt: string | null;
  story_type: string | null;
  tags: string[] | null;
  is_featured: boolean | null;
  [key: string]: unknown;
}

interface PartnerGoal {
  id: string;
  goal_type: string;
  title: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  is_featured: boolean | null;
  [key: string]: unknown;
}

interface ImpactMetric {
  id: string;
  metric_name: string;
  metric_value: string;
  metric_context: string | null;
  icon: string | null;
  is_featured: boolean | null;
  display_order: number | null;
  [key: string]: unknown;
}

interface ExternalLink {
  id: string;
  title: string;
  url: string;
  link_type: string;
  description: string | null;
  display_order: number | null;
  [key: string]: unknown;
}

interface PartnerContact {
  id: string;
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean | null;
  display_order: number | null;
  icon: string | null;
  [key: string]: unknown;
}

interface Photo {
  id: string;
  title: string | null;
  description: string | null;
  photo_url: string | null;
  thumbnail_url: string | null;
  photo_type: string | null;
  is_featured: boolean | null;
  is_public: boolean | null;
  display_order: number | null;
  [key: string]: unknown;
}

async function getOrganization(slugOrId: string): Promise<(Organization & { gs_entity_id?: string | null }) | null> {
  const supabase = createServiceClient();

  // Check if it's a UUID (ID) or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  // Try by slug first, then by ID
  let { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq(isUUID ? 'id' : 'slug', slugOrId)
    .eq('is_active', true)
    .single();

  // If not found by slug and it wasn't a UUID, try by ID anyway
  if (error && !isUUID) {
    const result = await supabase
      .from('organizations')
      .select('*')
      .eq('id', slugOrId)
      .eq('is_active', true)
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data;
}

async function getOrgEnrichment(
  gsEntityId: string | null | undefined,
  abn: string | null | undefined,
): Promise<EntityEnrichment | null> {
  try {
    if (gsEntityId) return await getEntityEnrichment(gsEntityId);
    return await getEntityEnrichmentByAbn(abn);
  } catch {
    return null;
  }
}

async function getOrganizationPrograms(orgId: string): Promise<Program[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('registered_services')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_featured', { ascending: false })
    .order('name');

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  return data || [];
}

async function getOrganizationServices(orgId: string): Promise<Service[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, slug, category, description, location_city, location_state')
    .eq('organization_id', orgId)
    .order('name');

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data || [];
}

type LatestClaim = {
  id: string;
  status: 'pending' | 'verified' | 'rejected' | 'revoked';
  contact_name: string | null;
  contact_email: string | null;
  role_at_org: string | null;
  verified_at: string | null;
  created_at: string;
};

async function getLatestOrgClaim(orgId: string): Promise<LatestClaim | null> {
  const supabase = createServiceClient();
  const { data } = await (supabase as any)
    .from('organization_claims')
    .select('id, status, contact_name, contact_email, role_at_org, verified_at, created_at')
    .eq('organization_id', orgId)
    .in('status', ['pending', 'verified'])
    .order('verified_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as LatestClaim | null) ?? null;
}

async function getOrganizationTeam(orgId: string): Promise<TeamMember[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('organizations_profiles')
    .select(`
      id,
      role,
      role_description,
      is_featured,
      public_profiles (
        id,
        full_name,
        slug,
        photo_url,
        tagline,
        role_tags
      )
    `)
    .eq('organization_id', orgId)
    .eq('is_current', true)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching team:', error);
    return [];
  }

  return (data || []) as TeamMember[];
}

// Partner enrichment fetch functions
async function getStorytellers(orgId: string): Promise<Storyteller[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_storytellers')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching storytellers:', error);
    return [];
  }
  return data || [];
}

async function getVideos(orgId: string): Promise<Video[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_videos')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
  return data || [];
}

async function getStories(orgId: string): Promise<Story[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_stories')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
  return data || [];
}

async function getGoals(orgId: string): Promise<PartnerGoal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_goals')
    .select('*')
    .eq('organization_id', orgId)
    .order('display_order');

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
  return data || [];
}

async function getImpactMetrics(orgId: string): Promise<ImpactMetric[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_impact_metrics')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching impact metrics:', error);
    return [];
  }
  return data || [];
}

async function getExternalLinks(orgId: string): Promise<ExternalLink[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_external_links')
    .select('*')
    .eq('organization_id', orgId)
    .order('display_order');

  if (error) {
    console.error('Error fetching external links:', error);
    return [];
  }
  return data || [];
}

async function getContacts(orgId: string): Promise<PartnerContact[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_contacts')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_primary', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  return data || [];
}

async function getPhotos(orgId: string): Promise<Photo[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partner_photos')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('display_order');

  if (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
  return data || [];
}

// Icon mapping helper
function getIcon(iconName: string | null) {
  const icons: Record<string, any> = {
    Target, Heart, Sparkles, Users, Shield, TrendingDown, GraduationCap,
    Mountain, Calendar, Dumbbell, FileText, Mic, Eye, Home, Award, Star,
    Globe, CheckCircle, Building2, Briefcase
  };
  return icons[iconName || ''] || Star;
}

function formatMoney(amount: number | null | undefined) {
  if (!amount || !Number.isFinite(amount)) return 'Not recorded';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatLabel(value: string | null | undefined) {
  return value ? value.replace(/_/g, ' ') : 'Not recorded';
}

function formatSource(value: string | null | undefined) {
  if (!value) return 'source';
  return value.replace(/[_-]/g, ' ');
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function uniqueFundingItems(items: Array<DossierRelationship | DossierFundingRecord>) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = 'otherName' in item
      ? `${item.otherName}|${item.type}|${item.amount || 0}|${item.year || ''}`
      : `${item.source}|${item.programName}|${item.amount || 0}|${item.financialYear || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceStatus(hasData: boolean, hasPartial = false): OrganizationDataSource['status'] {
  if (hasData) return 'ready';
  return hasPartial ? 'partial' : 'missing';
}

function buildPartnerMapData(dossier: OrganizationDossier): GrantScopePartnerMapData {
  const topFunding = uniqueFundingItems([...dossier.fundingReceived, ...dossier.justiceFunding])
    .sort((a, b) => ((b as any).amount || 0) - ((a as any).amount || 0));

  const bestGrants = topFunding.slice(0, 4).map((item) => {
    const isRelationship = 'otherName' in item;
    return {
      label: isRelationship ? item.otherName : item.source,
      detail: isRelationship
        ? [formatLabel(item.type), item.year ? String(item.year) : null, formatSource(item.dataset)].filter(Boolean).join(' · ')
        : [item.programName, item.financialYear, item.state].filter(Boolean).join(' · '),
      amount: item.amount ? formatMoney(item.amount) : null,
      href: isRelationship ? item.sourceUrl : item.sourceUrl,
      tone: 'green' as const,
    };
  });

  const governmentPathways = [
    ...dossier.contracts.map((contract) => ({
      label: contract.buyerName || contract.title || 'Government contract',
      detail: [contract.title, contract.procurementMethod, contract.contractEnd ? `to ${contract.contractEnd}` : null]
        .filter(Boolean)
        .join(' · '),
      amount: contract.contractValue ? formatMoney(contract.contractValue) : null,
      href: contract.sourceUrl,
      tone: 'blue' as const,
    })),
    ...dossier.justiceFunding.slice(0, 3).map((funding) => ({
      label: funding.source || 'Justice funding',
      detail: [funding.programName, funding.financialYear, funding.state].filter(Boolean).join(' · '),
      amount: funding.amount ? formatMoney(funding.amount) : null,
      href: funding.sourceUrl,
      tone: 'blue' as const,
    })),
  ].slice(0, 4);

  const foundationFits = dossier.fundingReceived
    .filter((relationship) => {
      const text = `${relationship.otherName} ${relationship.type}`.toLowerCase();
      return (
        text.includes('foundation') ||
        text.includes('trust') ||
        text.includes('philanth') ||
        text.includes('donation') ||
        relationship.type === 'donation'
      );
    })
    .slice(0, 4)
    .map((relationship) => ({
      label: relationship.otherName,
      detail: [formatLabel(relationship.type), relationship.year ? String(relationship.year) : null].filter(Boolean).join(' · '),
      amount: relationship.amount ? formatMoney(relationship.amount) : null,
      href: relationship.sourceUrl,
      tone: 'purple' as const,
    }));

  const likelyPartners = [
    ...dossier.centrePartnerships.slice(0, 4).map((partnership) => ({
      label: partnership.centreName,
      detail: [partnership.partnershipType, partnership.centreCity, partnership.centreState].filter(Boolean).join(' · '),
      amount: partnership.participantsServed ? `${partnership.participantsServed} participants` : null,
      href: partnership.centreSlug ? `/centres/${partnership.centreSlug}` : null,
      tone: 'red' as const,
    })),
    ...dossier.networkLinks.slice(0, 4).map((relationship) => ({
      label: relationship.otherName,
      detail: [formatLabel(relationship.type), relationship.otherType, relationship.year ? String(relationship.year) : null]
        .filter(Boolean)
        .join(' · '),
      amount: relationship.amount ? formatMoney(relationship.amount) : null,
      href: relationship.sourceUrl,
      tone: 'ochre' as const,
    })),
  ].slice(0, 6);

  const readinessBlockers = [
    dossier.entity ? null : 'Identity is not fully linked to a CivicScope entity yet.',
    dossier.summary.interventionCount > 0 ? null : 'Programs or ALMA interventions still need to be attached.',
    dossier.summary.fundingRecordCount > 0 ? null : 'Funding history is not yet visible from GrantScope.',
    dossier.summary.boardRoleCount > 0 ? null : 'Governance and board role data is not yet resolved.',
  ].filter((item): item is string => Boolean(item));

  return {
    bestGrants,
    governmentPathways,
    foundationFits,
    likelyPartners,
    readinessBlockers,
    nextAction:
      readinessBlockers.length > 0
        ? 'Claim the record, confirm identity, and complete the funding workspace.'
        : 'Use the funding workspace to shortlist the best current opportunity.',
  };
}

function DossierStat({
  label,
  value,
  tone = 'text-earth-900',
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="border-2 border-black bg-white p-4">
      <div className={`text-2xl md:text-3xl font-black ${tone}`}>{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-earth-600">{label}</div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-black/10 py-2 last:border-b-0">
      <span className="text-xs font-bold uppercase tracking-wider text-earth-500">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-bold text-earth-900">{value || 'Not recorded'}</span>
    </div>
  );
}

function FundingLine({ item }: { item: DossierRelationship | DossierFundingRecord }) {
  const isRelationship = 'otherName' in item;
  const name = isRelationship ? item.otherName : item.source;
  const detail = isRelationship
    ? [formatLabel(item.type), item.year ? String(item.year) : null, formatSource(item.dataset)].filter(Boolean).join(' · ')
    : [item.programName, item.financialYear, item.state].filter(Boolean).join(' · ');
  const amount = isRelationship ? item.amount : item.amount;
  const sourceUrl = isRelationship ? item.sourceUrl : item.sourceUrl;

  return (
    <div className="grid gap-3 border-b border-black/10 py-3 last:border-b-0 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-bold text-earth-900">{name}</p>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-earth-400 hover:text-ochre-600">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        {detail && <p className="mt-1 text-xs font-medium uppercase tracking-wide text-earth-500">{detail}</p>}
        {!isRelationship && item.projectDescription && (
          <p className="mt-2 line-clamp-2 text-sm text-earth-600">{item.projectDescription}</p>
        )}
      </div>
      <div className="text-left text-lg font-black text-eucalyptus-700 md:text-right">
        {amount ? formatMoney(amount) : 'Amount not published'}
      </div>
    </div>
  );
}

function DossierEmpty({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-earth-300 bg-white p-5 text-sm font-medium text-earth-500">
      {label}
    </div>
  );
}

function CivicScopeDossier({ dossier, orgName }: { dossier: OrganizationDossier; orgName: string }) {
  const entity = dossier.entity;
  const topFunding = uniqueFundingItems([...dossier.fundingReceived, ...dossier.justiceFunding])
    .sort((a, b) => ((b.amount || 0) - (a.amount || 0)))
    .slice(0, 8);
  const centreNames = uniqueValues(dossier.centrePartnerships.map((partnership) => partnership.centreName));
  const programNames = dossier.interventions.slice(0, 6);
  const hasDossierData = Boolean(
    entity ||
    dossier.justiceFunding.length ||
    dossier.contracts.length ||
    dossier.relationships.length ||
    dossier.boardRoles.length ||
    dossier.interventions.length ||
    dossier.centrePartnerships.length,
  );

  if (!hasDossierData) return null;

  return (
    <section className="border-b-2 border-black bg-white py-12">
      <div className="container-justice">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border-2 border-black bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-800">
              <Network className="h-4 w-4" />
              CivicScope Dossier
            </div>
            <h2 className="text-3xl font-black md:text-4xl">Money, People, Programs & Relationships</h2>
          </div>
          {entity?.sourceDatasets && entity.sourceDatasets.length > 0 && (
            <div className="max-w-xl text-sm font-medium text-earth-600 lg:text-right">
              {entity.sourceDatasets.slice(0, 5).map(formatSource).join(' · ')}
              {entity.sourceDatasets.length > 5 ? ` · +${entity.sourceDatasets.length - 5}` : ''}
            </div>
          )}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <DossierStat label="Known funding" value={formatMoney(dossier.summary.knownFundingTotal)} tone="text-eucalyptus-700" />
          <DossierStat label="Funding records" value={dossier.summary.fundingRecordCount} tone="text-eucalyptus-700" />
          <DossierStat label="Relationships" value={dossier.summary.relationshipCount} tone="text-blue-700" />
          <DossierStat label="Board roles" value={dossier.summary.boardRoleCount} tone="text-ochre-700" />
          <DossierStat label="Centres linked" value={dossier.summary.centreCount} tone="text-red-700" />
          <DossierStat label="Interventions" value={dossier.summary.interventionCount} tone="text-purple-700" />
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-2 border-black bg-sand-50 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-earth-700" />
              <div>
                <h3 className="text-2xl font-black">Identity & Location</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-earth-600">via CivicScope</span>
              </div>
            </div>
            <FactRow label="Canonical name" value={entity?.canonicalName || orgName} />
            <FactRow label="Type" value={formatLabel(entity?.entityType)} />
            <FactRow label="Sector" value={[entity?.sector, entity?.subSector].filter(Boolean).join(' · ') || null} />
            <FactRow label="ABN / ACN" value={[entity?.abn, entity?.acn].filter(Boolean).join(' / ') || null} />
            <FactRow label="GS ID" value={entity?.gsId} />
            <FactRow label="Location" value={[entity?.state, entity?.postcode, entity?.lgaName].filter(Boolean).join(' · ') || null} />
            <FactRow label="Place context" value={[entity?.remoteness, entity?.seifaDecile ? `SEIFA ${entity.seifaDecile}/10` : null].filter(Boolean).join(' · ') || null} />
            <FactRow label="Controlled" value={entity?.isCommunityControlled ? 'Community controlled' : null} />
            <FactRow label="Source count" value={entity?.sourceCount} />
            <FactRow label="Confidence" value={formatLabel(entity?.confidence)} />
          </div>

          <div className="border-2 border-black bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-eucalyptus-700" />
              <div>
                <h3 className="text-2xl font-black">Funding Received</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-earth-600">via GrantScope · CivicScope</span>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="border border-black p-3">
                <div className="text-lg font-black text-eucalyptus-700">{formatMoney(dossier.summary.justiceFundingTotal)}</div>
                <div className="text-[10px] font-bold uppercase text-earth-500">Justice Programs</div>
              </div>
              <div className="border border-black p-3">
                <div className="text-lg font-black text-eucalyptus-700">{formatMoney(dossier.summary.contractTotal)}</div>
                <div className="text-[10px] font-bold uppercase text-earth-500">Public Contracts</div>
              </div>
              <div className="border border-black p-3">
                <div className="text-lg font-black text-eucalyptus-700">{formatMoney(dossier.summary.relationshipFundingTotal)}</div>
                <div className="text-[10px] font-bold uppercase text-earth-500">Donor & Foundation Flow</div>
              </div>
            </div>
            {topFunding.length > 0 ? (
              <div>
                {topFunding.map((item) => (
                  <FundingLine key={'otherName' in item ? `rel-${item.id}` : `fund-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <DossierEmpty label="No public funding records are linked yet." />
            )}
          </div>
        </div>

        <div className="mb-8 border-2 border-black bg-blue-50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <Landmark className="h-6 w-6 text-blue-700" />
            <h3 className="text-2xl font-black">Money & Relationship Map</h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
            <div className="border-2 border-black bg-white p-4">
              <div className="mb-3 text-xs font-black uppercase tracking-wider text-earth-500">Funders / buyers</div>
              <div className="space-y-2">
                {topFunding.slice(0, 5).map((item) => (
                  <div key={'otherName' in item ? `map-rel-${item.id}` : `map-fund-${item.id}`} className="border-b border-black/10 pb-2 last:border-b-0">
                    <div className="font-bold text-earth-900">{'otherName' in item ? item.otherName : item.source}</div>
                    <div className="text-xs font-bold uppercase text-eucalyptus-700">{formatMoney(item.amount)}</div>
                  </div>
                ))}
                {topFunding.length === 0 && <p className="text-sm text-earth-500">No linked funders yet.</p>}
              </div>
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <ArrowRight className="h-8 w-8 text-blue-700" />
            </div>

            <div className="border-2 border-black bg-white p-4">
              <div className="mb-3 text-xs font-black uppercase tracking-wider text-earth-500">Organization</div>
              <div className="text-xl font-black text-earth-900">{orgName}</div>
              <div className="mt-2 text-sm text-earth-600">{formatLabel(entity?.entityType)}</div>
              {entity?.latestRevenue && (
                <div className="mt-4 border-t border-black/10 pt-3 text-sm">
                  <span className="font-black">{formatMoney(entity.latestRevenue)}</span>
                  <span className="text-earth-500"> revenue {entity.financialYear ? `(${entity.financialYear})` : ''}</span>
                </div>
              )}
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <ArrowRight className="h-8 w-8 text-blue-700" />
            </div>

            <div className="border-2 border-black bg-white p-4">
              <div className="mb-3 text-xs font-black uppercase tracking-wider text-earth-500">Programs / places</div>
              <div className="space-y-2">
                {programNames.map((program) => (
                  <div key={`intervention-${program.id}`} className="border-b border-black/10 pb-2 last:border-b-0">
                    <div className="font-bold text-earth-900">{program.name}</div>
                    <div className="text-xs font-bold uppercase text-earth-500">{formatLabel(program.type)}</div>
                  </div>
                ))}
                {programNames.length === 0 && centreNames.slice(0, 5).map((centre) => (
                  <div key={`centre-map-${centre}`} className="border-b border-black/10 pb-2 last:border-b-0 font-bold text-earth-900">
                    {centre}
                  </div>
                ))}
                {programNames.length === 0 && centreNames.length === 0 && <p className="text-sm text-earth-500">No linked delivery places yet.</p>}
              </div>
            </div>
          </div>
        </div>

        {(dossier.centrePartnerships.length > 0 || dossier.boardRoles.length > 0 || dossier.networkLinks.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-3">
            {dossier.centrePartnerships.length > 0 && (
              <div className="border-2 border-black bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-red-700" />
                  <div>
                    <h3 className="text-xl font-black">Centres & Places</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-earth-600">via Centre of Excellence</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {dossier.centrePartnerships.slice(0, 8).map((partnership) => (
                    <Link
                      key={partnership.id}
                      href={`/centres/${partnership.centreSlug || partnership.centreId}`}
                      className="block border-b border-black/10 pb-3 last:border-b-0"
                    >
                      <div className="font-black text-earth-900 hover:text-red-700">{partnership.centreName}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-red-700">
                        {formatLabel(partnership.partnershipType)}
                      </div>
                      {(partnership.centreCity || partnership.centreState) && (
                        <div className="mt-1 text-sm text-earth-600">
                          {[partnership.centreCity, partnership.centreState].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {partnership.description && <p className="mt-2 line-clamp-2 text-sm text-earth-600">{partnership.description}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {dossier.boardRoles.length > 0 && (
              <div className="border-2 border-black bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-ochre-700" />
                  <div>
                    <h3 className="text-xl font-black">Board & Governance</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-earth-600">via CivicScope · ACNC</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {dossier.boardRoles.slice(0, 10).map((role) => (
                    <div key={role.id} className="border-b border-black/10 pb-3 last:border-b-0">
                      <div className="font-black text-earth-900">{role.personName}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-ochre-700">
                        {formatLabel(role.roleType)}
                        {role.cessationDate ? ' · former' : ''}
                      </div>
                      <div className="mt-1 text-xs text-earth-500">{formatSource(role.source)} · {formatLabel(role.confidence)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dossier.networkLinks.length > 0 && (
              <div className="border-2 border-black bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Handshake className="h-6 w-6 text-blue-700" />
                  <div>
                    <h3 className="text-xl font-black">Network Links</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-earth-600">via CivicGraph</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {dossier.networkLinks.slice(0, 10).map((relationship) => (
                    <div key={relationship.id} className="border-b border-black/10 pb-3 last:border-b-0">
                      <div className="font-black text-earth-900">{relationship.otherName}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                        {relationship.direction === 'incoming' ? 'from' : 'to'} · {formatLabel(relationship.type)}
                      </div>
                      <div className="mt-1 text-xs text-earth-500">{formatSource(relationship.dataset)} · {formatLabel(relationship.confidence)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Founding Basecamps in the current Centre of Excellence org set
const FOUNDING_BASECAMPS = [
  { slug: 'oonchiumpa', name: 'Oonchiumpa', region: 'Mparntwe (Alice Springs), NT' },
  { slug: 'palm-island-community-company', name: 'Palm Island Community Company', region: 'Townsville, QLD' },
  { slug: 'bg-fit', name: 'BG Fit', region: 'Mount Isa, QLD' },
  { slug: 'mmeic', name: 'MMEIC', region: 'Minjerribah, QLD' },
];

function isFoundingBasecamp(slug: string): boolean {
  return FOUNDING_BASECAMPS.some(bc => bc.slug === slug);
}

async function getExistingFoundingBasecamps() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('slug')
    .in('slug', FOUNDING_BASECAMPS.map((basecamp) => basecamp.slug))
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching founding basecamps:', error);
    return FOUNDING_BASECAMPS;
  }

  const activeSlugs = new Set(
    (data || [])
      .map((row) => row.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
  );

  return FOUNDING_BASECAMPS.filter((basecamp) => activeSlugs.has(basecamp.slug));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const org = await getOrganization(params.slug);

  if (!org) {
    return {
      title: 'Organization Not Found',
    };
  }

  return {
    title: `${org.name} | JusticeHub`,
    description: org.description || `Learn about ${org.name} and their programs`,
  };
}

export default async function OrganizationPage({
  params,
}: {
  params: { slug: string };
}) {
  const org = await getOrganization(params.slug);

  if (!org) {
    notFound();
  }

  // Fetch all related data in parallel
  const [programs, services, team, storytellers, videos, stories, goals, impactMetrics, externalLinks, contacts, photos, enrichment, dossier, foundingBasecamps, latestClaim] = await Promise.all([
    getOrganizationPrograms(org.id),
    getOrganizationServices(org.id),
    getOrganizationTeam(org.id),
    getStorytellers(org.id),
    getVideos(org.id),
    getStories(org.id),
    getGoals(org.id),
    getImpactMetrics(org.id),
    getExternalLinks(org.id),
    getContacts(org.id),
    getPhotos(org.id),
    getOrgEnrichment((org as any).gs_entity_id, org.abn),
    getOrganizationDossier({
      orgId: org.id,
      orgName: org.name,
      gsEntityId: (org as any).gs_entity_id,
      abn: org.abn,
    }),
    getExistingFoundingBasecamps(),
    getLatestOrgClaim(org.id),
  ]);

  // Separate goals by type
  const mission = goals.find(g => g.goal_type === 'mission');
  const vision = goals.find(g => g.goal_type === 'vision');
  const values = goals.filter(g => g.goal_type === 'value');
  const otherBasecamps = org.slug
    ? foundingBasecamps.filter((basecamp) => basecamp.slug !== org.slug)
    : [];
  const profileReadiness = {
    hasIdentity: Boolean(org.abn || (org as any).gs_entity_id || dossier.entity),
    hasSummary: Boolean(org.description),
    hasProgramsOrServices: programs.length > 0 || services.length > 0 || dossier.interventions.length > 0,
    hasPeopleOrStories: team.length > 0 || storytellers.length > 0 || stories.length > 0,
    hasFundingData:
      dossier.summary.fundingRecordCount > 0 ||
      dossier.summary.knownFundingTotal > 0 ||
      Boolean(enrichment?.relationshipSummary?.totalRelationships),
    hasPublicSite: Boolean(org.slug),
  };
  const dataSources: OrganizationDataSource[] = [
    {
      key: 'identity',
      label: 'Identity and ABN',
      status: sourceStatus(profileReadiness.hasIdentity, Boolean(org.abn || (org as any).gs_entity_id)),
      detail: org.abn
        ? `ABN ${org.abn}${dossier.entity ? ' is linked to CivicScope.' : ' is present and ready to link.'}`
        : dossier.entity
          ? 'CivicScope entity is linked.'
          : 'ABN or CivicScope identity needs confirmation.',
    },
    {
      key: 'programs',
      label: 'Programs and services',
      status: sourceStatus(profileReadiness.hasProgramsOrServices),
      detail: `${programs.length + dossier.interventions.length} program/intervention record${programs.length + dossier.interventions.length === 1 ? '' : 's'} and ${services.length} service record${services.length === 1 ? '' : 's'} currently attached.`,
      href: org.slug ? `/hub/${org.slug}` : undefined,
    },
    {
      key: 'places',
      label: 'Centre and place links',
      status: sourceStatus(dossier.summary.centreCount > 0),
      detail: dossier.summary.centreCount > 0
        ? `${dossier.summary.centreCount} detention centre link${dossier.summary.centreCount === 1 ? '' : 's'} resolved.`
        : 'No active centre partnerships are attached yet.',
    },
    {
      key: 'money',
      label: 'Money and grants',
      status: sourceStatus(profileReadiness.hasFundingData),
      detail: dossier.summary.fundingRecordCount > 0
        ? `${dossier.summary.fundingRecordCount} funding record${dossier.summary.fundingRecordCount === 1 ? '' : 's'} totalling ${formatMoney(dossier.summary.knownFundingTotal)} are visible.`
        : 'GrantScope has not resolved funding history for this record yet.',
      href: `/funding/workspace/${org.id}`,
    },
    {
      key: 'people',
      label: 'People and governance',
      status: sourceStatus(team.length > 0 || dossier.summary.boardRoleCount > 0),
      detail: `${team.length} public team link${team.length === 1 ? '' : 's'} and ${dossier.summary.boardRoleCount} governance role${dossier.summary.boardRoleCount === 1 ? '' : 's'} are visible.`,
    },
    {
      key: 'stories',
      label: 'Stories and media',
      status: sourceStatus(stories.length > 0 || storytellers.length > 0 || videos.length > 0 || photos.length > 0),
      detail: `${stories.length} story record${stories.length === 1 ? '' : 's'}, ${storytellers.length} storyteller link${storytellers.length === 1 ? '' : 's'}, and ${photos.length + videos.length} media asset${photos.length + videos.length === 1 ? '' : 's'} are attached.`,
    },
    {
      key: 'claim',
      label: 'Claim and access',
      status: sourceStatus(org.verification_status === 'verified' || org.verification_status === 'acnc_verified', Boolean(org.verification_status)),
      detail: org.verification_status
        ? `Current verification status: ${formatLabel(org.verification_status)}.`
        : 'No verified organization owner is visible yet.',
      href: org.slug ? `/organizations/${org.slug}#claim-organization` : undefined,
    },
    {
      key: 'public-output',
      label: 'Public outputs',
      status: sourceStatus(Boolean(org.slug)),
      detail: org.slug
        ? 'Public organization profile, site, and funder surfaces can use this slug.'
        : 'A stable public slug is needed before publishing linked proof surfaces.',
      href: org.slug ? `/sites/${org.slug}` : undefined,
    },
  ];
  const partnerMapData = buildPartnerMapData(dossier);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="page-content">
        {/* Breadcrumbs */}
        <div className="bg-white border-b-2 border-black">
          <div className="container-justice py-4">
            <nav className="flex items-center gap-2 text-sm text-earth-600">
              <Link href="/" className="hover:text-ochre-600">
                Home
              </Link>
              <span>/</span>
              <Link href="/organizations" className="hover:text-ochre-600">
                Organizations
              </Link>
              <span>/</span>
              <span className="text-earth-900 font-medium">{org.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-ochre-50 via-sand-50 to-eucalyptus-50 py-16 border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl">
              {/* Founding Basecamp Badge */}
              {org.slug && isFoundingBasecamp(org.slug) && (
                <div className="mb-4">
                  <Link
                    href="/centre-of-excellence/map?category=basecamp"
                    className="inline-flex items-center gap-2 bg-ochre-600 text-white px-4 py-2 border-2 border-black text-sm font-bold uppercase tracking-wider hover:bg-ochre-700 transition-colors"
                  >
                    <Mountain className="w-4 h-4" />
                    Founding Basecamp
                    <span className="text-ochre-200">|</span>
                    <span className="font-normal">Part of Centre of Excellence Network</span>
                  </Link>
                </div>
              )}

              {/* Verification + Claim Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {org.verification_status === 'verified' && (
                  <div className="inline-flex items-center gap-2 bg-eucalyptus-100 text-eucalyptus-800 px-3 py-1 border border-black text-sm font-bold uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4" />
                    Verified Organization
                  </div>
                )}
                {latestClaim?.status === 'verified' && (
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 border border-black text-sm font-bold uppercase tracking-wider" title={latestClaim.contact_name ? `Claimed by ${latestClaim.contact_name}` : 'Community-claimed organisation'}>
                    <Lock className="w-4 h-4" />
                    Community-Claimed
                    {latestClaim.contact_name && (
                      <span className="font-normal normal-case tracking-normal text-blue-700">· {latestClaim.contact_name}</span>
                    )}
                  </div>
                )}
                {latestClaim?.status === 'pending' && (
                  <div className="inline-flex items-center gap-2 bg-ochre-100 text-ochre-800 px-3 py-1 border border-black text-sm font-bold uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    Claim Pending Review
                  </div>
                )}
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-earth-900 mb-4">
                {org.name}
              </h1>

              {/* Location & Type */}
              <div className="flex flex-wrap gap-4 mb-6">
                {org.city && org.state && (
                  <div className="flex items-center gap-2 text-earth-700 font-medium">
                    <MapPin className="w-5 h-5" />
                    {org.city}, {org.state}
                  </div>
                )}
                {org.type && (
                  <span className="px-3 py-1 bg-black text-white text-sm font-bold uppercase tracking-wider">
                    {org.type.replace('-', ' ')}
                  </span>
                )}
              </div>

              {/* Description */}
              {org.description && (
                <p className="text-xl text-earth-700 mb-8 leading-relaxed max-w-3xl">
                  {org.description}
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 mb-8 pt-6 border-t-2 border-black/10">
                {programs.length > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-eucalyptus-600">{programs.length}</div>
                    <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">Programs</p>
                  </div>
                )}
                {services.length > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-ochre-600">{services.length}</div>
                    <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">Services</p>
                  </div>
                )}
                {team.length > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{team.length}</div>
                    <p className="text-sm uppercase tracking-wide text-earth-600 font-medium">Team Members</p>
                  </div>
                )}
              </div>

              {/* Contact Links */}
              <div id="claim-organization" className="flex flex-wrap gap-4">
                {org.slug && (
                  <Link
                    href={`/sites/${org.slug}`}
                    className="inline-flex items-center gap-2 bg-ochre-600 text-white px-6 py-3 font-bold hover:bg-ochre-700 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    Visit Full Site
                  </Link>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold hover:bg-earth-800 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    Visit Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </a>
                )}
                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </a>
                )}
                <ClaimOrgButton
                  orgId={org.id}
                  orgSlug={org.slug || org.id}
                  fundingWorkspaceHref={`/funding/workspace/${org.id}`}
                  isBusinessWorkspace={Boolean(org.slug && isFoundingBasecamp(org.slug))}
                />
              </div>

              <div className="mt-6 max-w-3xl">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Preview the funding workspace above. Once {org.name} claims this profile, the
                  same surface becomes the live operating space for partnerships, drafts, and
                  funding pipeline.
                </p>
              </div>

              {/* Tags */}
              {org.tags && org.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8">
                  {org.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-white border border-black text-earth-700 px-3 py-1 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <OrganizationSupportPathway
          mode="profile"
          orgId={org.id}
          orgSlug={org.slug}
          orgName={org.name}
          readiness={profileReadiness}
        />
        <WhyClaimOrganizationPanel
          orgName={org.name}
          claimHref={`/organizations/${org.slug || org.id}#claim-organization`}
          variant="profile"
        />
        <OrganizationDataSourcesPanel sources={dataSources} />
        <GrantScopePartnerMapPanel
          orgName={org.name}
          data={partnerMapData}
          workspaceHref={`/funding/workspace/${org.id}`}
        />

        {/* Lived Experience Impact Section */}
        {impactMetrics && impactMetrics.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-black text-white">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Target className="h-8 w-8 text-ochre-400" />
                <h2 className="text-3xl font-black">Demonstrated Impact</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {impactMetrics.map((metric) => (
                  <div key={metric.id} className="p-6 border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      {metric.icon && <span className="text-2xl">{metric.icon}</span>}
                      {metric.is_featured && <Star className="w-5 h-5 text-ochre-400 fill-ochre-400" />}
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {metric.metric_value}
                    </div>
                    <div className="font-bold text-lg text-ochre-400 tracking-tight leading-tight">
                      {metric.metric_name}
                    </div>
                    {metric.metric_context && (
                      <div className="mt-4 text-sm text-white/60">
                        {metric.metric_context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Data Insights Section — from GrantScope entity graph */}
        {enrichment && (
          <section className="py-10 border-b-2 border-black bg-blue-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-7 w-7 text-blue-700" />
                <h2 className="text-2xl font-black">Data Insights</h2>
                <span className="text-xs font-bold uppercase tracking-wider bg-blue-200 text-blue-800 px-2 py-1">
                  via GrantScope
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {enrichment.isCommunityControlled && (
                  <div className="bg-white p-4 border-2 border-black">
                    <Shield className="w-6 h-6 mb-2 text-eucalyptus-600" />
                    <div className="font-bold text-sm uppercase tracking-wide text-eucalyptus-700">Community Controlled</div>
                  </div>
                )}
                {enrichment.remoteness && (
                  <div className="bg-white p-4 border-2 border-black">
                    <MapPinned className="w-6 h-6 mb-2 text-ochre-600" />
                    <div className="text-2xl font-black text-earth-900">{enrichment.remoteness}</div>
                    <div className="text-xs font-bold uppercase tracking-wide text-earth-600">Remoteness</div>
                  </div>
                )}
                {enrichment.seifaDecile && (
                  <div className="bg-white p-4 border-2 border-black">
                    <BarChart3 className="w-6 h-6 mb-2 text-blue-600" />
                    <div className="text-2xl font-black text-earth-900">{enrichment.seifaDecile}/10</div>
                    <div className="text-xs font-bold uppercase tracking-wide text-earth-600">SEIFA Decile</div>
                  </div>
                )}
                {enrichment.latestRevenue && (
                  <div className="bg-white p-4 border-2 border-black">
                    <DollarSign className="w-6 h-6 mb-2 text-eucalyptus-600" />
                    <div className="text-2xl font-black text-earth-900">
                      ${enrichment.latestRevenue >= 1_000_000
                        ? `${(enrichment.latestRevenue / 1_000_000).toFixed(1)}M`
                        : enrichment.latestRevenue >= 1_000
                          ? `${(enrichment.latestRevenue / 1_000).toFixed(0)}K`
                          : enrichment.latestRevenue.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wide text-earth-600">
                      Revenue {enrichment.financialYear ? `(${enrichment.financialYear})` : ''}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Funding Sources */}
              {enrichment.relationshipSummary.topFundingSources.length > 0 && (
                <div className="bg-white border-2 border-black p-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-earth-600 mb-3">
                    Top Funding Sources ({enrichment.relationshipSummary.totalRelationships} relationships)
                  </h3>
                  <div className="space-y-2">
                    {enrichment.relationshipSummary.topFundingSources.map((source, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-earth-800 truncate mr-4">{source.name}</span>
                        <span className="font-bold text-eucalyptus-700 whitespace-nowrap">
                          ${source.amount >= 1_000_000
                            ? `${(source.amount / 1_000_000).toFixed(1)}M`
                            : source.amount >= 1_000
                              ? `${(source.amount / 1_000).toFixed(0)}K`
                              : source.amount.toLocaleString()}
                          {source.year ? ` (${source.year})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <CivicScopeDossier dossier={dossier} orgName={org.name} />

        {/* Team Section */}
        {team.length > 0 && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Users className="h-8 w-8" />
                <h2 className="text-3xl font-black">Team</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.map((member) => (
                  <Link
                    key={member.id}
                    href={`/people/${member.public_profiles.slug}`}
                    className="group border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {member.public_profiles.photo_url ? (
                        <img
                          src={member.public_profiles.photo_url}
                          alt={member.public_profiles.full_name}
                          className="w-16 h-16 rounded-full border-2 border-black object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-black bg-sand-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-earth-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg group-hover:text-ochre-600 transition-colors truncate">
                          {member.public_profiles.full_name}
                        </h3>
                        <p className="text-sm text-ochre-600 font-medium">{member.role}</p>
                        {member.role_description && (
                          <p className="text-sm text-earth-600 mt-1 line-clamp-2">{member.role_description}</p>
                        )}
                      </div>
                    </div>
                    {member.is_featured && (
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ochre-600">
                        <Star className="w-3 h-3" />
                        Featured
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Mission, Vision & Values Section */}
        {(mission || vision || values.length > 0) && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Mission & Vision */}
                <div className="space-y-6">
                  {mission && (
                    <div className="border-2 border-black p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-6 h-6 text-ochre-600" />
                        <h3 className="font-bold text-lg">{mission.title}</h3>
                      </div>
                      <p className="text-earth-700">{mission.description}</p>
                    </div>
                  )}
                  {vision && (
                    <div className="border-2 border-black p-6 bg-ochre-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-6 h-6 text-ochre-600" />
                        <h3 className="font-bold text-lg">{vision.title}</h3>
                      </div>
                      <p className="text-earth-700">{vision.description}</p>
                    </div>
                  )}
                </div>

                {/* Values */}
                {values.length > 0 && (
                  <div>
                    <h3 className="font-bold text-xl mb-4">Our Values</h3>
                    <div className="space-y-4">
                      {values.map((value) => {
                        const IconComponent = getIcon(value.icon);
                        return (
                          <div key={value.id} className="flex items-start gap-3">
                            <div className="p-2 bg-eucalyptus-100 border border-black">
                              <IconComponent className="w-5 h-5 text-eucalyptus-700" />
                            </div>
                            <div>
                              <h4 className="font-bold">{value.title}</h4>
                              {value.description && (
                                <p className="text-sm text-earth-600">{value.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Key People / Storytellers Section */}
        {storytellers.length > 0 && (
          <section className="py-16 border-b-2 border-black bg-sand-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-10">
                <Mic className="h-8 w-8 text-ochre-600" />
                <h2 className="text-3xl lg:text-4xl font-black">Storytellers & Elders</h2>
                <div className="ml-4 h-px flex-1 bg-black/10"></div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                {storytellers.map((person) => (
                  <div key={person.id} className="bg-white border-2 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col h-full rounded-xl overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 flex-1">
                      {person.avatar_url ? (
                        <div className="shrink-0 w-24 h-24 md:w-32 md:h-32">
                          <img
                            src={person.avatar_url}
                            alt={person.display_name}
                            className="w-full h-full rounded-full border-4 border-black object-cover"
                          />
                        </div>
                      ) : (
                        <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-black bg-ochre-100 flex items-center justify-center">
                          <Users className="w-12 h-12 text-ochre-600" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {person.is_featured && (
                          <div className="mb-2">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-eucalyptus-100 border border-eucalyptus-200 text-[10px] font-bold uppercase tracking-wider text-eucalyptus-800 rounded-full">
                               <Star className="w-3 h-3 fill-eucalyptus-600 text-eucalyptus-600" />
                               Lived Experience Leader
                             </span>
                          </div>
                        )}
                        <h3 className="font-black text-2xl md:text-3xl tracking-tight mb-1 truncate">{person.display_name}</h3>
                        {person.role_at_org && (
                          <p className="text-earth-600 font-bold uppercase tracking-wider text-sm mb-4">{person.role_at_org}</p>
                        )}
                        {person.bio_excerpt && (
                          <p className="text-earth-700 text-base leading-relaxed mb-6">{person.bio_excerpt}</p>
                        )}
                      </div>
                    </div>

                    {person.quote && (
                      <div className="border-t-2 border-black bg-ochre-50 p-6 md:px-8 shrink-0">
                        <Quote className="w-6 h-6 text-ochre-400 mb-3 opacity-50" />
                        <blockquote className="text-lg md:text-xl font-serif italic text-earth-900 leading-snug">
                          "{person.quote}"
                        </blockquote>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Youth Stories Section */}
        {stories.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-black text-white">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Quote className="h-8 w-8 text-ochre-400" />
                <h2 className="text-3xl font-black">Youth Voices</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <div key={story.id} className="border-2 border-white/20 p-6 bg-white/5">
                    <h3 className="font-bold text-lg mb-3 text-ochre-400">{story.title}</h3>
                    {story.quote && (
                      <blockquote className="text-xl font-medium mb-4 leading-relaxed">
                        "{story.quote}"
                      </blockquote>
                    )}
                    {(story.summary || story.excerpt) && (
                      <p className="text-gray-400 text-sm">{story.summary || story.excerpt}</p>
                    )}
                    {story.tags && story.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {story.tags.map((tag) => (
                          <span key={tag} className="bg-white/10 text-white/80 px-2 py-1 text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Documentaries & Media Section */}
        {videos.length > 0 && (
          <section className="py-16 border-b-2 border-black bg-black text-white">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-12">
                <Play className="h-8 w-8 text-ochre-400" />
                <h2 className="text-3xl lg:text-4xl font-black">Documentaries & Media</h2>
              </div>

              {/* Featured Video (Top 1) */}
              {videos.length > 0 && (
                <div className="mb-8 relative group">
                  <a
                    href={videos[0].video_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-video w-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all rounded-xl"
                  >
                    {videos[0].thumbnail_url ? (
                      <img src={videos[0].thumbnail_url} alt={videos[0].title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-[#111] flex items-center justify-center text-white/50 text-6xl">▶</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 md:p-10">
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm">
                          {videos[0].video_type || 'Documentary'}
                        </span>
                      </div>
                      <h3 className="font-bold text-3xl md:text-5xl text-white mb-2 leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {videos[0].title}
                      </h3>
                      {videos[0].description && (
                         <p className="text-white/80 text-lg max-w-3xl line-clamp-2 md:line-clamp-3">{videos[0].description}</p>
                      )}

                      {/* Play Button Overlay */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                         <Play className="w-10 h-10 md:w-12 md:h-12 text-white ml-2" fill="white" />
                      </div>
                    </div>
                  </a>
                </div>
              )}

              {/* Remaining Videos */}
              {videos.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {videos.slice(1).map((video) => (
                    <a
                      key={video.id}
                      href={video.video_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all bg-white/5"
                    >
                      <div className="aspect-video bg-[#111] relative overflow-hidden">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50 text-3xl">▶</div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 border border-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:scale-110 transition-all">
                          <Play className="w-5 h-5 text-white ml-1" fill="white" />
                        </div>
                        {video.duration_seconds && (
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white/90 px-2 py-1 text-xs rounded-md backdrop-blur-sm font-mono">
                            {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">
                          {video.video_type}
                        </span>
                        <h4 className="font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2">
                          {video.title}
                        </h4>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Photo Gallery Section */}
        {photos.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-eucalyptus-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <ImageIcon className="h-8 w-8 text-eucalyptus-700" />
                <h2 className="text-3xl font-black">Gallery</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative group border-2 border-black overflow-hidden ${
                      photo.is_featured ? 'col-span-2 row-span-2' : ''
                    }`}
                  >
                    <img
                      src={photo.thumbnail_url || photo.photo_url || ''}
                      alt={photo.title || 'Gallery image'}
                      className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300"
                    />
                    {(photo.title || photo.description) && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-end">
                        <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {photo.title && <h4 className="font-bold">{photo.title}</h4>}
                          {photo.description && <p className="text-sm text-white/80 line-clamp-2">{photo.description}</p>}
                        </div>
                      </div>
                    )}
                    {photo.is_featured && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-ochre-500 text-white px-2 py-1 text-xs font-bold uppercase">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* External Links Section */}
        {externalLinks.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-sand-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Link2 className="h-8 w-8" />
                <h2 className="text-3xl font-black">Resources & Links</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {externalLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group"
                  >
                    <div className="p-2 bg-ochre-100 border border-black">
                      {link.link_type === 'website' && <Globe className="w-5 h-5 text-ochre-700" />}
                      {link.link_type === 'research' && <FileText className="w-5 h-5 text-blue-700" />}
                      {link.link_type === 'documentary' && <Play className="w-5 h-5 text-red-700" />}
                      {link.link_type === 'news' && <FileText className="w-5 h-5 text-earth-700" />}
                      {link.link_type === 'social' && <Users className="w-5 h-5 text-blue-500" />}
                      {link.link_type === 'podcast' && <Mic className="w-5 h-5 text-purple-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold group-hover:text-ochre-600 transition-colors truncate">
                        {link.title}
                      </h4>
                      {link.description && (
                        <p className="text-sm text-earth-600 truncate">{link.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-earth-400 group-hover:text-ochre-600" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Programs Section */}
        {programs.length > 0 && (
          <section className="py-12 border-b-2 border-black bg-eucalyptus-50">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Heart className="h-8 w-8 text-eucalyptus-600" />
                <div>
                  <h2 className="text-3xl font-black">Community Programs</h2>
                  <p className="text-earth-600">
                    {programs.length} program{programs.length !== 1 ? 's' : ''} making a difference
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {programs.map((program) => (
                  <Link
                    key={program.id}
                    href={`/community-programs/${program.id}`}
                    className="group border-2 border-black bg-white overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {program.is_featured && (
                      <div className="bg-ochre-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Featured Program
                      </div>
                    )}

                    <div className="p-6">
                      {program.approach && (
                        <span className="inline-block px-2 py-1 bg-eucalyptus-100 border border-black text-xs font-bold uppercase mb-3">
                          {program.approach}
                        </span>
                      )}

                      <h3 className="text-xl font-bold mb-3 group-hover:text-eucalyptus-600 transition-colors">
                        {program.name}
                      </h3>

                      <p className="text-earth-600 mb-4 line-clamp-2">
                        {program.description}
                      </p>

                      {/* Metrics */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        {program.success_rate && (
                          <div className="text-sm">
                            <span className="font-bold text-eucalyptus-600">{program.success_rate}%</span>
                            <span className="text-earth-600"> success rate</span>
                          </div>
                        )}
                        {program.participants_served && (
                          <div className="text-sm">
                            <span className="font-bold text-ochre-600">{program.participants_served.toLocaleString()}</span>
                            <span className="text-earth-600"> participants</span>
                          </div>
                        )}
                      </div>

                      {program.tags && program.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {program.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="bg-sand-100 border border-black text-earth-700 px-2 py-1 text-xs">
                              {tag}
                            </span>
                          ))}
                          {program.tags.length > 3 && (
                            <span className="text-earth-500 text-xs py-1">+{program.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Services Section */}
        {services.length > 0 && (
          <section className="py-12 border-b-2 border-black">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-8">
                <Briefcase className="h-8 w-8 text-ochre-600" />
                <div>
                  <h2 className="text-3xl font-black">Services</h2>
                  <p className="text-earth-600">
                    {services.length} service{services.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/services/${service.slug || service.id}`}
                    className="group border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {service.category && (
                      <span className="inline-block px-2 py-1 bg-ochre-100 border border-black text-xs font-bold uppercase mb-3">
                        {service.category}
                      </span>
                    )}

                    <h3 className="text-xl font-bold mb-2 group-hover:text-ochre-600 transition-colors">
                      {service.name}
                    </h3>

                    {service.description && (
                      <p className="text-earth-600 text-sm mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {service.location_city && (
                      <div className="flex items-center gap-1 text-sm text-earth-500">
                        <MapPin className="w-4 h-4" />
                        {service.location_city}{service.location_state && `, ${service.location_state}`}
                      </div>
                    )}

                    <span className="mt-4 text-ochre-600 font-bold inline-flex items-center gap-1 text-sm">
                      View Service <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State - No programs or services */}
        {programs.length === 0 && services.length === 0 && (
          <section className="py-16 border-b-2 border-black">
            <div className="container-justice text-center">
              <div className="border-2 border-dashed border-earth-300 p-12 bg-sand-50 max-w-2xl mx-auto">
                <Building2 className="w-16 h-16 text-earth-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-earth-700 mb-2">No Programs or Services Listed Yet</h3>
                <p className="text-earth-600 mb-6">
                  This organization hasn't added their programs and services to JusticeHub yet.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {org.slug && (
                    <Link
                      href={`/sites/${org.slug}`}
                      className="inline-flex items-center gap-2 bg-ochre-600 text-white px-6 py-3 font-bold hover:bg-ochre-700 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                      Visit Full Site
                    </Link>
                  )}
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 font-bold hover:bg-earth-800 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                      Visit Their Website
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Other Basecamps Section - Only for Founding Basecamps */}
        {org.slug && isFoundingBasecamp(org.slug) && (
          <section className="py-12 bg-ochre-50 border-b-2 border-black">
            <div className="container-justice">
              <div className="flex items-center gap-3 mb-6">
                <Mountain className="h-8 w-8 text-ochre-600" />
                <div>
                  <h2 className="text-3xl font-black">Other Founding Basecamps</h2>
                  <p className="text-earth-600">Explore the Centre of Excellence network</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {otherBasecamps.map((basecamp) => (
                  <Link
                    key={basecamp.slug}
                    href={`/organizations/${basecamp.slug}`}
                    className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow group"
                  >
                    <div className="inline-block px-2 py-1 bg-ochre-600 text-white text-xs font-bold uppercase tracking-wider mb-3">
                      Founding Basecamp
                    </div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-ochre-600 transition-colors">
                      {basecamp.name}
                    </h3>
                    <p className="text-sm text-earth-600 mb-4">{basecamp.region}</p>
                    <span className="text-ochre-600 font-bold inline-flex items-center gap-1">
                      View Profile <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/centre-of-excellence/map?category=basecamp"
                  className="inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-bold hover:bg-black hover:text-white transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  View All Basecamps on Map
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Related Resources */}
        <section className="py-12 bg-sand-50">
          <div className="container-justice">
            <h2 className="text-3xl font-bold mb-4">Explore More</h2>
            <p className="text-lg text-gray-700 mb-8">
              Discover related resources and information across JusticeHub.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/organizations"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-ochre-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Directory
                </div>
                <h3 className="text-xl font-bold mb-2">All Organizations</h3>
                <p className="text-gray-600 mb-4">
                  Browse all youth justice organizations in our verified directory.
                </p>
                <span className="text-ochre-600 font-bold inline-flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/community-programs"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-eucalyptus-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Programs
                </div>
                <h3 className="text-xl font-bold mb-2">Community Programs</h3>
                <p className="text-gray-600 mb-4">
                  Find community-led programs making a difference across Australia.
                </p>
                <span className="text-eucalyptus-600 font-bold inline-flex items-center gap-1">
                  Browse <ChevronRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/services"
                className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">
                  Service Finder
                </div>
                <h3 className="text-xl font-bold mb-2">Support Services</h3>
                <p className="text-gray-600 mb-4">
                  Locate legal, health, and support services in your area.
                </p>
                <span className="text-blue-600 font-bold inline-flex items-center gap-1">
                  Find Services <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
