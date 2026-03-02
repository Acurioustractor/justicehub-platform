'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export function FundingDiscoveryPipelineHandoff({
  recommendationId,
  organizationId,
  opportunityId,
  organizationName,
  opportunityName,
  funderName,
  onPipelineSent,
  onConversationTracked,
  onConversationBriefCopied,
  compact = false,
}: {
  recommendationId?: string | null;
  organizationId: string;
  opportunityId?: string | null;
  organizationName?: string | null;
  opportunityName?: string | null;
  funderName?: string | null;
  onPipelineSent?: () => void;
  onConversationTracked?: () => void;
  onConversationBriefCopied?: () => void;
  compact?: boolean;
}) {
  const normalizedRecommendationId = String(recommendationId || '').trim();
  const normalizedOpportunityId = String(opportunityId || '').trim();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingConversation, setTrackingConversation] = useState(false);
  const [conversationTracked, setConversationTracked] = useState(false);
  const [conversationTaskId, setConversationTaskId] = useState<string | null>(null);
  const [copyingConversationBrief, setCopyingConversationBrief] = useState(false);
  const [conversationBriefCopied, setConversationBriefCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!normalizedRecommendationId) {
    return null;
  }

  const pipelineHref = normalizedOpportunityId
    ? `/admin/funding/os/pipeline?organizationId=${encodeURIComponent(
        organizationId
      )}&opportunityId=${encodeURIComponent(normalizedOpportunityId)}`
    : `/admin/funding/os/pipeline?organizationId=${encodeURIComponent(organizationId)}`;
  const conversationHref = '/admin/funding/os/conversations';
  const conversationResponseHref = conversationTaskId
    ? `/funding/conversations/${encodeURIComponent(conversationTaskId)}`
    : null;

  const conversationBrief = [
    'Conversation Request',
    organizationName ? `Organization: ${organizationName}` : `Organization ID: ${organizationId}`,
    opportunityName
      ? `Opportunity: ${opportunityName}`
      : normalizedOpportunityId
        ? `Opportunity ID: ${normalizedOpportunityId}`
        : null,
    funderName ? `Funder: ${funderName}` : null,
    '',
    'Why now:',
    'This organization was shortlisted and has been sent into the funding pipeline as a current candidate.',
    '',
    'Suggested conversation goals:',
    '- Confirm community priorities and readiness for this opportunity',
    '- Validate current fit, risks, and timing',
    '- Surface any support needed before formal engagement',
    '',
    'Next step:',
    'Invite a direct conversation with the organization to confirm mutual fit before advancing further.',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              setSubmitting(true);
              setError(null);
              const response = await fetch('/api/admin/funding/os/matches/promote', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recommendationId: normalizedRecommendationId }),
              });

              const payload = await response.json().catch(() => ({}));
              if (!response.ok) {
                throw new Error(payload.error || 'Failed to send organization to pipeline');
              }

              setSuccess(true);
              onPipelineSent?.();
            } catch (submitError) {
              setError(
                submitError instanceof Error
                  ? submitError.message
                  : 'Failed to send organization to pipeline'
              );
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={submitting || success}
          className={`inline-flex items-center gap-2 border-2 border-black font-black transition-colors disabled:opacity-50 ${
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
          } ${
            success
              ? 'bg-[#0f766e] text-white'
              : 'bg-white hover:bg-gray-100'
          }`}
        >
          <Send className="w-4 h-4" />
          {success
            ? 'Sent to Pipeline'
            : submitting
              ? 'Sending…'
              : compact
                ? 'Send to Pipeline'
                : 'Send Top Match to Pipeline'}
        </button>

        {success && (
          <>
            <Link
              href={pipelineHref}
              prefetch={false}
              className={`inline-flex items-center gap-2 border-2 border-black bg-white font-black hover:bg-gray-100 transition-colors ${
                compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
              }`}
            >
              Open Pipeline
            </Link>
            {conversationTracked && (
              <Link
                href={conversationHref}
                prefetch={false}
                className={`inline-flex items-center gap-2 border-2 border-black bg-white font-black hover:bg-gray-100 transition-colors ${
                  compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
                }`}
              >
                Open Conversations
              </Link>
            )}
            {conversationTracked && conversationResponseHref && (
              <Link
                href={conversationResponseHref}
                className={`inline-flex items-center gap-2 border-2 border-black bg-white font-black hover:bg-gray-100 transition-colors ${
                  compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
                }`}
              >
                Open Response Page
              </Link>
            )}
            <button
              type="button"
              onClick={async () => {
                try {
                  setTrackingConversation(true);
                  setError(null);
                  const response = await fetch('/api/admin/funding/os/conversations/request', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ recommendationId: normalizedRecommendationId }),
                  });

                  const payload = await response.json().catch(() => ({}));
                  if (!response.ok) {
                    throw new Error(payload.error || 'Failed to track conversation request');
                  }

                  setConversationTaskId(
                    typeof payload.taskId === 'string' ? payload.taskId : null
                  );
                  setConversationTracked(true);
                  onConversationTracked?.();
                } catch (trackError) {
                  setError(
                    trackError instanceof Error
                      ? trackError.message
                      : 'Failed to track conversation request'
                  );
                } finally {
                  setTrackingConversation(false);
                }
              }}
              disabled={trackingConversation || conversationTracked}
              className={`inline-flex items-center gap-2 border-2 border-black bg-white font-black hover:bg-gray-100 transition-colors disabled:opacity-50 ${
                compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {trackingConversation
                ? 'Tracking…'
                : conversationTracked
                  ? 'Conversation Tracked'
                  : 'Track Conversation'}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  setCopyingConversationBrief(true);
                  setError(null);
                  await navigator.clipboard.writeText(conversationBrief);
                  setConversationBriefCopied(true);
                  onConversationBriefCopied?.();
                  window.setTimeout(() => setConversationBriefCopied(false), 2000);
                } catch {
                  setError('Failed to copy conversation request brief');
                } finally {
                  setCopyingConversationBrief(false);
                }
              }}
              disabled={copyingConversationBrief}
              className={`inline-flex items-center gap-2 border-2 border-black bg-white font-black hover:bg-gray-100 transition-colors disabled:opacity-50 ${
                compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {copyingConversationBrief
                ? 'Copying…'
                : conversationBriefCopied
                  ? 'Brief Copied'
                  : 'Copy Conversation Brief'}
            </button>
          </>
        )}
      </div>

      {error && <div className="text-xs text-red-700">{error}</div>}
    </div>
  );
}
