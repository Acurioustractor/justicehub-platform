import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Database,
  FileText,
  Globe,
  Lock,
  MapPin,
  Mic,
  Network,
  ShieldCheck,
  Users,
  Briefcase,
  CheckCircle,
} from 'lucide-react';

export const metadata = {
  title: 'System Map | Centre of Excellence | JusticeHub',
  description:
    'How the JusticeHub stack carries community-led work. Five layers, four sovereignty mechanics, one rhythm at the Harvest.',
};

const layers = [
  {
    icon: Mic,
    title: 'Story',
    where: 'Empathy Ledger',
    href: '/stories',
    image: '/images/orgs/oonchiumpa/jackquann.jpg',
    imageAlt: 'A young person from Mparntwe whose story sits in Empathy Ledger with consent',
    owns: 'The storyteller, with cultural authority co-signing.',
    what: 'Per-storyteller consent record. Withdrawable any day. The story leaves the public layer the day it is withdrawn.',
  },
  {
    icon: Briefcase,
    title: 'Programs',
    where: 'Australian Living Map of Alternatives',
    href: '/alma/oonchiumpa',
    image: '/images/orgs/oonchiumpa/mentoring.jpg',
    imageAlt: 'Oonchiumpa mentoring session on Country',
    owns: 'The organisation.',
    what: 'What the org runs, where they run it, who it is for. The Living Map indexes every community-led model nationally.',
  },
  {
    icon: MapPin,
    title: 'Trips and exchanges',
    where: 'Workspace activity log + cross-site exchange budget',
    href: '/centre-of-excellence/map',
    image: '/images/orgs/oonchiumpa/atnarpa/originals/20251103-DJI_0271.jpg',
    imageAlt: 'Atnarpa Homestead, Eastern Arrernte Country',
    owns: 'Both communities, co-signed.',
    what: 'Country visits Country. The visit is logged with both ends signing the protocol. Stories from the trip move through Empathy Ledger with consent.',
  },
  {
    icon: Database,
    title: 'Funding',
    where: 'Funding workspace + outcome commitments',
    href: '/organizations/oonchiumpa',
    image: '/screenshots/money-trail-desktop.png',
    imageAlt: 'JusticeHub money trail dashboard. The funding workspace surface used by the org and reviewed by the cohort.',
    owns: 'The org, reviewed by the cohort.',
    what: 'Working note, partner asks, blockers, measurable commitments. CivicGraph reads the funding map against the work map and surfaces orgs that funders have not yet seen.',
  },
  {
    icon: FileText,
    title: 'Public proof',
    where: 'Org page + STAY series + Contained tour',
    href: '/organizations/oonchiumpa',
    image: '/images/proposals/minderoo/generated-books/library-slipcase.png',
    imageAlt: 'STAY series book and journal slipcase, the public-facing artefact of the work',
    owns: 'The org publishes. The campaign carries.',
    what: 'A page, a book, a journal, a wall. The pattern travels through tour stops without flattening place.',
  },
];

const sovereignty = [
  {
    icon: ShieldCheck,
    label: 'Per-record consent',
    body: 'Every story carries the storyteller name and a consent record they can revoke. No aggregate clauses. No buried opt-outs.',
  },
  {
    icon: Lock,
    label: 'Per-org workspace',
    body: 'The org logs in to /hub/[slug]/dashboard and works on their own data on their own terms. The workspace is the control room, not a CMS.',
  },
  {
    icon: Users,
    label: 'Per-cohort review',
    body: 'The four anchors collectively shape how evidence travels. The decision tag on the workspace (advance, hold, needs review) is a community-review signal, not a funder gate.',
  },
  {
    icon: CheckCircle,
    label: 'External audit',
    body: 'Year 1 of a Minderoo-scale partnership funds an external technical audit of the consent layer. The audit publishes as a public artefact in month 10.',
  },
];

const tripDays = [
  {
    day: 'Day 1',
    date: 'Mon 14 Sep',
    place: 'Minjerribah',
    country: 'Quandamooka Country',
    theme: 'Indigenous-led justice reinvestment in practice',
    image: '/images/orgs/mmeic/hero.jpg',
    imageAlt: 'Minjerribah, Quandamooka Country',
    body: 'MMEIC visit. Welcome to Country with Quandamooka Elders. 31 years of community-led work. Justice Reinvestment program launched 2024. Cultural heritage tour. Yarn circle on Quandamooka and Arrernte parallels in approaching young people.',
    hosts: 'MMEIC (Minjerribah Moorgumpin Elders-in-Council)',
    hostHref: '/organizations/mmeic',
  },
  {
    day: 'Day 2',
    date: 'Tue 15 Sep',
    place: 'Toowoomba',
    country: 'Jagera, Giabal, Jarowair Country',
    theme: 'Sport-based mentorship and regional ecosystem',
    image: '/images/orgs/bg-fit/gallery-1.jpg',
    imageAlt: 'Sport-based youth mentorship in regional Australia',
    body: 'Adapt Mentorship walkthrough with Adam and Susy Wenitong (Aboriginal and Torres Strait Islander Citizens of the Year 2025). Street Footy. Kickstarter Youth Mentoring (12-month QLD program for First Nations youth 8 to 17). Following the Songlines on-Country experiences. How three orgs in one region complement rather than compete.',
    hosts: 'Adapt Mentorship Indigenous Corporation',
    hostHref: 'mailto:info@adaptmentor.com',
  },
  {
    day: 'Day 3',
    date: 'Wed 16 Sep',
    place: 'Meanjin (Brisbane)',
    country: 'Yuggera and Turrbal Country',
    theme: 'How culture drives change',
    image: '/images/contained/contained-story.png',
    imageAlt: 'Art and culture as a vehicle for the work',
    body: 'QAGOMA Aboriginal and Torres Strait Islander art collection. Birrunga Gallery and Dining (First Nations owned). Youth Advocacy Centre with Shannon Cant, who has offered to host the Contained tour in Brisbane. Conversation about how cultural brokerage in Mparntwe could inform YAC practice.',
    hosts: 'QAGOMA · Birrunga Gallery · Youth Advocacy Centre',
    hostHref: 'https://www.qagoma.qld.gov.au',
  },
  {
    day: 'Day 4',
    date: 'Thu 17 Sep',
    place: 'Witta',
    country: 'Jinibara Country',
    theme: 'Hands-on manufacturing training',
    image: '/images/harvest/seed-house.jpg',
    imageAlt: 'The Harvest at Witta on Jinibara Country, where the containerised manufacturing facility runs',
    body: 'Two shipping containers: one shreds plastic, one presses sheets and cuts parts. Flat-pack beds, washing machines, furniture for remote communities. Around 30 beds per week, 400+ delivered across 8 communities. Each bed diverts 20 to 25kg of plastic from landfill. Training: shredding, sorting, press operations, sheet production, the team produces their first batch together.',
    hosts: 'A Curious Tractor + The Harvest',
    hostHref: '/centre-of-excellence',
  },
  {
    day: 'Day 5',
    date: 'Fri 18 Sep',
    place: 'Witta',
    country: 'Jinibara Country',
    theme: 'Ownership, design, and taking it home',
    image: '/images/orgs/oonchiumpa/atnarpa/originals/20251103-DJI_0271.jpg',
    imageAlt: 'Atnarpa, Eastern Arrernte Country, the place the team comes home to',
    body: 'Advanced assembly. Cultural design session: how Oonchiumpa puts Arrernte design language on the products, naming in language. Business planning for the Alice Springs facility (Innovation Fund EOI, $1.2M, 60 to 80 participants over 4 years). Reflection circle on what the week has meant.',
    hosts: 'A Curious Tractor + Oonchiumpa',
    hostHref: '/organizations/oonchiumpa',
  },
  {
    day: 'Day 6',
    date: 'Sat 19 Sep',
    place: 'Brisbane and home',
    country: 'Across Country',
    theme: 'Ways of working and forward planning',
    image: '/images/orgs/oonchiumpa/founders.jpg',
    imageAlt: 'Kristy Bloomfield and Tanya Turner, Oonchiumpa founders',
    body: 'Ways of Working workshop (Ben + Nic). Communication, decision-making, cultural protocols. 2026 partnership roadmap: Innovation Fund decision, Contained tour stops, True Justice expansion, when the SEQ teams return to Mparntwe. Each team member shares one thing they take home and one commitment.',
    hosts: 'Co-signed: Oonchiumpa + A Curious Tractor',
    hostHref: '/organizations/oonchiumpa',
  },
];

const harvestRing = [
  { name: 'Witta, QLD', country: 'Jinibara Country', role: 'The physical centre. Eat. Gather. Make. Grow.' },
  { name: 'Oonchiumpa', country: 'Eastern Arrernte Country, Mparntwe', role: '95% diversion. 21 active young people.' },
  { name: 'Palm Island Community Company', country: 'Bwgcolman / Manbarra Country, Townsville', role: 'Stretch Beds enterprise live.' },
  { name: 'BG Fit', country: 'Kalkadoon Country, Mount Isa', role: '85% diversion. 400+ young people each year.' },
  { name: 'MMEIC', country: 'Quandamooka Country, Minjerribah', role: 'Elder-led cultural authority.' },
];

export default function SystemMapPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="container-justice">
            <div className="max-w-4xl">
              <Link
                href="/centre-of-excellence"
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-6 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Centre of Excellence
              </Link>

              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
                System Map
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-8">
                HOW THE STACK<br />CARRIES THE WORK
              </h1>

              <p className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed">
                JusticeHub is a stack of layers. Each layer is owned by a different actor.
                Each layer connects to the next without flattening the layer below.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                That is what makes a STAY campaign moment, a Country trip, a story, an exhibition,
                or a national convening tractable as data without making the community legible
                only as data.
              </p>
            </div>
          </div>
        </section>

        {/* Five layers */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Five layers, five owners
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Each campaign moment lives in a specific layer with specific protections. The
              owner of each layer is named, not assumed.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {layers.map((l, i) => (
                <Link
                  key={l.title}
                  href={l.href}
                  className="bg-white border-2 border-black flex flex-col group hover:bg-gray-50 transition-colors"
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden border-b-2 border-black">
                    <img
                      src={l.image}
                      alt={l.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-3 right-3 bg-white border-2 border-black px-2 py-1 text-xs font-bold">
                      0{i + 1}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <l.icon className="w-7 h-7 text-emerald-700 mb-3" />
                    <h3 className="font-black text-lg uppercase tracking-tighter mb-2 group-hover:underline">
                      {l.title}
                    </h3>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-3">
                      {l.where}
                    </div>
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">{l.what}</p>
                    <div className="mt-auto pt-3 border-t border-gray-200">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                        Owned by
                      </div>
                      <div className="text-xs font-bold">{l.owns}</div>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                      Open layer
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Five plain answers */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Five questions, plain answers
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              How the system actually works for an org, in five questions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              <div className="border-2 border-black p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Question 01
                </div>
                <h3 className="font-black text-xl mb-3">How a story gets told</h3>
                <p className="text-gray-700 leading-relaxed">
                  A young person tells their story. Empathy Ledger holds the consent record with
                  the storyteller name on it. The org publishes only if the storyteller has said
                  yes. The storyteller can withdraw the same day. The public layer drops it that
                  day.
                </p>
              </div>

              <div className="border-2 border-black p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Question 02
                </div>
                <h3 className="font-black text-xl mb-3">How a program becomes visible</h3>
                <p className="text-gray-700 leading-relaxed">
                  The org adds programs through their workspace. Each program lives at
                  /organizations/[slug] in the org's own words. The Australian Living Map of
                  Alternatives indexes the program nationally on the org's terms.
                </p>
              </div>

              <div className="border-2 border-black p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Question 03
                </div>
                <h3 className="font-black text-xl mb-3">How a trip gets logged</h3>
                <p className="text-gray-700 leading-relaxed">
                  A trip is a row in the workspace activity log. The funding for the trip sits
                  in the cross-site exchange bucket. Both communities co-sign the protocol.
                  Stories from the trip move through Empathy Ledger with per-storyteller consent.
                </p>
              </div>

              <div className="border-2 border-black p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Question 04
                </div>
                <h3 className="font-black text-xl mb-3">How funding follows the work</h3>
                <p className="text-gray-700 leading-relaxed">
                  The funding workspace holds the org's working note, partner asks, blockers,
                  and outcome commitments. CivicGraph reads the funding map against the work map
                  and surfaces orgs that funders have not yet seen. Funders find the work. The
                  work does not chase the funder.
                </p>
              </div>

              <div className="border-2 border-black p-6 md:col-span-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Question 05
                </div>
                <h3 className="font-black text-xl mb-3">How art and exhibition travel</h3>
                <p className="text-gray-700 leading-relaxed">
                  The Contained tour carries STAY images, postcards, and journals through Perth,
                  Mt Druitt, Adelaide, Tennant Creek, Brisbane. Year 3 lands as a national
                  exhibition, a book, and a field convening at the Harvest in Witta. Every story
                  along the way stays on per-storyteller consent. Withdrawable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* A worked example: Oonchiumpa Inspiration Trip, Brisbane / SEQ */}
        <section className="py-16 bg-emerald-50 border-y-2 border-black">
          <div className="container-justice">
            <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
              A worked example
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
              Oonchiumpa inspiration trip<br />Brisbane / SEQ · 14 to 19 September 2026
            </h2>
            <p className="text-xl text-gray-700 mb-4 max-w-3xl leading-relaxed">
              Eight Oonchiumpa staff travel from Mparntwe to South East Queensland for an
              immersive inspiration trip. The deeper purpose: build a two-way exchange pipeline.
              This trip south inspires the Oonchiumpa team. A return trip brings SEQ
              organisations to Alice Springs to see the work on Country. Together, this builds
              a national focus for how we better support young people.
            </p>
            <p className="text-base text-gray-600 mb-12 max-w-3xl">
              Led by Benjamin Knight and Nic Marchesi (A Curious Tractor / JusticeHub).
              Total budget around $25,600 for 10 people across six days.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tripDays.map((d) => (
                <article
                  key={d.day}
                  className="bg-white border-2 border-black flex flex-col group"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden border-b-2 border-black">
                    <img
                      src={d.image}
                      alt={d.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                      {d.day}
                    </div>
                    <div className="absolute top-3 right-3 bg-white border-2 border-black px-2 py-1 text-xs font-bold">
                      {d.date}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-black text-xl uppercase tracking-tighter mb-1">
                      {d.place}
                    </h3>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-3">
                      {d.country}
                    </div>
                    <div className="text-sm font-bold text-black mb-3">{d.theme}</div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">{d.body}</p>
                    <div className="mt-auto pt-3 border-t border-gray-200">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                        Hosts
                      </div>
                      <Link
                        href={d.hostHref}
                        className="text-xs font-bold hover:underline inline-flex items-center gap-1"
                      >
                        {d.hosts}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Trip impact summary */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-black bg-white p-6">
                <h3 className="font-black text-xl uppercase tracking-tighter mb-4">
                  What Oonchiumpa takes home
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    Inspiration from peer models. MMEIC at 31 years is what Oonchiumpa at 31 looks like.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    Manufacturing readiness. The team can operate the Alice Springs facility from day one when the Innovation Fund lands.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    Connections: MMEIC, YAC Brisbane, Toowoomba consortium, A Curious Tractor network.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    Ways of Working agreement and 2026 roadmap, co-created not imposed.
                  </li>
                </ul>
              </div>

              <div className="border-2 border-black bg-white p-6">
                <h3 className="font-black text-xl uppercase tracking-tighter mb-4">
                  What flows back into the system
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Mic className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    Empathy Ledger reflections recorded by each team member at each stop.
                  </li>
                  <li className="flex items-start gap-2">
                    <Database className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    MMEIC and Adapt Mentorship case studies in the Australian Living Map of Alternatives.
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    Oonchiumpa Goods business plan, co-authored during the Witta training days.
                  </li>
                  <li className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-700 mt-1 flex-shrink-0" />
                    A trip documentary for funders: Paul Ramsay Foundation, Minderoo, Dusseldorp Forum.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Data sovereignty mechanics */}
        <section className="py-16">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Data sovereignty, named
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              Four mechanics protect the org at every layer in this system.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              {sovereignty.map((m) => (
                <div key={m.label} className="border-2 border-black p-6">
                  <m.icon className="w-10 h-10 mb-4 text-emerald-700" />
                  <h3 className="font-black text-lg mb-3">{m.label}</h3>
                  <p className="text-gray-700 leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Where the work comes home */}
        <section className="py-16 bg-gray-50 border-y-2 border-black">
          <div className="container-justice">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Where the work comes home
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl">
              The Harvest at Witta on Jinibara Country is the place all of this returns to.
              Cohort weeks. Editorial residencies. An annual STAY gathering across the four
              anchors. Country visits Country.
            </p>

            <div className="border-2 border-black bg-white">
              {harvestRing.map((r, i) => (
                <div
                  key={r.name}
                  className={`grid grid-cols-1 md:grid-cols-[260px_1fr_1fr] ${i > 0 ? 'border-t-2 border-black' : ''}`}
                >
                  <div className="bg-black text-white p-5 font-black text-lg flex items-center">
                    {r.name}
                  </div>
                  <div className="p-5 text-sm font-bold text-emerald-700">{r.country}</div>
                  <div className="p-5 text-gray-700">{r.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tight with four. Open to find more. */}
        <section className="py-16 bg-emerald-50 border-y-2 border-black">
          <div className="container-justice">
            <div className="max-w-4xl mb-12">
              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
                Discovery and depth
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
                Tight with four. Open to find more.
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed mb-4">
                The four anchor communities go deep for three years. Story, art, exhibition,
                travel. The work earns the right to travel by being held well at home first.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                JusticeHub and CivicScope do the discovery work in parallel. The Australian
                Living Map of Alternatives indexes every community-led model. CivicGraph reads
                the funding map against the work map and surfaces the orgs that funders have
                not yet seen. The four anchors stay tight. The next four are found on evidence,
                not proximity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border-2 border-black p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Step 01
                </div>
                <h3 className="font-black text-xl uppercase tracking-tighter mb-3">
                  Hold the four
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Oonchiumpa, PICC, BG Fit, MMEIC. Three years of cohort weeks at Witta,
                  editorial residencies, cross-site trips, and a national exhibition at Year 3.
                  Story stays at the source. The pattern travels at the system level.
                </p>
              </div>

              <div className="bg-white border-2 border-black p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Step 02
                </div>
                <h3 className="font-black text-xl uppercase tracking-tighter mb-3">
                  Find the next ones
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  CivicGraph reads the funder ledger and the ACNC register against the Living
                  Map. It surfaces the orgs holding children every day who have never received
                  philanthropic dollars. The Bwgcolmans not yet seen. The Doomadgees still off
                  the spreadsheet.
                </p>
              </div>

              <div className="bg-white border-2 border-black p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  Step 03
                </div>
                <h3 className="font-black text-xl uppercase tracking-tighter mb-3">
                  Build their page
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  The next orgs claim a JusticeHub profile on their terms. They own the page.
                  They publish what they choose. They join the cohort when both ends are ready.
                  Scale follows readiness. Readiness follows relationship.
                </p>
              </div>
            </div>

            <div className="mt-10 max-w-3xl">
              <p className="text-base text-gray-700 leading-relaxed italic">
                The four anchors are not the cap on the work. They are the depth. The Living
                Map and CivicGraph are the breadth. Both are needed. Neither flattens the other.
              </p>
            </div>
          </div>
        </section>

        {/* National + international */}
        <section className="py-16">
          <div className="container-justice max-w-4xl">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              National and international footing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-black p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Network className="w-6 h-6 text-emerald-700" />
                  <h3 className="font-black text-lg">National</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  The Australian Living Map of Alternatives indexes every community-led model on
                  the terms of the people doing the work. CivicGraph reads the funding map
                  against the work map. The Centre of Excellence at Witta is the rhythm.
                </p>
              </div>

              <div className="border-2 border-black p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-6 h-6 text-emerald-700" />
                  <h3 className="font-black text-lg">International</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  The international extension feeds the platform first. Australia learns from
                  youth justice storytelling work in Africa and Europe before any Australian
                  model travels outward. The findings land on JusticeHub. Australia stays in the
                  conversation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The frame */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice max-w-4xl">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">
              The frame to remember
            </div>
            <p className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-6">
              The community owns both ends of every layer. The story stays at the source. What
              travels is the pattern.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Empathy Ledger holds the source. JusticeHub publishes the pattern. The Australian
              Living Map of Alternatives indexes it nationally. CivicGraph reads it against the
              funding map. The funding workspace turns it into resourced work. The Harvest
              brings everyone home once a year.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container-justice text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6">
              Step into the system on your terms
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
              Claim your organisation page. Own your data. Publish on your terms. Travel when
              you choose.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/for-community-leaders"
                className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors inline-flex items-center justify-center gap-2"
              >
                For community-controlled organisations
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/centre-of-excellence"
                className="border-2 border-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
              >
                Back to Centre of Excellence
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
