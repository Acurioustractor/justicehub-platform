'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, FileCheck2, Send } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface DraftReviewDetail {
  taskId: string;
  status: string;
  title: string;
  description?: string;
  organizationName?: string | null;
  opportunityName?: string | null;
  funderName?: string | null;
  draftStatus?: string | null;
  narrativeDraft?: string | null;
  supportMaterial?: string[];
  communityReviewNotes?: string[];
  budgetNotes?: string | null;
  responseRecommendation?: string | null;
  responseNote?: string | null;
  reviewerName?: string | null;
  reviewerConnection?: string | null;
  respondedAt?: string | null;
  responseCount?: number;
  responseHistory?: Array<{
    recommendation?: string | null;
    note?: string | null;
    reviewerName?: string | null;
    reviewerConnection?: string | null;
    respondedAt?: string | null;
  }>;
  closed?: boolean;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function recommendationLabel(value?: string | null) {
  if (value === 'endorse') return 'Endorse as ready';
  if (value === 'request_changes') return 'Request changes';
  if (value === 'raise_concern') return 'Raise concern';
  return 'Community review';
}

export default function FundingApplicationDraftReviewPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const [taskId, setTaskId] = useState('');
  const [detail, setDetail] = useState<DraftReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerConnection, setReviewerConnection] = useState('');
  const [recommendation, setRecommendation] = useState<
    'endorse' | 'request_changes' | 'raise_concern'
  >('endorse');
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const resolved = await params;
      if (!cancelled) {
        setTaskId(resolved.taskId);
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/funding/application-draft-reviews/${taskId}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load community review request');
        }

        if (!cancelled) {
          setDetail(payload.data || null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load community review request'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function submitReview() {
    if (!taskId) return;
    if (!note.trim()) {
      setError('Add a short review note before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/funding/application-draft-reviews/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerName,
          reviewerConnection,
          recommendation,
          note,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit community review');
      }

      setSuccess('Community review submitted. The team can now work this feedback.');
      setDetail((current) =>
        current
          ? {
              ...current,
              status: payload.data?.status || current.status,
              responseRecommendation: payload.data?.recommendation || recommendation,
              responseNote: payload.data?.note || note,
              reviewerName: payload.data?.reviewerName || reviewerName || null,
              reviewerConnection:
                payload.data?.reviewerConnection || reviewerConnection || null,
              respondedAt: payload.data?.respondedAt || new Date().toISOString(),
            }
          : current
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit community review'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const responseCount = detail?.responseCount || 0;

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice max-w-5xl">
          <Link
            href="/funding/discovery"
            className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Funding
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-black">Community Draft Review</h1>
              <p className="text-base text-gray-600">
                Review this draft before it moves into the live funding application path.
              </p>
            </div>
          </div>

          {error && (
            <div className="border-2 border-red-500 bg-red-50 text-red-800 p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="border-2 border-emerald-500 bg-emerald-50 text-emerald-800 p-4 mb-6 font-medium">
              {success}
            </div>
          )}

          {loading ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Loading community review request…
            </div>
          ) : !detail ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              This community review request could not be found.
            </div>
          ) : (
            <div className="space-y-6">
              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h2 className="text-2xl font-black text-black">{detail.title}</h2>
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-white">
                    {detail.status}
                  </span>
                  {detail.closed && (
                    <span className="px-2 py-1 text-[11px] font-black border border-black bg-rose-100 text-rose-800">
                      Review closed
                    </span>
                  )}
                  {responseCount > 0 && (
                    <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                      {responseCount} response{responseCount === 1 ? '' : 's'} received
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {[detail.organizationName, detail.funderName].filter(Boolean).join(' • ') ||
                    'Application draft'}
                </div>
                {detail.description && (
                  <div className="text-sm text-gray-700 mt-3">{detail.description}</div>
                )}
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
                <div className="space-y-6">
                  <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                      Draft Narrative
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {detail.narrativeDraft || 'No narrative draft has been added yet.'}
                    </div>
                  </section>

                  <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                      Support Material
                    </div>
                    {detail.supportMaterial && detail.supportMaterial.length > 0 ? (
                      <ul className="space-y-2 text-sm text-gray-700">
                        {detail.supportMaterial.map((item, index) => (
                          <li key={`${item}-${index}`} className="border border-gray-200 bg-[#f8fafc] px-3 py-2">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500">No support material listed yet.</div>
                    )}
                  </section>

                  <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                      Existing Review Notes
                    </div>
                    {detail.communityReviewNotes && detail.communityReviewNotes.length > 0 ? (
                      <ul className="space-y-2 text-sm text-gray-700">
                        {detail.communityReviewNotes.map((item, index) => (
                          <li key={`${item}-${index}`} className="border border-gray-200 bg-[#f8fafc] px-3 py-2">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500">No community review notes yet.</div>
                    )}
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                      Draft Context
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>
                        <span className="font-black text-black">Opportunity:</span>{' '}
                        {detail.opportunityName || 'Funding opportunity'}
                      </div>
                      <div>
                        <span className="font-black text-black">Draft status:</span>{' '}
                        {detail.draftStatus || 'draft'}
                      </div>
                      <div>
                        <span className="font-black text-black">Budget notes:</span>{' '}
                        {detail.budgetNotes || 'No budget notes yet.'}
                      </div>
                    </div>
                  </section>

                  {detail.closed ? (
                    <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                        Review closed
                      </div>
                      <div className="text-sm text-gray-700">
                        This draft review has already been resolved by the team.
                      </div>
                    </section>
                  ) : (
                    <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-3">
                        Submit Community Review
                      </div>
                      <div className="space-y-4">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs uppercase font-bold text-gray-600">Your name</span>
                          <input
                            value={reviewerName}
                            onChange={(event) => setReviewerName(event.target.value)}
                            className="border-2 border-black px-3 py-2 text-sm"
                            placeholder="Optional"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs uppercase font-bold text-gray-600">
                            Your connection to this work
                          </span>
                          <input
                            value={reviewerConnection}
                            onChange={(event) => setReviewerConnection(event.target.value)}
                            className="border-2 border-black px-3 py-2 text-sm"
                            placeholder="e.g. local partner, participant, community elder"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs uppercase font-bold text-gray-600">
                            Recommendation
                          </span>
                          <select
                            value={recommendation}
                            onChange={(event) =>
                              setRecommendation(
                                event.target.value as
                                  | 'endorse'
                                  | 'request_changes'
                                  | 'raise_concern'
                              )
                            }
                            className="border-2 border-black px-3 py-2 text-sm"
                          >
                            <option value="endorse">Endorse as ready</option>
                            <option value="request_changes">Request changes</option>
                            <option value="raise_concern">Raise concern</option>
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs uppercase font-bold text-gray-600">
                            Review note
                          </span>
                          <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            rows={6}
                            className="border-2 border-black px-3 py-2 text-sm"
                            placeholder="Explain what should change, what is strong, or what should be addressed before submission."
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void submitReview()}
                          disabled={submitting || detail.closed}
                          className="inline-flex items-center gap-2 px-4 py-3 bg-[#0f766e] text-white font-black border-2 border-black hover:bg-[#115e59] disabled:opacity-60"
                        >
                          <Send className="w-4 h-4" />
                          {submitting ? 'Submitting…' : 'Submit Community Review'}
                        </button>
                        <div className="text-xs text-gray-600">
                          This feedback informs the draft review queue. It does not auto-approve the
                          application.
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {responseCount > 0 && (
                <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                    Community Review History
                  </div>
                  <div className="space-y-3">
                    {(detail.responseHistory || []).slice().reverse().map((entry, index) => (
                      <div key={`${entry.respondedAt || 'response'}-${index}`} className="border border-gray-200 bg-[#f8fafc] p-3">
                        <div className="text-sm font-black text-black">
                          {recommendationLabel(entry.recommendation)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {entry.reviewerName || 'Community reviewer'}
                          {entry.reviewerConnection ? ` • ${entry.reviewerConnection}` : ''}
                          {' • '}
                          {formatDate(entry.respondedAt)}
                        </div>
                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                          {entry.note || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
