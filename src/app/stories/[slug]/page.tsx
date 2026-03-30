import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { Calendar, Clock, Tag, MapPin, User } from 'lucide-react';
import { PasswordGate } from '@/components/ui/password-gate';
import { fetchSyndicatedStories, fetchSyndicatedStoryContent, fetchContentHubArticles } from '@/lib/empathy-ledger/syndication';
import { fetchContentHubArticleBySlug } from '@/lib/empathy-ledger-content-hub';

const PASSWORD_PROTECTED_SLUGS: string[] = [];

export const dynamic = 'force-dynamic';

const categories = {
  seeds: { emoji: '🌱', label: 'Seeds', color: 'bg-green-100 text-green-800' },
  growth: { emoji: '🌿', label: 'Growth', color: 'bg-emerald-100 text-emerald-800' },
  harvest: { emoji: '🌾', label: 'Harvest', color: 'bg-amber-100 text-amber-800' },
  roots: { emoji: '🌳', label: 'Roots', color: 'bg-amber-100 text-amber-900' },
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Simple markdown→HTML for EL article content (no external dependency) */
function mdToHtml(md: string): string {
  // Normalize line breaks — some content uses literal \n or double-space breaks
  let text = md.replace(/\\n/g, '\n').replace(/  \n/g, '\n');

  // Split into blocks by double newline
  const blocks = text.split(/\n{2,}/);

  return blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';

    // Headings
    if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;
    if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
    if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;

    // Blockquote
    if (trimmed.startsWith('> ')) return `<blockquote><p>${trimmed.slice(2)}</p></blockquote>`;

    // List items
    if (trimmed.match(/^[-*] /m)) {
      const items = trimmed.split(/\n/).map(line =>
        `<li>${line.replace(/^[-*] /, '')}</li>`
      ).join('');
      return `<ul>${items}</ul>`;
    }

    // Paragraph — apply inline formatting
    let p = trimmed
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br/>');

    return `<p>${p}</p>`;
  }).join('\n');
}

/** Try to find a story from Empathy Ledger syndication API by slug */
async function fetchELStory(slug: string) {
  try {
    // Try syndicated stories first (consent-based, has embed tokens)
    const stories = await fetchSyndicatedStories();
    const storyMatch = stories.find(
      (s: any) => slugify(s.title) === slug || s.id === slug
    );
    if (storyMatch) {
      const content = await fetchSyndicatedStoryContent(storyMatch.id, storyMatch.embedToken);
      return { ...storyMatch, content };
    }

    // Try EL articles (content hub — the 36+ published articles)
    const article = await fetchContentHubArticleBySlug(slug);
    if (article) {
      return {
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        themes: article.themes || article.tags || [],
        publishedAt: article.publishedAt,
        createdAt: article.publishedAt,
        imageUrl: article.featuredImageUrl,
        location: null,
        storyteller: article.authorName ? { name: article.authorName, avatar: null } : null,
        content: {
          html: article.content?.startsWith('<') ? article.content : mdToHtml(article.content || ''),
          wordCount: article.content?.split(/\s+/).length || 0,
          imageUrl: article.featuredImageUrl,
        },
      };
    }

    return null;
  } catch {
    return null;
  }
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const supabase = createServiceClient();
  const { slug } = params;

  // Try to fetch from articles first
  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      public_profiles!articles_author_id_fkey (
        full_name,
        slug,
        photo_url,
        bio
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  // If not found in articles, try blog_posts
  let story = article;
  let contentType: 'article' | 'blog' | 'empathy-ledger' = 'article';

  if (!story) {
    const { data: blogPost } = await supabase
      .from('blog_posts')
      .select(`
        *,
        public_profiles!blog_posts_author_id_fkey (
          full_name,
          slug,
          photo_url,
          bio
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    story = blogPost as any;
    contentType = 'blog';
  }

  // If still not found, try Empathy Ledger v2 API
  if (!story) {
    const elStory = await fetchELStory(slug);
    if (elStory) {
      story = {
        id: elStory.id,
        title: elStory.title,
        excerpt: elStory.excerpt,
        content: elStory.content?.html || elStory.content || '',
        featured_image_url: elStory.content?.imageUrl || elStory.imageUrl || null,
        featured_image_caption: null,
        published_at: elStory.publishedAt || elStory.createdAt,
        tags: elStory.themes || [],
        location_tags: elStory.location ? [elStory.location] : [],
        reading_time_minutes: elStory.content?.wordCount ? Math.ceil(elStory.content.wordCount / 200) : null,
        category: null,
        view_count: 0,
        public_profiles: elStory.storyteller ? {
          full_name: elStory.storyteller.name,
          slug: null,
          photo_url: elStory.storyteller.avatar,
          bio: null,
        } : null,
      } as any;
      contentType = 'empathy-ledger';
    }
  }

  // If still not found, return 404
  if (!story) {
    notFound();
  }

  // Increment view count (fire-and-forget) — only for local stories
  if (contentType !== 'empathy-ledger') {
    const table = contentType === 'article' ? 'articles' : 'blog_posts';
    supabase.from(table).update({ view_count: (story.view_count || 0) + 1 }).eq('id', story.id).then(() => {});
  }

  const author = story.public_profiles;
  const publishDate = new Date(story.published_at as string);

  const needsPassword = PASSWORD_PROTECTED_SLUGS.includes(slug);

  const content = (
    <>
      <Navigation />
      <article className="min-h-screen page-content">
        <div className="container-justice py-12">
          {/* Back Link */}
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black mb-8 transition-colors"
          >
            ← Back to Stories
          </Link>

          {/* Article Header */}
          <header className="max-w-4xl mx-auto mb-12">
            {/* Category/Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {contentType === 'article' && story.category && (
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-black ${
                    categories[story.category as keyof typeof categories]?.color
                  }`}
                >
                  {categories[story.category as keyof typeof categories]?.emoji}
                  {categories[story.category as keyof typeof categories]?.label}
                </span>
              )}
              {story.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-800 text-xs font-bold"
                >
                  <Tag className="w-3 h-4" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              {story.title}
            </h1>

            {/* Excerpt */}
            {story.excerpt && (
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                {story.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 pb-8 border-b-2 border-gray-200">
              {author && (
                <div className="flex items-center gap-3">
                  {author.photo_url && (
                    <img
                      src={author.photo_url}
                      alt={author.full_name}
                      className="w-12 h-12 rounded-full border-2 border-black object-cover"
                    />
                  )}
                  <div>
                    <div className="font-bold text-black flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {author.full_name}
                    </div>
                    {author.slug && (
                      <Link
                        href={`/people/${author.slug}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View Profile
                      </Link>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={publishDate.toISOString()}>
                  {publishDate.toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              {story.reading_time_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {story.reading_time_minutes} min read
                </div>
              )}
              {story.location_tags && story.location_tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {story.location_tags.join(', ')}
                </div>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {story.featured_image_url && (
            <div className="max-w-5xl mx-auto mb-12">
              <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <img
                  src={story.featured_image_url}
                  alt={story.title}
                  className="w-full h-auto"
                />
              </div>
              {story.featured_image_caption && (
                <p className="text-sm text-gray-600 italic mt-4 text-center">
                  {story.featured_image_caption}
                </p>
              )}
            </div>
          )}

          {/* Article Content */}
          <div className="max-w-4xl mx-auto">
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-black prose-headings:text-black
                prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12
                prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10
                prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8
                prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                prose-strong:text-black prose-strong:font-bold
                prose-ul:my-6 prose-ol:my-6
                prose-li:text-gray-800 prose-li:my-2
                prose-blockquote:border-l-4 prose-blockquote:border-red-600
                prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-img:border-2 prose-img:border-black prose-img:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                prose-img:rounded-none prose-img:my-8"
              dangerouslySetInnerHTML={{
                __html: story.content?.startsWith('<')
                  ? story.content
                  : mdToHtml(story.content || '')
              }}
            />
          </div>

          {/* Author Bio */}
          {author?.bio && (
            <div className="max-w-4xl mx-auto mt-12 pt-12 border-t-2 border-gray-200">
              <h3 className="text-xl font-black mb-4">About the Author</h3>
              <div className="flex gap-6 items-start bg-gray-50 border-2 border-black p-6">
                {author.photo_url && (
                  <img
                    src={author.photo_url}
                    alt={author.full_name}
                    className="w-20 h-20 rounded-full border-2 border-black object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-black text-lg mb-2">{author.full_name}</h4>
                  <p className="text-gray-700 mb-3">{author.bio}</p>
                  {author.slug && (
                    <Link
                      href={`/people/${author.slug}`}
                      className="text-blue-600 font-bold hover:underline text-sm"
                    >
                      View Full Profile →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Related Content */}
          <div className="max-w-4xl mx-auto mt-12 pt-12 border-t-2 border-gray-200">
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-red-600 transition-colors border-2 border-black"
            >
              ← Read More Stories
            </Link>
          </div>
        </div>
      </article>
      <Footer />
    </>
  );

  if (needsPassword) {
    return <PasswordGate>{content}</PasswordGate>;
  }

  return content;
}
