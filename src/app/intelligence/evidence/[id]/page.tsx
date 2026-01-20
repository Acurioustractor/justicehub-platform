import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';
import RelatedContent from '@/components/alma/RelatedContent';
import { ArrowLeft, FileText, ExternalLink, User, Calendar, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EvidenceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch evidence details (simplified query - author profile join removed)
  const { data: evidence, error } = await supabase
    .from('alma_evidence')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !evidence) {
    console.error('Evidence fetch error:', error);
    notFound();
  }

  // Fetch related content directly from database
  const [articlesData, relatedEvidenceData] = await Promise.all([
    // Related articles
    supabase
      .from('article_related_evidence')
      .select(`
        relevance_note,
        articles:article_id (
          id,
          title,
          slug
        )
      `)
      .eq('evidence_id', id),

    // Related evidence (same intervention)
    supabase
      .from('alma_evidence')
      .select('id, title, source_title, related_interventions')
      .neq('id', id)
      .limit(5),
  ]);

  const relatedContent = {
    articles: articlesData.data?.map((item: any) => ({
      ...item.articles,
      relevance_note: item.relevance_note,
    })) || [],
    author: [],
    evidence: relatedEvidenceData.data || [],
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Header */}
      <div className="border-b-2 border-black bg-white page-content">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link
            href="/intelligence/evidence"
            className="inline-flex items-center gap-2 mb-6 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Evidence Library
          </Link>

          <div className="mb-4">
            <span className="px-3 py-1 bg-black text-white text-sm font-bold">
              {evidence.evidence_type || 'Research Evidence'}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4">{evidence.title}</h1>

          {evidence.description && (
            <p className="text-xl mb-6">{evidence.description}</p>
          )}

          {/* Key Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 mt-1 flex-shrink-0" />
              <div>
                <div className="font-bold mb-1">Source</div>
                <div className="text-sm">{evidence.source_title}</div>
              </div>
            </div>

            {evidence.author && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold mb-1">Author</div>
                  <div className="text-sm">{evidence.author}</div>
                </div>
              </div>
            )}

            {evidence.publication_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold mb-1">Published</div>
                  <div className="text-sm">{new Date(evidence.publication_date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })}</div>
                </div>
              </div>
            )}

            {evidence.organization && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold mb-1">Organization</div>
                  <div className="text-sm">{evidence.organization}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Evidence Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Findings */}
            {evidence.findings && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Key Findings</h2>
                <div className="prose prose-lg max-w-none whitespace-pre-wrap">
                  {evidence.findings}
                </div>
              </div>
            )}

            {/* Key Findings Array (if present) */}
            {evidence.key_findings && evidence.key_findings.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Summary Points</h2>
                <ul className="space-y-3">
                  {evidence.key_findings.map((finding: string, idx: number) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-bold flex-shrink-0">{idx + 1}.</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Methodology */}
            {evidence.methodology && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Methodology</h2>
                <div className="whitespace-pre-wrap">{evidence.methodology}</div>
              </div>
            )}

            {/* Sample Size & Population */}
            {(evidence.sample_size || evidence.population_studied) && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Study Population</h2>
                <div className="space-y-3">
                  {evidence.sample_size && (
                    <div>
                      <div className="font-bold">Sample Size</div>
                      <div>{evidence.sample_size}</div>
                    </div>
                  )}
                  {evidence.population_studied && (
                    <div>
                      <div className="font-bold">Population Studied</div>
                      <div>{evidence.population_studied}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Geographic Context */}
            {evidence.geographic_context && evidence.geographic_context.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Geographic Context</h2>
                <div className="flex flex-wrap gap-2">
                  {evidence.geographic_context.map((location: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 border-2 border-black text-sm font-bold"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Interventions */}
            {evidence.related_interventions && evidence.related_interventions.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Related Interventions</h2>
                <div className="text-sm">
                  This evidence relates to {evidence.related_interventions.length} intervention(s)
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quality & Strength */}
            {(evidence.evidence_quality || evidence.evidence_strength) && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Evidence Quality</h3>
                <div className="space-y-3 text-sm">
                  {evidence.evidence_strength && (
                    <div>
                      <div className="font-bold">Strength</div>
                      <div>{evidence.evidence_strength}</div>
                    </div>
                  )}
                  {evidence.evidence_quality && (
                    <div>
                      <div className="font-bold">Quality Rating</div>
                      <div>{evidence.evidence_quality}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Source Link */}
            {evidence.source_url && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Access Source</h3>
                <a
                  href={evidence.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border-2 border-black hover:bg-black hover:text-white transition-colors text-sm break-all"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  View Original Source
                </a>
              </div>
            )}

            {/* DOI */}
            {evidence.doi && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Citation</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-bold">DOI</div>
                    <a
                      href={`https://doi.org/${evidence.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline break-all"
                    >
                      {evidence.doi}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Consent & Governance */}
            <div className="border-2 border-black p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Data Governance</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-bold">Consent Level</div>
                  <div>{evidence.consent_level || 'Public Knowledge Commons'}</div>
                </div>
                {evidence.cultural_authority && (
                  <div>
                    <div className="font-bold">Cultural Authority</div>
                    <div>{evidence.cultural_authority}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Content Section */}
        <div className="mt-12">
          <RelatedContent
            articles={relatedContent.articles}
            author={relatedContent.author}
            evidence={relatedContent.evidence}
            title="Related Content"
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
