'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, Printer } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  summary: string | null;
  story_image_url: string | null;
  storyteller_name: string | null;
  themes: string[];
}

const POSTCARD_STATS = [
  { value: '$1.33M/yr', context: 'to lock up one young person' },
  { value: '$75/day', context: 'for community alternatives' },
  { value: '84%', context: 'reoffend after detention' },
  { value: '3%', context: 'reoffend with community programs' },
  { value: '1,081', context: 'alternatives mapped on JusticeHub' },
  { value: '16×', context: 'more youth helped for the same cost' },
];

export default function PostcardsPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/empathy-ledger/stories?limit=12')
      .then(r => r.json())
      .then(data => {
        setStories((data.stories || []).filter((s: Story) => s.story_image_url));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {/* Print controls — hidden when printing */}
      <div className="print:hidden bg-[#0A0A0A] text-white p-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Print Postcards — Oonchiumpa Judges Event
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {stories.length} postcards ready. Each page = 1 front + 1 back. Print double-sided on A6 card stock.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white font-bold hover:bg-red-700"
          >
            <Printer className="h-5 w-5" /> Print All
          </button>
        </div>
      </div>

      {/* Postcards */}
      <div className="bg-gray-200 print:bg-white">
        {stories.map((story, index) => (
          <div key={story.id}>
            {/* ── FRONT ────────────────────────────── */}
            <div
              className="postcard-page relative overflow-hidden bg-[#0A0A0A] text-white"
              style={{
                width: '148mm',
                height: '105mm',
                margin: '10mm auto',
                pageBreakAfter: 'always',
                pageBreakInside: 'avoid',
              }}
            >
              {/* Background image */}
              {story.story_image_url && (
                <div className="absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.story_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.4)' }}
                  />
                </div>
              )}

              {/* Content overlay */}
              <div className="relative z-10 h-full flex flex-col justify-end p-6">
                <div className="mb-2">
                  <span
                    className="inline-block px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase"
                    style={{ backgroundColor: '#DC2626' }}
                  >
                    Real Story
                  </span>
                </div>
                <h2
                  className="text-xl font-bold leading-tight mb-2"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {story.title}
                </h2>
                {story.summary && (
                  <p className="text-sm text-gray-200 leading-snug line-clamp-3">
                    {story.summary}
                  </p>
                )}
                {story.storyteller_name && (
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    — {story.storyteller_name}
                  </p>
                )}
              </div>

              {/* Bottom bar */}
              <div
                className="absolute bottom-0 left-0 right-0 px-6 py-2 flex items-center justify-between"
                style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              >
                <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase">
                  JusticeHub + Empathy Ledger
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  justicehub.com.au/judges-on-country
                </span>
              </div>
            </div>

            {/* ── BACK ─────────────────────────────── */}
            <div
              className="postcard-page bg-[#F5F0E8] text-[#0A0A0A]"
              style={{
                width: '148mm',
                height: '105mm',
                margin: '10mm auto',
                pageBreakAfter: 'always',
                pageBreakInside: 'avoid',
              }}
            >
              <div className="h-full flex flex-col p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3
                      className="text-lg font-bold"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      What&apos;s Working in Youth Justice
                    </h3>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">
                      1,081 community-led alternatives mapped across Australia
                    </p>
                  </div>
                  {/* QR code placeholder — use a real QR service or generate at print time */}
                  <div
                    className="flex-shrink-0 bg-white border-2 border-[#0A0A0A] flex items-center justify-center"
                    style={{ width: '22mm', height: '22mm' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://justicehub.com.au/judges-on-country')}`}
                      alt="QR code"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Key stat */}
                <div
                  className="bg-[#0A0A0A] text-white p-4 mb-4"
                >
                  <div
                    className="text-3xl font-bold"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {POSTCARD_STATS[index % POSTCARD_STATS.length].value}
                  </div>
                  <div className="text-sm text-gray-300 font-mono mt-1">
                    {POSTCARD_STATS[index % POSTCARD_STATS.length].context}
                  </div>
                </div>

                {/* What you can do */}
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 font-mono">
                    Scan the QR code to:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-[#059669] font-bold">→</span>
                      Search programs near your court
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#059669] font-bold">→</span>
                      Read stories from young people
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#059669] font-bold">→</span>
                      Add programs you know about
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#059669] font-bold">→</span>
                      See THE CONTAINED tour near you
                    </li>
                  </ul>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-300 pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-500">
                    justicehub.com.au
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    Oonchiumpa Station, Alice Springs 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .postcard-page {
            margin: 0 !important;
            box-shadow: none !important;
          }
          @page {
            size: 148mm 105mm;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
}
