import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Newspaper, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function getSentimentEmoji(sentiment: string | null) {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return '✅';
    case 'negative':
      return '❌';
    case 'neutral':
      return '⚖️';
    case 'mixed':
      return '🔄';
    default:
      return '📰';
  }
}

function getSentimentIcon(sentiment: string | null) {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return TrendingUp;
    case 'negative':
      return TrendingDown;
    default:
      return Minus;
  }
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => Boolean(item))
      .map(([key]) => key);
  }

  return [];
}

export default async function MediaArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch media article details
  const { data: article, error } = await supabase
    .from('alma_media_articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !article) {
    notFound();
  }

  const SentimentIcon = getSentimentIcon(article.sentiment);
  const sentimentEmoji = getSentimentEmoji(article.sentiment);
  const interventionMentions = toStringList(article.intervention_mentions);
  const communityMentions = toStringList(article.community_mentions);
  const governmentMentions = toStringList(article.government_mentions);
  const indexedAt = article.updated_at || article.created_at;

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
            Back to Media Intelligence Studio
          </Link>

          {/* Source & Sentiment */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-black text-white text-sm font-bold inline-flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              {article.source_name}
            </span>
            {article.sentiment && (
              <span
                className={`px-3 py-1 border-2 border-black text-sm font-bold inline-flex items-center gap-2 ${
                  article.sentiment.toLowerCase() === 'positive'
                    ? 'bg-green-100'
                    : article.sentiment.toLowerCase() === 'negative'
                    ? 'bg-red-100'
                    : 'bg-gray-100'
                }`}
              >
                <SentimentIcon className="w-4 h-4" />
                {sentimentEmoji} {article.sentiment}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4">{article.headline}</h1>

          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-all mb-6"
            >
              <ExternalLink className="w-4 h-4" />
              READ FULL ARTICLE
            </a>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {article.published_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold mb-1">Published</div>
                  <div className="text-sm">
                    {new Date(article.published_date).toLocaleDateString('en-AU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Article Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary */}
            {article.summary && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Summary</h2>
                <p className="text-lg leading-relaxed">{article.summary}</p>
              </div>
            )}

            {/* Key Quotes */}
            {article.key_quotes && article.key_quotes.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Key Quotes</h2>
                <div className="space-y-4">
                  {article.key_quotes.map((quote: string, idx: number) => (
                    <blockquote key={idx} className="border-l-4 border-black pl-4 italic">
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* Full Text */}
            {article.full_text && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Full Text Excerpt</h2>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {article.full_text.slice(0, 1600)}
                  {article.full_text.length > 1600 ? '…' : ''}
                </p>
              </div>
            )}

            {/* Related Programs/Interventions */}
            {interventionMentions.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Mentioned Programs</h2>
                <div className="text-sm">
                  This article mentions {interventionMentions.length} intervention(s)
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Topics */}
            {article.topics && article.topics.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {article.topics.slice(0, 10).map((topic: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 border-2 border-black text-xs font-bold"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Community Mentions */}
            {communityMentions.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Community Mentions</h3>
                <div className="flex flex-wrap gap-2">
                  {communityMentions.map((mention: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 border-2 border-black text-xs font-bold"
                    >
                      {mention}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Government Mentions */}
            {governmentMentions.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Government Mentions</h3>
                <div className="space-y-2 text-sm">
                  {governmentMentions.map((mention: string, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-50 border border-black">
                      {mention}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Source */}
            <div className="border-2 border-black p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-bold">Source Type</div>
                  <div>News Media</div>
                </div>
                {indexedAt && (
                  <div>
                    <div className="font-bold">Indexed</div>
                    <div>
                      {new Date(indexedAt).toLocaleDateString('en-AU')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
