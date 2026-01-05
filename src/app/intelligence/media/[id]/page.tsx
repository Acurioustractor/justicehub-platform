import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Newspaper, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';

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

export default async function MediaArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

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

          {article.article_url && (
            <a
              href={article.article_url}
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

            {article.author && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold mb-1">Author</div>
                  <div className="text-sm">{article.author}</div>
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

            {/* Sentiment Analysis */}
            {article.sentiment_reasoning && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Sentiment Analysis</h2>
                <p className="leading-relaxed">{article.sentiment_reasoning}</p>
              </div>
            )}

            {/* Related Programs/Interventions */}
            {article.related_programs && article.related_programs.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h2 className="text-2xl font-bold mb-4">Mentioned Programs</h2>
                <div className="text-sm">
                  This article mentions {article.related_programs.length} program(s) or intervention(s)
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

            {/* Geographic Focus */}
            {article.geographic_focus && article.geographic_focus.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Geographic Focus</h3>
                <div className="flex flex-wrap gap-2">
                  {article.geographic_focus.map((location: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 border-2 border-black text-xs font-bold"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stakeholders Mentioned */}
            {article.stakeholders_mentioned && article.stakeholders_mentioned.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Stakeholders</h3>
                <div className="space-y-2 text-sm">
                  {article.stakeholders_mentioned.map((stakeholder: string, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-50 border border-black">
                      {stakeholder}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policy Implications */}
            {article.policy_implications && article.policy_implications.length > 0 && (
              <div className="border-2 border-black p-6 bg-white">
                <h3 className="text-xl font-bold mb-4">Policy Implications</h3>
                <ul className="space-y-2 text-sm">
                  {article.policy_implications.map((implication: string, idx: number) => (
                    <li key={idx} className="flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{implication}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Source */}
            <div className="border-2 border-black p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-bold">Source Type</div>
                  <div>{article.source_type || 'News Media'}</div>
                </div>
                {article.scraped_at && (
                  <div>
                    <div className="font-bold">Indexed</div>
                    <div>
                      {new Date(article.scraped_at).toLocaleDateString('en-AU')}
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
