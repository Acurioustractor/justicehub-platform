'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useInView } from 'framer-motion';
import {
  Share2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Send,
  MapPin,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';

// ── Lazy-load heavy viz components ──
const MoneyFlow = dynamic(() => import('@/components/authority/MoneyFlow'), { ssr: false });
const CostCascade = dynamic(() => import('@/components/authority/CostCascade'), { ssr: false });
const CaseStudyCards = dynamic(() => import('@/components/authority/CaseStudyCard'), { ssr: false });
const FundingNetwork = dynamic(() => import('@/components/authority/FundingNetwork'), { ssr: false });
const CrossSystemPipeline = dynamic(() => import('@/components/authority/CrossSystemPipeline'), { ssr: false });
const DataExplorer = dynamic(() => import('@/components/authority/DataExplorer'), { ssr: false });
import ScrollChapter, { ScrollChild } from '@/components/authority/ScrollChapter';


// ── Types ──
interface AuthorityStats {
  inequality: {
    top10Total: number;
    bottom100Total: number;
    ratio: string;
    ratioRaw: number;
  };
  detention: {
    costPerDayVic: number;
    costPerDayNsw: number;
    communitySupervisionRange: [number, number];
    kidsInDetention: number;
    totalDetentionSpend: number;
    reoffendingRate: number;
  };
  heroes: Array<{
    name: string;
    programs: number;
    evidenceLevels: string[];
  }>;
  indigenous: {
    fundingSharePct: number;
    fundingAmount: number;
    overrepresentationRatio: number;
  };
  interventions: {
    total: number;
    evidenceBackedPct: number;
    evidenceBackedCount: number;
  };
  totalFunding: number;
  passion: {
    supporters: number;
    tourDemand: Array<{ city: string; count: number }>;
  };
  topRecipients: Array<{ name: string; total: number; grant_count: number; tier: string }>;
  moneyFlows: {
    nodes: Array<{ id: string; name: string; type: string }>;
    links: Array<{ source: number; target: number; value: number }>;
  };
  stateDetention: Array<{ state: string; costPerDay: number; annual: number }>;
  caseStudies: Array<{
    orgName: string;
    programs: Array<{ name: string; evidenceLevel: string; type?: string }>;
    totalPrograms: number;
    govFunding: number;
    costPerParticipant: number;
    description: string;
  }>;
}

interface Reflection {
  id: string;
  name: string;
  location?: string;
  reflection: string;
  city_nomination?: string;
  created_at: string;
}

// ── Helpers ──
function formatBillions(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Animated Counter ──
function AnimatedNumber({ target, duration = 2500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

// ── Campaign Takeaway — pull-quote callout ──
function Takeaway({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);
  const visible = inView || forceVisible;

  return (
    <div
      ref={ref}
      className="mt-8 md:mt-10 pl-4 md:pl-5 border-l-2 border-red-600"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateX(-20px)',
        transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
      }}
    >
      <p className="text-sm md:text-base text-[#F5F0E8]/60 italic leading-relaxed">{children}</p>
    </div>
  );
}

// ── Small Components ──
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };
  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border transition-colors flex items-center gap-1.5 shrink-0 ${
        copied ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-600 text-gray-400 hover:border-white hover:text-white'
      }`}
    >
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

function ShareTileButton({ stat }: { stat: string }) {
  const [open, setOpen] = useState(false);
  const formats = [
    { key: 'default', label: 'Feed (1080x1080)', desc: 'Instagram, Facebook' },
    { key: 'story', label: 'Story (1080x1920)', desc: 'Instagram, TikTok' },
    { key: 'landscape', label: 'Landscape (1200x630)', desc: 'LinkedIn, Twitter' },
  ];

  const handleDownload = async (format: string) => {
    const url = `/api/contained/share-card?stat=${stat}&format=${format}`;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `contained-${stat}-${format}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
      >
        <Share2 className="w-3.5 h-3.5" /> Share
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 md:left-0 md:right-auto mt-1 bg-gray-900 border border-gray-700 z-50 min-w-[220px]">
          {formats.map((f) => (
            <button
              key={f.key}
              onClick={() => handleDownload(f.key)}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
            >
              <div className="text-xs font-bold text-white">{f.label}</div>
              <div className="text-xs text-gray-500">{f.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Floating minimal header for immersive mode ──
function ImmersiveHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-md border-b border-gray-800/50' : ''
      }`}
    >
      <div className="flex items-center justify-between px-5 md:px-8 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors text-xs font-mono uppercase tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          JusticeHub
        </Link>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#F5F0E8]/20 uppercase tracking-widest hidden md:block">
            Authority Brief
          </span>
          <Link
            href="/intelligence/dashboard"
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-gray-700 text-gray-400 hover:border-red-600 hover:text-red-500 transition-colors"
          >
            Explore Data
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

// ── Main Page ──
export default function AuthorityPage() {
  const [stats, setStats] = useState<AuthorityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [reflectionsTotal, setReflectionsTotal] = useState(0);
  const [reflectionsPage, setReflectionsPage] = useState(1);
  const [reflectionsHasMore, setReflectionsHasMore] = useState(false);
  const [reflectionsLoading, setReflectionsLoading] = useState(true);
  // Form state
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formReflection, setFormReflection] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const s = stats;

  useEffect(() => {
    fetch('/api/authority/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchReflections = useCallback(async (page: number, append: boolean) => {
    if (!append) setReflectionsLoading(true);
    try {
      const res = await fetch(`/api/authority/reflections?page=${page}`);
      const data = await res.json();
      if (append) {
        setReflections(prev => [...prev, ...(data.reflections || [])]);
      } else {
        setReflections(data.reflections || []);
      }
      setReflectionsTotal(data.total || 0);
      setReflectionsHasMore(data.hasMore || false);
    } catch { /* silent */ }
    setReflectionsLoading(false);
  }, []);

  useEffect(() => {
    fetchReflections(1, false);
  }, [fetchReflections]);

  const loadMoreReflections = () => {
    const next = reflectionsPage + 1;
    setReflectionsPage(next);
    fetchReflections(next, true);
  };

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/authority/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          location: formLocation || undefined,
          reflection: formReflection,
          city_nomination: formCity || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }
      setFormSuccess(true);
      setFormName('');
      setFormLocation('');
      setFormReflection('');
      setFormCity('');
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setFormSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <ImmersiveHeader />

      <main>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER 1: HERO — Constructivist fullscreen
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-in" fullHeight className="relative overflow-hidden">
          {/* Constructivist red wedge accent */}
          <motion.div
            initial={{ opacity: 0, rotate: 45, scale: 0.8 }}
            animate={{ opacity: 0.08, rotate: 45, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="absolute -top-[100px] md:-top-[150px] -right-[60px] md:-right-[100px] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-red-600 pointer-events-none"
            aria-hidden
          />
          {/* Subtle grid lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #F5F0E8 0px, #F5F0E8 1px, transparent 1px, transparent 120px)' }}
            aria-hidden
          />

          <div className="container-justice px-5 md:px-8 py-24 md:py-0 flex-1 flex flex-col justify-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-red-500 mb-5"
            >
              JusticeHub Authority Brief
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-[clamp(60px,12vw,180px)] font-bold tracking-[-0.04em] leading-[0.85] text-[#F5F0E8] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              ${!loading && <AnimatedNumber target={97.9} duration={2000} />}
              {loading && '...'}B
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="h-1 bg-red-600 mb-5"
            />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="text-[clamp(22px,3vw,42px)] font-bold text-[#F5F0E8] leading-[1.1] tracking-[-0.02em] max-w-[600px] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              We tracked every dollar.<br />
              Here&apos;s where it goes.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="text-[14px] md:text-[15px] text-[#F5F0E8]/40 max-w-[480px] leading-relaxed"
            >
              Every number is a live query against Australia&apos;s most
              comprehensive justice funding database. Not estimates. Not projections. Receipts.
            </motion.p>
          </div>

          {/* Right-side data callouts — hidden on mobile */}
          <div className="absolute top-1/2 -translate-y-1/2 right-8 md:right-20 hidden lg:flex flex-col items-end gap-8">
            {[
              { label: 'Funding Records', value: '71,087', color: 'text-[#F5F0E8]' },
              { label: 'Organisations', value: '18,304', color: 'text-[#F5F0E8]' },
              { label: 'Interventions Rated', value: '876', color: 'text-red-500' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.8 + i * 0.2 }}
                className="text-right"
              >
                <div className="font-mono text-[11px] text-[#F5F0E8]/35 tracking-[0.15em] uppercase">{stat.label}</div>
                <div className={`text-[48px] font-bold tracking-[-0.02em] ${stat.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile data callouts — horizontal row */}
          <div className="flex lg:hidden justify-center gap-6 pb-8 relative z-10">
            {[
              { label: 'Records', value: '71K' },
              { label: 'Orgs', value: '18K' },
              { label: 'Rated', value: '876' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.8 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
                <div className="font-mono text-[9px] text-[#F5F0E8]/30 tracking-[0.15em] uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#F5F0E8]/20">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-5 h-8 border border-[#F5F0E8]/15 rounded-full flex justify-center pt-1.5"
            >
              <div className="w-1 h-2 bg-[#F5F0E8]/20 rounded-full" />
            </motion.div>
          </motion.div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER 2: WHERE THE MONEY GOES — detention vs community split
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-up">
          <div className="container-justice px-5 md:px-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
                  Where the Money Goes
                </div>
                <h2 className="text-2xl md:text-5xl font-bold tracking-[-0.02em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  The system funds itself.
                </h2>
              </div>
              <ShareTileButton stat="inequality" />
            </div>

            <MoneyFlow data={s?.moneyFlows || null} totalFunding={s?.totalFunding} />

            <Takeaway>
              Australia spends billions cycling children through detention, policing, and courts &mdash;
              while the community programs that actually reduce reoffending get less than 5%.
              This is not a funding gap. It&apos;s a policy choice.
            </Takeaway>
          </div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER 3: THE PRICE OF A CHILD — Animated cost cascade
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-up">
          <CostCascade stateDetention={s?.stateDetention || [
            { state: 'VIC', costPerDay: 7304, annual: 2666960 },
            { state: 'NT', costPerDay: 5841, annual: 2131965 },
            { state: 'QLD', costPerDay: 3811, annual: 1391015 },
            { state: 'WA', costPerDay: 3267, annual: 1192455 },
            { state: 'SA', costPerDay: 2989, annual: 1090985 },
            { state: 'NSW', costPerDay: 2573, annual: 939145 },
            { state: 'TAS', costPerDay: 2401, annual: 876365 },
            { state: 'ACT', costPerDay: 2156, annual: 786940 },
          ]} />
          <div className="container-justice px-5 md:px-8">
            <Takeaway>
              Detention doesn&apos;t work. It costs more than a year at the most expensive university
              in the country &mdash; and 84% of kids come back. We are paying premium prices for failure.
            </Takeaway>
          </div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER 4: THE HEROES — Case study deep-dive cards
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-up">
          <CaseStudyCards studies={s?.caseStudies || [
            {
              orgName: 'Just Reinvest NSW',
              programs: [
                { name: 'Bourke Justice Reinvestment', evidenceLevel: 'Effective (strong evaluation, positive outcomes)', type: 'justice_reinvestment' },
                { name: 'Maranguka Hub', evidenceLevel: 'Effective (strong evaluation, positive outcomes)', type: 'community_hub' },
              ],
              totalPrograms: 9,
              govFunding: 0,
              costPerParticipant: 5200,
              description: 'Justice reinvestment partnership with Bourke community — redirects savings from reduced incarceration into local services.',
            },
            {
              orgName: 'Olabud Doogethu',
              programs: [
                { name: 'Night Patrol', evidenceLevel: 'Indigenous-led (culturally grounded, community authority)', type: 'patrol' },
                { name: 'Youth Diversion', evidenceLevel: 'Indigenous-led (culturally grounded, community authority)', type: 'diversion' },
              ],
              totalPrograms: 2,
              govFunding: 0,
              costPerParticipant: 3800,
              description: 'Halls Creek community-led initiative — night patrols, youth diversion, and cultural programs reducing youth crime by 45%.',
            },
            {
              orgName: 'BackTrack Youth Works',
              programs: [
                { name: 'Dog Program', evidenceLevel: 'Promising (community-endorsed, emerging evidence)', type: 'mentoring' },
                { name: 'Trades Training', evidenceLevel: 'Promising (community-endorsed, emerging evidence)', type: 'training' },
              ],
              totalPrograms: 4,
              govFunding: 0,
              costPerParticipant: 4500,
              description: 'Armidale-based youth program — trades training, dog handling, mentoring. Zero participants have returned to detention.',
            },
          ]} />
          <div className="container-justice px-5 md:px-8">
            <Takeaway>
              876 community-based alternatives exist. 54.9% have evidence they work.
              Many run on volunteer time and donations. The solutions are here.
              The funding isn&apos;t.
            </Takeaway>
          </div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER 5: WHO GETS WHAT — Treemap of all orgs
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-up">
          <div className="container-justice px-5 md:px-8">
            <div className="mb-8">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
                Who Gets What
              </div>
              <h2 className="text-2xl md:text-5xl font-bold tracking-[-0.02em] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Every organisation. Every dollar.
              </h2>
              <p className="text-[14px] md:text-[15px] text-[#F5F0E8]/40 max-w-2xl leading-relaxed">
                200 organisations mapped by funding size and evidence quality.
                Green blocks run programs that work. Red blocks receive millions with no evidence-rated programs.
                Click any block to see what they do.
              </p>
            </div>
          </div>
          <FundingNetwork />
          <div className="container-justice px-5 md:px-8">
            <div className="mt-6 flex items-center gap-4">
              <Link
                href="/authority/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-600 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors"
              >
                Explore full map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] text-[#F5F0E8]/25 font-mono">Full-screen explorer with search &amp; filters</span>
            </div>
            <Takeaway>
              The biggest recipients are government departments administering detention.
              The smallest are community organisations running programs that keep kids out of it.
              The funding system rewards failure.
            </Takeaway>
          </div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER 6: THE INVISIBLE PIPELINE — Cross-system linkages
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-up" id="cross-system">
          <CrossSystemPipeline />
          <div className="container-justice px-5 md:px-8">
            <Takeaway>
              Child protection, disability, and poverty are not separate issues.
              They are the same pipeline. A child enters one system and cycles through all three
              before detention catches them. We fund the endpoint, not the cause.
            </Takeaway>
          </div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER 7: THE INDIGENOUS GAP — Proportional animated bars
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-up" id="indigenous-gap">
          <div className="container-justice px-5 md:px-8">
            <div className="mb-4">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
                The Indigenous Gap
              </div>
              <h2 className="text-[clamp(24px,4vw,64px)] font-bold text-[#F5F0E8] tracking-[-0.03em] leading-[1.1]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {loading ? '...' : `${s?.indigenous.fundingSharePct || 10.8}%`} of funding.<br className="md:hidden" /> 65% of detention.
              </h2>
            </div>

            <div className="space-y-8 md:space-y-10 mt-8 md:mt-12">
              {/* Funding bar */}
              <div>
                <div className="flex justify-between items-baseline mb-3 gap-2">
                  <span className="text-xs md:text-sm text-[#F5F0E8]/40">Share of justice funding to Indigenous organisations</span>
                  <span className="text-xl md:text-2xl font-bold text-purple-500 shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s?.indigenous.fundingSharePct || 10.8}%
                  </span>
                </div>
                <div className="w-full h-8 md:h-10 bg-[#F5F0E8]/5 overflow-hidden">
                  <IndigenousGapBar targetWidth={s?.indigenous.fundingSharePct || 10.8} color="bg-purple-600" />
                </div>
              </div>

              {/* Detention bar */}
              <div>
                <div className="flex justify-between items-baseline mb-3 gap-2">
                  <span className="text-xs md:text-sm text-[#F5F0E8]/40">Share of youth in detention who are Indigenous</span>
                  <span className="text-xl md:text-2xl font-bold text-red-500 shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>~65%</span>
                </div>
                <div className="w-full h-8 md:h-10 bg-[#F5F0E8]/5 overflow-hidden">
                  <IndigenousGapBar targetWidth={65} color="bg-red-600" delay={0.3} />
                </div>
              </div>

              {/* Bottom stats row */}
              <div className="flex flex-wrap gap-6 md:gap-10 pt-4">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s?.indigenous.overrepresentationRatio || 23.1}x
                  </div>
                  <div className="text-[12px] md:text-[13px] text-[#F5F0E8]/35 mt-1">overrepresentation ratio</div>
                </div>
                <div className="w-px bg-[#F5F0E8]/10 hidden md:block" />
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-purple-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {loading ? '...' : formatBillions(s?.indigenous.fundingAmount || 10550000000)}
                  </div>
                  <div className="text-[12px] md:text-[13px] text-[#F5F0E8]/35 mt-1">to Indigenous orgs of {formatBillions(s?.totalFunding || 97900000000)} tracked</div>
                </div>
                <div className="w-px bg-[#F5F0E8]/10 hidden md:block" />
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>1,853</div>
                  <div className="text-[12px] md:text-[13px] text-[#F5F0E8]/35 mt-1">Indigenous organisations tracked</div>
                </div>
              </div>
            </div>

            <Takeaway>
              First Nations children are 23 times more likely to be locked up than non-Indigenous children.
              Their communities receive a tenth of the funding. This is systemic. This is measurable.
              This is a choice.
            </Takeaway>
          </div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            CHAPTER 8: THE CONTAINER IS COMING — Tour demand + reflections
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="stagger-children" className="bg-gradient-to-b from-black to-gray-950">
          <div className="container-justice px-5 md:px-8">
            <ScrollChild>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 md:mb-12">
                <div>
                  <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-red-500 mb-3">
                    The Container Is Coming
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold tracking-[-0.02em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s?.passion.supporters || 230} people said bring it here.
                  </h2>
                </div>
                <ShareTileButton stat="tour_demand" />
              </div>
            </ScrollChild>

            <ScrollChild>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
                {(s?.passion.tourDemand || [
                  { city: 'Perth', count: 6 },
                  { city: 'Melbourne', count: 5 },
                  { city: 'Canberra', count: 5 },
                  { city: 'Sydney', count: 4 },
                ]).map((td) => (
                  <div key={td.city} className="border border-gray-800 p-4 md:p-5 text-center hover:border-red-800 transition-colors">
                    <div className="text-2xl md:text-3xl font-black text-red-500 mb-1">{td.count}</div>
                    <div className="text-sm font-bold">{td.city}</div>
                    <div className="text-xs text-gray-600 mt-1">demand signals</div>
                  </div>
                ))}
              </div>
            </ScrollChild>

            <ScrollChild>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center">
                <Link
                  href="/contained/nominations"
                  className="px-6 py-3 bg-red-600 text-white font-bold uppercase tracking-widest text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Nominate a Leader <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contained/tour"
                  className="px-6 py-3 border border-gray-600 text-gray-300 font-bold uppercase tracking-widest text-sm hover:border-white hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  Tour Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </ScrollChild>
          </div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            ADD YOUR VOICE — Reflections form + wall
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-up" id="reflect">
          <div className="container-justice px-5 md:px-8">
            <div className="mb-8 md:mb-12">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
                Add Your Voice
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-[-0.02em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Community Reflections
              </h2>
              {reflectionsTotal > 0 && (
                <p className="text-sm text-gray-500 mt-2">{reflectionsTotal} reflections shared</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-10">
              {/* Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmitReflection} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Name *</label>
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required maxLength={100}
                      className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition-colors"
                      placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Location</label>
                    <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} maxLength={100}
                      className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition-colors"
                      placeholder="City or region" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Your reflection *</label>
                    <textarea value={formReflection} onChange={e => setFormReflection(e.target.value)} required maxLength={500} rows={4}
                      className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition-colors resize-none"
                      placeholder="What does justice mean to you? Why does this matter?" />
                    <div className="text-xs text-gray-600 mt-1 text-right">{formReflection.length}/500</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Bring the container to...</label>
                    <input type="text" value={formCity} onChange={e => setFormCity(e.target.value)} maxLength={100}
                      className="w-full bg-gray-950 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:border-red-600 focus:outline-none transition-colors"
                      placeholder="Your city (optional)" />
                  </div>
                  {formError && (
                    <div className="text-sm text-red-500 border border-red-900 bg-red-950/30 px-4 py-2">{formError}</div>
                  )}
                  {formSuccess && (
                    <div className="text-sm text-emerald-400 border border-emerald-900 bg-emerald-950/30 px-4 py-2">
                      Thank you. Your reflection will appear after review.
                    </div>
                  )}
                  <button type="submit" disabled={formSubmitting}
                    className="w-full px-6 py-3 bg-red-600 text-white font-bold uppercase tracking-widest text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {formSubmitting ? 'Submitting...' : 'Submit Reflection'}
                  </button>
                </form>
              </div>

              {/* Reflections Wall */}
              <div className="lg:col-span-3">
                {reflectionsLoading ? (
                  <div className="text-gray-500 animate-pulse py-8 text-center">Loading reflections...</div>
                ) : reflections.length === 0 ? (
                  <div className="text-center py-12 border border-gray-800">
                    <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No reflections yet. Be the first to share.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reflections.map((ref) => (
                      <div key={ref.id} className="border border-gray-800 p-4 md:p-5 hover:border-gray-700 transition-colors">
                        <p className="text-gray-300 leading-relaxed mb-3 text-sm md:text-base">&ldquo;{ref.reflection}&rdquo;</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-gray-400 truncate">{ref.name}</span>
                            {ref.location && (
                              <span className="flex items-center gap-1 shrink-0">
                                <MapPin className="w-3 h-3" /> {ref.location}
                              </span>
                            )}
                          </div>
                          <span className="shrink-0">{timeAgo(ref.created_at)}</span>
                        </div>
                      </div>
                    ))}
                    {reflectionsHasMore && (
                      <button onClick={loadMoreReflections}
                        className="w-full py-3 text-sm font-bold uppercase tracking-widest border border-gray-800 text-gray-500 hover:border-white hover:text-white transition-colors">
                        Load More
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            DATA EXPLORER — Interactive filterable table
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="fade-up" id="explorer">
          <DataExplorer />
        </ScrollChapter>

        {/* ═══════════════════════════════════════════════════════════════
            SHARE KIT
        ═══════════════════════════════════════════════════════════════ */}
        <ScrollChapter variant="stagger-children">
          <div className="container-justice px-5 md:px-8">
            <ScrollChild>
              <div className="mb-8 md:mb-12">
                <div className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-[#F5F0E8]/35 mb-3">
                  Share Kit
                </div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-[-0.02em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Download. Post. Don&apos;t look away.
                </h2>
              </div>
            </ScrollChild>

            <ScrollChild>
              <div className="border border-gray-800 p-4 md:p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
                  Copy-paste social posts
                </h3>
                <div className="space-y-3 md:space-y-4">
                  {[
                    "For every $23 spent locking kids up, $1 goes to community programs that work. We tracked $97.9 billion. justicehub.org.au/authority",
                    "Victoria spends $7,304 PER DAY to cage one child. Community supervision costs $351. 84% of detained kids reoffend. The numbers don't lie. #CONTAINED #YouthJustice",
                    "Just Reinvest NSW runs 9 evidence-rated programs with $0 government funding. 876 alternatives exist. 54.9% are evidence-backed. They work. They're just not funded.",
                    "Indigenous organisations receive 10.8% of justice funding. Indigenous youth are 23x overrepresented in detention. This is not a coincidence. It's a policy choice.",
                  ].map((post, i) => (
                    <div key={i} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-950 border border-gray-900">
                      <p className="text-xs md:text-sm text-gray-300 flex-1 leading-relaxed">{post}</p>
                      <CopyButton text={post} />
                    </div>
                  ))}
                </div>
              </div>
            </ScrollChild>
          </div>
        </ScrollChapter>

        {/* ── Final CTA ── */}
        <section className="py-12 md:py-16 bg-red-600">
          <div className="container-justice px-5 md:px-8 text-center">
            <h2
              className="text-2xl md:text-4xl font-bold tracking-[-0.02em] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              The data is clear. The system is not.
            </h2>
            <p className="text-[14px] md:text-[15px] text-red-100/80 max-w-2xl mx-auto mb-6 md:mb-8 leading-relaxed">
              Share the evidence. Nominate a leader. Demand the container comes to your city.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link href="/contained"
                className="px-6 md:px-8 py-3 md:py-4 bg-white text-red-600 font-black uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors">
                The CONTAINED Tour
              </Link>
              <Link href="/intelligence/dashboard"
                className="px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-red-600 transition-colors">
                Explore the Data
              </Link>
            </div>
          </div>
        </section>

        {/* ── Minimal footer for immersive page ── */}
        <footer className="py-8 border-t border-gray-800">
          <div className="container-justice px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#F5F0E8]/60 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                JUSTICEHUB
              </span>
              <span className="text-[10px] text-[#F5F0E8]/20 font-mono">Authority Brief</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#F5F0E8]/30">
              <Link href="/" className="hover:text-[#F5F0E8]/60 transition-colors">Home</Link>
              <Link href="/intelligence/dashboard" className="hover:text-[#F5F0E8]/60 transition-colors">Dashboard</Link>
              <Link href="/contained" className="hover:text-[#F5F0E8]/60 transition-colors">CONTAINED</Link>
              <Link href="/about" className="hover:text-[#F5F0E8]/60 transition-colors">About</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ── Indigenous Gap Bar (single animated bar) ──
function IndigenousGapBar({ targetWidth, color, delay = 0 }: { targetWidth: number; color: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const [forceVisible, setForceVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const visible = inView || forceVisible;

  return (
    <div
      ref={ref}
      className={`h-full ${color}`}
      style={{
        width: visible ? `${targetWidth}%` : '0%',
        transition: `width 1.2s cubic-bezier(0.22,1,0.36,1) ${0.2 + delay}s`,
      }}
    />
  );
}
