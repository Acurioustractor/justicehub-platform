'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ExternalLink, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SentimentTimeline from '@/components/visualizations/SentimentTimeline';
import TopicBurst from '@/components/visualizations/TopicBurst';

// Type definitions
interface DailySentiment {
  date: string;
  source_name: string;
  article_count: number;
  avg_sentiment: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
}

interface Article {
  id: string;
  headline: string;
  source_name: string;
  published_date: string;
  sentiment: string;
  sentiment_score: number;
  topics: string[];
  key_quotes: string[];
  article_url?: string;
}

interface Program {
  id: string;
  name: string;
  program_type: string;
  state: string;
  budget_aud?: number;
  description?: string;
}

interface TopicData {
  topic: string;
  count: number;
  avgSentiment: number;
}

interface Stats {
  totalArticles: number;
  avgSentiment: number;
  positivePercent: number;
  negativePercent: number;
  communityPrograms: number;
  daysTracked: number;
}

export default function MediaIntelligenceStudio() {
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'programs'>('overview');
  const [dailySentiment, setDailySentiment] = useState<DailySentiment[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]); // Store unfiltered articles
  const [programs, setPrograms] = useState<Program[]>([]);
  const [topicData, setTopicData] = useState<TopicData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    avgSentiment: 0,
    positivePercent: 0,
    negativePercent: 0,
    communityPrograms: 0,
    daysTracked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    }
    checkAuth();
  }, []);

  // Filter states
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Demo data function for when database is empty
  function loadDemoData() {
    console.log('Using demo data');

    // Generate 30 days of demo sentiment data
    const demoSentimentData: DailySentiment[] = [];
    const startDate = new Date('2025-12-02');
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      demoSentimentData.push({
        date: date.toISOString().split('T')[0],
        source_name: 'The Guardian',
        article_count: Math.floor(Math.random() * 5) + 1,
        avg_sentiment: (Math.random() - 0.5) * 0.6, // -0.3 to +0.3
        positive_count: Math.floor(Math.random() * 3),
        negative_count: Math.floor(Math.random() * 3),
        neutral_count: Math.floor(Math.random() * 2),
      });
    }

    // Demo topic data
    const demoTopicData: TopicData[] = [
      { topic: 'Cultural programs', count: 11, avgSentiment: 0.68 },
      { topic: 'Community-led justice', count: 9, avgSentiment: 0.72 },
      { topic: 'Reoffending reduction', count: 8, avgSentiment: 0.75 },
      { topic: 'Detention centers', count: 7, avgSentiment: -0.55 },
      { topic: 'Bail reform', count: 6, avgSentiment: -0.42 },
      { topic: 'Youth justice', count: 12, avgSentiment: 0.15 },
      { topic: 'Indigenous sovereignty', count: 5, avgSentiment: 0.80 },
    ];

    // Demo stats
    const demoStats: Stats = {
      totalArticles: 37,
      avgSentiment: 0.09,
      positivePercent: 43.2,
      negativePercent: 35.1,
      communityPrograms: 24,
      daysTracked: 30,
    };

    setDailySentiment(demoSentimentData);
    setTopicData(demoTopicData);
    setStats(demoStats);
    setRecentArticles([]);
    setPrograms([]);
    setLoading(false);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch daily sentiment data
        const { data: sentimentData, error: sentimentError } = await supabase
          .from('alma_daily_sentiment')
          .select('*')
          .order('date', { ascending: true });

        if (sentimentError) {
          console.error('Supabase error:', sentimentError);
          // Use demo data if database is empty/errored
          loadDemoData();
          return;
        }

        // Fetch recent articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('alma_media_articles')
          .select('*')
          .order('published_date', { ascending: false })
          .limit(20);

        if (articlesError) throw articlesError;

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from('alma_government_programs')
          .select('*')
          .order('created_at', { ascending: false });

        if (programsError) throw programsError;

        // Calculate topic data from articles
        const topicCounts: Record<string, { count: number; totalSentiment: number }> = {};

        articlesData?.forEach((article: any) => {
          article.topics?.forEach((topic: string) => {
            if (!topicCounts[topic]) {
              topicCounts[topic] = { count: 0, totalSentiment: 0 };
            }
            topicCounts[topic].count++;
            topicCounts[topic].totalSentiment += article.sentiment_score || 0;
          });
        });

        const topicBurstData = Object.entries(topicCounts)
          .map(([topic, data]) => ({
            topic,
            count: data.count,
            avgSentiment: data.totalSentiment / data.count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15); // Top 15 topics

        // Calculate stats
        const totalArticles = articlesData?.length || 0;
        const positiveArticles = articlesData?.filter((a: any) => a.sentiment === 'positive').length || 0;
        const negativeArticles = articlesData?.filter((a: any) => a.sentiment === 'negative').length || 0;
        const avgSentiment = totalArticles > 0
          ? articlesData.reduce((sum: number, a: any) => sum + (a.sentiment_score || 0), 0) / totalArticles
          : 0;
        const communityPrograms = programsData?.filter((p: any) => p.program_type === 'community_led').length || 0;
        const uniqueDates = new Set(sentimentData?.map((s: any) => s.date));
        const daysTracked = uniqueDates.size;

        // Transform database data to match component expectations
        const transformedSentiment = (sentimentData || []).map((row: any) => ({
          date: row.date?.split('T')[0] || row.date, // Convert to YYYY-MM-DD
          sourceName: row.source_name,
          articleCount: row.article_count,
          avgSentiment: row.avg_sentiment,
          positiveCount: row.positive_count || 0,
          negativeCount: row.negative_count || 0,
          neutralCount: row.neutral_count || row.mixed_count || 0,
        }));

        setDailySentiment(transformedSentiment);
        setAllArticles(articlesData || []);
        setRecentArticles(articlesData || []);
        setPrograms(programsData || []);
        setTopicData(topicBurstData);
        setStats({
          totalArticles,
          avgSentiment,
          positivePercent: totalArticles > 0 ? (positiveArticles / totalArticles) * 100 : 0,
          negativePercent: totalArticles > 0 ? (negativeArticles / totalArticles) * 100 : 0,
          communityPrograms,
          daysTracked,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter articles based on selected filters
  useEffect(() => {
    let filtered = [...allArticles];

    // Filter by sentiment
    if (selectedSentiment !== 'all') {
      filtered = filtered.filter(article => article.sentiment === selectedSentiment);
    }

    // Filter by topic
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(article =>
        article.topics?.includes(selectedTopic)
      );
    }

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(article => article.source_name === selectedSource);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.key_quotes?.some(quote => quote.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setRecentArticles(filtered);
  }, [selectedSentiment, selectedTopic, selectedSource, searchQuery, allArticles]);

  // Get unique sources and topics for filter dropdowns
  const uniqueSources = [...new Set(allArticles.map(a => a.source_name))].filter(Boolean);
  const allTopics = [...new Set(allArticles.flatMap(a => a.topics || []))].filter(Boolean);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-bold">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md border-2 border-black p-8">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            The ALMA Intelligence Studio is available to authenticated users.
            Please log in to access media sentiment analysis and program insights.
          </p>
          <Link
            href="/login?redirect=/stories/intelligence"
            className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
          >
            Log In to Access
          </Link>
          <div className="mt-4">
            <Link href="/stories" className="text-gray-600 hover:text-black underline text-sm">
              Back to Stories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-bold">Loading Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md border-2 border-black p-8">
          <p className="text-red-600 text-lg mb-4 font-bold">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="cta-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/stories/the-pattern"
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-6 font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Story
          </Link>

          <h1 className="headline-truth mb-4">
            ALMA Intelligence Studio
          </h1>
          <p className="body-truth max-w-3xl">
            Real-time media sentiment tracking, program analysis, and evidence-based insights for youth justice advocacy.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="Articles Analyzed"
            value={stats.totalArticles.toString()}
            icon="📰"
          />
          <StatCard
            label="Avg Sentiment"
            value={stats.avgSentiment.toFixed(2)}
            icon={stats.avgSentiment > 0 ? "📈" : stats.avgSentiment < 0 ? "📉" : "➖"}
            color={stats.avgSentiment > 0 ? 'green' : stats.avgSentiment < 0 ? 'red' : 'neutral'}
          />
          <StatCard
            label="Positive Coverage"
            value={`${stats.positivePercent.toFixed(0)}%`}
            icon="✅"
            color="green"
          />
          <StatCard
            label="Negative Coverage"
            value={`${stats.negativePercent.toFixed(0)}%`}
            icon="❌"
            color="red"
          />
          <StatCard
            label="Community Programs"
            value={stats.communityPrograms.toString()}
            icon="🌱"
            color="green"
          />
          <StatCard
            label="Days Tracked"
            value={stats.daysTracked.toString()}
            icon="📅"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b-2 border-black">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-bold transition-colors border-b-4 -mb-0.5 ${
              activeTab === 'overview'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-3 font-bold transition-colors border-b-4 -mb-0.5 ${
              activeTab === 'articles'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Articles ({stats.totalArticles})
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-6 py-3 font-bold transition-colors border-b-4 -mb-0.5 ${
              activeTab === 'programs'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Programs ({programs.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Sentiment Timeline */}
            <div className="border-2 border-black p-6 bg-white">
              <h2 className="text-2xl font-bold mb-6">Sentiment Over Time</h2>
              {dailySentiment.length > 0 ? (
                <SentimentTimeline data={dailySentiment} width={1100} height={400} />
              ) : (
                <p className="text-gray-500 text-center py-12">No sentiment data available</p>
              )}
            </div>

            {/* Topic Burst */}
            <div className="border-2 border-black p-6 bg-white">
              <h2 className="text-2xl font-bold mb-6">Trending Topics</h2>
              {topicData.length > 0 ? (
                <TopicBurst data={topicData} width={1100} height={600} />
              ) : (
                <p className="text-gray-500 text-center py-12">No topic data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="border-2 border-black p-6 bg-white">
              <h3 className="text-lg font-bold mb-4">Filter Articles</h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search Box */}
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-600 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search headlines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Sentiment Filter */}
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-600 mb-2">
                    Sentiment
                  </label>
                  <select
                    value={selectedSentiment}
                    onChange={(e) => setSelectedSentiment(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                {/* Source Filter */}
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-600 mb-2">
                    Source
                  </label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="all">All Sources</option>
                    {uniqueSources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                {/* Topic Filter */}
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-600 mb-2">
                    Topic
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="all">All Topics</option>
                    {allTopics.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedSentiment !== 'all' || selectedTopic !== 'all' || selectedSource !== 'all' || searchQuery) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase font-bold text-gray-600">Active filters:</span>
                  {selectedSentiment !== 'all' && (
                    <button
                      onClick={() => setSelectedSentiment('all')}
                      className="px-2 py-1 bg-black text-white text-xs font-bold hover:bg-gray-800"
                    >
                      Sentiment: {selectedSentiment} ✕
                    </button>
                  )}
                  {selectedTopic !== 'all' && (
                    <button
                      onClick={() => setSelectedTopic('all')}
                      className="px-2 py-1 bg-black text-white text-xs font-bold hover:bg-gray-800"
                    >
                      Topic: {selectedTopic} ✕
                    </button>
                  )}
                  {selectedSource !== 'all' && (
                    <button
                      onClick={() => setSelectedSource('all')}
                      className="px-2 py-1 bg-black text-white text-xs font-bold hover:bg-gray-800"
                    >
                      Source: {selectedSource} ✕
                    </button>
                  )}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-2 py-1 bg-black text-white text-xs font-bold hover:bg-gray-800"
                    >
                      Search: "{searchQuery}" ✕
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSentiment('all');
                      setSelectedTopic('all');
                      setSelectedSource('all');
                      setSearchQuery('');
                    }}
                    className="px-2 py-1 border-2 border-black text-black text-xs font-bold hover:bg-gray-100"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600 font-bold">
              Showing {recentArticles.length} of {allArticles.length} articles
            </div>

            {/* Article List */}
            <div className="space-y-4">
              {recentArticles.length > 0 ? (
                recentArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onTopicClick={(topic) => setSelectedTopic(topic)}
                  />
                ))
              ) : (
                <div className="text-center py-12 border-2 border-black bg-white">
                  <p className="text-gray-500 mb-4">No articles found matching your filters</p>
                  <button
                    onClick={() => {
                      setSelectedSentiment('all');
                      setSelectedTopic('all');
                      setSelectedSource('all');
                      setSearchQuery('');
                    }}
                    className="cta-secondary"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="grid md:grid-cols-2 gap-6">
            {programs.length > 0 ? (
              programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-12 col-span-2">No programs found</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color = 'neutral',
}: {
  label: string;
  value: string;
  icon: string;
  color?: 'green' | 'red' | 'neutral';
}) {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    neutral: 'text-black',
  };

  return (
    <div className="border-2 border-black p-6 bg-white">
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-3xl font-bold mb-1 ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-sm uppercase tracking-wider text-gray-600 font-bold">
        {label}
      </div>
    </div>
  );
}

// Article Card Component
function ArticleCard({
  article,
  onTopicClick,
}: {
  article: Article;
  onTopicClick?: (topic: string) => void;
}) {
  const sentimentColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
    mixed: 'text-gray-600',
  }[article.sentiment] || 'text-gray-600';

  const sentimentIcon = {
    positive: <TrendingUp className="w-5 h-5" />,
    negative: <TrendingDown className="w-5 h-5" />,
    neutral: <Minus className="w-5 h-5" />,
    mixed: <Minus className="w-5 h-5" />,
  }[article.sentiment] || <Minus className="w-5 h-5" />;

  const sentimentEmoji = {
    positive: '😊',
    negative: '😟',
    neutral: '😐',
    mixed: '🤔',
  }[article.sentiment] || '😐';

  return (
    <div className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
      {/* Header with Source and Date */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <span className="font-bold">{article.source_name}</span>
        <span>•</span>
        <span>{new Date(article.published_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}</span>
      </div>

      {/* Headline */}
      <h3 className="text-xl font-bold text-black mb-4 leading-tight">
        {article.headline}
      </h3>

      {/* Sentiment Indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex items-center gap-2 ${sentimentColor}`}>
          <span className="text-2xl">{sentimentEmoji}</span>
          <span className="font-bold uppercase text-sm">{article.sentiment}</span>
        </div>
        <div className={`text-xl font-bold ${sentimentColor}`}>
          ({article.sentiment_score.toFixed(2)})
        </div>
      </div>

      {/* Topics - Now Clickable */}
      {article.topics && article.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.topics.slice(0, 5).map((topic, idx) => (
            <button
              key={idx}
              onClick={() => onTopicClick?.(topic)}
              className="px-3 py-1 bg-gray-100 border-2 border-black text-xs font-bold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              {topic}
            </button>
          ))}
          {article.topics.length > 5 && (
            <span className="px-3 py-1 text-xs text-gray-500 font-bold">
              +{article.topics.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Key Quote */}
      {article.key_quotes && article.key_quotes.length > 0 && (
        <div className="border-l-4 border-black pl-4 py-3 bg-gray-50 mb-4">
          <p className="text-gray-700 italic text-sm leading-relaxed">
            "{article.key_quotes[0]}"
          </p>
        </div>
      )}

      {/* Prominent "Read Full Article" Button */}
      {article.article_url && (
        <a
          href={article.article_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          READ FULL ARTICLE
        </a>
      )}
    </div>
  );
}

// Program Card Component
function ProgramCard({ program }: { program: Program }) {
  const isProgramTypeCommunity = program.program_type === 'community_led';

  return (
    <div className="border-2 border-black p-6 bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-gray-600 mb-2 font-bold">
            {program.state}
          </div>
          <h3 className="text-xl font-bold text-black mb-2">
            {program.name}
          </h3>
          {program.description && (
            <p className="text-gray-700 text-sm mb-3">
              {program.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 border-2 ${
            isProgramTypeCommunity
              ? 'bg-green-100 border-green-600 text-green-600'
              : 'bg-gray-100 border-gray-600 text-gray-600'
          }`}>
            <span className="text-sm font-bold uppercase">
              {isProgramTypeCommunity ? '🌱 Community Led' : '🏛️ Government'}
            </span>
          </div>
        </div>
        {program.budget_aud && (
          <div className="text-right">
            <div className="text-2xl font-bold text-black">
              ${(program.budget_aud / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-gray-600 uppercase font-bold">Budget</div>
          </div>
        )}
      </div>
    </div>
  );
}
