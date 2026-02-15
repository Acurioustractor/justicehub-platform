import { empathyLedgerClient } from '@/lib/supabase/empathy-ledger';
import { notFound } from 'next/navigation';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Tag, MapPin, ExternalLink, Shield, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function EmpathyLedgerStoryPage({ params }: PageProps) {
  const { id } = params;

  // Fetch story from Empathy Ledger
  // Note: Avoiding organization join due to RLS recursion issue in Empathy Ledger
  const { data: story, error } = await empathyLedgerClient
    .from('stories')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .eq('privacy_level', 'public')
    .single();

  if (error || !story) {
    console.error('Story fetch error:', error?.message);
    notFound();
  }

  // Fetch organization separately if story has one
  let organization = null;
  if (story.organization_id) {
    const { data: org } = await empathyLedgerClient
      .from('organizations')
      .select('name, slug, traditional_country, indigenous_controlled, logo_url')
      .eq('id', story.organization_id)
      .single();
    organization = org;
  }

  const publishDate = story.published_at ? new Date(story.published_at) : new Date(story.created_at);

  // Calculate reading time
  const wordCount = story.content?.split(/\s+/).length || 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <>
      <Navigation />
      <article className="min-h-screen page-content bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container-justice py-12">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black mb-8 transition-colors"
          >
            ← Back to JusticeHub
          </Link>

          {/* Data Sovereignty Notice */}
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-purple-50 border-2 border-purple-300 flex items-start gap-3">
            <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-purple-800">
                <strong>Empathy Ledger Story</strong> — This story is shared through Empathy Ledger,
                an Indigenous-led platform that maintains data sovereignty and cultural protocols.
                All stories are shared with explicit consent.
              </p>
            </div>
          </div>

          {/* Article Header */}
          <header className="max-w-4xl mx-auto mb-12">
            {/* Category/Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {story.story_category && (
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-black bg-blue-100 text-blue-800">
                  <BookOpen className="w-4 h-4" />
                  {story.story_category.replace(/_/g, ' ')}
                </span>
              )}
              {story.themes?.slice(0, 5).map((theme: string) => (
                <span
                  key={theme}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 border border-gray-400 text-xs font-bold"
                >
                  <Tag className="w-3 h-3" />
                  {theme}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              {story.title}
            </h1>

            {/* Summary/Excerpt */}
            {story.summary && (
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                {story.summary}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 pb-8 border-b-2 border-gray-200">
              {organization && (
                <div className="flex items-center gap-3">
                  {organization.logo_url ? (
                    <Image
                      src={organization.logo_url}
                      alt={organization.name}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-black object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-black flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-black">
                      {organization.name}
                    </div>
                    {organization.traditional_country && (
                      <div className="text-xs text-gray-500">
                        {organization.traditional_country}
                      </div>
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
              {readingTime > 0 && (
                <div className="text-gray-500">
                  {readingTime} min read
                </div>
              )}
              {story.location_text && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {story.location_text}
                </div>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {story.story_image_url && (
            <div className="max-w-5xl mx-auto mb-12">
              <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <Image
                  src={story.story_image_url}
                  alt={story.title}
                  width={1200}
                  height={675}
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Cultural Warnings */}
          {story.cultural_warnings && story.cultural_warnings.length > 0 && (
            <div className="max-w-4xl mx-auto mb-8 p-4 bg-amber-50 border-2 border-amber-400">
              <p className="text-sm text-amber-800 font-medium">
                <strong>Cultural Notice:</strong> {story.cultural_warnings.join('. ')}
              </p>
            </div>
          )}

          {/* Story Content */}
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
                prose-blockquote:border-l-4 prose-blockquote:border-purple-600
                prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-img:border-2 prose-img:border-black prose-img:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                prose-img:rounded-none prose-img:my-8"
            >
              {/* Render content - handle both HTML and plain text */}
              {story.content?.startsWith('<') ? (
                <div dangerouslySetInnerHTML={{ __html: story.content }} />
              ) : (
                <div>
                  {story.content?.split('\n\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Organization Info */}
          {organization && (
            <div className="max-w-4xl mx-auto mt-12 pt-12 border-t-2 border-gray-200">
              <h3 className="text-xl font-black mb-4">About the Organization</h3>
              <div className="flex gap-6 items-start bg-white border-2 border-black p-6">
                {organization.logo_url ? (
                  <Image
                    src={organization.logo_url}
                    alt={organization.name}
                    width={80}
                    height={80}
                    className="rounded-full border-2 border-black object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-black text-lg mb-1">{organization.name}</h4>
                  {organization.traditional_country && (
                    <p className="text-sm text-gray-600 mb-2">
                      {organization.traditional_country}
                    </p>
                  )}
                  {organization.indigenous_controlled && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold mb-3">
                      Indigenous Controlled
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Link to Empathy Ledger */}
          <div className="max-w-4xl mx-auto mt-12 pt-8 border-t-2 border-gray-200 flex flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
            >
              ← Back to JusticeHub
            </Link>
            <a
              href={`https://empathy-ledger.vercel.app/stories/${story.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors border-2 border-purple-800"
            >
              View on Empathy Ledger
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}
