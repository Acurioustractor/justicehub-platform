import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  FilePenLine,
  Handshake,
  MessageSquareQuote,
  Target,
} from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { FundingApplicationDraftEditor } from '@/components/funding/funding-application-draft-editor';
import { getFundingApplicationWorkspaceDraft } from '@/lib/funding/funding-operating-system';

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreClass(score: number) {
  if (score >= 85) return 'bg-emerald-100 text-emerald-800';
  if (score >= 70) return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

function checklistClass(complete: boolean) {
  return complete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200';
}

export default async function FundingApplicationWorkspaceDraftPage({
  params,
}: {
  params: { organizationId: string; opportunityId: string };
}) {
  const draft = await getFundingApplicationWorkspaceDraft(
    params.organizationId,
    params.opportunityId
  );

  if (!draft) {
    notFound();
  }

  const checklistComplete = draft.draftChecklist.filter((item) => item.complete).length;
  const reviewResolution = draft.draftWorkspace?.reviewTask?.resolution || null;
  const reviewFeedback = draft.draftWorkspace?.reviewTask?.reviewFeedback || null;
  const hasRevisionRequest = reviewResolution === 'needs_revision';
  const readyAfterReview = reviewResolution === 'ready_to_submit';

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href={`/funding/workspace/${draft.organizationId}`}
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Funding Workspace
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#1d4ed8] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <FilePenLine className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">Application Draft Workspace</h1>
                  <p className="text-base text-gray-600">
                    Proposal-building surface for {draft.organization?.name || 'this organization'}.
                  </p>
                </div>
              </div>
              <div className="text-lg font-black text-black">{draft.selectedOpportunity.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                {[draft.selectedOpportunity.funder_name, formatDate(draft.selectedOpportunity.deadline)]
                  .filter(Boolean)
                  .join(' • ')}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {draft.selectedMatch && (
                  <span className={`px-2 py-1 text-[11px] font-black border border-black ${scoreClass(draft.selectedMatch.matchScore)}`}>
                    Match {draft.selectedMatch.matchScore}
                  </span>
                )}
                <span className="px-2 py-1 text-[11px] font-black border border-black bg-white">
                  Checklist {checklistComplete}/{draft.draftChecklist.length}
                </span>
                {draft.existingApplication && (
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                    Application {draft.existingApplication.status}
                  </span>
                )}
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

              <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Max Grant</div>
                <div className="text-xl font-black text-black">
                  {formatCurrency(draft.selectedOpportunity.max_grant_amount)}
                </div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Readiness</div>
                <div className="text-xl font-black text-black">
                  {draft.workspace.fundingReadinessScore}
                </div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Trust</div>
                <div className="text-xl font-black text-black">
                  {draft.workspace.communityTrustScore}
                </div>
              </div>
                <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-1">Commitments</div>
                  <div className="text-xl font-black text-black">{draft.workspace.commitments.length}</div>
                </div>
                <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-1">Stored Draft</div>
                  <div className="text-sm font-black text-black">
                    {draft.draftWorkspace?.draftStatus || 'Not started'}
                  </div>
                </div>
                <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-1">Review State</div>
                  <div className="text-sm font-black text-black">
                    {hasRevisionRequest
                      ? 'Revision requested'
                      : readyAfterReview
                        ? 'Ready after review'
                        : draft.draftWorkspace?.reviewTask
                          ? 'Review in progress'
                          : 'No review yet'}
                  </div>
                </div>
              </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 space-y-6">
              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#0f766e]" />
                  <h2 className="text-xl font-black text-black">Draft Readiness Checklist</h2>
                </div>
                <div className="space-y-3">
                  {draft.draftChecklist.map((item) => (
                    <div key={item.key} className={`border p-3 ${checklistClass(item.complete)}`}>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="text-sm font-black text-black">{item.label}</div>
                        <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                          {item.complete ? 'ready' : 'needs work'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-[#1d4ed8]" />
                  <h2 className="text-xl font-black text-black">Grant Fit and Submission Frame</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">Why This Opportunity Fits</div>
                    <div className="text-sm text-gray-700">
                      {draft.selectedMatch
                        ? `This opportunity already scores ${draft.selectedMatch.matchScore} in the matching engine, with readiness ${draft.selectedMatch.readinessScore}, community alignment ${draft.selectedMatch.communityAlignmentScore}, and geography ${draft.selectedMatch.geographicFitScore}.`
                        : 'No explicit match record exists yet. Build the fit case manually before moving forward.'}
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">Current Application State</div>
                    <div className="text-sm text-gray-700">
                      {draft.existingApplication
                        ? `A live application already exists in status ${draft.existingApplication.status}. Use this draft to strengthen the shared narrative and supporting material before advancing it.`
                        : 'There is no live application record yet. Use this workspace to frame the proposal before promoting it into the formal pipeline.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <FilePenLine className="w-5 h-5 text-[#9a3412]" />
                  <h2 className="text-xl font-black text-black">Narrative and Support Material</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">Narrative Prompts</div>
                    <div className="space-y-2">
                      {draft.narrativePrompts.map((prompt) => (
                        <div
                          key={prompt}
                          className="border border-gray-200 bg-white p-3 text-sm text-gray-700"
                        >
                          {prompt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">Support Letter and Evidence Ideas</div>
                    <div className="space-y-2">
                      {draft.supportLetterIdeas.map((idea) => (
                        <div
                          key={idea}
                          className="border border-gray-200 bg-white p-3 text-sm text-gray-700"
                        >
                          {idea}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquareQuote className="w-5 h-5 text-[#7c3aed]" />
                  <h2 className="text-xl font-black text-black">Community Review Before Submission</h2>
                </div>
                <div className="space-y-3">
                  {draft.communityReviewPrompts.map((prompt) => (
                    <div
                      key={prompt}
                      className="border border-gray-200 bg-[#f8fafc] p-3 text-sm text-gray-700"
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

              <FundingApplicationDraftEditor
                organizationId={draft.organizationId}
                opportunityId={draft.selectedOpportunity.id}
                initialDraft={draft.draftWorkspace}
              />
            </section>

            <div className="space-y-6">
              {(hasRevisionRequest || readyAfterReview) && (
                <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        hasRevisionRequest ? 'text-[#b45309]' : 'text-[#0f766e]'
                      }`}
                    />
                    <h2 className="text-xl font-black text-black">Latest Review Outcome</h2>
                  </div>
                  <div
                    className={`border p-4 text-sm ${
                      hasRevisionRequest
                        ? 'border-amber-300 bg-amber-50 text-amber-950'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-950'
                    }`}
                  >
                    <div className="font-black mb-1">
                      {hasRevisionRequest ? 'Returned for revision' : 'Cleared after review'}
                    </div>
                    <div>
                      {reviewFeedback ||
                        (hasRevisionRequest
                          ? 'A review note was recorded, but no explicit feedback text is available.'
                          : 'This draft was marked ready to move forward after review.')}
                    </div>
                  </div>
                </section>
              )}

              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <CircleAlert className="w-5 h-5 text-[#b45309]" />
                  <h2 className="text-xl font-black text-black">Immediate Draft Actions</h2>
                </div>
                <div className="space-y-3">
                  {draft.draftNextActions.length === 0 ? (
                    <div className="text-sm text-gray-700">
                      This draft has the minimum structural ingredients. The next move is turning it into a formal application and collecting final community-backed support.
                    </div>
                  ) : (
                    draft.draftNextActions.map((action) => (
                      <div key={action} className="border border-amber-200 bg-amber-50 p-3 text-sm text-gray-800">
                        {action}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <Handshake className="w-5 h-5 text-[#0f766e]" />
                  <h2 className="text-xl font-black text-black">Working Links</h2>
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/funding/workspace/${draft.organizationId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0f766e] text-white font-bold border-2 border-black hover:bg-[#115e59] transition-colors"
                  >
                    Open Organization Workspace
                  </Link>
                  <Link
                    href={`/funding/discovery/${draft.organizationId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    Open Discovery Detail
                  </Link>
                  <Link
                    href={`/admin/funding/os/discovery-workspace?organizationIds=${draft.organizationId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    Open Shared Review Workspace
                  </Link>
                  <Link
                    href={`/admin/funding/os/application-drafts?organizationId=${draft.organizationId}&opportunityId=${draft.selectedOpportunity.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1d4ed8] text-white font-bold border-2 border-black hover:bg-[#1e40af] transition-colors"
                  >
                    Edit Durable Draft Record
                  </Link>
                  <Link
                    href="/admin/funding/os/application-draft-reviews"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    Open Draft Review Queue
                  </Link>
                  <Link
                    href={`/admin/funding/os/pipeline?organizationId=${draft.organizationId}&opportunityId=${draft.selectedOpportunity.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    Open Pipeline Context
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
