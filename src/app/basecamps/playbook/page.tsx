import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { ArrowRight, Users, Film, Hammer, Mic, Heart, Shield, MapPin, TrendingUp, CheckCircle2, Briefcase } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Basecamp Playbook | ALMA Network | JusticeHub',
  description:
    'How Mounty Yarns went from 1 person to 20 — and how other communities can replicate the model. The Basecamp Playbook for youth-led justice reform.',
  openGraph: {
    title: 'Basecamp Playbook — From 1 to 20',
    description: 'How Mounty Yarns built a youth-led social enterprise for justice reform, and how your community can do it too.',
    type: 'website',
    url: 'https://justicehub.com.au/basecamps/playbook',
  },
};

const PLAYBOOK_PHASES = [
  {
    phase: '01',
    title: 'Start With One Person',
    subtitle: 'The anchor',
    description: 'Every Basecamp starts with one person who has lived experience, cultural authority, or deep community trust. Mounty Yarns started with Shayle McKellar — a Wangkamarra man who completed his HSC in custody and turned his experience into expertise.',
    lesson: 'You don\'t need an organisation. You need one person the community trusts.',
    icon: 'Users',
  },
  {
    phase: '02',
    title: 'Give Young People the Tools',
    subtitle: 'Cameras, not clipboards',
    description: 'Instead of surveying young people or writing reports about them, put cameras, microphones, and production tools directly in their hands. Mounty Yarns\' 24-minute documentary reached 100,000+ viewers — made entirely by young people.',
    lesson: 'The best advocacy is young people telling their own stories.',
    icon: 'Film',
  },
  {
    phase: '03',
    title: 'Build a Physical Space',
    subtitle: 'The Backyard Campus model',
    description: 'Shipping containers, a yarning circle, a basketball court, a gym, a kitchen, and a garden. The Backyard Campus was designed and built by the young people who use it. It cost a fraction of a government facility and it\'s theirs.',
    lesson: 'Young people show up to spaces they built. 3-4 times a week, every week.',
    icon: 'Hammer',
  },
  {
    phase: '04',
    title: 'Run Programs That Stack',
    subtitle: 'Seven programs, $3.5-8K per young person',
    description: 'Documentary filmmaking, podcasting, advocacy workshops, boxing, cooking, cultural connection, and Youth Peak peer support. Each program reinforces the others. A young person might come for boxing and stay for the documentary project.',
    lesson: 'Multiple entry points, one community. Cost per young person: 1/70th of detention.',
    icon: 'Heart',
  },
  {
    phase: '05',
    title: 'Attract Diverse Funding',
    subtitle: '$4.3M from 5 sources',
    description: 'Federal government (JR continuation), state government (Youth on Track), Paul Ramsay Foundation, Dusseldorp Forum, and Ritchie Foundation. No single funder owns the model. The community owns the model.',
    lesson: 'Dual philanthropic + government funding proves the model from both sides.',
    icon: 'TrendingUp',
  },
  {
    phase: '06',
    title: 'Connect to the Network',
    subtitle: 'From local to national',
    description: 'JusticeHub links your stories to evidence, your programs to funding data, and your community to every other Basecamp in the country. Your local work becomes part of a national movement.',
    lesson: 'You\'re not alone. The ALMA Network connects 1,081 verified programs across Australia.',
    icon: 'Shield',
  },
];

const ICON_MAP: Record<string, any> = { Users, Film, Hammer, Heart, TrendingUp, Shield, Mic, Briefcase };

export default async function PlaybookPage() {
  const supabase = createServiceClient() as any;

  // Get Mounty Yarns data
  const [{ data: mountyYarns }, { data: interventions }, { data: stories }, { data: basecamps }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, slug, city, state, tagline')
      .eq('slug', 'mounty-yarns')
      .single(),
    supabase
      .from('alma_interventions')
      .select('name, evidence_level, cost_per_young_person, type')
      .eq('operating_organization_id', '11111111-1111-1111-1111-111111111003')
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('alma_stories')
      .select('id, title, summary')
      .contains('linked_organization_ids', ['11111111-1111-1111-1111-111111111003'])
      .eq('status', 'published')
      .eq('story_type', 'community_voice'),
    supabase
      .from('organizations')
      .select('id, name, slug, state')
      .or('partner_tier.eq.basecamp,type.eq.basecamp'),
  ]);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6 sm:px-12">
            <p
              className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ALMA Network &middot; Basecamp Playbook
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              From 1 to 20.
              <br />
              <span className="text-[#059669]">Here&apos;s how.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-8">
              Mounty Yarns started with one person in Mount Druitt. Today it&apos;s a 20-person
              youth-led organisation running 7 programs, with $4.3M in tracked funding and
              14 young people on the record telling their own stories.
            </p>
            <p className="text-lg text-white/50 max-w-2xl mb-10">
              This playbook documents how they did it — so your community can do it too.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {interventions?.length || 7}
                </p>
                <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Programs
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {stories?.length || 14}
                </p>
                <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Community Voices
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#059669]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  $4.3M
                </p>
                <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Funding Tracked
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#DC2626]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  $0
                </p>
                <p className="text-xs text-white/40 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  NSW Reoffending Grants to ACCOs
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The 6 Phases */}
        <section className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
          <h2
            className="text-2xl font-bold tracking-tight mb-12"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            The Playbook
          </h2>

          <div className="space-y-8">
            {PLAYBOOK_PHASES.map((phase) => {
              const Icon = ICON_MAP[phase.icon] || Users;
              return (
                <div key={phase.phase} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-8 hover:border-[#059669]/30 transition-colors">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <p
                        className="text-xs text-[#0A0A0A]/30 text-center mt-2"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Phase {phase.phase}
                      </p>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-xl font-bold mb-1"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {phase.title}
                      </h3>
                      <p
                        className="text-xs uppercase tracking-wider text-[#059669] font-medium mb-3"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {phase.subtitle}
                      </p>
                      <p className="text-[#0A0A0A]/60 mb-4">{phase.description}</p>
                      <div className="bg-[#F5F0E8] rounded-lg p-4 border-l-4 border-[#059669]">
                        <p className="text-sm font-semibold text-[#0A0A0A]/80">
                          <CheckCircle2 className="w-4 h-4 inline mr-2 text-[#059669]" />
                          {phase.lesson}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* The programs that stack */}
        {interventions && interventions.length > 0 && (
          <section className="bg-white border-y border-[#0A0A0A]/10">
            <div className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
              <h2
                className="text-2xl font-bold tracking-tight mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                The Programs That Stack
              </h2>
              <p className="text-[#0A0A0A]/50 mb-8 max-w-2xl">
                Each program is an entry point. A young person comes for one thing and discovers everything else.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interventions.map((i: any) => (
                  <div key={i.name} className="bg-[#F5F0E8] rounded-lg p-5 border border-[#0A0A0A]/5">
                    <h3 className="font-bold text-sm mb-1">{i.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669] font-medium"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {i.evidence_level?.split(' (')[0]}
                      </span>
                      {i.cost_per_young_person && (
                        <span
                          className="text-xs text-[#0A0A0A]/40"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          ${Number(i.cost_per_young_person).toLocaleString()}/youth
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* The Network */}
        <section className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
          <h2
            className="text-2xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            The Network Is Growing
          </h2>
          <p className="text-[#0A0A0A]/50 mb-8 max-w-2xl">
            Mounty Yarns is one Basecamp. The ALMA Network needs one in every state.
            Each Basecamp is unique — grounded in local culture, local people, local solutions — but
            connected through JusticeHub to shared data, evidence, and advocacy power.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {(basecamps || []).map((bc: any) => (
              <Link
                key={bc.id}
                href={`/sites/${bc.slug}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-[#0A0A0A]/10 p-5 hover:border-[#059669]/30 transition-colors group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0A0A0A] text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold group-hover:underline">{bc.name}</p>
                  <p className="text-xs text-[#0A0A0A]/40 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {bc.state}
                    {bc.slug === 'mounty-yarns' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-[#059669]/10 text-[#059669] rounded text-[10px] font-bold uppercase">Playbook Origin</span>
                    )}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#0A0A0A]/20 group-hover:text-[#0A0A0A]/60 transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0A0A0A] text-white">
          <div className="max-w-5xl mx-auto px-6 sm:px-12 py-16">
            <div className="max-w-2xl">
              <h2
                className="text-3xl font-bold tracking-tight text-white mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Start Your Basecamp
              </h2>
              <p className="text-white/60 mb-3">
                Know a community organisation doing the work? Have lived experience and want
                to build something? The ALMA Network is looking for one Basecamp in every state.
              </p>
              <p className="text-white/40 text-sm mb-8">
                Mounty Yarns consults with new Basecamps — storytelling methodology, space activation,
                program design, and advocacy training. Their expertise becomes your foundation.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/basecamps/apply"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors"
                >
                  Nominate a Basecamp <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sites/mounty-yarns"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  See Mounty Yarns
                </Link>
                <Link
                  href="/contained"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  CONTAINED Tour
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
