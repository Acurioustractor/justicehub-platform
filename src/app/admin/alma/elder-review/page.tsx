import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server-lite';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navigation, Footer } from '@/components/ui/navigation';
import { Metadata } from 'next';
import { AlertTriangle, ExternalLink, Heart, Globe, ShieldAlert } from 'lucide-react';
import { STATE_NAMES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Elder Review Queue | Australian Living Map of Alternatives | Admin',
};

// Basecamp coverage. Indigenous-led orgs in states without a basecamp need
// manual handling; orgs in covered states route to the basecamp partner.
const BASECAMP_FOR_STATE: Record<string, { name: string; slug: string }[]> = {
  NT: [{ name: 'Oonchiumpa', slug: 'oonchiumpa' }],
  QLD: [
    { name: 'Palm Island Community Company', slug: 'palm-island-community-company' },
    { name: 'BG Fit', slug: 'bg-fit' },
    { name: 'MMEIC', slug: 'mmeic' },
  ],
};

export default async function ElderReviewPage() {
  // Admin gate
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login?next=/admin/alma/elder-review');
  const { data: profile } = await (supabaseAuth as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/');

  const supabase = createServiceClient() as any;

  // Pull Indigenous-led orgs that have at least one public intervention
  // (the ones currently visible on the Map and most in need of verification).
  const { data: orgs } = await supabase
    .from('organizations')
    .select(
      `
      id, name, slug, state, suburb, city, profile_completeness_score, profile_completeness_breakdown,
      website_url, website
    `
    )
    .eq('is_indigenous_org', true)
    .neq('archived', true)
    .order('profile_completeness_score', { ascending: false, nullsFirst: false })
    .limit(500);

  // Filter to those with public interventions
  const orgIds = (orgs || []).map((o: any) => o.id);
  const { data: interventionRows } = await supabase
    .from('alma_interventions')
    .select('operating_organization_id')
    .neq('verification_status', 'ai_generated')
    .in('operating_organization_id', orgIds);

  const withPublicIntervention = new Set(
    (interventionRows || []).map((r: any) => r.operating_organization_id)
  );

  // Pull existing referrals + claims for context
  const { data: outreachRows } = await supabase
    .from('organization_outreach_log')
    .select('organization_id, attempt_kind, response_status, sent_at')
    .in('organization_id', orgIds)
    .order('sent_at', { ascending: false });

  const lastOutreachByOrg: Record<string, any> = {};
  for (const r of outreachRows || []) {
    if (!lastOutreachByOrg[r.organization_id]) lastOutreachByOrg[r.organization_id] = r;
  }

  const { data: claimRows } = await supabase
    .from('organization_claims')
    .select('organization_id, status')
    .in('organization_id', orgIds);

  const claimStatusByOrg: Record<string, string> = {};
  for (const c of claimRows || []) {
    if (!claimStatusByOrg[c.organization_id] || c.status === 'verified') {
      claimStatusByOrg[c.organization_id] = c.status;
    }
  }

  const queue = (orgs || [])
    .filter((o: any) => withPublicIntervention.has(o.id))
    .map((o: any) => {
      const basecamps = o.state ? BASECAMP_FOR_STATE[o.state] || [] : [];
      return {
        ...o,
        basecamps,
        lastOutreach: lastOutreachByOrg[o.id] || null,
        claimStatus: claimStatusByOrg[o.id] || null,
      };
    });

  const stateGroups = queue.reduce((acc: Record<string, any[]>, o: any) => {
    const s = o.state || '— unknown —';
    if (!acc[s]) acc[s] = [];
    acc[s].push(o);
    return acc;
  }, {});
  const sortedStates = Object.keys(stateGroups).sort();

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <Navigation />
      <main className="header-offset">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
          <p
            className="text-xs uppercase tracking-[0.3em] text-purple-700 mb-3"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Admin · Cultural authority gate
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Elder review queue.
          </h1>
          <p className="text-base text-[#0A0A0A]/70 max-w-3xl mb-6">
            Indigenous-led organisations on the Map awaiting verification. This page is
            visibility only.
          </p>

          {/* Hard rule banner */}
          <div className="bg-purple-50 border-l-4 border-purple-600 rounded-r-xl p-5 mb-10">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-purple-900 mb-2 text-sm">
                  Outreach is initiated by the basecamp for that state, not by JusticeHub admin.
                </p>
                <p className="text-xs text-purple-800/80 leading-relaxed mb-2">
                  The AI enrichment script and the outreach queue both exclude Indigenous-led
                  orgs. They appear here so the team can see what is on the Map, what is missing,
                  and which basecamp partner holds the relationship. Any contact, change to the
                  profile, story request, or evidence link is initiated by the basecamp.
                </p>
                <p className="text-xs text-purple-800/80 leading-relaxed">
                  For orgs in states without a basecamp partner (NSW, VIC, SA, WA, TAS, ACT),
                  no contact is made until the relationship pathway is established. Record manual
                  referrals in <code className="px-1 bg-purple-100 rounded">organization_outreach_log</code> with
                  <code className="px-1 bg-purple-100 rounded ml-1">attempt_kind=&apos;basecamp_referral&apos;</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Top-line stats */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <Stat label="Indigenous-led orgs on the Map" value={queue.length} />
            <Stat
              label="With basecamp coverage"
              value={queue.filter((q: any) => q.basecamps.length > 0).length}
            />
            <Stat
              label="Already claimed"
              value={queue.filter((q: any) => q.claimStatus === 'verified').length}
            />
          </div>

          {/* By state */}
          {sortedStates.map((state) => {
            const orgsInState = stateGroups[state];
            const basecamps = BASECAMP_FOR_STATE[state] || [];
            const fullStateName = STATE_NAMES[state] || state;
            return (
              <section key={state} className="mb-10">
                <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                  <h2
                    className="text-xl font-bold tracking-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {fullStateName}{' '}
                    <span className="text-sm font-normal text-[#0A0A0A]/50">
                      ({orgsInState.length} orgs)
                    </span>
                  </h2>
                  <div className="text-xs text-[#0A0A0A]/60">
                    {basecamps.length > 0 ? (
                      <>
                        Basecamp partner(s):{' '}
                        {basecamps.map((bc, i) => (
                          <span key={bc.slug}>
                            <Link
                              href={`/sites/${bc.slug}`}
                              className="font-semibold text-purple-700 hover:underline"
                            >
                              {bc.name}
                            </Link>
                            {i < basecamps.length - 1 && ', '}
                          </span>
                        ))}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        no basecamp partner — manual handling required
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className="bg-[#0A0A0A] text-white text-[10px] uppercase tracking-[0.15em]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        <th className="text-left px-4 py-3">Organisation</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Location</th>
                        <th className="text-right px-4 py-3">Completeness</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Claim</th>
                        <th className="text-left px-4 py-3 hidden lg:table-cell">Last referral</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A0A0A]/5">
                      {orgsInState.map((o: any) => {
                        const score = o.profile_completeness_score
                          ? Math.round(Number(o.profile_completeness_score) * 100)
                          : null;
                        const tone =
                          score === null
                            ? 'bg-[#0A0A0A]/5 text-[#0A0A0A]/40'
                            : score >= 50
                            ? 'bg-[#059669]/10 text-[#059669]'
                            : score >= 30
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-[#0A0A0A]/5 text-[#0A0A0A]/50';
                        const website = o.website_url || o.website;
                        return (
                          <tr key={o.id} className="hover:bg-[#F5F0E8]/40">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Heart className="w-3 h-3 text-purple-500 shrink-0" />
                                <Link
                                  href={`/sites/${o.slug}`}
                                  className="font-semibold text-sm hover:underline"
                                >
                                  {o.name}
                                </Link>
                                {website && (
                                  <a
                                    href={website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                                    aria-label="Visit website"
                                  >
                                    <Globe className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 hidden md:table-cell text-xs text-[#0A0A0A]/60">
                              {[o.suburb, o.city].filter(Boolean).join(', ') || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {score !== null ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tone}`}
                                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                                >
                                  {score}%
                                </span>
                              ) : (
                                <span className="text-xs text-[#0A0A0A]/30">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 hidden md:table-cell">
                              {o.claimStatus ? (
                                <span
                                  className={`text-[10px] font-semibold ${
                                    o.claimStatus === 'verified'
                                      ? 'text-[#059669]'
                                      : 'text-amber-600'
                                  }`}
                                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                                >
                                  {o.claimStatus}
                                </span>
                              ) : (
                                <span
                                  className="text-[10px] text-[#0A0A0A]/40"
                                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                                >
                                  unclaimed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 hidden lg:table-cell">
                              {o.lastOutreach ? (
                                <span
                                  className="text-[10px] text-[#0A0A0A]/60"
                                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                                >
                                  {o.lastOutreach.attempt_kind} ·{' '}
                                  {new Date(o.lastOutreach.sent_at).toLocaleDateString('en-AU')}
                                </span>
                              ) : (
                                <span
                                  className="text-[10px] text-[#0A0A0A]/30"
                                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                                >
                                  none recorded
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          {queue.length === 0 && (
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-8 text-center">
              <p className="text-sm text-[#0A0A0A]/60">
                No Indigenous-led orgs with public interventions are currently in the queue.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-4">
      <p
        className="text-3xl font-bold"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p
        className="text-xs text-[#0A0A0A]/50 mt-1"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {label}
      </p>
    </div>
  );
}
