/**
 * /kiosk/lenses/what-works/[type] — per-category program browser.
 *
 * Drilled from /kiosk/lenses/what-works. Shows every alma_intervention in
 * this category with its named operating org, evidence level, cost per
 * young person, and state. Each row is a tap target → drill into /sites/[slug]
 * if the org is registered, otherwise the intervention detail.
 *
 * Type comes URL-encoded; we URL-decode and case-match against
 * alma_interventions.type.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { LensBar } from '../../../components/LensBar';
import { withKioskRef } from '../../../lib/kiosk-ref';

export const revalidate = 600;

const VALID_TYPES = [
  'Community-Led',
  'Cultural Connection',
  'Diversion',
  'Early Intervention',
  'Education/Employment',
  'Family Strengthening',
  'Justice Reinvestment',
  'Prevention',
  'Therapeutic',
  'Wraparound Support',
];

interface Intervention {
  id: string;
  name: string;
  type: string;
  description: string | null;
  operating_organization: string | null;
  operating_organization_id: string | null;
  evidence_level: string | null;
  cost_per_young_person: number | null;
  geography: string | null;
}

async function getCategoryRows(type: string): Promise<{
  rows: Intervention[];
  orgSlugs: Map<string, string>;
  orgStates: Map<string, string>;
}> {
  const supabase = createServiceClient() as any;
  const { data } = await supabase
    .from('alma_interventions')
    .select('id, name, type, description, operating_organization, operating_organization_id, evidence_level, cost_per_young_person, geography')
    .eq('type', type)
    .eq('serves_youth_justice', true)
    .neq('verification_status', 'ai_generated')
    .order('evidence_level', { ascending: false, nullsFirst: false })
    .limit(200);
  const rows = (data || []) as Intervention[];

  // Fetch slugs + states for orgs that exist in the JH register
  const orgIds = Array.from(new Set(rows.map((r) => r.operating_organization_id).filter(Boolean))) as string[];
  const slugMap = new Map<string, string>();
  const stateMap = new Map<string, string>();
  if (orgIds.length > 0) {
    for (let i = 0; i < orgIds.length; i += 100) {
      const chunk = orgIds.slice(i, i + 100);
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, slug, state')
        .in('id', chunk);
      for (const o of orgs || []) {
        if (o.slug) slugMap.set(o.id, o.slug);
        if (o.state) stateMap.set(o.id, o.state);
      }
    }
  }
  return { rows, orgSlugs: slugMap, orgStates: stateMap };
}

export async function generateStaticParams() {
  return VALID_TYPES.map((t) => ({ type: encodeURIComponent(t) }));
}

export default async function CategoryPage({ params }: { params: { type: string } }) {
  const decoded = decodeURIComponent(params.type);
  if (!VALID_TYPES.includes(decoded)) notFound();

  const { rows, orgSlugs, orgStates } = await getCategoryRows(decoded);
  const evidenceBacked = rows.filter(
    (r) => r.evidence_level && !String(r.evidence_level).toLowerCase().startsWith('untested')
  ).length;
  const costs = rows
    .map((r) => Number(r.cost_per_young_person))
    .filter((n) => n > 0 && n < 500_000)
    .sort((a, b) => a - b);
  const costMedian = costs.length > 0 ? costs[Math.floor(costs.length / 2)] : null;

  // Soft Adelaide highlight: SA orgs first
  rows.sort((a, b) => {
    const aSA = a.operating_organization_id && orgStates.get(a.operating_organization_id) === 'SA' ? 0 : 1;
    const bSA = b.operating_organization_id && orgStates.get(b.operating_organization_id) === 'SA' ? 0 : 1;
    if (aSA !== bSA) return aSA - bSA;
    // Then evidence-backed first
    const aE = a.evidence_level && !String(a.evidence_level).toLowerCase().startsWith('untested') ? 0 : 1;
    const bE = b.evidence_level && !String(b.evidence_level).toLowerCase().startsWith('untested') ? 0 : 1;
    return aE - bE;
  });

  return (
    <>
      <LensBar current="what-works" />
      <div className="flex-1 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <Link
            href="/kiosk/lenses/what-works"
            className="inline-block text-xs font-mono uppercase tracking-[0.3em] text-stone-500 hover:text-stone-900 mb-6"
          >
            ← All categories
          </Link>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-2">
            {rows.length} programs · {evidenceBacked} evidence-backed
            {costMedian != null && ` · ~$${costMedian.toLocaleString()} median per young person`}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">{decoded}</h1>
          <p className="text-base sm:text-lg text-stone-700 max-w-2xl mb-10">
            Community-led programs in this category. Tap a named org to see their full registry — ACCO status, ABN, funding history.
          </p>

          {rows.length === 0 ? (
            <p className="text-stone-600 italic">No programs catalogued in this category yet.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rows.map((r) => {
                const orgSlug = r.operating_organization_id ? orgSlugs.get(r.operating_organization_id) : null;
                const orgState = r.operating_organization_id ? orgStates.get(r.operating_organization_id) : null;
                const evidenceBadge = r.evidence_level && !String(r.evidence_level).toLowerCase().startsWith('untested');
                const card = (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight flex-1">{r.name}</h2>
                      {orgState === 'SA' && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded shrink-0">
                          SA
                        </span>
                      )}
                    </div>
                    {r.operating_organization && (
                      <p className="text-sm text-stone-700 mb-2">→ {r.operating_organization}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {evidenceBadge && r.evidence_level && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                          {r.evidence_level}
                        </span>
                      )}
                      {r.cost_per_young_person && Number(r.cost_per_young_person) > 0 && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-700 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded">
                          ${Number(r.cost_per_young_person).toLocaleString()}/yr
                        </span>
                      )}
                      {r.geography && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 bg-white border border-stone-300 px-2 py-0.5 rounded truncate max-w-[200px]">
                          {r.geography}
                        </span>
                      )}
                    </div>
                  </>
                );
                return (
                  <li key={r.id}>
                    {orgSlug ? (
                      <Link
                        href={withKioskRef(`/sites/${orgSlug}`)}
                        className="block border-2 border-stone-300 bg-white hover:border-stone-900 p-5 rounded transition-colors min-h-[140px]"
                      >
                        {card}
                      </Link>
                    ) : (
                      <div className="border-2 border-stone-300 bg-white p-5 rounded min-h-[140px]">{card}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
