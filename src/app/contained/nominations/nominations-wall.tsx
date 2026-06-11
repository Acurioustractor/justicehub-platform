'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { ArrowRight, Megaphone, ChevronUp, MessageSquare, X } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'politician', label: 'Politicians', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'justice_official', label: 'Justice Officials', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'media', label: 'Media', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'business', label: 'Business', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'community', label: 'Community', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

function getCategoryStyle(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.color || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getCategoryLabel(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.label || category;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface NomineeMessage {
  reason: string;
  nominator_name: string | null;
  created_at: string;
}

interface Nominee {
  nominee_key: string;
  nominee_name: string;
  nominee_title?: string;
  nominee_org?: string;
  category: string;
  nomination_count: number;
  upvotes: number;
  first_nominated_at: string;
  messages: NomineeMessage[];
}

const GOAL = 100;
const VOTED_KEY = 'contained-nomination-votes';

export function NominationsWall() {
  const [leaderboard, setLeaderboard] = useState<Nominee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [selected, setSelected] = useState<Nominee | null>(null);
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setVoted(JSON.parse(localStorage.getItem(VOTED_KEY) || '{}'));
    } catch {
      /* ignore */
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects/the-contained/nominations?mode=leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setTotal(data.total || 0);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  async function upvote(nominee: Nominee) {
    if (voted[nominee.nominee_key]) return;
    // optimistic
    setLeaderboard((prev) =>
      prev.map((n) => (n.nominee_key === nominee.nominee_key ? { ...n, upvotes: n.upvotes + 1 } : n))
    );
    const nextVoted = { ...voted, [nominee.nominee_key]: true };
    setVoted(nextVoted);
    try {
      localStorage.setItem(VOTED_KEY, JSON.stringify(nextVoted));
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch('/api/projects/the-contained/nominations/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nominee_name: nominee.nominee_name }),
      });
      const data = await res.json();
      if (res.ok && typeof data.upvotes === 'number') {
        setLeaderboard((prev) =>
          prev.map((n) => (n.nominee_key === nominee.nominee_key ? { ...n, upvotes: data.upvotes } : n))
        );
      }
    } catch {
      /* keep optimistic value */
    }
  }

  const filtered = activeCategory
    ? leaderboard.filter((n) => n.category === activeCategory)
    : leaderboard;

  const progress = Math.min((total / GOAL) * 100, 100);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />

      <main className="pt-40">
        {/* Hero */}
        <section className="py-16 bg-black text-white">
          <div className="container-justice">
            <div className="max-w-3xl">
              <Link
                href="/contained"
                className="text-sm font-bold uppercase tracking-widest text-red-400 hover:text-red-300 mb-4 inline-block"
              >
                ← Back to CONTAINED
              </Link>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                Who needs to walk through?
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Australians are nominating the decision-makers who need thirty minutes inside.
                Vote the names up. The most-needed people rise to the top, and every name carries
                the messages of the people who put them there.
              </p>

              {/* Progress */}
              <div className="max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-black text-3xl">{total.toLocaleString()}</span>
                  <span className="text-gray-400 self-end">of {GOAL.toLocaleString()} nominations for Adelaide week</span>
                </div>
                <div className="h-3 bg-gray-800 w-full">
                  <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-b-2 border-black bg-gray-50">
          <div className="container-justice">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-widest border-2 transition-colors ${
                    activeCategory === cat.value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:border-black'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="py-12">
          <div className="container-justice">
            {loading ? (
              <div className="text-center py-16">
                <div className="text-lg font-bold text-gray-400 animate-pulse">Loading the board...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-bold text-gray-500 mb-4">
                  No nominations yet{activeCategory ? ' in this category' : ''}.
                </p>
                <Link
                  href="/contained#nominate"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                >
                  <Megaphone className="w-4 h-4" /> Be the first
                </Link>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-3">
                {filtered.map((nom, i) => (
                  <div
                    key={nom.nominee_key}
                    className="flex items-stretch border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    {/* Upvote */}
                    <button
                      onClick={() => upvote(nom)}
                      disabled={!!voted[nom.nominee_key]}
                      aria-label={`Vote for ${nom.nominee_name} to walk through`}
                      className={`flex w-20 shrink-0 flex-col items-center justify-center border-r-2 border-black px-2 py-4 transition-colors ${
                        voted[nom.nominee_key]
                          ? 'bg-red-600 text-white cursor-default'
                          : 'bg-white text-black hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      <ChevronUp className="w-6 h-6" />
                      <span className="font-black text-xl leading-none">{nom.upvotes}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
                        {voted[nom.nominee_key] ? 'Voted' : 'Vote'}
                      </span>
                    </button>

                    {/* Body */}
                    <button
                      onClick={() => setSelected(nom)}
                      className="flex-1 p-4 text-left hover:bg-gray-50 transition-colors"
                      aria-label={`Read why people nominated ${nom.nominee_name}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-lg leading-tight">
                            <span className="text-gray-400 mr-2">#{i + 1}</span>
                            {nom.nominee_name}
                          </h3>
                          {(nom.nominee_title || nom.nominee_org) && (
                            <p className="text-sm text-gray-600">
                              {[nom.nominee_title, nom.nominee_org].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 border whitespace-nowrap ${getCategoryStyle(nom.category)}`}>
                          {getCategoryLabel(nom.category)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700 line-clamp-2">“{nom.messages[nom.messages.length - 1]?.reason}”</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {nom.nomination_count} {nom.nomination_count === 1 ? 'voice' : 'voices'} · read why
                      </p>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-red-600 text-white">
          <div className="container-justice text-center">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Add Your Nomination</h2>
            <p className="text-lg text-red-100 mb-6 max-w-xl mx-auto">
              Who needs to experience what youth detention is really like? Add their name, or add
              your voice to a name already on the board.
            </p>
            <Link
              href="/contained#nominate"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-600 font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              Nominate a Leader <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Messages sidebar */}
      {selected && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Why ${selected.nominee_name} needs to walk through`}>
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelected(null)}
            aria-label="Close"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white border-l-4 border-black shadow-2xl">
            <div className="sticky top-0 bg-black text-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-xl leading-tight">{selected.nominee_name}</h3>
                  {(selected.nominee_title || selected.nominee_org) && (
                    <p className="text-sm text-gray-300">
                      {[selected.nominee_title, selected.nominee_org].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-red-400">
                    {selected.upvotes} votes · {selected.nomination_count}{' '}
                    {selected.nomination_count === 1 ? 'voice' : 'voices'}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} aria-label="Close" className="p-1 hover:text-red-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Why people want them inside
              </p>
              {selected.messages
                .slice()
                .reverse()
                .map((m, i) => (
                  <blockquote key={i} className="border-l-4 border-red-600 bg-gray-50 p-4">
                    <p className="text-sm leading-relaxed text-gray-800">“{m.reason}”</p>
                    <footer className="mt-2 text-xs text-gray-500">
                      {m.nominator_name || 'Anonymous'} · {timeAgo(m.created_at)}
                    </footer>
                  </blockquote>
                ))}
              <Link
                href="/contained#nominate"
                className="block w-full bg-red-600 px-4 py-3 text-center font-bold uppercase tracking-widest text-white hover:bg-red-700 transition-colors"
              >
                Add your voice
              </Link>
            </div>
          </aside>
        </div>
      )}

      <Footer />
    </div>
  );
}
