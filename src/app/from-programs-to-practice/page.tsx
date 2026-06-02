/**
 * From Programs to Practice — launch companion artefact
 *
 * The executive briefing Ben + co-author are writing for the Reintegration
 * launch (22 June 2026). This page is a Server Component that pulls live
 * Australian Living Map of Alternatives (ALMA) data so the table is always
 * current, and reserves space for the edited prose at top + call-to-action
 * at bottom.
 *
 * TODO(prose): The argument prose lives in `compendium/articles/...` for now
 * and Ben + co-author will paste in the final draft before launch. The
 * placeholder section pulls a short framing from the DB so the page is never
 * empty.
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'From Programs to Practice — JusticeHub',
  description:
    'A field briefing on what works in community-led youth justice. The evidence is the Australian Living Map of Alternatives. The argument is that programs do not save kids; practice does.',
  openGraph: {
    title: 'From Programs to Practice',
    description:
      'Programs do not save kids. Practice does. Read the field briefing and meet the practitioners holding the line.',
    type: 'article',
    images: [
      {
        url: '/api/from-programs-to-practice/og',
        width: 1200,
        height: 630,
        alt: 'From Programs to Practice — JusticeHub field briefing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'From Programs to Practice',
    description: 'The field briefing. What community-led practice looks like.',
  },
};

const FOCUS_TOPICS = ['youth-justice', 'child-protection', 'indigenous', 'diversion'] as const;

interface AlmaRow {
  id: string;
  name: string | null;
  type: string | null;
  description: string | null;
  evidence_level: string | null;
  cultural_authority: string | null;
  target_cohort: string | null;
  geography: string | null;
  portfolio_score: number | null;
  topics?: string[] | null;
  verification_status?: string | null;
}

async function loadInterventions(): Promise<AlmaRow[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('alma_interventions')
    .select(
      'id, name, type, description, evidence_level, cultural_authority, target_cohort, geography, portfolio_score, topics, verification_status'
    )
    .neq('verification_status', 'ai_generated')
    .overlaps('topics', FOCUS_TOPICS as unknown as string[])
    .order('portfolio_score', { ascending: false, nullsFirst: false })
    .limit(120);

  if (error) {
    console.error('[from-programs-to-practice] alma_interventions query failed:', error.message);
    return [];
  }
  return (data as AlmaRow[]) ?? [];
}

function topicBadge(topic: string) {
  const label = topic.replace(/-/g, ' ');
  return (
    <span
      key={topic}
      className="inline-block px-2 py-1 mr-1 mb-1 text-[10px] uppercase font-black tracking-widest border-2 border-black bg-[#f0c020] text-black"
    >
      {label}
    </span>
  );
}

export default async function FromProgramsToPracticePage() {
  const interventions = await loadInterventions();

  // Aggregate for the framing strip.
  const total = interventions.length;
  const culturallyAnchored = interventions.filter(
    (i) => i.cultural_authority && i.cultural_authority.trim().length > 0
  ).length;
  const withStrongEvidence = interventions.filter((i) =>
    (i.evidence_level ?? '').toLowerCase().match(/strong|emerging|promising/)
  ).length;

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-[#121212]">
      <Navigation />

      <main className="pt-10 pb-24">
        <div className="container-justice max-w-5xl mx-auto px-6">
          <header className="border-4 border-black bg-white p-8 mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase tracking-widest text-[#d02020] mb-3">
              JusticeHub Field Briefing · Reintegration 2026
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.95]">
              From Programs to Practice
            </h1>
            <p className="mt-5 text-lg leading-relaxed max-w-3xl">
              Programs do not save kids. Practice does. This briefing pulls together what the
              Australian Living Map of Alternatives (ALMA) tells us about the community-led work
              actually shifting outcomes for young people across so-called Australia, alongside the
              tools JusticeHub is releasing so practitioners can do that work without grinding
              themselves down.
            </p>
            <div className="mt-6 text-xs font-mono uppercase text-[#444]">
              {total} interventions tagged across youth justice, child protection, Indigenous
              authority and diversion · {culturallyAnchored} carry named cultural authority ·{' '}
              {withStrongEvidence} have promising-or-stronger evidence
            </div>
          </header>

          {/* TOP: the argument (placeholder until Ben + co-author finalise prose) */}
          <section className="border-4 border-black bg-white p-8 mb-10">
            <div className="text-xs font-black uppercase tracking-widest text-[#1040c0] mb-3">
              The argument
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
              The thing we keep funding is not the thing that works.
            </h2>
            <div className="space-y-4 text-base leading-relaxed max-w-3xl">
              <p>
                Every state in the country has a program register. Every funder has a portfolio of
                pilots. The young people whose lives are at stake have, across two decades, watched
                programs land, dissolve, rebrand and land again, with each round leaving the room
                with a slightly different name and the same conclusion: it depended on the people.
              </p>
              <p>
                That conclusion is not a failure of programs. It is a feature of practice. The
                practitioners holding the line in Mparntwe (Alice Springs), Boorloo (Perth) and the
                outer suburbs of Naarm (Melbourne) are not delivering interventions. They are
                holding relationships across years, against systems that punish continuity. The job
                of a national platform is to make that work legible, fundable, and defensible
                without flattening it.
              </p>
              <p>
                This briefing is the argument. The table below is the evidence. The call to action
                at the end is what JusticeHub is launching to back the people doing the work.
              </p>
              <p className="text-xs font-mono uppercase text-[#888] mt-6">
                Final prose draft pending — Ben + co-author edit lands ahead of Reintegration week.
              </p>
            </div>
          </section>

          {/* MIDDLE: the evidence table */}
          <section className="mb-10">
            <div className="text-xs font-black uppercase tracking-widest text-[#1040c0] mb-3">
              The evidence
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
              {total} interventions, filtered for community-led practice.
            </h2>
            <p className="text-sm text-[#444] mb-6 max-w-3xl">
              Sourced from the Australian Living Map of Alternatives (ALMA), filtered to the four
              practice topics most relevant to the Reintegration audience. Ranked by portfolio
              score (cultural authority, evidence quality, geographic reach). Place names use the
              language of the people who hold authority for that country.
            </p>

            <div className="border-4 border-black bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left p-3 font-black uppercase text-[11px] tracking-widest">
                      Intervention
                    </th>
                    <th className="text-left p-3 font-black uppercase text-[11px] tracking-widest">
                      Evidence
                    </th>
                    <th className="text-left p-3 font-black uppercase text-[11px] tracking-widest">
                      Cultural authority
                    </th>
                    <th className="text-left p-3 font-black uppercase text-[11px] tracking-widest">
                      Cohort
                    </th>
                    <th className="text-left p-3 font-black uppercase text-[11px] tracking-widest">
                      Topics
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {interventions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#888] font-mono">
                        No interventions returned. Check the ALMA topic-tag backfill.
                      </td>
                    </tr>
                  )}
                  {interventions.map((row) => (
                    <tr key={row.id} className="border-t-2 border-black align-top">
                      <td className="p-3">
                        <div className="font-black">{row.name ?? 'Untitled'}</div>
                        {row.geography && (
                          <div className="text-xs text-[#666] mt-1">{row.geography}</div>
                        )}
                        {row.description && (
                          <div className="text-xs text-[#444] mt-2 max-w-md">
                            {row.description.slice(0, 200)}
                            {row.description.length > 200 ? '…' : ''}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-xs">{row.evidence_level ?? '—'}</td>
                      <td className="p-3 text-xs">{row.cultural_authority ?? '—'}</td>
                      <td className="p-3 text-xs">{row.target_cohort ?? '—'}</td>
                      <td className="p-3">
                        {(row.topics ?? []).filter((t) => FOCUS_TOPICS.includes(t as any)).map(topicBadge)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* BOTTOM: the call to action */}
          <section className="border-4 border-black bg-[#121212] text-white p-8">
            <div className="text-xs font-black uppercase tracking-widest text-[#f0c020] mb-3">
              What we are launching
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
              JusticeHub Practice — beta open at Reintegration 2026.
            </h2>
            <p className="text-base leading-relaxed max-w-3xl mb-6">
              The Atlas tells you what works. Practice helps you do it. The new layer is a
              reflex-loop tool for community-led organisations: hold cases without losing them,
              record outcomes without writing twice, and brief funders without rewriting your week
              into a grant report.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/network/alma/gathering"
                className="inline-block px-6 py-4 bg-[#d02020] text-white font-black uppercase tracking-widest border-2 border-white hover:bg-[#a01010] transition-colors"
              >
                Sign up for the beta
              </Link>
              <a
                href="/api/from-programs-to-practice/pdf"
                className="inline-block px-6 py-4 bg-white text-black font-black uppercase tracking-widest border-2 border-white hover:bg-[#f0c020] transition-colors"
              >
                Download the printable brief
              </a>
            </div>
            <p className="text-xs font-mono uppercase text-[#888] mt-6">
              Reintegration Conference · week of 22 June 2026
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
