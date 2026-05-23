/**
 * /admin/kiosk/status — pre-exhibition health-check.
 *
 * Surfaces:
 *   - Hook entries: which orgs are referenced, do they have hero_photo_url, when was each uploaded
 *   - Lens-grid live counts that the kiosk will display
 *   - Last 20 control signals (reset/reload/note)
 *   - Last 20 email subscribers (kiosk source)
 *   - Storage health: hero photo bucket
 *   - Quick-test links to every kiosk surface
 *
 * Admin auth via profiles.role='admin' (dev bypass on localhost).
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { HOOK_ENTRIES } from '@/app/kiosk/lib/hook-content';

export const dynamic = 'force-dynamic';

async function getStatus() {
  const supabase = createServiceClient() as any;
  const slugs = HOOK_ENTRIES.map((e) => e.slug).filter((s): s is string => Boolean(s));

  const [heroOrgs, signals, subscribers, tri, total, accos, tier1, stories, programs] = await Promise.all([
    slugs.length > 0
      ? supabase.from('organizations').select('slug, name, hero_photo_url').in('slug', slugs)
      : Promise.resolve({ data: [] }),
    supabase
      .from('kiosk_control_signals')
      .select('signal_type, payload, sent_at, sent_by')
      .order('sent_at', { ascending: false })
      .limit(20),
    supabase
      .from('whats_new_subscribers')
      .select('email, source, subscribed_at')
      .eq('source', 'kiosk')
      .order('subscribed_at', { ascending: false })
      .limit(20),
    supabase
      .from('v_claim_evidence_summary')
      .select('claim_id', { count: 'exact', head: true })
      .eq('triangulation_tier', 'triangulated'),
    supabase.from('v_claim_evidence_summary').select('claim_id', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('acco_certified', true)
      .eq('is_active', true),
    supabase
      .from('civic_org_classifications')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 1)
      .not('confirmed_at', 'is', null),
    supabase
      .from('alma_stories')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('story_type', 'community_voice'),
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated')
      .eq('serves_youth_justice', true),
  ]);

  const heroBySlug = new Map<string, { name: string; url: string | null }>(
    (heroOrgs.data || []).map((o: any) => [o.slug, { name: o.name, url: o.hero_photo_url }])
  );

  return {
    hookEntries: HOOK_ENTRIES.map((e) => ({
      ...e,
      registeredOrg: e.slug ? heroBySlug.get(e.slug) : undefined,
    })),
    signals: signals.data || [],
    subscribers: subscribers.data || [],
    counts: {
      triangulated: tri.count || 0,
      totalClaims: total.count || 0,
      accos: accos.count || 0,
      tier1: tier1.count || 0,
      stories: stories.count || 0,
      programs: programs.count || 0,
    },
  };
}

export default async function KioskStatusPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login?redirect=/admin/kiosk/status');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') redirect('/');
  }

  const { hookEntries, signals, subscribers, counts } = await getStatus();
  const heroesReady = hookEntries.filter((e) => e.slug && e.registeredOrg?.url).length;
  const heroesTotal = hookEntries.filter((e) => e.slug).length;
  const pinConfigured = Boolean(process.env.KIOSK_CONTROL_PIN);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/admin" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
          ← Admin
        </Link>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Kiosk status</h1>
        <p className="mt-2 text-stone-700">Pre-exhibition health check for the Adelaide kiosk.</p>

        {/* Headline live counts */}
        <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBox label="Triangulated" value={counts.triangulated} accent="emerald" />
          <StatBox label="Sourced facts" value={counts.totalClaims} accent="stone" />
          <StatBox label="Tier 1 orgs" value={counts.tier1} accent="rose" />
          <StatBox label="ACCOs" value={counts.accos} accent="purple" />
          <StatBox label="Stories" value={counts.stories} accent="amber" />
          <StatBox label="Programs" value={counts.programs} accent="stone" />
        </section>

        {/* Readiness checklist */}
        <section className="mt-10">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">Readiness checks</p>
          <ul className="space-y-2 text-sm">
            <CheckRow ok={heroesReady === heroesTotal} label={`Hero photos: ${heroesReady} of ${heroesTotal} uploaded`} link="/admin/kiosk/heroes" />
            <CheckRow ok={pinConfigured} label={`KIOSK_CONTROL_PIN env var ${pinConfigured ? 'set' : 'not set — remote control disabled'}`} />
            <CheckRow ok={counts.triangulated >= 50} label={`At least 50 triangulated claims (have ${counts.triangulated})`} />
            <CheckRow ok={counts.tier1 > 0} label={`At least 1 confirmed Tier 1 org (have ${counts.tier1})`} />
            <CheckRow ok={counts.stories > 0} label={`At least 1 community-voice story (have ${counts.stories})`} />
          </ul>
        </section>

        {/* Hook entries */}
        <section className="mt-10">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">Hook rotation ({hookEntries.length} entries)</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hookEntries.map((e, i) => {
              const hasPhoto = Boolean(e.registeredOrg?.url) || Boolean(e.image);
              return (
                <li key={i} className="border-2 border-stone-200 bg-white rounded p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 shrink-0 bg-stone-100 border border-stone-200 rounded overflow-hidden">
                      {(e.registeredOrg?.url || e.image) && (
                        <img src={e.registeredOrg?.url || e.image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{e.name}</p>
                      <p className="text-xs text-stone-600">{e.org} · {e.place}</p>
                      <p className={`mt-1 text-[10px] font-mono uppercase tracking-widest ${hasPhoto ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {e.kind === 'number' ? 'Big-number entry' : e.kind === 'live_counts' ? 'Live-counts entry' : hasPhoto ? 'Photo ready' : 'No photo'}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Signals + subscribers */}
        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-stone-500">Last control signals</p>
              <Link href="/admin/kiosk/control" className="text-xs font-mono uppercase tracking-widest text-stone-700 hover:text-stone-900 underline">Open control →</Link>
            </div>
            {signals.length === 0 ? (
              <p className="text-stone-500 italic text-sm">None yet.</p>
            ) : (
              <ul className="space-y-1 text-sm border border-stone-200 rounded bg-white max-h-96 overflow-y-auto">
                {signals.map((s: any, i: number) => (
                  <li key={i} className="px-3 py-2 border-b border-stone-100 last:border-b-0 flex justify-between items-baseline">
                    <span className="font-mono uppercase tracking-widest text-stone-700">{s.signal_type}</span>
                    <span className="text-xs text-stone-500">{new Date(s.sent_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">Last kiosk subscribers</p>
            {subscribers.length === 0 ? (
              <p className="text-stone-500 italic text-sm">None yet.</p>
            ) : (
              <ul className="space-y-1 text-sm border border-stone-200 rounded bg-white max-h-96 overflow-y-auto">
                {subscribers.map((s: any, i: number) => (
                  <li key={i} className="px-3 py-2 border-b border-stone-100 last:border-b-0 flex justify-between items-baseline gap-3">
                    <span className="truncate">{s.email}</span>
                    <span className="text-xs text-stone-500 shrink-0">{new Date(s.subscribed_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Smoke test links */}
        <section className="mt-10">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mb-3">Smoke-test the kiosk</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <SmokeLink href="/kiosk" label="Hook" />
            <SmokeLink href="/kiosk/lenses" label="Lens grid" />
            <SmokeLink href="/kiosk/lenses/orgs" label="Orgs" />
            <SmokeLink href="/kiosk/lenses/spending" label="Spending" />
            <SmokeLink href="/kiosk/lenses/places" label="Places" />
            <SmokeLink href="/kiosk/lenses/stories" label="Stories" />
            <SmokeLink href="/kiosk/lenses/what-works" label="What works" />
            <SmokeLink href="/kiosk/card" label="Card (A6 print)" />
            <SmokeLink href="/admin/kiosk/heroes" label="Hero photos admin" />
          </ul>
        </section>
      </div>
    </main>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number; accent: 'emerald' | 'stone' | 'rose' | 'purple' | 'amber' }) {
  const cls: Record<string, string> = {
    emerald: 'border-emerald-300 bg-emerald-50',
    stone: 'border-stone-300 bg-white',
    rose: 'border-rose-300 bg-rose-50',
    purple: 'border-purple-300 bg-purple-50',
    amber: 'border-amber-300 bg-amber-50',
  };
  return (
    <div className={`border-2 rounded p-3 ${cls[accent]}`}>
      <p className="text-2xl sm:text-3xl font-bold text-stone-900">{value.toLocaleString()}</p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-stone-600 mt-0.5">{label}</p>
    </div>
  );
}

function CheckRow({ ok, label, link }: { ok: boolean; label: string; link?: string }) {
  return (
    <li className="flex items-center gap-3 border border-stone-200 bg-white px-4 py-3 rounded">
      <span className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-sm ${ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
        {ok ? '✓' : '!'}
      </span>
      <span className="flex-1 text-stone-800">{label}</span>
      {link && (
        <Link href={link} className="text-xs font-mono uppercase tracking-widest text-stone-700 hover:text-stone-900 underline">
          fix →
        </Link>
      )}
    </li>
  );
}

function SmokeLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener"
      className="block border border-stone-300 bg-white hover:border-stone-900 px-3 py-2 rounded font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900"
    >
      {label} →
    </Link>
  );
}
