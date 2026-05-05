import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, KeyRound, Users, Camera, GraduationCap, Landmark, Scale, Building2, Newspaper, Flame } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How Contained Works — The Tour | JusticeHub',
  description: 'Three rooms. Three builders. Ten minutes per room. The container is built by the people it is for, then walked through by everyone else.',
  openGraph: {
    title: 'How Contained Works — The Tour',
    description: 'Three rooms, three builders. Ten minutes per room. The container is built by the people it is for, then walked through by everyone else.',
    type: 'website',
    url: '/contained/how-it-works',
  },
};

const ROOMS = [
  {
    n: 1,
    title: 'The cell',
    builder: 'Young people + local youth support org',
    hue: '#DC2626',
    body: 'The first room is a detention cell, recreated by young people with lived experience and the local youth support organisation. They decide what it should look like, what it should feel like, what should be on the walls. It is built from memory, not from a brief.',
    program: '5 days · co-design + build · paid as expertise',
  },
  {
    n: 2,
    title: 'What works',
    builder: 'In partnership with Diagrama Foundation, Spain',
    hue: '#f59e0b',
    body: 'The second room holds the alternative. Spain\'s Diagrama Foundation runs the model the rest of the world is moving toward — therapeutic centres, family contact, education at the centre. The base room stays consistent. Local context can be layered in.',
    program: 'Locally adaptable · co-developed with Diagrama',
  },
  {
    n: 3,
    title: 'What\'s already running',
    builder: 'Local frontline org + young people + their staff',
    hue: '#059669',
    body: 'The third room is built by an Aboriginal community-controlled organisation or a frontline organisation already running youth-justice work in that city. Their model. Their voice. What they need to keep going. What sustainability looks like for them.',
    program: '5 days · co-design + build · the org owns the room',
  },
];

const WALK_THROUGH = [
  { icon: Clock, label: '30 minutes total · 10 in each room' },
  { icon: KeyRound, label: 'Doors lock behind you. One person at a time.' },
  { icon: BookOpen, label: 'Only a journal inside. No screens, no signage. Write or don\'t.' },
  { icon: Users, label: 'Led through by a young person paid as a facilitator. They tell you what they did when the door locked on them.' },
];

const AUDIENCES = [
  {
    icon: Users,
    name: 'Families + community',
    code: 'CONT-(stop)',
    bring: 'Free entry. School-group access. Yarning circles after.',
    leave: 'A new frame for the conversation that is already happening at home.',
  },
  {
    icon: GraduationCap,
    name: 'University students',
    code: 'University partner code',
    bring: 'Course-aligned brief. Reflective journal task. Optional research consent.',
    leave: 'Embodied evidence for criminology, social work, law, and design subjects.',
  },
  {
    icon: Building2,
    name: 'Youth justice workers',
    code: 'Sector partner code',
    bring: 'Walk the cell. Then sit down with the local org behind Room 3.',
    leave: 'Connection to a working alternative that is already running on their patch.',
  },
  {
    icon: Landmark,
    name: 'Politicians + staff',
    code: 'Civic partner code',
    bring: 'Full walk-through. Then a private conversation with the host org about what would change.',
    leave: 'A direct ask, on the record, with the people closest to it.',
  },
  {
    icon: Scale,
    name: 'Judges + magistrates',
    code: 'Judges on Country code',
    bring: 'Full walk-through. Hosted reflection back at chambers.',
    leave: 'A line they can hold inside sentencing remarks, made by walking the line themselves.',
  },
  {
    icon: Building2,
    name: 'Police',
    code: 'Sector partner code',
    bring: 'Full walk-through.',
    leave: 'Room 3, in particular. The model that puts officers downstream of community, not upstream.',
  },
  {
    icon: Newspaper,
    name: 'Media',
    code: 'Press code',
    bring: 'Walk-through. Interviews with the young people who built the rooms.',
    leave: 'A story that is not the press release. The container is the story.',
  },
  {
    icon: Camera,
    name: 'Organisations + funders',
    code: 'Funder evening',
    bring: 'Last Thursday of every stop. Thirty funders, thirty community leaders, thirty MPs walk through together.',
    leave: 'A funding decision made in the same room as the people the funding lands on.',
  },
  {
    icon: Flame,
    name: 'Young people building exhibitions',
    code: 'Anchor partnership',
    bring: 'Six weeks paid as builders, fabricators, storytellers. Trades, art, trauma-informed practice.',
    leave: 'A pathway. Pay. A bound copy of their work in a national exhibition.',
  },
];

const OUTPUTS = [
  { label: 'Media + narrative', body: 'Press, op-eds, broadcast, social. The container becomes a presence, not a press release.' },
  { label: 'Art + exhibition', body: 'Each Room 3 enters a national travelling exhibition at the end of the year. Books, prints, audio.' },
  { label: 'Cross-org collaboration', body: 'Anchor orgs in different cities meet through the container. Practice exchange, not just panels.' },
  { label: 'Inquiry + parliamentary', body: 'Submissions made by walking the room. Civic intelligence linked to live parliamentary inquiries.' },
  { label: 'Ongoing workshops', body: 'Build week training rolls into trades pathways, art residencies, paid work for young people.' },
  { label: 'Data + research', body: 'Reflection journals, stop case studies, civic intelligence chunks fed back into JusticeHub.' },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* Hero */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <Link href="/contained" className="text-xs uppercase tracking-[0.3em] text-[#DC2626] hover:text-white transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          ← Back to Contained
        </Link>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-[0.95] uppercase tracking-tight">
          How it<br />works
        </h1>
        <p className="mt-8 text-lg md:text-xl max-w-3xl text-[#F5F0E8]/95 leading-relaxed">
          Three rooms. Three builders. Ten minutes per room. The container is built by the people it is for, then walked through by everyone else. The walk-through is the point. So is the build.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/contained/enroll" className="bg-[#DC2626] text-white px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] hover:bg-[#b91c1c] transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Enrol with a code
          </Link>
          <Link href="/contained/tour/intelligence" className="border border-white/30 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-colors" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            See the tour map
          </Link>
        </div>
      </section>

      <Divider />

      {/* The shape — three rooms */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          The shape
        </p>
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-3">
          Three rooms. Three builders.
        </h2>
        <p className="max-w-3xl text-[#F5F0E8]/95 leading-relaxed mb-12">
          The container is not a museum. Each room is built before each city, with the people from that city. The first room remembers detention. The second room shows the alternative. The third room hands the conversation to the community already doing the work.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {ROOMS.map((room) => (
            <div key={room.n} className="border border-white/10 bg-gray-950 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold" style={{ color: room.hue }}>0{room.n}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Room {room.n}
                </span>
              </div>
              <h3 className="text-xl font-bold uppercase mb-2" style={{ letterSpacing: '-0.01em' }}>
                {room.title}
              </h3>
              <div className="text-xs uppercase tracking-[0.15em] mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", color: room.hue }}>
                {room.builder}
              </div>
              <p className="text-sm text-[#F5F0E8]/95 leading-relaxed mb-4 flex-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {room.body}
              </p>
              <div className="border-t border-white/10 pt-3">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[#F5F0E8]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {room.program}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* The walk-through */}
      <section className="px-6 lg:px-16 py-24 bg-gray-950">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Inside
            </p>
            <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-6">
              Ten minutes.<br />Door locks.<br />A journal.
            </h2>
            <p className="text-[#F5F0E8]/95 leading-relaxed mb-6">
              You take your shoes off. You wear what is given. You walk in. The door locks behind you. A journal sits on the bed in Room 1. There is no signage. There is no soundtrack. Whatever happens, happens.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed mb-6">
              The young person who walks you through is paid for it. They were locked up. They built this room. They tell you what they did when the door locked on them. They walk you out.
            </p>
            <p className="text-sm text-[#F5F0E8]/85 italic" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Modelled on Vision Australia&apos;s precedent: pay the people who lived it to lead the experience. The expertise is the wage.
            </p>
          </div>

          <div className="space-y-4">
            {WALK_THROUGH.map((item) => (
              <div key={item.label} className="border border-white/10 bg-[#0A0A0A] p-4 flex items-start gap-4">
                <item.icon className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#F5F0E8]/95 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* Who walks through */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Who walks through
        </p>
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-3">
          One container.<br />Nine ways in.
        </h2>
        <p className="max-w-3xl text-[#F5F0E8]/95 leading-relaxed mb-12">
          Every cohort gets a different way in — a different code, a different brief, a different conversation on the way out. Same container. Same young people leading. Different stakes.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AUDIENCES.map((a) => (
            <div key={a.name} className="border border-white/10 bg-gray-950 p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <a.icon className="w-5 h-5 text-[#DC2626]" />
                <h3 className="text-base font-bold uppercase tracking-tight">{a.name}</h3>
              </div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-[#F5F0E8]/85 mb-3 pb-2 border-b border-white/5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {a.code}
              </div>
              <p className="text-xs text-[#F5F0E8]/95 leading-relaxed mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span className="text-[#DC2626] font-bold">BRING: </span>{a.bring}
              </p>
              <p className="text-xs text-[#F5F0E8]/95 leading-relaxed mt-auto" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span className="text-[#059669] font-bold">LEAVE WITH: </span>{a.leave}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* What it produces */}
      <section className="px-6 lg:px-16 py-24 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            What comes out
          </p>
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-3">
            The container is the publishing layer
          </h2>
          <p className="max-w-3xl text-[#F5F0E8]/95 leading-relaxed mb-12">
            Every walk-through produces something. Every build week produces somebody paid. Every stop hands a permanent artefact back to the host community. Nothing is single-use.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {OUTPUTS.map((o) => (
              <div key={o.label} className="border-l-2 border-[#DC2626] pl-4">
                <h3 className="text-base font-bold uppercase tracking-tight mb-2">{o.label}</h3>
                <p className="text-sm text-[#F5F0E8]/95 leading-relaxed" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {o.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* The economic engine */}
      <section className="px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-[#DC2626] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          The economic engine
        </p>
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-6">
          The build is the program
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              Four young people per stop, paid <span className="font-bold text-white">$1,500 per week × six weeks</span>. They learn trades, art, and trauma-informed storytelling. They build Room 1. They build Room 3 with the host org. They lead the walk-through. They take the journal home.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              Art is not decoration. Art is the curatorial spine. Every program has a pillar of art — film, play, painting, immersive room, exhibition — because art is what carries the work into rooms a report cannot reach.
            </p>
            <p className="text-[#F5F0E8]/95 leading-relaxed">
              The container does not arrive with answers. The container creates the room for the answers that are already in the community. Then it leaves the answers behind.
            </p>
          </div>

          <div className="border border-white/10 bg-gray-950 p-6">
            <h3 className="text-sm uppercase tracking-[0.2em] text-[#F5F0E8]/85 mb-4 pb-3 border-b border-white/10" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Per stop, what gets paid
            </h3>
            <ul className="space-y-3 text-sm text-[#F5F0E8]/95" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <li className="flex justify-between gap-3">
                <span>Lived-experience facilitator team (4 × 6 wks)</span>
                <span className="text-[#DC2626] font-bold whitespace-nowrap">$36K</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Move + setup</span>
                <span className="text-[#DC2626] font-bold whitespace-nowrap">~$8K</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Local materials + Room 1/3 build</span>
                <span className="text-[#DC2626] font-bold whitespace-nowrap">~$4K</span>
              </li>
              <li className="flex justify-between gap-3">
                <span>Documentation + journals</span>
                <span className="text-[#DC2626] font-bold whitespace-nowrap">~$2K</span>
              </li>
              <li className="flex justify-between gap-3 pt-3 border-t border-white/10 font-bold text-white">
                <span>Stop total</span>
                <span className="whitespace-nowrap">$30K – $50K</span>
              </li>
            </ul>
            <p className="text-xs text-[#F5F0E8]/85 mt-4 italic">
              Backbone (travelling team, editorial, coordination, year-end book): $120K across 12 months. Full national tour: $500K.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* CTA strip */}
      <section className="px-6 lg:px-16 py-24 bg-[#DC2626]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/85 mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            What you can do today
          </p>
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-8 text-white">
            Pick your way in
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/contained/enroll" className="bg-white text-[#DC2626] p-6 hover:bg-gray-100 transition-colors group">
              <ArrowRight className="w-5 h-5 mb-3 group-hover:translate-x-1 transition-transform" />
              <h3 className="text-sm font-bold uppercase tracking-tight mb-2">Enrol with a code</h3>
              <p className="text-xs text-[#0A0A0A]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                You have a CONT-XXXX code from the container, a partner, or a host org.
              </p>
            </Link>
            <Link href="/contained/tour/intelligence" className="bg-white text-[#DC2626] p-6 hover:bg-gray-100 transition-colors group">
              <ArrowRight className="w-5 h-5 mb-3 group-hover:translate-x-1 transition-transform" />
              <h3 className="text-sm font-bold uppercase tracking-tight mb-2">See the tour</h3>
              <p className="text-xs text-[#0A0A0A]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Nine cities. Twelve months. Demand signals, key orgs, political holders, foundations.
              </p>
            </Link>
            <Link href="/contained/help" className="bg-white text-[#DC2626] p-6 hover:bg-gray-100 transition-colors group">
              <ArrowRight className="w-5 h-5 mb-3 group-hover:translate-x-1 transition-transform" />
              <h3 className="text-sm font-bold uppercase tracking-tight mb-2">Back a stop</h3>
              <p className="text-xs text-[#0A0A0A]/85" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                $30K to rock up and do it. $50K for a fully built stop. $500K for the national year.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Divider() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-16">
      <div className="h-px bg-[#DC2626]/30" />
    </div>
  );
}
