import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, MapPinned, ShieldCheck, Lock } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { createGovernedProofService } from '@/lib/governed-proof/service';
import { createClient } from '@/lib/supabase/server-lite';
import { checkApiFeatureAccess } from '@/lib/org-hub/feature-gates';

type PublicProofPageProps = {
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

export default async function FunderProofPage({ params }: PublicProofPageProps) {
  const { placeKey } = await params;
  if (!/^\d{4}$/.test(placeKey)) {
    notFound();
  }

  const governedProofService = createGovernedProofService();
  const bundle = await governedProofService.getBundleByKey(`place:${placeKey}`);

  if (!bundle || !['partner', 'public'].includes(bundle.promotionStatus)) {
    notFound();
  }

  // Check access — governed proof requires Institution+ tier
  let hasAccess = false;
  try {
    const authClient = await createClient();
    const access = await checkApiFeatureAccess(authClient, 'governed_proof');
    hasAccess = access.allowed;
  } catch {
    // Unauthenticated — show teaser
  }

  const proofPack = (bundle.outputContext?.proofPack || {}) as Record<string, unknown>;

  // Teaser for free users — headline stats only
  if (!hasAccess) {
    const fundingSnapshotTeaser = (proofPack.fundingSnapshot || {}) as Record<string, unknown>;
    return (
      <div className="min-h-screen bg-white text-black">
        <Navigation />
        <main className="pt-40">
          <section className="py-16 border-b-2 border-black">
            <div className="container-justice">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Governed Proof
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
                  Place-Based Report: {placeKey}
                </h1>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="border-2 border-black p-6">
                    <div className="text-3xl font-black">{formatCurrency(fundingSnapshotTeaser.totalFunding)}</div>
                    <div className="text-sm uppercase tracking-wider text-gray-600 mt-1">Total Funding</div>
                  </div>
                  <div className="border-2 border-black p-6">
                    <div className="text-3xl font-black">{fundingSnapshotTeaser.grantCount ?? 'N/A'}</div>
                    <div className="text-sm uppercase tracking-wider text-gray-600 mt-1">Grants</div>
                  </div>
                </div>
                <div className="border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
                  <Lock className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-black mb-2">Full Report Locked</h3>
                  <p className="text-earth-600 mb-6 max-w-md mx-auto">
                    The full place-based proof report — including evidence analysis, community voice themes,
                    strengths, and gaps — requires an Institution plan or above.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-earth-800 transition-colors"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }
  const fundingSnapshot = (proofPack.fundingSnapshot || {}) as Record<string, unknown>;
  const evidenceSnapshot = (proofPack.evidenceSnapshot || {}) as Record<string, unknown>;
  const voiceSnapshot = (proofPack.voiceSnapshot || {}) as Record<string, unknown>;
  const strengths = Array.isArray(proofPack.strengths) ? proofPack.strengths : [];
  const gaps = Array.isArray(proofPack.gaps) ? proofPack.gaps : [];
  const dominantThemes = Array.isArray(voiceSnapshot.dominantThemes) ? voiceSnapshot.dominantThemes : [];

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main className="pt-40">
        <section className="py-16 border-b-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                <ShieldCheck className="h-3.5 w-3.5" />
                Governed Proof
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
                Place Proof:<br />{placeKey}
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                {typeof proofPack.headline === 'string'
                  ? proofPack.headline
                  : `A governed proof summary for postcode ${placeKey}.`}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border-2 border-black p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Capital</div>
                  <div className="text-2xl font-black">{formatCurrency(fundingSnapshot.totalFunding)}</div>
                </div>
                <div className="border-2 border-black p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Evidence</div>
                  <div className="text-2xl font-black">{String(evidenceSnapshot.interventionCount ?? 0)}</div>
                </div>
                <div className="border-2 border-black p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Voice</div>
                  <div className="text-2xl font-black">{String(voiceSnapshot.publishableStoryCount ?? 0)}</div>
                </div>
                <div className="border-2 border-black p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Confidence</div>
                  <div className="text-2xl font-black">{bundle.overallConfidence.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50 border-b-2 border-black">
          <div className="container-justice">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-2 border-black bg-white p-6">
                <MapPinned className="w-6 h-6 mb-4" />
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Capital Layer</div>
                <p className="text-sm text-gray-700 mb-3">
                  {typeof proofPack.capitalStory === 'string' ? proofPack.capitalStory : 'Capital context not available.'}
                </p>
                <div className="text-sm text-gray-700">
                  Community-controlled share: <span className="font-bold text-black">{formatPercent(fundingSnapshot.communityControlledShare)}</span>
                </div>
              </div>
              <div className="border-2 border-black bg-white p-6">
                <CheckCircle2 className="w-6 h-6 mb-4" />
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Evidence Layer</div>
                <p className="text-sm text-gray-700 mb-3">
                  {typeof proofPack.evidenceStory === 'string' ? proofPack.evidenceStory : 'Evidence context not available.'}
                </p>
                <div className="text-sm text-gray-700">
                  Organizations linked: <span className="font-bold text-black">{String(evidenceSnapshot.organizationCount ?? 0)}</span>
                </div>
              </div>
              <div className="border-2 border-black bg-white p-6">
                <ShieldCheck className="w-6 h-6 mb-4" />
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Voice Layer</div>
                <p className="text-sm text-gray-700 mb-3">
                  {typeof proofPack.voiceStory === 'string' ? proofPack.voiceStory : 'Voice context not available.'}
                </p>
                <div className="text-sm text-gray-700">
                  Themes: <span className="font-bold text-black">{dominantThemes.length > 0 ? dominantThemes.join(' · ') : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container-justice grid md:grid-cols-2 gap-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-3">What this place is showing</div>
              <div className="space-y-3 text-sm text-gray-700">
                {strengths.length > 0 ? strengths.map((strength) => (
                  <div key={String(strength)}>• {String(strength)}</div>
                )) : <div>No strengths have been surfaced yet.</div>}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-red-700 mb-3">What still needs work</div>
              <div className="space-y-3 text-sm text-gray-700">
                {gaps.length > 0 ? gaps.map((gap) => (
                  <div key={String(gap)}>• {String(gap)}</div>
                )) : <div>No major gaps are currently flagged.</div>}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-black text-white">
          <div className="container-justice max-w-4xl">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
              Next Step
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Briefing and diligence
            </h2>
            <p className="text-lg text-gray-300 mb-6">
              This proof page is a governed summary, not an extraction layer. For a full
              briefing on place readiness, intervention evidence, and community-controlled
              partnership pathways, request a guided review.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact?source=funders&type=briefing"
                className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors text-center"
              >
                Request Briefing
              </Link>
              <Link
                href="/for-funders"
                className="border-2 border-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors text-center inline-flex items-center justify-center gap-2"
              >
                Back to Funders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
