import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { DollarSign, Globe, MapPin, ArrowRight, ExternalLink, Search } from 'lucide-react';
import { Metadata } from 'next';

import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Funders | JusticeHub',
  description:
    'Who funds youth justice in Australia? Foundation profiles, giving amounts, focus areas, and geographic reach — transparency for community organisations.',
};

const FOCUS_LABELS: Record<string, string> = {
  'justice-reinvestment': 'Justice Reinvestment',
  'indigenous': 'Indigenous',
  'youth': 'Youth',
  'education': 'Education',
  'community': 'Community',
  'health': 'Health',
  'employment': 'Employment',
  'housing': 'Housing',
  'systems-change': 'Systems Change',
  'criminal-justice': 'Criminal Justice',
  'place-based': 'Place-Based',
  'early-childhood': 'Early Childhood',
  'arts': 'Arts',
  'research': 'Research',
  'environment': 'Environment',
  'modern-slavery': 'Modern Slavery',
  'gender-equality': 'Gender Equality',
  'emergency': 'Emergency',
  'rural_remote': 'Rural & Remote',
  'human_rights': 'Human Rights',
};

const GEO_LABELS: Record<string, string> = {
  'AU-National': 'National',
  'AU-NSW': 'NSW', 'AU-VIC': 'VIC', 'AU-QLD': 'QLD', 'AU-WA': 'WA',
  'AU-SA': 'SA', 'AU-TAS': 'TAS', 'AU-NT': 'NT', 'AU-ACT': 'ACT',
  'International': 'International',
};

export default async function FundersPage() {
  const supabase = createServiceClient() as any;

  // Get foundations relevant to youth justice
  const { data: foundations } = await supabase
    .from('foundations')
    .select('id, name, type, website, description, total_giving_annual, avg_grant_size, grant_range_min, grant_range_max, thematic_focus, geographic_focus, target_recipients')
    .order('total_giving_annual', { ascending: false, nullsFirst: false })
    .limit(200);

  // Filter to those with youth/justice/indigenous focus
  const relevantFoundations = (foundations || []).filter((f: any) => {
    const focus = (f.thematic_focus || []).join(',').toLowerCase();
    return focus.includes('youth') || focus.includes('justice') || focus.includes('indigenous') ||
           focus.includes('community') || focus.includes('criminal') || focus.includes('place-based');
  });

  // Split into tiers
  const majorFunders = relevantFoundations.filter((f: any) => f.total_giving_annual && Number(f.total_giving_annual) >= 50_000_000);
  const midFunders = relevantFoundations.filter((f: any) => f.total_giving_annual && Number(f.total_giving_annual) >= 1_000_000 && Number(f.total_giving_annual) < 50_000_000);
  const otherFunders = relevantFoundations.filter((f: any) => !f.total_giving_annual || Number(f.total_giving_annual) < 1_000_000);

  const totalGiving = relevantFoundations.reduce((s: number, f: any) => s + (Number(f.total_giving_annual) || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Funder Intelligence
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Who Funds Youth Justice?
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-8">
              {relevantFoundations.length} foundations with youth, justice, or Indigenous
              focus. {fmt(totalGiving)} in combined annual giving. Know who funds what —
              so community organisations can find the right partners.
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-md">
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{majorFunders.length}</p>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Major ($50M+)</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{midFunders.length}</p>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Mid ($1-50M)</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{otherFunders.length}</p>
                <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Emerging</p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 space-y-16">
          {/* Major Funders */}
          {majorFunders.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Major Funders ($50M+ annual)
              </h2>
              <div className="space-y-4">
                {majorFunders.map((f: any) => (
                  <FunderCard key={f.id} funder={f} />
                ))}
              </div>
            </section>
          )}

          {/* Mid Funders */}
          {midFunders.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Mid-Tier Funders ($1M–$50M annual)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {midFunders.map((f: any) => (
                  <FunderCardCompact key={f.id} funder={f} />
                ))}
              </div>
            </section>
          )}

          {/* Others */}
          {otherFunders.length > 0 && (
            <section>
              <h2 className="text-xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Emerging & Specialist Funders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {otherFunders.slice(0, 30).map((f: any) => (
                  <div key={f.id} className="bg-white rounded-lg border border-[#0A0A0A]/10 p-4">
                    <p className="font-semibold text-sm truncate">{f.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(f.thematic_focus || []).slice(0, 3).map((t: string) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/50">
                          {FOCUS_LABELS[t] || t}
                        </span>
                      ))}
                    </div>
                    {f.website && (
                      <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#059669] hover:underline mt-2 flex items-center gap-1">
                        Website <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="bg-[#0A0A0A] text-white rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Get matched to funders
            </h2>
            <p className="text-sm text-white/60 mb-4">
              Join the ALMA Network and we&apos;ll match your organisation to
              funders based on your work, location, and focus areas.
            </p>
            <Link href="/join" className="px-4 py-2 bg-white text-[#0A0A0A] font-semibold rounded-lg text-sm hover:bg-white/90">
              Join the Network
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FunderCard({ funder: f }: { funder: any }) {
  const focus = (f.thematic_focus || []) as string[];
  const geo = (f.geographic_focus || []) as string[];
  const isRelevant = focus.some((t: string) => ['youth', 'justice-reinvestment', 'criminal-justice', 'indigenous', 'place-based'].includes(t));

  return (
    <div className={`bg-white rounded-xl border p-6 ${isRelevant ? 'border-[#059669]/30' : 'border-[#0A0A0A]/10'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-bold text-lg">{f.name}</h3>
          <p className="text-xs text-[#0A0A0A]/50 capitalize">{(f.type || '').replace(/_/g, ' ')}</p>
        </div>
        <div className="text-right shrink-0">
          {f.total_giving_annual && (
            <p className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {fmt(Number(f.total_giving_annual))}
            </p>
          )}
          <p className="text-xs text-[#0A0A0A]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>annual giving</p>
        </div>
      </div>

      {f.description && (
        <p className="text-sm text-[#0A0A0A]/60 mb-3 line-clamp-2">{f.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {focus.map((t: string) => (
          <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            ['youth', 'justice-reinvestment', 'criminal-justice', 'indigenous', 'place-based'].includes(t)
              ? 'bg-[#059669]/10 text-[#059669]'
              : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/50'
          }`}>
            {FOCUS_LABELS[t] || t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {geo.map((g: string) => (
            <span key={g} className="text-xs px-1.5 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/40">
              {GEO_LABELS[g] || g}
            </span>
          ))}
        </div>
        {f.website && (
          <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#059669] hover:underline flex items-center gap-1">
            Website <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function FunderCardCompact({ funder: f }: { funder: any }) {
  const focus = (f.thematic_focus || []) as string[];

  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-sm">{f.name}</h3>
        {f.total_giving_annual && (
          <span className="text-sm font-bold shrink-0" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmt(Number(f.total_giving_annual))}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {focus.slice(0, 4).map((t: string) => (
          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-[#0A0A0A]/5 text-[#0A0A0A]/50">
            {FOCUS_LABELS[t] || t}
          </span>
        ))}
      </div>
      {f.website && (
        <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#059669] hover:underline flex items-center gap-1">
          Website <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
