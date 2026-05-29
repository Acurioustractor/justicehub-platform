import Link from 'next/link';
import Image from 'next/image';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ThematicSection } from '@/components/thematic-section';

const categories = {
  seeds: { emoji: '🌱', label: 'Seeds', color: 'bg-green-100 text-green-800' },
  growth: { emoji: '🌿', label: 'Growth', color: 'bg-emerald-100 text-emerald-800' },
  harvest: { emoji: '🌾', label: 'Harvest', color: 'bg-amber-100 text-amber-800' },
  roots: { emoji: '🌳', label: 'Roots', color: 'bg-amber-100 text-amber-900' },
  voices: { emoji: '🗣️', label: 'Voices', color: 'bg-purple-100 text-purple-800' },
};

const contentTypes: Record<string, { emoji: string }> = {
  news: { emoji: '📰' },
  opinion: { emoji: '💬' },
  analysis: { emoji: '📊' },
  investigation: { emoji: '🔍' },
  feature: { emoji: '📝' },
};


type UnifiedContent = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category?: string;
  tags?: string[];
  featured_image_url?: string | null;
  reading_time_minutes?: number | null;
  location_tags?: string[];
  author?: {
    full_name?: string;
    name?: string;
    slug?: string | null;
    photo_url?: string | null;
  } | null;
  published_at?: string | null;
  status?: string;
  content_type: 'article' | 'blog' | 'empathy-ledger' | 'judges-on-country';
  detail_href?: string;
  primary_tag?: string;
};

type JudgesOnCountryVoice = {
  cardNumber: string;
  slug: string;
  name: string;
  role: string;
  quote: string;
  image: string;
  imageAlt: string;
};

const EL_MEDIA_BASE = 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public';

const judgesOnCountryVoices: JudgesOnCountryVoice[] = [
  {
    cardNumber: '01',
    slug: 'start-here-kristy-and-tanya',
    name: 'Kristy & Tanya',
    role: 'Co-Founders, Oonchiumpa',
    quote: '”Our young people are just collateral in a bigger issue. The issue doesn’t sit with them.”',
    image: `${EL_MEDIA_BASE}/media/c53077e1-98de-4216-9149-6268891ff62e/website-photos/17741793073N_IMG_9698.jpg`,
    imageAlt: 'Kristy Bloomfield and Tanya Turner from Oonchiumpa',
  },
  {
    cardNumber: '02',
    slug: 'jackquann-and-nigel',
    name: 'Jackquann & Nigel',
    role: 'Voices used with permission',
    quote: '”Programs.” “Go to school every day.”',
    image: `${EL_MEDIA_BASE}/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1774178045726_1E5A2226.jpg`,
    imageAlt: 'Jackquann and Nigel from Oonchiumpa',
  },
  {
    cardNumber: '03',
    slug: 'jackquann-detention-not-my-home',
    name: 'Jackquann, 14',
    role: 'Voice used with permission',
    quote: '”Detention. That’s not my home.”',
    image: `${EL_MEDIA_BASE}/media/bf17d0a9-2b12-4e4a-982e-09a8b1952ec6/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1774073897284-1E5A2215.jpg`,
    imageAlt: 'Jackquann from Oonchiumpa',
  },
  {
    cardNumber: '04',
    slug: 'nigel-talking-to-the-judge',
    name: 'Nigel, 14',
    role: 'Voice used with permission',
    quote: '”When I’m talking to the judge, I feel like I’m panicking.”',
    image: `${EL_MEDIA_BASE}/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1775881001863_1E5A2212.jpg`,
    imageAlt: 'Nigel from Oonchiumpa',
  },
  {
    cardNumber: '05',
    slug: 'laquisha-court-is-scary',
    name: 'Laquisha, 16',
    role: 'Voice used with permission',
    quote: '”Court is scary because you don’t know whether you’re getting out or not.”',
    image: `${EL_MEDIA_BASE}/media/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1774178037844_1E5A2239.jpg`,
    imageAlt: 'Laquisha from Oonchiumpa',
  },
  {
    cardNumber: '06',
    slug: 'fred-campbell-trust-earned',
    name: 'Fred on Xavier',
    role: 'Trust earned through consistency',
    quote: '”He trusts us. We earned that trust.”',
    image: `${EL_MEDIA_BASE}/media/bf17d0a9-2b12-4e4a-982e-09a8b1952ec6/d0a162d2-282e-4653-9d12-aa934c9dfa4e/1776064148444-1770097200386-gz1auk-1E5A8393.jpg`,
    imageAlt: 'Fred from Oonchiumpa',
  },
];

type StatsType = {
  total: number;
  seeds: number;
  growth: number;
  harvest: number;
  roots: number;
  voices: number;
  locations: number;
};

interface StoriesPageContentProps {
  initialContent: UnifiedContent[];
  initialStats: StatsType;
  activeCategory?: string | null;
}

export function StoriesPageContent({
  initialContent,
  initialStats,
  activeCategory = null,
}: StoriesPageContentProps) {
  const category = activeCategory;
  const showJudgesOnCountryVoices = !category || category === 'voices';

  const filteredContent = !category
    ? initialContent
    : initialContent.filter((item) => {
        const itemCategory = item.category || item.primary_tag;
        return (
          itemCategory === category ||
          (category === 'voices' &&
            (item.content_type === 'empathy-ledger' || item.content_type === 'judges-on-country'))
        );
      });

  const stats = !category
    ? initialStats
    : (() => {
        const uniqueLocations = new Set<string>();
        let seedsCount = 0;
        let growthCount = 0;
        let harvestCount = 0;
        let rootsCount = 0;
        let voicesCount = 0;

        filteredContent.forEach((item) => {
          const itemCategory = item.category || item.primary_tag;

          if (itemCategory === 'seeds') seedsCount++;
          if (itemCategory === 'growth') growthCount++;
          if (itemCategory === 'harvest') harvestCount++;
          if (itemCategory === 'roots') rootsCount++;
          if (
            itemCategory === 'voices' ||
            item.content_type === 'empathy-ledger' ||
            item.content_type === 'judges-on-country'
          ) voicesCount++;

          if (item.location_tags) {
            item.location_tags.forEach((loc: string) => uniqueLocations.add(loc));
          }
        });

        return {
          total: filteredContent.length,
          seeds: seedsCount,
          growth: growthCount,
          harvest: harvestCount,
          roots: rootsCount,
          voices: voicesCount,
          locations: uniqueLocations.size,
        };
      })();

  const featuredContent = filteredContent?.[0];
  const otherContent = filteredContent?.slice(1) || [];

  return (
    <>
      <Navigation />
      <main className="min-h-screen page-content">
        <div className="container-justice py-12">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black mb-6 !text-black">
              Stories from the Movement
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Real stories, evidence-based insights, and updates from communities transforming youth justice across Australia
            </p>
          </div>

          {/* Statistics Section */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {/* Total Stories */}
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-4xl font-black text-black mb-2">{stats.total}</div>
                <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Stories</div>
              </div>

              {/* Seeds */}
              <div className="bg-green-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🌱</div>
                <div className="text-3xl font-black text-green-800 mb-2">{stats.seeds}</div>
                <div className="text-xs font-bold text-green-700 uppercase tracking-wide">Seeds</div>
              </div>

              {/* Growth */}
              <div className="bg-emerald-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🌿</div>
                <div className="text-3xl font-black text-emerald-800 mb-2">{stats.growth}</div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Growth</div>
              </div>

              {/* Harvest */}
              <div className="bg-amber-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🌾</div>
                <div className="text-3xl font-black text-amber-800 mb-2">{stats.harvest}</div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">Harvest</div>
              </div>

              {/* Roots */}
              <div className="bg-amber-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🌳</div>
                <div className="text-3xl font-black text-amber-900 mb-2">{stats.roots}</div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wide">Roots</div>
              </div>

              {/* Voices (Empathy Ledger) */}
              <div className="bg-purple-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">🗣️</div>
                <div className="text-3xl font-black text-purple-800 mb-2">{stats.voices}</div>
                <div className="text-xs font-bold text-purple-700 uppercase tracking-wide">Voices</div>
              </div>

              {/* Locations */}
              <div className="bg-blue-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
                <div className="text-3xl mb-1">📍</div>
                <div className="text-3xl font-black text-blue-800 mb-2">{stats.locations}</div>
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">Locations</div>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/stories"
                className={`px-4 py-2 font-bold border-2 transition-all ${
                  !category
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-gray-100'
                }`}
              >
                All Stories
              </Link>
              {Object.entries(categories).map(([key, cat]) => (
                <Link
                  key={key}
                  href={`/stories?category=${key}`}
                  className={`px-4 py-2 font-bold border-2 transition-all ${
                    category === key
                      ? cat.color + ' border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {showJudgesOnCountryVoices && (
            <section className="max-w-6xl mx-auto mb-16 border-2 border-black bg-[#fff8ef] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-[#8d3d16]">
                    Judges on Country
                  </div>
                  <h2 className="mt-2 text-3xl font-black text-black">
                    Voices from Oonchiumpa
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                    The six field-guide story cards from the Judges on Country page, linked to the full story routes.
                  </p>
                </div>
                <Link
                  href="/judges-on-country"
                  className="inline-flex w-fit items-center justify-center border-2 border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
                >
                  Open Judges on Country
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                {judgesOnCountryVoices.map((story) => (
                  <Link
                    key={story.slug}
                    href={`/stories/${story.slug}`}
                    className="group flex flex-col overflow-hidden border-2 border-black bg-white no-underline shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="relative h-44 border-b-2 border-black bg-black">
                      <Image
                        src={story.image}
                        alt={story.imageAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/75">
                          Card {story.cardNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8d3d16]">
                        {story.role}
                      </div>
                      <h3 className="mt-2 text-xl font-black text-black">
                        {story.name}
                      </h3>
                      <p className="mt-3 flex-1 text-lg font-black leading-tight text-black">
                        {story.quote}
                      </p>
                      <span className="mt-4 text-sm font-bold text-[#059669] group-hover:text-[#047857]">
                        Read their story →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Featured Content */}
          {featuredContent && !category && (
            <div className="max-w-6xl mx-auto mb-16">
              <Link
                href={
                  featuredContent.detail_href
                    ? featuredContent.detail_href
                    : featuredContent.content_type === 'blog'
                    ? `/blog/${featuredContent.slug}`
                    : featuredContent.content_type === 'judges-on-country'
                      ? `/judges-on-country/stories/${featuredContent.slug}`
                    : `/stories/${featuredContent.slug}`
                }
                className="group block bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-200 overflow-hidden no-underline"
              >
                <div className="md:flex">
                  {featuredContent.featured_image_url && (
                    <div className="md:w-1/2 relative h-64 md:h-auto">
                      <Image
                        src={featuredContent.featured_image_url}
                        alt={featuredContent.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  )}
                  <div className={featuredContent.featured_image_url ? 'md:w-1/2 p-8' : 'w-full p-8'}>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 border border-red-800 text-xs font-bold uppercase tracking-wide">
                        ⭐ Featured
                      </span>
                      {featuredContent.content_type === 'article' && featuredContent.category && (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-bold border ${
                            categories[featuredContent.category as keyof typeof categories]?.color
                          }`}
                        >
                          {categories[featuredContent.category as keyof typeof categories]?.emoji}
                          {categories[featuredContent.category as keyof typeof categories]?.label}
                        </span>
                      )}
                      {featuredContent.content_type === 'blog' && featuredContent.tags && featuredContent.tags.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-800 text-xs font-bold">
                          {contentTypes[featuredContent.tags[0] as keyof typeof contentTypes]?.emoji || '📝'}
                          {featuredContent.tags[0]}
                        </span>
                      )}
                      {featuredContent.content_type === 'empathy-ledger' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 border border-purple-800 text-xs font-bold">
                          🗣️ Community Voice
                        </span>
                      )}
                      {featuredContent.content_type === 'judges-on-country' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 border border-purple-800 text-xs font-bold">
                          🗣️ Judges on Country
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 group-hover:text-red-600 transition-colors no-underline">
                      {featuredContent.title}
                    </h2>
                    <p className="text-gray-700 text-lg mb-4 line-clamp-3 no-underline">
                      {featuredContent.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {featuredContent.author && (
                        <span className="font-bold">
                          By {featuredContent.author.full_name || featuredContent.author.name}
                        </span>
                      )}
                      {featuredContent.reading_time_minutes && (
                        <span>⏱️ {featuredContent.reading_time_minutes} min read</span>
                      )}
                      {featuredContent.location_tags && featuredContent.location_tags.length > 0 && (
                        <span>📍 {featuredContent.location_tags[0]}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Content Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherContent.map((item) => (
                <Link
                  key={item.id}
                  href={
                    item.detail_href
                      ? item.detail_href
                      : item.content_type === 'blog'
                      ? `/blog/${item.slug}`
                      : item.content_type === 'judges-on-country'
                        ? `/judges-on-country/stories/${item.slug}`
                      : `/stories/${item.slug}`
                  }
                  className="group block bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 overflow-hidden no-underline"
                >
                  {item.featured_image_url && (
                    <div className="relative w-full h-48 border-b-2 border-black">
                      <Image
                        src={item.featured_image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {item.content_type === 'article' && item.category && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold border ${
                            categories[item.category as keyof typeof categories]?.color
                          }`}
                        >
                          {categories[item.category as keyof typeof categories]?.emoji}
                          {categories[item.category as keyof typeof categories]?.label}
                        </span>
                      )}
                      {item.content_type === 'blog' && item.tags && item.tags.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 border border-blue-800 text-xs font-bold">
                          {contentTypes[item.tags[0] as keyof typeof contentTypes]?.emoji || '📝'}
                          {item.tags[0]}
                        </span>
                      )}
                      {item.content_type === 'empathy-ledger' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 border border-purple-800 text-xs font-bold">
                          🗣️ Community Voice
                        </span>
                      )}
                      {item.content_type === 'judges-on-country' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 border border-purple-800 text-xs font-bold">
                          🗣️ Judges on Country
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black mb-2 group-hover:text-red-600 transition-colors line-clamp-2 no-underline">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3 no-underline">
                      {item.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {item.reading_time_minutes && (
                        <span>⏱️ {item.reading_time_minutes} min</span>
                      )}
                      {item.location_tags && item.location_tags.length > 0 && (
                        <span>📍 {item.location_tags[0]}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {filteredContent?.length === 0 && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <p className="text-xl text-gray-600">
                No content found with the selected filters.
              </p>
              <Link
                href="/stories"
                className="mt-4 inline-block px-6 py-3 bg-black text-white font-bold hover:bg-red-600 transition-colors"
              >
                ← View All Content
              </Link>
            </div>
          )}
        </div>

        {/* Thematic Areas */}
        <ThematicSection variant="compact" />
      </main>
      <Footer />
    </>
  );
}
