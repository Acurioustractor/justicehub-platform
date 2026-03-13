import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, MapPinned } from 'lucide-react';
import { requireAdmin } from '@/lib/supabase/admin-lite';
import { createGovernedProofService } from '@/lib/governed-proof/service';
import PrintBriefButton from '../../PrintBriefButton';

type BriefPageProps = {
  params: Promise<{
    placeKey: string;
  }>;
};

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

export default async function GovernedProofBriefPage({ params }: BriefPageProps) {
  await requireAdmin('/admin/governed-proof');

  const { placeKey } = await params;
  if (!/^\d{4}$/.test(placeKey)) {
    notFound();
  }

  const governedProofService = createGovernedProofService();
  const bundle = await governedProofService.getBundleByKey(`place:${placeKey}`);

  if (!bundle) {
    notFound();
  }

  const proofPack = (bundle.outputContext?.proofPack || {}) as Record<string, unknown>;
  const fundingSnapshot = (proofPack.fundingSnapshot || {}) as Record<string, unknown>;
  const evidenceSnapshot = (proofPack.evidenceSnapshot || {}) as Record<string, unknown>;
  const voiceSnapshot = (proofPack.voiceSnapshot || {}) as Record<string, unknown>;
  const strengths = Array.isArray(proofPack.strengths) ? proofPack.strengths : [];
  const gaps = Array.isArray(proofPack.gaps) ? proofPack.gaps : [];
  const dominantThemes = Array.isArray(voiceSnapshot.dominantThemes) ? voiceSnapshot.dominantThemes : [];
  const sampleStoryTitles = Array.isArray(voiceSnapshot.sampleStoryTitles) ? voiceSnapshot.sampleStoryTitles : [];
  const topOrganizationNames = Array.isArray(evidenceSnapshot.topOrganizationNames)
    ? evidenceSnapshot.topOrganizationNames
    : [];

  return (
    <div className="min-h-screen bg-white text-black page-content print:bg-white">
      <main className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-0">
        <div className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/governed-proof?placeKey=${placeKey}`}
              className="inline-flex items-center gap-2 text-gray-700 hover:text-black font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Control Room
            </Link>
          </div>
          <PrintBriefButton />
        </div>

        <section className="border-2 border-black p-8 mb-6">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                <FileText className="h-3.5 w-3.5" />
                Internal Governed Proof Brief
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">
                Place Brief: {placeKey}
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl">
                {typeof proofPack.headline === 'string'
                  ? proofPack.headline
                  : `Governed proof brief for postcode ${placeKey}.`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Lifecycle</div>
              <div className="text-2xl font-black">{bundle.lifecycleStatus}</div>
              <div className="text-sm text-gray-600 mt-1">
                Confidence {bundle.overallConfidence.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="border-2 border-black p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Promotion</div>
              <div className="text-lg font-black">{bundle.promotionStatus}</div>
            </div>
            <div className="border-2 border-black p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Review</div>
              <div className="text-lg font-black">{bundle.reviewStatus}</div>
            </div>
            <div className="border-2 border-black p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Updated</div>
              <div className="font-bold">{formatTimestamp(bundle.updatedAt)}</div>
            </div>
            <div className="border-2 border-black p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Readiness</div>
              <div className="font-bold">
                {typeof proofPack.readiness === 'string' ? proofPack.readiness : 'N/A'}
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="border-2 border-black p-6 bg-amber-50">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Capital</div>
            <div className="text-3xl font-black mb-2">{formatCurrency(fundingSnapshot.totalFunding)}</div>
            <div className="text-sm text-gray-700">
              Community-controlled share: <span className="font-bold text-black">{formatPercent(fundingSnapshot.communityControlledShare)}</span>
            </div>
            <div className="text-sm text-gray-700">
              Remoteness: <span className="font-bold text-black">{typeof fundingSnapshot.remoteness === 'string' ? fundingSnapshot.remoteness : 'N/A'}</span>
            </div>
          </div>
          <div className="border-2 border-black p-6 bg-cyan-50">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Evidence</div>
            <div className="text-3xl font-black mb-2">{String(evidenceSnapshot.interventionCount ?? 0)}</div>
            <div className="text-sm text-gray-700">
              Interventions linked
            </div>
            <div className="text-sm text-gray-700">
              Organizations: <span className="font-bold text-black">{String(evidenceSnapshot.organizationCount ?? 0)}</span>
            </div>
          </div>
          <div className="border-2 border-black p-6 bg-violet-50">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Voice</div>
            <div className="text-3xl font-black mb-2">{String(voiceSnapshot.publishableStoryCount ?? 0)}</div>
            <div className="text-sm text-gray-700">
              Publishable stories
            </div>
            <div className="text-sm text-gray-700">
              Storytellers: <span className="font-bold text-black">{String(voiceSnapshot.storytellerCount ?? 0)}</span>
            </div>
          </div>
        </section>

        <section className="border-2 border-black p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPinned className="h-5 w-5" />
            <h2 className="text-2xl font-black">Proof Narrative</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="border-2 border-black p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Capital Story</div>
              <p>{typeof proofPack.capitalStory === 'string' ? proofPack.capitalStory : 'N/A'}</p>
            </div>
            <div className="border-2 border-black p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Evidence Story</div>
              <p>{typeof proofPack.evidenceStory === 'string' ? proofPack.evidenceStory : 'N/A'}</p>
            </div>
            <div className="border-2 border-black p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Voice Story</div>
              <p>{typeof proofPack.voiceStory === 'string' ? proofPack.voiceStory : 'N/A'}</p>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-black p-6">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-3">Strengths</div>
            <div className="space-y-2 text-sm text-gray-700">
              {strengths.length > 0 ? strengths.map((strength) => (
                <div key={String(strength)}>• {String(strength)}</div>
              )) : <div className="text-gray-500">No strengths captured yet.</div>}
            </div>
          </div>
          <div className="border-2 border-black p-6">
            <div className="text-xs font-bold uppercase tracking-wide text-red-700 mb-3">Gaps</div>
            <div className="space-y-2 text-sm text-gray-700">
              {gaps.length > 0 ? gaps.map((gap) => (
                <div key={String(gap)}>• {String(gap)}</div>
              )) : <div className="text-gray-500">No gaps flagged in this bundle.</div>}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-black p-6">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Evidence Signals</div>
            <div className="space-y-2 text-sm text-gray-700">
              {topOrganizationNames.length > 0 ? topOrganizationNames.map((name) => (
                <div key={String(name)}>• {String(name)}</div>
              )) : <div className="text-gray-500">No organization signals yet.</div>}
            </div>
          </div>
          <div className="border-2 border-black p-6">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Voice Signals</div>
            <div className="space-y-2 text-sm text-gray-700">
              {dominantThemes.length > 0 ? (
                <div><span className="font-bold text-black">Themes:</span> {dominantThemes.join(' · ')}</div>
              ) : null}
              {sampleStoryTitles.length > 0 ? (
                <div><span className="font-bold text-black">Stories:</span> {sampleStoryTitles.join(' · ')}</div>
              ) : <div className="text-gray-500">No publishable stories attached yet.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
