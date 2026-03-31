'use client';

import { Printer } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   POSTCARDS — Oonchiumpa Judges Event
   6 evidence cards. A6 format (148mm x 105mm). Print double-sided.
   Each card: Front = one truth. Back = what to do about it.
   ───────────────────────────────────────────────────────────── */

const DOMAIN = 'justicehub.com.au';

function qr(path: string, size = 150) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(`https://${DOMAIN}${path}`)}&color=0A0A0A&bgcolor=F5F0E8`;
}

/* ── Card dimensions shared across all cards ── */
const CARD_STYLE: React.CSSProperties = {
  width: '148mm',
  height: '105mm',
  margin: '10mm auto',
  pageBreakAfter: 'always',
  pageBreakInside: 'avoid',
};

/* ── Shared components ── */

function CardFooter({ label }: { label?: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-5 py-2 flex items-center justify-between"
         style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <span className="text-[9px] tracking-[0.2em] uppercase"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
        {label || 'JusticeHub Evidence Card'}
      </span>
      <span className="text-[9px]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
        Oonchiumpa Station, 2026
      </span>
    </div>
  );
}

function QRBlock({ path, size = '20mm' }: { path: string; size?: string }) {
  return (
    <div className="flex-shrink-0" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr(path)} alt="QR" className="w-full h-full" />
    </div>
  );
}

function BackFooter() {
  return (
    <div className="border-t pt-2 flex items-center justify-between"
         style={{ borderColor: '#ccc' }}>
      <span className="text-[9px]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#999' }}>
        {DOMAIN}
      </span>
      <span className="text-[9px]"
            style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#999' }}>
        Oonchiumpa Station, Alice Springs
      </span>
    </div>
  );
}

function SourceLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] mt-1"
       style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#999' }}>
      {children}
    </p>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD 1: THE COST
   ════════════════════════════════════════════════════════════ */

function Card1Front() {
  return (
    <div className="postcard-page relative overflow-hidden"
         style={{ ...CARD_STYLE, backgroundColor: '#0A0A0A', color: '#fff' }}>
      <div className="h-full flex flex-col justify-center px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase mb-3"
           style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626' }}>
          The Cost
        </p>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '72px', fontWeight: 700, lineHeight: 0.9, color: '#DC2626' }}>
          $1.33M
        </h2>
        <p className="text-xl mt-3" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#F5F0E8' }}>
          per year to lock up one child.
        </p>
        <SourceLine>ROGS 2024-25, Productivity Commission</SourceLine>
      </div>
      <CardFooter label="Card 1 of 6" />
    </div>
  );
}

function Card1Back() {
  return (
    <div className="postcard-page" style={{ ...CARD_STYLE, backgroundColor: '#F5F0E8', color: '#0A0A0A' }}>
      <div className="h-full flex flex-col p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px' }}>
              What $1.33M could fund instead
            </h3>
          </div>
          <QRBlock path="/intelligence/civic" />
        </div>

        <div className="p-4 mb-4" style={{ backgroundColor: '#0A0A0A', color: '#fff' }}>
          <div className="flex items-baseline gap-3">
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '42px', color: '#059669' }}>
              17
            </span>
            <span className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#ccc' }}>
              young people through community programs
            </span>
          </div>
          <p className="text-xs mt-2" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
            at $77K median cost per young person per year
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm leading-relaxed" style={{ color: '#333' }}>
            One year of detention for one child costs what 17 community placements cost.
            The economics are not ambiguous. The evidence is not contested.
            The only question is allocation.
          </p>
          <p className="text-[10px] mt-3" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#999' }}>
            305 programs with verified cost data. Median: $77K/year.
          </p>
        </div>

        <BackFooter />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD 2: THE GAP
   ════════════════════════════════════════════════════════════ */

function Card2Front() {
  return (
    <div className="postcard-page relative overflow-hidden"
         style={{ ...CARD_STYLE, backgroundColor: '#0A0A0A', color: '#F5F0E8' }}>
      <div className="h-full flex flex-col justify-center px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase mb-6"
           style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626' }}>
          The Gap
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-baseline gap-4">
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '48px' }}>678</span>
            <span className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
              organisations deliver youth justice programs
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '48px' }}>192</span>
            <span className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
              met with ministers
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '48px', color: '#DC2626' }}>10</span>
            <span className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
              overlap
            </span>
          </div>
        </div>

        <p className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666' }}>
          1.5% of the people doing the work have the ear of government.
        </p>
      </div>
      <CardFooter label="Card 2 of 6" />
    </div>
  );
}

function Card2Back() {
  return (
    <div className="postcard-page" style={{ ...CARD_STYLE, backgroundColor: '#F5F0E8', color: '#0A0A0A' }}>
      <div className="h-full flex flex-col p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px' }}>
            The access gap is measurable.
          </h3>
          <QRBlock path="/intelligence/civic" />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#333' }}>
            CivicScope cross-references ministerial diaries with organisation registries.
            Of 678 organisations delivering youth justice services, only 192 secured a
            ministerial meeting. Only 10 of those 192 actually deliver front-line programs.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#333' }}>
            The people with the evidence rarely have the access. The people with the
            access rarely have the evidence.
          </p>
          <div className="p-3 border-l-4" style={{ borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.06)' }}>
            <p className="text-sm italic" style={{ color: '#333' }}>
              &ldquo;You see these young people. You know what works. The data confirms it.&rdquo;
            </p>
          </div>
        </div>

        <BackFooter />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD 3: WHAT WORKS — OONCHIUMPA
   ════════════════════════════════════════════════════════════ */

function Card3Front() {
  return (
    <div className="postcard-page relative overflow-hidden"
         style={{ ...CARD_STYLE, backgroundColor: '#0A0A0A' }}>
      {/* Hero image */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/media/oonchiumpa/hero-hero-main.jpg"
          alt="Oonchiumpa Station"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.35)' }}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase mb-4"
           style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#059669' }}>
          What Works
        </p>

        <div className="space-y-1 mb-4">
          <div className="flex items-baseline gap-3">
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '52px', color: '#059669' }}>
              95%
            </span>
            <span className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#ccc' }}>
              reduction
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '52px', color: '#F5F0E8' }}>
              $75
            </span>
            <span className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#ccc' }}>
              per day
            </span>
          </div>
        </div>

        <p className="text-base" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#F5F0E8' }}>
          Cultural healing on country.
        </p>
      </div>

      <CardFooter label="Card 3 of 6" />
    </div>
  );
}

function Card3Back() {
  return (
    <div className="postcard-page" style={{ ...CARD_STYLE, backgroundColor: '#F5F0E8', color: '#0A0A0A' }}>
      <div className="h-full flex flex-col p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px' }}>
              Oonchiumpa Station
            </h3>
            <p className="text-[10px] mt-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666' }}>
              Founded by Kristy Bloomfield &amp; Tanya Turner
            </p>
          </div>
          <QRBlock path="/judges-on-country" />
        </div>

        <div className="flex-1">
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#333' }}>
            Four programs operating on country. Cultural immersion, land management,
            elder mentorship, and structured therapeutic support — delivered where
            young people can heal, not where the system finds it convenient.
          </p>

          <div className="p-3 mb-3" style={{ backgroundColor: '#0A0A0A', color: '#fff' }}>
            <p className="text-xs uppercase tracking-wider mb-1"
               style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#059669' }}>
              Operation Luna
            </p>
            <p className="text-sm" style={{ color: '#ccc' }}>
              Of the young people who completed the program, only 1 of 21 remained
              on the high-risk list.
            </p>
          </div>

          <div className="p-3 border-l-4" style={{ borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.06)' }}>
            <p className="text-sm font-bold italic" style={{ color: '#0A0A0A' }}>
              You&apos;re standing on the proof.
            </p>
          </div>
        </div>

        <BackFooter />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD 4: THE PATTERN
   ════════════════════════════════════════════════════════════ */

function Card4Front() {
  return (
    <div className="postcard-page relative overflow-hidden"
         style={{ ...CARD_STYLE, backgroundColor: '#0A0A0A', color: '#F5F0E8' }}>
      <div className="h-full flex flex-col justify-center px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase mb-6"
           style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626' }}>
          The Pattern
        </p>

        <div className="flex items-end gap-6 mb-6">
          <div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '96px', lineHeight: 0.85, color: '#DC2626' }}>
              84
            </span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '32px', color: '#DC2626' }}>%</span>
          </div>
          <div className="pb-2">
            <p className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
              reoffend after detention
            </p>
          </div>
        </div>

        <div className="flex items-end gap-6">
          <div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '96px', lineHeight: 0.85, color: '#059669' }}>
              3
            </span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '32px', color: '#059669' }}>%</span>
          </div>
          <div className="pb-2">
            <p className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
              with community programs
            </p>
          </div>
        </div>
      </div>
      <CardFooter label="Card 4 of 6" />
    </div>
  );
}

function Card4Back() {
  return (
    <div className="postcard-page" style={{ ...CARD_STYLE, backgroundColor: '#F5F0E8', color: '#0A0A0A' }}>
      <div className="h-full flex flex-col p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px' }}>
            Detention doesn&apos;t reduce crime.<br />It produces it.
          </h3>
          <QRBlock path="/proof" />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#333' }}>
            The recidivism data is unambiguous. Detention creates a cycle.
            Community-based programs break it. The 84% vs 3% gap is not
            a statistical outlier — it is the consistent finding across
            every jurisdiction that measures outcomes.
          </p>

          <div className="p-4" style={{ backgroundColor: '#0A0A0A', color: '#fff' }}>
            <p className="text-lg mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#059669' }}>
              1,081
            </p>
            <p className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#ccc' }}>
              alternatives mapped. Search programs near your court.
            </p>
          </div>
        </div>

        <BackFooter />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD 5: THE PROMISE
   ════════════════════════════════════════════════════════════ */

function Card5Front() {
  return (
    <div className="postcard-page relative overflow-hidden"
         style={{ ...CARD_STYLE, backgroundColor: '#0A0A0A', color: '#F5F0E8' }}>
      <div className="h-full flex flex-col justify-center px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase mb-6"
           style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#DC2626' }}>
          The Promise
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-baseline gap-4">
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '48px', color: '#DC2626' }}>47</span>
            <span className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
              parliamentary speeches mention youth detention
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '48px', color: '#059669' }}>10</span>
            <span className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
              mention alternatives
            </span>
          </div>
        </div>

        <div className="inline-block px-4 py-2" style={{ backgroundColor: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '24px', color: '#DC2626' }}>
            5:1
          </p>
          <p className="text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
            the rhetoric gap
          </p>
        </div>
      </div>
      <CardFooter label="Card 5 of 6" />
    </div>
  );
}

function Card5Back() {
  return (
    <div className="postcard-page" style={{ ...CARD_STYLE, backgroundColor: '#F5F0E8', color: '#0A0A0A' }}>
      <div className="h-full flex flex-col p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px' }}>
            The accountability gap is now visible.
          </h3>
          <QRBlock path="/intelligence/civic" />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#333' }}>
            We track every promise, every recommendation, every dollar.
            CivicScope monitors parliamentary speeches, ministerial diaries,
            committee reports, and budget allocations — cross-referenced
            against what actually reaches communities.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#333' }}>
            Parliament talks about detention five times for every one mention
            of what works. The political incentive structure rewards punishment
            rhetoric. The evidence points the other way.
          </p>
          <div className="p-3 border-l-4" style={{ borderColor: '#DC2626', backgroundColor: 'rgba(220,38,38,0.04)' }}>
            <p className="text-sm italic" style={{ color: '#333' }}>
              Oversight recommendations are tracked. Rejections are recorded.
              The pattern is now searchable.
            </p>
          </div>
        </div>

        <BackFooter />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD 6: YOUR ROLE
   ════════════════════════════════════════════════════════════ */

function Card6Front() {
  return (
    <div className="postcard-page relative overflow-hidden"
         style={{ ...CARD_STYLE, backgroundColor: '#0A0A0A', color: '#F5F0E8' }}>
      <div className="h-full flex flex-col justify-center px-8">
        <p className="text-[10px] tracking-[0.3em] uppercase mb-6"
           style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#059669' }}>
          Your Role
        </p>

        <h2 className="mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '28px', lineHeight: 1.2, color: '#F5F0E8' }}>
          Every sentence is a data point.
        </h2>

        <p className="text-sm" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#888' }}>
          Judges see 60% of First Nations children before any other system does.
        </p>
      </div>
      <CardFooter label="Card 6 of 6" />
    </div>
  );
}

function Card6Back() {
  return (
    <div className="postcard-page" style={{ ...CARD_STYLE, backgroundColor: '#F5F0E8', color: '#0A0A0A' }}>
      <div className="h-full flex flex-col p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px' }}>
            Four things you can do today
          </h3>
          <QRBlock path="/judges-on-country" />
        </div>

        <div className="flex-1">
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#0A0A0A', color: '#059669', fontFamily: 'IBM Plex Mono, monospace' }}>
                1
              </span>
              <div>
                <p className="text-sm font-bold">Search alternatives near your court</p>
                <p className="text-[10px]" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666' }}>
                  {DOMAIN}/proof
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#0A0A0A', color: '#059669', fontFamily: 'IBM Plex Mono, monospace' }}>
                2
              </span>
              <div>
                <p className="text-sm font-bold">Request community impact reports</p>
                <p className="text-[10px]" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666' }}>
                  {DOMAIN}/intelligence/chat
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#0A0A0A', color: '#059669', fontFamily: 'IBM Plex Mono, monospace' }}>
                3
              </span>
              <div>
                <p className="text-sm font-bold">Share what works in your jurisdiction</p>
                <p className="text-[10px]" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666' }}>
                  {DOMAIN}/intelligence/chat
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#0A0A0A', color: '#059669', fontFamily: 'IBM Plex Mono, monospace' }}>
                4
              </span>
              <div>
                <p className="text-sm font-bold">Ask ALMA — our AI knows 1,081 programs</p>
                <p className="text-[10px]" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666' }}>
                  {DOMAIN}/intelligence/chat
                </p>
              </div>
            </div>
          </div>
        </div>

        <BackFooter />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════ */

export default function PostcardsPage() {
  const cards = [
    { front: <Card1Front />, back: <Card1Back /> },
    { front: <Card2Front />, back: <Card2Back /> },
    { front: <Card3Front />, back: <Card3Back /> },
    { front: <Card4Front />, back: <Card4Back /> },
    { front: <Card5Front />, back: <Card5Back /> },
    { front: <Card6Front />, back: <Card6Back /> },
  ];

  return (
    <>
      {/* ── Print controls ── */}
      <div className="print:hidden sticky top-0 z-50 px-6 py-4"
           style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Evidence Cards — Oonchiumpa Judges Event
            </h1>
            <p className="text-sm mt-1" style={{ color: '#888', fontFamily: 'IBM Plex Mono, monospace' }}>
              6 cards, 12 pages. Print double-sided on A6 card stock (148mm x 105mm).
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 font-bold text-white transition-colors"
            style={{ backgroundColor: '#DC2626', fontFamily: 'Space Grotesk, sans-serif' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b91c1c')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#DC2626')}
          >
            <Printer className="h-5 w-5" /> Print All
          </button>
        </div>
      </div>

      {/* ── Card Preview ── */}
      <div className="print:hidden px-6 py-4" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3">
          {['THE COST', 'THE GAP', 'OONCHIUMPA', 'THE PATTERN', 'THE PROMISE', 'YOUR ROLE'].map((title, i) => (
            <button
              key={title}
              onClick={() => {
                const el = document.getElementById(`card-${i + 1}`);
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-left p-3 transition-colors"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#DC2626')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}
            >
              <span className="text-[9px] block mb-1"
                    style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#666' }}>
                Card {i + 1}
              </span>
              <span className="text-sm font-bold block"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#F5F0E8' }}>
                {title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards ── */}
      <div style={{ backgroundColor: '#e5e5e5' }} className="print:bg-transparent pb-10 print:pb-0">
        {cards.map((card, i) => (
          <div key={i} id={`card-${i + 1}`}>
            {card.front}
            {card.back}
          </div>
        ))}
      </div>

      {/* ── Print Styles ── */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .postcard-page {
            margin: 0 !important;
            box-shadow: none !important;
          }
          @page {
            size: 148mm 105mm;
            margin: 0;
          }
        }
        @media screen {
          .postcard-page {
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }
        }
      `}</style>
    </>
  );
}
