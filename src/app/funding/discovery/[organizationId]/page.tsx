import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, ShieldCheck, Target } from 'lucide-react';
import { Navigation } from '@/components/ui/navigation';
import { FundingDiscoveryPipelineHandoff } from '@/components/funding/funding-discovery-pipeline-handoff';
import {
  FundingDiscoveryShortlistButton,
  FundingDiscoveryShortlistLink,
} from '@/components/funding/funding-discovery-shortlist';
import { getFundingDiscoveryOrganizationDetail } from '@/lib/funding/funding-operating-system';

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

export default async function FundingDiscoveryOrganizationPage({
  params,
}: {
  params: { organizationId: string };
}) {
  const detail = await getFundingDiscoveryOrganizationDetail(params.organizationId);
  if (!detail) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f5f6f2] page-content">
      <Navigation />

      <div className="pt-8 pb-16">
        <div className="container-justice">
          <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/funding/discovery"
                className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-white border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Discovery
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center bg-[#0f766e] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black">
                    {detail.organization?.name || 'Community Organization'}
                  </h1>
                  <p className="text-base text-gray-600">
                    {[detail.organization?.type, detail.organization?.city, detail.organization?.state]
                      .filter(Boolean)
                      .join(' • ') || 'Capability profile'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.firstNationsLed && (
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#fff7ed] text-[#9a3412]">
                    First Nations led
                  </span>
                )}
                {detail.livedExperienceLed && (
                  <span className="px-2 py-1 text-[11px] font-black border border-black bg-[#eef4ff] text-[#1d4ed8]">
                    Lived experience led
                  </span>
                )}
                <span className={`px-2 py-1 text-[11px] font-black border border-black ${scoreClass(detail.communityTrustScore)}`}>
                  Trust {detail.communityTrustScore}
                </span>
                <span className={`px-2 py-1 text-[11px] font-black border border-black ${scoreClass(detail.fundingReadinessScore)}`}>
                  Readiness {detail.fundingReadinessScore}
                </span>
              </div>
            </div>

            <div className="space-y-3 lg:w-[340px]">
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/funding/workspace/${detail.organizationId}`}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 transition-colors"
                >
                  Open Funding Workspace
                </Link>
                <FundingDiscoveryShortlistButton organizationId={detail.organizationId} />
                <FundingDiscoveryShortlistLink />
                <FundingDiscoveryPipelineHandoff
                  recommendationId={detail.topMatches[0]?.recommendationId}
                  organizationId={detail.organizationId}
                  opportunityId={detail.topMatches[0]?.id}
                  organizationName={detail.organization?.name}
                  opportunityName={detail.topMatches[0]?.opportunity?.name}
                  funderName={detail.topMatches[0]?.opportunity?.funder_name}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Top Matches</div>
                <div className="text-3xl font-black text-black">{detail.topMatches.length}</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Recent Awards</div>
                <div className="text-3xl font-black text-black">{detail.recentAwards.length}</div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Gov Ready</div>
                <div className="text-lg font-black text-[#0f766e]">
                  {detail.canManageGovernmentContracts ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs uppercase font-bold text-gray-600 mb-1">Community Reporting</div>
                <div className="text-3xl font-black text-black">
                  {detail.reportingToCommunityScore}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#0f766e]" />
                <h2 className="text-xl font-black text-black">Capability and Readiness</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 text-[11px]">
                <div className="border border-gray-200 bg-gray-50 p-3">
                  <div className="font-bold text-gray-600">Funding readiness</div>
                  <div className="text-lg font-black text-black">{detail.fundingReadinessScore}</div>
                </div>
                <div className="border border-gray-200 bg-gray-50 p-3">
                  <div className="font-bold text-gray-600">Compliance</div>
                  <div className="text-lg font-black text-black">{detail.complianceReadinessScore}</div>
                </div>
                <div className="border border-gray-200 bg-gray-50 p-3">
                  <div className="font-bold text-gray-600">Delivery</div>
                  <div className="text-lg font-black text-black">{detail.deliveryConfidenceScore}</div>
                </div>
                <div className="border border-gray-200 bg-gray-50 p-3">
                  <div className="font-bold text-gray-600">Community trust</div>
                  <div className="text-lg font-black text-black">{detail.communityTrustScore}</div>
                </div>
                <div className="border border-gray-200 bg-gray-50 p-3">
                  <div className="font-bold text-gray-600">Evidence</div>
                  <div className="text-lg font-black text-black">{detail.evidenceMaturityScore}</div>
                </div>
                <div className="border border-gray-200 bg-gray-50 p-3">
                  <div className="font-bold text-gray-600">Updated</div>
                  <div className="text-sm font-black text-black">{formatDate(detail.updatedAt)}</div>
                </div>
              </div>

              <div className="mb-5">
                <div className="text-xs uppercase font-bold text-gray-600 mb-2">Capability Tags</div>
                <div className="flex flex-wrap gap-2">
                  {detail.capabilityTags.length === 0 ? (
                    <span className="text-sm text-gray-500">No capability tags yet.</span>
                  ) : (
                    detail.capabilityTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-[11px] font-bold border border-black bg-white"
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="border border-gray-200 bg-[#f8fafc] p-4">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">Service Geographies</div>
                  <div className="text-sm text-gray-700">
                    {detail.serviceGeographies.join(', ') || 'No service geography signals yet.'}
                  </div>
                </div>
                <div className="border border-gray-200 bg-[#f8fafc] p-4">
                  <div className="text-xs uppercase font-bold text-gray-600 mb-2">Priority Populations</div>
                  <div className="text-sm text-gray-700">
                    {detail.priorityPopulations.join(', ') || 'No priority populations recorded yet.'}
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-200 pt-5">
                <div className="text-xs uppercase font-bold text-gray-600 mb-2">Capability Signals</div>
                <div className="space-y-3">
                  {detail.signals.length === 0 ? (
                    <div className="text-sm text-gray-500">No explicit capability signals recorded yet.</div>
                  ) : (
                    detail.signals.map((signal) => (
                      <div key={signal.id} className="border border-gray-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="text-sm font-black text-black">
                            {signal.signalType.replace(/_/g, ' ')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 text-[10px] font-black border border-black ${scoreClass(signal.signalWeight)}`}>
                              Weight {signal.signalWeight}
                            </span>
                            <span className={`px-2 py-1 text-[10px] font-black border border-black ${scoreClass(signal.signalValue)}`}>
                              Value {signal.signalValue}
                            </span>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {[signal.sourceRecordType, formatDate(signal.updatedAt)]
                            .filter(Boolean)
                            .join(' • ') || 'Capability signal'}
                        </div>
                        {signal.evidenceNote && (
                          <div className="text-xs text-gray-600 mt-2">{signal.evidenceNote}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <div className="space-y-6">
              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-[#1d4ed8]" />
                  <h2 className="text-xl font-black text-black">Current Match Signals</h2>
                </div>
                <div className="space-y-3">
                  {detail.topMatches.length === 0 ? (
                    <div className="text-sm text-gray-500">No current recommendation signals yet.</div>
                  ) : (
                    detail.topMatches.map((match) => (
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
                        <div className="grid grid-cols-3 gap-2 text-[10px] mt-3">
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Readiness</div>
                            <div className="font-black text-black">{match.readinessScore}</div>
                          </div>
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Alignment</div>
                            <div className="font-black text-black">{match.communityAlignmentScore}</div>
                          </div>
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Geography</div>
                            <div className="font-black text-black">{match.geographicFitScore}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-xl font-black text-black mb-4">Recent Award Context</h2>
                <div className="space-y-3">
                  {detail.recentAwards.length === 0 ? (
                    <div className="text-sm text-gray-500">No recent funding awards recorded yet.</div>
                  ) : (
                    detail.recentAwards.map((award) => (
                      <div key={award.id} className="border border-gray-200 bg-[#f8fafc] p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-sm font-black text-black">
                            {award.fundingProgram?.title || 'Funding program'}
                          </div>
                          <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                            {award.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {[award.fundingSource?.name, award.fundingSource?.source_kind]
                            .filter(Boolean)
                            .join(' • ') || 'Funding source'}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] mt-3">
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Awarded</div>
                            <div className="font-black text-black">{formatCurrency(award.awardAmount)}</div>
                          </div>
                          <div className="border border-gray-200 bg-white p-2">
                            <div className="font-bold text-gray-500">Disbursed</div>
                            <div className="font-black text-black">
                              {formatCurrency(award.amountDisbursed)}
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2">
                          Community report due {formatDate(award.communityReportDueAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          {detail.capabilityNotes && (
            <section className="mt-6 bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs uppercase font-bold text-gray-600 mb-2">Capability Notes</div>
              <div className="text-sm text-gray-700">{detail.capabilityNotes}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
