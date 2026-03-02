'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';

interface ConversationRequestDetail {
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

export default function FundingConversationRequestPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const [taskId, setTaskId] = useState('');
  const [detail, setDetail] = useState<ConversationRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [responderName, setResponderName] = useState('');
  const [responderEmail, setResponderEmail] = useState('');
  const [responseKind, setResponseKind] = useState<'interested' | 'needs_more_info' | 'not_now'>(
    'interested'
  );
  const [responseMessage, setResponseMessage] = useState('');
  const [noticeResponderName, setNoticeResponderName] = useState('');
  const [noticeResponderEmail, setNoticeResponderEmail] = useState('');
  const [noticeResponseMessage, setNoticeResponseMessage] = useState('');
  const [submittingNoticeResponse, setSubmittingNoticeResponse] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const resolved = await params;
      if (cancelled) return;
      setTaskId(resolved.taskId);
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/funding/conversations/${taskId}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load conversation request');
        }

        if (!cancelled) {
          setDetail(payload.data || null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load conversation request'
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

  const responseAlreadySubmitted = Boolean(detail?.respondedAt);
  const closed = detail?.status === 'completed';
  const relationshipNoticeReplyOpen =
    Boolean(detail?.relationshipNoticeLabel) &&
    detail?.relationshipNoticeRequestResponse === true &&
    !detail?.relationshipNoticeRespondedAt;

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice max-w-4xl">
          <Link
            href="/funding/discovery"
            className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discovery
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-black">Conversation Response</h1>
              <p className="text-base text-gray-600">
                Respond directly to a funding conversation request so the team can continue the match.
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
              Loading conversation request…
            </div>
          ) : !detail ? (
            <div className="border-2 border-black bg-white p-6 text-sm text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              This conversation request could not be found.
            </div>
          ) : (
            <div className="space-y-6">
              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h2 className="text-2xl font-black text-black">{detail.title}</h2>
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-white">
                    {detail.status}
                  </span>
                  {closed && (
                    <span className="px-2 py-1 text-[11px] font-black border border-black bg-rose-100 text-rose-800">
                      Closed
                    </span>
                  )}
                  {responseAlreadySubmitted && (
                    <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                      Response received
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {[detail.organizationName, detail.funderName].filter(Boolean).join(' • ') ||
                    'Funding conversation'}
                </div>
                {detail.description && (
                  <div className="text-sm text-gray-700 mt-3">{detail.description}</div>
                )}
              </section>

              {detail.brief && (
                <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                    Why The Team Reached Out
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {detail.brief}
                  </pre>
                </section>
              )}

              {responseAlreadySubmitted && (
                <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                    Recorded Response
                  </div>
                  <div className="text-sm font-black text-black mb-1">
                    {(detail.responseKind || 'response').replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    {detail.responderName || 'Anonymous responder'}
                    {detail.responderEmail ? ` • ${detail.responderEmail}` : ''}
                    {' • '}
                    {formatDate(detail.respondedAt)}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {detail.responseMessage || '—'}
                  </div>
                </section>
              )}

              {detail.nextStepLabel && (
                <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                    What Happens Next
                  </div>
                  <div className="text-sm font-black text-black">{detail.nextStepLabel}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Scheduled {formatDate(detail.nextStepScheduledAt)}
                  </div>
                </section>
              )}

              {detail.outcomeLabel && (
                <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">Outcome</div>
                  <div className="text-sm font-black text-black">{detail.outcomeLabel}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Recorded {formatDate(detail.outcomeRecordedAt)}
                  </div>
                  {detail.outcomeFollowUpLabel && (
                    <div className="mt-3 border border-gray-200 bg-[#f8fafc] p-3">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-1">
                        Operational Follow-up
                      </div>
                      <div className="text-sm font-black text-black">
                        {detail.outcomeFollowUpLabel}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {detail.relationshipNoticeLabel && (
                <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="text-xs uppercase font-bold text-gray-600">
                      Relationship Update
                    </div>
                    <span className="px-2 py-1 text-[11px] font-black border border-black bg-amber-100 text-amber-900">
                      Relationship updated
                    </span>
                  </div>
                  <div className="text-sm font-black text-black">
                    {detail.relationshipNoticeLabel}
                  </div>
                  {detail.relationshipNoticeMessage && (
                    <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                      {detail.relationshipNoticeMessage}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-1">
                    Recorded {formatDate(detail.relationshipNoticeRecordedAt)}
                  </div>

                  {detail.relationshipNoticeResponsePrompt && (
                    <div className="mt-4 border border-gray-200 bg-[#f8fafc] p-4">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                        Reply Requested
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {detail.relationshipNoticeResponsePrompt}
                      </div>
                    </div>
                  )}

                  {detail.relationshipNoticeRespondedAt && (
                    <div className="mt-4 border border-gray-200 bg-[#eef4ff] p-4">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                        Recorded Relationship Reply
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {detail.relationshipNoticeResponderName || 'Community responder'}
                        {detail.relationshipNoticeResponderEmail
                          ? ` • ${detail.relationshipNoticeResponderEmail}`
                          : ''}
                        {' • '}
                        {formatDate(detail.relationshipNoticeRespondedAt)}
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {detail.relationshipNoticeResponseMessage || '—'}
                      </div>
                    </div>
                  )}

                  {relationshipNoticeReplyOpen && (
                    <div className="mt-4 border border-gray-200 bg-white p-4">
                      <div className="text-xs uppercase font-bold text-gray-600 mb-3">
                        Reply To This Relationship Update
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <label className="block">
                          <div className="text-xs font-bold text-gray-600 mb-2">Your name</div>
                          <input
                            value={noticeResponderName}
                            onChange={(event) => setNoticeResponderName(event.target.value)}
                            className="w-full px-3 py-3 border-2 border-black bg-white text-sm"
                            placeholder="Name"
                          />
                        </label>
                        <label className="block">
                          <div className="text-xs font-bold text-gray-600 mb-2">Email</div>
                          <input
                            value={noticeResponderEmail}
                            onChange={(event) => setNoticeResponderEmail(event.target.value)}
                            className="w-full px-3 py-3 border-2 border-black bg-white text-sm"
                            placeholder="Email"
                          />
                        </label>
                      </div>

                      <label className="block mb-4">
                        <div className="text-xs font-bold text-gray-600 mb-2">Reply</div>
                        <textarea
                          value={noticeResponseMessage}
                          onChange={(event) => setNoticeResponseMessage(event.target.value)}
                          className="w-full px-3 py-3 border-2 border-black bg-white text-sm min-h-[140px]"
                          placeholder="Add any context, clarification, or questions about this relationship update."
                        />
                      </label>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setSubmittingNoticeResponse(true);
                            setError(null);
                            setSuccess(null);

                            const response = await fetch(`/api/funding/conversations/${detail.taskId}`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                mode: 'relationship_notice_response',
                                responderName: noticeResponderName,
                                responderEmail: noticeResponderEmail,
                                responseMessage: noticeResponseMessage,
                              }),
                            });
                            const payload = await response.json().catch(() => ({}));

                            if (!response.ok) {
                              throw new Error(
                                payload.error || 'Failed to send relationship update reply'
                              );
                            }

                            setSuccess(
                              'Your reply to this relationship update has been recorded and sent back to the team.'
                            );
                            setDetail((current) =>
                              current
                                ? {
                                    ...current,
                                    relationshipNoticeResponseStatus:
                                      payload.responseStatus || 'received',
                                    relationshipNoticeResponseMessage: payload.responseMessage,
                                    relationshipNoticeResponderName: payload.responderName,
                                    relationshipNoticeResponderEmail: payload.responderEmail,
                                    relationshipNoticeRespondedAt: payload.respondedAt,
                                  }
                                : current
                            );
                            setNoticeResponseMessage('');
                          } catch (submitError) {
                            setError(
                              submitError instanceof Error
                                ? submitError.message
                                : 'Failed to send relationship update reply'
                            );
                          } finally {
                            setSubmittingNoticeResponse(false);
                          }
                        }}
                        disabled={submittingNoticeResponse || !noticeResponseMessage.trim()}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-[#0f766e] text-white border-2 border-black font-black hover:opacity-90 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        {submittingNoticeResponse ? 'Sending…' : 'Send Relationship Reply'}
                      </button>
                    </div>
                  )}
                </section>
              )}

              {!closed && (
                <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">
                    Send Your Response
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <label className="block">
                      <div className="text-xs font-bold text-gray-600 mb-2">Your name</div>
                      <input
                        value={responderName}
                        onChange={(event) => setResponderName(event.target.value)}
                        className="w-full px-3 py-3 border-2 border-black bg-white text-sm"
                        placeholder="Name"
                      />
                    </label>
                    <label className="block">
                      <div className="text-xs font-bold text-gray-600 mb-2">Email</div>
                      <input
                        value={responderEmail}
                        onChange={(event) => setResponderEmail(event.target.value)}
                        className="w-full px-3 py-3 border-2 border-black bg-white text-sm"
                        placeholder="Email"
                      />
                    </label>
                  </div>

                  <label className="block mb-4">
                    <div className="text-xs font-bold text-gray-600 mb-2">How should the team read this response?</div>
                    <select
                      value={responseKind}
                      onChange={(event) =>
                        setResponseKind(
                          event.target.value as 'interested' | 'needs_more_info' | 'not_now'
                        )
                      }
                      className="w-full px-3 py-3 border-2 border-black bg-white text-sm"
                    >
                      <option value="interested">Interested</option>
                      <option value="needs_more_info">Need more information</option>
                      <option value="not_now">Not now</option>
                    </select>
                  </label>

                  <label className="block mb-4">
                    <div className="text-xs font-bold text-gray-600 mb-2">Response</div>
                    <textarea
                      value={responseMessage}
                      onChange={(event) => setResponseMessage(event.target.value)}
                      className="w-full px-3 py-3 border-2 border-black bg-white text-sm min-h-[160px]"
                      placeholder="Share your interest, questions, timing, or any concerns."
                    />
                  </label>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setSubmitting(true);
                        setError(null);
                        setSuccess(null);

                        const response = await fetch(`/api/funding/conversations/${detail.taskId}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            responderName,
                            responderEmail,
                            responseKind,
                            responseMessage,
                          }),
                        });
                        const payload = await response.json().catch(() => ({}));

                        if (!response.ok) {
                          throw new Error(payload.error || 'Failed to send response');
                        }

                        setSuccess('Your response has been recorded and sent back to the team.');
                        setDetail((current) =>
                          current
                            ? {
                                ...current,
                                status:
                                  current.status === 'queued' || current.status === 'pending'
                                    ? 'running'
                                    : current.status,
                                responseKind: payload.responseKind,
                                responseMessage: payload.responseMessage,
                                responderName: payload.responderName,
                                responderEmail: payload.responderEmail,
                                respondedAt: payload.respondedAt,
                              }
                            : current
                        );
                      } catch (submitError) {
                        setError(
                          submitError instanceof Error
                            ? submitError.message
                            : 'Failed to send response'
                        );
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting || !responseMessage.trim()}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-[#0f766e] text-white border-2 border-black font-black hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Sending…' : 'Send Response'}
                  </button>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
