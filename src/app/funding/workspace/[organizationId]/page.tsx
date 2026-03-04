import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  FileText,
  Handshake,
  Target,
} from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { FundingOrganizationSupportEditor } from '@/components/funding/funding-organization-support-editor';
import { getFundingOrganizationWorkspaceDetail } from '@/lib/funding/funding-operating-system';

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

export default async function FundingOrganizationWorkspacePage({
  params,
}: {
  params: { organizationId: string };
}) {
  const workspace = await getFundingOrganizationWorkspaceDetail(params.organizationId);

  if (!workspace) {
    notFound();
  }

  const completionCount = workspace.profileChecklist.filter((item) => item.complete).length;
  const incompleteChecklist = workspace.profileChecklist.filter((item) => !item.complete);
  const primaryMatch = workspace.topMatches[0] || null;
  const supportFrames = [
    workspace.firstNationsLed ? 'Lead with cultural authority and local community leadership.' : null,
    workspace.livedExperienceLed
      ? 'Center lived-experience leadership as core delivery credibility.'
      : null,
    workspace.communityTrustScore >= 75
      ? 'Use existing community trust as a visible support-letter and partnership advantage.'
      : 'Add stronger partner endorsement and participant backing before submission.',
  ].filter(Boolean) as string[];
  const businessSupportNeeds = [
    workspace.deliveryConfidenceScore < 70
      ? `Strengthen delivery confidence (${workspace.deliveryConfidenceScore}) with clearer program scope, staffing, or operational backing.`
      : null,
    workspace.complianceReadinessScore < 70
      ? `Lift compliance readiness (${workspace.complianceReadinessScore}) before treating this as fully submission-ready.`
      : null,
    workspace.evidenceMaturityScore < 70
      ? `Tighten the evidence case (${workspace.evidenceMaturityScore}) with stronger outcomes, proof points, and measurable commitments.`
      : null,
    !workspace.sharedWorkspace?.note
      ? 'Add a shared business support note so support letters, partnership asks, and grant framing are held in one place.'
      : null,
    workspace.applications.length === 0 && primaryMatch
      ? 'Turn the strongest live match into a draft so support material and business-readiness work become concrete.'
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href={`/funding/discovery/${workspace.organizationId}`}
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Organization
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <BriefcaseBusiness className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">
                    {workspace.organization?.name || 'Organization Funding Workspace'}
                  </h1>
                  <p className="text-base text-gray-600">
                    Shared working surface for readiness, application context, and community-backed funding progression.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 text-[11px] font-black border border-black ${scoreClass(workspace.fundingReadinessScore)}`}>
                  Readiness {workspace.fundingReadinessScore}
                </span>
                <span className={`px-2 py-1 text-[11px] font-black border border-black ${scoreClass(workspace.communityTrustScore)}`}>
                  Trust {workspace.communityTrustScore}
                </span>
                <span className="px-2 py-1 text-[11px] font-black border border-black bg-white">
                  Checklist {completionCount}/{workspace.profileChecklist.length}
                </span>
                {workspace.inSharedShortlist && (
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                    Shared cohort #{workspace.sharedShortlistPosition}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Live Matches</div>
                <div className="text-3xl font-black text-black">{workspace.topMatches.length}</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Applications</div>
                <div className="text-3xl font-black text-black">{workspace.applications.length}</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Commitments</div>
                <div className="text-3xl font-black text-black">{workspace.commitments.length}</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Community Review</div>
                <div className="text-lg font-black text-black">
                  {workspace.sharedWorkspace?.decisionTag
                    ? String(workspace.sharedWorkspace.decisionTag).replace(/_/g, ' ')
                    : 'Open'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 space-y-6">
              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#0f766e]" />
                  <h2 className="text-xl font-black text-black">Submission Readiness Checklist</h2>
                </div>
                <div className="space-y-3">
                  {workspace.profileChecklist.map((item) => (
                    <div
                      key={item.key}
                      className={`border p-3 ${checklistClass(item.complete)}`}
                    >
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
                  <h2 className="text-xl font-black text-black">Funding Pipeline In Progress</h2>
                </div>
                <div className="space-y-3">
                  {workspace.applications.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No live application record yet. The strongest current match is still sitting before the application-writing stage.
                    </div>
                  ) : (
                    workspace.applications.map((application) => (
                      <div key={application.id} className="border border-gray-200 bg-[#f8fafc] p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-sm font-black text-black">
                            {application.opportunity?.name || 'Funding opportunity'}
                          </div>
                          <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                            {application.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {[application.opportunity?.funder_name, formatDate(application.opportunity?.deadline)]
                            .filter(Boolean)
                            .join(' • ')}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] mt-3">
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Requested</div>
                            <div className="font-black text-black">
                              {formatCurrency(application.amountRequested)}
                            </div>
                          </div>
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Awarded</div>
                            <div className="font-black text-black">
                              {formatCurrency(application.amountAwarded)}
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2">
                          Submitted {formatDate(application.submittedAt)} • Updated {formatDate(application.updatedAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <Handshake className="w-5 h-5 text-[#7c3aed]" />
                  <h2 className="text-xl font-black text-black">Shared Review and Community Signal</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">Shared Working Note</div>
                    <div className="text-sm text-gray-700">
                      {workspace.sharedWorkspace?.note ||
                        'No shared working note yet. This is the gap where support letters, proposal framing, and team context should start to accumulate.'}
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">Review State</div>
                    <div className="text-sm text-gray-700">
                      {workspace.sharedWorkspace?.decisionTag
                        ? `Current shared decision: ${String(workspace.sharedWorkspace.decisionTag).replace(/_/g, ' ')}`
                        : 'No explicit shared decision tag yet.'}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-2">
                      Last reviewed {formatDate(workspace.sharedWorkspace?.lastReviewedAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <BriefcaseBusiness className="w-5 h-5 text-[#0f766e]" />
                  <h2 className="text-xl font-black text-black">Business Support and Growth Needs</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">Operating Readiness</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="border border-gray-200 bg-white p-2">
                        <div className="font-bold text-gray-500">Delivery</div>
                        <div className="font-black text-black">{workspace.deliveryConfidenceScore}</div>
                      </div>
                      <div className="border border-gray-200 bg-white p-2">
                        <div className="font-bold text-gray-500">Compliance</div>
                        <div className="font-black text-black">{workspace.complianceReadinessScore}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-600 mt-3">
                      {workspace.applications.length > 0
                        ? 'A live application path already exists, so the work is tightening readiness and execution support.'
                        : 'No live application yet, so operational readiness and draft support should move together.'}
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-[#f8fafc] p-4">
                    <div className="text-xs uppercase font-bold text-gray-600 mb-2">Support Framing</div>
                    <div className="space-y-2">
                      {supportFrames.length === 0 ? (
                        <div className="text-sm text-gray-600">
                          No obvious support framing yet. Add clearer partnership and community support context.
                        </div>
                      ) : (
                        supportFrames.map((item) => (
                          <div key={item} className="text-sm text-gray-700">
                            {item}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 bg-[#f8fafc] p-4">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-3">Priority Support Needs</div>
                  <div className="space-y-2">
                    {(businessSupportNeeds.length > 0 ? businessSupportNeeds : incompleteChecklist.map((item) => item.detail))
                      .slice(0, 4)
                      .map((need) => (
                        <div key={need} className="border border-amber-200 bg-amber-50 p-3 text-sm text-gray-800">
                          {need}
                        </div>
                      ))}
                  </div>
                  <div className="flex flex-col gap-2 mt-4 sm:flex-row">
                    <Link
                      href={`/admin/funding/os/discovery-workspace?organizationIds=${workspace.organizationId}`}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white text-black text-xs font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                    >
                      Add Shared Support Note
                    </Link>
                    {primaryMatch && (
                      <Link
                        href={`/funding/workspace/${workspace.organizationId}/applications/${primaryMatch.id}`}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold border-2 border-black hover:bg-gray-800 transition-colors"
                      >
                        Build Funding Draft
                      </Link>
                    )}
                  </div>
                </div>
                <FundingOrganizationSupportEditor
                  organizationId={workspace.organizationId}
                  initialNote={workspace.sharedWorkspace?.note || null}
                />
              </div>

              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#9a3412]" />
                  <h2 className="text-xl font-black text-black">Outcome and Evidence Commitments</h2>
                </div>
                <div className="space-y-3">
                  {workspace.commitments.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No outcome commitments yet. This is where impact measurement needs to become explicit before or as funding moves live.
                    </div>
                  ) : (
                    workspace.commitments.map((c) => {
                      const commitment = c as any;
                      return (
                      <div key={commitment.id} className="border border-gray-200 bg-[#f8fafc] p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-sm font-black text-black">
                            {commitment.outcomeDefinition?.name || 'Community outcome'}
                          </div>
                          <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                            {commitment.commitment_status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {commitment.award?.award_status || 'Award context'} • due{' '}
                          {formatDate(commitment.target_date || commitment.award?.community_report_due_at)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] mt-3">
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Baseline</div>
                            <div className="font-black text-black">{commitment.baseline_value ?? '—'}</div>
                          </div>
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Current</div>
                            <div className="font-black text-black">{commitment.current_value ?? '—'}</div>
                          </div>
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Target</div>
                            <div className="font-black text-black">{commitment.target_value ?? '—'}</div>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2">
                          Latest validations {commitment.latestUpdateValidationCount}
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <div className="space-y-6">
              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <CircleAlert className="w-5 h-5 text-[#b45309]" />
                  <h2 className="text-xl font-black text-black">Immediate Next Actions</h2>
                </div>
                <div className="space-y-3">
                  {workspace.nextActions.length === 0 ? (
                    <div className="text-sm text-gray-700">
                      This organization is structurally ready. The next work is moving the strongest application forward and keeping community review current.
                    </div>
                  ) : (
                    workspace.nextActions.map((action, index) => (
                      <div key={action} className="border border-amber-200 bg-amber-50 p-3">
                        <div className="text-sm text-gray-800">{action}</div>
                        {index === workspace.nextActions.length - 1 && workspace.topMatches[0] && (
                          <Link
                            href={`/funding/workspace/${workspace.organizationId}/applications/${workspace.topMatches[0].id}`}
                            className="inline-flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-black text-white text-xs font-bold border-2 border-black hover:bg-gray-800 transition-colors"
                          >
                            Start Application Draft
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-xl font-black text-black mb-4">Current Match Signals</h2>
                <div className="space-y-3">
                  {workspace.topMatches.length === 0 ? (
                    <div className="text-sm text-gray-500">No current matches yet.</div>
                  ) : (
                    workspace.topMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className="border border-gray-200 bg-[#f8fafc] p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-sm font-black text-black">
                            {match.opportunity?.name || 'Funding opportunity'}
                          </div>
                          <span className={`px-2 py-1 text-[10px] font-black border border-black ${scoreClass(match.matchScore)}`}>
                            {match.matchScore}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {[match.opportunity?.funder_name, match.status].filter(Boolean).join(' • ')}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2">
                          Deadline {formatDate(match.opportunity?.deadline)} • Max{' '}
                          {formatCurrency(match.opportunity?.max_grant_amount)}
                        </div>
                        <Link
                          href={`/funding/workspace/${workspace.organizationId}/applications/${match.id}`}
                          className="inline-flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-white text-black text-xs font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                        >
                          Open Draft Workspace
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-xl font-black text-black mb-4">Working Links</h2>
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/funding/discovery/${workspace.organizationId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0f766e] text-white font-bold border-2 border-black hover:bg-[#115e59] transition-colors"
                  >
                    Open Discovery Detail
                  </Link>
                  {workspace.topMatches[0] && (
                    <Link
                      href={`/funding/workspace/${workspace.organizationId}/applications/${workspace.topMatches[0].id}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1d4ed8] text-white font-bold border-2 border-black hover:bg-[#1e40af] transition-colors"
                    >
                      Start Best-Match Draft
                    </Link>
                  )}
                  <Link
                    href={`/admin/funding/os/discovery-workspace?organizationIds=${workspace.organizationId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    Open Shared Review Workspace
                  </Link>
                  <Link
                    href={`/admin/funding/os/pipeline?organizationId=${workspace.organizationId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    Open Pipeline Context
                  </Link>
                  <Link
                    href={`/admin/funding/os/community-reporting?organizationId=${workspace.organizationId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                  >
                    Open Community Reporting
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
