'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Navigation, Footer } from '@/components/ui/navigation';
import { MapPin, Calendar, Users, Building2, ChevronLeft, Send, Loader2, DollarSign, Landmark, UserCheck, Globe, ExternalLink } from 'lucide-react';
import { AccessGate } from '@/components/contained/AccessGate';

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

interface StakeholderOrg {
  name: string;
  type: string;
  programs: number;
  role: string;
  website?: string;
  detail: string;
}

interface StakeholderFunder {
  name: string;
  org: string;
  status: string;
  ask?: string;
  detail: string;
}

interface StakeholderPolitical {
  name: string;
  role: string;
  party: string;
  priority: string;
  detail: string;
}

interface StakeholderContact {
  name: string;
  org: string;
  status: string;
  detail: string;
}

interface StakeholderProgram {
  name: string;
  cost: number;
  evidence: string;
  description: string;
}

interface FundingFlow {
  recipient: string;
  amount: number;
  funder: string;
  program: string;
}

interface BasecampCase {
  headline: string;
  national_context: Record<string, { interventions: number; orgs: number; spend_m?: number }>;
  basecamps: { name: string; type: string; pop: string; state: string; status: string }[];
  access_gap: string;
  maranguka_proof: string;
  media: { title: string; source: string; date: string; detail: string }[];
  hansard: { bill: string; date: string; house: string; detail: string }[];
}

interface Stakeholders {
  orgs?: StakeholderOrg[];
  funders?: StakeholderFunder[];
  political?: StakeholderPolitical[];
  contacts?: StakeholderContact[];
  local_stats?: Record<string, any>;
  programs?: StakeholderProgram[];
  funding_ecosystem?: { total_tracked: number; total_grants: number; flows: FundingFlow[] };
  basecamp_case?: BasecampCase;
}

interface LocalOrg {
  name: string;
  suburb: string | null;
  website: string | null;
  isIndigenous: boolean;
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
  stakeholders: Stakeholders;
  localOrgs: LocalOrg[];
  hasAccess: boolean;
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

  const { stop, facilities, stories, basecamps, stateSpending, stakeholders, localOrgs, hasAccess } = data;
  const badge = STATUS_BADGES[stop.status] || STATUS_BADGES.planning;
  const totalSpend = stateSpending.detention_m + stateSpending.community_m;
  const detPct = totalSpend > 0 ? Math.round((stateSpending.detention_m / totalSpend) * 100) : 0;

  const hasStakeholders = stakeholders && (
    stakeholders.orgs?.length || stakeholders.funders?.length ||
    stakeholders.political?.length || stakeholders.contacts?.length
  );

  const STATUS_COLORS: Record<string, string> = {
    anchor: 'bg-emerald-600',
    confirmed: 'bg-emerald-600',
    active: 'bg-emerald-500',
    'meeting today': 'bg-red-500',
    warm: 'bg-amber-500',
    responded: 'bg-blue-500',
    pending: 'bg-gray-500',
    target: 'bg-gray-600',
  };

  const pageContent = (
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

        {/* Local Stats Dashboard */}
        {stakeholders?.local_stats && (
          <section className="px-4 py-12 border-t border-gray-800">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-red-400 mb-4">
                {stop.state} Data Dashboard
              </p>
              <h2 className="text-3xl font-bold mb-8">The numbers behind {stop.city}</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stakeholders.local_stats.yj_annual_spend_m && (
                  <div className="border border-gray-800 p-4">
                    <div className="text-2xl font-mono font-bold text-red-400">${stakeholders.local_stats.yj_annual_spend_m}M</div>
                    <div className="text-xs text-gray-500 mt-1">Annual YJ spend</div>
                  </div>
                )}
                {stakeholders.local_stats.detention_cost_per_person && (
                  <div className="border border-gray-800 p-4">
                    <div className="text-2xl font-mono font-bold text-red-400">${(stakeholders.local_stats.detention_cost_per_person / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-gray-500 mt-1">Detention per person/yr</div>
                  </div>
                )}
                {stakeholders.local_stats.cheapest_effective_program && (
                  <div className="border border-gray-800 p-4">
                    <div className="text-2xl font-mono font-bold text-emerald-400">${stakeholders.local_stats.cheapest_effective_program.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Cheapest effective program</div>
                  </div>
                )}
                {stakeholders.local_stats.cost_ratio && (
                  <div className="border border-gray-800 p-4">
                    <div className="text-2xl font-mono font-bold text-amber-400">{stakeholders.local_stats.cost_ratio}</div>
                    <div className="text-xs text-gray-500 mt-1">Cost ratio</div>
                  </div>
                )}
                {stakeholders.local_stats.aboriginal_unsentenced_pct && (
                  <div className="border border-gray-800 p-4">
                    <div className="text-2xl font-mono font-bold text-red-400">{stakeholders.local_stats.aboriginal_unsentenced_pct}%</div>
                    <div className="text-xs text-gray-500 mt-1">Aboriginal youth unsentenced</div>
                  </div>
                )}
                {stakeholders.local_stats.detention_surge_pct && (
                  <div className="border border-gray-800 p-4">
                    <div className="text-2xl font-mono font-bold text-red-400">+{stakeholders.local_stats.detention_surge_pct}%</div>
                    <div className="text-xs text-gray-500 mt-1">Detention surge (bail laws)</div>
                  </div>
                )}
                {stakeholders.local_stats.mapped_programs && (
                  <div className="border border-gray-800 p-4">
                    <div className="text-2xl font-mono font-bold text-emerald-400">{stakeholders.local_stats.mapped_programs}</div>
                    <div className="text-xs text-gray-500 mt-1">Mapped programs</div>
                  </div>
                )}
                {stakeholders.local_stats.philanthropic_indigenous_pct && (
                  <div className="border border-gray-800 p-4">
                    <div className="text-2xl font-mono font-bold text-emerald-400">{stakeholders.local_stats.philanthropic_indigenous_pct}%</div>
                    <div className="text-xs text-gray-500 mt-1">Non-govt funding → Indigenous orgs</div>
                  </div>
                )}
              </div>

              {stakeholders.local_stats.breaking_cycle_total_m != null && (
                <div className="mt-6 border border-red-900 bg-red-950/20 p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl font-mono font-bold text-red-400">$0</div>
                    <div>
                      <p className="text-white font-bold">of ${stakeholders.local_stats.breaking_cycle_total_m}M &ldquo;Breaking the Cycle&rdquo; grants goes to ACCOs</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Government directs {stakeholders.local_stats.govt_indigenous_pct}% to Indigenous orgs.
                        Non-government funders direct {stakeholders.local_stats.philanthropic_indigenous_pct}%.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stakeholder Orgs */}
        {hasStakeholders && stakeholders.orgs && stakeholders.orgs.length > 0 && (
          <section className="px-4 py-12 border-t border-gray-800 bg-gray-950">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Local Organisations</p>
              </div>
              <h2 className="text-3xl font-bold mb-2">{stakeholders.orgs.length} organisations mapped</h2>
              <p className="text-gray-400 mb-8">Youth justice programs operating in or near {stop.city}</p>

              {/* Indigenous-led */}
              {stakeholders.orgs.filter(o => o.type === 'indigenous').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 mb-4">Indigenous-Led</h3>
                  <div className="space-y-3">
                    {stakeholders.orgs.filter(o => o.type === 'indigenous').map((org, i) => (
                      <div key={i} className="border border-amber-900/50 bg-amber-950/10 p-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{org.name}</span>
                            {org.role === 'HOST' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 text-white">Host</span>
                            )}
                            {org.programs > 0 && (
                              <span className="text-xs text-gray-500">{org.programs} programs</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{org.detail}</p>
                        </div>
                        {org.website && (
                          <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white flex-shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Community orgs */}
              {stakeholders.orgs.filter(o => o.type !== 'indigenous' && o.type !== 'academic').length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Community &amp; Service Orgs</h3>
                  <div className="space-y-3">
                    {stakeholders.orgs.filter(o => o.type !== 'indigenous' && o.type !== 'academic').map((org, i) => (
                      <div key={i} className="border border-gray-800 p-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{org.name}</span>
                            {org.programs > 0 && (
                              <span className="text-xs text-gray-500">{org.programs} programs</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{org.detail}</p>
                        </div>
                        {org.website && (
                          <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white flex-shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic */}
              {stakeholders.orgs.filter(o => o.type === 'academic').length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4">Academic Partners</h3>
                  <div className="space-y-3">
                    {stakeholders.orgs.filter(o => o.type === 'academic').map((org, i) => (
                      <div key={i} className="border border-blue-900/50 bg-blue-950/10 p-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-white">{org.name}</span>
                          <p className="text-sm text-gray-400 mt-1">{org.detail}</p>
                        </div>
                        {org.website && (
                          <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white flex-shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Funders */}
        {hasStakeholders && stakeholders.funders && stakeholders.funders.length > 0 && (
          <section className="px-4 py-12 border-t border-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Funders &amp; Partners</p>
              </div>
              <h2 className="text-3xl font-bold mb-8">Funding network</h2>

              <div className="space-y-3">
                {stakeholders.funders.map((f, i) => (
                  <div key={i} className="border border-gray-800 p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <span className="font-bold text-white">{f.name}</span>
                        <span className="text-gray-500 ml-2 text-sm">{f.org}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white ${STATUS_COLORS[f.status] || 'bg-gray-600'}`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{f.detail}</p>
                    {f.ask && (
                      <div className="mt-2 px-3 py-2 bg-emerald-950/30 border border-emerald-900/30 text-sm">
                        <span className="text-emerald-400 font-bold">Ask:</span>{' '}
                        <span className="text-gray-300">{f.ask}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Political */}
        {hasStakeholders && stakeholders.political && stakeholders.political.length > 0 && (
          <section className="px-4 py-12 border-t border-gray-800 bg-gray-950">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="w-5 h-5 text-blue-400" />
                <p className="text-sm uppercase tracking-[0.3em] text-blue-400">Political Stakeholders</p>
              </div>
              <h2 className="text-3xl font-bold mb-8">Political landscape</h2>

              {['tier1', 'tier2', 'tier3'].map(tier => {
                const people = stakeholders.political!.filter(p => p.priority === tier);
                if (!people.length) return null;
                const tierLabel = tier === 'tier1' ? 'Priority — Must Invite' : tier === 'tier2' ? 'High Value' : 'Broader Network';
                const tierColor = tier === 'tier1' ? 'text-red-400 border-red-900' : tier === 'tier2' ? 'text-amber-400 border-amber-900' : 'text-gray-400 border-gray-800';
                return (
                  <div key={tier} className="mb-8">
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${tierColor.split(' ')[0]} mb-4`}>{tierLabel}</h3>
                    <div className="space-y-3">
                      {people.map((p, i) => (
                        <div key={i} className={`border ${tierColor.split(' ').slice(1).join(' ')} p-4`}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-bold text-white">{p.name}</span>
                            <span className="text-xs text-gray-500">{p.role}</span>
                            {p.party && p.party !== 'n/a' && p.party !== 'various' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-gray-800 text-gray-300">{p.party}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{p.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Contacts */}
        {hasStakeholders && stakeholders.contacts && stakeholders.contacts.length > 0 && (
          <section className="px-4 py-12 border-t border-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Confirmed Contacts</p>
              </div>
              <h2 className="text-3xl font-bold mb-8">People already engaged</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                {stakeholders.contacts.map((c, i) => (
                  <div key={i} className="border border-gray-800 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{c.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white ${STATUS_COLORS[c.status] || 'bg-gray-600'}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{c.org}</p>
                    <p className="text-sm text-gray-400 mt-2">{c.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Programs Detail */}
        {stakeholders?.programs && stakeholders.programs.length > 0 && (
          <section className="px-4 py-12 border-t border-gray-800 bg-gray-950">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400 mb-2">Program Evidence</p>
              <h2 className="text-3xl font-bold mb-2">{stakeholders.programs.length} programs mapped</h2>
              <p className="text-gray-400 mb-8">
                Average cost: <span className="font-mono text-emerald-400">
                  ${Math.round(stakeholders.programs.reduce((s, p) => s + p.cost, 0) / stakeholders.programs.length).toLocaleString()}
                </span>/year per young person vs <span className="font-mono text-red-400">$939,000</span> detention
              </p>

              <div className="space-y-3">
                {stakeholders.programs.map((p, i) => {
                  const evidenceColor = p.evidence === 'Indigenous-led' ? 'bg-amber-600'
                    : p.evidence === 'Promising' ? 'bg-emerald-600' : 'bg-gray-600';
                  return (
                    <div key={i} className="border border-gray-800 p-5">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">{p.name}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white ${evidenceColor}`}>
                            {p.evidence}
                          </span>
                        </div>
                        <span className="font-mono text-emerald-400 text-lg">${p.cost.toLocaleString()}<span className="text-xs text-gray-500">/yr</span></span>
                      </div>
                      <p className="text-sm text-gray-400">{p.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Funding Ecosystem */}
        {stakeholders?.funding_ecosystem && (
          <section className="px-4 py-12 border-t border-gray-800">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400 mb-2">Funding Ecosystem</p>
              <h2 className="text-3xl font-bold mb-2">
                ${(stakeholders.funding_ecosystem.total_tracked / 1000000).toFixed(1)}M tracked
              </h2>
              <p className="text-gray-400 mb-8">
                {stakeholders.funding_ecosystem.total_grants} grants flowing into the {stop.city} ecosystem
              </p>

              <div className="space-y-2">
                {stakeholders.funding_ecosystem.flows.map((f, i) => {
                  const maxAmount = stakeholders.funding_ecosystem!.flows[0]?.amount || 1;
                  const pct = Math.max(5, Math.round((f.amount / maxAmount) * 100));
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-32 sm:w-48 text-right text-xs text-gray-500 flex-shrink-0 truncate">{f.funder}</div>
                      <div className="flex-1 min-w-0">
                        <div className="relative h-8 bg-gray-900 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-emerald-900/60 border-r border-emerald-500"
                            style={{ width: `${pct}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-3 gap-2">
                            <span className="font-mono text-sm text-emerald-400">${(f.amount / 1000000).toFixed(1)}M</span>
                            <span className="text-xs text-gray-400 truncate">→ {f.recipient}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 mt-4">Source: JusticeHub funding tracker — AusTender, NSW DCJ/FACS, NIAA, PRF, Dusseldorp, Ritchie Foundation</p>
            </div>
          </section>
        )}

        {/* The Basecamp Case */}
        {stakeholders?.basecamp_case && (
          <section className="px-4 py-12 border-t border-gray-800 bg-gray-950">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-400 mb-2">Recommended Reading</p>
              <h2 className="text-3xl font-bold mb-6">{stakeholders.basecamp_case.headline}</h2>

              {/* The access gap callout */}
              <div className="border border-red-900 bg-red-950/20 p-6 mb-8">
                <p className="text-sm uppercase tracking-widest text-red-400 mb-2">The Access Gap</p>
                <p className="text-gray-300">{stakeholders.basecamp_case.access_gap}</p>
              </div>

              {/* Maranguka proof */}
              <div className="border border-emerald-900 bg-emerald-950/20 p-6 mb-8">
                <p className="text-sm uppercase tracking-widest text-emerald-400 mb-2">The Proof Point</p>
                <p className="text-gray-300">{stakeholders.basecamp_case.maranguka_proof}</p>
              </div>

              {/* National network */}
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Three Basecamps — Every Context</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {stakeholders.basecamp_case.basecamps.map((bc, i) => (
                    <div key={i} className={`border p-5 ${bc.state === stop.state ? 'border-amber-500 bg-amber-950/20' : 'border-gray-800'}`}>
                      <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">{bc.type}</div>
                      <div className="font-bold text-white">{bc.name}</div>
                      <div className="text-sm text-gray-400 mt-1">Pop. {bc.pop} · {bc.state}</div>
                      <div className={`mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest inline-block ${bc.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        {bc.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* National comparison */}
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">State Comparison — Programs Mapped</h3>
                <div className="space-y-2">
                  {Object.entries(stakeholders.basecamp_case.national_context)
                    .sort(([, a], [, b]) => b.interventions - a.interventions)
                    .map(([state, data]) => {
                      const maxInt = 495; // QLD max
                      const pct = Math.max(3, Math.round((data.interventions / maxInt) * 100));
                      const isCurrentState = state.toUpperCase() === stop.state;
                      return (
                        <div key={state} className="flex items-center gap-3">
                          <div className={`w-10 text-right text-sm font-bold ${isCurrentState ? 'text-amber-400' : 'text-gray-500'}`}>{state.toUpperCase()}</div>
                          <div className="flex-1 h-7 bg-gray-900 relative overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 ${isCurrentState ? 'bg-amber-600/50 border-r border-amber-400' : 'bg-gray-800 border-r border-gray-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                            <div className="absolute inset-0 flex items-center px-3 gap-2">
                              <span className={`font-mono text-sm ${isCurrentState ? 'text-amber-400' : 'text-gray-400'}`}>{data.interventions}</span>
                              <span className="text-xs text-gray-500">programs · {data.orgs} orgs{data.spend_m ? ` · $${data.spend_m}M spend` : ''}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Hansard mentions */}
              {stakeholders.basecamp_case.hansard.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4">Parliamentary Record</h3>
                  <div className="space-y-3">
                    {stakeholders.basecamp_case.hansard.map((h, i) => (
                      <div key={i} className="border border-blue-900/50 bg-blue-950/10 p-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Landmark className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-400 uppercase tracking-widest">{h.house} · {h.date}</span>
                        </div>
                        <p className="font-bold text-white text-sm">{h.bill}</p>
                        <p className="text-sm text-gray-400 mt-1">{h.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media trail */}
              {stakeholders.basecamp_case.media.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Media &amp; Research</h3>
                  <div className="space-y-3">
                    {stakeholders.basecamp_case.media.map((m, i) => (
                      <div key={i} className="border border-gray-800 p-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <span className="font-bold text-white text-sm">{m.title}</span>
                          <span className="text-xs text-gray-500">{m.source} · {m.date}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{m.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Other Tour Stops Link */}
        {hasStakeholders && (
          <section className="px-4 py-8 border-t border-gray-800 bg-gray-950">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs text-gray-600 text-center">
                This planning page is password-protected and shared with local teams.
                Data sourced from JusticeHub + CivicScope ({new Date().toLocaleDateString('en-AU')}).
              </p>
            </div>
          </section>
        )}

        {/* What Now CTA */}
        <section className="px-4 py-16 border-t border-gray-800 bg-gray-950">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-red-500 mb-4">You&apos;ve seen it</p>
            <h2 className="text-3xl font-bold mb-4">Now what?</h2>
            <p className="text-gray-400 mb-8">
              The container showed you the reality. The alternative exists — 1,165 community
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

  // Wrap with access gate if password protected
  if (hasAccess) {
    return <AccessGate slug={stop.eventSlug}>{pageContent}</AccessGate>;
  }

  return pageContent;
}
