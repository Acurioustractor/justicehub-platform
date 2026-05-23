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
  const slugs = HOOK_ENTRIES.map((e) => e.slug).filter((s): s is string => Boolean(s));
  if (slugs.length === 0) return HOOK_ENTRIES;
  const supabase = createServiceClient() as any;
  const { data } = await supabase
    .from('organizations')
    .select('slug, hero_photo_url')
    .in('slug', slugs);
  const heroBySlug = new Map<string, string>();
  for (const r of data || []) {
    if (r.hero_photo_url) heroBySlug.set(r.slug, r.hero_photo_url);
  }
  return HOOK_ENTRIES.map((e) => {
    if (!e.slug) return e;
    const fromDb = heroBySlug.get(e.slug);
    return fromDb ? { ...e, image: fromDb } : e;
  });
}

export default async function KioskHookPage() {
  const entries = await getMergedEntries();
  return <HookRotator entries={entries} />;
}
