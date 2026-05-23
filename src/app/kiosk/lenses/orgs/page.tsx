/**
 * /kiosk/lenses/orgs — ORGS lens.
 *
 * Soft Adelaide highlight: SA Tier 1 orgs surface first, then NT (highest
 * Indigenous-led share), then QLD, then the rest. Each card is a named org
 * with state, ACCO badge, and a tap-to-drill into /sites/[slug].
 *
 * Source: confirmed Tier 1 from civic_org_classifications joined to organizations.
 */

import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { LensBar } from '../../components/LensBar';

export const revalidate = 600;

interface TierOneOrg {
  id: string;
  name: string;
  slug: string | null;
  state: string | null;
  acco_certified: boolean | null;
  is_indigenous_org: boolean | null;
}

async function getTier1Orgs(): Promise<TierOneOrg[]> {
  const supabase = createServiceClient() as any;
  // Fetch all confirmed Tier 1 classifications
  const { data: classRows } = await supabase
    .from('civic_org_classifications')
    .select('organization_id')
    .eq('tier', 1)
    .not('confirmed_at', 'is', null);
  const ids = (classRows || []).map((c: any) => c.organization_id);
  if (ids.length === 0) return [];

  const out: TierOneOrg[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data } = await supabase
      .from('organizations')
      .select('id, name, slug, state, acco_certified, is_indigenous_org')
      .eq('is_active', true)
      .in('id', chunk);
    if (data) out.push(...data);
  }
  return out;
}

const STATE_RANK: Record<string, number> = { SA: 0, NT: 1, QLD: 2, WA: 3, NSW: 4, VIC: 5, TAS: 6, ACT: 7 };

export default async function OrgsLensPage() {
  const orgs = await getTier1Orgs();
  orgs.sort((a, b) => {
    const ar = a.state ? STATE_RANK[a.state] ?? 99 : 99;
    const br = b.state ? STATE_RANK[b.state] ?? 99 : 99;
    if (ar !== br) return ar - br;
    return (a.name || '').localeCompare(b.name || '');
  });

  const saOrgs = orgs.filter((o) => o.state === 'SA');
  const restOrgs = orgs.filter((o) => o.state !== 'SA');
  const accoCount = orgs.filter((o) => o.acco_certified).length;

  return (
    <>
      <LensBar current="orgs" />
      <div className="flex-1 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-2">
            {orgs.length} confirmed Tier 1 frontline YJ organisations · {accoCount} ACCO-certified
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">The orgs, named.</h1>
          <p className="text-base sm:text-lg text-stone-700 max-w-2xl mb-8">
            Every organisation here is confirmed delivering frontline youth-justice work, registered with their ABN, sourced.
          </p>

          {saOrgs.length > 0 && (
            <>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-3">South Australia · your state</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
                {saOrgs.map((o) => (
                  <OrgCard key={o.id} org={o} highlight />
                ))}
              </ul>
            </>
          )}

          <p className="text-xs font-mono uppercase tracking-[0.3em] text-stone-500 mb-3">Across Australia</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {restOrgs.map((o) => (
              <OrgCard key={o.id} org={o} />
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function OrgCard({ org, highlight }: { org: TierOneOrg; highlight?: boolean }) {
  const border = highlight ? 'border-emerald-400' : 'border-stone-300';
  return (
    <li>
      <Link
        href={org.slug ? `/sites/${org.slug}` : '#'}
        className={`block border-2 ${border} bg-white hover:border-stone-900 p-5 rounded transition-colors min-h-[120px]`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">{org.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {org.state && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded">
              {org.state}
            </span>
          )}
          {org.acco_certified && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-300 px-2 py-0.5 rounded">
              ACCO
            </span>
          )}
          {!org.acco_certified && org.is_indigenous_org && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
              Indigenous-led
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
