'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, Shield, Activity, FileText } from 'lucide-react';
import { Navigation, Footer } from '@/components/ui/navigation';
import dynamic from 'next/dynamic';

const EquityMapClient = dynamic(
  () => import('@/components/intelligence/EquityMapClient'),
  { ssr: false }
);

export default function CentreOfExcellencePage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navigation />

      <main className="page-content">
        {/* Hero Section - Stark & Direct */}
        <section className="min-h-[80vh] flex items-center justify-center header-offset border-b-2 border-black">
          <div className="container-justice text-center">
            <div className="inline-block border-2 border-black bg-black text-white px-4 py-1 mb-8 font-bold uppercase tracking-widest text-sm">
              JUSTICEHUB ARCHIVE
            </div>

            <h1 className="headline-truth mb-8">
              THE ARCHIVE <br />
              IS ALIVE.
            </h1>

            <p className="body-truth mx-auto mb-12 max-w-2xl">
              We verify, track, and scale the world's most undervalued asset class: <span className="font-bold border-b-2 border-black">Community Safety.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#mission" className="cta-primary">
                EXPLORE THE MISSION
              </Link>
              <Link href="/intelligence/reports/portfolio" className="cta-secondary">
                VIEW 2026 REPORT
              </Link>
            </div>
          </div>
        </section>

        {/* The Opportunity - Brutalist Data */}
        <section id="mission" className="section-padding bg-black text-white">
          <div className="container-justice">
            <div className="border-2 border-white p-8 md:p-12 text-center max-w-4xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-4">
                Total Net Present Safety (NPS)
              </h2>
              <div className="font-mono text-6xl md:text-9xl font-bold mb-4">
                $1.1B
              </div>
              <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-300">
                This is not a projection. This is the calculated economic value of 624+ verified community programs currently operating without adequate funding.
              </p>
            </div>
          </div>
        </section>

        {/* Map Section - Interactive */}
        <section className="section-padding">
          <div className="container-justice">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <h2 className="headline-truth max-w-2xl">
                Intelligence Grid
              </h2>
              <Link href="/intelligence/dashboard" className="cta-secondary flex items-center gap-2">
                <Activity className="w-5 h-5" />
                LIVE DASHBOARD
              </Link>
            </div>

            <div className="border-2 border-black p-1 bg-gray-50 h-[600px]">
              {/* Map Component */}
              <EquityMapClient />
            </div>
            <div className="mt-4 flex justify-between items-start text-sm font-mono">
              <div>
                <span className="block font-bold">STATUS:</span>
                ACTIVE MONITORING
              </div>
              <div className="text-right">
                <span className="block font-bold">DATA SOURCES:</span>
                42 LIVE STREAMS
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars - Grid Layout */}
        <section className="section-padding border-t-2 border-black bg-gray-50">
          <div className="container-justice">
            <h2 className="headline-truth mb-16 text-center">
              Centre of Excellence Pillars
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pillar 1 */}
              <div className="border-2 border-black bg-white p-8 hover:bg-black hover:text-white transition-colors group">
                <Globe className="w-12 h-12 mb-6" />
                <h3 className="text-2xl font-bold mb-4 uppercase">Signal Processing</h3>
                <p className="mb-8 text-lg leading-relaxed group-hover:text-gray-300">
                  We use AI to scrape, structure, and verify data from thousands of fragmented sources, turning "anecdotes" into actionable intelligence.
                </p>
                <Link href="/intelligence/dashboard" className="font-bold underline text-lg decoration-2 underline-offset-4 hover:decoration-white">
                  VIEW SIGNALS →
                </Link>
              </div>

              {/* Pillar 2 */}
              <div className="border-2 border-black bg-white p-8 hover:bg-black hover:text-white transition-colors group">
                <Shield className="w-12 h-12 mb-6" />
                <h3 className="text-2xl font-bold mb-4 uppercase">Verification</h3>
                <p className="mb-8 text-lg leading-relaxed group-hover:text-gray-300">
                  Our "Claim Impact" protocol allows communities to take ownership of their data, adding the human context that algorithms miss.
                </p>
                <Link href="/claims" className="font-bold underline text-lg decoration-2 underline-offset-4 hover:decoration-white">
                  CLAIM PROGRAM →
                </Link>
              </div>

              {/* Pillar 3 */}
              <div className="border-2 border-black bg-white p-8 hover:bg-black hover:text-white transition-colors group">
                <Activity className="w-12 h-12 mb-6" />
                <h3 className="text-2xl font-bold mb-4 uppercase">Investment</h3>
                <p className="mb-8 text-lg leading-relaxed group-hover:text-gray-300">
                  We model the "Safety Dividend" of every intervention, creating a new asset class for impact investors and government coffers.
                </p>
                <Link href="/intelligence/reports/portfolio" className="font-bold underline text-lg decoration-2 underline-offset-4 hover:decoration-white">
                  SEE ROI MODEL →
                </Link>
              </div>

              {/* Pillar 4 */}
              <div className="border-2 border-black bg-white p-8 hover:bg-black hover:text-white transition-colors group">
                <FileText className="w-12 h-12 mb-6" />
                <h3 className="text-2xl font-bold mb-4 uppercase">Storytelling</h3>
                <p className="mb-8 text-lg leading-relaxed group-hover:text-gray-300">
                  Data without narrative is noise. We equip communities with tools to tell their own stories, backed by the irrefutable math of their impact.
                </p>
                <Link href="/stories" className="font-bold underline text-lg decoration-2 underline-offset-4 hover:decoration-white">
                  READ STORIES →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-padding bg-black text-white">
          <div className="container-justice text-center">
            <h2 className="headline-truth mb-8">
              Ready to unlock the dividend?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                PARTNER WITH US
              </Link>
              <Link href="/intelligence/reports/portfolio" className="border-2 border-white text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
                DOWNLOAD REPORT
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
