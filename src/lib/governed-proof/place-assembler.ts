import { createHash } from 'crypto';
import {
  empathyLedgerClient,
  canDisplayOnJusticeHub,
  type EmpathyLedgerStory,
} from '@/lib/supabase/empathy-ledger';
import { createServiceClient } from '@/lib/supabase/service';
import { buildJusticeHubPlaceBundleContribution } from './place-bundle';
import { createGovernedProofService } from './service';
import type {
  GovernedProofBundle,
  GovernedProofBundleRecord,
  GovernedProofLifecycleStatus,
  GovernedProofReviewStatus,
} from './contracts';

type JsonObject = Record<string, unknown>;

type SharedOrganization = {
  id: string;
  name: string | null;
  slug: string | null;
  gs_entity_id: string | null;
  empathy_ledger_org_id: string | null;
  postcode: string | null;
};

type GrantScopeCapitalContribution = {
  subjectType: 'place';
  subjectId: string;
  placeKey: string;
  capitalContext: {
    fundingByPostcode: Record<string, unknown> | null;
    fundingSummaries: Record<string, unknown>[];
    entitySamples: Record<string, unknown>[];
  };
  confidence: {
    capital: number;
  };
};

type EmpathyLedgerVoiceContribution = {
  subjectType: 'place';
  subjectId: string;
  placeKey: string;
  voiceContext: {
    linkedOrganizations: Record<string, unknown>[];
    stories: Record<string, unknown>[];
    storytellers: Record<string, unknown>[];
    summary: {
      linkedOrganizationCount: number;
      totalStoryCount: number;
      publishableStoryCount: number;
      storytellerCount: number;
    };
  };
  governanceContext: {
    consentModel: 'public-plus-elder-approved';
    publishability: 'internal' | 'partner' | 'public';
    restrictedStoryCount: number;
    elderApprovalRequiredCount: number;
  };
  confidence: {
    voice: number;
    governance: number;
  };
};

export interface AssemblePlaceGovernedProofBundleResult {
  placeKey: string;
  bundleKey: string;
  taskId?: string;
  bundle?: GovernedProofBundle;
  records: GovernedProofBundleRecord[];
  preview: {
    lifecycleStatus: GovernedProofLifecycleStatus;
    reviewStatus: GovernedProofReviewStatus;
    overallConfidence: number;
    capitalConfidence: number;
    evidenceConfidence: number;
    voiceConfidence: number;
    governanceConfidence: number;
    capitalContext: JsonObject;
    evidenceContext: JsonObject;
    voiceContext: JsonObject;
    governanceContext: JsonObject;
    outputContext: JsonObject;
  };
}

export interface AssemblePlaceGovernedProofBundleOptions {
  placeKey: string;
  actorId?: string;
  persist?: boolean;
}

function normalisePlaceKey(placeKey: string): string {
  const cleaned = placeKey.trim();
  if (!/^\d{4}$/.test(cleaned)) {
    throw new Error('placeKey must be a valid 4-digit postcode');
  }
  return cleaned;
}

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function compactCurrency(value: number | null): string {
  if (value == null) return 'Unknown funding';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000000 ? 1 : 0,
  }).format(value);
}

function compactWhole(value: number | null): string {
  if (value == null) return '0';
  return new Intl.NumberFormat('en-AU', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function humanizeTheme(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function topThemes(stories: Record<string, unknown>[]): string[] {
  const counts = new Map<string, number>();

  for (const story of stories) {
    const themes = Array.isArray(story.themes) ? story.themes : [];
    for (const theme of themes) {
      const key = asString(theme);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([theme]) => humanizeTheme(theme));
}

function buildPlaceProofPack(input: {
  placeKey: string;
  capitalContribution: GrantScopeCapitalContribution;
  evidenceContribution: Awaited<ReturnType<typeof buildJusticeHubPlaceBundleContribution>>;
  voiceContribution: EmpathyLedgerVoiceContribution;
  lifecycleStatus: GovernedProofLifecycleStatus;
  overallConfidence: number;
}): JsonObject {
  const fundingSummary = input.capitalContribution.capitalContext.fundingByPostcode ?? {};
  const totalFunding = asNumber(fundingSummary.total_funding);
  const communityControlledFunding = asNumber(fundingSummary.community_controlled_funding);
  const entityCount =
    asNumber(fundingSummary.entity_count) ??
    input.capitalContribution.capitalContext.entitySamples.length;
  const communityControlledCount = asNumber(fundingSummary.community_controlled_count);
  const relationshipCount = asNumber(fundingSummary.relationship_count);
  const locality = asString(fundingSummary.locality);
  const remoteness = asString(fundingSummary.remoteness);
  const seifaDecile = asNumber(fundingSummary.seifa_irsd_decile);

  const evidenceOrganizations = input.evidenceContribution.evidenceContext.organizations;
  const interventions = input.evidenceContribution.evidenceContext.interventions;
  const stories = input.voiceContribution.voiceContext.stories;
  const storytellers = input.voiceContribution.voiceContext.storytellers;
  const linkedOrganizations = input.voiceContribution.voiceContext.linkedOrganizations;

  const communityControlledShare =
    entityCount && communityControlledCount != null
      ? Number((communityControlledCount / entityCount).toFixed(2))
      : null;
  const topOrganizationNames = evidenceOrganizations
    .map((organization) => asString(organization.name))
    .filter((value): value is string => Boolean(value))
    .slice(0, 4);
  const sampleStoryTitles = stories
    .map((story) => asString(story.title))
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
  const dominantThemes = topThemes(stories);

  const strengths: string[] = [];
  const gaps: string[] = [];

  if ((totalFunding ?? 0) > 0) {
    strengths.push(`${compactCurrency(totalFunding)} traced into postcode ${input.placeKey}`);
  } else {
    gaps.push('No capital summary has been attached to this place yet');
  }

  if (interventions.length > 0) {
    strengths.push(`${interventions.length} JusticeHub interventions are linked to this place`);
  } else {
    gaps.push('No intervention layer is linked yet');
  }

  if (stories.length > 0) {
    strengths.push(`${stories.length} publishable community stories are available for proof`);
  } else {
    gaps.push('No publishable community voice is attached yet');
  }

  if (input.voiceContribution.governanceContext.restrictedStoryCount > 0) {
    gaps.push(
      `${input.voiceContribution.governanceContext.restrictedStoryCount} stories remain restricted by governance settings`
    );
  }

  if (communityControlledShare != null && communityControlledShare < 0.4) {
    gaps.push('Community-controlled entities make up less than 40% of the mapped entity base');
  }

  const readiness =
    stories.length > 0 && interventions.length > 0
      ? 'ready_for_partner_review'
      : stories.length > 0
        ? 'voice_present_needs_evidence'
        : interventions.length > 0
          ? 'evidence_present_needs_voice'
          : 'capital_only';

  return {
    headline:
      locality
        ? `${locality} ${input.placeKey}: ${compactCurrency(totalFunding)} linked to ${compactWhole(entityCount)} entities, ${stories.length} public stories, and ${interventions.length} interventions.`
        : `Postcode ${input.placeKey}: ${compactCurrency(totalFunding)} linked to ${compactWhole(entityCount)} entities, ${stories.length} public stories, and ${interventions.length} interventions.`,
    readiness,
    lifecycleStatus: input.lifecycleStatus,
    overallConfidence: input.overallConfidence,
    capitalStory:
      totalFunding != null
        ? `${compactCurrency(totalFunding)} is visible in the capital layer across ${compactWhole(entityCount)} mapped entities${relationshipCount != null ? ` and ${compactWhole(relationshipCount)} funding relationships` : ''}.`
        : 'Capital context is still thin for this place.',
    evidenceStory:
      evidenceOrganizations.length > 0
        ? `${evidenceOrganizations.length} operating organizations and ${interventions.length} interventions are linked in JusticeHub.`
        : 'No JusticeHub organizations are linked to this place yet.',
    voiceStory:
      stories.length > 0
        ? `${stories.length} publishable stories from ${storytellers.length} storytellers are available under ${input.voiceContribution.governanceContext.publishability} governance.`
        : 'Community voice exists only as restricted or not-yet-publishable material.',
    fundingSnapshot: {
      locality,
      remoteness,
      seifaDecile,
      totalFunding,
      communityControlledFunding,
      entityCount,
      communityControlledCount,
      communityControlledShare,
      relationshipCount,
    },
    evidenceSnapshot: {
      organizationCount: evidenceOrganizations.length,
      interventionCount: interventions.length,
      topOrganizationNames,
    },
    voiceSnapshot: {
      linkedOrganizationCount: linkedOrganizations.length,
      publishableStoryCount: stories.length,
      storytellerCount: storytellers.length,
      dominantThemes,
      sampleStoryTitles,
    },
    strengths,
    gaps,
  };
}

function deriveLifecycleStatus(input: {
  capital: number;
  evidence: number;
  voice: number;
  governance: number;
}): GovernedProofLifecycleStatus {
  const activeLayers = [input.capital, input.evidence, input.voice, input.governance].filter(
    (value) => value >= 0.6
  ).length;

  if (activeLayers >= 4 && input.voice >= 0.8 && input.governance >= 0.8) return 'validated';
  if (activeLayers >= 3) return 'linked';
  if (activeLayers >= 2) return 'enriched';
  return 'resolved';
}

async function loadGrantScopeCapitalContribution(
  placeKey: string
): Promise<GrantScopeCapitalContribution> {
  const supabase = createServiceClient() as any;

  const [{ data: fundingSummaries, error: fundingError }, { data: entitySamples, error: entitiesError }] =
    await Promise.all([
      supabase
        .from('mv_funding_by_postcode')
        .select('*')
        .eq('postcode', placeKey)
        .order('total_funding', { ascending: false })
        .limit(25),
      supabase
        .from('gs_entities')
        .select(
          'id, canonical_name, entity_type, abn, postcode, lga_name, remoteness, seifa_irsd_decile, is_community_controlled'
        )
        .eq('postcode', placeKey)
        .limit(25),
    ]);

  if (fundingError) throw fundingError;
  if (entitiesError) throw entitiesError;

  return {
    subjectType: 'place',
    subjectId: placeKey,
    placeKey,
    capitalContext: {
      fundingByPostcode: fundingSummaries?.[0] ?? null,
      fundingSummaries: fundingSummaries ?? [],
      entitySamples: entitySamples ?? [],
    },
    confidence: {
      capital:
        fundingSummaries && fundingSummaries.length > 0
          ? 0.9
          : entitySamples && entitySamples.length > 0
            ? 0.7
            : 0.45,
    },
  };
}

async function loadSharedOrganizationsForPlace(placeKey: string): Promise<SharedOrganization[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, gs_entity_id, empathy_ledger_org_id, postcode')
    .eq('postcode', placeKey)
    .limit(50);

  if (error) throw error;
  return (data ?? []) as SharedOrganization[];
}

function mergeOrganizations(
  directOrganizations: SharedOrganization[],
  evidenceOrganizations: Record<string, unknown>[]
): SharedOrganization[] {
  const merged = new Map<string, SharedOrganization>();

  for (const organization of directOrganizations) {
    merged.set(organization.id, organization);
  }

  for (const organization of evidenceOrganizations) {
    const id = typeof organization.id === 'string' ? organization.id : null;
    if (!id) continue;
    merged.set(id, {
      id,
      name: typeof organization.name === 'string' ? organization.name : null,
      slug: typeof organization.slug === 'string' ? organization.slug : null,
      gs_entity_id:
        typeof organization.gs_entity_id === 'string' ? organization.gs_entity_id : null,
      empathy_ledger_org_id:
        typeof organization.empathy_ledger_org_id === 'string'
          ? organization.empathy_ledger_org_id
          : null,
      postcode: typeof organization.postcode === 'string' ? organization.postcode : null,
    });
  }

  return Array.from(merged.values());
}

async function loadEmpathyLedgerVoiceContribution(
  placeKey: string,
  organizations: SharedOrganization[]
): Promise<EmpathyLedgerVoiceContribution> {
  const linkedOrganizations = organizations.filter((organization) => organization.empathy_ledger_org_id);
  const elOrgIds = linkedOrganizations
    .map((organization) => organization.empathy_ledger_org_id)
    .filter((value): value is string => Boolean(value));

  if (elOrgIds.length === 0) {
    return {
      subjectType: 'place',
      subjectId: placeKey,
      placeKey,
      voiceContext: {
        linkedOrganizations: [],
        stories: [],
        storytellers: [],
        summary: {
          linkedOrganizationCount: 0,
          totalStoryCount: 0,
          publishableStoryCount: 0,
          storytellerCount: 0,
        },
      },
      governanceContext: {
        consentModel: 'public-plus-elder-approved',
        publishability: 'internal',
        restrictedStoryCount: 0,
        elderApprovalRequiredCount: 0,
      },
      confidence: {
        voice: 0.25,
        governance: 0.4,
      },
    };
  }

  const safeOrgIds = elOrgIds.length > 0 ? elOrgIds : ['00000000-0000-0000-0000-000000000000'];

  const [{ data: elOrganizations, error: organizationsError }, { data: stories, error: storiesError }] =
    await Promise.all([
      empathyLedgerClient
        .from('organizations')
        .select('id, name, slug, location, traditional_country, indigenous_controlled')
        .in('id', safeOrgIds),
      empathyLedgerClient
        .from('stories')
        .select(
          'id, title, summary, story_type, organization_id, storyteller_id, privacy_level, is_public, requires_elder_approval, elder_approved_at, cultural_sensitivity_level, published_at, created_at, themes, location_text'
        )
        .in('organization_id', safeOrgIds)
        .order('published_at', { ascending: false })
        .limit(100),
    ]);

  if (organizationsError) throw organizationsError;
  if (storiesError) throw storiesError;

  const storyRows = ((stories ?? []) as EmpathyLedgerStory[]).map((story) => ({
    ...story,
    publishable: canDisplayOnJusticeHub(story),
  }));
  const publishableStories = storyRows.filter((story) => story.publishable);
  const storytellerIds = Array.from(
    new Set(
      publishableStories
        .map((story) => story.storyteller_id)
        .filter((storytellerId): storytellerId is string => Boolean(storytellerId))
    )
  );

  let storytellers: Record<string, unknown>[] = [];
  if (storytellerIds.length > 0) {
    const { data, error } = await empathyLedgerClient
      .from('storytellers')
      .select('id, display_name, bio, is_elder, location, public_avatar_url')
      .in('id', storytellerIds);

    if (error) throw error;
    storytellers = (data ?? []) as Record<string, unknown>[];
  }

  const elderApprovalRequiredCount = storyRows.filter((story) => story.requires_elder_approval).length;
  const restrictedStoryCount = storyRows.length - publishableStories.length;
  const publishability =
    publishableStories.length > 0 ? 'partner' : linkedOrganizations.length > 0 ? 'internal' : 'internal';

  return {
    subjectType: 'place',
    subjectId: placeKey,
    placeKey,
    voiceContext: {
      linkedOrganizations: (elOrganizations ?? []) as Record<string, unknown>[],
      stories: publishableStories.map((story) => ({
        id: story.id,
        title: story.title,
        summary: story.summary,
        story_type: story.story_type,
        organization_id: story.organization_id,
        storyteller_id: story.storyteller_id,
        published_at: story.published_at,
        created_at: story.created_at,
        cultural_sensitivity_level: story.cultural_sensitivity_level,
        themes: story.themes ?? [],
        location_text: story.location_text ?? null,
      })),
      storytellers,
      summary: {
        linkedOrganizationCount: linkedOrganizations.length,
        totalStoryCount: storyRows.length,
        publishableStoryCount: publishableStories.length,
        storytellerCount: storytellers.length,
      },
    },
    governanceContext: {
      consentModel: 'public-plus-elder-approved',
      publishability,
      restrictedStoryCount,
      elderApprovalRequiredCount,
    },
    confidence: {
      voice:
        publishableStories.length > 0
          ? 0.88
          : linkedOrganizations.length > 0
            ? 0.55
            : 0.25,
      governance: storyRows.length > 0 ? 0.9 : linkedOrganizations.length > 0 ? 0.65 : 0.4,
    },
  };
}

function buildBundleRecords(input: {
  bundleId: string;
  placeKey: string;
  capitalContribution: GrantScopeCapitalContribution;
  evidenceContribution: Awaited<ReturnType<typeof buildJusticeHubPlaceBundleContribution>>;
  voiceContribution: EmpathyLedgerVoiceContribution;
}): Omit<GovernedProofBundleRecord, 'id' | 'createdAt'>[] {
  const records: Omit<GovernedProofBundleRecord, 'id' | 'createdAt'>[] = [];

  if (input.capitalContribution.capitalContext.fundingByPostcode) {
    records.push({
      bundleId: input.bundleId,
      recordSystem: 'GS',
      recordType: 'place_funding_summary',
      recordId: `postcode:${input.placeKey}`,
      linkRole: 'capital_summary',
      confidenceScore: input.capitalContribution.confidence.capital,
      provenancePayload: {
        source: 'mv_funding_by_postcode',
        postcode: input.placeKey,
      },
    });
  }

  for (const entity of input.capitalContribution.capitalContext.entitySamples) {
    const entityId = typeof entity.id === 'string' ? entity.id : null;
    if (!entityId) continue;
    records.push({
      bundleId: input.bundleId,
      recordSystem: 'GS',
      recordType: 'entity',
      recordId: entityId,
      linkRole: 'place_entity',
      confidenceScore: input.capitalContribution.confidence.capital,
      provenancePayload: {
        source: 'gs_entities',
        postcode: input.placeKey,
      },
    });
  }

  for (const organization of input.evidenceContribution.evidenceContext.organizations) {
    const organizationId = typeof organization.id === 'string' ? organization.id : null;
    if (!organizationId) continue;
    records.push({
      bundleId: input.bundleId,
      recordSystem: 'JH',
      recordType: 'organization',
      recordId: organizationId,
      linkRole: 'operating_organization',
      confidenceScore: input.evidenceContribution.confidence.evidence,
      provenancePayload: {
        source: 'organizations',
        postcode: input.placeKey,
      },
    });
  }

  for (const intervention of input.evidenceContribution.evidenceContext.interventions) {
    const interventionId = typeof intervention.id === 'string' ? intervention.id : null;
    if (!interventionId) continue;
    records.push({
      bundleId: input.bundleId,
      recordSystem: 'JH',
      recordType: 'intervention',
      recordId: interventionId,
      linkRole: 'place_intervention',
      confidenceScore: input.evidenceContribution.confidence.evidence,
      provenancePayload: {
        source: 'alma_interventions',
        postcode: input.placeKey,
      },
    });
  }

  for (const organization of input.voiceContribution.voiceContext.linkedOrganizations) {
    const organizationId = typeof organization.id === 'string' ? organization.id : null;
    if (!organizationId) continue;
    records.push({
      bundleId: input.bundleId,
      recordSystem: 'EL',
      recordType: 'organization',
      recordId: organizationId,
      linkRole: 'voice_organization',
      confidenceScore: input.voiceContribution.confidence.voice,
      provenancePayload: {
        source: 'organizations',
        postcode: input.placeKey,
      },
    });
  }

  for (const story of input.voiceContribution.voiceContext.stories) {
    const storyId = typeof story.id === 'string' ? story.id : null;
    if (!storyId) continue;
    records.push({
      bundleId: input.bundleId,
      recordSystem: 'EL',
      recordType: 'story',
      recordId: storyId,
      linkRole: 'voice_story',
      confidenceScore: input.voiceContribution.confidence.voice,
      provenancePayload: {
        source: 'stories',
        postcode: input.placeKey,
      },
    });
  }

  for (const storyteller of input.voiceContribution.voiceContext.storytellers) {
    const storytellerId = typeof storyteller.id === 'string' ? storyteller.id : null;
    if (!storytellerId) continue;
    records.push({
      bundleId: input.bundleId,
      recordSystem: 'EL',
      recordType: 'storyteller',
      recordId: storytellerId,
      linkRole: 'voice_storyteller',
      confidenceScore: input.voiceContribution.confidence.voice,
      provenancePayload: {
        source: 'storytellers',
        postcode: input.placeKey,
      },
    });
  }

  return records;
}

export async function assemblePlaceGovernedProofBundle(
  options: AssemblePlaceGovernedProofBundleOptions
): Promise<AssemblePlaceGovernedProofBundleResult> {
  const placeKey = normalisePlaceKey(options.placeKey);
  const persist = options.persist ?? true;
  const bundleKey = `place:${placeKey}`;
  const governedProofService = createGovernedProofService();

  let taskId: string | undefined;

  if (persist) {
    const task = await governedProofService.createTask({
      taskType: 'assemble_proof',
      queueLane: 'core',
      priority: 'high',
      ownerSystem: 'SHARED',
      systemScope: ['GS', 'JH', 'EL'],
      targetType: 'place',
      targetId: placeKey,
      valueScore: 85,
      confidenceRequired: 0.8,
      inputPayload: { bundleKey, placeKey },
      acceptanceChecks: [
        'capital_context_present',
        'evidence_context_present',
        'voice_context_governed',
      ],
      reviewStatus: 'not_required',
      promotionStatus: 'internal',
    });
    taskId = task.id;
  }

  try {
    const [capitalContribution, directOrganizations, evidenceContribution] = await Promise.all([
      loadGrantScopeCapitalContribution(placeKey),
      loadSharedOrganizationsForPlace(placeKey),
      buildJusticeHubPlaceBundleContribution(placeKey),
    ]);

    const voiceContribution = await loadEmpathyLedgerVoiceContribution(
      placeKey,
      mergeOrganizations(directOrganizations, evidenceContribution.evidenceContext.organizations)
    );

    const capitalConfidence = capitalContribution.confidence.capital;
    const evidenceConfidence = evidenceContribution.confidence.evidence;
    const voiceConfidence = voiceContribution.confidence.voice;
    const governanceConfidence = voiceContribution.confidence.governance;
    const overallConfidence = average([
      capitalConfidence,
      evidenceConfidence,
      voiceConfidence,
      governanceConfidence,
    ]);
    const lifecycleStatus = deriveLifecycleStatus({
      capital: capitalConfidence,
      evidence: evidenceConfidence,
      voice: voiceConfidence,
      governance: governanceConfidence,
    });
    const reviewStatus: GovernedProofReviewStatus =
      voiceContribution.governanceContext.restrictedStoryCount > 0 ? 'pending' : 'not_required';
    const freshnessAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const lastValidatedAt = new Date().toISOString();
    const outputContext = {
      summary: {
        placeKey,
        entityCount: capitalContribution.capitalContext.entitySamples.length,
        organizationCount: evidenceContribution.evidenceContext.organizations.length,
        interventionCount: evidenceContribution.evidenceContext.interventions.length,
        linkedVoiceOrganizationCount: voiceContribution.voiceContext.summary.linkedOrganizationCount,
        publishableStoryCount: voiceContribution.voiceContext.summary.publishableStoryCount,
        storytellerCount: voiceContribution.voiceContext.summary.storytellerCount,
      },
      proofPack: buildPlaceProofPack({
        placeKey,
        capitalContribution,
        evidenceContribution,
        voiceContribution,
        lifecycleStatus,
        overallConfidence,
      }),
      generatedBy: 'JusticeHub.place-assembler',
      generatedAt: lastValidatedAt,
    };

    const preview = {
      lifecycleStatus,
      reviewStatus,
      overallConfidence,
      capitalConfidence,
      evidenceConfidence,
      voiceConfidence,
      governanceConfidence,
      capitalContext: capitalContribution.capitalContext,
      evidenceContext: evidenceContribution.evidenceContext,
      voiceContext: voiceContribution.voiceContext,
      governanceContext: voiceContribution.governanceContext,
      outputContext,
    };

    if (!persist) {
      return {
        placeKey,
        bundleKey,
        records: [],
        preview,
      };
    }

    const bundle = await governedProofService.upsertBundle({
      bundleKey,
      subjectType: 'place',
      subjectId: placeKey,
      ownerSystem: 'SHARED',
      lifecycleStatus,
      reviewStatus,
      promotionStatus: 'internal',
      overallConfidence,
      capitalConfidence,
      evidenceConfidence,
      voiceConfidence,
      governanceConfidence,
      capitalContext: capitalContribution.capitalContext,
      evidenceContext: evidenceContribution.evidenceContext,
      voiceContext: voiceContribution.voiceContext,
      governanceContext: voiceContribution.governanceContext,
      outputContext,
      freshnessAt,
      lastValidatedAt,
    });

    const records = await governedProofService.attachBundleRecords(
      buildBundleRecords({
        bundleId: bundle.id,
        placeKey,
        capitalContribution,
        evidenceContribution,
        voiceContribution,
      })
    );

    if (taskId) {
      await governedProofService.logRun({
        taskId,
        agentRole: 'governed_proof_assembler',
        provider: 'justicehub',
        model: 'deterministic-sql',
        strategyVersion: 'place-bundle-v1',
        inputHash: sha256({ placeKey, bundleKey }),
        outputHash: sha256({
          bundleId: bundle.id,
          overallConfidence,
          recordCount: records.length,
          outputContext,
        }),
        resultStatus: 'success',
        evalScore: overallConfidence,
        confidenceDelta: overallConfidence,
        notes: `Assembled governed proof bundle for postcode ${placeKey}`,
        runPayload: {
          placeKey,
          bundleKey,
          actorId: options.actorId ?? null,
          recordCount: records.length,
        },
      });
      await governedProofService.completeTask({
        taskId,
        reviewStatus,
        promotionStatus: 'internal',
      });
    }

    return {
      placeKey,
      bundleKey,
      taskId,
      bundle,
      records,
      preview,
    };
  } catch (error) {
    if (taskId) {
      await governedProofService.failTask(
        taskId,
        error instanceof Error ? error.message : 'Unknown place bundle assembly error'
      );
    }
    throw error;
  }
}
