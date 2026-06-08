import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Database,
  ExternalLink,
  GitBranch,
  Globe,
  Link2,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient, type LooseSupabaseClient } from '@/lib/supabase/service-lite';
import {
  scoreOrganizationQuality,
  scoreServiceQuality,
  type DirectoryQualityDimension,
  type DirectoryQualityResult,
} from '@/lib/directory/quality-score';

export const dynamic = 'force-dynamic';

type CountResult = {
  count: number;
  error: string | null;
};

type CountQuery = ReturnType<ReturnType<LooseSupabaseClient['from']>['select']>;

type FundingLinkSample = {
  id: string;
  recipient_name: string | null;
  recipient_abn: string | null;
  program_name: string | null;
  amount_dollars: number | null;
  organization_id: string;
  organization_name: string;
};

type GsBridgeSample = {
  id: string;
  name: string;
  slug: string | null;
  abn: string | null;
  gs_entity_id: string;
  canonical_name: string | null;
  entity_type: string | null;
};

type IdentityMismatchSample = {
  id: string;
  name: string;
  slug: string | null;
  abn: string | null;
  gs_entity_id: string | null;
  canonical_name: string | null;
  gs_abn: string | null;
};

type ServiceSample = {
  id: string;
  name: string;
  category: string | null;
  location_state: string | null;
  data_source_url: string | null;
  last_verified_at: string | null;
  updated_at: string | null;
};

type AlmaOrphanSample = {
  id: string;
  name: string;
  type: string | null;
  operating_organization: string | null;
  verification_status: string | null;
  evidence_level: string | null;
};

type QualityOrgSampleRaw = {
  id: string;
  name: string;
  slug: string | null;
  abn: string | null;
  gs_entity_id: string | null;
  verification_status: string | null;
  website: string | null;
  website_url: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  postcode: string | null;
  updated_at: string | null;
  has_valid_gs_link: boolean | null;
  has_source_linked_service: boolean | null;
  has_intervention: boolean | null;
  has_funding: boolean | null;
};

type QualityOrgSample = QualityOrgSampleRaw & {
  quality: DirectoryQualityResult;
};

type QualityServiceSampleRaw = {
  id: string;
  name: string;
  category: string | null;
  location_state: string | null;
  data_source_url: string | null;
  organization_id: string | null;
  cost: string | null;
  verification_status: string | null;
  last_verified_at: string | null;
  updated_at: string | null;
};

type QualityServiceSample = QualityServiceSampleRaw & {
  quality: DirectoryQualityResult;
};

type DirectoryReviewData = {
  counts: {
    organizations: CountResult;
    organizationsWithAbn: CountResult;
    organizationsMissingAbn: CountResult;
    organizationsMissingGs: CountResult;
    services: CountResult;
    servicesMissingOrg: CountResult;
    servicesMissingSource: CountResult;
    servicesStale: CountResult;
    interventions: CountResult;
    interventionOrphans: CountResult;
    funding: CountResult;
    fundingWithAbn: CountResult;
    fundingLinkedToOrg: CountResult;
    fundingUnlinkedWithAbn: CountResult;
    gsEntities: CountResult;
    acncCharities: CountResult;
  };
  samples: {
    fundingAutoLinks: FundingLinkSample[];
    gsAutoLinks: GsBridgeSample[];
    identityMismatches: IdentityMismatchSample[];
    servicesMissingOrg: ServiceSample[];
    servicesMissingSource: ServiceSample[];
    servicesStaleSource: ServiceSample[];
    interventionOrphans: AlmaOrphanSample[];
    organizationQuality: QualityOrgSample[];
    serviceQuality: QualityServiceSample[];
  };
  sampleErrors: Record<string, string | null>;
  generatedAt: string;
};

async function requireAdminOrLocal(redirectPath: string) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (isDev) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${redirectPath}`);
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileData?.role !== 'admin') {
    redirect('/');
  }
}

async function safeCount(
  service: LooseSupabaseClient,
  table: string,
  build?: (query: CountQuery) => CountQuery,
): Promise<CountResult> {
  try {
    const base = service.from(table).select('*', { count: 'exact', head: true });
    const query = build ? build(base) : base;
    const { count, error } = await query;
    return { count: count || 0, error: error?.message || null };
  } catch (err) {
    return {
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function safeSqlRows<T>(
  service: LooseSupabaseClient,
  query: string,
): Promise<{ rows: T[]; error: string | null }> {
  try {
    const { data, error } = await service.rpc('exec_sql', { query });
    if (error) return { rows: [], error: error.message };
    return { rows: Array.isArray(data) ? (data as T[]) : [], error: null };
  } catch (err) {
    return {
      rows: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function cleanDigits(value?: string | null) {
  return value ? value.replace(/\D/g, '') : '';
}

async function fetchGsAutoLinkSamples(
  service: LooseSupabaseClient,
): Promise<{ rows: GsBridgeSample[]; error: string | null }> {
  try {
    const { data: orgRows, error: orgError } = await service
      .from('organizations')
      .select('id, name, slug, abn')
      .eq('is_active', true)
      .not('abn', 'is', null)
      .is('gs_entity_id', null)
      .order('name')
      .limit(200);

    if (orgError) return { rows: [], error: orgError.message };

    const orgs = (orgRows || []) as Array<{ id: string; name: string; slug: string | null; abn: string | null }>;
    const abns = [...new Set(orgs.map((org) => cleanDigits(org.abn)).filter(Boolean))];
    if (!abns.length) return { rows: [], error: null };

    const { data: entityRows, error: entityError } = await service
      .from('gs_entities')
      .select('id, abn, canonical_name, entity_type')
      .in('abn', abns)
      .limit(500);

    if (entityError) return { rows: [], error: entityError.message };

    const entitiesByAbn = new Map<string, Array<{ id: string; abn: string | null; canonical_name: string | null; entity_type: string | null }>>();
    for (const entity of (entityRows || []) as Array<{ id: string; abn: string | null; canonical_name: string | null; entity_type: string | null }>) {
      const abn = cleanDigits(entity.abn);
      if (!abn) continue;
      const bucket = entitiesByAbn.get(abn) || [];
      bucket.push(entity);
      entitiesByAbn.set(abn, bucket);
    }

    const rows: GsBridgeSample[] = [];
    for (const org of orgs) {
      const candidates = entitiesByAbn.get(cleanDigits(org.abn)) || [];
      if (candidates.length !== 1) continue;
      const entity = candidates[0];
      rows.push({
        id: org.id,
        name: org.name,
        slug: org.slug,
        abn: org.abn,
        gs_entity_id: entity.id,
        canonical_name: entity.canonical_name,
        entity_type: entity.entity_type,
      });
      if (rows.length >= 8) break;
    }

    return { rows, error: null };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : String(err) };
  }
}

async function fetchIdentityMismatchSamples(
  service: LooseSupabaseClient,
): Promise<{ rows: IdentityMismatchSample[]; error: string | null }> {
  try {
    const { data: orgRows, error: orgError } = await service
      .from('organizations')
      .select('id, name, slug, abn, gs_entity_id, updated_at')
      .eq('is_active', true)
      .not('abn', 'is', null)
      .not('gs_entity_id', 'is', null)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(300);

    if (orgError) return { rows: [], error: orgError.message };

    const orgs = (orgRows || []) as Array<{ id: string; name: string; slug: string | null; abn: string | null; gs_entity_id: string | null }>;
    const gsIds = [...new Set(orgs.map((org) => org.gs_entity_id).filter((id): id is string => Boolean(id)))];
    if (!gsIds.length) return { rows: [], error: null };

    const { data: entityRows, error: entityError } = await service
      .from('gs_entities')
      .select('id, canonical_name, abn')
      .in('id', gsIds)
      .limit(500);

    if (entityError) return { rows: [], error: entityError.message };

    const entitiesById = new Map(
      ((entityRows || []) as Array<{ id: string; canonical_name: string | null; abn: string | null }>).map((entity) => [entity.id, entity]),
    );

    const rows: IdentityMismatchSample[] = [];
    for (const org of orgs) {
      const entity = org.gs_entity_id ? entitiesById.get(org.gs_entity_id) : null;
      if (entity && cleanDigits(entity.abn) === cleanDigits(org.abn)) continue;
      rows.push({
        id: org.id,
        name: org.name,
        slug: org.slug,
        abn: org.abn,
        gs_entity_id: org.gs_entity_id,
        canonical_name: entity?.canonical_name || null,
        gs_abn: entity?.abn || null,
      });
      if (rows.length >= 8) break;
    }

    return { rows, error: null };
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : String(err) };
  }
}

async function getDirectoryReviewData(): Promise<DirectoryReviewData> {
  const service = createServiceClient();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [
    organizations,
    organizationsWithAbn,
    organizationsMissingAbn,
    organizationsMissingGs,
    services,
    servicesMissingOrg,
    servicesMissingSource,
    servicesStale,
    interventions,
    interventionOrphans,
    funding,
    fundingWithAbn,
    fundingLinkedToOrg,
    fundingUnlinkedWithAbn,
    gsEntities,
    acncCharities,
    fundingAutoLinks,
    gsAutoLinks,
    identityMismatches,
    servicesMissingOrgRows,
    servicesMissingSourceRows,
    servicesStaleSourceRows,
    interventionOrphanRows,
    organizationQualityRows,
    serviceQualityRows,
  ] = await Promise.all([
    safeCount(service, 'organizations', (q) => q.eq('is_active', true)),
    safeCount(service, 'organizations', (q) => q.eq('is_active', true).not('abn', 'is', null)),
    safeCount(service, 'organizations', (q) => q.eq('is_active', true).is('abn', null)),
    safeCount(service, 'organizations', (q) => q.eq('is_active', true).not('abn', 'is', null).is('gs_entity_id', null)),
    safeCount(service, 'services', (q) => q.eq('is_active', true)),
    safeCount(service, 'services', (q) => q.eq('is_active', true).is('organization_id', null)),
    safeCount(service, 'services', (q) => q.eq('is_active', true).is('data_source_url', null)),
    safeCount(service, 'services', (q) =>
      q
        .eq('is_active', true)
        .not('data_source_url', 'is', null)
        .or(`last_verified_at.is.null,last_verified_at.lt.${ninetyDaysAgo}`),
    ),
    safeCount(service, 'alma_interventions', (q) => q.neq('verification_status', 'ai_generated')),
    safeCount(service, 'alma_interventions', (q) =>
      q
        .neq('verification_status', 'ai_generated')
        .is('operating_organization_id', null)
        .not('operating_organization', 'is', null),
    ),
    safeCount(service, 'justice_funding'),
    safeCount(service, 'justice_funding', (q) => q.not('recipient_abn', 'is', null)),
    safeCount(service, 'justice_funding', (q) => q.not('alma_organization_id', 'is', null)),
    safeCount(service, 'justice_funding', (q) => q.not('recipient_abn', 'is', null).is('alma_organization_id', null)),
    safeCount(service, 'gs_entities'),
    safeCount(service, 'acnc_charities'),
    safeSqlRows<FundingLinkSample>(
      service,
      `
        WITH unique_org_abns AS (
          SELECT regexp_replace(coalesce(abn, ''), '[^0-9]', '', 'g') AS clean_abn,
                 MIN(id::text) AS organization_id,
                 MIN(name) AS organization_name,
                 COUNT(*) AS org_count
          FROM organizations
          WHERE is_active = true
            AND abn IS NOT NULL
          GROUP BY regexp_replace(coalesce(abn, ''), '[^0-9]', '', 'g')
          HAVING COUNT(*) = 1
        )
        SELECT jf.id,
               jf.recipient_name,
               jf.recipient_abn,
               jf.program_name,
               jf.amount_dollars,
               u.organization_id,
               u.organization_name
        FROM justice_funding jf
        JOIN unique_org_abns u
          ON u.clean_abn = regexp_replace(coalesce(jf.recipient_abn, ''), '[^0-9]', '', 'g')
        WHERE jf.recipient_abn IS NOT NULL
          AND jf.alma_organization_id IS NULL
        ORDER BY jf.amount_dollars DESC NULLS LAST
        LIMIT 8
      `,
    ),
    fetchGsAutoLinkSamples(service),
    fetchIdentityMismatchSamples(service),
    safeSqlRows<ServiceSample>(
      service,
      `
        SELECT id, name, category, location_state, data_source_url, last_verified_at, updated_at
        FROM services
        WHERE is_active = true
          AND organization_id IS NULL
        ORDER BY updated_at DESC NULLS LAST, name ASC
        LIMIT 8
      `,
    ),
    safeSqlRows<ServiceSample>(
      service,
      `
        SELECT id, name, category, location_state, data_source_url, last_verified_at, updated_at
        FROM services
        WHERE is_active = true
          AND data_source_url IS NULL
        ORDER BY updated_at DESC NULLS LAST, name ASC
        LIMIT 8
      `,
    ),
    safeSqlRows<ServiceSample>(
      service,
      `
        SELECT id, name, category, location_state, data_source_url, last_verified_at, updated_at
        FROM services
        WHERE is_active = true
          AND data_source_url IS NOT NULL
          AND (last_verified_at IS NULL OR last_verified_at < '${ninetyDaysAgo}')
        ORDER BY last_verified_at ASC NULLS FIRST, updated_at ASC NULLS FIRST, name ASC
        LIMIT 8
      `,
    ),
    safeSqlRows<AlmaOrphanSample>(
      service,
      `
        SELECT id, name, type, operating_organization, verification_status, evidence_level
        FROM alma_interventions
        WHERE verification_status != 'ai_generated'
          AND operating_organization_id IS NULL
          AND operating_organization IS NOT NULL
        ORDER BY updated_at DESC NULLS LAST, name ASC
        LIMIT 8
      `,
    ),
    safeSqlRows<QualityOrgSampleRaw>(
      service,
      `
        SELECT o.id,
               o.name,
               o.slug,
               o.abn,
               o.gs_entity_id,
               o.verification_status,
               o.website,
               o.website_url,
               o.city,
               o.state,
               o.location,
               o.postcode,
               o.updated_at,
               EXISTS (
                 SELECT 1
                 FROM gs_entities ge
                 WHERE ge.id = o.gs_entity_id
                   AND regexp_replace(coalesce(ge.abn, ''), '[^0-9]', '', 'g')
                     = regexp_replace(coalesce(o.abn, ''), '[^0-9]', '', 'g')
               ) AS has_valid_gs_link,
               EXISTS (
                 SELECT 1
                 FROM services s
                 WHERE s.organization_id = o.id
                   AND s.is_active = true
                   AND s.data_source_url IS NOT NULL
               ) AS has_source_linked_service,
               EXISTS (
                 SELECT 1
                 FROM alma_interventions ai
                 WHERE ai.operating_organization_id = o.id
                   AND ai.verification_status != 'ai_generated'
               ) AS has_intervention,
               EXISTS (
                 SELECT 1
                 FROM justice_funding jf
                 WHERE jf.alma_organization_id = o.id
               ) AS has_funding
        FROM organizations o
        WHERE o.is_active = true
          AND o.name IS NOT NULL
          AND o.name != ''
        ORDER BY (
          CASE WHEN o.gs_entity_id IS NULL THEN 4 ELSE 0 END +
          CASE WHEN o.verification_status IS NULL THEN 3 ELSE 0 END +
          CASE WHEN o.website IS NULL AND o.website_url IS NULL THEN 2 ELSE 0 END +
          CASE WHEN o.state IS NULL AND o.location IS NULL THEN 1 ELSE 0 END
        ) DESC,
        o.graph_score DESC NULLS LAST,
        o.name ASC
        LIMIT 8
      `,
    ),
    safeSqlRows<QualityServiceSampleRaw>(
      service,
      `
        SELECT id,
               name,
               category,
               location_state,
               data_source_url,
               organization_id,
               cost,
               verification_status,
               last_verified_at,
               updated_at
        FROM services
        WHERE is_active = true
          AND name IS NOT NULL
          AND name != ''
        ORDER BY (
          CASE WHEN data_source_url IS NULL THEN 5 ELSE 0 END +
          CASE WHEN organization_id IS NULL THEN 4 ELSE 0 END +
          CASE WHEN verification_status IS NULL THEN 3 ELSE 0 END +
          CASE WHEN location_state IS NULL THEN 2 ELSE 0 END
        ) DESC,
        updated_at ASC NULLS FIRST,
        name ASC
        LIMIT 8
      `,
    ),
  ]);

  return {
    counts: {
      organizations,
      organizationsWithAbn,
      organizationsMissingAbn,
      organizationsMissingGs,
      services,
      servicesMissingOrg,
      servicesMissingSource,
      servicesStale,
      interventions,
      interventionOrphans,
      funding,
      fundingWithAbn,
      fundingLinkedToOrg,
      fundingUnlinkedWithAbn,
      gsEntities,
      acncCharities,
    },
    samples: {
      fundingAutoLinks: fundingAutoLinks.rows,
      gsAutoLinks: gsAutoLinks.rows,
      identityMismatches: identityMismatches.rows,
      servicesMissingOrg: servicesMissingOrgRows.rows,
      servicesMissingSource: servicesMissingSourceRows.rows,
      servicesStaleSource: servicesStaleSourceRows.rows,
      interventionOrphans: interventionOrphanRows.rows,
      organizationQuality: organizationQualityRows.rows.map((row) => ({
        ...row,
        quality: scoreOrganizationQuality(row),
      })),
      serviceQuality: serviceQualityRows.rows.map((row) => ({
        ...row,
        quality: scoreServiceQuality(row),
      })),
    },
    sampleErrors: {
      fundingAutoLinks: fundingAutoLinks.error,
      gsAutoLinks: gsAutoLinks.error,
      identityMismatches: identityMismatches.error,
      servicesMissingOrg: servicesMissingOrgRows.error,
      servicesMissingSource: servicesMissingSourceRows.error,
      servicesStaleSource: servicesStaleSourceRows.error,
      interventionOrphans: interventionOrphanRows.error,
      organizationQuality: organizationQualityRows.error,
      serviceQuality: serviceQualityRows.error,
    },
    generatedAt: new Date().toISOString(),
  };
}

function formatNumber(value: number) {
  return value.toLocaleString('en-AU');
}

function percentage(current: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((current / total) * 100)}%`;
}

function percentValue(current: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((current / total) * 100)));
}

function formatCurrency(value: number | null) {
  if (!value) return 'Amount unknown';
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000).toLocaleString('en-AU')}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000).toLocaleString('en-AU')}K`;
  return `$${value.toLocaleString('en-AU')}`;
}

function shortDate(value: string | null) {
  if (!value) return 'No timestamp';
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CountCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: number | string;
  detail: string;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
}) {
  const toneClass = {
    neutral: 'border-black bg-white',
    good: 'border-emerald-600 bg-emerald-50',
    warn: 'border-amber-600 bg-amber-50',
    danger: 'border-red-600 bg-red-50',
  }[tone];

  return (
    <div className={`border-2 p-5 ${toneClass}`}>
      <div className="text-3xl font-black tracking-tight">{typeof value === 'number' ? formatNumber(value) : value}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-gray-600">{label}</div>
      <p className="mt-2 text-sm text-gray-700">{detail}</p>
    </div>
  );
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' | 'info' }) {
  const toneClass = {
    neutral: 'border-gray-300 bg-white text-gray-700',
    good: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    warn: 'border-amber-500 bg-amber-50 text-amber-800',
    danger: 'border-red-500 bg-red-50 text-red-700',
    info: 'border-blue-500 bg-blue-50 text-blue-700',
  }[tone];

  return (
    <span className={`inline-flex items-center border px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass}`}>
      {children}
    </span>
  );
}

function qualityTone(score: number): 'good' | 'warn' | 'danger' | 'info' {
  if (score >= 70) return 'good';
  if (score >= 50) return 'info';
  if (score >= 30) return 'warn';
  return 'danger';
}

const DIMENSION_LABELS: Record<DirectoryQualityDimension, string> = {
  identity: 'Identity',
  source: 'Source',
  freshness: 'Freshness',
  evidence: 'Evidence',
  locality: 'Locality',
  review: 'Review',
};

function QualityMeter({ quality }: { quality: DirectoryQualityResult }) {
  const barClass = quality.score >= 70 ? 'bg-emerald-500' : quality.score >= 50 ? 'bg-blue-500' : quality.score >= 30 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-2xl font-black">{quality.score}</div>
        <Badge tone={qualityTone(quality.score)}>{quality.label}</Badge>
      </div>
      <div className="mt-2 h-2 border border-black bg-white">
        <div className={`h-full ${barClass}`} style={{ width: `${quality.score}%` }} />
      </div>
    </div>
  );
}

function QualityChips({ quality }: { quality: DirectoryQualityResult }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {quality.completed.map((dimension) => (
        <Badge key={`complete-${dimension}`} tone="good">{DIMENSION_LABELS[dimension]}</Badge>
      ))}
      {quality.missing.slice(0, 4).map((dimension) => (
        <Badge key={`missing-${dimension}`} tone="warn">Needs {DIMENSION_LABELS[dimension]}</Badge>
      ))}
    </div>
  );
}

function QualitySampleCard({
  title,
  subtitle,
  href,
  quality,
}: {
  title: string;
  subtitle: string;
  href?: string;
  quality: DirectoryQualityResult;
}) {
  return (
    <div className="min-w-0 border border-gray-200 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 break-words">
          <h3 className="font-black leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="w-full sm:w-24 sm:shrink-0">
          <QualityMeter quality={quality} />
        </div>
      </div>
      <div className="mt-3">
        <QualityChips quality={quality} />
      </div>
      <div className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-700">
        <span className="font-bold text-black">Next: </span>{quality.nextAction}
      </div>
      {href && (
        <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
          Open record <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function QueueCard({
  title,
  count,
  description,
  mode,
  safety,
  tone,
}: {
  title: string;
  count: number;
  description: string;
  mode: string;
  safety: string;
  tone: 'good' | 'warn' | 'danger' | 'info';
}) {
  return (
    <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-700">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black">{formatNumber(count)}</div>
          <Badge tone={tone}>{mode}</Badge>
        </div>
      </div>
      <div className="mt-5 border-t border-gray-200 pt-4 text-sm text-gray-700">
        <span className="font-bold text-black">Rule: </span>{safety}
      </div>
    </div>
  );
}

function SampleList({
  title,
  error,
  emptyLabel,
  children,
}: {
  title: string;
  error: string | null;
  emptyLabel: string;
  children: React.ReactNode[];
}) {
  return (
    <div className="min-w-0 border-2 border-black bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="min-w-0 text-lg font-black">{title}</h3>
        {error ? <Badge tone="danger">query issue</Badge> : <Badge tone="neutral">{children.length} shown</Badge>}
      </div>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : children.length ? (
        <div className="min-w-0 space-y-3 break-words">{children}</div>
      ) : (
        <p className="text-sm text-gray-600">{emptyLabel}</p>
      )}
    </div>
  );
}

const agentCards = [
  {
    title: 'ALMA data sprint: funding linkage',
    endpoint: '/api/cron/alma/data-sprint?mode=linkage&batch=200',
    script: 'Exact ABN links justice_funding to organizations.',
    status: 'mutation: safe batch when sampled',
  },
  {
    title: 'ALMA data sprint: CivicGraph bridge',
    endpoint: '/api/cron/alma/data-sprint?mode=gs_bridge&batch=100',
    script: 'Exact ABN links organizations to gs_entities.',
    status: 'mutation: safe batch when sampled',
  },
  {
    title: 'ALMA data sprint: orphan programs',
    endpoint: '/api/cron/alma/data-sprint?mode=orphan_fix&batch=50',
    script: 'Exact organisation-name links interventions to orgs.',
    status: 'mutation: review before larger batches',
  },
  {
    title: 'CivicScope bridge',
    endpoint: '/api/cron/alma/civicscope-bridge',
    script: 'Turns Hansard and ministerial statements into ALMA findings.',
    status: 'research: creates reviewable findings',
  },
  {
    title: 'Service source freshness',
    endpoint: '/api/cron/alma/data-sprint?mode=service_freshness&batch=25',
    script: 'Checks public service source URLs and updates last_verified_at when the source still responds.',
    status: 'mutation: source timestamp only',
  },
  {
    title: 'Research finding freshness watcher',
    endpoint: '/api/cron/alma/data-sprint?mode=freshness&batch=100',
    script: 'Checks stale external sources and lowers trust when source URLs fail.',
    status: 'mutation: source status only',
  },
  {
    title: 'ABN bridge dry run',
    endpoint: 'node scripts/abn-bridge.mjs',
    script: 'Fuzzy ACNC name matching for orgs missing ABNs. Keep dry-run first.',
    status: 'review: do not auto-apply fuzzy matches',
  },
  {
    title: 'Civic data agent',
    endpoint: 'node scripts/civic/run-data-agent.mjs',
    script: 'Runs civic backlog agents for government, funding, and oversight data.',
    status: 'research: review outputs',
  },
  {
    title: 'Grant/source scrapers',
    endpoint: 'scripts/scrape-state-tenders.mjs + scripts/alma-funder-discovery.mjs',
    script: 'Expands available grants, tenders, and funder records.',
    status: 'ingestion: requires source QA',
  },
];

export default async function DirectoryReviewPage() {
  await requireAdminOrLocal('/admin/directory/review');
  const data = await getDirectoryReviewData();
  const { counts, samples, sampleErrors } = data;

  const autoLinkReady = samples.fundingAutoLinks.length + samples.gsAutoLinks.length;
  const fundingLinkagePercent = percentage(counts.fundingLinkedToOrg.count, counts.funding.count);
  const orgAbnPercent = percentage(counts.organizationsWithAbn.count, counts.organizations.count);
  const identityCoverage = percentValue(
    Math.max(0, counts.organizationsWithAbn.count - counts.organizationsMissingGs.count),
    counts.organizations.count,
  );
  const sourceCoverage = percentValue(counts.services.count - counts.servicesMissingSource.count, counts.services.count);
  const freshnessCoverage = percentValue(
    Math.max(0, counts.services.count - counts.servicesMissingSource.count - counts.servicesStale.count),
    counts.services.count,
  );
  const fundingCoverage = percentValue(counts.fundingLinkedToOrg.count, counts.funding.count);
  const modelCoverage = percentValue(counts.interventions.count - counts.interventionOrphans.count, counts.interventions.count);
  const directoryQualityScore = Math.round((identityCoverage + sourceCoverage + freshnessCoverage + fundingCoverage + modelCoverage) / 5);

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Navigation />

      <main className="page-content">
        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-10">
            <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black">
              ← Back to admin
            </Link>
            <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
                  <Database className="h-3.5 w-3.5" />
                  Directory data control room
                </div>
                <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                  Clean the national justice directory without pretending every record is equal.
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700">
                  This page turns the big data problem into queues: exact links that agents can close, fuzzy matches that need a person, and source gaps that need scrapers or follow-up.
                </p>
              </div>

              <div className="border-2 border-black bg-amber-50 p-5">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-800">
                  <ShieldCheck className="h-4 w-4" />
                  Operating rule
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-800">
                  Auto-apply exact ABN links only. Put fuzzy names, people, story evidence, and source disputes into human review.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black bg-white">
          <div className="container-justice grid gap-4 py-8 md:grid-cols-2 lg:grid-cols-4">
            <CountCard
              label="active organizations"
              value={counts.organizations.count}
              detail={`${orgAbnPercent} have ABNs available for CivicGraph / ACNC joins.`}
              tone="neutral"
            />
            <CountCard
              label="service records"
              value={counts.services.count}
              detail={`${formatNumber(counts.servicesMissingOrg.count)} need an organization link.`}
              tone={counts.servicesMissingOrg.count ? 'warn' : 'good'}
            />
            <CountCard
              label="funding records"
              value={counts.funding.count}
              detail={`${fundingLinkagePercent} already link back to an organisation.`}
              tone="neutral"
            />
            <CountCard
              label="CivicGraph entities"
              value={counts.gsEntities.count}
              detail={`${formatNumber(counts.acncCharities.count)} ACNC charities are available for ABN validation.`}
              tone="good"
            />
          </div>
        </section>

        <section className="border-b-2 border-black bg-gray-50">
          <div className="container-justice py-10">
            <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
              <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Quality score</div>
                <div className="mt-3 text-6xl font-black tracking-tight">{directoryQualityScore}</div>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  A live operating score from identity, source trail, freshness, funding linkage, and ALMA model linkage. It is a direction-of-travel score, not a public endorsement.
                </p>
                <div className="mt-4 h-3 border-2 border-black bg-white">
                  <div
                    className={`h-full ${directoryQualityScore >= 70 ? 'bg-emerald-500' : directoryQualityScore >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ width: `${directoryQualityScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-5">
                  <h2 className="text-3xl font-black tracking-tight">Make the directory better every run.</h2>
                  <p className="mt-2 max-w-3xl text-gray-700">
                    Each sweep should lift one part of the score while keeping risky records clearly labelled.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  <CountCard
                    label="identity"
                    value={`${identityCoverage}%`}
                    detail="ABN-backed orgs with a CivicGraph link."
                    tone={identityCoverage >= 80 ? 'good' : 'warn'}
                  />
                  <CountCard
                    label="source"
                    value={`${sourceCoverage}%`}
                    detail="Active services with public source URLs."
                    tone={sourceCoverage >= 80 ? 'good' : 'danger'}
                  />
                  <CountCard
                    label="freshness"
                    value={`${freshnessCoverage}%`}
                    detail="Service records source-checked in the last 90 days."
                    tone={freshnessCoverage >= 80 ? 'good' : 'warn'}
                  />
                  <CountCard
                    label="funding"
                    value={`${fundingCoverage}%`}
                    detail="Funding rows linked to org records."
                    tone={fundingCoverage >= 80 ? 'good' : 'warn'}
                  />
                  <CountCard
                    label="models"
                    value={`${modelCoverage}%`}
                    detail="ALMA models linked to org records."
                    tone={modelCoverage >= 95 ? 'good' : 'warn'}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black bg-black text-white">
          <div className="container-justice py-10">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-400">
                  <Sparkles className="h-4 w-4" />
                  Run order
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Start with the joins that strengthen trust fastest.</h2>
                <p className="mt-4 text-sm leading-6 text-white/70">
                  The first useful sprint is not a new scraper. It is closing exact ABN links so every service, organisation, grant, and CivicGraph entity can sit in one chain.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-white/20 bg-white/5 p-5">
                  <div className="text-3xl font-black">{formatNumber(counts.fundingUnlinkedWithAbn.count)}</div>
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">funding rows with ABN but no org link</div>
                </div>
                <div className="border border-white/20 bg-white/5 p-5">
                  <div className="text-3xl font-black">{formatNumber(counts.organizationsMissingGs.count)}</div>
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">orgs with ABN but no CivicGraph link</div>
                </div>
                <div className="border border-white/20 bg-white/5 p-5">
                  <div className="text-3xl font-black">{formatNumber(counts.interventionOrphans.count)}</div>
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">ALMA models with org names but no org ID</div>
                </div>
                <div className="border border-white/20 bg-white/5 p-5">
                  <div className="text-3xl font-black">{formatNumber(counts.servicesMissingSource.count)}</div>
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">service records missing source URLs</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black bg-gray-50">
          <div className="container-justice py-10">
            <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Cleaning queues</h2>
                <p className="mt-2 text-gray-700">Each queue has a different trust level. Treat them differently.</p>
              </div>
              <Badge tone={autoLinkReady ? 'good' : 'warn'}>{autoLinkReady} sampled auto-links ready</Badge>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <QueueCard
                title="Funding → organisation"
                count={counts.fundingUnlinkedWithAbn.count}
                description="Grant, tender, and funding rows where the recipient ABN exists but the JusticeHub organisation link is empty."
                mode="data-sprint linkage"
                safety="Exact cleaned ABN match only. This can be batched after checking sample rows."
                tone="good"
              />
              <QueueCard
                title="Organisation → CivicGraph"
                count={counts.organizationsMissingGs.count}
                description="Active organisations with ABNs that can be linked to GrantScope/CivicGraph entities."
                mode="gs bridge"
                safety="Exact ABN match only. Use name mismatch warnings to stop questionable records from displaying badges."
                tone="good"
              />
              <QueueCard
                title="ALMA model → organisation"
                count={counts.interventionOrphans.count}
                description="Alternative/local model records that have an organisation name but no linked organisation ID."
                mode="orphan fix"
                safety="Exact name matching is acceptable in small batches; fuzzy matches go to review."
                tone="warn"
              />
              <QueueCard
                title="Services source trail"
                count={counts.servicesMissingSource.count}
                description="Directory records that people can search but should not be treated as strong until source URLs are filled."
                mode="scraper queue"
                safety="Do not call these verified until the public source URL and freshness are recorded."
                tone="danger"
              />
              <QueueCard
                title="Services source freshness"
                count={counts.servicesStale.count}
                description="Source-linked service records whose public source URL has not been checked in the last 90 days."
                mode="service freshness"
                safety="Reachability can refresh last_verified_at, but it never creates a human-verified badge."
                tone="warn"
              />
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-10">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-red-600" />
              <div>
                <h2 className="text-3xl font-black tracking-tight">Quality score worklist</h2>
                <p className="text-gray-700">Live samples scored against identity, source, freshness, evidence, locality, and review.</p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SampleList
                title="Organisation records to lift"
                error={sampleErrors.organizationQuality}
                emptyLabel="No organisation quality rows found."
              >
                {samples.organizationQuality.map((row, index) => (
                  <QualitySampleCard
                    key={`org-quality-${row.id}-${index}`}
                    title={row.name}
                    subtitle={[
                      row.state || row.location || 'No place',
                      row.abn ? `ABN ${row.abn}` : 'No ABN',
                      row.verification_status || 'No review status',
                    ].join(' · ')}
                    href={row.slug ? `/directory/org/${row.slug}` : `/directory/org/${row.id}`}
                    quality={row.quality}
                  />
                ))}
              </SampleList>

              <SampleList
                title="Service records to lift"
                error={sampleErrors.serviceQuality}
                emptyLabel="No service quality rows found."
              >
                {samples.serviceQuality.map((row, index) => (
                  <QualitySampleCard
                    key={`service-quality-${row.id}-${index}`}
                    title={row.name}
                    subtitle={[
                      row.location_state || 'No place',
                      row.category || 'No category',
                      row.verification_status || 'No review status',
                    ].join(' · ')}
                    href={`/services/${row.id}`}
                    quality={row.quality}
                  />
                ))}
              </SampleList>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black bg-white">
          <div className="container-justice py-10">
            <div className="mb-6 flex items-center gap-3">
              <UserCheck className="h-7 w-7 text-red-600" />
              <div>
                <h2 className="text-3xl font-black tracking-tight">Samples to review before the next agent run</h2>
                <p className="text-gray-700">These are live database samples, not static estimates.</p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SampleList
                title="Safe candidate: funding ABN links"
                error={sampleErrors.fundingAutoLinks}
                emptyLabel="No exact ABN funding links found in this sample."
              >
                {samples.fundingAutoLinks.map((row, index) => (
                  <div key={`funding-${row.id}-${index}`} className="border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{row.recipient_name || 'Unknown recipient'}</div>
                        <div className="text-sm text-gray-600">{row.program_name || 'Unknown program'}</div>
                      </div>
                      <Badge tone="good">{formatCurrency(row.amount_dollars)}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      ABN {row.recipient_abn} → {row.organization_name}
                    </div>
                  </div>
                ))}
              </SampleList>

              <SampleList
                title="Safe candidate: org CivicGraph links"
                error={sampleErrors.gsAutoLinks}
                emptyLabel="No exact ABN CivicGraph links found in this sample."
              >
                {samples.gsAutoLinks.map((row, index) => (
                  <div key={`gs-${row.id}-${row.gs_entity_id}-${index}`} className="border border-gray-200 p-3">
                    <div className="font-bold">{row.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      ABN {row.abn} → {row.canonical_name || row.gs_entity_id}
                    </div>
                    <div className="mt-2">
                      <Badge tone="info">{row.entity_type || 'entity'}</Badge>
                    </div>
                  </div>
                ))}
              </SampleList>

              <SampleList
                title="Human review: identity mismatches"
                error={sampleErrors.identityMismatches}
                emptyLabel="No stored CivicGraph ABN mismatches found in this sample."
              >
                {samples.identityMismatches.map((row, index) => (
                  <div key={`identity-${row.id}-${index}`} className="border border-gray-200 p-3">
                    <div className="font-bold">{row.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Org ABN {row.abn || 'missing'} · CivicGraph ABN {row.gs_abn || 'missing'}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{row.canonical_name || 'No linked entity name'}</div>
                  </div>
                ))}
              </SampleList>

              <SampleList
                title="Human review: service records missing orgs"
                error={sampleErrors.servicesMissingOrg}
                emptyLabel="No unlinked services found in this sample."
              >
                {samples.servicesMissingOrg.map((row, index) => (
                  <div key={`service-org-${row.id}-${index}`} className="border border-gray-200 p-3">
                    <div className="font-bold">{row.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {row.category || 'Uncategorised'} · {row.location_state || 'No state'} · {shortDate(row.updated_at)}
                    </div>
                    <Link href={`/services/${row.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                      Public record <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </SampleList>

              <SampleList
                title="Scraper queue: services missing source URLs"
                error={sampleErrors.servicesMissingSource}
                emptyLabel="No services missing source URLs found in this sample."
              >
                {samples.servicesMissingSource.map((row, index) => (
                  <div key={`service-source-${row.id}-${index}`} className="border border-gray-200 p-3">
                    <div className="font-bold">{row.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {row.category || 'Uncategorised'} · {row.location_state || 'No state'} · updated {shortDate(row.updated_at)}
                    </div>
                  </div>
                ))}
              </SampleList>

              <SampleList
                title="Freshness queue: source-linked services needing re-check"
                error={sampleErrors.servicesStaleSource}
                emptyLabel="No source-linked services need a freshness check in this sample."
              >
                {samples.servicesStaleSource.map((row, index) => (
                  <div key={`service-freshness-${row.id}-${index}`} className="border border-gray-200 p-3">
                    <div className="font-bold">{row.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {row.category || 'Uncategorised'} · {row.location_state || 'No state'} · checked {shortDate(row.last_verified_at)}
                    </div>
                    <div className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-gray-500">
                      {row.data_source_url}
                    </div>
                  </div>
                ))}
              </SampleList>

              <SampleList
                title="Model queue: ALMA records missing org IDs"
                error={sampleErrors.interventionOrphans}
                emptyLabel="No ALMA orphan models found in this sample."
              >
                {samples.interventionOrphans.map((row, index) => (
                  <div key={`orphan-${row.id}-${index}`} className="border border-gray-200 p-3">
                    <div className="font-bold">{row.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {row.operating_organization || 'No organisation'} · {row.type || 'model'} · {row.verification_status || 'unknown status'}
                    </div>
                    <div className="mt-2">
                      <Badge tone="warn">{row.evidence_level || 'evidence not labelled'}</Badge>
                    </div>
                  </div>
                ))}
              </SampleList>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black bg-gray-50">
          <div className="container-justice py-10">
            <div className="mb-6 flex items-center gap-3">
              <Bot className="h-7 w-7 text-red-600" />
              <div>
                <h2 className="text-3xl font-black tracking-tight">Agent and scraper options</h2>
                <p className="text-gray-700">Mutation-capable endpoints require the cron bearer token. Keep fuzzy scripts in dry-run until reviewed.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {agentCards.map((agent) => (
                <div key={agent.title} className="border-2 border-black bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-black">{agent.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-700">{agent.script}</p>
                    </div>
                    <Badge tone={agent.status.includes('safe') ? 'good' : agent.status.includes('review') ? 'warn' : 'info'}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="mt-4 overflow-hidden border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                    {agent.endpoint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container-justice py-10">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="border-2 border-black p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center bg-black text-white">
                  <GitBranch className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black">1. Link identity</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  ABN links connect organisations, funding, ACNC, and CivicGraph. This is the backbone of a trustworthy national list.
                </p>
              </div>
              <div className="border-2 border-black p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center bg-black text-white">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black">2. Fill source trails</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  Services and models need source URLs, freshness checks, and review badges so people can see what is solid and what is still being checked.
                </p>
              </div>
              <div className="border-2 border-black p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center bg-black text-white">
                  <Network className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black">3. Grow the graph</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  Once identity is stable, agents can add board/people links, grants, tenders, programs, stories, and policy signals without muddying the public record.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/admin/data-health" className="inline-flex items-center gap-2 bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800">
                Open data health <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/directory" className="inline-flex items-center gap-2 border-2 border-black bg-white px-5 py-3 text-sm font-bold hover:bg-gray-100">
                Public directory <Globe className="h-4 w-4" />
              </Link>
              <Link href="/admin/funding" className="inline-flex items-center gap-2 border-2 border-black bg-white px-5 py-3 text-sm font-bold hover:bg-gray-100">
                Funding admin <Link2 className="h-4 w-4" />
              </Link>
              <Link href="/admin/organizations" className="inline-flex items-center gap-2 border-2 border-black bg-white px-5 py-3 text-sm font-bold hover:bg-gray-100">
                Organizations <RefreshCw className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              Generated from live Supabase data at {new Date(data.generatedAt).toLocaleString('en-AU')}. Counts are operational indicators, not manual audits.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
