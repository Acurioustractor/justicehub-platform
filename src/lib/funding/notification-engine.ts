import {
  computeGrantMatchesForOrg,
  type FundingOpportunity,
  type OrgRecord,
  type ScoredGrantMatch,
} from '@/lib/funding/grant-matching';

export interface BasecampNotificationTarget extends OrgRecord {
  organization_id: string;
  organization_name: string;
  jurisdictions: string[];
  focus_areas: string[];
}

export interface NotificationPayload {
  type:
    | 'funding_alert'
    | 'research_digest'
    | 'closing_soon'
    | 'weekly_report'
    | 'ops_alert_digest';
  organization_id?: string;
  priority?: number;
  data: Record<string, unknown>;
}

export async function persistFundingNotifications(
  supabase: any,
  notifications: NotificationPayload[],
  options?: {
    source?: string;
    requestedBy?: string | null;
    runId?: string | null;
  }
) {
  if (!notifications.length) {
    return { stored: 0 };
  }

  const source = options?.source || 'funding_notifications';
  const now = new Date().toISOString();
  const tasks = notifications.map((notification, index) => {
    const organizationId = notification.organization_id || 'global';
    const sourceId = options?.runId
      ? `${options.runId}:${organizationId}:${notification.type}:${index}`
      : `${organizationId}:${notification.type}:${index}:${now}`;

    return {
      source,
      source_id: sourceId,
      task_type: 'funding_notification',
      title: `Funding notification: ${notification.type}`,
      description: `Generated ${notification.type} for ${organizationId}`,
      status: 'completed',
      priority:
        typeof notification.priority === 'number' && Number.isFinite(notification.priority)
          ? Math.max(1, Math.min(5, Math.round(notification.priority)))
          : 3,
      needs_review: false,
      requested_by: options?.requestedBy || null,
      output: {
        notification,
        generated_at: now,
        run_id: options?.runId || null,
      },
      reply_to: {
        organization_id: notification.organization_id || null,
        type: notification.type,
      },
    };
  });

  const { error } = await supabase.from('agent_task_queue').insert(tasks);
  if (error) throw new Error(error.message);
  return { stored: tasks.length };
}

export async function fetchNotificationTargets(
  supabase: any,
  organizationIds?: string[]
): Promise<BasecampNotificationTarget[]> {
  let query = supabase
    .from('organizations')
    .select('id, name, type, location, state, description, tags, metadata');

  if (organizationIds && organizationIds.length > 0) {
    query = query.in('id', organizationIds);
  } else {
    query = query.eq('partner_tier', 'basecamp');
  }

  const { data: orgs, error } = await query;
  if (error) throw error;

  return (orgs || []).map((org: any) => ({
    organization_id: org.id,
    organization_name: org.name,
    jurisdictions: org.metadata?.jurisdictions || [],
    focus_areas: org.metadata?.focus_areas || [],
    id: org.id,
    name: org.name,
    type: org.type,
    location: org.location,
    state: org.state,
    description: org.description,
    tags: org.tags,
    metadata: org.metadata,
  }));
}

function toNotificationOpportunity(match: ScoredGrantMatch) {
  return {
    id: match.opportunity.id,
    name: match.opportunity.name,
    funder: match.opportunity.funder_name,
    amount_min: match.opportunity.min_grant_amount,
    amount_max: match.opportunity.max_grant_amount,
    deadline: match.opportunity.deadline,
    relevance: match.opportunity.relevance_score,
    score: match.score,
    confidence: match.confidence,
    notify_eligible: match.notifyEligible,
    needs_human_review: match.needsHumanReview,
    reasons: match.reasons,
    days_left: match.daysToDeadline,
  };
}

export async function generateFundingAlertNotifications(
  supabase: any,
  targets: BasecampNotificationTarget[]
): Promise<NotificationPayload[]> {
  const notifications: NotificationPayload[] = [];

  const { data: opportunities } = await supabase
    .from('alma_funding_opportunities')
    .select(
      'id, name, description, eligibility_criteria, keywords, funder_name, source_type, status, jurisdictions, is_national, focus_areas, eligible_org_types, min_grant_amount, max_grant_amount, deadline, relevance_score'
    )
    .in('status', ['open', 'closing_soon'])
    .gte('relevance_score', 35)
    .order('relevance_score', { ascending: false })
    .limit(120);

  if (!opportunities || opportunities.length === 0) return notifications;

  for (const org of targets) {
    const matches = computeGrantMatchesForOrg(
      org,
      opportunities as FundingOpportunity[],
      new Set(),
      10
    );
    const autoNotifyMatches = matches.filter((m) => m.notifyEligible).slice(0, 5);
    const reviewCandidates = matches.filter((m) => m.needsHumanReview).slice(0, 5);

    if (autoNotifyMatches.length > 0) {
      notifications.push({
        type: 'funding_alert',
        organization_id: org.organization_id,
        data: {
          organization_name: org.organization_name,
          matched_opportunities: autoNotifyMatches.map(toNotificationOpportunity),
          review_candidates: reviewCandidates.map(toNotificationOpportunity),
          total_matches: matches.length,
          auto_notified: autoNotifyMatches.length,
          held_for_review: reviewCandidates.length,
        },
      });
    }
  }

  return notifications;
}

export async function generateClosingSoonNotifications(
  supabase: any,
  targets: BasecampNotificationTarget[]
): Promise<NotificationPayload[]> {
  const notifications: NotificationPayload[] = [];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);

  const { data: opportunities } = await supabase
    .from('alma_funding_opportunities')
    .select(
      'id, name, description, eligibility_criteria, keywords, funder_name, source_type, status, jurisdictions, is_national, focus_areas, eligible_org_types, min_grant_amount, max_grant_amount, deadline, relevance_score'
    )
    .in('status', ['open', 'closing_soon'])
    .gt('deadline', new Date().toISOString())
    .lt('deadline', futureDate.toISOString())
    .order('deadline', { ascending: true });

  if (!opportunities || opportunities.length === 0) return notifications;

  for (const org of targets) {
    const matches = computeGrantMatchesForOrg(
      org,
      opportunities as FundingOpportunity[],
      new Set(),
      20
    );
    const closingSoon = matches
      .filter((m) => m.notifyEligible && m.daysToDeadline !== null && m.daysToDeadline <= 14)
      .slice(0, 10);

    if (closingSoon.length > 0) {
      notifications.push({
        type: 'closing_soon',
        organization_id: org.organization_id,
        data: {
          organization_name: org.organization_name,
          closing_soon: closingSoon.map(toNotificationOpportunity),
        },
      });
    }
  }

  return notifications;
}
