'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Globe,
  Heart,
  MapPin,
  Sparkles,
  Sprout,
  Users,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';

// Basecamp location type
interface BasecampLocation {
  slug: string;
  name: string;
  region: string;
  country: string;
  description: string;
  coordinates: { lat: number; lng: number };
  stats?: { label: string; value: string }[];
  image?: string;
}

// Fallback basecamp data, the four anchor communities.
// DB-side: organizations.partner_tier='basecamp' must be set on each for the
// /api/basecamps response to match this list. If the API returns fewer than four,
// the merge below preserves the canonical fallback so the centre always shows
// the full ring.
const FALLBACK_BASECAMPS: BasecampLocation[] = [
  {
    slug: 'oonchiumpa',
    name: 'Oonchiumpa',
    region: 'Mparntwe / Alice Springs',
    country: 'Eastern Arrernte Country (NT)',
    description:
      'Cultural authority leads, legal knowledge follows. Kristy Bloomfield and Tanya Turner hold young people on Country at Atnarpa, on Loves Creek Station, an hour and a half east of Mparntwe.',
    coordinates: { lat: -23.698, lng: 133.88 },
    stats: [
      { label: 'Diversion success', value: '95% diversion success' },
      { label: 'School re-engagement', value: '72% school re-engagement' },
    ],
    image: '/images/orgs/oonchiumpa/hero.jpg',
  },
  {
    slug: 'palm-island-community-company',
    name: 'Palm Island Community Company',
    region: 'The Centre, Townsville',
    country: 'Bwgcolman / Manbarra Country (QLD)',
    description:
      "Palm Island's community-controlled organisation, working from The Centre in Townsville. Stretch Beds, family work, and the long thread of trust that turns one released young person into the builder who teaches the next.",
    coordinates: { lat: -19.258, lng: 146.818 },
    stats: [
      { label: 'Programs delivered', value: 'PICC delivers seven programs' },
      { label: 'Stretch Bed builds', value: 'Stretch Bed enterprise live' },
    ],
    image: '/images/orgs/picc/hero.jpg',
  },
  {
    slug: 'bg-fit',
    name: 'BG Fit',
    region: 'Mount Isa',
    country: 'Kalkadoon Country (QLD)',
    description:
      'Sport, discipline, and a daily rhythm that gives young people in Mount Isa a place to be that is not the watch house. Fitness as the entry point. Belonging as the outcome.',
    coordinates: { lat: -20.725, lng: 139.498 },
    stats: [
      { label: 'Diversion rate', value: '85% diversion rate' },
      { label: 'Youth engaged', value: '400+ youth engaged each year' },
    ],
    image: '/images/orgs/bg-fit/hero.jpg',
  },
  {
    slug: 'mmeic',
    name: 'Minjerribah Moorgumpin Elders-in-Council',
    region: 'Minjerribah / North Stradbroke Island',
    country: 'Quandamooka Country (QLD)',
    description:
      'Quandamooka Elders holding cultural authority on Minjerribah and Moorgumpin. The first voice in the room when the question is what young people from these islands need.',
    coordinates: { lat: -27.49, lng: 153.42 },
    stats: [
      { label: 'Cultural authority', value: 'Elder-led' },
      { label: 'Country', value: 'Quandamooka' },
    ],
    image: '/images/orgs/mmeic/hero.jpg',
  },
];

const CROSS_DOMAIN_SUPPORTS = [
  {
    icon: Heart,
    label: 'Justice',
    note: 'Diversion, sentencing alternatives, on-Country accompaniment.',
  },
  {
    icon: Users,
    label: 'Child protection',
    note: 'Family work, kinship care, keeping children close.',
  },
  {
    icon: BookOpen,
    label: 'Education',
    note: 'Re-engagement, alternative learning, cultural curriculum.',
  },
  {
    icon: Sparkles,
    label: 'Disability',
    note: 'Recognition, support, the system getting out of the way.',
  },
] as const;

const WHAT_HAPPENS_HERE = [
  {
    icon: Sprout,
    title: 'Innovation in practice',
    body: "Organisations bring the work they're already doing and prototype the next version of it together. Not pilot-fatigue. Refinement.",
  },
  {
    icon: Users,
    title: 'Training the people who hold young people',
    body: 'Sector workers, youth workers, case workers, magistrates, teachers, support staff, trained by community, alongside community, in the practice of holding well.',
  },
  {
    icon: Globe,
    title: 'Indigenous knowledges centred',
    body: "Cultural authority is not a guest speaker. It's the curriculum, the methodology, and the assessment criteria. Country teaches, Elders correct, the centre listens.",
  },
  {
    icon: Building2,
    title: 'Reporting flows inward, evidence flows outward',
    body: 'The basecamps send what they are doing to the centre. The centre carries that proof into the rooms where decisions get made: courtrooms, cabinet rooms, foundation boards.',
  },
] as const;

const RELEASE_PATHWAY = [
  {
    label: 'JusticeHub online',
    href: '/',
    body: 'The public search and guided doors help people find the work without needing to understand the whole platform.',
  },
  {
    label: 'CONTAINED Adelaide',
    href: '/adelaide',
    body: 'The June 23 experience makes youth remand human before visitors move into evidence and action.',
  },
  {
    label: 'ALMA alternatives',
    href: '/alma',
    body: 'The Australian Living Map of Alternatives shows the local models that can hold young people instead.',
  },
  {
    label: 'Country reports',
    href: '/justice-network/countries',
    body: 'Africa and Europe reports widen the imagination while keeping scoping, sourcing, and consent boundaries visible.',
  },
  {
    label: 'Basecamps',
    href: '#basecamps',
    body: 'Oonchiumpa, PICC, BG Fit, and MMEIC become the local learning anchors for a physical Centre of Excellence.',
  },
] as const;

export default function CentreOfExcellencePage() {
  const [basecamps, setBasecamps] = useState<BasecampLocation[]>(FALLBACK_BASECAMPS);

  useEffect(() => {
    async function loadBasecamps() {
      try {
        const res = await fetch('/api/basecamps');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Merge API data with fallback (API takes precedence on overlap;
            // missing slugs fall back to canonical four).
            const merged = FALLBACK_BASECAMPS.map((fallback) => {
              const fromApi = data.find((d: BasecampLocation) => d.slug === fallback.slug);
              return fromApi ? { ...fallback, ...fromApi } : fallback;
            });
            setBasecamps(merged);
          }
        }
      } catch (err) {
        console.error('Failed to load basecamps:', err);
      }
    }
    loadBasecamps();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset bg-[#0A0A0A]">
        {/* Hero. The reframe. */}
        <section className="border-b-2 border-[#0A0A0A] bg-[#0A0A0A] text-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <p className="mb-4 font-mono text-sm uppercase tracking-[0.28em] text-[#059669]">
              Centre of Excellence · The Harvest, Witta QLD
            </p>
            <h1
              className="mb-6 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Centring the young person.
              <br />
              <span className="text-[#F5F0E8]/70">Fixing the system around them.</span>
            </h1>
            <p className="mb-8 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
              Not a youth justice centre. A place built on the obvious truth that young people who
              come into contact with the system are the same young people who already touch
              disability, child protection, education, and family services. The centre is what
              happens when the people doing this work hold each other in one place, on one
              piece of Country, with one shared method.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#harvest"
                className="inline-flex items-center justify-center gap-2 bg-[#DC2626] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-red-700"
              >
                The Harvest at Witta <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#basecamps"
                className="inline-flex items-center justify-center gap-2 border-2 border-white px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-[#0A0A0A]"
              >
                The four basecamps <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/centre-of-excellence/system-map"
                className="inline-flex items-center justify-center gap-2 border-2 border-white px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-[#0A0A0A]"
              >
                System map <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-[#0A0A0A] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-[#DC2626]">
              Release pathway
            </p>
            <h2
              className="mb-5 max-w-3xl text-3xl font-black leading-tight md:text-4xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The public launch should point back to a real place where the people doing the work can gather.
            </h2>
            <div className="grid gap-3 md:grid-cols-5">
              {RELEASE_PATHWAY.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group border-2 border-[#0A0A0A] bg-[#F5F0E8] p-4 transition-colors hover:bg-white"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#DC2626]">
                      0{index + 1}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="mb-2 font-black">{item.label}</h3>
                  <p className="text-sm leading-6 text-gray-700">{item.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* The reframe. Cross-domain. */}
        <section className="border-b-2 border-[#0A0A0A] bg-[#F5F0E8]">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-[#DC2626]">
                  The reframe
                </p>
                <h2
                  className="mb-5 text-3xl font-black leading-tight md:text-4xl"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Not built on fear. Built on support.
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-gray-800 md:text-lg">
                  <p>
                    The young people whose names appear on a postcard from Atnarpa, on a remand
                    record at Holtze, on a school suspension list at St Joseph's, on a child
                    protection file in Rockhampton, on a disability assessment in Townsville, are
                    almost always the same young people. The system gives them four different file
                    numbers. Community gives them one name.
                  </p>
                  <p>
                    The Centre of Excellence works at that one name. It treats justice, child
                    protection, education, and disability as four sides of one room rather than
                    four buildings on four streets. It centres the young person and asks the
                    system to fit around them, not the other way.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 self-center">
                {CROSS_DOMAIN_SUPPORTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="border-2 border-[#0A0A0A] bg-white p-5"
                    >
                      <Icon className="mb-3 h-6 w-6 text-[#059669]" />
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#DC2626]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm leading-snug text-gray-700">{item.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* The Harvest at Witta. The physical centre. */}
        <section
          id="harvest"
          className="border-b-2 border-[#0A0A0A] bg-white"
        >
          <div className="relative h-[320px] w-full border-b-2 border-[#0A0A0A] bg-[#0A0A0A] md:h-[460px]">
            <Image
              src="/images/harvest/seed-house.jpg"
              alt="The Harvest at Witta on Jinibara Country, Sunshine Coast hinterland. The former Green Harvest seed house at dusk, surrounded by garden and bushland."
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 md:px-10 md:pb-8">
              <div className="mx-auto max-w-6xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/80">
                  The Harvest · Witta QLD · Jinibara Country
                </p>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-[#059669]">
              The physical centre
            </p>
            <h2
              className="mb-5 text-3xl font-black leading-tight md:text-5xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The Harvest, Witta, on Jinibara Country.
            </h2>
            <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
              <div className="space-y-4 text-base leading-relaxed text-gray-800 md:text-lg">
                <p>
                  The Harvest sits on Jinibara Country in the Sunshine Coast hinterland, postcode
                  4552, on the former Green Harvest organic seed and gardening site. Two thousand
                  cars pass through Witta every weekend on their way somewhere else. The centre
                  asks them to stop.
                </p>
                <p>
                  This is the physical home of the Centre of Excellence. Seasonal kitchen,
                  garden, workshop, gathering ground. The basecamps come here to work, train,
                  rest, and exchange practice. Young people come here. Elders come here. People
                  who work in the sector come here, alongside the people who hold young people in
                  community, and the line between them gets thinner.
                </p>
                <p className="font-medium text-[#0A0A0A]">
                  Eat. Gather. Make. Grow. The method the building is built on.
                </p>
              </div>
              <div className="border-2 border-[#0A0A0A] bg-[#F5F0E8] p-6">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#DC2626]">
                  What lives here
                </p>
                <ul className="space-y-3 text-sm leading-relaxed text-gray-800">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#059669]" />
                    <span>Working kitchen and gathering hall for cohort-scale visits.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#059669]" />
                    <span>Stretch Bed workshop and shared making space.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#059669]" />
                    <span>
                      Garden centre and training plot, where land-based learning is the curriculum,
                      not a metaphor.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#059669]" />
                    <span>
                      Quiet rooms for the writing, recording, and editorial work that turns practice
                      into evidence the rest of the system can read.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#059669]" />
                    <span>
                      Accommodation for visiting basecamp teams, so a week on Country here is a real
                      week, not a day-trip.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* The four basecamps */}
        <section id="basecamps" className="border-b-2 border-[#0A0A0A] bg-[#F5F0E8]">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-[#DC2626]">
                  The basecamps
                </p>
                <h2
                  className="mb-3 text-3xl font-black leading-tight md:text-5xl"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Four anchor communities.
                  <br />
                  One ring.
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-gray-700 md:text-lg">
                  Mparntwe, Townsville, Mount Isa, Minjerribah. Four community-controlled
                  organisations holding young people in place, on Country, with cultural authority
                  leading the work. Witta is the centre. The basecamps are the ring.
                </p>
              </div>
              <Link
                href="/centre-of-excellence/map?category=basecamp"
                className="inline-flex items-center gap-2 self-start border-2 border-[#0A0A0A] bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#0A0A0A] transition-colors hover:bg-[#0A0A0A] hover:text-white md:self-end"
              >
                <MapPin className="h-4 w-4" /> View on map
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {basecamps.map((basecamp) => (
                <Link
                  key={basecamp.slug}
                  href={`/organizations/${basecamp.slug}`}
                  className="group flex flex-col overflow-hidden border-2 border-[#0A0A0A] bg-white transition-shadow hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,0.4)]"
                >
                  <div className="relative h-52 w-full border-b-2 border-[#0A0A0A] bg-[#0A0A0A]">
                    {basecamp.image ? (
                      <Image
                        src={basecamp.image}
                        alt={basecamp.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-gray-700">
                        <span className="text-5xl font-black text-white/30">
                          {basecamp.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                        {basecamp.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#059669]">
                      {basecamp.country}
                    </p>
                    <h3
                      className="mb-3 text-2xl font-black"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {basecamp.name}
                    </h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-700">
                      {basecamp.description}
                    </p>
                    {basecamp.stats && basecamp.stats.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {basecamp.stats.map((stat, idx) => (
                          <span
                            key={idx}
                            className="border border-[#0A0A0A] bg-[#F5F0E8] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#0A0A0A]"
                          >
                            {stat.value}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0A0A0A] group-hover:text-[#DC2626]">
                      Open the basecamp <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Country visits Country. Oonchiumpa to SEQ as worked example. */}
        <section className="border-b-2 border-[#0A0A0A] bg-[#0A0A0A] text-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-[#059669]">
              How the centre works in practice
            </p>
            <h2
              className="mb-6 text-3xl font-black leading-tight md:text-5xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Country visits Country.
            </h2>
            <div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4 text-base leading-relaxed text-white/85 md:text-lg">
                <p>
                  The first worked example. The Oonchiumpa team flies east from Mparntwe to South
                  East Queensland. Kristy Bloomfield, Tanya Turner, Fred Campbell, the youth
                  workers, the young people who choose to come. They land at Witta. They stay at
                  the Harvest. They spend a week on Jinibara Country.
                </p>
                <p>
                  They sit with Quandamooka Elders from MMEIC. They visit BG Fit on the way back.
                  They share the practice that holds 21 active young people across seven language
                  groups within 150 kilometres of Mparntwe, and they hear the practice that holds
                  young people in Mount Isa, on Palm Island, on Minjerribah. The exchange is the
                  evidence.
                </p>
                <p className="font-medium text-white">
                  Cultural authority leads in both directions. Country teaches Country. The centre
                  holds the room for the conversation that the system has never made space for.
                </p>
              </div>
              <div className="border-2 border-white/30 bg-white/5 p-6">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#059669]">
                  What the visit produces
                </p>
                <ul className="space-y-3 text-sm leading-relaxed text-white/85">
                  <li className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-[#DC2626]">01</span>
                    <span>
                      A shared method, refined by the people who carry it, not designed for them.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-[#DC2626]">02</span>
                    <span>
                      Photographs, recordings, and stories captured under Empathy Ledger consent
                      for use across the four basecamps and the wider sector.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-[#DC2626]">03</span>
                    <span>
                      A training cohort drawn from sector workers across the country, taught by the
                      basecamps, on Country, in practice rather than slides.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-[#DC2626]">04</span>
                    <span>
                      A book chapter. A field note. A submission. The evidence the rest of the
                      system can read, written from inside the work.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* What the centre does */}
        <section className="border-b-2 border-[#0A0A0A] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-[#DC2626]">
              What the centre does
            </p>
            <h2
              className="mb-10 max-w-3xl text-3xl font-black leading-tight md:text-5xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Innovation, training, Indigenous knowledges, evidence.
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {WHAT_HAPPENS_HERE.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="border-2 border-[#0A0A0A] bg-[#F5F0E8] p-7"
                  >
                    <Icon className="mb-4 h-8 w-8 text-[#DC2626]" />
                    <h3
                      className="mb-3 text-xl font-black"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-800 md:text-base">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Global learning map preview */}
        <section className="border-b-2 border-[#0A0A0A] bg-[#F5F0E8]">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-[#059669]">
                  Reading the room beyond Australia
                </p>
                <h2
                  className="mb-3 max-w-2xl text-3xl font-black leading-tight md:text-4xl"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  What works elsewhere, read carefully.
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-gray-700">
                  The centre keeps a long view of community-led practice across sixteen
                  international models, four Australian frameworks, and the research that informs
                  them. Read selectively. Adapt with cultural authority. Never lift wholesale.
                </p>
              </div>
              <Link
                href="/centre-of-excellence/map"
                className="inline-flex items-center gap-2 self-start bg-[#0A0A0A] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-gray-800 md:self-end"
              >
                <MapPin className="h-4 w-4" /> Open the full map
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Link
                href="/centre-of-excellence/global-insights"
                className="group border-2 border-[#0A0A0A] bg-white p-6 transition-shadow hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <Globe className="mb-4 h-8 w-8 text-[#0A0A0A]" />
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#DC2626]">
                  Sixteen international models
                </p>
                <h3 className="mb-2 text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Spain. Aotearoa. Finland. Scotland. Missouri.
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-700">
                  What recidivism looks like when the system invests in community first. Read with
                  context, not as templates.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0A0A0A] group-hover:text-[#DC2626]">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/centre-of-excellence/best-practice"
                className="group border-2 border-[#0A0A0A] bg-white p-6 transition-shadow hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <Building2 className="mb-4 h-8 w-8 text-[#0A0A0A]" />
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#DC2626]">
                  Four Australian frameworks
                </p>
                <h3 className="mb-2 text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  QLD. NSW. VIC. WA.
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-700">
                  Each state's approach, named honestly, with what the policy intended and what the
                  outcomes actually show.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0A0A0A] group-hover:text-[#DC2626]">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/centre-of-excellence/research"
                className="group border-2 border-[#0A0A0A] bg-white p-6 transition-shadow hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <BookOpen className="mb-4 h-8 w-8 text-[#0A0A0A]" />
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#DC2626]">
                  Twenty-seven peer-reviewed pieces
                </p>
                <h3 className="mb-2 text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  The research library.
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-700">
                  Trauma-informed care, Indigenous diversion, restorative practice, disability
                  intersections. Searchable, annotated, growing.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0A0A0A] group-hover:text-[#DC2626]">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Closing. Get involved. */}
        <section className="bg-[#0A0A0A] text-white">
          <div className="mx-auto max-w-5xl px-6 py-20 text-center md:py-24">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-[#059669]">
              Join the work
            </p>
            <h2
              className="mb-6 text-3xl font-black leading-tight md:text-5xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              The four basecamps are already doing the work.
              <br />
              <span className="text-white/70">The centre is what makes it visible.</span>
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
              For organisations doing community-led work in justice, child protection, education,
              or disability. For sector workers ready to be trained by community. For funders ready
              to back the long thread. For Elders, researchers, practitioners, and people who have
              been through the system and want to shape what comes next.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#DC2626] px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-red-700"
              >
                Get involved <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/stewards"
                className="inline-flex items-center justify-center gap-2 border-2 border-white px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-[#0A0A0A]"
              >
                Become a steward
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
