'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  Search, MapPin, ArrowRight, CheckCircle, Send,
  Mail, Scale, Users, Heart, Globe, Loader2,
  ChevronRight, Plus, Download, Smartphone, X,
  BookOpen, Target, Building2, ExternalLink
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

interface Story {
  id: string;
  title: string;
  summary: string | null;
  story_image_url: string | null;
  storyteller_name: string | null;
  storyteller_avatar: string | null;
  themes: string[];
  location?: string | null;
}

interface TourStop {
  city: string;
  state: string;
  venue: string;
  partner: string;
  description: string;
  date: string;
  status: string;
}

interface SearchResult {
  type: string;
  id: string;
  name: string;
  description?: string;
  url: string;
  state?: string;
  metadata?: Record<string, unknown>;
}

// ── Constants ────────────────────────────────────────────────

const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
];

const KEY_STATS = [
  { value: '$1.33M', label: 'Cost to detain one young person per year', source: 'Productivity Commission ROGS 2024-25' },
  { value: '$75', label: 'Daily cost of community alternatives', source: 'Community Services Benchmark' },
  { value: '84%', label: 'Reoffending rate after detention', source: 'QLD Youth Justice Strategy' },
  { value: '3%', label: 'Reoffending with community programs', source: 'Community Accountability Pilot' },
  { value: '1,081', label: 'Alternative programs mapped on JusticeHub', source: 'ALMA Database' },
  { value: '16×', label: 'More youth helped for the same cost', source: 'QLD Productivity Commission' },
];

// ── Curated Basecamp Features ──────────────────────────────

const FEATURED_BASECAMPS = [
  {
    name: 'Oonchiumpa',
    region: 'Alice Springs, NT',
    tagline: 'What Happens When Community Leads',
    description: 'Cultural healing on country. Young people working on station, building enterprise, reconnecting with culture. 95% reduction in anti-social behaviour.',
    articleSlug: 'oonchiumpa-what-happens-when-community-leads',
    imageUrl: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/oonchiumpa/hero-hero-main.jpg',
    videoUrl: null as string | null, // Paste YouTube/Vimeo URL here when video is cut
    videoPlaceholder: true,
    color: '#DC2626',
  },
  {
    name: 'Mounty Yarns',
    region: 'Mount Druitt, NSW',
    tagline: 'Young People Tell Their Own Story',
    description: 'Youth-led storytelling and media production. Young people from Western Sydney documenting their reality, building skills, and changing the narrative.',
    articleSlug: null,
    imageUrl: 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/20251210-1E5A8290.jpg',
    videoPlaceholder: false,
    color: '#059669',
  },
  {
    name: 'Palm Island Community Company',
    region: 'Palm Island, QLD',
    tagline: 'Community Control in Action',
    description: 'The largest Indigenous community-controlled organisation on Palm Island. 30+ programs from family services to social enterprise — proof that community does it better.',
    articleSlug: 'at-the-speed-of-ceremony-learning-partnership-on-palm-i',
    imageUrl: null,
    videoPlaceholder: false,
    color: '#0A0A0A',
  },
  {
    name: 'BG Fit',
    region: 'Mount Isa, QLD',
    tagline: 'Fitness, Culture, Connection',
    description: 'Brodie Germaine built BG Fit from nothing — fitness-based youth engagement on Kalkadoon country. 400+ young people every year. Bush camps, on-country programs, real connection.',
    articleSlug: 'spotlight-on-changemaker-brodie-germaine',
    imageUrl: 'https://tednluwflfhxyucgwigh.supabase.co/storage/v1/object/public/media/contained/gallery/bgfit-hero.jpg',
    videoPlaceholder: false,
    color: '#059669',
  },
  {
    name: 'The Hope Centre',
    region: 'National',
    tagline: 'Finding Belonging and Purpose',
    description: 'Young people working, learning, and building a future. The video shows what happens when you invest in young people instead of locking them up.',
    articleSlug: 'nhats-story-finding-belonging-and-purpose-at-the-hope-c',
    imageUrl: null,
    videoPlaceholder: false,
    color: '#0A0A0A',
  },
];

// ── Page ─────────────────────────────────────────────────────

export default function ForJudgesPage() {
  // Data state
  const [tourStops, setTourStops] = useState<TourStop[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Contribute form
  const [contributeForm, setContributeForm] = useState({ name: '', email: '', program: '', location: '', details: '' });
  const [contributing, setContributing] = useState(false);
  const [contributed, setContributed] = useState(false);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // PWA install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  // Refs for scrolling
  const searchRef = useRef<HTMLDivElement>(null);
  const storiesRef = useRef<HTMLDivElement>(null);
  const contributeRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // ── Data Loading ─────────────────────────────────────────

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    // Load tour stops
    fetch('/api/contained/tour-stops')
      .then(r => r.json())
      .then(data => setTourStops(data || []))
      .catch(() => {});

    // PWA install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Search ───────────────────────────────────────────────

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() && !searchState) return;

    setSearching(true);
    setHasSearched(true);
    try {
      // Search both interventions and organizations for broader location coverage
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery);
      if (searchState) params.set('state', searchState);
      params.set('type', 'all');
      params.set('limit', '20');

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      let results = data.results || [];

      // If few results, also search ALMA interventions by org location
      if (results.length < 5 && searchQuery.trim()) {
        try {
          const locationRes = await fetch(`/api/intelligence/alma-search?q=${encodeURIComponent(searchQuery)}&limit=15`);
          if (locationRes.ok) {
            const locationData = await locationRes.json();
            const locationResults = (locationData.interventions || []).map((i: any) => ({
              type: 'intervention',
              id: i.id,
              name: i.name,
              description: i.description?.substring(0, 200),
              url: `/intelligence/interventions/${i.id}`,
              state: i.state,
              metadata: { type: i.type, org: i.organization_name },
            }));
            // Merge, avoiding duplicates
            const existingIds = new Set(results.map((r: SearchResult) => r.id));
            results = [...results, ...locationResults.filter((r: SearchResult) => !existingIds.has(r.id))];
          }
        } catch { /* fallback search failed, continue with main results */ }
      }

      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  // ── Magic Link Auth ──────────────────────────────────────

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/judges-on-country`,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch {
      // silently fail — the email may still send
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Contribute ───────────────────────────────────────────

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    setContributing(true);
    try {
      // Store contribution in campaign_outreach
      const { error } = await (supabase as any).from('campaign_outreach').insert({
        name: contributeForm.name,
        email: contributeForm.email || null,
        org: contributeForm.program,
        location: contributeForm.location,
        sector: 'judiciary',
        status: 'program-suggestion',
        notes: `[For Judges contribution] ${contributeForm.details}`,
      });
      if (!error) setContributed(true);
    } catch {
      // best effort
    } finally {
      setContributing(false);
    }
  }

  // ── PWA Install ──────────────────────────────────────────

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F5F0E8]">

        {/* ── Hero ──────────────────────────────────────── */}
        <section className="bg-[#0A0A0A] text-white pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-mono text-sm tracking-widest text-gray-400 mb-4 uppercase">
              For the Judiciary
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              What&apos;s Working in<br />Youth Justice
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              1,081 community-led alternatives mapped across Australia.
              Real stories from young people. Evidence that detention isn&apos;t the only option.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-[#DC2626] text-white font-bold text-lg hover:bg-red-700 transition-colors"
              >
                Search Your Area
              </button>
              <button
                onClick={() => storiesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0A0A0A] transition-colors"
              >
                Hear From Young People
              </button>
            </div>
          </div>
        </section>

        {/* ── Key Stats Bar ─────────────────────────────── */}
        <section className="bg-[#0A0A0A] border-t border-gray-800 py-8 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {KEY_STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400 mt-1 font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Local Area Search ─────────────────────────── */}
        <section ref={searchRef} className="py-16 px-4" id="search">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Find What&apos;s Working Near Your Court
              </h2>
              <p className="text-gray-600 text-lg">
                Search by location or state to find community-led programs and alternatives to detention in your jurisdiction.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="e.g. healing programs, mentoring, diversion..."
                    className="w-full pl-12 pr-4 py-4 border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669] text-lg"
                  />
                </div>
                <select
                  value={searchState}
                  onChange={e => setSearchState(e.target.value)}
                  className="px-4 py-4 border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669] font-mono"
                >
                  <option value="">All States</option>
                  {AUSTRALIAN_STATES.map(s => (
                    <option key={s.value} value={s.value}>{s.value}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-8 py-4 bg-[#0A0A0A] text-white font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {hasSearched && (
              <div className="mt-8">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 bg-white border-2 border-[#0A0A0A] p-6">
                    <p className="text-gray-600 mb-2">No programs found for this search.</p>
                    <p className="text-sm text-gray-500">
                      Know a program we&apos;re missing?{' '}
                      <button
                        onClick={() => contributeRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-[#DC2626] underline font-bold"
                      >
                        Tell us about it
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-mono text-gray-500">
                      {searchResults.length} program{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    {searchResults.map(result => (
                      <Link
                        key={result.id}
                        href={result.url}
                        className="block bg-white border-2 border-[#0A0A0A] p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="h-4 w-4 text-[#059669]" />
                              <span className="font-mono text-xs text-[#059669] uppercase">
                                {result.type}
                              </span>
                              {result.state && (
                                <span className="font-mono text-xs text-gray-400">
                                  <MapPin className="h-3 w-3 inline" /> {result.state}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-lg text-[#0A0A0A]">{result.name}</h3>
                            {result.description && (
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{result.description}</p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Featured Basecamps ──────────────────────── */}
        <section ref={storiesRef} className="py-16 px-4 bg-[#0A0A0A]" id="stories">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="font-mono text-sm tracking-widest text-gray-400 mb-3 uppercase">
                The Proof Is Already Here
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Young People Are the Solution
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                From Mount Isa to Mount Druitt to Alice Springs — these communities are doing the work.
                Young people building enterprise, telling their stories, healing on country.
              </p>
            </div>

            <div className="space-y-6">
              {FEATURED_BASECAMPS.map((bc, i) => (
                <div
                  key={bc.name}
                  className="bg-[#F5F0E8] border-2 border-gray-700 overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.5)] transition-shadow"
                >
                  <div className="md:flex">
                    {/* Image, video embed, or color bar */}
                    {bc.videoUrl ? (
                      <div className="relative w-full md:w-72 flex-shrink-0">
                        <div className="aspect-video md:aspect-auto md:h-full">
                          <iframe
                            src={
                              bc.videoUrl.includes('youtube.com') || bc.videoUrl.includes('youtu.be')
                                ? `https://www.youtube.com/embed/${bc.videoUrl.includes('v=') ? bc.videoUrl.split('v=')[1]?.split('&')[0] : bc.videoUrl.split('youtu.be/')[1]?.split('?')[0]}`
                                : bc.videoUrl.includes('vimeo.com')
                                  ? `https://player.vimeo.com/video/${bc.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]}`
                                  : bc.videoUrl
                            }
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                      </div>
                    ) : bc.imageUrl ? (
                      <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0">
                        <Image
                          src={bc.imageUrl}
                          alt={bc.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 288px"
                        />
                      </div>
                    ) : (
                      <div className="w-full md:w-2 flex-shrink-0" style={{ backgroundColor: bc.color }} />
                    )}

                    <div className="flex-1 p-6 md:p-8">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                            {bc.region}
                          </span>
                          <h3 className="text-2xl font-bold text-[#0A0A0A] mt-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {bc.name}
                          </h3>
                          <p className="text-sm font-bold mt-1" style={{ color: bc.color }}>
                            {bc.tagline}
                          </p>
                        </div>
                        {bc.videoPlaceholder && (
                          <span className="px-3 py-1 bg-[#DC2626] text-white text-xs font-mono font-bold">
                            VIDEO COMING
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {bc.description}
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {bc.articleSlug && (
                          <Link
                            href={`/stories/${bc.articleSlug}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] text-white text-sm font-bold hover:bg-gray-800 transition-colors"
                          >
                            <BookOpen className="h-4 w-4" /> Read the Story
                          </Link>
                        )}
                        <button
                          onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
                          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#0A0A0A] text-[#0A0A0A] text-sm font-bold hover:bg-[#0A0A0A] hover:text-white transition-colors"
                        >
                          <Search className="h-4 w-4" /> Find Programs Near {bc.region.split(',')[0]}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The Case for Change ──────────────────────── */}
        <section className="py-16 px-4 bg-white" id="case">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                The Role of the Court
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                When youth justice funding flows to community, outcomes improve, costs drop,
                and communities get safer. The court has a role in making this happen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  The Cost of Detention
                </h3>
                <div className="text-4xl font-bold text-[#DC2626] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  $1.33M/year
                </div>
                <p className="text-gray-600 text-sm">
                  Per young person in detention. 84% reoffend within 12 months.
                  The system produces the outcomes it was designed to prevent.
                </p>
              </div>

              <div className="border-2 border-[#059669] p-6">
                <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  The Community Alternative
                </h3>
                <div className="text-4xl font-bold text-[#059669] mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  $75/day
                </div>
                <p className="text-gray-600 text-sm">
                  Community-led programs achieve 88% success at a fraction of the cost.
                  Young people stay connected to family, culture, and opportunity.
                </p>
              </div>

              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Community Safety
                </h3>
                <p className="text-gray-600 text-sm">
                  &ldquo;Tough on crime&rdquo; rhetoric sounds decisive but the evidence shows it makes
                  communities less safe. Detention breaks families, deepens trauma, and produces
                  more serious offending. Community programs build accountability and connection.
                </p>
              </div>

              <div className="border-2 border-[#0A0A0A] p-6">
                <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  What Judges Can Do
                </h3>
                <p className="text-gray-600 text-sm">
                  Know what programs exist in your area. Refer to community alternatives where
                  appropriate. Share the evidence with colleagues. Visit the programs.
                  Champion the work that&apos;s already proving detention isn&apos;t the only path.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTAINED Tour ───────────────────────────── */}
        <section ref={tourRef} className="py-16 px-4" id="tour">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="font-mono text-sm tracking-widest text-gray-500 mb-3 uppercase">
                The CONTAINED Tour 2026
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                See It For Yourself
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                One shipping container. Three rooms. Thirty minutes.
                The reality of youth detention, the therapeutic alternative, and the community-led future.
              </p>
            </div>

            {tourStops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tourStops.map((stop, i) => (
                  <div
                    key={i}
                    className="bg-white border-2 border-[#0A0A0A] p-5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-[#0A0A0A]">
                          {stop.city}, {stop.state}
                        </h3>
                        {stop.partner && (
                          <p className="text-sm text-[#059669] font-mono">{stop.partner}</p>
                        )}
                      </div>
                      <span className={`
                        px-2 py-1 text-xs font-mono font-bold
                        ${stop.status === 'confirmed' ? 'bg-[#059669] text-white' :
                          stop.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'}
                      `}>
                        {stop.status}
                      </span>
                    </div>
                    {stop.date && (
                      <p className="text-sm text-gray-500 font-mono mb-2">{stop.date}</p>
                    )}
                    {stop.description && (
                      <p className="text-sm text-gray-600">{stop.description}</p>
                    )}
                    <Link
                      href="/contained/register"
                      className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-[#DC2626] hover:underline"
                    >
                      Register interest <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Tour stops loading...</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Contribute ───────────────────────────────── */}
        <section ref={contributeRef} className="py-16 px-4 bg-white" id="contribute">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Know a Program We&apos;re Missing?
              </h2>
              <p className="text-gray-600 text-lg">
                You see what works in your courtroom every day. Help us map the programs
                that are making a difference but aren&apos;t on the platform yet.
              </p>
            </div>

            {contributed ? (
              <div className="bg-[#059669] text-white p-8 text-center border-2 border-[#0A0A0A]">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Thank you</h3>
                <p>We&apos;ll review this and add it to the platform. Your knowledge makes ALMA stronger.</p>
              </div>
            ) : (
              <form onSubmit={handleContribute} className="space-y-4 border-2 border-[#0A0A0A] p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-sm mb-1">Your Name</label>
                    <input
                      type="text"
                      value={contributeForm.name}
                      onChange={e => setContributeForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={contributeForm.email}
                      onChange={e => setContributeForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-sm mb-1">Program or Organisation Name</label>
                  <input
                    type="text"
                    value={contributeForm.program}
                    onChange={e => setContributeForm(f => ({ ...f, program: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    placeholder="e.g. BackTrack Youth Works, Armidale"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-1">Location / Region</label>
                  <input
                    type="text"
                    value={contributeForm.location}
                    onChange={e => setContributeForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    placeholder="e.g. Western NSW, Alice Springs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-1">What makes this program effective?</label>
                  <textarea
                    value={contributeForm.details}
                    onChange={e => setContributeForm(f => ({ ...f, details: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none"
                    placeholder="What outcomes have you seen? How does it work differently?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={contributing}
                  className="w-full px-6 py-4 bg-[#0A0A0A] text-white font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {contributing ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="h-5 w-5" /> Submit Program
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Sign In + Install ─────────────────────────── */}
        <section className="py-16 px-4 bg-[#0A0A0A]" id="connect">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Magic Link Sign In */}
              <div className="bg-gray-900 border border-gray-700 p-8">
                <Mail className="h-8 w-8 text-[#059669] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Stay Connected
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Sign in with your email to save your local area, get notified when new programs
                  are added near you, and track your contributions.
                </p>

                {user ? (
                  <div className="flex items-center gap-3 p-4 bg-[#059669]/10 border border-[#059669]/30">
                    <CheckCircle className="h-5 w-5 text-[#059669]" />
                    <span className="text-[#059669] font-mono text-sm">Signed in as {user.email}</span>
                  </div>
                ) : magicLinkSent ? (
                  <div className="p-4 bg-[#059669]/10 border border-[#059669]/30">
                    <CheckCircle className="h-5 w-5 text-[#059669] mb-2" />
                    <p className="text-[#059669] font-bold text-sm">Check your email for a sign-in link.</p>
                    <p className="text-gray-400 text-xs mt-1">It may take a minute to arrive.</p>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <input
                      type="email"
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      placeholder="your.email@courts.gov.au"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-[#059669] font-mono"
                      required
                    />
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full px-4 py-3 bg-[#059669] text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {authLoading ? 'Sending...' : 'Send Sign-In Link'}
                    </button>
                    <p className="text-xs text-gray-500 text-center">No password needed. One-click email sign in.</p>
                  </form>
                )}
              </div>

              {/* PWA Install */}
              <div className="bg-gray-900 border border-gray-700 p-8">
                <Smartphone className="h-8 w-8 text-[#DC2626] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Add to Your Phone
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Install JusticeHub on your phone for instant access. Search programs,
                  read stories, and stay connected — right from your home screen.
                </p>

                {showInstall && (
                  <button
                    onClick={handleInstall}
                    className="w-full px-4 py-3 bg-[#DC2626] text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mb-3"
                  >
                    <Download className="h-5 w-5" /> Install JusticeHub
                  </button>
                )}
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="p-4 bg-gray-800 border border-gray-700">
                    <p className="font-bold text-white mb-2">On iPhone / iPad:</p>
                    <p>Open in Safari → tap <span className="font-mono bg-gray-700 px-1 mx-1">⬆ Share</span> → <span className="font-mono bg-gray-700 px-1 mx-1">Add to Home Screen</span></p>
                  </div>
                  <div className="p-4 bg-gray-800 border border-gray-700">
                    <p className="font-bold text-white mb-2">On Android:</p>
                    <p>Open in Chrome → tap <span className="font-mono bg-gray-700 px-1 mx-1">⋮ Menu</span> → <span className="font-mono bg-gray-700 px-1 mx-1">Install app</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Footer ───────────────────────────────── */}
        <section className="py-16 px-4 bg-[#DC2626]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              The system that locks up young people is failing.
              The alternatives are already here.
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Explore the evidence. Share it with your colleagues. Champion what works.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-[#DC2626] font-bold text-lg hover:bg-gray-100 transition-colors"
              >
                Search Programs
              </button>
              <Link
                href="/contained"
                className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Learn About THE CONTAINED
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
