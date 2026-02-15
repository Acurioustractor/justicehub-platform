import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { PortfolioScoreCard, ConsentIndicator } from '@/components/alma';

// Define types inline to avoid supabase type issues
type Intervention = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  consent_level: string | null;
  cultural_authority: string | null;
  metadata: any;
  source_url?: string | null;
  organization_name?: string | null;
};

type Evidence = {
  id: string;
  evidence_type: string | null;
  created_at: string;
  metadata: any;
  source_url?: string | null;
};

type Outcome = {
  id: string;
  outcome_type: string | null;
  metadata: any;
};

type Context = {
  id: string;
  context_type: string | null;
  metadata: any;
};

type Provenance = {
  mode: 'authoritative' | 'computed';
  summary: string;
  generated_at: string;
};

interface InterventionDetailProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';

function getRequestBaseUrl(): string {
  const requestHeaders = headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') || 'http';
  if (host) {
    return `${protocol}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

async function getInterventionDetail(id: string): Promise<{
  intervention: Intervention;
  evidence: Evidence[];
  outcomes: Outcome[];
  contexts: Context[];
  similarInterventions: Intervention[];
  portfolioScore: Record<string, unknown>;
  provenance: Provenance | null;
} | null> {
  const response = await fetch(
    `${getRequestBaseUrl()}/api/intelligence/interventions/${encodeURIComponent(id)}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  if (!payload?.success || !payload?.intervention) {
    return null;
  }

  return {
    intervention: payload.intervention as Intervention,
    evidence: (payload.evidence || []) as Evidence[],
    outcomes: (payload.outcomes || []) as Outcome[],
    contexts: (payload.contexts || []) as Context[],
    similarInterventions: (payload.similarInterventions || []) as Intervention[],
    portfolioScore: (payload.portfolioScore || {}) as Record<string, unknown>,
    provenance: (payload.provenance || null) as Provenance | null,
  };
}

export default async function InterventionDetailPage({ params }: InterventionDetailProps) {
  const detail = await getInterventionDetail(params.id);
  if (!detail) {
    notFound();
  }

  const { intervention, evidence, outcomes, contexts, similarInterventions, portfolioScore, provenance } = detail;

  const metadata = intervention.metadata as any;
  const isCommunityControlled = intervention.consent_level === 'Community Controlled';

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <section className="border-b-2 border-black bg-white">
        <div className="container-justice py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/intelligence" className="text-gray-600 hover:text-black font-medium transition-colors">
              Intelligence Hub
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/intelligence/interventions" className="text-gray-600 hover:text-black font-medium transition-colors">
              Interventions
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-black font-bold">{intervention.name}</span>
          </nav>
        </div>
      </section>

      {/* Header */}
      <section className="border-b-2 border-black bg-white">
        <div className="container-justice py-12">
          <div className="max-w-5xl">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
              {intervention.name}
            </h1>

            {intervention.organization_name && (
              <p className="text-xl text-gray-700 mb-6">
                Delivered by: <span className="font-bold text-black">{intervention.organization_name}</span>
              </p>
            )}

            <div className="flex items-center space-x-4 mb-6">
              <ConsentIndicator
                consentLevel={intervention.consent_level}
                culturalAuthority={intervention.cultural_authority}
                showAuthority
              />
            </div>
            {provenance && (
              <div className="mb-6 inline-flex items-center gap-2 border border-black bg-white px-3 py-1 text-xs">
                <span className={`font-bold uppercase ${provenance.mode === 'authoritative' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {provenance.mode}
                </span>
                <span className="text-gray-700">{provenance.summary}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase text-xs tracking-wider">
                {intervention.type}
              </span>
              {metadata?.state && (
                <span className="inline-flex items-center px-4 py-2 border-2 border-black bg-white text-black font-bold uppercase text-xs tracking-wider">
                  {metadata.state}
                </span>
              )}
              {metadata?.target_cohort && (
                <span className="inline-flex items-center px-4 py-2 border-2 border-black bg-ochre-100 text-black font-bold uppercase text-xs tracking-wider">
                  {metadata.target_cohort}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container-justice">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="border-2 border-black p-8 bg-white">
                <h2 className="text-2xl font-bold text-black mb-6 uppercase tracking-wider">
                  About This Intervention
                </h2>
                <div className="prose prose-lg max-w-none text-gray-800">
                  {intervention.description || 'No description available.'}
                </div>
              </div>

              {/* Evidence */}
              {evidence.length > 0 && (
                <div className="border-2 border-black p-8 bg-white">
                  <h2 className="text-2xl font-bold text-black mb-6 uppercase tracking-wider">
                    Evidence Base ({evidence.length})
                  </h2>
                  <div className="space-y-6">
                    {evidence.map((item: Evidence) => {
                      const evidenceMetadata = item.metadata as any;
                      return (
                        <div key={item.id} className="border-l-4 border-eucalyptus-600 pl-6 py-2">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-black text-lg uppercase tracking-wider">
                              {item.evidence_type}
                            </h3>
                            <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {evidenceMetadata?.findings && (
                            <p className="text-gray-700 mb-3 leading-relaxed">
                              <span className="font-bold text-black">Findings:</span> {evidenceMetadata.findings}
                            </p>
                          )}
                          {evidenceMetadata?.methodology && (
                            <p className="text-gray-700 mb-3 leading-relaxed">
                              <span className="font-bold text-black">Methodology:</span> {evidenceMetadata.methodology}
                            </p>
                          )}
                          {evidenceMetadata?.sample_size && (
                            <p className="text-gray-700 mb-3 leading-relaxed">
                              <span className="font-bold text-black">Sample Size:</span> {evidenceMetadata.sample_size}
                            </p>
                          )}
                          {item.source_url && (
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 text-sm font-bold text-black hover:text-accent transition-colors uppercase tracking-wider"
                            >
                              View source →
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Outcomes */}
              {outcomes.length > 0 && (
                <div className="border-2 border-black p-8 bg-white">
                  <h2 className="text-2xl font-bold text-black mb-6 uppercase tracking-wider">
                    Tracked Outcomes ({outcomes.length})
                  </h2>
                  <div className="space-y-6">
                    {outcomes.map((item: Outcome) => {
                      const outcomeMetadata = item.metadata as any;
                      return (
                        <div key={item.id} className="border-l-4 border-ochre-600 pl-6 py-2">
                          <h3 className="font-bold text-black text-lg mb-3 uppercase tracking-wider">
                            {item.outcome_type}
                          </h3>
                          {outcomeMetadata?.description && (
                            <p className="text-gray-700 mb-3 leading-relaxed">
                              {outcomeMetadata.description}
                            </p>
                          )}
                          {outcomeMetadata?.measurement_method && (
                            <p className="text-gray-700 leading-relaxed">
                              <span className="font-bold text-black">Measured by:</span> {outcomeMetadata.measurement_method}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contexts */}
              {contexts.length > 0 && (
                <div className="border-2 border-black p-8 bg-white">
                  <h2 className="text-2xl font-bold text-black mb-6 uppercase tracking-wider">
                    Place-Based Contexts ({contexts.length})
                  </h2>
                  <div className="space-y-6">
                    {contexts.map((item: Context) => {
                      const contextMetadata = item.metadata as any;
                      return (
                        <div key={item.id} className="border-l-4 border-sand-600 pl-6 py-2">
                          <h3 className="font-bold text-black text-lg mb-3 uppercase tracking-wider">
                            {item.context_type}
                          </h3>
                          {contextMetadata?.description && (
                            <p className="text-gray-700 mb-3 leading-relaxed">
                              {contextMetadata.description}
                            </p>
                          )}
                          {contextMetadata?.location && (
                            <p className="text-gray-700 leading-relaxed">
                              <span className="font-bold text-black">Location:</span> {contextMetadata.location}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Source Documents */}
              {intervention.source_url && (
                <div className="border-2 border-black p-8 bg-white">
                  <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wider">
                    Source Documents
                  </h2>
                  <a
                    href={intervention.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center font-bold text-black hover:text-accent transition-colors uppercase tracking-wider"
                  >
                    <span>View original source</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-8 max-h-[calc(100vh-7rem)] overflow-y-auto">
                {/* Portfolio Score */}
                <PortfolioScoreCard score={portfolioScore as any} />

                {/* Revenue Share (Community Controlled only) */}
                {isCommunityControlled && (
                  <div className="border-2 border-black bg-ochre-50 p-6">
                  <h3 className="text-xl font-bold text-black mb-4 uppercase tracking-wider">
                    Revenue Sharing
                  </h3>
                  <p className="text-sm text-gray-800 mb-6 leading-relaxed">
                    This program is Community Controlled. Revenue from grants citing this intervention flows back to the community.
                  </p>
                  <div className="border-2 border-black bg-white p-4">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-gray-200">
                      <span className="text-sm font-bold text-black uppercase tracking-wider">Cultural Authority:</span>
                      <span className="font-bold text-black">
                        {intervention.cultural_authority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-black uppercase tracking-wider">Revenue Share:</span>
                      <span className="text-xl font-bold text-ochre-700">30%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Similar Interventions */}
              {similarInterventions.length > 0 && (
                <div className="border-2 border-black bg-white p-6">
                  <h3 className="text-xl font-bold text-black mb-6 uppercase tracking-wider">
                    Similar Programs
                  </h3>
                  <div className="space-y-4">
                    {similarInterventions.map((similar) => (
                      <Link
                        key={similar.id}
                        href={`/intelligence/interventions/${similar.id}`}
                        className="block p-4 border-2 border-gray-300 hover:border-black hover:bg-gray-50 transition-all"
                      >
                        <h4 className="font-bold text-black mb-2">
                          {similar.name}
                        </h4>
                        <p className="text-sm text-gray-700 font-medium">
                          {similar.type}
                          {(similar.metadata as any)?.state && (
                            <span className="ml-2">
                              • {(similar.metadata as any).state}
                            </span>
                          )}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
