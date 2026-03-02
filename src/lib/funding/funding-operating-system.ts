import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import {
  DEV_ADMIN_BYPASS_COOKIE,
  getDevAdminBypassUser,
  hasDevAdminBypass,
} from '@/lib/dev-admin-bypass';
import { createServiceClient } from '@/lib/supabase/service';
import {
  pickFundingOperatingAutoAssignee,
  type FundingOperatingRouteClass,
} from '@/lib/funding/funding-operating-dispatch';
import {
  persistFundingNotifications,
  type NotificationPayload,
} from '@/lib/funding/notification-engine';

type AnySupabase = ReturnType<typeof createServiceClient> & {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<any>;
};

export type FundingOsIngestOptions = {
  opportunityIds?: string[];
  statuses?: string[];
  limit?: number;
};

export type FundingOsMatchOptions = {
  opportunityIds?: string[];
  organizationIds?: string[];
  minScore?: number;
  statuses?: string[];
  limit?: number;
};

export type CapabilitySignalInput = {
  signalType: string;
  signalName: string;
  signalScore?: number | null;
  signalWeight?: number | null;
  sourceKind?: string | null;
  evidenceUrl?: string | null;
  evidenceNote?: string | null;
  recordedAt?: string | null;
  expiresAt?: string | null;
};

export type CapabilityProfileInput = {
  organizationId: string;
  serviceGeographies?: string[];
  priorityPopulations?: string[];
  capabilityTags?: string[];
  operatingModels?: string[];
  livedExperienceLed?: boolean;
  firstNationsLed?: boolean;
  annualRevenueBand?: string | null;
  fundingReadinessScore?: number | null;
  complianceReadinessScore?: number | null;
  deliveryConfidenceScore?: number | null;
  communityTrustScore?: number | null;
  evidenceMaturityScore?: number | null;
  reportingToCommunityScore?: number | null;
  unrestrictedFundingNeed?: number | null;
  dgrStatus?: string | null;
  abn?: string | null;
  canManageGovernmentContracts?: boolean;
  canManagePhilanthropicGrants?: boolean;
  lastCapabilityReviewAt?: string | null;
  nextCapabilityReviewAt?: string | null;
  capabilityNotes?: string | null;
  supportingEvidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  signals?: CapabilitySignalInput[];
};

export type CapabilityProfileSeedOptions = {
  organizationIds?: string[];
  slugs?: string[];
  limit?: number;
  overwriteExisting?: boolean;
};

export type BasecampConnectorRefreshOptions = {
  organizationIds?: string[];
  slugs?: string[];
  limit?: number;
};

export type FundingOsBootstrapOptions = {
  organizationIds?: string[];
  slugs?: string[];
  statuses?: string[];
  opportunityIds?: string[];
  capabilitySeedLimit?: number;
  ingestLimit?: number;
  matchLimit?: number;
  minScore?: number;
  overwriteExistingProfiles?: boolean;
};

export type FundingOsCycleOptions = {
  opportunityIds?: string[];
  organizationIds?: string[];
  statuses?: string[];
  ingestLimit?: number;
  matchLimit?: number;
  minScore?: number;
  notifyOnAlerts?: boolean;
};

export type OutcomeUpdateInput = {
  commitmentId: string;
  updateType: 'baseline' | 'progress' | 'milestone' | 'final' | 'correction';
  reportedValue?: number | null;
  reportedAt?: string | null;
  reportingPeriodStart?: string | null;
  reportingPeriodEnd?: string | null;
  narrative?: string | null;
  evidenceUrls?: string[];
  confidenceScore?: number | null;
};

export type CommunityOutcomeValidationInput = {
  updateId: string;
  validatorKind:
    | 'community_member'
    | 'community_board'
    | 'elder'
    | 'participant'
    | 'independent_evaluator'
    | 'funder';
  validatorName?: string | null;
  validationStatus: 'confirmed' | 'contested' | 'mixed' | 'needs_follow_up';
  validationNotes?: string | null;
  impactRating?: number | null;
  trustRating?: number | null;
  validatedAt?: string | null;
};

export type FundingDiscoveryReviewActivityInput = {
  id: string;
  timestamp: string;
  type: string;
  detail: string;
  organizationId?: string;
  organizationName?: string;
};

export type FundingDiscoveryReviewWorkspaceInput = {
  organizationId: string;
  note?: string | null;
  decisionTag?: 'advance' | 'hold' | 'needs_review' | null;
  activity?: FundingDiscoveryReviewActivityInput | null;
};

export type FundingApplicationDraftWorkspaceInput = {
  organizationId: string;
  opportunityId: string;
  applicationId?: string | null;
  narrativeDraft?: string | null;
  supportMaterial?: string[];
  communityReviewNotes?: string[];
  budgetNotes?: string | null;
  draftStatus?:
    | 'draft'
    | 'in_review'
    | 'ready_to_submit'
    | 'submitted'
    | 'archived'
    | null;
  lastReviewRequestedAt?: string | null;
  lastReviewCompletedAt?: string | null;
};

export type FundingDiscoverySharedShortlistEntry = {
  id: string;
  organizationId: string;
  sortIndex: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type OutcomeCommitmentInput = {
  commitmentId?: string;
  fundingAwardId: string;
  outcomeDefinitionId: string;
  organizationId?: string;
  commitmentStatus?: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  baselineValue?: number | null;
  targetValue?: number | null;
  currentValue?: number | null;
  targetDate?: string | null;
  measurementNotes?: string | null;
  evidenceConfidenceScore?: number | null;
  communityPriorityWeight?: number | null;
  metadata?: Record<string, unknown>;
};

export type OutcomeDefinitionInput = {
  outcomeDefinitionId?: string;
  name: string;
  outcomeDomain:
    | 'health'
    | 'housing'
    | 'education'
    | 'employment'
    | 'culture'
    | 'family'
    | 'community_safety'
    | 'self_determination'
    | 'system_accountability';
  unit?: string | null;
  description?: string | null;
  baselineMethod?: string | null;
  communityDefined?: boolean;
  firstNationsDataSensitive?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
};

export type SpendingTransactionInput = {
  transactionId?: string;
  fundingProgramId: string;
  opportunityId?: string | null;
  organizationId?: string | null;
  transactionType:
    | 'appropriation'
    | 'allocation'
    | 'contract'
    | 'grant_payment'
    | 'milestone_payment'
    | 'clawback'
    | 'reconciliation';
  transactionStatus?:
    | 'planned'
    | 'committed'
    | 'disbursed'
    | 'reconciled'
    | 'cancelled';
  amount: number;
  currency?: string | null;
  transactionDate?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  jurisdiction?: string | null;
  sourceReference?: string | null;
  description?: string | null;
  communityVisible?: boolean;
  metadata?: Record<string, unknown>;
};

type AdminUser = {
  id: string;
  email?: string | null;
};

type OpportunityRecord = {
  id: string;
  name: string;
  description?: string | null;
  funder_name: string;
  source_type: 'government' | 'philanthropy' | 'corporate' | 'community';
  source_url?: string | null;
  application_url?: string | null;
  source_id?: string | null;
  scrape_source?: string | null;
  status?: string | null;
  total_pool_amount?: number | null;
  funding_duration?: string | null;
  opens_at?: string | null;
  deadline?: string | null;
  jurisdictions?: string[] | null;
  focus_areas?: string[] | null;
  keywords?: string[] | null;
};

type CapabilityProfileRecord = {
  id: string;
  organization_id: string;
  service_geographies?: string[] | null;
  capability_tags?: string[] | null;
  funding_readiness_score?: number | null;
  compliance_readiness_score?: number | null;
  delivery_confidence_score?: number | null;
  community_trust_score?: number | null;
  reporting_to_community_score?: number | null;
  can_manage_government_contracts?: boolean | null;
  can_manage_philanthropic_grants?: boolean | null;
  first_nations_led?: boolean | null;
};

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function asArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function mapProgramStatus(status?: string | null): string {
  switch (status) {
    case 'upcoming':
      return 'pipeline';
    case 'open':
    case 'closing_soon':
      return 'open';
    case 'recurring':
      return 'active';
    case 'closed':
      return 'closed';
    case 'archived':
      return 'archived';
    default:
      return 'pipeline';
  }
}

function mapAwardType(sourceType?: string | null): string {
  switch (sourceType) {
    case 'government':
      return 'grant';
    case 'philanthropy':
      return 'philanthropic_gift';
    case 'corporate':
      return 'pooled_investment';
    case 'community':
      return 'pooled_investment';
    default:
      return 'grant';
  }
}

function clampScore(value: number | null | undefined, fallback = 0): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, numeric));
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase().trim() : '';
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean))];
}

function mergeStringArrays(...groups: Array<Array<string | null | undefined> | null | undefined>): string[] {
  return uniqueStrings(groups.flatMap((group) => group || []));
}

function sanitizeCapabilitySignals(signals: CapabilitySignalInput[] | undefined) {
  const allowedSignalTypes = new Set([
    'governance',
    'finance',
    'delivery',
    'cultural_authority',
    'community_trust',
    'evidence',
    'compliance',
    'reporting',
  ]);
  const allowedSourceKinds = new Set([
    'community',
    'internal',
    'government',
    'philanthropy',
    'independent',
  ]);

  return (signals || [])
    .filter((signal) => signal && typeof signal.signalName === 'string' && signal.signalName.trim())
    .map((signal) => {
      const signalType = String(signal.signalType || '').trim();
      if (!allowedSignalTypes.has(signalType)) {
        throw new Error(`Validation: Invalid signalType "${signalType}"`);
      }

      const sourceKind = String(signal.sourceKind || 'internal').trim();
      if (!allowedSourceKinds.has(sourceKind)) {
        throw new Error(`Validation: Invalid sourceKind "${sourceKind}"`);
      }

      return {
        signal_type: signalType,
        signal_name: signal.signalName.trim(),
        signal_score: clampScore(signal.signalScore ?? 0),
        signal_weight:
          typeof signal.signalWeight === 'number' && signal.signalWeight > 0
            ? signal.signalWeight
            : 1,
        source_kind: sourceKind,
        evidence_url: signal.evidenceUrl || null,
        evidence_note: signal.evidenceNote || null,
        recorded_at: signal.recordedAt || new Date().toISOString(),
        expires_at: signal.expiresAt || null,
      };
    });
}

function sanitizeCapabilityProfileInput(input: CapabilityProfileInput) {
  const organizationId = String(input.organizationId || '').trim();
  if (!organizationId) {
    throw new Error('Validation: organizationId is required');
  }

  return {
    organization_id: organizationId,
    service_geographies: asArray(input.serviceGeographies),
    priority_populations: asArray(input.priorityPopulations),
    capability_tags: asArray(input.capabilityTags),
    operating_models: asArray(input.operatingModels),
    lived_experience_led: Boolean(input.livedExperienceLed),
    first_nations_led: Boolean(input.firstNationsLed),
    annual_revenue_band: input.annualRevenueBand || null,
    funding_readiness_score: clampScore(input.fundingReadinessScore),
    compliance_readiness_score: clampScore(input.complianceReadinessScore),
    delivery_confidence_score: clampScore(input.deliveryConfidenceScore),
    community_trust_score: clampScore(input.communityTrustScore),
    evidence_maturity_score: clampScore(input.evidenceMaturityScore),
    reporting_to_community_score: clampScore(input.reportingToCommunityScore),
    unrestricted_funding_need:
      typeof input.unrestrictedFundingNeed === 'number' ? input.unrestrictedFundingNeed : null,
    dgr_status: input.dgrStatus || null,
    abn: input.abn || null,
    can_manage_government_contracts: Boolean(input.canManageGovernmentContracts),
    can_manage_philanthropic_grants:
      input.canManagePhilanthropicGrants === false ? false : true,
    last_capability_review_at: input.lastCapabilityReviewAt || null,
    next_capability_review_at: input.nextCapabilityReviewAt || null,
    capability_notes: input.capabilityNotes || null,
    supporting_evidence: input.supportingEvidence || {},
    metadata: input.metadata || {},
  };
}

function deriveCapabilitySeedFromOrganization(org: Record<string, any>) {
  const textBlob = [
    org.name,
    org.slug,
    org.description,
    org.type,
    org.city,
    org.state,
    org.location,
    ...(Array.isArray(org.tags) ? org.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const partnerTier = normalizeText(org.partner_tier);
  const verificationStatus = normalizeText(org.verification_status);
  const orgType = normalizeText(org.type);

  const firstNationsLed = includesAny(textBlob, [
    'indigenous',
    'aboriginal',
    'first nations',
    'torres strait',
    'on-country',
    'on country',
  ]);

  const youthJusticeFocused = includesAny(textBlob, [
    'youth',
    'justice',
    'diversion',
    'detention',
    'bail',
    'mentoring',
    'community safety',
  ]);

  const serviceGeographies = uniqueStrings([
    org.state,
    org.city,
    org.location,
    ...(Array.isArray(org.metadata?.jurisdictions) ? org.metadata.jurisdictions : []),
  ]);

  const capabilityTags = uniqueStrings([
    ...(Array.isArray(org.tags) ? org.tags : []),
    youthJusticeFocused ? 'youth_justice' : null,
    firstNationsLed ? 'first_nations' : null,
    partnerTier === 'basecamp' ? 'basecamp' : null,
    orgType.includes('community') ? 'community_led' : null,
    orgType.includes('service') ? 'service_delivery' : null,
    includesAny(textBlob, ['housing']) ? 'housing' : null,
    includesAny(textBlob, ['education']) ? 'education' : null,
    includesAny(textBlob, ['employment']) ? 'employment' : null,
    includesAny(textBlob, ['healing', 'mental health', 'wellbeing']) ? 'healing' : null,
    includesAny(textBlob, ['culture']) ? 'culture' : null,
  ]);

  const operatingModels = uniqueStrings([
    partnerTier === 'basecamp' ? 'place_based_backbone' : null,
    orgType.includes('community') ? 'community_led_delivery' : null,
    firstNationsLed ? 'cultural_authority_led' : null,
    includesAny(textBlob, ['youth-led', 'youth led']) ? 'youth_led' : null,
    includesAny(textBlob, ['media', 'story', 'journalism']) ? 'narrative_change' : null,
    includesAny(textBlob, ['mentoring']) ? 'relationship_based_support' : null,
  ]);

  const partnerTierBonus = partnerTier === 'basecamp' ? 15 : partnerTier === 'partner' ? 8 : 0;
  const verifiedBonus = verificationStatus === 'verified' ? 10 : verificationStatus === 'pending' ? 4 : 0;
  const firstNationsBonus = firstNationsLed ? 8 : 0;
  const youthJusticeBonus = youthJusticeFocused ? 10 : 0;

  const fundingReadinessScore = clampScore(45 + partnerTierBonus + verifiedBonus + youthJusticeBonus);
  const complianceReadinessScore = clampScore(40 + partnerTierBonus + verifiedBonus);
  const deliveryConfidenceScore = clampScore(50 + partnerTierBonus + verifiedBonus + youthJusticeBonus);
  const communityTrustScore = clampScore(55 + partnerTierBonus + firstNationsBonus);
  const evidenceMaturityScore = clampScore(35 + partnerTierBonus);
  const reportingToCommunityScore = clampScore(50 + partnerTierBonus + firstNationsBonus);

  const signals: CapabilitySignalInput[] = [
    {
      signalType: 'community_trust',
      signalName: partnerTier === 'basecamp' ? 'Basecamp community trust baseline' : 'Community trust baseline',
      signalScore: communityTrustScore,
      signalWeight: 1.2,
      sourceKind: 'internal',
      evidenceNote: 'Seeded from organization metadata, partner tier, and location context.',
    },
    {
      signalType: 'delivery',
      signalName: 'Delivery confidence baseline',
      signalScore: deliveryConfidenceScore,
      signalWeight: 1.0,
      sourceKind: 'internal',
      evidenceNote: 'Seeded from verification status, organization type, and program focus indicators.',
    },
  ];

  if (firstNationsLed) {
    signals.push({
      signalType: 'cultural_authority',
      signalName: 'Cultural authority baseline',
      signalScore: clampScore(60 + partnerTierBonus),
      signalWeight: 1.1,
      sourceKind: 'community',
      evidenceNote: 'Seeded because organization text indicates First Nations leadership or cultural authority.',
    });
  }

  return {
    organizationId: String(org.id),
    serviceGeographies,
    priorityPopulations: uniqueStrings([
      includesAny(textBlob, ['young people', 'youth']) ? 'young_people' : null,
      firstNationsLed ? 'first_nations' : null,
      includesAny(textBlob, ['family']) ? 'families' : null,
    ]),
    capabilityTags,
    operatingModels,
    livedExperienceLed: includesAny(textBlob, ['lived experience', 'community-led', 'community led', 'youth-led', 'youth led']),
    firstNationsLed,
    annualRevenueBand: partnerTier === 'basecamp' ? 'established' : 'emerging',
    fundingReadinessScore,
    complianceReadinessScore,
    deliveryConfidenceScore,
    communityTrustScore,
    evidenceMaturityScore,
    reportingToCommunityScore,
    dgrStatus: typeof org.metadata?.dgr_status === 'string' ? org.metadata.dgr_status : null,
    abn: typeof org.metadata?.abn === 'string' ? org.metadata.abn : null,
    canManageGovernmentContracts: partnerTier === 'basecamp' || verificationStatus === 'verified',
    canManagePhilanthropicGrants: true,
    capabilityNotes:
      'Seeded baseline profile. Replace with direct community-validated capability data as soon as available.',
    supportingEvidence: {
      seededFrom: 'organization_record',
      sourceOrganizationSlug: org.slug || null,
      partnerTier: org.partner_tier || null,
      verificationStatus: org.verification_status || null,
    },
    metadata: {
      seededAt: new Date().toISOString(),
      seedMethod: 'funding_os_capability_seed',
    },
    signals,
  } satisfies CapabilityProfileInput;
}

function average(values: Array<number | null | undefined>): number {
  const normalized = values.filter((value): value is number => typeof value === 'number');
  if (normalized.length === 0) {
    return 0;
  }
  const total = normalized.reduce((sum, value) => sum + value, 0);
  return Math.round((total / normalized.length) * 100) / 100;
}

function calculateOverlapScore(a: string[] | null | undefined, b: string[] | null | undefined): number {
  const left = new Set(asArray(a).map((item) => item.toLowerCase()));
  const right = new Set(asArray(b).map((item) => item.toLowerCase()));
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const item of left) {
    if (right.has(item)) {
      overlap += 1;
    }
  }

  return Math.min(100, overlap * 25);
}

function calculateGeographicFit(
  opportunity: Pick<OpportunityRecord, 'jurisdictions'>,
  profile: Pick<CapabilityProfileRecord, 'service_geographies'>
): number {
  const jurisdictions = asArray(opportunity.jurisdictions);
  const geographies = asArray(profile.service_geographies);

  if (jurisdictions.length === 0) {
    return 70;
  }

  return calculateOverlapScore(jurisdictions, geographies);
}

function buildExplainability(
  opportunity: OpportunityRecord,
  profile: CapabilityProfileRecord,
  matchScore: number,
  readinessScore: number,
  communityAlignmentScore: number,
  outcomeAlignmentScore: number,
  geographicFitScore: number
) {
  return {
    matchScore,
    signals: {
      readinessScore,
      communityAlignmentScore,
      outcomeAlignmentScore,
      geographicFitScore,
      firstNationsLed: Boolean(profile.first_nations_led),
      governmentReady: Boolean(profile.can_manage_government_contracts),
      philanthropyReady: Boolean(profile.can_manage_philanthropic_grants),
    },
    overlap: {
      opportunityFocusAreas: asArray(opportunity.focus_areas),
      organizationCapabilityTags: asArray(profile.capability_tags),
      opportunityJurisdictions: asArray(opportunity.jurisdictions),
      organizationGeographies: asArray(profile.service_geographies),
    },
  };
}

export async function requireAdminUser(): Promise<AdminUser> {
  const cookieStore = await cookies();
  if (hasDevAdminBypass(cookieStore.get(DEV_ADMIN_BYPASS_COOKIE)?.value)) {
    const bypassUser = getDevAdminBypassUser();
    return { id: bypassUser.id, email: bypassUser.email };
  }

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error } = await (authClient as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to verify admin access');
  }

  if (profile?.role !== 'admin') {
    throw new Error('Not authorized');
  }

  return { id: user.id, email: user.email };
}

function getServiceClient(): AnySupabase {
  return createServiceClient() as AnySupabase;
}

function normalizePersistedActorUserId(userId: string | null | undefined) {
  return userId && userId === getDevAdminBypassUser().id ? null : userId || null;
}

async function createWorkflow(
  serviceClient: AnySupabase,
  workflowType: string,
  scopeKind: string,
  userId: string | null,
  inputPayload: Record<string, unknown>
) {
  const normalizedUserId = normalizePersistedActorUserId(userId);

  const { data, error } = await serviceClient
    .from('funding_agent_workflows')
    .insert([
      {
        workflow_type: workflowType,
        scope_kind: scopeKind,
        workflow_status: 'running',
        triggered_by_user_id: normalizedUserId,
        input_payload: inputPayload,
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || `Failed to create ${workflowType} workflow`);
  }

  return data;
}

async function completeWorkflow(
  serviceClient: AnySupabase,
  workflowId: string,
  outputPayload: Record<string, unknown>,
  metrics: {
    recordsScanned: number;
    recordsChanged: number;
    errorCount?: number;
  }
) {
  await serviceClient
    .from('funding_agent_workflows')
    .update({
      workflow_status: metrics.errorCount ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      records_scanned: metrics.recordsScanned,
      records_changed: metrics.recordsChanged,
      error_count: metrics.errorCount || 0,
      output_payload: outputPayload,
    })
    .eq('id', workflowId);
}

export function fundingOsErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (message === 'Not authenticated') {
    return { error: message, status: 401 };
  }

  if (message === 'Not authorized') {
    return { error: message, status: 403 };
  }

  if (message.startsWith('Validation:')) {
    return { error: message.replace('Validation: ', ''), status: 400 };
  }

  return { error: message, status: 500 };
}

export async function ingestFundingOperatingSystem(
  options: FundingOsIngestOptions,
  adminUserId: string | null
) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, options.limit ?? 50));
  const statuses = (options.statuses?.length ? options.statuses : ['open', 'closing_soon', 'upcoming'])
    .map((status) => String(status).trim())
    .filter(Boolean);
  const opportunityIds = (options.opportunityIds || []).map((id) => String(id).trim()).filter(Boolean);

  const workflow = await createWorkflow(serviceClient, 'source_ingest', 'global', adminUserId, {
    limit,
    statuses,
    opportunityIds,
  });

  let query = serviceClient
    .from('alma_funding_opportunities')
    .select(
      'id, name, description, funder_name, source_type, source_url, application_url, source_id, scrape_source, status, total_pool_amount, funding_duration, opens_at, deadline, jurisdictions, focus_areas, keywords'
    )
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (statuses.length > 0) {
    query = query.in('status', statuses);
  }

  if (opportunityIds.length > 0) {
    query = query.in('id', opportunityIds);
  }

  const { data: opportunities, error } = await query;
  if (error) {
    await completeWorkflow(serviceClient, workflow.id, { error: error.message }, {
      recordsScanned: 0,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(error.message || 'Failed to load funding opportunities for ingest');
  }

  const sourceIdsByName = new Map<string, string>();
  let sourcesUpserted = 0;
  let programsUpserted = 0;

  for (const rawOpportunity of (opportunities || []) as OpportunityRecord[]) {
    const sourcePayload = {
      name: rawOpportunity.funder_name,
      source_type: rawOpportunity.source_type,
      canonical_url: rawOpportunity.source_url || rawOpportunity.application_url || null,
      website_url: rawOpportunity.source_url || rawOpportunity.application_url || null,
      jurisdictions: asArray(rawOpportunity.jurisdictions),
      metadata: {
        latestOpportunityId: rawOpportunity.id,
        latestScrapeSource: rawOpportunity.scrape_source || null,
        latestSourceId: rawOpportunity.source_id || null,
      },
    };

    const { data: sourceRow, error: sourceError } = await serviceClient
      .from('funding_sources')
      .upsert([sourcePayload], { onConflict: 'name' })
      .select('id, name')
      .single();

    if (sourceError) {
      continue;
    }

    sourceIdsByName.set(rawOpportunity.funder_name, sourceRow.id);
    sourcesUpserted += 1;

    const programSlug = normalizeSlug(`${rawOpportunity.funder_name}-${rawOpportunity.name}-${rawOpportunity.id}`);
    const programPayload = {
      funding_source_id: sourceRow.id,
      linked_opportunity_id: rawOpportunity.id,
      name: rawOpportunity.name,
      slug: programSlug,
      program_kind:
        rawOpportunity.source_type === 'government' ? 'grant_program' : 'philanthropic_fund',
      status: mapProgramStatus(rawOpportunity.status),
      source_program_code: rawOpportunity.source_id || null,
      description: rawOpportunity.description || null,
      objective: rawOpportunity.description || null,
      total_budget_amount: rawOpportunity.total_pool_amount ?? null,
      budget_start_date: rawOpportunity.opens_at?.slice(0, 10) || null,
      budget_end_date: rawOpportunity.deadline?.slice(0, 10) || null,
      decision_window: rawOpportunity.funding_duration || null,
      primary_jurisdictions: asArray(rawOpportunity.jurisdictions),
      target_populations: asArray(rawOpportunity.keywords),
      focus_areas: asArray(rawOpportunity.focus_areas),
      metadata: {
        ingestedFromOpportunityId: rawOpportunity.id,
        sourceUrl: rawOpportunity.source_url || null,
        applicationUrl: rawOpportunity.application_url || null,
      },
    };

    const { error: programError } = await serviceClient
      .from('funding_programs')
      .upsert([programPayload], { onConflict: 'slug' });

    if (!programError) {
      programsUpserted += 1;
    }
  }

  const result = {
    workflowId: workflow.id,
    opportunitiesScanned: (opportunities || []).length,
    sourcesUpserted,
    programsUpserted,
    distinctSourcesTouched: sourceIdsByName.size,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: (opportunities || []).length,
    recordsChanged: sourcesUpserted + programsUpserted,
  });

  return result;
}

export async function listFundingMatchRecommendations(filters: {
  opportunityId?: string;
  organizationId?: string;
  minScore?: number;
  status?: string;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters.limit ?? 50));

  let query = serviceClient
    .from('funding_match_recommendations')
    .select('*')
    .order('match_score', { ascending: false })
    .limit(limit);

  if (filters.opportunityId) {
    query = query.eq('opportunity_id', filters.opportunityId);
  }

  if (filters.organizationId) {
    query = query.eq('organization_id', filters.organizationId);
  }

  if (typeof filters.minScore === 'number') {
    query = query.gte('match_score', filters.minScore);
  }

  if (filters.status) {
    query = query.eq('recommendation_status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to list funding match recommendations');
  }

  const rows = (data || []) as Array<Record<string, any>>;
  if (rows.length === 0) {
    return [];
  }

  const opportunityIds = uniqueStrings(rows.map((row) => row.opportunity_id));
  const organizationIds = uniqueStrings(rows.map((row) => row.organization_id));

  const [{ data: opportunities }, { data: organizations }] = await Promise.all([
    serviceClient
      .from('alma_funding_opportunities')
      .select('id, name, funder_name, source_type, deadline, status, max_grant_amount')
      .in('id', opportunityIds),
    serviceClient
      .from('organizations')
      .select('id, name, slug, city, state')
      .in('id', organizationIds),
  ]);

  const opportunityMap = new Map<string, Record<string, any>>();
  for (const opportunity of (opportunities || []) as Array<Record<string, any>>) {
    opportunityMap.set(String(opportunity.id), opportunity);
  }

  const organizationMap = new Map<string, Record<string, any>>();
  for (const organization of (organizations || []) as Array<Record<string, any>>) {
    organizationMap.set(String(organization.id), organization);
  }

  return rows.map((row) => ({
    ...row,
    opportunity: opportunityMap.get(String(row.opportunity_id)) || null,
    organization: organizationMap.get(String(row.organization_id)) || null,
  }));
}

export async function listFundingAgentWorkflows(filters: {
  workflowType?: string;
  status?: string;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, filters.limit ?? 20));

  let query = serviceClient
    .from('funding_agent_workflows')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (filters.workflowType) {
    query = query.eq('workflow_type', filters.workflowType);
  }

  if (filters.status) {
    query = query.eq('workflow_status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to list funding workflows');
  }

  return data || [];
}

export async function listFundingOperatingAlerts(options?: {
  limit?: number;
  strongMatchThreshold?: number;
  stalledEngagedAfterHours?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(20, options?.limit ?? 6));
  const strongMatchThreshold = Math.max(
    0,
    Math.min(100, Number(options?.strongMatchThreshold ?? 85) || 85)
  );
  const stalledEngagedAfterHours = Math.max(
    1,
    Math.min(24 * 30, Number(options?.stalledEngagedAfterHours ?? 72) || 72)
  );
  const now = new Date().toISOString();
  const stalledBefore = new Date(Date.now() - stalledEngagedAfterHours * 60 * 60 * 1000).toISOString();

  const [
    { data: overdueRows, count: overdueCount, error: overdueError },
    { data: spendRows, count: spendCount, error: spendError },
    { count: candidateCount, error: candidateCountError },
    {
      data: awardWithoutCommitmentRows,
      count: awardWithoutCommitmentCount,
      error: awardWithoutCommitmentError,
    },
    {
      data: stalledEngagedRows,
      count: stalledEngagedCount,
      error: stalledEngagedError,
    },
  ] = await Promise.all([
    serviceClient
      .from('v_funding_award_community_accountability')
      .select(
        'funding_award_id, organization_name, funding_program_name, funding_source_name, award_status, tracked_public_spend, community_validation_count, outcome_commitment_count, outcome_update_count, community_report_due_at, updated_at',
        { count: 'exact' }
      )
      .not('community_report_due_at', 'is', null)
      .lt('community_report_due_at', now)
      .order('community_report_due_at', { ascending: true })
      .limit(limit),
    serviceClient
      .from('v_funding_award_community_accountability')
      .select(
        'funding_award_id, organization_name, funding_program_name, funding_source_name, award_status, tracked_public_spend, community_validation_count, outcome_commitment_count, outcome_update_count, community_report_due_at, updated_at',
        { count: 'exact' }
      )
      .gt('tracked_public_spend', 0)
      .eq('community_validation_count', 0)
      .order('tracked_public_spend', { ascending: false })
      .limit(limit),
    serviceClient
      .from('funding_match_recommendations')
      .select('id', { count: 'exact', head: true })
      .eq('recommendation_status', 'candidate')
      .gte('match_score', strongMatchThreshold),
    serviceClient
      .from('v_funding_award_community_accountability')
      .select(
        'funding_award_id, organization_name, funding_program_name, funding_source_name, award_status, tracked_public_spend, community_validation_count, outcome_commitment_count, outcome_update_count, community_report_due_at, updated_at',
        { count: 'exact' }
      )
      .eq('outcome_commitment_count', 0)
      .order('updated_at', { ascending: false })
      .limit(limit),
    serviceClient
      .from('funding_match_recommendations')
      .select(
        'id, opportunity_id, organization_id, recommendation_status, match_score, readiness_score, community_alignment_score, outcome_alignment_score, geographic_fit_score, explainability, created_at, updated_at',
        { count: 'exact' }
      )
      .eq('recommendation_status', 'engaged')
      .lt('updated_at', stalledBefore)
      .order('updated_at', { ascending: true })
      .limit(limit),
  ]);

  if (overdueError) {
    throw new Error(overdueError.message || 'Failed to load overdue community report alerts');
  }

  if (spendError) {
    throw new Error(spendError.message || 'Failed to load spend without validation alerts');
  }

  if (candidateCountError) {
    throw new Error(candidateCountError.message || 'Failed to load strong match alert count');
  }

  if (awardWithoutCommitmentError) {
    throw new Error(
      awardWithoutCommitmentError.message || 'Failed to load awards without commitments alerts'
    );
  }

  if (stalledEngagedError) {
    throw new Error(stalledEngagedError.message || 'Failed to load stalled engaged match alerts');
  }

  const strongMatchesNotEngaged = await listFundingMatchRecommendations({
    status: 'candidate',
    minScore: strongMatchThreshold,
    limit,
  });

  const [{ data: commitmentRows, error: commitmentRowsError }, {
    data: updateRows,
    error: updateRowsError,
  }] = await Promise.all([
    serviceClient
      .from('funding_outcome_commitments')
      .select(
        'id, funding_award_id, organization_id, outcome_definition_id, commitment_status, updated_at'
      )
      .order('updated_at', { ascending: false }),
    serviceClient
      .from('funding_outcome_updates')
      .select('id, commitment_id'),
  ]);

  if (commitmentRowsError) {
    throw new Error(commitmentRowsError.message || 'Failed to load commitments without updates alerts');
  }

  if (updateRowsError) {
    throw new Error(updateRowsError.message || 'Failed to load commitment update alerts');
  }

  const updatedCommitmentIds = new Set(
    ((updateRows || []) as Array<Record<string, any>>).map((row) => String(row.commitment_id))
  );

  const staleCommitments = ((commitmentRows || []) as Array<Record<string, any>>).filter(
    (row) => !updatedCommitmentIds.has(String(row.id))
  );
  const staleCommitmentItems = staleCommitments.slice(0, limit);
  const commitmentOrganizationIds = uniqueStrings(
    staleCommitmentItems.map((row) => row.organization_id)
  );
  const commitmentOutcomeIds = uniqueStrings(
    staleCommitmentItems.map((row) => row.outcome_definition_id)
  );

  const [
    { data: staleCommitmentOrganizations, error: staleCommitmentOrganizationsError },
    { data: staleOutcomeDefinitions, error: staleOutcomeDefinitionsError },
    { data: stalledEngagedOpportunities, error: stalledEngagedOpportunitiesError },
    { data: stalledEngagedOrganizations, error: stalledEngagedOrganizationsError },
  ] = await Promise.all([
    commitmentOrganizationIds.length > 0
      ? serviceClient
          .from('organizations')
          .select('id, name')
          .in('id', commitmentOrganizationIds)
      : Promise.resolve({ data: [], error: null }),
    commitmentOutcomeIds.length > 0
      ? serviceClient
          .from('community_outcome_definitions')
          .select('id, name')
          .in('id', commitmentOutcomeIds)
      : Promise.resolve({ data: [], error: null }),
    (stalledEngagedRows || []).length > 0
      ? serviceClient
          .from('alma_funding_opportunities')
          .select('id, name, funder_name, source_type, deadline, status, max_grant_amount')
          .in(
            'id',
            uniqueStrings(
              (stalledEngagedRows as Array<Record<string, any>>).map((row) => row.opportunity_id)
            )
          )
      : Promise.resolve({ data: [], error: null }),
    (stalledEngagedRows || []).length > 0
      ? serviceClient
          .from('organizations')
          .select('id, name, slug, city, state')
          .in(
            'id',
            uniqueStrings(
              (stalledEngagedRows as Array<Record<string, any>>).map((row) => row.organization_id)
            )
          )
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (staleCommitmentOrganizationsError) {
    throw new Error(
      staleCommitmentOrganizationsError.message ||
        'Failed to load organizations for commitments without updates alerts'
    );
  }

  if (staleOutcomeDefinitionsError) {
    throw new Error(
      staleOutcomeDefinitionsError.message ||
        'Failed to load outcomes for commitments without updates alerts'
    );
  }

  if (stalledEngagedOpportunitiesError) {
    throw new Error(
      stalledEngagedOpportunitiesError.message ||
        'Failed to load opportunities for stalled engaged match alerts'
    );
  }

  if (stalledEngagedOrganizationsError) {
    throw new Error(
      stalledEngagedOrganizationsError.message ||
        'Failed to load organizations for stalled engaged match alerts'
    );
  }

  const staleCommitmentOrganizationMap = new Map<string, Record<string, any>>();
  for (const organization of (staleCommitmentOrganizations || []) as Array<Record<string, any>>) {
    staleCommitmentOrganizationMap.set(String(organization.id), organization);
  }

  const staleOutcomeDefinitionMap = new Map<string, Record<string, any>>();
  for (const outcome of (staleOutcomeDefinitions || []) as Array<Record<string, any>>) {
    staleOutcomeDefinitionMap.set(String(outcome.id), outcome);
  }

  const stalledOpportunityMap = new Map<string, Record<string, any>>();
  for (const opportunity of (stalledEngagedOpportunities || []) as Array<Record<string, any>>) {
    stalledOpportunityMap.set(String(opportunity.id), opportunity);
  }

  const stalledOrganizationMap = new Map<string, Record<string, any>>();
  for (const organization of (stalledEngagedOrganizations || []) as Array<Record<string, any>>) {
    stalledOrganizationMap.set(String(organization.id), organization);
  }

  const stalledEngagedMatches = ((stalledEngagedRows || []) as Array<Record<string, any>>).map((row) => ({
    ...row,
    opportunity: stalledOpportunityMap.get(String(row.opportunity_id)) || null,
    organization: stalledOrganizationMap.get(String(row.organization_id)) || null,
  }));

  const commitmentsWithoutUpdates = staleCommitmentItems.map((row) => ({
    id: String(row.id),
    funding_award_id: String(row.funding_award_id),
    organization_id: String(row.organization_id),
    outcome_definition_id: String(row.outcome_definition_id),
    commitment_status: String(row.commitment_status || 'draft'),
    updated_at: row.updated_at || null,
    organization_name:
      staleCommitmentOrganizationMap.get(String(row.organization_id))?.name || String(row.organization_id),
    outcome_name:
      staleOutcomeDefinitionMap.get(String(row.outcome_definition_id))?.name ||
      String(row.outcome_definition_id),
  }));

  return {
    summary: {
      total:
        (typeof overdueCount === 'number' ? overdueCount : (overdueRows || []).length) +
        (typeof spendCount === 'number' ? spendCount : (spendRows || []).length) +
        (typeof candidateCount === 'number' ? candidateCount : strongMatchesNotEngaged.length) +
        (typeof awardWithoutCommitmentCount === 'number'
          ? awardWithoutCommitmentCount
          : (awardWithoutCommitmentRows || []).length) +
        staleCommitments.length +
        (typeof stalledEngagedCount === 'number'
          ? stalledEngagedCount
          : stalledEngagedMatches.length),
      overdueCommunityReports:
        typeof overdueCount === 'number' ? overdueCount : (overdueRows || []).length,
      spendWithoutValidation:
        typeof spendCount === 'number' ? spendCount : (spendRows || []).length,
      strongMatchesNotEngaged:
        typeof candidateCount === 'number' ? candidateCount : strongMatchesNotEngaged.length,
      awardsWithoutCommitments:
        typeof awardWithoutCommitmentCount === 'number'
          ? awardWithoutCommitmentCount
          : (awardWithoutCommitmentRows || []).length,
      commitmentsWithoutUpdates: staleCommitments.length,
      engagedMatchesStalled:
        typeof stalledEngagedCount === 'number' ? stalledEngagedCount : stalledEngagedMatches.length,
    },
    overdueCommunityReports: {
      count: typeof overdueCount === 'number' ? overdueCount : (overdueRows || []).length,
      items: overdueRows || [],
    },
    spendWithoutValidation: {
      count: typeof spendCount === 'number' ? spendCount : (spendRows || []).length,
      items: spendRows || [],
    },
    strongMatchesNotEngaged: {
      count: typeof candidateCount === 'number' ? candidateCount : strongMatchesNotEngaged.length,
      items: strongMatchesNotEngaged,
    },
    awardsWithoutCommitments: {
      count:
        typeof awardWithoutCommitmentCount === 'number'
          ? awardWithoutCommitmentCount
          : (awardWithoutCommitmentRows || []).length,
      items: awardWithoutCommitmentRows || [],
    },
    commitmentsWithoutUpdates: {
      count: staleCommitments.length,
      items: commitmentsWithoutUpdates,
    },
    engagedMatchesStalled: {
      count: typeof stalledEngagedCount === 'number' ? stalledEngagedCount : stalledEngagedMatches.length,
      items: stalledEngagedMatches,
    },
  };
}

function determineFundingOperatingRoutingClass(summary: Record<string, any>) {
  const pipelineCount =
    Number(summary.strongMatchesNotEngaged || 0) + Number(summary.engagedMatchesStalled || 0);
  const reportingCount =
    Number(summary.overdueCommunityReports || 0) +
    Number(summary.awardsWithoutCommitments || 0) +
    Number(summary.commitmentsWithoutUpdates || 0);
  const financeCount = Number(summary.spendWithoutValidation || 0);

  if (reportingCount >= pipelineCount && reportingCount >= financeCount && reportingCount > 0) {
    return 'reporting' as const;
  }

  if (pipelineCount >= financeCount && pipelineCount > 0) {
    return 'pipeline' as const;
  }

  if (financeCount > 0) {
    return 'finance' as const;
  }

  return 'general' as const;
}

function selectFundingOperatingAutoAssignee(
  agents: Array<Record<string, any>>,
  routingClass: FundingOperatingRouteClass,
  organizationId: string | null
) {
  if (!agents.length) {
    return {
      assignedAgentId: null,
      routingRule: `no-enabled-agents:${routingClass}`,
    };
  }
  const best = pickFundingOperatingAutoAssignee(
    agents.map((agent) => ({
      id: String(agent.id),
      name: typeof agent.name === 'string' ? agent.name : null,
      domain: typeof agent.domain === 'string' ? agent.domain : null,
      currentTaskId:
        typeof agent.current_task_id === 'string' ? agent.current_task_id : null,
    })),
    routingClass,
    {
      preferOrganizationContext: Boolean(organizationId),
      minimumScore: 4,
    }
  );

  if (!best) {
    return {
      assignedAgentId: null,
      routingRule: `no-route-match:${routingClass}`,
    };
  }

  return {
    assignedAgentId: best.agentId,
    routingRule: `route:${routingClass}`,
  };
}

export async function queueFundingOperatingAlertNotifications(
  requestedBy: string | null,
  options?: {
    alerts?: Awaited<ReturnType<typeof listFundingOperatingAlerts>>;
    limit?: number;
    strongMatchThreshold?: number;
    stalledEngagedAfterHours?: number;
    force?: boolean;
    minIntervalMinutes?: number;
  }
) {
  const serviceClient = getServiceClient();
  const minIntervalMinutes = Math.max(
    5,
    Math.min(24 * 60, Number(options?.minIntervalMinutes ?? 60) || 60)
  );
  const alerts =
    options?.alerts ||
    (await listFundingOperatingAlerts({
      limit: options?.limit,
      strongMatchThreshold: options?.strongMatchThreshold,
      stalledEngagedAfterHours: options?.stalledEngagedAfterHours,
    }));

  if (!alerts.summary.total) {
    return {
      notificationsQueued: 0,
      alertsSummary: alerts.summary,
      skippedDuplicate: false,
    };
  }

  const digestSignature = JSON.stringify({
    summary: alerts.summary,
    overdueIds: alerts.overdueCommunityReports.items.map((item: any) => item.funding_award_id),
    spendIds: alerts.spendWithoutValidation.items.map((item: any) => item.funding_award_id),
    strongIds: alerts.strongMatchesNotEngaged.items.map((item: any) => item.id),
    awardIds: alerts.awardsWithoutCommitments.items.map((item: any) => item.funding_award_id),
    commitmentIds: alerts.commitmentsWithoutUpdates.items.map((item: any) => item.id),
    stalledIds: alerts.engagedMatchesStalled.items.map((item: any) => item.id),
  });

  if (!options?.force) {
    const cutoff = new Date(Date.now() - minIntervalMinutes * 60 * 1000).toISOString();
    const { data: recentDigests, error: recentDigestsError } = await serviceClient
      .from('agent_task_queue')
      .select('id, created_at, output, review_decision')
      .eq('source', 'funding_os_alerts')
      .eq('task_type', 'funding_notification')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentDigestsError) {
      throw new Error(recentDigestsError.message || 'Failed to inspect recent Funding OS alert digests');
    }

    const hasDuplicate = (recentDigests || []).some((row: any) => {
      if (row.review_decision === 'resolved') {
        return false;
      }

      const output =
        row.output && typeof row.output === 'object'
          ? (row.output as Record<string, any>)
          : {};
      const notification =
        output.notification && typeof output.notification === 'object'
          ? (output.notification as Record<string, any>)
          : {};
      if (notification.organization_id) {
        return false;
      }
      const data =
        notification.data && typeof notification.data === 'object'
          ? (notification.data as Record<string, any>)
          : {};
      return data.signature === digestSignature;
    });

    if (hasDuplicate) {
      return {
        notificationsQueued: 0,
        alertsSummary: alerts.summary,
        skippedDuplicate: true,
      };
    }
  }

  const accountabilityAlertItems = [
    ...alerts.overdueCommunityReports.items,
    ...alerts.spendWithoutValidation.items,
    ...alerts.awardsWithoutCommitments.items,
  ] as Array<Record<string, any>>;
  const accountabilityAwardIds = uniqueStrings(
    accountabilityAlertItems.map((item) => item.funding_award_id)
  );
  const awardOrganizationMap = new Map<string, string>();

  if (accountabilityAwardIds.length > 0) {
    const { data: awards, error: awardsError } = await serviceClient
      .from('funding_awards')
      .select('id, organization_id')
      .in('id', accountabilityAwardIds);

    if (awardsError) {
      throw new Error(awardsError.message || 'Failed to load award ownership for Funding OS alert notifications');
    }

    for (const award of (awards || []) as Array<Record<string, any>>) {
      awardOrganizationMap.set(String(award.id), String(award.organization_id));
    }
  }

  const notificationsByOrganization = new Map<
    string,
    {
      organizationName: string;
      summary: {
        overdueCommunityReports: number;
        spendWithoutValidation: number;
        strongMatchesNotEngaged: number;
        awardsWithoutCommitments: number;
        commitmentsWithoutUpdates: number;
        engagedMatchesStalled: number;
      };
    }
  >();

  const ensureOrganizationDigest = (organizationId: string, organizationName: string) => {
    if (!notificationsByOrganization.has(organizationId)) {
      notificationsByOrganization.set(organizationId, {
        organizationName,
        summary: {
          overdueCommunityReports: 0,
          spendWithoutValidation: 0,
          strongMatchesNotEngaged: 0,
          awardsWithoutCommitments: 0,
          commitmentsWithoutUpdates: 0,
          engagedMatchesStalled: 0,
        },
      });
    }

    return notificationsByOrganization.get(organizationId)!;
  };

  const calculateDigestSeverity = (summary: {
    overdueCommunityReports: number;
    spendWithoutValidation: number;
    strongMatchesNotEngaged: number;
    awardsWithoutCommitments: number;
    commitmentsWithoutUpdates: number;
    engagedMatchesStalled: number;
  }) => {
    const score = Math.min(
      100,
      Math.max(
        0,
        summary.overdueCommunityReports * 14 +
          summary.spendWithoutValidation * 12 +
          summary.engagedMatchesStalled * 10 +
          summary.awardsWithoutCommitments * 8 +
          summary.commitmentsWithoutUpdates * 6 +
          summary.strongMatchesNotEngaged * 4
      )
    );
    const level = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';
    const priority = score >= 70 ? 1 : score >= 40 ? 2 : score >= 20 ? 3 : 4;

    return { score, level, priority };
  };

  for (const item of alerts.overdueCommunityReports.items as Array<Record<string, any>>) {
    const organizationId = awardOrganizationMap.get(String(item.funding_award_id));
    if (!organizationId) continue;
    const entry = ensureOrganizationDigest(organizationId, String(item.organization_name || organizationId));
    entry.summary.overdueCommunityReports += 1;
  }

  for (const item of alerts.spendWithoutValidation.items as Array<Record<string, any>>) {
    const organizationId = awardOrganizationMap.get(String(item.funding_award_id));
    if (!organizationId) continue;
    const entry = ensureOrganizationDigest(organizationId, String(item.organization_name || organizationId));
    entry.summary.spendWithoutValidation += 1;
  }

  for (const item of alerts.awardsWithoutCommitments.items as Array<Record<string, any>>) {
    const organizationId = awardOrganizationMap.get(String(item.funding_award_id));
    if (!organizationId) continue;
    const entry = ensureOrganizationDigest(organizationId, String(item.organization_name || organizationId));
    entry.summary.awardsWithoutCommitments += 1;
  }

  for (const item of alerts.commitmentsWithoutUpdates.items as Array<Record<string, any>>) {
    const organizationId = String(item.organization_id || '').trim();
    if (!organizationId) continue;
    const entry = ensureOrganizationDigest(organizationId, String(item.organization_name || organizationId));
    entry.summary.commitmentsWithoutUpdates += 1;
  }

  for (const item of alerts.strongMatchesNotEngaged.items as Array<Record<string, any>>) {
    const organizationId = String(item.organization_id || '').trim();
    if (!organizationId) continue;
    const entry = ensureOrganizationDigest(
      organizationId,
      String(item.organization?.name || item.organization_id || organizationId)
    );
    entry.summary.strongMatchesNotEngaged += 1;
  }

  for (const item of alerts.engagedMatchesStalled.items as Array<Record<string, any>>) {
    const organizationId = String(item.organization_id || '').trim();
    if (!organizationId) continue;
    const entry = ensureOrganizationDigest(
      organizationId,
      String(item.organization?.name || item.organization_id || organizationId)
    );
    entry.summary.engagedMatchesStalled += 1;
  }

  const globalSeverity = calculateDigestSeverity(alerts.summary);
  const notifications: NotificationPayload[] = [
    {
      type: 'ops_alert_digest',
      priority: globalSeverity.priority,
      data: {
        channel: 'funding_os',
        signature: digestSignature,
        generated_at: new Date().toISOString(),
        summary: alerts.summary,
        severityScore: globalSeverity.score,
        severityLevel: globalSeverity.level,
        overdue_community_reports: alerts.overdueCommunityReports.items.slice(0, 3).map((item: any) => ({
          funding_award_id: item.funding_award_id,
          organization_name: item.organization_name,
          funding_program_name: item.funding_program_name,
          due_at: item.community_report_due_at,
        })),
        spend_without_validation: alerts.spendWithoutValidation.items.slice(0, 3).map((item: any) => ({
          funding_award_id: item.funding_award_id,
          organization_name: item.organization_name,
          tracked_public_spend: item.tracked_public_spend || 0,
        })),
        strong_matches_not_engaged: alerts.strongMatchesNotEngaged.items.slice(0, 3).map((item: any) => ({
          recommendation_id: item.id,
          organization_id: item.organization_id,
          organization_name: item.organization?.name || item.organization_id,
          opportunity_id: item.opportunity_id,
          opportunity_name: item.opportunity?.name || item.opportunity_id,
          match_score: item.match_score,
        })),
        awards_without_commitments: alerts.awardsWithoutCommitments.items.slice(0, 3).map((item: any) => ({
          funding_award_id: item.funding_award_id,
          organization_name: item.organization_name,
          funding_program_name: item.funding_program_name,
        })),
        commitments_without_updates: alerts.commitmentsWithoutUpdates.items.slice(0, 3),
        engaged_matches_stalled: alerts.engagedMatchesStalled.items.slice(0, 3).map((item: any) => ({
          recommendation_id: item.id,
          organization_id: item.organization_id,
          organization_name: item.organization?.name || item.organization_id,
          opportunity_id: item.opportunity_id,
          opportunity_name: item.opportunity?.name || item.opportunity_id,
          updated_at: item.updated_at || null,
        })),
      },
    },
  ];

  for (const [organizationId, entry] of notificationsByOrganization.entries()) {
    const total =
      entry.summary.overdueCommunityReports +
      entry.summary.spendWithoutValidation +
      entry.summary.strongMatchesNotEngaged +
      entry.summary.awardsWithoutCommitments +
      entry.summary.commitmentsWithoutUpdates +
      entry.summary.engagedMatchesStalled;

    if (!total) continue;

    const severity = calculateDigestSeverity(entry.summary);

    notifications.push({
      type: 'ops_alert_digest',
      organization_id: organizationId,
      priority: severity.priority,
      data: {
        channel: 'funding_os',
        signature: `${digestSignature}:org:${organizationId}`,
        generated_at: new Date().toISOString(),
        organization_name: entry.organizationName,
        severityScore: severity.score,
        severityLevel: severity.level,
        summary: {
          total,
          ...entry.summary,
        },
      },
    });
  }

  const persisted = await persistFundingNotifications(serviceClient, notifications, {
    source: 'funding_os_alerts',
    requestedBy,
    runId: `funding-os-alerts:${Date.now()}`,
  });

  const criticalFollowUpTasks = notifications
    .map((notification) => {
      const data =
        notification.data && typeof notification.data === 'object'
          ? (notification.data as Record<string, any>)
          : {};
      const severityLevel =
        typeof data.severityLevel === 'string' ? data.severityLevel : 'low';
      const signature =
        typeof data.signature === 'string' ? data.signature : null;

      if (notification.type !== 'ops_alert_digest' || severityLevel !== 'critical' || !signature) {
        return null;
      }

      const organizationId =
        typeof notification.organization_id === 'string' ? notification.organization_id : null;
      const summary =
        data.summary && typeof data.summary === 'object'
          ? (data.summary as Record<string, any>)
          : {};

      return {
        source: 'funding_os_followup',
        source_id: `followup:${signature}`,
        task_type: 'funding_ops_followup',
        title: organizationId
          ? `Funding OS follow-up: critical org digest ${organizationId}`
          : 'Funding OS follow-up: critical global digest',
        description: organizationId
          ? `Critical Funding OS alert digest requires follow-up for organization ${organizationId}.`
          : 'Critical Funding OS alert digest requires follow-up.',
        status: 'queued',
        priority: 1,
        needs_review: true,
        requested_by: requestedBy || null,
        reply_to: {
          digest_signature: signature,
          organization_id: organizationId,
          severity: severityLevel,
          summary,
          created_at: new Date().toISOString(),
        },
      };
    })
    .filter(Boolean) as Array<Record<string, any>>;

  let followUpTasksQueued = 0;
  let followUpTasksAutoAssigned = 0;
  if (criticalFollowUpTasks.length > 0) {
    const sourceIds = criticalFollowUpTasks.map((task) => task.source_id);
    const { data: existingFollowUps, error: existingFollowUpsError } = await serviceClient
      .from('agent_task_queue')
      .select('source_id')
      .eq('source', 'funding_os_followup')
      .in('source_id', sourceIds)
      .in('status', ['queued', 'pending', 'running', 'in_progress']);

    if (existingFollowUpsError) {
      throw new Error(
        existingFollowUpsError.message || 'Failed to inspect Funding OS follow-up tasks'
      );
    }

    const existingSourceIds = new Set(
      (existingFollowUps || []).map((row: any) => String(row.source_id))
    );
    const tasksToInsert = criticalFollowUpTasks.filter(
      (task) => !existingSourceIds.has(String(task.source_id))
    );

    if (tasksToInsert.length > 0) {
      const { data: enabledAgents, error: enabledAgentsError } = await serviceClient
        .from('agents')
        .select('id, name, domain, current_task_id')
        .eq('enabled', true);

      if (enabledAgentsError) {
        throw new Error(
          enabledAgentsError.message || 'Failed to load enabled agents for Funding OS follow-up routing'
        );
      }

      const routedTasks = tasksToInsert.map((task) => {
        const replyTo =
          task.reply_to && typeof task.reply_to === 'object'
            ? (task.reply_to as Record<string, any>)
            : {};
        const summary =
          replyTo.summary && typeof replyTo.summary === 'object'
            ? (replyTo.summary as Record<string, any>)
            : {};
        const organizationId =
          typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null;
        const routingClass = determineFundingOperatingRoutingClass(summary);
        const routingDecision = selectFundingOperatingAutoAssignee(
          (enabledAgents || []) as Array<Record<string, any>>,
          routingClass,
          organizationId
        );
        const assignedAgentId = routingDecision.assignedAgentId;

        if (assignedAgentId) {
          followUpTasksAutoAssigned += 1;
        }

        const originAuditEntry = createFundingOperatingTaskAuditEntry(
          'status_changed',
          requestedBy || 'system',
          assignedAgentId
            ? `Queued critical follow-up task and auto-routed to ${assignedAgentId}`
            : 'Queued critical follow-up task for manual triage',
          {
            origin: 'alert_digest',
            routingClass,
            routingRule: routingDecision.routingRule,
            autoAssigned: !!assignedAgentId,
            organizationId,
          }
        );

        return {
          ...task,
          assigned_agent: assignedAgentId,
          human_edits: [originAuditEntry],
          reply_to: {
            ...replyTo,
            routing_class: routingClass,
            routing_rule: routingDecision.routingRule,
            auto_assigned: !!assignedAgentId,
          },
        };
      });

      const { error: insertFollowUpError } = await (serviceClient
        .from('agent_task_queue') as any)
        .insert(routedTasks as any[]);

      if (insertFollowUpError) {
        throw new Error(
          insertFollowUpError.message || 'Failed to queue Funding OS follow-up tasks'
        );
      }

      followUpTasksQueued = tasksToInsert.length;
    }
  }

  return {
    notificationsQueued: persisted.stored,
    followUpTasksQueued,
    followUpTasksAutoAssigned,
    alertsSummary: alerts.summary,
    skippedDuplicate: false,
  };
}

export async function listFundingOperatingAlertDigests(filters?: {
  limit?: number;
  scope?: 'all' | 'global' | 'organization';
  severity?: 'all' | 'critical' | 'high' | 'medium' | 'low';
  reviewStatus?: 'all' | 'pending' | 'acknowledged' | 'resolved';
  recentDays?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(50, filters?.limit ?? 10));
  const hydratedLimit =
    filters?.scope && filters.scope !== 'all'
      ? Math.min(100, Math.max(limit * 5, 25))
      : filters?.severity && filters.severity !== 'all'
        ? Math.min(100, Math.max(limit * 5, 25))
        : limit;

  let query = serviceClient
    .from('agent_task_queue')
    .select(
      'id, source_id, status, title, description, created_at, output, reply_to, review_decision, review_feedback, reviewed_at'
    )
    .eq('source', 'funding_os_alerts')
    .eq('task_type', 'funding_notification')
    .order('created_at', { ascending: false })
    .limit(hydratedLimit);

  if (filters?.recentDays && Number.isFinite(filters.recentDays)) {
    const cutoff = new Date(
      Date.now() - Math.max(1, Math.min(365, filters.recentDays)) * 24 * 60 * 60 * 1000
    ).toISOString();
    query = query.gte('created_at', cutoff);
  }

  if (filters?.reviewStatus === 'pending') {
    query = query.is('review_decision', null);
  } else if (filters?.reviewStatus === 'acknowledged') {
    query = query.eq('review_decision', 'acknowledged');
  } else if (filters?.reviewStatus === 'resolved') {
    query = query.eq('review_decision', 'resolved');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'Failed to load Funding OS alert digests');
  }

  const rows = (data || []).map((row: any) => {
    const output = row.output && typeof row.output === 'object'
      ? (row.output as Record<string, any>)
      : {};
    const notification = output.notification && typeof output.notification === 'object'
      ? (output.notification as Record<string, any>)
      : {};
    const digestData = notification.data && typeof notification.data === 'object'
      ? (notification.data as Record<string, any>)
      : {};
    const replyTo = row.reply_to && typeof row.reply_to === 'object'
      ? (row.reply_to as Record<string, any>)
      : {};
    const summary = digestData.summary && typeof digestData.summary === 'object'
      ? (digestData.summary as Record<string, any>)
      : {};

    return {
      id: String(row.id),
      sourceId: typeof row.source_id === 'string' ? row.source_id : null,
      status: typeof row.status === 'string' ? row.status : 'completed',
      title: typeof row.title === 'string' ? row.title : 'Funding alert digest',
      description: typeof row.description === 'string' ? row.description : '',
      createdAt: row.created_at || null,
      reviewDecision:
        typeof row.review_decision === 'string' ? row.review_decision : null,
      reviewFeedback:
        typeof row.review_feedback === 'string' ? row.review_feedback : null,
      reviewedAt: row.reviewed_at || null,
      notificationsType: typeof notification.type === 'string' ? notification.type : null,
      generatedAt: output.generated_at || null,
      targetOrganizationId:
        typeof notification.organization_id === 'string'
          ? notification.organization_id
          : typeof replyTo.organization_id === 'string'
            ? replyTo.organization_id
            : null,
      targetOrganizationName:
        typeof digestData.organization_name === 'string' ? digestData.organization_name : null,
      severityScore: Number(digestData.severityScore || 0),
      severityLevel:
        typeof digestData.severityLevel === 'string' ? digestData.severityLevel : 'low',
      summary: {
        total: Number(summary.total || 0),
        overdueCommunityReports: Number(summary.overdueCommunityReports || 0),
        spendWithoutValidation: Number(summary.spendWithoutValidation || 0),
        strongMatchesNotEngaged: Number(summary.strongMatchesNotEngaged || 0),
        awardsWithoutCommitments: Number(summary.awardsWithoutCommitments || 0),
        commitmentsWithoutUpdates: Number(summary.commitmentsWithoutUpdates || 0),
        engagedMatchesStalled: Number(summary.engagedMatchesStalled || 0),
      },
    };
  });

  return rows.filter((row: any) => {
    if (filters?.scope === 'global' && row.targetOrganizationId) {
      return false;
    }

    if (filters?.scope === 'organization' && !row.targetOrganizationId) {
      return false;
    }

    if (filters?.severity && filters.severity !== 'all' && row.severityLevel !== filters.severity) {
      return false;
    }

    return true;
  }).slice(0, limit);
}

export async function reviewFundingOperatingAlertDigest(
  digestId: string,
  decision: 'acknowledged' | 'resolved',
  adminUserId: string,
  feedback?: string | null
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(digestId || '').trim();
  const normalizedDecision = String(decision || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: digestId is required');
  }

  if (!['acknowledged', 'resolved'].includes(normalizedDecision)) {
    throw new Error('Validation: decision must be acknowledged or resolved');
  }

  const updatePayload = {
    needs_review: false,
    review_decision: normalizedDecision,
    review_feedback: feedback ? String(feedback).trim() || null : null,
    reviewed_at: new Date().toISOString(),
    requested_by: adminUserId,
  };

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_os_alerts')
    .eq('task_type', 'funding_notification')
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to update Funding OS alert digest');
  }

  if (!data) {
    throw new Error('Validation: Funding OS alert digest not found');
  }

  return {
    digestId: normalizedId,
    decision: normalizedDecision,
  };
}

function normalizeFundingOperatingTaskAuditTrail(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [] as Array<Record<string, any>>;
  }

  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => entry as Record<string, any>);
}

function appendFundingOperatingTaskAuditEntry(
  raw: unknown,
  entry: Record<string, any>
) {
  const current = normalizeFundingOperatingTaskAuditTrail(raw);
  return [...current, entry].slice(-20);
}

function createFundingOperatingTaskAuditEntry(
  action: 'assigned' | 'status_changed' | 'reviewed',
  actorId: string,
  summary: string,
  details?: Record<string, unknown>
) {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    actorId,
    at: new Date().toISOString(),
    summary,
    details: details || {},
  };
}

export async function listFundingOperatingFollowUpTasks(filters?: {
  limit?: number;
  status?: 'all' | 'queued' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed';
  reviewStatus?: 'all' | 'pending' | 'acknowledged' | 'resolved';
  severity?: 'all' | 'critical' | 'high' | 'medium' | 'low';
  assignment?: 'all' | 'assigned' | 'unassigned';
  assignedAgentId?: string;
  routingClass?: 'all' | 'pipeline' | 'reporting' | 'finance' | 'general';
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 25));

  let query = serviceClient
    .from('agent_task_queue')
    .select(
      'id, source_id, status, title, description, priority, created_at, started_at, completed_at, assigned_agent, reply_to, review_decision, review_feedback, reviewed_at, needs_review, human_edits'
    )
    .eq('source', 'funding_os_followup')
    .eq('task_type', 'funding_ops_followup')
    .order('priority', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.reviewStatus === 'pending') {
    query = query.is('review_decision', null);
  } else if (filters?.reviewStatus === 'acknowledged') {
    query = query.eq('review_decision', 'acknowledged');
  } else if (filters?.reviewStatus === 'resolved') {
    query = query.eq('review_decision', 'resolved');
  }

  if (filters?.assignment === 'assigned') {
    query = query.not('assigned_agent', 'is', null);
  } else if (filters?.assignment === 'unassigned') {
    query = query.is('assigned_agent', null);
  }

  if (filters?.assignedAgentId) {
    query = query.eq('assigned_agent', filters.assignedAgentId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load Funding OS follow-up tasks');
  }

  return ((data || []) as Array<Record<string, any>>)
    .map((row) => {
      const replyTo =
        row.reply_to && typeof row.reply_to === 'object'
          ? (row.reply_to as Record<string, any>)
          : {};
      const summary =
        replyTo.summary && typeof replyTo.summary === 'object'
          ? (replyTo.summary as Record<string, any>)
          : {};
      const auditTrail = normalizeFundingOperatingTaskAuditTrail(row.human_edits);
      const lastAudit = auditTrail.length > 0 ? auditTrail[auditTrail.length - 1] : null;
      const recentAudit = auditTrail
        .slice(-3)
        .reverse()
        .map((entry) => ({
          action: typeof entry.action === 'string' ? entry.action : 'updated',
          actorId: typeof entry.actorId === 'string' ? entry.actorId : null,
          at: typeof entry.at === 'string' ? entry.at : null,
          summary:
            typeof entry.summary === 'string' ? entry.summary : 'Task updated',
        }));

      return {
        id: String(row.id),
        sourceId: typeof row.source_id === 'string' ? row.source_id : null,
        status: typeof row.status === 'string' ? row.status : 'queued',
        title: typeof row.title === 'string' ? row.title : 'Funding OS follow-up',
        description: typeof row.description === 'string' ? row.description : '',
        priority:
          typeof row.priority === 'number' && Number.isFinite(row.priority) ? row.priority : 3,
        createdAt: row.created_at || null,
        startedAt: row.started_at || null,
        completedAt: row.completed_at || null,
        assignedAgentId:
          typeof row.assigned_agent === 'string' ? row.assigned_agent : null,
        reviewDecision:
          typeof row.review_decision === 'string' ? row.review_decision : null,
        reviewFeedback:
          typeof row.review_feedback === 'string' ? row.review_feedback : null,
        reviewedAt: row.reviewed_at || null,
        needsReview: row.needs_review === true,
        digestSignature:
          typeof replyTo.digest_signature === 'string' ? replyTo.digest_signature : null,
        targetOrganizationId:
          typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null,
        routingClass:
          typeof replyTo.routing_class === 'string' ? replyTo.routing_class : 'general',
        routingRule:
          typeof replyTo.routing_rule === 'string' ? replyTo.routing_rule : null,
        autoAssigned: replyTo.auto_assigned === true,
        auditEntryCount: auditTrail.length,
        lastAudit: lastAudit
          ? {
              action:
                typeof lastAudit.action === 'string' ? lastAudit.action : 'updated',
              actorId:
                typeof lastAudit.actorId === 'string' ? lastAudit.actorId : null,
              at: typeof lastAudit.at === 'string' ? lastAudit.at : null,
              summary:
                typeof lastAudit.summary === 'string'
                  ? lastAudit.summary
                  : 'Task updated',
            }
          : null,
        recentAudit,
        severity:
          typeof replyTo.severity === 'string' ? replyTo.severity : 'critical',
        summary: {
          overdueCommunityReports: Number(summary.overdueCommunityReports || 0),
          spendWithoutValidation: Number(summary.spendWithoutValidation || 0),
          strongMatchesNotEngaged: Number(summary.strongMatchesNotEngaged || 0),
          awardsWithoutCommitments: Number(summary.awardsWithoutCommitments || 0),
          commitmentsWithoutUpdates: Number(summary.commitmentsWithoutUpdates || 0),
          engagedMatchesStalled: Number(summary.engagedMatchesStalled || 0),
        },
      };
    })
    .filter((row) => {
      if (filters?.severity && filters.severity !== 'all' && row.severity !== filters.severity) {
        return false;
      }
      if (
        filters?.routingClass &&
        filters.routingClass !== 'all' &&
        row.routingClass !== filters.routingClass
      ) {
        return false;
      }
      return true;
    })
    .slice(0, limit);
}

export async function listAssignableFundingOperatingAgents() {
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from('agents')
    .select('id, name, domain, enabled, last_heartbeat, current_task_id')
    .eq('enabled', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to load assignable agents');
  }

  return ((data || []) as Array<Record<string, any>>)
    .filter((row) => typeof row.id === 'string')
    .map((row) => ({
      id: String(row.id),
      name: typeof row.name === 'string' ? row.name : String(row.id),
      domain: typeof row.domain === 'string' ? row.domain : null,
      enabled: row.enabled !== false,
      lastHeartbeat: row.last_heartbeat || null,
      currentTaskId:
        typeof row.current_task_id === 'string' ? row.current_task_id : null,
    }));
}

export async function assignFundingOperatingFollowUpTask(
  taskId: string,
  adminUserId: string,
  agentId?: string | null
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedAgentId = agentId ? String(agentId).trim() : null;

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (normalizedAgentId) {
    const { data: agent, error: agentError } = await serviceClient
      .from('agents')
      .select('id, enabled')
      .eq('id', normalizedAgentId)
      .maybeSingle();

    if (agentError) {
      throw new Error(agentError.message || 'Failed to validate assigned agent');
    }

    if (!agent) {
      throw new Error('Validation: assigned agent not found');
    }

    if (agent.enabled === false) {
      throw new Error('Validation: assigned agent is disabled');
    }
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, assigned_agent, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_os_followup')
    .eq('task_type', 'funding_ops_followup')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load Funding OS follow-up task');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding OS follow-up task not found');
  }

  const previousAssignedAgentId =
    typeof currentTask.assigned_agent === 'string' ? currentTask.assigned_agent : null;
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'assigned',
    adminUserId,
    normalizedAgentId
      ? `Assigned task to ${normalizedAgentId}`
      : 'Removed task assignment',
    {
      fromAssignedAgentId: previousAssignedAgentId,
      toAssignedAgentId: normalizedAgentId,
    }
  );

  const updatePayload: Record<string, unknown> = {
    assigned_agent: normalizedAgentId,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_os_followup')
    .eq('task_type', 'funding_ops_followup')
    .select('id, assigned_agent')
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to assign Funding OS follow-up task');
  }

  if (!data) {
    throw new Error('Validation: Funding OS follow-up task not found');
  }

  return {
    taskId: normalizedId,
    assignedAgentId:
      typeof data.assigned_agent === 'string' ? data.assigned_agent : null,
  };
}

export async function updateFundingOperatingFollowUpTaskStatus(
  taskId: string,
  status: 'queued' | 'running' | 'completed',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['queued', 'running', 'completed'].includes(normalizedStatus)) {
    throw new Error('Validation: status must be queued, running, or completed');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_os_followup')
    .eq('task_type', 'funding_ops_followup')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load Funding OS follow-up task');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding OS follow-up task not found');
  }

  const previousStatus = typeof currentTask.status === 'string' ? currentTask.status : null;
  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    `Changed status to ${normalizedStatus}`,
    {
      fromStatus: previousStatus,
      toStatus: normalizedStatus,
    }
  );
  const updatePayload: Record<string, unknown> = {
    status: normalizedStatus,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  if (normalizedStatus === 'queued') {
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'running') {
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'completed') {
    updatePayload.started_at = now;
    updatePayload.completed_at = now;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_os_followup')
    .eq('task_type', 'funding_ops_followup')
    .select('id, status, started_at, completed_at')
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to update Funding OS follow-up task status');
  }

  if (!data) {
    throw new Error('Validation: Funding OS follow-up task not found');
  }

  return {
    taskId: normalizedId,
    status: typeof data.status === 'string' ? data.status : normalizedStatus,
    startedAt: data.started_at || null,
    completedAt: data.completed_at || null,
  };
}

export async function reviewFundingOperatingFollowUpTask(
  taskId: string,
  decision: 'acknowledged' | 'resolved',
  adminUserId: string,
  feedback?: string | null
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedDecision = String(decision || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['acknowledged', 'resolved'].includes(normalizedDecision)) {
    throw new Error('Validation: decision must be acknowledged or resolved');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_os_followup')
    .eq('task_type', 'funding_ops_followup')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load Funding OS follow-up task');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding OS follow-up task not found');
  }

  const updatePayload: Record<string, unknown> = {
    needs_review: false,
    review_decision: normalizedDecision,
    review_feedback: feedback ? String(feedback).trim() || null : null,
    reviewed_at: new Date().toISOString(),
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(
      currentTask.human_edits,
      createFundingOperatingTaskAuditEntry(
        'reviewed',
        adminUserId,
        normalizedDecision === 'resolved' ? 'Resolved follow-up task' : 'Acknowledged follow-up task',
        {
          decision: normalizedDecision,
          feedback: feedback ? String(feedback).trim() || null : null,
        }
      )
    ),
  };

  if (normalizedDecision === 'resolved') {
    updatePayload.status = 'completed';
    updatePayload.completed_at = new Date().toISOString();
  }

  const { data: task, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_os_followup')
    .eq('task_type', 'funding_ops_followup')
    .select('id, reply_to')
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to update Funding OS follow-up task');
  }

  if (!task) {
    throw new Error('Validation: Funding OS follow-up task not found');
  }

  if (normalizedDecision === 'resolved') {
    const replyTo =
      task.reply_to && typeof task.reply_to === 'object'
        ? (task.reply_to as Record<string, any>)
        : {};
    const digestSignature =
      typeof replyTo.digest_signature === 'string' ? replyTo.digest_signature : null;

    if (digestSignature) {
      const { data: digests } = await serviceClient
        .from('agent_task_queue')
        .select('id, output')
        .eq('source', 'funding_os_alerts')
        .eq('task_type', 'funding_notification')
        .order('created_at', { ascending: false })
        .limit(25);

      const matchingDigestIds = (digests || [])
        .filter((row: any) => {
          const output =
            row.output && typeof row.output === 'object'
              ? (row.output as Record<string, any>)
              : {};
          const notification =
            output.notification && typeof output.notification === 'object'
              ? (output.notification as Record<string, any>)
              : {};
          const data =
            notification.data && typeof notification.data === 'object'
              ? (notification.data as Record<string, any>)
              : {};
          return data.signature === digestSignature;
        })
        .map((row: any) => row.id);

      if (matchingDigestIds.length > 0) {
        await serviceClient
          .from('agent_task_queue')
          .update({
            needs_review: false,
            review_decision: 'resolved',
            review_feedback: feedback ? String(feedback).trim() || null : null,
            reviewed_at: new Date().toISOString(),
            requested_by: adminUserId,
          })
          .in('id', matchingDigestIds);
      }
    }
  }

  return {
    taskId: normalizedId,
    decision: normalizedDecision,
  };
}

export async function listFundingCommunityAccountability(filters: {
  awardStatus?: string;
  organizationQuery?: string;
  overdueOnly?: boolean;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters.limit ?? 50));

  let query = serviceClient
    .from('v_funding_award_community_accountability')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (filters.awardStatus) {
    query = query.eq('award_status', filters.awardStatus);
  }

  if (filters.organizationQuery) {
    query = query.ilike('organization_name', `%${filters.organizationQuery}%`);
  }

  if (filters.overdueOnly) {
    query = query.lt('community_report_due_at', new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load community accountability');
  }

  return data || [];
}

export async function listFundingOutcomeCommitments(filters: {
  status?: string;
  organizationId?: string;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters.limit ?? 50));

  let query = serviceClient
    .from('funding_outcome_commitments')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (filters.status) {
    query = query.eq('commitment_status', filters.status);
  }

  if (filters.organizationId) {
    query = query.eq('organization_id', filters.organizationId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load outcome commitments');
  }

  const rows = (data || []) as Array<Record<string, any>>;
  if (rows.length === 0) {
    return [];
  }

  const organizationIds = uniqueStrings(rows.map((row) => row.organization_id));
  const awardIds = uniqueStrings(rows.map((row) => row.funding_award_id));
  const outcomeDefinitionIds = uniqueStrings(rows.map((row) => row.outcome_definition_id));
  const commitmentIds = uniqueStrings(rows.map((row) => row.id));

  const [
    { data: organizations, error: organizationError },
    { data: awards, error: awardError },
    { data: outcomeDefinitions, error: outcomeDefinitionError },
    { data: updates, error: updateError },
  ] = await Promise.all([
    serviceClient
      .from('organizations')
      .select('id, name, slug, city, state')
      .in('id', organizationIds),
    serviceClient
      .from('funding_awards')
      .select('id, award_status, amount_awarded, amount_disbursed, funding_program_id, community_report_due_at, updated_at')
      .in('id', awardIds),
    serviceClient
      .from('community_outcome_definitions')
      .select('id, name, outcome_domain, unit, description')
      .in('id', outcomeDefinitionIds),
    serviceClient
      .from('funding_outcome_updates')
      .select('id, commitment_id, update_type, reported_value, reported_at, confidence_score, narrative, created_at, updated_at')
      .in('commitment_id', commitmentIds)
      .order('reported_at', { ascending: false }),
  ]);

  if (organizationError) {
    throw new Error(organizationError.message || 'Failed to load organizations for commitments');
  }

  if (awardError) {
    throw new Error(awardError.message || 'Failed to load awards for commitments');
  }

  if (outcomeDefinitionError) {
    throw new Error(outcomeDefinitionError.message || 'Failed to load outcome definitions');
  }

  if (updateError) {
    throw new Error(updateError.message || 'Failed to load outcome updates');
  }

  const organizationMap = new Map<string, Record<string, any>>();
  for (const organization of (organizations || []) as Array<Record<string, any>>) {
    organizationMap.set(String(organization.id), organization);
  }

  const awardMap = new Map<string, Record<string, any>>();
  for (const award of (awards || []) as Array<Record<string, any>>) {
    awardMap.set(String(award.id), award);
  }

  const outcomeDefinitionMap = new Map<string, Record<string, any>>();
  for (const definition of (outcomeDefinitions || []) as Array<Record<string, any>>) {
    outcomeDefinitionMap.set(String(definition.id), definition);
  }

  const updateRows = (updates || []) as Array<Record<string, any>>;
  const updateIds = uniqueStrings(updateRows.map((update) => update.id));
  let validationRows: Array<Record<string, any>> = [];

  if (updateIds.length > 0) {
    const { data: validations, error: validationError } = await serviceClient
      .from('community_outcome_validations')
      .select('id, update_id, validation_status, trust_rating, impact_rating, validated_at')
      .in('update_id', updateIds);

    if (validationError) {
      throw new Error(validationError.message || 'Failed to load outcome validations');
    }

    validationRows = (validations || []) as Array<Record<string, any>>;
  }

  const latestUpdateMap = new Map<string, Record<string, any>>();
  const validationCountByUpdateId = new Map<string, number>();

  for (const validation of validationRows) {
    const updateId = String(validation.update_id);
    validationCountByUpdateId.set(updateId, (validationCountByUpdateId.get(updateId) || 0) + 1);
  }

  for (const update of updateRows) {
    const commitmentId = String(update.commitment_id);
    if (!latestUpdateMap.has(commitmentId)) {
      latestUpdateMap.set(commitmentId, update);
    }
  }

  return rows.map((row) => {
    const latestUpdate = latestUpdateMap.get(String(row.id)) || null;
    return {
      ...row,
      organization: organizationMap.get(String(row.organization_id)) || null,
      award: awardMap.get(String(row.funding_award_id)) || null,
      outcomeDefinition: outcomeDefinitionMap.get(String(row.outcome_definition_id)) || null,
      latestUpdate,
      latestUpdateValidationCount: latestUpdate
        ? validationCountByUpdateId.get(String(latestUpdate.id)) || 0
        : 0,
    };
  });
}

export async function listFundingPublicEvidenceSubmissions(filters?: {
  kind?: 'update' | 'validation' | 'all';
  review?: 'all' | 'pending' | 'acknowledged';
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const kind = String(filters?.kind || 'all').trim().toLowerCase();
  const review = String(filters?.review || 'all').trim().toLowerCase();
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 50));

  const [updatesResult, validationsResult] = await Promise.all([
    kind === 'validation'
      ? Promise.resolve({ data: [] as Array<Record<string, any>>, error: null })
      : serviceClient
          .from('funding_outcome_updates')
          .select(
            'id, commitment_id, update_type, reported_value, reported_at, confidence_score, narrative, created_at, reported_by_user_id'
          )
          .is('reported_by_user_id', null)
          .order('reported_at', { ascending: false })
          .limit(limit),
    kind === 'update'
      ? Promise.resolve({ data: [] as Array<Record<string, any>>, error: null })
      : serviceClient
          .from('community_outcome_validations')
          .select(
            'id, update_id, validator_kind, validator_name, validation_status, validation_notes, trust_rating, impact_rating, validated_at, created_at, validator_user_id'
          )
          .is('validator_user_id', null)
          .order('validated_at', { ascending: false })
          .limit(limit),
  ]);

  if (updatesResult.error) {
    throw new Error(updatesResult.error.message || 'Failed to load public outcome updates');
  }

  if (validationsResult.error) {
    throw new Error(
      validationsResult.error.message || 'Failed to load public outcome validations'
    );
  }

  const updateRows = (updatesResult.data || []) as Array<Record<string, any>>;
  const validationRows = (validationsResult.data || []) as Array<Record<string, any>>;
  const validationUpdateIds = uniqueStrings(validationRows.map((row) => row.update_id));

  const missingUpdateIds = validationUpdateIds.filter(
    (id) => !updateRows.some((row) => String(row.id) === id)
  );

  let linkedUpdateRows: Array<Record<string, any>> = [];
  if (missingUpdateIds.length > 0) {
    const { data: linkedUpdates, error: linkedUpdateError } = await serviceClient
      .from('funding_outcome_updates')
      .select(
        'id, commitment_id, update_type, reported_value, reported_at, confidence_score, narrative, created_at, reported_by_user_id'
      )
      .in('id', missingUpdateIds);

    if (linkedUpdateError) {
      throw new Error(linkedUpdateError.message || 'Failed to load linked outcome updates');
    }

    linkedUpdateRows = (linkedUpdates || []) as Array<Record<string, any>>;
  }

  const allUpdateRows = [...updateRows, ...linkedUpdateRows];
  const updatesById = new Map<string, Record<string, any>>();
  for (const row of allUpdateRows) {
    updatesById.set(String(row.id), row);
  }

  const commitmentIds = uniqueStrings(
    allUpdateRows.map((row) => row.commitment_id).filter(Boolean)
  );

  let commitmentRows: Array<Record<string, any>> = [];
  if (commitmentIds.length > 0) {
    const { data: commitments, error: commitmentError } = await serviceClient
      .from('funding_outcome_commitments')
      .select(
        'id, funding_award_id, organization_id, outcome_definition_id, commitment_status, updated_at'
      )
      .in('id', commitmentIds);

    if (commitmentError) {
      throw new Error(commitmentError.message || 'Failed to load linked commitments');
    }

    commitmentRows = (commitments || []) as Array<Record<string, any>>;
  }

  const commitmentsById = new Map<string, Record<string, any>>();
  for (const row of commitmentRows) {
    commitmentsById.set(String(row.id), row);
  }

  const awardIds = uniqueStrings(commitmentRows.map((row) => row.funding_award_id));
  const organizationIds = uniqueStrings(commitmentRows.map((row) => row.organization_id));
  const outcomeDefinitionIds = uniqueStrings(
    commitmentRows.map((row) => row.outcome_definition_id)
  );

  const [awardsResult, organizationsResult, definitionsResult] = await Promise.all([
    awardIds.length > 0
      ? serviceClient
          .from('funding_awards')
          .select('id, award_status, funding_program_id')
          .in('id', awardIds)
      : Promise.resolve({ data: [] as Array<Record<string, any>>, error: null }),
    organizationIds.length > 0
      ? serviceClient
          .from('organizations')
          .select('id, name, city, state')
          .in('id', organizationIds)
      : Promise.resolve({ data: [] as Array<Record<string, any>>, error: null }),
    outcomeDefinitionIds.length > 0
      ? serviceClient
          .from('community_outcome_definitions')
          .select('id, name, outcome_domain, unit')
          .in('id', outcomeDefinitionIds)
      : Promise.resolve({ data: [] as Array<Record<string, any>>, error: null }),
  ]);

  if (awardsResult.error) {
    throw new Error(awardsResult.error.message || 'Failed to load linked awards');
  }

  if (organizationsResult.error) {
    throw new Error(organizationsResult.error.message || 'Failed to load linked organizations');
  }

  if (definitionsResult.error) {
    throw new Error(
      definitionsResult.error.message || 'Failed to load linked outcome definitions'
    );
  }

  const awardsById = new Map<string, Record<string, any>>();
  for (const row of (awardsResult.data || []) as Array<Record<string, any>>) {
    awardsById.set(String(row.id), row);
  }

  const organizationsById = new Map<string, Record<string, any>>();
  for (const row of (organizationsResult.data || []) as Array<Record<string, any>>) {
    organizationsById.set(String(row.id), row);
  }

  const definitionsById = new Map<string, Record<string, any>>();
  for (const row of (definitionsResult.data || []) as Array<Record<string, any>>) {
    definitionsById.set(String(row.id), row);
  }

  let relationshipRows: Array<Record<string, any>> = [];
  if (organizationIds.length > 0) {
    const { data: relationships, error: relationshipError } = await serviceClient
      .from('funding_relationship_engagements')
      .select('id, organization_id, relationship_status, current_stage_label, updated_at')
      .eq('relationship_status', 'active')
      .in('organization_id', organizationIds)
      .order('updated_at', { ascending: false })
      .limit(300);

    if (relationshipError) {
      throw new Error(relationshipError.message || 'Failed to load linked relationships');
    }

    relationshipRows = (relationships || []) as Array<Record<string, any>>;
  }

  const activeRelationshipByOrganizationId = new Map<string, Record<string, any>>();
  for (const row of relationshipRows) {
    const organizationId =
      typeof row.organization_id === 'string' ? String(row.organization_id) : null;
    if (!organizationId || activeRelationshipByOrganizationId.has(organizationId)) continue;
    activeRelationshipByOrganizationId.set(organizationId, row);
  }

  const submissionKeys = new Set<string>();
  for (const row of updateRows) {
    submissionKeys.add(`update:${String(row.id)}`);
  }
  for (const row of validationRows) {
    submissionKeys.add(`validation:${String(row.id)}`);
  }

  let reviewWorkflows: Array<Record<string, any>> = [];
  if (submissionKeys.size > 0) {
    const { data: workflows, error: workflowError } = await serviceClient
      .from('funding_agent_workflows')
      .select(
        'id, triggered_by_user_id, started_at, completed_at, workflow_status, input_payload, output_payload'
      )
      .eq('workflow_type', 'community_submission_review')
      .eq('scope_kind', 'outcome')
      .order('completed_at', { ascending: false })
      .limit(300);

    if (workflowError) {
      throw new Error(workflowError.message || 'Failed to load submission reviews');
    }

    reviewWorkflows = (workflows || []) as Array<Record<string, any>>;
  }

  const reviewBySubmissionKey = new Map<string, Record<string, any>>();
  for (const workflow of reviewWorkflows) {
    const inputPayload =
      workflow.input_payload && typeof workflow.input_payload === 'object'
        ? (workflow.input_payload as Record<string, any>)
        : {};
    const submissionKind = String(inputPayload.submissionKind || '').trim().toLowerCase();
    const submissionId = String(inputPayload.submissionId || '').trim();
    const key = `${submissionKind}:${submissionId}`;
    if (!submissionId || !submissionKeys.has(key) || reviewBySubmissionKey.has(key)) {
      continue;
    }
    reviewBySubmissionKey.set(key, workflow);
  }

  let followUpTasks: Array<Record<string, any>> = [];
  if (submissionKeys.size > 0) {
    const { data: tasks, error: taskError } = await serviceClient
      .from('agent_task_queue')
      .select('id, source_id, status, created_at, started_at, completed_at')
      .eq('source', 'funding_public_evidence')
      .eq('task_type', 'funding_public_evidence_followup')
      .order('created_at', { ascending: false })
      .limit(300);

    if (taskError) {
      throw new Error(taskError.message || 'Failed to load public evidence follow-up tasks');
    }

    followUpTasks = ((tasks || []) as Array<Record<string, any>>).filter((task) =>
      submissionKeys.has(String(task.source_id || '').trim())
    );
  }

  const followUpBySubmissionKey = new Map<string, Record<string, any>>();
  for (const task of followUpTasks) {
    const key = String(task.source_id || '').trim();
    if (!key || followUpBySubmissionKey.has(key)) continue;
    followUpBySubmissionKey.set(key, task);
  }

  let outreachTasks: Array<Record<string, any>> = [];
  if (submissionKeys.size > 0) {
    const outreachSourceIds = Array.from(submissionKeys).map(
      (key) => `public-evidence-contact:${key}`
    );
    const { data: tasks, error: taskError } = await serviceClient
      .from('agent_task_queue')
      .select('id, source_id, status, created_at, started_at, completed_at, reply_to')
      .eq('source', 'funding_public_evidence_contact')
      .eq('task_type', 'funding_public_evidence_contact_outreach')
      .in('source_id', outreachSourceIds)
      .order('created_at', { ascending: false })
      .limit(300);

    if (taskError) {
      throw new Error(taskError.message || 'Failed to load public evidence outreach tasks');
    }

    outreachTasks = (tasks || []) as Array<Record<string, any>>;
  }

  const outreachBySubmissionKey = new Map<string, Record<string, any>>();
  for (const task of outreachTasks) {
    const rawSourceId = String(task.source_id || '').trim();
    const submissionKey = rawSourceId.startsWith('public-evidence-contact:')
      ? rawSourceId.slice('public-evidence-contact:'.length)
      : '';
    if (!submissionKey || outreachBySubmissionKey.has(submissionKey)) continue;
    outreachBySubmissionKey.set(submissionKey, task);
  }

  let operatingQueueTasks: Array<Record<string, any>> = [];
  if (submissionKeys.size > 0) {
    const operatingSourceIds = Array.from(submissionKeys).flatMap((key) => [
      `public-evidence:${key}`,
      `public-evidence-risk:${key}`,
    ]);
    const { data: tasks, error: taskError } = await serviceClient
      .from('agent_task_queue')
      .select('id, source_id, status, created_at, started_at, completed_at')
      .eq('source', 'funding_os_followup')
      .eq('task_type', 'funding_ops_followup')
      .in('source_id', operatingSourceIds)
      .order('created_at', { ascending: false })
      .limit(300);

    if (taskError) {
      throw new Error(taskError.message || 'Failed to load linked Funding OS follow-up tasks');
    }

    operatingQueueTasks = (tasks || []) as Array<Record<string, any>>;
  }

  const operatingQueueBySubmissionKey = new Map<string, Record<string, any>>();
  const partnerRiskQueueBySubmissionKey = new Map<string, Record<string, any>>();
  for (const task of operatingQueueTasks) {
    const rawSourceId = String(task.source_id || '').trim();
    if (rawSourceId.startsWith('public-evidence-risk:')) {
      const submissionKey = rawSourceId.slice('public-evidence-risk:'.length);
      if (!submissionKey || partnerRiskQueueBySubmissionKey.has(submissionKey)) continue;
      partnerRiskQueueBySubmissionKey.set(submissionKey, task);
      continue;
    }

    const submissionKey = rawSourceId.startsWith('public-evidence:')
      ? rawSourceId.slice('public-evidence:'.length)
      : '';
    if (!submissionKey || operatingQueueBySubmissionKey.has(submissionKey)) continue;
    operatingQueueBySubmissionKey.set(submissionKey, task);
  }

  let relationshipRiskTasks: Array<Record<string, any>> = [];
  if (submissionKeys.size > 0) {
    const { data: tasks, error: taskError } = await serviceClient
      .from('agent_task_queue')
      .select('id, status, created_at, started_at, completed_at, reply_to')
      .eq('source', 'funding_relationship_stage')
      .eq('task_type', 'funding_relationship_stage_action')
      .filter('reply_to->>stage_key', 'eq', 'partner_risk_review')
      .order('created_at', { ascending: false })
      .limit(300);

    if (taskError) {
      throw new Error(taskError.message || 'Failed to load linked relationship risk tasks');
    }

    relationshipRiskTasks = ((tasks || []) as Array<Record<string, any>>).filter((task) => {
      const replyTo =
        task.reply_to && typeof task.reply_to === 'object'
          ? (task.reply_to as Record<string, any>)
          : {};
      const submissionKind = String(replyTo.public_submission_kind || '').trim().toLowerCase();
      const submissionId = String(replyTo.public_submission_id || '').trim();
      return submissionKeys.has(`${submissionKind}:${submissionId}`);
    });
  }

  const relationshipRiskBySubmissionKey = new Map<string, Record<string, any>>();
  for (const task of relationshipRiskTasks) {
    const replyTo =
      task.reply_to && typeof task.reply_to === 'object'
        ? (task.reply_to as Record<string, any>)
        : {};
    const submissionKind = String(replyTo.public_submission_kind || '').trim().toLowerCase();
    const submissionId = String(replyTo.public_submission_id || '').trim();
    const key = `${submissionKind}:${submissionId}`;
    if (!submissionId || !submissionKeys.has(key) || relationshipRiskBySubmissionKey.has(key)) {
      continue;
    }
    relationshipRiskBySubmissionKey.set(key, task);
  }

  const combined = [
    ...updateRows.map((row) => {
      const commitment = commitmentsById.get(String(row.commitment_id)) || null;
      const award = commitment ? awardsById.get(String(commitment.funding_award_id)) || null : null;
      const organization = commitment
        ? organizationsById.get(String(commitment.organization_id)) || null
        : null;
      const activeRelationship =
        commitment && typeof commitment.organization_id === 'string'
          ? activeRelationshipByOrganizationId.get(String(commitment.organization_id)) || null
          : null;
      const outcomeDefinition = commitment
        ? definitionsById.get(String(commitment.outcome_definition_id)) || null
        : null;
      const reviewWorkflow = reviewBySubmissionKey.get(`update:${String(row.id)}`) || null;
      const followUpTask = followUpBySubmissionKey.get(`update:${String(row.id)}`) || null;
      const outreachTask =
        outreachBySubmissionKey.get(`update:${String(row.id)}`) || null;
      const outreachReplyTo =
        outreachTask?.reply_to && typeof outreachTask.reply_to === 'object'
          ? (outreachTask.reply_to as Record<string, any>)
          : {};
      const operatingQueueTask =
        operatingQueueBySubmissionKey.get(`update:${String(row.id)}`) || null;
      const partnerRiskQueueTask =
        partnerRiskQueueBySubmissionKey.get(`update:${String(row.id)}`) || null;
      const relationshipRiskTask =
        relationshipRiskBySubmissionKey.get(`update:${String(row.id)}`) || null;
      return {
        id: String(row.id),
        kind: 'update' as const,
        submittedAt: row.reported_at || row.created_at || null,
        commitmentId: String(row.commitment_id || ''),
        updateId: String(row.id),
        validationId: null,
        summary: row.narrative || null,
        updateType: row.update_type || null,
        validationStatus: null,
        confidenceScore: row.confidence_score ?? null,
        trustRating: null,
        impactRating: null,
        commitment,
        award,
        organization,
        relationship: activeRelationship
          ? {
              id: String(activeRelationship.id),
              status:
                typeof activeRelationship.relationship_status === 'string'
                  ? activeRelationship.relationship_status
                  : 'active',
              currentStageLabel:
                typeof activeRelationship.current_stage_label === 'string'
                  ? activeRelationship.current_stage_label
                  : null,
            }
          : null,
        outcomeDefinition,
        isCommunitySubmitted: true,
        review: reviewWorkflow
          ? {
              workflowId: String(reviewWorkflow.id),
              status: 'acknowledged' as const,
              reviewedAt: reviewWorkflow.completed_at || reviewWorkflow.started_at || null,
              reviewedByUserId: reviewWorkflow.triggered_by_user_id || null,
            }
          : null,
        followUp: followUpTask
          ? {
              taskId: String(followUpTask.id),
              status: String(followUpTask.status || 'queued'),
              createdAt: followUpTask.created_at || null,
              startedAt: followUpTask.started_at || null,
              completedAt: followUpTask.completed_at || null,
            }
          : null,
        outreachFollowUp: outreachTask
          ? {
              taskId: String(outreachTask.id),
              status: String(outreachTask.status || 'queued'),
              createdAt: outreachTask.created_at || null,
              startedAt: outreachTask.started_at || null,
              completedAt: outreachTask.completed_at || null,
              conversationTaskId:
                typeof outreachReplyTo.auto_conversation_task_id === 'string'
                  ? String(outreachReplyTo.auto_conversation_task_id)
                  : null,
              conversationTaskStatus:
                typeof outreachReplyTo.auto_conversation_task_status === 'string'
                  ? String(outreachReplyTo.auto_conversation_task_status)
                  : null,
              conversationError:
                typeof outreachReplyTo.auto_conversation_error === 'string'
                  ? String(outreachReplyTo.auto_conversation_error)
                  : null,
            }
          : null,
        opsFollowUp: operatingQueueTask
          ? {
              taskId: String(operatingQueueTask.id),
              status: String(operatingQueueTask.status || 'queued'),
              createdAt: operatingQueueTask.created_at || null,
              startedAt: operatingQueueTask.started_at || null,
              completedAt: operatingQueueTask.completed_at || null,
            }
          : null,
        partnerRiskFollowUp: partnerRiskQueueTask
          ? {
              taskId: String(partnerRiskQueueTask.id),
              status: String(partnerRiskQueueTask.status || 'queued'),
              createdAt: partnerRiskQueueTask.created_at || null,
              startedAt: partnerRiskQueueTask.started_at || null,
              completedAt: partnerRiskQueueTask.completed_at || null,
            }
          : null,
        relationshipRiskFollowUp: relationshipRiskTask
          ? {
              taskId: String(relationshipRiskTask.id),
              status: String(relationshipRiskTask.status || 'queued'),
              createdAt: relationshipRiskTask.created_at || null,
              startedAt: relationshipRiskTask.started_at || null,
              completedAt: relationshipRiskTask.completed_at || null,
            }
          : null,
      };
    }),
    ...validationRows.map((row) => {
      const linkedUpdate = updatesById.get(String(row.update_id)) || null;
      const commitment = linkedUpdate
        ? commitmentsById.get(String(linkedUpdate.commitment_id)) || null
        : null;
      const award = commitment ? awardsById.get(String(commitment.funding_award_id)) || null : null;
      const organization = commitment
        ? organizationsById.get(String(commitment.organization_id)) || null
        : null;
      const activeRelationship =
        commitment && typeof commitment.organization_id === 'string'
          ? activeRelationshipByOrganizationId.get(String(commitment.organization_id)) || null
          : null;
      const outcomeDefinition = commitment
        ? definitionsById.get(String(commitment.outcome_definition_id)) || null
        : null;

      const reviewWorkflow =
        reviewBySubmissionKey.get(`validation:${String(row.id)}`) || null;
      const followUpTask =
        followUpBySubmissionKey.get(`validation:${String(row.id)}`) || null;
      const outreachTask =
        outreachBySubmissionKey.get(`validation:${String(row.id)}`) || null;
      const outreachReplyTo =
        outreachTask?.reply_to && typeof outreachTask.reply_to === 'object'
          ? (outreachTask.reply_to as Record<string, any>)
          : {};
      const operatingQueueTask =
        operatingQueueBySubmissionKey.get(`validation:${String(row.id)}`) || null;
      const partnerRiskQueueTask =
        partnerRiskQueueBySubmissionKey.get(`validation:${String(row.id)}`) || null;
      const relationshipRiskTask =
        relationshipRiskBySubmissionKey.get(`validation:${String(row.id)}`) || null;
      return {
        id: String(row.id),
        kind: 'validation' as const,
        submittedAt: row.validated_at || row.created_at || null,
        commitmentId: commitment ? String(commitment.id) : '',
        updateId: linkedUpdate ? String(linkedUpdate.id) : '',
        validationId: String(row.id),
        summary: row.validation_notes || null,
        updateType: linkedUpdate?.update_type || null,
        validationStatus: row.validation_status || null,
        confidenceScore: linkedUpdate?.confidence_score ?? null,
        trustRating: row.trust_rating ?? null,
        impactRating: row.impact_rating ?? null,
        commitment,
        award,
        organization,
        relationship: activeRelationship
          ? {
              id: String(activeRelationship.id),
              status:
                typeof activeRelationship.relationship_status === 'string'
                  ? activeRelationship.relationship_status
                  : 'active',
              currentStageLabel:
                typeof activeRelationship.current_stage_label === 'string'
                  ? activeRelationship.current_stage_label
                  : null,
            }
          : null,
        outcomeDefinition,
        isCommunitySubmitted: true,
        review: reviewWorkflow
          ? {
              workflowId: String(reviewWorkflow.id),
              status: 'acknowledged' as const,
              reviewedAt: reviewWorkflow.completed_at || reviewWorkflow.started_at || null,
              reviewedByUserId: reviewWorkflow.triggered_by_user_id || null,
            }
          : null,
        followUp: followUpTask
          ? {
              taskId: String(followUpTask.id),
              status: String(followUpTask.status || 'queued'),
              createdAt: followUpTask.created_at || null,
              startedAt: followUpTask.started_at || null,
              completedAt: followUpTask.completed_at || null,
            }
          : null,
        outreachFollowUp: outreachTask
          ? {
              taskId: String(outreachTask.id),
              status: String(outreachTask.status || 'queued'),
              createdAt: outreachTask.created_at || null,
              startedAt: outreachTask.started_at || null,
              completedAt: outreachTask.completed_at || null,
              conversationTaskId:
                typeof outreachReplyTo.auto_conversation_task_id === 'string'
                  ? String(outreachReplyTo.auto_conversation_task_id)
                  : null,
              conversationTaskStatus:
                typeof outreachReplyTo.auto_conversation_task_status === 'string'
                  ? String(outreachReplyTo.auto_conversation_task_status)
                  : null,
              conversationError:
                typeof outreachReplyTo.auto_conversation_error === 'string'
                  ? String(outreachReplyTo.auto_conversation_error)
                  : null,
            }
          : null,
        opsFollowUp: operatingQueueTask
          ? {
              taskId: String(operatingQueueTask.id),
              status: String(operatingQueueTask.status || 'queued'),
              createdAt: operatingQueueTask.created_at || null,
              startedAt: operatingQueueTask.started_at || null,
              completedAt: operatingQueueTask.completed_at || null,
            }
          : null,
        partnerRiskFollowUp: partnerRiskQueueTask
          ? {
              taskId: String(partnerRiskQueueTask.id),
              status: String(partnerRiskQueueTask.status || 'queued'),
              createdAt: partnerRiskQueueTask.created_at || null,
              startedAt: partnerRiskQueueTask.started_at || null,
              completedAt: partnerRiskQueueTask.completed_at || null,
            }
          : null,
        relationshipRiskFollowUp: relationshipRiskTask
          ? {
              taskId: String(relationshipRiskTask.id),
              status: String(relationshipRiskTask.status || 'queued'),
              createdAt: relationshipRiskTask.created_at || null,
              startedAt: relationshipRiskTask.started_at || null,
              completedAt: relationshipRiskTask.completed_at || null,
            }
          : null,
      };
    }),
  ]
    .sort((a, b) => {
      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bTime - aTime;
    })
    .filter((row) => {
      if (review === 'acknowledged') {
        return Boolean(row.review);
      }
      if (review === 'pending') {
        return !row.review;
      }
      return true;
    })
    .slice(0, limit);

  return combined;
}

function publicEvidenceSummaryAllowsFollowUp(summary: unknown) {
  const text = String(summary || '').trim();
  return /(^|\n)Follow-up contact:\s*Yes$/im.test(text);
}

export async function acknowledgeFundingPublicEvidenceSubmission(
  input: {
    kind: 'update' | 'validation';
    submissionId: string;
  },
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const kind = String(input.kind || '').trim().toLowerCase();
  const submissionId = String(input.submissionId || '').trim();

  if (kind !== 'update' && kind !== 'validation') {
    throw new Error('Validation: kind must be update or validation');
  }

  if (!submissionId) {
    throw new Error('Validation: submissionId is required');
  }

  if (kind === 'update') {
    const { data, error } = await serviceClient
      .from('funding_outcome_updates')
      .select('id')
      .eq('id', submissionId)
      .is('reported_by_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public outcome update');
    }

    if (!data) {
      throw new Error('Validation: Public outcome update not found');
    }
  } else {
    const { data, error } = await serviceClient
      .from('community_outcome_validations')
      .select('id')
      .eq('id', submissionId)
      .is('validator_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public community validation');
    }

    if (!data) {
      throw new Error('Validation: Public community validation not found');
    }
  }

  const existing = await serviceClient
    .from('funding_agent_workflows')
    .select('id, triggered_by_user_id, input_payload')
    .eq('workflow_type', 'community_submission_review')
    .eq('scope_kind', 'outcome')
    .order('completed_at', { ascending: false })
    .limit(200);

  if (existing.error) {
    throw new Error(existing.error.message || 'Failed to load submission reviews');
  }

  const existingRows = (existing.data || []) as Array<Record<string, any>>;
  for (const row of existingRows) {
    const inputPayload =
      row.input_payload && typeof row.input_payload === 'object'
        ? (row.input_payload as Record<string, any>)
        : {};
    if (
      String(inputPayload.submissionKind || '').trim().toLowerCase() === kind &&
      String(inputPayload.submissionId || '').trim() === submissionId
    ) {
      return {
        workflowId: String(row.id),
        acknowledged: true,
        alreadyReviewed: true,
      };
    }
  }

  const workflow = await createWorkflow(
    serviceClient,
    'community_submission_review',
    'outcome',
    adminUserId,
    {
      submissionKind: kind,
      submissionId,
    }
  );

  const result = {
    acknowledged: true,
    alreadyReviewed: false,
    submissionKind: kind,
    submissionId,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return {
    workflowId: workflow.id,
    ...result,
  };
}

export async function escalateFundingPublicEvidenceSubmission(
  input: {
    kind: 'update' | 'validation';
    submissionId: string;
  },
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const kind = String(input.kind || '').trim().toLowerCase();
  const submissionId = String(input.submissionId || '').trim();
  const sourceId = `${kind}:${submissionId}`;

  if (kind !== 'update' && kind !== 'validation') {
    throw new Error('Validation: kind must be update or validation');
  }

  if (!submissionId) {
    throw new Error('Validation: submissionId is required');
  }

  let title = 'Public evidence follow-up';
  let description =
    'Review a public evidence submission and determine whether operational follow-up is required.';
  let priority = 3;

  if (kind === 'update') {
    const { data, error } = await serviceClient
      .from('funding_outcome_updates')
      .select('id, update_type, narrative, commitment_id')
      .eq('id', submissionId)
      .is('reported_by_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public outcome update');
    }

    if (!data) {
      throw new Error('Validation: Public outcome update not found');
    }

    title = `Follow up public ${String(data.update_type || 'update')}`;
    description = String(data.narrative || description).slice(0, 400);
  } else {
    const { data, error } = await serviceClient
      .from('community_outcome_validations')
      .select('id, validation_status, validation_notes')
      .eq('id', submissionId)
      .is('validator_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public community validation');
    }

    if (!data) {
      throw new Error('Validation: Public community validation not found');
    }

    const validationStatus = String(data.validation_status || '').trim().toLowerCase();
    title = `Follow up public ${validationStatus || 'validation'}`;
    description = String(data.validation_notes || description).slice(0, 400);
    if (validationStatus === 'contested' || validationStatus === 'needs_follow_up') {
      priority = 2;
    }
  }

  const { data: existingTask, error: existingTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_public_evidence')
    .eq('task_type', 'funding_public_evidence_followup')
    .eq('source_id', sourceId)
    .in('status', ['queued', 'pending', 'running', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTaskError) {
    throw new Error(existingTaskError.message || 'Failed to inspect public evidence follow-up');
  }

  if (existingTask) {
    return {
      taskId: String(existingTask.id),
      status: String(existingTask.status || 'queued'),
      existing: true,
    };
  }

  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    adminUserId,
    `Escalated public ${kind} for follow-up.`,
    {
      submissionKind: kind,
      submissionId,
    }
  );

  const { data: createdTask, error: createTaskError } = await serviceClient
    .from('agent_task_queue')
    .insert([
      {
        source: 'funding_public_evidence',
        source_id: sourceId,
        task_type: 'funding_public_evidence_followup',
        title,
        description,
        status: 'queued',
        priority,
        needs_review: true,
        requested_by: adminUserId,
        reply_to: {
          submission_kind: kind,
          submission_id: submissionId,
        },
        human_edits: [auditEntry] as any,
      },
    ])
    .select('id, status, created_at')
    .single();

  if (createTaskError || !createdTask) {
    throw new Error(createTaskError?.message || 'Failed to create public evidence follow-up');
  }

  return {
    taskId: String(createdTask.id),
    status: String(createdTask.status || 'queued'),
    createdAt: createdTask.created_at || null,
    existing: false,
  };
}

export async function updateFundingPublicEvidenceFollowUpStatus(
  taskId: string,
  status: 'queued' | 'running' | 'completed',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['queued', 'running', 'completed'].includes(normalizedStatus)) {
    throw new Error('Validation: status must be queued, running, or completed');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_public_evidence')
    .eq('task_type', 'funding_public_evidence_followup')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load public evidence follow-up');
  }

  if (!currentTask) {
    throw new Error('Validation: Public evidence follow-up not found');
  }

  const previousStatus = typeof currentTask.status === 'string' ? currentTask.status : null;
  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    `Changed public evidence follow-up status to ${normalizedStatus}`,
    {
      fromStatus: previousStatus,
      toStatus: normalizedStatus,
    }
  );

  const updatePayload: Record<string, unknown> = {
    status: normalizedStatus,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  if (normalizedStatus === 'queued') {
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'running') {
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'completed') {
    updatePayload.started_at = now;
    updatePayload.completed_at = now;
    updatePayload.needs_review = false;
    updatePayload.review_decision = 'resolved';
    updatePayload.reviewed_at = now;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_public_evidence')
    .eq('task_type', 'funding_public_evidence_followup')
    .select('id, status, started_at, completed_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update public evidence follow-up');
  }

  return {
    taskId: normalizedId,
    status: typeof data.status === 'string' ? data.status : normalizedStatus,
    startedAt: data.started_at || null,
    completedAt: data.completed_at || null,
  };
}

export async function createFundingPublicEvidenceContactOutreach(
  input: {
    kind: 'update' | 'validation';
    submissionId: string;
  },
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const kind = String(input.kind || '').trim().toLowerCase();
  const submissionId = String(input.submissionId || '').trim();
  const submissionKey = `${kind}:${submissionId}`;
  const sourceId = `public-evidence-contact:${submissionKey}`;

  if (kind !== 'update' && kind !== 'validation') {
    throw new Error('Validation: kind must be update or validation');
  }

  if (!submissionId) {
    throw new Error('Validation: submissionId is required');
  }

  const { data: existingTask, error: existingTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, created_at')
    .eq('source', 'funding_public_evidence_contact')
    .eq('task_type', 'funding_public_evidence_contact_outreach')
    .eq('source_id', sourceId)
    .in('status', ['queued', 'pending', 'running', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTaskError) {
    throw new Error(
      existingTaskError.message || 'Failed to inspect public evidence outreach tasks'
    );
  }

  if (existingTask) {
    return {
      taskId: String(existingTask.id),
      status: String(existingTask.status || 'queued'),
      createdAt: existingTask.created_at || null,
      existing: true,
    };
  }

  let organizationId: string | null = null;
  let organizationName = 'Community contributor';
  let outcomeName = 'Outcome evidence';
  let summaryText = '';
  let isUrgent = false;

  if (kind === 'update') {
    const { data, error } = await serviceClient
      .from('funding_outcome_updates')
      .select(
        'id, narrative, confidence_score, funding_outcome_commitments(organization_id, outcome_definition_id)'
      )
      .eq('id', submissionId)
      .is('reported_by_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public outcome update');
    }

    if (!data) {
      throw new Error('Validation: Public outcome update not found');
    }

    summaryText = String((data as any).narrative || '');
    const confidenceScore =
      typeof (data as any).confidence_score === 'number'
        ? Number((data as any).confidence_score)
        : null;
    isUrgent = confidenceScore !== null && confidenceScore < 50;

    const commitment = Array.isArray((data as any).funding_outcome_commitments)
      ? (data as any).funding_outcome_commitments[0]
      : (data as any).funding_outcome_commitments;

    organizationId =
      commitment && typeof commitment.organization_id === 'string'
        ? commitment.organization_id
        : null;

    if (organizationId) {
      const { data: organization } = await serviceClient
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .maybeSingle();
      if (organization?.name) {
        organizationName = String(organization.name);
      }
    }

    if (commitment?.outcome_definition_id) {
      const { data: outcomeDefinition } = await serviceClient
        .from('community_outcome_definitions')
        .select('id, name')
        .eq('id', commitment.outcome_definition_id)
        .maybeSingle();
      if (outcomeDefinition?.name) {
        outcomeName = String(outcomeDefinition.name);
      }
    }
  } else {
    const { data, error } = await serviceClient
      .from('community_outcome_validations')
      .select(
        'id, validation_status, validation_notes, funding_outcome_updates(commitment_id, funding_outcome_commitments(organization_id, outcome_definition_id))'
      )
      .eq('id', submissionId)
      .is('validator_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public community validation');
    }

    if (!data) {
      throw new Error('Validation: Public community validation not found');
    }

    summaryText = String((data as any).validation_notes || '');
    const validationStatus = String((data as any).validation_status || '')
      .trim()
      .toLowerCase();
    isUrgent = validationStatus === 'contested' || validationStatus === 'needs_follow_up';

    const linkedUpdate = Array.isArray((data as any).funding_outcome_updates)
      ? (data as any).funding_outcome_updates[0]
      : (data as any).funding_outcome_updates;
    const commitment = Array.isArray(linkedUpdate?.funding_outcome_commitments)
      ? linkedUpdate.funding_outcome_commitments[0]
      : linkedUpdate?.funding_outcome_commitments;

    organizationId =
      commitment && typeof commitment.organization_id === 'string'
        ? commitment.organization_id
        : null;

    if (organizationId) {
      const { data: organization } = await serviceClient
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .maybeSingle();
      if (organization?.name) {
        organizationName = String(organization.name);
      }
    }

    if (commitment?.outcome_definition_id) {
      const { data: outcomeDefinition } = await serviceClient
        .from('community_outcome_definitions')
        .select('id, name')
        .eq('id', commitment.outcome_definition_id)
        .maybeSingle();
      if (outcomeDefinition?.name) {
        outcomeName = String(outcomeDefinition.name);
      }
    }
  }

  if (!isUrgent) {
    throw new Error(
      'Validation: Only urgent public submissions can create direct contact outreach tasks'
    );
  }

  if (!publicEvidenceSummaryAllowsFollowUp(summaryText)) {
    throw new Error(
      'Validation: This public submission does not explicitly allow follow-up contact'
    );
  }

  const auditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    'Queued direct contact outreach from urgent public evidence.',
    {
      origin: 'public_evidence_contact_outreach',
      submissionKind: kind,
      submissionId,
    }
  );

  const { data: createdTask, error: createTaskError } = await (serviceClient
    .from('agent_task_queue') as any)
    .insert([
      {
        source: 'funding_public_evidence_contact',
        source_id: sourceId,
        task_type: 'funding_public_evidence_contact_outreach',
        title: `Contact contributor: urgent public ${kind}`,
        description: `${organizationName} submitted urgent public evidence for ${outcomeName} and explicitly allowed follow-up. Review the community context and make contact if appropriate.`,
        status: 'queued',
        priority: 1,
        needs_review: true,
        requested_by: adminUserId,
        reply_to: {
          organization_id: organizationId,
          public_submission_kind: kind,
          public_submission_id: submissionId,
          outreach_type: 'community_follow_up',
          outcome_name: outcomeName,
          created_at: new Date().toISOString(),
        },
        human_edits: [auditEntry],
      },
    ] as any[])
    .select('id, status, created_at')
    .single();

  if (createTaskError || !createdTask) {
    throw new Error(createTaskError?.message || 'Failed to create public evidence outreach task');
  }

  return {
    taskId: String(createdTask.id),
    status: String(createdTask.status || 'queued'),
    createdAt: createdTask.created_at || null,
    existing: false,
  };
}

export async function updateFundingPublicEvidenceContactOutreachStatus(
  taskId: string,
  status: 'queued' | 'running' | 'completed',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['queued', 'running', 'completed'].includes(normalizedStatus)) {
    throw new Error('Validation: status must be queued, running, or completed');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_public_evidence_contact')
    .eq('task_type', 'funding_public_evidence_contact_outreach')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load public evidence outreach task');
  }

  if (!currentTask) {
    throw new Error('Validation: Public evidence outreach task not found');
  }

  const previousStatus = typeof currentTask.status === 'string' ? currentTask.status : null;
  const currentReplyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    `Changed public evidence outreach status to ${normalizedStatus}`,
    {
      fromStatus: previousStatus,
      toStatus: normalizedStatus,
    }
  );

  const updatePayload: Record<string, unknown> = {
    status: normalizedStatus,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  if (normalizedStatus === 'queued') {
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'running') {
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'completed') {
    updatePayload.started_at = now;
    updatePayload.completed_at = now;
    updatePayload.needs_review = false;
    updatePayload.review_decision = 'resolved';
    updatePayload.reviewed_at = now;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_public_evidence_contact')
    .eq('task_type', 'funding_public_evidence_contact_outreach')
    .select('id, status, started_at, completed_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update public evidence outreach task');
  }

  let autoConversationTaskId: string | null = null;
  let autoConversationTaskStatus: string | null = null;
  let autoConversationError: string | null = null;

  if (normalizedStatus === 'completed') {
    const organizationId =
      typeof currentReplyTo.organization_id === 'string'
        ? String(currentReplyTo.organization_id).trim()
        : '';

    const nextReplyTo: Record<string, any> = {
      ...currentReplyTo,
      auto_conversation_checked_at: now,
    };
    let nextHumanEdits = currentTask.human_edits;

    try {
      if (!organizationId) {
        throw new Error('No linked organization is available for automatic conversation follow-up');
      }

      const { data: recommendation, error: recommendationError } = await serviceClient
        .from('funding_match_recommendations')
        .select('id, recommendation_status, match_score, updated_at')
        .eq('organization_id', organizationId)
        .in('recommendation_status', ['candidate', 'notified', 'engaged'])
        .order('match_score', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recommendationError) {
        throw new Error(
          recommendationError.message ||
            'Failed to inspect funding recommendations for automatic conversation follow-up'
        );
      }

      if (!recommendation?.id) {
        throw new Error('No active funding recommendation is available for automatic conversation follow-up');
      }

      const conversationResult = await createFundingConversationRequest(
        String(recommendation.id),
        adminUserId
      );

      autoConversationTaskId = String(conversationResult.taskId || '').trim() || null;
      autoConversationTaskStatus =
        String(conversationResult.taskStatus || '').trim() || null;

      nextReplyTo.auto_conversation_recommendation_id = String(recommendation.id);
      nextReplyTo.auto_conversation_task_id = autoConversationTaskId;
      nextReplyTo.auto_conversation_task_status = autoConversationTaskStatus;
      nextReplyTo.auto_conversation_created_at = now;
      nextReplyTo.auto_conversation_existing = Boolean(conversationResult.existing);
      nextReplyTo.auto_conversation_error = null;

      nextHumanEdits = appendFundingOperatingTaskAuditEntry(
        nextHumanEdits,
        createFundingOperatingTaskAuditEntry(
          'status_changed',
          adminUserId,
          'Created tracked conversation follow-up from completed contact outreach.',
          {
            recommendationId: String(recommendation.id),
            conversationTaskId: autoConversationTaskId,
            existing: Boolean(conversationResult.existing),
          }
        )
      );
    } catch (autoConversationFailure) {
      autoConversationError =
        autoConversationFailure instanceof Error
          ? autoConversationFailure.message
          : 'Failed to create automatic conversation follow-up';

      nextReplyTo.auto_conversation_error = autoConversationError;

      nextHumanEdits = appendFundingOperatingTaskAuditEntry(
        nextHumanEdits,
        createFundingOperatingTaskAuditEntry(
          'status_changed',
          adminUserId,
          'Completed contact outreach without creating a tracked conversation follow-up.',
          {
            error: autoConversationError,
          }
        )
      );
    }

    const { error: syncError } = await serviceClient
      .from('agent_task_queue')
      .update({
        reply_to: nextReplyTo,
        human_edits: nextHumanEdits,
      } as any)
      .eq('id', normalizedId)
      .eq('source', 'funding_public_evidence_contact')
      .eq('task_type', 'funding_public_evidence_contact_outreach');

    if (syncError) {
      throw new Error(
        syncError.message ||
          'Failed to sync automatic conversation follow-up back to contact outreach task'
      );
    }
  }

  return {
    taskId: normalizedId,
    status: typeof data.status === 'string' ? data.status : normalizedStatus,
    startedAt: data.started_at || null,
    completedAt: data.completed_at || null,
    autoConversationTaskId,
    autoConversationTaskStatus,
    autoConversationError,
  };
}

async function promoteFundingPublicEvidenceToOperatingQueueInternal(
  input: {
    kind: 'update' | 'validation';
    submissionId: string;
  },
  adminUserId: string,
  mode: 'reporting' | 'partner_risk'
) {
  const serviceClient = getServiceClient();
  const kind = String(input.kind || '').trim().toLowerCase();
  const submissionId = String(input.submissionId || '').trim();
  const submissionKey = `${kind}:${submissionId}`;
  const sourceId =
    mode === 'partner_risk'
      ? `public-evidence-risk:${submissionKey}`
      : `public-evidence:${submissionKey}`;

  if (kind !== 'update' && kind !== 'validation') {
    throw new Error('Validation: kind must be update or validation');
  }

  if (!submissionId) {
    throw new Error('Validation: submissionId is required');
  }

  const { data: existingTask, error: existingTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_os_followup')
    .eq('task_type', 'funding_ops_followup')
    .eq('source_id', sourceId)
    .in('status', ['queued', 'pending', 'running', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTaskError) {
    throw new Error(
      existingTaskError.message || 'Failed to inspect Funding OS follow-up tasks'
    );
  }

  if (existingTask) {
    return {
      taskId: String(existingTask.id),
      status: String(existingTask.status || 'queued'),
      existing: true,
    };
  }

  const { data: localFollowUp, error: localFollowUpError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_public_evidence')
    .eq('task_type', 'funding_public_evidence_followup')
    .eq('source_id', submissionKey)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (localFollowUpError) {
    throw new Error(
      localFollowUpError.message || 'Failed to inspect public evidence follow-up tasks'
    );
  }

  if (!localFollowUp) {
    throw new Error(
      'Validation: Escalate the public submission first before sending it to the main follow-up queue'
    );
  }

  let organizationId: string | null = null;
  let organizationName = 'Community submission';
  let outcomeName = 'Outcome evidence';
  let title =
    mode === 'partner_risk'
      ? 'Funding OS partner-risk: public evidence submission'
      : 'Funding OS follow-up: public evidence submission';
  let description =
    mode === 'partner_risk'
      ? 'A public evidence submission indicates a potential partner-risk issue that may affect relationship or pipeline decisions.'
      : 'A public evidence submission needs broader Funding OS follow-up.';
  let severity: 'critical' | 'high' | 'medium' = 'medium';
  let priority = 3;

  if (kind === 'update') {
    const { data, error } = await serviceClient
      .from('funding_outcome_updates')
      .select(
        'id, commitment_id, update_type, narrative, confidence_score, funding_outcome_commitments(organization_id, outcome_definition_id)'
      )
      .eq('id', submissionId)
      .is('reported_by_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public outcome update');
    }

    if (!data) {
      throw new Error('Validation: Public outcome update not found');
    }

    const commitment = Array.isArray((data as any).funding_outcome_commitments)
      ? (data as any).funding_outcome_commitments[0]
      : (data as any).funding_outcome_commitments;
    organizationId =
      commitment && typeof commitment.organization_id === 'string'
        ? commitment.organization_id
        : null;

    if (organizationId) {
      const { data: organization } = await serviceClient
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .maybeSingle();
      if (organization?.name) {
        organizationName = String(organization.name);
      }
    }

    if (commitment?.outcome_definition_id) {
      const { data: outcomeDefinition } = await serviceClient
        .from('community_outcome_definitions')
        .select('id, name')
        .eq('id', commitment.outcome_definition_id)
        .maybeSingle();
      if (outcomeDefinition?.name) {
        outcomeName = String(outcomeDefinition.name);
      }
    }

    const confidenceScore =
      typeof (data as any).confidence_score === 'number'
        ? Number((data as any).confidence_score)
        : null;
    if (confidenceScore !== null && confidenceScore < 50) {
      severity = 'high';
      priority = 2;
    }

    title =
      mode === 'partner_risk'
        ? `Funding OS partner-risk: public ${String((data as any).update_type || 'update')}`
        : `Funding OS follow-up: public ${String((data as any).update_type || 'update')}`;
    description =
      mode === 'partner_risk'
        ? `${
            organizationName || 'Community organization'
          } submitted public evidence for ${outcomeName}. Review whether this signals partner-risk that should affect relationship or pipeline decisions.`
        : `${
            organizationName || 'Community organization'
          } submitted public evidence for ${outcomeName}. Review whether broader operational follow-up is required.`;
  } else {
    const { data, error } = await serviceClient
      .from('community_outcome_validations')
      .select(
        'id, update_id, validation_status, validation_notes, funding_outcome_updates(commitment_id, funding_outcome_commitments(organization_id, outcome_definition_id))'
      )
      .eq('id', submissionId)
      .is('validator_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public community validation');
    }

    if (!data) {
      throw new Error('Validation: Public community validation not found');
    }

    const linkedUpdate = Array.isArray((data as any).funding_outcome_updates)
      ? (data as any).funding_outcome_updates[0]
      : (data as any).funding_outcome_updates;
    const commitment = Array.isArray(linkedUpdate?.funding_outcome_commitments)
      ? linkedUpdate.funding_outcome_commitments[0]
      : linkedUpdate?.funding_outcome_commitments;

    organizationId =
      commitment && typeof commitment.organization_id === 'string'
        ? commitment.organization_id
        : null;

    if (organizationId) {
      const { data: organization } = await serviceClient
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .maybeSingle();
      if (organization?.name) {
        organizationName = String(organization.name);
      }
    }

    if (commitment?.outcome_definition_id) {
      const { data: outcomeDefinition } = await serviceClient
        .from('community_outcome_definitions')
        .select('id, name')
        .eq('id', commitment.outcome_definition_id)
        .maybeSingle();
      if (outcomeDefinition?.name) {
        outcomeName = String(outcomeDefinition.name);
      }
    }

    const validationStatus = String((data as any).validation_status || '')
      .trim()
      .toLowerCase();
    if (validationStatus === 'contested' || validationStatus === 'needs_follow_up') {
      severity = 'critical';
      priority = 1;
    } else if (validationStatus === 'mixed') {
      severity = 'high';
      priority = 2;
    }

    title =
      mode === 'partner_risk'
        ? `Funding OS partner-risk: public ${validationStatus || 'validation'}`
        : `Funding OS follow-up: public ${validationStatus || 'validation'}`;
    description =
      mode === 'partner_risk'
        ? `${
            organizationName || 'Community organization'
          } submitted a public ${validationStatus || 'validation'} for ${outcomeName}. Review whether this signals partner-risk that should affect relationship or pipeline decisions.`
        : `${
            organizationName || 'Community organization'
          } submitted a public ${validationStatus || 'validation'} for ${outcomeName}. Review broader reporting implications.`;
  }

  if (mode === 'partner_risk') {
    if (severity !== 'critical') {
      throw new Error(
        'Validation: Only urgent public submissions can escalate into the partner-risk queue'
      );
    }
    priority = 1;
  }

  const originAuditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    mode === 'partner_risk'
      ? 'Queued Funding OS partner-risk follow-up from public evidence escalation'
      : 'Queued Funding OS follow-up from public evidence escalation',
    {
      origin:
        mode === 'partner_risk'
          ? 'public_evidence_partner_risk'
          : 'public_evidence_submission',
      submissionKind: kind,
      submissionId,
    }
  );

  const { data: createdTask, error: createTaskError } = await (serviceClient
    .from('agent_task_queue') as any)
    .insert([
      {
        source: 'funding_os_followup',
        source_id: sourceId,
        task_type: 'funding_ops_followup',
        title,
        description,
        status: 'queued',
        priority,
        needs_review: true,
        requested_by: adminUserId,
        reply_to: {
          organization_id: organizationId,
          routing_class: mode === 'partner_risk' ? 'pipeline' : 'reporting',
          routing_rule:
            mode === 'partner_risk'
              ? 'public_evidence_partner_risk'
              : 'public_evidence_submission',
          auto_assigned: false,
          severity,
          public_submission_kind: kind,
          public_submission_id: submissionId,
          linked_public_followup_task_id: String(localFollowUp.id),
          summary: {
            overdueCommunityReports: 0,
            spendWithoutValidation: 0,
            strongMatchesNotEngaged: 0,
            awardsWithoutCommitments: 0,
            commitmentsWithoutUpdates: 0,
            engagedMatchesStalled: 0,
          },
          created_at: new Date().toISOString(),
        },
        human_edits: [originAuditEntry],
      },
    ] as any[])
    .select('id, status, created_at')
    .single();

  if (createTaskError || !createdTask) {
    throw new Error(createTaskError?.message || 'Failed to queue Funding OS follow-up task');
  }

  return {
    taskId: String(createdTask.id),
    status: String(createdTask.status || 'queued'),
    createdAt: createdTask.created_at || null,
    severity,
    routingClass: mode === 'partner_risk' ? 'pipeline' : 'reporting',
    existing: false,
  };
}

export async function promoteFundingPublicEvidenceToOperatingQueue(
  input: {
    kind: 'update' | 'validation';
    submissionId: string;
  },
  adminUserId: string
) {
  return promoteFundingPublicEvidenceToOperatingQueueInternal(
    input,
    adminUserId,
    'reporting'
  );
}

export async function promoteFundingPublicEvidenceToPartnerRiskQueue(
  input: {
    kind: 'update' | 'validation';
    submissionId: string;
  },
  adminUserId: string
) {
  return promoteFundingPublicEvidenceToOperatingQueueInternal(
    input,
    adminUserId,
    'partner_risk'
  );
}

export async function promoteFundingPublicEvidenceToRelationshipRiskQueue(
  input: {
    kind: 'update' | 'validation';
    submissionId: string;
  },
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const kind = String(input.kind || '').trim().toLowerCase();
  const submissionId = String(input.submissionId || '').trim();
  const submissionKey = `${kind}:${submissionId}`;

  if (kind !== 'update' && kind !== 'validation') {
    throw new Error('Validation: kind must be update or validation');
  }

  if (!submissionId) {
    throw new Error('Validation: submissionId is required');
  }

  const { data: localFollowUp, error: localFollowUpError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_public_evidence')
    .eq('task_type', 'funding_public_evidence_followup')
    .eq('source_id', submissionKey)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (localFollowUpError) {
    throw new Error(
      localFollowUpError.message || 'Failed to inspect public evidence follow-up tasks'
    );
  }

  if (!localFollowUp) {
    throw new Error(
      'Validation: Escalate the public submission first before sending it to the relationship workflow'
    );
  }

  let organizationId: string | null = null;
  let organizationName = 'Community organization';
  let outcomeName = 'Outcome evidence';
  let validationStatus = '';

  if (kind === 'validation') {
    const { data, error } = await serviceClient
      .from('community_outcome_validations')
      .select(
        'id, validation_status, funding_outcome_updates(commitment_id, funding_outcome_commitments(organization_id, outcome_definition_id))'
      )
      .eq('id', submissionId)
      .is('validator_user_id', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to load public community validation');
    }

    if (!data) {
      throw new Error('Validation: Public community validation not found');
    }

    validationStatus = String((data as any).validation_status || '').trim().toLowerCase();
    if (validationStatus !== 'contested' && validationStatus !== 'needs_follow_up') {
      throw new Error(
        'Validation: Only urgent public validations can escalate into the relationship workflow'
      );
    }

    const linkedUpdate = Array.isArray((data as any).funding_outcome_updates)
      ? (data as any).funding_outcome_updates[0]
      : (data as any).funding_outcome_updates;
    const commitment = Array.isArray(linkedUpdate?.funding_outcome_commitments)
      ? linkedUpdate.funding_outcome_commitments[0]
      : linkedUpdate?.funding_outcome_commitments;

    organizationId =
      commitment && typeof commitment.organization_id === 'string'
        ? commitment.organization_id
        : null;

    if (commitment?.outcome_definition_id) {
      const { data: outcomeDefinition } = await serviceClient
        .from('community_outcome_definitions')
        .select('id, name')
        .eq('id', commitment.outcome_definition_id)
        .maybeSingle();
      if (outcomeDefinition?.name) {
        outcomeName = String(outcomeDefinition.name);
      }
    }
  } else {
    throw new Error(
      'Validation: Relationship-risk escalation currently applies only to urgent public validations'
    );
  }

  if (!organizationId) {
    throw new Error('Validation: Linked organization not found for this submission');
  }

  const { data: organization } = await serviceClient
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .maybeSingle();
  if (organization?.name) {
    organizationName = String(organization.name);
  }

  const { data: relationship, error: relationshipError } = await serviceClient
    .from('funding_relationship_engagements')
    .select('id, metadata')
    .eq('organization_id', organizationId)
    .eq('relationship_status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (relationshipError) {
    throw new Error(relationshipError.message || 'Failed to load active relationship');
  }

  if (!relationship?.id) {
    throw new Error(
      'Validation: No active relationship exists for this organization yet'
    );
  }

  const relationshipId = String(relationship.id);

  const { data: existingTask, error: existingTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_relationship_stage')
    .eq('task_type', 'funding_relationship_stage_action')
    .eq('source_id', relationshipId)
    .filter('reply_to->>stage_key', 'eq', 'partner_risk_review')
    .filter('reply_to->>public_submission_kind', 'eq', kind)
    .filter('reply_to->>public_submission_id', 'eq', submissionId)
    .in('status', ['queued', 'pending', 'running', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTaskError) {
    throw new Error(existingTaskError.message || 'Failed to inspect relationship-risk tasks');
  }

  if (existingTask) {
    return {
      taskId: String(existingTask.id),
      relationshipId,
      status: String(existingTask.status || 'queued'),
      existing: true,
    };
  }

  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    adminUserId,
    `Queued relationship-risk review for public ${validationStatus || 'validation'}.`,
    {
      relationshipId,
      submissionKind: kind,
      submissionId,
    }
  );

  const { data: createdTask, error: createTaskError } = await serviceClient
    .from('agent_task_queue')
    .insert({
      source: 'funding_relationship_stage',
      source_id: relationshipId,
      task_type: 'funding_relationship_stage_action',
      title: `Investigate partner risk: public ${validationStatus || 'validation'}`,
      description: `${
        organizationName || 'Community organization'
      } submitted a public ${validationStatus || 'validation'} for ${outcomeName}. Review relationship risk and decide whether the current relationship or funding pathway should change.`,
      status: 'queued',
      priority: 1,
      requested_by: adminUserId,
      needs_review: true,
      reply_to: {
        relationship_id: relationshipId,
        stage_key: 'partner_risk_review',
        stage_task_kind: 'investigate_public_partner_risk',
        stage_task_label: 'Investigate public partner risk',
        public_submission_kind: kind,
        public_submission_id: submissionId,
        linked_public_followup_task_id: String(localFollowUp.id),
        severity: 'critical',
      },
      human_edits: [auditEntry] as any,
    } as any)
    .select('id, status, created_at')
    .single();

  if (createTaskError || !createdTask) {
    throw new Error(createTaskError?.message || 'Failed to create relationship-risk task');
  }

  const existingMetadata =
    relationship.metadata && typeof relationship.metadata === 'object'
      ? (relationship.metadata as Record<string, any>)
      : {};

  const { error: relationshipUpdateError } = await serviceClient
    .from('funding_relationship_engagements')
    .update({
      next_action_label: 'Review public partner-risk evidence',
      next_action_due_at: now,
      last_engaged_at: now,
      updated_by: adminUserId,
      metadata: {
        ...existingMetadata,
        partner_risk_task_id: String(createdTask.id),
        partner_risk_task_status:
          typeof createdTask.status === 'string' ? createdTask.status : 'queued',
        partner_risk_task_label: 'Investigate public partner risk',
        partner_risk_submission_key: submissionKey,
        partner_risk_flagged_at: now,
      },
    } as any)
    .eq('id', relationshipId);

  if (relationshipUpdateError) {
    throw new Error(
      relationshipUpdateError.message ||
        'Failed to sync relationship-risk state back to relationship'
    );
  }

  return {
    taskId: String(createdTask.id),
    relationshipId,
    status: String(createdTask.status || 'queued'),
    createdAt: createdTask.created_at || null,
    existing: false,
  };
}

export async function listFundingOutcomeCommitmentReferenceData(filters?: {
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters?.limit ?? 100));

  const [
    { data: awards, error: awardError },
    { data: outcomeDefinitions, error: outcomeDefinitionError },
  ] = await Promise.all([
    serviceClient
      .from('funding_awards')
      .select('id, funding_program_id, organization_id, award_status, amount_awarded, community_report_due_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit),
    serviceClient
      .from('community_outcome_definitions')
      .select('id, name, outcome_domain, unit, description, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(limit),
  ]);

  if (awardError) {
    throw new Error(awardError.message || 'Failed to load funding awards');
  }

  if (outcomeDefinitionError) {
    throw new Error(outcomeDefinitionError.message || 'Failed to load outcome definitions');
  }

  const awardRows = (awards || []) as Array<Record<string, any>>;
  const organizationIds = uniqueStrings(awardRows.map((award) => award.organization_id));
  const programIds = uniqueStrings(awardRows.map((award) => award.funding_program_id));

  const [
    { data: organizations, error: organizationError },
    { data: programs, error: programError },
  ] = await Promise.all([
    organizationIds.length > 0
      ? serviceClient
          .from('organizations')
          .select('id, name, city, state')
          .in('id', organizationIds)
      : Promise.resolve({ data: [], error: null }),
    programIds.length > 0
      ? serviceClient
          .from('funding_programs')
          .select('id, name')
          .in('id', programIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (organizationError) {
    throw new Error(organizationError.message || 'Failed to load organizations for awards');
  }

  if (programError) {
    throw new Error(programError.message || 'Failed to load programs for awards');
  }

  const organizationMap = new Map<string, Record<string, any>>();
  for (const organization of (organizations || []) as Array<Record<string, any>>) {
    organizationMap.set(String(organization.id), organization);
  }

  const programMap = new Map<string, Record<string, any>>();
  for (const program of (programs || []) as Array<Record<string, any>>) {
    programMap.set(String(program.id), program);
  }

  return {
    awards: awardRows.map((award) => ({
      ...award,
      organization: organizationMap.get(String(award.organization_id)) || null,
      fundingProgram: programMap.get(String(award.funding_program_id)) || null,
    })),
    outcomeDefinitions: (outcomeDefinitions || []) as Array<Record<string, any>>,
  };
}

export async function listFundingOutcomeDefinitions(filters?: {
  includeInactive?: boolean;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters?.limit ?? 100));

  let query = serviceClient
    .from('community_outcome_definitions')
    .select('*')
    .order('name', { ascending: true })
    .limit(limit);

  if (!filters?.includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load outcome definitions');
  }

  return data || [];
}

export async function upsertFundingOutcomeDefinition(
  input: OutcomeDefinitionInput,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const outcomeDefinitionId = String(input.outcomeDefinitionId || '').trim();
  const name = String(input.name || '').trim();
  const outcomeDomain = String(input.outcomeDomain || '').trim().toLowerCase();
  const allowedDomains = new Set([
    'health',
    'housing',
    'education',
    'employment',
    'culture',
    'family',
    'community_safety',
    'self_determination',
    'system_accountability',
  ]);

  if (!name) {
    throw new Error('Validation: name is required');
  }

  if (!allowedDomains.has(outcomeDomain)) {
    throw new Error(
      'Validation: outcomeDomain must be health, housing, education, employment, culture, family, community_safety, self_determination, or system_accountability'
    );
  }

  const workflow = await createWorkflow(
    serviceClient,
    'community_report',
    'outcome',
    adminUserId,
    {
      outcomeDefinitionId: outcomeDefinitionId || null,
      name,
      outcomeDomain,
    }
  );

  const payload = {
    name,
    outcome_domain: outcomeDomain,
    unit: input.unit || null,
    description: input.description || null,
    baseline_method: input.baselineMethod || null,
    community_defined:
      typeof input.communityDefined === 'boolean' ? input.communityDefined : true,
    first_nations_data_sensitive:
      typeof input.firstNationsDataSensitive === 'boolean'
        ? input.firstNationsDataSensitive
        : false,
    is_active: typeof input.isActive === 'boolean' ? input.isActive : true,
    metadata:
      input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    updated_at: new Date().toISOString(),
  };

  let savedDefinition: Record<string, any> | null = null;

  if (outcomeDefinitionId) {
    const { data, error } = await serviceClient
      .from('community_outcome_definitions')
      .update(payload)
      .eq('id', outcomeDefinitionId)
      .select('id')
      .maybeSingle();

    if (error) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: error.message, outcomeDefinitionId },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error(error.message || 'Failed to update outcome definition');
    }

    if (!data) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: 'Outcome definition not found', outcomeDefinitionId },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error('Validation: Outcome definition not found');
    }

    savedDefinition = data;
  } else {
    const { data, error } = await serviceClient
      .from('community_outcome_definitions')
      .insert([payload])
      .select('id')
      .single();

    if (error) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: error.message, name, outcomeDomain },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error(error.message || 'Failed to create outcome definition');
    }

    savedDefinition = data;
  }

  const result = {
    workflowId: workflow.id,
    outcomeDefinitionId: String(savedDefinition?.id || outcomeDefinitionId),
    mode: outcomeDefinitionId ? 'updated' : 'created',
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return result;
}

export async function archiveFundingOutcomeDefinition(
  outcomeDefinitionId: string,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(outcomeDefinitionId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: outcomeDefinitionId is required');
  }

  const workflow = await createWorkflow(
    serviceClient,
    'community_report',
    'outcome',
    adminUserId,
    { outcomeDefinitionId: normalizedId, action: 'archive' }
  );

  const { data, error } = await serviceClient
    .from('community_outcome_definitions')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', normalizedId)
    .select('id')
    .maybeSingle();

  if (error) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: error.message, outcomeDefinitionId: normalizedId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(error.message || 'Failed to archive outcome definition');
  }

  if (!data) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: 'Outcome definition not found', outcomeDefinitionId: normalizedId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error('Validation: Outcome definition not found');
  }

  const result = {
    workflowId: workflow.id,
    outcomeDefinitionId: normalizedId,
    mode: 'archived',
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return result;
}

export async function listFundingSpendingTransactions(filters?: {
  status?: string;
  fundingProgramId?: string;
  organizationId?: string;
  sourceReferenceQuery?: string;
  jurisdictionQuery?: string;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters?.limit ?? 100));

  let query = serviceClient
    .from('public_spending_transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (filters?.status) {
    query = query.eq('transaction_status', filters.status);
  }

  if (filters?.fundingProgramId) {
    query = query.eq('funding_program_id', filters.fundingProgramId);
  }

  if (filters?.organizationId) {
    query = query.eq('organization_id', filters.organizationId);
  }

  if (filters?.sourceReferenceQuery) {
    query = query.ilike('source_reference', `%${filters.sourceReferenceQuery}%`);
  }

  if (filters?.jurisdictionQuery) {
    query = query.ilike('jurisdiction', `%${filters.jurisdictionQuery}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load spending transactions');
  }

  const rows = (data || []) as Array<Record<string, any>>;
  if (rows.length === 0) {
    return [];
  }

  const programIds = uniqueStrings(rows.map((row) => row.funding_program_id));
  const organizationIds = uniqueStrings(rows.map((row) => row.organization_id));
  const opportunityIds = uniqueStrings(rows.map((row) => row.opportunity_id));

  const [
    { data: programs, error: programError },
    { data: organizations, error: organizationError },
    { data: opportunities, error: opportunityError },
    { data: awards, error: awardError },
  ] = await Promise.all([
    programIds.length > 0
      ? serviceClient
          .from('funding_programs')
          .select('id, name, status')
          .in('id', programIds)
      : Promise.resolve({ data: [], error: null }),
    organizationIds.length > 0
      ? serviceClient
          .from('organizations')
          .select('id, name, city, state')
          .in('id', organizationIds)
      : Promise.resolve({ data: [], error: null }),
    opportunityIds.length > 0
      ? serviceClient
          .from('alma_funding_opportunities')
          .select('id, name, funder_name')
          .in('id', opportunityIds)
      : Promise.resolve({ data: [], error: null }),
    programIds.length > 0 && organizationIds.length > 0
      ? serviceClient
          .from('funding_awards')
          .select('id, funding_program_id, organization_id, award_status, updated_at')
          .in('funding_program_id', programIds)
          .in('organization_id', organizationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (programError) {
    throw new Error(programError.message || 'Failed to load funding programs');
  }

  if (organizationError) {
    throw new Error(organizationError.message || 'Failed to load organizations');
  }

  if (opportunityError) {
    throw new Error(opportunityError.message || 'Failed to load funding opportunities');
  }

  if (awardError) {
    throw new Error(awardError.message || 'Failed to load related funding awards');
  }

  const programMap = new Map<string, Record<string, any>>();
  for (const program of (programs || []) as Array<Record<string, any>>) {
    programMap.set(String(program.id), program);
  }

  const organizationMap = new Map<string, Record<string, any>>();
  for (const organization of (organizations || []) as Array<Record<string, any>>) {
    organizationMap.set(String(organization.id), organization);
  }

  const opportunityMap = new Map<string, Record<string, any>>();
  for (const opportunity of (opportunities || []) as Array<Record<string, any>>) {
    opportunityMap.set(String(opportunity.id), opportunity);
  }

  const relatedAwardMap = new Map<string, Record<string, any>>();
  const awardRows = (awards || []) as Array<Record<string, any>>;
  for (const award of awardRows) {
    const key = `${award.funding_program_id}:${award.organization_id}`;
    const existing = relatedAwardMap.get(key);
    if (
      !existing ||
      new Date(existing.updated_at || 0).getTime() < new Date(award.updated_at || 0).getTime()
    ) {
      relatedAwardMap.set(key, award);
    }
  }

  const awardIds = uniqueStrings(
    Array.from(relatedAwardMap.values()).map((award) => award.id)
  );
  let commitmentsByAwardId = new Map<string, Array<Record<string, any>>>();

  if (awardIds.length > 0) {
    const { data: commitments, error: commitmentError } = await serviceClient
      .from('funding_outcome_commitments')
      .select('id, funding_award_id, updated_at')
      .in('funding_award_id', awardIds)
      .order('updated_at', { ascending: false });

    if (commitmentError) {
      throw new Error(commitmentError.message || 'Failed to load related outcome commitments');
    }

    commitmentsByAwardId = new Map<string, Array<Record<string, any>>>();
    for (const commitment of (commitments || []) as Array<Record<string, any>>) {
      const key = String(commitment.funding_award_id);
      const bucket = commitmentsByAwardId.get(key) || [];
      bucket.push(commitment);
      commitmentsByAwardId.set(key, bucket);
    }
  }

  return rows.map((row) => {
    const relatedAward = row.organization_id
      ? relatedAwardMap.get(`${row.funding_program_id}:${row.organization_id}`) || null
      : null;
    const relatedCommitments = relatedAward
      ? commitmentsByAwardId.get(String(relatedAward.id)) || []
      : [];

    return {
      ...row,
      fundingProgram: programMap.get(String(row.funding_program_id)) || null,
      organization: row.organization_id
        ? organizationMap.get(String(row.organization_id)) || null
        : null,
      opportunity: row.opportunity_id
        ? opportunityMap.get(String(row.opportunity_id)) || null
        : null,
      relatedAward,
      primaryCommitmentId:
        relatedCommitments.length > 0 ? String(relatedCommitments[0].id) : null,
      commitmentCount: relatedCommitments.length,
    };
  });
}

export async function listFundingSpendingReferenceData(filters?: {
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters?.limit ?? 100));

  const [
    { data: programs, error: programError },
    { data: organizations, error: organizationError },
    { data: opportunities, error: opportunityError },
  ] = await Promise.all([
    serviceClient
      .from('funding_programs')
      .select('id, name, status')
      .order('name', { ascending: true })
      .limit(limit),
    serviceClient
      .from('organizations')
      .select('id, name, city, state')
      .order('name', { ascending: true })
      .limit(limit),
    serviceClient
      .from('alma_funding_opportunities')
      .select('id, name, funder_name')
      .order('name', { ascending: true })
      .limit(limit),
  ]);

  if (programError) {
    throw new Error(programError.message || 'Failed to load funding programs');
  }

  if (organizationError) {
    throw new Error(organizationError.message || 'Failed to load organizations');
  }

  if (opportunityError) {
    throw new Error(opportunityError.message || 'Failed to load funding opportunities');
  }

  return {
    fundingPrograms: (programs || []) as Array<Record<string, any>>,
    organizations: (organizations || []) as Array<Record<string, any>>,
    opportunities: (opportunities || []) as Array<Record<string, any>>,
  };
}

export async function upsertFundingSpendingTransaction(
  input: SpendingTransactionInput,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const transactionId = String(input.transactionId || '').trim();
  const fundingProgramId = String(input.fundingProgramId || '').trim();
  const transactionType = String(input.transactionType || '').trim().toLowerCase();
  const transactionStatus = String(input.transactionStatus || 'planned').trim().toLowerCase();
  const allowedTypes = new Set([
    'appropriation',
    'allocation',
    'contract',
    'grant_payment',
    'milestone_payment',
    'clawback',
    'reconciliation',
  ]);
  const allowedStatuses = new Set([
    'planned',
    'committed',
    'disbursed',
    'reconciled',
    'cancelled',
  ]);

  if (!fundingProgramId) {
    throw new Error('Validation: fundingProgramId is required');
  }

  if (!allowedTypes.has(transactionType)) {
    throw new Error(
      'Validation: transactionType must be appropriation, allocation, contract, grant_payment, milestone_payment, clawback, or reconciliation'
    );
  }

  if (!allowedStatuses.has(transactionStatus)) {
    throw new Error(
      'Validation: transactionStatus must be planned, committed, disbursed, reconciled, or cancelled'
    );
  }

  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error('Validation: amount must be a non-negative number');
  }

  const workflow = await createWorkflow(
    serviceClient,
    'award_reconciliation',
    'award',
    adminUserId,
    {
      transactionId: transactionId || null,
      fundingProgramId,
      transactionType,
      transactionStatus,
      amount: input.amount,
    }
  );

  const payload = {
    funding_program_id: fundingProgramId,
    opportunity_id: input.opportunityId ? String(input.opportunityId).trim() : null,
    organization_id: input.organizationId ? String(input.organizationId).trim() : null,
    transaction_type: transactionType,
    transaction_status: transactionStatus,
    amount: input.amount,
    currency: input.currency || 'AUD',
    transaction_date: input.transactionDate || new Date().toISOString(),
    period_start: input.periodStart ? String(input.periodStart).slice(0, 10) : null,
    period_end: input.periodEnd ? String(input.periodEnd).slice(0, 10) : null,
    jurisdiction: input.jurisdiction || null,
    source_reference: input.sourceReference || null,
    description: input.description || null,
    entered_by_user_id: adminUserId,
    community_visible:
      typeof input.communityVisible === 'boolean' ? input.communityVisible : true,
    metadata:
      input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    updated_at: new Date().toISOString(),
  };

  let savedTransaction: Record<string, any> | null = null;

  if (transactionId) {
    const { data, error } = await serviceClient
      .from('public_spending_transactions')
      .update(payload)
      .eq('id', transactionId)
      .select('id')
      .maybeSingle();

    if (error) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: error.message, transactionId },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error(error.message || 'Failed to update spending transaction');
    }

    if (!data) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: 'Spending transaction not found', transactionId },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error('Validation: Spending transaction not found');
    }

    savedTransaction = data;
  } else {
    const { data, error } = await serviceClient
      .from('public_spending_transactions')
      .insert([payload])
      .select('id')
      .single();

    if (error) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: error.message, fundingProgramId },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error(error.message || 'Failed to create spending transaction');
    }

    savedTransaction = data;
  }

  const result = {
    workflowId: workflow.id,
    transactionId: String(savedTransaction?.id || transactionId),
    mode: transactionId ? 'updated' : 'created',
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return result;
}

export async function updateFundingSpendingTransactionStatus(
  transactionId: string,
  nextStatus:
    | 'planned'
    | 'committed'
    | 'disbursed'
    | 'reconciled'
    | 'cancelled',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(transactionId || '').trim();
  const normalizedStatus = String(nextStatus || '').trim().toLowerCase();
  const allowedStatuses = new Set([
    'planned',
    'committed',
    'disbursed',
    'reconciled',
    'cancelled',
  ]);

  if (!normalizedId) {
    throw new Error('Validation: transactionId is required');
  }

  if (!allowedStatuses.has(normalizedStatus)) {
    throw new Error(
      'Validation: status must be planned, committed, disbursed, reconciled, or cancelled'
    );
  }

  const workflow = await createWorkflow(
    serviceClient,
    'award_reconciliation',
    'award',
    adminUserId,
    { transactionId: normalizedId, nextStatus: normalizedStatus }
  );

  const { data, error } = await serviceClient
    .from('public_spending_transactions')
    .update({
      transaction_status: normalizedStatus,
      updated_at: new Date().toISOString(),
      entered_by_user_id: adminUserId,
    })
    .eq('id', normalizedId)
    .select('id')
    .maybeSingle();

  if (error) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: error.message, transactionId: normalizedId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(error.message || 'Failed to update spending transaction status');
  }

  if (!data) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: 'Spending transaction not found', transactionId: normalizedId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error('Validation: Spending transaction not found');
  }

  const result = {
    workflowId: workflow.id,
    transactionId: normalizedId,
    transactionStatus: normalizedStatus,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return result;
}

export async function getFundingAwardAccountabilityDetail(fundingAwardId: string) {
  const serviceClient = getServiceClient();
  const normalizedId = String(fundingAwardId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: fundingAwardId is required');
  }

  const { data: award, error: awardError } = await serviceClient
    .from('funding_awards')
    .select(
      'id, funding_program_id, organization_id, award_status, award_type, amount_awarded, amount_disbursed, community_report_due_at, outcome_summary, public_summary, updated_at'
    )
    .eq('id', normalizedId)
    .maybeSingle();

  if (awardError) {
    throw new Error(awardError.message || 'Failed to load funding award');
  }

  if (!award) {
    throw new Error('Validation: Funding award not found');
  }

  const [
    { data: program, error: programError },
    { data: organization, error: organizationError },
    { data: commitments, error: commitmentError },
    { data: transactions, error: transactionError },
  ] = await Promise.all([
    serviceClient
      .from('funding_programs')
      .select('id, funding_source_id, name, status')
      .eq('id', award.funding_program_id)
      .maybeSingle(),
    serviceClient
      .from('organizations')
      .select('id, name, slug, city, state')
      .eq('id', award.organization_id)
      .maybeSingle(),
    serviceClient
      .from('funding_outcome_commitments')
      .select('*')
      .eq('funding_award_id', normalizedId)
      .order('updated_at', { ascending: false }),
    serviceClient
      .from('public_spending_transactions')
      .select('id, transaction_type, transaction_status, amount, currency, transaction_date, description')
      .eq('funding_program_id', award.funding_program_id)
      .or(`organization_id.eq.${award.organization_id},organization_id.is.null`)
      .in('transaction_status', ['committed', 'disbursed', 'reconciled'])
      .order('transaction_date', { ascending: false })
      .limit(50),
  ]);

  if (programError) {
    throw new Error(programError.message || 'Failed to load funding program');
  }

  if (organizationError) {
    throw new Error(organizationError.message || 'Failed to load organization');
  }

  if (commitmentError) {
    throw new Error(commitmentError.message || 'Failed to load outcome commitments');
  }

  if (transactionError) {
    throw new Error(transactionError.message || 'Failed to load spending transactions');
  }

  let source: Record<string, any> | null = null;
  if (program?.funding_source_id) {
    const { data: sourceData, error: sourceError } = await serviceClient
      .from('funding_sources')
      .select('id, name, source_kind')
      .eq('id', program.funding_source_id)
      .maybeSingle();

    if (sourceError) {
      throw new Error(sourceError.message || 'Failed to load funding source');
    }

    source = (sourceData as Record<string, any> | null) || null;
  }

  const commitmentRows = (commitments || []) as Array<Record<string, any>>;
  const outcomeDefinitionIds = uniqueStrings(
    commitmentRows.map((commitment) => commitment.outcome_definition_id)
  );
  const commitmentIds = uniqueStrings(commitmentRows.map((commitment) => commitment.id));

  const [
    { data: outcomeDefinitions, error: outcomeDefinitionError },
    { data: updates, error: updateError },
  ] = await Promise.all([
    outcomeDefinitionIds.length > 0
      ? serviceClient
          .from('community_outcome_definitions')
          .select('id, name, outcome_domain, unit, description')
          .in('id', outcomeDefinitionIds)
      : Promise.resolve({ data: [], error: null }),
    commitmentIds.length > 0
      ? serviceClient
          .from('funding_outcome_updates')
          .select('*')
          .in('commitment_id', commitmentIds)
          .order('reported_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (outcomeDefinitionError) {
    throw new Error(outcomeDefinitionError.message || 'Failed to load outcome definitions');
  }

  if (updateError) {
    throw new Error(updateError.message || 'Failed to load outcome updates');
  }

  const outcomeDefinitionMap = new Map<string, Record<string, any>>();
  for (const definition of (outcomeDefinitions || []) as Array<Record<string, any>>) {
    outcomeDefinitionMap.set(String(definition.id), definition);
  }

  const updateRows = (updates || []) as Array<Record<string, any>>;
  const updateIds = uniqueStrings(updateRows.map((update) => update.id));
  let validationRows: Array<Record<string, any>> = [];

  if (updateIds.length > 0) {
    const { data: validations, error: validationError } = await serviceClient
      .from('community_outcome_validations')
      .select('*')
      .in('update_id', updateIds)
      .order('validated_at', { ascending: false });

    if (validationError) {
      throw new Error(validationError.message || 'Failed to load community validations');
    }

    validationRows = (validations || []) as Array<Record<string, any>>;
  }

  const validationsByUpdateId = new Map<string, Array<Record<string, any>>>();
  for (const validation of validationRows) {
    const updateId = String(validation.update_id);
    const bucket = validationsByUpdateId.get(updateId) || [];
    bucket.push(validation);
    validationsByUpdateId.set(updateId, bucket);
  }

  const updatesByCommitmentId = new Map<string, Array<Record<string, any>>>();
  for (const update of updateRows) {
    const commitmentId = String(update.commitment_id);
    const bucket = updatesByCommitmentId.get(commitmentId) || [];
    bucket.push({
      ...update,
      validations: validationsByUpdateId.get(String(update.id)) || [],
    });
    updatesByCommitmentId.set(commitmentId, bucket);
  }

  const commitmentDetails = commitmentRows.map((commitment) => ({
    ...commitment,
    outcomeDefinition:
      outcomeDefinitionMap.get(String(commitment.outcome_definition_id)) || null,
    updates: updatesByCommitmentId.get(String(commitment.id)) || [],
  }));

  return {
    award: {
      ...award,
      organization: (organization as Record<string, any> | null) || null,
      fundingProgram: (program as Record<string, any> | null) || null,
      fundingSource: source,
    },
    commitments: commitmentDetails,
    transactions: (transactions || []) as Array<Record<string, any>>,
  };
}

export async function getFundingOutcomeCommitmentDetail(commitmentId: string) {
  const serviceClient = getServiceClient();
  const normalizedId = String(commitmentId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: commitmentId is required');
  }

  const { data: commitment, error } = await serviceClient
    .from('funding_outcome_commitments')
    .select('id, funding_award_id')
    .eq('id', normalizedId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load outcome commitment');
  }

  if (!commitment) {
    throw new Error('Validation: Outcome commitment not found');
  }

  const awardDetail = await getFundingAwardAccountabilityDetail(
    String(commitment.funding_award_id)
  );
  const commitmentDetail =
    (awardDetail.commitments as Array<Record<string, any>>).find(
      (row) => String(row.id) === normalizedId
    ) || null;

  if (!commitmentDetail) {
    throw new Error('Validation: Outcome commitment not found');
  }

  return {
    award: awardDetail.award,
    commitment: commitmentDetail,
    transactions: awardDetail.transactions,
  };
}

export async function upsertFundingOutcomeCommitment(
  input: OutcomeCommitmentInput,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const commitmentId = String(input.commitmentId || '').trim();
  const fundingAwardId = String(input.fundingAwardId || '').trim();
  const outcomeDefinitionId = String(input.outcomeDefinitionId || '').trim();
  const normalizedStatus = String(input.commitmentStatus || 'draft').trim().toLowerCase();
  const allowedStatuses = new Set(['draft', 'active', 'completed', 'paused', 'cancelled']);

  if (!fundingAwardId) {
    throw new Error('Validation: fundingAwardId is required');
  }

  if (!outcomeDefinitionId) {
    throw new Error('Validation: outcomeDefinitionId is required');
  }

  if (!allowedStatuses.has(normalizedStatus)) {
    throw new Error('Validation: commitmentStatus must be draft, active, completed, paused, or cancelled');
  }

  const workflow = await createWorkflow(
    serviceClient,
    'community_report',
    'outcome',
    adminUserId,
    {
      commitmentId: commitmentId || null,
      fundingAwardId,
      outcomeDefinitionId,
      commitmentStatus: normalizedStatus,
    }
  );

  const { data: award, error: awardError } = await serviceClient
    .from('funding_awards')
    .select('id, organization_id')
    .eq('id', fundingAwardId)
    .maybeSingle();

  if (awardError) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: awardError.message, fundingAwardId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(awardError.message || 'Failed to load funding award');
  }

  if (!award) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: 'Funding award not found', fundingAwardId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error('Validation: Funding award not found');
  }

  const organizationId = String(input.organizationId || award.organization_id || '').trim();
  if (!organizationId) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: 'Organization not found for award', fundingAwardId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error('Validation: Organization not found for award');
  }

  const payload = {
    funding_award_id: fundingAwardId,
    organization_id: organizationId,
    outcome_definition_id: outcomeDefinitionId,
    commitment_status: normalizedStatus,
    baseline_value:
      typeof input.baselineValue === 'number' && Number.isFinite(input.baselineValue)
        ? input.baselineValue
        : null,
    target_value:
      typeof input.targetValue === 'number' && Number.isFinite(input.targetValue)
        ? input.targetValue
        : null,
    current_value:
      typeof input.currentValue === 'number' && Number.isFinite(input.currentValue)
        ? input.currentValue
        : null,
    target_date: input.targetDate ? String(input.targetDate).slice(0, 10) : null,
    measurement_notes: input.measurementNotes || null,
    evidence_confidence_score: Math.max(
      0,
      Math.min(100, Number(input.evidenceConfidenceScore ?? 0) || 0)
    ),
    community_priority_weight: Math.max(
      0,
      Math.min(100, Number(input.communityPriorityWeight ?? 50) || 50)
    ),
    metadata:
      input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    updated_at: new Date().toISOString(),
  };

  let savedCommitment: Record<string, any> | null = null;

  if (commitmentId) {
    const { data, error } = await serviceClient
      .from('funding_outcome_commitments')
      .update(payload)
      .eq('id', commitmentId)
      .select('id')
      .maybeSingle();

    if (error) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: error.message, commitmentId },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error(error.message || 'Failed to update outcome commitment');
    }

    if (!data) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: 'Outcome commitment not found', commitmentId },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error('Validation: Outcome commitment not found');
    }

    savedCommitment = data;
  } else {
    const { data: existingCommitment, error: existingError } = await serviceClient
      .from('funding_outcome_commitments')
      .select('id')
      .eq('funding_award_id', fundingAwardId)
      .eq('outcome_definition_id', outcomeDefinitionId)
      .maybeSingle();

    if (existingError) {
      await completeWorkflow(
        serviceClient,
        workflow.id,
        { error: existingError.message, fundingAwardId, outcomeDefinitionId },
        { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
      );
      throw new Error(existingError.message || 'Failed to check existing outcome commitment');
    }

    if (existingCommitment) {
      const { data, error } = await serviceClient
        .from('funding_outcome_commitments')
        .update(payload)
        .eq('id', existingCommitment.id)
        .select('id')
        .single();

      if (error) {
        await completeWorkflow(
          serviceClient,
          workflow.id,
          { error: error.message, commitmentId: existingCommitment.id },
          { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
        );
        throw new Error(error.message || 'Failed to update existing outcome commitment');
      }

      savedCommitment = data;
    } else {
      const { data, error } = await serviceClient
        .from('funding_outcome_commitments')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        await completeWorkflow(
          serviceClient,
          workflow.id,
          { error: error.message, fundingAwardId, outcomeDefinitionId },
          { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
        );
        throw new Error(error.message || 'Failed to create outcome commitment');
      }

      savedCommitment = data;
    }
  }

  const result = {
    workflowId: workflow.id,
    commitmentId: String(savedCommitment?.id || commitmentId),
    mode: commitmentId ? 'updated' : 'saved',
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return result;
}

export async function listFundingPipelineBoard(filters: {
  organizationId?: string;
  opportunityId?: string;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters.limit ?? 100));

  let recommendationQuery = serviceClient
    .from('funding_match_recommendations')
    .select('*')
    .order('match_score', { ascending: false })
    .limit(limit);

  if (filters.organizationId) {
    recommendationQuery = recommendationQuery.eq('organization_id', filters.organizationId);
  }

  if (filters.opportunityId) {
    recommendationQuery = recommendationQuery.eq('opportunity_id', filters.opportunityId);
  }

  const { data: recommendations, error: recommendationError } = await recommendationQuery;
  if (recommendationError) {
    throw new Error(recommendationError.message || 'Failed to load funding pipeline recommendations');
  }

  const recommendationRows = (recommendations || []) as Array<Record<string, any>>;
  if (recommendationRows.length === 0) {
    return [];
  }

  const opportunityIds = uniqueStrings(recommendationRows.map((row) => row.opportunity_id));
  const organizationIds = uniqueStrings(recommendationRows.map((row) => row.organization_id));

  const [
    { data: opportunities, error: opportunityError },
    { data: organizations, error: organizationError },
    { data: applications, error: applicationError },
    { data: awards, error: awardError },
  ] = await Promise.all([
    serviceClient
      .from('alma_funding_opportunities')
      .select('id, name, funder_name, deadline, status, max_grant_amount, min_grant_amount')
      .in('id', opportunityIds),
    serviceClient
      .from('organizations')
      .select('id, name, slug, city, state, partner_tier')
      .in('id', organizationIds),
    serviceClient
      .from('alma_funding_applications')
      .select('id, opportunity_id, organization_id, status, amount_requested, amount_awarded, submitted_at, outcome_at, created_at, updated_at')
      .in('opportunity_id', opportunityIds)
      .in('organization_id', organizationIds),
    serviceClient
      .from('funding_awards')
      .select('id, opportunity_id, organization_id, award_status, award_type, amount_awarded, amount_disbursed, created_at, updated_at, community_report_due_at')
      .in('opportunity_id', opportunityIds)
      .in('organization_id', organizationIds),
  ]);

  if (opportunityError) {
    throw new Error(opportunityError.message || 'Failed to load opportunity details');
  }

  if (organizationError) {
    throw new Error(organizationError.message || 'Failed to load organization details');
  }

  if (applicationError) {
    throw new Error(applicationError.message || 'Failed to load application details');
  }

  if (awardError) {
    throw new Error(awardError.message || 'Failed to load award details');
  }

  const opportunityMap = new Map<string, Record<string, any>>();
  for (const opportunity of (opportunities || []) as Array<Record<string, any>>) {
    opportunityMap.set(String(opportunity.id), opportunity);
  }

  const organizationMap = new Map<string, Record<string, any>>();
  for (const organization of (organizations || []) as Array<Record<string, any>>) {
    organizationMap.set(String(organization.id), organization);
  }

  const applicationMap = new Map<string, Record<string, any>>();
  for (const application of (applications || []) as Array<Record<string, any>>) {
    const key = `${application.opportunity_id}:${application.organization_id}`;
    const existing = applicationMap.get(key);
    if (!existing || new Date(existing.updated_at || existing.created_at || 0).getTime() < new Date(application.updated_at || application.created_at || 0).getTime()) {
      applicationMap.set(key, application);
    }
  }

  const awardMap = new Map<string, Record<string, any>>();
  for (const award of (awards || []) as Array<Record<string, any>>) {
    const key = `${award.opportunity_id}:${award.organization_id}`;
    const existing = awardMap.get(key);
    if (!existing || new Date(existing.updated_at || existing.created_at || 0).getTime() < new Date(award.updated_at || award.created_at || 0).getTime()) {
      awardMap.set(key, award);
    }
  }

  const stageOrder: Record<string, number> = {
    award_live: 1,
    application_live: 2,
    recommendation_engaged: 3,
    recommendation_candidate: 4,
  };
  const finalAwardStatuses = new Set([
    'awarded',
    'contracted',
    'active',
    'disbursing',
    'disbursed',
    'completed',
    'closed',
  ]);

  const rows = recommendationRows.map((recommendation) => {
    const key = `${recommendation.opportunity_id}:${recommendation.organization_id}`;
    const application = applicationMap.get(key) || null;
    const award = awardMap.get(key) || null;
    const opportunity = opportunityMap.get(String(recommendation.opportunity_id)) || null;
    const organization = organizationMap.get(String(recommendation.organization_id)) || null;

    let pipelineStage = 'recommendation_candidate';
    if (award && finalAwardStatuses.has(String(award.award_status || '').toLowerCase())) {
      pipelineStage = 'award_live';
    } else if (application || award) {
      pipelineStage = 'application_live';
    } else if (recommendation.recommendation_status === 'engaged') {
      pipelineStage = 'recommendation_engaged';
    }

    return {
      recommendation,
      application,
      award,
      opportunity,
      organization,
      pipelineStage,
      stageSort: stageOrder[pipelineStage] || 99,
      updatedAt:
        award?.updated_at ||
        application?.updated_at ||
        recommendation.updated_at ||
        recommendation.created_at,
    };
  });

  rows.sort((a, b) => {
    if (a.stageSort !== b.stageSort) {
      return a.stageSort - b.stageSort;
    }
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });

  return rows;
}

export async function listCapabilityProfiles(filters: {
  organizationId?: string;
  includeSignals?: boolean;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(200, filters.limit ?? 50));

  let query = serviceClient
    .from('organization_capability_profiles')
    .select('*')
    .order('community_trust_score', { ascending: false })
    .limit(limit);

  if (filters.organizationId) {
    query = query.eq('organization_id', filters.organizationId);
  }

  const { data: profiles, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to list capability profiles');
  }

  const profileRows = (profiles || []) as Array<Record<string, any>>;
  if (profileRows.length === 0) {
    return [];
  }

  const organizationIds = profileRows
    .map((profile) => String(profile.organization_id || '').trim())
    .filter(Boolean);

  const { data: orgs } = await serviceClient
    .from('organizations')
    .select('id, name, slug, type, state, city')
    .in('id', organizationIds);

  const orgMap = new Map<string, Record<string, any>>();
  for (const org of (orgs || []) as Array<Record<string, any>>) {
    orgMap.set(String(org.id), org);
  }

  const signalsByProfileId = new Map<string, Array<Record<string, any>>>();

  if (filters.includeSignals !== false) {
    const profileIds = profileRows.map((profile) => String(profile.id));
    const { data: signals } = await serviceClient
      .from('organization_capability_signals')
      .select('*')
      .in('capability_profile_id', profileIds)
      .order('recorded_at', { ascending: false });

    for (const signal of (signals || []) as Array<Record<string, any>>) {
      const profileId = String(signal.capability_profile_id);
      const list = signalsByProfileId.get(profileId) || [];
      list.push(signal);
      signalsByProfileId.set(profileId, list);
    }
  }

  return profileRows.map((profile) => ({
    ...profile,
    organization: orgMap.get(String(profile.organization_id)) || null,
    signals: signalsByProfileId.get(String(profile.id)) || [],
  }));
}

export async function listFundingDiscoveryOrganizations(filters?: {
  q?: string;
  state?: string;
  capabilityTag?: string;
  firstNationsLed?: boolean;
  minReadiness?: number;
  minTrust?: number;
  limit?: number;
}) {
  const serviceClient = getServiceClient();
  const requestedLimit = Math.max(1, Math.min(60, filters?.limit ?? 24));
  const fetchLimit = Math.max(requestedLimit * 3, requestedLimit);

  let query = serviceClient
    .from('organization_capability_profiles')
    .select(
      'id, organization_id, service_geographies, priority_populations, capability_tags, operating_models, lived_experience_led, first_nations_led, funding_readiness_score, compliance_readiness_score, delivery_confidence_score, community_trust_score, evidence_maturity_score, reporting_to_community_score, can_manage_government_contracts, can_manage_philanthropic_grants, capability_notes, updated_at'
    )
    .order('community_trust_score', { ascending: false })
    .limit(fetchLimit);

  if (typeof filters?.minReadiness === 'number') {
    query = query.gte('funding_readiness_score', filters.minReadiness);
  }

  if (typeof filters?.minTrust === 'number') {
    query = query.gte('community_trust_score', filters.minTrust);
  }

  if (filters?.firstNationsLed === true) {
    query = query.eq('first_nations_led', true);
  }

  const { data: profiles, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load funder discovery organizations');
  }

  const profileRows = (profiles || []) as Array<Record<string, any>>;
  if (profileRows.length === 0) {
    return [];
  }

  const organizationIds = uniqueStrings(profileRows.map((profile) => profile.organization_id));
  const { data: organizations, error: organizationsError } = await serviceClient
    .from('organizations')
    .select('id, name, slug, type, state, city, description')
    .in('id', organizationIds);

  if (organizationsError) {
    throw new Error(organizationsError.message || 'Failed to load organizations for funder discovery');
  }

  const organizationMap = new Map<string, Record<string, any>>();
  for (const organization of (organizations || []) as Array<Record<string, any>>) {
    organizationMap.set(String(organization.id), organization);
  }

  type HydratedDiscoveryProfile = Record<string, any> & {
    organization: Record<string, any>;
  };

  let hydrated: HydratedDiscoveryProfile[] = profileRows
    .map((profile) => ({
      ...profile,
      organization: organizationMap.get(String(profile.organization_id)) || null,
    }))
    .filter(
      (profile): profile is HydratedDiscoveryProfile => Boolean(profile.organization)
    );

  if (filters?.q) {
    const q = filters.q.toLowerCase().trim();
    hydrated = hydrated.filter((profile) => {
      const organization = profile.organization || {};
      const haystack = [
        organization.name,
        organization.slug,
        organization.type,
        organization.state,
        organization.city,
        organization.description,
        ...(Array.isArray(profile.capability_tags) ? profile.capability_tags : []),
        ...(Array.isArray(profile.service_geographies) ? profile.service_geographies : []),
        ...(Array.isArray(profile.priority_populations) ? profile.priority_populations : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  if (filters?.state) {
    const expectedState = filters.state.toLowerCase().trim();
    hydrated = hydrated.filter((profile) => {
      const organizationState = String(profile.organization?.state || '').toLowerCase().trim();
      const geographies = asArray(profile.service_geographies).map((item) => item.toLowerCase().trim());
      return organizationState === expectedState || geographies.includes(expectedState);
    });
  }

  if (filters?.capabilityTag) {
    const expectedTag = filters.capabilityTag.toLowerCase().trim();
    hydrated = hydrated.filter((profile) =>
      asArray(profile.capability_tags)
        .map((item) => item.toLowerCase().trim())
        .includes(expectedTag)
    );
  }

  if (hydrated.length === 0) {
    return [];
  }

  const filteredOrganizationIds = uniqueStrings(hydrated.map((profile) => profile.organization_id));
  const { data: recommendations, error: recommendationsError } = await serviceClient
    .from('funding_match_recommendations')
    .select(
      'organization_id, opportunity_id, match_score, recommendation_status, readiness_score, community_alignment_score, geographic_fit_score'
    )
    .in('organization_id', filteredOrganizationIds)
    .order('match_score', { ascending: false })
    .limit(Math.max(filteredOrganizationIds.length * 8, requestedLimit * 8));

  if (recommendationsError) {
    throw new Error(
      recommendationsError.message || 'Failed to load funding recommendations for discovery'
    );
  }

  const recommendationRows = (recommendations || []) as Array<Record<string, any>>;
  const opportunityIds = uniqueStrings(recommendationRows.map((row) => row.opportunity_id));
  const opportunityMap = new Map<string, Record<string, any>>();

  if (opportunityIds.length > 0) {
    const { data: opportunities, error: opportunitiesError } = await serviceClient
      .from('alma_funding_opportunities')
      .select('id, name, funder_name, source_type, deadline, status, max_grant_amount')
      .in('id', opportunityIds);

    if (opportunitiesError) {
      throw new Error(
        opportunitiesError.message || 'Failed to load opportunities for funder discovery'
      );
    }

    for (const opportunity of (opportunities || []) as Array<Record<string, any>>) {
      opportunityMap.set(String(opportunity.id), opportunity);
    }
  }

  const recommendationsByOrganizationId = new Map<string, Array<Record<string, any>>>();
  for (const recommendation of recommendationRows) {
    const organizationId = String(recommendation.organization_id || '').trim();
    if (!organizationId) continue;
    const list = recommendationsByOrganizationId.get(organizationId) || [];
    list.push(recommendation);
    recommendationsByOrganizationId.set(organizationId, list);
  }

  return hydrated.slice(0, requestedLimit).map((profile) => {
    const orgRecommendations = recommendationsByOrganizationId.get(String(profile.organization_id)) || [];
    const topMatches = orgRecommendations.slice(0, 3).map((recommendation) => ({
      id: String(recommendation.opportunity_id || ''),
      matchScore:
        typeof recommendation.match_score === 'number' ? recommendation.match_score : 0,
      status:
        typeof recommendation.recommendation_status === 'string'
          ? recommendation.recommendation_status
          : 'candidate',
      opportunity: opportunityMap.get(String(recommendation.opportunity_id)) || null,
    }));

    return {
      id: String(profile.id),
      organizationId: String(profile.organization_id),
      organization: profile.organization,
      capabilityTags: asArray(profile.capability_tags),
      serviceGeographies: asArray(profile.service_geographies),
      priorityPopulations: asArray(profile.priority_populations),
      operatingModels: asArray(profile.operating_models),
      firstNationsLed: profile.first_nations_led === true,
      livedExperienceLed: profile.lived_experience_led === true,
      fundingReadinessScore: clampScore(profile.funding_readiness_score),
      complianceReadinessScore: clampScore(profile.compliance_readiness_score),
      deliveryConfidenceScore: clampScore(profile.delivery_confidence_score),
      communityTrustScore: clampScore(profile.community_trust_score),
      evidenceMaturityScore: clampScore(profile.evidence_maturity_score),
      reportingToCommunityScore: clampScore(profile.reporting_to_community_score),
      canManageGovernmentContracts: profile.can_manage_government_contracts === true,
      canManagePhilanthropicGrants: profile.can_manage_philanthropic_grants !== false,
      capabilityNotes:
        typeof profile.capability_notes === 'string' ? profile.capability_notes : null,
      updatedAt: profile.updated_at || null,
      topMatches,
      topMatchCount: orgRecommendations.length,
      strongestMatchScore: topMatches[0]?.matchScore || 0,
    };
  });
}

export async function getFundingDiscoveryOrganizationDetail(organizationId: string) {
  const normalizedOrganizationId = String(organizationId || '').trim();
  if (!normalizedOrganizationId) {
    return null;
  }

  const serviceClient = getServiceClient();
  const { data: profile, error: profileError } = await serviceClient
    .from('organization_capability_profiles')
    .select(
      'id, organization_id, service_geographies, priority_populations, capability_tags, operating_models, lived_experience_led, first_nations_led, funding_readiness_score, compliance_readiness_score, delivery_confidence_score, community_trust_score, evidence_maturity_score, reporting_to_community_score, can_manage_government_contracts, can_manage_philanthropic_grants, capability_notes, updated_at'
    )
    .eq('organization_id', normalizedOrganizationId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message || 'Failed to load organization capability profile');
  }

  const profileRow = (profile || null) as Record<string, any> | null;
  if (!profileRow) {
    return null;
  }

  const { data: organization, error: organizationError } = await serviceClient
    .from('organizations')
    .select('id, name, slug, type, state, city, description')
    .eq('id', normalizedOrganizationId)
    .maybeSingle();

  if (organizationError) {
    throw new Error(organizationError.message || 'Failed to load organization for funder discovery');
  }

  const organizationRow = (organization || null) as Record<string, any> | null;
  if (!organizationRow) {
    return null;
  }

  const { data: signals, error: signalsError } = await serviceClient
    .from('organization_capability_signals')
    .select(
      'id, capability_profile_id, signal_type, signal_name, signal_score, signal_weight, source_kind, evidence_url, evidence_note, recorded_at, expires_at, updated_at'
    )
    .eq('capability_profile_id', String(profileRow.id))
    .order('signal_weight', { ascending: false })
    .limit(12);

  if (signalsError) {
    throw new Error(signalsError.message || 'Failed to load capability signals for funder discovery');
  }

  const { data: recommendations, error: recommendationsError } = await serviceClient
    .from('funding_match_recommendations')
    .select(
      'id, organization_id, opportunity_id, match_score, recommendation_status, readiness_score, community_alignment_score, geographic_fit_score, updated_at'
    )
    .eq('organization_id', normalizedOrganizationId)
    .order('match_score', { ascending: false })
    .limit(8);

  if (recommendationsError) {
    throw new Error(
      recommendationsError.message || 'Failed to load funding recommendations for funder discovery'
    );
  }

  const recommendationRows = (recommendations || []) as Array<Record<string, any>>;
  const opportunityIds = uniqueStrings(recommendationRows.map((row) => row.opportunity_id));
  const opportunityMap = new Map<string, Record<string, any>>();

  if (opportunityIds.length > 0) {
    const { data: opportunities, error: opportunitiesError } = await serviceClient
      .from('alma_funding_opportunities')
      .select('id, name, funder_name, source_type, deadline, status, max_grant_amount')
      .in('id', opportunityIds);

    if (opportunitiesError) {
      throw new Error(
        opportunitiesError.message || 'Failed to load opportunities for funder discovery'
      );
    }

    for (const opportunity of (opportunities || []) as Array<Record<string, any>>) {
      opportunityMap.set(String(opportunity.id), opportunity);
    }
  }

  const { data: awards, error: awardsError } = await serviceClient
    .from('funding_awards')
    .select(
      'id, funding_program_id, award_status, amount_awarded, amount_disbursed, community_report_due_at, updated_at'
    )
    .eq('organization_id', normalizedOrganizationId)
    .order('updated_at', { ascending: false })
    .limit(6);

  if (awardsError) {
    throw new Error(awardsError.message || 'Failed to load funding awards for funder discovery');
  }

  const awardRows = (awards || []) as Array<Record<string, any>>;
  const fundingProgramIds = uniqueStrings(awardRows.map((award) => award.funding_program_id));
  const fundingProgramMap = new Map<string, Record<string, any>>();
  const fundingSourceMap = new Map<string, Record<string, any>>();

  if (fundingProgramIds.length > 0) {
    const { data: fundingPrograms, error: fundingProgramsError } = await serviceClient
      .from('funding_programs')
      .select('id, funding_source_id, name')
      .in('id', fundingProgramIds);

    if (fundingProgramsError) {
      throw new Error(
        fundingProgramsError.message || 'Failed to load funding programs for funder discovery'
      );
    }

    for (const fundingProgram of (fundingPrograms || []) as Array<Record<string, any>>) {
      fundingProgramMap.set(String(fundingProgram.id), {
        ...fundingProgram,
        title:
          typeof fundingProgram.name === 'string'
            ? fundingProgram.name
            : fundingProgram.title || null,
      });
    }

    const fundingSourceIds = uniqueStrings(
      ((fundingPrograms || []) as Array<Record<string, any>>).map(
        (fundingProgram) => fundingProgram.funding_source_id
      )
    );

    if (fundingSourceIds.length > 0) {
      const { data: fundingSources, error: fundingSourcesError } = await serviceClient
        .from('funding_sources')
        .select('id, name, source_type')
        .in('id', fundingSourceIds);

      if (fundingSourcesError) {
        throw new Error(
          fundingSourcesError.message || 'Failed to load funding sources for funder discovery'
        );
      }

      for (const fundingSource of (fundingSources || []) as Array<Record<string, any>>) {
        fundingSourceMap.set(String(fundingSource.id), {
          ...fundingSource,
          source_kind:
            typeof fundingSource.source_type === 'string'
              ? fundingSource.source_type
              : fundingSource.source_kind || null,
        });
      }
    }
  }

  const hydratedMatches = recommendationRows.map((recommendation) => ({
    id: String(recommendation.opportunity_id || ''),
    recommendationId: String(recommendation.id || ''),
    matchScore:
      typeof recommendation.match_score === 'number' ? recommendation.match_score : 0,
    status:
      typeof recommendation.recommendation_status === 'string'
        ? recommendation.recommendation_status
        : 'candidate',
    readinessScore: clampScore(recommendation.readiness_score),
    communityAlignmentScore: clampScore(recommendation.community_alignment_score),
    geographicFitScore: clampScore(recommendation.geographic_fit_score),
    updatedAt: recommendation.updated_at || null,
    opportunity: opportunityMap.get(String(recommendation.opportunity_id)) || null,
  }));

  const hydratedAwards = awardRows.map((award) => {
    const fundingProgram = fundingProgramMap.get(String(award.funding_program_id)) || null;
    const fundingSource = fundingProgram
      ? fundingSourceMap.get(String(fundingProgram.funding_source_id))
      : null;

    return {
      id: String(award.id),
      status:
        typeof award.award_status === 'string' ? award.award_status : 'recommended',
      awardAmount: Number(award.amount_awarded || 0),
      amountDisbursed: Number(award.amount_disbursed || 0),
      communityReportDueAt: award.community_report_due_at || null,
      updatedAt: award.updated_at || null,
      fundingProgram,
      fundingSource: fundingSource || null,
    };
  });

  return {
    id: String(profileRow.id),
    organizationId: normalizedOrganizationId,
    organization: organizationRow,
    capabilityTags: asArray(profileRow.capability_tags),
    serviceGeographies: asArray(profileRow.service_geographies),
    priorityPopulations: asArray(profileRow.priority_populations),
    operatingModels: asArray(profileRow.operating_models),
    firstNationsLed: profileRow.first_nations_led === true,
    livedExperienceLed: profileRow.lived_experience_led === true,
    fundingReadinessScore: clampScore(profileRow.funding_readiness_score),
    complianceReadinessScore: clampScore(profileRow.compliance_readiness_score),
    deliveryConfidenceScore: clampScore(profileRow.delivery_confidence_score),
    communityTrustScore: clampScore(profileRow.community_trust_score),
    evidenceMaturityScore: clampScore(profileRow.evidence_maturity_score),
    reportingToCommunityScore: clampScore(profileRow.reporting_to_community_score),
    canManageGovernmentContracts: profileRow.can_manage_government_contracts === true,
    canManagePhilanthropicGrants: profileRow.can_manage_philanthropic_grants !== false,
    capabilityNotes:
      typeof profileRow.capability_notes === 'string' ? profileRow.capability_notes : null,
    updatedAt: profileRow.updated_at || null,
    signals: ((signals || []) as Array<Record<string, any>>).map((signal) => ({
      id: String(signal.id),
      signalType: typeof signal.signal_type === 'string' ? signal.signal_type : 'signal',
      signalName: typeof signal.signal_name === 'string' ? signal.signal_name : null,
      signalWeight: clampScore(signal.signal_weight),
      signalValue: clampScore(signal.signal_score),
      sourceKind: typeof signal.source_kind === 'string' ? signal.source_kind : null,
      evidenceUrl: typeof signal.evidence_url === 'string' ? signal.evidence_url : null,
      evidenceNote:
        typeof signal.evidence_note === 'string' ? signal.evidence_note : null,
      sourceRecordType:
        typeof signal.source_kind === 'string' ? signal.source_kind : null,
      sourceRecordId: null,
      recordedAt: signal.recorded_at || null,
      expiresAt: signal.expires_at || null,
      updatedAt: signal.updated_at || signal.recorded_at || null,
    })),
    topMatches: hydratedMatches,
    recentAwards: hydratedAwards,
  };
}

export async function getFundingOrganizationWorkspaceDetail(organizationId: string) {
  const normalizedOrganizationId = String(organizationId || '').trim();
  if (!normalizedOrganizationId) {
    return null;
  }

  const detail = await getFundingDiscoveryOrganizationDetail(normalizedOrganizationId);
  if (!detail) {
    return null;
  }

  const serviceClient = getServiceClient();

  const [
    workspaceRows,
    commitments,
    sharedShortlistRows,
    { data: applications, error: applicationsError },
  ] = await Promise.all([
    listFundingDiscoveryReviewWorkspace([normalizedOrganizationId]),
    listFundingOutcomeCommitments({
      organizationId: normalizedOrganizationId,
      limit: 8,
    }),
    listFundingDiscoverySharedShortlist(),
    serviceClient
      .from('alma_funding_applications')
      .select(
        'id, opportunity_id, status, amount_requested, amount_awarded, submitted_at, outcome_at, created_at, updated_at'
      )
      .eq('organization_id', normalizedOrganizationId)
      .order('updated_at', { ascending: false })
      .limit(8),
  ]);

  if (applicationsError) {
    throw new Error(applicationsError.message || 'Failed to load funding applications');
  }

  const applicationRows = (applications || []) as Array<Record<string, any>>;
  const opportunityIds = uniqueStrings(applicationRows.map((row) => row.opportunity_id));
  const opportunityMap = new Map<string, Record<string, any>>();

  if (opportunityIds.length > 0) {
    const { data: opportunities, error: opportunitiesError } = await serviceClient
      .from('alma_funding_opportunities')
      .select('id, name, funder_name, deadline, status, max_grant_amount')
      .in('id', opportunityIds);

    if (opportunitiesError) {
      throw new Error(opportunitiesError.message || 'Failed to load application opportunities');
    }

    for (const opportunity of (opportunities || []) as Array<Record<string, any>>) {
      opportunityMap.set(String(opportunity.id), opportunity);
    }
  }

  const workspace = workspaceRows[0] || null;
  const sharedShortlistEntry = sharedShortlistRows.find(
    (row) => row.organizationId === normalizedOrganizationId
  );

  const profileChecklist = [
    {
      key: 'shared_profile',
      label: 'Shared working profile exists',
      complete: Boolean(workspace),
      detail: workspace
        ? 'The organization already has a shared review record.'
        : 'Create a shared review record so notes, tags, and activity are durable across the team.',
    },
    {
      key: 'capability_profile',
      label: 'Capability profile is populated',
      complete:
        detail.capabilityTags.length > 0 ||
        detail.serviceGeographies.length > 0 ||
        detail.signals.length > 0,
      detail:
        detail.capabilityTags.length > 0 || detail.signals.length > 0
          ? 'Capability and geography signals are present.'
          : 'Add capability tags, geographies, and signals before writing a stronger grant response.',
    },
    {
      key: 'readiness',
      label: 'Funding readiness is strong',
      complete: detail.fundingReadinessScore >= 70,
      detail:
        detail.fundingReadinessScore >= 70
          ? `Current readiness score is ${detail.fundingReadinessScore}.`
          : `Current readiness score is ${detail.fundingReadinessScore}; raise this before submission where possible.`,
    },
    {
      key: 'community_review',
      label: 'Community review signal exists',
      complete: Boolean(workspace?.decisionTag || workspace?.note),
      detail:
        workspace?.decisionTag || workspace?.note
          ? 'A shared note or decision tag is already recorded.'
          : 'Add a shared note or decision tag before treating this as submission-ready.',
    },
    {
      key: 'impact_evidence',
      label: 'Impact evidence is in place',
      complete: commitments.length > 0,
      detail:
        commitments.length > 0
          ? `${commitments.length} commitment${commitments.length === 1 ? '' : 's'} already link this org to measurable outcomes.`
          : 'No outcome commitments yet. Add at least one measurable community outcome before moving into impact reporting.',
    },
  ];

  const nextActions = profileChecklist
    .filter((item) => !item.complete)
    .map((item) => item.detail)
    .slice(0, 4);

  if (applicationRows.length === 0 && detail.topMatches.length > 0) {
    nextActions.push('No live application yet. Use the best current match to open an application pathway.');
  }

  return {
    ...detail,
    sharedWorkspace: workspace,
    inSharedShortlist: Boolean(sharedShortlistEntry),
    sharedShortlistPosition:
      sharedShortlistEntry && typeof sharedShortlistEntry.sortIndex === 'number'
        ? sharedShortlistEntry.sortIndex + 1
        : null,
    applications: applicationRows.map((row) => ({
      id: String(row.id),
      status: typeof row.status === 'string' ? row.status : 'draft',
      amountRequested: Number(row.amount_requested || 0),
      amountAwarded: Number(row.amount_awarded || 0),
      submittedAt: row.submitted_at || null,
      outcomeAt: row.outcome_at || null,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
      opportunity: opportunityMap.get(String(row.opportunity_id || '')) || null,
    })),
    commitments,
    profileChecklist,
    nextActions,
  };
}

export async function getFundingApplicationWorkspaceDraft(
  organizationId: string,
  opportunityId: string
) {
  const normalizedOrganizationId = String(organizationId || '').trim();
  const normalizedOpportunityId = String(opportunityId || '').trim();

  if (!normalizedOrganizationId || !normalizedOpportunityId) {
    return null;
  }

  const workspace = await getFundingOrganizationWorkspaceDetail(normalizedOrganizationId);
  if (!workspace) {
    return null;
  }

  const selectedMatch =
    workspace.topMatches.find((match) => match.id === normalizedOpportunityId) || null;
  const existingApplication =
    workspace.applications.find(
      (application) => String(application.opportunity?.id || '') === normalizedOpportunityId
    ) || null;

  const selectedOpportunity =
    selectedMatch?.opportunity ||
    existingApplication?.opportunity ||
    null;

  if (!selectedOpportunity) {
    return null;
  }

  const draftWorkspace = await getFundingApplicationDraftWorkspaceRecord(
    normalizedOrganizationId,
    normalizedOpportunityId
  );

  const draftChecklist = [
    {
      key: 'fit_case',
      label: 'Fit case is clear',
      complete: Boolean(selectedMatch && selectedMatch.matchScore >= 70),
      detail: selectedMatch
        ? `Current match score is ${selectedMatch.matchScore}.`
        : 'No explicit match score yet. Clarify why this opportunity fits before drafting.',
    },
    {
      key: 'shared_review',
      label: 'Shared review context exists',
      complete: Boolean(workspace.sharedWorkspace?.note || workspace.sharedWorkspace?.decisionTag),
      detail:
        workspace.sharedWorkspace?.note || workspace.sharedWorkspace?.decisionTag
          ? 'Shared review note or decision tag is already recorded.'
          : 'Add a shared working note or decision tag before circulating a draft.',
    },
    {
      key: 'impact_case',
      label: 'Impact case is grounded',
      complete: workspace.commitments.length > 0,
      detail:
        workspace.commitments.length > 0
          ? `${workspace.commitments.length} measurable commitment${workspace.commitments.length === 1 ? '' : 's'} can support this application.`
          : 'Add at least one measurable commitment so the proposal has a visible impact frame.',
    },
    {
      key: 'application_record',
      label: 'Application pathway exists',
      complete: Boolean(existingApplication),
      detail: existingApplication
        ? `Existing application is ${existingApplication.status}.`
        : 'No application record yet. This draft should become the first structured application step.',
    },
  ];

  const supportLetterIdeas = [
    workspace.firstNationsLed
      ? 'Cultural authority and community leadership endorsement'
      : null,
    workspace.livedExperienceLed
      ? 'Lived-experience leadership statement or testimony'
      : null,
    workspace.communityTrustScore >= 75
      ? 'Community trust reference from a local partner or participant cohort'
      : 'Independent endorsement to strengthen trust and delivery confidence',
    workspace.commitments.length > 0
      ? 'Evidence-backed impact note linking proposed funding to existing commitments'
      : 'Outcome framing note describing what measurable change the funding will support',
  ].filter((item): item is string => Boolean(item));

  const narrativePrompts = [
    `Why ${workspace.organization?.name || 'this organization'} is structurally positioned to deliver this funding now.`,
    'What community-defined outcome will change if this program is resourced.',
    'Why this proposal should be community-accountable, not just funder-accountable.',
    'What the first 90 days of delivery would look like if funded.',
  ];

  const communityReviewPrompts = [
    'What would make this proposal stronger from the community side before submission?',
    'What risks, cautions, or missing voices need to be addressed before moving forward?',
    'Who should endorse this application if it is going to represent the community honestly?',
  ];

  const draftNextActions = draftChecklist
    .filter((item) => !item.complete)
    .map((item) => item.detail)
    .slice(0, 3);

  if (!existingApplication) {
    draftNextActions.push('Create or promote a live application record once the draft case is coherent.');
  }

  return {
    organizationId: workspace.organizationId,
    organization: workspace.organization,
    workspace,
    selectedOpportunity,
    selectedMatch,
    existingApplication,
    draftWorkspace,
    draftChecklist,
    supportLetterIdeas,
    narrativePrompts,
    communityReviewPrompts,
    draftNextActions,
  };
}

export async function upsertCapabilityProfile(
  input: CapabilityProfileInput,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const payload = sanitizeCapabilityProfileInput(input);
  const signals = sanitizeCapabilitySignals(input.signals);

  const workflow = await createWorkflow(serviceClient, 'org_profile_refresh', 'organization', adminUserId, {
    organizationId: payload.organization_id,
    replaceSignals: Array.isArray(input.signals),
    signalCount: signals.length,
  });

  const { data: existingProfile, error: existingError } = await serviceClient
    .from('organization_capability_profiles')
    .select('id')
    .eq('organization_id', payload.organization_id)
    .maybeSingle();

  if (existingError) {
    await completeWorkflow(serviceClient, workflow.id, { error: existingError.message }, {
      recordsScanned: 1,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(existingError.message || 'Failed to check existing capability profile');
  }

  const { data: profile, error: upsertError } = await serviceClient
    .from('organization_capability_profiles')
    .upsert([payload], { onConflict: 'organization_id' })
    .select('*')
    .single();

  if (upsertError) {
    await completeWorkflow(serviceClient, workflow.id, { error: upsertError.message }, {
      recordsScanned: 1,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(upsertError.message || 'Failed to save capability profile');
  }

  let signalsChanged = 0;

  if (Array.isArray(input.signals)) {
    await serviceClient
      .from('organization_capability_signals')
      .delete()
      .eq('capability_profile_id', profile.id);

    if (signals.length > 0) {
      const signalRows = signals.map((signal) => ({
        capability_profile_id: profile.id,
        ...signal,
      }));

      const { error: signalError } = await serviceClient
        .from('organization_capability_signals')
        .insert(signalRows);

      if (signalError) {
        await completeWorkflow(serviceClient, workflow.id, { error: signalError.message }, {
          recordsScanned: 1 + signals.length,
          recordsChanged: existingProfile ? 1 : 0,
          errorCount: 1,
        });
        throw new Error(signalError.message || 'Failed to save capability signals');
      }

      signalsChanged = signals.length;
    }
  }

  const [hydrated] = await listCapabilityProfiles({
    organizationId: payload.organization_id,
    includeSignals: true,
    limit: 1,
  });

  await completeWorkflow(serviceClient, workflow.id, {
    organizationId: payload.organization_id,
    profileId: profile.id,
    signalsChanged,
  }, {
    recordsScanned: 1 + signals.length,
    recordsChanged: 1 + signalsChanged,
  });

  return hydrated || profile;
}

export async function deleteCapabilityProfile(input: {
  profileId?: string;
  organizationId?: string;
}, adminUserId: string) {
  const serviceClient = getServiceClient();
  const profileId = String(input.profileId || '').trim();
  const organizationId = String(input.organizationId || '').trim();

  if (!profileId && !organizationId) {
    throw new Error('Validation: profileId or organizationId is required');
  }

  const workflow = await createWorkflow(serviceClient, 'org_profile_refresh', 'organization', adminUserId, {
    profileId: profileId || null,
    organizationId: organizationId || null,
    action: 'delete',
  });

  let lookup = serviceClient
    .from('organization_capability_profiles')
    .select('id, organization_id')
    .limit(1);

  if (profileId) {
    lookup = lookup.eq('id', profileId);
  } else {
    lookup = lookup.eq('organization_id', organizationId);
  }

  const { data: profile, error: lookupError } = await lookup.maybeSingle();
  if (lookupError) {
    await completeWorkflow(serviceClient, workflow.id, { error: lookupError.message }, {
      recordsScanned: 1,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(lookupError.message || 'Failed to load capability profile');
  }

  if (!profile) {
    await completeWorkflow(serviceClient, workflow.id, { deleted: false, reason: 'not_found' }, {
      recordsScanned: 1,
      recordsChanged: 0,
    });
    throw new Error('Validation: Capability profile not found');
  }

  const { error: deleteError } = await serviceClient
    .from('organization_capability_profiles')
    .delete()
    .eq('id', profile.id);

  if (deleteError) {
    await completeWorkflow(serviceClient, workflow.id, { error: deleteError.message }, {
      recordsScanned: 1,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(deleteError.message || 'Failed to delete capability profile');
  }

  await completeWorkflow(serviceClient, workflow.id, {
    deleted: true,
    profileId: profile.id,
    organizationId: profile.organization_id,
  }, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return {
    deleted: true,
    profileId: profile.id,
    organizationId: profile.organization_id,
  };
}

export async function seedCapabilityProfiles(
  options: CapabilityProfileSeedOptions,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, options.limit ?? 10));
  const organizationIds = (options.organizationIds || []).map((id) => String(id).trim()).filter(Boolean);
  const slugs = (options.slugs || []).map((slug) => String(slug).trim()).filter(Boolean);
  const overwriteExisting = options.overwriteExisting === true;

  const workflow = await createWorkflow(serviceClient, 'org_profile_refresh', 'global', adminUserId, {
    action: 'seed_capability_profiles',
    organizationIds,
    slugs,
    limit,
    overwriteExisting,
  });

  let query = serviceClient
    .from('organizations')
    .select('id, name, slug, type, description, city, state, location, tags, metadata, partner_tier, verification_status')
    .order('name', { ascending: true })
    .limit(limit);

  if (organizationIds.length > 0) {
    query = query.in('id', organizationIds);
  } else if (slugs.length > 0) {
    query = query.in('slug', slugs);
  } else {
    query = query.in('partner_tier', ['basecamp', 'partner']);
  }

  const { data: organizations, error } = await query;
  if (error) {
    await completeWorkflow(serviceClient, workflow.id, { error: error.message }, {
      recordsScanned: 0,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(error.message || 'Failed to load organizations for capability seed');
  }

  const organizationsList = (organizations || []) as Array<Record<string, any>>;
  const targetOrgIds = organizationsList.map((org) => String(org.id));

  const { data: existingProfiles, error: existingError } = await serviceClient
    .from('organization_capability_profiles')
    .select('id, organization_id')
    .in('organization_id', targetOrgIds.length > 0 ? targetOrgIds : ['00000000-0000-0000-0000-000000000000']);

  if (existingError) {
    await completeWorkflow(serviceClient, workflow.id, { error: existingError.message }, {
      recordsScanned: organizationsList.length,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(existingError.message || 'Failed to load existing capability profiles');
  }

  const existingMap = new Map<string, Record<string, any>>();
  for (const profile of (existingProfiles || []) as Array<Record<string, any>>) {
    existingMap.set(String(profile.organization_id), profile);
  }

  let seeded = 0;
  let skipped = 0;

  for (const org of organizationsList) {
    if (existingMap.has(String(org.id)) && !overwriteExisting) {
      skipped += 1;
      continue;
    }

    const seedInput = deriveCapabilitySeedFromOrganization(org);
    await upsertCapabilityProfile(seedInput, adminUserId);
    seeded += 1;
  }

  const result = {
    workflowId: workflow.id,
    organizationsScanned: organizationsList.length,
    seeded,
    skipped,
    overwriteExisting,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: organizationsList.length,
    recordsChanged: seeded,
  });

  return result;
}

export async function refreshBasecampCapabilityProfiles(
  options: BasecampConnectorRefreshOptions,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(50, options.limit ?? 10));
  const organizationIds = (options.organizationIds || []).map((id) => String(id).trim()).filter(Boolean);
  const slugs = (options.slugs || []).map((slug) => String(slug).trim()).filter(Boolean);

  const workflow = await createWorkflow(serviceClient, 'org_profile_refresh', 'global', adminUserId, {
    action: 'refresh_basecamp_connectors',
    organizationIds,
    slugs,
    limit,
  });

  let query = serviceClient
    .from('organizations')
    .select('id, name, slug, type, description, city, state, location, tags, metadata, partner_tier, verification_status')
    .eq('partner_tier', 'basecamp')
    .order('name', { ascending: true })
    .limit(limit);

  if (organizationIds.length > 0) {
    query = query.in('id', organizationIds);
  }

  if (slugs.length > 0) {
    query = query.in('slug', slugs);
  }

  const { data: organizations, error } = await query;
  if (error) {
    await completeWorkflow(serviceClient, workflow.id, { error: error.message }, {
      recordsScanned: 0,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(error.message || 'Failed to load basecamp organizations');
  }

  const basecamps = (organizations || []) as Array<Record<string, any>>;
  const orgIds = basecamps.map((org) => String(org.id));

  const { data: nodes } = await serviceClient
    .from('justicehub_nodes')
    .select('id, lead_organization_id, state_code, status, node_type')
    .in('lead_organization_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000']);

  const nodeMap = new Map<string, Record<string, any>>();
  for (const node of (nodes || []) as Array<Record<string, any>>) {
    const key = String(node.lead_organization_id || '');
    if (key) {
      nodeMap.set(key, node);
    }
  }

  const { data: orgProfiles } = await serviceClient
    .from('organizations_profiles')
    .select(
      `
      id,
      organization_id,
      role,
      role_description,
      is_current,
      is_featured,
      public_profile:public_profiles(
        id,
        full_name,
        role_tags,
        current_organization,
        location,
        is_public,
        is_featured
      )
    `
    )
    .in('organization_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000']);

  const linksByOrgId = new Map<string, Array<Record<string, any>>>();
  for (const link of (orgProfiles || []) as Array<Record<string, any>>) {
    const orgId = String(link.organization_id || '');
    if (!orgId) continue;
    const bucket = linksByOrgId.get(orgId) || [];
    bucket.push(link);
    linksByOrgId.set(orgId, bucket);
  }

  let refreshed = 0;

  for (const org of basecamps) {
    const baseSeed = deriveCapabilitySeedFromOrganization(org);
    const node = nodeMap.get(String(org.id));
    const links = linksByOrgId.get(String(org.id)) || [];
    const activeLinks = links.filter((link) => link.is_current !== false);
    const featuredLinks = activeLinks.filter((link) => link.is_featured === true);

    const roleLabels = activeLinks.flatMap((link) =>
      uniqueStrings([
        typeof link.role === 'string' ? link.role : null,
        typeof link.role_description === 'string' ? link.role_description : null,
      ])
    );

    const profileLocations = activeLinks.flatMap((link) => {
      const profile = (link.public_profile || {}) as Record<string, any>;
      return uniqueStrings([
        typeof profile.location === 'string' ? profile.location : null,
        typeof profile.current_organization === 'string' ? profile.current_organization : null,
      ]);
    });

    const profileRoleTags = activeLinks.flatMap((link) => {
      const profile = (link.public_profile || {}) as Record<string, any>;
      return Array.isArray(profile.role_tags) ? profile.role_tags : [];
    });

    const governanceRoles = roleLabels.filter((role) =>
      includesAny(role.toLowerCase(), ['director', 'founder', 'board', 'chair', 'ceo'])
    );

    const connectorCount = activeLinks.length;
    const featuredConnectorCount = featuredLinks.length;
    const hasNode = Boolean(node);
    const nodeActive = normalizeText(node?.status) === 'active';

    const communityTrustScore = clampScore(
      (baseSeed.communityTrustScore ?? 0) +
        Math.min(15, featuredConnectorCount * 4) +
        (nodeActive ? 8 : hasNode ? 4 : 0)
    );
    const reportingToCommunityScore = clampScore(
      (baseSeed.reportingToCommunityScore ?? 0) +
        Math.min(12, connectorCount * 3)
    );
    const deliveryConfidenceScore = clampScore(
      (baseSeed.deliveryConfidenceScore ?? 0) +
        (hasNode ? 8 : 0) +
        Math.min(10, governanceRoles.length * 3)
    );
    const complianceReadinessScore = clampScore(
      (baseSeed.complianceReadinessScore ?? 0) +
        Math.min(10, governanceRoles.length * 2)
    );

    const connectorTags = mergeStringArrays(
      baseSeed.capabilityTags,
      profileRoleTags,
      connectorCount > 0 ? ['connector_rich'] : [],
      featuredConnectorCount > 0 ? ['public_connector_faces'] : [],
      governanceRoles.length > 0 ? ['governance_visible'] : [],
      nodeActive ? ['active_node_anchor'] : hasNode ? ['node_anchor'] : []
    );

    const operatingModels = mergeStringArrays(
      baseSeed.operatingModels,
      hasNode ? ['network_backbone'] : [],
      connectorCount >= 3 ? ['relationship_dense'] : []
    );

    const serviceGeographies = mergeStringArrays(
      baseSeed.serviceGeographies,
      node?.state_code ? [String(node.state_code)] : [],
      profileLocations
    );

    const signals: CapabilitySignalInput[] = [
      ...(baseSeed.signals || []),
      {
        signalType: 'reporting',
        signalName: 'Connector visibility baseline',
        signalScore: reportingToCommunityScore,
        signalWeight: 1.1,
        sourceKind: 'internal',
        evidenceNote: `Derived from ${connectorCount} linked organization profiles.`,
      },
      {
        signalType: 'governance',
        signalName: 'Visible leadership connector baseline',
        signalScore: clampScore(50 + governanceRoles.length * 8 + (hasNode ? 5 : 0)),
        signalWeight: 1.0,
        sourceKind: 'internal',
        evidenceNote: `Derived from ${governanceRoles.length} visible governance-linked connectors and node presence.`,
      },
    ];

    if (hasNode) {
      signals.push({
        signalType: 'delivery',
        signalName: 'Node backbone readiness baseline',
        signalScore: clampScore(60 + (nodeActive ? 12 : 4)),
        signalWeight: 1.0,
        sourceKind: 'internal',
        evidenceNote: `Derived from linked JusticeHub node (${node?.node_type || 'node'}, status: ${node?.status || 'unknown'}).`,
      });
    }

    await upsertCapabilityProfile(
      {
        ...baseSeed,
        serviceGeographies,
        capabilityTags: connectorTags,
        operatingModels,
        communityTrustScore,
        reportingToCommunityScore,
        deliveryConfidenceScore,
        complianceReadinessScore,
        capabilityNotes:
          'Basecamp-tailored profile refreshed from linked people, roles, and node connectors. Replace with direct community-validated updates as available.',
        supportingEvidence: {
          ...(baseSeed.supportingEvidence || {}),
          connectorSummary: {
            connectorCount,
            featuredConnectorCount,
            visibleGovernanceRoles: governanceRoles,
            linkedNodeStatus: node?.status || null,
            linkedNodeState: node?.state_code || null,
          },
        },
        metadata: {
          ...(baseSeed.metadata || {}),
          refreshMethod: 'basecamp_connector_refresh',
        },
        signals,
      },
      adminUserId
    );

    refreshed += 1;
  }

  const result = {
    workflowId: workflow.id,
    basecampsScanned: basecamps.length,
    refreshed,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: basecamps.length,
    recordsChanged: refreshed,
  });

  return result;
}

export async function runFundingOperatingSystemBootstrap(
  options: FundingOsBootstrapOptions,
  adminUserId: string
) {
  const normalizedOrganizationIds = (options.organizationIds || [])
    .map((id) => String(id).trim())
    .filter(Boolean);
  const normalizedSlugs = (options.slugs || [])
    .map((slug) => String(slug).trim())
    .filter(Boolean);
  const normalizedStatuses = (options.statuses || [])
    .map((status) => String(status).trim())
    .filter(Boolean);
  const normalizedOpportunityIds = (options.opportunityIds || [])
    .map((id) => String(id).trim())
    .filter(Boolean);

  const capabilitySeed = await seedCapabilityProfiles(
    {
      organizationIds: normalizedOrganizationIds,
      slugs: normalizedSlugs,
      limit: options.capabilitySeedLimit,
      overwriteExisting: options.overwriteExistingProfiles,
    },
    adminUserId
  );

  const basecampRefresh = await refreshBasecampCapabilityProfiles(
    {
      organizationIds: normalizedOrganizationIds,
      slugs: normalizedSlugs,
      limit: options.capabilitySeedLimit,
    },
    adminUserId
  );

  const ingest = await ingestFundingOperatingSystem(
    {
      opportunityIds: normalizedOpportunityIds,
      statuses: normalizedStatuses,
      limit: options.ingestLimit,
    },
    adminUserId
  );

  const matches = await generateFundingMatchRecommendations(
    {
      opportunityIds: normalizedOpportunityIds,
      organizationIds: normalizedOrganizationIds,
      statuses: normalizedStatuses,
      limit: options.matchLimit,
      minScore: options.minScore,
    },
    adminUserId
  );

  return {
    capabilitySeed,
    basecampRefresh,
    ingest,
    matches,
  };
}

export async function updateFundingMatchRecommendationStatus(
  recommendationId: string,
  nextStatus: string,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(recommendationId || '').trim();
  const normalizedStatus = String(nextStatus || '').trim().toLowerCase();
  const allowedStatuses = new Set(['candidate', 'notified', 'engaged', 'declined', 'archived']);

  if (!normalizedId) {
    throw new Error('Validation: recommendationId is required');
  }

  if (!allowedStatuses.has(normalizedStatus)) {
    throw new Error('Validation: status must be candidate, notified, engaged, declined, or archived');
  }

  const workflow = await createWorkflow(
    serviceClient,
    'award_reconciliation',
    'opportunity',
    adminUserId,
    { recommendationId: normalizedId, nextStatus: normalizedStatus }
  );

  const { data: updatedRecommendation, error } = await serviceClient
    .from('funding_match_recommendations')
    .update({
      recommendation_status: normalizedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', normalizedId)
    .select('*')
    .maybeSingle();

  if (error) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: error.message, recommendationId: normalizedId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(error.message || 'Failed to update funding recommendation status');
  }

  if (!updatedRecommendation) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: 'Recommendation not found', recommendationId: normalizedId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error('Validation: Recommendation not found');
  }

  const result = {
    workflowId: workflow.id,
    recommendationId: normalizedId,
    recommendationStatus: normalizedStatus,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return result;
}

export async function promoteFundingMatchRecommendation(
  recommendationId: string,
  adminUserId: string | null
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(recommendationId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: recommendationId is required');
  }

  const workflow = await createWorkflow(
    serviceClient,
    'award_reconciliation',
    'opportunity',
    adminUserId,
    { recommendationId: normalizedId }
  );

  const { data: recommendation, error: recommendationError } = await serviceClient
    .from('funding_match_recommendations')
    .select('*')
    .eq('id', normalizedId)
    .maybeSingle();

  if (recommendationError) {
    await completeWorkflow(serviceClient, workflow.id, { error: recommendationError.message }, {
      recordsScanned: 0,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(recommendationError.message || 'Failed to load funding recommendation');
  }

  if (!recommendation) {
    await completeWorkflow(serviceClient, workflow.id, { error: 'Recommendation not found' }, {
      recordsScanned: 0,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error('Validation: Recommendation not found');
  }

  const { data: opportunity, error: opportunityError } = await serviceClient
    .from('alma_funding_opportunities')
    .select(
      'id, name, funder_name, source_type, status, deadline, min_grant_amount, max_grant_amount'
    )
    .eq('id', recommendation.opportunity_id)
    .maybeSingle();

  if (opportunityError || !opportunity) {
    await completeWorkflow(serviceClient, workflow.id, { error: opportunityError?.message || 'Opportunity not found' }, {
      recordsScanned: 1,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(opportunityError?.message || 'Opportunity not found');
  }

  const { data: program, error: programError } = await serviceClient
    .from('funding_programs')
    .select('id')
    .eq('linked_opportunity_id', recommendation.opportunity_id)
    .limit(1)
    .maybeSingle();

  if (programError || !program) {
    await completeWorkflow(serviceClient, workflow.id, { error: programError?.message || 'Funding program not found for opportunity' }, {
      recordsScanned: 1,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(programError?.message || 'Funding program not found for opportunity');
  }

  let applicationId: string | null = null;

  const { data: existingApplication, error: existingApplicationError } = await serviceClient
    .from('alma_funding_applications')
    .select('id')
    .eq('opportunity_id', recommendation.opportunity_id)
    .eq('organization_id', recommendation.organization_id)
    .limit(1)
    .maybeSingle();

  if (existingApplicationError) {
    await completeWorkflow(serviceClient, workflow.id, { error: existingApplicationError.message }, {
      recordsScanned: 1,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(existingApplicationError.message || 'Failed to check existing application');
  }

  if (existingApplication) {
    applicationId = existingApplication.id;
  } else {
    const { data: createdApplication, error: applicationError } = await serviceClient
      .from('alma_funding_applications')
      .insert([
        {
          opportunity_id: recommendation.opportunity_id,
          organization_id: recommendation.organization_id,
          status: 'evaluating',
          internal_match_score: recommendation.match_score,
          notes:
            `Promoted from Funding OS recommendation ${normalizedId}. ` +
            `Readiness ${Math.round(recommendation.readiness_score || 0)}, ` +
            `community ${Math.round(recommendation.community_alignment_score || 0)}.`,
        },
      ])
      .select('id')
      .single();

    if (applicationError || !createdApplication) {
      await completeWorkflow(serviceClient, workflow.id, { error: applicationError?.message || 'Failed to create funding application' }, {
        recordsScanned: 1,
        recordsChanged: 0,
        errorCount: 1,
      });
      throw new Error(applicationError?.message || 'Failed to create funding application');
    }

    applicationId = createdApplication.id;
  }

  let awardId: string | null = null;

  const { data: existingAwards, error: existingAwardError } = await serviceClient
    .from('funding_awards')
    .select('id')
    .eq('opportunity_id', recommendation.opportunity_id)
    .eq('organization_id', recommendation.organization_id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingAwardError) {
    await completeWorkflow(serviceClient, workflow.id, { error: existingAwardError.message }, {
      recordsScanned: 2,
      recordsChanged: applicationId ? 1 : 0,
      errorCount: 1,
    });
    throw new Error(existingAwardError.message || 'Failed to check existing funding awards');
  }

  if ((existingAwards || []).length > 0) {
    awardId = existingAwards[0].id;
    await serviceClient
      .from('funding_awards')
      .update({
        application_id: applicationId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', awardId);
  } else {
    const amount =
      typeof opportunity.max_grant_amount === 'number'
        ? opportunity.max_grant_amount
        : typeof opportunity.min_grant_amount === 'number'
          ? opportunity.min_grant_amount
          : 0;

    const { data: createdAward, error: awardError } = await serviceClient
      .from('funding_awards')
      .insert([
        {
          funding_program_id: program.id,
          opportunity_id: recommendation.opportunity_id,
          application_id: applicationId,
          organization_id: recommendation.organization_id,
          award_status: 'recommended',
          award_type: mapAwardType(opportunity.source_type),
          amount_awarded: amount,
          amount_disbursed: 0,
          community_governance_required: true,
          public_summary:
            `Promoted from Funding OS recommendation for ${opportunity.name}.`,
          outcome_summary:
            `Initial recommendation from Funding OS with match score ${Math.round(recommendation.match_score || 0)}.`,
        },
      ])
      .select('id')
      .single();

    if (awardError || !createdAward) {
      await completeWorkflow(serviceClient, workflow.id, { error: awardError?.message || 'Failed to create funding award' }, {
        recordsScanned: 2,
        recordsChanged: applicationId ? 1 : 0,
        errorCount: 1,
      });
      throw new Error(awardError?.message || 'Failed to create funding award');
    }

    awardId = createdAward.id;
  }

  await serviceClient
    .from('funding_match_recommendations')
    .update({
      recommendation_status: 'engaged',
      updated_at: new Date().toISOString(),
    })
    .eq('id', normalizedId);

  const result = {
    workflowId: workflow.id,
    recommendationId: normalizedId,
    applicationId,
    awardId,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 3,
    recordsChanged: 3,
  });

  return result;
}

export async function createFundingConversationRequest(
  recommendationId: string,
  adminUserId: string | null
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(recommendationId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: recommendationId is required');
  }

  const workflow = await createWorkflow(
    serviceClient,
    'relationship_outreach',
    'organization',
    adminUserId,
    { recommendationId: normalizedId }
  );

  const { data: recommendation, error: recommendationError } = await serviceClient
    .from('funding_match_recommendations')
    .select('id, organization_id, opportunity_id, match_score')
    .eq('id', normalizedId)
    .maybeSingle();

  if (recommendationError || !recommendation) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: recommendationError?.message || 'Recommendation not found' },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(recommendationError?.message || 'Validation: Recommendation not found');
  }

  const { data: opportunity, error: opportunityError } = await serviceClient
    .from('alma_funding_opportunities')
    .select('id, name, funder_name')
    .eq('id', recommendation.opportunity_id)
    .maybeSingle();

  if (opportunityError || !opportunity) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: opportunityError?.message || 'Opportunity not found' },
      { recordsScanned: 2, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(opportunityError?.message || 'Opportunity not found');
  }

  const { data: organization, error: organizationError } = await serviceClient
    .from('organizations')
    .select('id, name')
    .eq('id', recommendation.organization_id)
    .maybeSingle();

  if (organizationError || !organization) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: organizationError?.message || 'Organization not found' },
      { recordsScanned: 3, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(organizationError?.message || 'Organization not found');
  }

  const sourceId = `conversation:${normalizedId}`;
  const { data: existingTask, error: existingTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .eq('source_id', sourceId)
    .in('status', ['queued', 'pending', 'running', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTaskError) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: existingTaskError.message },
      { recordsScanned: 4, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(existingTaskError.message || 'Failed to inspect conversation requests');
  }

  if (existingTask) {
    const result = {
      workflowId: workflow.id,
      taskId: String(existingTask.id),
      taskStatus: String(existingTask.status || 'queued'),
      recommendationId: normalizedId,
      existing: true,
    };

    await completeWorkflow(serviceClient, workflow.id, result, {
      recordsScanned: 4,
      recordsChanged: 0,
    });

    return result;
  }

  const organizationName = String(organization.name || 'Community organization');
  const opportunityName = String(opportunity.name || 'Funding opportunity');
  const funderName = String(opportunity.funder_name || 'Funder');

  const conversationBrief = [
    'Conversation Request',
    `Organization: ${organizationName}`,
    `Opportunity: ${opportunityName}`,
    `Funder: ${funderName}`,
    '',
    'Why now:',
    'This organization was shortlisted and sent into the funding pipeline as a current candidate.',
    '',
    'Suggested conversation goals:',
    '- Confirm community priorities and readiness for this opportunity',
    '- Validate current fit, risks, and timing',
    '- Surface any support needed before formal engagement',
    '',
    'Next step:',
    'Invite a direct conversation with the organization to confirm mutual fit before advancing further.',
  ].join('\n');

  const { data: createdTask, error: createTaskError } = await serviceClient
    .from('agent_task_queue')
    .insert([
      {
        source: 'funding_conversation_request',
        source_id: sourceId,
        task_type: 'funding_conversation_request',
        title: `Conversation request: ${organizationName}`,
        description: `Open a direct conversation with ${organizationName} about ${opportunityName}.`,
        status: 'queued',
        priority: 2,
        needs_review: true,
        requested_by: adminUserId,
        reply_to: {
          recommendation_id: normalizedId,
          organization_id: recommendation.organization_id,
          opportunity_id: recommendation.opportunity_id,
          organization_name: organizationName,
          opportunity_name: opportunityName,
          funder_name: funderName,
          match_score: Math.round(Number(recommendation.match_score || 0)),
          brief: conversationBrief,
          created_at: new Date().toISOString(),
        },
        human_edits: [
          {
            action: 'created',
            actorId: adminUserId,
            at: new Date().toISOString(),
            summary: 'Created tracked conversation request.',
          },
        ],
      },
    ])
    .select('id, status')
    .single();

  if (createTaskError || !createdTask) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: createTaskError?.message || 'Failed to create conversation request' },
      { recordsScanned: 4, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(createTaskError?.message || 'Failed to create conversation request');
  }

  const result = {
    workflowId: workflow.id,
    taskId: String(createdTask.id),
    taskStatus: String(createdTask.status || 'queued'),
    recommendationId: normalizedId,
    existing: false,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 4,
    recordsChanged: 1,
  });

  return result;
}

export async function listFundingConversationRequests(filters?: {
  limit?: number;
  status?: 'all' | 'queued' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed';
  reviewStatus?: 'all' | 'pending' | 'acknowledged' | 'resolved';
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 25));

  let query = serviceClient
    .from('agent_task_queue')
    .select(
      'id, source_id, status, title, description, priority, created_at, started_at, completed_at, reply_to, review_decision, review_feedback, reviewed_at, needs_review, human_edits'
    )
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .order('priority', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.reviewStatus === 'pending') {
    query = query.is('review_decision', null);
  } else if (filters?.reviewStatus === 'acknowledged') {
    query = query.eq('review_decision', 'acknowledged');
  } else if (filters?.reviewStatus === 'resolved') {
    query = query.eq('review_decision', 'resolved');
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load funding conversation requests');
  }

  return ((data || []) as Array<Record<string, any>>).map((row) => {
    const replyTo =
      row.reply_to && typeof row.reply_to === 'object'
        ? (row.reply_to as Record<string, any>)
        : {};
    const communityResponse =
      replyTo.community_response && typeof replyTo.community_response === 'object'
        ? (replyTo.community_response as Record<string, any>)
        : null;
    const nextStep =
      replyTo.next_step && typeof replyTo.next_step === 'object'
        ? (replyTo.next_step as Record<string, any>)
        : null;
    const outcome =
      replyTo.outcome && typeof replyTo.outcome === 'object'
        ? (replyTo.outcome as Record<string, any>)
        : null;
    const relationshipNotice =
      replyTo.relationship_notice && typeof replyTo.relationship_notice === 'object'
        ? (replyTo.relationship_notice as Record<string, any>)
        : null;
    const relationshipNoticeResponse =
      replyTo.relationship_notice_response && typeof replyTo.relationship_notice_response === 'object'
        ? (replyTo.relationship_notice_response as Record<string, any>)
        : null;
    const auditTrail = normalizeFundingOperatingTaskAuditTrail(row.human_edits);
    const lastAudit = auditTrail.length > 0 ? auditTrail[auditTrail.length - 1] : null;

    return {
      id: String(row.id),
      sourceId: typeof row.source_id === 'string' ? row.source_id : null,
      status: typeof row.status === 'string' ? row.status : 'queued',
      title: typeof row.title === 'string' ? row.title : 'Conversation request',
      description: typeof row.description === 'string' ? row.description : '',
      priority:
        typeof row.priority === 'number' && Number.isFinite(row.priority) ? row.priority : 3,
      createdAt: row.created_at || null,
      startedAt: row.started_at || null,
      completedAt: row.completed_at || null,
      reviewDecision:
        typeof row.review_decision === 'string' ? row.review_decision : null,
      reviewFeedback:
        typeof row.review_feedback === 'string' ? row.review_feedback : null,
      reviewedAt: row.reviewed_at || null,
      needsReview: row.needs_review === true,
      recommendationId:
        typeof replyTo.recommendation_id === 'string' ? replyTo.recommendation_id : null,
      organizationId:
        typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null,
      opportunityId:
        typeof replyTo.opportunity_id === 'string' ? replyTo.opportunity_id : null,
      organizationName:
        typeof replyTo.organization_name === 'string' ? replyTo.organization_name : null,
      opportunityName:
        typeof replyTo.opportunity_name === 'string' ? replyTo.opportunity_name : null,
      funderName: typeof replyTo.funder_name === 'string' ? replyTo.funder_name : null,
      matchScore: Number(replyTo.match_score || 0),
      brief: typeof replyTo.brief === 'string' ? replyTo.brief : '',
      responseKind:
        communityResponse && typeof communityResponse.response_kind === 'string'
          ? communityResponse.response_kind
          : null,
      responseMessage:
        communityResponse && typeof communityResponse.response_message === 'string'
          ? communityResponse.response_message
          : null,
      responderName:
        communityResponse && typeof communityResponse.responder_name === 'string'
          ? communityResponse.responder_name
          : null,
      responderEmail:
        communityResponse && typeof communityResponse.responder_email === 'string'
          ? communityResponse.responder_email
          : null,
      respondedAt:
        communityResponse && typeof communityResponse.responded_at === 'string'
          ? communityResponse.responded_at
          : null,
      nextStepKind:
        nextStep && typeof nextStep.kind === 'string' ? nextStep.kind : null,
      nextStepLabel:
        nextStep && typeof nextStep.label === 'string' ? nextStep.label : null,
      nextStepScheduledAt:
        nextStep && typeof nextStep.scheduled_at === 'string'
          ? nextStep.scheduled_at
          : null,
      outcomeKind:
        outcome && typeof outcome.kind === 'string' ? outcome.kind : null,
      outcomeLabel:
        outcome && typeof outcome.label === 'string' ? outcome.label : null,
      outcomeRecordedAt:
        outcome && typeof outcome.recorded_at === 'string'
          ? outcome.recorded_at
          : null,
      outcomeFollowUpTaskId:
        outcome && typeof outcome.follow_up_task_id === 'string'
          ? outcome.follow_up_task_id
          : null,
      outcomeFollowUpKind:
        outcome && typeof outcome.follow_up_kind === 'string'
          ? outcome.follow_up_kind
          : null,
      outcomeFollowUpLabel:
        outcome && typeof outcome.follow_up_label === 'string'
          ? outcome.follow_up_label
          : null,
      relationshipNoticeKind:
        relationshipNotice && typeof relationshipNotice.kind === 'string'
          ? relationshipNotice.kind
          : null,
      relationshipNoticeLabel:
        relationshipNotice && typeof relationshipNotice.label === 'string'
          ? relationshipNotice.label
          : null,
      relationshipNoticeMessage:
        relationshipNotice && typeof relationshipNotice.message === 'string'
          ? relationshipNotice.message
          : null,
      relationshipNoticeRecordedAt:
        relationshipNotice && typeof relationshipNotice.recorded_at === 'string'
          ? relationshipNotice.recorded_at
          : null,
      relationshipNoticeRequestResponse:
        relationshipNotice && relationshipNotice.request_response === true,
      relationshipNoticeResponsePrompt:
        relationshipNotice && typeof relationshipNotice.response_prompt === 'string'
          ? relationshipNotice.response_prompt
          : null,
      relationshipNoticeResponseStatus:
        relationshipNotice && typeof relationshipNotice.response_status === 'string'
          ? relationshipNotice.response_status
          : null,
      relationshipNoticeResponseMessage:
        relationshipNoticeResponse &&
        typeof relationshipNoticeResponse.response_message === 'string'
          ? relationshipNoticeResponse.response_message
          : null,
      relationshipNoticeResponderName:
        relationshipNoticeResponse &&
        typeof relationshipNoticeResponse.responder_name === 'string'
          ? relationshipNoticeResponse.responder_name
          : null,
      relationshipNoticeResponderEmail:
        relationshipNoticeResponse &&
        typeof relationshipNoticeResponse.responder_email === 'string'
          ? relationshipNoticeResponse.responder_email
          : null,
      relationshipNoticeRespondedAt:
        relationshipNoticeResponse &&
        typeof relationshipNoticeResponse.responded_at === 'string'
          ? relationshipNoticeResponse.responded_at
          : null,
      auditEntryCount: auditTrail.length,
      lastAudit: lastAudit
        ? {
            action: typeof lastAudit.action === 'string' ? lastAudit.action : 'updated',
            actorId: typeof lastAudit.actorId === 'string' ? lastAudit.actorId : null,
            at: typeof lastAudit.at === 'string' ? lastAudit.at : null,
            summary:
              typeof lastAudit.summary === 'string' ? lastAudit.summary : 'Task updated',
          }
        : null,
    };
  });
}

export async function getFundingConversationRequestPublic(taskId: string) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, title, description, reply_to, completed_at')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load funding conversation request');
  }

  if (!data) {
    throw new Error('Validation: Funding conversation request not found');
  }

  const replyTo =
    data.reply_to && typeof data.reply_to === 'object'
      ? (data.reply_to as Record<string, any>)
      : {};
  const communityResponse =
    replyTo.community_response && typeof replyTo.community_response === 'object'
      ? (replyTo.community_response as Record<string, any>)
      : null;
  const nextStep =
    replyTo.next_step && typeof replyTo.next_step === 'object'
      ? (replyTo.next_step as Record<string, any>)
      : null;
  const outcome =
    replyTo.outcome && typeof replyTo.outcome === 'object'
      ? (replyTo.outcome as Record<string, any>)
      : null;
  const relationshipNotice =
    replyTo.relationship_notice && typeof replyTo.relationship_notice === 'object'
      ? (replyTo.relationship_notice as Record<string, any>)
      : null;
  const relationshipNoticeResponse =
    replyTo.relationship_notice_response && typeof replyTo.relationship_notice_response === 'object'
      ? (replyTo.relationship_notice_response as Record<string, any>)
      : null;

  return {
    taskId: String(data.id),
    status: typeof data.status === 'string' ? data.status : 'queued',
    title: typeof data.title === 'string' ? data.title : 'Conversation request',
    description: typeof data.description === 'string' ? data.description : '',
    organizationName:
      typeof replyTo.organization_name === 'string' ? replyTo.organization_name : null,
    opportunityName:
      typeof replyTo.opportunity_name === 'string' ? replyTo.opportunity_name : null,
    funderName: typeof replyTo.funder_name === 'string' ? replyTo.funder_name : null,
    brief: typeof replyTo.brief === 'string' ? replyTo.brief : '',
    completedAt: data.completed_at || null,
    responseKind:
      communityResponse && typeof communityResponse.response_kind === 'string'
        ? communityResponse.response_kind
        : null,
    responseMessage:
      communityResponse && typeof communityResponse.response_message === 'string'
        ? communityResponse.response_message
        : null,
    responderName:
      communityResponse && typeof communityResponse.responder_name === 'string'
        ? communityResponse.responder_name
        : null,
    responderEmail:
      communityResponse && typeof communityResponse.responder_email === 'string'
        ? communityResponse.responder_email
        : null,
    respondedAt:
      communityResponse && typeof communityResponse.responded_at === 'string'
        ? communityResponse.responded_at
        : null,
    nextStepKind:
      nextStep && typeof nextStep.kind === 'string' ? nextStep.kind : null,
    nextStepLabel:
      nextStep && typeof nextStep.label === 'string' ? nextStep.label : null,
    nextStepScheduledAt:
      nextStep && typeof nextStep.scheduled_at === 'string'
        ? nextStep.scheduled_at
        : null,
    outcomeKind:
      outcome && typeof outcome.kind === 'string' ? outcome.kind : null,
    outcomeLabel:
      outcome && typeof outcome.label === 'string' ? outcome.label : null,
    outcomeRecordedAt:
      outcome && typeof outcome.recorded_at === 'string'
        ? outcome.recorded_at
        : null,
    outcomeFollowUpTaskId:
      outcome && typeof outcome.follow_up_task_id === 'string'
        ? outcome.follow_up_task_id
        : null,
    outcomeFollowUpKind:
      outcome && typeof outcome.follow_up_kind === 'string'
        ? outcome.follow_up_kind
        : null,
    outcomeFollowUpLabel:
      outcome && typeof outcome.follow_up_label === 'string'
        ? outcome.follow_up_label
        : null,
    relationshipNoticeKind:
      relationshipNotice && typeof relationshipNotice.kind === 'string'
        ? relationshipNotice.kind
        : null,
    relationshipNoticeLabel:
      relationshipNotice && typeof relationshipNotice.label === 'string'
        ? relationshipNotice.label
        : null,
    relationshipNoticeMessage:
      relationshipNotice && typeof relationshipNotice.message === 'string'
        ? relationshipNotice.message
        : null,
    relationshipNoticeRecordedAt:
      relationshipNotice && typeof relationshipNotice.recorded_at === 'string'
        ? relationshipNotice.recorded_at
        : null,
    relationshipNoticeRequestResponse:
      relationshipNotice && relationshipNotice.request_response === true,
    relationshipNoticeResponsePrompt:
      relationshipNotice && typeof relationshipNotice.response_prompt === 'string'
        ? relationshipNotice.response_prompt
        : null,
    relationshipNoticeResponseStatus:
      relationshipNotice && typeof relationshipNotice.response_status === 'string'
        ? relationshipNotice.response_status
        : null,
    relationshipNoticeResponseMessage:
      relationshipNoticeResponse &&
      typeof relationshipNoticeResponse.response_message === 'string'
        ? relationshipNoticeResponse.response_message
        : null,
    relationshipNoticeResponderName:
      relationshipNoticeResponse &&
      typeof relationshipNoticeResponse.responder_name === 'string'
        ? relationshipNoticeResponse.responder_name
        : null,
    relationshipNoticeResponderEmail:
      relationshipNoticeResponse &&
      typeof relationshipNoticeResponse.responder_email === 'string'
        ? relationshipNoticeResponse.responder_email
        : null,
    relationshipNoticeRespondedAt:
      relationshipNoticeResponse &&
      typeof relationshipNoticeResponse.responded_at === 'string'
        ? relationshipNoticeResponse.responded_at
        : null,
  };
}

export async function submitFundingConversationRequestResponse(
  taskId: string,
  input: {
    responderName?: string | null;
    responderEmail?: string | null;
    responseKind: 'interested' | 'needs_more_info' | 'not_now';
    responseMessage: string;
  }
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const responseKind = String(input.responseKind || '').trim().toLowerCase();
  const responseMessage = String(input.responseMessage || '').trim();
  const responderName = String(input.responderName || '').trim();
  const responderEmail = String(input.responderEmail || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['interested', 'needs_more_info', 'not_now'].includes(responseKind)) {
    throw new Error('Validation: responseKind must be interested, needs_more_info, or not_now');
  }

  if (!responseMessage) {
    throw new Error('Validation: responseMessage is required');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, started_at, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load funding conversation request');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding conversation request not found');
  }

  const currentStatus = String(currentTask.status || 'queued').trim().toLowerCase();
  if (currentStatus === 'completed') {
    throw new Error('Validation: This conversation request is already closed');
  }

  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const respondedAt = new Date().toISOString();
  const communityResponse = {
    responder_name: responderName || null,
    responder_email: responderEmail || null,
    response_kind: responseKind,
    response_message: responseMessage,
    responded_at: respondedAt,
  };
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    'community',
    `Community responded: ${responseKind.replace(/_/g, ' ')}`,
    {
      responseKind,
      respondedAt,
    }
  );

  const updatePayload: Record<string, unknown> = {
    reply_to: {
      ...replyTo,
      community_response: communityResponse,
    },
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
    needs_review: true,
    review_decision: null,
    review_feedback: null,
    reviewed_at: null,
  };

  if (currentStatus === 'queued' || currentStatus === 'pending') {
    updatePayload.status = 'running';
    updatePayload.started_at = currentTask.started_at || respondedAt;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .select('id')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save conversation response');
  }

  try {
    const { data: linkedRelationships, error: linkedRelationshipsError } = await serviceClient
      .from('funding_relationship_engagements')
      .select('id, metadata')
      .eq('parent_conversation_task_id', normalizedId)
      .neq('relationship_status', 'completed')
      .neq('relationship_status', 'closed');

    if (!linkedRelationshipsError) {
      for (const relationship of (linkedRelationships || []) as Array<Record<string, any>>) {
        const relationshipId = typeof relationship.id === 'string' ? relationship.id : null;
        if (!relationshipId) continue;

        const existingMetadata =
          relationship.metadata && typeof relationship.metadata === 'object'
            ? (relationship.metadata as Record<string, any>)
            : {};
        const currentStageKey =
          typeof existingMetadata.stage_key === 'string' ? existingMetadata.stage_key : null;

        if (currentStageKey !== 'waiting_response') {
          continue;
        }

        let relationshipStatus = 'active';
        let currentStageLabel = 'Waiting for response';
        let nextActionLabel = 'Review the next inbound response';
        let nextStageKey: string = currentStageKey;
        let nextStageTaskId: string | null = null;
        let nextStageTaskKind: string | null = null;
        let nextStageTaskLabel: string | null = null;
        let nextStageTaskStatus: string | null = null;
        let nextPathwayTaskId =
          typeof existingMetadata.pathway_task_id === 'string'
            ? existingMetadata.pathway_task_id
            : null;
        let nextPathwayTaskKind =
          typeof existingMetadata.pathway_task_kind === 'string'
            ? existingMetadata.pathway_task_kind
            : null;
        let nextPathwayTaskLabel =
          typeof existingMetadata.pathway_task_label === 'string'
            ? existingMetadata.pathway_task_label
            : null;
        let nextPathwayTaskStatus =
          typeof existingMetadata.pathway_task_status === 'string'
            ? existingMetadata.pathway_task_status
            : null;

        if (responseKind === 'interested') {
          currentStageLabel = 'Engaged partner';
          nextActionLabel = 'Advance the funding pathway';
          nextStageKey = 'engaged_partner';
          const pathwayTask = await ensureFundingRelationshipPathwayTask(
            serviceClient,
            relationshipId,
            null,
            'system'
          );
          nextPathwayTaskId = pathwayTask.pathwayTaskId;
          nextPathwayTaskKind = pathwayTask.pathwayTaskKind;
          nextPathwayTaskLabel = pathwayTask.pathwayTaskLabel;
          nextPathwayTaskStatus = pathwayTask.pathwayTaskStatus;
        } else if (responseKind === 'needs_more_info') {
          currentStageLabel = 'Information requested';
          nextActionLabel = 'Send the requested information';
          nextStageKey = 'needs_more_info';
          nextStageTaskKind = 'send_requested_information';
          nextStageTaskLabel = 'Send the requested information';

          const { data: existingStageTask, error: existingStageTaskError } = await serviceClient
            .from('agent_task_queue')
            .select('id, status')
            .eq('source', 'funding_relationship_stage')
            .eq('task_type', 'funding_relationship_stage_action')
            .eq('source_id', relationshipId)
            .filter('reply_to->>stage_key', 'eq', 'needs_more_info')
            .neq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!existingStageTaskError && existingStageTask?.id) {
            nextStageTaskId = String(existingStageTask.id);
            nextStageTaskStatus =
              typeof existingStageTask.status === 'string' ? existingStageTask.status : 'queued';
          } else if (!existingStageTaskError) {
            const stageTaskAudit = createFundingOperatingTaskAuditEntry(
              'reviewed',
              'system',
              'Queued relationship stage action: Send the requested information.',
              {
                relationshipId,
                stageKey: 'needs_more_info',
              }
            );
            const stageTaskPayload: Record<string, any> = {
              source: 'funding_relationship_stage',
              source_id: relationshipId,
              task_type: 'funding_relationship_stage_action',
              title: 'Send requested information',
              description:
                'The organization asked for more information. Send the requested context and materials.',
              status: 'queued',
              priority: 2,
              requested_by: null,
              needs_review: false,
              reply_to: {
                relationship_id: relationshipId,
                stage_key: 'needs_more_info',
                stage_task_kind: nextStageTaskKind,
                stage_task_label: nextStageTaskLabel,
              },
              human_edits: [stageTaskAudit] as any,
            };
            const { data: createdStageTask, error: createStageTaskError } = await serviceClient
              .from('agent_task_queue')
              .insert(stageTaskPayload as any)
              .select('id, status')
              .single();

            if (!createStageTaskError && createdStageTask) {
              nextStageTaskId = String(createdStageTask.id);
              nextStageTaskStatus =
                typeof createdStageTask.status === 'string' ? createdStageTask.status : 'queued';
            }
          }
        } else if (responseKind === 'not_now') {
          relationshipStatus = 'paused';
          currentStageLabel = 'Paused after community response';
          nextActionLabel = 'Schedule a later check-in';
          nextStageKey = 'paused_after_response';
        }

        await serviceClient
          .from('funding_relationship_engagements')
          .update({
            relationship_status: relationshipStatus,
            current_stage_label: currentStageLabel,
            next_action_label: nextActionLabel,
            next_action_due_at: respondedAt,
            last_engaged_at: respondedAt,
            updated_by: null,
            metadata: {
              ...existingMetadata,
              stage_key: nextStageKey,
              stage_updated_at: respondedAt,
              stage_task_id: nextStageTaskId,
              stage_task_kind: nextStageTaskKind,
              stage_task_label: nextStageTaskLabel,
              stage_task_status: nextStageTaskStatus,
              pathway_task_id: nextPathwayTaskId,
              pathway_task_kind: nextPathwayTaskKind,
              pathway_task_label: nextPathwayTaskLabel,
              pathway_task_status: nextPathwayTaskStatus,
              last_community_response_kind: responseKind,
              last_community_responded_at: respondedAt,
            },
          } as any)
          .eq('id', relationshipId);
      }
    }
  } catch {
    // Keep the public reply path resilient even if relationship sync encounters drift.
  }

  return {
    taskId: normalizedId,
    responseKind,
    responseMessage,
    responderName: responderName || null,
    responderEmail: responderEmail || null,
    respondedAt,
  };
}

export async function submitFundingConversationRelationshipNoticeResponse(
  taskId: string,
  input: {
    responderName?: string | null;
    responderEmail?: string | null;
    responseMessage: string;
  }
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const responseMessage = String(input.responseMessage || '').trim();
  const responderName = String(input.responderName || '').trim();
  const responderEmail = String(input.responderEmail || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!responseMessage) {
    throw new Error('Validation: responseMessage is required');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, started_at, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load funding conversation request');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding conversation request not found');
  }

  const currentStatus = String(currentTask.status || 'queued').trim().toLowerCase();
  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const relationshipNotice =
    replyTo.relationship_notice && typeof replyTo.relationship_notice === 'object'
      ? (replyTo.relationship_notice as Record<string, any>)
      : null;

  if (!relationshipNotice) {
    throw new Error('Validation: No relationship update is available for this conversation');
  }

  if (relationshipNotice.request_response !== true) {
    throw new Error('Validation: This relationship update does not require a response');
  }

  if (relationshipNotice.response_status === 'received') {
    throw new Error('Validation: This relationship update already has a recorded response');
  }

  const respondedAt = new Date().toISOString();
  const noticeResponse = {
    responder_name: responderName || null,
    responder_email: responderEmail || null,
    response_message: responseMessage,
    responded_at: respondedAt,
  };
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    'community',
    'Community replied to relationship update',
    {
      respondedAt,
      noticeKind:
        typeof relationshipNotice.kind === 'string' ? relationshipNotice.kind : null,
    }
  );

  const updatePayload: Record<string, unknown> = {
    reply_to: {
      ...replyTo,
      relationship_notice: {
        ...relationshipNotice,
        response_status: 'received',
        response_received_at: respondedAt,
      },
      relationship_notice_response: noticeResponse,
    },
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
    needs_review: true,
    review_decision: null,
    review_feedback: null,
    reviewed_at: null,
  };

  if (currentStatus === 'queued' || currentStatus === 'pending') {
    updatePayload.status = 'running';
    updatePayload.started_at = currentTask.started_at || respondedAt;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .select('id')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save relationship update response');
  }

  return {
    taskId: normalizedId,
    responderName: responderName || null,
    responderEmail: responderEmail || null,
    responseMessage,
    respondedAt,
    responseStatus: 'received',
    status: updatePayload.status || currentStatus,
  };
}

export async function acknowledgeFundingConversationResponse(
  taskId: string,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load funding conversation request');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding conversation request not found');
  }

  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const communityResponse =
    replyTo.community_response && typeof replyTo.community_response === 'object'
      ? (replyTo.community_response as Record<string, any>)
      : null;
  const relationshipNoticeResponse =
    replyTo.relationship_notice_response && typeof replyTo.relationship_notice_response === 'object'
      ? (replyTo.relationship_notice_response as Record<string, any>)
      : null;

  if (!communityResponse && !relationshipNoticeResponse) {
    throw new Error('Validation: No community reply has been received yet');
  }

  const responseTimestamp =
    communityResponse && typeof communityResponse.responded_at === 'string'
      ? communityResponse.responded_at
      : relationshipNoticeResponse && typeof relationshipNoticeResponse.responded_at === 'string'
        ? relationshipNoticeResponse.responded_at
        : null;
  const responseSummary = relationshipNoticeResponse
    ? 'Acknowledged community reply to relationship update.'
    : 'Acknowledged community response.';

  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    adminUserId,
    responseSummary,
    {
      respondedAt: responseTimestamp,
      replyKind: relationshipNoticeResponse ? 'relationship_notice' : 'conversation',
    }
  );

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update({
      needs_review: false,
      review_decision: 'acknowledged',
      reviewed_at: now,
      requested_by: adminUserId,
      human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
    })
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .select('id, review_decision, reviewed_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to acknowledge conversation response');
  }

  return {
    taskId: normalizedId,
    reviewDecision:
      typeof data.review_decision === 'string' ? data.review_decision : 'acknowledged',
    reviewedAt: data.reviewed_at || now,
  };
}

export async function scheduleFundingConversationNextStep(
  taskId: string,
  adminUserId: string,
  options?: {
    nextStepKind?:
      | 'intro_call'
      | 'send_follow_up_info'
      | 'check_in_later'
      | 'reassess_relationship_pause'
      | 'review_pipeline_risk_context'
      | 'review_relationship_update_reply';
  }
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load funding conversation request');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding conversation request not found');
  }

  const currentStatus = String(currentTask.status || 'queued').trim().toLowerCase();

  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const communityResponse =
    replyTo.community_response && typeof replyTo.community_response === 'object'
      ? (replyTo.community_response as Record<string, any>)
      : null;
  const relationshipNotice =
    replyTo.relationship_notice && typeof replyTo.relationship_notice === 'object'
      ? (replyTo.relationship_notice as Record<string, any>)
      : null;
  const relationshipNoticeResponse =
    replyTo.relationship_notice_response && typeof replyTo.relationship_notice_response === 'object'
      ? (replyTo.relationship_notice_response as Record<string, any>)
      : null;

  if (!communityResponse && !relationshipNoticeResponse) {
    throw new Error('Validation: No community reply has been received yet');
  }

  if (currentStatus === 'completed' && !relationshipNoticeResponse) {
    throw new Error('Validation: This conversation request is already closed');
  }

  const responseKind = communityResponse
    ? String(communityResponse.response_kind || '').trim().toLowerCase()
    : '';
  const requestedNextStepKind = String(options?.nextStepKind || '')
    .trim()
    .toLowerCase();
  const now = new Date().toISOString();

  let kind = 'review_follow_up';
  let label = 'Review response and decide next move';

  if (communityResponse) {
    if (responseKind === 'interested') {
      kind = 'intro_call';
      label = 'Schedule an intro call';
    } else if (responseKind === 'needs_more_info') {
      kind = 'send_follow_up_info';
      label = 'Send follow-up information';
    } else if (responseKind === 'not_now') {
      kind = 'check_in_later';
      label = 'Schedule a later check-in';
    }
  } else {
    const relationshipNoticeKind =
      relationshipNotice && typeof relationshipNotice.kind === 'string'
        ? relationshipNotice.kind
        : '';

    if (relationshipNoticeKind === 'relationship_paused') {
      kind = 'reassess_relationship_pause';
      label = 'Review the pause and decide whether to re-open the relationship';
    } else if (relationshipNoticeKind === 'pipeline_risk_escalated') {
      kind = 'review_pipeline_risk_context';
      label = 'Review the added context and adjust the pipeline-risk response';
    } else {
      kind = 'review_relationship_update_reply';
      label = 'Review the relationship update reply';
    }
  }

  if (
    !communityResponse &&
    [
      'reassess_relationship_pause',
      'review_pipeline_risk_context',
      'review_relationship_update_reply',
    ].includes(requestedNextStepKind)
  ) {
    kind = requestedNextStepKind;
    if (requestedNextStepKind === 'reassess_relationship_pause') {
      label = 'Review the pause and decide whether to re-open the relationship';
    } else if (requestedNextStepKind === 'review_pipeline_risk_context') {
      label = 'Review the added context and adjust the pipeline-risk response';
    } else {
      label = 'Review the relationship update reply';
    }
  }

  const nextStep = {
    kind,
    label,
    scheduled_at: now,
    scheduled_by: adminUserId,
  };
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    adminUserId,
    `Accepted response and scheduled next step: ${label}.`,
    {
      nextStepKind: kind,
      responseKind: communityResponse ? responseKind : 'relationship_notice_reply',
    }
  );

  const updatePayload: Record<string, unknown> = {
    reply_to: {
      ...replyTo,
      ...(relationshipNotice
        ? {
            relationship_notice: {
              ...relationshipNotice,
              response_status: relationshipNoticeResponse ? 'scheduled' : relationshipNotice.response_status,
              follow_up_scheduled_at: relationshipNoticeResponse ? now : relationshipNotice.follow_up_scheduled_at,
            },
          }
        : {}),
      next_step: nextStep,
    },
    needs_review: false,
    review_decision: 'acknowledged',
    reviewed_at: now,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  if (currentStatus === 'queued' || currentStatus === 'pending') {
    updatePayload.status = 'running';
    updatePayload.started_at = now;
  } else if (currentStatus === 'completed' && relationshipNoticeResponse) {
    updatePayload.status = 'running';
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .select('id, review_decision, reviewed_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to schedule conversation next step');
  }

  return {
    taskId: normalizedId,
    nextStepKind: kind,
    nextStepLabel: label,
    nextStepScheduledAt: now,
    reviewDecision:
      typeof data.review_decision === 'string' ? data.review_decision : 'acknowledged',
    reviewedAt: data.reviewed_at || now,
  };
}

export async function closeFundingConversationWithOutcome(
  taskId: string,
  outcome: 'mutual_fit' | 'paused_after_check_in',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedOutcome = String(outcome || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['mutual_fit', 'paused_after_check_in'].includes(normalizedOutcome)) {
    throw new Error('Validation: outcome must be mutual_fit or paused_after_check_in');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load funding conversation request');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding conversation request not found');
  }

  const currentStatus = String(currentTask.status || 'queued').trim().toLowerCase();
  if (currentStatus === 'completed') {
    throw new Error('Validation: This conversation request is already closed');
  }

  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const communityResponse =
    replyTo.community_response && typeof replyTo.community_response === 'object'
      ? (replyTo.community_response as Record<string, any>)
      : null;
  const nextStep =
    replyTo.next_step && typeof replyTo.next_step === 'object'
      ? (replyTo.next_step as Record<string, any>)
      : null;

  if (!communityResponse) {
    throw new Error('Validation: No community response has been received yet');
  }

  if (!nextStep) {
    throw new Error('Validation: A next step must be scheduled before closing this conversation');
  }

  const now = new Date().toISOString();
  const label =
    normalizedOutcome === 'mutual_fit'
      ? 'Conversation completed with mutual fit'
      : 'Paused after check-in';
  const followUpKind =
    normalizedOutcome === 'mutual_fit' ? 'schedule_intro_call' : 'schedule_later_check_in';
  const followUpLabel =
    normalizedOutcome === 'mutual_fit'
      ? 'Schedule intro call with organization'
      : 'Schedule later check-in with organization';
  const followUpTitle =
    normalizedOutcome === 'mutual_fit'
      ? `Schedule intro call with ${String(replyTo.organization_name || 'organization')}`
      : `Schedule later check-in with ${String(replyTo.organization_name || 'organization')}`;
  const followUpDescription =
    normalizedOutcome === 'mutual_fit'
      ? `Progress the funding conversation into a real intro call for ${String(
          replyTo.opportunity_name || 'the current opportunity'
        )}.`
      : `Set a later check-in for ${String(
          replyTo.opportunity_name || 'the current opportunity'
        )} after the recent conversation.`;
  let followUpTaskId: string | null = null;
  let followUpTaskCreated = false;

  const { data: existingFollowUp, error: existingFollowUpError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_conversation_outcome')
    .eq('task_type', 'funding_conversation_outcome_follow_up')
    .eq('source_id', normalizedId)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingFollowUpError) {
    throw new Error(
      existingFollowUpError.message || 'Failed to load conversation outcome follow-up task'
    );
  }

  if (existingFollowUp?.id) {
    followUpTaskId = String(existingFollowUp.id);
  } else {
    const createdAt = new Date().toISOString();
    const followUpAudit = createFundingOperatingTaskAuditEntry(
      'reviewed',
      adminUserId,
      `Queued outcome follow-up: ${followUpLabel}.`,
      {
        parentConversationTaskId: normalizedId,
        outcome: normalizedOutcome,
      }
    );
    const followUpInsertPayload: Record<string, any> = {
      source: 'funding_conversation_outcome',
      source_id: normalizedId,
      task_type: 'funding_conversation_outcome_follow_up',
      title: followUpTitle,
      description: followUpDescription,
      status: 'queued',
      priority: normalizedOutcome === 'mutual_fit' ? 2 : 3,
      requested_by: adminUserId,
      needs_review: false,
      reply_to: {
        parent_conversation_task_id: normalizedId,
        recommendation_id:
          typeof replyTo.recommendation_id === 'string' ? replyTo.recommendation_id : null,
        organization_id:
          typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null,
        organization_name:
          typeof replyTo.organization_name === 'string' ? replyTo.organization_name : null,
        opportunity_id:
          typeof replyTo.opportunity_id === 'string' ? replyTo.opportunity_id : null,
        opportunity_name:
          typeof replyTo.opportunity_name === 'string' ? replyTo.opportunity_name : null,
        funder_name:
          typeof replyTo.funder_name === 'string' ? replyTo.funder_name : null,
        match_score:
          typeof replyTo.match_score === 'number'
            ? replyTo.match_score
            : Number(replyTo.match_score || 0),
        follow_up_kind: followUpKind,
        follow_up_label: followUpLabel,
        outcome_kind: normalizedOutcome,
      },
      human_edits: [followUpAudit] as any,
      created_at: createdAt,
    };
    const { data: createdFollowUp, error: createFollowUpError } = await serviceClient
      .from('agent_task_queue')
      .insert(followUpInsertPayload as any)
      .select('id')
      .single();

    if (createFollowUpError || !createdFollowUp) {
      throw new Error(createFollowUpError?.message || 'Failed to create outcome follow-up task');
    }

    followUpTaskId = String(createdFollowUp.id);
    followUpTaskCreated = true;
  }

  const outcomeRecord = {
    kind: normalizedOutcome,
    label,
    recorded_at: now,
    recorded_by: adminUserId,
    follow_up_task_id: followUpTaskId,
    follow_up_kind: followUpKind,
    follow_up_label: followUpLabel,
  };
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    adminUserId,
    label,
    {
      outcome: normalizedOutcome,
    }
  );

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update({
      status: 'completed',
      completed_at: now,
      needs_review: false,
      review_decision: 'resolved',
      reviewed_at: now,
      requested_by: adminUserId,
      reply_to: {
        ...replyTo,
        outcome: outcomeRecord,
      },
      human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
    })
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .select('id, completed_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to close conversation request');
  }

  return {
    taskId: normalizedId,
    outcomeKind: normalizedOutcome,
    outcomeLabel: label,
    outcomeRecordedAt: now,
    outcomeFollowUpTaskId: followUpTaskId,
    outcomeFollowUpKind: followUpKind,
    outcomeFollowUpLabel: followUpLabel,
    outcomeFollowUpTaskCreated: followUpTaskCreated,
    completedAt: data.completed_at || now,
  };
}

export async function listFundingConversationOutcomeFollowUps(filters?: {
  limit?: number;
  status?: 'all' | 'queued' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed';
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 25));

  let query = serviceClient
    .from('agent_task_queue')
    .select(
      'id, source_id, status, title, description, priority, created_at, started_at, completed_at, reply_to, human_edits'
    )
    .eq('source', 'funding_conversation_outcome')
    .eq('task_type', 'funding_conversation_outcome_follow_up')
    .order('priority', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load conversation outcome follow-ups');
  }

  const rows = (data || []) as Array<Record<string, any>>;
  const followUpIds = rows
    .map((row) => (typeof row.id === 'string' ? row.id : null))
    .filter((value): value is string => Boolean(value));
  const promotedRelationshipMap = new Map<
    string,
    { id: string; status: string }
  >();

  if (followUpIds.length > 0) {
    const { data: relationshipRows, error: relationshipError } = await serviceClient
      .from('funding_relationship_engagements')
      .select('id, source_follow_up_task_id, relationship_status')
      .in('source_follow_up_task_id', followUpIds);

    if (relationshipError) {
      throw new Error(
        relationshipError.message || 'Failed to load promoted relationship records'
      );
    }

    for (const row of (relationshipRows || []) as Array<Record<string, any>>) {
      const sourceFollowUpTaskId =
        typeof row.source_follow_up_task_id === 'string' ? row.source_follow_up_task_id : null;
      if (!sourceFollowUpTaskId) continue;
      promotedRelationshipMap.set(sourceFollowUpTaskId, {
        id: typeof row.id === 'string' ? row.id : '',
        status:
          typeof row.relationship_status === 'string' ? row.relationship_status : 'active',
      });
    }
  }

  return rows.map((row) => {
    const replyTo =
      row.reply_to && typeof row.reply_to === 'object'
        ? (row.reply_to as Record<string, any>)
        : {};
    const auditTrail = normalizeFundingOperatingTaskAuditTrail(row.human_edits);
    const lastAudit = auditTrail.length > 0 ? auditTrail[auditTrail.length - 1] : null;

    return {
      id: String(row.id),
      parentConversationTaskId:
        typeof row.source_id === 'string' ? row.source_id : null,
      status: typeof row.status === 'string' ? row.status : 'queued',
      title: typeof row.title === 'string' ? row.title : 'Conversation outcome follow-up',
      description: typeof row.description === 'string' ? row.description : '',
      priority:
        typeof row.priority === 'number' && Number.isFinite(row.priority) ? row.priority : 3,
      createdAt: row.created_at || null,
      startedAt: row.started_at || null,
      completedAt: row.completed_at || null,
      organizationId:
        typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null,
      organizationName:
        typeof replyTo.organization_name === 'string' ? replyTo.organization_name : null,
      opportunityId:
        typeof replyTo.opportunity_id === 'string' ? replyTo.opportunity_id : null,
      opportunityName:
        typeof replyTo.opportunity_name === 'string' ? replyTo.opportunity_name : null,
      funderName: typeof replyTo.funder_name === 'string' ? replyTo.funder_name : null,
      recommendationId:
        typeof replyTo.recommendation_id === 'string' ? replyTo.recommendation_id : null,
      matchScore:
        typeof replyTo.match_score === 'number'
          ? replyTo.match_score
          : Number(replyTo.match_score || 0),
      followUpKind:
        typeof replyTo.follow_up_kind === 'string' ? replyTo.follow_up_kind : null,
      followUpLabel:
        typeof replyTo.follow_up_label === 'string' ? replyTo.follow_up_label : null,
      outcomeKind:
        typeof replyTo.outcome_kind === 'string' ? replyTo.outcome_kind : null,
      promotedRelationshipId:
        promotedRelationshipMap.get(String(row.id))?.id || null,
      promotedRelationshipStatus:
        promotedRelationshipMap.get(String(row.id))?.status || null,
      auditEntryCount: auditTrail.length,
      lastAudit: lastAudit
        ? {
            action: typeof lastAudit.action === 'string' ? lastAudit.action : 'updated',
            actorId: typeof lastAudit.actorId === 'string' ? lastAudit.actorId : null,
            at: typeof lastAudit.at === 'string' ? lastAudit.at : null,
            summary:
              typeof lastAudit.summary === 'string' ? lastAudit.summary : 'Task updated',
          }
        : null,
    };
  });
}

export async function updateFundingConversationOutcomeFollowUpStatus(
  taskId: string,
  status: 'queued' | 'running' | 'completed',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['queued', 'running', 'completed'].includes(normalizedStatus)) {
    throw new Error('Validation: status must be queued, running, or completed');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_outcome')
    .eq('task_type', 'funding_conversation_outcome_follow_up')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load conversation outcome follow-up');
  }

  if (!currentTask) {
    throw new Error('Validation: Conversation outcome follow-up not found');
  }

  const previousStatus = typeof currentTask.status === 'string' ? currentTask.status : null;
  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    `Changed outcome follow-up status to ${normalizedStatus}`,
    {
      fromStatus: previousStatus,
      toStatus: normalizedStatus,
    }
  );
  const updatePayload: Record<string, unknown> = {
    status: normalizedStatus,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  if (normalizedStatus === 'queued') {
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'running') {
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  } else {
    updatePayload.started_at = now;
    updatePayload.completed_at = now;
    updatePayload.needs_review = false;
    updatePayload.review_decision = 'resolved';
    updatePayload.reviewed_at = now;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_outcome')
    .eq('task_type', 'funding_conversation_outcome_follow_up')
    .select('id, status, started_at, completed_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update conversation outcome follow-up');
  }

  return {
    taskId: normalizedId,
    status: typeof data.status === 'string' ? data.status : normalizedStatus,
    startedAt: data.started_at || null,
    completedAt: data.completed_at || null,
  };
}

export async function promoteFundingConversationFollowUpToRelationship(
  followUpTaskId: string,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(followUpTaskId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: followUpTaskId is required');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, source_id, status, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_outcome')
    .eq('task_type', 'funding_conversation_outcome_follow_up')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load conversation outcome follow-up');
  }

  if (!currentTask) {
    throw new Error('Validation: Conversation outcome follow-up not found');
  }

  const currentStatus = String(currentTask.status || 'queued').trim().toLowerCase();
  if (currentStatus !== 'completed') {
    throw new Error('Validation: Complete the outcome follow-up before promoting it');
  }

  const { data: existingRelationship, error: existingRelationshipError } = await serviceClient
    .from('funding_relationship_engagements')
    .select('id, relationship_status')
    .eq('source_follow_up_task_id', normalizedId)
    .maybeSingle();

  if (existingRelationshipError) {
    throw new Error(existingRelationshipError.message || 'Failed to load existing relationship');
  }

  if (existingRelationship?.id) {
    return {
      relationshipId: String(existingRelationship.id),
      relationshipStatus:
        typeof existingRelationship.relationship_status === 'string'
          ? existingRelationship.relationship_status
          : 'active',
      sourceFollowUpTaskId: normalizedId,
      existing: true,
    };
  }

  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const organizationId =
    typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null;

  if (!organizationId) {
    throw new Error('Validation: This follow-up is missing an organization');
  }

  const followUpKind =
    typeof replyTo.follow_up_kind === 'string' ? replyTo.follow_up_kind : 'send_follow_up_info';
  const now = new Date().toISOString();
  const engagementKind =
    followUpKind === 'schedule_intro_call'
      ? 'intro_call'
      : followUpKind === 'schedule_later_check_in'
        ? 'reengagement_window'
        : 'info_follow_up';
  const currentStageLabel =
    followUpKind === 'schedule_intro_call'
      ? 'Intro call ready'
      : followUpKind === 'schedule_later_check_in'
        ? 'Later check-in ready'
        : 'Information follow-up ready';
  const nextActionLabel =
    typeof replyTo.follow_up_label === 'string' ? replyTo.follow_up_label : currentStageLabel;

  const insertPayload: Record<string, any> = {
    source_follow_up_task_id: normalizedId,
    parent_conversation_task_id:
      typeof currentTask.source_id === 'string' ? currentTask.source_id : null,
    organization_id: organizationId,
    recommendation_id:
      typeof replyTo.recommendation_id === 'string' ? replyTo.recommendation_id : null,
    opportunity_id:
      typeof replyTo.opportunity_id === 'string' ? replyTo.opportunity_id : null,
    engagement_kind: engagementKind,
    relationship_status: 'active',
    current_stage_label: currentStageLabel,
    next_action_label: nextActionLabel,
    next_action_due_at: now,
    last_engaged_at: now,
    created_by: adminUserId,
    updated_by: adminUserId,
    metadata: {
      source: 'conversation_outcome_follow_up',
      source_follow_up_kind: followUpKind,
      outcome_kind:
        typeof replyTo.outcome_kind === 'string' ? replyTo.outcome_kind : null,
    },
  };

  const { data: relationship, error: createError } = await serviceClient
    .from('funding_relationship_engagements')
    .insert(insertPayload as any)
    .select('id, relationship_status')
    .single();

  if (createError || !relationship) {
    throw new Error(createError?.message || 'Failed to create relationship engagement');
  }

  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    adminUserId,
    'Promoted follow-up into engaged relationship.',
    {
      relationshipId: relationship.id,
      engagementKind,
    }
  );

  const { error: taskUpdateError } = await serviceClient
    .from('agent_task_queue')
    .update({
      requested_by: adminUserId,
      human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
    })
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_outcome')
    .eq('task_type', 'funding_conversation_outcome_follow_up');

  if (taskUpdateError) {
    throw new Error(taskUpdateError.message || 'Failed to update follow-up audit trail');
  }

  return {
    relationshipId: String(relationship.id),
    relationshipStatus:
      typeof relationship.relationship_status === 'string'
        ? relationship.relationship_status
        : 'active',
    sourceFollowUpTaskId: normalizedId,
    engagementKind,
    currentStageLabel,
    existing: false,
  };
}

async function ensureFundingRelationshipPathwayTask(
  serviceClient: any,
  relationshipId: string,
  requestedBy: string | null,
  actorId: string
) {
  const normalizedRelationshipId = String(relationshipId || '').trim();
  if (!normalizedRelationshipId) {
    return {
      pathwayTaskId: null,
      pathwayTaskKind: null,
      pathwayTaskLabel: null,
      pathwayTaskStatus: null,
    };
  }

  const pathwayTaskKind = 'advance_funding_pathway';
  const pathwayTaskLabel = 'Advance the funding pathway';

  const { data: existingTask, error: existingTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_relationship_pathway')
    .eq('task_type', 'funding_pathway_progression')
    .eq('source_id', normalizedRelationshipId)
    .filter('reply_to->>pathway_task_kind', 'eq', pathwayTaskKind)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTaskError) {
    throw new Error(existingTaskError.message || 'Failed to load funding pathway task');
  }

  if (existingTask?.id) {
    return {
      pathwayTaskId: String(existingTask.id),
      pathwayTaskKind,
      pathwayTaskLabel,
      pathwayTaskStatus:
        typeof existingTask.status === 'string' ? existingTask.status : 'queued',
    };
  }

  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    actorId,
    'Queued funding pathway action: Advance the funding pathway.',
    {
      relationshipId: normalizedRelationshipId,
      pathwayTaskKind,
    }
  );

  const { data: createdTask, error: createdTaskError } = await serviceClient
    .from('agent_task_queue')
    .insert({
      source: 'funding_relationship_pathway',
      source_id: normalizedRelationshipId,
      task_type: 'funding_pathway_progression',
      title: 'Advance engaged partner into funding pathway',
      description:
        'Turn this engaged relationship into the next concrete funding progression step.',
      status: 'queued',
      priority: 2,
      requested_by: requestedBy,
      needs_review: false,
      reply_to: {
        relationship_id: normalizedRelationshipId,
        pathway_task_kind: pathwayTaskKind,
        pathway_task_label: pathwayTaskLabel,
      },
      human_edits: [auditEntry] as any,
    } as any)
    .select('id, status')
    .single();

  if (createdTaskError || !createdTask) {
    throw new Error(createdTaskError?.message || 'Failed to create funding pathway task');
  }

  return {
    pathwayTaskId: String(createdTask.id),
    pathwayTaskKind,
    pathwayTaskLabel,
    pathwayTaskStatus:
      typeof createdTask.status === 'string' ? createdTask.status : 'queued',
  };
}

function getFundingRelationshipDownstreamCheckpoint(
  applicationId?: string | null,
  awardId?: string | null
) {
  if (awardId) {
    return {
      stageKey: 'award_recommended',
      currentStageLabel: 'Award recommended',
      nextActionLabel: 'Track the recommended award and community commitments',
    };
  }

  if (applicationId) {
    return {
      stageKey: 'application_live',
      currentStageLabel: 'Application live',
      nextActionLabel: 'Track the live application and next funding step',
    };
  }

  return {
    stageKey: 'engaged_partner',
    currentStageLabel: 'Engaged partner',
    nextActionLabel: 'Advance the funding pathway',
  };
}

export async function listFundingRelationshipEngagements(filters?: {
  limit?: number;
  status?: 'all' | 'active' | 'paused' | 'completed' | 'closed';
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 25));

  let query = serviceClient
    .from('funding_relationship_engagements')
    .select(
      'id, source_follow_up_task_id, parent_conversation_task_id, organization_id, recommendation_id, opportunity_id, engagement_kind, relationship_status, current_stage_label, next_action_label, next_action_due_at, last_engaged_at, notes, metadata, created_at, updated_at'
    )
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('relationship_status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load relationship engagements');
  }

  const rows = (data || []) as Array<Record<string, any>>;
  const organizationIds = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.organization_id === 'string' ? row.organization_id : null))
        .filter((value): value is string => Boolean(value))
    )
  );
  const opportunityIds = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.opportunity_id === 'string' ? row.opportunity_id : null))
        .filter((value): value is string => Boolean(value))
    )
  );

  const organizationMap = new Map<string, { name: string; city?: string | null; state?: string | null }>();
  const opportunityMap = new Map<string, { name: string; funderName?: string | null }>();

  if (organizationIds.length > 0) {
    const { data: organizationRows, error: organizationError } = await serviceClient
      .from('organizations')
      .select('id, name, city, state')
      .in('id', organizationIds);

    if (organizationError) {
      throw new Error(organizationError.message || 'Failed to load relationship organizations');
    }

    for (const row of (organizationRows || []) as Array<Record<string, any>>) {
      if (typeof row.id !== 'string') continue;
      organizationMap.set(row.id, {
        name: typeof row.name === 'string' ? row.name : 'Organization',
        city: typeof row.city === 'string' ? row.city : null,
        state: typeof row.state === 'string' ? row.state : null,
      });
    }
  }

  if (opportunityIds.length > 0) {
    const { data: opportunityRows, error: opportunityError } = await serviceClient
      .from('alma_funding_opportunities')
      .select('id, name, funder_name')
      .in('id', opportunityIds);

    if (opportunityError) {
      throw new Error(opportunityError.message || 'Failed to load relationship opportunities');
    }

    for (const row of (opportunityRows || []) as Array<Record<string, any>>) {
      if (typeof row.id !== 'string') continue;
      opportunityMap.set(row.id, {
        name: typeof row.name === 'string' ? row.name : 'Funding opportunity',
        funderName: typeof row.funder_name === 'string' ? row.funder_name : null,
      });
    }
  }

  return rows.map((row) => {
    const metadata =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, any>)
        : {};
    const organization =
      typeof row.organization_id === 'string' ? organizationMap.get(row.organization_id) : null;
    const opportunity =
      typeof row.opportunity_id === 'string' ? opportunityMap.get(row.opportunity_id) : null;

    return {
      id: String(row.id),
      sourceFollowUpTaskId:
        typeof row.source_follow_up_task_id === 'string' ? row.source_follow_up_task_id : null,
      parentConversationTaskId:
        typeof row.parent_conversation_task_id === 'string'
          ? row.parent_conversation_task_id
          : null,
      organizationId:
        typeof row.organization_id === 'string' ? row.organization_id : null,
      organizationName: organization?.name || null,
      organizationCity: organization?.city || null,
      organizationState: organization?.state || null,
      recommendationId:
        typeof row.recommendation_id === 'string' ? row.recommendation_id : null,
      opportunityId:
        typeof row.opportunity_id === 'string' ? row.opportunity_id : null,
      opportunityName: opportunity?.name || null,
      funderName: opportunity?.funderName || null,
      engagementKind:
        typeof row.engagement_kind === 'string' ? row.engagement_kind : 'info_follow_up',
      stageKey:
        typeof metadata.stage_key === 'string' ? metadata.stage_key : null,
      stageTaskId:
        typeof metadata.stage_task_id === 'string' ? metadata.stage_task_id : null,
      stageTaskKind:
        typeof metadata.stage_task_kind === 'string' ? metadata.stage_task_kind : null,
      stageTaskLabel:
        typeof metadata.stage_task_label === 'string' ? metadata.stage_task_label : null,
      stageTaskStatus:
        typeof metadata.stage_task_status === 'string' ? metadata.stage_task_status : null,
      pathwayTaskId:
        typeof metadata.pathway_task_id === 'string' ? metadata.pathway_task_id : null,
      pathwayTaskKind:
        typeof metadata.pathway_task_kind === 'string' ? metadata.pathway_task_kind : null,
      pathwayTaskLabel:
        typeof metadata.pathway_task_label === 'string' ? metadata.pathway_task_label : null,
      pathwayTaskStatus:
        typeof metadata.pathway_task_status === 'string' ? metadata.pathway_task_status : null,
      promotedApplicationId:
        typeof metadata.promoted_application_id === 'string'
          ? metadata.promoted_application_id
          : null,
      promotedAwardId:
        typeof metadata.promoted_award_id === 'string' ? metadata.promoted_award_id : null,
      pathwayPromotionError:
        typeof metadata.pathway_promotion_error === 'string'
          ? metadata.pathway_promotion_error
          : null,
      partnerRiskTaskId:
        typeof metadata.partner_risk_task_id === 'string'
          ? metadata.partner_risk_task_id
          : null,
      partnerRiskTaskStatus:
        typeof metadata.partner_risk_task_status === 'string'
          ? metadata.partner_risk_task_status
          : null,
      partnerRiskTaskLabel:
        typeof metadata.partner_risk_task_label === 'string'
          ? metadata.partner_risk_task_label
          : null,
      partnerRiskResolution:
        typeof metadata.partner_risk_resolution === 'string'
          ? metadata.partner_risk_resolution
          : null,
      partnerRiskResolutionNote:
        typeof metadata.partner_risk_resolution_note === 'string'
          ? metadata.partner_risk_resolution_note
          : null,
      partnerRiskOpsTaskId:
        typeof metadata.partner_risk_ops_task_id === 'string'
          ? metadata.partner_risk_ops_task_id
          : null,
      partnerRiskOpsTaskStatus:
        typeof metadata.partner_risk_ops_task_status === 'string'
          ? metadata.partner_risk_ops_task_status
          : null,
      relationshipStatus:
        typeof row.relationship_status === 'string' ? row.relationship_status : 'active',
      currentStageLabel:
        typeof row.current_stage_label === 'string' ? row.current_stage_label : null,
      nextActionLabel:
        typeof row.next_action_label === 'string' ? row.next_action_label : null,
      nextActionDueAt: row.next_action_due_at || null,
      lastEngagedAt: row.last_engaged_at || null,
      notes: typeof row.notes === 'string' ? row.notes : null,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
    };
  });
}

export async function updateFundingRelationshipEngagementStage(
  relationshipId: string,
  stageKey: 'intro_scheduled' | 'info_sent' | 'waiting_response' | 'engaged_partner',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(relationshipId || '').trim();
  const normalizedStage = String(stageKey || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: relationshipId is required');
  }

  if (
    !['intro_scheduled', 'info_sent', 'waiting_response', 'engaged_partner'].includes(
      normalizedStage
    )
  ) {
    throw new Error(
      'Validation: stageKey must be intro_scheduled, info_sent, waiting_response, or engaged_partner'
    );
  }

  const { data: currentRelationship, error: currentRelationshipError } = await serviceClient
    .from('funding_relationship_engagements')
    .select(
      'id, relationship_status, current_stage_label, next_action_label, next_action_due_at, metadata'
    )
    .eq('id', normalizedId)
    .maybeSingle();

  if (currentRelationshipError) {
    throw new Error(currentRelationshipError.message || 'Failed to load relationship engagement');
  }

  if (!currentRelationship) {
    throw new Error('Validation: Relationship engagement not found');
  }

  const currentStatus = String(currentRelationship.relationship_status || 'active')
    .trim()
    .toLowerCase();

  if (currentStatus === 'completed' || currentStatus === 'closed') {
    throw new Error('Validation: Closed relationships cannot move to a new stage');
  }

  let currentStageLabel = 'Relationship progressing';
  let nextActionLabel = 'Keep the relationship moving';
  let stageTaskKind = 'relationship_stage_action';
  let stageTaskLabel = 'Advance the relationship';
  let stageTaskTitle = 'Advance funding relationship';
  let stageTaskDescription = 'Move the relationship to the next checkpoint.';

  if (normalizedStage === 'intro_scheduled') {
    currentStageLabel = 'Intro scheduled';
    nextActionLabel = 'Run the intro call';
    stageTaskKind = 'run_intro_call';
    stageTaskLabel = 'Run the intro call';
    stageTaskTitle = 'Run intro call with organization';
    stageTaskDescription = 'Complete the intro call and capture what happened next.';
  } else if (normalizedStage === 'info_sent') {
    currentStageLabel = 'Information sent';
    nextActionLabel = 'Confirm the information was received';
    stageTaskKind = 'confirm_info_received';
    stageTaskLabel = 'Confirm the information was received';
    stageTaskTitle = 'Confirm follow-up information was received';
    stageTaskDescription = 'Follow up to confirm the organization received the requested information.';
  } else if (normalizedStage === 'waiting_response') {
    currentStageLabel = 'Waiting for response';
    nextActionLabel = 'Review the next inbound response';
    stageTaskKind = 'review_inbound_response';
    stageTaskLabel = 'Review the next inbound response';
    stageTaskTitle = 'Review inbound response from organization';
    stageTaskDescription = 'Monitor and review the next response from the organization.';
  } else if (normalizedStage === 'engaged_partner') {
    currentStageLabel = 'Engaged partner';
    nextActionLabel = 'Advance the funding pathway';
    stageTaskKind = 'advance_funding_pathway';
    stageTaskLabel = 'Advance the funding pathway';
    stageTaskTitle = 'Advance the funding pathway';
    stageTaskDescription = 'Move the engaged partner into the next active funding step.';
  }

  const existingMetadata =
    currentRelationship.metadata && typeof currentRelationship.metadata === 'object'
      ? (currentRelationship.metadata as Record<string, any>)
      : {};
  const now = new Date().toISOString();
  let stageTaskId =
    typeof existingMetadata.stage_task_id === 'string' ? existingMetadata.stage_task_id : null;
  let stageTaskStatus =
    typeof existingMetadata.stage_task_status === 'string'
      ? existingMetadata.stage_task_status
      : null;
  let pathwayTaskId =
    typeof existingMetadata.pathway_task_id === 'string'
      ? existingMetadata.pathway_task_id
      : null;
  let pathwayTaskKind =
    typeof existingMetadata.pathway_task_kind === 'string'
      ? existingMetadata.pathway_task_kind
      : null;
  let pathwayTaskLabel =
    typeof existingMetadata.pathway_task_label === 'string'
      ? existingMetadata.pathway_task_label
      : null;
  let pathwayTaskStatus =
    typeof existingMetadata.pathway_task_status === 'string'
      ? existingMetadata.pathway_task_status
      : null;

  const { data: existingStageTask, error: existingStageTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status')
    .eq('source', 'funding_relationship_stage')
    .eq('task_type', 'funding_relationship_stage_action')
    .eq('source_id', normalizedId)
    .filter('reply_to->>stage_key', 'eq', normalizedStage)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingStageTaskError) {
    throw new Error(existingStageTaskError.message || 'Failed to load existing stage action task');
  }

  if (existingStageTask?.id) {
    stageTaskId = String(existingStageTask.id);
    stageTaskStatus =
      typeof existingStageTask.status === 'string' ? existingStageTask.status : 'queued';
  } else {
    const createStageTaskAudit = createFundingOperatingTaskAuditEntry(
      'reviewed',
      adminUserId,
      `Queued relationship stage action: ${stageTaskLabel}.`,
      {
        relationshipId: normalizedId,
        stageKey: normalizedStage,
      }
    );
    const createStageTaskPayload: Record<string, any> = {
      source: 'funding_relationship_stage',
      source_id: normalizedId,
      task_type: 'funding_relationship_stage_action',
      title: stageTaskTitle,
      description: stageTaskDescription,
      status: 'queued',
      priority: normalizedStage === 'engaged_partner' ? 2 : 3,
      requested_by: adminUserId,
      needs_review: false,
      reply_to: {
        relationship_id: normalizedId,
        stage_key: normalizedStage,
        stage_task_kind: stageTaskKind,
        stage_task_label: stageTaskLabel,
      },
      human_edits: [createStageTaskAudit] as any,
    };
    const { data: createdStageTask, error: createStageTaskError } = await serviceClient
      .from('agent_task_queue')
      .insert(createStageTaskPayload as any)
      .select('id, status')
      .single();

    if (createStageTaskError || !createdStageTask) {
      throw new Error(createStageTaskError?.message || 'Failed to create stage action task');
    }

    stageTaskId = String(createdStageTask.id);
    stageTaskStatus =
      typeof createdStageTask.status === 'string' ? createdStageTask.status : 'queued';
  }

  if (normalizedStage === 'engaged_partner') {
    const pathwayTask = await ensureFundingRelationshipPathwayTask(
      serviceClient,
      normalizedId,
      adminUserId,
      adminUserId
    );
    pathwayTaskId = pathwayTask.pathwayTaskId;
    pathwayTaskKind = pathwayTask.pathwayTaskKind;
    pathwayTaskLabel = pathwayTask.pathwayTaskLabel;
    pathwayTaskStatus = pathwayTask.pathwayTaskStatus;
  }

  const { data, error } = await serviceClient
    .from('funding_relationship_engagements')
    .update({
      relationship_status: 'active',
      current_stage_label: currentStageLabel,
      next_action_label: nextActionLabel,
      next_action_due_at: now,
      last_engaged_at: now,
      updated_by: adminUserId,
      metadata: {
        ...existingMetadata,
        stage_key: normalizedStage,
        stage_updated_at: now,
        stage_task_id: stageTaskId,
        stage_task_kind: stageTaskKind,
        stage_task_label: stageTaskLabel,
        stage_task_status: stageTaskStatus,
        pathway_task_id: pathwayTaskId,
        pathway_task_kind: pathwayTaskKind,
        pathway_task_label: pathwayTaskLabel,
        pathway_task_status: pathwayTaskStatus,
      },
    } as any)
    .eq('id', normalizedId)
    .select('id, relationship_status, current_stage_label, next_action_label, next_action_due_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update relationship stage');
  }

  return {
    relationshipId: normalizedId,
    relationshipStatus:
      typeof data.relationship_status === 'string' ? data.relationship_status : 'active',
    stageKey: normalizedStage,
    currentStageLabel:
      typeof data.current_stage_label === 'string' ? data.current_stage_label : currentStageLabel,
    nextActionLabel:
      typeof data.next_action_label === 'string' ? data.next_action_label : nextActionLabel,
    nextActionDueAt: data.next_action_due_at || now,
    stageTaskId,
    stageTaskKind,
    stageTaskLabel,
    stageTaskStatus,
    pathwayTaskId,
    pathwayTaskKind,
    pathwayTaskLabel,
    pathwayTaskStatus,
  };
}

export async function listFundingRelationshipStageTasks(filters?: {
  limit?: number;
  status?: 'all' | 'queued' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed';
  stageKey?: 'all' | 'partner_risk_review';
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 25));

  let query = serviceClient
    .from('agent_task_queue')
    .select(
      'id, source_id, status, title, description, priority, created_at, started_at, completed_at, reply_to, human_edits'
    )
    .eq('source', 'funding_relationship_stage')
    .eq('task_type', 'funding_relationship_stage_action')
    .order('priority', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.stageKey && filters.stageKey !== 'all') {
    query = query.filter('reply_to->>stage_key', 'eq', filters.stageKey);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load relationship stage tasks');
  }

  const rows = (data || []) as Array<Record<string, any>>;
  const relationshipIds = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.source_id === 'string' ? row.source_id : null))
        .filter((value): value is string => Boolean(value))
    )
  );
  const relationshipMap = new Map<
    string,
    { id: string; organizationName?: string | null; opportunityName?: string | null; funderName?: string | null }
  >();

  if (relationshipIds.length > 0) {
    const relationships = await listFundingRelationshipEngagements({
      limit: Math.max(limit, relationshipIds.length),
      status: 'all',
    });
    for (const relationship of relationships) {
      if (!relationshipIds.includes(relationship.id)) continue;
      relationshipMap.set(relationship.id, {
        id: relationship.id,
        organizationName: relationship.organizationName,
        opportunityName: relationship.opportunityName,
        funderName: relationship.funderName,
      });
    }
  }

  return rows.map((row) => {
    const replyTo =
      row.reply_to && typeof row.reply_to === 'object'
        ? (row.reply_to as Record<string, any>)
        : {};
    const relationship =
      typeof row.source_id === 'string' ? relationshipMap.get(row.source_id) : null;
    const auditTrail = normalizeFundingOperatingTaskAuditTrail(row.human_edits);
    const lastAudit = auditTrail.length > 0 ? auditTrail[auditTrail.length - 1] : null;

    return {
      id: String(row.id),
      relationshipId: typeof row.source_id === 'string' ? row.source_id : null,
      status: typeof row.status === 'string' ? row.status : 'queued',
      title: typeof row.title === 'string' ? row.title : 'Relationship stage action',
      description: typeof row.description === 'string' ? row.description : '',
      priority:
        typeof row.priority === 'number' && Number.isFinite(row.priority) ? row.priority : 3,
      createdAt: row.created_at || null,
      startedAt: row.started_at || null,
      completedAt: row.completed_at || null,
      stageKey: typeof replyTo.stage_key === 'string' ? replyTo.stage_key : null,
      stageTaskKind:
        typeof replyTo.stage_task_kind === 'string' ? replyTo.stage_task_kind : null,
      stageTaskLabel:
        typeof replyTo.stage_task_label === 'string' ? replyTo.stage_task_label : null,
      partnerRiskResolution:
        typeof replyTo.partner_risk_resolution === 'string'
          ? replyTo.partner_risk_resolution
          : null,
      partnerRiskResolutionNote:
        typeof replyTo.partner_risk_resolution_note === 'string'
          ? replyTo.partner_risk_resolution_note
          : null,
      organizationName: relationship?.organizationName || null,
      opportunityName: relationship?.opportunityName || null,
      funderName: relationship?.funderName || null,
      auditEntryCount: auditTrail.length,
      lastAudit: lastAudit
        ? {
            action: typeof lastAudit.action === 'string' ? lastAudit.action : 'updated',
            actorId: typeof lastAudit.actorId === 'string' ? lastAudit.actorId : null,
            at: typeof lastAudit.at === 'string' ? lastAudit.at : null,
            summary:
              typeof lastAudit.summary === 'string' ? lastAudit.summary : 'Task updated',
          }
        : null,
    };
  });
}

export async function updateFundingRelationshipStageTaskStatus(
  taskId: string,
  status: 'queued' | 'running' | 'completed',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['queued', 'running', 'completed'].includes(normalizedStatus)) {
    throw new Error('Validation: status must be queued, running, or completed');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, source_id, status, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_relationship_stage')
    .eq('task_type', 'funding_relationship_stage_action')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load relationship stage task');
  }

  if (!currentTask) {
    throw new Error('Validation: Relationship stage task not found');
  }

  const previousStatus = typeof currentTask.status === 'string' ? currentTask.status : null;
  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    `Changed relationship stage task status to ${normalizedStatus}`,
    {
      fromStatus: previousStatus,
      toStatus: normalizedStatus,
    }
  );
  const updatePayload: Record<string, unknown> = {
    status: normalizedStatus,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  if (normalizedStatus === 'queued') {
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'running') {
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  } else {
    updatePayload.started_at = now;
    updatePayload.completed_at = now;
    updatePayload.needs_review = false;
    updatePayload.review_decision = 'resolved';
    updatePayload.reviewed_at = now;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_relationship_stage')
    .eq('task_type', 'funding_relationship_stage_action')
    .select('id, status, source_id, started_at, completed_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update relationship stage task');
  }

  const relationshipId = typeof data.source_id === 'string' ? data.source_id : null;

  if (relationshipId) {
    const replyTo =
      currentTask.reply_to && typeof currentTask.reply_to === 'object'
        ? (currentTask.reply_to as Record<string, any>)
        : {};
    const completedStageKey =
      typeof replyTo.stage_key === 'string' ? replyTo.stage_key : null;
    const { data: currentRelationship, error: currentRelationshipError } = await serviceClient
      .from('funding_relationship_engagements')
      .select('id, recommendation_id, metadata')
      .eq('id', relationshipId)
      .maybeSingle();

    if (currentRelationshipError) {
      throw new Error(
        currentRelationshipError.message || 'Failed to load relationship after task update'
      );
    }

    if (currentRelationship) {
      const existingMetadata =
        currentRelationship.metadata && typeof currentRelationship.metadata === 'object'
          ? (currentRelationship.metadata as Record<string, any>)
          : {};

      const stageTaskStatus = typeof data.status === 'string' ? data.status : normalizedStatus;
      const updateMetadata: Record<string, any> = {
        ...existingMetadata,
        stage_task_updated_at: now,
      };

      if (completedStageKey === 'partner_risk_review') {
        updateMetadata.partner_risk_task_status = stageTaskStatus;
        updateMetadata.partner_risk_task_updated_at = now;
      } else {
        updateMetadata.stage_task_status = stageTaskStatus;
      }

      const { error: relationshipUpdateError } = await serviceClient
        .from('funding_relationship_engagements')
        .update({
          updated_by: adminUserId,
          last_engaged_at: now,
          metadata: updateMetadata,
        } as any)
        .eq('id', relationshipId);

      if (relationshipUpdateError) {
        throw new Error(
          relationshipUpdateError.message ||
            'Failed to sync relationship stage task state back to relationship'
        );
      }

      if (
        normalizedStatus === 'completed' &&
        (completedStageKey === 'intro_scheduled' || completedStageKey === 'info_sent')
      ) {
        await updateFundingRelationshipEngagementStage(
          relationshipId,
          'waiting_response',
          adminUserId
        );
      }
    }
  }

  return {
    taskId: normalizedId,
    relationshipId,
    status: typeof data.status === 'string' ? data.status : normalizedStatus,
    startedAt: data.started_at || null,
    completedAt: data.completed_at || null,
  };
}

export async function resolveFundingRelationshipPartnerRiskTask(
  taskId: string,
  resolution: 'no_relationship_impact' | 'pause_relationship' | 'escalate_pipeline_risk',
  note: string,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedResolution = String(resolution || '').trim().toLowerCase();
  const normalizedNote = String(note || '').trim().slice(0, 1000);

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (
    !['no_relationship_impact', 'pause_relationship', 'escalate_pipeline_risk'].includes(
      normalizedResolution
    )
  ) {
    throw new Error(
      'Validation: resolution must be no_relationship_impact, pause_relationship, or escalate_pipeline_risk'
    );
  }

  if (!normalizedNote) {
    throw new Error('Validation: A partner-risk review note is required');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, source_id, status, title, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_relationship_stage')
    .eq('task_type', 'funding_relationship_stage_action')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load partner-risk task');
  }

  if (!currentTask) {
    throw new Error('Validation: Relationship action task not found');
  }

  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const stageKey = String(replyTo.stage_key || '').trim().toLowerCase();

  if (stageKey !== 'partner_risk_review') {
    throw new Error('Validation: Task is not a partner-risk review action');
  }

  const relationshipId =
    typeof currentTask.source_id === 'string' ? String(currentTask.source_id) : '';
  if (!relationshipId) {
    throw new Error('Validation: Linked relationship not found');
  }

  const { data: relationship, error: relationshipError } = await serviceClient
    .from('funding_relationship_engagements')
    .select(
      'id, organization_id, opportunity_id, recommendation_id, parent_conversation_task_id, relationship_status, metadata'
    )
    .eq('id', relationshipId)
    .maybeSingle();

  if (relationshipError) {
    throw new Error(relationshipError.message || 'Failed to load linked relationship');
  }

  if (!relationship) {
    throw new Error('Validation: Linked relationship not found');
  }

  const now = new Date().toISOString();
  const previousStatus = typeof currentTask.status === 'string' ? currentTask.status : null;
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'reviewed',
    adminUserId,
    `Resolved partner-risk review as ${normalizedResolution.replace(/_/g, ' ')}`,
    {
      fromStatus: previousStatus,
      toStatus: 'completed',
      resolution: normalizedResolution,
      note: normalizedNote,
    }
  );

  const updatedReplyTo = {
    ...replyTo,
    partner_risk_resolution: normalizedResolution,
    partner_risk_resolution_note: normalizedNote,
    partner_risk_resolved_at: now,
    partner_risk_resolved_by: adminUserId,
  };

  const { data: updatedTask, error: updateTaskError } = await serviceClient
    .from('agent_task_queue')
    .update({
      status: 'completed',
      started_at: now,
      completed_at: now,
      needs_review: false,
      review_decision: 'resolved',
      reviewed_at: now,
      requested_by: adminUserId,
      reply_to: updatedReplyTo,
      human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
    } as any)
    .eq('id', normalizedId)
    .eq('source', 'funding_relationship_stage')
    .eq('task_type', 'funding_relationship_stage_action')
    .select('id, status, completed_at')
    .maybeSingle();

  if (updateTaskError || !updatedTask) {
    throw new Error(updateTaskError?.message || 'Failed to resolve partner-risk task');
  }

  const existingMetadata =
    relationship.metadata && typeof relationship.metadata === 'object'
      ? (relationship.metadata as Record<string, any>)
      : {};

  let relationshipStatus =
    typeof relationship.relationship_status === 'string'
      ? relationship.relationship_status
      : 'active';
  let nextActionLabel: string | null = 'Continue normal relationship progression';
  let nextActionDueAt: string | null = null;
  let partnerRiskOpsTaskId =
    typeof existingMetadata.partner_risk_ops_task_id === 'string'
      ? existingMetadata.partner_risk_ops_task_id
      : null;
  let partnerRiskOpsTaskStatus =
    typeof existingMetadata.partner_risk_ops_task_status === 'string'
      ? existingMetadata.partner_risk_ops_task_status
      : null;
  let conversationNotice:
    | {
        kind: 'relationship_paused' | 'pipeline_risk_escalated';
        label: string;
        message: string;
        recorded_at: string;
        recorded_by: string;
        request_response: true;
        response_prompt: string;
        response_status: 'pending' | 'received';
      }
    | null = null;

  if (normalizedResolution === 'pause_relationship') {
    relationshipStatus = 'paused';
    nextActionLabel = 'Reassess after partner-risk review';
    nextActionDueAt = now;
    conversationNotice = {
      kind: 'relationship_paused',
      label: 'Relationship paused after partner-risk review',
      message: normalizedNote,
      recorded_at: now,
      recorded_by: adminUserId,
      request_response: true,
      response_prompt:
        'If you want to share context or ask the team to revisit this pause, reply here.',
      response_status: 'pending',
    };
  } else if (normalizedResolution === 'escalate_pipeline_risk') {
    const sourceId = `relationship-risk:${relationshipId}:${normalizedId}`;
    const { data: existingOpsTask, error: existingOpsTaskError } = await serviceClient
      .from('agent_task_queue')
      .select('id, status')
      .eq('source', 'funding_os_followup')
      .eq('task_type', 'funding_ops_followup')
      .eq('source_id', sourceId)
      .in('status', ['queued', 'pending', 'running', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOpsTaskError) {
      throw new Error(
        existingOpsTaskError.message || 'Failed to inspect pipeline-risk follow-up task'
      );
    }

    if (existingOpsTask) {
      partnerRiskOpsTaskId = String(existingOpsTask.id);
      partnerRiskOpsTaskStatus =
        typeof existingOpsTask.status === 'string' ? existingOpsTask.status : 'queued';
    } else {
      let organizationName = 'Community organization';
      if (typeof relationship.organization_id === 'string') {
        const { data: organization } = await serviceClient
          .from('organizations')
          .select('id, name')
          .eq('id', relationship.organization_id)
          .maybeSingle();
        if (organization?.name) {
          organizationName = String(organization.name);
        }
      }

      const opsAudit = createFundingOperatingTaskAuditEntry(
        'reviewed',
        adminUserId,
        'Queued pipeline-risk follow-up from relationship partner-risk review',
        {
          relationshipId,
          stageTaskId: normalizedId,
        }
      );

      const { data: createdOpsTask, error: createOpsTaskError } = await (serviceClient
        .from('agent_task_queue') as any)
        .insert([
          {
            source: 'funding_os_followup',
            source_id: sourceId,
            task_type: 'funding_ops_followup',
            title: `Pipeline risk follow-up: ${organizationName}`,
            description:
              'A partner-risk review found relationship concerns that should affect pipeline decisions.',
            status: 'queued',
            priority: 1,
            needs_review: true,
            requested_by: adminUserId,
            reply_to: {
              organization_id:
                typeof relationship.organization_id === 'string'
                  ? relationship.organization_id
                  : null,
              routing_class: 'pipeline',
              routing_rule: 'relationship_partner_risk',
              auto_assigned: false,
              severity: 'critical',
              relationship_id: relationshipId,
              linked_relationship_stage_task_id: normalizedId,
              summary: {
                overdueCommunityReports: 0,
                spendWithoutValidation: 0,
                strongMatchesNotEngaged: 0,
                awardsWithoutCommitments: 0,
                commitmentsWithoutUpdates: 0,
                engagedMatchesStalled: 0,
              },
              created_at: now,
            },
            human_edits: [opsAudit],
          },
        ] as any[])
        .select('id, status')
        .single();

      if (createOpsTaskError || !createdOpsTask) {
        throw new Error(
          createOpsTaskError?.message || 'Failed to create pipeline-risk follow-up task'
        );
      }

      partnerRiskOpsTaskId = String(createdOpsTask.id);
      partnerRiskOpsTaskStatus =
        typeof createdOpsTask.status === 'string' ? createdOpsTask.status : 'queued';
    }

    nextActionLabel = 'Work pipeline-risk follow-up';
    nextActionDueAt = now;
    conversationNotice = {
      kind: 'pipeline_risk_escalated',
      label: 'Partner-risk escalated into pipeline review',
      message: normalizedNote,
      recorded_at: now,
      recorded_by: adminUserId,
      request_response: true,
      response_prompt:
        'If you want to add context before the pipeline-risk review continues, reply here.',
      response_status: 'pending',
    };
  }

  const { error: relationshipUpdateError } = await serviceClient
    .from('funding_relationship_engagements')
    .update({
      relationship_status: relationshipStatus,
      next_action_label: nextActionLabel,
      next_action_due_at: nextActionDueAt,
      last_engaged_at: now,
      updated_by: adminUserId,
      metadata: {
        ...existingMetadata,
        partner_risk_task_status: 'completed',
        partner_risk_task_updated_at: now,
        partner_risk_resolution: normalizedResolution,
        partner_risk_resolution_note: normalizedNote,
        partner_risk_resolved_at: now,
        partner_risk_resolved_by: adminUserId,
        partner_risk_ops_task_id: partnerRiskOpsTaskId,
        partner_risk_ops_task_status: partnerRiskOpsTaskStatus,
      },
    } as any)
    .eq('id', relationshipId);

  if (relationshipUpdateError) {
    throw new Error(
      relationshipUpdateError.message ||
        'Failed to sync partner-risk resolution back to relationship'
    );
  }

  const parentConversationTaskId =
    typeof relationship.parent_conversation_task_id === 'string'
      ? relationship.parent_conversation_task_id
      : null;

  if (conversationNotice && parentConversationTaskId) {
    const { data: conversationTask, error: conversationTaskError } = await serviceClient
      .from('agent_task_queue')
      .select('id, reply_to, human_edits')
      .eq('id', parentConversationTaskId)
      .eq('source', 'funding_conversation_request')
      .eq('task_type', 'funding_conversation_request')
      .maybeSingle();

    if (!conversationTaskError && conversationTask) {
      const conversationReplyTo =
        conversationTask.reply_to && typeof conversationTask.reply_to === 'object'
          ? (conversationTask.reply_to as Record<string, any>)
          : {};
      const conversationAudit = createFundingOperatingTaskAuditEntry(
        'reviewed',
        adminUserId,
        conversationNotice.label,
        {
          relationshipId,
          resolution: normalizedResolution,
        }
      );

      await serviceClient
        .from('agent_task_queue')
        .update({
          reply_to: {
            ...conversationReplyTo,
            relationship_notice: conversationNotice,
          },
          human_edits: appendFundingOperatingTaskAuditEntry(
            conversationTask.human_edits,
            conversationAudit
          ),
        } as any)
        .eq('id', parentConversationTaskId)
        .eq('source', 'funding_conversation_request')
        .eq('task_type', 'funding_conversation_request');
    }
  }

  return {
    taskId: normalizedId,
    relationshipId,
    resolution: normalizedResolution,
    note: normalizedNote,
    conversationNotice,
    status: 'completed',
    relationshipStatus,
    partnerRiskOpsTaskId,
    partnerRiskOpsTaskStatus,
    completedAt: updatedTask.completed_at || now,
  };
}

export async function listFundingRelationshipPathwayTasks(filters?: {
  limit?: number;
  status?: 'all' | 'queued' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed';
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 25));

  let query = serviceClient
    .from('agent_task_queue')
    .select(
      'id, source_id, status, title, description, priority, created_at, started_at, completed_at, reply_to, human_edits'
    )
    .eq('source', 'funding_relationship_pathway')
    .eq('task_type', 'funding_pathway_progression')
    .order('priority', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load funding pathway tasks');
  }

  const rows = (data || []) as Array<Record<string, any>>;
  const relationshipIds = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.source_id === 'string' ? row.source_id : null))
        .filter((value): value is string => Boolean(value))
    )
  );
  const relationshipMap = new Map<
    string,
    {
      id: string;
      organizationName?: string | null;
      opportunityName?: string | null;
      funderName?: string | null;
    }
  >();

  if (relationshipIds.length > 0) {
    const relationships = await listFundingRelationshipEngagements({
      limit: Math.max(limit, relationshipIds.length),
      status: 'all',
    });
    for (const relationship of relationships) {
      if (!relationshipIds.includes(relationship.id)) continue;
      relationshipMap.set(relationship.id, {
        id: relationship.id,
        organizationName: relationship.organizationName,
        opportunityName: relationship.opportunityName,
        funderName: relationship.funderName,
      });
    }
  }

  return rows.map((row) => {
    const replyTo =
      row.reply_to && typeof row.reply_to === 'object'
        ? (row.reply_to as Record<string, any>)
        : {};
    const relationship =
      typeof row.source_id === 'string' ? relationshipMap.get(row.source_id) : null;
    const auditTrail = normalizeFundingOperatingTaskAuditTrail(row.human_edits);
    const lastAudit = auditTrail.length > 0 ? auditTrail[auditTrail.length - 1] : null;

    return {
      id: String(row.id),
      relationshipId: typeof row.source_id === 'string' ? row.source_id : null,
      status: typeof row.status === 'string' ? row.status : 'queued',
      title: typeof row.title === 'string' ? row.title : 'Funding pathway task',
      description: typeof row.description === 'string' ? row.description : '',
      priority:
        typeof row.priority === 'number' && Number.isFinite(row.priority) ? row.priority : 3,
      createdAt: row.created_at || null,
      startedAt: row.started_at || null,
      completedAt: row.completed_at || null,
      pathwayTaskKind:
        typeof replyTo.pathway_task_kind === 'string' ? replyTo.pathway_task_kind : null,
      pathwayTaskLabel:
        typeof replyTo.pathway_task_label === 'string' ? replyTo.pathway_task_label : null,
      organizationName: relationship?.organizationName || null,
      opportunityName: relationship?.opportunityName || null,
      funderName: relationship?.funderName || null,
      auditEntryCount: auditTrail.length,
      lastAudit: lastAudit
        ? {
            action: typeof lastAudit.action === 'string' ? lastAudit.action : 'updated',
            actorId: typeof lastAudit.actorId === 'string' ? lastAudit.actorId : null,
            at: typeof lastAudit.at === 'string' ? lastAudit.at : null,
            summary:
              typeof lastAudit.summary === 'string' ? lastAudit.summary : 'Task updated',
          }
        : null,
    };
  });
}

export async function updateFundingRelationshipPathwayTaskStatus(
  taskId: string,
  status: 'queued' | 'running' | 'completed',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['queued', 'running', 'completed'].includes(normalizedStatus)) {
    throw new Error('Validation: status must be queued, running, or completed');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, source_id, status, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_relationship_pathway')
    .eq('task_type', 'funding_pathway_progression')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load funding pathway task');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding pathway task not found');
  }

  const previousStatus = typeof currentTask.status === 'string' ? currentTask.status : null;
  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    `Changed funding pathway task status to ${normalizedStatus}`,
    {
      fromStatus: previousStatus,
      toStatus: normalizedStatus,
    }
  );
  const updatePayload: Record<string, unknown> = {
    status: normalizedStatus,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  if (normalizedStatus === 'queued') {
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'running') {
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  } else {
    updatePayload.started_at = now;
    updatePayload.completed_at = now;
    updatePayload.needs_review = false;
    updatePayload.review_decision = 'resolved';
    updatePayload.reviewed_at = now;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_relationship_pathway')
    .eq('task_type', 'funding_pathway_progression')
    .select('id, status, source_id, started_at, completed_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update funding pathway task');
  }

  const relationshipId = typeof data.source_id === 'string' ? data.source_id : null;

  if (relationshipId) {
    const { data: currentRelationship, error: currentRelationshipError } = await serviceClient
      .from('funding_relationship_engagements')
      .select('id, recommendation_id, metadata')
      .eq('id', relationshipId)
      .maybeSingle();

    if (currentRelationshipError) {
      throw new Error(
        currentRelationshipError.message ||
          'Failed to load relationship after pathway task update'
      );
    }

    if (currentRelationship) {
      const existingMetadata =
        currentRelationship.metadata && typeof currentRelationship.metadata === 'object'
          ? (currentRelationship.metadata as Record<string, any>)
          : {};

      const { error: relationshipUpdateError } = await serviceClient
        .from('funding_relationship_engagements')
        .update({
          updated_by: adminUserId,
          last_engaged_at: now,
          metadata: {
            ...existingMetadata,
            pathway_task_status:
              typeof data.status === 'string' ? data.status : normalizedStatus,
            pathway_task_updated_at: now,
          },
        } as any)
        .eq('id', relationshipId);

      if (relationshipUpdateError) {
        throw new Error(
          relationshipUpdateError.message ||
            'Failed to sync funding pathway task state back to relationship'
        );
      }

      if (normalizedStatus === 'completed') {
        const recommendationId =
          typeof currentRelationship.recommendation_id === 'string'
            ? currentRelationship.recommendation_id
            : null;

        if (recommendationId) {
          try {
            const promotion = await promoteFundingMatchRecommendation(recommendationId, adminUserId);
            const checkpoint = getFundingRelationshipDownstreamCheckpoint(
              promotion.applicationId,
              promotion.awardId
            );
            await serviceClient
              .from('funding_relationship_engagements')
              .update({
                updated_by: adminUserId,
                current_stage_label: checkpoint.currentStageLabel,
                next_action_label: checkpoint.nextActionLabel,
                next_action_due_at: now,
                last_engaged_at: now,
                metadata: {
                  ...existingMetadata,
                  stage_key: checkpoint.stageKey,
                  stage_updated_at: now,
                  pathway_task_status: 'completed',
                  pathway_task_updated_at: now,
                  promoted_application_id: promotion.applicationId || null,
                  promoted_award_id: promotion.awardId || null,
                  pathway_promoted_at: now,
                  pathway_promotion_error: null,
                  pathway_promotion_error_at: null,
                },
              } as any)
              .eq('id', relationshipId);
          } catch (promotionError) {
            await serviceClient
              .from('funding_relationship_engagements')
              .update({
                updated_by: adminUserId,
                next_action_label: 'Retry funding pathway promotion',
                next_action_due_at: now,
                last_engaged_at: now,
                metadata: {
                  ...existingMetadata,
                  pathway_task_status: 'completed',
                  pathway_task_updated_at: now,
                  pathway_promotion_error:
                    promotionError instanceof Error
                      ? promotionError.message
                      : 'Failed to promote funding pathway',
                  pathway_promotion_error_at: now,
                },
              } as any)
              .eq('id', relationshipId);
          }
        }
      }
    }
  }

  return {
    taskId: normalizedId,
    relationshipId,
    status: typeof data.status === 'string' ? data.status : normalizedStatus,
    startedAt: data.started_at || null,
    completedAt: data.completed_at || null,
  };
}

export async function retryFundingRelationshipPathwayPromotion(
  relationshipId: string,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(relationshipId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: relationshipId is required');
  }

  const { data: relationship, error: relationshipError } = await serviceClient
    .from('funding_relationship_engagements')
    .select('id, recommendation_id, metadata')
    .eq('id', normalizedId)
    .maybeSingle();

  if (relationshipError) {
    throw new Error(relationshipError.message || 'Failed to load relationship for retry');
  }

  if (!relationship) {
    throw new Error('Validation: Relationship engagement not found');
  }

  const recommendationId =
    typeof relationship.recommendation_id === 'string' ? relationship.recommendation_id : null;

  if (!recommendationId) {
    throw new Error('Validation: Relationship has no linked recommendation to promote');
  }

  const existingMetadata =
    relationship.metadata && typeof relationship.metadata === 'object'
      ? (relationship.metadata as Record<string, any>)
      : {};
  const now = new Date().toISOString();

  try {
    const promotion = await promoteFundingMatchRecommendation(recommendationId, adminUserId);
    const checkpoint = getFundingRelationshipDownstreamCheckpoint(
      promotion.applicationId,
      promotion.awardId
    );

    const { error: updateError } = await serviceClient
      .from('funding_relationship_engagements')
      .update({
        updated_by: adminUserId,
        current_stage_label: checkpoint.currentStageLabel,
        next_action_label: checkpoint.nextActionLabel,
        next_action_due_at: now,
        last_engaged_at: now,
        metadata: {
          ...existingMetadata,
          stage_key: checkpoint.stageKey,
          stage_updated_at: now,
          promoted_application_id: promotion.applicationId || null,
          promoted_award_id: promotion.awardId || null,
          pathway_promoted_at: now,
          pathway_promotion_error: null,
          pathway_promotion_error_at: null,
          pathway_retry_at: now,
        },
      } as any)
      .eq('id', normalizedId);

    if (updateError) {
      throw new Error(updateError.message || 'Failed to sync relationship after retry');
    }

    return {
      relationshipId: normalizedId,
      applicationId: promotion.applicationId || null,
      awardId: promotion.awardId || null,
      promotedAt: now,
    };
  } catch (promotionError) {
    const message =
      promotionError instanceof Error
        ? promotionError.message
        : 'Failed to promote funding pathway';

    await serviceClient
      .from('funding_relationship_engagements')
      .update({
        updated_by: adminUserId,
        next_action_label: 'Retry funding pathway promotion',
        next_action_due_at: now,
        last_engaged_at: now,
        metadata: {
          ...existingMetadata,
          pathway_promotion_error: message,
          pathway_promotion_error_at: now,
          pathway_retry_at: now,
        },
      } as any)
      .eq('id', normalizedId);

    throw new Error(message);
  }
}

export async function updateFundingRelationshipEngagementStatus(
  relationshipId: string,
  status: 'active' | 'paused' | 'completed' | 'closed',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(relationshipId || '').trim();
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: relationshipId is required');
  }

  if (!['active', 'paused', 'completed', 'closed'].includes(normalizedStatus)) {
    throw new Error('Validation: status must be active, paused, completed, or closed');
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    relationship_status: normalizedStatus,
    updated_by: adminUserId,
    last_engaged_at: now,
  };

  if (normalizedStatus === 'completed' || normalizedStatus === 'closed') {
    updatePayload.next_action_due_at = null;
  }

  const { data, error } = await serviceClient
    .from('funding_relationship_engagements')
    .update(updatePayload as any)
    .eq('id', normalizedId)
    .select('id, relationship_status, last_engaged_at')
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update relationship engagement');
  }

  return {
    relationshipId: normalizedId,
    relationshipStatus:
      typeof data.relationship_status === 'string'
        ? data.relationship_status
        : normalizedStatus,
    lastEngagedAt: data.last_engaged_at || now,
  };
}

export async function updateFundingConversationRequestStatus(
  taskId: string,
  status: 'queued' | 'running' | 'completed',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const normalizedStatus = String(status || '').trim().toLowerCase();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['queued', 'running', 'completed'].includes(normalizedStatus)) {
    throw new Error('Validation: status must be queued, running, or completed');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .maybeSingle();

  if (currentTaskError) {
    throw new Error(currentTaskError.message || 'Failed to load funding conversation request');
  }

  if (!currentTask) {
    throw new Error('Validation: Funding conversation request not found');
  }

  const previousStatus = typeof currentTask.status === 'string' ? currentTask.status : null;
  const now = new Date().toISOString();
  const auditEntry = createFundingOperatingTaskAuditEntry(
    'status_changed',
    adminUserId,
    `Changed conversation request status to ${normalizedStatus}`,
    {
      fromStatus: previousStatus,
      toStatus: normalizedStatus,
    }
  );
  const updatePayload: Record<string, unknown> = {
    status: normalizedStatus,
    requested_by: adminUserId,
    human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
  };

  if (normalizedStatus === 'queued') {
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'running') {
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  } else if (normalizedStatus === 'completed') {
    updatePayload.started_at = now;
    updatePayload.completed_at = now;
    updatePayload.needs_review = false;
    updatePayload.review_decision = 'resolved';
    updatePayload.reviewed_at = now;
  }

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update(updatePayload)
    .eq('id', normalizedId)
    .eq('source', 'funding_conversation_request')
    .eq('task_type', 'funding_conversation_request')
    .select('id, status, started_at, completed_at')
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to update funding conversation request');
  }

  if (!data) {
    throw new Error('Validation: Funding conversation request not found');
  }

  return {
    taskId: normalizedId,
    status: typeof data.status === 'string' ? data.status : normalizedStatus,
    startedAt: data.started_at || null,
    completedAt: data.completed_at || null,
  };
}

function normalizeFundingDiscoveryReviewActivity(
  value: unknown
): FundingDiscoveryReviewActivityInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const id = String(record.id || '').trim();
      const timestamp = String(record.timestamp || '').trim();
      const type = String(record.type || '').trim();
      const detail = String(record.detail || '').trim();

      if (!id || !timestamp || !type || !detail) {
        return null;
      }

      return {
        id,
        timestamp,
        type,
        detail,
        organizationId:
          typeof record.organizationId === 'string'
            ? String(record.organizationId).trim() || undefined
            : undefined,
        organizationName:
          typeof record.organizationName === 'string'
            ? String(record.organizationName).trim() || undefined
            : undefined,
      } satisfies FundingDiscoveryReviewActivityInput;
    })
    .filter(Boolean) as FundingDiscoveryReviewActivityInput[];
}

function normalizeApplicationDraftTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 20);
}

export async function listFundingDiscoveryReviewWorkspace(organizationIds?: string[]) {
  const serviceClient = getServiceClient();
  const normalizedOrganizationIds = (organizationIds || [])
    .map((id) => String(id).trim())
    .filter(Boolean);

  let query = serviceClient
    .from('funding_discovery_review_workspace')
    .select(
      'id, organization_id, note, decision_tag, activity_log, last_activity_at, last_activity_type, last_reviewed_at, created_at, updated_at'
    )
    .order('updated_at', { ascending: false });

  if (normalizedOrganizationIds.length > 0) {
    query = query.in('organization_id', normalizedOrganizationIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load funding discovery review workspace');
  }

  return ((data || []) as Array<Record<string, any>>).map((row) => ({
    id: String(row.id),
    organizationId: String(row.organization_id),
    note: typeof row.note === 'string' ? row.note : null,
    decisionTag:
      typeof row.decision_tag === 'string' ? row.decision_tag : null,
    activityLog: normalizeFundingDiscoveryReviewActivity(row.activity_log),
    lastActivityAt: row.last_activity_at || null,
    lastActivityType:
      typeof row.last_activity_type === 'string' ? row.last_activity_type : null,
    lastReviewedAt: row.last_reviewed_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  }));
}

export async function listFundingDiscoverySharedShortlist() {
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from('funding_discovery_shared_shortlist')
    .select('id, organization_id, sort_index, created_at, updated_at')
    .order('sort_index', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to load funding discovery shared shortlist');
  }

  return ((data || []) as Array<Record<string, any>>).map((row) => ({
    id: String(row.id),
    organizationId: String(row.organization_id),
    sortIndex:
      typeof row.sort_index === 'number' && Number.isFinite(row.sort_index)
        ? row.sort_index
        : 0,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  })) as FundingDiscoverySharedShortlistEntry[];
}

export async function getFundingApplicationDraftWorkspaceRecord(
  organizationId: string,
  opportunityId: string
) {
  const serviceClient = getServiceClient();
  const normalizedOrganizationId = String(organizationId || '').trim();
  const normalizedOpportunityId = String(opportunityId || '').trim();

  if (!normalizedOrganizationId || !normalizedOpportunityId) {
    return null;
  }

  const { data, error } = await serviceClient
    .from('funding_application_draft_workspace')
    .select(
      'id, organization_id, opportunity_id, application_id, narrative_draft, support_material, community_review_notes, budget_notes, draft_status, last_review_requested_at, last_review_completed_at, created_at, updated_at'
    )
    .eq('organization_id', normalizedOrganizationId)
    .eq('opportunity_id', normalizedOpportunityId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load funding application draft workspace');
  }

  if (!data) {
    return null;
  }

  const reviewSourceId = `draft-review:${normalizedOrganizationId}:${normalizedOpportunityId}`;
  const { data: reviewTaskRow, error: reviewTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, title, created_at, completed_at, review_decision, review_feedback, reply_to')
    .eq('source', 'funding_application_draft')
    .eq('task_type', 'funding_application_community_review')
    .eq('source_id', reviewSourceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reviewTaskError) {
    throw new Error(reviewTaskError.message || 'Failed to load funding application draft review task');
  }

  const reviewReplyTo =
    reviewTaskRow?.reply_to && typeof reviewTaskRow.reply_to === 'object'
      ? (reviewTaskRow.reply_to as Record<string, any>)
      : null;
  const communityReviewerResponses =
    reviewReplyTo &&
    Array.isArray(reviewReplyTo.community_reviewer_responses)
      ? (reviewReplyTo.community_reviewer_responses as Array<Record<string, any>>)
      : [];
  const latestCommunityReviewerResponse =
    communityReviewerResponses.length > 0
      ? communityReviewerResponses[communityReviewerResponses.length - 1]
      : reviewReplyTo &&
          reviewReplyTo.community_reviewer_response &&
          typeof reviewReplyTo.community_reviewer_response === 'object'
        ? (reviewReplyTo.community_reviewer_response as Record<string, any>)
        : null;

  return {
    id: String(data.id),
    organizationId: String(data.organization_id),
    opportunityId: String(data.opportunity_id),
    applicationId:
      typeof data.application_id === 'string' ? data.application_id : null,
    narrativeDraft:
      typeof data.narrative_draft === 'string' ? data.narrative_draft : null,
    supportMaterial: normalizeApplicationDraftTextList(data.support_material),
    communityReviewNotes: normalizeApplicationDraftTextList(
      data.community_review_notes
    ),
    budgetNotes: typeof data.budget_notes === 'string' ? data.budget_notes : null,
    draftStatus:
      typeof data.draft_status === 'string' ? data.draft_status : 'draft',
    lastReviewRequestedAt: data.last_review_requested_at || null,
    lastReviewCompletedAt: data.last_review_completed_at || null,
    createdAt: data.created_at || null,
    updatedAt: data.updated_at || null,
    reviewTask: reviewTaskRow
      ? {
          id: String(reviewTaskRow.id),
          status:
            typeof reviewTaskRow.status === 'string'
              ? reviewTaskRow.status
              : 'queued',
          title:
            typeof reviewTaskRow.title === 'string'
              ? reviewTaskRow.title
              : 'Community review request',
          createdAt: reviewTaskRow.created_at || null,
          completedAt: reviewTaskRow.completed_at || null,
          reviewDecision:
            typeof reviewTaskRow.review_decision === 'string'
              ? reviewTaskRow.review_decision
              : null,
          reviewFeedback:
            typeof reviewTaskRow.review_feedback === 'string'
              ? reviewTaskRow.review_feedback
              : null,
          communityReviewerRecommendation:
            latestCommunityReviewerResponse &&
            typeof latestCommunityReviewerResponse.recommendation === 'string'
              ? String(latestCommunityReviewerResponse.recommendation)
              : null,
          communityReviewerNote:
            latestCommunityReviewerResponse &&
            typeof latestCommunityReviewerResponse.note === 'string'
              ? String(latestCommunityReviewerResponse.note)
              : null,
          communityReviewerName:
            latestCommunityReviewerResponse &&
            typeof latestCommunityReviewerResponse.reviewer_name === 'string'
              ? String(latestCommunityReviewerResponse.reviewer_name)
              : null,
          communityReviewerConnection:
            latestCommunityReviewerResponse &&
            typeof latestCommunityReviewerResponse.reviewer_connection === 'string'
              ? String(latestCommunityReviewerResponse.reviewer_connection)
              : null,
          communityReviewerRespondedAt:
            latestCommunityReviewerResponse &&
            typeof latestCommunityReviewerResponse.responded_at === 'string'
              ? String(latestCommunityReviewerResponse.responded_at)
              : null,
          communityReviewerResponseCount:
            communityReviewerResponses.length > 0
              ? communityReviewerResponses.length
              : latestCommunityReviewerResponse
                ? 1
                : 0,
          resolution:
            reviewTaskRow.reply_to &&
            typeof reviewTaskRow.reply_to === 'object' &&
            typeof (reviewTaskRow.reply_to as Record<string, any>).resolution === 'string'
              ? String((reviewTaskRow.reply_to as Record<string, any>).resolution)
              : null,
        }
      : null,
  };
}

export async function getFundingApplicationDraftCommunityReviewPublic(taskId: string) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  const { data: task, error } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, title, description, created_at, completed_at, reply_to, review_decision')
    .eq('id', normalizedId)
    .eq('source', 'funding_application_draft')
    .eq('task_type', 'funding_application_community_review')
    .maybeSingle();

  if (error || !task) {
    throw new Error(error?.message || 'Funding application community review task not found');
  }

  const replyTo =
    task.reply_to && typeof task.reply_to === 'object'
      ? (task.reply_to as Record<string, any>)
      : {};
  const organizationId =
    typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null;
  const opportunityId =
    typeof replyTo.opportunity_id === 'string' ? replyTo.opportunity_id : null;

  if (!organizationId || !opportunityId) {
    throw new Error('Validation: Community review task is missing draft context');
  }

  const draft = await getFundingApplicationDraftWorkspaceRecord(organizationId, opportunityId);
  const communityReviewerResponses = Array.isArray(replyTo.community_reviewer_responses)
    ? (replyTo.community_reviewer_responses as Array<Record<string, any>>)
    : replyTo.community_reviewer_response &&
        typeof replyTo.community_reviewer_response === 'object'
      ? [replyTo.community_reviewer_response as Record<string, any>]
      : [];
  const latestCommunityReviewerResponse =
    communityReviewerResponses.length > 0
      ? communityReviewerResponses[communityReviewerResponses.length - 1]
      : null;

  return {
    taskId: String(task.id),
    status: typeof task.status === 'string' ? task.status : 'queued',
    title: typeof task.title === 'string' ? task.title : 'Community review request',
    description: typeof task.description === 'string' ? task.description : '',
    createdAt: task.created_at || null,
    completedAt: task.completed_at || null,
    organizationId,
    opportunityId,
    organizationName:
      typeof replyTo.organization_name === 'string' ? replyTo.organization_name : null,
    opportunityName:
      typeof replyTo.opportunity_name === 'string' ? replyTo.opportunity_name : null,
    funderName: typeof replyTo.funder_name === 'string' ? replyTo.funder_name : null,
    draftStatus: draft?.draftStatus || 'draft',
    narrativeDraft: draft?.narrativeDraft || null,
    supportMaterial: draft?.supportMaterial || [],
    communityReviewNotes: draft?.communityReviewNotes || [],
    budgetNotes: draft?.budgetNotes || null,
    responseRecommendation:
      latestCommunityReviewerResponse &&
      typeof latestCommunityReviewerResponse.recommendation === 'string'
        ? String(latestCommunityReviewerResponse.recommendation)
        : null,
    responseNote:
      latestCommunityReviewerResponse &&
      typeof latestCommunityReviewerResponse.note === 'string'
        ? String(latestCommunityReviewerResponse.note)
        : null,
    reviewerName:
      latestCommunityReviewerResponse &&
      typeof latestCommunityReviewerResponse.reviewer_name === 'string'
        ? String(latestCommunityReviewerResponse.reviewer_name)
        : null,
    reviewerConnection:
      latestCommunityReviewerResponse &&
      typeof latestCommunityReviewerResponse.reviewer_connection === 'string'
        ? String(latestCommunityReviewerResponse.reviewer_connection)
        : null,
    respondedAt:
      latestCommunityReviewerResponse &&
      typeof latestCommunityReviewerResponse.responded_at === 'string'
        ? String(latestCommunityReviewerResponse.responded_at)
        : null,
    responseCount: communityReviewerResponses.length,
    responseHistory: communityReviewerResponses.map((entry) => ({
      recommendation:
        typeof entry.recommendation === 'string' ? String(entry.recommendation) : null,
      note: typeof entry.note === 'string' ? String(entry.note) : null,
      reviewerName:
        typeof entry.reviewer_name === 'string' ? String(entry.reviewer_name) : null,
      reviewerConnection:
        typeof entry.reviewer_connection === 'string'
          ? String(entry.reviewer_connection)
          : null,
      respondedAt:
        typeof entry.responded_at === 'string' ? String(entry.responded_at) : null,
    })),
    closed:
      typeof task.review_decision === 'string' && task.review_decision === 'resolved',
  };
}

export async function submitFundingApplicationDraftCommunityReviewResponse(
  taskId: string,
  input: {
    reviewerName?: string | null;
    reviewerConnection?: string | null;
    recommendation: 'endorse' | 'request_changes' | 'raise_concern';
    note: string;
  }
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const recommendation = String(input.recommendation || '').trim() as
    | 'endorse'
    | 'request_changes'
    | 'raise_concern';
  const note = String(input.note || '').trim();
  const reviewerName = String(input.reviewerName || '').trim();
  const reviewerConnection = String(input.reviewerConnection || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!['endorse', 'request_changes', 'raise_concern'].includes(recommendation)) {
    throw new Error(
      'Validation: recommendation must be endorse, request_changes, or raise_concern'
    );
  }

  if (!note) {
    throw new Error('Validation: note is required');
  }

  if (note.length > 1500) {
    throw new Error('Validation: note must be 1500 characters or less');
  }

  const { data: currentTask, error } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, started_at, review_decision, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_application_draft')
    .eq('task_type', 'funding_application_community_review')
    .maybeSingle();

  if (error || !currentTask) {
    throw new Error(error?.message || 'Funding application community review task not found');
  }

  if (
    typeof currentTask.review_decision === 'string' &&
    currentTask.review_decision === 'resolved'
  ) {
    throw new Error('Validation: This community review has already been resolved');
  }

  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};
  const respondedAt = new Date().toISOString();
  const existingResponses = Array.isArray(replyTo.community_reviewer_responses)
    ? (replyTo.community_reviewer_responses as Array<Record<string, any>>)
    : replyTo.community_reviewer_response &&
        typeof replyTo.community_reviewer_response === 'object'
      ? [replyTo.community_reviewer_response as Record<string, any>]
      : [];
  const nextCommunityReviewerResponse = {
    recommendation,
    note,
    reviewer_name: reviewerName || null,
    reviewer_connection: reviewerConnection || null,
    responded_at: respondedAt,
  };

  const nextReplyTo = {
    ...replyTo,
    community_reviewer_response: nextCommunityReviewerResponse,
    community_reviewer_responses: [...existingResponses, nextCommunityReviewerResponse].slice(-12),
  };

  const nextStatus =
    currentTask.status === 'completed'
      ? 'running'
      : currentTask.status === 'queued' || currentTask.status === 'pending'
        ? 'running'
        : typeof currentTask.status === 'string'
          ? currentTask.status
          : 'running';

  const auditEntry = {
    action: 'community_replied',
    actorId: 'community',
    at: respondedAt,
    summary: 'Community reviewer submitted draft feedback.',
  };

  const { data: updatedTask, error: updateError } = await serviceClient
    .from('agent_task_queue')
    .update({
      status: nextStatus,
      started_at:
        currentTask.started_at ||
        nextStatus === 'running' ||
        nextStatus === 'in_progress'
          ? currentTask.started_at || respondedAt
          : currentTask.started_at,
      completed_at: null,
      needs_review: true,
      reply_to: nextReplyTo,
      human_edits: appendFundingOperatingTaskAuditEntry(
        currentTask.human_edits,
        auditEntry
      ),
    })
    .eq('id', normalizedId)
    .select('id, status')
    .single();

  if (updateError || !updatedTask) {
    throw new Error(
      updateError?.message || 'Failed to record funding application community review feedback'
    );
  }

  return {
    taskId: String(updatedTask.id),
    status: typeof updatedTask.status === 'string' ? updatedTask.status : nextStatus,
    recommendation,
    note,
    reviewerName: reviewerName || null,
    reviewerConnection: reviewerConnection || null,
    respondedAt,
  };
}

export async function replaceFundingDiscoverySharedShortlist(
  organizationIds: string[],
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedIds = Array.from(
    new Set(organizationIds.map((id) => String(id).trim()).filter(Boolean))
  );

  const { data: currentRows, error: currentError } = await serviceClient
    .from('funding_discovery_shared_shortlist')
    .select('id, organization_id');

  if (currentError) {
    throw new Error(
      currentError.message || 'Failed to load current funding discovery shared shortlist'
    );
  }

  const currentOrgIds = new Set(
    ((currentRows || []) as Array<Record<string, any>>).map((row) =>
      String(row.organization_id)
    )
  );
  const nextOrgIds = new Set(normalizedIds);
  const removeIds = Array.from(currentOrgIds).filter((id) => !nextOrgIds.has(id));

  if (removeIds.length > 0) {
    const { error: deleteError } = await serviceClient
      .from('funding_discovery_shared_shortlist')
      .delete()
      .in('organization_id', removeIds);

    if (deleteError) {
      throw new Error(
        deleteError.message || 'Failed to remove stale funding discovery shortlist entries'
      );
    }
  }

  if (normalizedIds.length > 0) {
    const { error: upsertError } = await serviceClient
      .from('funding_discovery_shared_shortlist')
      .upsert(
        normalizedIds.map((organizationId, index) => ({
          organization_id: organizationId,
          sort_index: index,
          added_by: currentOrgIds.has(organizationId) ? undefined : adminUserId,
          updated_by: adminUserId,
        })),
        {
          onConflict: 'organization_id',
        }
      );

    if (upsertError) {
      throw new Error(upsertError.message || 'Failed to save funding discovery shared shortlist');
    }
  }

  return listFundingDiscoverySharedShortlist();
}

export async function upsertFundingDiscoveryReviewWorkspace(
  input: FundingDiscoveryReviewWorkspaceInput,
  adminUserId: string | null
) {
  const serviceClient = getServiceClient();
  const normalizedActorUserId = normalizePersistedActorUserId(adminUserId);
  const organizationId = String(input.organizationId || '').trim();

  if (!organizationId) {
    throw new Error('Validation: organizationId is required');
  }

  if (
    input.decisionTag !== undefined &&
    input.decisionTag !== null &&
    !['advance', 'hold', 'needs_review'].includes(String(input.decisionTag))
  ) {
    throw new Error('Validation: decisionTag must be advance, hold, or needs_review');
  }

  const normalizedActivity = input.activity
    ? normalizeFundingDiscoveryReviewActivity([input.activity])[0] || null
    : null;

  const { data: currentRow, error: currentError } = await serviceClient
    .from('funding_discovery_review_workspace')
    .select(
      'id, note, decision_tag, activity_log, last_activity_at, last_activity_type, last_reviewed_at'
    )
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (currentError) {
    throw new Error(currentError.message || 'Failed to load funding discovery review workspace');
  }

  const currentActivity = normalizeFundingDiscoveryReviewActivity(
    currentRow?.activity_log
  );
  const nextActivity = normalizedActivity
    ? [normalizedActivity, ...currentActivity.filter((entry) => entry.id !== normalizedActivity.id)].slice(
        0,
        20
      )
    : currentActivity;

  const hasNote = Object.prototype.hasOwnProperty.call(input, 'note');
  const hasDecisionTag = Object.prototype.hasOwnProperty.call(input, 'decisionTag');

  const nextNote = hasNote
    ? String(input.note || '').trim() || null
    : typeof currentRow?.note === 'string'
      ? currentRow.note
      : null;
  const nextDecisionTag = hasDecisionTag
    ? input.decisionTag || null
    : typeof currentRow?.decision_tag === 'string'
      ? currentRow.decision_tag
      : null;
  const nextLastActivityAt = normalizedActivity
    ? normalizedActivity.timestamp
    : currentRow?.last_activity_at || null;
  const nextLastActivityType = normalizedActivity
    ? normalizedActivity.type
    : typeof currentRow?.last_activity_type === 'string'
      ? currentRow.last_activity_type
      : null;
  const nextLastReviewedAt = normalizedActivity?.type === 'candidate_touched'
    ? normalizedActivity.timestamp
    : currentRow?.last_reviewed_at || null;

  const basePayload = {
    organization_id: organizationId,
    note: nextNote,
    decision_tag: nextDecisionTag,
    activity_log: nextActivity,
    last_activity_at: nextLastActivityAt,
    last_activity_type: nextLastActivityType,
    last_reviewed_at: nextLastReviewedAt,
    updated_by: normalizedActorUserId,
  };

  const { data, error } = currentRow
    ? await serviceClient
        .from('funding_discovery_review_workspace')
        .update(basePayload)
        .eq('id', currentRow.id)
        .select(
          'id, organization_id, note, decision_tag, activity_log, last_activity_at, last_activity_type, last_reviewed_at, created_at, updated_at'
        )
        .single()
    : await serviceClient
        .from('funding_discovery_review_workspace')
        .insert([
          {
            ...basePayload,
            created_by: normalizedActorUserId,
          },
        ])
        .select(
          'id, organization_id, note, decision_tag, activity_log, last_activity_at, last_activity_type, last_reviewed_at, created_at, updated_at'
        )
        .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update funding discovery review workspace');
  }

  return {
    id: String(data.id),
    organizationId: String(data.organization_id),
    note: typeof data.note === 'string' ? data.note : null,
    decisionTag:
      typeof data.decision_tag === 'string' ? data.decision_tag : null,
    activityLog: normalizeFundingDiscoveryReviewActivity(data.activity_log),
    lastActivityAt: data.last_activity_at || null,
    lastActivityType:
      typeof data.last_activity_type === 'string' ? data.last_activity_type : null,
    lastReviewedAt: data.last_reviewed_at || null,
    createdAt: data.created_at || null,
    updatedAt: data.updated_at || null,
  };
}

export async function upsertFundingApplicationDraftWorkspace(
  input: FundingApplicationDraftWorkspaceInput,
  adminUserId: string | null
) {
  const serviceClient = getServiceClient();
  const normalizedActorUserId = normalizePersistedActorUserId(adminUserId);
  const organizationId = String(input.organizationId || '').trim();
  const opportunityId = String(input.opportunityId || '').trim();

  if (!organizationId || !opportunityId) {
    throw new Error('Validation: organizationId and opportunityId are required');
  }

  const draftStatus =
    input.draftStatus === null || input.draftStatus === undefined
      ? 'draft'
      : String(input.draftStatus);

  if (
    !['draft', 'in_review', 'ready_to_submit', 'submitted', 'archived'].includes(
      draftStatus
    )
  ) {
    throw new Error(
      'Validation: draftStatus must be draft, in_review, ready_to_submit, submitted, or archived'
    );
  }

  const { data: currentRow, error: currentError } = await serviceClient
    .from('funding_application_draft_workspace')
    .select(
      'id, narrative_draft, support_material, community_review_notes, budget_notes, draft_status, last_review_requested_at, last_review_completed_at'
    )
    .eq('organization_id', organizationId)
    .eq('opportunity_id', opportunityId)
    .maybeSingle();

  if (currentError) {
    throw new Error(
      currentError.message || 'Failed to load funding application draft workspace'
    );
  }

  const hasNarrative = Object.prototype.hasOwnProperty.call(input, 'narrativeDraft');
  const hasSupportMaterial = Object.prototype.hasOwnProperty.call(
    input,
    'supportMaterial'
  );
  const hasCommunityReviewNotes = Object.prototype.hasOwnProperty.call(
    input,
    'communityReviewNotes'
  );
  const hasBudgetNotes = Object.prototype.hasOwnProperty.call(input, 'budgetNotes');
  const hasDraftStatus = Object.prototype.hasOwnProperty.call(input, 'draftStatus');
  const hasReviewRequested = Object.prototype.hasOwnProperty.call(
    input,
    'lastReviewRequestedAt'
  );
  const hasReviewCompleted = Object.prototype.hasOwnProperty.call(
    input,
    'lastReviewCompletedAt'
  );

  const payload = {
    organization_id: organizationId,
    opportunity_id: opportunityId,
    application_id:
      typeof input.applicationId === 'string' && input.applicationId.trim()
        ? input.applicationId.trim()
        : currentRow?.application_id || null,
    narrative_draft: hasNarrative
      ? String(input.narrativeDraft || '').trim() || null
      : typeof currentRow?.narrative_draft === 'string'
        ? currentRow.narrative_draft
        : null,
    support_material: hasSupportMaterial
      ? normalizeApplicationDraftTextList(input.supportMaterial)
      : normalizeApplicationDraftTextList(currentRow?.support_material),
    community_review_notes: hasCommunityReviewNotes
      ? normalizeApplicationDraftTextList(input.communityReviewNotes)
      : normalizeApplicationDraftTextList(currentRow?.community_review_notes),
    budget_notes: hasBudgetNotes
      ? String(input.budgetNotes || '').trim() || null
      : typeof currentRow?.budget_notes === 'string'
        ? currentRow.budget_notes
        : null,
    draft_status: hasDraftStatus
      ? draftStatus
      : typeof currentRow?.draft_status === 'string'
        ? currentRow.draft_status
        : 'draft',
    last_review_requested_at: hasReviewRequested
      ? input.lastReviewRequestedAt || null
      : currentRow?.last_review_requested_at || null,
    last_review_completed_at: hasReviewCompleted
      ? input.lastReviewCompletedAt || null
      : currentRow?.last_review_completed_at || null,
    updated_by: normalizedActorUserId,
  };

  const { data, error } = currentRow
    ? await serviceClient
        .from('funding_application_draft_workspace')
        .update(payload)
        .eq('id', currentRow.id)
        .select(
          'id, organization_id, opportunity_id, application_id, narrative_draft, support_material, community_review_notes, budget_notes, draft_status, last_review_requested_at, last_review_completed_at, created_at, updated_at'
        )
        .single()
    : await serviceClient
        .from('funding_application_draft_workspace')
        .insert([
          {
            ...payload,
            created_by: normalizedActorUserId,
          },
        ])
        .select(
          'id, organization_id, opportunity_id, application_id, narrative_draft, support_material, community_review_notes, budget_notes, draft_status, last_review_requested_at, last_review_completed_at, created_at, updated_at'
        )
        .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save funding application draft workspace');
  }

  return {
    id: String(data.id),
    organizationId: String(data.organization_id),
    opportunityId: String(data.opportunity_id),
    applicationId:
      typeof data.application_id === 'string' ? data.application_id : null,
    narrativeDraft:
      typeof data.narrative_draft === 'string' ? data.narrative_draft : null,
    supportMaterial: normalizeApplicationDraftTextList(data.support_material),
    communityReviewNotes: normalizeApplicationDraftTextList(
      data.community_review_notes
    ),
    budgetNotes: typeof data.budget_notes === 'string' ? data.budget_notes : null,
    draftStatus:
      typeof data.draft_status === 'string' ? data.draft_status : 'draft',
    lastReviewRequestedAt: data.last_review_requested_at || null,
    lastReviewCompletedAt: data.last_review_completed_at || null,
    createdAt: data.created_at || null,
    updatedAt: data.updated_at || null,
    reviewTask: null,
  };
}

export async function requestFundingApplicationDraftCommunityReview(
  input: FundingApplicationDraftWorkspaceInput,
  actorUserId: string | null
) {
  const normalizedActorUserId = normalizePersistedActorUserId(actorUserId);
  const organizationId = String(input.organizationId || '').trim();
  const opportunityId = String(input.opportunityId || '').trim();

  if (!organizationId || !opportunityId) {
    throw new Error('Validation: organizationId and opportunityId are required');
  }

  const draft = await upsertFundingApplicationDraftWorkspace(
    {
      ...input,
      draftStatus:
        input.draftStatus === undefined || input.draftStatus === null
          ? 'in_review'
          : input.draftStatus,
      lastReviewRequestedAt:
        input.lastReviewRequestedAt || new Date().toISOString(),
    },
    normalizedActorUserId
  );

  const serviceClient = getServiceClient();
  const sourceId = `draft-review:${organizationId}:${opportunityId}`;

  const { data: existingTask, error: existingTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, title, created_at, completed_at')
    .eq('source', 'funding_application_draft')
    .eq('task_type', 'funding_application_community_review')
    .eq('source_id', sourceId)
    .in('status', ['queued', 'pending', 'running', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTaskError) {
    throw new Error(existingTaskError.message || 'Failed to inspect funding application community review tasks');
  }

  if (existingTask) {
    return {
      draft: {
        ...draft,
        reviewTask: {
          id: String(existingTask.id),
          status: typeof existingTask.status === 'string' ? existingTask.status : 'queued',
          title:
            typeof existingTask.title === 'string'
              ? existingTask.title
              : 'Community review request',
          createdAt: existingTask.created_at || null,
          completedAt: existingTask.completed_at || null,
        },
      },
      reviewTask: {
        id: String(existingTask.id),
        status: typeof existingTask.status === 'string' ? existingTask.status : 'queued',
        title:
          typeof existingTask.title === 'string'
            ? existingTask.title
            : 'Community review request',
        createdAt: existingTask.created_at || null,
        completedAt: existingTask.completed_at || null,
      },
      existing: true,
    };
  }

  const [{ data: organization, error: organizationError }, { data: opportunity, error: opportunityError }] =
    await Promise.all([
      serviceClient
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .maybeSingle(),
      serviceClient
        .from('alma_funding_opportunities')
        .select('id, name, funder_name')
        .eq('id', opportunityId)
        .maybeSingle(),
    ]);

  if (organizationError || !organization) {
    throw new Error(organizationError?.message || 'Organization not found');
  }

  if (opportunityError || !opportunity) {
    throw new Error(opportunityError?.message || 'Opportunity not found');
  }

  const { data: createdTask, error: createTaskError } = await serviceClient
    .from('agent_task_queue')
    .insert([
      {
        source: 'funding_application_draft',
        source_id: sourceId,
        task_type: 'funding_application_community_review',
        title: `Community review: ${String(organization.name || 'Organization')}`,
        description: `Review the draft application for ${String(organization.name || 'this organization')} before submission to ${String(opportunity.name || 'this opportunity')}.`,
        status: 'queued',
        priority: 2,
        needs_review: true,
        requested_by: normalizedActorUserId,
        reply_to: {
          organization_id: organizationId,
          opportunity_id: opportunityId,
          organization_name: String(organization.name || 'Organization'),
          opportunity_name: String(opportunity.name || 'Funding opportunity'),
          funder_name:
            typeof opportunity.funder_name === 'string' ? opportunity.funder_name : null,
          draft_workspace_id: draft.id,
          narrative_present: Boolean(draft.narrativeDraft),
          support_material_count: draft.supportMaterial.length,
          community_review_note_count: draft.communityReviewNotes.length,
          requested_at: draft.lastReviewRequestedAt || new Date().toISOString(),
        },
        human_edits: [
          {
            action: 'created',
            actorId: normalizedActorUserId,
            at: new Date().toISOString(),
            summary: 'Created community review request for application draft.',
          },
        ],
      },
    ])
    .select('id, status, title, created_at, completed_at')
    .single();

  if (createTaskError || !createdTask) {
    throw new Error(createTaskError?.message || 'Failed to create funding application community review task');
  }

  return {
    draft: {
      ...draft,
      reviewTask: {
        id: String(createdTask.id),
        status: typeof createdTask.status === 'string' ? createdTask.status : 'queued',
        title:
          typeof createdTask.title === 'string'
            ? createdTask.title
            : 'Community review request',
        createdAt: createdTask.created_at || null,
        completedAt: createdTask.completed_at || null,
      },
    },
    reviewTask: {
      id: String(createdTask.id),
      status: typeof createdTask.status === 'string' ? createdTask.status : 'queued',
      title:
        typeof createdTask.title === 'string'
          ? createdTask.title
          : 'Community review request',
      createdAt: createdTask.created_at || null,
      completedAt: createdTask.completed_at || null,
    },
    existing: false,
  };
}

export async function promoteFundingApplicationDraftToLiveApplication(
  input: FundingApplicationDraftWorkspaceInput,
  actorUserId: string | null
) {
  const serviceClient = getServiceClient();
  const normalizedActorUserId = normalizePersistedActorUserId(actorUserId);
  const organizationId = String(input.organizationId || '').trim();
  const opportunityId = String(input.opportunityId || '').trim();

  if (!organizationId || !opportunityId) {
    throw new Error('Validation: organizationId and opportunityId are required');
  }

  const draft = await upsertFundingApplicationDraftWorkspace(input, normalizedActorUserId);

  if (draft.draftStatus !== 'ready_to_submit') {
    throw new Error('Validation: Draft must be ready_to_submit before promotion');
  }

  let recommendationId: string | null = null;
  let applicationId: string | null = draft.applicationId || null;
  let awardId: string | null = null;

  const { data: recommendation, error: recommendationError } = await serviceClient
    .from('funding_match_recommendations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('opportunity_id', opportunityId)
    .order('match_score', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recommendationError) {
    throw new Error(
      recommendationError.message || 'Failed to load funding recommendation for draft promotion'
    );
  }

  if (recommendation?.id) {
    recommendationId = String(recommendation.id);
    const promoted = await promoteFundingMatchRecommendation(
      recommendationId,
      normalizedActorUserId
    );
    applicationId = promoted.applicationId || applicationId;
    awardId = promoted.awardId || null;
  } else if (!applicationId) {
    const { data: existingApplication, error: existingApplicationError } = await serviceClient
      .from('alma_funding_applications')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('opportunity_id', opportunityId)
      .limit(1)
      .maybeSingle();

    if (existingApplicationError) {
      throw new Error(
        existingApplicationError.message || 'Failed to inspect existing funding application'
      );
    }

    if (existingApplication?.id) {
      applicationId = String(existingApplication.id);
    } else {
      const { data: createdApplication, error: createApplicationError } = await serviceClient
        .from('alma_funding_applications')
        .insert([
          {
            organization_id: organizationId,
            opportunity_id: opportunityId,
            status: 'evaluating',
            notes:
              'Promoted directly from the application draft workspace without an existing match recommendation.',
          },
        ])
        .select('id')
        .single();

      if (createApplicationError || !createdApplication) {
        throw new Error(
          createApplicationError?.message || 'Failed to create funding application from draft'
        );
      }

      applicationId = String(createdApplication.id);
    }
  }

  const updatedDraft = await upsertFundingApplicationDraftWorkspace(
    {
      organizationId,
      opportunityId,
      applicationId: applicationId || undefined,
      narrativeDraft: draft.narrativeDraft,
      supportMaterial: draft.supportMaterial,
      communityReviewNotes: draft.communityReviewNotes,
      budgetNotes: draft.budgetNotes,
      draftStatus: 'submitted',
      lastReviewRequestedAt: draft.lastReviewRequestedAt || undefined,
      lastReviewCompletedAt: draft.lastReviewCompletedAt || undefined,
    },
    normalizedActorUserId
  );

  return {
    draft: updatedDraft,
    applicationId,
    awardId,
    recommendationId,
    reviewTask: updatedDraft.reviewTask || null,
    existing: false,
  };
}

export async function listFundingApplicationDraftCommunityReviewTasks(filters?: {
  limit?: number;
  status?: 'all' | 'queued' | 'pending' | 'running' | 'in_progress' | 'completed';
  reviewStatus?: 'all' | 'pending' | 'resolved';
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, filters?.limit ?? 30));

  let query = serviceClient
    .from('agent_task_queue')
    .select(
      'id, source_id, status, title, description, priority, created_at, started_at, completed_at, reply_to, review_decision, review_feedback, reviewed_at, needs_review, human_edits'
    )
    .eq('source', 'funding_application_draft')
    .eq('task_type', 'funding_application_community_review')
    .order('priority', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.reviewStatus === 'pending') {
    query = query.is('review_decision', null);
  } else if (filters?.reviewStatus === 'resolved') {
    query = query.eq('review_decision', 'resolved');
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to load funding application draft community review tasks');
  }

  return ((data || []) as Array<Record<string, any>>).map((row) => {
    const replyTo =
      row.reply_to && typeof row.reply_to === 'object'
        ? (row.reply_to as Record<string, any>)
        : {};
    const communityReviewerResponses = Array.isArray(replyTo.community_reviewer_responses)
      ? (replyTo.community_reviewer_responses as Array<Record<string, any>>)
      : replyTo.community_reviewer_response &&
          typeof replyTo.community_reviewer_response === 'object'
        ? [replyTo.community_reviewer_response as Record<string, any>]
        : [];
    const latestCommunityReviewerResponse =
      communityReviewerResponses.length > 0
        ? communityReviewerResponses[communityReviewerResponses.length - 1]
        : null;
    const communityReviewMix = communityReviewerResponses.reduce(
      (accumulator, entry) => {
        const recommendation =
          typeof entry.recommendation === 'string' ? String(entry.recommendation) : null;
        if (recommendation === 'endorse') accumulator.endorse += 1;
        if (recommendation === 'request_changes') accumulator.requestChanges += 1;
        if (recommendation === 'raise_concern') accumulator.raiseConcern += 1;
        return accumulator;
      },
      {
        endorse: 0,
        requestChanges: 0,
        raiseConcern: 0,
      }
    );
    const auditTrail = normalizeFundingOperatingTaskAuditTrail(row.human_edits);
    const lastAudit = auditTrail.length > 0 ? auditTrail[auditTrail.length - 1] : null;

    return {
      id: String(row.id),
      sourceId: typeof row.source_id === 'string' ? row.source_id : null,
      status: typeof row.status === 'string' ? row.status : 'queued',
      title:
        typeof row.title === 'string' ? row.title : 'Community review request',
      description: typeof row.description === 'string' ? row.description : '',
      priority:
        typeof row.priority === 'number' && Number.isFinite(row.priority) ? row.priority : 2,
      createdAt: row.created_at || null,
      startedAt: row.started_at || null,
      completedAt: row.completed_at || null,
      reviewDecision:
        typeof row.review_decision === 'string' ? row.review_decision : null,
      reviewFeedback:
        typeof row.review_feedback === 'string' ? row.review_feedback : null,
      reviewedAt: row.reviewed_at || null,
      needsReview: row.needs_review === true,
      organizationId:
        typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null,
      opportunityId:
        typeof replyTo.opportunity_id === 'string' ? replyTo.opportunity_id : null,
      organizationName:
        typeof replyTo.organization_name === 'string' ? replyTo.organization_name : null,
      opportunityName:
        typeof replyTo.opportunity_name === 'string' ? replyTo.opportunity_name : null,
      funderName:
        typeof replyTo.funder_name === 'string' ? replyTo.funder_name : null,
      draftWorkspaceId:
        typeof replyTo.draft_workspace_id === 'string'
          ? replyTo.draft_workspace_id
          : null,
      narrativePresent: replyTo.narrative_present === true,
      supportMaterialCount: Number(replyTo.support_material_count || 0),
      communityReviewNoteCount: Number(replyTo.community_review_note_count || 0),
      requestedAt:
        typeof replyTo.requested_at === 'string' ? replyTo.requested_at : null,
      communityReviewerRecommendation:
        latestCommunityReviewerResponse &&
        typeof latestCommunityReviewerResponse.recommendation === 'string'
          ? String(latestCommunityReviewerResponse.recommendation)
          : null,
      communityReviewerNote:
        latestCommunityReviewerResponse &&
        typeof latestCommunityReviewerResponse.note === 'string'
          ? String(latestCommunityReviewerResponse.note)
          : null,
      communityReviewerName:
        latestCommunityReviewerResponse &&
        typeof latestCommunityReviewerResponse.reviewer_name === 'string'
          ? String(latestCommunityReviewerResponse.reviewer_name)
          : null,
      communityReviewerConnection:
        latestCommunityReviewerResponse &&
        typeof latestCommunityReviewerResponse.reviewer_connection === 'string'
          ? String(latestCommunityReviewerResponse.reviewer_connection)
          : null,
      communityReviewerRespondedAt:
        latestCommunityReviewerResponse &&
        typeof latestCommunityReviewerResponse.responded_at === 'string'
          ? String(latestCommunityReviewerResponse.responded_at)
          : null,
      communityReviewerResponseCount: communityReviewerResponses.length,
      communityReviewerEndorseCount: communityReviewMix.endorse,
      communityReviewerRequestChangesCount: communityReviewMix.requestChanges,
      communityReviewerRaiseConcernCount: communityReviewMix.raiseConcern,
      resolution:
        typeof replyTo.resolution === 'string' ? replyTo.resolution : null,
      auditEntryCount: auditTrail.length,
      lastAudit: lastAudit
        ? {
            action: typeof lastAudit.action === 'string' ? lastAudit.action : 'updated',
            actorId: typeof lastAudit.actorId === 'string' ? lastAudit.actorId : null,
            at: typeof lastAudit.at === 'string' ? lastAudit.at : null,
            summary:
              typeof lastAudit.summary === 'string' ? lastAudit.summary : 'Task updated',
          }
        : null,
    };
  });
}

export async function updateFundingApplicationDraftCommunityReviewTaskStatus(
  taskId: string,
  status: 'queued' | 'running',
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_application_draft')
    .eq('task_type', 'funding_application_community_review')
    .maybeSingle();

  if (currentTaskError || !currentTask) {
    throw new Error(currentTaskError?.message || 'Funding application community review task not found');
  }

  const startedAt =
    status === 'running'
      ? currentTask.status === 'running' || currentTask.status === 'in_progress'
        ? undefined
        : new Date().toISOString()
      : null;

  const auditEntry = {
    action: 'status_changed',
    actorId: adminUserId,
    at: new Date().toISOString(),
    summary:
      status === 'running'
        ? 'Moved community review task into progress.'
        : 'Returned community review task to queue.',
  };

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update({
      status,
      started_at: startedAt,
      completed_at: null,
      human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
    })
    .eq('id', normalizedId)
    .select('id, status')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update funding application community review task');
  }

  return {
    id: String(data.id),
    status: typeof data.status === 'string' ? data.status : status,
  };
}

export async function resolveFundingApplicationDraftCommunityReviewTask(
  taskId: string,
  resolution: 'ready_to_submit' | 'needs_revision',
  note: string,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(taskId || '').trim();
  const trimmedNote = String(note || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: taskId is required');
  }

  if (!trimmedNote) {
    throw new Error('Validation: note is required');
  }

  if (trimmedNote.length > 1000) {
    throw new Error('Validation: note must be 1000 characters or less');
  }

  const { data: currentTask, error: currentTaskError } = await serviceClient
    .from('agent_task_queue')
    .select('id, status, reply_to, human_edits')
    .eq('id', normalizedId)
    .eq('source', 'funding_application_draft')
    .eq('task_type', 'funding_application_community_review')
    .maybeSingle();

  if (currentTaskError || !currentTask) {
    throw new Error(currentTaskError?.message || 'Funding application community review task not found');
  }

  const replyTo =
    currentTask.reply_to && typeof currentTask.reply_to === 'object'
      ? (currentTask.reply_to as Record<string, any>)
      : {};

  const organizationId =
    typeof replyTo.organization_id === 'string' ? replyTo.organization_id : null;
  const opportunityId =
    typeof replyTo.opportunity_id === 'string' ? replyTo.opportunity_id : null;

  if (!organizationId || !opportunityId) {
    throw new Error('Validation: Draft review task is missing organization or opportunity context');
  }

  const currentDraft = await getFundingApplicationDraftWorkspaceRecord(
    organizationId,
    opportunityId
  );

  if (!currentDraft) {
    throw new Error('Validation: Funding application draft workspace not found');
  }

  const nextCommunityReviewNotes =
    resolution === 'needs_revision'
      ? [...currentDraft.communityReviewNotes, `Review feedback: ${trimmedNote}`]
      : currentDraft.communityReviewNotes;

  await upsertFundingApplicationDraftWorkspace(
    {
      organizationId,
      opportunityId,
      applicationId: currentDraft.applicationId || undefined,
      narrativeDraft: currentDraft.narrativeDraft,
      supportMaterial: currentDraft.supportMaterial,
      communityReviewNotes: nextCommunityReviewNotes,
      budgetNotes: currentDraft.budgetNotes,
      draftStatus: resolution === 'ready_to_submit' ? 'ready_to_submit' : 'draft',
      lastReviewRequestedAt: currentDraft.lastReviewRequestedAt || undefined,
      lastReviewCompletedAt: new Date().toISOString(),
    },
    adminUserId
  );

  const nextReplyTo = {
    ...replyTo,
    resolution,
    resolution_note: trimmedNote,
    resolved_at: new Date().toISOString(),
    resolved_by: adminUserId,
  };

  const auditEntry = {
    action: 'reviewed',
    actorId: adminUserId,
    at: new Date().toISOString(),
    summary:
      resolution === 'ready_to_submit'
        ? 'Resolved draft review as ready to submit.'
        : 'Returned draft for revision after community review.',
  };

  const { data, error } = await serviceClient
    .from('agent_task_queue')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      review_decision: 'resolved',
      review_feedback: trimmedNote,
      reviewed_at: new Date().toISOString(),
      needs_review: false,
      reply_to: nextReplyTo,
      human_edits: appendFundingOperatingTaskAuditEntry(currentTask.human_edits, auditEntry),
    })
    .eq('id', normalizedId)
    .select('id, status, review_decision')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to resolve funding application community review task');
  }

  return {
    id: String(data.id),
    status: typeof data.status === 'string' ? data.status : 'completed',
    reviewDecision:
      typeof data.review_decision === 'string' ? data.review_decision : 'resolved',
    resolution,
  };
}

export async function listFundingDiscoveryProfileCandidates(options?: {
  limit?: number;
  includeInitialized?: boolean;
}) {
  const serviceClient = getServiceClient();
  const limit = Math.max(1, Math.min(100, options?.limit ?? 40));
  const includeInitialized = options?.includeInitialized !== false;

  const { data: organizations, error } = await serviceClient
    .from('organizations')
    .select('id, name, slug, type, city, state, partner_tier, verification_status')
    .order('name', { ascending: true })
    .limit(limit * 3);

  if (error) {
    throw new Error(error.message || 'Failed to load organizations for discovery candidates');
  }

  const organizationRows = (organizations || []) as Array<Record<string, any>>;
  const orgIds = organizationRows.map((org) => String(org.id));
  const safeOrgIds =
    orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000'];

  const [
    capabilityProfilesResult,
    nodesResult,
    orgProfilesResult,
    workspaceResult,
  ] = await Promise.all([
    serviceClient
      .from('organization_capability_profiles')
      .select('id, organization_id')
      .in('organization_id', safeOrgIds),
    serviceClient
      .from('justicehub_nodes')
      .select('id, lead_organization_id')
      .in('lead_organization_id', safeOrgIds),
    serviceClient
      .from('organizations_profiles')
      .select(
        `
        id,
        organization_id,
        is_current,
        is_featured,
        public_profile:public_profiles(
          id,
          is_public,
          is_featured
        )
      `
      )
      .in('organization_id', safeOrgIds),
    serviceClient
      .from('funding_discovery_review_workspace')
      .select('id, organization_id')
      .in('organization_id', safeOrgIds),
  ]);

  if (capabilityProfilesResult.error) {
    throw new Error(
      capabilityProfilesResult.error.message ||
        'Failed to load capability profiles for discovery candidates'
    );
  }

  if (nodesResult.error) {
    throw new Error(
      nodesResult.error.message || 'Failed to load nodes for discovery candidates'
    );
  }

  if (orgProfilesResult.error) {
    throw new Error(
      orgProfilesResult.error.message ||
        'Failed to load organization profiles for discovery candidates'
    );
  }

  if (workspaceResult.error) {
    throw new Error(
      workspaceResult.error.message ||
        'Failed to load discovery workspace for discovery candidates'
    );
  }

  const capabilityProfileIds = new Set(
    ((capabilityProfilesResult.data || []) as Array<Record<string, any>>).map((row) =>
      String(row.organization_id)
    )
  );
  const workspaceIds = new Set(
    ((workspaceResult.data || []) as Array<Record<string, any>>).map((row) =>
      String(row.organization_id)
    )
  );

  const nodeCountByOrg = new Map<string, number>();
  for (const row of (nodesResult.data || []) as Array<Record<string, any>>) {
    const orgId = String(row.lead_organization_id || '');
    if (!orgId) continue;
    nodeCountByOrg.set(orgId, (nodeCountByOrg.get(orgId) || 0) + 1);
  }

  const profileLinksByOrg = new Map<string, Array<Record<string, any>>>();
  for (const row of (orgProfilesResult.data || []) as Array<Record<string, any>>) {
    const orgId = String(row.organization_id || '');
    if (!orgId) continue;
    const bucket = profileLinksByOrg.get(orgId) || [];
    bucket.push(row);
    profileLinksByOrg.set(orgId, bucket);
  }

  const scored = organizationRows
    .map((org) => {
      const organizationId = String(org.id);
      const partnerTier = String(org.partner_tier || '').trim().toLowerCase();
      const links = profileLinksByOrg.get(organizationId) || [];
      const profileLinkCount = links.length;
      const publicProfileCount = links.filter(
        (link) => link.public_profile && typeof link.public_profile === 'object'
      ).length;
      const featuredConnectorCount = links.filter((link) => link.is_featured === true).length;
      const nodeCount = nodeCountByOrg.get(organizationId) || 0;
      const hasCapabilityProfile = capabilityProfileIds.has(organizationId);
      const hasSharedProfile = workspaceIds.has(organizationId);
      const verificationStatus = String(org.verification_status || '').trim().toLowerCase();

      const dataScore =
        (partnerTier === 'basecamp' ? 30 : partnerTier === 'partner' ? 18 : 0) +
        Math.min(nodeCount, 4) * 8 +
        Math.min(profileLinkCount, 6) * 5 +
        Math.min(publicProfileCount, 6) * 4 +
        Math.min(featuredConnectorCount, 4) * 3 +
        (hasCapabilityProfile ? 18 : 0) +
        (hasSharedProfile ? 12 : 0) +
        (verificationStatus === 'verified' ? 10 : 0);

      const recommended =
        partnerTier === 'basecamp'
          ? dataScore >= 35
          : dataScore >= 28;

      return {
        organizationId,
        organization: {
          id: organizationId,
          name: typeof org.name === 'string' ? org.name : 'Organization',
          slug: typeof org.slug === 'string' ? org.slug : null,
          type: typeof org.type === 'string' ? org.type : null,
          city: typeof org.city === 'string' ? org.city : null,
          state: typeof org.state === 'string' ? org.state : null,
          partnerTier: partnerTier || null,
          verificationStatus: verificationStatus || null,
        },
        dataScore,
        hasCapabilityProfile,
        hasSharedProfile,
        nodeCount,
        profileLinkCount,
        publicProfileCount,
        featuredConnectorCount,
        cohortBucket: partnerTier === 'basecamp' ? 'basecamp' : 'additional',
        recommended,
      };
    })
    .filter((row) => includeInitialized || !row.hasSharedProfile)
    .sort((left, right) => {
      const leftPriority = left.cohortBucket === 'basecamp' ? 0 : 1;
      const rightPriority = right.cohortBucket === 'basecamp' ? 0 : 1;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      if (right.dataScore !== left.dataScore) {
        return right.dataScore - left.dataScore;
      }
      return left.organization.name.localeCompare(right.organization.name);
    })
    .slice(0, limit);

  return scored;
}

export async function rescoreFundingMatchRecommendation(
  recommendationId: string,
  adminUserId: string
) {
  const serviceClient = getServiceClient();
  const normalizedId = String(recommendationId || '').trim();

  if (!normalizedId) {
    throw new Error('Validation: recommendationId is required');
  }

  const { data: recommendation, error } = await serviceClient
    .from('funding_match_recommendations')
    .select('id, opportunity_id, organization_id')
    .eq('id', normalizedId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load funding recommendation');
  }

  if (!recommendation) {
    throw new Error('Validation: Recommendation not found');
  }

  const result = await generateFundingMatchRecommendations(
    {
      opportunityIds: [String(recommendation.opportunity_id)],
      organizationIds: [String(recommendation.organization_id)],
      minScore: 0,
      limit: 1,
    },
    adminUserId
  );

  return {
    recommendationId: normalizedId,
    ...result,
  };
}

export async function createFundingOutcomeUpdate(
  input: OutcomeUpdateInput,
  adminUserId: string | null
) {
  const serviceClient = getServiceClient();
  const commitmentId = String(input.commitmentId || '').trim();
  const updateType = String(input.updateType || '').trim().toLowerCase();
  const allowedUpdateTypes = new Set(['baseline', 'progress', 'milestone', 'final', 'correction']);

  if (!commitmentId) {
    throw new Error('Validation: commitmentId is required');
  }

  if (!allowedUpdateTypes.has(updateType)) {
    throw new Error('Validation: updateType must be baseline, progress, milestone, final, or correction');
  }

  const confidenceScore = Math.max(0, Math.min(100, Number(input.confidenceScore ?? 0) || 0));
  const reportedValue =
    typeof input.reportedValue === 'number' && Number.isFinite(input.reportedValue)
      ? input.reportedValue
      : null;
  const evidenceUrls = (input.evidenceUrls || [])
    .map((url) => String(url || '').trim())
    .filter(Boolean);

  const workflow = await createWorkflow(
    serviceClient,
    'community_report',
    'outcome',
    adminUserId,
    { commitmentId, updateType, confidenceScore }
  );

  const { data: commitment, error: commitmentError } = await serviceClient
    .from('funding_outcome_commitments')
    .select('id, current_value')
    .eq('id', commitmentId)
    .maybeSingle();

  if (commitmentError) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: commitmentError.message, commitmentId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(commitmentError.message || 'Failed to load outcome commitment');
  }

  if (!commitment) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: 'Outcome commitment not found', commitmentId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error('Validation: Outcome commitment not found');
  }

  const { data: createdUpdate, error: updateError } = await serviceClient
    .from('funding_outcome_updates')
    .insert([
      {
        commitment_id: commitmentId,
        update_type: updateType,
        reported_value: reportedValue,
        reported_at: input.reportedAt || new Date().toISOString(),
        reporting_period_start: input.reportingPeriodStart || null,
        reporting_period_end: input.reportingPeriodEnd || null,
        reported_by_user_id: adminUserId,
        narrative: input.narrative || null,
        evidence_urls: evidenceUrls,
        confidence_score: confidenceScore,
      },
    ])
    .select('*')
    .single();

  if (updateError || !createdUpdate) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: updateError?.message || 'Failed to create outcome update', commitmentId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(updateError?.message || 'Failed to create outcome update');
  }

  if (reportedValue !== null) {
    await serviceClient
      .from('funding_outcome_commitments')
      .update({
        current_value: reportedValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commitmentId);
  }

  const result = {
    workflowId: workflow.id,
    updateId: createdUpdate.id,
    commitmentId,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: reportedValue !== null ? 2 : 1,
  });

  return result;
}

export async function createCommunityOutcomeValidation(
  input: CommunityOutcomeValidationInput,
  adminUserId: string | null
) {
  const serviceClient = getServiceClient();
  const updateId = String(input.updateId || '').trim();
  const validatorKind = String(input.validatorKind || '').trim().toLowerCase();
  const validationStatus = String(input.validationStatus || '').trim().toLowerCase();
  const allowedValidatorKinds = new Set([
    'community_member',
    'community_board',
    'elder',
    'participant',
    'independent_evaluator',
    'funder',
  ]);
  const allowedValidationStatuses = new Set([
    'confirmed',
    'contested',
    'mixed',
    'needs_follow_up',
  ]);

  if (!updateId) {
    throw new Error('Validation: updateId is required');
  }

  if (!allowedValidatorKinds.has(validatorKind)) {
    throw new Error(
      'Validation: validatorKind must be community_member, community_board, elder, participant, independent_evaluator, or funder'
    );
  }

  if (!allowedValidationStatuses.has(validationStatus)) {
    throw new Error(
      'Validation: validationStatus must be confirmed, contested, mixed, or needs_follow_up'
    );
  }

  const impactRating =
    typeof input.impactRating === 'number' && Number.isFinite(input.impactRating)
      ? Math.max(1, Math.min(5, Math.round(input.impactRating)))
      : null;
  const trustRating =
    typeof input.trustRating === 'number' && Number.isFinite(input.trustRating)
      ? Math.max(1, Math.min(5, Math.round(input.trustRating)))
      : null;

  const workflow = await createWorkflow(
    serviceClient,
    'community_report',
    'outcome',
    adminUserId,
    { updateId, validatorKind, validationStatus }
  );

  const { data: update, error: updateError } = await serviceClient
    .from('funding_outcome_updates')
    .select('id')
    .eq('id', updateId)
    .maybeSingle();

  if (updateError) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: updateError.message, updateId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(updateError.message || 'Failed to load outcome update');
  }

  if (!update) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: 'Outcome update not found', updateId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error('Validation: Outcome update not found');
  }

  const { data: createdValidation, error: validationError } = await serviceClient
    .from('community_outcome_validations')
    .insert([
      {
        update_id: updateId,
        validator_kind: validatorKind,
        validator_name: input.validatorName || null,
        validator_user_id: adminUserId,
        validation_status: validationStatus,
        validation_notes: input.validationNotes || null,
        impact_rating: impactRating,
        trust_rating: trustRating,
        validated_at: input.validatedAt || new Date().toISOString(),
      },
    ])
    .select('*')
    .single();

  if (validationError || !createdValidation) {
    await completeWorkflow(
      serviceClient,
      workflow.id,
      { error: validationError?.message || 'Failed to create community validation', updateId },
      { recordsScanned: 1, recordsChanged: 0, errorCount: 1 }
    );
    throw new Error(validationError?.message || 'Failed to create community validation');
  }

  const result = {
    workflowId: workflow.id,
    validationId: createdValidation.id,
    updateId,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: 1,
    recordsChanged: 1,
  });

  return result;
}

export async function generateFundingMatchRecommendations(
  options: FundingOsMatchOptions,
  adminUserId: string | null
) {
  const serviceClient = getServiceClient();
  const minScore = Math.max(0, Math.min(100, options.minScore ?? 65));
  const limit = Math.max(1, Math.min(100, options.limit ?? 30));
  const statuses = (options.statuses?.length ? options.statuses : ['open', 'closing_soon', 'upcoming'])
    .map((status) => String(status).trim())
    .filter(Boolean);
  const opportunityIds = (options.opportunityIds || []).map((id) => String(id).trim()).filter(Boolean);
  const organizationIds = (options.organizationIds || []).map((id) => String(id).trim()).filter(Boolean);

  const workflow = await createWorkflow(serviceClient, 'matching', 'global', adminUserId, {
    minScore,
    limit,
    statuses,
    opportunityIds,
    organizationIds,
  });

  let opportunityQuery = serviceClient
    .from('alma_funding_opportunities')
    .select(
      'id, name, description, funder_name, source_type, status, jurisdictions, focus_areas, keywords, requires_deductible_gift_recipient, requires_abn'
    )
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (statuses.length > 0) {
    opportunityQuery = opportunityQuery.in('status', statuses);
  }

  if (opportunityIds.length > 0) {
    opportunityQuery = opportunityQuery.in('id', opportunityIds);
  }

  const { data: opportunities, error: opportunityError } = await opportunityQuery;
  if (opportunityError) {
    await completeWorkflow(serviceClient, workflow.id, { error: opportunityError.message }, {
      recordsScanned: 0,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(opportunityError.message || 'Failed to load opportunities for matching');
  }

  let profileQuery = serviceClient
    .from('organization_capability_profiles')
    .select(
      'id, organization_id, service_geographies, capability_tags, funding_readiness_score, compliance_readiness_score, delivery_confidence_score, community_trust_score, reporting_to_community_score, can_manage_government_contracts, can_manage_philanthropic_grants, first_nations_led'
    )
    .order('funding_readiness_score', { ascending: false })
    .limit(250);

  if (organizationIds.length > 0) {
    profileQuery = profileQuery.in('organization_id', organizationIds);
  }

  const { data: profiles, error: profileError } = await profileQuery;
  if (profileError) {
    await completeWorkflow(serviceClient, workflow.id, { error: profileError.message }, {
      recordsScanned: 0,
      recordsChanged: 0,
      errorCount: 1,
    });
    throw new Error(profileError.message || 'Failed to load capability profiles');
  }

  const candidateRows: Array<Record<string, unknown>> = [];
  let evaluated = 0;

  for (const opportunity of (opportunities || []) as OpportunityRecord[]) {
    for (const profile of (profiles || []) as CapabilityProfileRecord[]) {
      evaluated += 1;
      const { data: rawScore, error: scoreError } = await serviceClient.rpc(
        'calculate_funding_match_score',
        {
          p_opportunity_id: opportunity.id,
          p_organization_id: profile.organization_id,
        }
      );

      if (scoreError) {
        continue;
      }

      const matchScore = typeof rawScore === 'number' ? rawScore : Number(rawScore || 0);
      if (!Number.isFinite(matchScore) || matchScore < minScore) {
        continue;
      }

      const readinessScore = average([
        profile.funding_readiness_score,
        profile.compliance_readiness_score,
        profile.delivery_confidence_score,
      ]);
      const communityAlignmentScore = average([
        profile.community_trust_score,
        profile.reporting_to_community_score,
        profile.first_nations_led ? 100 : 50,
      ]);
      const outcomeAlignmentScore = calculateOverlapScore(
        opportunity.focus_areas,
        profile.capability_tags
      );
      const geographicFitScore = calculateGeographicFit(opportunity, profile);

      candidateRows.push({
        opportunity_id: opportunity.id,
        organization_id: profile.organization_id,
        capability_profile_id: profile.id,
        generated_by_workflow_id: workflow.id,
        recommendation_status: 'candidate',
        match_score: matchScore,
        readiness_score: readinessScore,
        community_alignment_score: communityAlignmentScore,
        outcome_alignment_score: outcomeAlignmentScore,
        geographic_fit_score: geographicFitScore,
        explainability: buildExplainability(
          opportunity,
          profile,
          matchScore,
          readinessScore,
          communityAlignmentScore,
          outcomeAlignmentScore,
          geographicFitScore
        ),
        last_evaluated_at: new Date().toISOString(),
      });
    }
  }

  if (candidateRows.length > 0) {
    const { error: upsertError } = await serviceClient
      .from('funding_match_recommendations')
      .upsert(candidateRows, { onConflict: 'opportunity_id,organization_id' });

    if (upsertError) {
      await completeWorkflow(serviceClient, workflow.id, { error: upsertError.message }, {
        recordsScanned: evaluated,
        recordsChanged: 0,
        errorCount: 1,
      });
      throw new Error(upsertError.message || 'Failed to persist funding match recommendations');
    }
  }

  const result = {
    workflowId: workflow.id,
    minScore,
    opportunitiesScanned: (opportunities || []).length,
    profilesScanned: (profiles || []).length,
    pairingsEvaluated: evaluated,
    recommendationsUpserted: candidateRows.length,
  };

  await completeWorkflow(serviceClient, workflow.id, result, {
    recordsScanned: evaluated,
    recordsChanged: candidateRows.length,
  });

  return result;
}

export async function runFundingOperatingSystemCycle(
  options: FundingOsCycleOptions,
  triggeredByUserId: string | null
) {
  const normalizedStatuses = (options.statuses || [])
    .map((status) => String(status).trim())
    .filter(Boolean);
  const normalizedOpportunityIds = (options.opportunityIds || [])
    .map((id) => String(id).trim())
    .filter(Boolean);
  const normalizedOrganizationIds = (options.organizationIds || [])
    .map((id) => String(id).trim())
    .filter(Boolean);

  const ingest = await ingestFundingOperatingSystem(
    {
      opportunityIds: normalizedOpportunityIds,
      statuses: normalizedStatuses,
      limit: options.ingestLimit,
    },
    triggeredByUserId
  );

  const matches = await generateFundingMatchRecommendations(
    {
      opportunityIds: normalizedOpportunityIds,
      organizationIds: normalizedOrganizationIds,
      statuses: normalizedStatuses,
      limit: options.matchLimit,
      minScore: options.minScore,
    },
    triggeredByUserId
  );

  const alerts = await listFundingOperatingAlerts();
  const notifications = options.notifyOnAlerts
    ? await queueFundingOperatingAlertNotifications(triggeredByUserId, { alerts })
    : null;

  return {
    ingest,
    matches,
    alerts,
    notifications,
    generatedAt: new Date().toISOString(),
  };
}
