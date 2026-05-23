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
import { TrustDrillButton } from '../components/TrustDrillButton';

export const revalidate = 600;

async function getLensCounts() {
  const supabase = createServiceClient() as any;
  const [
    accosRes, triRes, totalClaimsRes, storiesRes, programsRes,
    tier1Res, ratioEvidenceRes, tier1EvidenceRes,
  ] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('acco_certified', true).eq('is_active', true),
    supabase.from('v_claim_evidence_summary').select('claim_id', { count: 'exact', head: true }).eq('triangulation_tier', 'triangulated'),
    supabase.from('v_claim_evidence_summary').select('claim_id', { count: 'exact', head: true }),
    supabase.from('alma_stories').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('story_type', 'community_voice'),
    supabase.from('alma_interventions').select('id', { count: 'exact', head: true }).neq('verification_status', 'ai_generated').eq('serves_youth_justice', true),
    supabase.from('civic_org_classifications').select('id', { count: 'exact', head: true }).eq('tier', 1).not('confirmed_at', 'is', null),
    supabase
      .from('v_claim_evidence_summary')
      .select('supporting_sources')
      .eq('claim_id', 'access.ratio.detention_vs_community_cost.national')
      .maybeSingle(),
    supabase
      .from('v_claim_evidence_summary')
      .select('supporting_sources')
      .eq('claim_id', 'access.count.tier_1_orgs.national')
      .maybeSingle(),
  ]);
  return {
    accos: accosRes.count || 0,
    triangulated: triRes.count || 0,
    totalClaims: totalClaimsRes.count || 0,
    states: 8,
    stories: storiesRes.count || 0,
    programs: programsRes.count || 0,
    tier1: tier1Res.count || 0,
    ratioSources: Number(ratioEvidenceRes.data?.supporting_sources) || 0,
    tier1Sources: Number(tier1EvidenceRes.data?.supporting_sources) || 0,
  };
}

interface Lens {
  href: string;
  title: string;
  preview: string;
  source: string;
  blurb: string;
  accent: 'rose' | 'red' | 'amber' | 'purple' | 'emerald';
  trustClaim?: { id: string; sources: number };
}

export default async function LensGridPage() {
  const c = await getLensCounts();
  const lenses: Lens[] = [
    {
      href: '/kiosk/lenses/orgs',
      title: 'Orgs',
      preview: `${c.tier1} confirmed Tier 1 · ${c.accos.toLocaleString()} ACCOs`,
      source: 'Live registry · ORIC + ACNC + ABN match',
      blurb: 'Who is doing this work. Named, registered, sourced.',
      accent: 'rose',
      trustClaim: c.tier1Sources > 0 ? { id: 'access.count.tier_1_orgs.national', sources: c.tier1Sources } : undefined,
    },
    {
      href: '/kiosk/lenses/spending',
      title: 'Spending',
      preview: '$1,330,000 vs $36,869 = 32×',
      source: 'AIHW + Productivity Commission RoGS · 2024-25',
      blurb: 'What it costs to lock up vs to support.',
      accent: 'red',
      trustClaim: c.ratioSources > 0 ? { id: 'access.ratio.detention_vs_community_cost.national', sources: c.ratioSources } : undefined,
    },
    {
      href: '/kiosk/lenses/places',
      title: 'Places',
      preview: `${c.states} states + named locales`,
      source: 'Per-state claims · Adelaide is the kiosk venue',
      blurb: 'Where it happens. The cost. The orgs. The voices.',
      accent: 'amber',
    },
    {
      href: '/kiosk/lenses/stories',
      title: 'Stories',
      preview: `${c.stories} community voices`,
      source: 'Empathy Ledger · linked to anchor communities',
      blurb: 'Community voices. In their own words.',
      accent: 'purple',
    },
    {
      href: '/kiosk/lenses/what-works',
      title: 'What works',
      preview: `${c.programs.toLocaleString()} YJ programs across 10 categories`,
      source: 'ALMA dataset · evidence levels recorded',
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
          <p className="text-base sm:text-lg text-stone-700 max-w-2xl mb-3">
            Every fact in here is backed by multiple independent sources. Tap any source count to see who said what.
          </p>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-10">
            {c.triangulated} triangulated · {c.totalClaims} sourced facts on record
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {lenses.map((l) => (
              <li key={l.href}>
                <div className={`border-2 ${accentClasses[l.accent]} rounded-lg p-6 sm:p-7 min-h-[200px] transition-colors flex flex-col`}>
                  <Link href={l.href} className="block flex-1 hover:opacity-80 transition-opacity">
                    <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-700 mb-2">{l.preview}</p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{l.title}</h2>
                    <p className="text-sm sm:text-base text-stone-700 mb-3">{l.blurb}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500 leading-relaxed">
                      → {l.source}
                    </p>
                  </Link>
                  {l.trustClaim && (
                    <div className="mt-4 pt-3 border-t border-stone-200">
                      <TrustDrillButton
                        claimId={l.trustClaim.id}
                        initialSources={l.trustClaim.sources}
                        variant="light"
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
