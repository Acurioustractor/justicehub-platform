'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  tourSocialKits,
  generalSocialPosts,
  tourStops,
  campaignMedia,
  type SocialPlatform,
  type SocialPost,
} from '@/content/campaign';
import { Check, Copy, ArrowLeft, Download } from 'lucide-react';

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

function DownloadButton({ url, filename }: { url: string; filename: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
    setDownloading(false);
  };

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 text-sm font-bold uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-colors flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      {downloading ? 'Saving...' : 'Save'}
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

interface Voice {
  name: string;
  image_url: string;
  quote: string;
  video_url?: string;
}

export function SocialKitContent() {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform | 'all'>('all');
  const [activeStop, setActiveStop] = useState<string | 'general'>('general');
  const [voices, setVoices] = useState<Voice[]>([]);

  useEffect(() => {
    fetch('/api/contained/voices')
      .then(res => res.json())
      .then((data: Voice[]) => { if (Array.isArray(data)) setVoices(data); })
      .catch(console.error);
  }, []);

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
              customise for your voice, and share. Core line: CONTAINED shows what
              youth detention feels like. JusticeHub shows what works instead.
            </p>
          </div>
        </section>

        {/* ============================================================
            VISUAL ASSETS — Photos, portraits, room images
            ============================================================ */}
        <section className="py-12 border-b-2 border-black">
          <div className="container-justice">
            <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              Visual Assets
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Share These Images
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              Right-click (or long-press on mobile) to save. Tag @JusticeHubAU and use #TheContained.
            </p>

            {/* Container Room Photo */}
            <div className="mb-12">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                <span className="w-6 h-1 bg-red-600 inline-block" />
                The Container
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-black overflow-hidden">
                  <img
                    src={campaignMedia.containerRoom}
                    alt="THE CONTAINED — two rooms side by side: therapeutic model vs detention reality"
                    className="w-full h-auto"
                  />
                  <div className="p-4 bg-black text-white flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold mb-1">Three rooms. One container. The truth.</p>
                      <p className="text-sm text-gray-400">This image shows two of the three rooms: therapeutic alternative and detention reality. The third room points to what communities are already building.</p>
                    </div>
                    <DownloadButton url={campaignMedia.containerRoom} filename="contained-two-rooms.jpg" />
                  </div>
                </div>
                <div className="border-2 border-black bg-black text-white p-8 flex flex-col justify-center">
                  <p className="text-2xl font-black mb-4">Suggested captions:</p>
                  <div className="space-y-4">
                    <div className="border-l-2 border-red-600 pl-4">
                      <p className="text-sm text-gray-300 mb-1">Instagram / Facebook</p>
                      <p className="text-white">&ldquo;This is THE CONTAINED. One shipping container. Three rooms. This image shows two of them: detention reality and the therapeutic alternative. The third room asks what we fund next. Mount Druitt, April 25.&rdquo;</p>
                      <CopyButton text="This is THE CONTAINED. One shipping container. Three rooms. This image shows two of them: detention reality and the therapeutic alternative. The third room asks what we fund next. Mount Druitt, April 25.\n\n#TheContained #YouthJustice #JusticeHub" />
                    </div>
                    <div className="border-l-2 border-red-600 pl-4">
                      <p className="text-sm text-gray-300 mb-1">X / Twitter</p>
                      <p className="text-white">&ldquo;Left: therapeutic care. Right: detention reality. THE CONTAINED puts both inside one shipping container, then asks what we back next. First public stop: Mount Druitt, April 25.&rdquo;</p>
                      <CopyButton text="Left: therapeutic care. Right: detention reality. THE CONTAINED puts both inside one shipping container, then asks what we back next. First public stop: Mount Druitt, April 25. #TheContained #YouthJustice" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Storyteller Portraits — real faces, real quotes */}
            {voices.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                  <span className="w-6 h-1 bg-red-600 inline-block" />
                  Voices — Share Their Stories
                </h3>
                <p className="text-gray-600 mb-6">
                  Save the image + copy the caption. Real people, real stories.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {voices.slice(0, 9).map((voice, i) => (
                    <div key={i} className="border-2 border-black overflow-hidden bg-white">
                      <div className="relative aspect-[4/5] bg-gray-900">
                        <img
                          src={voice.image_url}
                          alt={voice.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Dark gradient overlay at bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        {/* Quote overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <p className="text-white text-sm italic leading-snug line-clamp-3 mb-2">
                            &ldquo;{voice.quote}&rdquo;
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 bg-red-600" />
                            <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                              {voice.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between gap-2 border-t-2 border-black">
                        <span className="text-xs font-bold text-gray-500 truncate">{voice.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <DownloadButton url={voice.image_url} filename={`contained-${voice.name.toLowerCase().replace(/\s+/g, '-')}.jpg`} />
                          <CopyButton text={`"${voice.quote.substring(0, 150)}${voice.quote.length > 150 ? '...' : ''}" — ${voice.name}\n\nTHE CONTAINED: Australian Tour 2026\njusticehub.org.au/contained\n\n#TheContained #YouthJustice #JusticeHub`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

        {/* Shareable Videos */}
        <section className="py-12 border-t-2 border-black">
          <div className="container-justice">
            <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              Video Content
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Shareable Videos
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              Descript video stories from people with lived experience. Share
              directly or embed on your site.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'oYopJZ1SKzg',
                  title: 'From Personal Struggles to Professional Passion',
                  description: 'A journey from lived experience to leading change in youth justice.',
                },
                {
                  id: 'Ko8sRLTLee1',
                  title: 'Blurring the Lines Between Staff and Residents',
                  description: 'How therapeutic models break down barriers between workers and young people.',
                },
                {
                  id: 'mlKNz3wLtdC',
                  title: 'Breaking Stigmas: People Are Good at Heart',
                  description: 'Challenging assumptions about young people in the justice system.',
                },
              ].map((video) => (
                <div key={video.id} className="border-2 border-black bg-white">
                  <div className="aspect-video border-b-2 border-black bg-black text-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-3">
                      Video Testimonial
                    </div>
                    <div className="text-lg font-black leading-tight max-w-xs">
                      {video.title}
                    </div>
                    <div className="text-sm text-gray-400 mt-3">
                      Watch on Descript
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-lg mb-1">{video.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                    <div className="flex items-center gap-2">
                      <CopyButton text={`https://share.descript.com/view/${video.id}`} />
                      <a
                        href={`https://share.descript.com/view/${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-bold uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-colors"
                      >
                        Watch
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shareable Stat Cards */}
        <section className="py-12 border-t-2 border-black">
          <div className="container-justice">
            <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              Visual Assets
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Shareable Stat Cards
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              Download these 1080&times;1080 images optimised for Instagram, Facebook, and LinkedIn.
              Each card cites its data source. Right-click or long-press to save.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'detention_cost', value: '$1.55M', label: 'per child/year in detention' },
                { key: 'reoffending', value: '84%', label: 'reoffend within 2 years' },
                { key: 'indigenous', value: '23.1x', label: 'Indigenous overrepresentation' },
                { key: 'alternatives', value: '$520M', label: 'community programs' },
                { key: 'ratio', value: '$15:$1', label: 'punitive vs what works' },
                { key: 'evidence', value: '489', label: 'evidence items collected' },
              ].map((stat) => (
                <div key={stat.key} className="border-2 border-black bg-white">
                  {/* Preview */}
                  <div className="bg-black p-6 text-center">
                    <div className="text-4xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-xs font-bold text-red-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
                  {/* Download */}
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">{stat.key.replace(/_/g, ' ')}</span>
                    <a
                      href={`/api/contained/share-card?stat=${stat.key}`}
                      download={`contained-${stat.key}.png`}
                      className="px-4 py-2 text-sm font-bold uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
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
