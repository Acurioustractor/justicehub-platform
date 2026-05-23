/**
 * /admin/kiosk/heroes
 *
 * Lists every org referenced in the kiosk hook rotator with its current
 * hero photo (if any) and a file picker to upload a new one. Uploads go
 * through /api/admin/kiosk/hero-photo which writes to Supabase Storage
 * and updates organizations.hero_photo_url.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { HOOK_ENTRIES } from '@/app/kiosk/lib/hook-content';
import { HeroPhotoUploader } from './HeroPhotoUploader';

export const dynamic = 'force-dynamic';

interface OrgRow {
  id: string;
  slug: string;
  name: string;
  state: string | null;
  hero_photo_url: string | null;
}

export default async function KioskHeroesAdminPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isDev) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login?redirect=/admin/kiosk/heroes');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') redirect('/');
  }

  // Fetch the live hero_photo_url for each org slug referenced by the hook
  const slugs = HOOK_ENTRIES.map((e) => e.slug).filter((s): s is string => Boolean(s));
  const service = createServiceClient() as any;
  const { data: orgs } = await service
    .from('organizations')
    .select('id, slug, name, state, hero_photo_url')
    .in('slug', slugs);
  const bySlug = new Map<string, OrgRow>((orgs || []).map((o: OrgRow) => [o.slug, o]));

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/admin" className="text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900">
          ← Admin
        </Link>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Kiosk hero photos</h1>
        <p className="mt-2 text-stone-700 max-w-2xl">
          Upload portrait images for each org that appears in the /kiosk hook rotation. JPG / PNG / WebP, max 8MB. Replaces the previous photo for that org.
        </p>
        <p className="mt-2 text-xs font-mono uppercase tracking-widest text-stone-500">
          Photos are stored in the public Supabase media bucket under <span className="text-stone-700">kiosk-heroes/&#123;slug&#125;.&#123;ext&#125;</span> and the URL is saved on <span className="text-stone-700">organizations.hero_photo_url</span>.
        </p>

        <ul className="mt-10 space-y-6">
          {HOOK_ENTRIES.filter((e) => e.slug).map((entry) => {
            const org = bySlug.get(entry.slug!);
            return (
              <li key={entry.slug} className="border-2 border-stone-200 bg-white rounded-lg p-6">
                <div className="flex items-start gap-6">
                  <div className="w-40 h-40 shrink-0 bg-stone-100 border-2 border-stone-200 rounded overflow-hidden">
                    {org?.hero_photo_url ? (
                      <img
                        src={org.hero_photo_url}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : entry.image ? (
                      <img
                        src={entry.image}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-mono">
                        no photo
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-stone-900">{entry.name}</h2>
                    <p className="text-sm text-stone-600">{entry.org} · {entry.place}</p>
                    {org ? (
                      <p className="mt-1 text-xs font-mono uppercase tracking-widest text-stone-500">
                        Org found · /sites/{org.slug}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-mono uppercase tracking-widest text-rose-700">
                        Org not in register · slug "{entry.slug}" not found
                      </p>
                    )}
                    {org?.hero_photo_url && (
                      <p className="mt-1 text-xs text-stone-500 break-all">{org.hero_photo_url}</p>
                    )}
                    <div className="mt-4">
                      <HeroPhotoUploader slug={entry.slug!} hasExisting={Boolean(org?.hero_photo_url)} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-12 border-t-2 border-stone-200 pt-6">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-500">Preview the result at <Link href="/kiosk" className="text-stone-900 underline">/kiosk</Link>.</p>
        </div>
      </div>
    </main>
  );
}
