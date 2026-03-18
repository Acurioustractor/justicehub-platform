'use client';

import { useEffect, useState, forwardRef } from 'react';
// @ts-expect-error no type declarations for react-scrollama
import { Scrollama, Step } from 'react-scrollama';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { journeyContainers, campaignMedia, type TourStop } from '@/content/campaign';
import { NewsletterSignup } from '@/components/contained/NewsletterSignup';
import { VoiceRecorder } from '@/components/contained/VoiceRecorder';
import { useDeviceSession } from '@/hooks/useDeviceSession';
import { Loader2 } from 'lucide-react';

const TourMap = dynamic(() => import('@/components/contained/TourMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] border-2 border-gray-800 bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  ),
});

const DetentionServicesMap = dynamic(() => import('@/components/contained/DetentionMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] border border-gray-800 bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  ),
});

// ── Types ───────────────────────────────────────────────────────

interface Stats {
  programs_documented: number;
  total_evidence: number;
  total_funding_grants: number;
  total_funding_billions: number;
  states_covered: number;
  rogs_indigenous_detention_ratio: number;
  rogs_youth_detention_millions: number;
  rogs_youth_community_millions: number;
  rogs_youth_total_millions: number;
}

interface Voice {
  name: string;
  image_url: string | null;
  quote: string;
}

interface Story {
  id: string;
  title: string;
  excerpt: string;
  author_name: string;
  story_image_url: string | null;
  source: 'el' | 'article' | 'tour';
  slug: string | null;
  is_featured: boolean;
}

interface BasecampOrg {
  slug: string;
  name: string;
  region: string;
  description: string;
  image: string | null;
  stats: { label: string; value: string }[];
}

interface FundingRecipient {
  recipient_name: string;
  grant_count: number;
  total_millions: number;
  sources?: string[];
}

interface FundingData {
  topRecipients: FundingRecipient[];
  stateSpending: Record<string, { detention_m: number; community_m: number; total_m: number }>;
  national: { detention_m: number; community_m: number; total_m: number };
}

interface Facility {
  name: string;
  slug: string;
  city: string;
  state: string;
  capacity_beds: number;
  security_level: string;
  facility_type: string;
  indigenous_population_percentage: number | null;
  government_department: string;
  latitude: number;
  longitude: number;
}

interface YJService {
  name: string;
  organization: string;
  latitude: number;
  longitude: number;
  evidence_level: string;
  service_role: string;
  capacity: number | null;
  state?: string;
}


interface StateSpendingEntry {
  detention_m: number;
  community_m: number;
  cost_per_day: number | null;
}

const FALLBACK_ORGS = [
  { name: 'Oonchiumpa', region: 'Alice Springs, NT', stat: '95% reduced anti-social behavior', slug: 'oonchiumpa', image: campaignMedia.orgHeros.oonchiumpa },
  { name: 'BG Fit', region: 'Mount Isa, QLD', stat: '400+ young people yearly', slug: 'bg-fit', image: campaignMedia.orgHeros.bgfit },
  { name: 'Mounty Yarns', region: 'Mount Druitt, NSW', stat: 'Youth-led storytelling', slug: 'mounty-yarns', image: null },
  { name: 'Maranguka', region: 'Bourke, NSW', stat: '23% drop in family violence', slug: 'maranguka', image: null },
];

const DIAGRAMA_IMAGES = [
  { src: '/images/articles/diagrama-youth-justice-spain.jpg', alt: 'Diagrama therapeutic centre, Spain' },
  { src: '/images/articles/diagrama-youth-justice-spain-1-e034920e.jpg', alt: 'Young people in Diagrama program' },
  { src: '/images/articles/diagrama-youth-justice-spain-2-e00356dc.jpg', alt: 'Staff and residents at Diagrama' },
  { src: '/images/articles/diagrama-youth-justice-spain-3-4bd0f399.jpeg', alt: 'Diagrama educational workshop' },
  { src: '/images/articles/diagrama-youth-justice-spain-4-caa09f83.jpg', alt: 'Diagrama community activity' },
  { src: '/images/articles/diagrama-youth-justice-spain-5-3620b6f1.jpeg', alt: 'Diagrama outdoor program' },
  { src: '/images/articles/diagrama-foundations-impact-on-spains-youth-detention-system.jpg', alt: 'Diagrama Foundation impact' },
  { src: '/images/articles/diagrama-foundations-impact-on-spains-youth-detention-system-1-81044f0a.jpg', alt: 'Inside a Diagrama facility' },
  { src: '/images/articles/diagrama-foundations-impact-on-spains-youth-detention-system-2-0a85306d.png', alt: 'Diagrama outcomes data' },
];

const DIAGRAMA_ARTICLES = [
  { title: 'Beyond Walls: What Spanish Youth Detention Centers Taught Me', slug: 'beyond-walls-what-spanish-youth-detention-centers-taught-me-about-seeing-humanity-first' },
  { title: 'From Punishment to Potential: Day 1 with Diagrama', slug: 'from-punishment-to-potential-lessons-from-spains-innovative-youth-justice-model---day-1-with-diagrama' },
  { title: "Diagrama Foundation's Impact on Spain's Youth Detention System", slug: 'diagrama-foundations-impact-on-spains-youth-detention-system' },
];

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'] as const;

const STATE_COLORS: Record<string, string> = {
  NSW: 'bg-blue-600', VIC: 'bg-indigo-600', QLD: 'bg-red-600', WA: 'bg-amber-600',
  SA: 'bg-rose-600', TAS: 'bg-emerald-600', NT: 'bg-orange-600', ACT: 'bg-cyan-600',
};

// ── Main Component ──────────────────────────────────────────────

export function ExperienceContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [stateSpending, setStateSpending] = useState<Record<string, StateSpendingEntry>>({});
  const [stories, setStories] = useState<Story[]>([]);
  const [basecamps, setBasecamps] = useState<BasecampOrg[]>([]);
  const [tourStops, setTourStops] = useState<TourStop[]>([]);
  const [fundingData, setFundingData] = useState<FundingData | null>(null);
  const [yjServices, setYjServices] = useState<YJService[]>([]);
  const { session: deviceSession, isEnrolled } = useDeviceSession();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maxScroll > 0 ? scrolled / maxScroll : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/homepage-stats').then(r => r.json()).catch(() => null),
      fetch('/api/contained/voices').then(r => r.json()).catch(() => []),
      fetch('/api/contained/facilities').then(r => r.json()).catch(() => ({ facilities: [], stateSpending: {} })),
      fetch('/api/contained/stories').then(r => r.json()).catch(() => []),
      fetch('/api/basecamps').then(r => r.json()).catch(() => []),
      fetch('/api/contained/tour-stops').then(r => r.json()).catch(() => []),
      fetch('/api/contained/funding-recipients').then(r => r.json()).catch(() => null),
      fetch('/api/contained/interventions-map').then(r => r.json()).catch(() => []),
    ]).then(([statsRes, voicesRes, facRes, storiesRes, basecampsRes, tourStopsRes, fundingRes, yjServicesRes]) => {
      if (statsRes?.stats) setStats(statsRes.stats);
      if (Array.isArray(voicesRes)) setVoices(voicesRes);
      if (facRes?.facilities) setFacilities(facRes.facilities);
      if (facRes?.stateSpending) setStateSpending(facRes.stateSpending);
      if (Array.isArray(storiesRes)) setStories(storiesRes);
      if (Array.isArray(basecampsRes)) setBasecamps(basecampsRes);
      if (Array.isArray(tourStopsRes)) setTourStops(tourStopsRes);
      if (fundingRes?.topRecipients) setFundingData(fundingRes);
      if (Array.isArray(yjServicesRes)) setYjServices(yjServicesRes);
    });
  }, []);

  const onStepEnter = ({ data }: { data: number }) => setCurrentStep(data);

  const room1 = journeyContainers[0];
  const room2 = journeyContainers[1];
  const room3 = journeyContainers[2];

  return (
    <main className="bg-black text-white min-h-screen">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-900 z-50">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Enrolled Visitor Welcome Bar */}
      {isEnrolled && deviceSession && (
        <div className="fixed top-1 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="bg-[#0A0A0A]/90 backdrop-blur border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-3 pointer-events-auto text-xs">
            <span className="text-[#059669] font-mono">&#9679;</span>
            <span className="text-white/70">
              Welcome back{deviceSession.displayName !== 'Visitor' ? `, ${deviceSession.displayName}` : ''}
            </span>
            <Link
              href="/contained/experience#reflect"
              className="text-[#DC2626] hover:text-[#DC2626]/80 font-medium"
            >
              Reflect
            </Link>
            <Link
              href="/contained/experience#share-story"
              className="text-white/50 hover:text-white/70 font-medium"
            >
              Share Story
            </Link>
            <Link
              href="/contained/experience#recommend"
              className="text-white/50 hover:text-white/70 font-medium"
            >
              Recommend
            </Link>
          </div>
        </div>
      )}

      {/* Hero — container two-room photo */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <Image
          src={campaignMedia.containerRoom}
          alt="The CONTAINED shipping container — a therapeutic room and a detention cell side by side"
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black" />

        <div className="relative text-center max-w-4xl mx-auto z-10">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-6">
            Virtual Exhibition
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            You Can&apos;t<br />Unsee It
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12">
            One shipping container. Three rooms. Thirty minutes.
          </p>

          {stats && (
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-16">
              <div className="border border-gray-700 p-4">
                <div className="text-2xl md:text-3xl font-mono font-bold">$4,250</div>
                <div className="text-xs text-gray-400 mt-1">Cost per day</div>
              </div>
              <div className="border border-gray-700 p-4">
                <div className="text-2xl md:text-3xl font-mono font-bold">{stats.programs_documented}</div>
                <div className="text-xs text-gray-400 mt-1">Programs tracked</div>
              </div>
              <div className="border border-gray-700 p-4">
                <div className="text-2xl md:text-3xl font-mono font-bold">{stats.rogs_indigenous_detention_ratio}x</div>
                <div className="text-xs text-gray-400 mt-1">Indigenous ratio</div>
              </div>
            </div>
          )}

          <div className="text-gray-500 text-sm mb-2">Enter the exhibition</div>
          <svg
            className="w-6 h-6 text-gray-500 mx-auto animate-bounce"
            fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            viewBox="0 0 24 24" stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Scrollama Sections — 10 total */}
      <Scrollama onStepEnter={onStepEnter} offset={0.3}>
        {/* 1: Room 1 — Current Reality */}
        <Step data={1}>
          <Room1Section active={currentStep === 1} room={room1} />
        </Step>

        {/* 2: Detention Centre Map */}
        <Step data={2}>
          <DetentionMapSection active={currentStep === 2} facilities={facilities} stateSpending={stateSpending} yjServices={yjServices} />
        </Step>

        {/* 3: Room 2 — Therapeutic Alternative */}
        <Step data={3}>
          <Room2Section active={currentStep === 3} room={room2} />
        </Step>

        {/* 4: Diagrama Deep Dive */}
        <Step data={4}>
          <DiagramaSection active={currentStep === 4} />
        </Step>

        {/* 5: Room 3 — Community Solutions (dynamic basecamps) */}
        <Step data={5}>
          <Room3Section active={currentStep === 5} room={room3} basecamps={basecamps} />
        </Step>

        {/* 6: The Opportunity — Redirect the Funding */}
        <Step data={6}>
          <FundingRedirectSection active={currentStep === 6} stats={stats} stateSpending={stateSpending} />
        </Step>

        {/* 7: Tour Map */}
        <Step data={7}>
          <TourMapSection active={currentStep === 7} tourStops={tourStops} onStopClick={(slug) => router.push(`/contained/tour/${slug}`)} />
        </Step>

        {/* 8: Where the Money Goes */}
        <Step data={8}>
          <FundingRecipientsSection active={currentStep === 8} fundingData={fundingData} />
        </Step>

        {/* 9: ALMA Intelligence */}
        <Step data={9}>
          <DataSection active={currentStep === 9} stats={stats} />
        </Step>

        {/* 10: Stories */}
        <Step data={10}>
          <StoriesSection active={currentStep === 10} stories={stories} />
        </Step>

        {/* 11: Community Voices */}
        <Step data={11}>
          <VoicesSection active={currentStep === 11} voices={voices} />
        </Step>

        {/* 12: Reflect (enrolled visitors) */}
        <Step data={12}>
          <ReflectSection active={currentStep === 12} isEnrolled={isEnrolled} deviceSession={deviceSession} />
        </Step>

        {/* 13: Share Your Story (enrolled visitors) */}
        <Step data={13}>
          <ShareStorySection active={currentStep === 13} isEnrolled={isEnrolled} deviceSession={deviceSession} />
        </Step>

        {/* 14: Recommend (enrolled visitors) */}
        <Step data={14}>
          <RecommendSection active={currentStep === 14} isEnrolled={isEnrolled} />
        </Step>

        {/* 15: Take Action */}
        <Step data={15}>
          <ActionSection active={currentStep === 15} />
        </Step>
      </Scrollama>

      {/* Footer */}
      <div className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link
            href="/contained"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Back to Contained
          </Link>
          <Link href="/contained/tour" className="text-sm font-bold uppercase tracking-widest text-white hover:text-gray-300 transition-colors">
            See the Tour →
          </Link>
        </div>
      </div>
    </main>
  );
}

// ── Room 1: Current Reality ─────────────────────────────────────

const Room1Section = forwardRef<HTMLElement, { active: boolean; room: typeof journeyContainers[0] }>(
  ({ active, room }, ref) => {
    const firstVoiceQuote = "No child should wake up in a concrete cell. This system isn't broken — it was built this way.";

    return (
      <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800">
        <div className={`max-w-5xl w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="mb-8">
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest bg-red-600 text-white">
              Room {room.step} — {room.title}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-7xl md:text-8xl font-mono font-bold text-red-500 mb-4">
                $4,250
              </div>
              <p className="text-lg text-gray-400">per child, per day in detention</p>
              <p className="text-3xl font-bold mt-6 text-white">{room.headline}</p>
              <p className="text-gray-300 mt-4 leading-relaxed">{room.summary}</p>
            </div>

            <div className="space-y-4">
              {room.stats.map((stat) => (
                <div key={stat.label} className="border border-red-900 bg-red-950/30 p-5">
                  <div className="text-2xl font-mono font-bold text-red-400">{stat.value}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cell video */}
          <div className="mt-12 relative aspect-video bg-gray-900 border border-red-900 overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              src={campaignMedia.cellVideoMov}
              poster={campaignMedia.containerRoom}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-xs text-gray-400">Inside the CONTAINED detention cell replica</p>
            </div>
          </div>

          <blockquote className="mt-8 border-l-4 border-red-600 pl-6 py-2">
            <p className="text-lg text-gray-300 italic">&ldquo;{firstVoiceQuote}&rdquo;</p>
          </blockquote>

          <p className="mt-8 text-gray-500">
            There are 15 youth detention centres across Australia. Here&apos;s every one.
          </p>
          <p className="text-sm text-gray-600 mt-2">{room.duration}</p>
        </div>
      </section>
    );
  }
);
Room1Section.displayName = 'Room1Section';

// ── Detention Centre Map ────────────────────────────────────────

const DetentionMapSection = forwardRef<
  HTMLElement,
  { active: boolean; facilities: Facility[]; stateSpending: Record<string, StateSpendingEntry>; yjServices: YJService[] }
>(({ active, facilities, stateSpending, yjServices }, ref) => {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const filteredFacilities = selectedState
    ? facilities.filter(f => f.state === selectedState)
    : facilities;

  const statesWithFacilities = STATES.filter(s => facilities.some(f => f.state === s));

  return (
    <section ref={ref} className="min-h-screen py-20 px-4 border-t border-gray-800 bg-gray-950">
      <div className={`max-w-6xl mx-auto w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <p className="text-sm uppercase tracking-[0.3em] text-red-400 mb-4">Every Facility</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          {facilities.length} detention centres. {facilities.reduce((s, f) => s + (f.capacity_beds || 0), 0)} beds.
        </h2>
        <p className="text-lg text-gray-400 mb-4 max-w-2xl">
          Every youth detention facility operating in Australia, with state-by-state spending from the Productivity Commission.
        </p>

        {/* State tabs — above map so zoom is visible */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedState(null)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
              !selectedState
                ? 'bg-white text-black border-white'
                : 'border-gray-700 text-gray-400 hover:border-white hover:text-white'
            }`}
          >
            All
          </button>
          {statesWithFacilities.map(st => (
            <button
              key={st}
              onClick={() => setSelectedState(st === selectedState ? null : st)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                selectedState === st
                  ? 'bg-white text-black border-white'
                  : 'border-gray-700 text-gray-400 hover:border-white hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Live map — every detention centre in Australia */}
        {facilities.length > 0 && (
          <div className="mb-12">
            <DetentionServicesMap
              facilities={
                selectedState
                  ? facilities.filter(f => f.latitude && f.longitude && f.state === selectedState)
                  : facilities.filter(f => f.latitude && f.longitude)
              }
              services={
                selectedState
                  ? yjServices.filter(s => s.state === selectedState)
                  : yjServices
              }
              selectedState={selectedState}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Facility cards */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {filteredFacilities.map(fac => {
              const spend = stateSpending[fac.state];
              // Compute per-state cost: state detention $M / (state beds * 365)
              const stateBeds = facilities.filter(f => f.state === fac.state).reduce((s, f) => s + f.capacity_beds, 0);
              const stateDetM = spend?.detention_m || 0;
              const costPerDay = stateBeds > 0 && stateDetM > 0
                ? Math.round((stateDetM * 1_000_000) / (stateBeds * 365))
                : null;

              return (
                <div key={fac.slug} className="border border-gray-800 bg-gray-900/50 p-5 hover:border-red-700 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">{fac.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{fac.city}, {fac.state}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase text-white ${STATE_COLORS[fac.state] || 'bg-gray-600'}`}>
                      {fac.state}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="text-lg font-mono font-bold text-red-400">{fac.capacity_beds}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Beds</div>
                    </div>
                    {costPerDay && (
                      <div>
                        <div className="text-lg font-mono font-bold text-red-400">${costPerDay.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{fac.state} avg/bed/day</div>
                      </div>
                    )}
                  </div>
                  {stateDetM > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-800">
                      <span className="text-sm font-mono font-bold text-gray-300">${stateDetM}M</span>
                      <span className="text-xs text-gray-500 ml-2">{fac.state} detention spend (ROGS)</span>
                    </div>
                  )}
                  {fac.indigenous_population_percentage != null && fac.indigenous_population_percentage > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-800">
                      <span className="text-sm font-mono text-red-400">{fac.indigenous_population_percentage}%</span>
                      <span className="text-xs text-gray-500 ml-2">Indigenous population</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* State spending sidebar */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
              {selectedState ? `${selectedState} Spending` : 'State Spending'} (ROGS 2024-25)
            </h3>
            {(selectedState ? [selectedState] : statesWithFacilities).map(st => {
              const spend = stateSpending[st];
              if (!spend) return null;
              const total = spend.detention_m + spend.community_m;
              const detPct = total > 0 ? (spend.detention_m / total) * 100 : 0;

              return (
                <div key={st} className="border border-gray-800 bg-gray-900/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{st}</span>
                    {spend.cost_per_day && (
                      <span className="text-xs text-gray-500">${spend.cost_per_day.toLocaleString()}/day</span>
                    )}
                  </div>
                  {/* Spending bar */}
                  <div className="h-3 bg-gray-800 flex overflow-hidden mb-2">
                    <div className="bg-red-600 h-full" style={{ width: `${detPct}%` }} />
                    <div className="bg-emerald-600 h-full" style={{ width: `${100 - detPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400">${spend.detention_m}M detention</span>
                    <span className="text-emerald-400">${spend.community_m}M community</span>
                  </div>
                </div>
              );
            })}

            <Link
              href="/transparency"
              className="block text-center px-4 py-3 text-xs font-bold uppercase tracking-widest border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors mt-4"
            >
              Full money trail →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
});
DetentionMapSection.displayName = 'DetentionMapSection';

// ── Room 2: Therapeutic Alternative ─────────────────────────────

const Room2Section = forwardRef<HTMLElement, { active: boolean; room: typeof journeyContainers[1] }>(
  ({ active, room }, ref) => (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800">
      <div className={`max-w-5xl w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="mb-8">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest bg-yellow-500 text-black">
            Room {room.step} — {room.title}
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-4">What if?</h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl">
          What if we spent $1.55M per child on healing instead of harm?
          Spain&apos;s Diagrama Foundation already proved it works.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Detention side */}
          <div className="border border-red-900 bg-red-950/20 p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-6">
              Australian Detention
            </h3>
            <div className="space-y-4">
              <div><span className="text-2xl font-mono font-bold text-red-400">$4,250</span><span className="text-gray-500 ml-2">per day</span></div>
              <div><span className="text-2xl font-mono font-bold text-red-400">84%</span><span className="text-gray-500 ml-2">reoffend</span></div>
              <div><span className="text-2xl font-mono font-bold text-red-400">18%</span><span className="text-gray-500 ml-2">complete education</span></div>
              <div><span className="text-2xl font-mono font-bold text-red-400">Isolation</span><span className="text-gray-500 ml-2">from family</span></div>
            </div>
          </div>

          {/* Diagrama side */}
          <div className="border border-yellow-700 bg-yellow-950/20 p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-6">
              {room.headline} Model
            </h3>
            <div className="space-y-4">
              {room.stats.map((stat) => (
                <div key={stat.label}>
                  <span className="text-2xl font-mono font-bold text-yellow-400">{stat.value}</span>
                  <span className="text-gray-500 ml-2">{stat.label.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagrama photo strip */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-700">
          {DIAGRAMA_IMAGES.slice(0, 6).map((img) => (
            <div key={img.src} className="flex-none w-40 h-28 relative">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-600 mt-8">{room.duration}</p>
      </div>
    </section>
  )
);
Room2Section.displayName = 'Room2Section';

// ── Diagrama Deep Dive ──────────────────────────────────────────

const DiagramaSection = forwardRef<HTMLElement, { active: boolean }>(
  ({ active }, ref) => (
    <section ref={ref} className="min-h-screen py-20 px-4 border-t border-gray-800 bg-yellow-950/10">
      <div className={`max-w-5xl mx-auto w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-400 mb-4">Deep Dive</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          The Diagrama Model
        </h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl">
          Spain&apos;s Diagrama Foundation runs therapeutic residential centres that replace punishment with education,
          empathy, and family connection. The results speak for themselves.
        </p>

        {/* Key stat callout */}
        <div className="border border-yellow-700 bg-yellow-950/30 p-8 mb-12 text-center">
          <div className="text-5xl md:text-6xl font-mono font-bold text-yellow-400 mb-2">
            &euro;5.64
          </div>
          <p className="text-lg text-gray-300">return per &euro;1 invested</p>
          <p className="text-sm text-gray-500 mt-2">Social return on investment, independently verified</p>
        </div>

        {/* Photo gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
          {DIAGRAMA_IMAGES.map((img) => (
            <div key={img.src} className="aspect-[4/3] relative group overflow-hidden">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>

        {/* YouTube embed placeholder */}
        <div className="aspect-video bg-gray-900 border border-gray-800 flex items-center justify-center mb-12">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <p className="text-gray-500 text-sm">Video coming soon</p>
          </div>
        </div>

        {/* Pull quote */}
        <blockquote className="border-l-4 border-yellow-500 pl-6 py-2 mb-12">
          <p className="text-xl text-gray-300 italic">
            &ldquo;We don&apos;t treat young people as offenders. We treat them as young people
            who have offended — and who deserve the chance to grow.&rdquo;
          </p>
          <footer className="text-sm text-gray-500 mt-3">— Diagrama Foundation staff</footer>
        </blockquote>

        {/* Article links */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Read the full stories</h3>
          {DIAGRAMA_ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/stories/${article.slug}`}
              className="block border border-gray-800 p-4 hover:border-yellow-600 transition-colors group"
            >
              <span className="text-white group-hover:text-yellow-400 transition-colors">
                {article.title}
              </span>
              <span className="text-gray-600 ml-2">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
);
DiagramaSection.displayName = 'DiagramaSection';

// ── Room 3: Community Solutions ─────────────────────────────────

const Room3Section = forwardRef<HTMLElement, { active: boolean; room: typeof journeyContainers[2]; basecamps: BasecampOrg[] }>(
  ({ active, room, basecamps }, ref) => {
    const [showAll, setShowAll] = useState(false);
    const orgs = basecamps.length > 0 ? basecamps : FALLBACK_ORGS.map(o => ({ ...o, description: '', stats: [{ label: 'Impact', value: o.stat }] }));
    const visible = showAll ? orgs : orgs.slice(0, 4);

    return (
      <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800">
        <div className={`max-w-5xl w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="mb-8">
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white">
              Room {room.step} — {room.title}
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The organisations already doing it
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl">{room.summary}</p>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            {visible.map((org) => (
              <Link
                key={org.slug}
                href={`/sites/${org.slug}`}
                className="block border border-emerald-900 bg-emerald-950/20 overflow-hidden hover:border-emerald-500 transition-colors group"
              >
                {org.image ? (
                  <div className="h-40 relative">
                    <Image
                      src={org.image}
                      alt={org.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-emerald-950/50 flex items-center justify-center">
                    <span className="text-4xl font-bold text-emerald-700">{org.name[0]}</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-emerald-400">{org.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{org.region}</p>
                  {org.stats?.[0] && (
                    <p className="text-gray-300 mt-3 text-sm">{org.stats[0].value}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {orgs.length > 4 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="block w-full text-center py-3 text-sm font-bold uppercase tracking-widest border border-emerald-900 text-emerald-400 hover:border-emerald-500 hover:text-emerald-300 transition-colors mb-8"
            >
              Show {orgs.length - 4} more basecamps
            </button>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {room.stats.map((stat) => (
              <div key={stat.label} className="border border-emerald-900 bg-emerald-950/30 p-4 text-center">
                <div className="text-xl font-mono font-bold text-emerald-400">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 mt-8">{room.duration}</p>
        </div>
      </section>
    );
  }
);
Room3Section.displayName = 'Room3Section';

// ── The Opportunity: Redirect the Funding ───────────────────────

const FundingRedirectSection = forwardRef<
  HTMLElement,
  { active: boolean; stats: Stats | null; stateSpending: Record<string, StateSpendingEntry> }
>(({ active, stats, stateSpending }, ref) => {
  const detentionM = stats?.rogs_youth_detention_millions ?? 1141;
  const communityM = stats?.rogs_youth_community_millions ?? 520;
  const totalM = stats?.rogs_youth_total_millions ?? 1723;
  const detPct = totalM > 0 ? Math.round((detentionM / totalM) * 100) : 66;
  const comPct = 100 - detPct;
  const ratio = communityM > 0 ? Math.round(detentionM / communityM) : 2;

  return (
    <section ref={ref} className="min-h-screen py-20 px-4 border-t border-gray-800 bg-gradient-to-b from-gray-950 to-black">
      <div className={`max-w-5xl mx-auto w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-400 mb-4">Follow the Money</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          What if we moved the money?
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl">
          ${detentionM}M spent on detention annually.
          ${communityM}M on community programs.
          That&apos;s {ratio}:1 in favour of what doesn&apos;t work.
        </p>

        {/* Big spending comparison */}
        <div className="mb-12">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Detention — ${detentionM}M</span>
              <span className="text-sm text-gray-500">{detPct}%</span>
            </div>
            <div className="h-8 bg-gray-900">
              <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: active ? `${detPct}%` : '0%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Community — ${communityM}M</span>
              <span className="text-sm text-gray-500">{comPct}%</span>
            </div>
            <div className="h-8 bg-gray-900">
              <div className="h-full bg-emerald-600 transition-all duration-1000" style={{ width: active ? `${comPct}%` : '0%' }} />
            </div>
          </div>
        </div>

        {/* Key messages */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="border border-gray-800 p-6">
            <div className="text-3xl font-mono font-bold text-white mb-2">20x</div>
            <p className="text-gray-400 text-sm">
              For the cost of ONE child in detention, you could fund 20 community programs
            </p>
          </div>
          <div className="border border-gray-800 p-6">
            <div className="text-3xl font-mono font-bold text-white mb-2">84%</div>
            <p className="text-gray-400 text-sm">
              Detention reoffending rate — the system that costs more also fails more
            </p>
          </div>
          <div className="border border-gray-800 p-6">
            <div className="text-3xl font-mono font-bold text-white mb-2">3%</div>
            <p className="text-gray-400 text-sm">
              Community program reoffending — a fraction of the cost, a fraction of the failure
            </p>
          </div>
        </div>

        {/* Aspirational pitch */}
        <div className="border border-emerald-800 bg-emerald-950/20 p-8 mb-8">
          <h3 className="text-2xl font-bold text-emerald-400 mb-4">
            A national network of basecamps
          </h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            Imagine a Centre of Excellence connecting community organisations across Australia —
            sharing what works, channelling funding to evidence-based programs, and building
            the infrastructure for a justice system that actually heals.
          </p>
          <p className="text-gray-400 text-sm">
            Community orgs earn 30% of institutional subscriptions. The platform pays for itself.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/transparency"
            className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest border border-white text-white hover:bg-white hover:text-black transition-colors text-center"
          >
            Explore the money trail →
          </Link>
          <Link
            href="/how-it-works"
            className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors text-center"
          >
            How it works →
          </Link>
        </div>
      </div>
    </section>
  );
});
FundingRedirectSection.displayName = 'FundingRedirectSection';

// ── Section: The Data ─────────────────────────────────────────

const DataSection = forwardRef<HTMLElement, { active: boolean; stats: Stats | null }>(
  ({ active, stats }, ref) => (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800 bg-gray-950">
      <div className={`max-w-4xl w-full text-center transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4">
          ALMA Intelligence
        </p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">The data behind the doors</h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
          Every claim in this exhibition is backed by real data — tracked, verified, and open.
        </p>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="border border-gray-700 p-6">
              <div className="text-3xl font-mono font-bold">{stats.programs_documented}</div>
              <div className="text-xs text-gray-500 mt-2">Interventions tracked</div>
            </div>
            <div className="border border-gray-700 p-6">
              <div className="text-3xl font-mono font-bold">{stats.total_evidence}</div>
              <div className="text-xs text-gray-500 mt-2">Evidence sources</div>
            </div>
            <div className="border border-gray-700 p-6">
              <div className="text-3xl font-mono font-bold">${stats.total_funding_billions}B</div>
              <div className="text-xs text-gray-500 mt-2">Funding tracked</div>
            </div>
            <div className="border border-gray-700 p-6">
              <div className="text-3xl font-mono font-bold">{stats.states_covered}</div>
              <div className="text-xs text-gray-500 mt-2">States covered</div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/intelligence/chat"
            className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest border border-white text-white hover:bg-white hover:text-black transition-colors"
          >
            Ask ALMA anything →
          </Link>
          <Link
            href="/analysis"
            className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors"
          >
            Intelligence dashboard
          </Link>
        </div>
      </div>
    </section>
  )
);
DataSection.displayName = 'DataSection';

// ── Section: Community Voices ─────────────────────────────────

const VoicesSection = forwardRef<HTMLElement, { active: boolean; voices: Voice[] }>(
  ({ active, voices }, ref) => (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800">
      <div className={`max-w-5xl w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Community voices</h2>
          <p className="text-lg text-gray-400">The people behind the data</p>
        </div>

        {voices.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {voices.slice(0, 6).map((voice) => (
              <div key={voice.name} className="border border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  {voice.image_url ? (
                    <img
                      src={voice.image_url}
                      alt={voice.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                      {voice.name[0]}
                    </div>
                  )}
                  <span className="text-sm font-bold">{voice.name}</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed italic">
                  &ldquo;{voice.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p>Voices loading...</p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/contained/stories"
            className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors"
          >
            Read all stories →
          </Link>
        </div>
      </div>
    </section>
  )
);
VoicesSection.displayName = 'VoicesSection';

// ── Funding Recipients Section ──────────────────────────────

const FundingRecipientsSection = forwardRef<HTMLElement, { active: boolean; fundingData: FundingData | null }>(
  ({ active, fundingData }, ref) => {
    const [selectedState, setSelectedState] = useState<string | null>(null);

    if (!fundingData) {
      return (
        <section ref={ref} className="min-h-screen py-20 px-4 border-t border-gray-800 bg-gray-950">
          <div className="max-w-5xl mx-auto text-center text-gray-600 py-24">
            Loading funding data...
          </div>
        </section>
      );
    }

    const { topRecipients, stateSpending, national } = fundingData;
    const maxM = topRecipients[0]?.total_millions || 1;

    const statesWithSpending = STATES.filter(st => stateSpending[st]?.total_m > 0);
    const filteredSpending = selectedState
      ? { [selectedState]: stateSpending[selectedState] }
      : stateSpending;

    return (
      <section ref={ref} className="min-h-screen py-20 px-4 border-t border-gray-800 bg-gray-950">
        <div className={`max-w-6xl mx-auto w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-sm uppercase tracking-[0.3em] text-red-400 mb-4">Follow the Money</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Where $18.4 billion went
          </h2>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl">
            The top organisations receiving justice funding — and the state-by-state spending
            that keeps detention alive.
          </p>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Top recipients table */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
                Top 10 Grant Recipients
              </h3>
              <div className="space-y-2">
                {topRecipients.slice(0, 10).map((org, i) => (
                  <div key={org.recipient_name} className="border border-gray-800 bg-gray-900/50 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-600 w-5">#{i + 1}</span>
                        <span className="text-sm font-bold text-white leading-tight">{org.recipient_name}</span>
                      </div>
                      <span className="text-sm font-mono font-bold text-red-400 whitespace-nowrap ml-4">
                        ${org.total_millions}M
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="h-2 bg-gray-800 ml-8">
                      <div
                        className="h-full bg-red-600 transition-all duration-1000"
                        style={{ width: active ? `${(org.total_millions / maxM) * 100}%` : '0%' }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2 ml-8">
                      <span className="text-[10px] text-gray-500">{org.grant_count} grants</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Source: QLD Government open data (QGIP, Budget SDS, DYJVS contracts, NIAA)
              </p>
            </div>

            {/* State spending sidebar */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
                State Youth Justice Spending (ROGS 2024-25)
              </h3>

              {/* State filter tabs */}
              <div className="flex flex-wrap gap-1 mb-4">
                <button
                  onClick={() => setSelectedState(null)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                    !selectedState ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-500 hover:text-white'
                  }`}
                >
                  All
                </button>
                {statesWithSpending.map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedState(st === selectedState ? null : st)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                      selectedState === st ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-500 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {(selectedState ? [selectedState] : statesWithSpending).map(st => {
                  const spend = filteredSpending[st];
                  if (!spend) return null;
                  const detPct = spend.total_m > 0 ? Math.round((spend.detention_m / spend.total_m) * 100) : 0;

                  return (
                    <div key={st} className="border border-gray-800 bg-gray-900/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">{st}</span>
                        <span className="text-sm font-mono text-gray-400">${spend.total_m}M</span>
                      </div>
                      <div className="h-3 bg-gray-800 flex overflow-hidden mb-2">
                        <div className="bg-red-600 h-full" style={{ width: `${detPct}%` }} />
                        <div className="bg-emerald-600 h-full" style={{ width: `${100 - detPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-red-400">${spend.detention_m}M detention ({detPct}%)</span>
                        <span className="text-emerald-400">${spend.community_m}M community</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* National totals */}
              {national.total_m > 0 && !selectedState && (
                <div className="border border-white/20 bg-gray-900 p-4 mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">National Total</span>
                    <span className="text-sm font-mono font-bold text-white">${national.total_m}M</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    ${national.detention_m}M detention / ${national.community_m}M community
                  </div>
                </div>
              )}

              <Link
                href="/transparency"
                className="block text-center px-4 py-3 text-xs font-bold uppercase tracking-widest border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors mt-4"
              >
                Full transparency dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
);
FundingRecipientsSection.displayName = 'FundingRecipientsSection';

// ── Tour Map Section ────────────────────────────────────────

const TourMapSection = forwardRef<HTMLElement, { active: boolean; tourStops: TourStop[]; onStopClick: (slug: string) => void }>(
  ({ active, tourStops: stops, onStopClick }, ref) => (
    <section ref={ref} className="min-h-screen py-20 px-4 border-t border-gray-800 bg-gradient-to-b from-gray-950 to-black">
      <div className={`max-w-5xl mx-auto w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-400 mb-4">National Tour</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Where the container lands
        </h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl">
          The CONTAINED shipping container is touring Australia. Click a stop to see what&apos;s happening there.
        </p>

        {stops.length > 0 ? (
          <TourMap stops={stops} onStopClick={onStopClick} />
        ) : (
          <div className="w-full h-[400px] border-2 border-gray-800 bg-gray-900 flex items-center justify-center">
            <p className="text-gray-600">Tour map loading...</p>
          </div>
        )}

        {/* Tour stop list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {stops.slice(0, 6).map(stop => {
            const statusColor = stop.status === 'confirmed' ? 'bg-green-600' : stop.status === 'planning' ? 'bg-amber-600' : 'bg-gray-600';
            return (
              <button
                key={stop.eventSlug}
                onClick={() => onStopClick(stop.eventSlug)}
                className="text-left border border-gray-800 p-4 hover:border-emerald-600 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                  <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {stop.city}, {stop.state}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{stop.partner}</p>
                <p className="text-xs text-gray-600 mt-1">{stop.date}</p>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/contained/tour"
            className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors"
          >
            Full tour schedule →
          </Link>
        </div>
      </div>
    </section>
  )
);
TourMapSection.displayName = 'TourMapSection';

// ── Stories Section ─────────────────────────────────────────

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  el: { label: 'Community Voice', color: 'bg-purple-600' },
  article: { label: 'Article', color: 'bg-blue-600' },
  tour: { label: 'Tour Story', color: 'bg-amber-600' },
};

const StoriesSection = forwardRef<HTMLElement, { active: boolean; stories: Story[] }>(
  ({ active, stories }, ref) => (
    <section ref={ref} className="min-h-screen py-20 px-4 border-t border-gray-800 bg-gray-950">
      <div className={`max-w-5xl mx-auto w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-4">Real Stories</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Behind the data, real lives
        </h2>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl">
          Stories from young people, families, and communities affected by the youth justice system.
        </p>

        {stories.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {stories.slice(0, 6).map(story => {
              const badge = SOURCE_BADGES[story.source] || SOURCE_BADGES.el;
              return (
                <div key={story.id} className="border border-gray-800 overflow-hidden group">
                  {story.story_image_url ? (
                    <div className="h-40 relative">
                      <Image
                        src={story.story_image_url}
                        alt={story.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-20 bg-gradient-to-r from-gray-900 to-gray-800" />
                  )}
                  <div className="p-5">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase text-white ${badge.color} mb-3`}>
                      {badge.label}
                    </span>
                    <h3 className="font-bold text-white text-sm leading-snug mb-2 line-clamp-2">
                      {story.slug ? (
                        <Link href={`/stories/${story.slug}`} className="hover:text-gray-300 transition-colors">
                          {story.title}
                        </Link>
                      ) : (
                        story.title
                      )}
                    </h3>
                    {story.excerpt && (
                      <p className="text-sm text-gray-400 line-clamp-3">{story.excerpt}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-3">{story.author_name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p>Stories loading...</p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/contained/stories"
            className="inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest border border-gray-700 text-gray-400 hover:border-white hover:text-white transition-colors"
          >
            Read all stories →
          </Link>
        </div>
      </div>
    </section>
  )
);
StoriesSection.displayName = 'StoriesSection';

// ── Section: Reflect ─────────────────────────────────────────

interface ReflectProps {
  active: boolean;
  isEnrolled: boolean;
  deviceSession: { id: string; displayName: string } | null;
}

const ReflectSection = forwardRef<HTMLElement, ReflectProps>(
  ({ active, isEnrolled, deviceSession }, ref) => {
    const [reflection, setReflection] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
      if (!reflection.trim()) return;
      setSubmitting(true);
      try {
        const res = await fetch('/api/contained/reflections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reflection: reflection.trim(),
            name: deviceSession?.displayName || 'Visitor',
          }),
        });
        if (res.ok) setSubmitted(true);
      } catch {
        // silent fail — reflection is optional
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <section ref={ref} id="reflect" className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800">
        <div className={`max-w-2xl w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4 font-mono">Reflect</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            What stays with you?
          </h2>
          <p className="text-gray-400 mb-8">
            This is yours to keep. Write what you felt, what surprised you, what you can&apos;t unsee.
            {!isEnrolled && <span className="block mt-2 text-gray-500 text-sm">Enroll via QR code to save your reflection.</span>}
          </p>

          {submitted ? (
            <div className="border border-[#059669]/30 bg-[#059669]/5 rounded-lg p-8 text-center">
              <p className="text-[#059669] font-mono text-sm mb-2">Recorded</p>
              <p className="text-gray-300">Your reflection has been saved. Thank you for bearing witness.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value.slice(0, 500))}
                placeholder="What will you carry with you after this?"
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-mono">{reflection.length}/500</span>
                <button
                  onClick={handleSubmit}
                  disabled={!reflection.trim() || submitting || !isEnrolled}
                  className="px-6 py-2.5 bg-white text-black text-sm font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-gray-200 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save reflection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
);
ReflectSection.displayName = 'ReflectSection';

// ── Section: Share Your Story ────────────────────────────────

interface ShareStoryProps {
  active: boolean;
  isEnrolled: boolean;
  deviceSession: { id: string; displayName: string } | null;
}

const ShareStorySection = forwardRef<HTMLElement, ShareStoryProps>(
  ({ active, isEnrolled, deviceSession }, ref) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
      if (!content.trim()) return;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch('/api/contained/stories/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || undefined,
            content: content.trim(),
            audioUrl: audioUrl || undefined,
          }),
        });
        if (res.ok) {
          setSubmitted(true);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to submit story');
        }
      } catch {
        setError('Connection error. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <section ref={ref} id="share-story" className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800">
        <div className={`max-w-2xl w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4 font-mono">Share</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Tell your story
          </h2>
          <p className="text-gray-400 mb-8">
            Your experience matters. Share what brought you here, how you&apos;re connected to youth justice,
            or what this exhibition stirred in you. Write it, or record it in your own voice.
            {!isEnrolled && <span className="block mt-2 text-gray-500 text-sm">Enroll via QR code to share your story.</span>}
          </p>

          {submitted ? (
            <div className="border border-[#059669]/30 bg-[#059669]/5 rounded-lg p-8 text-center">
              <p className="text-[#059669] font-mono text-sm mb-2">Story saved</p>
              <p className="text-gray-300">
                Your story is stored privately. An admin may reach out if we&apos;d like to feature it
                — with your permission.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                  placeholder="Give your story a title (optional)"
                  className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#DC2626] transition-colors"
                />
                <span className="text-xs text-gray-600 font-mono mt-1 block text-right">{title.length}/200</span>
              </div>

              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                  placeholder="What's your connection to youth justice? What did this exhibition make you feel?"
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
                />
                <span className="text-xs text-gray-600 font-mono mt-1 block text-right">{content.length}/2000</span>
              </div>

              <VoiceRecorder
                onRecordingComplete={(url) => setAudioUrl(url)}
                disabled={!isEnrolled}
              />

              {audioUrl && (
                <p className="text-xs text-[#059669] font-mono">Voice note attached</p>
              )}

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-600">
                  Stored privately. Never shared without your consent.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || submitting || !isEnrolled}
                  className="px-6 py-2.5 bg-white text-black text-sm font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-gray-200 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Submit story'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
);
ShareStorySection.displayName = 'ShareStorySection';

// ── Section: Recommend ──────────────────────────────────────

interface RecommendProps {
  active: boolean;
  isEnrolled: boolean;
}

const RecommendSection = forwardRef<HTMLElement, RecommendProps>(
  ({ active, isEnrolled }, ref) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
      if (!name.trim() && !email.trim()) return;
      setSubmitting(true);
      try {
        const res = await fetch('/api/enrollment/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || undefined,
            email: email.trim() || undefined,
            role: role.trim() || undefined,
            reason: reason.trim() || undefined,
          }),
        });
        if (res.ok) setSubmitted(true);
      } catch {
        // silent fail
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <section ref={ref} id="recommend" className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800">
        <div className={`max-w-2xl w-full transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4 font-mono">Recommend</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Who else needs to see this?
          </h2>
          <p className="text-gray-400 mb-8">
            A politician, a teacher, a journalist, a friend. Someone whose perspective might shift.
            {!isEnrolled && <span className="block mt-2 text-gray-500 text-sm">Enroll via QR code to submit a recommendation.</span>}
          </p>

          {submitted ? (
            <div className="border border-[#059669]/30 bg-[#059669]/5 rounded-lg p-8 text-center">
              <p className="text-[#059669] font-mono text-sm mb-2">Sent</p>
              <p className="text-gray-300">We&apos;ll reach out to them. The more people who see this, the harder it is to look away.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Their name"
                  className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#DC2626] transition-colors"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Their email"
                  className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#DC2626] transition-colors"
                />
              </div>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Their role — politician, educator, journalist..."
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#DC2626] transition-colors"
              />
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 300))}
                placeholder="Why should they see this? (optional)"
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#DC2626] transition-colors resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={(!name.trim() && !email.trim()) || submitting || !isEnrolled}
                  className="px-6 py-2.5 bg-[#DC2626] text-white text-sm font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-[#DC2626]/90 transition-colors"
                >
                  {submitting ? 'Sending...' : 'Recommend them'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
);
RecommendSection.displayName = 'RecommendSection';

// ── Section: Take Action ──────────────────────────────────────

const ActionSection = forwardRef<HTMLElement, { active: boolean }>(
  ({ active }, ref) => (
    <section ref={ref} className="min-h-screen flex items-center justify-center py-20 px-4 border-t border-gray-800">
      <div className={`max-w-3xl w-full text-center transition-all duration-1000 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Now you&apos;ve seen it.
        </h2>
        <p className="text-xl text-gray-300 mb-12">
          What you do next matters.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/back-this"
            className="block px-6 py-5 text-sm font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Fund the tour
          </Link>
          <Link
            href="/contained/register"
            className="block px-6 py-5 text-sm font-bold uppercase tracking-widest border border-white text-white hover:bg-white hover:text-black transition-colors"
          >
            Book the experience
          </Link>
          <Link
            href="/contained/nominations"
            className="block px-6 py-5 text-sm font-bold uppercase tracking-widest border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
          >
            Nominate your city
          </Link>
          <Link
            href="/contained/act"
            className="block px-6 py-5 text-sm font-bold uppercase tracking-widest border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors"
          >
            Share the campaign
          </Link>
        </div>

        {/* Extra links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link
            href="/transparency"
            className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
          >
            Explore the full money trail
          </Link>
          <span className="hidden sm:inline text-gray-700">|</span>
          <Link
            href="/how-it-works"
            className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
          >
            See what works
          </Link>
        </div>

        <div className="border-t border-gray-800 pt-12">
          <h3 className="text-lg font-bold mb-6">Stay in the loop</h3>
          <NewsletterSignup source="contained_experience" tags={['CONTAINED_EXPERIENCE', 'NEWSLETTER']} />
        </div>
      </div>
    </section>
  )
);
ActionSection.displayName = 'ActionSection';
