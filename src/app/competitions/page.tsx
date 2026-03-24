import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import {
  Palette,
  Calendar,
  Users,
  ArrowRight,
  Star,
  Trophy,
  Heart,
  Camera,
  Music,
  Pen,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Art Competitions | ALMA Network | JusticeHub',
  description:
    'Monthly art competitions for young people across the ALMA Network. Express what justice means to you — through art, music, poetry, photography, and film.',
};

const CURRENT_THEME = {
  month: 'April 2026',
  title: 'What Home Means',
  description:
    'Home isn\'t always four walls. It\'s Country, community, the people who hold you up. Show us what home means to you — through any medium.',
  deadline: '30 April 2026',
  status: 'open' as const,
};

const CATEGORIES = [
  {
    icon: Palette,
    name: 'Visual Art',
    desc: 'Painting, drawing, digital art, sculpture, mixed media',
  },
  {
    icon: Camera,
    name: 'Photography & Film',
    desc: 'Photos, short films, animations, documentaries',
  },
  {
    icon: Music,
    name: 'Music & Sound',
    desc: 'Songs, beats, spoken word with music, soundscapes',
  },
  {
    icon: Pen,
    name: 'Writing & Poetry',
    desc: 'Poems, short stories, spoken word, letters, essays',
  },
];

const PAST_THEMES = [
  { month: 'March 2026', title: 'The System I See', entries: 0 },
  { month: 'February 2026', title: 'Who I Am Becoming', entries: 0 },
];

export default function CompetitionsPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-sm uppercase tracking-[0.3em] text-[#059669] mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ALMA Network
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Art Competitions
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-8">
              Every month, a new theme. Young people across the ALMA Network express what
              justice, community, and change mean to them. The community votes. The best
              work gets featured.
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-xs text-[#059669] font-medium px-3 py-1.5 rounded-full bg-[#059669]/10">
                <Star className="w-3 h-3" /> Open for submissions
              </span>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* Current Theme */}
          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
            <div className="bg-[#0A0A0A] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <p
                  className="text-xs uppercase tracking-wider text-white/40"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {CURRENT_THEME.month} Theme
                </p>
                <h2
                  className="text-2xl font-bold text-white mt-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  &ldquo;{CURRENT_THEME.title}&rdquo;
                </h2>
              </div>
              <span className="text-xs text-[#059669] font-medium px-3 py-1.5 rounded-full bg-[#059669]/10">
                Open
              </span>
            </div>
            <div className="p-6 md:p-8">
              <p className="text-[#0A0A0A]/70 mb-6 max-w-2xl">
                {CURRENT_THEME.description}
              </p>

              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2 text-sm text-[#0A0A0A]/50">
                  <Calendar className="w-4 h-4" />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    Deadline: {CURRENT_THEME.deadline}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#0A0A0A]/50">
                  <Users className="w-4 h-4" />
                  <span>Open to all young people in the ALMA Network</span>
                </div>
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.name}
                      className="bg-[#F5F0E8] rounded-xl p-4 text-center"
                    >
                      <Icon className="w-6 h-6 text-[#059669] mx-auto mb-2" />
                      <p className="font-bold text-sm">{cat.name}</p>
                      <p className="text-xs text-[#0A0A0A]/50 mt-1">{cat.desc}</p>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/join"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] text-white font-semibold rounded-lg hover:bg-[#0A0A0A]/90 transition-colors text-sm"
              >
                Submit Your Work <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* How it works */}
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Theme Announced',
                  desc: 'First of every month, a new theme drops. Chosen by young people in the network.',
                },
                {
                  step: '02',
                  title: 'Create & Submit',
                  desc: 'Make something — any medium, any skill level. Upload by the end of the month.',
                },
                {
                  step: '03',
                  title: 'Community Votes',
                  desc: 'The network sees all submissions and votes for their favourites. Real people, real votes.',
                },
                {
                  step: '04',
                  title: 'Featured & Shared',
                  desc: 'Winners are featured on JusticeHub, in the newsletter, and on CONTAINED tour stops.',
                },
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                  <p
                    className="text-3xl font-bold text-[#0A0A0A]/10 mb-2"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {item.step}
                  </p>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-[#0A0A0A]/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Past themes */}
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Past Themes
            </h2>
            <div className="space-y-3">
              {PAST_THEMES.map((theme) => (
                <div
                  key={theme.month}
                  className="bg-white rounded-xl border border-[#0A0A0A]/10 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="text-xs text-[#0A0A0A]/40 w-24"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {theme.month}
                    </span>
                    <span className="font-semibold text-sm">
                      &ldquo;{theme.title}&rdquo;
                    </span>
                  </div>
                  <span className="text-xs text-[#0A0A0A]/30">
                    {theme.entries > 0 ? `${theme.entries} entries` : 'Coming soon'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Why */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="max-w-2xl">
              <Trophy className="w-8 h-8 text-[#059669] mb-4" />
              <h2
                className="text-2xl font-bold text-white mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Why Art Competitions?
              </h2>
              <p className="text-white/70 mb-4">
                Young people in the justice system are constantly defined by their worst
                moments. Art competitions flip that — they&apos;re defined by their
                creativity, their vision, their voice.
              </p>
              <p className="text-white/70">
                Every submission becomes evidence that alternatives work. Every vote is an
                act of community. Every featured piece travels with the CONTAINED tour —
                reaching thousands of people who need to see that the young people caught
                up in this system are more than a statistic.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
