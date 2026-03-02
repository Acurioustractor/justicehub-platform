'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type DraftRecord = {
  id: string;
  applicationId?: string | null;
  narrativeDraft: string | null;
  supportMaterial: string[];
  communityReviewNotes: string[];
  budgetNotes: string | null;
  draftStatus: string;
  lastReviewRequestedAt: string | null;
  updatedAt: string | null;
    reviewTask: {
      id: string;
      status: string;
      title: string;
      createdAt: string | null;
      completedAt: string | null;
      reviewDecision?: string | null;
      reviewFeedback?: string | null;
      communityReviewerRecommendation?: string | null;
      communityReviewerNote?: string | null;
      communityReviewerName?: string | null;
      communityReviewerConnection?: string | null;
      communityReviewerRespondedAt?: string | null;
      communityReviewerResponseCount?: number;
      resolution?: string | null;
    } | null;
} | null;

type DraftReviewTask = NonNullable<DraftRecord>['reviewTask'];

function splitMultiline(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function FundingApplicationDraftEditor({
  organizationId,
  opportunityId,
  initialDraft,
}: {
  organizationId: string;
  opportunityId: string;
  initialDraft: DraftRecord;
}) {
  const [narrativeDraft, setNarrativeDraft] = useState(initialDraft?.narrativeDraft || '');
  const [supportMaterial, setSupportMaterial] = useState(
    (initialDraft?.supportMaterial || []).join('\n')
  );
  const [communityReviewNotes, setCommunityReviewNotes] = useState(
    (initialDraft?.communityReviewNotes || []).join('\n')
  );
  const [budgetNotes, setBudgetNotes] = useState(initialDraft?.budgetNotes || '');
  const [draftStatus, setDraftStatus] = useState(initialDraft?.draftStatus || 'draft');
  const [lastReviewRequestedAt, setLastReviewRequestedAt] = useState<string | null>(
    initialDraft?.lastReviewRequestedAt || null
  );
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialDraft?.updatedAt || null);
  const [applicationId, setApplicationId] = useState<string | null>(
    initialDraft?.applicationId || null
  );
  const [reviewTask, setReviewTask] = useState<DraftReviewTask>(initialDraft?.reviewTask || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [copyingReviewLink, setCopyingReviewLink] = useState(false);
  const [reviewLinkCopied, setReviewLinkCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  useEffect(() => {
    if (!reviewLinkCopied) return;

    const timer = window.setTimeout(() => {
      setReviewLinkCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [reviewLinkCopied]);

  const canRequestReview = useMemo(
    () => narrativeDraft.trim() || supportMaterial.trim() || budgetNotes.trim(),
    [budgetNotes, narrativeDraft, supportMaterial]
  );
  const hasRevisionRequest =
    reviewTask?.reviewDecision === 'resolved' && reviewTask?.resolution === 'needs_revision';
  const readyAfterReview =
    reviewTask?.reviewDecision === 'resolved' && reviewTask?.resolution === 'ready_to_submit';

  async function saveDraft(
    nextStatus?: string,
    requestReview?: boolean,
    promoteToLiveApplication?: boolean
  ) {
    setIsSaving(true);
    setNotice(null);
    setError(null);

    try {
      const payload = {
        organizationId,
        opportunityId,
        narrativeDraft,
        supportMaterial: splitMultiline(supportMaterial),
        communityReviewNotes: splitMultiline(communityReviewNotes),
        budgetNotes,
        draftStatus: nextStatus || draftStatus,
        requestCommunityReview: requestReview === true,
        promoteToLiveApplication: promoteToLiveApplication === true,
      };

      const response = await fetch('/api/funding/workspace/application-drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = (await response.json().catch(() => null)) as
        | {
            draft?: DraftRecord;
            reviewTask?: DraftReviewTask;
            applicationId?: string | null;
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to save draft workspace');
      }

      const saved = json?.draft || null;
      setDraftStatus(saved?.draftStatus || (nextStatus || draftStatus));
      setLastReviewRequestedAt(saved?.lastReviewRequestedAt || null);
      setUpdatedAt(saved?.updatedAt || null);
      setApplicationId(saved?.applicationId || json?.applicationId || null);
      setReviewTask(saved?.reviewTask || json?.reviewTask || null);
      setNotice(
        promoteToLiveApplication
          ? 'Draft promoted into the live application path.'
          : requestReview
          ? 'Community review task requested and draft saved.'
          : 'Draft saved.'
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save draft workspace');
    } finally {
      setIsSaving(false);
    }
  }

  async function copyCommunityReviewLink(taskId: string) {
    if (!isInteractive || !taskId) return;

    setCopyingReviewLink(true);
    setError(null);

    try {
      const reviewPath = `/funding/review/application-drafts/${taskId}`;
      const reviewUrl =
        typeof window !== 'undefined'
          ? new URL(reviewPath, window.location.origin).toString()
          : reviewPath;

      await navigator.clipboard.writeText(reviewUrl);
      setReviewLinkCopied(true);
      setNotice('Community review link copied.');
    } catch (copyError) {
      setError(
        copyError instanceof Error
          ? copyError.message
          : 'Failed to copy community review link'
      );
    } finally {
      setCopyingReviewLink(false);
    }
  }

  return (
    <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-black">Build The Draft</h2>
          <p className="text-sm text-gray-600">
            Save the working narrative, support material, and review notes directly from this workspace.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hasRevisionRequest && (
              <span className="px-2 py-1 text-[11px] font-black border border-black bg-amber-100 text-amber-900">
                Revision requested
              </span>
            )}
            {readyAfterReview && (
              <span className="px-2 py-1 text-[11px] font-black border border-black bg-emerald-100 text-emerald-900">
                Ready after review
              </span>
            )}
          </div>
        </div>
        <div className="text-xs font-bold text-gray-600">
          Last saved: {formatDateTime(updatedAt)}
        </div>
      </div>

      {hasRevisionRequest && (
        <div className="mb-4 border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <div className="font-black mb-1">Revision Requested</div>
          <div className="font-semibold">
            Community review returned this draft for revision before submission.
          </div>
          <div className="mt-2 text-sm">
            {reviewTask?.reviewFeedback || 'A review note was recorded, but no explicit feedback text was returned.'}
          </div>
          <div className="mt-2 text-xs font-bold text-amber-900">
            Rework the draft, then request community review again or move it to ready-to-submit when the issues are resolved.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-xs uppercase font-bold text-gray-600">Narrative Draft</span>
          <textarea
            value={narrativeDraft}
            onChange={(event) => setNarrativeDraft(event.target.value)}
            rows={6}
            className="w-full border-2 border-black p-3 text-sm text-black bg-white"
            placeholder="Draft the core case for why this organization, this program, and this funding ask should move now."
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase font-bold text-gray-600">Support Material</span>
          <textarea
            value={supportMaterial}
            onChange={(event) => setSupportMaterial(event.target.value)}
            rows={6}
            className="w-full border-2 border-black p-3 text-sm text-black bg-white"
            placeholder="One support item per line&#10;Letter of support from local partner&#10;Outcome summary for existing commitments"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase font-bold text-gray-600">Community Review Notes</span>
          <textarea
            value={communityReviewNotes}
            onChange={(event) => setCommunityReviewNotes(event.target.value)}
            rows={6}
            className="w-full border-2 border-black p-3 text-sm text-black bg-white"
            placeholder="Capture community concerns, endorsements, and review prompts here."
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase font-bold text-gray-600">Budget Notes</span>
          <textarea
            value={budgetNotes}
            onChange={(event) => setBudgetNotes(event.target.value)}
            rows={4}
            className="w-full border-2 border-black p-3 text-sm text-black bg-white"
            placeholder="Document the high-level funding ask, phasing, and any known constraints."
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase font-bold text-gray-600">Draft Status</span>
          <select
            value={draftStatus}
            onChange={(event) => setDraftStatus(event.target.value)}
            className="w-full border-2 border-black p-3 text-sm text-black bg-white"
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="ready_to_submit">Ready To Submit</option>
            <option value="submitted">Submitted</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void saveDraft()}
          disabled={!isInteractive || isSaving}
          className="inline-flex items-center justify-center px-4 py-3 bg-[#1d4ed8] text-white font-bold border-2 border-black hover:bg-[#1e40af] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={() => void saveDraft('in_review', true)}
          disabled={!isInteractive || isSaving || !canRequestReview}
          className="inline-flex items-center justify-center px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Working…' : 'Request Community Review'}
        </button>
        <button
          type="button"
          onClick={() => void saveDraft('ready_to_submit', false, true)}
          disabled={!isInteractive || isSaving || draftStatus !== 'ready_to_submit'}
          className="inline-flex items-center justify-center px-4 py-3 bg-emerald-600 text-white font-bold border-2 border-black hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Working…' : 'Promote To Live Application'}
        </button>
        <div className="text-xs font-bold text-gray-600">
          Review requested: {formatDateTime(lastReviewRequestedAt)}
        </div>
      </div>

      {applicationId && (
        <div className="mt-4 border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <div className="font-black mb-1">Live Application Path</div>
          <div className="font-semibold">Application pathway is active.</div>
          <div className="text-xs mt-1">Application ID: {applicationId}</div>
        </div>
      )}

      {reviewTask && (
        <div className="mt-4 border-2 border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          <div className="font-black mb-1">Community Review Task</div>
          <div className="font-semibold">{reviewTask.title}</div>
          <div className="text-xs mt-1">
            Status: {reviewTask.status} • Created: {formatDateTime(reviewTask.createdAt)}
          </div>
          <Link
            href={`/funding/review/application-drafts/${reviewTask.id}`}
            prefetch={false}
            className="inline-flex items-center gap-2 mt-3 px-3 py-2 bg-white text-black font-bold border-2 border-black hover:bg-gray-100"
          >
            Open Community Review Page
          </Link>
          <button
            type="button"
            onClick={() => void copyCommunityReviewLink(reviewTask.id)}
            disabled={!isInteractive || copyingReviewLink}
            className="inline-flex items-center gap-2 mt-3 ml-0 md:ml-3 px-3 py-2 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 disabled:opacity-60"
          >
            {copyingReviewLink
              ? 'Copying…'
              : reviewLinkCopied
                ? 'Review Link Copied'
                : 'Copy Review Link'}
          </button>
          {reviewTask.reviewFeedback && (
            <div className="mt-2 text-sm">
              <span className="font-black">Latest review feedback:</span> {reviewTask.reviewFeedback}
            </div>
          )}
          {reviewTask.communityReviewerRespondedAt && (
            <div className="mt-3 border border-blue-200 bg-white px-3 py-2">
              <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                Community reviewer input
              </div>
              <div className="text-sm font-black text-black">
                {reviewTask.communityReviewerRecommendation
                  ? reviewTask.communityReviewerRecommendation.replace(/_/g, ' ')
                  : 'Response received'}
              </div>
              <div className="text-xs font-bold text-gray-600 mt-1">
                Responses: {reviewTask.communityReviewerResponseCount || 1}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {reviewTask.communityReviewerName || 'Community reviewer'}
                {reviewTask.communityReviewerConnection
                  ? ` • ${reviewTask.communityReviewerConnection}`
                  : ''}
                {' • '}
                {formatDateTime(reviewTask.communityReviewerRespondedAt)}
              </div>
              {reviewTask.communityReviewerNote && (
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                  {reviewTask.communityReviewerNote}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {notice && (
        <div className="mt-4 border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {notice}
        </div>
      )}

      {error && (
        <div className="mt-4 border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
          {error}
        </div>
      )}
    </section>
  );
}
