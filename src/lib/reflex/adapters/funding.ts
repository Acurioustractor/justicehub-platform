/**
 * Funding → Reflex adapter
 *
 * The funding conversation data (lib/funding/funding-operating-system) is the
 * canonical example of a working reflex loop. This adapter projects funding
 * conversation records into the generic ReflexLoop shape so new callers
 * (Practice surface, evidence bundle, Empathy Ledger accountability events)
 * can consume them without learning the funding schema.
 *
 * This is read-only. Writes still go through funding-operating-system to keep
 * the funding flow working unchanged.
 */

import type { ReflexEvent, ReflexLoop, ReflexOutcome, ReflexTask } from '../types';

/**
 * The shape returned by getFundingConversationRequestPublic() — mirrored from
 * src/app/funding/conversations/[taskId]/page.tsx so we don't have to import
 * the giant funding-operating-system module just for a type.
 */
export interface FundingConversationRequestDetail {
  taskId: string;
  status: string;
  title: string;
  description?: string;
  organizationName?: string | null;
  opportunityName?: string | null;
  funderName?: string | null;
  brief?: string;
  completedAt?: string | null;
  responseKind?: string | null;
  responseMessage?: string | null;
  responderName?: string | null;
  responderEmail?: string | null;
  respondedAt?: string | null;
  nextStepKind?: string | null;
  nextStepLabel?: string | null;
  nextStepScheduledAt?: string | null;
  outcomeKind?: string | null;
  outcomeLabel?: string | null;
  outcomeRecordedAt?: string | null;
  outcomeFollowUpTaskId?: string | null;
  outcomeFollowUpKind?: string | null;
  outcomeFollowUpLabel?: string | null;
  relationshipNoticeKind?: string | null;
  relationshipNoticeLabel?: string | null;
  relationshipNoticeMessage?: string | null;
  relationshipNoticeRecordedAt?: string | null;
  relationshipNoticeRequestResponse?: boolean;
  relationshipNoticeResponsePrompt?: string | null;
  relationshipNoticeResponseStatus?: string | null;
  relationshipNoticeResponseMessage?: string | null;
  relationshipNoticeResponderName?: string | null;
  relationshipNoticeResponderEmail?: string | null;
  relationshipNoticeRespondedAt?: string | null;
}

const FUNDING_STATUS_MAP: Record<string, ReflexTask['status']> = {
  queued: 'queued',
  pending: 'pending',
  running: 'running',
  awaiting_response: 'awaiting_response',
  completed: 'completed',
  cancelled: 'cancelled',
  blocked: 'blocked',
};

function mapFundingStatus(raw: string | undefined | null): ReflexTask['status'] {
  if (!raw) return 'pending';
  return FUNDING_STATUS_MAP[raw.toLowerCase()] ?? 'pending';
}

function mapResponseKindToOutcome(
  kind: string | null | undefined
): ReflexOutcome['kind'] {
  switch ((kind ?? '').toLowerCase()) {
    case 'interested':
      return 'progressed';
    case 'needs_more_info':
      return 'progressed';
    case 'not_now':
      return 'declined';
    default:
      return 'other';
  }
}

/**
 * Project a funding conversation record into the generic reflex loop shape.
 *
 * Idempotent and pure. Safe to call on every render.
 */
export function fundingConversationToReflexLoop(
  detail: FundingConversationRequestDetail
): ReflexLoop {
  const createdAt = detail.completedAt ?? new Date().toISOString();
  const task: ReflexTask = {
    id: detail.taskId,
    source: 'funding',
    title: detail.title,
    description: detail.description ?? null,
    organizationId: detail.organizationName ?? null,
    ownerId: detail.responderEmail ?? null,
    status: mapFundingStatus(detail.status),
    priority: 'medium',
    dueAt: detail.nextStepScheduledAt ?? null,
    createdAt,
    updatedAt: detail.respondedAt ?? detail.outcomeRecordedAt ?? createdAt,
    payload: {
      opportunityName: detail.opportunityName,
      funderName: detail.funderName,
      brief: detail.brief,
    },
  };

  const events: ReflexEvent[] = [
    {
      id: `${detail.taskId}__created`,
      taskId: detail.taskId,
      occurredAt: createdAt,
      type: 'created',
      actorId: 'funding-os',
    },
  ];

  if (detail.respondedAt) {
    events.push({
      id: `${detail.taskId}__responded`,
      taskId: detail.taskId,
      occurredAt: detail.respondedAt,
      type: 'responded',
      actorId: detail.responderEmail ?? detail.responderName ?? 'community',
      note: detail.responseMessage ?? null,
      payload: {
        responseKind: detail.responseKind,
        responderName: detail.responderName,
      },
    });
  }

  if (detail.relationshipNoticeRecordedAt) {
    events.push({
      id: `${detail.taskId}__relationship_notice`,
      taskId: detail.taskId,
      occurredAt: detail.relationshipNoticeRecordedAt,
      type: 'note',
      actorId: 'funding-os',
      note: detail.relationshipNoticeMessage ?? detail.relationshipNoticeLabel ?? null,
      payload: { kind: detail.relationshipNoticeKind },
    });
  }

  if (detail.relationshipNoticeRespondedAt) {
    events.push({
      id: `${detail.taskId}__relationship_notice_reply`,
      taskId: detail.taskId,
      occurredAt: detail.relationshipNoticeRespondedAt,
      type: 'responded',
      actorId:
        detail.relationshipNoticeResponderEmail ??
        detail.relationshipNoticeResponderName ??
        'community',
      note: detail.relationshipNoticeResponseMessage ?? null,
    });
  }

  let outcome: ReflexOutcome | null = null;
  if (detail.outcomeRecordedAt) {
    outcome = {
      id: `${detail.taskId}__outcome`,
      taskId: detail.taskId,
      recordedAt: detail.outcomeRecordedAt,
      kind: mapResponseKindToOutcome(detail.responseKind ?? detail.outcomeKind),
      label: detail.outcomeLabel ?? null,
      followUpTaskId: detail.outcomeFollowUpTaskId ?? null,
      payload: {
        outcomeKind: detail.outcomeKind,
        outcomeFollowUpKind: detail.outcomeFollowUpKind,
        outcomeFollowUpLabel: detail.outcomeFollowUpLabel,
      },
    };
  }

  return { task, events, outcome };
}
