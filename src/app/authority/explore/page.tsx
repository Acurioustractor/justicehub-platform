'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const FundingNetwork = dynamic(() => import('@/components/authority/FundingNetwork'), { ssr: false });
const DataExplorer = dynamic(() => import('@/components/authority/DataExplorer'), { ssr: false });

export default function AuthorityExplorePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Floating header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-md border-b border-gray-800/50' : ''
        }`}
      >
        <div className="flex items-center justify-between px-5 md:px-8 py-3">
          <Link
            href="/authority"
            className="flex items-center gap-2 text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors text-xs font-mono uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Authority Brief
          </Link>
          <span className="font-mono text-[10px] text-[#F5F0E8]/20 uppercase tracking-widest hidden md:block">
            Organisation Explorer
          </span>
        </div>
      </motion.header>

      <main>
        {/* Hero */}
        <section className="pt-20 md:pt-24 pb-8 md:pb-12 px-5 md:px-8">
          <div className="container-justice">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-red-500 mb-4"
            >
              Full Organisation Map
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-3xl md:text-6xl font-bold tracking-[-0.03em] text-[#F5F0E8] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Every organisation. Every dollar.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-[14px] md:text-[15px] text-[#F5F0E8]/40 max-w-2xl leading-relaxed"
            >
              The full funding map — every organisation sized by funding received, coloured by evidence quality.
              Green blocks run programs that work. Red blocks receive millions with no evidence-rated programs.
              Click any block to explore.
            </motion.p>
          </div>
        </section>

        {/* Legend — prominent at top */}
        <section className="px-5 md:px-8 pb-6">
          <div className="container-justice">
            <div className="flex flex-wrap gap-x-5 gap-y-2 p-4 border border-gray-800 bg-gray-950/50">
              <span className="font-mono text-[10px] text-[#F5F0E8]/30 uppercase tracking-widest mr-2 self-center">Evidence Key</span>
              {[
                { color: '#059669', label: 'Proven / Effective' },
                { color: '#d97706', label: 'Promising' },
                { color: '#9333ea', label: 'Indigenous-led' },
                { color: '#dc2626', label: 'Large spend, no programs' },
                { color: '#6b7280', label: 'Untested programs' },
                { color: '#374151', label: 'No programs' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-[#F5F0E8]/50">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Full-viewport treemap */}
        <section className="px-0 md:px-0">
          <FundingNetwork heightOverride={800} />
        </section>

        {/* Data Explorer */}
        <section className="pt-16 md:pt-24 pb-20 md:pb-28 border-t border-gray-800">
          <div className="container-justice px-5 md:px-8 mb-8 md:mb-12">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
              Research Mode
            </div>
            <h2
              className="text-2xl md:text-5xl font-bold tracking-[-0.02em] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Your turn. Dig in.
            </h2>
            <p className="text-[14px] md:text-[15px] text-[#F5F0E8]/40 max-w-2xl leading-relaxed">
              Search, filter, and sort every organisation in the database. Click any row to see their full profile
              with funding history, interventions, and evidence ratings.
            </p>
          </div>
          <DataExplorer />
        </section>

        {/* Minimal footer */}
        <footer className="py-8 border-t border-gray-800">
          <div className="container-justice px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#F5F0E8]/60 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                JUSTICEHUB
              </span>
              <span className="text-[10px] text-[#F5F0E8]/20 font-mono">Organisation Explorer</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#F5F0E8]/30">
              <Link href="/authority" className="hover:text-[#F5F0E8]/60 transition-colors">Authority Brief</Link>
              <Link href="/intelligence/dashboard" className="hover:text-[#F5F0E8]/60 transition-colors">Dashboard</Link>
              <Link href="/contained" className="hover:text-[#F5F0E8]/60 transition-colors">CONTAINED</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
