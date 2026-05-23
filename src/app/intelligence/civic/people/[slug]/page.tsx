/**
 * /intelligence/civic/people/[slug] — public civic person page.
 *
 * Distinct from /people/[slug] (Empathy Ledger profile). This is the
 * civic-intelligence person: roles, linked orgs, Hansard mentions.
 */

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { KioskReturnBanner } from '@/components/kiosk/KioskReturnBanner';

export const revalidate = 600;

const ROLE_LABEL: Record<string, string> = {
  org_leader: 'Organisation leader',
  board_member: 'Board member',
  minister: 'Minister',
  shadow_minister: 'Shadow minister',
  mp_senator: 'MP / Senator',
  commissioner: 'Commissioner',
  auditor_general: 'Auditor-General',
  judge: 'Judge',
  community_elder: 'Community elder',
  researcher: 'Researcher',
  storyteller: 'Storyteller',
  staff: 'Staff',
  other: 'Other',
};

async function getPersonData(slug: string) {
  const supabase = createServiceClient() as any;
  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!person) return null;

  const { data: roles } = await supabase
    .from('person_role_holdings')
    .select('*, org:organizations(id, name, slug, state, acco_certified)')
    .eq('person_id', person.id)
    .order('is_current', { ascending: false })
    .order('start_year', { ascending: false, nullsFirst: false });

  const { data: hansard } = await supabase
    .from('civic_hansard')
    .select('id, subject, sitting_date, jurisdiction, source_url')
    .eq('speaker_name', person.full_name)
    .order('sitting_date', { ascending: false, nullsFirst: false })
    .limit(10);

  return { person, roles: roles || [], hansard: hansard || [] };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = await getPersonData(params.slug);
  if (!data) return { title: 'Person not found' };
  return {
    title: `${data.person.honorific ? data.person.honorific + ' ' : ''}${data.person.full_name} — JusticeHub`,
    description: data.person.bio_text || `${data.person.primary_role || 'Person'} on JusticeHub`,
  };
}

export default async function CivicPersonPage({ params }: { params: { slug: string } }) {
  const data = await getPersonData(params.slug);
  if (!data) notFound();
  const { person, roles, hansard } = data;
  const currentRoles = roles.filter((r: any) => r.is_current);
  const pastRoles = roles.filter((r: any) => !r.is_current);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <Suspense fallback={null}>
        <KioskReturnBanner />
      </Suspense>

      <header className="border-b-2 border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link href="/intelligence/civic/people" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
            ← People registry
          </Link>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            {person.honorific ? <span className="text-stone-600 mr-2">{person.honorific}</span> : null}
            {person.full_name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {person.primary_role && (
              <span className="text-xs font-mono uppercase tracking-widest text-stone-700 bg-stone-100 border border-stone-300 px-3 py-1 rounded">
                {ROLE_LABEL[person.primary_role] || person.primary_role}
              </span>
            )}
            {person.state_focus && (
              <span className="text-xs font-mono uppercase tracking-widest text-stone-700 bg-white border border-stone-300 px-3 py-1 rounded">
                {person.state_focus}
              </span>
            )}
            {person.indigenous && (
              <span className="text-xs font-mono uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-300 px-3 py-1 rounded">
                Indigenous
              </span>
            )}
          </div>
          {person.bio_text && <p className="mt-5 max-w-2xl text-stone-700 leading-relaxed">{person.bio_text}</p>}
          {person.notes && <p className="mt-3 max-w-2xl text-stone-600 text-sm italic">{person.notes}</p>}
        </div>
      </header>

      {currentRoles.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-4">Current roles ({currentRoles.length})</p>
          <ul className="space-y-3">
            {currentRoles.map((r: any) => (
              <li key={r.id} className="border-2 border-stone-200 bg-white rounded p-4">
                <div className="flex items-baseline flex-wrap gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-stone-700 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded">
                    {ROLE_LABEL[r.role_type] || r.role_type}
                  </span>
                  {r.party && <span className="text-xs font-mono text-stone-500">{r.party}</span>}
                  {r.jurisdiction && <span className="text-xs font-mono text-stone-500">{r.jurisdiction}</span>}
                  {r.start_year && <span className="text-xs font-mono text-stone-500">since {r.start_year}</span>}
                </div>
                {r.role_title && <p className="text-base font-semibold text-stone-900">{r.role_title}</p>}
                {r.org && (
                  <Link href={`/sites/${r.org.slug}`} className="text-sm text-stone-700 hover:text-stone-900 underline">
                    → {r.org.name} {r.org.acco_certified && <span className="text-purple-700 ml-1">· ACCO</span>}
                  </Link>
                )}
                {r.body_name && !r.org && <p className="text-sm text-stone-700">→ {r.body_name}</p>}
                {r.notes && <p className="text-xs text-stone-500 mt-1 italic">{r.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {pastRoles.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-10 border-t border-stone-200">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-4">Past roles ({pastRoles.length})</p>
          <ul className="space-y-3">
            {pastRoles.map((r: any) => (
              <li key={r.id} className="border border-stone-200 bg-white/50 rounded p-3 text-sm">
                <span className="font-mono uppercase tracking-widest text-stone-500 text-xs">
                  {ROLE_LABEL[r.role_type] || r.role_type}
                </span>{' '}
                {r.role_title && <span className="font-semibold text-stone-900">{r.role_title}</span>}
                {r.org && <span> · <Link href={`/sites/${r.org.slug}`} className="underline">{r.org.name}</Link></span>}
                {r.start_year && r.end_year && <span className="text-stone-500"> ({r.start_year}–{r.end_year})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hansard.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-10 border-t border-stone-200">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-4">Recent Hansard mentions ({hansard.length})</p>
          <ul className="space-y-2">
            {hansard.map((h: any) => (
              <li key={h.id} className="border-l-4 border-stone-300 pl-4 py-1">
                <p className="text-sm text-stone-900">{h.subject || 'Untitled'}</p>
                <p className="text-xs font-mono text-stone-500">
                  {h.jurisdiction} · {h.sitting_date ? String(h.sitting_date).slice(0, 10) : 'date n/a'}
                  {h.source_url && <> · <a href={h.source_url} target="_blank" rel="noreferrer" className="underline">source</a></>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="max-w-4xl mx-auto px-6 py-10 border-t border-stone-200">
        <p className="text-xs font-mono uppercase tracking-widest text-stone-500">
          Data sourced from Hansard records, ministerial diaries, charter commitments, and JusticeHub research.
        </p>
      </footer>
    </main>
  );
}
