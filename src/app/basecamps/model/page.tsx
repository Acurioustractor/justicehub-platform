import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  MapPin, ArrowRight, Users, Database, Mic, Calendar, DollarSign,
  Radio, BarChart3, Globe, Zap, Heart, Shield, BookOpen, Briefcase,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Basecamp Model | JusticeHub',
  description:
    'How community-led basecamps connect young people, data, and funders to reshape youth justice across Australia. Starting with Mounty Yarns in Mt Druitt.',
  openGraph: {
    title: 'The Basecamp Model — JusticeHub',
    description: 'A national network of community-led basecamps reshaping youth justice through data, storytelling, and shared services.',
  },
};

const BASECAMPS = [
  {
    name: 'Mounty Yarns',
    location: 'Mt Druitt, NSW',
    type: 'Urban',
    pop: '250,000+',
    status: 'Active',
    programs: 7,
    team: 20,
    funded: '$4.3M',
    slug: 'mounty-yarns',
    description: 'Youth-led storytelling and justice reinvestment in Western Sydney. 1 person → 20 staff. 100K+ documentary views.',
    highlight: 'anchor',
  },
  {
    name: 'PICC',
    location: 'Townsville / Palm Island, QLD',
    type: 'Regional',
    pop: '3,000',
    status: 'Proposed',
    programs: 21,
    team: 200,
    funded: '$0 philanthropic',
    slug: 'picc-townsville',
    description: 'Largest community-controlled youth justice response in Northern Queensland. 21 programs, 200 staff — zero philanthropic funding.',
    highlight: 'gap',
  },
  {
    name: 'Oonchiumpa',
    location: 'Tennant Creek, NT',
    type: 'Remote',
    pop: '3,500',
    status: 'Active',
    programs: 5,
    team: 12,
    funded: 'Federal + community',
    slug: 'oonchiumpa',
    description: '95% diversion rate. Central Arrernte community-designed programs. 55 judges visiting mid-April 2026.',
    highlight: 'proof',
  },
];

const MODEL_LAYERS = [
  {
    icon: Database,
    title: 'Intelligence Layer',
    subtitle: 'Data that serves community',
    description: '1,081 verified programs. 148,386 funding records. $114.9B tracked. Every program costed, every dollar traced — so community orgs can prove what works and what it costs vs detention.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Zap,
    title: 'Agentic Workflows',
    subtitle: 'AI that works for basecamps',
    description: 'Automated evidence gathering, funding discovery, media monitoring, and Hansard analysis. ALMA Chat connects 20 tools so basecamps can query the data in plain language.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Mic,
    title: 'Storytelling & Listening',
    subtitle: 'Young people tell their own stories',
    description: 'Empathy Ledger integration — 261 photos, 12 stories, 51 storytellers. Documentary, podcast, and digital storytelling tools. Content stays under community control.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Users,
    title: 'Shared Services',
    subtitle: 'What one basecamp builds, all use',
    description: 'Playbooks, templates, funding applications, advocacy toolkits, legal support, governance frameworks. Built once by one community, shared with all.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Calendar,
    title: 'Events & Workshops',
    subtitle: 'Coming together',
    description: 'CONTAINED tour stops, youth-led roundtables, judicial immersions, funder showcases. Each basecamp hosts events that connect local communities to the national conversation.',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    icon: DollarSign,
    title: 'Revenue Pathways',
    subtitle: 'Earning from expertise',
    description: 'Basecamps earn through consulting, speaking, training, and advising the $327M+ youth justice sector. Young people with lived experience become paid consultants — not research subjects.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
];

const REVENUE_STREAMS = [
  {
    stream: 'Paid Advocacy Workshops',
    description: 'Government and legal sector pay young people to share lived experience and solutions',
    example: 'Mounty Yarns: $3,500/person JR workshops — part of $2.3M federal program',
    potential: '$50-150K/year',
  },
  {
    stream: 'Speaking & Keynotes',
    description: 'Conference presentations, university lectures, parliamentary testimony',
    example: 'TEDxSydney, NSW Children\'s Court Conference, PRF 2024 keynote, Restorative Practices Conference',
    potential: '$2-5K per engagement',
  },
  {
    stream: 'Consulting to Sector',
    description: 'Advising the $327M NSW youth justice sector on what actually works — from people who know',
    example: 'Community-led Youth Justice Roundtable at UNSW (May 2025)',
    potential: '$100-300K/year',
  },
  {
    stream: 'Training & Playbooks',
    description: 'Teaching other communities how to build basecamps using the documented model',
    example: 'Basecamp Playbook: 6-phase replication guide built from Mounty Yarns\' journey',
    potential: '$30-80K/year',
  },
  {
    stream: 'Documentary & Content',
    description: 'Licensing, screening fees, and commissioned storytelling projects',
    example: '100K+ views documentary. Content licensed for training, advocacy, and education.',
    potential: '$20-50K/year',
  },
  {
    stream: 'Data & Research Partnerships',
    description: 'University partnerships and research collaborations powered by JusticeHub data',
    example: 'Rohan Lulham (USyd), Natalie Chiappazzo (WSU Dean), Yuwaya Ngarra-li (UNSW)',
    potential: '$50-200K/year',
  },
];

export default async function BasecampModelPage() {
  const supabase = createServiceClient() as any;

  const [interventionCount, fundingCount, orgCount] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .gt('amount_dollars', 0),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true }),
  ]);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6 sm:px-12">
            <p
              className="text-xs uppercase tracking-[0.3em] text-white/40 mb-6"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              The Model
            </p>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 max-w-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Community basecamps reshaping a billion-dollar system
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-3xl mb-10">
              Australia spends $327M per year on youth justice in NSW alone. Most of it goes to
              detention that costs $939K per person and fails 84% of the time. Basecamps
              are community organisations that prove the alternative — and earn from their expertise.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: (interventionCount.count || 0).toLocaleString(), label: 'Programs mapped' },
                { value: `$${((fundingCount.count || 0) > 100000 ? '114.9B' : (fundingCount.count || 0).toLocaleString())}`, label: 'Funding tracked' },
                { value: `${((orgCount.count || 0) / 1000).toFixed(0)}K+`, label: 'Organisations' },
                { value: '$5,214', label: 'Avg program cost/yr' },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Network — 3 Basecamps */}
        <section className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
          <p className="text-xs uppercase tracking-[0.3em] text-[#0A0A0A]/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            The Network
          </p>
          <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Three basecamps. Every context.
          </h2>
          <p className="text-[#0A0A0A]/60 max-w-2xl mb-10">
            Urban, regional, and remote. If the model works across all three, it works anywhere in Australia.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {BASECAMPS.map((bc) => (
              <Link
                key={bc.slug}
                href={`/sites/${bc.slug}`}
                className="group bg-white rounded-xl border border-[#0A0A0A]/10 p-6 hover:border-[#0A0A0A]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[10px] uppercase tracking-widest text-[#0A0A0A]/40"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {bc.type}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    bc.status === 'Active' ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/40'
                  }`}>
                    {bc.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {bc.name}
                </h3>
                <p className="text-xs text-[#0A0A0A]/50 flex items-center gap-1 mb-3">
                  <MapPin className="w-3 h-3" /> {bc.location} · Pop. {bc.pop}
                </p>
                <p className="text-sm text-[#0A0A0A]/60 mb-4">{bc.description}</p>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#0A0A0A]/5">
                  <div>
                    <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{bc.programs}</p>
                    <p className="text-[10px] text-[#0A0A0A]/40 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Programs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{bc.team}</p>
                    <p className="text-[10px] text-[#0A0A0A]/40 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Team</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{bc.funded}</p>
                    <p className="text-[10px] text-[#0A0A0A]/40 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Funded</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works — 6 Layers */}
        <section className="bg-[#0A0A0A] text-white py-16">
          <div className="max-w-5xl mx-auto px-6 sm:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              How It Works
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Six layers powering every basecamp
            </h2>
            <p className="text-white/50 max-w-2xl mb-10">
              Each basecamp gets the same infrastructure. What one community builds, all communities use.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {MODEL_LAYERS.map((layer, i) => {
                const Icon = layer.icon;
                return (
                  <div key={i} className="border border-white/10 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/5`}>
                        <Icon className={`w-5 h-5 ${layer.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{layer.title}</h3>
                        <p className="text-xs text-white/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{layer.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/60">{layer.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Revenue Pathways */}
        <section className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
          <p className="text-xs uppercase tracking-[0.3em] text-[#0A0A0A]/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Revenue Pathways
          </p>
          <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Earning from expertise, not grants alone
          </h2>
          <p className="text-[#0A0A0A]/60 max-w-2xl mb-10">
            Young people with lived experience are the experts this sector needs.
            Basecamps create pathways for them to earn from speaking, consulting,
            training, and advising the billion-dollar system that failed them.
          </p>

          <div className="space-y-4">
            {REVENUE_STREAMS.map((r, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <div>
                    <h3 className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{r.stream}</h3>
                    <p className="text-sm text-[#0A0A0A]/60 mt-1">{r.description}</p>
                  </div>
                  <span
                    className="text-sm font-bold text-[#059669] whitespace-nowrap"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {r.potential}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-[#0A0A0A]/5">
                  <p className="text-xs text-[#0A0A0A]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    Example: {r.example}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-[#059669]/5 border border-[#059669]/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <DollarSign className="w-6 h-6 text-[#059669] flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-[#0A0A0A]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Combined potential: $300K–$800K per basecamp per year
                </p>
                <p className="text-sm text-[#0A0A0A]/60 mt-1">
                  This is on top of program funding. It&apos;s revenue earned by young people
                  for sharing the expertise that a $327M system currently pays consultants for.
                  Mounty Yarns already earns through workshops and speaking — this scales it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Mounty Yarns Proof */}
        <section className="bg-[#0A0A0A] text-white py-16">
          <div className="max-w-5xl mx-auto px-6 sm:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              The Proof Point
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Mounty Yarns — from 1 to 20
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { value: '1→20', label: 'Staff growth', sub: 'One person to 20-person team' },
                { value: '$4.3M', label: 'Raised', sub: '5 funding sources, community-owned' },
                { value: '100K+', label: 'Documentary views', sub: 'TEDxSydney, Children\'s Court, PRF' },
                { value: '$5,214', label: 'Cost per person/yr', sub: 'vs $939,000 detention' },
              ].map((s, i) => (
                <div key={i} className="border border-white/10 p-5 rounded-lg">
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
                  <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</p>
                  <p className="text-xs text-white/30 mt-2">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="border border-white/10 rounded-xl p-6">
                <h3 className="font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  What they built
                </h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> Backyard Campus — youth-designed space endorsed by 6 Elders</li>
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> 24-minute documentary made entirely by young people</li>
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> NSW&apos;s first Community-led Youth Justice Roundtable (UNSW, May 2025)</li>
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> Paid advocacy workshops for government and legal sectors</li>
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" /> Girls Program, Music Program, OzTag, Youth on Track</li>
                </ul>
              </div>
              <div className="border border-white/10 rounded-xl p-6">
                <h3 className="font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  What it proves
                </h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2"><BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Replicates the Maranguka model (31:1 ROI) in urban context</li>
                  <li className="flex items-start gap-2"><BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Dual philanthropic + government funding validates from both sides</li>
                  <li className="flex items-start gap-2"><BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Mentioned in NSW Parliament during bail reform debates</li>
                  <li className="flex items-start gap-2"><BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Named in The Conversation, NITV, Dusseldorp Forum features</li>
                  <li className="flex items-start gap-2"><BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> Zero ministerial meetings — yet outperforms everything the minister funds</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/basecamps/playbook"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
              >
                Read the Playbook <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sites/mounty-yarns"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Visit Mounty Yarns
              </Link>
            </div>
          </div>
        </section>

        {/* CONTAINED Connection */}
        <section className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
          <p className="text-xs uppercase tracking-[0.3em] text-[#0A0A0A]/40 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Events
          </p>
          <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CONTAINED brings it to the public
          </h2>
          <p className="text-[#0A0A0A]/60 max-w-2xl mb-10">
            A shipping container, three rooms. At every tour stop, the local basecamp fills Room 3
            with their story. 30 minutes that change how people see youth justice.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { city: 'Mt Druitt, NSW', date: 'May 1', partner: 'Mounty Yarns', status: 'Planning', slug: 'contained-mount-druitt-launch' },
              { city: 'Brisbane, QLD', date: 'May 15', partner: 'YAC', status: 'Planning', slug: 'contained-brisbane' },
              { city: 'Adelaide, SA', date: 'Jun 15', partner: 'JRI + Conference', status: 'Planning', slug: 'contained-adelaide-reintegration' },
              { city: 'Townsville, QLD', date: 'Jul 1', partner: 'PICC', status: 'New', slug: 'contained-townsville-picc' },
              { city: 'Perth, WA', date: 'Aug', partner: 'UWA + JRI', status: 'Planning', slug: 'contained-perth-uwa' },
              { city: 'Tennant Creek, NT', date: 'Sep 15', partner: 'Oonchiumpa', status: 'Confirmed', slug: 'contained-tennant-creek' },
            ].map((stop, i) => (
              <Link
                key={i}
                href={`/contained/tour/${stop.slug}`}
                className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#0A0A0A]/30 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#0A0A0A]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{stop.date}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    stop.status === 'Confirmed' ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/40'
                  }`}>
                    {stop.status}
                  </span>
                </div>
                <h3 className="font-bold group-hover:underline" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stop.city}</h3>
                <p className="text-xs text-[#0A0A0A]/50 mt-1">{stop.partner}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Judges on Country connection */}
        <section className="bg-[#0A0A0A]/5 py-12">
          <div className="max-w-5xl mx-auto px-6 sm:px-12">
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-8 md:flex md:items-center md:gap-8">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-[#0A0A0A]/40 mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Also happening
                </p>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  55 Judges on Country at Oonchiumpa
                </h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  Mid-April 2026. The same data basecamps use to prove what works
                  is now being shown to the judiciary. Evidence postcards powered by JusticeHub.
                  The pipeline: community programs → basecamp data → judicial awareness → system change.
                </p>
              </div>
              <Link
                href="/judges-on-country"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] text-white font-semibold rounded-lg hover:bg-[#0A0A0A]/90 transition-colors text-sm mt-4 md:mt-0"
              >
                See event <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0A0A0A] text-white py-16">
          <div className="max-w-3xl mx-auto px-6 sm:px-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The system spends billions.<br />
              These communities have the answers.
            </h2>
            <p className="text-white/50 mb-8 max-w-xl mx-auto">
              Basecamps connect young people, data, and decision-makers.
              Every community that joins makes the network stronger.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/basecamps/apply"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] font-bold rounded-lg hover:bg-white/90 transition-colors text-sm"
              >
                Become a Basecamp
              </Link>
              <Link
                href="/basecamps"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                See the Network
              </Link>
              <Link
                href="/contained"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                CONTAINED Tour
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
