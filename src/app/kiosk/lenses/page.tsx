/**
 * /kiosk/lenses — the five-lens grid. The visitor arrives here after the
 * cold-start hook tap. Picks any of the five lenses to drill in.
 *
 * Each card surfaces a tiny "you'll find here" preview (live count when
 * possible) so the lens grid isn't just a menu — it's a teaser too.
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { LensBar } from '../components/LensBar';

export const revalidate = 600;

async function getLensCounts() {
  const supabase = createServiceClient() as any;
  const [orgs, claims, states, stories, alma] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('acco_certified', true).eq('is_active', true),
    supabase.from('v_claim_evidence_summary').select('claim_id', { count: 'exact', head: true }).eq('triangulation_tier', 'triangulated'),
    Promise.resolve({ count: 8 }),
    supabase.from('alma_stories').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('story_type', 'community_voice'),
    supabase.from('alma_interventions').select('id', { count: 'exact', head: true }).neq('verification_status', 'ai_generated'),
  ]);
  return {
    accos: orgs.count || 0,
    triangulated: claims.count || 0,
    states: 8,
    stories: stories.count || 0,
    programs: alma.count || 0,
  };
}

export default async function LensGridPage() {
  const c = await getLensCounts();
  const lenses = [
    {
      href: '/kiosk/lenses/orgs',
      title: 'Orgs',
      preview: `${c.accos.toLocaleString()} named ACCOs`,
      blurb: 'Who is doing this work. Named, registered, sourced.',
      accent: 'rose',
    },
    {
      href: '/kiosk/lenses/spending',
      title: 'Spending',
      preview: '$1,330,000 vs $36,869',
      blurb: 'What it costs to lock up vs to support. 32× cheaper.',
      accent: 'red',
    },
    {
      href: '/kiosk/lenses/places',
      title: 'Places',
      preview: `${c.states} states + named locales`,
      blurb: 'Where it happens. The cost. The orgs. The voices.',
      accent: 'amber',
    },
    {
      href: '/kiosk/lenses/stories',
      title: 'Stories',
      preview: `${c.stories} named voices`,
      blurb: 'Community voices. In their own words.',
      accent: 'purple',
    },
    {
      href: '/kiosk/lenses/what-works',
      title: 'What works',
      preview: `${c.programs} programs catalogued`,
      blurb: 'The alternatives, by category. With evidence.',
      accent: 'emerald',
    },
  ];

  const accentClasses: Record<string, string> = {
    rose: 'border-rose-300 hover:border-rose-700 bg-white',
    red: 'border-stone-300 hover:border-[#DC2626] bg-white',
    amber: 'border-amber-300 hover:border-amber-700 bg-white',
    purple: 'border-purple-300 hover:border-purple-700 bg-white',
    emerald: 'border-emerald-300 hover:border-emerald-700 bg-white',
  };

  return (
    <>
      <LensBar current="home" />
      <div className="flex-1 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 sm:py-16">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-2">
            Centre of Excellence · pick a lens
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3 leading-tight">
            What do you want to see?
          </h1>
          <p className="text-base sm:text-lg text-stone-700 max-w-2xl mb-10">
            Every fact in here is backed by multiple independent sources. Tap any source count to see who said what.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {lenses.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`block border-2 ${accentClasses[l.accent]} rounded-lg p-6 sm:p-7 min-h-[160px] transition-colors`}
                >
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-2">{l.preview}</p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{l.title}</h2>
                  <p className="text-sm sm:text-base text-stone-700">{l.blurb}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
