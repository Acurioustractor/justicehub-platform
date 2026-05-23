/**
 * /kiosk/lenses/what-works — WHAT WORKS lens.
 *
 * Category grid grouped by alma_interventions.type. Each card lists 3 named
 * orgs delivering that category + the evidence-level breakdown. Tap to drill
 * into the per-category browser.
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { LensBar } from '../../components/LensBar';

export const revalidate = 600;

interface CategoryGroup {
  type: string;
  total: number;
  namedOrgs: string[];
  evidenceStrong: number;
  costMedian: number | null;
}

async function getCategoryGroups(): Promise<CategoryGroup[]> {
  const supabase = createServiceClient() as any;
  const { data } = await supabase
    .from('alma_interventions')
    .select('id, name, type, operating_organization, evidence_level, cost_per_young_person')
    .eq('serves_youth_justice', true)
    .neq('verification_status', 'ai_generated')
    .not('type', 'is', null)
    .limit(3000);

  if (!data) return [];

  const byType = new Map<string, any[]>();
  for (const row of data) {
    const t = row.type;
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(row);
  }

  const out: CategoryGroup[] = [];
  for (const [type, rows] of byType.entries()) {
    const namedOrgs: string[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const org = r.operating_organization;
      if (org && !seen.has(org.toLowerCase())) {
        namedOrgs.push(org);
        seen.add(org.toLowerCase());
        if (namedOrgs.length >= 3) break;
      }
    }
    const evidenceStrong = rows.filter(
      (r) => r.evidence_level && !String(r.evidence_level).toLowerCase().startsWith('untested')
    ).length;
    const costs = rows
      .map((r) => Number(r.cost_per_young_person))
      .filter((n) => n > 0 && n < 500_000)
      .sort((a, b) => a - b);
    const costMedian = costs.length > 0 ? costs[Math.floor(costs.length / 2)] : null;
    out.push({ type, total: rows.length, namedOrgs, evidenceStrong, costMedian });
  }

  return out.sort((a, b) => b.total - a.total).slice(0, 10);
}

export default async function WhatWorksLensPage() {
  const groups = await getCategoryGroups();

  return (
    <>
      <LensBar current="what-works" />
      <div className="flex-1 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-2">
            The alternatives, named
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">What works.</h1>
          <p className="text-base sm:text-lg text-stone-700 max-w-2xl mb-8">
            Community-led programs sorted by approach. Each category names the orgs delivering it and shows the evidence behind them.
          </p>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g) => (
              <li key={g.type}>
                <Link
                  href={`/kiosk/lenses/what-works/${encodeURIComponent(g.type)}`}
                  className="block border-2 border-stone-300 bg-white hover:border-stone-900 p-6 rounded transition-colors min-h-[200px]"
                >
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-2">
                    {g.total} programs · {g.evidenceStrong} evidence-backed
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{g.type}</h2>
                  {g.namedOrgs.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {g.namedOrgs.map((o) => (
                        <li key={o} className="text-sm text-stone-700 truncate">→ {o}</li>
                      ))}
                      {g.total > g.namedOrgs.length && (
                        <li className="text-xs font-mono text-stone-500">+ {g.total - g.namedOrgs.length} more</li>
                      )}
                    </ul>
                  )}
                  {g.costMedian != null && (
                    <p className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-700">
                      ~${g.costMedian.toLocaleString()} per young person · median
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
