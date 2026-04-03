import { createServiceClient } from '@/lib/supabase/service';
import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';
import { MapPin, ArrowRight, Users, Shield } from 'lucide-react';
import { Metadata } from 'next';
import { STATE_NAMES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Basecamps | ALMA Network | JusticeHub',
  description:
    'The ALMA Network — community organisations in every state coordinating alternative local models for youth justice across Australia.',
};

const ALL_STATES = ['NT', 'QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT'];

export default async function BasecampsPage() {
  const supabase = createServiceClient() as any;

  const { data: basecamps } = await supabase
    .from('organizations')
    .select('id, name, slug, state, description, is_indigenous_org')
    .eq('partner_tier', 'basecamp')
    .order('state');

  // Fetch live metrics per basecamp
  const basecampMetrics: Record<string, { interventions: number; funding: number }> = {};
  for (const bc of basecamps || []) {
    const [intCount, fundSum] = await Promise.all([
      supabase
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true })
        .eq('operating_organization_id', bc.id)
        .neq('verification_status', 'ai_generated'),
      supabase
        .from('justice_funding')
        .select('amount_dollars')
        .eq('alma_organization_id', bc.id),
    ]);
    const totalFunding = (fundSum.data || []).reduce((s: number, r: any) => s + (r.amount_dollars || 0), 0);
    basecampMetrics[bc.id] = { interventions: intCount.count || 0, funding: totalFunding };
  }

  // Fetch hero photos for basecamps
  const basecampIds = (basecamps || []).map((b: any) => b.id);
  const { data: basecampPhotos } = basecampIds.length > 0
    ? await supabase
        .from('partner_photos')
        .select('organization_id, photo_url, thumbnail_url, photo_type')
        .in('organization_id', basecampIds)
        .in('photo_type', ['hero', 'card_thumbnail'])
        .order('photo_type', { ascending: true })
    : { data: [] };

  // Build org→photo map (card_thumbnail preferred over hero)
  const orgPhotoMap: Record<string, string> = {};
  for (const p of basecampPhotos || []) {
    // card_thumbnail takes priority (sorted first), hero is fallback
    if (!orgPhotoMap[p.organization_id] || p.photo_type === 'card_thumbnail') {
      orgPhotoMap[p.organization_id] = p.thumbnail_url || p.photo_url;
    }
  }

  // Get network stats
  const [interventionCount, fundingCount, orgCount] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id', { count: 'exact', head: true })
      .neq('verification_status', 'ai_generated'),
    supabase
      .from('justice_funding')
      .select('id', { count: 'exact', head: true })
      .gt('amount_dollars', 0),
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true }),
  ]);

  const basecampsByState: Record<string, typeof basecamps> = {};
  for (const bc of basecamps || []) {
    if (!basecampsByState[bc.state]) basecampsByState[bc.state] = [];
    basecampsByState[bc.state].push(bc);
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />

      <main className="header-offset">
        {/* Hero */}
        <section className="bg-[#0A0A0A] text-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-12">
            <p
              className="text-sm uppercase tracking-[0.3em] text-white/50 mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ALMA Network
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Basecamps
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mb-8">
              One community organisation in every state, coordinating the
              alternative. Basecamps are the backbone of the ALMA Network —
              connecting local models, telling stories, and fighting for the
              funding that community organisations deserve.
            </p>

            <div className="grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <p
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {basecamps?.length || 0}
                </p>
                <p
                  className="text-xs text-white/50 mt-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Basecamps
                </p>
              </div>
              <div>
                <p
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {(interventionCount.count || 0).toLocaleString()}
                </p>
                <p
                  className="text-xs text-white/50 mt-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  ALMA Models
                </p>
              </div>
              <div>
                <p
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {((orgCount.count || 0) / 1000).toFixed(0)}K+
                </p>
                <p
                  className="text-xs text-white/50 mt-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Organisations Tracked
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Network Grid */}
        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ALL_STATES.map((state) => {
              const stateBasecamps = basecampsByState[state] || [];
              const hasBasecamp = stateBasecamps.length > 0;

              return (
                <div
                  key={state}
                  className={`rounded-xl border p-6 ${
                    hasBasecamp
                      ? 'bg-white border-[#0A0A0A]/20'
                      : 'bg-[#F5F0E8] border-dashed border-[#0A0A0A]/15'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p
                        className="text-xs uppercase tracking-wider text-[#0A0A0A]/40 mb-1"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {state}
                      </p>
                      <h3
                        className="text-lg font-bold"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {STATE_NAMES[state]}
                      </h3>
                    </div>
                    {hasBasecamp ? (
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-[#059669]/10 text-[#059669]">
                        <Shield className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/30">
                        Open
                      </span>
                    )}
                  </div>

                  {hasBasecamp ? (
                    <div className="space-y-3">
                      {stateBasecamps.map((bc: any) => {
                        const photoUrl = orgPhotoMap[bc.id];
                        const metrics = basecampMetrics[bc.id] || { interventions: 0, funding: 0 };
                        return (
                          <Link
                            key={bc.id}
                            href={`/alma/${bc.slug}`}
                            className="block group"
                          >
                            <div className="flex items-center gap-3">
                              {photoUrl ? (
                                <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-[#0A0A0A]/10">
                                  <img
                                    src={photoUrl}
                                    alt={bc.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0A0A0A] text-white">
                                  <Users className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm group-hover:underline">
                                  {bc.name}
                                </p>
                                <p className="text-xs text-[#0A0A0A]/50 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {STATE_NAMES[bc.state]}
                                  {bc.is_indigenous_org && ' · Indigenous-led'}
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-[#0A0A0A]/20 group-hover:text-[#0A0A0A]/60 transition-colors" />
                            </div>
                            {(metrics.interventions > 0 || metrics.funding > 0) && (
                              <div className="flex gap-4 mt-2 ml-[52px]">
                                {metrics.interventions > 0 && (
                                  <p className="text-xs text-[#0A0A0A]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                    {metrics.interventions} programs
                                  </p>
                                )}
                                {metrics.funding > 0 && (
                                  <p className="text-xs text-[#0A0A0A]/40" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                    ${(metrics.funding / 1000000).toFixed(1)}M tracked
                                  </p>
                                )}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-[#0A0A0A]/40 mb-3">
                        No Basecamp yet. Know a community organisation doing the work
                        in {STATE_NAMES[state]}?
                      </p>
                      <Link
                        href="/basecamps/apply"
                        className="text-sm font-semibold text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors"
                      >
                        Nominate a Basecamp <ArrowRight className="inline w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Playbook CTA */}
          <section className="mt-16">
            <Link
              href="/basecamps/playbook"
              className="block bg-[#0A0A0A] text-white rounded-xl p-8 md:p-10 hover:bg-[#0A0A0A]/90 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Basecamp Playbook
                  </p>
                  <h3
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    From 1 to 20. Here&apos;s how.
                  </h3>
                  <p className="text-white/60 max-w-xl">
                    How Mounty Yarns built a youth-led organisation from one person in Mount Druitt.
                    The playbook for replicating the model in your community.
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-white/30 group-hover:text-white/70 transition-colors mt-2" />
              </div>
            </Link>
          </section>

          {/* What is a Basecamp */}
          <section className="mt-16">
            <h2
              className="text-2xl font-bold tracking-tight mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              What is a Basecamp?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <h3 className="font-bold mb-2">Coordinate</h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  One organisation per state that brings together all the
                  community orgs doing the work. Events, connections,
                  shared learning.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <h3 className="font-bold mb-2">Advocate</h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  Armed with real data on where the money goes and what
                  actually works, Basecamps fight for local models to get
                  the funding they deserve.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-6">
                <h3 className="font-bold mb-2">Tell Stories</h3>
                <p className="text-sm text-[#0A0A0A]/60">
                  Real stories from real people. Basecamps capture what&apos;s
                  happening in their communities and make the work visible
                  to the rest of the country.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="mt-16 bg-[#0A0A0A] text-white rounded-xl p-8 md:p-12">
            <div className="max-w-2xl">
              <h2
                className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Join the Network
              </h2>
              <p className="text-white/70 mb-6">
                Whether you&apos;re a community organisation doing the work, a
                young person who wants to be heard, or someone who believes
                the system needs to change — there&apos;s a place for you.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0A0A] font-semibold rounded-lg hover:bg-white/90 transition-colors text-sm"
                >
                  Join the Network
                </Link>
                <Link
                  href="/contained"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  See CONTAINED
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
