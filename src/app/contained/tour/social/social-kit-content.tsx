'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  tourSocialKits,
  generalSocialPosts,
  tourStops,
  type SocialPlatform,
  type SocialPost,
} from '@/content/campaign';
import { Check, Copy, ArrowLeft } from 'lucide-react';

const platformConfig: Record<SocialPlatform, { label: string; color: string; bg: string }> = {
  twitter: { label: 'X / Twitter', color: 'text-black', bg: 'bg-gray-100' },
  instagram: { label: 'Instagram', color: 'text-pink-700', bg: 'bg-pink-50' },
  facebook: { label: 'Facebook', color: 'text-blue-700', bg: 'bg-blue-50' },
  linkedin: { label: 'LinkedIn', color: 'text-blue-800', bg: 'bg-blue-50' },
};

const ALL_PLATFORMS: SocialPlatform[] = ['twitter', 'instagram', 'facebook', 'linkedin'];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 text-sm font-bold uppercase tracking-widest border transition-colors flex items-center gap-2 ${
        copied
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'border-black hover:bg-black hover:text-white'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" /> Copy
        </>
      )}
    </button>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const config = platformConfig[post.platform];
  const fullText = post.content + '\n\n' + post.hashtags.join(' ');

  return (
    <div className="border-2 border-black bg-white">
      <div className={`px-4 py-2 border-b-2 border-black ${config.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
          <span className="text-xs text-gray-500">— {post.label}</span>
        </div>
        <span className="text-xs text-gray-400">{post.content.length} chars</span>
      </div>
      <div className="p-4">
        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed mb-3">
          {post.content}
        </pre>
        <div className="flex flex-wrap gap-1 mb-4">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs text-blue-600 font-medium">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <CopyButton text={fullText} />
          {post.platform === 'twitter' && post.content.length > 280 && (
            <span className="text-xs text-red-500 font-bold">
              Over 280 char limit — trim for X
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SocialKitContent() {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform | 'all'>('all');
  const [activeStop, setActiveStop] = useState<string | 'general'>('general');

  const filterPosts = (posts: SocialPost[]) => {
    if (activePlatform === 'all') return posts;
    return posts.filter((p) => p.platform === activePlatform);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        {/* Header */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <Link
              href="/contained/tour"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Tour
            </Link>

            <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              Social Media Kit
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">
              THE CONTAINED<br />SOCIAL CONTENT
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl">
              Ready-to-post content for every platform and every tour stop. Copy,
              customise for your voice, and share. All content is pre-approved for
              public use.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 bg-gray-50 border-b-2 border-black sticky top-0 z-40">
          <div className="container-justice">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Tour Stop Filter */}
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Tour Stop
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveStop('general')}
                    className={`px-3 py-1 text-sm font-bold border transition-colors ${
                      activeStop === 'general'
                        ? 'bg-black text-white border-black'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    General
                  </button>
                  {tourStops.map((stop) => (
                    <button
                      key={stop.eventSlug}
                      onClick={() => setActiveStop(stop.eventSlug)}
                      className={`px-3 py-1 text-sm font-bold border transition-colors ${
                        activeStop === stop.eventSlug
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-black'
                      }`}
                    >
                      {stop.city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Filter */}
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Platform
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActivePlatform('all')}
                    className={`px-3 py-1 text-sm font-bold border transition-colors ${
                      activePlatform === 'all'
                        ? 'bg-black text-white border-black'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    All
                  </button>
                  {ALL_PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setActivePlatform(p)}
                      className={`px-3 py-1 text-sm font-bold border transition-colors ${
                        activePlatform === p
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-black'
                      }`}
                    >
                      {platformConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Posts */}
        <section className="py-12">
          <div className="container-justice">
            {activeStop === 'general' ? (
              <>
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">
                  General Tour Content
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filterPosts(generalSocialPosts).map((post, i) => (
                    <PostCard key={i} post={post} />
                  ))}
                </div>
              </>
            ) : (
              <>
                {tourSocialKits
                  .filter((kit) => kit.tourStopSlug === activeStop)
                  .map((kit) => (
                    <div key={kit.tourStopSlug}>
                      <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                        {kit.city}
                      </h2>
                      <p className="text-gray-600 mb-6">
                        {tourStops.find((s) => s.eventSlug === kit.tourStopSlug)?.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filterPosts(kit.posts).map((post, i) => (
                          <PostCard key={i} post={post} />
                        ))}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </section>

        {/* Usage Notes */}
        <section className="py-12 bg-gray-50 border-t-2 border-black">
          <div className="container-justice">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-4">
              Usage Notes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
              <div>
                <h3 className="font-bold text-black mb-2">Customise freely</h3>
                <p>
                  These are starting points. Adapt the tone, add your own
                  perspective, tag local accounts. Make it yours.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-black mb-2">Character limits</h3>
                <p>
                  X/Twitter: 280 chars. Posts over the limit are flagged.
                  Instagram captions: 2,200 chars. LinkedIn: 3,000 chars.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-black mb-2">Hashtags</h3>
                <p>
                  Always include #TheContained and #YouthJustice. Add local
                  hashtags for each city. Instagram: use all provided. X: pick 2-3.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
