'use client';

import Link from 'next/link';
import { Download, ArrowLeft } from 'lucide-react';

export default function FunderOnePager() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      {/* Screen-only toolbar */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] text-white">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/contained/invest"
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

      {/* A4 one-pager content */}
      <div className="one-pager-sheet max-w-4xl mx-auto bg-white print:bg-white print:shadow-none shadow-lg mt-20 mb-12 print:mt-0 print:mb-0">
        <div className="p-8 print:p-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 border-b-2 border-[#0A0A0A] pb-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-1">
                Investment Brief
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
              <div className="text-[10px] font-mono text-gray-500">March 2026</div>
            </div>
          </div>

          {/* The Problem — 3 stats */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-3">
              The Problem
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-l-4 border-[#DC2626] pl-3">
                <div className="text-2xl font-black font-mono text-[#DC2626]">$1.55M</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Per child per year in detention. 84% reoffend within two years.
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">ROGS 2024-25</div>
              </div>
              <div className="border-l-4 border-[#DC2626] pl-3">
                <div className="text-2xl font-black font-mono text-[#DC2626]">24x</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Indigenous overrepresentation in youth detention nationally.
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">AIHW 2024</div>
              </div>
              <div className="border-l-4 border-[#DC2626] pl-3">
                <div className="text-2xl font-black font-mono text-[#DC2626]">$40.6B</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Spent on punitive justice annually. Community programs get a fraction.
                </div>
                <div className="text-[9px] text-gray-400 font-mono mt-1">ROGS 2024-25</div>
              </div>
            </div>
          </div>

          {/* The Solution */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-3">
              The Solution
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-l-4 border-[#059669] pl-3">
                <div className="text-2xl font-black font-mono text-[#059669]">$75/day</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Community alternatives cost. 16 young people supported for the price of one in detention.
                </div>
              </div>
              <div className="border-l-4 border-[#059669] pl-3">
                <div className="text-2xl font-black font-mono text-[#059669]">95%</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Reduced anti-social behaviour. Oonchiumpa, Alice Springs — Aboriginal-led cultural healing.
                </div>
              </div>
              <div className="border-l-4 border-[#059669] pl-3">
                <div className="text-2xl font-black font-mono text-[#059669]">876</div>
                <div className="text-[11px] text-gray-600 leading-tight">
                  Verified community programs already running across Australia. Mapped by JusticeHub.
                </div>
              </div>
            </div>
          </div>

          {/* What is CONTAINED */}
          <div className="mb-5 bg-[#0A0A0A] text-white p-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 font-mono mb-2">
              What is CONTAINED?
            </h2>
            <p className="text-sm leading-relaxed text-gray-200">
              A touring immersive exhibition inside a shipping container. Three rooms: the reality
              of youth detention, the evidence for change, and the community-led alternatives already
              doing the work. Decision-makers walk through in 30 minutes and leave with evidence they
              can act on. Powered by JusticeHub — 876 verified programs, $72B funding tracked,
              20,000+ organisations linked.
            </p>
          </div>

          {/* 2026 National Tour */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-3">
              2026 National Tour
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { city: 'Mt Druitt', state: 'NSW', date: 'Apr', cost: '$25K', status: 'Planning', partner: 'Mounty Yarns' },
                { city: 'Adelaide', state: 'SA', date: 'May', cost: '$50K', status: 'Confirmed', partner: 'Reintegration Conf' },
                { city: 'Perth', state: 'WA', date: 'May', cost: '$50K', status: 'Exploring', partner: 'UWA' },
                { city: 'Tennant Creek', state: 'NT', date: 'Jun', cost: '$75K', status: 'Exploring', partner: 'Community-controlled' },
              ].map((stop) => (
                <div key={stop.city} className="border border-gray-300 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black">{stop.city}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 ${
                      stop.status === 'Confirmed'
                        ? 'bg-[#059669] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>{stop.status}</span>
                  </div>
                  <div className="text-[10px] text-gray-500">{stop.partner}</div>
                  <div className="text-sm font-black font-mono mt-1">{stop.cost}</div>
                  <div className="text-[10px] text-gray-400">{stop.date} 2026</div>
                </div>
              ))}
            </div>
          </div>

          {/* What Your Money Buys + Platform Stack side-by-side */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">
                What Your Money Buys
              </h2>
              <div className="space-y-1.5">
                {[
                  { amount: '$5K', gets: 'Documentation + photography at one stop' },
                  { amount: '$25K', gets: 'Fund the container build (3-room fit-out)' },
                  { amount: '$50K', gets: 'Fund one complete tour stop' },
                  { amount: '$100K', gets: 'Fund the full 4-city national tour' },
                  { amount: '$200K', gets: 'Full tour + documentation + partner activation' },
                ].map((tier) => (
                  <div key={tier.amount} className="flex items-start gap-2 text-[11px]">
                    <span className="font-black font-mono w-12 flex-shrink-0">{tier.amount}</span>
                    <span className="text-gray-600">{tier.gets}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">
                Permanent Infrastructure
              </h2>
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="font-black">CONTAINED</span>
                  <span className="text-gray-600"> — The emotional front door. Touring exhibition.</span>
                </div>
                <div>
                  <span className="font-black">JusticeHub</span>
                  <span className="text-gray-600"> — Public evidence layer. 876 programs, $72B tracked.</span>
                </div>
                <div>
                  <span className="font-black">ALMA</span>
                  <span className="text-gray-600"> — Evidence intelligence engine. 13 data tools, real-time.</span>
                </div>
                <div>
                  <span className="font-black">Empathy Ledger</span>
                  <span className="text-gray-600"> — Consent + story layer. 226 storytellers.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="border-t-2 border-[#0A0A0A] pt-4 flex items-end justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-tighter">Ready to talk?</div>
              <div className="text-[11px] text-gray-600 mt-0.5">
                ben@justicehub.org.au &middot; justicehub.com.au/contained/invest
              </div>
              <div className="text-[9px] text-gray-400 font-mono mt-1">
                All statistics sourced from Productivity Commission ROGS 2024-25 and verified program evaluations.
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-6">
              <div className="text-3xl font-black font-mono">$200K</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Full Tour Ask</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
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
