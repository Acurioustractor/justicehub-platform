import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  CalendarDays,
  DoorOpen,
  FileText,
  Globe2,
  MapPinned,
  MessageCircle,
  Network,
  QrCode,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import { CopyShortLink } from '@/components/contained/CopyShortLink';
import { ManagedHeroBackgroundLayer } from '@/components/contained/ManagedHeroBackgroundLayer';
import { JusticePathwaysSection } from '@/components/justice-network/JusticePathwaysSection';
import { tourStops } from '@/content/campaign';
import { getHeroBackground } from '@/content/hero-backgrounds';
import { getContainedPhotoOverrides } from '@/lib/contained/photo-overrides';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Adelaide Youth Remand Experience · CONTAINED x JusticeHub',
  description:
    'A public Adelaide pathway for people walking through THE CONTAINED at Tandanya: understand youth remand, find alternatives, and choose a useful next step.',
  openGraph: {
    title: 'Adelaide Youth Remand Experience',
    description:
      'Walk through the experience, understand why children are held before sentence, and find practical ways to help.',
    type: 'website',
    locale: 'en_AU',
    url: '/contained/adelaide',
  },
};

const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const ADELAIDE_HERO = getHeroBackground('adelaide');
const ADELAIDE_HERO_OVERRIDE_KEY = 'adelaide/hero';
const adelaideStop = tourStops.find((stop) => stop.eventSlug === 'contained-adelaide-tandanya');

const quickLinks = [
  {
    label: 'Share the Adelaide page',
    urlLabel: 'justicehub.com.au/adelaide',
    copyUrl: 'https://justicehub.com.au/adelaide',
    href: '/adelaide',
    body: 'Use this when inviting someone to the Adelaide experience, or when you want to send the simple starting point after a conversation.',
  },
  {
    label: 'Go deeper on youth remand',
    urlLabel: 'justicehub.com.au/remand',
    copyUrl: 'https://justicehub.com.au/remand',
    href: '/remand',
    body: 'Use this for lawyers, funders, journalists, campaigners, and anyone ready to look at cases, evidence, alternatives, and policy choices.',
  },
];

const experienceFlow = [
  {
    label: 'Before you come',
    icon: CalendarDays,
    title: 'Know why it matters',
    body: 'Start with the short version: children can be held before sentence because the support around them is missing, stretched, or too hard to find.',
    href: '/adelaide',
    action: 'Read the starting point',
  },
  {
    label: 'Inside the rooms',
    icon: DoorOpen,
    title: 'Let the issue become real',
    body: 'THE CONTAINED turns the policy question into a physical experience, so the numbers are connected to young people, families, workers, and place.',
    href: '/contained/how-it-works',
    action: 'See how it works',
  },
  {
    label: 'After you leave',
    icon: Network,
    title: 'Choose one useful next step',
    body: 'Open the youth remand path to find the law, campaigns, local alternatives, community organisations, and evidence you can share or act on.',
    href: '/justice-network/youth-remand',
    action: 'Open the remand path',
  },
];

const roomQr = [
  {
    room: 'Room 1',
    title: 'What is happening?',
    href: '/justice-network/youth-remand#scenario',
    body: 'Why are children held before sentence, and what does that do to family, school, culture, safety, and trust?',
    color: '#dc2626',
  },
  {
    room: 'Room 2',
    title: 'What could happen instead?',
    href: '/justice-network/youth-remand#search',
    body: 'Search programs, services, evidence, and overseas examples that show how communities can support young people outside detention.',
    color: '#1f6f78',
  },
  {
    room: 'Room 3',
    title: 'What can Adelaide do next?',
    href: '/exhibition?q=South%20Australia%20youth%20justice',
    body: 'Find South Australian organisations, services, funding needs, and practical asks people can take into meetings after the experience.',
    color: '#285d45',
  },
];

const actionLinks = [
  {
    label: 'Youth remand guide',
    href: '/justice-network/youth-remand',
    icon: Network,
    body: 'A plain-language path through the issue, evidence, alternatives, and choices.',
  },
  {
    label: 'Justice Matrix map',
    href: '/justice-matrix/map?surface=youth',
    icon: MapPinned,
    body: 'Search cases, campaigns, issues, and places connected to youth justice.',
  },
  {
    label: 'Country reports',
    href: '/justice-network/countries',
    icon: Globe2,
    body: 'Compare how other countries approach children, custody, support, and community models.',
  },
  {
    label: 'Decision-maker brief',
    href: '/contained/brief',
    icon: FileText,
    body: 'A short summary for people who need to understand the issue quickly.',
  },
  {
    label: 'Reaction form',
    href: '/contained/reaction',
    icon: MessageCircle,
    body: 'Share what changed for you after walking through the rooms.',
  },
  {
    label: 'Social kit',
    href: '/contained/tour/social',
    icon: QrCode,
    body: 'Copy, captions, and assets that make the story easier to pass on.',
  },
  {
    label: 'Tour stop page',
    href: '/contained/tour/contained-adelaide-tandanya',
    icon: CalendarDays,
    body: 'Details for the Adelaide stop and how it fits into the national tour.',
  },
];

const moreVerticals = [
  'Watch houses',
  'Raise the Age',
  'Detention conditions',
  'Justice reinvestment',
  'Community alternatives',
  'Children and families',
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase"
      style={{ borderColor: 'rgba(255,255,255,0.24)', color: '#f2eadf', fontFamily: MONO, letterSpacing: '0.12em' }}
    >
      {children}
    </span>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold"
      style={{ background: '#dc2626', color: '#ffffff' }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default async function ContainedAdelaidePage() {
  const photoOverrides = await getContainedPhotoOverrides();
  const adelaideHeroOverride = photoOverrides[ADELAIDE_HERO_OVERRIDE_KEY] || null;

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#171717]">
      <Navigation />
      <main className="pt-32">
        <section className="relative overflow-hidden bg-[#0a0a0a] text-white">
          {adelaideHeroOverride ? (
            <link rel="preload" as="image" href={adelaideHeroOverride} />
          ) : null}
          <ManagedHeroBackgroundLayer
            background={ADELAIDE_HERO}
            overrideKey={ADELAIDE_HERO_OVERRIDE_KEY}
            initialOverrideUrl={adelaideHeroOverride}
            className="absolute inset-0 opacity-42"
            adminLabel="Adelaide hero"
            pickerTitle="Pick Adelaide hero"
            pickerSource={{ project: 'contained' }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 md:px-12 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                <Pill>CONTAINED Adelaide</Pill>
                <Pill>Youth Remand</Pill>
                <Pill>Kaurna Yarta</Pill>
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
                Walk through the experience. Leave knowing what can change.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/76 md:text-lg">
                On 23 June, THE CONTAINED opens at Tandanya in Adelaide with one urgent question: why are children
                being held before sentence, and what would keep them safely connected to family, school, culture,
                housing, and support instead?
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <PrimaryLink href="/contained/register?stop=adelaide">Register interest</PrimaryLink>
                <Link
                  href="/justice-network/youth-remand"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-bold text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.28)' }}
                >
                  Open the remand path <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <aside className="rounded-xl border border-white/16 bg-black/48 p-4 backdrop-blur">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/55" style={{ fontFamily: MONO }}>
                Fast share links
              </div>
              <div className="space-y-3">
                {quickLinks.map((link) => (
                  <div key={link.href} className="rounded-lg border border-white/12 bg-white/7 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <Link href={link.href} className="text-sm font-bold text-white hover:underline">
                        {link.urlLabel}
                      </Link>
                      <CopyShortLink label="Copy" url={link.copyUrl} dark />
                    </div>
                    <p className="text-xs leading-5 text-white/62">{link.body}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-[#ded8cf] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8 md:px-12">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
                  Where
                </div>
                <p className="mt-1 font-bold">{adelaideStop?.venue || 'Tandanya, Adelaide'}</p>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
                  When
                </div>
                <p className="mt-1 font-bold">{adelaideStop?.date || '23 June 2026 · public launch'}</p>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
                  Why this link exists
                </div>
                <p className="mt-1 font-bold">So people can move from feeling something to doing something useful.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14 md:px-12">
          <div className="mb-7 max-w-3xl">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
              Visitor pathway
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              Start with what you saw. Then choose what you can do.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {experienceFlow.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.label}
                  href={step.href}
                  className="group rounded-xl border border-[#ded8cf] bg-white p-5 transition-colors hover:border-[#171717]/40"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#171717] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8552c]" style={{ fontFamily: MONO }}>
                      {step.label}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-sm leading-6 text-[#514a42]">{step.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#756d63] group-hover:text-[#171717]">
                    {step.action} <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-y border-[#ded8cf] bg-[#fbfaf7]">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-12">
            <JusticePathwaysSection variant="physical" />
          </div>
        </section>

        <section className="bg-[#171217] text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-12">
            <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300" style={{ fontFamily: MONO }}>
                  Room links
                </div>
                <h2 className="text-3xl font-black tracking-tight">
                  Each room opens one clear next step.
                </h2>
                <p className="mt-4 text-sm leading-6 text-white/65">
                  The simplest setup is three QR codes: one for the issue, one for alternatives, and one for local
                  action. People can keep moving without being dropped into a huge website menu.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {roomQr.map((room) => (
                  <Link key={room.room} href={room.href} className="rounded-xl border border-white/14 bg-white/7 p-4 hover:bg-white/10">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-md text-white" style={{ background: room.color }}>
                        <QrCode className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/45" style={{ fontFamily: MONO }}>
                        {room.room}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-bold">{room.title}</h3>
                    <p className="text-sm leading-6 text-white/68">{room.body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14 md:px-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <div className="rounded-xl border border-[#ded8cf] bg-white p-5 md:p-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
                <Scale className="h-4 w-4" />
                Sendable note
              </div>
              <h2 className="mb-4 text-2xl font-black tracking-tight">The text to send with the link.</h2>
              <div className="rounded-lg border border-[#ded8cf] bg-[#fbfaf7] p-4 text-sm leading-7 text-[#3f3830]">
                I am sending you this because THE CONTAINED opens in Adelaide at Tandanya on 23 June. It begins with
                youth remand: why children are held before sentence, what support could prevent custody, and what we
                can do next. Start here: justicehub.com.au/adelaide
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyShortLink
                  label="Copy Adelaide link"
                  url="I am sending you this because THE CONTAINED opens in Adelaide at Tandanya on 23 June. It begins with youth remand: why children are held before sentence, what support could prevent custody, and what we can do next. Start here: https://justicehub.com.au/adelaide"
                />
                <PrimaryLink href="/contained/tour/social">Open social kit</PrimaryLink>
              </div>
            </div>

            <aside className="rounded-xl border border-[#ded8cf] bg-[#fbfaf7] p-5">
              <div className="mb-3 flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4 text-[#285d45]" />
                Consent boundary
              </div>
              <p className="text-sm leading-6 text-[#514a42]">
                Young people and families control what is shared. Public pages can show issue evidence, local asks,
                and approved story summaries. Raw interviews, private notes, and identifiable material stay private
                unless consent and cultural review are clear.
              </p>
            </aside>
          </div>
        </section>

        <section className="border-y border-[#ded8cf] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-12">
            <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#756d63]" style={{ fontFamily: MONO }}>
                  Where to go next
                </div>
                <h2 className="text-3xl font-black tracking-tight">A small set of links for different kinds of people.</h2>
              </div>
              <PrimaryLink href="/remand">Open /remand</PrimaryLink>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {actionLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-lg border border-[#ded8cf] bg-[#fbfaf7] p-4 transition-colors hover:border-[#171717]/40 hover:bg-white"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#171717] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 font-bold">{item.label}</h3>
                    <p className="text-sm leading-6 text-[#514a42]">{item.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#756d63] group-hover:text-[#171717]">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14 md:px-12">
          <div className="grid gap-6 rounded-xl border border-[#ded8cf] bg-[#171717] p-5 text-white md:p-6 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300" style={{ fontFamily: MONO }}>
                Starting point for more
              </div>
              <h2 className="mb-3 text-3xl font-black tracking-tight">
                Youth remand is the first doorway, not the whole story.
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-white/68">
                Adelaide shows the pattern in public: the artwork helps people feel the issue, JusticeHub helps them
                understand it, Empathy Ledger protects story consent, and the next step depends on who they are:
                visitor, advocate, funder, journalist, service provider, policymaker, or family member.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 self-start lg:justify-end">
              {moreVerticals.map((vertical) => (
                <span key={vertical} className="rounded-full border border-white/16 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/72">
                  {vertical}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0a0a0a] px-6 py-14 text-white md:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_440px] lg:items-center">
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-red-300" style={{ fontFamily: MONO }}>
                  Short answer
                </div>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                  Send /adelaide when someone is new. Send /remand when they are ready to go deeper.
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <CopyShortLink label="Copy /adelaide" url="https://justicehub.com.au/adelaide" dark />
                <CopyShortLink label="Copy /remand" url="https://justicehub.com.au/remand" dark />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
