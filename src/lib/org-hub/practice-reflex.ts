import { createServiceClient } from '@/lib/supabase/service-lite';

export const PRACTICE_REFLEX_SOURCE = 'practice_reflex';

export type PracticeReflexLaneKey =
  | 'identity'
  | 'programs'
  | 'people'
  | 'proof'
  | 'referrals'
  | 'practice_learning'
  | 'funding'
  | 'compliance'
  | 'outcomes';

export type PracticeReflexStatus = 'ready' | 'open' | 'needs_work';
export type PracticeReflexRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface PracticeReflexNextAction {
  label: string;
  href: string;
  dueDate?: string | null;
}

export interface PracticeReflexLane {
  key: PracticeReflexLaneKey;
  label: string;
  status: PracticeReflexStatus;
  count: number;
  summary: string;
  nextAction: PracticeReflexNextAction;
  riskLevel: PracticeReflexRiskLevel;
}

export interface PracticeReflexAction {
  id?: string;
  lane: PracticeReflexLaneKey | 'general';
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  dueDate: string | null;
  sourceAgent: string | null;
  href: string | null;
  createdAt?: string | null;
}

export interface PracticeReflexOrganization {
  id: string;
  name: string;
  slug: string;
  abn: string | null;
  description: string | null;
  plan: string | null;
  type: string | null;
  partnerTier: string | null;
  trialEndsAt: string | null;
  billingStatus: string | null;
}

export interface PracticeReflexSummary {
  essentialStepsReady: number;
  essentialStepsTotal: number;
  needsWork: number;
  openActions: number;
  dueSoon: number;
  proofStrength: number;
  fundingReadiness: number;
}

export interface PracticeReflexState {
  organization: PracticeReflexOrganization;
  lanes: PracticeReflexLane[];
  actions: PracticeReflexAction[];
  suggestedActions: PracticeReflexAction[];
  summary: PracticeReflexSummary;
  counts: PracticeReflexCounts;
}

export interface PracticeReflexCounts {
  programs: number;
  people: number;
  proof: number;
  referralsTotal: number;
  referralsPending: number;
  sessionsTotal: number;
  recentSessions: number;
  milestones: number;
  grants: number;
  budgetIssues: number;
  deadlinesActive: number;
  deadlinesDueSoon: number;
  deadlinesOverdue: number;
  complianceDocs: number;
  complianceExpiring: number;
  complianceExpired: number;
  actionItemsOpen: number;
  fundingProfileCount: number;
  fundingReadinessScore: number;
  deliveryConfidenceScore: number;
  evidenceMaturityScore: number;
  activeAwards: number;
  outcomeCommitments: number;
  outcomeUpdates: number;
  communityValidations: number;
}

export interface PracticeReflexBuildInput {
  organization: PracticeReflexOrganization;
  counts: PracticeReflexCounts;
  actions?: PracticeReflexAction[];
  nearestDueDate?: string | null;
}

type ActionRow = {
  item_type: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  due_date: string | null;
  source_agent: string | null;
  link_to_table: string | null;
  link_to_id: string | null;
};

const RISK_PRIORITY: Record<PracticeReflexRiskLevel, PracticeReflexAction['priority']> = {
  none: 'low',
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
};

const ACTION_TYPES: Record<PracticeReflexLaneKey, string> = {
  identity: 'general',
  programs: 'general',
  people: 'general',
  proof: 'general',
  referrals: 'referral',
  practice_learning: 'session',
  funding: 'grant',
  compliance: 'compliance',
  outcomes: 'reporting',
};

function lane(
  key: PracticeReflexLaneKey,
  label: string,
  status: PracticeReflexStatus,
  count: number,
  summary: string,
  nextAction: PracticeReflexNextAction,
  riskLevel: PracticeReflexRiskLevel
): PracticeReflexLane {
  return { key, label, status, count, summary, nextAction, riskLevel };
}

function percentFromSignals(...values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

export function buildPracticeReflexState(input: PracticeReflexBuildInput): PracticeReflexState {
  const { organization: org, counts } = input;
  const orgHref = `/hub/${org.slug}`;
  const hasIdentity = Boolean(org.abn && org.description);
  const proofStrength = percentFromSignals(
    counts.proof > 0 ? 70 : 0,
    counts.evidenceMaturityScore,
    counts.outcomeUpdates > 0 ? 80 : 0,
    counts.communityValidations > 0 ? 90 : 0
  );

  const lanes: PracticeReflexLane[] = [
    lane(
      'identity',
      'Identity',
      hasIdentity ? 'ready' : org.abn || org.description ? 'open' : 'needs_work',
      Number(Boolean(org.abn)) + Number(Boolean(org.description)),
      hasIdentity
        ? 'ABN and public summary are in place.'
        : 'Confirm the ABN and plain-language public summary before sharing the profile widely.',
      { label: 'Review identity', href: `${orgHref}/profile` },
      hasIdentity ? 'none' : org.abn ? 'medium' : 'high'
    ),
    lane(
      'programs',
      'Programs and services',
      counts.programs > 0 ? 'ready' : 'needs_work',
      counts.programs,
      counts.programs > 0
        ? `${counts.programs} delivery record${counts.programs === 1 ? '' : 's'} attached.`
        : 'Add the programs, services, places, and groups the organisation serves.',
      { label: 'Add delivery records', href: `${orgHref}/profile?tab=programs` },
      counts.programs > 0 ? 'none' : 'high'
    ),
    lane(
      'people',
      'People and governance',
      counts.people > 0 ? 'ready' : 'open',
      counts.people,
      counts.people > 0
        ? `${counts.people} people or governance signal${counts.people === 1 ? '' : 's'} visible.`
        : 'Add team, board, Elders, or public contacts so the work has accountable faces.',
      { label: 'Add people context', href: `${orgHref}/profile?tab=people` },
      counts.people > 0 ? 'none' : 'medium'
    ),
    lane(
      'proof',
      'Stories and proof',
      counts.proof > 0 ? 'ready' : 'open',
      counts.proof,
      counts.proof > 0
        ? `${counts.proof} proof record${counts.proof === 1 ? '' : 's'} attached.`
        : 'Attach consented stories, media, outcomes, or evidence that show the work in practice.',
      { label: 'Attach proof', href: `${orgHref}/profile?tab=proof` },
      counts.proof > 0 ? 'none' : 'medium'
    ),
    lane(
      'referrals',
      'Referral pathways',
      counts.referralsPending > 0 ? 'needs_work' : counts.referralsTotal > 0 ? 'ready' : 'open',
      counts.referralsPending || counts.referralsTotal,
      counts.referralsPending > 0
        ? `${counts.referralsPending} referral pathway${counts.referralsPending === 1 ? '' : 's'} still pending.`
        : counts.referralsTotal > 0
          ? 'Referral pathways are recorded and have no pending handovers.'
          : 'No referral pathways have been recorded yet.',
      { label: 'Review referral pathways', href: `${orgHref}/practice` },
      counts.referralsPending > 0 ? 'high' : counts.referralsTotal > 0 ? 'none' : 'low'
    ),
    lane(
      'practice_learning',
      'Practice learning',
      counts.recentSessions > 0 ? 'ready' : counts.sessionsTotal > 0 ? 'needs_work' : 'open',
      counts.recentSessions || counts.sessionsTotal,
      counts.recentSessions > 0
        ? `${counts.recentSessions} recent session${counts.recentSessions === 1 ? '' : 's'} logged.`
        : counts.sessionsTotal > 0
          ? 'There are older sessions, but nothing has been logged in the last 14 days.'
          : 'Log recent sessions, milestones, and learning so reporting does not start from memory.',
      { label: 'Log practice learning', href: `${orgHref}/practice` },
      counts.recentSessions > 0 ? 'none' : 'medium'
    ),
    lane(
      'funding',
      'Funding readiness',
      counts.budgetIssues > 0
        ? 'needs_work'
        : counts.fundingProfileCount > 0 && counts.fundingReadinessScore >= 70
          ? 'ready'
          : 'needs_work',
      counts.budgetIssues || counts.fundingProfileCount || counts.grants,
      counts.budgetIssues > 0
        ? `${counts.budgetIssues} grant budget issue${counts.budgetIssues === 1 ? '' : 's'} need review.`
        : counts.fundingProfileCount > 0
          ? `Funding readiness is ${counts.fundingReadinessScore}/100.`
          : 'Set up a capability profile so funders and matching agents can understand fit.',
      {
        label: counts.budgetIssues > 0 ? 'Review grant budget issues' : 'Update funding readiness',
        href: counts.budgetIssues > 0 ? `${orgHref}/grants` : `/funding/workspace/${org.id}`,
      },
      counts.budgetIssues > 0
        ? 'high'
        : counts.fundingProfileCount > 0 && counts.fundingReadinessScore >= 70
          ? 'none'
          : 'high'
    ),
    lane(
      'compliance',
      'Compliance and deadlines',
      counts.deadlinesOverdue + counts.complianceExpired > 0
        ? 'needs_work'
        : counts.deadlinesDueSoon + counts.complianceExpiring > 0
          ? 'open'
          : counts.deadlinesActive + counts.complianceDocs + counts.grants > 0
            ? 'ready'
            : 'open',
      counts.deadlinesActive + counts.complianceDocs,
      counts.deadlinesOverdue + counts.complianceExpired > 0
        ? 'There are overdue or expired reporting/compliance items.'
        : counts.deadlinesDueSoon + counts.complianceExpiring > 0
          ? 'There are due-soon reporting or compliance items to clear.'
          : counts.deadlinesActive + counts.complianceDocs + counts.grants > 0
            ? 'No active reporting or compliance deadline is currently due.'
            : 'No reporting or compliance records have been created yet.',
      { label: 'Review deadlines', href: `${orgHref}/compliance`, dueDate: input.nearestDueDate },
      counts.deadlinesOverdue + counts.complianceExpired > 0
        ? 'urgent'
        : counts.deadlinesDueSoon + counts.complianceExpiring > 0
          ? 'medium'
          : counts.deadlinesActive + counts.complianceDocs + counts.grants > 0
            ? 'none'
            : 'low'
    ),
    lane(
      'outcomes',
      'Outcome evidence',
      counts.activeAwards > 0 && counts.outcomeCommitments === 0
        ? 'needs_work'
        : counts.outcomeCommitments > 0 && counts.outcomeUpdates === 0
          ? 'open'
          : counts.outcomeUpdates > 0
            ? 'ready'
            : 'open',
      counts.outcomeUpdates || counts.outcomeCommitments || counts.activeAwards,
      counts.activeAwards > 0 && counts.outcomeCommitments === 0
        ? 'Active awards need outcome commitments before reporting pressure arrives.'
        : counts.outcomeCommitments > 0 && counts.outcomeUpdates === 0
          ? 'Outcome commitments exist but have not been updated yet.'
          : counts.outcomeUpdates > 0
            ? `${counts.outcomeUpdates} outcome update${counts.outcomeUpdates === 1 ? '' : 's'} recorded.`
            : 'Outcome evidence can be added once funding or delivery commitments are active.',
      { label: 'Update outcome evidence', href: `/funding/workspace/${org.id}` },
      counts.activeAwards > 0 && counts.outcomeCommitments === 0
        ? 'high'
        : counts.outcomeCommitments > 0 && counts.outcomeUpdates === 0
          ? 'medium'
          : counts.outcomeUpdates > 0
            ? 'none'
            : 'low'
    ),
  ];

  const suggestedActions = buildPracticeReflexSuggestedActions(org, lanes);
  const actions = input.actions || [];
  const ready = lanes.filter((item) => item.status === 'ready').length;
  const needsWork = lanes.filter((item) => item.status === 'needs_work').length;

  return {
    organization: org,
    lanes,
    actions,
    suggestedActions,
    summary: {
      essentialStepsReady: ready,
      essentialStepsTotal: lanes.length,
      needsWork,
      openActions: actions.filter((action) => action.status !== 'done' && action.status !== 'dismissed').length,
      dueSoon: counts.deadlinesDueSoon + counts.complianceExpiring,
      proofStrength,
      fundingReadiness: counts.fundingReadinessScore,
    },
    counts,
  };
}

export function buildPracticeReflexSuggestedActions(
  org: PracticeReflexOrganization,
  lanes: PracticeReflexLane[]
): PracticeReflexAction[] {
  return lanes
    .filter((item) => item.status !== 'ready')
    .map((item) => ({
      lane: item.key,
      title: item.nextAction.label,
      description: item.summary,
      priority: RISK_PRIORITY[item.riskLevel],
      status: 'open',
      dueDate: item.nextAction.dueDate || null,
      sourceAgent: PRACTICE_REFLEX_SOURCE,
      href: item.nextAction.href,
    }));
}

function parseLaneFromTitle(title: string): PracticeReflexAction['lane'] {
  const marker = title.match(/^\[([a-z_]+)\]/);
  const laneKey = marker?.[1];
  if (
    laneKey === 'identity' ||
    laneKey === 'programs' ||
    laneKey === 'people' ||
    laneKey === 'proof' ||
    laneKey === 'referrals' ||
    laneKey === 'practice_learning' ||
    laneKey === 'funding' ||
    laneKey === 'compliance' ||
    laneKey === 'outcomes'
  ) {
    return laneKey;
  }
  return 'general';
}

function mapActionRow(row: Record<string, any>, orgSlug: string): PracticeReflexAction {
  const lane = parseLaneFromTitle(String(row.title || ''));
  const cleanTitle = String(row.title || '').replace(/^\[[a-z_]+\]\s*/, '');
  return {
    id: row.id,
    lane,
    title: cleanTitle,
    description: row.description || null,
    priority: row.priority || 'medium',
    status: row.status || 'open',
    dueDate: row.due_date || null,
    sourceAgent: row.source_agent || null,
    href: actionHref(row, orgSlug),
    createdAt: row.created_at || null,
  };
}

function normalizeActionLane(laneKey: PracticeReflexAction['lane']): PracticeReflexLaneKey {
  return laneKey === 'general' ? 'identity' : laneKey;
}

function actionRowFromSuggestion(action: PracticeReflexAction): ActionRow {
  const laneKey = normalizeActionLane(action.lane);
  return {
    item_type: ACTION_TYPES[laneKey] || 'general',
    title: `[${laneKey}] ${action.title}`,
    description: action.description,
    priority: action.priority,
    status: 'open',
    due_date: action.dueDate,
    source_agent: PRACTICE_REFLEX_SOURCE,
    link_to_table: null,
    link_to_id: null,
  };
}

function actionHref(row: Record<string, any>, orgSlug: string) {
  if (row.link_to_table === 'org_grants' || row.item_type === 'grant' || row.item_type === 'reporting') {
    return `/hub/${orgSlug}/grants`;
  }
  if (row.link_to_table === 'org_compliance_docs' || row.item_type === 'compliance') {
    return `/hub/${orgSlug}/compliance`;
  }
  if (row.item_type === 'session' || row.item_type === 'referral') {
    return `/hub/${orgSlug}/practice`;
  }
  return `/hub/${orgSlug}/practice`;
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

async function safeList<T = Record<string, any>>(query: any): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) return [];
    return (data || []) as T[];
  } catch {
    return [];
  }
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function isDueSoon(date: string | null | undefined, days = 30) {
  if (!date) return false;
  const value = new Date(date).getTime();
  if (!Number.isFinite(value)) return false;
  return value <= new Date(daysFromNow(days)).getTime();
}

function isOverdue(date: string | null | undefined) {
  if (!date) return false;
  const value = new Date(date).getTime();
  if (!Number.isFinite(value)) return false;
  return value < new Date(new Date().toISOString().split('T')[0]).getTime();
}

export async function getPracticeReflexState(orgId: string): Promise<PracticeReflexState> {
  const service = createServiceClient() as any;
  const { data: organization, error } = await service
    .from('organizations')
    .select('id, name, slug, abn, description, plan, type, partner_tier, billing_status')
    .eq('id', orgId)
    .single();

  if (error || !organization) {
    throw new Error(error?.message || 'Organization not found');
  }

  const fourteenDaysAgo = daysFromNow(-14);
  const [programs, people, communityPeople, articles, stories, photos, videos, mediaItems] = await Promise.all([
    safeCount(service.from('programs_catalog_v').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(service.from('organizations_profiles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(service.from('community_programs_profiles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(service.from('articles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(service.from('stories').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(service.from('partner_photos').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(service.from('partner_videos').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(service.from('media_items').select('id', { count: 'exact', head: true }).contains('organization_ids', [orgId])),
  ]);

  const [
    referrals,
    sessionsTotal,
    recentSessions,
    milestones,
    grants,
    budgetLines,
    deadlines,
    complianceDocs,
    actionRows,
    capabilityRows,
    awards,
    commitments,
  ] = await Promise.all([
    safeList(service.from('org_referrals').select('id, status, referral_date').eq('organization_id', orgId)),
    safeCount(service.from('org_sessions').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(
      service
        .from('org_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('session_date', fourteenDaysAgo)
    ),
    safeCount(service.from('org_milestones').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeCount(service.from('org_grants').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)),
    safeList(
      service
        .from('org_grant_budget_lines')
        .select('id, budgeted_amount, actual_amount, has_issue')
        .eq('organization_id', orgId)
    ),
    safeList(
      service
        .from('org_deadlines')
        .select('id, title, due_date, status')
        .eq('organization_id', orgId)
        .in('status', ['pending', 'in_progress', 'overdue'])
        .order('due_date', { ascending: true })
    ),
    safeList(
      service
        .from('org_compliance_docs')
        .select('id, title, status, expiry_date')
        .eq('organization_id', orgId)
    ),
    safeList(
      service
        .from('org_action_items')
        .select('id, item_type, title, description, priority, status, due_date, source_agent, link_to_table, link_to_id, created_at')
        .eq('organization_id', orgId)
        .in('status', ['open', 'in_progress', 'snoozed'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(80)
    ),
    safeList(
      service
        .from('organization_capability_profiles')
        .select('id, funding_readiness_score, delivery_confidence_score, evidence_maturity_score')
        .eq('organization_id', orgId)
        .limit(1)
    ),
    safeList(
      service
        .from('funding_awards')
        .select('id, award_status')
        .eq('organization_id', orgId)
        .in('award_status', ['recommended', 'awarded', 'contracted', 'active'])
    ),
    safeList(
      service
        .from('funding_outcome_commitments')
        .select('id, commitment_status')
        .eq('organization_id', orgId)
        .in('commitment_status', ['draft', 'active', 'paused'])
    ),
  ]);

  const commitmentIds = commitments.map((row: any) => row.id).filter(Boolean);
  const updates = commitmentIds.length
    ? await safeList(
        service
          .from('funding_outcome_updates')
          .select('id, commitment_id')
          .in('commitment_id', commitmentIds)
      )
    : [];
  const updateIds = updates.map((row: any) => row.id).filter(Boolean);
  const validations = updateIds.length
    ? await safeCount(
        service
          .from('community_outcome_validations')
          .select('id', { count: 'exact', head: true })
          .in('update_id', updateIds)
      )
    : 0;

  const capability = capabilityRows[0] as Record<string, any> | undefined;
  const deadlineRows = deadlines as Array<Record<string, any>>;
  const complianceRows = complianceDocs as Array<Record<string, any>>;
  const budgetRows = budgetLines as Array<Record<string, any>>;
  const nearestDueDate = deadlineRows.find((row) => row.due_date)?.due_date || null;

  return buildPracticeReflexState({
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      abn: organization.abn || null,
      description: organization.description || null,
      plan: organization.plan || 'community',
      type: organization.type || null,
      partnerTier: organization.partner_tier || null,
      trialEndsAt: null,
      billingStatus: organization.billing_status || null,
    },
    counts: {
      programs,
      people: people + communityPeople,
      proof: articles + stories + photos + videos + mediaItems,
      referralsTotal: referrals.length,
      referralsPending: referrals.filter((row: any) => row.status === 'pending').length,
      sessionsTotal,
      recentSessions,
      milestones,
      grants,
      budgetIssues: budgetRows.filter((row) => {
        const budgeted = Number(row.budgeted_amount || 0);
        const actual = Number(row.actual_amount || 0);
        return row.has_issue === true || (budgeted > 0 && actual > budgeted);
      }).length,
      deadlinesActive: deadlineRows.length,
      deadlinesDueSoon: deadlineRows.filter((row) => row.status !== 'overdue' && !isOverdue(row.due_date) && isDueSoon(row.due_date, 30)).length,
      deadlinesOverdue: deadlineRows.filter((row) => row.status === 'overdue' || isOverdue(row.due_date)).length,
      complianceDocs: complianceRows.length,
      complianceExpiring: complianceRows.filter((row) => (row.status === 'expiring' || isDueSoon(row.expiry_date, 30)) && row.status !== 'expired' && !isOverdue(row.expiry_date)).length,
      complianceExpired: complianceRows.filter((row) => row.status === 'expired' || isOverdue(row.expiry_date)).length,
      actionItemsOpen: actionRows.length,
      fundingProfileCount: capabilityRows.length,
      fundingReadinessScore: Math.round(Number(capability?.funding_readiness_score || 0)),
      deliveryConfidenceScore: Math.round(Number(capability?.delivery_confidence_score || 0)),
      evidenceMaturityScore: Math.round(Number(capability?.evidence_maturity_score || 0)),
      activeAwards: awards.length,
      outcomeCommitments: commitments.length,
      outcomeUpdates: updates.length,
      communityValidations: validations,
    },
    actions: actionRows.map((row: Record<string, any>) => mapActionRow(row, organization.slug)),
    nearestDueDate,
  });
}

export async function refreshPracticeReflexActions(orgId: string): Promise<PracticeReflexState> {
  const service = createServiceClient() as any;
  const state = await getPracticeReflexState(orgId);
  const existingByLane = new Map<PracticeReflexLaneKey, PracticeReflexAction>();
  const duplicateIds: string[] = [];

  for (const action of state.actions) {
    if (action.sourceAgent !== PRACTICE_REFLEX_SOURCE || !action.id) continue;
    if (action.lane === 'general') {
      duplicateIds.push(action.id);
      continue;
    }
    if (existingByLane.has(action.lane)) {
      duplicateIds.push(action.id);
      continue;
    }
    existingByLane.set(action.lane, action);
  }

  const suggestedLanes = new Set<PracticeReflexLaneKey>();
  const rowsToInsert: ActionRow[] = [];
  const updateQueries: Array<PromiseLike<{ error: { message?: string } | null }>> = [];

  for (const action of state.suggestedActions) {
    const laneKey = normalizeActionLane(action.lane);
    const row = actionRowFromSuggestion(action);
    const existing = existingByLane.get(laneKey);
    suggestedLanes.add(laneKey);

    if (existing?.id) {
      updateQueries.push(
        service
          .from('org_action_items')
          .update(row)
          .eq('id', existing.id)
          .eq('organization_id', orgId)
          .eq('source_agent', PRACTICE_REFLEX_SOURCE)
      );
    } else {
      rowsToInsert.push(row);
    }
  }

  const staleIds = Array.from(existingByLane.entries())
    .filter(([laneKey]) => !suggestedLanes.has(laneKey))
    .map(([, action]) => action.id)
    .filter(Boolean) as string[];
  const deleteIds = Array.from(new Set([...duplicateIds, ...staleIds]));

  if (deleteIds.length > 0) {
    const { error } = await service
      .from('org_action_items')
      .delete()
      .eq('organization_id', orgId)
      .eq('source_agent', PRACTICE_REFLEX_SOURCE)
      .in('status', ['open', 'in_progress', 'snoozed'])
      .in('id', deleteIds);
    if (error) throw new Error(error.message);
  }

  for (const query of updateQueries) {
    const { error } = await query;
    if (error) throw new Error(error.message || 'Unable to refresh Practice Reflex action');
  }

  if (rowsToInsert.length > 0) {
    const { error } = await service.from('org_action_items').insert(
      rowsToInsert.map((row) => ({
        organization_id: orgId,
        ...row,
      }))
    );
    if (error) throw new Error(error.message);
  }

  return getPracticeReflexState(orgId);
}
