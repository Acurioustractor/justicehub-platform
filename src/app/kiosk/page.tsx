/**
 * /kiosk — the cold-start hook screen.
 *
 * One face, one quote, one place. Tap anywhere to enter the lens grid.
 * Rotates through hook entries every 10s for the attract loop.
 *
 * Photo URLs are merged in live from organizations.hero_photo_url so the
 * /admin/kiosk/heroes uploader can change them without a redeploy. Static
 * config (quote, place, state) stays in hook-content.ts.
 */

import { createServiceClient } from '@/lib/supabase/service-lite';
import { HookRotator } from './components/HookRotator';
import { HOOK_ENTRIES, type HookEntry } from './lib/hook-content';

export const revalidate = 60;

async function getMergedEntries(): Promise<HookEntry[]> {
  const supabase = createServiceClient() as any;
  const slugs = HOOK_ENTRIES.map((e) => e.slug).filter((s): s is string => Boolean(s));

  const [heroRes, triRes, totalRes, accoRes, tier1Res] = await Promise.all([
    slugs.length > 0
      ? supabase.from('organizations').select('slug, hero_photo_url').in('slug', slugs)
      : Promise.resolve({ data: [] }),
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
  ]);

  const heroBySlug = new Map<string, string>();
  for (const r of heroRes.data || []) {
    if (r.hero_photo_url) heroBySlug.set(r.slug, r.hero_photo_url);
  }
  const liveCounts = {
    triangulated: triRes.count || 0,
    totalClaims: totalRes.count || 0,
    accos: accoRes.count || 0,
    tier1: tier1Res.count || 0,
  };

  return HOOK_ENTRIES.map((e) => {
    if (e.kind === 'live_counts') return { ...e, liveCounts };
    if (!e.slug) return e;
    const fromDb = heroBySlug.get(e.slug);
    return fromDb ? { ...e, image: fromDb } : e;
  });
}

export default async function KioskHookPage() {
  const entries = await getMergedEntries();
  return <HookRotator entries={entries} />;
}
