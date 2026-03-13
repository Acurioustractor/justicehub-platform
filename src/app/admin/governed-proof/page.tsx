import Link from 'next/link';
import { ArrowLeft, Database, MapPinned, ShieldCheck, Layers3, ExternalLink, Terminal, Workflow, Clock3 } from 'lucide-react';
import { requireAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { createGovernedProofService } from '@/lib/governed-proof/service';
import ReviewPendingActions from './ReviewPendingActions';

type GovernedProofPageProps = {
  searchParams?: {
    placeKey?: string;
  };
};

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function confidenceTone(value: number | null | undefined): string {
  if (value == null) return 'text-gray-500';
  if (value >= 0.9) return 'text-emerald-700';
  if (value >= 0.75) return 'text-amber-700';
  return 'text-red-700';
}

function formatCurrency(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: value >= 1000000 ? 1 : 0,
    notation: value >= 1000000 ? 'compact' : 'standard',
  }).format(value);
}

function formatPercent(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

export default async function GovernedProofPage({ searchParams }: GovernedProofPageProps) {
  await requireAdmin('/admin/governed-proof');

  const serviceClient = createServiceClient() as any;
  const governedProofService = createGovernedProofService();

  const { data: recentPlaceBundles } = await serviceClient
    .from('governed_proof_bundles')
    .select(
      'id, bundle_key, subject_id, lifecycle_status, review_status, promotion_status, overall_confidence, capital_confidence, evidence_confidence, voice_confidence, governance_confidence, output_context, created_at, updated_at'
    )
    .eq('subject_type', 'place')
    .order('created_at', { ascending: false })
    .limit(12);

  const { data: recentPlaceTasks } = await serviceClient
    .from('governed_proof_tasks')
    .select(
      'id, target_id, status, review_status, promotion_status, created_at, completed_at, last_error'
    )
    .eq('target_type', 'place')
    .order('created_at', { ascending: false })
    .limit(10);

  const densitySummary = await governedProofService.listDensitySummary();
  const hotLaneTasks = await governedProofService.listHotLaneTasks();

  const selectedPlaceKey =
    (searchParams?.placeKey && /^\d{4}$/.test(searchParams.placeKey) ? searchParams.placeKey : null) ||
    recentPlaceBundles?.[0]?.subject_id ||
    '0870';

  const selectedBundle = await governedProofService.getBundleByKey(`place:${selectedPlaceKey}`);
  const selectedBundleRecords = selectedBundle
    ? await governedProofService.listBundleRecords(selectedBundle.id)
    : [];

  const recordBreakdown = selectedBundleRecords.reduce<Record<string, number>>((acc, record) => {
    const key = `${record.recordSystem}:${record.recordType}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const placeDensity = densitySummary.filter((row) => row.subjectType === 'place');
  const totalPlaceBundles = recentPlaceBundles?.length || 0;
  const actionableBundles = (recentPlaceBundles ?? [])
    .filter((bundle: any) => {
      const confidence = Number(bundle.overall_confidence ?? 0);
      return bundle.review_status === 'pending' || confidence < 0.75;
    })
    .map((bundle: any) => ({
      placeKey: String(bundle.subject_id),
      lifecycleStatus: String(bundle.lifecycle_status),
      reviewStatus: String(bundle.review_status),
      overallConfidence: Number(bundle.overall_confidence ?? 0),
    }));
  const selectedSummary =
    (selectedBundle?.outputContext?.summary as Record<string, unknown> | undefined) || {};
  const selectedProofPack =
    (selectedBundle?.outputContext?.proofPack as Record<string, unknown> | undefined) || {};
  const selectedCapitalContext = (selectedBundle?.capitalContext || {}) as Record<string, unknown>;
  const selectedVoiceContext = (selectedBundle?.voiceContext || {}) as Record<string, unknown>;
  const selectedFundingSummaries = Array.isArray(selectedCapitalContext.fundingSummaries)
    ? selectedCapitalContext.fundingSummaries
    : [];
  const selectedEntitySamples = Array.isArray(selectedCapitalContext.entitySamples)
    ? selectedCapitalContext.entitySamples
    : [];
  const selectedLinkedOrganizations = Array.isArray(selectedVoiceContext.linkedOrganizations)
    ? selectedVoiceContext.linkedOrganizations
    : [];
  const selectedStories = Array.isArray(selectedVoiceContext.stories)
    ? selectedVoiceContext.stories
    : [];
  const selectedStorytellers = Array.isArray(selectedVoiceContext.storytellers)
    ? selectedVoiceContext.storytellers
    : [];
  const fundingSnapshot =
    (selectedProofPack.fundingSnapshot as Record<string, unknown> | undefined) || {};
  const evidenceSnapshot =
    (selectedProofPack.evidenceSnapshot as Record<string, unknown> | undefined) || {};
  const voiceSnapshot =
    (selectedProofPack.voiceSnapshot as Record<string, unknown> | undefined) || {};
  const strengths = Array.isArray(selectedProofPack.strengths) ? selectedProofPack.strengths : [];
  const gaps = Array.isArray(selectedProofPack.gaps) ? selectedProofPack.gaps : [];
  const dominantThemes = Array.isArray(voiceSnapshot.dominantThemes) ? voiceSnapshot.dominantThemes : [];
  const sampleStoryTitles = Array.isArray(voiceSnapshot.sampleStoryTitles) ? voiceSnapshot.sampleStoryTitles : [];
  const topOrganizationNames = Array.isArray(evidenceSnapshot.topOrganizationNames)
    ? evidenceSnapshot.topOrganizationNames
    : [];

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      <div className="container-justice py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-black mb-6 font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border-2 border-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700 mb-4">
                <Workflow className="h-3.5 w-3.5" />
                Governed Proof
              </div>
              <h1 className="text-4xl font-black text-black mb-2">Place Bundle Control Room</h1>
              <p className="text-lg text-gray-700 max-w-3xl">
                Review the live proof graph joining GrantScope capital context, JusticeHub evidence,
                and Empathy Ledger voice under shared governance rules.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={`/api/admin/governed-proof/place-bundles?placeKey=${selectedPlaceKey}`}
                className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black bg-white font-bold hover:bg-gray-100 transition-colors"
              >
                View API Payload
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href={`/admin/governed-proof/${selectedPlaceKey}/brief`}
                className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black bg-amber-50 font-bold hover:bg-amber-100 transition-colors"
              >
                Internal Brief
                <ExternalLink className="h-4 w-4" />
              </Link>
              {selectedBundle && ['partner', 'public'].includes(selectedBundle.promotionStatus) ? (
                <Link
                  href={`/for-funders/proof/${selectedPlaceKey}`}
                  className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black bg-emerald-50 font-bold hover:bg-emerald-100 transition-colors"
                >
                  Funder View
                  <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}
              <div className="inline-flex items-center gap-2 px-4 py-3 border-2 border-black bg-emerald-50 text-emerald-700 font-mono text-sm">
                <Terminal className="h-4 w-4" />
                DOTENV_CONFIG_PATH=.env.local node --require dotenv/config scripts/governed-proof/run-place-bundle.mjs {selectedPlaceKey}
              </div>
            </div>
          </div>
        </section>

        <ReviewPendingActions bundles={actionableBundles} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center gap-3 mb-3">
              <MapPinned className="h-6 w-6 text-emerald-600" />
              <span className="text-sm font-bold uppercase tracking-wide text-gray-600">Place Bundles</span>
            </div>
            <div className="text-4xl font-black text-black">{totalPlaceBundles}</div>
            <p className="text-sm text-gray-600 mt-2">Recent place bundles currently stored in the control plane.</p>
          </div>

          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center gap-3 mb-3">
              <Layers3 className="h-6 w-6 text-cyan-600" />
              <span className="text-sm font-bold uppercase tracking-wide text-gray-600">Selected Place</span>
            </div>
            <div className="text-4xl font-black text-black">{selectedPlaceKey}</div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedBundle ? selectedBundle.lifecycleStatus : 'No bundle yet'} with {selectedBundleRecords.length} attached records.
            </p>
          </div>

          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="h-6 w-6 text-violet-600" />
              <span className="text-sm font-bold uppercase tracking-wide text-gray-600">Confidence</span>
            </div>
            <div className={`text-4xl font-black ${confidenceTone(selectedBundle?.overallConfidence ?? null)}`}>
              {selectedBundle ? selectedBundle.overallConfidence.toFixed(2) : 'N/A'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Capital {selectedBundle?.capitalConfidence?.toFixed(2) ?? 'N/A'} · Evidence {selectedBundle?.evidenceConfidence?.toFixed(2) ?? 'N/A'} · Voice {selectedBundle?.voiceConfidence?.toFixed(2) ?? 'N/A'}
            </p>
          </div>

          <div className="bg-white border-2 border-black p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock3 className="h-6 w-6 text-amber-600" />
              <span className="text-sm font-bold uppercase tracking-wide text-gray-600">Hot Lane</span>
            </div>
            <div className="text-4xl font-black text-black">{hotLaneTasks.length}</div>
            <p className="text-sm text-gray-600 mt-2">Flagship governed-proof tasks waiting in the shared priority lane.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8 mb-8">
          <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-black">Selected Bundle</h2>
                <p className="text-sm text-gray-600">Live detail for the selected place bundle.</p>
              </div>
              {selectedBundle && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 border-2 border-black bg-emerald-50 text-emerald-700 text-xs font-bold uppercase">
                    {selectedBundle.lifecycleStatus}
                  </span>
                  <span className="px-3 py-1 border-2 border-black bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                    {selectedBundle.promotionStatus}
                  </span>
                </div>
              )}
            </div>

            {selectedBundle ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Entities</div>
                    <div className="text-3xl font-black text-black">{String(selectedSummary.entityCount ?? 0)}</div>
                  </div>
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Voice Orgs</div>
                    <div className="text-3xl font-black text-black">{String(selectedSummary.linkedVoiceOrganizationCount ?? 0)}</div>
                  </div>
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Stories</div>
                    <div className="text-3xl font-black text-black">{String(selectedSummary.publishableStoryCount ?? 0)}</div>
                  </div>
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Storytellers</div>
                    <div className="text-3xl font-black text-black">{String(selectedSummary.storytellerCount ?? 0)}</div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="border-2 border-black p-5">
                    <h3 className="text-lg font-black mb-3">Output Summary</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>Bundle key: <span className="font-mono text-black">{selectedBundle.bundleKey}</span></div>
                      <div>Created: <span className="font-medium text-black">{formatTimestamp(selectedBundle.createdAt)}</span></div>
                      <div>Updated: <span className="font-medium text-black">{formatTimestamp(selectedBundle.updatedAt)}</span></div>
                      <div>Last validated: <span className="font-medium text-black">{formatTimestamp(selectedBundle.lastValidatedAt)}</span></div>
                      <div>Fresh until: <span className="font-medium text-black">{formatTimestamp(selectedBundle.freshnessAt)}</span></div>
                    </div>
                  </div>

                  <div className="border-2 border-black p-5">
                    <h3 className="text-lg font-black mb-3">Record Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(recordBreakdown).length > 0 ? (
                        Object.entries(recordBreakdown).map(([key, count]) => (
                          <div key={key} className="flex items-center justify-between text-sm border-b border-dashed border-gray-300 pb-2">
                            <span className="font-mono text-gray-700">{key}</span>
                            <span className="font-bold text-black">{count}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No attached records yet.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="border-2 border-black p-5 bg-amber-50 lg:col-span-2">
                    <h3 className="text-lg font-black mb-3">Proof Pack</h3>
                    <p className="text-base font-medium text-black mb-4">
                      {typeof selectedProofPack.headline === 'string'
                        ? selectedProofPack.headline
                        : `Postcode ${selectedPlaceKey} bundle summary is not available yet.`}
                    </p>
                    <div className="grid lg:grid-cols-3 gap-4 text-sm text-gray-700">
                      <div className="border-2 border-black bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Capital</div>
                        <div className="font-medium text-black mb-2">
                          {typeof selectedProofPack.capitalStory === 'string'
                            ? selectedProofPack.capitalStory
                            : 'Capital context is still being assembled.'}
                        </div>
                        <div>Total funding: <span className="font-bold text-black">{formatCurrency(fundingSnapshot.totalFunding)}</span></div>
                        <div>Community-controlled share: <span className="font-bold text-black">{formatPercent(fundingSnapshot.communityControlledShare)}</span></div>
                        <div>Remoteness: <span className="font-bold text-black">{typeof fundingSnapshot.remoteness === 'string' ? fundingSnapshot.remoteness : 'N/A'}</span></div>
                      </div>
                      <div className="border-2 border-black bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Evidence</div>
                        <div className="font-medium text-black mb-2">
                          {typeof selectedProofPack.evidenceStory === 'string'
                            ? selectedProofPack.evidenceStory
                            : 'Evidence context is still being assembled.'}
                        </div>
                        <div>Organizations: <span className="font-bold text-black">{String(evidenceSnapshot.organizationCount ?? selectedSummary.organizationCount ?? 0)}</span></div>
                        <div>Interventions: <span className="font-bold text-black">{String(evidenceSnapshot.interventionCount ?? selectedSummary.interventionCount ?? 0)}</span></div>
                        {topOrganizationNames.length > 0 ? (
                          <div className="mt-2 text-xs text-gray-600">
                            {topOrganizationNames.slice(0, 3).join(' · ')}
                          </div>
                        ) : null}
                      </div>
                      <div className="border-2 border-black bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Voice</div>
                        <div className="font-medium text-black mb-2">
                          {typeof selectedProofPack.voiceStory === 'string'
                            ? selectedProofPack.voiceStory
                            : 'Voice context is still being assembled.'}
                        </div>
                        <div>Publishable stories: <span className="font-bold text-black">{String(voiceSnapshot.publishableStoryCount ?? selectedSummary.publishableStoryCount ?? 0)}</span></div>
                        <div>Storytellers: <span className="font-bold text-black">{String(voiceSnapshot.storytellerCount ?? selectedSummary.storytellerCount ?? 0)}</span></div>
                        {dominantThemes.length > 0 ? (
                          <div className="mt-2 text-xs text-gray-600">
                            Themes: {dominantThemes.join(' · ')}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-4 mt-4">
                      <div className="border-2 border-black bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">Strengths</div>
                        {strengths.length > 0 ? (
                          <div className="space-y-2 text-sm text-gray-700">
                            {strengths.map((strength) => (
                              <div key={String(strength)}>• {String(strength)}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No strengths captured yet.</div>
                        )}
                      </div>
                      <div className="border-2 border-black bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-red-700 mb-2">Gaps</div>
                        {gaps.length > 0 ? (
                          <div className="space-y-2 text-sm text-gray-700">
                            {gaps.map((gap) => (
                              <div key={String(gap)}>• {String(gap)}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No gaps flagged in this bundle.</div>
                        )}
                      </div>
                    </div>
                    {sampleStoryTitles.length > 0 ? (
                      <div className="mt-4 text-sm text-gray-700">
                        <span className="font-bold text-black">Sample stories:</span> {sampleStoryTitles.join(' · ')}
                      </div>
                    ) : null}
                  </div>

                  <div className="border-2 border-black p-5 bg-emerald-50">
                    <h3 className="text-lg font-black mb-3">Capital Layer</h3>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div>Funding summaries: <span className="font-bold text-black">{selectedFundingSummaries.length}</span></div>
                      <div>Entity samples: <span className="font-bold text-black">{selectedEntitySamples.length}</span></div>
                    </div>
                  </div>
                  <div className="border-2 border-black p-5 bg-cyan-50">
                    <h3 className="text-lg font-black mb-3">Evidence Layer</h3>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div>Organizations: <span className="font-bold text-black">{String(selectedSummary.organizationCount ?? evidenceSnapshot.organizationCount ?? 0)}</span></div>
                      <div>Interventions: <span className="font-bold text-black">{String(selectedSummary.interventionCount ?? evidenceSnapshot.interventionCount ?? 0)}</span></div>
                      <div>Readiness: <span className="font-bold text-black">{typeof selectedProofPack.readiness === 'string' ? selectedProofPack.readiness : 'N/A'}</span></div>
                    </div>
                  </div>
                  <div className="border-2 border-black p-5 bg-violet-50">
                    <h3 className="text-lg font-black mb-3">Voice Layer</h3>
                    <div className="text-sm text-gray-700 space-y-2">
                      <div>Linked organizations: <span className="font-bold text-black">{selectedLinkedOrganizations.length}</span></div>
                      <div>Publishable stories: <span className="font-bold text-black">{selectedStories.length}</span></div>
                      <div>Storytellers: <span className="font-bold text-black">{selectedStorytellers.length}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 p-10 text-center text-gray-500">
                No bundle stored yet for {selectedPlaceKey}.
              </div>
            )}
          </section>

          <div className="space-y-8">
            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
              <h2 className="text-2xl font-black text-black mb-4">Recent Place Bundles</h2>
              <div className="space-y-3">
                {(recentPlaceBundles || []).map((bundle: any) => (
                  <Link
                    key={bundle.id}
                    href={`/admin/governed-proof?placeKey=${bundle.subject_id}`}
                    className={`block border-2 border-black p-4 transition-colors hover:bg-gray-100 ${
                      bundle.subject_id === selectedPlaceKey ? 'bg-black text-white' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-lg font-black">{bundle.subject_id}</div>
                        <div className={`text-xs uppercase tracking-wide ${bundle.subject_id === selectedPlaceKey ? 'text-gray-300' : 'text-gray-500'}`}>
                          {bundle.lifecycle_status} · {bundle.review_status}
                        </div>
                      </div>
                      <div className={`text-2xl font-black ${bundle.subject_id === selectedPlaceKey ? 'text-white' : confidenceTone(Number(bundle.overall_confidence))}`}>
                        {Number(bundle.overall_confidence).toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
              <h2 className="text-2xl font-black text-black mb-4">Density Summary</h2>
              <div className="space-y-3">
                {placeDensity.length > 0 ? (
                  placeDensity.map((row) => (
                    <div key={`${row.subjectType}:${row.lifecycleStatus}:${row.promotionStatus}`} className="border-2 border-black p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-black text-black">{row.lifecycleStatus}</div>
                        <div className="text-sm font-bold uppercase text-gray-600">{row.promotionStatus}</div>
                      </div>
                      <div className="text-sm text-gray-700">
                        {row.bundleCount} bundles · avg confidence {row.avgConfidence?.toFixed(2) ?? 'N/A'} · {row.freshCount} fresh
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No density rows yet.</div>
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
              <h2 className="text-2xl font-black text-black mb-4">Recent Tasks</h2>
              <div className="space-y-3">
                {(recentPlaceTasks || []).map((task: any) => (
                  <div key={task.id} className="border-2 border-black p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-black text-black">{task.target_id}</div>
                      <div className="text-xs font-bold uppercase tracking-wide text-gray-600">{task.status}</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {formatTimestamp(task.created_at)}
                    </div>
                    {task.last_error ? (
                      <div className="text-xs text-red-700 mt-2">{task.last_error}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
