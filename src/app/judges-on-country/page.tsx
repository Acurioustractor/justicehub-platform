'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Printer,
  Scale,
  Search,
  Send,
  Shield,
  Sparkles,
  Target,
  Ticket,
  Video,
} from 'lucide-react';

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

interface FeaturedCase {
  name: string;
  region: string;
  tagline: string;
  description: string;
  imageUrl: string | null;
  videoUrl?: string;
  color: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

interface AlmaSearchIntervention {
  id: string;
  name: string;
  description?: string;
  state?: string;
  type?: string;
  organization_name?: string;
}

interface CampaignOutreachInsert {
  name: string;
  email: string | null;
  org: string;
  location: string;
  sector: string;
  status: string;
  notes: string;
}

interface CampaignOutreachClient {
  from(table: 'campaign_outreach'): {
    insert(values: CampaignOutreachInsert): Promise<{ error: unknown }>;
  };
}

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

const FIELD_STATS = [
  {
    value: '$1.33M',
    label: 'Annual cost to detain one young person',
    source: 'Productivity Commission ROGS 2024-25',
  },
  {
    value: '$75',
    label: 'Daily cost of community alternatives',
    source: 'Community services benchmark',
  },
  {
    value: '84%',
    label: 'Reoffending after detention',
    source: 'QLD youth justice strategy',
  },
  {
    value: '1,081',
    label: 'Alternatives already mapped on JusticeHub',
    source: 'ALMA database',
  },
];

const SEARCH_SHORTCUTS = [
  { label: 'NT on-country', query: 'on country', state: 'NT' },
  { label: 'QLD diversion', query: 'diversion', state: 'QLD' },
  { label: 'NSW mentoring', query: 'mentoring', state: 'NSW' },
  { label: 'Family-led support', query: 'family', state: '' },
];

const OONCHIUMPPA_MEDIA = {
  team: '/images/orgs/oonchiumpa/hero.jpg',
  mentoring: '/images/orgs/oonchiumpa/mentoring.jpg',
  kristy: '/images/orgs/oonchiumpa/team/kristy.jpg',
  tanya: '/images/orgs/oonchiumpa/team/tanya.jpg',
  country: '/images/orgs/oonchiumpa/homestead.jpg',
  lawStudents: '/images/orgs/oonchiumpa/law-students.jpg',
} as const;

const OONCHIUMPPA_VOICES = [
  {
    kicker: 'Founder voice',
    name: 'Kristy Bloomfield',
    role: 'Co-Founder & CEO',
    quote: '“Connection to culture, country, and elders is the foundation of healing.”',
    supporting:
      'Kristy grounds the work in community authority, family responsibility, and healing on Country rather than system distance.',
    imageUrl: OONCHIUMPPA_MEDIA.kristy,
    imageAlt: 'Kristy Bloomfield from Oonchiumpa',
    href: '/organizations/oonchiumpa?lens=judiciary',
    linkLabel: 'Open Oonchiumpa profile',
  },
  {
    kicker: 'Founder voice',
    name: 'Tanya Turner',
    role: 'Co-Founder & Director',
    quote: '“Our young people need to know they are valued.”',
    supporting:
      'Tanya adds the second line judges should hold onto: “Not by the system, but by their own mob.”',
    imageUrl: OONCHIUMPPA_MEDIA.tanya,
    imageAlt: 'Tanya Turner from Oonchiumpa',
    href: '/alma/oonchiumpa',
    linkLabel: 'Read the Oonchiumpa story',
  },
  {
    kicker: 'Youth voice',
    name: 'Jackquann, 14',
    role: 'Voice used with permission',
    quote: '“Programs.”',
    supporting:
      'Asked what would stop him getting in trouble, he answered: “Looking after my family.” Context image shown here is from Oonchiumpa mentoring, not a portrait of Jackquann.',
    imageUrl: OONCHIUMPPA_MEDIA.mentoring,
    imageAlt: 'Young people participating in Oonchiumpa mentoring and activity',
    href: '/sites/oonchiumpa',
    linkLabel: 'Open the Atnarpa site page',
  },
  {
    kicker: 'Youth voice',
    name: 'Laquisha, 16',
    role: 'Voice used with permission',
    quote: '“Oppression.”',
    supporting:
      'Laquisha described being sent to Darwin youth detention 1,500km from home. Twelve-minute phone calls. No family there.',
    imageUrl: null,
    imageAlt: '',
    href: '/judges-on-country/alice-springs',
    linkLabel: 'Open the Alice Springs context page',
  },
] as const;

const FEATURED_CASES: FeaturedCase[] = [
  {
    name: 'Oonchiumpa',
    region: 'Alice Springs, NT',
    tagline: 'Healing on country with cultural authority',
    description:
      'Community-led, on-country programs where young people reconnect with family, culture, land, and practical responsibility. Start here, then read the longer story and voices behind it.',
    imageUrl: OONCHIUMPPA_MEDIA.team,
    color: '#DC2626',
    primaryHref: '/organizations/oonchiumpa?lens=judiciary',
    primaryLabel: 'Open basecamp profile',
    secondaryHref: '/alma/oonchiumpa',
    secondaryLabel: 'Read the Oonchiumpa story',
  },
  {
    name: 'Mounty Yarns',
    region: 'Mount Druitt, NSW',
    tagline: 'Young people documenting their own reality',
    description:
      'Youth-led storytelling, backyard activation, and community journalism that shifts the narrative around Western Sydney while building real pathways and skills.',
    imageUrl:
      'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/mounty-yarns/backyard-workbee/20251210-1E5A8290.jpg',
    color: '#059669',
    primaryHref: '/organizations/mounty-yarns?lens=judiciary',
    primaryLabel: 'Open basecamp profile',
    secondaryHref: '/intelligence/interventions',
    secondaryLabel: 'Browse NSW alternatives',
  },
  {
    name: 'Palm Island Community Company',
    region: 'Palm Island, QLD',
    tagline: 'Community control at service scale',
    description:
      'A community-controlled organisation proving what sustained local infrastructure looks like: family support, cultural connection, enterprise, and practical alternatives to harm.',
    imageUrl: null,
    color: '#0A0A0A',
    primaryHref: '/stories/at-the-speed-of-ceremony-learning-partnership-on-palm-i',
    primaryLabel: 'Read the Palm Island story',
    secondaryHref: '/intelligence/civic',
    secondaryLabel: 'Open accountability map',
  },
  {
    name: 'BG Fit',
    region: 'Mount Isa, QLD',
    tagline: 'Fitness, culture, and daily contact',
    description:
      'Brodie Germaine and BG Fit show what happens when consistency, culture, and high expectations are built into everyday youth engagement instead of one-off interventions.',
    imageUrl: '/images/orgs/bg-fit/hero.jpg',
    color: '#059669',
    primaryHref: '/organizations/bg-fit?lens=judiciary',
    primaryLabel: 'Open basecamp profile',
    secondaryHref: '/stories/spotlight-on-changemaker-brodie-germaine',
    secondaryLabel: 'Read the BG Fit story',
  },
];

function toEmbedUrl(url?: string) {
  if (!url) return null;
  if (url.includes('youtube.com') && url.includes('v=')) {
    return `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}`;
  }
  if (url.includes('youtu.be/')) {
    return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}`;
  }
  if (url.includes('vimeo.com')) {
    return `https://player.vimeo.com/video/${url.match(/vimeo\.com\/(\d+)/)?.[1]}`;
  }
  return url;
}

export default function JudgesOnCountryPage() {
  const supabase = createClient();
  const [tourStops, setTourStops] = useState<TourStop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [contributeForm, setContributeForm] = useState({
    name: '',
    email: '',
    program: '',
    location: '',
    details: '',
  });
  const [contributing, setContributing] = useState(false);
  const [contributed, setContributed] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const storiesRef = useRef<HTMLDivElement>(null);
  const contributeRef = useRef<HTMLDivElement>(null);
  const connectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/contained/tour-stops')
      .then((response) => response.json())
      .then((data) => setTourStops(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!searchQuery.trim() && !searchState) return;

    setSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery);
      if (searchState) params.set('state', searchState);
      params.set('type', 'all');
      params.set('limit', '20');

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      let results = Array.isArray(data.results) ? data.results : [];

      if (results.length < 5 && searchQuery.trim()) {
        try {
          const locationResponse = await fetch(
            `/api/intelligence/alma-search?q=${encodeURIComponent(searchQuery)}&limit=15`
          );
          if (locationResponse.ok) {
            const locationData = await locationResponse.json();
            const interventions: AlmaSearchIntervention[] = Array.isArray(locationData.interventions)
              ? locationData.interventions
              : [];
            const locationResults = interventions.map((intervention) => ({
              type: 'intervention',
              id: intervention.id,
              name: intervention.name,
              description: intervention.description?.substring(0, 200),
              url: `/intelligence/interventions/${intervention.id}`,
              state: intervention.state,
              metadata: {
                type: intervention.type,
                org: intervention.organization_name,
              },
            }));

            const existingIds = new Set(results.map((result: SearchResult) => result.id));
            results = [
              ...results,
              ...locationResults.filter((result: SearchResult) => !existingIds.has(result.id)),
            ];
          }
        } catch {
          // Best-effort fallback only.
        }
      }

      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleContribute(event: React.FormEvent) {
    event.preventDefault();
    setContributing(true);

    try {
      const outreachClient = supabase as unknown as CampaignOutreachClient;
      const { error } = await outreachClient.from('campaign_outreach').insert({
        name: contributeForm.name,
        email: contributeForm.email || null,
        org: contributeForm.program,
        location: contributeForm.location,
        sector: 'judiciary',
        status: 'program-suggestion',
        notes: `[Judges on Country contribution] ${contributeForm.details}`,
      });

      if (!error) {
        setContributed(true);
      }
    } catch {
      // Best effort.
    } finally {
      setContributing(false);
    }
  }

  function applySearchShortcut(query: string, state: string) {
    setSearchQuery(query);
    setSearchState(state);
    setHasSearched(false);
    setSearchResults([]);
  }

  const selectedStateLabel =
    AUSTRALIAN_STATES.find((state) => state.value === searchState)?.label || 'your jurisdiction';

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F5F0E8]">
        <section
          id="video"
          className="border-b-2 border-gray-800 bg-[#0A0A0A] px-4 pb-20 pt-32 text-white"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="text-left">
              <p className="mb-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#059669]">
                Judges on Country
              </p>
              <h1
                className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.02 }}
              >
                A field guide to what works beyond detention.
              </h1>
              <p className="mb-8 max-w-2xl text-lg leading-relaxed text-gray-300">
                Start with Oonchiumpa. Search what exists near your court. Carry the postcard set on
                the trip. Bring the proof back to chambers.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 bg-[#DC2626] px-6 py-4 text-base font-bold text-white transition-colors hover:bg-red-700"
                >
                  <Search className="h-5 w-5" />
                  Search Local Programs
                </button>
                <Link
                  href="/judges-on-country/postcards"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white px-6 py-4 text-base font-bold text-white transition-colors hover:bg-white hover:text-[#0A0A0A]"
                >
                  <Printer className="h-5 w-5" />
                  Print QR Postcards
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <a
                  href="https://share.descript.com/view/1A29kyrHglp"
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-white/15 bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  <div className="mb-2 flex items-center gap-2 text-[#059669]">
                    <Video className="h-4 w-4" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                      Start Here
                    </span>
                  </div>
                  <p className="mb-0 text-sm text-gray-300">
                    Watch the Oonchiumpa video — founders, youth workers, and young people from the postcards.
                  </p>
                </a>
                <div className="border border-white/15 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[#059669]">
                    <Scale className="h-4 w-4" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                      Use on the Day
                    </span>
                  </div>
                  <p className="mb-0 text-sm text-gray-300">
                    Search alternatives by state, place, or practice type.
                  </p>
                </div>
                <div className="border border-white/15 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[#059669]">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                      Take Back
                    </span>
                  </div>
                  <p className="mb-0 text-sm text-gray-300">
                    Carry the postcard kit and use the QR links later in chambers.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden border-4 border-gray-800 bg-black shadow-[12px_12px_0px_0px_rgba(5,150,105,1)]">
                <iframe
                  src={toEmbedUrl('https://vimeo.com/902992336') || undefined}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Oonchiumpa case study"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href="/organizations/oonchiumpa?lens=judiciary"
                  className="border border-[#059669]/40 bg-[#111111] p-4 transition-colors hover:bg-[#171717]"
                >
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#059669]">
                    Basecamp Profile
                  </p>
                  <p className="mb-0 text-sm font-bold text-white">Open Oonchiumpa profile</p>
                </Link>
                <Link
                  href="/contained/register"
                  className="border border-white/15 bg-[#111111] p-4 transition-colors hover:bg-[#171717]"
                >
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#059669]">
                    Trip Planning
                  </p>
                  <p className="mb-0 text-sm font-bold text-white">Register for the CONTAINED route</p>
                </Link>
                <button
                  onClick={() => connectRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="border border-white/15 bg-[#111111] p-4 text-left transition-colors hover:bg-[#171717]"
                >
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#059669]">
                    Chambers Pack
                  </p>
                  <p className="mb-0 text-sm font-bold text-white">See the field kit and next steps</p>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-800 bg-[#0A0A0A] px-4 py-8">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
            {FIELD_STATS.map((stat) => (
              <div key={stat.label} className="border-l border-white/10 pl-4">
                <div
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-gray-300">{stat.label}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  {stat.source}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="oonchiumpa-voices" className="bg-[#F1EADF] px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
                  Real People, Real Lines
                </p>
                <h2
                  className="mb-4 max-w-3xl text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Walk into the trip holding the actual people and stories, not a generic model.
                </h2>
                <p className="max-w-3xl text-lg text-gray-700">
                  These names, lines, and story elements come from the live Oonchiumpa material and
                  the consented story page. They are here so the trip starts with community voice,
                  family reality, and lived consequence.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative min-h-[220px] overflow-hidden border-2 border-[#0A0A0A] bg-[#0A0A0A]">
                  <Image
                    src={OONCHIUMPPA_MEDIA.team}
                    alt="Oonchiumpa team on Country"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 280px"
                  />
                </div>
                <div className="relative min-h-[220px] overflow-hidden border-2 border-[#0A0A0A] bg-[#0A0A0A]">
                  <Image
                    src={OONCHIUMPPA_MEDIA.lawStudents}
                    alt="Oonchiumpa leaders with visiting law students on Country"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 280px"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {OONCHIUMPPA_VOICES.map((voice) => (
                <div
                  key={voice.name}
                  className="flex h-full flex-col overflow-hidden border-2 border-[#0A0A0A] bg-white"
                >
                  {voice.imageUrl ? (
                    <div className="relative h-56 w-full border-b-2 border-[#0A0A0A] bg-[#0A0A0A]">
                      <Image
                        src={voice.imageUrl}
                        alt={voice.imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    </div>
                  ) : (
                    <div className="border-b-2 border-[#0A0A0A] bg-[#0A0A0A] px-5 py-6 text-white">
                      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#DC2626]">
                        Youth voice
                      </p>
                      <p
                        className="mb-0 text-3xl font-bold leading-tight"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                      >
                        {voice.quote}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#059669]">
                      {voice.kicker}
                    </p>
                    <h3
                      className="mb-1 text-xl font-bold text-[#0A0A0A]"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {voice.name}
                    </h3>
                    <p className="mb-3 text-xs uppercase tracking-[0.14em] text-gray-500">{voice.role}</p>
                    {voice.imageUrl ? (
                      <p
                        className="mb-3 text-2xl font-bold leading-tight text-[#0A0A0A]"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                      >
                        {voice.quote}
                      </p>
                    ) : null}
                    <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-700">{voice.supporting}</p>
                    <Link
                      href={voice.href}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#0A0A0A] underline underline-offset-4 transition-colors hover:text-[#DC2626]"
                    >
                      {voice.linkLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section ref={searchRef} id="search" className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
                Search by Jurisdiction
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Find community alternatives near your court.
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                Search across programs and organisations by state, place, or practice type. This is
                the fastest way to move from principle to local options.
              </p>
            </div>

            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {SEARCH_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={() => applySearchShortcut(shortcut.query, shortcut.state)}
                  className="border border-[#0A0A0A]/20 bg-white px-3 py-2 text-xs font-mono uppercase tracking-[0.14em] text-[#0A0A0A] transition-colors hover:border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="space-y-4 border-2 border-[#0A0A0A] bg-white p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Alice Springs, diversion, mentoring, on country..."
                    className="w-full border-2 border-[#0A0A0A] bg-white py-4 pl-12 pr-4 text-lg text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  />
                </div>
                <select
                  value={searchState}
                  onChange={(event) => setSearchState(event.target.value)}
                  className="border-2 border-[#0A0A0A] bg-white px-4 py-4 font-mono text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#059669]"
                >
                  <option value="">All States</option>
                  {AUSTRALIAN_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.value}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-[#0A0A0A] px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                </button>
              </div>
              <p className="mb-0 text-sm text-gray-500">
                Current focus: {selectedStateLabel}. Search will return the strongest match across
                interventions, organisations, and related ALMA records.
              </p>
            </form>

            {hasSearched && (
              <div className="mt-8">
                {searchResults.length === 0 ? (
                  <div className="border-2 border-[#0A0A0A] bg-white p-6 text-center">
                    <p className="mb-2 text-gray-700">No matching programs surfaced in this search.</p>
                    <p className="mb-0 text-sm text-gray-500">
                      Know one we should include?{' '}
                      <button
                        onClick={() => contributeRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="font-bold text-[#DC2626] underline"
                      >
                        Add it to the map.
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-gray-500">
                      {searchResults.length} results
                    </p>
                    {searchResults.map((result) => {
                      const orgName =
                        result.metadata && typeof result.metadata.org === 'string'
                          ? result.metadata.org
                          : null;

                      return (
                        <Link
                          key={`${result.type}-${result.id}`}
                          href={result.url}
                          className="block border-2 border-[#0A0A0A] bg-white p-5 transition-shadow hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#059669]">
                                  <Target className="h-3.5 w-3.5" />
                                  {result.type}
                                </span>
                                {result.state && (
                                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500">
                                    <MapPin className="mr-1 inline h-3 w-3" />
                                    {result.state}
                                  </span>
                                )}
                                {orgName && (
                                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500">
                                    {orgName}
                                  </span>
                                )}
                              </div>
                              <h3 className="mb-1 text-lg font-bold text-[#0A0A0A]">{result.name}</h3>
                              {result.description && (
                                <p className="mb-0 text-sm text-gray-600">{result.description}</p>
                              )}
                            </div>
                            <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
                          </div>
                        </Link>
                      );
                    })}

                    <div
                      id="grantscope"
                      className="mt-6 flex flex-col items-start justify-between gap-4 border-2 border-[#059669] bg-white p-6 md:flex-row md:items-center"
                    >
                      <div>
                        <h4 className="mb-1 flex items-center gap-2 font-bold text-[#0A0A0A]">
                          <ExternalLink className="h-5 w-5 text-[#059669]" />
                          Add the funding context
                        </h4>
                        <p className="mb-0 text-sm text-gray-600">
                          Cross-check the local supply with structural funding flows in {selectedStateLabel}.
                        </p>
                      </div>
                      <a
                        href={`https://grantscope.com.au/justice-reinvestment?state=${searchState}&source=judges-campaign`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap bg-[#059669] px-6 py-3 text-sm font-bold text-white shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-colors hover:bg-[#047857]"
                      >
                        View Regional Funding
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section ref={storiesRef} id="stories" className="bg-[#0A0A0A] px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-gray-400">
                Wider Field
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-white md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Start with Oonchiumpa, then widen the lens.
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-gray-300">
                Once the trip is grounded in Oonchiumpa, compare it with other operating programs,
                relationships, and local infrastructures already doing the work detention claims to do.
              </p>
            </div>

            <div className="space-y-6">
              {FEATURED_CASES.map((item) => (
                <div
                  key={item.name}
                  className="overflow-hidden border-2 border-gray-700 bg-[#F5F0E8] transition-shadow hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.45)]"
                >
                  <div className="md:flex">
                    {item.videoUrl ? (
                      <div className="relative w-full flex-shrink-0 md:w-80">
                        <div className="aspect-video md:h-full md:aspect-auto">
                          <iframe
                            src={toEmbedUrl(item.videoUrl) || undefined}
                            className="h-full w-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title={item.name}
                          />
                        </div>
                      </div>
                    ) : item.imageUrl ? (
                      <div className="relative h-56 w-full flex-shrink-0 md:h-auto md:w-80">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 320px"
                        />
                      </div>
                    ) : (
                      <div className="w-full flex-shrink-0 md:w-3" style={{ backgroundColor: item.color }} />
                    )}

                    <div className="flex-1 p-6 md:p-8">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <span className="font-mono text-xs uppercase tracking-[0.16em] text-gray-500">
                            {item.region}
                          </span>
                          <h3
                            className="mt-1 text-2xl font-bold text-[#0A0A0A]"
                            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                          >
                            {item.name}
                          </h3>
                          <p className="mb-0 mt-1 text-sm font-bold" style={{ color: item.color }}>
                            {item.tagline}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-700">{item.description}</p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href={item.primaryHref}
                          className="inline-flex items-center gap-2 bg-[#DC2626] px-4 py-2 text-sm font-bold text-white shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-colors hover:bg-red-700"
                        >
                          <Building2 className="h-4 w-4" />
                          {item.primaryLabel}
                        </Link>
                        {item.secondaryHref && item.secondaryLabel && (
                          <Link
                            href={item.secondaryHref}
                            className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-4 py-2 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A] hover:text-white"
                          >
                            <BookOpen className="h-4 w-4" />
                            {item.secondaryLabel}
                          </Link>
                        )}
                        <button
                          onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0A0A0A] underline underline-offset-4 hover:text-[#DC2626]"
                        >
                          <Search className="h-4 w-4" />
                          Search nearby alternatives
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="case" className="bg-white px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
                Bench Briefing
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                The court’s role is not abstract.
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-gray-600">
                Sentencing, referrals, and courtroom language all shape whether young people move
                deeper into carceral systems or back toward community.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="border-2 border-[#0A0A0A] p-6">
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#DC2626]">
                  The cost of detention
                </p>
                <div
                  className="mb-2 text-4xl font-bold text-[#DC2626]"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  $1.33M/year
                </div>
                <p className="mb-0 text-sm text-gray-600">
                  Per young person in detention, with high rates of recontact and significant cultural,
                  family, and educational disruption.
                </p>
              </div>

              <div className="border-2 border-[#059669] p-6">
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#059669]">
                  The community alternative
                </p>
                <div
                  className="mb-2 text-4xl font-bold text-[#059669]"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  $75/day
                </div>
                <p className="mb-0 text-sm text-gray-600">
                  Community-led placements and supports cost a fraction of detention and keep young
                  people connected to family, country, and opportunity.
                </p>
              </div>

              <div className="border-2 border-[#0A0A0A] bg-[#0A0A0A] p-6 text-white">
                <h3
                  className="mb-3 flex items-center gap-2 text-xl font-bold"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  <Shield className="h-6 w-6 text-[#DC2626]" />
                  Accountability is now searchable
                </h3>
                <p className="mb-5 text-sm text-gray-300">
                  Civic intelligence tracks what governments promise, what oversight bodies recommend,
                  and where implementation stalls. Use it to place courtroom decisions inside the
                  wider system pattern.
                </p>
                <Link
                  href="/intelligence/civic"
                  className="inline-flex items-center gap-2 border-2 border-white px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black"
                >
                  View oversight map
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="border-2 border-[#0A0A0A] p-6">
                <h3
                  className="mb-3 text-xl font-bold text-[#0A0A0A]"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  What judges can do next
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                    Know the local alternatives before the next matter comes up.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                    Ask for community-based options and impact reports, not only risk narratives.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#059669]" />
                    Carry the postcard kit back to chambers and share the proof with colleagues.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="tour" className="px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-gray-500">
                Trip Route
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                See it on country and through CONTAINED.
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                Use the trip to connect the lived environment, the organisations doing the work, and
                the evidence you can carry forward.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                {tourStops.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {tourStops.map((stop, index) => (
                      <div
                        key={`${stop.city}-${stop.state}-${index}`}
                        className="border-2 border-[#0A0A0A] bg-white p-5 transition-shadow hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-[#0A0A0A]">
                              {stop.city}, {stop.state}
                            </h3>
                            {stop.partner && (
                              <p className="mb-0 text-sm font-mono text-[#059669]">{stop.partner}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-mono font-bold uppercase ${
                              stop.status === 'confirmed'
                                ? 'bg-[#059669] text-white'
                                : stop.status === 'planning'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {stop.status}
                          </span>
                        </div>
                        {stop.date && <p className="mb-2 text-sm font-mono text-gray-500">{stop.date}</p>}
                        {stop.description && <p className="mb-0 text-sm text-gray-600">{stop.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    <Globe className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="mb-0">Tour stops loading…</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="border-2 border-[#0A0A0A] bg-white p-6">
                  <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#DC2626]">
                    Bring with you
                  </p>
                  <h3
                    className="mb-3 text-2xl font-bold text-[#0A0A0A]"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    The six-card field pack
                  </h3>
                  <p className="text-sm text-gray-600">
                    A6 double-sided postcards built around Kristy and Tanya, Jackquann, Nigel,
                    Laquisha, and the trust story judges can carry back to chambers.
                  </p>
                  <Link
                    href="/judges-on-country/postcards"
                    className="mt-5 inline-flex items-center gap-2 bg-[#0A0A0A] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                  >
                    <Printer className="h-4 w-4" />
                    Open postcard kit
                  </Link>
                </div>

                <div className="border-2 border-[#059669] bg-white p-6">
                  <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#059669]">
                    Trip logistics
                  </p>
                  <p className="mb-4 text-sm text-gray-600">
                    Register interest, bring colleagues, or route people from the trip into the live
                    CONTAINED experience.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/contained/register"
                      className="inline-flex items-center gap-2 bg-[#059669] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#047857]"
                    >
                      <Ticket className="h-4 w-4" />
                      Register interest
                    </Link>
                    <Link
                      href="/contained"
                      className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] px-5 py-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A] hover:text-white"
                    >
                      Learn about CONTAINED
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={contributeRef} id="contribute" className="bg-white px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#DC2626]">
                Add to the Map
              </p>
              <h2
                className="mb-3 text-3xl font-bold text-[#0A0A0A] md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Know a program we’re missing?
              </h2>
              <p className="text-lg text-gray-600">
                Help us capture the programs you see making a difference but which have not yet been
                documented on the platform.
              </p>
            </div>

            {contributed ? (
              <div className="border-2 border-[#0A0A0A] bg-[#059669] p-8 text-center text-white">
                <CheckCircle className="mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-2xl font-bold">Thank you</h3>
                <p className="mb-0">
                  We’ll review the submission and fold it into the map. Your local knowledge makes the
                  evidence stronger.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContribute} className="space-y-4 border-2 border-[#0A0A0A] p-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-bold">Your name</label>
                    <input
                      type="text"
                      value={contributeForm.name}
                      onChange={(event) =>
                        setContributeForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full border-2 border-[#0A0A0A] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold">Email (optional)</label>
                    <input
                      type="email"
                      value={contributeForm.email}
                      onChange={(event) =>
                        setContributeForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="w-full border-2 border-[#0A0A0A] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Program or organisation name</label>
                  <input
                    type="text"
                    value={contributeForm.program}
                    onChange={(event) =>
                      setContributeForm((current) => ({ ...current, program: event.target.value }))
                    }
                    className="w-full border-2 border-[#0A0A0A] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    placeholder="BackTrack Youth Works, Armidale"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">Location / region</label>
                  <input
                    type="text"
                    value={contributeForm.location}
                    onChange={(event) =>
                      setContributeForm((current) => ({ ...current, location: event.target.value }))
                    }
                    className="w-full border-2 border-[#0A0A0A] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    placeholder="Western NSW, Alice Springs"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">What makes it effective?</label>
                  <textarea
                    value={contributeForm.details}
                    onChange={(event) =>
                      setContributeForm((current) => ({ ...current, details: event.target.value }))
                    }
                    rows={4}
                    className="w-full resize-none border-2 border-[#0A0A0A] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    placeholder="What outcomes have you seen? How does it work differently from detention-led responses?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={contributing}
                  className="w-full bg-[#0A0A0A] px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {contributing ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="h-5 w-5" />
                      Submit Program
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        <section ref={connectRef} id="connect" className="bg-[#0A0A0A] px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="mb-3 font-mono text-sm uppercase tracking-[0.22em] text-[#059669]">
                Take Back to Chambers
              </p>
              <h2
                className="mb-4 text-3xl font-bold text-white md:text-4xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Carry the proof with you after the trip.
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-gray-300">
                Use the postcard kit, open the live search, and keep documenting what works so this
                does not end as a one-day immersion.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="border border-white/10 bg-gray-900 p-8">
                <Printer className="mb-4 h-8 w-8 text-[#059669]" />
                <h3
                  className="mb-2 text-xl font-bold text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Print the QR postcard set
                </h3>
                <p className="mb-6 text-sm text-gray-400">
                  Six A6 cards built from real Oonchiumpa photos, youth voice, founder lines, and
                  QR routes back into the live platform.
                </p>
                <Link
                  href="/judges-on-country/postcards"
                  className="inline-flex items-center gap-2 bg-[#DC2626] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
                >
                  Open postcard kit
                </Link>
              </div>

              <div className="border border-white/10 bg-gray-900 p-8">
                <Target className="mb-4 h-8 w-8 text-[#059669]" />
                <h3
                  className="mb-2 text-xl font-bold text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Keep searching the live map
                </h3>
                <p className="mb-6 text-sm text-gray-400">
                  Open interventions, search by jurisdiction, and request rapid summaries from ALMA
                  when a local matter needs context.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 bg-[#059669] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#047857]"
                  >
                    Search this page
                  </button>
                  <Link
                    href="/intelligence/chat"
                    className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    Ask ALMA
                  </Link>
                </div>
              </div>

              <div className="border border-white/10 bg-gray-900 p-8">
                <BookOpen className="mb-4 h-8 w-8 text-[#059669]" />
                <h3
                  className="mb-2 text-xl font-bold text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Bring more people into the loop
                </h3>
                <p className="mb-6 text-sm text-gray-400">
                  Share this page with colleagues, route them into CONTAINED, and add the missing
                  community programs you already know matter.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/contained/register"
                    className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-gray-100"
                  >
                    <Ticket className="h-4 w-4" />
                    Register interest
                  </Link>
                  <button
                    onClick={() => contributeRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    Add a program
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#DC2626] px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="mb-4 text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The alternatives are already here. The question is whether we use them.
            </h2>
            <p className="mb-8 text-lg text-white/90">
              Search the map, print the cards, and keep this evidence moving after the trip ends.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => searchRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white px-8 py-4 text-lg font-bold text-[#DC2626] transition-colors hover:bg-gray-100"
              >
                Search Programs
              </button>
              <Link
                href="/judges-on-country/postcards"
                className="border-2 border-white px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-white/10"
              >
                Print Postcards
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
