/**
 * /intelligence/civic/people — public index of the civic people registry.
 *
 * Groups by primary role. Distinct from /people which is the public_profiles
 * (Empathy Ledger storyteller) namespace.
 */

import Link from 'next/link';
import { Suspense } from 'react';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { KioskReturnBanner } from '@/components/kiosk/KioskReturnBanner';

export const revalidate = 600;

const ROLE_LABEL: Record<string, string> = {
  org_leader: 'Org leaders',
  board_member: 'Board members',
  minister: 'Ministers',
  mp_senator: 'MPs / Senators',
  commissioner: 'Commissioners',
  community_elder: 'Community elders',
  researcher: 'Researchers',
  storyteller: 'Storytellers',
};

const ROLE_DESCRIPTION: Record<string, string> = {
  org_leader: 'CEOs, founders, and directors of Tier 1 orgs',
  commissioner: "State and federal Children's Commissioners",
  minister: 'Government ministers with YJ portfolio',
  mp_senator: 'Parliamentarians who speak on YJ in Hansard',
  community_elder: 'Elders leading anchor-community work',
};

export const metadata = {
  title: 'Civic people registry — JusticeHub',
  description: 'Named individuals across YJ-relevant roles: leaders, ministers, commissioners, elders, researchers.',
};

export default async function CivicPeopleIndexPage() {
  const supabase = createServiceClient() as any;
  const { data: people } = await supabase
    .from('v_person_360')
    .select('*')
    .order('current_role_count', { ascending: false })
    .order('full_name');

  const byPrimaryRole = new Map<string, any[]>();
  for (const p of people || []) {
    const r = p.primary_role || 'other';
    if (!byPrimaryRole.has(r)) byPrimaryRole.set(r, []);
    byPrimaryRole.get(r)!.push(p);
  }
  const roleOrder = ['commissioner', 'minister', 'mp_senator', 'org_leader', 'community_elder', 'researcher', 'storyteller', 'board_member', 'other'];
  const ordered = roleOrder.filter((r) => byPrimaryRole.has(r));

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Suspense fallback={null}>
        <KioskReturnBanner />
      </Suspense>

      <header className="border-b-2 border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Link href="/intelligence/civic/centre-of-excellence" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
            ← Centre of Excellence
          </Link>
          <p className="mt-3 text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">Civic intelligence registry</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">People</h1>
          <p className="mt-3 max-w-2xl text-stone-700 leading-relaxed">
            The named individuals in the youth-justice civic-intelligence graph. Decisions happen at the level of people, not just organisations.
          </p>
          <p className="mt-3 text-xs font-mono uppercase tracking-widest text-stone-500">
            {(people || []).length.toLocaleString()} people · {(people || []).reduce((s: number, p: any) => s + (p.role_count || 0), 0)} role holdings
          </p>
        </div>
      </header>

      {ordered.map((role) => {
        const arr = byPrimaryRole.get(role)!;
        return (
          <section key={role} className="max-w-6xl mx-auto px-6 py-10 border-b border-stone-200">
            <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-2">{ROLE_LABEL[role] || role}</p>
            <h2 className="text-2xl font-bold mb-1">{arr.length} {ROLE_LABEL[role] || role}</h2>
            {ROLE_DESCRIPTION[role] && <p className="text-stone-600 text-sm mb-5">{ROLE_DESCRIPTION[role]}</p>}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {arr.slice(0, 30).map((p: any) => (
                <li key={p.person_id}>
                  <Link
                    href={`/intelligence/civic/people/${p.slug}`}
                    className="block border-2 border-stone-200 bg-white hover:border-stone-900 p-4 rounded transition-colors min-h-[90px]"
                  >
                    <p className="font-semibold text-stone-900 truncate">{p.honorific ? `${p.honorific} ` : ''}{p.full_name}</p>
                    <p className="text-xs text-stone-600 mt-1">
                      {p.state_focus || ''}
                      {p.region_focus ? ` · ${p.region_focus}` : ''}
                      {p.indigenous ? ' · Indigenous' : ''}
                    </p>
                    {p.current_role_count > 1 && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 mt-1">{p.current_role_count} current roles</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {arr.length > 30 && (
              <p className="mt-3 text-xs font-mono uppercase tracking-widest text-stone-500">
                + {arr.length - 30} more {ROLE_LABEL[role] || role}
              </p>
            )}
          </section>
        );
      })}
    </main>
  );
}
