import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';

import { LOCALES, getLocale } from '@/lib/civic-intelligence/locales';
import { getAllClaims } from '@/lib/civic-intelligence/queries';
import { SnapshotStatCard } from '@/components/intelligence/civic/SnapshotStatCard';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return LOCALES.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = getLocale(slug);
  if (!locale) return { title: 'Locale not found' };
  return {
    title: `${locale.displayName} · Civic Intelligence | JusticeHub`,
    description: `${locale.displayName}: the Tier 1 frontline orgs, the funding picture, the local detention reality.`,
  };
}

interface LocaleOrg {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  is_indigenous_org: boolean;
}

async function fetchLocaleOrgs(cityKeywords: string[]): Promise<LocaleOrg[]> {
  const supabase = createServiceClient() as any;
  // Use case-insensitive ANY match across the keyword set
  const orFilter = cityKeywords.map((k) => `city.ilike.${k}`).join(',');
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug, city, is_indigenous_org, civic_org_classifications!inner(tier, confirmed_at)')
    .or(orFilter)
    .neq('archived', true)
    .eq('civic_org_classifications.tier', 1)
    .not('civic_org_classifications.confirmed_at', 'is', null);
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    is_indigenous_org: !!row.is_indigenous_org,
  }));
}

async function fetchDetentionCentre(centreSlug: string | undefined) {
  if (!centreSlug) return null;
  const supabase = createServiceClient() as any;
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug, city, acnc_data')
    .eq('slug', centreSlug)
    .limit(1);
  if (!data || data.length === 0) return null;
  const row = data[0];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    capacity: Number(row.acnc_data?.detention_meta?.capacity_beds || 0),
    security: row.acnc_data?.detention_meta?.security_level || null,
  };
}

export default async function LocalePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = getLocale(slug);
  if (!locale) notFound();

  const [claims, orgs, detentionCentre] = await Promise.all([
    getAllClaims(),
    fetchLocaleOrgs(locale.cityKeywords),
    fetchDetentionCentre(locale.detentionCentreSlug),
  ]);

  const stateCode = locale.state.toLowerCase();
  const stateTier1Count = claims[`access.count.tier_1_orgs.${stateCode}`];
  const stateIndigShare = claims[`access.indigenous_share.${stateCode}`];
  const stateDetentionCost = claims[`access.cost.detention_per_youth.annual.${stateCode}`];
  const stateCommunityCost = claims[`access.cost.community_per_youth.annual.${stateCode}`];
  const stateRatio = claims[`access.ratio.detention_vs_community_cost.${stateCode}`];
  const stateRecid = claims[`oversight.rate.return_to_supervision.${stateCode}`];

  const indigenousOrgsCount = orgs.filter((o) => o.is_indigenous_org).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm flex-wrap">
          <Link href="/" className="font-mono uppercase tracking-widest text-xs text-stone-700 hover:text-stone-900">JusticeHub</Link>
          <Link href="/intelligence/civic" className="text-stone-600 hover:text-stone-900 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Civic Intelligence
          </Link>
          <Link href="/intelligence/civic/locale" className="text-stone-600 hover:text-stone-900">Locales</Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-900 font-medium">{locale.displayName}</span>
        </div>
      </nav>

      <section className="bg-stone-900 text-stone-50 px-6 py-20 border-b border-stone-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
            <MapPin className="w-3 h-3" /> {locale.state} · Locale v1
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">{locale.displayName}</h1>
          <p className="mt-5 max-w-2xl text-lg md:text-xl text-stone-300">{locale.description}</p>
        </div>
      </section>

      {/* Tier 1 universe here */}
      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-3">
            Confirmed Tier 1 here
          </h2>
          <p className="text-stone-700 mb-8 max-w-2xl">
            {orgs.length} confirmed Tier 1 frontline youth justice organisation{orgs.length === 1 ? '' : 's'} in {locale.displayName}.
            {indigenousOrgsCount > 0 && ` ${indigenousOrgsCount} ${indigenousOrgsCount === 1 ? 'is' : 'are'} Indigenous-led.`}
          </p>
          {orgs.length === 0 ? (
            <p className="text-stone-600 italic">
              No confirmed Tier 1 organisations matched this locale yet. Either the orgs in this place sit in the
              curation queue, or the locale name uses a variant the city field doesn&apos;t capture. Worth a manual review.
            </p>
          ) : (
            <ul className="space-y-2">
              {orgs.map((o) => (
                <li key={o.id} className="border border-stone-200 bg-white rounded-md p-4 flex items-baseline justify-between gap-3 flex-wrap">
                  <div>
                    <Link href={`/sites/${o.slug}`} className="text-lg font-medium text-stone-900 hover:underline">
                      {o.name}
                    </Link>
                    {o.city && <span className="ml-3 text-sm text-stone-500">{o.city}</span>}
                  </div>
                  {o.is_indigenous_org && (
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                      Indigenous-led
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* State context */}
      <section className="px-6 py-16 border-b border-stone-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-3">
            The state context
          </h2>
          <p className="text-stone-700 mb-8 max-w-2xl">
            {locale.displayName} sits inside {locale.state}&apos;s youth justice system. Here&apos;s what that system
            costs and what it produces — pulled live from the Productivity Commission Report on Government Services.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stateRatio && <SnapshotStatCard claim={stateRatio} accent="urgent" />}
            {stateRecid && (
              <SnapshotStatCard
                claim={stateRecid}
                displayValue={
                  stateRecid.value_numeric != null
                    ? `${(Number(stateRecid.value_numeric) * 100).toFixed(1)}%`
                    : 'n/a'
                }
              />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {stateDetentionCost && <SnapshotStatCard claim={stateDetentionCost} accent="urgent" size="sm" />}
            {stateCommunityCost && <SnapshotStatCard claim={stateCommunityCost} accent="positive" size="sm" />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {stateTier1Count && <SnapshotStatCard claim={stateTier1Count} size="sm" />}
            {stateIndigShare && (
              <SnapshotStatCard
                claim={stateIndigShare}
                displayValue={
                  stateIndigShare.value_numeric != null
                    ? `${Math.round(Number(stateIndigShare.value_numeric) * 100)}%`
                    : 'n/a'
                }
                size="sm"
              />
            )}
          </div>
        </div>
      </section>

      {/* Nearest detention */}
      {detentionCentre && (
        <section className="px-6 py-16 border-b border-stone-200">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-3">
              The detention centre that serves this place
            </h2>
            <div className="border-2 border-rose-300 bg-rose-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-stone-900 mb-1">{detentionCentre.name}</h3>
              <p className="text-sm text-stone-700">
                {detentionCentre.city ? `${detentionCentre.city}, ${locale.state}` : locale.state}
                {detentionCentre.security && <span> · {detentionCentre.security} security</span>}
                {detentionCentre.capacity ? <span> · {detentionCentre.capacity} beds</span> : null}
              </p>
              <p className="mt-4 text-sm text-stone-700">
                Every young person held here costs the {locale.state} government the per-youth annual figure above. Most
                are children from communities like this one.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Sources */}
      <section className="px-6 py-12 bg-stone-100">
        <div className="max-w-5xl mx-auto text-sm text-stone-700">
          <p className="font-mono uppercase tracking-widest text-xs text-stone-500 mb-3">Sources</p>
          <ul className="space-y-1.5">
            <li>
              Tier 1 organisations: confirmed against the Tier 1 frontline YJ definition via the curation flow at{' '}
              <Link href="/admin/civic/tier-1-curation" className="underline">/admin/civic/tier-1-curation</Link>.
            </li>
            <li>State-level cost + recidivism: ROGS 2024-25 (detention 17A.20, community 17A.21, returns 17A.26).</li>
            <li>
              Methodology: <Link href="/intelligence/civic/methodology" className="underline">/intelligence/civic/methodology</Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
