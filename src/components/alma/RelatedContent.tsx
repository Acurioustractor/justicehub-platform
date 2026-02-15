'use client';

import { ExternalLink, FileText, Users, BarChart3, Newspaper } from 'lucide-react';
import Link from 'next/link';

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  relevance_note?: string;
}

interface RelatedStory {
  id: string;
  title: string;
  slug: string;
  relevance_note?: string;
}

interface RelatedProfile {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  role?: string;
  relevance_note?: string;
}

interface RelatedIntervention {
  id: string;
  name: string;
  relevance_note?: string;
}

interface RelatedEvidence {
  id: string;
  title: string;
  source_title: string;
  relevance_note?: string;
}

interface RelatedMediaArticle {
  id: string;
  headline: string;
  source_name: string;
  article_url?: string;
}

interface RelatedContentProps {
  articles?: RelatedArticle[];
  stories?: RelatedStory[];
  profiles?: RelatedProfile[];
  interventions?: RelatedIntervention[];
  evidence?: RelatedEvidence[];
  mediaArticles?: RelatedMediaArticle[];
  title?: string;
}

export default function RelatedContent({
  articles = [],
  stories = [],
  profiles = [],
  interventions = [],
  evidence = [],
  mediaArticles = [],
  title = 'Related Content',
}: RelatedContentProps) {
  const hasContent =
    articles.length > 0 ||
    stories.length > 0 ||
    profiles.length > 0 ||
    interventions.length > 0 ||
    evidence.length > 0 ||
    mediaArticles.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="border-2 border-black bg-white p-8">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="space-y-8">
        {/* Related Articles */}
        {articles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" />
              <h3 className="text-xl font-bold">Articles ({articles.length})</h3>
            </div>
            <div className="space-y-3">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="block p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  <div className="font-bold">{article.title}</div>
                  {article.relevance_note && (
                    <div className="text-sm mt-1 opacity-70">{article.relevance_note}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Interventions */}
        {interventions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" />
              <h3 className="text-xl font-bold">Programs & Interventions ({interventions.length})</h3>
            </div>
            <div className="space-y-3">
              {interventions.map((intervention) => (
                <Link
                  key={intervention.id}
                  href={`/intelligence/programs/${intervention.id}`}
                  className="block p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  <div className="font-bold">{intervention.name}</div>
                  {intervention.relevance_note && (
                    <div className="text-sm mt-1 opacity-70">{intervention.relevance_note}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Evidence */}
        {evidence.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" />
              <h3 className="text-xl font-bold">Research & Evidence ({evidence.length})</h3>
            </div>
            <div className="space-y-3">
              {evidence.map((item) => (
                <Link
                  key={item.id}
                  href={`/intelligence/evidence/${item.id}`}
                  className="block p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  <div className="font-bold">{item.title}</div>
                  <div className="text-sm mt-1">Source: {item.source_title}</div>
                  {item.relevance_note && (
                    <div className="text-sm mt-1 opacity-70">{item.relevance_note}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Stories */}
        {stories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" />
              <h3 className="text-xl font-bold">Stories ({stories.length})</h3>
            </div>
            <div className="space-y-3">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.slug}`}
                  className="block p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  <div className="font-bold">{story.title}</div>
                  {story.relevance_note && (
                    <div className="text-sm mt-1 opacity-70">{story.relevance_note}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Profiles */}
        {profiles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              <h3 className="text-xl font-bold">People ({profiles.length})</h3>
            </div>
            <div className="space-y-3">
              {profiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/profiles/${profile.slug}`}
                  className="block p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  <div className="font-bold">
                    {profile.first_name} {profile.last_name}
                  </div>
                  {profile.role && <div className="text-sm mt-1">Role: {profile.role}</div>}
                  {profile.relevance_note && (
                    <div className="text-sm mt-1 opacity-70">{profile.relevance_note}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Media Articles */}
        {mediaArticles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-5 h-5" />
              <h3 className="text-xl font-bold">Media Coverage ({mediaArticles.length})</h3>
            </div>
            <div className="space-y-3">
              {mediaArticles.map((article) => (
                <div
                  key={article.id}
                  className="block p-4 border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  <div className="font-bold">{article.headline}</div>
                  <div className="text-sm mt-1">Source: {article.source_name}</div>
                  {article.article_url && (
                    <a
                      href={article.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm mt-2 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Read Article
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
