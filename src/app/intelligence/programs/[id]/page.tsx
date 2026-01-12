import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';
import RelatedContent from '@/components/alma/RelatedContent';
import { ArrowLeft, MapPin, Users, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InterventionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch intervention details
  const { data: intervention, error } = await supabase
    .from('alma_interventions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !intervention) {
    notFound();
  }

  // Fetch related content directly from database
  const [articlesData, storiesData, profilesData, evidenceData, mediaData] = await Promise.all([
    // Related articles
    supabase
      .from('article_related_interventions')
      .select(`
        relevance_note,
        articles:article_id (
          id,
          title,
          slug
        )
      `)
      .eq('intervention_id', id),

    // Related stories
    supabase
      .from('story_related_interventions')
      .select(`
        relevance_note,
        stories:story_id (
          id,
          title,
          slug
        )
      `)
      .eq('intervention_id', id),

    // Related profiles
    supabase
      .from('alma_intervention_profiles')
      .select(`
        role,
        notes,
        public_profiles:public_profile_id (
          id,
          first_name,
          last_name,
          slug
        )
      `)
      .eq('intervention_id', id),

    // Related evidence
    supabase
      .from('alma_evidence')
      .select('id, title, source_title')
      .contains('related_interventions', [id]),

    // Media mentions
    supabase
      .from('alma_media_articles')
      .select('id, headline, source_name, article_url')
      .contains('related_programs', [id])
      .limit(10),
  ]);

  const relatedContent = {
    articles: articlesData.data?.map((item: any) => ({
      ...item.articles,
      relevance_note: item.relevance_note,
    })) || [],
    stories: storiesData.data?.map((item: any) => ({
      ...item.stories,
      relevance_note: item.relevance_note,
    })) || [],
    profiles: profilesData.data?.map((item: any) => ({
      ...item.public_profiles,
      role: item.role,
      relevance_note: item.notes,
    })) || [],
    evidence: evidenceData.data || [],
    mediaArticles: mediaData.data || [],
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-black bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link
            href="/stories/intelligence"
            className="inline-flex items-center gap-2 mb-6 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Intelligence Studio
          </Link>

          <div className="mb-4">
            <span className="px-3 py-1 bg-black text-white text-sm font-bold">
              {intervention.type}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4">{intervention.name}</h1>

          <p className="text-xl mb-6">{intervention.description}</p>

          {/* Key Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {intervention.geography && intervention.geography.length > 0 && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold mb-1">Location</div>
                  <div className="text-sm">
                    {intervention.geography.join(', ')}
                  </div>
                </div>
              </div>
            )}

            {intervention.target_cohort && intervention.target_cohort.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold mb-1">Target Population</div>
                  <div className="text-sm">
                    {intervention.target_cohort.join(', ')}
                  </div>
                </div>
              </div>
            )}

            {intervention.years_operating && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold mb-1">Years Operating</div>
                  <div className="text-sm">{intervention.years_operating}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Evidence Level */}
            {intervention.evidence_level && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Evidence Level</h2>
                <div className="text-lg">{intervention.evidence_level}</div>
              </div>
            )}

            {/* Cultural Authority */}
            {intervention.cultural_authority && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Cultural Authority</h2>
                <div className="text-lg">{intervention.cultural_authority}</div>
              </div>
            )}

            {/* Implementation Details */}
            {(intervention.implementation_cost ||
              intervention.cost_per_young_person ||
              intervention.scalability) && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Implementation</h2>
                <div className="space-y-3">
                  {intervention.implementation_cost && (
                    <div>
                      <div className="font-bold">Cost</div>
                      <div>{intervention.implementation_cost}</div>
                    </div>
                  )}
                  {intervention.cost_per_young_person && (
                    <div>
                      <div className="font-bold">Cost per Young Person</div>
                      <div>{intervention.cost_per_young_person}</div>
                    </div>
                  )}
                  {intervention.scalability && (
                    <div>
                      <div className="font-bold">Scalability</div>
                      <div>{intervention.scalability}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Source Documents */}
            {intervention.source_documents && intervention.source_documents.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Source Documents</h2>
                <div className="space-y-2">
                  {intervention.source_documents.map((doc: any, idx: number) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm break-all">{doc.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {(intervention.operating_organization ||
              intervention.contact_person ||
              intervention.website) && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Contact</h3>
                <div className="space-y-3 text-sm">
                  {intervention.operating_organization && (
                    <div>
                      <div className="font-bold">Organization</div>
                      <div>{intervention.operating_organization}</div>
                    </div>
                  )}
                  {intervention.contact_person && (
                    <div>
                      <div className="font-bold">Contact Person</div>
                      <div>{intervention.contact_person}</div>
                    </div>
                  )}
                  {intervention.contact_email && (
                    <div>
                      <div className="font-bold">Email</div>
                      <a
                        href={`mailto:${intervention.contact_email}`}
                        className="hover:underline"
                      >
                        {intervention.contact_email}
                      </a>
                    </div>
                  )}
                  {intervention.contact_phone && (
                    <div>
                      <div className="font-bold">Phone</div>
                      <a
                        href={`tel:${intervention.contact_phone}`}
                        className="hover:underline"
                      >
                        {intervention.contact_phone}
                      </a>
                    </div>
                  )}
                  {intervention.website && (
                    <div>
                      <div className="font-bold">Website</div>
                      <a
                        href={intervention.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline break-all"
                      >
                        {intervention.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Portfolio Signals */}
            {intervention.portfolio_score && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Portfolio Score</h3>
                <div className="text-3xl font-bold">{intervention.portfolio_score}</div>
              </div>
            )}

            {/* Consent & Permissions */}
            <div className="border-2 border-black p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Data Governance</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-bold">Consent Level</div>
                  <div>{intervention.consent_level || 'Public Knowledge Commons'}</div>
                </div>
                {intervention.permitted_uses && intervention.permitted_uses.length > 0 && (
                  <div>
                    <div className="font-bold">Permitted Uses</div>
                    <div>{intervention.permitted_uses.join(', ')}</div>
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
            stories={relatedContent.stories}
            profiles={relatedContent.profiles}
            evidence={relatedContent.evidence}
            mediaArticles={relatedContent.mediaArticles}
            title="Related Content & Evidence"
          />
        </div>
      </div>
    </div>
  );
}
