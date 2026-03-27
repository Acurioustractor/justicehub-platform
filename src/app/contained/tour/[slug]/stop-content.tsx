'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Navigation, Footer } from '@/components/ui/navigation';
import { MapPin, Calendar, Users, Building2, ChevronLeft, Send, Loader2 } from 'lucide-react';

const TourMap = dynamic(() => import('@/components/contained/TourMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] border border-gray-800 bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  ),
});

interface Facility {
  name: string;
  slug: string;
  city: string;
  state: string;
  capacity_beds: number;
  security_level: string;
  facility_type: string;
  indigenous_population_percentage: number | null;
}

interface TourStory {
  id: string;
  name: string;
  tour_stop: string;
  story: string;
  created_at: string;
}

interface Basecamp {
  slug: string;
  name: string;
  description: string;
  location: string;
  image: string | null;
}

interface StopData {
  stop: {
    city: string;
    state: string;
    venue: string;
    partner: string;
    description: string;
    eventSlug: string;
    date: string;
    status: string;
    lat: number;
    lng: number;
    partnerQuote: string | null;
    localStats: Record<string, any> | null;
    heroImageUrl: string | null;
    videoUrl: string | null;
    interviewNotes: string | null;
    servicesHighlighted: any[];
  };
  facilities: Facility[];
  stories: TourStory[];
  basecamps: Basecamp[];
  stateSpending: { detention_m: number; community_m: number };
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: 'bg-green-600' },
  planning: { label: 'In Planning', color: 'bg-amber-600' },
  tentative: { label: 'Tentative', color: 'bg-gray-600' },
  exploring: { label: 'Exploring', color: 'bg-blue-600' },
};

export function StopContent({ slug }: { slug: string }) {
  const [data, setData] = useState<StopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Story submission state
  const [storyName, setStoryName] = useState('');
  const [storyText, setStoryText] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/contained/tour-stops/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Tour stop not found');
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleStorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!storyText.trim() || !consent) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contained/tour-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storyName.trim() || 'Anonymous',
          tour_stop: data?.stop.city || slug,
          story: storyText.trim(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setStoryText('');
        setStoryName('');
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="bg-black text-white min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-600" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navigation />
        <main className="bg-black text-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Tour stop not found</h1>
            <Link href="/contained/tour" className="text-gray-400 hover:text-white underline">
              Back to tour
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { stop, facilities, stories, basecamps, stateSpending } = data;
  const badge = STATUS_BADGES[stop.status] || STATUS_BADGES.planning;
  const totalSpend = stateSpending.detention_m + stateSpending.community_m;
  const detPct = totalSpend > 0 ? Math.round((stateSpending.detention_m / totalSpend) * 100) : 0;

  return (
    <>
      <Navigation />
      <main className="bg-black text-white min-h-screen">
        {/* Hero */}
        <section className="relative pt-24 pb-16 px-4">
          {stop.heroImageUrl && (
            <Image
              src={stop.heroImageUrl}
              alt={`${stop.city}, ${stop.state}`}
              fill
              className="object-cover opacity-20"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black" />

          <div className="relative max-w-4xl mx-auto">
            <Link
              href="/contained/tour"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to tour
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest text-white ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-sm text-gray-500">{stop.state}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4">{stop.city}</h1>

            <div className="flex flex-wrap gap-6 text-gray-400 mb-6">
              {stop.venue && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {stop.venue}
                </span>
              )}
              {stop.date && (
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {stop.date}
                </span>
              )}
              {stop.partner && (
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {stop.partner}
                </span>
              )}
            </div>

            <p className="text-lg text-gray-300 max-w-2xl">{stop.description}</p>

            {stop.partnerQuote && (
              <blockquote className="mt-8 border-l-4 border-emerald-500 pl-6 py-2">
                <p className="text-gray-300 italic">&ldquo;{stop.partnerQuote}&rdquo;</p>
                <footer className="text-sm text-gray-500 mt-2">— {stop.partner}</footer>
              </blockquote>
            )}
          </div>
        </section>

        {/* Mini map */}
        <section className="px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            <TourMap
              stops={[{
                city: stop.city,
                state: stop.state,
                venue: stop.venue,
                partner: stop.partner,
                description: stop.description,
                eventSlug: stop.eventSlug,
                date: stop.date,
                status: stop.status as any,
                lat: stop.lat,
                lng: stop.lng,
              }]}
            />
          </div>
        </section>

        {/* State Spending */}
        {totalSpend > 0 && (
          <section className="px-4 py-12 border-t border-gray-800">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-red-400 mb-4">
                {stop.state} Youth Justice Spending
              </p>
              <h2 className="text-3xl font-bold mb-6">
                ${totalSpend}M spent annually in {stop.state}
              </h2>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="border border-red-900 bg-red-950/20 p-6">
                  <div className="text-3xl font-mono font-bold text-red-400">${stateSpending.detention_m}M</div>
                  <div className="text-sm text-gray-400 mt-1">Detention spending ({detPct}%)</div>
                </div>
                <div className="border border-emerald-900 bg-emerald-950/20 p-6">
                  <div className="text-3xl font-mono font-bold text-emerald-400">${stateSpending.community_m}M</div>
                  <div className="text-sm text-gray-400 mt-1">Community spending ({100 - detPct}%)</div>
                </div>
              </div>

              <div className="h-4 bg-gray-900 flex overflow-hidden">
                <div className="bg-red-600 h-full" style={{ width: `${detPct}%` }} />
                <div className="bg-emerald-600 h-full" style={{ width: `${100 - detPct}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Source: Productivity Commission ROGS 2024-25</p>
            </div>
          </section>
        )}

        {/* Detention Facilities */}
        {facilities.length > 0 && (
          <section className="px-4 py-12 border-t border-gray-800 bg-gray-950">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-red-400" />
                <p className="text-sm uppercase tracking-[0.3em] text-red-400">
                  Detention in {stop.state}
                </p>
              </div>
              <h2 className="text-3xl font-bold mb-6">
                {facilities.length} detention {facilities.length === 1 ? 'facility' : 'facilities'}
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {facilities.map(fac => (
                  <div key={fac.slug} className="border border-gray-800 bg-gray-900/50 p-5">
                    <h3 className="font-bold text-white text-sm">{fac.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{fac.city}, {fac.state}</p>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="text-lg font-mono font-bold text-red-400">{fac.capacity_beds}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Beds</div>
                      </div>
                      <div>
                        <div className="text-lg font-mono font-bold text-gray-300 capitalize">{fac.security_level}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Security</div>
                      </div>
                    </div>
                    {fac.indigenous_population_percentage != null && fac.indigenous_population_percentage > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <span className="text-sm font-mono text-red-400">{fac.indigenous_population_percentage}%</span>
                        <span className="text-xs text-gray-500 ml-2">Indigenous population</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Community Organisations */}
        {basecamps.length > 0 && (
          <section className="px-4 py-12 border-t border-gray-800">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400 mb-4">Community Partners</p>
              <h2 className="text-3xl font-bold mb-6">
                Organisations in {stop.state}
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {basecamps.map(org => (
                  <Link
                    key={org.slug}
                    href={`/sites/${org.slug}`}
                    className="block border border-emerald-900 bg-emerald-950/20 overflow-hidden hover:border-emerald-500 transition-colors group"
                  >
                    {org.image ? (
                      <div className="h-36 relative">
                        <Image
                          src={org.image}
                          alt={org.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      </div>
                    ) : (
                      <div className="h-36 bg-emerald-950/50 flex items-center justify-center">
                        <span className="text-3xl font-bold text-emerald-700">{org.name[0]}</span>
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-emerald-400">{org.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{org.location}</p>
                      {org.description && (
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{org.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tour Stories */}
        {stories.length > 0 && (
          <section className="px-4 py-12 border-t border-gray-800 bg-gray-950">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-4">Community Voices</p>
              <h2 className="text-3xl font-bold mb-6">
                Stories from {stop.city}
              </h2>

              <div className="space-y-4">
                {stories.map(story => (
                  <div key={story.id} className="border border-gray-800 p-6">
                    <p className="text-gray-300 leading-relaxed">&ldquo;{story.story}&rdquo;</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm font-bold text-gray-400">{story.name || 'Anonymous'}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(story.created_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Story Submission */}
        <section className="px-4 py-12 border-t border-gray-800">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-2">Share your story</h2>
            <p className="text-gray-400 mb-8">
              Have you been affected by the youth justice system in {stop.city}? Your voice matters.
            </p>

            {submitted ? (
              <div className="border border-emerald-800 bg-emerald-950/20 p-8 text-center">
                <p className="text-emerald-400 font-bold text-lg mb-2">Thank you for sharing</p>
                <p className="text-gray-400 text-sm">
                  Your story has been submitted for review. Approved stories will appear on this page.
                </p>
              </div>
            ) : (
              <form onSubmit={handleStorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Your name (optional)</label>
                  <input
                    type="text"
                    value={storyName}
                    onChange={e => setStoryName(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full bg-gray-900 border border-gray-700 px-4 py-3 text-white placeholder:text-gray-600 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Your story</label>
                  <textarea
                    value={storyText}
                    onChange={e => setStoryText(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={5}
                    required
                    className="w-full bg-gray-900 border border-gray-700 px-4 py-3 text-white placeholder:text-gray-600 focus:border-white focus:outline-none resize-none"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-1 accent-emerald-500"
                  />
                  <span className="text-sm text-gray-400">
                    I consent to my story being published on this page after review.
                    Stories are reviewed before being made public.
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={!storyText.trim() || !consent || submitting}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit story
                </button>
              </form>
            )}
          </div>
        </section>

        {/* What Now CTA */}
        <section className="px-4 py-16 border-t border-gray-800 bg-gray-950">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-red-500 mb-4">You&apos;ve seen it</p>
            <h2 className="text-3xl font-bold mb-4">Now what?</h2>
            <p className="text-gray-400 mb-8">
              The container showed you the reality. The alternative exists — 1,081 community
              models proving it works better and costs less. Pick your lane.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contained/what-now"
                className="px-6 py-3 text-sm font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-colors"
              >
                What you can do
              </Link>
              <Link
                href="/contained/register"
                className="px-6 py-3 text-sm font-bold uppercase tracking-widest border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
              >
                Book your experience
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
