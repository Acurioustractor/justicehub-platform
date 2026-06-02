'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Download, ArrowLeft } from 'lucide-react';

export interface OnePagerMedia {
  twoRoomsUrl: string | null;
  twoRoomsAlt: string;
}

export function OnePagerContent({ media }: { media: OnePagerMedia }) {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      {/* Screen-only toolbar */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] text-white">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/contained"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-[#DC2626] text-white px-5 py-2 text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="one-pager-sheet max-w-4xl mx-auto bg-white print:bg-white print:shadow-none shadow-lg mt-20 mb-12 print:mt-0 print:mb-0">
        <div className="p-6 print:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 border-b-2 border-[#0A0A0A] pb-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-1">
                Investment Brief &middot; May 2026
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                THE CONTAINED
              </h1>
              <p className="text-sm text-gray-600 mt-1 max-w-md">
                One shipping container. Three rooms. The cure already exists.
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-6">
              <div className="text-lg font-black uppercase tracking-tighter">JusticeHub</div>
              <div className="text-[10px] font-mono text-gray-500">justicehub.com.au</div>
              <div className="text-[10px] font-mono text-gray-500">/contained/invest/one-pager</div>
            </div>
          </div>

          {/* The Problem — 3 stats */}
          <div className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
              The Problem
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="border-l-4 border-[#DC2626] pl-3">
                <div className="text-xl font-black font-mono text-[#DC2626]">$1.33M</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Per child per year in detention. 84% reoffend within two years.
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">ROGS 2024-25</div>
              </div>
              <div className="border-l-4 border-[#DC2626] pl-3">
                <div className="text-xl font-black font-mono text-[#DC2626]">24x</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Indigenous overrepresentation in youth detention nationally.
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">AIHW 2024</div>
              </div>
              <div className="border-l-4 border-[#DC2626] pl-3">
                <div className="text-xl font-black font-mono text-[#DC2626]">1.5%</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  678 community orgs deliver programs. The minister has met 10.
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">JusticeHub linkage 2026</div>
              </div>
            </div>
          </div>

          {/* The Solution */}
          <div className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
              The Solution
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="border-l-4 border-[#059669] pl-3">
                <div className="text-xl font-black font-mono text-[#059669]">$75/day</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Community alternatives cost. 16 young people supported for the price of one in detention.
                </div>
              </div>
              <div className="border-l-4 border-[#059669] pl-3">
                <div className="text-xl font-black font-mono text-[#059669]">95%</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Reduced anti-social behaviour. Oonchiumpa, Alice Springs / Central Australia &mdash; Aboriginal-led cultural healing.
                </div>
              </div>
              <div className="border-l-4 border-[#059669] pl-3">
                <div className="text-xl font-black font-mono text-[#059669]">981</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Verified community programs already running across Australia. Mapped by JusticeHub.
                </div>
              </div>
            </div>
          </div>

          {/* What is CONTAINED — image left, text right */}
          <div className="mb-3 bg-[#0A0A0A] text-white flex items-stretch overflow-hidden">
            <div className="relative w-[35%] min-h-[130px] bg-[#0A0A0A] flex-shrink-0">
              {media.twoRoomsUrl ? (
                <Image
                  src={media.twoRoomsUrl}
                  alt={media.twoRoomsAlt}
                  fill
                  sizes="(max-width: 768px) 50vw, 280px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 grid grid-cols-3">
                  <div className="bg-[#DC2626]" />
                  <div className="bg-[#1E3A8A]" />
                  <div className="bg-[#0A0A0A] border-l border-gray-700" />
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 font-mono mb-2">
                What is CONTAINED?
              </h2>
              <p className="text-[12px] leading-snug text-gray-200">
                A touring immersive exhibition inside a shipping container. Three rooms: the reality of
                youth detention, the evidence for change, and the community-led alternatives already doing
                the work. Decision-makers walk through in 30 minutes and leave with evidence they can act
                on. Powered by JusticeHub: 981 verified programs, $72B funding tracked, 20,000+
                organisations linked.
              </p>
            </div>
          </div>

          {/* 2026 National Tour — open route, where it's needed most */}
          <div className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
              2026-27 National Tour
            </h2>
            <p className="text-[12px] text-gray-700 leading-snug mb-2">
              The Australian tour starts with a small Mount Druitt gathering in May/June, then publicly launches at Tandanya in Adelaide on 23 June 2026. The route stays flexible around partner readiness and community ask: Perth and surrounds, Brisbane, Northern Rivers, Alice Springs / Central Australia, Sydney + Canberra, Victoria, and Tasmania follow.
            </p>
            <div className="grid grid-cols-9 gap-1.5 text-[10px]">
              {[
                { place: 'Mt Druitt', month: 'May/Jun', active: true },
                { place: 'Adelaide', month: '23 Jun', active: true },
                { place: 'Perth+', month: 'Jul/Aug', active: true },
                { place: 'Brisbane', month: 'Sep', active: true },
                { place: 'N. Rivers', month: 'Oct', active: false },
                { place: 'Alice/C.A.', month: 'Nov', active: true },
                { place: 'Syd+CBR', month: 'Dec/Jan', active: false },
                { place: 'Victoria', month: 'Feb/Mar', active: false },
                { place: 'Tasmania', month: 'Apr 2027', active: false },
              ].map((s) => (
                <div key={s.place} className={`border px-1.5 py-1 text-center ${s.active ? 'border-[#0A0A0A]' : 'border-dashed border-gray-400'}`}>
                  <div className={`font-black text-[10px] leading-tight ${s.active ? 'text-[#0A0A0A]' : 'text-gray-500'}`}>{s.place}</div>
                  <div className="text-[9px] text-gray-500 font-mono">{s.month}</div>
                </div>
              ))}
            </div>
            <div className="text-[9px] text-gray-500 font-mono mt-1.5">
              Solid = active planning window &middot; dashed = open, scoping with funders &amp; anchor partners
            </div>
          </div>

          {/* Investment tiers — amount → builds → impact */}
          <div className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
              What Your Investment Buys
            </h2>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {[
                {
                  amount: '$20K',
                  builds: 'Mount Druitt small gathering',
                  impact: 'Young people paid, Western Sydney build proof captured, and first local relationships documented before the public launch.',
                },
                {
                  amount: '$50K',
                  builds: 'Adelaide public launch at Tandanya',
                  impact: 'Conference delegates, Brisbane build story, David from Diagrama, and local Room 3 program evidence.',
                },
                {
                  amount: '$30K-$60K',
                  builds: 'One flexible tour stop',
                  impact: 'Young facilitators paid, local Room 1 and Room 3 built, documentation and reflection journals captured.',
                },
                {
                  amount: '$120K',
                  builds: 'Tour-wide backbone',
                  impact: 'Travelling facilitator core, editorial, national coordination, insurance, admin, and year-end bound record.',
                },
                {
                  amount: '$500K',
                  builds: 'Full Australian tour',
                  impact: 'Nine-stop national arc plus JusticeHub, Australian Living Map, and Empathy Ledger evidence layer published for 12 months.',
                },
                {
                  amount: 'Bespoke',
                  builds: 'Pop-up Contained, co-designed',
                  impact: 'Custom build for your audience, place, or moment. Priced to scope.',
                },
              ].map((tier) => (
                <div key={tier.amount} className="grid grid-cols-12 gap-2 text-[10px] items-start py-1">
                  <div className="col-span-2 font-black font-mono">{tier.amount}</div>
                  <div className="col-span-4 font-bold text-gray-800 leading-tight">{tier.builds}</div>
                  <div className="col-span-6 text-gray-600 leading-tight">{tier.impact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Permanent Infrastructure — compact 4-up */}
          <div className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
              Permanent Infrastructure &middot; every dollar feeds these
            </h2>
            <div className="grid grid-cols-4 gap-3 text-[10px] leading-snug">
              <div><span className="font-black">CONTAINED</span> &middot; the touring exhibition that puts decision-makers inside the choice</div>
              <div><span className="font-black">JusticeHub</span> &middot; the public evidence layer for youth justice in Australia</div>
              <div><span className="font-black">Australian Living Map of Alternatives</span> &middot; the civic intelligence engine that makes the system legible</div>
              <div><span className="font-black">Empathy Ledger</span> &middot; the consent layer for community storytelling</div>
            </div>
          </div>

          {/* Read More — single inline row of clickable links (preserved in print PDF) */}
          <div className="mb-3 flex items-center gap-3 text-[9.5px] font-mono text-gray-700 flex-wrap">
            <span className="font-bold uppercase tracking-[0.2em] text-gray-500">Read More &raquo;</span>
            <a href="https://justicehub.com.au/contained" className="underline decoration-gray-400 hover:text-[#DC2626]">
              justicehub.com.au/contained
            </a>
            <a href="https://justicehub.com.au/contained/tour" className="underline decoration-gray-400 hover:text-[#DC2626]">
              /tour
            </a>
            <a href="https://justicehub.com.au/contained/tour/intelligence" className="underline decoration-gray-400 hover:text-[#DC2626]">
              /tour/intelligence
            </a>
            <a href="https://justicehub.com.au/contained/experience" className="underline decoration-gray-400 hover:text-[#DC2626]">
              /experience
            </a>
            <a href="https://justicehub.com.au/contained/momentum" className="underline decoration-gray-400 hover:text-[#DC2626]">
              /momentum
            </a>
            <a href="https://justicehub.com.au/contained/about" className="underline decoration-gray-400 hover:text-[#DC2626]">
              /about
            </a>
            <a href="https://justicehub.com.au/contained/brief" className="underline decoration-gray-400 hover:text-[#DC2626]">
              /brief
            </a>
          </div>

          {/* Footer CTA */}
          <div className="border-t-2 border-[#0A0A0A] pt-4 flex items-end justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-tighter">Ready to talk?</div>
              <div className="text-[11px] text-gray-600 mt-0.5">
                ben@justicehub.com.au &middot; Ben Knight + Nic Marchesi &middot; A Curious Tractor
              </div>
              <div className="text-[9px] text-gray-400 font-mono mt-1">
                Sources: Productivity Commission ROGS 2024-25 &middot; AIHW 2024 &middot; JusticeHub linkage 2026
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-6">
              <div className="text-3xl font-black font-mono">$500K</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Full Tour Ask</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .one-pager-sheet {
            width: 210mm;
            min-height: 297mm;
            max-height: 297mm;
            overflow: hidden;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
