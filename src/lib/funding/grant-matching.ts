import { evaluateGrantMatch, MATCH_THRESHOLDS } from '@/lib/funding/match-evaluator';

const KEYWORDS = [
  'youth',
  'justice',
  'community',
  'grassroots',
  'indigenous',
  'aboriginal',
  'torres strait',
  'first nations',
  'diversion',
  'mentoring',
  'employment',
  'education',
  'housing',
  'family',
  'healing',
  'culture',
  'mental health',
];

const STATE_CODES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
export const GRANT_MATCH_REVIEW_SOURCE = 'funding_match_review';
export const GRANT_MATCH_REVIEW_TASK_TYPE = 'funding_match_human_review';

export type OrgRecord = {
  id?: string;
  name?: string | null;
  type?: string | null;
  location?: string | null;
  state?: string | null;
  description?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
};

export type FundingOpportunity = {
  id: string;
  name: string;
  description?: string | null;
  eligibility_criteria?: unknown;
  keywords?: string[] | null;
  funder_name?: string | null;
  source_type?: string | null;
  status?: string | null;
  jurisdictions?: string[] | null;
  is_national?: boolean | null;
  focus_areas?: string[] | null;
  eligible_org_types?: string[] | null;
  min_grant_amount?: number | null;
  max_grant_amount?: number | null;
  deadline?: string | null;
  relevance_score?: number | null;
};

export type ScoredGrantMatch = {
  opportunity: FundingOpportunity;
  score: number;
  reasons: string[];
  daysToDeadline: number | null;
  confidence: number;
  needsHumanReview: boolean;
  notifyEligible: boolean;
  hasEligibilityRisk: boolean;
};

export function normalize(value: string | null | undefined): string {
  return (value || '').toLowerCase().trim();
}

export function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function parseStateTokens(org: OrgRecord): string[] {
  const rawState = `${org.state || ''} ${org.location || ''} ${org.description || ''}`.toUpperCase();
  const hits = STATE_CODES.filter((code) => rawState.includes(code));
  const metadataJurisdictions = Array.isArray(org.metadata?.jurisdictions)
    ? (org.metadata?.jurisdictions as string[]).map((s) => s.toUpperCase())
    : [];
  return uniq([...hits, ...metadataJurisdictions]);
}

function parseOrgFocus(org: OrgRecord): string[] {
  const tags = Array.isArray(org.tags) ? org.tags : [];
  const metadataFocus = Array.isArray(org.metadata?.focus_areas)
    ? (org.metadata?.focus_areas as string[])
    : [];
  const orgText = normalize(`${org.description || ''} ${tags.join(' ')} ${metadataFocus.join(' ')}`);
  const keywordHits = KEYWORDS.filter((kw) => orgText.includes(kw));
  return uniq([...tags.map(normalize), ...metadataFocus.map(normalize), ...keywordHits]);
}

export function formatAmountRange(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return 'Amount not specified';
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return `From $${(min || 0).toLocaleString()}`;
}

export function scoreOpportunity(org: OrgRecord, opp: FundingOpportunity): ScoredGrantMatch | null {
  const reasons: string[] = [];
  let score = 0;
  let hasEligibilityRisk = false;

  const orgFocus = parseOrgFocus(org);
  const orgStates = parseStateTokens(org);
  const orgType = normalize(org.type);

  const oppText = normalize(
    `${opp.name || ''} ${opp.description || ''} ${JSON.stringify(opp.eligibility_criteria || {})} ${(opp.keywords || []).join(' ')}`
  );
  const oppJurisdictions = (opp.jurisdictions || []).map((j) => j.toUpperCase());
  const oppFocus = uniq([...(opp.focus_areas || []), ...((opp.keywords || []) as string[])].map(normalize));
  const hasNationalCoverage =
    Boolean(opp.is_national) || oppJurisdictions.includes('NATIONAL') || oppJurisdictions.length === 0;

  if (hasNationalCoverage) {
    score += 20;
    reasons.push('National or broad jurisdiction coverage');
  } else {
    const overlap = oppJurisdictions.filter((j) => orgStates.includes(j));
    if (overlap.length > 0) {
      score += 30;
      reasons.push(`Jurisdiction fit: ${overlap.join(', ')}`);
    } else {
      score -= 15;
      reasons.push('Jurisdiction mismatch risk');
    }
  }

  const focusOverlap = oppFocus.filter((f) => orgFocus.includes(f));
  if (focusOverlap.length > 0) {
    score += Math.min(36, focusOverlap.length * 12);
    reasons.push(`Focus overlap: ${focusOverlap.slice(0, 3).join(', ')}`);
  }

  const keywordOverlap = KEYWORDS.filter((kw) => oppText.includes(kw) && orgFocus.includes(kw));
  if (keywordOverlap.length > 0) {
    score += Math.min(20, keywordOverlap.length * 4);
    reasons.push(`Keyword overlap: ${keywordOverlap.slice(0, 4).join(', ')}`);
  }

  const eligibleTypes = (opp.eligible_org_types || []).map(normalize).filter(Boolean);
  if (eligibleTypes.length === 0) {
    score += 8;
    reasons.push('No strict org-type eligibility listed');
  } else {
    const orgTypeMatch = eligibleTypes.some((t) => orgType.includes(t) || t.includes(orgType));
    if (orgTypeMatch) {
      score += 18;
      reasons.push('Organization type appears eligible');
    } else if (orgType) {
      score -= 20;
      hasEligibilityRisk = true;
      reasons.push(`Check eligibility for org type: ${org.type}`);
    }
  }

  if (typeof opp.relevance_score === 'number') {
    score += Math.min(10, Math.max(0, opp.relevance_score / 10));
  }

  let daysToDeadline: number | null = null;
  if (opp.deadline) {
    daysToDeadline = Math.ceil(
      (new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysToDeadline < 0) return null;
    if (daysToDeadline <= 7) {
      score += 10;
      reasons.push(`Urgent: closes in ${daysToDeadline} days`);
    } else if (daysToDeadline <= 21) {
      score += 6;
      reasons.push(`Closes in ${daysToDeadline} days`);
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  if (finalScore < MATCH_THRESHOLDS.minScore) return null;

  const evaluation = evaluateGrantMatch({
    score: finalScore,
    reasons,
    hasEligibilityRisk,
    daysToDeadline,
  });

  return {
    opportunity: opp,
    score: finalScore,
    reasons: uniq(reasons),
    daysToDeadline,
    confidence: evaluation.confidence,
    needsHumanReview: evaluation.needsHumanReview,
    notifyEligible: evaluation.notifyEligible,
    hasEligibilityRisk,
  };
}

export function computeGrantMatchesForOrg(
  org: OrgRecord,
  opportunities: FundingOpportunity[],
  appliedIds: Set<string> = new Set(),
  maxResults = 10
): ScoredGrantMatch[] {
  return opportunities
    .filter((opp) => !appliedIds.has(opp.id))
    .map((opp) => scoreOpportunity(org, opp))
    .filter((m): m is ScoredGrantMatch => Boolean(m))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

export async function createGrantActionItems(
  serviceClient: any,
  orgId: string,
  matches: ScoredGrantMatch[]
) {
  const actionItems = matches.slice(0, 5).map((match) => ({
    organization_id: orgId,
    item_type: 'grant',
    title: `Grant opportunity: ${match.opportunity.name}`,
    description:
      `Match score: ${match.score}%. Confidence: ${Math.round(match.confidence * 100)}%. ` +
      `Reasons: ${match.reasons.join(', ')}. ` +
      `Amount: ${formatAmountRange(match.opportunity.min_grant_amount, match.opportunity.max_grant_amount)}. ` +
      `Closes: ${match.opportunity.deadline || 'TBC'}.`,
    priority:
      match.score >= 75 || (match.daysToDeadline !== null && match.daysToDeadline <= 7)
        ? 'high'
        : 'medium',
    due_date: match.opportunity.deadline || null,
    source_agent: 'grant_match',
    link_to_table: 'alma_funding_opportunities',
    link_to_id: match.opportunity.id,
  }));

  await serviceClient
    .from('org_action_items')
    .delete()
    .eq('organization_id', orgId)
    .eq('source_agent', 'grant_match')
    .in('status', ['open']);

  if (actionItems.length > 0) {
    await serviceClient.from('org_action_items').insert(actionItems);
  }
}

export async function upsertNotionWorkerQueue(
  serviceClient: any,
  orgId: string,
  matches: ScoredGrantMatch[]
) {
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const match of matches) {
    const now = new Date().toISOString();
    const payload = {
      name: match.opportunity.name,
      amount: match.opportunity.max_grant_amount ?? match.opportunity.min_grant_amount ?? null,
      close_date: match.opportunity.deadline ?? null,
      stage: 'Matched',
      type: match.opportunity.source_type || 'grant',
      last_synced: now,
      data: {
        source: 'org_grant_match_agent',
        opportunity: match.opportunity,
        score: match.score,
        confidence: match.confidence,
        notify_eligible: match.notifyEligible,
        needs_human_review: match.needsHumanReview,
        reasons: match.reasons,
      },
      metadata: {
        organization_id: orgId,
        opportunity_id: match.opportunity.id,
        score: match.score,
        confidence: match.confidence,
        notify_eligible: match.notifyEligible,
        needs_human_review: match.needsHumanReview,
        reasons: match.reasons,
        synced_at: now,
      },
    };

    const { data: existing, error: existingError } = await serviceClient
      .from('notion_opportunities')
      .select('id, sync_version')
      .contains('metadata', {
        organization_id: orgId,
        opportunity_id: match.opportunity.id,
      })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      const { error } = await serviceClient.from('notion_opportunities').insert(payload);
      if (error) {
        errors += 1;
      } else {
        inserted += 1;
      }
      continue;
    }

    if (existing?.id) {
      const { error } = await serviceClient
        .from('notion_opportunities')
        .update({
          ...payload,
          sync_version: (existing.sync_version || 0) + 1,
          updated_at: now,
        })
        .eq('id', existing.id);
      if (error) {
        errors += 1;
      } else {
        updated += 1;
      }
      continue;
    }

    const { error } = await serviceClient.from('notion_opportunities').insert(payload);
    if (error) {
      errors += 1;
    } else {
      inserted += 1;
    }
  }

  return { inserted, updated, errors };
}

export async function queueGrantMatchReviewTasks(params: {
  serviceClient: any;
  organizationId: string;
  organizationName?: string | null;
  matches: ScoredGrantMatch[];
  requestedBy?: string | null;
}) {
  const { serviceClient, organizationId, organizationName, matches, requestedBy = null } = params;
  const reviewMatches = matches.filter((m) => m.needsHumanReview);
  if (reviewMatches.length === 0) {
    return {
      queued: 0,
      skippedExisting: 0,
      candidates: 0,
    };
  }

  const sourceIds = reviewMatches.map((m) => `${organizationId}:${m.opportunity.id}`);
  const { data: existingItems } = await serviceClient
    .from('agent_task_queue')
    .select('source_id')
    .eq('source', GRANT_MATCH_REVIEW_SOURCE)
    .in('source_id', sourceIds)
    .is('review_decision', null);

  const existingSourceIds = new Set(
    (existingItems || [])
      .map((item: any) => item.source_id)
      .filter((value: unknown): value is string => typeof value === 'string')
  );

  const now = new Date().toISOString();
  const tasks = reviewMatches
    .filter((match) => !existingSourceIds.has(`${organizationId}:${match.opportunity.id}`))
    .map((match) => ({
      id: crypto.randomUUID(),
      source: GRANT_MATCH_REVIEW_SOURCE,
      source_id: `${organizationId}:${match.opportunity.id}`,
      task_type: GRANT_MATCH_REVIEW_TASK_TYPE,
      title: `Human review required: ${match.opportunity.name}`,
      description:
        `Review eligibility and fit before notifications. ` +
        `Score ${match.score}, confidence ${Math.round(match.confidence * 100)}%.`,
      status: 'queued',
      priority: 1,
      needs_review: true,
      requested_by: requestedBy,
      reply_to: {
        organization_id: organizationId,
        organization_name: organizationName || null,
        opportunity_id: match.opportunity.id,
        opportunity_name: match.opportunity.name,
        funder_name: match.opportunity.funder_name || null,
        score: match.score,
        confidence: match.confidence,
        reasons: match.reasons,
        notify_eligible: match.notifyEligible,
        has_eligibility_risk: match.hasEligibilityRisk,
        days_to_deadline: match.daysToDeadline,
        created_at: now,
      },
    }));

  if (tasks.length > 0) {
    const { error } = await serviceClient.from('agent_task_queue').insert(tasks);
    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    queued: tasks.length,
    skippedExisting: reviewMatches.length - tasks.length,
    candidates: reviewMatches.length,
  };
}

export async function runGrantMatchingForOrganization(params: {
  userClient: any;
  serviceClient: any;
  organizationId: string;
  queueNotionWorkers?: boolean;
  queueReviewTasks?: boolean;
  requestedBy?: string | null;
}) {
  const {
    userClient,
    serviceClient,
    organizationId,
    queueNotionWorkers = false,
    queueReviewTasks = true,
    requestedBy = null,
  } = params;

  const { data: org } = await userClient
    .from('organizations')
    .select('id, name, type, location, description, tags, state, metadata')
    .eq('id', organizationId)
    .single();

  if (!org) {
    throw new Error('Organization not found');
  }

  const { data: opportunities } = await userClient
    .from('alma_funding_opportunities')
    .select(
      'id, name, description, eligibility_criteria, keywords, funder_name, source_type, status, jurisdictions, is_national, focus_areas, eligible_org_types, min_grant_amount, max_grant_amount, deadline, relevance_score'
    )
    .in('status', ['open', 'closing_soon']);

  if (!opportunities || opportunities.length === 0) {
    return {
      success: true,
      matches: [],
      message: 'No open funding opportunities found',
      notionWorkerQueue: null,
    };
  }

  const { data: existingApps } = await userClient
    .from('alma_funding_applications')
    .select('opportunity_id')
    .eq('organization_id', organizationId);

  const appliedIds = new Set<string>(
    (existingApps || [])
      .map((a: any) => a.opportunity_id)
      .filter((id: unknown): id is string => typeof id === 'string')
  );
  const matches = computeGrantMatchesForOrg(org, opportunities as FundingOpportunity[], appliedIds, 10);

  await createGrantActionItems(serviceClient, organizationId, matches);

  let notionWorkerQueue = null;
  if (queueNotionWorkers && matches.length > 0) {
    notionWorkerQueue = await upsertNotionWorkerQueue(serviceClient, organizationId, matches.slice(0, 5));
  }

  let reviewQueue = null;
  if (queueReviewTasks && matches.length > 0) {
    reviewQueue = await queueGrantMatchReviewTasks({
      serviceClient,
      organizationId,
      organizationName: org.name,
      matches,
      requestedBy,
    });
  }

  return {
    success: true,
    matches,
    notionWorkerQueue,
    reviewQueue,
  };
}
