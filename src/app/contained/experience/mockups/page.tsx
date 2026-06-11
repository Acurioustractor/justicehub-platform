import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  FileText,
  PenLine,
  ScanLine,
} from 'lucide-react';
import { SwappableMockupImage, SwappableReferenceThumbnail } from './swappable-mockup-image';

export const metadata: Metadata = {
  title: 'CONTAINED: The Experience | JusticeHub',
  description:
    'One container. Three rooms. Thirty minutes inside the youth justice choices Australia keeps making.',
};

const references = {
  exterior: '/images/contained/mockups/container-exterior.jpg',
  closed: '/images/contained/mockups/container-closed.jpg',
  twoRooms: '/images/contained/mockups/container-two-rooms.jpg',
  roomOne: '/images/contained/mockups/room-1-cell.jpg',
  roomTwo: '/images/contained/mockups/room-2-bedroom.jpg',
  community: '/images/contained/mockups/community-reference.jpg',
};

const imageOptions = [
  { src: references.exterior, label: 'Exterior open' },
  { src: references.closed, label: 'Container side' },
  { src: references.twoRooms, label: 'Two rooms' },
  { src: references.roomOne, label: 'Cell room' },
  { src: references.roomTwo, label: 'Bedroom room' },
  { src: references.community, label: 'Community ref' },
  { src: '/images/contained/mockups/contained-7.jpg', label: 'Contained 7' },
  { src: '/images/contained/mockups/contained-9.jpg', label: 'Contained 9' },
  { src: '/images/contained/mockups/contained-11.jpg', label: 'Contained 11' },
  { src: '/images/contained/mockups/contained-14.jpg', label: 'Contained 14' },
  { src: '/images/contained/mockups/img_4402.jpg', label: 'Room warm 1' },
  { src: '/images/contained/mockups/img_4402-1.jpg', label: 'Room warm 2' },
  { src: '/images/contained/mockups/1e5a8335.jpg', label: 'Container exterior 2' },
  { src: '/images/contained/mockups/20251022-1e5a3867.jpg', label: 'Closed exterior' },
  { src: '/images/contained/mockups/20251022-1e5a3891.jpg', label: 'Open exterior' },
  { src: '/images/contained/mockups/20250823-img_3237.jpg', label: 'Community portrait' },
  { src: '/images/contained/mockups/20260521-1e5a5457.jpg', label: 'Community 1' },
  { src: '/images/contained/mockups/20260521-1e5a5457-1.jpg', label: 'Community 2' },
  { src: '/images/contained/mockups/20260521-1e5a5626.jpg', label: 'Community 3' },
  { src: '/images/contained/mockups/20260522-1e5a6106.jpg', label: 'Community 4' },
  { src: '/images/contained/mockups/img_1909.jpg', label: 'Container build' },
];

const zones = [
  {
    id: 'arrival',
    label: 'Arrival',
    purpose: 'Receive journal',
    position: 'left-[2%] top-[20%] w-[17%] h-[60%]',
    color: '#F59E0B',
  },
  {
    id: 'room-1',
    label: 'Room 1',
    purpose: 'Current reality',
    position: 'left-[72%] top-[20%] w-[22%] h-[60%]',
    color: '#DC2626',
  },
  {
    id: 'room-2',
    label: 'Room 2',
    purpose: 'What works',
    position: 'left-[47%] top-[20%] w-[22%] h-[60%]',
    color: '#2563EB',
  },
  {
    id: 'room-3',
    label: 'Room 3',
    purpose: 'What now',
    position: 'left-[22%] top-[20%] w-[22%] h-[60%]',
    color: '#059669',
  },
];

const referenceSlots = [
  { key: 'exterior', src: references.exterior, label: 'Exterior' },
  { key: 'room-1', src: references.roomOne, label: 'Room 1' },
  { key: 'room-2', src: references.roomTwo, label: 'Room 2' },
  { key: 'room-3', src: references.twoRooms, label: 'Room 3' },
];

const screens = [
  {
    number: '00',
    title: 'Arrival / Threshold',
    subtitle: 'The visitor enters cared for, not ambushed.',
    image: references.exterior,
    color: '#F59E0B',
    layout: 'A host gives the care frame, the journal, and the simple promise: you can step out at any time.',
    visitorAction: 'Receive the journal and enter with one question: what would have kept the door open?',
    content: ['Remand is not a sentence', 'You can step out at any time', 'The journal stays with you through all three rooms'],
  },
  {
    number: '01',
    title: 'Room 1 / Current Reality',
    subtitle: 'A narrow factual shock: cost, conditions, and the custody chain.',
    image: references.roomOne,
    color: '#DC2626',
    layout: 'A spare cell space. A bench. A cost receipt. The room is intentionally quiet.',
    visitorAction: 'Spend 10 minutes in the room with only a journal for company.',
    content: ['What does isolation cost?', 'What did the system choose before care?', 'What would have kept the door open?'],
  },
  {
    number: '02',
    title: 'Room 2 / Diagrama',
    subtitle: 'Same container volume, radically different assumptions.',
    image: references.roomTwo,
    color: '#2563EB',
    layout: 'The same container volume becomes warmer, structured, relational, and visibly human.',
    visitorAction: 'Spend 10 minutes with the alternative and write what support had to exist before the crisis.',
    content: ['Education every day', 'Family contact as infrastructure', 'Care is structured, not soft'],
  },
  {
    number: '03',
    title: 'Room 3 / What Now',
    subtitle: 'The last room turns emotion into public obligation.',
    image: references.twoRooms,
    color: '#059669',
    layout: 'Local alternatives, JusticeHub evidence, and one direct next action.',
    visitorAction: 'Spend 10 minutes choosing what you will do, share, fund, host, or ask for in the next 30 days.',
    content: ['The work already exists', 'Remand is not inevitable', 'Who needs to walk through this next?'],
  },
];

const audienceCards = [
  {
    label: 'Conference delegates',
    body: 'A visceral object they can take back into Justice Reintegration Conference conversations.',
  },
  {
    label: 'Decision-makers',
    body: 'A 30-minute walk through the funding choice: isolation, care, or community.',
  },
  {
    label: 'Adelaide locals',
    body: 'A clear way to see which supports already exist and what needs backing in South Australia.',
  },
  {
    label: 'Public visitors',
    body: 'A simple path to understand remand, leave a reflection, and nominate someone with power.',
  },
];

const shareIdeas = [
  'I spent 30 minutes inside CONTAINED. Ask me what would have kept the door open.',
  'Nominate one person with power who needs to walk through next.',
  'Take the journal prompt back into the conference: what support had to exist before the crisis?',
  'Share the daily Adelaide recap: what people promised today.',
];

const copyOptions = [
  'Step inside one container for thirty minutes. Three rooms ask one question: what would have kept the door open?',
  'This is not a prison replica. It is a public test of what we choose to fund: isolation, care, or community.',
  'Ten minutes with the current reality. Ten minutes with what works. Ten minutes with what comes next.',
];

function SurfaceTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-[#F5F0E8]/20 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-[#F5F0E8]/75">
      {children}
    </span>
  );
}

export default function ExperienceMockupsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]">
      <section className="relative overflow-hidden px-5 py-8 md:px-10 lg:px-14">
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/contained/experience"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/65 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to experience
          </Link>

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                <SurfaceTag>One container</SurfaceTag>
                <SurfaceTag>Three rooms</SurfaceTag>
                <SurfaceTag>Thirty minutes</SurfaceTag>
              </div>
              <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-normal md:text-7xl lg:text-8xl">
                The Contained Experience
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#F5F0E8]/78 md:text-xl">
                Step inside a shipping container rebuilt as a 30-minute journey through youth justice: the cell we keep funding,
                the care-based alternative already proven elsewhere, and the community work that needs backing now.
              </p>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#F5F0E8]/68 md:text-lg">
                Each room holds you for 10 minutes. No panels. No speeches. Just the room, the evidence, and a journal asking
                what would have kept the door open.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: 'Room 1', value: 'Current reality', body: 'What it feels like when accusation becomes custody.' },
                { label: 'Room 2', value: 'What works', body: 'A therapeutic model built around care, education, and family contact.' },
                { label: 'Room 3', value: 'What now', body: 'Local alternatives, public obligation, and the next action.' },
              ].map((item) => (
                <div key={item.label} className="border border-[#F5F0E8]/14 bg-[#111111] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#DC2626]">{item.label}</p>
                  <h2 className="mt-2 text-xl font-black uppercase tracking-normal text-[#F5F0E8]">{item.value}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#F5F0E8]/68">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-14 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl border border-[#F5F0E8]/16 bg-[#101010]">
          <div className="grid border-b border-[#F5F0E8]/12 lg:grid-cols-[1fr_340px]">
            <div className="p-5 md:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#DC2626]">Container layout</p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-normal md:text-3xl">One drawing, all rooms</h2>
                </div>
                <ScanLine className="hidden h-7 w-7 text-[#F5F0E8]/50 md:block" />
              </div>

              <div className="relative min-h-[280px] overflow-hidden border border-[#F5F0E8]/14 bg-[#080808] p-5 md:p-7">
                <div className="relative mt-5 h-44 rounded-none border-4 border-[#D8C7A4] bg-[#D8C7A4]/8 shadow-[0_0_0_1px_rgba(255,255,255,0.2)_inset] md:h-56">
                  <div className="absolute left-0 top-0 h-full w-2 bg-[#D8C7A4]" />
                  <div className="absolute right-0 top-0 h-full w-2 bg-[#D8C7A4]" />
                  <div className="absolute inset-x-0 top-1/2 h-px bg-[#F5F0E8]/18" />
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`absolute ${zone.position} flex items-center justify-center border-2 bg-black/55 p-1 text-center`}
                      style={{ borderColor: zone.color }}
                    >
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: zone.color }}>
                          {zone.label}
                        </div>
                        <div className="mt-1 hidden text-[11px] uppercase tracking-[0.12em] text-[#F5F0E8]/58 md:block">
                          {zone.purpose}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#F5F0E8]/62">
                  Physical layout for the container build. The public story is simple: arrive, receive the journal, then move
                  through three 10-minute rooms that ask what Australia chooses before a child reaches custody.
                </p>
              </div>
            </div>

            <aside className="border-t border-[#F5F0E8]/12 p-5 md:p-7 lg:border-l lg:border-t-0">
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {referenceSlots.map((ref) => (
                  <SwappableReferenceThumbnail
                    key={ref.key}
                    storageKey={`contained-reference-strip-${ref.key}`}
                    initialSrc={ref.src}
                    label={ref.label}
                    options={imageOptions}
                  />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-7xl gap-8">
          {screens.map((screen) => (
            <article key={screen.number} className="border border-[#F5F0E8]/16 bg-[#101010]">
              <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
                <div className="relative min-h-[420px] overflow-hidden border-b border-[#F5F0E8]/12 lg:border-b-0 lg:border-r">
                  <SwappableMockupImage
                    storageKey={`contained-mockup-image-${screen.number}`}
                    initialSrc={screen.image}
                    alt={`${screen.title} reference`}
                    options={imageOptions}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/28 to-black/10" />
                  <div className="absolute left-5 top-5 border bg-black/75 px-3 py-2 text-sm font-black uppercase tracking-[0.2em]" style={{ borderColor: screen.color, color: screen.color }}>
                    Screen {screen.number}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                    <h2 className="max-w-xl text-3xl font-black uppercase leading-none tracking-normal md:text-5xl">{screen.title}</h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-[#F5F0E8]/80">{screen.subtitle}</p>
                  </div>
                </div>

                <div className="p-5 md:p-7">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2 border border-[#F5F0E8]/12 bg-black/35 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#F5F0E8]/55">
                        <PenLine className="h-4 w-4" />
                        What the room holds
                      </div>
                      <p className="text-lg font-semibold leading-snug text-[#F5F0E8]">{screen.layout}</p>
                    </div>

                    <div className="md:col-span-2 border p-4" style={{ borderColor: `${screen.color}66`, backgroundColor: `${screen.color}12` }}>
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: screen.color }}>
                        <ClipboardList className="h-4 w-4" />
                        Visitor action
                      </div>
                      <p className="text-base leading-relaxed text-[#F5F0E8]/88">{screen.visitorAction}</p>
                    </div>

                    <div className="md:col-span-2 border border-[#F5F0E8]/12 bg-[#111111] p-4">
                      <div className="mb-3 text-xs uppercase tracking-[0.18em] text-[#F5F0E8]/55">
                        Journal prompts
                      </div>
                      <ul className="grid gap-3 md:grid-cols-3">
                        {screen.content.map((item) => (
                          <li key={item} className="border border-[#F5F0E8]/10 bg-black/35 p-3 text-sm leading-relaxed text-[#F5F0E8]/82">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#F5F0E8]/12 px-5 py-16 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#DC2626]">Adelaide audience</p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-none tracking-normal md:text-5xl">
                Built for conference week, not a gallery wall
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#F5F0E8]/68">
                The Adelaide site gives the container two jobs: hold the public emotionally, and give conference
                delegates something concrete to carry back into reintegration conversations.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {audienceCards.map((card) => (
                <div key={card.label} className="border border-[#F5F0E8]/14 bg-[#101010] p-5">
                  <h3 className="text-lg font-black uppercase tracking-normal text-[#F5F0E8]">{card.label}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#F5F0E8]/70">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#F5F0E8]/12 px-5 py-16 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="border border-[#F5F0E8]/14 bg-[#101010] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#DC2626]">After they leave</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-normal">Things worth sharing</h2>
            <div className="mt-6 grid gap-3">
              {shareIdeas.map((idea) => (
                <div key={idea} className="border border-[#F5F0E8]/10 bg-black/35 p-4 text-base leading-relaxed text-[#F5F0E8]/82">
                  {idea}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#F5F0E8]/14 bg-[#101010] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#DC2626]">Copy to test</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-normal">Lines for posters, cards, and share images</h2>
            <div className="mt-6 grid gap-3">
              {copyOptions.map((line) => (
                <blockquote key={line} className="border-l-2 border-[#DC2626] bg-black/35 p-4 text-lg font-semibold leading-snug text-[#F5F0E8]">
                  {line}
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#F5F0E8]/12 px-5 py-12 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#DC2626]">Planning surface</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-normal">Keep shaping the experience</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contained/experience" className="inline-flex items-center gap-2 border border-[#F5F0E8]/20 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:border-white hover:bg-white hover:text-black">
              <FileText className="h-4 w-4" />
              Virtual experience
            </Link>
            <a
              href="https://app.notion.com/p/379ebcf981cf81b2a9cec929736e7482"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#DC2626] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#B91C1C]"
            >
              <ExternalLink className="h-4 w-4" />
              Concept sprint
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
